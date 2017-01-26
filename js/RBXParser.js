// BTR-RBXParser.js

(function() {
	function toFloat(value) {
		var exp = (value >> 23) & 255

		if(exp === 0)
			return 0;

		var float = Math.pow(2, exp-127) * (1 + (value&0x7FFFFF)/0x7FFFFF)
		return value > 0x7FFFFFFF ? -float : float
	}

	function toDouble(byte0, byte1) {
		var exp = (byte0 >> 20) & 2047
		var frac = (((byte0 & 1048575) * 4294967296) + byte1) / 4503599627370496
		var neg = byte0 & 2147483648

		if(exp === 0) {
			if(frac === 0)
				return -0;

			var double = Math.pow(2, exp-1023) * frac
			return neg ? -double : double
		} else if(exp === 2047) {
			return frac === 0 ? Infinity : NaN
		}

		var double = Math.pow(2, exp-1023) * (1+frac)
		return neg ? -double : double
	}

	var Decoder = new TextDecoder("ascii")
	class ByteReader extends Uint8Array {
		constructor(buffer) {
			super(buffer)

			this.index = 0
		}

		get remaining() { return this.length - this.index }

		Array(n) { var i = this.index; this.index += n; return new Uint8Array(this.buffer, i, n) }
		Match(arr) {
			var i = this.index
			this.index += arr.length
			for(var j=0; j<arr.length; j++) {
				if(arr[j] !== this[i+j])
					return false;
			}
			return true
		}
		Jump(n) { this.index += n }

		Byte() { return this[this.index++] }
		UInt8() { return this[this.index++] }
		UInt16LE() { return this[this.index++] + (this[this.index++] * 256) }
		UInt16BE() { return (this[this.index++] * 256) + this[this.index++] }
		UInt32LE() { return this[this.index++] + (this[this.index++] * 256) + (this[this.index++] * 65536) + (this[this.index++] * 16777216) }
		UInt32BE() { return (this[this.index++] * 16777216) + (this[this.index++] * 65536) + (this[this.index++] * 256) + this[this.index++] }
		FloatLE() { return toFloat(this.UInt32LE()) }
		FloatBE() { return toFloat(this.UInt32BE()) }
		DoubleLE() { var byte = this.UInt32LE(); return toDouble(this.UInt32LE(), byte) } // Little endian is flipped
		DoubleBE() { return toDouble(this.UInt32BE(), this.UInt32BE()) }

		String(n) { var i = this.index; this.index += n; return Decoder.decode(new Uint8Array(this.buffer, i, n)) }
		LZ4() {
			var comLength = this.UInt32LE()
			var decomLength = this.UInt32LE()
			this.Jump(4)

			var start = this.index

			var data = new Uint8Array(decomLength)
			var index = 0

			while(index < decomLength) {
				var token = this.Byte()
				var litLen = token >> 4

				if(litLen === 0xF) {
					do {
						var lenByte = this.Byte()
						litLen += lenByte
					} while(lenByte === 0xFF)
				}

				for(var i=0; i<litLen; i++) {
					data[index++] = this.Byte()
				}

				if(index >= decomLength)
					break;

				var offset = this.UInt16LE()
				var len = token & 0xF

				if(len === 0xF) {
					do {
						var lenByte = this.Byte()
						len += lenByte
					} while(lenByte === 0xFF)
				}

				len += 4
				var begin = index - offset
				for(var i=0; i<len; i++) {
					data[index++] = data[begin + i]
				}
			}

			if(start + comLength !== this.index)
				throw new Error("[ByteReader.LZ4] Invalid LZ4, bad end index")

			return data
		}

		RBXInterleaved32(count, fn) {
			var result = new Array(count)
			var byteCount = count * 4

			for(var i=0; i<count; i++) {
				var value = (this[this.index + i] << 24) 
					+ (this[this.index + (i + count) % byteCount] << 16)
					+ (this[this.index + (i + count*2) % byteCount] << 8)
					+ this[this.index + (i + count*3) % byteCount]

				result[i] = fn ? fn(value) : value
			}

			this.Jump(byteCount)
			return result
		}
	}

	function fakeFunction(name) { return  }

	function RBXInstance(className) {
		if(this.constructor === RBXInstance)
			throw new Error("RBXInstance is an abstract class and can not be used as a constructor");

		if(!(this instanceof RBXInstance)) {
			if(!RBXInstance[className]) {
				var con = RBXInstance[className] = eval("(function " + className + "() {})")
				con.prototype.__proto__ = RBXInstance.prototype
			}

			var item = new RBXInstance[className]()
			RBXInstance.call(item, className)
			return item
		}

		Object.defineProperty(this, "Children", { value: [], enumerable: true, writable: false })
		Object.defineProperty(this, "Properties", { value: [], enumerable: false, writable: false })
		this.setProperty("ClassName", className)
		this.setProperty("Parent", null)
	}

	Object.assign(RBXInstance.prototype, {
		_removeChild: function(child) {
			var index = this.Children.indexOf(child)
			this.Children.splice(index, 1)
		},
		_addChild: function(child) {
			this.Children.push(child)
		},
		setParent: function(newparent) {
			if(this.Parent) {
				this.Parent._removeChild(this)
			}
			this.Parent = newparent
			if(this.Parent) {
				this.Parent._addChild(this)
			}
		},
		setProperty: function(name, value) {
			if(this.Properties.indexOf(name) === -1) {
				this.Properties.push(name)
			}

			this[name] = value
		}
	})

	function RBXProperty(type, value) {
		if(this instanceof RBXProperty)
			throw new Error("RBXProperty can not be constructed");

		if(!(value instanceof Array))
			throw new Error("value not an array?");

		var con = RBXProperty[type]
		if(!RBXProperty[type]) {
			con = RBXProperty[type] = eval("(function " + type + "() {})")
			con.prototype.__proto__ = RBXProperty.prototype
		}

		value.type = type
		value.__proto__ = con.prototype
		return value
	}

	RBXProperty.prototype.__proto__ = Array.prototype

	function RBXEnum(value) {
		if(this instanceof RBXEnum)
			throw new Error("RBXEnum can not be constructed");

		if(typeof(value) !== "number")
			throw new Error("value not a number?");

		value = new Number(value)
		value.__proto__ = RBXEnum.prototype
		return value
	}

	RBXEnum.prototype.__proto__ = Number.prototype


	typeof ANTI=="undefined" && (ANTI={}), ANTI.RBXParseContentUrl = function parseContentUrl(url) {
		url = url.trim()

		var match = url.match(/^rbxassetid:\/\/(\d+)/)
		if(match)
			return +match[1];

		match = url.match(/https?:\/\/(?:assetgame\.|www\.|)roblox.com\/asset\/?\?id=(\d+)/)
		if(match)
			return +match[1];

		console.log("Couldn't parse content url " + url)
		return null
	};

	typeof ANTI=="undefined" && (ANTI={}), ANTI.RBXInstance = RBXInstance;
	typeof ANTI=="undefined" && (ANTI={}), ANTI.RBXProperty = RBXProperty;
	typeof ANTI=="undefined" && (ANTI={}), ANTI.RBXEnum = RBXEnum;

	typeof ANTI=="undefined" && (ANTI={}), ANTI.ParseAnimationData = (function() {
		return function(data) {
			var sequence = data[0]
			if(sequence.ClassName === "Animation") {
				return ANTI.ParseAnimationData(ANTI.ParseRBXM(new TextEncoder().encode(atob(sequence.AnimationId))))
			}
			
			sequence.Children.sort((a,b) => a.Time - b.Time)

			var anim = {
				Length: sequence.Children[sequence.Children.length-1].Time,
				Looped: !!sequence.Loop,
				Limbs: {}
			}

			function parsePose(pose, keyframe) {
				var name = pose.Name.replace(/\s/,"").toLowerCase()
				if(!anim.Limbs[name])
					anim.Limbs[name] = [];

				var cf = pose.CFrame

				anim.Limbs[name].push([
					keyframe.Time,
					[ cf[0], cf[1], cf[2] ],
					[ Math.atan2(-cf[8],cf[11]), Math.asin(cf[5]), Math.atan2(-cf[4],cf[3]) ]
				])

				pose.Children.forEach((childPose) => parsePose(childPose, keyframe))
			}

			sequence.Children.forEach((keyframe) => {
				keyframe.Children.forEach((rootPose) => {
					rootPose.Children.forEach((pose) => parsePose(pose, keyframe))
				})
			})

			return anim
		}
	})();

	typeof ANTI=="undefined" && (ANTI={}), ANTI.ParseRBXM = (function() {
		// http://www.classy-studios.com/Downloads/RobloxFileSpec.pdf
		var ParseRBXBin = (function() {
			var headerBytes = [ 0x3C, 0x72, 0x6F, 0x62, 0x6C, 0x6F, 0x78, 0x21, 0x89, 0xFF, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00 ]
			var footerBytes = [ 0x00, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3C, 0x2F, 0x72, 0x6F, 0x62, 0x6C, 0x6F, 0x78, 0x3E ]
			var shortCFrames = [null,null,[1,0,0,0,1,0,0,0,1],[1,0,0,0,0,-1,0,1,0],null,[1,0,0,0,-1,0,0,0,-1],[1,0,0,0,0,1,0,-1,0],[0,1,0,1,0,0,0,0,-1],null,[0,0,1,1,0,0,0,1,0],[0,-1,0,1,0,0,0,0,1],null,[0,0,-1,1,0,0,0,-1,0],[0,1,0,0,0,1,1,0,0],[0,0,-1,0,1,0,1,0,0],null,[0,-1,0,0,0,-1,1,0,0],[0,0,1,0,-1,0,1,0,0],null,null,[-1,0,0,0,1,0,0,0,-1],[-1,0,0,0,0,1,0,1,0],null,[-1,0,0,0,-1,0,0,0,1],[-1,0,0,0,0,-1,0,-1,0],[0,1,0,-1,0,0,0,0,1],null,[0,0,-1,-1,0,0,0,1,0],[0,-1,0,-1,0,0,0,0,-1],null,[0,0,1,-1,0,0,0,-1,0],[0,1,0,0,0,-1,-1,0,0],[0,0,1,0,1,0,-1,0,0],null,[0,-1,0,0,0,1,-1,0,0],[0,0,-1,0,-1,0,-1,0,0]]

			function toRBXFloat(value) {
				return toFloat((value >> 1) + ((value & 1) * 2147483648))
			}

			function toRBXSigned(value) {
				return value % 2 === 1 ? -(value+1)/2 : value/2
			}

			return function(buffer) {
				var reader = new ByteReader(buffer)

				if(!reader.Match(headerBytes))
					console.warn("[ParseRBXBin] Header bytes did not match");

				var instCount = reader.UInt32LE()
				var objCount = reader.UInt32LE()
				reader.Jump(8)

				var instList = new Array(instCount)
				var objList = new Array(objCount)

				for(var instIndex=0; instIndex<instCount; instIndex++) {
					var blockName = reader.String(4)
					if(blockName != "INST")
						throw new Error("[ParseRBXBin] Expected INST, got '" + blockName + "'");

					var lz4 = reader.LZ4()
					var inst = new ByteReader(lz4)
					var classId = inst.UInt32LE()
					var nameLength = inst.UInt32LE()
					var className = inst.String(nameLength)
					var bonusData = inst.Byte()

					var instData = instList[classId] = {
						ClassName: className,
						Objects: []
					}

					var count = inst.UInt32LE()
					var interleaved = inst.RBXInterleaved32(count, toRBXSigned)
					var objId = 0
					for(var i=0; i<count; i++) {
						objId += interleaved[i]

						instData.Objects.push(objList[objId] = RBXInstance(className))
					}
				}

				while(true) {
					var blockName = reader.String(4)
					if(blockName == "PRNT")
						break;
					else if(blockName != "PROP")
						throw new Error("[ParseRBXBin] Expected PROP, got '" + blockName + "'");

					var prop = new ByteReader(reader.LZ4())
					var instData = instList[prop.UInt32LE()]
					var propName = prop.String(prop.UInt32LE())
					var dataType = prop.Byte()
					var values = []

					switch(dataType) {
						case 0x1: // String
							while(prop.remaining > 0) {
								values.push(prop.String(prop.UInt32LE()))
							}
							break;
						case 0x2: // Boolean
							while(prop.remaining > 0) {
								values.push(prop.Byte() == 0x1)
							}
							break;
						case 0x3: // Int32
							values = prop.RBXInterleaved32(prop.remaining/4, toRBXSigned)
							break;
						case 0x4: // Float
							values = prop.RBXInterleaved32(prop.remaining/4, toRBXFloat)
							break;
						case 0x5: // Double
							while(prop.remaining > 0) {
								values.push(toDouble(prop.UInt32LE(), prop.UInt32LE()))
							}
							break;
						case 0x7: // UDim2
							var count = prop.remaining/16
							var scaleX = prop.RBXInterleaved32(count, toRBXFloat)
							var scaleY = prop.RBXInterleaved32(count, toRBXFloat)
							var offsetX = prop.RBXInterleaved32(count, toRBXSigned)
							var offsetY = prop.RBXInterleaved32(count, toRBXSigned)
							for(var i=0; i<count; i++) {
								values[i] = RBXProperty("UDim2", [
									[ scaleX[i], scaleY[i] ],
									[ offsetX[i], offsetY[i] ]
								])
							}
							break;
						case 0x8: // Ray
							var count = prop.remaining/24
							for(var i=0; i<count; i++) {
								values[i] = RBXProperty("Ray", [
									[ toFloat(prop.UInt32LE()), toFloat(prop.UInt32LE()), toFloat(prop.UInt32LE()) ],
									[ toFloat(prop.UInt32LE()), toFloat(prop.UInt32LE()), toFloat(prop.UInt32LE()) ]
								])
							}
							break;
						case 0xB: // BrickColor
							values = prop.RBXInterleaved32(prop.remaining/4)
							break;
						case 0xC: // Color3
							var count = prop.remaining/12
							var red = prop.RBXInterleaved32(count, toRBXFloat)
							var green = prop.RBXInterleaved32(count, toRBXFloat)
							var blue = prop.RBXInterleaved32(count, toRBXFloat)
							for(var i=0; i<count; i++) {
								values[i] = RBXProperty("Color3", [ red[i], green[i], blue[i] ])
							}
							break;
						case 0xD: // Vector2
							var count = prop.remaining/8
							var vecX = prop.RBXInterleaved32(count, toRBXFloat)
							var vecY = prop.RBXInterleaved32(count, toRBXFloat)
							for(var i=0; i<count; i++) {
								values[i] = RBXProperty("Vector2", [ vecX[i], vecY[i] ])
							}
							break;
						case 0xE: // Vector3
							var count = prop.remaining/12
							var vecX = prop.RBXInterleaved32(count, toRBXFloat)
							var vecY = prop.RBXInterleaved32(count, toRBXFloat)
							var vecZ = prop.RBXInterleaved32(count, toRBXFloat)
							for(var i=0; i<count; i++) {
								values[i] = RBXProperty("Vector3", [ vecX[i], vecY[i], vecZ[i] ])
							}
							break;
						case 0x10: // CFrame
							var count = 0
							while(prop.remaining > count*12) {
								var type = prop.Byte()
								var value = values[count++] = [0,0,0, 1,0,0, 0,1,0, 0,0,1]
								if(type !== 0) {
									if(!shortCFrames[type]) {
										console.warn("[ParseRBXBin] Unknown shortCFrame " + type)
										type = 2
									}
									var cfr = shortCFrames[type]

									for(var i=0; i<9; i++)
										value[i+3] = cfr[i];
								} else {
									for(var i=0; i<9; i++)
										value[i+3] = prop.FloatLE();
								}
							}

							var vecX = prop.RBXInterleaved32(count, toRBXFloat)
							var vecY = prop.RBXInterleaved32(count, toRBXFloat)
							var vecZ = prop.RBXInterleaved32(count, toRBXFloat)
							for(var i=0; i<count; i++) {
								values[i][0] = vecX[i]
								values[i][1] = vecY[i]
								values[i][2] = vecZ[i]

								values[i] = RBXProperty("CFrame", values[i])
							}
							break;
						case 0x12: // Enum / Token
							values = prop.RBXInterleaved32(prop.remaining/4)
							values.forEach((value, i) => values[i] = RBXEnum(value))
							break;
						case 0x13: // Referent
							var count = prop.remaining/4
							values = prop.RBXInterleaved32(count, toRBXSigned)
							var objId = 0
							for(var i=0; i<count; i++) {
								objId += values[i]
								values[i] = objList[objId]
							}
							break;

						case 0x9: // Faces
						case 0xA: // Axis
						case 0x19: // PhysicalProperties
							break;
						default:
							console.warn("[ParseRBXBin] Unknown dataType " + dataType + " for " + instData.ClassName + "." + propName);
							break;
					}

					for(var i=0, l=values.length; i<l; i++) {
						instData.Objects[i].setProperty(propName, values[i])
					}
				}

				var result = []

				var prnt = new ByteReader(reader.LZ4())
				prnt.Byte()
				var count = prnt.UInt32LE()
				var refs = prnt.RBXInterleaved32(count, toRBXSigned)
				var pars = prnt.RBXInterleaved32(count, toRBXSigned)

				var objId = 0
				var parId = 0
				for(var i=0; i<count; i++) {
					objId += refs[i]
					parId += pars[i]

					var obj = objList[objId]
					if(parId === -1) {
						result.push(obj)
					} else {
						obj.setParent(objList[parId])
					}
				}

				var blockName = reader.String(3)
				if(blockName !== "END")
					throw new Error("[ParseRBXBin] Expected END, got '" + blockName + "'");

				if(!reader.Match(footerBytes))
					console.warn("[ParseRBXBin] Footer bytes did not match");

				if(reader.remaining > 0)
					console.warn("[ParseRBXBin] Unexpected " + reader.remaining + " bytes of data after finishing");

				return result
			}
		})()

		var ParseRBXXml = (function() {
			function forEach(arr, fn) {
				Array.prototype.forEach.call(arr, fn)
			}

			function RBXXmlParser() {
				this.refs = {}
				this.refWait = []
			}

			Object.assign(RBXXmlParser.prototype, {
				parseProperties: function(item, propertiesNode) {
					forEach(propertiesNode.children, (propNode) => {
						var name = propNode.attributes.name.value
						var value = propNode.textContent

						switch(propNode.nodeName.toLowerCase()) {
							case "content":
							case "string":
							case "protectedstring":
								break;
							case "double":
							case "float":
							case "int":
								value = +value
								break;
							case "bool":
								value = value == "true"
								break;
							case "token":
								value = RBXEnum(+value)
								break;
							case "coordinateframe":
								value = [ 0,0,0, 1,0,0, 0,1,0, 0,0,1 ]
								var trans = { X:0,Y:1,Z:2, R00:3,R01:4,R02:5, R10:6,R11:7,R12:8, R20:9,R21:10,R22:11 }
								forEach(propNode.children, (x) => (value[trans[x.nodeName.toUpperCase()]]=+x.textContent))
								value = RBXProperty("CFrame", value)
								break;
							case "vector3":
								value = [ 0,0,0 ]
								var trans = { X:0,Y:1,Z:2 }
								forEach(propNode.children, (x) => (value[trans[x.nodeName.toUpperCase()]]=+x.textContent))
								value = RBXProperty("Vector3", value)
								break;
							case "ref":
								if(value === "null")
									value = null;
								else if(this.refs[value])
									value = this.refs[value];
								else {
									this.refWait.push({
										ref: value,
										target: item,
										propName: name
									})
									value = null
								}
								break;
							case "physicalproperties":
							case "binarystring":
								value = null
								break;
							default:
								console.warn("[ParseRBXXml] Unknown dataType " + propNode.nodeName + " for " + name, propNode.innerHTML)
								value = null
								break;
						}

						item.setProperty(name, value)
					})
				},
				parseItem: function(node) {
					var item = RBXInstance(node.className)

					var ref = node.getAttribute("referent")
					if(ref) {
						this.refs[ref] = item
						this.refWait.filter(wait => wait.ref === ref).forEach(wait => {
							this.refWait.splice(this.refWait.indexOf(wait), 1)
							wait.target.setProperty(wait.propName, item)
						})
					}

					forEach(node.children, (child) => {
						switch(child.nodeName) {
							case "Item":
								var childItem = this.parseItem(child)
								childItem.setParent(item)
								break;
							case "Properties":
								this.parseProperties(item, child)
								break;
							default:
								console.log("Unknown xml node", child.nodeName);
								break;
						}
					})

					return item
				},
				parse: function(xmlString) {
					var xml = null
					try {
						xml = $.parseXML(xmlString).documentElement
					} catch(ex) {
						throw new Error("[ParseRBXXml] Unable to parse xml")
					}

					this.refs = {}
					this.refWait = []

					var result = []

					forEach(xml.children, (child) => {
						if(child.nodeName === "Item") {
							result.push(this.parseItem(child))
						}
					})

					return result
				}
			})

			return function(data) {
				data = new TextDecoder("ascii").decode(data)
				return new RBXXmlParser().parse(data)
			}
		})();

		return function(data) {
			var reader = new ByteReader(data) 
			if(reader.String(7) != "<roblox")
				throw new TypeError("Not a valid .RBXM file");

			if(reader.Byte() === 0x21) {
				return ParseRBXBin(data)
			}

			return ParseRBXXml(data)
		}
	})();

	typeof ANTI=="undefined" && (ANTI={}), ANTI.ParseMesh = (function() {
		function ParseVersion1(reader, isVersion1) {
			var text = reader.String(reader.remaining)
			var lines = text.split("\n")

			if(lines.length !== 2)
				throw new Error("Too many lines");

			var faceCount = +lines[0]
			var arr = lines[1].slice(1,-1).replace(/\s+/g,"").split("][")

			if(arr.length !== faceCount*9)
				console.log("Length mismatch", arr.length, faceCount*9);

			var mesh = {}
			var vertices = mesh.vertices = new Float32Array(faceCount*9)
			var normals = mesh.normals = new Float32Array(faceCount*9)
			var uvs = mesh.uvs = new Float32Array(faceCount*6)
			var faces = mesh.faces = new Uint32Array(faceCount*3)

			var verMul = isVersion1 ? 0.5 : 1;

			for(var i=0, l=faceCount*3; i<l; i++) {
				var j = i*3
				var ver = arr[j].split(",")
				var nor = arr[j+1].split(",")
				var uv = arr[j+2].split(",")

				vertices[j] = +ver[0] * verMul
				vertices[j+1] = +ver[1] * verMul
				vertices[j+2] = +ver[2] * verMul
				normals[j] = +nor[0]
				normals[j+1] = +nor[1]
				normals[j+2] = +nor[2]
				uvs[i*2] = +uv[0]
				uvs[i*2+1] = +uv[1]
				faces[i] = i
			}

			return mesh
		}

		function ParseVersion2(reader) {
			if(!reader.Match([0xC, 0x00, 0x24, 0x0C]))
				throw new Error("[ParseVersion2] Header did not match");

			var vertexCount = reader.UInt32LE()
			var faceCount = reader.UInt32LE()

			var itemCount = vertexCount * 3

			var mesh = {}
			var vertices = mesh.vertices = new Float32Array(vertexCount * 3)
			var normals = mesh.normals = new Float32Array(vertexCount * 3)
			var uvs = mesh.uvs = new Float32Array(vertexCount * 2)
			var faces = mesh.faces = new Uint32Array(faceCount * 3)

			for(var i=0; i<vertexCount; i++) {
				vertices[i*3] = reader.FloatLE()
				vertices[i*3+1] = reader.FloatLE()
				vertices[i*3+2] = reader.FloatLE()
				normals[i*3] = reader.FloatLE()
				normals[i*3+1] = reader.FloatLE()
				normals[i*3+2] = reader.FloatLE()
				uvs[i*2] = reader.FloatLE()
				uvs[i*2+1] = 1-reader.FloatLE()
				reader.FloatLE()
			}

			for(var i=0; i<faceCount*3; i+=3) {
				faces[i] = reader.UInt32LE()
				faces[i+1] = reader.UInt32LE()
				faces[i+2] = reader.UInt32LE()
			}

			if(reader.remaining > 0)
				console.warn("[ParseVersion2] Unexpected " + reader.remaining + " bytes of data after finishing");

			return mesh
		}

		return function(buffer) {
			var reader = new ByteReader(buffer)
			if(reader.String(8) != "version ")
				throw new Error("Not a valid mesh file");

			var version = reader.String(4)
			var newline = reader.Byte()
			if(!(newline === 0x0A || (newline === 0x0D && reader.Byte() == 0x0A)))
				throw new Error("Invalid newline");

			switch(version) {
				case "1.00":
					return ParseVersion1(reader, true)
				case "1.01":
					return ParseVersion1(reader, false)
				case "2.00":
					return ParseVersion2(reader)
				default:
					throw new Error("Invalid mesh version '" + version + "'");
			}
		}
	})();
})();
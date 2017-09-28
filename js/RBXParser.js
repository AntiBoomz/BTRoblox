"use strict"

const RBXParser = (() => {
	class Model extends Array {
	}

	class Property {
		constructor(type, value) {
			this.type = type
			this.value = value
		}
		toString() {
			switch(this.type) {
			case "Enum":
				return "Enum " + this.value.toString()
			case "Instance":
				return this.value && this.value.Name || ""
			case "CFrame":
			case "Color3":
			case "Vector2":
			case "Vector3":
				return this.value.join(", ")
			case "UDim2":
				return `{${this.value[0].join(", ")}} {${this.value[0].join(", ")}}`
			default:
				return this.value.toString()
			}
		}
	}

	class Instance {
		constructor(className) {
			assert(typeof className === "string")
			Object.defineProperty(this, "Children", { value: [], enumerable: true, writable: false })
			Object.defineProperty(this, "Properties", { value: [], enumerable: false, writable: false })
			Instance.set(this, "ClassName", className)
			Instance.set(this, "Parent", new Property("Instance", null))
		}

		static set(inst, name, prop) {
			const prevProp = inst.Properties[name]

			if(!(prop instanceof Property)) {
				switch(typeof prop) {
				case "string":
					prop = new Property("String", prop)
					break
				case "number":
					prop = new Property("Number", prop)
					break
				case "boolean":
					prop = new Property("Boolean", prop)
					break
				default:
					throw new Error("Invalid fast property assign")
				}
			}

			if(prevProp) {
				assert(prevProp.type === prop.type, "Property type mismatch")
			}

			Object.defineProperty(inst, name, { value: prop.value, writable: false, enumerable: true, configurable: true })
			inst.Properties[name] = prop

			if(name === "Parent") {
				if(prevProp && prevProp.value instanceof Instance) {
					const children = prevProp.value.Children
					children.splice(children.indexOf(inst), 1)
				}

				if(prop.value instanceof Instance) {
					prop.value.Children.push(inst)
				}
			}
		}
	}

	class ByteReader extends Uint8Array {
		static ParseFloat(long) {
			const exp = (long >> 23) & 255
			if(exp === 0) return 0;
			const float = 2 ** (exp - 127) * (1 + (long & 0x7FFFFF) / 0x7FFFFF)
			return long > 0x7FFFFFFF ? -float : float
		}

		static ParseDouble(long0, long1) {
			const exp = (long0 >> 20) & 2047
			const frac = (((long0 & 1048575) * 4294967296) + long1) / 4503599627370496
			const neg = long0 & 2147483648

			if(exp === 0) {
				if(frac === 0) return -0;
				const double = 2 ** (exp - 1023) * frac
				return neg ? -double : double
			} else if(exp === 2047) {
				return frac === 0 ? Infinity : NaN
			}

			const double = 2 ** (exp - 1023) * (1+frac)
			return neg ? -double : double
		}

		constructor(buffer) {
			if(buffer instanceof Uint8Array) {
				super(buffer.buffer)
			} else {
				assert(buffer instanceof ArrayBuffer, "Not an arraybuffer")
				super(buffer)
			}

			this.index = 0
		}

		SetIndex(n) { this.index = n }
		GetIndex() { return this.index }
		GetRemaining() { return this.length - this.index }
		Jump(n) { this.index += n }

		Array(n) {
			const result = new Uint8Array(this.buffer, this.index, n)
			this.index += n
			return result
		}
		Match(arr) {
			const begin = this.index
			this.index += arr.length
			for(let i = 0; i < arr.length; i++) {
				if(arr[i] !== this[begin + i]) return false;
			}
			return true
		}

		Byte() { return this[this.index++] }
		UInt8() { return this[this.index++] }
		UInt16LE() { return this[this.index++] + (this[this.index++] * 256) }
		UInt16BE() { return (this[this.index++] * 256) + this[this.index++] }
		UInt32LE() { return this[this.index++] + (this[this.index++] * 256) + (this[this.index++] * 65536) + (this[this.index++] * 16777216) }
		UInt32BE() { return (this[this.index++] * 16777216) + (this[this.index++] * 65536) + (this[this.index++] * 256) + this[this.index++] }
		FloatLE() { return ByteReader.ParseFloat(this.UInt32LE()) }
		FloatBE() { return ByteReader.ParseFloat(this.UInt32BE()) }
		DoubleLE() {
			const byte = this.UInt32LE()
			return ByteReader.ParseDouble(this.UInt32LE(), byte)
		}
		DoubleBE() { return ByteReader.ParseDouble(this.UInt32BE(), this.UInt32BE()) }

		String(n) { 
			const i = this.index
			this.index += n
			return new TextDecoder("ascii").decode(new Uint8Array(this.buffer, i, n))
		}

		// Custom stuff

		LZ4() {
			const comLength = this.UInt32LE()
			const decomLength = this.UInt32LE()
			this.Jump(4)

			const start = this.index
			const data = new Uint8Array(decomLength)
			let index = 0

			while(index < decomLength) {
				const token = this.Byte()
				let litLen = token >> 4

				if(litLen === 0xF) {
					while(true) {
						const lenByte = this.Byte()
						litLen += lenByte
						if(lenByte !== 0xFF) break;
					}
				}

				for(let i = 0; i < litLen; i++) {
					data[index++] = this.Byte()
				}

				if(index >= decomLength) break;

				const offset = this.UInt16LE()
				let len = token & 0xF

				if(len === 0xF) {
					while(true) {
						const lenByte = this.Byte()
						len += lenByte
						if(lenByte !== 0xFF) break;
					}
				}

				len += 4
				const begin = index - offset
				for(let i = 0; i < len; i++) {
					data[index++] = data[begin + i]
				}
			}

			assert(start + comLength === this.index, "[ByteReader.LZ4] Invalid LZ4, bad end index")
			return data
		}

		// RBXInterleaved

		_RBXInterleaved(count, fn) {
			const result = new Array(count)
			const byteCount = count * 4

			for(let i = 0; i < count; i++) {
				const value = (this[this.index + i] << 24) 
					+ (this[this.index + (i + count) % byteCount] << 16)
					+ (this[this.index + (i + count * 2) % byteCount] << 8)
					+ this[this.index + (i + count * 3) % byteCount]

				result[i] = fn ? fn(value) : value
			}

			this.Jump(byteCount)
			return result
		}

		RBXInterleavedFloat(count) {
			return this._RBXInterleaved(count, value =>
				ByteReader.ParseFloat((value >> 1) + ((value & 1) * 2147483648))
			)
		}

		RBXInterleavedInt(count) {
			return this._RBXInterleaved(count, value =>
				(value % 2 === 1 ? -(value + 1) / 2 : value / 2)
			)
		}

		RBXInterleavedByte(count) {
			return this._RBXInterleaved(count)
		}
	}

	const peekMethods = [
		"Byte", "UInt8", "UInt16LE", "UInt16BE", "UInt32LE", "UInt32BE",
		"FloatLE", "FloatBE", "DoubleLE", "DoubleBE", "String"
	]

	peekMethods.forEach(key => {
		const fn = ByteReader.prototype[key]
		ByteReader.prototype["Peek" + key] = function(...args) {
			const index = this.GetIndex()
			const result = fn.apply(this, args)
			this.SetIndex(index)
			return result
		}
	})

	class RBXXmlParser {
		parse(data) {
			if(typeof data !== "string") data = new TextDecoder("ascii").decode(data);

			const xml = new DOMParser().parseFromString(data, "text/xml").documentElement
			const result = new Model()

			this.refs = {}
			this.refWait = []

			for(let child of xml.children) {
				if(child.nodeName === "Item") {
					result.push(this.parseItem(child))
				}
			}

			return result
		}

		parseItem(node) {
			const instance = new Instance(node.className)
			const referent = node.getAttribute("referent")

			if(referent) {
				this.refs[referent] = instance
				this.refWait.filter(wait => wait.ref === referent).forEach(wait => {
					this.refWait.splice(this.refWait.indexOf(wait), 1)
					Instance.set(wait.target, wait.propName, new Property("Instance", instance))
				})
			}

			for(let childNode of node.children) {
				switch(childNode.nodeName) {
				case "Item":
					const child = this.parseItem(childNode)
					Instance.set(child, "Parent", new Property("Instance", instance))
					break
				case "Properties":
					this.parseProperties(instance, childNode)
					break
				}
			}

			return instance
		}

		parseProperties(instance, targetNode) {
			for(let propNode of targetNode.children) {
				const name = propNode.attributes.name.value

				let value = propNode.textContent
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
					value = value === "true"
					break;
				case "token":
					value = new Property("Enum", +value)
					break;
				case "coordinateframe":
					value = [ 0,0,0, 1,0,0, 0,1,0, 0,0,1 ]
					for(let x of propNode.children) {
						value[RBXXmlParser.CFrameTransform.indexOf(x.nodeName.toUpperCase())] = +x.textContent
					}
					value = new Property("CFrame", value)
					break;
				case "vector3":
					value = [ 0,0,0 ]
					for(let x of propNode.children) {
						value[RBXXmlParser.Vector3Transform.indexOf(x.nodeName.toUpperCase())] = +x.textContent
					}
					value = new Property("Vector3", value)
					break;
				case "color3uint8":
					value = new Property("Color3", [ +value >> 16 & 0xFF, +value >> 8 & 0xFF, +value & 0xFF ])
					break
				case "ref":
					if(value === "null") value = null;
					else if(this.refs[value]) value = this.refs[value];
					else {
						this.refWait.push({
							ref: value,
							target: item,
							propName: name
						})
						value = null
					}

					value = new Property("Instance", value)
					break
				case "physicalproperties":
				case "binarystring":
					continue
				default:
					console.warn("Unknown dataType " + propNode.nodeName + " for " + instance.ClassName, propNode.innerHTML)
					continue
				}

				Instance.set(instance, name, value)
			}
		}
	}
	RBXXmlParser.CFrameTransform = ["X", "Y", "Z", "R00", "R01", "R02", "R10", "R11", "R12", "R20", "R21", "R22"]
	RBXXmlParser.Vector3Transform = ["X", "Y", "Z"]

	class RBXBinParser {
		// http://www.classy-studios.com/Downloads/RobloxFileSpec.pdf
		parse(buffer) {
			const reader = this.reader = new ByteReader(buffer)
			if(!reader.Match(RBXBinParser.HeaderBytes)) console.warn("Header bytes did not match (Did binary format change?)");

			const groupsCount = reader.UInt32LE()
			const instancesCount = reader.UInt32LE()
			reader.Jump(8)

			this.result = new Model()
			this.groups = new Array(groupsCount)
			this.instances = new Array(instancesCount)

			for(let n = 0; n < groupsCount; n++) this.parseINST();
			while(reader.PeekString(4) === "PROP") this.parsePROP();
			this.parsePRNT()

			assert(reader.String(3) === "END", "Invalid or missing END")
			if(!reader.Match(RBXBinParser.FooterBytes)) console.warn("Footer bytes did not match (Did binary format change?)");
			if(reader.GetRemaining() > 0) console.warn("Unexpected bonus data after model");

			return this.result
		}

		parseINST() {
			assert(this.reader.String(4) === "INST", "Invalid or missing INST")
			const sub = new ByteReader(this.reader.LZ4())

			const groupId = sub.UInt32LE()
			const className = sub.String( sub.UInt32LE() )
			const bonus = sub.Byte() // Idk :<
			const instCount = sub.UInt32LE()
			const instIds = sub.RBXInterleavedInt(instCount)

			const group = this.groups[groupId] = {
				ClassName: className,
				Objects: []
			}

			let instId = 0
			for(let i = 0; i < instCount; i++) {
				instId += instIds[i]
				group.Objects.push( this.instances[instId] = new Instance(className) )
			}
		}

		parsePROP() {
			assert(this.reader.String(4) === "PROP", "Invalid or missing PROP")
			const sub = new ByteReader(this.reader.LZ4())

			const group = this.groups[sub.UInt32LE()]
			const prop = sub.String( sub.UInt32LE() )
			const dataType = sub.Byte()

			let values = []
			switch(dataType) {
			case 0x1: // String
				while(sub.GetRemaining() > 0) {
					values.push(sub.String(sub.UInt32LE()))
				}
				break;
			case 0x2: // Boolean
				while(sub.GetRemaining() > 0) {
					values.push(sub.Byte() === 0x1)
				}
				break;
			case 0x3: // Int32
				values = sub.RBXInterleavedInt(sub.GetRemaining() / 4)
				break;
			case 0x4: // Float
				values = sub.RBXInterleavedFloat(sub.GetRemaining() / 4)
				break;
			case 0x5: // Double
				while(sub.GetRemaining() > 0) {
					values.push(ByteReader.ParseDouble(sub.UInt32LE(), sub.UInt32LE()))
				}
				break;
			case 0x7: { // UDim2
				const count = sub.GetRemaining()/16
				const scaleX = sub.RBXInterleavedFloat(count)
				const scaleY = sub.RBXInterleavedFloat(count)
				const offsetX = sub.RBXInterleavedInt(count)
				const offsetY = sub.RBXInterleavedInt(count)
				for(let i = 0; i < count; i++) {
					values[i] = new Property("UDim2", [
						[ scaleX[i], offsetX[i] ],
						[ scaleY[i], offsetY[i] ]
					])
				}
				break;
			}
			case 0x8: { // Ray
				const count = sub.GetRemaining() / 24
				for(let i = 0; i < count; i++) {
					values[i] = new Property("Ray", [
						[ sub.FloatLE(), sub.FloatLE(), sub.FloatLE() ],
						[ sub.FloatLE(), sub.FloatLE(), sub.FloatLE() ]
					])
				}
				break
			}
			case 0xB: // BrickColor
				values = sub.RBXInterleavedByte(sub.GetRemaining() / 4)
				break;
			case 0xC: { // Color3
				const count = sub.GetRemaining() / 12
				const red = sub.RBXInterleavedFloat(count)
				const green = sub.RBXInterleavedFloat(count)
				const blue = sub.RBXInterleavedFloat(count)
				for(let i = 0; i < count; i++) {
					values[i] = new Property("Color3", [ red[i], green[i], blue[i] ])
				}
				break
			}
			case 0xD: { // Vector2
				const count = sub.GetRemaining() / 8
				const vecX = sub.RBXInterleavedFloat(count)
				const vecY = sub.RBXInterleavedFloat(count)
				for(let i = 0; i < count; i++) {
					values[i] = new Property("Vector2", [ vecX[i], vecY[i] ])
				}
				break
			}
			case 0xE: { // Vector3
				const count = sub.GetRemaining()/12
				const vecX = sub.RBXInterleavedFloat(count)
				const vecY = sub.RBXInterleavedFloat(count)
				const vecZ = sub.RBXInterleavedFloat(count)
				for(let i = 0; i < count; i++) {
					values[i] = new Property("Vector3", [ vecX[i], vecY[i], vecZ[i] ])
				}
				break
			}
			case 0x10: { // CFrame
				let count = 0
				while(sub.GetRemaining() > count * 12) {
					const value = values[count++] = [0,0,0, 1,0,0, 0,1,0, 0,0,1]
					let type = sub.Byte()

					if(type !== 0) {
						const cframe = RBXBinParser.ShortCFrames[type]
						assert(cframe, "Invalid shortened CFrame")
						for(let i = 0; i < 9; i++) value[i+3] = cframe[i];
					} else {
						for(let i = 0; i < 9; i++) value[i+3] = sub.FloatLE();
					}
				}

				const vecX = sub.RBXInterleavedFloat(count)
				const vecY = sub.RBXInterleavedFloat(count)
				const vecZ = sub.RBXInterleavedFloat(count)
				for(let i = 0; i < count; i++) {
					values[i][0] = vecX[i]
					values[i][1] = vecY[i]
					values[i][2] = vecZ[i]

					values[i] = new Property("CFrame", values[i])
				}
				break
			}
			case 0x12: { // Enum / Token
				const count = sub.GetRemaining() / 4
				values = sub.RBXInterleavedByte(count).map(x => new Property("Enum", x))
				break
			}
			case 0x13: { // Reference
				const count = sub.GetRemaining() / 4
				const refIds = sub.RBXInterleavedInt(count)

				let refId = 0
				for(let i = 0; i < count; i++) {
					refId += refIds[i]
					values[i] = new Property("Instance", this.instances[refId])
				}
				break
			}
			case 0x9: // Faces
			case 0xA: // Axis
			case 0x19: // PhysicalProperties
				break;
			default:
				console.warn("[ParseRBXBin] Unknown dataType " + dataType + " for " + group.ClassName + "." + prop);
				break;
			}

			values.forEach((value, i) => {
				Instance.set(group.Objects[i], prop, value)
			})
		}

		parsePRNT() {
			assert(this.reader.String(4) === "PRNT", "Invalid or missing PRNT")
			const sub = new ByteReader(this.reader.LZ4())

			sub.Byte()
			const parentCount = sub.UInt32LE()
			const childIds = sub.RBXInterleavedInt(parentCount)
			const parentIds = sub.RBXInterleavedInt(parentCount)

			let childId = 0
			let parentId = 0
			for(let i = 0; i < parentCount; i++) {
				childId += childIds[i]
				parentId += parentIds[i]

				const child = this.instances[childId]
				if(parentId === -1) {
					this.result.push(child)
				} else {
					Instance.set(child, "Parent", new Property("Instance", this.instances[parentId]))
				}
			}
		}
	}
	RBXBinParser.HeaderBytes = [ 0x3C, 0x72, 0x6F, 0x62, 0x6C, 0x6F, 0x78, 0x21, 0x89, 0xFF, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00 ]
	RBXBinParser.FooterBytes = [ 0x00, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3C, 0x2F, 0x72, 0x6F, 0x62, 0x6C, 0x6F, 0x78, 0x3E ]
	RBXBinParser.ShortCFrames = [null,null,[1,0,0,0,1,0,0,0,1],[1,0,0,0,0,-1,0,1,0],null,[1,0,0,0,-1,0,0,0,-1],[1,0,0,0,0,1,0,-1,0],[0,1,0,1,0,0,0,0,-1],null,[0,0,1,1,0,0,0,1,0],[0,-1,0,1,0,0,0,0,1],null,[0,0,-1,1,0,0,0,-1,0],[0,1,0,0,0,1,1,0,0],[0,0,-1,0,1,0,1,0,0],null,[0,-1,0,0,0,-1,1,0,0],[0,0,1,0,-1,0,1,0,0],null,null,[-1,0,0,0,1,0,0,0,-1],[-1,0,0,0,0,1,0,1,0],null,[-1,0,0,0,-1,0,0,0,1],[-1,0,0,0,0,-1,0,-1,0],[0,1,0,-1,0,0,0,0,1],null,[0,0,-1,-1,0,0,0,1,0],[0,-1,0,-1,0,0,0,0,-1],null,[0,0,1,-1,0,0,0,-1,0],[0,1,0,0,0,-1,-1,0,0],[0,0,1,0,1,0,-1,0,0],null,[0,-1,0,0,0,1,-1,0,0],[0,0,-1,0,-1,0,-1,0,0]]
	
	class ModelParser {
		parse(buffer) {
			let format
			if(typeof buffer === "string" && !buffer.startsWith("<roblox ")) {
				format = "xml"
			} else {
				if(typeof buffer === "string") buffer = new TextEncoder().encode(buffer).buffer;
				const reader = new ByteReader(buffer)
				assert(reader.String(7) === "<roblox", "Not a valid RBXM file (invalid header)")
				format = reader.Byte() === 0x21 ? "bin" : "xml"
			}

			return format === "xml"
				? this.parseXml(buffer)
				: this.parseBin(buffer)
		}

		parseXml(buffer) { return new RBXXmlParser().parse(buffer) }
		parseBin(buffer) { return new RBXBinParser().parse(buffer) }
	}

	class MeshParser {
		parse(buffer) {
			let format

			if(typeof buffer === "string" && buffer.startsWith("version 1.0")) {
				format = "text"
			} else {
				if(typeof buffer === "string") buffer = new TextEncoder().encode(buffer);
				const reader = new ByteReader(buffer)
				assert(reader.String(8) === "version ", "Invalid mesh file")

				const version = reader.String(4)
				switch(version) {
				case "1.00":
				case "1.01":
					format = "text"
					break
				case "2.00":
					format = "bin"
					break
				default:
					throw new Error("Unsupported mesh version")
				}
			}

			return format === "text"
				? this.parseText(buffer)
				: this.parseBin(buffer)
		}

		parseText(buffer) {
			if(typeof buffer !== "string") buffer = new TextDecoder().decode(buffer);
			const lines = buffer.split(/\r?\n/)
			assert(lines.length === 3, "Invalid mesh version 1 file (Wrong amount of lines)")

			const version = lines[0]
			const faceCount = lines[1]
			const data = lines[2]

			const vectors = data.replace(/\s+/g, "").slice(1, -1).split("][")
			assert(vectors.length === faceCount * 9, "Length mismatch")

			const scaleMultiplier = version === "version 1.00" ? 0.5 : 1
			const vertexCount = faceCount * 3
			const vertices = new Float32Array(vertexCount * 3)
			const normals = new Float32Array(vertexCount * 3)
			const uvs = new Float32Array(vertexCount * 2)
			const faces = new Uint32Array(vertexCount)

			for(let i = 0; i < vertexCount; i++) {
				const n = i * 3
				const vertex = vectors[n].split(",")
				const normal = vectors[n + 1].split(",")
				const uv = vectors[n + 2].split(",")

				vertices[n] = +vertex[0] * scaleMultiplier
				vertices[n + 1] = +vertex[1] * scaleMultiplier
				vertices[n + 2] = +vertex[2] * scaleMultiplier

				normals[n] = +normal[0]
				normals[n + 1] = +normal[1]
				normals[n + 2] = +normal[2]

				uvs[i * 2] = +uv[0]
				uvs[i * 2 + 1] = +uv[1]
				faces[i] = i
			}

			return { vertices, normals, uvs, faces }
		}

		parseBin(buffer) {
			const reader = new ByteReader(buffer)
			assert(reader.String(12) === "version 2.00", "Bad header")

			const newline = reader.Byte()
			assert(newline === 0x0A || newline === 0x0D && reader.Byte() === 0x0A, "Bad newline")

			const begin = reader.GetIndex()
			const headerSize = reader.UInt16LE(); assert(headerSize === 12, "Invalid header size")
			const vertexSize = reader.Byte(); assert(vertexSize >= 32, "Invalid vertex size")
			const faceSize = reader.Byte(); assert(faceSize >= 12, "Invalid face size")

			const vertexCount = reader.UInt32LE()
			const faceCount = reader.UInt32LE()

			const vertices = new Float32Array(vertexCount * 3)
			const normals = new Float32Array(vertexCount * 3)
			const uvs = new Float32Array(vertexCount * 2)
			const faces = new Uint32Array(faceCount * 3)

			reader.SetIndex(begin + headerSize)
			for(let i = 0; i < vertexCount; i++) {
				vertices[i*3] = reader.FloatLE()
				vertices[i*3+1] = reader.FloatLE()
				vertices[i*3+2] = reader.FloatLE()

				normals[i*3] = reader.FloatLE()
				normals[i*3+1] = reader.FloatLE()
				normals[i*3+2] = reader.FloatLE()

				uvs[i*2] = reader.FloatLE()
				uvs[i*2+1] = 1-reader.FloatLE()

				reader.Jump(vertexSize - 32)
			}

			for(let i = 0; i < faceCount; i++) {
				faces[i*3] = reader.UInt32LE()
				faces[i*3+1] = reader.UInt32LE()
				faces[i*3+2] = reader.UInt32LE()

				reader.Jump(faceSize - 12)
			}

			if(reader.GetRemaining() > 0) console.warn("Leftover data in mesh");
			return { vertices, normals, uvs, faces }
		}
	}

	class AnimationParser {
		static CFrameToQuat(cf) {
			var qw, qx, qy, qz
			var trace = cf[3] + cf[7] + cf[11]
			
			if(trace > 0) {
				var S = Math.sqrt(1 + trace) * 2
				qw = S / 4
				qx = (cf[10] - cf[8]) / S
				qy = (cf[5] - cf[9]) / S
				qz = (cf[6] - cf[4]) / S
			} else if ((cf[3] > cf[7]) && (cf[3] > cf[11])) { 
				var S = Math.sqrt(1.0 + cf[3] - cf[7] - cf[11]) * 2
				qw = (cf[10] - cf[8]) / S
				qx = S / 4
				qy = (cf[4] + cf[6]) / S 
				qz = (cf[5] + cf[9]) / S 
			} else if (cf[7] > cf[11]) { 
				var S = Math.sqrt(1.0 + cf[7] - cf[3] - cf[11]) * 2
				qw = (cf[5] - cf[9]) / S
				qx = (cf[4] + cf[6]) / S 
				qy = S / 4
				qz = (cf[8] + cf[10]) / S 
			} else { 
				var S = Math.sqrt(1.0 + cf[11] - cf[3] - cf[7]) * 2
				qw = (cf[6] - cf[4]) / S
				qx = (cf[5] + cf[9]) / S
				qy = (cf[8] + cf[10]) / S
				qz = S / 4
			}

			return [ qx, qy, qz, qw ]
		}

		parse(model) {
			assert(model instanceof Model, "Invalid model")

			const sequence = model[0]
			assert(sequence instanceof Instance && sequence.ClassName === "KeyframeSequence", "Not a keyframesequence")
			
			const keyframes = sequence.Children
				.filter(x => x.ClassName === "Keyframe")
				.sort((a,b) => a.Time - b.Time)
			
			this.result = {
				length: keyframes[keyframes.length - 1].Time,
				loop: !!sequence.Loop,
				keyframes: {}
			}

			keyframes.forEach(keyframe => {
				keyframe.Children.forEach(rootPose => {
					if(rootPose.ClassName !== "Pose") return;
					rootPose.Children.forEach(pose => this.parsePose(pose, keyframe))
				})
			})

			return this.result
		}

		parsePose(pose, keyframe) {
			if(pose.ClassName !== "Pose") return;

			const name = pose.Name
			const cf = pose.CFrame
			if(!this.result.keyframes[name]) this.result.keyframes[name] = [];

			this.result.keyframes[name].push({
				time: keyframe.Time,
				pos: [ cf[0], cf[1], cf[2] ],
				rot: AnimationParser.CFrameToQuat(cf)
			})

			pose.Children.forEach(child => this.parsePose(child, keyframe))
		}
	}

	return {
		Model,
		Instance,
		Property,
		ByteReader,
		ModelParser,
		MeshParser,
		AnimationParser,

		parseContentUrl(urlString) {
			if(typeof urlString !== "string" || !urlString.length) return null;
			try {
				const url = new URL(urlString)
				switch(url.protocol) {
				case "rbxassetid:": {
					const id = parseInt(url.pathname.replace(/^\/*/,""), 10)
					assert(!isNaN(id), "Invalid asset id")
					return id
				}
				case "http:":
				case "https:": {
					assert(url.hostname.search(/^((assetgame|www|web)\.)?roblox\.com$/) !== -1, "Invalid hostname")
					assert(url.pathname.search(/^\/asset\/?$/) !== -1, "Invalid pathname")
					const id = parseInt(url.searchParams.get("id"), 10)
					assert(!isNaN(id), "Missing or invalid asset id")
					return id
				}
				default:
					throw new Error("Invalid protocol", url)
				}
			} catch(ex) {
				console.error("Failed to parse url", urlString, ex);
			}

			return null
		}
	}
})();
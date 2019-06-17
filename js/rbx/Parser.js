"use strict"

const RBXParser = (() => {
	const assert = (bool, ...msg) => {
		if(!bool) { throw new Error(...msg) }
	}

	class ByteReader extends Uint8Array {
		static ParseFloat(long) {
			const exp = (long >>> 23) & 255
			if(exp === 0) { return 0 }
			const float = 2 ** (exp - 127) * (1 + (long & 0x7FFFFF) / 0x7FFFFF)
			return long > 0x7FFFFFFF ? -float : float
		}

		static ParseRBXFloat(long) {
			const exp = long >>> 24
			if(exp === 0) { return 0 }
			const float = 2 ** (exp - 127) * (1 + ((long >>> 1) & 0x7FFFFF) / 0x7FFFFF)
			return long & 1 ? -float : float
		}

		static ParseDouble(long0, long1) {
			const exp = (long0 >>> 20) & 0x7FF
			const frac = (((long0 & 1048575) * 4294967296) + long1) / 4503599627370496
			const neg = long0 & 2147483648

			if(exp === 0) {
				if(frac === 0) { return -0 }
				const double = 2 ** (exp - 1023) * frac
				return neg ? -double : double
			} else if(exp === 2047) {
				return frac === 0 ? Infinity : NaN
			}

			const double = 2 ** (exp - 1023) * (1 + frac)
			return neg ? -double : double
		}

		constructor(buffer) {
			if(buffer instanceof Uint8Array) {
				super(buffer.buffer)
			} else {
				assert(buffer instanceof ArrayBuffer, "buffer is not an ArrayBuffer")
				super(buffer)
			}

			this.index = 0
		}

		SetIndex(n) { this.index = n }
		GetIndex() { return this.index }
		GetRemaining() { return this.length - this.index }
		GetLength() { return this.length }
		Jump(n) { this.index += n }
		Clone() {
			const clone = new ByteReader(this)
			clone.SetIndex(this.index)
			return clone
		}

		Array(n) {
			const result = new Uint8Array(this.buffer, this.index, n)
			this.index += n
			return result
		}

		Match(arr) {
			const begin = this.index
			this.index += arr.length
			for(let i = 0; i < arr.length; i++) {
				if(arr[i] !== this[begin + i]) { return false }
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
			return $.bufferToStr(new Uint8Array(this.buffer, i, n))
		}

		// Custom stuff
		LZ4() {
			const comLength = this.UInt32LE()
			const decomLength = this.UInt32LE()
			this.Jump(4)

			if(comLength === 0) {
				return this.Array(decomLength)
			}

			const start = this.index
			const end = start + comLength
			const data = new Uint8Array(decomLength)
			let index = 0

			while(this.index < end) {
				const token = this.Byte()
				let litLen = token >>> 4

				if(litLen === 0xF) {
					while(true) {
						const lenByte = this.Byte()
						litLen += lenByte
						if(lenByte !== 0xFF) { break }
					}
				}

				for(let i = 0; i < litLen; i++) {
					data[index++] = this.Byte()
				}

				if(this.index < end) {
					const offset = this.UInt16LE()
					let len = token & 0xF

					if(len === 0xF) {
						while(true) {
							const lenByte = this.Byte()
							len += lenByte
							if(lenByte !== 0xFF) { break }
						}
					}

					len += 4
					const begin = index - offset
					for(let i = 0; i < len; i++) {
						data[index++] = data[begin + i]
					}
				}
			}

			assert(this.index === end, "[ByteReader.LZ4] LZ4 size mismatch")
			return data
		}

		// RBX

		RBXFloatLE() { return ByteReader.ParseRBXFloat(this.UInt32LE()) }
		RBXFloatBE() { return ByteReader.ParseRBXFloat(this.UInt32BE()) }

		RBXInterleavedUint32(count, fn) {
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

		RBXInterleavedInt32(count) {
			return this.RBXInterleavedUint32(count, value =>
				(value % 2 === 1 ? -(value + 1) / 2 : value / 2)
			)
		}

		RBXInterleavedFloat(count) {
			return this.RBXInterleavedUint32(count, value =>
				ByteReader.ParseRBXFloat(value)
			)
		}
	}

	{
		const peekMethods = ["Byte", "UInt8", "UInt16LE", "UInt16BE", "UInt32LE", "UInt32BE", "FloatLE", "FloatBE", "DoubleLE", "DoubleBE", "String"]
		peekMethods.forEach(key => {
			const fn = ByteReader.prototype[key]
			ByteReader.prototype["Peek" + key] = function(...args) {
				const index = this.GetIndex()
				const result = fn.apply(this, args)
				this.SetIndex(index)
				return result
			}
		})
	}

	class Instance {
		static new(className) {
			assert(typeof className === "string", "className is not a string")
			return new Instance(className)
		}

		constructor(className) {
			assert(typeof className === "string", "className is not a string")
			this.Children = []
			this.Properties = []

			this.setProperty("ClassName", className, "string")
			this.setProperty("Name", "Instance", "string")
			this.setProperty("Parent", null, "Instance")
		}

		setProperty(name, value, type) {
			if(!type) {
				if(typeof value === "boolean") {
					type = "bool"
				} else if(value instanceof Instance) {
					type = "Instance"
				} else {
					throw new TypeError("You need to specify property type")
				}
			}

			let descriptor = this.Properties[name]
			if(descriptor) {
				assert(descriptor.type === type, `Property type mismatch ${type} !== ${descriptor.type}`)

				if(name === "Parent" && descriptor.value instanceof Instance) {
					const index = descriptor.value.Children.indexOf(this)
					if(index !== -1) {
						descriptor.value.Children.splice(index, 1)
					}
				}

				descriptor.value = value
			} else {
				descriptor = this.Properties[name] = { type, value }
			}

			if(name === "Parent") {
				if(descriptor.value instanceof Instance) {
					descriptor.value.Children.push(this)
				}
			}

			if(name !== "Children" && name !== "Properties" && !(name in Object.getPrototypeOf(this))) {
				this[name] = value
			}
		}

		getProperty(name) {
			const descriptor = this.Properties[name]
			return descriptor ? descriptor.value : undefined
		}

		hasProperty(name) {
			return name in this.Properties
		}
	}

	const domParser = new DOMParser()
	class RBXXmlParser {
		parse(data) {
			const xml = domParser.parseFromString(data, "text/xml").documentElement
			const result = []

			this.refs = {}
			this.refWait = []

			Object.values(xml.children).forEach(child => {
				if(child.nodeName === "Item") {
					result.push(this.parseItem(child))
				}
			})

			return result
		}

		parseItem(node) {
			const inst = Instance.new(node.className)
			const referent = node.getAttribute("referent")

			if(referent) {
				this.refs[referent] = inst
				this.refWait.forEach(wait => {
					if(wait.id === referent) {
						this.refWait.splice(this.refWait.indexOf(wait), 1)
						wait.inst.setProperty(wait.name, inst, "Instance")
					}
				})
			}

			Object.values(node.children).forEach(childNode => {
				switch(childNode.nodeName) {
				case "Item": {
					const child = this.parseItem(childNode)
					child.setProperty("Parent", inst)
					break
				}
				case "Properties":
					this.parseProperties(inst, childNode)
					break
				}
			})

			return inst
		}

		parseProperties(inst, targetNode) {
			Object.values(targetNode.children).forEach(propNode => {
				const name = propNode.attributes.name.value
				const value = propNode.textContent

				switch(propNode.nodeName.toLowerCase()) {
				case "content":
				case "string":
				case "protectedstring":
				case "binarystring": return inst.setProperty(name, value.trim(), "string")
				case "double": return inst.setProperty(name, +value, "double")
				case "float": return inst.setProperty(name, +value, "float")
				case "int": return inst.setProperty(name, +value, "int")
				case "int64": return inst.setProperty(name, value, "int64")
				case "bool": return inst.setProperty(name, value.toLowerCase() === "true", "bool")
				case "token": return inst.setProperty(name, +value, "Enum")
				case "color3":
				case "color3uint8": return inst.setProperty(name, [(+value >>> 16 & 255) / 255, (+value >>> 8 & 255) / 255, (+value & 255) / 255], "Color3")
				case "coordinateframe": {
					const cframe = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]
					Object.values(propNode.children).forEach(x => {
						const index = RBXXmlParser.Transforms.CFrame.indexOf(x.nodeName.toUpperCase())
						if(index !== -1) {
							cframe[index] = +x.textContent
						}
					})

					return inst.setProperty(name, cframe, "CFrame")
				}
				case "vector2": {
					const vector2 = [0, 0]
					Object.values(propNode.children).forEach(x => {
						const index = RBXXmlParser.Transforms.Vector2.indexOf(x.nodeName.toUpperCase())
						if(index !== -1) {
							vector2[index] = +x.textContent
						}
					})

					return inst.setProperty(name, vector2, "Vector2")
				}
				case "vector3": {
					const vector3 = [0, 0, 0]
					Object.values(propNode.children).forEach(x => {
						const index = RBXXmlParser.Transforms.Vector3.indexOf(x.nodeName.toUpperCase())
						if(index !== -1) {
							vector3[index] = +x.textContent
						}
					})

					return inst.setProperty(name, vector3, "Vector3")
				}
				case "physicalproperties": {
					const props = { CustomPhysics: false, Density: null, Friction: null, Elasticity: null, FrictionWeight: null, ElasticityWeight: null }
					Object.values(propNode.children).forEach(x => {
						if(x.nodeName in props) {
							props[x.nodeName] = x.nodeName === "CustomPhysics" ? x.textContent.toLowerCase() === "true" : +x.textContent
						}
					})

					return inst.setProperty(name, props, "PhysicalProperties")
				}
				case "ref": {
					const target = this.refs[value] || null
					if(!target && value.toLowerCase() !== "null") {
						this.refWait.push({
							inst, name,
							id: value
						})
					}

					return inst.setProperty(name, target, "Instance")
				}
				case "colorsequence":
				case "numberrange":
				case "numbersequence":
					return
				default: console.warn(`[ParseRBXXml] Unknown dataType ${propNode.nodeName} for ${inst.ClassName}.${name}`, propNode.innerHTML)
				}
			})
		}
	}
	RBXXmlParser.Transforms = {
		CFrame: ["X", "Y", "Z", "R00", "R01", "R02", "R10", "R11", "R12", "R20", "R21", "R22"],
		Vector3: ["X", "Y", "Z"],
		Vector2: ["X", "Y"]
	}

	class RBXBinParser {
		// http://www.classy-studios.com/Downloads/RobloxFileSpec.pdf
		parse(buffer) {
			const reader = this.reader = new ByteReader(buffer)
			if(!reader.Match(RBXBinParser.HeaderBytes)) { console.warn("[ParseRBXBin] Header bytes did not match (Did binary format change?)") }

			const groupsCount = reader.UInt32LE()
			const instancesCount = reader.UInt32LE()
			reader.Jump(8)

			this.result = []
			this.sharedStrings = []
			this.groups = new Array(groupsCount)
			this.instances = new Array(instancesCount)

			while(true) {
				const chunkType = reader.String(4)
				const chunkData = this.reader.LZ4()

				if(chunkType === "END\0") {
					break
				}

				const chunkReader = new ByteReader(chunkData)

				switch(chunkType) {
				case "INST":
					this.parseINST(chunkReader)
					break
				case "PROP":
					this.parsePROP(chunkReader)
					break
				case "PRNT":
					this.parsePRNT(chunkReader)
					break
				case "SSTR":
					this.parseSSTR(chunkReader)
					break

				case "META": break

				default:
					throw new Error(`[ParseRBXBin] Unexpected chunk '${chunkType}'`)
				}
			}

			if(reader.GetRemaining() > 0) { console.warn("[ParseRBXBin] Unexpected data after END") }

			return this.result
		}

		parseSSTR(chunk) {
			chunk.UInt32LE() // version
			const stringCount = chunk.UInt32LE()

			for(let i = 0; i < stringCount; i++) {
				const md5 = chunk.Array(16)
				const length = chunk.UInt32LE()
				const value = chunk.String(length)

				this.sharedStrings[i] = { md5, value }
			}
		}

		parseINST(chunk) {
			const groupId = chunk.UInt32LE()
			const className = chunk.String(chunk.UInt32LE())
			chunk.Byte() // isService
			const instCount = chunk.UInt32LE()
			const instIds = chunk.RBXInterleavedInt32(instCount)

			const group = this.groups[groupId] = {
				ClassName: className,
				Objects: []
			}

			let instId = 0
			for(let i = 0; i < instCount; i++) {
				instId += instIds[i]
				group.Objects.push(this.instances[instId] = Instance.new(className))
			}
		}

		parsePROP(chunk) {
			const group = this.groups[chunk.UInt32LE()]
			const prop = chunk.String(chunk.UInt32LE())
			const dataType = chunk.Byte()
			const typeName = RBXBinParser.DataTypes[dataType]
			const instCount = group.Objects.length

			if(!typeName) {
				console.warn(`[ParseRBXBin] Unknown dataType 0x${dataType.toString(16).toUpperCase()} for ${group.ClassName}.${prop}`)
				return
			}

			let values = new Array(instCount)

			switch(typeName) {
			case "string":
				for(let i = 0; i < instCount; i++) {
					const len = chunk.UInt32LE()
					values[i] = chunk.String(len)
				}
				break
			case "bool":
				for(let i = 0; i < instCount; i++) {
					values[i] = chunk.Byte() !== 0
				}
				break
			case "int":
				values = chunk.RBXInterleavedInt32(instCount)
				break
			case "float":
				values = chunk.RBXInterleavedFloat(instCount)
				break
			case "double":
				for(let i = 0; i < instCount; i++) {
					values[i] = ByteReader.ParseDouble(chunk.UInt32LE(), chunk.UInt32LE())
				}
				break
			case "UDim": {
				const scale = chunk.RBXInterleavedFloat(instCount)
				const offset = chunk.RBXInterleavedInt32(instCount)
				for(let i = 0; i < instCount; i++) {
					values[i] = [scale[i], offset[i]]
				}
				break
			}
			case "UDim2": {
				const scaleX = chunk.RBXInterleavedFloat(instCount)
				const scaleY = chunk.RBXInterleavedFloat(instCount)
				const offsetX = chunk.RBXInterleavedInt32(instCount)
				const offsetY = chunk.RBXInterleavedInt32(instCount)
				for(let i = 0; i < instCount; i++) {
					values[i] = [
						[scaleX[i], offsetX[i]],
						[scaleY[i], offsetY[i]]
					]
				}
				break
			}
			case "Ray": {
				for(let i = 0; i < instCount; i++) {
					values[i] = [
						[chunk.RBXFloatLE(), chunk.RBXFloatLE(), chunk.RBXFloatLE()],
						[chunk.RBXFloatLE(), chunk.RBXFloatLE(), chunk.RBXFloatLE()]
					]
				}
				break
			}
			case "Faces":
				for(let i = 0; i < instCount; i++) {
					const data = chunk.Byte()

					values[i] = {
						Right: !!(data & 1),
						Top: !!(data & 2),
						Back: !!(data & 4),
						Left: !!(data & 8),
						Bottom: !!(data & 16),
						Front: !!(data & 32)
					}
				}
				break
			case "Axes":
				for(let i = 0; i < instCount; i++) {
					const data = chunk.Byte()
					values[i] = {
						X: !!(data & 1),
						Y: !!(data & 2),
						Z: !!(data & 4)
					}
				}
				break
			case "BrickColor":
				values = chunk.RBXInterleavedUint32(instCount)
				break
			case "Color3": {
				const red = chunk.RBXInterleavedFloat(instCount)
				const green = chunk.RBXInterleavedFloat(instCount)
				const blue = chunk.RBXInterleavedFloat(instCount)
				for(let i = 0; i < instCount; i++) {
					values[i] = [red[i], green[i], blue[i]]
				}
				break
			}
			case "Vector2": {
				const vecX = chunk.RBXInterleavedFloat(instCount)
				const vecY = chunk.RBXInterleavedFloat(instCount)
				for(let i = 0; i < instCount; i++) {
					values[i] = [vecX[i], vecY[i]]
				}
				break
			}
			case "Vector3": {
				const vecX = chunk.RBXInterleavedFloat(instCount)
				const vecY = chunk.RBXInterleavedFloat(instCount)
				const vecZ = chunk.RBXInterleavedFloat(instCount)
				for(let i = 0; i < instCount; i++) {
					values[i] = [vecX[i], vecY[i], vecZ[i]]
				}
				break
			}
			// case "Vector2int16": break // Not used anywhere?
			case "CFrame": {
				for(let vi = 0; vi < instCount; vi++) {
					const value = values[vi] = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]
					const type = chunk.Byte()

					if(type !== 0) {
						const right = RBXBinParser.Faces[Math.floor((type - 1) / 6)]
						const up = RBXBinParser.Faces[Math.floor(type - 1) % 6]
						const back = [
							right[1] * up[2] - up[1] * right[2],
							right[2] * up[0] - up[2] * right[0],
							right[0] * up[1] - up[0] * right[1]
						]

						for(let i = 0; i < 3; i++) {
							value[3 + i * 3] = right[i]
							value[4 + i * 3] = up[i]
							value[5 + i * 3] = back[i]
						}
					} else {
						for(let i = 0; i < 9; i++) {
							value[i + 3] = chunk.FloatLE()
						}
					}
				}

				const vecX = chunk.RBXInterleavedFloat(instCount)
				const vecY = chunk.RBXInterleavedFloat(instCount)
				const vecZ = chunk.RBXInterleavedFloat(instCount)
				for(let i = 0; i < instCount; i++) {
					values[i][0] = vecX[i]
					values[i][1] = vecY[i]
					values[i][2] = vecZ[i]
				}
				break
			}
			// case "Quaternion": break // Not used anywhere?
			case "Enum":
				values = chunk.RBXInterleavedUint32(instCount)
				break
			case "Instance": {
				const refIds = chunk.RBXInterleavedInt32(instCount)

				let refId = 0
				for(let i = 0; i < instCount; i++) {
					refId += refIds[i]
					values[i] = this.instances[refId]
				}
				break
			}
			// case "Vector3int16": break // Not used anywhere?
			case "NumberSequence": {
				for(let i = 0; i < instCount; i++) {
					const seqLength = chunk.UInt32LE()
					const seq = values[i] = []

					for(let j = 0; j < seqLength; j++) {
						seq.push({
							Time: chunk.FloatLE(),
							Value: chunk.FloatLE(),
							Envelope: chunk.FloatLE()
						})
					}
				}
				break
			}
			case "ColorSequence":
				for(let i = 0; i < instCount; i++) {
					const seqLength = chunk.UInt32LE()
					const seq = values[i] = []

					for(let j = 0; j < seqLength; j++) {
						seq.push({
							Time: chunk.FloatLE(),
							Color: [chunk.FloatLE(), chunk.FloatLE(), chunk.FloatLE()],
							EnvelopeMaybe: chunk.FloatLE()
						})
					}
				}
				break
			case "NumberRange":
				for(let i = 0; i < instCount; i++) {
					values[i] = {
						Min: chunk.FloatLE(),
						Max: chunk.FloatLE()
					}
				}
				break
			case "Rect2D": {
				const x0 = chunk.RBXInterleavedFloat(instCount)
				const y0 = chunk.RBXInterleavedFloat(instCount)
				const x1 = chunk.RBXInterleavedFloat(instCount)
				const y1 = chunk.RBXInterleavedFloat(instCount)

				for(let i = 0; i < instCount; i++) {
					values[i] = [x0[i], y0[i], x1[i], y1[i]]
				}
				break
			}
			case "PhysicalProperties":
				for(let i = 0; i < instCount; i++) {
					const enabled = chunk.Byte() !== 0
					values[i] = {
						CustomPhysics: enabled,
						Density: enabled ? chunk.RBXFloatLE() : null,
						Friction: enabled ? chunk.RBXFloatLE() : null,
						Elasticity: enabled ? chunk.RBXFloatLE() : null,
						FrictionWeight: enabled ? chunk.RBXFloatLE() : null,
						ElasticityWeight: enabled ? chunk.RBXFloatLE() : null
					}
				}
				break
			case "Color3uint8": {
				const rgb = chunk.Array(instCount * 3)

				for(let i = 0; i < instCount; i++) {
					values[i] = [rgb[i] / 255, rgb[i + instCount] / 255, rgb[i + instCount * 2] / 255]
				}
				break
			}
			case "int64": { // Two's complement
				const bytes = chunk.Array(instCount * 8)

				for(let i = 0; i < instCount; i++) {
					let byte0 = bytes[i + instCount * 0] * (256 ** 3) + bytes[i + instCount * 1] * (256 ** 2) +
								bytes[i + instCount * 2] * 256 + bytes[i + instCount * 3]
					
					let byte1 = bytes[i + instCount * 4] * (256 ** 3) + bytes[i + instCount * 5] * (256 ** 2) +
								bytes[i + instCount * 6] * 256 + bytes[i + instCount * 7]
					
					const neg = byte1 % 2
					byte1 = (byte0 % 2) * (2 ** 31) + (byte1 + neg) / 2
					byte0 = Math.floor(byte0 / 2)

					if(byte0 < 2097152) {
						const value = byte0 * (256 ** 4) + byte1
						values[i] = String(neg ? -value : value)
					} else { // Slow path
						let result = ""

						while(byte1 || byte0) {
							const cur0 = byte0
							const res0 = cur0 % 10
							byte0 = (cur0 - res0) / 10

							const cur1 = byte1 + res0 * (256 ** 4)
							const res1 = cur1 % 10
							byte1 = (cur1 - res1) / 10

							result = res1 + result
						}

						values[i] = (neg ? "-" : "") + (result || "0")
					}
				}
				break
			}
			case "SharedString":
				for(let i = 0; i < instCount; i++) {
					values[i] = this.sharedStrings[chunk.UInt32LE()].value
				}
				break
			default:
				console.warn(`[ParseRBXBin] Unimplemented dataType '${typeName}' for ${group.ClassName}.${prop}`)
			}

			values.forEach((value, i) => {
				group.Objects[i].setProperty(prop, value, typeName)
			})
		}

		parsePRNT(chunk) {
			chunk.Byte()
			const parentCount = chunk.UInt32LE()
			const childIds = chunk.RBXInterleavedInt32(parentCount)
			const parentIds = chunk.RBXInterleavedInt32(parentCount)

			let childId = 0
			let parentId = 0
			for(let i = 0; i < parentCount; i++) {
				childId += childIds[i]
				parentId += parentIds[i]

				const child = this.instances[childId]
				if(parentId === -1) {
					this.result.push(child)
				} else {
					child.setProperty("Parent", this.instances[parentId], "Instance")
				}
			}
		}
	}
	RBXBinParser.HeaderBytes = [0x3C, 0x72, 0x6F, 0x62, 0x6C, 0x6F, 0x78, 0x21, 0x89, 0xFF, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00]
	RBXBinParser.Faces = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [-1, 0, 0], [0, -1, 0], [0, 0, -1]]
	RBXBinParser.DataTypes = [
		null, "string", "bool", "int", "float", "double", "UDim", "UDim2",
		"Ray", "Faces", "Axes", "BrickColor", "Color3", "Vector2", "Vector3", "Vector2int16",
		"CFrame", "Quaternion", "Enum", "Instance", "Vector3int16", "NumberSequence", "ColorSequence", "NumberRange",
		"Rect2D", "PhysicalProperties", "Color3uint8", "int64", "SharedString"
	]

	class ModelParser {
		parse(buffer) {
			assert(buffer.byteLength >= 9, "Not a balid RBXM file (too small)")

			let format
			if(typeof buffer === "string" && !buffer.startsWith("<roblox ")) {
				format = "xml"
			} else {
				if(typeof buffer === "string") { buffer = new TextEncoder().encode(buffer).buffer }
				const reader = new ByteReader(buffer)
				assert(reader.String(7) === "<roblox", "Not a valid RBXM file (invalid header)")
				format = reader.Byte() === 0x21 ? "bin" : "xml"
			}

			return format === "xml"
				? this.parseXml($.bufferToStr(buffer))
				: this.parseBin(buffer)
		}

		parseXml(str) { return new RBXXmlParser().parse(str) }
		parseBin(buffer) { return new RBXBinParser().parse(buffer) }
	}

	class MeshParser {
		parse(buffer) {
			const reader = new ByteReader(buffer)
			assert(reader.String(8) === "version ", "Invalid mesh file")

			const version = reader.String(4)
			switch(version) {
			case "1.00":
			case "1.01":
				return this.parseText($.bufferToStr(buffer))
			case "2.00":
				return this.parseBin(buffer, 2)
			case "3.00":
				return this.parseBin(buffer, 3)
			default:
				throw new Error("Unsupported mesh version")
			}
		}

		parseText(str) {
			const lines = str.split(/\r?\n/)
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

		parseBin(buffer, version = 2) {
			const reader = new ByteReader(buffer)
			assert(reader.String(12) === `version ${version}.00`, "Bad header")

			const newline = reader.Byte()
			assert(newline === 0x0A || newline === 0x0D && reader.Byte() === 0x0A, "Bad newline")

			const begin = reader.GetIndex()
			
			let headerSize
			let vertexSize
			let faceSize
			let lodSize

			let vertexCount
			let faceCount
			let lodCount

			if(version === 2) {
				headerSize = reader.UInt16LE()
				assert(headerSize >= 12, `Invalid header size ${headerSize}`)

				vertexSize = reader.Byte()
				faceSize = reader.Byte()

				lodCount = 2
				vertexCount = reader.UInt32LE()
				faceCount = reader.UInt32LE()
			} else {
				headerSize = reader.UInt16LE()
				assert(headerSize >= 16, `Invalid header size ${headerSize}`)

				vertexSize = reader.Byte()
				faceSize = reader.Byte()
				lodSize = reader.UInt16LE()
				assert(lodSize === 4, `Invalid lod size ${lodSize}`)

				lodCount = reader.UInt16LE()
				vertexCount = reader.UInt32LE()
				faceCount = reader.UInt32LE()
			}

			assert(vertexSize >= 32, `Invalid vertex size ${vertexSize}`)
			assert(faceSize >= 12, `Invalid face size ${faceSize}`)

			const headerEnd = begin + headerSize
			const vertexEnd = headerEnd + vertexSize * vertexCount
			const faceEnd = vertexEnd + faceSize * faceCount
			const fileEnd = version === 3 ? faceEnd + lodSize * lodCount : faceEnd

			assert(fileEnd === reader.GetLength(), `Invalid file size (expected ${fileEnd}, got ${reader.GetLength()})`)

			const meshLods = []
			let lodLevels

			if(version === 3) {
				reader.SetIndex(faceEnd)

				lodLevels = []
				for(let i = 0; i < lodCount; i++) {
					lodLevels.push(reader.UInt32LE())
				}
			} else {
				lodLevels = [0, faceCount]
			}

			for(let lod = 1; lod < lodCount; lod++) {
				const faceOffset = lodLevels[lod - 1]
				const realFaceCount = lodLevels[lod] - faceOffset
				
				const faces = new Uint32Array(realFaceCount * 3)
				let vertexMin = Infinity
				let vertexMax = -Infinity

				reader.SetIndex(vertexEnd + faceOffset * faceSize)
				for(let i = 0; i < realFaceCount; i++) {
					const i0 = faces[i * 3] = reader.UInt32LE()
					const i1 = faces[i * 3 + 1] = reader.UInt32LE()
					const i2 = faces[i * 3 + 2] = reader.UInt32LE()

					if(i2 > vertexMax) { vertexMax = i2 }
					if(i1 > vertexMax) { vertexMax = i1 }
					if(i0 > vertexMax) { vertexMax = i0 }
					if(i0 < vertexMin) { vertexMin = i0 }
					if(i1 < vertexMin) { vertexMin = i1 }
					if(i2 < vertexMin) { vertexMin = i2 }

					if(faceSize !== 12) {
						reader.Jump(faceSize - 12)
					}
				}

				for(let i = 0; i < realFaceCount; i++) {
					faces[i] -= vertexMin
				}

				const realVertexCount = (vertexMax - vertexMin) + 1

				const vertices = new Float32Array(realVertexCount * 3)
				const normals = new Float32Array(realVertexCount * 3)
				const uvs = new Float32Array(realVertexCount * 2)

				reader.SetIndex(headerEnd + vertexMin * vertexSize)
				for(let i = 0; i < realVertexCount; i++) {
					vertices[i * 3] = reader.FloatLE()
					vertices[i * 3 + 1] = reader.FloatLE()
					vertices[i * 3 + 2] = reader.FloatLE()

					normals[i * 3] = reader.FloatLE()
					normals[i * 3 + 1] = reader.FloatLE()
					normals[i * 3 + 2] = reader.FloatLE()

					uvs[i * 2] = reader.FloatLE()
					uvs[i * 2 + 1] = 1 - reader.FloatLE()

					if(vertexSize !== 32) {
						reader.Jump(vertexSize - 32)
					}
				}

				meshLods.push({ vertices, normals, uvs, faces })
				break // We only need the first lod level
			}

			return meshLods[0]
		}
	}

	class AnimationParser {
		static CFrameToQuat(cf) {
			const trace = cf[3] + cf[7] + cf[11]
			let qw
			let qx
			let qy
			let qz
			
			if(trace > 0) {
				const S = Math.sqrt(1 + trace) * 2
				qw = S / 4
				qx = (cf[10] - cf[8]) / S
				qy = (cf[5] - cf[9]) / S
				qz = (cf[6] - cf[4]) / S
			} else if ((cf[3] > cf[7]) && (cf[3] > cf[11])) {
				const S = Math.sqrt(1.0 + cf[3] - cf[7] - cf[11]) * 2
				qw = (cf[10] - cf[8]) / S
				qx = S / 4
				qy = (cf[4] + cf[6]) / S
				qz = (cf[5] + cf[9]) / S
			} else if (cf[7] > cf[11]) {
				const S = Math.sqrt(1.0 + cf[7] - cf[3] - cf[11]) * 2
				qw = (cf[5] - cf[9]) / S
				qx = (cf[4] + cf[6]) / S
				qy = S / 4
				qz = (cf[8] + cf[10]) / S
			} else {
				const S = Math.sqrt(1.0 + cf[11] - cf[3] - cf[7]) * 2
				qw = (cf[6] - cf[4]) / S
				qx = (cf[5] + cf[9]) / S
				qy = (cf[8] + cf[10]) / S
				qz = S / 4
			}

			return [qx, qy, qz, qw]
		}

		parse(sequence) {
			if(Array.isArray(sequence)) { sequence = sequence[0] }

			assert(sequence instanceof Instance, "sequence is not an Instance")
			assert(sequence.ClassName === "KeyframeSequence", "sequence is not a KeyframeSequence")
			
			const keyframes = sequence.Children
				.filter(x => x.ClassName === "Keyframe")
				.sort((a, b) => a.Time - b.Time)
			
			this.result = {
				length: keyframes[keyframes.length - 1].Time,
				loop: !!sequence.Loop,
				keyframes: {}
			}

			keyframes.forEach(keyframe => {
				keyframe.Children.forEach(rootPose => {
					if(rootPose.ClassName !== "Pose") { return }
					rootPose.Children.forEach(pose => this.parsePose(pose, keyframe))
				})
			})

			return this.result
		}

		parsePose(pose, keyframe) {
			if(pose.ClassName !== "Pose") { return }

			const name = pose.Name
			const cf = pose.CFrame
			if(!this.result.keyframes[name]) { this.result.keyframes[name] = [] }
			
			this.result.keyframes[name].push({
				time: keyframe.Time,
				pos: [cf[0], cf[1], cf[2]],
				rot: AnimationParser.CFrameToQuat(cf),
				easingdir: pose.EasingDirection,
				easingstyle: pose.EasingStyle
			})

			pose.Children.forEach(child => this.parsePose(child, keyframe))
		}
	}

	return {
		ByteReader,
		Instance,
		ModelParser,
		MeshParser,
		AnimationParser
	}
})()
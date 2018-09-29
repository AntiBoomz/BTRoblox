"use strict"

const RBXParser = (() => {
	const assert = (bool, ...msg) => {
		if(!bool) { throw new Error(...msg) }
	}

	class ByteReader extends Uint8Array {
		static ParseFloat(long) {
			const exp = (long >> 23) & 255
			if(exp === 0) { return 0 }
			const float = 2 ** (exp - 127) * (1 + (long & 0x7FFFFF) / 0x7FFFFF)
			return long > 0x7FFFFFFF ? -float : float
		}

		static ParseDouble(long0, long1) {
			const exp = (long0 >> 20) & 2047
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
						if(lenByte !== 0xFF) { break }
					}
				}

				for(let i = 0; i < litLen; i++) {
					data[index++] = this.Byte()
				}

				if(index >= decomLength) { break }

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

			assert(start + comLength === this.index, "[ByteReader.LZ4] Invalid LZ4, bad end index")
			return data
		}

		// RBXInterleaved

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
				ByteReader.ParseFloat((value >> 1) + ((value & 1) * 2147483648))
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
				case "color3uint8": return inst.setProperty(name, [(+value >> 16 & 255) / 255, (+value >> 8 & 255) / 255, (+value & 255) / 255], "Color3")
				case "coordinateframe": {
					const cframe = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]
					Object.values(propNode.children).forEach(x => {
						const index = RBXXmlParser.CFrameTransform.indexOf(x.nodeName.toUpperCase())
						if(index !== -1) {
							cframe[index] = +x.textContent
						}
					})

					return inst.setProperty(name, cframe, "CFrame")
				}
				case "vector3": {
					const vector3 = [0, 0, 0]
					Object.values(propNode.children).forEach(x => {
						const index = RBXXmlParser.Vector3Transform.indexOf(x.nodeName.toUpperCase())
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
				default: console.warn(`[ParseRBXXml] Unknown dataType ${propNode.nodeName} for ${inst.ClassName}.${name}`, propNode.innerHTML)
				}
			})
		}
	}
	RBXXmlParser.CFrameTransform = ["X", "Y", "Z", "R00", "R01", "R02", "R10", "R11", "R12", "R20", "R21", "R22"]
	RBXXmlParser.Vector3Transform = ["X", "Y", "Z"]

	class RBXBinParser {
		// http://www.classy-studios.com/Downloads/RobloxFileSpec.pdf
		parse(buffer) {
			const reader = this.reader = new ByteReader(buffer)
			if(!reader.Match(RBXBinParser.HeaderBytes)) { console.warn("[ParseRBXBin] Header bytes did not match (Did binary format change?)") }

			const groupsCount = reader.UInt32LE()
			const instancesCount = reader.UInt32LE()
			reader.Jump(8)

			this.result = []
			this.groups = new Array(groupsCount)
			this.instances = new Array(instancesCount)

			for(let n = 0; n < groupsCount; n++) { this.parseINST() }
			while(reader.PeekString(4) === "PROP") { this.parsePROP() }
			this.parsePRNT()

			assert(reader.String(3) === "END", "[ParseRBXBin] Invalid or missing END")
			if(!reader.Match(RBXBinParser.FooterBytes)) { console.warn("[ParseRBXBin] Footer bytes did not match (Did binary format change?)") }
			if(reader.GetRemaining() > 0) { console.warn("[ParseRBXBin] Unexpected data after END") }

			return this.result
		}

		parseINST() {
			assert(this.reader.String(4) === "INST", "[ParseRBXBin] Invalid or missing INST")
			const sub = new ByteReader(this.reader.LZ4())

			const groupId = sub.UInt32LE()
			const className = sub.String(sub.UInt32LE())
			sub.Byte() // bool IsService
			const instCount = sub.UInt32LE()
			const instIds = sub.RBXInterleavedInt32(instCount)

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

		parsePROP() {
			assert(this.reader.String(4) === "PROP", "Invalid or missing PROP")
			const sub = new ByteReader(this.reader.LZ4())

			const group = this.groups[sub.UInt32LE()]
			const prop = sub.String(sub.UInt32LE())
			const dataType = sub.Byte()
			const typeName = RBXBinParser.DataTypes[dataType]

			if(!typeName) {
				console.warn(`[ParseRBXBin] Unknown dataType 0x${dataType.toString(16).toUpperCase()} for ${group.ClassName}.${prop}`)
				return
			}

			let values = []
			switch(typeName) {
			case "string":
				while(sub.GetRemaining() > 0) {
					values.push(sub.String(sub.UInt32LE()))
				}
				break
			case "bool":
				while(sub.GetRemaining() > 0) {
					values.push(sub.Byte() === 0x1)
				}
				break
			case "int":
				values = sub.RBXInterleavedInt32(sub.GetRemaining() / 4)
				break
			case "float":
				values = sub.RBXInterleavedFloat(sub.GetRemaining() / 4)
				break
			case "double":
				while(sub.GetRemaining() > 0) {
					values.push(ByteReader.ParseDouble(sub.UInt32LE(), sub.UInt32LE()))
				}
				break
			case "UDim": {
				const count = sub.GetRemaining() / 8
				const scale = sub.RBXInterleavedFloat(count)
				const offset = sub.RBXInterleavedInt32(count)
				for(let i = 0; i < count; i++) {
					values[i] = [scale[i], offset[i]]
				}
				break
			}
			case "UDim2": {
				const count = sub.GetRemaining() / 16
				const scaleX = sub.RBXInterleavedFloat(count)
				const scaleY = sub.RBXInterleavedFloat(count)
				const offsetX = sub.RBXInterleavedInt32(count)
				const offsetY = sub.RBXInterleavedInt32(count)
				for(let i = 0; i < count; i++) {
					values[i] = [
						[scaleX[i], offsetX[i]],
						[scaleY[i], offsetY[i]]
					]
				}
				break
			}
			case "Ray": {
				const count = sub.GetRemaining() / 24
				for(let i = 0; i < count; i++) {
					values[i] = [
						[sub.FloatLE(), sub.FloatLE(), sub.FloatLE()],
						[sub.FloatLE(), sub.FloatLE(), sub.FloatLE()]
					]
				}
				break
			}
			case "BrickColor":
				values = sub.RBXInterleavedUint32(sub.GetRemaining() / 4)
				break
			case "Color3": {
				const count = sub.GetRemaining() / 12
				const red = sub.RBXInterleavedFloat(count)
				const green = sub.RBXInterleavedFloat(count)
				const blue = sub.RBXInterleavedFloat(count)
				for(let i = 0; i < count; i++) {
					values[i] = [red[i], green[i], blue[i]]
				}
				break
			}
			case "Vector2": {
				const count = sub.GetRemaining() / 8
				const vecX = sub.RBXInterleavedFloat(count)
				const vecY = sub.RBXInterleavedFloat(count)
				for(let i = 0; i < count; i++) {
					values[i] = [vecX[i], vecY[i]]
				}
				break
			}
			case "Vector3": {
				const count = sub.GetRemaining() / 12
				const vecX = sub.RBXInterleavedFloat(count)
				const vecY = sub.RBXInterleavedFloat(count)
				const vecZ = sub.RBXInterleavedFloat(count)
				for(let i = 0; i < count; i++) {
					values[i] = [vecX[i], vecY[i], vecZ[i]]
				}
				break
			}
			case "CFrame": {
				let count = 0
				while(sub.GetRemaining() > count * 12) {
					const value = values[count++] = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]
					const type = sub.Byte()

					if(type !== 0) {
						const cframe = RBXBinParser.ShortCFrames[type]
						assert(cframe, "[ParseRBXBin] Invalid shorthand CFrame")
						for(let i = 0; i < 9; i++) { value[i + 3] = cframe[i] }
					} else {
						for(let i = 0; i < 9; i++) { value[i + 3] = sub.FloatLE() }
					}
				}

				const vecX = sub.RBXInterleavedFloat(count)
				const vecY = sub.RBXInterleavedFloat(count)
				const vecZ = sub.RBXInterleavedFloat(count)
				for(let i = 0; i < count; i++) {
					values[i][0] = vecX[i]
					values[i][1] = vecY[i]
					values[i][2] = vecZ[i]
				}
				break
			}
			case "Enum": {
				const count = sub.GetRemaining() / 4
				values = sub.RBXInterleavedUint32(count)
				break
			}
			case "Instance": {
				const count = sub.GetRemaining() / 4
				const refIds = sub.RBXInterleavedInt32(count)

				let refId = 0
				for(let i = 0; i < count; i++) {
					refId += refIds[i]
					values[i] = this.instances[refId]
				}
				break
			}
			case "Rect2D": {
				const count = sub.GetRemaining() / 16
				const x0 = sub.RBXInterleavedFloat(count)
				const y0 = sub.RBXInterleavedFloat(count)
				const x1 = sub.RBXInterleavedFloat(count)
				const y1 = sub.RBXInterleavedFloat(count)
				for(let i = 0; i < count; i++) {
					values[i] = [x0[i], y0[i], x1[i], y1[i]]
				}
				break
			}
			case "PhysicalProperties": {
				let i = 0
				while(sub.GetRemaining()) {
					const enabled = sub.Byte() === 1
					values[i++] = {
						CustomPhysics: enabled,
						Density: enabled ? sub.FloatLE() : null,
						Friction: enabled ? sub.FloatLE() : null,
						Elasticity: enabled ? sub.FloatLE() : null,
						FrictionWeight: enabled ? sub.FloatLE() : null,
						ElasticityWeight: enabled ? sub.FloatLE() : null
					}
				}
				break
			}
			case "Color3uint8": {
				const count = sub.GetRemaining() / 3
				const rgb = sub.Array(sub.GetRemaining())

				for(let i = 0; i < count; i++) {
					values[i] = [rgb[i] / 255, rgb[i + count] / 255, rgb[i + count * 2] / 255]
				}
				break
			}
			case "int64": { // Two's complement
				const count = sub.GetRemaining() / 8
				const bytes = sub.Array(sub.GetRemaining())

				for(let i = 0; i < count; i++) {
					const neg = bytes[i + count * 7] % 2
					const add = (bytes[i + count * 6] * 256 + bytes[i + count * 7] + neg) / 2

					let value = 0
					for(let j = 0; j < 6; j++) {
						value = value * 256 + bytes[i + count * j]
					}

					if(value >= 274877906943) {
						let part0 = +(String(value).slice(0, -10) || 0)
						let part1 = +(String(value).slice(-10) || 0)

						part0 *= 32768
						part1 = part1 * 32768 + add

						if(part1 >= 1e10) {
							part0 += Math.floor(part1 / 1e10)
							part1 %= 1e10
						}

						part1 = ("0".repeat(10) + String(part1)).slice(-10)
						value = (neg ? "-" : "") + String(part0) + part1
					} else {
						value = value * 32768 + add
						value = String(neg ? -value : value)
					}

					values[i] = value
				}

				break
			}
			default: console.warn(`[ParseRBXBin] Unimplemented dataType '${typeName}' for ${group.ClassName}.${prop}`)
			}

			values.forEach((value, i) => {
				group.Objects[i].setProperty(prop, value, typeName)
			})
		}

		parsePRNT() {
			assert(this.reader.String(4) === "PRNT", "Invalid or missing PRNT")
			const sub = new ByteReader(this.reader.LZ4())

			sub.Byte()
			const parentCount = sub.UInt32LE()
			const childIds = sub.RBXInterleavedInt32(parentCount)
			const parentIds = sub.RBXInterleavedInt32(parentCount)

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
	RBXBinParser.FooterBytes = [0x00, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3C, 0x2F, 0x72, 0x6F, 0x62, 0x6C, 0x6F, 0x78, 0x3E]
	RBXBinParser.ShortCFrames = [null, null, [1, 0, 0, 0, 1, 0, 0, 0, 1], [1, 0, 0, 0, 0, -1, 0, 1, 0], null, [1, 0, 0, 0, -1, 0, 0, 0, -1], [1, 0, 0, 0, 0, 1, 0, -1, 0], [0, 1, 0, 1, 0, 0, 0, 0, -1], null, [0, 0, 1, 1, 0, 0, 0, 1, 0], [0, -1, 0, 1, 0, 0, 0, 0, 1], null, [0, 0, -1, 1, 0, 0, 0, -1, 0], [0, 1, 0, 0, 0, 1, 1, 0, 0], [0, 0, -1, 0, 1, 0, 1, 0, 0], null, [0, -1, 0, 0, 0, -1, 1, 0, 0], [0, 0, 1, 0, -1, 0, 1, 0, 0], null, null, [-1, 0, 0, 0, 1, 0, 0, 0, -1], [-1, 0, 0, 0, 0, 1, 0, 1, 0], null, [-1, 0, 0, 0, -1, 0, 0, 0, 1], [-1, 0, 0, 0, 0, -1, 0, -1, 0], [0, 1, 0, -1, 0, 0, 0, 0, 1], null, [0, 0, -1, -1, 0, 0, 0, 1, 0], [0, -1, 0, -1, 0, 0, 0, 0, -1], null, [0, 0, 1, -1, 0, 0, 0, -1, 0], [0, 1, 0, 0, 0, -1, -1, 0, 0], [0, 0, 1, 0, 1, 0, -1, 0, 0], null, [0, -1, 0, 0, 0, 1, -1, 0, 0], [0, 0, -1, 0, -1, 0, -1, 0, 0]]
	RBXBinParser.DataTypes = [
		null, "string", "bool", "int", "float", "double", "UDim", "UDim2", "Ray", null, null, "BrickColor", "Color3", "Vector2", "Vector3", null, // 0x0F
		"CFrame", null, "Enum", "Instance", null, "NumberSequence", "ColorSequence", "NumberRange", "Rect2D", "PhysicalProperties", "Color3uint8", "int64", null, null, null, null // 0x1F
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
				return this.parseBin(buffer)
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
				vertices[i * 3] = reader.FloatLE()
				vertices[i * 3 + 1] = reader.FloatLE()
				vertices[i * 3 + 2] = reader.FloatLE()

				normals[i * 3] = reader.FloatLE()
				normals[i * 3 + 1] = reader.FloatLE()
				normals[i * 3 + 2] = reader.FloatLE()

				uvs[i * 2] = reader.FloatLE()
				uvs[i * 2 + 1] = 1 - reader.FloatLE()

				reader.Jump(vertexSize - 32)
			}

			for(let i = 0; i < faceCount; i++) {
				faces[i * 3] = reader.UInt32LE()
				faces[i * 3 + 1] = reader.UInt32LE()
				faces[i * 3 + 2] = reader.UInt32LE()

				reader.Jump(faceSize - 12)
			}

			if(reader.GetRemaining() > 0) { console.warn("Leftover data in mesh") }
			return { vertices, normals, uvs, faces }
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
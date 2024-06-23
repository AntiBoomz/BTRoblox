"use strict"

const RBXDataTypes = [
	"Unknown", "string", "bool", "int", "float", "double", "UDim", "UDim2", "Ray", "Faces", "Axes", "BrickColor", "Color3",
	"Vector2", "Vector3", "Vector2int16", "CFrame", "Quaternion", "Enum", "Instance", "Vector3int16", "NumberSequence",
	"ColorSequence", "NumberRange", "Rect2D", "PhysicalProperties", "Color3uint8", "int64", "SharedString", "UnknownScriptFormat",
	"Optional", "UniqueId", "Font", "SecurityCapabilities"
]

const RBXInstanceUtils = {
	findFirstChild(target, name, recursive = false) {
		const children = target instanceof RBXInstance ? target.Children : target
		
		for(const child of children) {
			if(child.getProperty("Name") === name) {
				return child
			}
		}
		
		if(recursive) {
			const arrays = [children]
			
			while(arrays.length) {
				for(const desc of arrays.shift()) {
					if(desc.getProperty("Name") === name) {
						return desc
					}
					
					if(desc.Children.length) {
						arrays.push(desc.Children)
					}
				}
			}
		}
		
		return null
	},
	
	findFirstChildOfClass(target, className, recursive = false) {
		const children = target instanceof RBXInstance ? target.Children : target
		
		for(const child of children) {
			if(child.getProperty("ClassName") === className) {
				return child
			}
		}
		
		if(recursive) {
			const arrays = [children]
			
			while(arrays.length) {
				for(const desc of arrays.shift()) {
					if(desc.getProperty("ClassName") === className) {
						return desc
					}
					
					if(desc.Children.length) {
						arrays.push(desc.Children)
					}
				}
			}
		}
		
		return null
	}
}

class RBXInstanceArray extends Array {
	findFirstChild(...args) { return RBXInstanceUtils.findFirstChild(this, ...args) }
	findFirstChildOfClass(...args) { return RBXInstanceUtils.findFirstChildOfClass(this, ...args) }
}

class RBXInstance {
	constructor(className) {
		assert(typeof className === "string", "className is not a string")
		
		this.Children = []
		this.Properties = {}

		this.setProperty("ClassName", className, "string")
	}

	setProperty(name, value, type) {
		assert(type != null || value == null, "type cant be null")
		assert(type == null || RBXDataTypes.includes(type), `invalid type ${type}`)
		
		const canSet = name !== "Children" && name !== "Properties" && !(name in Object.getPrototypeOf(this))
		
		if(type == null) {
			delete this.Properties[name]
			if(canSet) { delete this[name] }
		} else {
			this.Properties[name] = { type, value }
			if(canSet) { this[name] = value }
		}
	}
	
	getProperty(name, caseInsensitive = false) {
		const property = this.Properties[name] || caseInsensitive && Object.entries(this.Properties).find(x => x[0].toLowerCase() === name.toLowerCase())?.[1]
		return property ? property.value : undefined
	}
	
	findFirstChild(...args) { return RBXInstanceUtils.findFirstChild(this, ...args) }
	findFirstChildOfClass(...args) { return RBXInstanceUtils.findFirstChildOfClass(this, ...args) }
}

// http://www.classy-studios.com/Downloads/RobloxFileSpec.pdf

const RBXBinaryParser = {
	HeaderBytes: [0x3C, 0x72, 0x6F, 0x62, 0x6C, 0x6F, 0x78, 0x21, 0x89, 0xFF, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00],
	Faces: [[1, 0, 0], [0, 1, 0], [0, 0, 1], [-1, 0, 0], [0, -1, 0], [0, 0, -1]],
	
	parse(buffer, params) {
		const reader = new ByteReader(buffer)
		
		assert(reader.Match("<roblox"), "[RBXBinaryParser] Not a valid RBXM file")
		assert_warn(reader.Match("\x21\x89\xFF\x0D\x0A\x1A\x0A\x00\x00"), "[RBXBinaryParser] Header bytes did not match (Did binary format change?)")

		const typeCount = reader.UInt32LE()
		const instanceCount = reader.UInt32LE()
		reader.Jump(8)

		const parser = {
			// parser internal data
			instances: new Array(instanceCount),
			types: new Array(typeCount),
			sharedStrings: [],
			
			arrays: [],
			arrayIndex: 0,
			
			// actual output data
			result: new RBXInstanceArray(),
			meta: {}
		}
		
		// preallocate some arrays
		for(let i = 0; i < 10; i++) {
			parser.arrays.push(new Array(256))
		}
		
		// preallocate a buffer that fits the biggest decompressed chunk
		const chunkIndices = []
		let maxChunkSize = 0
		
		while(true) {
			chunkIndices.push(reader.GetIndex())
			
			const chunkType = reader.String(4)
			const [comLength, decomLength] = reader.LZ4Header()
			
			if(comLength > 0) {
				assert(reader.GetRemaining() >= comLength, "[RBXBinaryParser] unexpected eof")
				reader.Jump(comLength)
				
				if(decomLength > maxChunkSize) {
					maxChunkSize = decomLength
				}
			} else {
				assert(reader.GetRemaining() >= decomLength, "[RBXBinaryParser] unexpected eof")
				reader.Jump(decomLength)
			}
			
			if(chunkType === "END\0") {
				break
			}
		}
		
		assert_warn(reader.GetRemaining() === 0, "[RBXBinaryParser] unexpected data after END chunk")
		
		const chunkBuffer = new Uint8Array(maxChunkSize)
		const onProgress = params?.onProgress
		const isAsync = params?.async
		
		parser.promise = (async () => {
			let lastYielded = performance.now()
			
			onProgress?.(0)
			for(let i = 0; i < chunkIndices.length; i++) {
				reader.SetIndex(chunkIndices[i])
				
				const chunkType = reader.String(4)
				const chunkReader = new ByteReader(reader.LZ4(chunkBuffer))
				
				parser.arrayIndex = 0 // reset arrays
				
				switch(chunkType) {
				case "INST":
					this.parseINST(parser, chunkReader)
					break
				case "PROP":
					this.parsePROP(parser, chunkReader)
					break
				case "PRNT":
					this.parsePRNT(parser, chunkReader)
					break
				case "SSTR":
					this.parseSSTR(parser, chunkReader)
					break
				case "META":
					this.parseMETA(parser, chunkReader)
					break
				// case "SIGN":
				// 	break
				case "END\0":
					break
				default:
					console.warn(`[RBXBinaryParser] Unknown chunk '${chunkType}'`)
					console.log(chunkReader)
				}
				
				if(isAsync && performance.now() > lastYielded + 33) {
					onProgress?.(i / chunkIndices.length)
					lastYielded = await new Promise(resolve => requestAnimationFrame(resolve))
				}
			}
			onProgress?.(1)
			
			return parser
		})()
		
		return parser
	},

	parseMETA(parser, chunk) {
		const count = chunk.UInt32LE()

		for(let i = 0; i < count; i++) {
			const key = chunk.String(chunk.UInt32LE())
			const value = chunk.String(chunk.UInt32LE())
			parser.meta[key] = value
		}
		
		assert_warn(chunk.GetRemaining() === 0, "[RBXBinaryParser] META chunk has extra data")
	},
	
	parseSSTR(parser, chunk) {
		const version = chunk.UInt32LE()
		
		if(version === 0) {
			const count = chunk.UInt32LE()
	
			for(let i = 0; i < count; i++) {
				const md5 = chunk.Array(16)
				const length = chunk.UInt32LE()
				const value = chunk.String(length)
	
				parser.sharedStrings[i] = { md5, value }
			}
			
			assert_warn(chunk.GetRemaining() === 0, "[RBXBinaryParser] SSTR chunk has extra data")
		} else {
			console.warn(`[RBXBinaryParser] unknown SSTR version ${version}`)
		}
	},

	parseINST(parser, chunk) {
		const typeId = chunk.UInt32LE()
		const className = chunk.String(chunk.UInt32LE())
		const isService = chunk.Byte()
		const count = chunk.UInt32LE()

		const type = {
			className: className,
			instances: []
		}
		
		parser.types[typeId] = type

		const instanceIds = chunk.RBXInterleavedInt32(count, parser.arrays[parser.arrayIndex++])
		let instanceId = 0
		
		for(let i = 0; i < count; i++) {
			const inst = new RBXInstance(className)
			type.instances.push(inst)
			
			instanceId += instanceIds[i]
			parser.instances[instanceId] = inst
		}
		
		if(isService) {
			let valid = false
			
			if(isService === 1 && chunk.GetRemaining() === count) {
				valid = true
				
				for(let i = 0; i < count; i++) {
					if(chunk[chunk.index + i] !== 1) {
						valid = false
						break
					}
				}
			}
			
			if(valid) {
				chunk.Jump(count)
			} else {
				console.warn(`[RBXBinaryParser] INST chunk ${className}(${count}) isService=${isService} has unexpected trailing data`)
			}
		}
		
		assert_warn(chunk.GetRemaining() === 0, `[RBXBinaryParser] INST chunk ${className}(${count}) isService=${isService} has extra data ${chunk.GetRemaining()}`)
	},

	parsePROP(parser, chunk) {
		const type = parser.types[chunk.UInt32LE()]
		const name = chunk.String(chunk.UInt32LE())
		
		assert(chunk.GetRemaining() > 0, "[RBXBinaryParser] PROP chunk is empty??")
		
		const count = type.instances.length
		const parseProperties = values => {
			const typeIndex = chunk.Byte()
			const typeName = RBXDataTypes[typeIndex] || "Unknown"
			let valueType = typeName
			
			switch(typeName) {
			case "string":
				for(let i = 0; i < count; i++) {
					const len = chunk.UInt32LE()
					values[i] = chunk.String(len)
				}
				break
			case "bool":
				for(let i = 0; i < count; i++) {
					values[i] = chunk.Byte() !== 0
				}
				break
			case "int":
				chunk.RBXInterleavedInt32(count, values)
				for(let i = 0; i < count; i++) {
					values[i] = values[i]
				}
				break
			case "float":
				chunk.RBXInterleavedFloat(count, values)
				for(let i = 0; i < count; i++) {
					values[i] = values[i]
				}
				break
			case "double":
				for(let i = 0; i < count; i++) {
					values[i] = chunk.DoubleLE()
				}
				break
			case "UDim": {
				const scale = chunk.RBXInterleavedFloat(count, parser.arrays[parser.arrayIndex++])
				const offset = chunk.RBXInterleavedInt32(count, parser.arrays[parser.arrayIndex++])
				for(let i = 0; i < count; i++) {
					values[i] = [scale[i], offset[i]]
				}
				break
			}
			case "UDim2": {
				const scaleX = chunk.RBXInterleavedFloat(count, parser.arrays[parser.arrayIndex++])
				const scaleY = chunk.RBXInterleavedFloat(count, parser.arrays[parser.arrayIndex++])
				const offsetX = chunk.RBXInterleavedInt32(count, parser.arrays[parser.arrayIndex++])
				const offsetY = chunk.RBXInterleavedInt32(count, parser.arrays[parser.arrayIndex++])
				for(let i = 0; i < count; i++) {
					values[i] = [
						[scaleX[i], offsetX[i]],
						[scaleY[i], offsetY[i]]
					]
				}
				break
			}
			case "Ray": {
				for(let i = 0; i < count; i++) {
					values[i] = [
						[chunk.RBXFloatLE(), chunk.RBXFloatLE(), chunk.RBXFloatLE()],
						[chunk.RBXFloatLE(), chunk.RBXFloatLE(), chunk.RBXFloatLE()]
					]
				}
				break
			}
			case "Faces":
				for(let i = 0; i < count; i++) {
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
				for(let i = 0; i < count; i++) {
					const data = chunk.Byte()
					
					values[i] = {
						X: !!(data & 1),
						Y: !!(data & 2),
						Z: !!(data & 4)
					}
				}
				break
			case "BrickColor":
				chunk.RBXInterleavedUint32(count, values)
				break
			case "Color3": {
				const r = chunk.RBXInterleavedFloat(count, parser.arrays[parser.arrayIndex++])
				const g = chunk.RBXInterleavedFloat(count, parser.arrays[parser.arrayIndex++])
				const b = chunk.RBXInterleavedFloat(count, parser.arrays[parser.arrayIndex++])
				
				for(let i = 0; i < count; i++) {
					values[i] = [r[i], g[i], b[i]]
				}
				break
			}
			case "Vector2": {
				const vecX = chunk.RBXInterleavedFloat(count, parser.arrays[parser.arrayIndex++])
				const vecY = chunk.RBXInterleavedFloat(count, parser.arrays[parser.arrayIndex++])
				for(let i = 0; i < count; i++) {
					values[i] = [vecX[i], vecY[i]]
				}
				break
			}
			case "Vector3": {
				const vecX = chunk.RBXInterleavedFloat(count, parser.arrays[parser.arrayIndex++])
				const vecY = chunk.RBXInterleavedFloat(count, parser.arrays[parser.arrayIndex++])
				const vecZ = chunk.RBXInterleavedFloat(count, parser.arrays[parser.arrayIndex++])
				for(let i = 0; i < count; i++) {
					values[i] = [vecX[i], vecY[i], vecZ[i]]
				}
				break
			}
			case "Vector2int16": { // Best guess, not used anywhere
				const vecX = chunk.RBXInterleavedInt16(count, parser.arrays[parser.arrayIndex++])
				const vecY = chunk.RBXInterleavedInt16(count, parser.arrays[parser.arrayIndex++])
				for(let i = 0; i < count; i++) {
					values[i] = [vecX[i], vecY[i]]
				}
				break
			}
			case "Vector3int16": { // Best guess, used in TerrainRegion
				const vecX = chunk.RBXInterleavedInt16(count, parser.arrays[parser.arrayIndex++])
				const vecY = chunk.RBXInterleavedInt16(count, parser.arrays[parser.arrayIndex++])
				const vecZ = chunk.RBXInterleavedInt16(count, parser.arrays[parser.arrayIndex++])
				for(let i = 0; i < count; i++) {
					values[i] = [vecX[i], vecY[i], vecZ[i]]
				}
				break
			}
			case "CFrame": {
				for(let vi = 0; vi < count; vi++) {
					const value = values[vi] = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]
					const type = chunk.Byte()
	
					if(type !== 0) {
						const right = this.Faces[Math.floor((type - 1) / 6)]
						const up = this.Faces[Math.floor(type - 1) % 6]
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
						for(let i = 3; i < 12; i++) {
							value[i] = chunk.FloatLE()
						}
					}
				}
	
				const vecX = chunk.RBXInterleavedFloat(count, parser.arrays[parser.arrayIndex++])
				const vecY = chunk.RBXInterleavedFloat(count, parser.arrays[parser.arrayIndex++])
				const vecZ = chunk.RBXInterleavedFloat(count, parser.arrays[parser.arrayIndex++])
				for(let i = 0; i < count; i++) {
					values[i][0] = vecX[i]
					values[i][1] = vecY[i]
					values[i][2] = vecZ[i]
				}
				break
			}
			case "Enum":
				chunk.RBXInterleavedUint32(count, values)
				break
			case "Instance": {
				const refIds = chunk.RBXInterleavedInt32(count, parser.arrays[parser.arrayIndex++])
	
				let refId = 0
				for(let i = 0; i < count; i++) {
					refId += refIds[i]
					values[i] = parser.instances[refId]
				}
				break
			}
			case "NumberSequence": {
				for(let i = 0; i < count; i++) {
					const length = chunk.UInt32LE()
					const sequence = []
	
					for(let j = 0; j < length; j++) {
						sequence.push({
							Time: chunk.FloatLE(),
							Value: chunk.FloatLE(),
							Envelope: chunk.FloatLE()
						})
					}
					
					values[i] = sequence
				}
				break
			}
			case "ColorSequence":
				for(let i = 0; i < count; i++) {
					const length = chunk.UInt32LE()
					const sequence = []
	
					for(let j = 0; j < length; j++) {
						sequence.push({
							Time: chunk.FloatLE(),
							Color: [chunk.FloatLE(), chunk.FloatLE(), chunk.FloatLE()],
							EnvelopeMaybe: chunk.FloatLE()
						})
					}
					
					values[i] = sequence
				}
				break
			case "NumberRange":
				for(let i = 0; i < count; i++) {
					values[i] = [chunk.FloatLE(), chunk.FloatLE()]
				}
				break
			case "Rect2D": {
				const x0 = chunk.RBXInterleavedFloat(count, parser.arrays[parser.arrayIndex++])
				const y0 = chunk.RBXInterleavedFloat(count, parser.arrays[parser.arrayIndex++])
				const x1 = chunk.RBXInterleavedFloat(count, parser.arrays[parser.arrayIndex++])
				const y1 = chunk.RBXInterleavedFloat(count, parser.arrays[parser.arrayIndex++])
	
				for(let i = 0; i < count; i++) {
					values[i] = [[x0[i], y0[i]], [x1[i], y1[i]]]
				}
				break
			}
			case "PhysicalProperties":
				for(let i = 0; i < count; i++) {
					const enabled = chunk.Byte() !== 0
					
					if(enabled) {
						values[i] = {
							Density: chunk.RBXFloatLE(),
							Friction: chunk.RBXFloatLE(),
							Elasticity: chunk.RBXFloatLE(),
							FrictionWeight: chunk.RBXFloatLE(),
							ElasticityWeight: chunk.RBXFloatLE()
						}
					} else {
						values[i] = false
					}
				}
				break
			case "Color3uint8": {
				const rgbs = chunk.Array(count * 3)
	
				for(let i = 0; i < count; i++) {
					const rgb = values[i]
					values[i] = [rgbs[i] / 255, rgbs[i + count] / 255, rgbs[i + count * 2] / 255]
				}
				
				valueType = "Color3"
				break
			}
			case "int64":
				chunk.RBXInterleavedInt64(count, values)
				for(let i = 0; i < count; i++) {
					values[i] = values[i].toString()
				}
				break
			case "SecurityCapabilities":
				// No clue what format this actually is in.
				// 8 bytes per value, shows up as 0 in xml, so this is either an int64 or uint64
				chunk.RBXInterleavedUint64(count, values)
				for(let i = 0; i < count; i++) {
					values[i] = values[i].toString()
				}
				break
			case "SharedString":
				chunk.RBXInterleavedUint32(count, values)
				for(let i = 0; i < count; i++) {
					values[i] = parser.sharedStrings[values[i]].value
				}
				valueType = "string"
				break
			case "Optional": {
				[, valueType] = parseProperties(values)
				
				const [mask, ] = parseProperties(parser.arrays[parser.arrayIndex++])
				
				for(let i = 0; i < count; i++) {
					if(!mask[i]) {
						values[i] = null
					}
				}
				break
			}
			case "UniqueId": {
				const bytes = chunk.Array(count * 16)
				
				for(let i = 0; i < count; i++) {
					let result = ""
					
					for(let j = 0; j < 16; j++) {
						const byte = bytes[j * count + i]
						result += ("0" + byte.toString(16)).slice(-2)
					}
					
					values[i] = result
				}
				break
			}
			case "Quaternion": // Not used anywhere?
			default:
				if(!typeName) {
					console.warn(`[RBXBinaryParser] Unknown dataType 0x${dataType.toString(16).toUpperCase()} (${dataType}) for ${type.className}.${name}`)
				} else {
					console.warn(`[RBXBinaryParser] Unimplemented dataType '${typeName}' for ${type.className}.${name}`)
				}
				
				for(let i = 0; i < count; i++) {
					values[i] = `<${typeName}>`
				}
				break
			}
			
			return [values, valueType]
		}
		
		const [values, valueType] = parseProperties(parser.arrays[parser.arrayIndex++])
		
		for(let i = 0; i < count; i++) {
			const inst = type.instances[i]
			const value = values[i]
			
			if(value != null) {
				inst.setProperty(name, value, valueType)
			}
		}
		
		assert_warn(chunk.GetRemaining() === 0, `[RBXBinaryParser] PROP ${type.className}.${name}(${count}) valueType=${valueType} has extra data ${chunk.GetRemaining()}`)
	},

	parsePRNT(parser, chunk) {
		chunk.Byte()
		const count = chunk.UInt32LE()
		
		const childIds = chunk.RBXInterleavedInt32(count, parser.arrays[parser.arrayIndex++])
		const parentIds = chunk.RBXInterleavedInt32(count, parser.arrays[parser.arrayIndex++])

		let childId = 0
		let parentId = 0
		for(let i = 0; i < count; i++) {
			childId += childIds[i]
			parentId += parentIds[i]

			const child = parser.instances[childId]
			if(parentId >= 0) {
				const parent = parser.instances[parentId]
				
				child.setProperty("Parent", parent, "Instance")
				parent.Children.push(child)
			} else {
				parser.result.push(child)
			}
		}
		
		assert_warn(chunk.GetRemaining() === 0, "[RBXBinaryParser] PRNT chunk has extra data")
	}
}

const RBXXmlParser = {
	escapeXml(value) {
		return value
			.replace(/&amp;/g, "&amp;&amp;")
			.replace(/&#((?!0?0?38;)\d{1,4}|(?!0?0?26;)x[0-9a-fA-F]{1,4});/g, "&amp;#$1;")
	},
	
	unescapeXml(value) {
		if(value.startsWith("<![CDATA[")) {
			// https://github.com/niklasvh/base64-arraybuffer/blob/master/src/index.ts
			
			const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
			const lookup = new Uint8Array(256)
			
			for (let i = 0; i < chars.length; i++) {
				lookup[chars.charCodeAt(i)] = i
			}
			
			const decodeBase64 = (base64, startIndex, endIndex) => {
				let bufferLength = base64.length * 0.75
				let len = endIndex - startIndex
				let i = startIndex
				let p = 0
				let encoded1
				let encoded2
				let encoded3
				let encoded4

				if (base64[base64.length - 1] === "=") {
					bufferLength--
					if (base64[base64.length - 2] === "=") {
						bufferLength--
					}
				}

				const bytes = new Uint8Array(bufferLength)

				for (; i < len; i += 4) {
					encoded1 = lookup[base64.charCodeAt(i)]
					encoded2 = lookup[base64.charCodeAt(i + 1)]
					encoded3 = lookup[base64.charCodeAt(i + 2)]
					encoded4 = lookup[base64.charCodeAt(i + 3)]

					bytes[p++] = (encoded1 << 2) | (encoded2 >> 4)
					bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2)
					bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63)
				}

				return bytes
			}
			
			return bufferToString(decodeBase64(value, 9, -3))
		}
		
		return value
			.replace(/(?<!&)((?:&{2})*)&#(\d{1,4}|x[0-9a-fA-F]{1,4});/g, (_, prefix, inner) => {
				const byte = inner[0] === "x" ? parseInt(inner.slice(1), 16) : parseInt(inner, 10)
				return `${prefix}${String.fromCharCode(byte)}`
			})
			.replace(/&&/g, "&")
	},

	parse(buffer, params) {
		const xml = new DOMParser().parseFromString(this.escapeXml(bufferToString(buffer)), "text/xml").documentElement

		const parser = {
			// parser internal data
			sharedStrings: {},
			refWait: [],
			refs: {},
			
			// actual output data
			result: new RBXInstanceArray(),
			meta: {}
		}
		
		parser.promise = (async () => {
			for(const child of xml.children) {
				switch(child.nodeName) {
				case "Item":
					parser.result.push(this.parseItem(parser, child))
					break
				case "SharedStrings":
					this.parseSharedStrings(parser, child)
					break
				case "Meta":
					parser.meta[child.attributes.name.value] = child.textContent
					break
				case "External":
					// Do nothing, we don't care about these
					break
				default:
					console.warn(`[RBXXmlParser] unknown node ${child.nodeName}`)
				}
			}
		})()
		
		return parser
	},
	
	parseSharedStrings(parser, sharedStrings) {
		for(const child of Object.values(child.children)) {
			if(child.nodeName !== "SharedString") { continue }
			const md5 = child.getAttribute("md5")
			let value

			try { value = window.atob(child.textContent.trim()) }
			catch(ex) { console.error(ex) }

			if(typeof md5 === "string" && typeof value === "string") {
				parser.sharedStrings[md5] = { md5, value }
			}
		}
	},

	parseItem(parser, node) {
		const inst = new RBXInstance(node.className)
		const referent = node.getAttribute("referent")

		if(referent) {
			parser.refs[referent] = inst
			
			for(const wait of parser.refWait) {
				if(wait.ref === referent) {
					parser.refWait.splice(parser.refWait.indexOf(wait), 1)
					wait.inst.setProperty(wait.name, inst, "Instance")
				}
			}
		}

		for(const childNode of node.children) {
			switch(childNode.nodeName) {
			case "Item": {
				const child = this.parseItem(parser, childNode)
				child.setProperty("Parent", inst, "Instance")
				break
			}
			case "Properties":
				this.parseProperties(parser, inst, childNode)
				break
			}
		}

		return inst
	},
	
	parseProperties(parser, inst, targetNode) {
		const getChildren = node => {
			const children = {}
			
			for(const child of node.children) {
				const descendants = children[child.nodeName] = getChildren(child)
				descendants._node = child
			}
			
			return children
		}
		
		const getValue = (node, def) => ((node ? (node instanceof Node ? node : node._node).childNodes[0]?.nodeValue : null) ?? def)
		
		for(const propNode of targetNode.children) {
			const name = propNode.attributes.name.value
			
			const children = getChildren(propNode)
			const value = getValue(propNode, "")

			switch(propNode.nodeName) {
			case "string":
			case "ProtectedString":
			case "BinaryString":
				inst.setProperty(name, this.unescapeXml(value), "string")
				break
			case "Content":
				inst.setProperty(name, this.unescapeXml(getValue(children.url, "")), "string")
				break
			case "double":
				inst.setProperty(name, +value, "double")
				break
			case "float":
				inst.setProperty(name, +value, "float")
				break
			case "int":
				inst.setProperty(name, +value, "int")
				break
			case "int64":
				inst.setProperty(name, value, "int64")
				break
			case "bool":
				inst.setProperty(name, value === "true", "bool")
				break
			case "token":
				inst.setProperty(name, +value, "Enum")
				break
			case "Color3":
				inst.setProperty(name, [+getValue(children.R, 0), +getValue(children.G, 0), +getValue(children.B, 0)], "Color3")
				break
			case "Color3uint8":
				inst.setProperty(name, [(+value >>> 16 & 255) / 255, (+value >>> 8 & 255) / 255, (+value & 255) / 255], "Color3")
				break
			case "OptionalCoordinateFrame":
				if(children.CFrame) {
					const target = children.CFrame
					
					inst.setProperty(name, [
						+getValue(target.X, 0),   +getValue(target.Y, 0),   +getValue(target.Z, 0),
						+getValue(target.R00, 0), +getValue(target.R01, 0), +getValue(target.R02, 0),
						+getValue(target.R10, 0), +getValue(target.R11, 0), +getValue(target.R12, 0),
						+getValue(target.R20, 0), +getValue(target.R21, 0), +getValue(target.R22, 0),
					], "CFrame")
				}
				break
			case "CoordinateFrame":
				inst.setProperty(name, [
					+getValue(children.X, 0),   +getValue(children.Y, 0),   +getValue(children.Z, 0),
					+getValue(children.R00, 0), +getValue(children.R01, 0), +getValue(children.R02, 0),
					+getValue(children.R10, 0), +getValue(children.R11, 0), +getValue(children.R12, 0),
					+getValue(children.R20, 0), +getValue(children.R21, 0), +getValue(children.R22, 0),
				], "CFrame")
				break
			case "Vector2": 
				inst.setProperty(name, [+getValue(children.X, 0), +getValue(children.Y, 0)], "Vector2")
				break
			case "Vector2int16": 
				inst.setProperty(name, [+getValue(children.X, 0), +getValue(children.Y, 0)], "Vector2int16")
				break
			case "Vector3":
				inst.setProperty(name, [+getValue(children.X, 0), +getValue(children.Y, 0), +getValue(children.Z, 0)], "Vector3")
				break
			case "Vector3int16":
				inst.setProperty(name, [+getValue(children.X, 0), +getValue(children.Y, 0), +getValue(children.Z, 0)], "Vector3int16")
				break
			case "UDim":
				inst.setProperty(name, [+getValue(children.S, 0), +getValue(children.O, 0)], "UDim")
				break
			case "UDim2":
				inst.setProperty(name, [
					[+getValue(children.XS, 0), +getValue(children.XO, 0)],
					[+getValue(children.YS, 0), +getValue(children.YO, 0)],
				], "UDim2")
				break
			case "Rect2D": 
				inst.setProperty(name, [
					[+getValue(children.min?.X, 0), +getValue(children.min?.Y, 0)],
					[+getValue(children.max?.X, 0), +getValue(children.max?.Y, 0)],
				], "Rect2D")
				break
			case "PhysicalProperties":
				if(getValue(children.CustomPhysics) === "true") {
					inst.setProperty(name, {
						Density: +getValue(children.Density, 1),
						Friction: +getValue(children.Friction, 0),
						Elasticity: +getValue(children.Elasticity, 0),
						FrictionWeight: +getValue(children.FrictionWeight, 1),
						ElasticityWeight: +getValue(children.ElasticityWeight, 1)
					}, "PhysicalProperties")
				} else {
					inst.setProperty(name, false, "PhysicalProperties")
				}
				break
			case "Ref":
				if(parser.refs[value]) {
					inst.setProperty(name, parser.refs[value], "Instance")
				} else {
					parser.refWait.push({ inst, name, ref: value })
				}
				break
			case "SharedString":
				inst.setProperty(name, parser.sharedStrings[value].value, "string")
				break
			case "SecurityCapabilities":
				inst.setProperty(name, +value, "SecurityCapabilities")
				break
			case "UniqueId":
				inst.setProperty(name, value, "UniqueId")
				break
			default:
				console.warn(`[ParseRBXXml] Unknown dataType ${propNode.nodeName} for ${inst.ClassName}.${name}`, propNode.innerHTML)
			}
		}
	}
}

const RBXModelParser = {
	parse(buffer, params) {
		const reader = new ByteReader(buffer)
		assert(reader.String(7) === "<roblox", "Not a valid RBXM file")

		if(reader.Byte() === 0x21) {
			return RBXBinaryParser.parse(buffer, params)
		}

		return RBXXmlParser.parse(buffer, params)
	}
}

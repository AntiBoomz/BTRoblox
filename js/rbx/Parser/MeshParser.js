"use strict"

const RBXMeshParser = {
	parse(buffer) {
		const reader = new ByteReader(buffer)
		$.assert(reader.String(8) === "version ", "Invalid mesh file")

		const version = reader.String(4)
		switch(version) {
		case "1.00":
		case "1.01":
			return this.parseText($.bufferToString(buffer))
		case "2.00":
		case "3.00":
		case "3.01":
		case "4.00":
		case "4.01":
		case "5.00":
			return this.parseBin(buffer, version)
		case "6.00":
		case "7.00":
			return this.parseChunked(buffer, version)
		default:
			throw new Error(`Unsupported mesh version '${version}'`)
		}
	},

	parseText(str) {
		const lines = str.split(/\r?\n/)
		$.assert(lines.length === 3, "Invalid mesh version 1 file (Wrong amount of lines)")

		const version = lines[0]
		const faceCount = lines[1]
		const data = lines[2]

		const vectors = data.replace(/\s+/g, "").slice(1, -1).split("][")
		$.assert(vectors.length === faceCount * 9, "Length mismatch")

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

		return { vertices, normals, uvs, faces, lods: [0, faceCount] }
	},
	
	parseBin(buffer, version) {
		const reader = new ByteReader(buffer)
		$.assert(reader.String(12) === `version ${version}`, "Bad header")

		const newline = reader.UInt8()
		$.assert(newline === 0x0A || newline === 0x0D && reader.UInt8() === 0x0A, "Bad newline")

		const begin = reader.GetIndex()
		
		let headerSize
		let vertexSize
		let faceSize = 12
		let lodSize = 4
		let nameTableSize = 0
		let facsDataSize = 0

		let lodCount = 0
		let vertexCount
		let faceCount
		let boneCount = 0
		let subsetCount = 0

		if(version === "2.00") {
			headerSize = reader.UInt16LE()
			$.assert(headerSize >= 12, `Invalid header size ${headerSize}`)

			vertexSize = reader.UInt8()
			faceSize = reader.UInt8()
			vertexCount = reader.UInt32LE()
			faceCount = reader.UInt32LE()
			
		} else if(version.startsWith("3.")) {
			headerSize = reader.UInt16LE()
			$.assert(headerSize >= 16, `Invalid header size ${headerSize}`)

			vertexSize = reader.UInt8()
			faceSize = reader.UInt8()
			lodSize = reader.UInt16LE()
			lodCount = reader.UInt16LE()
			vertexCount = reader.UInt32LE()
			faceCount = reader.UInt32LE()
			
		} else if(version.startsWith("4.")) {
			headerSize = reader.UInt16LE()
			$.assert(headerSize >= 24, `Invalid header size ${headerSize}`)

			reader.Jump(2) // uint16 lodType;
			vertexCount = reader.UInt32LE()
			faceCount = reader.UInt32LE()
			lodCount = reader.UInt16LE()
			boneCount = reader.UInt16LE()
			nameTableSize = reader.UInt32LE()
			subsetCount = reader.UInt16LE()
			reader.Jump(2) // byte numHighQualityLODs, unused;
			
			vertexSize = 40
			
		} else if(version.startsWith("5.")) {
			headerSize = reader.UInt16LE()
			$.assert(headerSize >= 32, `Invalid header size ${headerSize}`)

			reader.Jump(2) // uint16 meshCount;
			vertexCount = reader.UInt32LE()
			faceCount = reader.UInt32LE()
			lodCount = reader.UInt16LE()
			boneCount = reader.UInt16LE()
			nameTableSize = reader.UInt32LE()
			subsetCount = reader.UInt16LE()
			reader.Jump(2) // byte numHighQualityLODs, unused;
			reader.Jump(4) // uint32 facsDataFormat;
			facsDataSize = reader.UInt32LE()
			
			vertexSize = 40
		}
		
		reader.SetIndex(begin + headerSize)
		
		$.assert(vertexSize >= 36, `Invalid vertex size ${vertexSize}`)
		$.assert(faceSize >= 12, `Invalid face size ${faceSize}`)
		$.assert(lodSize >= 4, `Invalid lod size ${lodSize}`)

		const fileEnd = reader.GetIndex()
			+ (vertexCount * vertexSize)
			+ (boneCount > 0 ? vertexCount * 8 : 0)
			+ (faceCount * faceSize)
			+ (lodCount * lodSize)
			+ (boneCount * 60)
			+ (nameTableSize)
			+ (subsetCount * 72)
			+ (facsDataSize)
		
		$.assert(fileEnd === reader.GetLength(), `Invalid file size (expected ${reader.GetLength()}, got ${fileEnd})`)
		
		const faces = new Uint32Array(faceCount * 3)
		const vertices = new Float32Array(vertexCount * 3)
		const normals = new Float32Array(vertexCount * 3)
		const uvs = new Float32Array(vertexCount * 2)
		const tangents = new Float32Array(vertexCount * 4)
		const vertexColors = vertexSize >= 40 ? new Uint8Array(vertexCount * 4) : null
		const lods = []

		const mesh = {
			vertexColors: vertexColors,
			vertices: vertices,
			tangents: tangents,
			normals: normals,
			faces: faces,
			lods: lods,
			uvs: uvs
		}
		
		// Vertex[vertexCount]
		
		for(let i = 0; i < vertexCount; i++) {
			vertices[i * 3] = reader.FloatLE()
			vertices[i * 3 + 1] = reader.FloatLE()
			vertices[i * 3 + 2] = reader.FloatLE()

			normals[i * 3] = reader.FloatLE()
			normals[i * 3 + 1] = reader.FloatLE()
			normals[i * 3 + 2] = reader.FloatLE()

			uvs[i * 2] = reader.FloatLE()
			uvs[i * 2 + 1] = 1 - reader.FloatLE()
			
			// tangents are mapped from [0, 254] to [-1, 1]
			// byte tx, ty, tz, ts;
			
			tangents[i * 4] = reader.UInt8() / 127 - 1
			tangents[i * 4 + 1] = reader.UInt8() / 127 - 1
			tangents[i * 4 + 2] = reader.UInt8() / 127 - 1
			tangents[i * 4 + 3] = reader.UInt8() / 127 - 1
			
			if(vertexColors) {
				// byte r, g, b, a
				vertexColors[i * 4] = reader.UInt8()
				vertexColors[i * 4 + 1] = reader.UInt8()
				vertexColors[i * 4 + 2] = reader.UInt8()
				vertexColors[i * 4 + 3] = reader.UInt8()
				
				reader.Jump(vertexSize - 40)
			} else {
				reader.Jump(vertexSize - 36)
			}
		}
		
		// Envelope[vertexCount]
		
		if(boneCount > 0) {
			mesh.skinIndices = new Uint8Array(vertexCount * 4)
			mesh.skinWeights = new Float32Array(vertexCount * 4)
			
			for(let i = 0; i < vertexCount; i++) {
				mesh.skinIndices[i * 4 + 0] = reader.UInt8()
				mesh.skinIndices[i * 4 + 1] = reader.UInt8()
				mesh.skinIndices[i * 4 + 2] = reader.UInt8()
				mesh.skinIndices[i * 4 + 3] = reader.UInt8()
				mesh.skinWeights[i * 4 + 0] = reader.UInt8() / 255
				mesh.skinWeights[i * 4 + 1] = reader.UInt8() / 255
				mesh.skinWeights[i * 4 + 2] = reader.UInt8() / 255
				mesh.skinWeights[i * 4 + 3] = reader.UInt8() / 255
			}
		}
		
		// Face[faceCount]
		
		for(let i = 0; i < faceCount; i++) {
			faces[i * 3] = reader.UInt32LE()
			faces[i * 3 + 1] = reader.UInt32LE()
			faces[i * 3 + 2] = reader.UInt32LE()

			reader.Jump(faceSize - 12)
		}
		
		// LodLevel[lodCount]
		
		if(lodCount <= 2) {
			// Lod levels are pretty much ignored if lodCount
			// is not at least 3, so we can just skip reading
			// them completely.
			
			lods.push(0, faceCount)
			reader.Jump(lodCount * lodSize)
		} else {
			for(let i = 0; i < lodCount; i++) {
				lods.push(reader.UInt32LE())
				reader.Jump(lodSize - 4)
			}
		}
		
		// Bone[boneCount]

		if(boneCount > 0) {
			const nameTableStart = reader.GetIndex() + boneCount * 60
			
			mesh.bones = new Array(boneCount)
			
			for(let i = 0; i < boneCount; i++) {
				const bone = {}
				
				const nameStart = nameTableStart + reader.UInt32LE()
				const nameEnd = reader.indexOf(0, nameStart)
				
				bone.name = $.bufferToString(reader.subarray(nameStart, nameEnd))
				bone.parent = mesh.bones[reader.UInt16LE()]
				bone.lodParent = mesh.bones[reader.UInt16LE()]
				bone.culling = reader.FloatLE()
				bone.cframe = new Array(12)
				
				for(let i = 0; i < 9; i++) {
					bone.cframe[i + 3] = reader.FloatLE()
				}
				
				for(let i = 0; i < 3; i++) {
					bone.cframe[i] = reader.FloatLE()
				}
				
				mesh.bones[i] = bone
			}
		}
		
		// byte[nameTableSize]

		if(nameTableSize > 0) {
			reader.Jump(nameTableSize)
		}
		
		// MeshSubset[subsetCount]

		if(subsetCount > 0) {
			const boneIndices = []
			
			for(let i = 0; i < subsetCount; i++) {
				reader.UInt32LE() // facesBegin
				reader.UInt32LE() // facesLength
				const vertsBegin = reader.UInt32LE()
				const vertsLength = reader.UInt32LE()
				reader.UInt32LE() // numBoneIndices
				
				for(let i = 0; i < 26; i++) {
					boneIndices[i] = reader.UInt16LE()
				}
				
				const vertsEnd = vertsBegin + vertsLength
				for(let i = vertsBegin; i < vertsEnd; i++) {
					mesh.skinIndices[i * 4 + 0] = boneIndices[mesh.skinIndices[i * 4 + 0]]
					mesh.skinIndices[i * 4 + 1] = boneIndices[mesh.skinIndices[i * 4 + 1]]
					mesh.skinIndices[i * 4 + 2] = boneIndices[mesh.skinIndices[i * 4 + 2]]
					mesh.skinIndices[i * 4 + 3] = boneIndices[mesh.skinIndices[i * 4 + 3]]
				}
			}
		}
		
		// byte[facsDataSize]
		
		if(facsDataSize > 0) {
			reader.Jump(facsDataSize)
		}

		//

		return mesh
	},
	
	parseChunked(buffer, version) {
		const reader = new ByteReader(buffer)
		$.assert(reader.String(12) === `version ${version}`, "Bad header")

		const newline = reader.UInt8()
		$.assert(newline === 0x0A || newline === 0x0D && reader.UInt8() === 0x0A, "Bad newline")
		
		const mesh = {}
		
		while(reader.GetRemaining() >= 16) {
			const chunkType = reader.String(8)
			const chunkVersion = reader.UInt32LE()
			const chunkSize = reader.UInt32LE()
			const chunkData = reader.Array(chunkSize)
			
			switch(chunkType) {
			case "COREMESH": {
				const chunk = new ByteReader(chunkData)
				
				switch(chunkVersion) {
				case 1: {
					const numVerts = chunk.UInt32LE()
					
					const vertices = mesh.vertices = new Float32Array(numVerts * 3)
					const normals = mesh.normals = new Float32Array(numVerts * 3)
					const uvs = mesh.uvs = new Float32Array(numVerts * 2)
					const tangents = mesh.tangents = new Float32Array(numVerts * 4)
					const vertexColors = mesh.vertexColors = new Uint8Array(numVerts * 4)
					
					for(let i = 0; i < numVerts; i++) {
						vertices[i * 3] = chunk.FloatLE()
						vertices[i * 3 + 1] = chunk.FloatLE()
						vertices[i * 3 + 2] = chunk.FloatLE()

						normals[i * 3] = chunk.FloatLE()
						normals[i * 3 + 1] = chunk.FloatLE()
						normals[i * 3 + 2] = chunk.FloatLE()

						uvs[i * 2] = chunk.FloatLE()
						uvs[i * 2 + 1] = 1 - chunk.FloatLE()
						
						// tangents are mapped from [0, 254] to [-1, 1]
						// byte tx, ty, tz, ts;
						
						tangents[i * 4] = chunk.UInt8() / 127 - 1
						tangents[i * 4 + 1] = chunk.UInt8() / 127 - 1
						tangents[i * 4 + 2] = chunk.UInt8() / 127 - 1
						tangents[i * 4 + 3] = chunk.UInt8() / 127 - 1
						
						// byte r, g, b, a
						vertexColors[i * 4] = chunk.UInt8()
						vertexColors[i * 4 + 1] = chunk.UInt8()
						vertexColors[i * 4 + 2] = chunk.UInt8()
						vertexColors[i * 4 + 3] = chunk.UInt8()
					}
					
					const numFaces = chunk.UInt32LE()
					const faces = mesh.faces = new Uint32Array(numFaces * 3)
					
					for(let i = 0; i < numFaces; i++) {
						faces[i * 3] = chunk.UInt32LE()
						faces[i * 3 + 1] = chunk.UInt32LE()
						faces[i * 3 + 2] = chunk.UInt32LE()
					}
					
					if(!mesh.lods) {
						mesh.lods = [0, numFaces]
					}
					
					break
				}
				case 2: {
					const bitstreamSize = chunk.UInt32LE()
					const stream = new ByteReader(chunk.Array(bitstreamSize))
					
					const data = DracoBitstream.parse(stream)
					
					$.assert_warn(stream.GetRemaining() === 0, "[BTRoblox] Draco bitstream has extra data")
					
					for(const attribute of data.attributes) {
						switch(attribute.uniqueId) {
						case 0: // Position
							mesh.vertices = Float32Array.from(attribute.output)
							break
						case 1: // Normals
							mesh.normals = Float32Array.from(attribute.output)
							break
						case 2: // UVs
							const uvs = mesh.uvs = Float32Array.from(attribute.output)
							
							for(let i = 1; i < uvs.length; i += 2) {
								uvs[i] = 1 - uvs[i]
							}
							break
						case 3: // Tangents?
							const tangents = mesh.tangents = Float32Array.from(attribute.output)
							
							for(let i = 0; i < tangents.length; i++) {
								tangents[i] = tangents[i] / 127 - 1
							}
							break
						case 4: // Colors
							mesh.vertexColors = Uint8Array.from(attribute.output)
							break
						default:
							console.warn("[BTRoblox] Unknown draco attribute", attribute)
						}
					}
					
					const faces = mesh.faces = Uint32Array.from(data.faces)
					
					if(!mesh.lods) {
						mesh.lods = [0, faces.length / 3]
					}
					
					break
				}
				default: console.warn(`[RBXMeshParser] Unknown COREMESH version ${chunkVersion}'`)
				}
				
				$.assert_warn(chunk.GetRemaining() === 0, "[RBXMeshParser] COREMESH chunk has extra data")
				
				break
			}
			case "LODS\0\0\0\0": {
				const chunk = new ByteReader(chunkData)
				
				switch(chunkVersion) {
				case 1: {
					const lodType = chunk.UInt16LE()
					const numHighQualityLODs = chunk.UInt8()
					
					const numLods = chunk.UInt32LE()
					
					if(numLods <= 2) {
						// Lod levels are pretty much ignored if numLods
						// is not at least 3, so we can just skip reading
						// them completely.
						
						chunk.Jump(numLods * 4)
					} else {
						const lods = mesh.lods = []
						
						for(let i = 0; i < numLods; i++) {
							lods.push(chunk.UInt32LE())
						}
					}
					
					break
				}
				default: console.warn(`[RBXMeshParser] Unknown LODS version ${chunkVersion}'`)
				}
				
				$.assert_warn(chunk.GetRemaining() === 0, "[RBXMeshParser] LODS chunk has extra data")
				break
			}
			case "SKINNING": {
				const chunk = new ByteReader(chunkData)
				
				switch(chunkVersion) {
				case 1: {
					const numVerts = chunk.UInt32LE()
					
					const skinIndices = mesh.skinIndices = new Uint8Array(numVerts * 4)
					const skinWeights = mesh.skinWeights = new Float32Array(numVerts * 4)
					
					for(let i = 0; i < numVerts; i++) {
						skinIndices[i * 4 + 0] = chunk.UInt8()
						skinIndices[i * 4 + 1] = chunk.UInt8()
						skinIndices[i * 4 + 2] = chunk.UInt8()
						skinIndices[i * 4 + 3] = chunk.UInt8()
						skinWeights[i * 4 + 0] = chunk.UInt8() / 255
						skinWeights[i * 4 + 1] = chunk.UInt8() / 255
						skinWeights[i * 4 + 2] = chunk.UInt8() / 255
						skinWeights[i * 4 + 3] = chunk.UInt8() / 255
					}
					
					const numBones = chunk.UInt32LE()
					
					const bones = mesh.bones = new Array(numBones)
					const nameTableOffset = chunk.GetIndex() + numBones * 60 + 4
					
					for(let i = 0; i < numBones; i++) {
						const bone = {}
						
						const nameStart = nameTableOffset + chunk.UInt32LE()
						const nameEnd = chunk.indexOf(0, nameStart)
						
						bone.name = $.bufferToString(chunk.subarray(nameStart, nameEnd))
						bone.parent = bones[chunk.UInt16LE()]
						bone.lodParent = bones[chunk.UInt16LE()]
						bone.culling = chunk.FloatLE()
						bone.cframe = new Array(12)
						
						for(let i = 0; i < 9; i++) {
							bone.cframe[i + 3] = chunk.FloatLE()
						}
						
						for(let i = 0; i < 3; i++) {
							bone.cframe[i] = chunk.FloatLE()
						}
						
						bones[i] = bone
					}
					
					const nameTableSize = chunk.UInt32LE()
					chunk.Jump(nameTableSize)
					
					const numSubsets = chunk.UInt32LE()
					const boneIndices = []
					
					for(let i = 0; i < numSubsets; i++) {
						chunk.UInt32LE() // facesBegin
						chunk.UInt32LE() // facesLength
						const vertsBegin = chunk.UInt32LE()
						const vertsLength = chunk.UInt32LE()
						chunk.UInt32LE() // numBoneIndices
						
						for(let i = 0; i < 26; i++) {
							boneIndices[i] = chunk.UInt16LE()
						}
						
						const vertsEnd = vertsBegin + vertsLength
						for(let i = vertsBegin; i < vertsEnd; i++) {
							skinIndices[i * 4 + 0] = boneIndices[skinIndices[i * 4 + 0]]
							skinIndices[i * 4 + 1] = boneIndices[skinIndices[i * 4 + 1]]
							skinIndices[i * 4 + 2] = boneIndices[skinIndices[i * 4 + 2]]
							skinIndices[i * 4 + 3] = boneIndices[skinIndices[i * 4 + 3]]
						}
					}
					
					break
				}
				default: console.warn(`[RBXMeshParser] Unknown SKINNING version ${chunkVersion}'`)
				}
				
				$.assert_warn(chunk.GetRemaining() === 0, "[RBXMeshParser] SKINNING chunk has extra data")
				break
			}
			case "FACS\0\0\0\0": {
				// face stuff not supported
				break
			}
			case "HSRAVIS\0": {
				// HSR not supported
				break
			}
			default: console.warn(`[RBXMeshParser] Unknown chunkType ${chunkType}'`)
			}
		}
		
		$.assert_warn(reader.GetRemaining() === 0, "[RBXMeshParser] Chunked mesh has extra data")
		
		return mesh
	},
}
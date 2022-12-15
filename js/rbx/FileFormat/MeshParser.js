"use strict"

const RBXMeshParser = {
	parse(buffer) {
		const reader = new ByteReader(buffer)
		assert(reader.String(8) === "version ", "Invalid mesh file")

		const version = reader.String(4)
		switch(version) {
		case "1.00":
		case "1.01":
			return this.parseText(bufferToString(buffer))
		case "2.00":
		case "3.00":
		case "3.01":
		case "4.00":
		case "4.01":
		case "5.00":
			return this.parseBin(buffer, version)
		default:
			throw new Error(`Unsupported mesh version '${version}'`)
		}
	},

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

		return { vertices, normals, uvs, faces, lods: [0, faceCount] }
	},

	parseBin(buffer, version) {
		const reader = new ByteReader(buffer)
		assert(reader.String(12) === `version ${version}`, "Bad header")

		const newline = reader.Byte()
		assert(newline === 0x0A || newline === 0x0D && reader.Byte() === 0x0A, "Bad newline")

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
			assert(headerSize >= 12, `Invalid header size ${headerSize}`)

			vertexSize = reader.Byte()
			faceSize = reader.Byte()
			vertexCount = reader.UInt32LE()
			faceCount = reader.UInt32LE()
			
		} else if(version.startsWith("3.")) {
			headerSize = reader.UInt16LE()
			assert(headerSize >= 16, `Invalid header size ${headerSize}`)

			vertexSize = reader.Byte()
			faceSize = reader.Byte()
			lodSize = reader.UInt16LE()
			lodCount = reader.UInt16LE()
			vertexCount = reader.UInt32LE()
			faceCount = reader.UInt32LE()
			
		} else if(version.startsWith("4.")) {
			headerSize = reader.UInt16LE()
			assert(headerSize >= 24, `Invalid header size ${headerSize}`)

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
			assert(headerSize >= 32, `Invalid header size ${headerSize}`)

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
		
		assert(vertexSize >= 36, `Invalid vertex size ${vertexSize}`)
		assert(faceSize >= 12, `Invalid face size ${faceSize}`)
		assert(lodSize >= 4, `Invalid lod size ${lodSize}`)

		const fileEnd = reader.GetIndex()
			+ (vertexCount * vertexSize)
			+ (boneCount > 0 ? vertexCount * 8 : 0)
			+ (faceCount * faceSize)
			+ (lodCount * lodSize)
			+ (boneCount * 60)
			+ (nameTableSize)
			+ (subsetCount * 72)
			+ (facsDataSize)
		
		assert(fileEnd === reader.GetLength(), `Invalid file size (expected ${reader.GetLength()}, got ${fileEnd})`)
		
		const faces = new Uint32Array(faceCount * 3)
		const vertices = new Float32Array(vertexCount * 3)
		const normals = new Float32Array(vertexCount * 3)
		const uvs = new Float32Array(vertexCount * 2)
		const tangents = new Uint8Array(vertexCount * 4)
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
			
			tangents[i * 4] = reader.Byte() / 127 - 1
			tangents[i * 4 + 1] = reader.Byte() / 127 - 1
			tangents[i * 4 + 2] = reader.Byte() / 127 - 1
			tangents[i * 4 + 3] = reader.Byte() / 127 - 1
			
			if(vertexColors) {
				// byte r, g, b, a
				vertexColors[i * 4] = reader.Byte()
				vertexColors[i * 4 + 1] = reader.Byte()
				vertexColors[i * 4 + 2] = reader.Byte()
				vertexColors[i * 4 + 3] = reader.Byte()
				
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
				mesh.skinIndices[i * 4 + 0] = reader.Byte()
				mesh.skinIndices[i * 4 + 1] = reader.Byte()
				mesh.skinIndices[i * 4 + 2] = reader.Byte()
				mesh.skinIndices[i * 4 + 3] = reader.Byte()
				mesh.skinWeights[i * 4 + 0] = reader.Byte() / 255
				mesh.skinWeights[i * 4 + 1] = reader.Byte() / 255
				mesh.skinWeights[i * 4 + 2] = reader.Byte() / 255
				mesh.skinWeights[i * 4 + 3] = reader.Byte() / 255
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
				
				bone.name = bufferToString(reader.subarray(nameStart, nameEnd))
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
	}
}
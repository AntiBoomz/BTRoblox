"use strict"

const RBXMeshParser = {
	parse(buffer, params) {
		const reader = new ByteReader(buffer)
		assert(reader.String(8) === "version ", "Invalid mesh file")

		const version = reader.String(4)
		switch(version) {
		case "1.00":
		case "1.01":
			return this.parseText(bufferToString(buffer), params)
		case "2.00":
		case "3.00":
		case "3.01":
		case "4.00":
		case "4.01":
		case "5.00":
			return this.parseBin(buffer, version, params)
		default:
			throw new Error(`Unsupported mesh version '${version}'`)
		}
	},

	parseText(str, params = {}) {
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
	},

	parseBin(buffer, version, params) {
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
		let skinDataCount = 0

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
			skinDataCount = reader.UInt16LE()
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
			skinDataCount = reader.UInt16LE()
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
			+ (skinDataCount * 72)
			+ (facsDataSize)
		
		assert(fileEnd === reader.GetLength(), `Invalid file size (expected ${reader.GetLength()}, got ${fileEnd})`)
		
		const faces = new Uint32Array(faceCount * 3)
		const vertices = new Float32Array(vertexCount * 3)
		const normals = new Float32Array(vertexCount * 3)
		const uvs = new Float32Array(vertexCount * 2)
		const tangents = !params?.excludeTangents ? new Uint8Array(vertexCount * 4) : null
		const vertexColors = vertexSize >= 40 && !params?.excludeVertexColors ? new Uint8Array(vertexCount * 4) : null
		const lodLevels = []

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
			
			if(tangents) {
				// tangents are mapped from [0, 254] to [-1, 1]
				// byte tx, ty, tz, ts;
				
				tangents[i * 4] = reader.Byte()
				tangents[i * 4 + 1] = reader.Byte()
				tangents[i * 4 + 2] = reader.Byte()
				tangents[i * 4 + 3] = reader.Byte()
			} else {
				reader.Jump(4)
			}
			
			if(vertexSize < 40) {
				reader.Jump(vertexSize - 36)
				continue
			}
			
			if(vertexColors) {
				// byte r, g, b, a
				
				vertexColors[i * 4] = reader.Byte()
				vertexColors[i * 4 + 1] = reader.Byte()
				vertexColors[i * 4 + 2] = reader.Byte()
				vertexColors[i * 4 + 3] = reader.Byte()
			} else {
				reader.Jump(4)
			}
			
			reader.Jump(vertexSize - 40)
		}
		
		// Envelope[vertexCount]
		
		if(boneCount > 0) {
			reader.Jump(vertexCount * 8)
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
			
			lodLevels.push(0, faceCount)
			reader.Jump(lodCount * lodSize)
		} else {
			for(let i = 0; i < lodCount; i++) {
				lodLevels.push(reader.UInt32LE())
				reader.Jump(lodSize - 4)
			}
		}
		
		// Bone[boneCount]

		if(boneCount > 0) {
			reader.Jump(boneCount * 60)
		}
		
		// byte[nameTableSize]

		if(nameTableSize > 0) {
			reader.Jump(nameTableSize)
		}
		
		// SkinData[skinDataCount]

		if(skinDataCount > 0) {
			reader.Jump(skinDataCount * 72)
		}
		
		// byte[facsDataSize]
		
		if(facsDataSize > 0) {
			reader.Jump(facsDataSize)
		}

		//
		
		const mesh = {
			vertices: vertices,
			normals: normals,
			uvs: uvs,
			faces: faces,
			
			lodLevels: lodLevels,
			tangents: tangents,
			vertexColors: vertexColors
		}
		
		//
		
		if(params?.excludeLods && lodCount >= 3) {
			mesh.faces = faces.slice(lodLevels[0] * 3, lodLevels[1] * 3)
			delete mesh.lodLevels
		}
		
		//

		return mesh
	}
}
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

		return { vertices, normals, uvs, faces }
	},

	parseBin(buffer, version = "2.00") {
		const reader = new ByteReader(buffer)
		assert(reader.String(12) === `version ${version}`, "Bad header")

		const newline = reader.Byte()
		assert(newline === 0x0A || newline === 0x0D && reader.Byte() === 0x0A, "Bad newline")

		const begin = reader.GetIndex()
		
		let headerSize
		let vertexSize
		let faceSize
		let lodSize
		let nameTableSize

		let meshCount
		let lodCount
		let vertexCount
		let faceCount
		let boneCount
		let envelopeCount
		let skinDataCount

		if(version === "2.00") {
			headerSize = reader.UInt16LE()
			assert(headerSize >= 12, `Invalid header size ${headerSize}`)

			vertexSize = reader.Byte()
			faceSize = reader.Byte()
			lodSize = 0
			nameTableSize = 0

			meshCount = 1
			lodCount = 0
			vertexCount = reader.Int32LE()
			faceCount = reader.Int32LE()
			envelopeCount = 0
			skinDataCount = 0
			boneCount = 0
		} else if(version.startsWith("3.")) {
			headerSize = reader.UInt16LE()
			assert(headerSize >= 16, `Invalid header size ${headerSize}`)

			meshCount = 1
			vertexSize = reader.Byte()
			faceSize = reader.Byte()
			lodSize = reader.UInt16LE()
			nameTableSize = 0

			lodCount = reader.UInt16LE()
			vertexCount = reader.Int32LE()
			faceCount = reader.Int32LE()
			envelopeCount = 0
			skinDataCount = 0
			boneCount = 0
		} else {
			headerSize = reader.UInt16LE()
			assert(headerSize >= 24, `Invalid header size ${headerSize}`)

			vertexSize = 40
			faceSize = 12
			lodSize = 4

			meshCount = reader.UInt16LE()
			vertexCount = reader.Int32LE()
			faceCount = reader.Int32LE()

			lodCount = reader.UInt16LE()
			boneCount = reader.UInt16LE()

			nameTableSize = reader.Int32LE()
			skinDataCount = reader.UInt16LE()
			reader.Jump(2) // Unknown (Clone's documentation claims skinDataCount to be 32bit, this is false)

			if(boneCount > 0) {
				envelopeCount = vertexCount
			} else {
				envelopeCount = 0
			}
		}

		assert(vertexSize >= 32, `Invalid vertex size ${vertexSize}`)
		assert(faceSize >= 12, `Invalid face size ${faceSize}`)
		assert(lodCount === 0 || lodSize === 4, `Invalid lod size ${lodSize}`)

		const fileEnd = begin
			+ headerSize
			+ (vertexCount * vertexSize)
			+ (envelopeCount * 8)
			+ (faceCount * faceSize)
			+ (lodCount * 4)
			+ (boneCount * 60)
			+ (nameTableSize)
			+ (skinDataCount * 72)
		
		assert(fileEnd === reader.GetLength(), `Invalid file size (expected ${reader.GetLength()}, got ${fileEnd})`)
		
		const faces = new Uint32Array(faceCount * 3)
		const vertices = new Float32Array(vertexCount * 3)
		const normals = new Float32Array(vertexCount * 3)
		const uvs = new Float32Array(vertexCount * 2)
		const lodLevels = []

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

		if(envelopeCount > 0) {
			reader.Jump(envelopeCount * 8)
		}

		for(let i = 0; i < faceCount; i++) {
			faces[i * 3] = reader.UInt32LE()
			faces[i * 3 + 1] = reader.UInt32LE()
			faces[i * 3 + 2] = reader.UInt32LE()

			reader.Jump(faceSize - 12)
		}

		if(lodCount === 0) {
			lodLevels.push(0, faceCount)
		} else {
			for(let i = 0; i < lodCount; i++) {
				lodLevels.push(reader.Int32LE())
				reader.Jump(lodSize - 4)
			}
		}

		if(boneCount > 0) {
			reader.Jump(boneCount * 60)
		}

		if(nameTableSize > 0) {
			reader.Jump(nameTableSize)
		}

		if(skinDataCount > 0) {
			reader.Jump(skinDataCount * 72)
		}

		// Okay, idk what's happening here, but some v4 meshes don't have valid lodLevels?
		// Possibly related to skinned meshes as I've only seen this happen with the skinned
		// LNX bundles.
		if(version === "4.00" && meshCount === 0 && lodCount === 2 && lodLevels[1] === 0) {
			lodLevels[0] = 0
			lodLevels[1] = faceCount
		}
		//

		const newFaces = faces.slice(lodLevels[0] * 3, lodLevels[1] * 3)
		let minFaceIndex = faceCount
		let maxFaceIndex = 0

		for(let i = 0; i < newFaces.length; i++) {
			const index = newFaces[i]

			if(index < minFaceIndex) {
				minFaceIndex = index
			}

			if(index >= maxFaceIndex) {
				maxFaceIndex = index + 1
			}
		}

		if(minFaceIndex > 0) {
			for(let i = 0; i < newFaces.length; i++) {
				newFaces[i] -= minFaceIndex
			}
		}

		const newVertices = vertices.slice(minFaceIndex * 3, maxFaceIndex * 3)
		const newNormals = normals.slice(minFaceIndex * 3, maxFaceIndex * 3)
		const newUVs = uvs.slice(minFaceIndex * 2, maxFaceIndex * 2)

		const mesh = {
			vertices: newVertices,
			normals: newNormals,
			uvs: newUVs,
			faces: newFaces
		}

		return mesh
	}
}
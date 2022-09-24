"use strict"

const RBXParser = {
	parseModel(buffer) {
		const reader = new ByteReader(buffer)
		assert(reader.String(7) === "<roblox", "Not a valid RBXM file")

		if(reader.Byte() === 0x21) {
			return RBXBinaryParser.parse(buffer)
		}

		return RBXXmlParser.parse(buffer)
	},

	parseMesh(buffer, params) {
		return RBXMeshParser.parse(buffer, params)
	},

	parseAnimation(sequence) {
		return RBXAnimationParser.parse(sequence)
	}
}
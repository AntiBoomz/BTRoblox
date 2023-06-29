"use strict"

const RBXParser = {
	parseModel(buffer, params) {
		const reader = new ByteReader(buffer)
		assert(reader.String(7) === "<roblox", "Not a valid RBXM file")

		if(reader.Byte() === 0x21) {
			return RBXBinaryParser.parse(buffer, params)
		}

		return RBXXmlParser.parse(buffer, params)
	},

	parseMesh(buffer, params) {
		return RBXMeshParser.parse(buffer, params)
	},

	parseAnimation(sequence) {
		return RBXAnimationParser.parse(sequence)
	}
}
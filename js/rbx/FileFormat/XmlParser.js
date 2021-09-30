"use strict"

const RBXXmlParser = {
	Transforms: {
		CFrame: ["X", "Y", "Z", "R00", "R01", "R02", "R10", "R11", "R12", "R20", "R21", "R22"],
		Vector3: ["X", "Y", "Z"],
		Vector2: ["X", "Y"]
	},
	
	escapeXml(value) {
		return value
			.replace(/&amp;/g, "&amp;&amp;")
			.replace(/&#((?!0?0?38;)\d{1,4}|(?!0?0?26;)x[0-9a-fA-F]{1,4});/g, "&amp;#$1;")
	},
	
	unescapeXml(value) {
		return value
			.replace(/(?<!&)((?:&{2})*)&#(\d{1,4}|x[0-9a-fA-F]{1,4});/g, (_, prefix, inner) => {
				const byte = inner[0] === "x" ? parseInt(inner.slice(1), 16) : parseInt(inner, 10)
				return `${prefix}${String.fromCharCode(byte)}`
			})
			.replace(/&&/g, "&")
	},

	parse(buffer) {
		const xml = new DOMParser().parseFromString(this.escapeXml(bufferToString(buffer)), "text/xml").documentElement

		const parser = {
			result: [],
			refs: {},
			refWait: [],
			sharedStrings: {}
		}

		const sharedStrings = xml.querySelector(":scope > SharedStrings")
		if(sharedStrings) {
			Object.values(sharedStrings.children).forEach(child => {
				if(child.nodeName !== "SharedString") { return }
				const md5 = child.getAttribute("md5")
				let value

				try { value = window.atob(child.textContent.trim()) }
				catch(ex) { console.error(ex) }

				if(typeof md5 === "string" && typeof value === "string") {
					parser.sharedStrings[md5] = { md5, value }
				}
			})
		}

		Object.values(xml.children).forEach(child => {
			if(child.nodeName === "Item") {
				parser.result.push(this.parseItem(parser, child))
			}
		})

		return parser.result
	},

	parseItem(parser, node) {
		const inst = RBXInstance.new(node.className)
		const referent = node.getAttribute("referent")

		if(referent) {
			parser.refs[referent] = inst
			parser.refWait.forEach(wait => {
				if(wait.id === referent) {
					parser.refWait.splice(parser.refWait.indexOf(wait), 1)
					wait.inst.setProperty(wait.name, inst, "Instance")
				}
			})
		}

		Object.values(node.children).forEach(childNode => {
			switch(childNode.nodeName) {
			case "Item": {
				const child = this.parseItem(parser, childNode)
				child.setProperty("Parent", inst)
				break
			}
			case "Properties":
				this.parseProperties(parser, inst, childNode)
				break
			}
		})

		return inst
	},

	parseProperties(parser, inst, targetNode) {
		Object.values(targetNode.children).forEach(propNode => {
			const name = propNode.attributes.name.value
			const value = propNode.textContent

			switch(propNode.nodeName.toLowerCase()) {
			case "content":
			case "string":
			case "protectedstring":
			case "binarystring": return inst.setProperty(name, this.unescapeXml(value.trim()), "string")
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
					const index = this.Transforms.CFrame.indexOf(x.nodeName.toUpperCase())
					if(index !== -1) {
						cframe[index] = +x.textContent
					}
				})

				return inst.setProperty(name, cframe, "CFrame")
			}
			case "vector2": {
				const vector2 = [0, 0]
				Object.values(propNode.children).forEach(x => {
					const index = this.Transforms.Vector2.indexOf(x.nodeName.toUpperCase())
					if(index !== -1) {
						vector2[index] = +x.textContent
					}
				})

				return inst.setProperty(name, vector2, "Vector2")
			}
			case "vector3": {
				const vector3 = [0, 0, 0]
				Object.values(propNode.children).forEach(x => {
					const index = this.Transforms.Vector3.indexOf(x.nodeName.toUpperCase())
					if(index !== -1) {
						vector3[index] = +x.textContent
					}
				})

				return inst.setProperty(name, vector3, "Vector3")
			}
			case "udim2": {
				const udim2 = [
					[0, 0],
					[0, 0]
				]

				Object.values(propNode.children).forEach(x => {
					const nodeName = x.nodeName.toUpperCase()

					if(nodeName === "XS") { udim2[0][0] = +x.textContent }
					else if(nodeName === "XO") { udim2[0][1] = +x.textContent }
					else if(nodeName === "YS") { udim2[1][0] = +x.textContent }
					else if(nodeName === "YO") { udim2[0][1] = +x.textContent }
				})

				return inst.setProperty(name, udim2, "UDim2")
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
				const target = parser.refs[value] || null
				if(!target && value.toLowerCase() !== "null") {
					parser.refWait.push({
						inst, name,
						id: value
					})
				}

				return inst.setProperty(name, target, "Instance")
			}
			case "sharedstring": {
				const md5 = value.trim()
				const sharedString = parser.sharedStrings[md5].value

				return inst.setProperty(name, sharedString, "SharedString")
			}
			case "colorsequence":
			case "numberrange":
			case "numbersequence":
				return
			default:
				THROW_DEV_WARNING(`[ParseRBXXml] Unknown dataType ${propNode.nodeName} for ${inst.ClassName}.${name}`, propNode.innerHTML)
			}
		})
	}
}
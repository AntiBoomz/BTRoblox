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

	parse(buffer, params) {
		const xml = new DOMParser().parseFromString(this.escapeXml(bufferToString(buffer)), "text/xml").documentElement

		const parser = {
			result: new RBXInstanceRoot(),
			refs: {},
			refWait: [],
			sharedStrings: {}
		}

		const sharedStrings = xml.querySelector(":scope > SharedStrings")
		if(sharedStrings) {
			for(const child of Object.values(sharedStrings.children)) {
				if(child.nodeName !== "SharedString") { continue }
				const md5 = child.getAttribute("md5")
				let value

				try { value = window.atob(child.textContent.trim()) }
				catch(ex) { console.error(ex) }

				if(typeof md5 === "string" && typeof value === "string") {
					parser.sharedStrings[md5] = { md5, value }
				}
			}
		}

		for(const child of Object.values(xml.children)) {
			if(child.nodeName === "Item") {
				parser.result.push(this.parseItem(parser, child))
			}
		}

		if(params?.async) {
			parser.asyncPromise = Promise.resolve(parser.result)
		}
		
		return parser
	},

	parseItem(parser, node) {
		const inst = RBXInstance.new(node.className)
		const referent = node.getAttribute("referent")

		if(referent) {
			parser.refs[referent] = inst
			
			for(const wait of parser.refWait) {
				if(wait.id === referent) {
					parser.refWait.splice(parser.refWait.indexOf(wait), 1)
					wait.inst.setProperty(wait.name, inst, "Instance")
				}
			}
		}

		for(const childNode of Object.values(node.children)) {
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
		}

		return inst
	},

	parseProperties(parser, inst, targetNode) {
		for(const propNode of Object.values(targetNode.children)) {
			const name = propNode.attributes.name.value
			const value = propNode.textContent

			switch(propNode.nodeName.toLowerCase()) {
			case "content":
			case "string":
			case "protectedstring":
			case "binarystring": {
				inst.setProperty(name, this.unescapeXml(value.trim()), "string")
				break
			}
			case "double": {
				inst.setProperty(name, +value, "double")
				break
			}
			case "float": {
				inst.setProperty(name, +value, "float")
				break
			}
			case "int": {
				inst.setProperty(name, +value, "int")
				break
			}
			case "int64": {
				inst.setProperty(name, value, "int64")
				break
			}
			case "bool": {
				inst.setProperty(name, value.toLowerCase() === "true", "bool")
				break
			}
			case "token": {
				inst.setProperty(name, +value, "Enum")
				break
			}
			case "color3":
			case "color3uint8": {
				inst.setProperty(name, [(+value >>> 16 & 255) / 255, (+value >>> 8 & 255) / 255, (+value & 255) / 255], "Color3")
				break
			}
			case "optionalcoordinateframe":
				const cframeNode = Object.values(propNode.children).find(x => x.nodeName.toLowerCase() === "cframe")
				if(!cframeNode) { break }
				
				propNode = cframeNode
				// break omitted
			case "coordinateframe": {
				const cframe = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]
				
				for(const x of Object.values(propNode.children)) {
					const index = this.Transforms.CFrame.indexOf(x.nodeName.toUpperCase())
					if(index !== -1) {
						cframe[index] = +x.textContent
					}
				}

				inst.setProperty(name, cframe, "CFrame")
				break
			}
			case "vector2": {
				const vector2 = [0, 0]
				
				for(const x of Object.values(propNode.children)) {
					const index = this.Transforms.Vector2.indexOf(x.nodeName.toUpperCase())
					if(index !== -1) {
						vector2[index] = +x.textContent
					}
				}

				inst.setProperty(name, vector2, "Vector2")
				break
			}
			case "vector3": {
				const vector3 = [0, 0, 0]
				
				for(const x of Object.values(propNode.children)) {
					const index = this.Transforms.Vector3.indexOf(x.nodeName.toUpperCase())
					if(index !== -1) {
						vector3[index] = +x.textContent
					}
				}

				inst.setProperty(name, vector3, "Vector3")
				break
			}
			case "udim2": {
				const udim2 = [
					[0, 0],
					[0, 0]
				]

				for(const x of Object.values(propNode.children)) {
					const nodeName = x.nodeName.toUpperCase()

					if(nodeName === "XS") { udim2[0][0] = +x.textContent }
					else if(nodeName === "XO") { udim2[0][1] = +x.textContent }
					else if(nodeName === "YS") { udim2[1][0] = +x.textContent }
					else if(nodeName === "YO") { udim2[0][1] = +x.textContent }
				}

				inst.setProperty(name, udim2, "UDim2")
				break
			}
			case "physicalproperties": {
				const props = { CustomPhysics: false, Density: null, Friction: null, Elasticity: null, FrictionWeight: null, ElasticityWeight: null }
				
				for(const x of Object.values(propNode.children)) {
					if(x.nodeName in props) {
						props[x.nodeName] = x.nodeName === "CustomPhysics" ? x.textContent.toLowerCase() === "true" : +x.textContent
					}
				}

				inst.setProperty(name, props, "PhysicalProperties")
				break
			}
			case "ref": {
				const target = parser.refs[value] || null
				
				if(!target && value.toLowerCase() !== "null") {
					parser.refWait.push({
						inst, name,
						id: value
					})
				}

				inst.setProperty(name, target, "Instance")
				break
			}
			case "sharedstring": {
				const md5 = value.trim()
				const sharedString = parser.sharedStrings[md5].value

				inst.setProperty(name, sharedString, "SharedString")
				break
			}
			case "uniqueid": {
				inst.setProperty(name, value.trim(), "UniqueId")
				break
			}
			case "colorsequence":
			case "numberrange":
			case "numbersequence":
				break
			default:
				THROW_DEV_WARNING(`[ParseRBXXml] Unknown dataType ${propNode.nodeName} for ${inst.ClassName}.${name}`, propNode.innerHTML)
			}
		}
	}
}
"use strict"

{
	const GroupOrders = [
		"Appearance", "Data", "Shape", "Goals", "Thrust", "Turn", "Camera", "Behavior", "Image", "Compliance",
		"AlignOrientation", "AlignPosition", "BallSocket", "Limits", "TwistLimits", "Hinge", "Servo",
		"Motor", "LineForce", "Rod", "Rope", "Cylinder", "AngularLimits", "AngularServo", "AngularMotor", "Slider",
		"Spring", "Torque", "VectorForce", "Attachments", "Input", "Text", "Scrolling", "Localization", "State",
		"Control", "Game", "Teams", "Forcefield", "Part ", "Surface Inputs", "Surface", "Motion", "Particles",
		"Emission", "Parts"
	]
	
	const RenamedProperties = {
		Color3uint8: "Color", formFactorRaw: "FormFactor", Health_XML: "Health", xmlRead_MaxDistance_3: "MaxDistance",
		shape: "Shape", size: "Size", formFactor: "FormFactor", archivable: "Archivable", style: "Style"
	}

	const HiddenProperties = $.toDict(null,
		"Tags", // Instance
		"FormFactor", "Elasticity", "Friction", // Parts
		"PhysicsData", "MeshData", "ChildData", "InitialSize", "PhysicalConfigData", // Meshparts / Unions
		"ModelInPrimary", // Model
		"LODX", "LODY", // Mesh
		"ScriptGuid", // Script
		"InternalHeadScale", "InternalBodyScale", // Humanoid
		"PlayCount", // Sound
		"UnionOperation.AssetId", "UnionOperation.InitialSize", // Unions
		"Terrain.PhysicsGrid", "Terrain.SmoothGrid", "Terrain.MaterialColors", // Terrain

		// Super legacy stuff
		"Model.Controller", "Part.Controller",
		"ControllerFlagShown", "DraggingV1",
	)

	function fixNum(v) { return Math.round(v * 1e3) / 1e3 }
	function fixNums(arr) {
		const copy = arr.slice(0)
		copy.forEach((v, i) => copy[i] = fixNum(v))
		return copy
	}

	const sortPropertyGroups = (a, b) => a.Order - b.Order
	const sortProperties = (a, b) => (a[0] < b[0] ? -1 : 1)
	const sortChildren = (a, b) => {
		const ao = ApiDump.getExplorerOrder(a.ClassName)
		const bo = ApiDump.getExplorerOrder(b.ClassName)
		return ao !== bo ? ao - bo : (a.Name < b.Name ? -1 : 1)
	}

	class Explorer {
		constructor() {
			this.models = []
			this.selection = []

			const element = this.element = html`
			<div class="btr-explorer-parent">
				<div class="btr-explorer">
					<div class="btr-explorer-header hidden"></div>
					<div class="btr-explorer-loading" style="text-align:center;margin-top:12px;">Loading</div>
				</div>
				<div class="btr-properties">
					<div class="btr-properties-header"></div>
					<div class="btr-properties-container">
					</div>
				</div>
			</div>"`

			element.$on("click", ".btr-explorer", () => this.select([]))
			this.select([])
		}

		openText(value) {
			const doc = window.open("", "_blank").document
			const pre = doc.createElement("pre")
			pre.textContent = value
			doc.body.append(pre)
		}

		select(items) {
			const oldItems = this.selection
			this.selection = items

			oldItems.forEach(item => { item.element.classList.remove("selected") })
			items.forEach(item => { item.element.classList.add("selected") })

			const properties = this.element.$find(".btr-properties")
			const header = properties.$find(".btr-properties-header")
			const propertyContainer = properties.$find(".btr-properties-container")
			propertyContainer.$empty()

			if(!items.length) {
				header.textContent = "Properties"
				properties.style.display = "none"
				return
			}

			properties.style.display = ""

			const target = items[0]
			header.textContent = `Properties - ${target.ClassName} "${target.Name}"`

			const groups = []
			const groupMap = {}
			Object.entries(target.Properties).forEach(([name, prop]) => {
				name = RenamedProperties[name] || name
				if(HiddenProperties[name] || HiddenProperties[`${target.ClassName}.${name}`]) { return }

				const group = ApiDump.getPropertyGroup(target.ClassName, name)
				if(group === "HIDDEN") { return }
				
				let groupData = groupMap[group]
				if(!groupData) {
					const order = GroupOrders.indexOf(group)
					groupData = groupMap[group] = {
						Name: (typeof order !== "number" && IS_DEV_MODE) ? `${group} (Missing Order)` : group,
						Order: typeof order === "number" ? order : 1e3 + groups.length,
						Properties: []
					}

					groups.push(groupData)
				}

				groupData.Properties.push([name, prop])
			})

			groups.sort(sortPropertyGroups).forEach(group => {
				const titleButton = html`<div class=btr-property-group>${group.Name}</div>`
				const propertiesList = html`<div class=btr-properties-list></div>`
				propertyContainer.append(titleButton, propertiesList)

				titleButton.$on("click", () => {
					titleButton.classList.toggle("closed")
				})

				group.Properties.sort(sortProperties).forEach(([name, prop]) => {
					const nameItem = html`<div class=btr-property-name title=${name}>${name}</div>`
					const valueItem = html`<div class=btr-property-value></div>`

					const value = prop.value
					let type = prop.type

					if(name === "BrickColor" && type === "int") { type = "BrickColor" }

					switch(type) {
					case "int64": {
						valueItem.textContent = value
						break
					}
					case "int":
					case "float":
					case "double": {
						valueItem.textContent = fixNum(value)
						break
					}
					case "SharedString":
					case "string": {
						const input = html`<input type=text readonly>`

						const tooLong = value.length > 120
						if(tooLong || value.includes("\n")) {
							input.value = input.title = (tooLong ? value.slice(0, 117) + "..." : value)

							const more = html`<a class=more>...</a>`
							more.$on("click", () => this.openText(value))

							valueItem.append(more)
						} else {
							const id = AssetCache.resolveAssetId(value)
							if(id) {
								const more = html`<a class=more href="/library/${id}/Redirect" target=_blank>🔗</a>`
								more.title = "Go to asset"
								valueItem.append(more)
							}

							input.value = input.title = value
						}

						valueItem.append(input)
						break
					}
					case "bool": {
						const input = html`<input type=checkbox disabled>`
						input.checked = value
						valueItem.append(input)
						break
					}
					case "Instance":
						valueItem.textContent = value ? value.Name : ""
						break
					case "CFrame":
					case "Vector2":
					case "Vector3":
						valueItem.textContent = fixNums(value).join(", ")
						break
					case "Color3uint8":
					case "Color3": {
						const rgb = value.map(x => Math.round(x * 255))
						valueItem.textContent = `[${rgb.join(", ")}]`
						valueItem.prepend(html`<span class=btr-color3-preview style=background-color:rgb(${rgb.join(",")})></span>`)
						break
					}
					case "BrickColor":
						valueItem.textContent = ApiDump.getBrickColorName(value) || String(value) + " (Unknown BrickColor)"
						break
					case "Enum":
						valueItem.textContent = ApiDump.getPropertyEnumName(target.ClassName, name, value) || `Enum ${value}`
						break
					case "Rect2D":
						valueItem.textContent = `${fixNums(value).join(", ")}`
						break
					case "UDim":
						valueItem.textContent = `${fixNums(value).join(", ")}`
						break
					case "UDim2":
						valueItem.textContent = `{${fixNums(value[0]).join(", ")}}, {${fixNums(value[1]).join(", ")}}`
						break
					case "PhysicalProperties":
						valueItem.textContent = value.CustomPhysics ?
							fixNums([value.Density, value.Friction, value.Elasticity, value.FrictionWeight, value.ElasticityWeight]).join(", ") :
							"false"
						break
					case "NumberSequence":
						valueItem.textContent = value.map(x => `(${fixNums([x.Time, x.Value]).join(", ")})`).join(", ")
						break
					case "NumberRange":
						valueItem.textContent = `${fixNums([value.Min, value.Max]).join(", ")}`
						break
					case "ColorSequence":
						valueItem.textContent = value.map(x => `(${fixNums([x.Time])[0]}, (${fixNums(x.Color).map(num => Math.round(num * 255)).join(", ")}))`).join(", ")
						break
					case "Axes":
					case "Faces":
						valueItem.textContent = Object.entries(value).filter(x => x[1]).map(x => x[0]).join(", ")
						break
					default:
						console.log("Unknown property type", name, prop)
						valueItem.textContent = String(value)
					}

					if(!valueItem.title) {
						valueItem.title = valueItem.textContent
					}

					const cont = html`
					<div class=btr-property>
						<div class=btr-property-more></div>
						<div class=btr-property-inner></div>
					</div>`
					cont.$find(".btr-property-inner").append(nameItem, valueItem)
					propertiesList.append(cont)
				})
			})
		}

		addModel(title, model) {
			const lists = this.element.$find(".btr-explorer")
			const header = this.element.$find(".btr-explorer-header")
			const element = html`<ul class=btr-explorer-list></ul>`
			const btn = html`<div class=btr-explorer-view-btn>${title}</div>`

			if(this.models.length) {
				header.classList.remove("hidden")
				element.classList.add("hidden")
			} else {
				btn.classList.add("selected")
				this.element.$find(".btr-explorer-loading").remove()
			}

			btn.$on("click", () => {
				lists.$findAll(">.btr-explorer-list").forEach(x => x.classList.add("hidden"))
				element.classList.remove("hidden")
				header.$findAll(">.btr-explorer-view-btn").forEach(x => x.classList.remove("selected"))
				btn.classList.add("selected")
				this.select([])
			})

			const create = (inst, parent) => {
				const icon = ApiDump.getExplorerIconIndex(inst.ClassName)
				const item = html`
				<li class=btr-explorer-item-container>
					<div class=btr-explorer-more></div>
					<div class=btr-explorer-item>
						<div class=btr-explorer-icon style="background-position:-${icon * 16}px 0"></div>
						${inst.Name}
					</div>
				</li>`

				const itemBtn = inst.element = item.$find(".btr-explorer-item")
				let lastClick

				itemBtn.$on("click", ev => {
					this.select([inst])
					ev.stopPropagation()

					if(lastClick && Date.now() - lastClick < 500) {
						lastClick = null

						switch(inst.ClassName) {
						case "Script":
						case "LocalScript":
						case "ModuleScript":
							this.openText(inst.Source || "")
							break
						default:
							item.classList.toggle("closed")
						}
					} else {
						lastClick = Date.now()
					}
				})

				item.$find(".btr-explorer-more").$on("click", ev => {
					item.classList.toggle("closed")
					ev.stopPropagation()
				})

				parent.append(item)

				if(inst.Children.length) {
					item.classList.add("btr-explorer-has-children")
					const childList = html`<ul class=btr-explorer-childlist></ul>`
					
					const children = [...inst.Children]
					children.sort(sortChildren).forEach(child => create(child, childList))
					item.after(childList)
				}
			}

			model.forEach(inst => create(inst, element))

			header.append(btn)
			lists.append(element)
			this.models.push(model)
		}
	}

	window.Explorer = Explorer
}
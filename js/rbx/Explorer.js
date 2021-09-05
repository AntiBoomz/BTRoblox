"use strict"

const Explorer = (() => {
	const GroupOrders = [
		"Appearance", "Data", "Shape", "Goals", "Thrust", "Turn", "Camera", "Transform", "Pivot", "Behavior", "Collision", "Image", "Compliance",
		"AlignOrientation", "AlignPosition", "BallSocket", "Limits", "TwistLimits", "Hinge", "Servo",
		"Motor", "LineForce", "Rod", "Rope", "Cylinder", "AngularLimits", "AngularServo", "AngularMotor", "Slider",
		"Spring", "Torque", "VectorForce", "Attachments", "Input", "Text", "Scrolling", "Localization", "State",
		"Control", "Game", "Teams", "Forcefield", "Part", "Surface Inputs", "Surface", "Motion", "Particles",
		"Emission", "Parts"
	]
	
	const RenamedProperties = {
		Color3uint8: "Color", formFactorRaw: "FormFactor", Health_XML: "Health", xmlRead_MaxDistance_3: "MaxDistance",
		shape: "Shape", size: "Size", formFactor: "FormFactor", archivable: "Archivable", style: "Style",
		MeshID: "MeshId"
	}

	const HiddenProperties = $.toDict(null,
		"Tags", "AttributesSerialize", "SourceAssetId", // Instance
		"FormFactor", "Elasticity", "Friction", "Velocity", "RotVelocity", // Parts
		"PhysicsData", "MeshData", "ChildData", "InitialSize", "PhysicalConfigData", // Meshparts / Unions
		"HasJointOffset", "HasSkinnedMesh", "JointOffset", "LODData", // Meshparts
		"ModelInPrimary", // Model
		"LODX", "LODY", // Mesh
		"ScriptGuid", // Script
		"InternalHeadScale", "InternalBodyScale", // Humanoid
		"PlayCount", // Sound
		"UnionOperation.AssetId", "UnionOperation.InitialSize", // Unions
		"Terrain.PhysicsGrid", "Terrain.SmoothGrid", "Terrain.MaterialColors", // Terrain
		"IsAutoJoint", // Joints
		"WrapTarget.HSRData", // WrapTarget

		// Super legacy stuff
		"Model.Controller", "Part.Controller",
		"ControllerFlagShown", "DraggingV1"
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

	return class {
		constructor() {
			this.models = []
			this.selection = []

			this.sourceViewerTabs = []
			this.selectedSourceViewerTab = null
			this.sourceViewerModal = null

			const element = this.element = html`
			<div class="btr-explorer-parent">
				<div class="btr-explorer">
					<div class="btr-explorer-header">Explorer</div>
					<div class="input-group-btn btr-dropdown-container" style="display: none">
						<button type=button class=input-dropdown-btn>
							<span class=rbx-selection-label style="font-size:14px;line-height:20px"></span>
							<span class=icon-down-16x16 style="margin-left:8px"></span>
						</button>
						<ul class=dropdown-menu style="position:absolute;display:none">
						</ul>
					</div>
					<div class="btr-explorer-loading" style="text-align:center;margin-top:12px;">Loading</div>
				</div>
				<div class="btr-properties">
					<div class="btr-properties-header"></div>
					<div class="btr-properties-container">
					</div>
				</div>
			</div>"`
			
			const dropdownBtn = element.$find(".input-dropdown-btn")
			const dropdownMenu = element.$find(".dropdown-menu")

			element.$on("click", ".btr-explorer", () => {
				this.select([])
			})

			element.$on("click", ev => {
				ev.stopPropagation()
			})

			dropdownBtn.$on("click", () => {
				dropdownMenu.style.display = dropdownMenu.style.display ? "" : "none"
			})

			document.$on("click", ev => {
				if(!dropdownMenu.style.display && !dropdownMenu.parentNode.contains(ev.target)) {
					dropdownMenu.style.display = "none"
				}
			}, { capture: true })

			this.select([])
		}

		closeSourceViewer() {
			if(this.originalParent && document.body.contains(this.originalParent)) {
				this.originalParent.append(this.element)
			} else {
				this.element.remove()
			}

			this.originalParent = null
			this.selectedSourceViewerTab = null

			this.sourceViewerTabs.splice(0, this.sourceViewerTabs.length)

			this.sourceViewerModal.remove()
			this.sourceViewerModal = null

			document.body.style.overflow = ""

			this.element.$find(".btr-properties").classList.remove("keepopen")
		}

		async openSourceViewer(inst, propName) {
			await loadOptionalLibrary("sourceViewer")

			if(!this.sourceViewerModal) {
				this.sourceViewerModal = html`
				<div class=btr-sourceviewer-modal>
					<div class=btr-sourceviewer-container>
						<div class=btr-sourceviewer-header>
						</div>
						<div class=btr-sourceviewer-content>
						</div>
						<div class=btr-sourceviewer-explorer>
						</div>
					</div>
				</div>`

				this.sourceViewerModal.$on("click", ev => {
					ev.preventDefault()
					ev.stopPropagation()
					ev.stopImmediatePropagation()

					this.closeSourceViewer()
				})

				this.sourceViewerModal.$find(".btr-sourceviewer-container").$on("click", ev => {
					ev.preventDefault()
					ev.stopPropagation()
					ev.stopImmediatePropagation()
				})

				document.body.append(this.sourceViewerModal)
				document.body.style.overflow = "hidden"

				this.originalParent = this.element.parentNode
				this.sourceViewerModal.$find(".btr-sourceviewer-explorer").append(this.element)

				this.element.$find(".btr-properties").classList.add("keepopen")
			}

			let tab = this.sourceViewerTabs.find(x => x.inst === inst && x.propName === propName)

			if(!tab) {
				const btn = html`<div class=btr-sourceviewer-tab>${inst.Name}<div class=btr-sourceviewer-tab-close>×</div></div>`
				this.sourceViewerModal.$find(".btr-sourceviewer-header").append(btn)

				btn.$on("click", ev => {
					ev.stopPropagation()
					ev.preventDefault()

					if(this.selectedSourceViewerTab !== tab) {
						this.openSourceViewer(inst, propName)
					}
				})

				btn.$find(".btr-sourceviewer-tab-close").$on("click", ev => {
					ev.stopPropagation()
					ev.preventDefault()

					const index = this.sourceViewerTabs.indexOf(tab)
					this.sourceViewerTabs.splice(index, 1)

					tab.btn.remove()

					if(this.selectedSourceViewerTab === tab) {
						const nextTab = this.sourceViewerTabs[index] || this.sourceViewerTabs[index - 1]

						if(nextTab) {
							this.openSourceViewer(nextTab.inst, nextTab.propName)
						} else {
							this.closeSourceViewer()
						}
					}
				})

				tab = { inst, propName, btn }
				this.sourceViewerTabs.push(tab)
			}

			if(this.selectedSourceViewerTab) {
				this.selectedSourceViewerTab.btn.classList.remove("active")
			}

			tab.btn.classList.add("active")
			this.selectedSourceViewerTab = tab


			const source = inst.Properties[propName].value

			const content = this.sourceViewerModal.$find(".btr-sourceviewer-content")
			content.$empty()

			btrSourceViewer.init(content, source)

			this.sourceViewerModal.$find(".btr-sourceviewer-content").scrollTop = 0
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
				properties.classList.add("closed")
				return
			}

			properties.classList.remove("closed")

			const target = items[0]
			header.textContent = `Properties - ${target.ClassName} "${target.Name}"`

			const groups = []
			const groupMap = {}
			Object.entries(target.Properties).forEach(([name, prop]) => {
				if(RenamedProperties[name] && RenamedProperties[name] in target.Properties) { return }
				
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
				const titleButton = html`<div class=btr-property-group><div class=btr-property-group-more></div>${group.Name}</div>`
				const propertiesList = html`<div class=btr-properties-list></div>`
				propertyContainer.append(titleButton, propertiesList)

				let lastClick

				titleButton.$find(".btr-property-group-more").$on("click", ev => {
					titleButton.classList.toggle("closed")

					ev.stopPropagation()
				})

				titleButton.$on("click", () => {
					if(lastClick && Date.now() - lastClick < 500) {
						lastClick = null
						titleButton.classList.toggle("closed")
					} else {
						lastClick = Date.now()
					}
				})


				group.Properties.sort(sortProperties).forEach(([name, prop]) => {
					const value = prop.value
					let type = prop.type

					if(name === "LinkedSource" && !value) {
						return
					} else if(name === "BrickColor" && type === "int") {
						type = "BrickColor"
					}

					const nameItem = html`<div class=btr-property-name title=${name}>${name}</div>`
					const valueItem = html`<div class=btr-property-value></div>`

					if(name === "ClassName") {
						nameItem.classList.add("btr-property-readonly")
						valueItem.classList.add("btr-property-readonly")
					}

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
						if(tooLong || value.includes("\n") || name.includes("Source")) {
							input.value = input.title = (tooLong ? value.slice(0, 117) + "..." : value)

							const more = html`<a class=more title="View Source">...</a>`
							more.$on("click", () => this.openSourceViewer(target, name))
							
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
						const input = html`<input type=checkbox>`
						input.checked = value
						valueItem.append(input)
						
						input.$on("change", () => input.checked = value)
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
						valueItem.textContent = `${ApiDump.getPropertyEnumName(target.ClassName, name, value) || value}`
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
					</div>`
					cont.append(nameItem, valueItem)
					propertiesList.append(cont)
				})
			})
		}

		addModel(title, model) {
			const lists = this.element.$find(".btr-explorer")
			const dropdown = this.element.$find(".btr-dropdown-container")

			const element = html`<div class="btr-explorer-list hidden"></div>`
			const inner = html`<div class=btr-explorer-inner-list>`
			element.append(inner)

			//

			const btn = html`<li><a title="${title}" style="text-overflow:ellipsis;overflow:hidden;padding:8px 12px;">${title}</a></li>`

			btn.$on("click", () => {
				dropdown.$find(".dropdown-menu").style.display = "none"
				dropdown.$find(".input-dropdown-btn .rbx-selection-label").textContent = title

				lists.$findAll(">.btr-explorer-list").forEach(x => x.classList.add("hidden"))
				element.classList.remove("hidden")

				dropdown.$findAll(".dropdown-menu > li a").forEach(x => x.classList.remove("selected"))
				btn.$find("a").classList.add("selected")

				this.select([])
			})

			//

			const create = (inst, parent) => {
				const icon = ApiDump.getExplorerIconIndex(inst.ClassName)
				const item = html`
				<div class=btr-explorer-item-container>
					<div class=btr-explorer-more></div>
					<div class=btr-explorer-item>
						<div class=btr-explorer-icon style="background-position:-${icon * 16}px 0"></div>
						${inst.Name}
					</div>
				</div>`

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
							this.openSourceViewer(inst, "Source")
							break
						default:
							item.classList.toggle("closed")
						}
					} else {
						lastClick = Date.now()
					}
				})

				parent.append(item)

				if(inst.Children.length) {
					item.classList.add("btr-explorer-has-children")
					const childList = html`<div class=btr-explorer-childlist></div>`
					
					const children = [...inst.Children]
					children.sort(sortChildren).forEach(child => create(child, childList))
					item.after(childList)

					item.$find(".btr-explorer-more").$on("click", ev => {
						item.classList.toggle("closed")
						ev.stopPropagation()
					})
				}
			}

			model.forEach(inst => create(inst, inner))

			dropdown.$find(".dropdown-menu").append(btn)
			lists.append(element)

			this.models.push(model)

			if(this.models.length === 1) {
				this.element.$find(".btr-explorer-loading").remove()
				btn.click()
			} else {
				dropdown.style.display = ""
			}
		}
	}
})()
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

	const fixNum = v => { return Math.round(v * 1e3) / 1e3 }
	const fixNums = arr => {
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
	
	const instToItemSymbol = Symbol("btrInstanceToItem")
	
	const widthCalcCanvas = document.createElement("canvas")
	const ctx = widthCalcCanvas.getContext("2d")
	ctx.font = `300 12px "Source Sans Pro", Arial, Helvetica, sans-serif`
	
	const getLineWidth = (text, depth) => {
		return ctx.measureText(text).width + 47 + depth * 20
	}
	
	return class {
		constructor() {
			this.models = []
			this.selection = []

			this.sourceViewerTabs = []
			this.selectedSourceViewerTab = null
			this.sourceViewerModal = null
			
			this.modelCounter = 0
			this.lineHeight = 20
			this.active = false
			
			this.currentFilter = ""
			this.lines = []
			
			window.explorer = this
			
			this.filterView = {
				query: "",
				model: null,
				matches: new Set(),
				visible: new Set(),
				numOpenDescendants: new Map(),
				maxOpenWidth: new Map()
			}
			
			this.defaultView = {
				numOpenDescendants: new Map(),
				maxOpenWidth: new Map()
			}

			const element = this.element = html`
			<div class=btr-explorer-parent>
				<div class=btr-explorer>
					<div class=btr-explorer-header>
						Explorer
						<div class=btr-dropdown-container style="display: none">
							<button class=btr-dropdown-btn>
								<span class=btr-dropdown-label></span>
								<span class=icon-down-16x16 style=vertical-align:initial></span>
							</button>
							<ul class=btr-dropdown-menu style="position:absolute;display:none">
							</ul>
						</div>
					</div>
					<div class=btr-explorer-filter>
						<input class=btr-explorer-filter-input type=text placeholder="Filter model">
					</div>
					<div class=btr-explorer-list style=display:none>
						<div class=btr-explorer-inner-list></div>
						<div class=btr-explorer-list-status style=display:none></div>
					</div>
					<div class=btr-explorer-loading style="text-align:center;margin-top:12px;">Loading</div>
				</div>
				<div class=btr-properties>
					<div class=btr-properties-header></div>
					<div class=btr-properties-container>
					</div>
				</div>
			</div>"`
			
			this.dropdown = this.element.$find(".btr-dropdown-container")
			this.innerList = this.element.$find(".btr-explorer-inner-list")
			this.listStatus = this.element.$find(".btr-explorer-list-status")
			
			const dropdownBtn = element.$find(".btr-dropdown-btn")
			const dropdownMenu = element.$find(".btr-dropdown-menu")

			element.$find(".btr-explorer-list").$on("click", () => {
				this.select([])
			})

			element.$on("click", ev => {
				ev.stopPropagation()
			})
			
			this.filterInput = element.$find(".btr-explorer-filter-input")
			
			this.filterInput.$on("input", () => {
				this.setFilter(this.filterInput.value)
			})

			dropdownBtn.$on("click", ev => {
				ev.stopPropagation()
				dropdownMenu.style.display = dropdownMenu.style.display === "none" ? "block" : "none"
			})

			document.$on("click", ev => {
				if(dropdownMenu.style.display !== "none" && !dropdownMenu.parentNode.contains(ev.target)) {
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
							<div class=btr-sourceviewer-settings-button></div>
							<div class=btr-sourceviewer-settings>
								<div class=btr-sourceviewer-setting-label>Tab Width</div><div class=btr-sourceviewer-setting-value><input data-sv-setting=tabwidth type=number></input></div>
								<div class=btr-sourceviewer-setting-label>Text Wrapping</div><div class=btr-sourceviewer-setting-value><input data-sv-setting=wrapping type=checkbox></input></div>
								<div class=btr-sourceviewer-setting-label>Show Whitespace</div><div class=btr-sourceviewer-setting-value><input data-sv-setting=whitespace type=checkbox></input></div>
							</div>
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

				this.sourceViewerModal.$find(".btr-sourceviewer-settings-button").$on("click", ev => {
					ev.preventDefault()
					ev.stopPropagation()
					ev.stopImmediatePropagation()
					
					ev.target.classList.toggle("active")
				})
				
				const svSettings = {
					tabwidth: 4,
					wrapping: true,
					whitespace: true
				}
				
				try {
					const savedSettings = JSON.parse(localStorage.getItem("btr-sv-settings"))
					
					if(savedSettings) {
						for(const [key, value] of Object.entries(savedSettings)) {
							if(key in svSettings && typeof value === typeof svSettings[key]) {
								svSettings[key] = value
							}
						}
					}
				} catch(ex) {}
				
				const update = () => {
					try { localStorage.setItem("btr-sv-settings", JSON.stringify(svSettings)) }
					catch(ex) {}
					
					this.sourceViewerModal.$find(".btr-sourceviewer-content").style = `
					--sv-tabwidth:${svSettings.tabwidth};
					${svSettings.wrapping ? "" : "--sv-wrapping:pre;"}
					${svSettings.whitespace ? "" : "--sv-whitespace:none;"};`
				}
				
				for(const setting of Object.keys(svSettings)) {
					update(setting)
				}
				
				for(const input of this.sourceViewerModal.$findAll(".btr-sourceviewer-setting-value input")) {
					const setting = input.dataset.svSetting
					
					if(input.type === "checkbox") {
						input.checked = svSettings[setting]
						
						input.$on("change", () => {
							svSettings[setting] = input.checked
							update(setting)
						})
					} else {
						input.value = svSettings[setting]
						
						input.$on("change", () => {
							svSettings[setting] = input.value
							update(setting)
						})
					}
				}
				
				this.sourceViewerModal.$find(".btr-sourceviewer-container").$on("click", ev => {
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


			const source = inst.Properties[propName]?.value || ""

			const content = this.sourceViewerModal.$find(".btr-sourceviewer-content")
			content.$empty()

			btrSourceViewer.init(content, source)

			this.sourceViewerModal.$find(".btr-sourceviewer-content").scrollTop = 0
		}

		updateProperties() {
			const properties = this.element.$find(".btr-properties")
			const header = properties.$find(".btr-properties-header")
			const propertyContainer = properties.$find(".btr-properties-container")
			propertyContainer.$empty()

			if(!this.selection.length) {
				header.textContent = "Properties"
				properties.classList.add("closed")
				return
			}

			properties.classList.remove("closed")

			const target = this.selection[0].inst
			header.textContent = `Properties - ${target.ClassName} "${target.Name}"`

			const groups = []
			const groupMap = {}
			
			Object.entries(target.Properties).forEach(([name, prop]) => {
				if(RenamedProperties[name] && RenamedProperties[name] in target.Properties) { return }
				name = RenamedProperties[name] || name

				let group = ApiDump.getPropertyGroup(target.ClassName, name)
				
				if(group === "Unknown") {
					group = "Data"
				}
				
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
					case "UniqueId":
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
								const more = html`<a class=more href="https://www.roblox.com/library/${id}/Redirect" target=_blank>🔗</a>`
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
					case "Color3": {
						const rgb = value.map(x => Math.round(x * 255))
						valueItem.textContent = `[${rgb.join(", ")}]`
						valueItem.prepend(html`<span class=btr-color3-preview style=background-color:rgb(${rgb.join(",")})></span>`)
						break
					}
					case "BrickColor":
						valueItem.textContent = BrickColor[value]?.name || String(value) + " (Unknown BrickColor)"
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
						console.log("Unknown property type", type, name, prop)
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
		
		select(instances) {
			for(const item of this.selection) {
				item.selected = false
			}
			
			this.selection.splice(0, this.selection.length)
			
			for(const inst of instances) {
				const item = inst[instToItemSymbol]
				if(!item) { continue }
				
				item.selected = true
				this.selection.push(item)
			}
			
			this.updateProperties()
		}

		setFilter(filter) {
			this.filterInput.value = filter // we want leading spaces here so writing isnt jank
			this.currentFilter = filter.trim()
		}
		
		selectModel(model) {
			this.selectedModel = model
			
			this.dropdown.$find(".btr-dropdown-menu").style.display = "none"
			this.dropdown.$find(".btr-dropdown-label").textContent = model.title
			
			this.element.$find(".btr-explorer-list").style.display = ""
			this.element.$find(".btr-explorer-loading").style.display = "none"
			
			for(const li of this.dropdown.$findAll(`.btr-dropdown-menu > li`)) {
				li.classList.toggle("selected", +li.getAttribute("btr-model-id") === model.id)
			}
			
			this.setFilter("")
			this.select([])
		}
		
		isItemVisible(item, view) {
			if(view === this.defaultView) {
				return true
			}
			
			return view.visible.has(item)
		}
		
		bubbleItem(item, view, canBubble = true) {
			if(!this.isItemVisible(item, view)) { return }
			
			let numOpenDescendants = 0
			let maxOpenWidth = item
			let shouldBubble = false
			
			if(item.open) {
				for(const child of item.children) {
					if(this.isItemVisible(child, view)) {
						numOpenDescendants += (view.numOpenDescendants.get(child) ?? 0) + 1
						
						if(item.width && child.width) {
							const childMaxOpenWidth = view.maxOpenWidth.get(child) ?? child
							
							if(childMaxOpenWidth.width > maxOpenWidth.width) {
								maxOpenWidth = childMaxOpenWidth
							}
						}
					}
				}
			}
			
			const oldNumOpenDescendants = view.numOpenDescendants.get(item) ?? 0
			
			if(numOpenDescendants !== oldNumOpenDescendants) {
				view.numOpenDescendants.set(item, numOpenDescendants)
				shouldBubble = true
			}
			
			if(item.width) {
				const oldMaxOpenWidth = view.maxOpenWidth.get(item) ?? item
				
				if(oldMaxOpenWidth !== maxOpenWidth) {
					view.maxOpenWidth.set(item, maxOpenWidth)
					shouldBubble = true
				}
			}
			
			if(canBubble && shouldBubble && item.parent) {
				this.bubbleItem(item.parent, view)
			}
		}
		
		createItem(children) {
			const item = {
				numDescendants: 0,
				children: [],
				selected: false,
				open: true
			}
			
			for(const childInst of children) {
				const grandChildren = [...childInst.Children].sort(sortChildren)
				const child = this.createItem(grandChildren)
				
				childInst[instToItemSymbol] = child
				child.inst = childInst
				child.parent = item
				
				item.numDescendants += child.numDescendants + 1
				item.children.push(child)
			}
			
			this.bubbleItem(item, this.defaultView)
			
			return item
		}
		
		setIsItemOpen(item, bool) {
			if(item.open === !!bool) { return }
			item.open = !!bool
			
			this.bubbleItem(item, this.defaultView)
			this.bubbleItem(item, this.filterView)
		}
		
		addModel(title, modelContents) {
			const modelId = this.modelCounter++
			
			const btn = html`<li btr-model-id="${modelId}"><a title="${title}">${title}</a></li>`
			const didModelLoad = Array.isArray(modelContents)
			
			const model = this.createItem(didModelLoad ? modelContents : [])
			model.id = modelId
			model.didLoad = didModelLoad
			model.isRoot = true
			model.title = title
			
			btn.$on("click", () => this.selectModel(model))
			
			this.dropdown.$find(".btr-dropdown-menu").append(btn)
			this.models.push(model)

			if(this.models.length === 1) {
				this.selectModel(model)
			} else {
				this.dropdown.style.display = ""
			}
		}
		
		update() {
			const model = this.selectedModel
			
			if(!model) {
				this.innerList.style.display = "none"
				this.listStatus.style.display = ""
				
				this.listStatus.textContent = `No model selected`
				return
			}
			
			if(!model.didLoad) {
				this.innerList.style.display = "none"
				this.listStatus.style.display = ""
				
				this.listStatus.textContent = `Failed to load model`
				return
			}
			
			this.listStatus.style.display = "none"
			this.innerList.style.display = ""
			
			const visibleHeightPx = this.innerList.parentNode.clientHeight
			const visibleOffsetPx = this.innerList.parentNode.scrollTop
			
			const visibleStartOffset = Math.max(0, Math.floor(visibleOffsetPx / this.lineHeight))
			const visibleEndOffset = visibleStartOffset + Math.ceil(visibleHeightPx / this.lineHeight) + 1
			
			const numVisibleLines = visibleEndOffset - visibleStartOffset
			
			if(this.lines.length < numVisibleLines) {
				for(let i = this.lines.length; i < numVisibleLines; i++) {
					const elem = html`
					<div class=btr-explorer-item-container>
						<div class=btr-explorer-item>
							<div class=btr-explorer-more></div>
							<div class=btr-explorer-icon></div>
							<span class=btr-explorer-item-name></span>
						</div>
					</div>`
					
					const line = {
						elem: elem,
						btn: elem.$find(".btr-explorer-item"),
						item: null
					}
					
					let lastClick
	
					line.btn.$on("click", ev => {
						ev.stopPropagation()
						ev.stopImmediatePropagation()
						ev.preventDefault()
						
						if(line.item) {
							const inst = line.item.inst
							this.select([inst])
		
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
						}
					})
					
					elem.$find(".btr-explorer-more").$on("click", ev => {
						ev.stopPropagation()
						ev.stopImmediatePropagation()
						ev.preventDefault()
						
						if(line.item) {
							this.setIsItemOpen(line.item, !line.item.open)
						}
					})
					
					this.innerList.append(elem)
					this.lines.push(line)
				}
			} else if(this.lines.length > numVisibleLines) {
				for(let i = numVisibleLines; i <= this.lines.length; i++) {
					const line = this.lines.pop()
					line.elem.remove()
				}
			}
			
			const filterView = this.filterView
			
			if(filterView.query !== this.currentFilter || filterView.model !== model) {
				filterView.query = this.currentFilter
				filterView.model = model
				filterView.matches.clear()
				filterView.visible.clear()
				filterView.numOpenDescendants.clear()
				filterView.maxOpenWidth.clear()
				
				if(filterView.query) {
					this.filterInput.parentNode.classList.add("loading")
					
					filterView.running = {
						words: filterView.query.split(" ").filter(x => x).map(x => x.toLowerCase()),
						current: model,
						stack: [],
						index: 0
					}
				} else {
					this.filterInput.parentNode.classList.remove("loading")
					
					delete filterView.running
				}
			}
			
			const view = filterView.query ? filterView : this.defaultView
			
			const setLineItem = (line, item, depth = 0) => {
				if(item !== line.item) {
					line.item = item
					
					if(item) {
						const icon = ApiDump.getExplorerIconIndex(item.inst.ClassName)
						
						line.elem.$find(".btr-explorer-icon").style.backgroundPosition = `-${icon * 16}px 0`
						line.elem.$find(".btr-explorer-item-name").textContent = item.inst.Name
						
						line.btn.classList.toggle("btr-explorer-has-children", item ? item.children.length > 0 : false)
						
						line.btn.style.paddingLeft = `${depth * 20}px`
						line.btn.style.display = ""
					} else {
						line.btn.style.display = "none"
					}
				}
				
				line.elem.$find(".btr-explorer-item-name").style.opacity = view.query && !view.matches.has(item) ? (!view.visible.has(item) ? "0.2" : "0.5") : ""
				line.btn.classList.toggle("closed", item ? !item.open : false)
				line.btn.classList.toggle("selected", item ? item.selected : false)
			}
			
			if(!model.calculatedWidths) {
				if(!model.widthCalc) {
					model.widthCalc = {
						stack: [],
						current: model,
						index: 0
					}
					
					model.width = 50
					model.maxWidth = 50
				}
				
				const startTime = performance.now()
				const endTime = startTime + 4
				
				const running = model.widthCalc
				
				outer:
				while(performance.now() < endTime) {
					while(running.index >= running.current.children.length) {
						this.bubbleItem(running.current, this.defaultView, false)
						
						if(!running.stack.length) {
							delete model.widthCalc
							model.calculatedWidths = true
							break outer
						}
						
						running.index = running.stack.pop()
						running.current = running.current.parent
					}
					
					const item = running.current.children[running.index]
					running.index += 1

					item.width = getLineWidth(item.inst.Name, running.stack.length)
					
					if(item.width > model.maxWidth) {
						model.maxWidth = item.width
					}
					
					if(item.children.length > 0) {
						running.stack.push(running.index)
						running.current = item
						running.index = 0
					}
				}
			}
			
			if(view.running) {
				const startTime = performance.now()
				const endTime = startTime + 4
				
				const running = view.running
				
				while(performance.now() < endTime) {
					while(running.stack.length && running.index >= running.current.children.length) {
						running.index = running.stack.pop()
						running.current = running.current.parent
					}
					
					const item = running.current.children[running.index]
					
					if(!item) {
						delete view.running
						this.filterInput.parentNode.classList.remove("loading")
						break
					}
					
					running.index += 1
					
					const name = item.inst.Name.toLowerCase()
					const className = item.inst.ClassName.toLowerCase()
					let matches = true
					
					for(const word of running.words) {
						if(!name.includes(word) && !className.includes(word)) {
							matches = false
							break
						}
					}
					
					if(matches) {
						view.matches.add(item)
						
						let bubble = item
						while(bubble && !view.visible.has(bubble)) {
							view.visible.add(bubble)
							this.bubbleItem(bubble, view, false)
							
							bubble = bubble.parent
						}
						
						if(bubble) {
							this.bubbleItem(bubble, view, true)
						}
					}
					
					if(item.children.length > 0) {
						running.stack.push(running.index)
						running.current = item
						running.index = 0
					}
				}
			}

			//
			
			this.innerList.style.paddingTop = `${visibleStartOffset * this.lineHeight}px`
			this.innerList.style.height = `${(view.numOpenDescendants.get(model) ?? 0) * this.lineHeight + 4}px`
			this.innerList.style.width = `${model.calculatedWidths ? (view.maxOpenWidth.get(model) ?? model).width : model.maxWidth}px`
			
			//
			
			const stack = []
			let counter = 0
			
			let current = model
			let currentIndex = 0
			
			for(let i = 0; i < numVisibleLines; i++) {
				const itemIndex = visibleStartOffset + i
				const line = this.lines[i]
				let selectedItem
				
				while(true) {
					while(stack.length && currentIndex >= current.children.length) {
						currentIndex = stack.pop()
						current = current.parent
					}
					
					const item = current.children[currentIndex]
					if(!item) { break }
					
					if(!this.isItemVisible(item, view)) {
						currentIndex += 1
						continue
					}
					
					if(counter >= itemIndex) {
						selectedItem = item
						break
					}
					
					currentIndex += 1
					counter += 1
					
					// const numOpenDescendants = view.numOpenDescendants.get(item) ?? 0
					
					if(item.open) {
					// if(item.open && numOpenDescendants > 0) {
						// if(counter + numOpenDescendants <= itemIndex) {
						// 	counter += numOpenDescendants
						// } else {
							stack.push(currentIndex)
							current = item
							currentIndex = 0
						// }
					}
				}
				
				setLineItem(line, selectedItem, stack.length)
			}
		}
		
		setActive(bool) {
			if(this.active !== !!bool) {
				this.active = !!bool
				
				if(this.active) {
					const updateLoop = () => {
						this.raf = requestAnimationFrame(updateLoop)
						this.update()
					}
					
					this.raf = requestAnimationFrame(updateLoop)
				} else {
					cancelAnimationFrame(this.raf)
					this.raf = null
				}
			}
		}
		
	}
})()
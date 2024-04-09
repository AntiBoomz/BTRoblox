"use strict"

const Explorer = (() => {
	const GroupOrders = [
		"Appearance", "Data", "Transform", "Pivot", "Behavior", "Collision", "Part"
	]
	
	const HiddenProperties = {
		UniqueId: true, HistoryId: true,
		AttributesSerialize: true, Tags: true,
		Capabilities: true, DefinesCapabilities: true,
		SourceAssetId: true,
		
		// Script
		ScriptGuid: true,
		
		// Model
		ModelMeshCFrame: true, ModelMeshSize: true, ModelMeshData: true,
		NeedsPivotMigration: true,
		
		// BasePart
		FormFactor: true,
		HasJointOffset: true, HasSkinnedMesh: true,
		AeroMeshData: true, FluidFidelityInternal: true,
		PhysicalConfigData: true, PhysicsData: true,
		
		// Humanoid
		InternalBodyScale: true, InternalHeadScale: true,
	}
	
	const RenamedProperties = {
		Color3uint8: "Color", formFactorRaw: "FormFactor", Health_XML: "Health", xmlRead_MaxDistance_3: "MaxDistance",
		shape: "Shape", size: "Size", formFactor: "FormFactor", archivable: "Archivable", style: "Style",
		MeshID: "MeshId"
	}

	const fixNum = v => { return Math.round(v * 1e3) / 1e3 }
	const fixNums = arr => arr.map(x => fixNum(x))

	const sortPropertyGroups = (a, b) => (a.Order === b.Order ? (a.Name < b.Name ? -1 : 1) : a.Order - b.Order)
	const sortProperties = (a, b) => (a[0] < b[0] ? -1 : 1)
	const sortChildren = (a, b) => {
		const ao = ApiDump.getExplorerOrder(a.inst.ClassName)
		const bo = ApiDump.getExplorerOrder(b.inst.ClassName)
		return ao !== bo ? ao - bo : (a.inst.Name < b.inst.Name ? -1 : 1)
	}
	
	const widthCalcCanvas = document.createElement("canvas")
	const ctx = widthCalcCanvas.getContext("2d")
	ctx.font = `300 12px "Source Sans Pro", Arial, Helvetica, sans-serif`
	
	const getLineWidth = (text, depth) => {
		return ctx.measureText(text).width + 47 + depth * 20
	}
	
	const explorerIconPromise = new Promise(resolve => {
		// Asset id: 12706538541
		AssetCache.loadBuffer("https://c5.rbxcdn.com/c17885601281c2beda436c55fcedb9cc", { cache: false }).then(buffer => {
			const reader = new FileReader()
			reader.onload = () => resolve(reader.result)
			reader.readAsDataURL(new Blob([new Uint8Array(buffer)], { type: "image/png" }))
		})
	})
	
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
				open: new Set(),
				numOpenDescendants: new Map(),
				maxOpenWidth: new Map()
			}
			
			this.defaultView = {
				numOpenDescendants: new Map(),
				maxOpenWidth: new Map(),
				open: new Set(),
			}
			
			this.loadingText = "Loading"

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
					<div class=btr-explorer-loading style="text-align:center;margin-top:12px;">${this.loadingText}</div>
				</div>
				<div class=btr-properties>
					<div class=btr-properties-header></div>
					<div class=btr-properties-container>
					</div>
				</div>
			</div>"`
			
			explorerIconPromise.then(iconUrl => {
				element.style.setProperty("--btr-explorer-icons", `url(${iconUrl})`)
			})
			
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
		
		getRootElement() {
			return this.sourceViewerModal || this.element
		}
		
		setLoadingText(newText) {
			this.loadingText = newText
			this.element.$find(".btr-explorer-loading").textContent = newText
		}

		closeSourceViewer() {
			const list0 = this.element.$find(".btr-explorer-list")
			const list1 = this.element.$find(".btr-properties-list")
			
			const top0 = list0.scrollTop
			const top1 = list1.scrollTop
			
			if(this.originalParent && document.body.contains(this.originalParent)) {
				this.originalParent.append(this.element)
			} else {
				this.element.remove()
			}

			list0.scrollTop = top0
			list1.scrollTop = top1
			
			this.originalParent = null
			this.selectedSourceViewerTab = null

			this.sourceViewerTabs.splice(0, this.sourceViewerTabs.length)

			this.sourceViewerModal.remove()
			this.sourceViewerModal = null

			document.body.style.overflow = ""

			this.element.$find(".btr-properties").classList.remove("keepopen")
		}

		async openSourceViewer(inst, propName) {
			if(!this.sourceViewerLoadPromise) {
				this.sourceViewerLoadPromise = loadOptionalLibrary("sourceViewer").then(async () => {
					await new Promise(resolve => setTimeout(resolve, 16)) // wait for styles to load in
				})
			}
			
			await this.sourceViewerLoadPromise
			
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

				this.sourceViewerModal.$on("mousedown", ev => {
					ev.preventDefault()
					ev.stopImmediatePropagation()

					this.closeSourceViewer()
				}).$on("click", ev => {
					ev.stopImmediatePropagation()
				})
				
				this.sourceViewerModal.$find(".btr-sourceviewer-container").$on("mousedown", ev => {
					ev.stopImmediatePropagation()
				})

				this.sourceViewerModal.$find(".btr-sourceviewer-settings-button").$on("click", ev => {
					ev.preventDefault()
					ev.stopImmediatePropagation()
					
					ev.target.classList.toggle("active")
				})
				
				const svSettings = {
					tabwidth: 4,
					wrapping: true,
					whitespace: true
				}
				
				try {
					const data = btrLocalStorage.getItem("svSettings")
					
					if(data) {
						for(const [key, value] of Object.entries(data)) {
							if(key in svSettings && typeof value === typeof svSettings[key]) {
								svSettings[key] = value
							}
						}
					}
				} catch(ex) {
					console.error(ex)
				}
				
				const update = () => {
					btrLocalStorage.setItem("svSettings", svSettings)
					
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
				
				document.body.append(this.sourceViewerModal)
				document.body.style.overflow = "hidden"
				
				this.element.$find(".btr-properties").classList.add("keepopen")
				
				const list0 = this.element.$find(".btr-explorer-list")
				const list1 = this.element.$find(".btr-properties-list")
				
				const top0 = list0.scrollTop
				const top1 = list1.scrollTop

				this.originalParent = this.element.parentNode
				this.sourceViewerModal.$find(".btr-sourceviewer-explorer").append(this.element)
				
				list0.scrollTop = top0
				list1.scrollTop = top1
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
			
			const content = this.sourceViewerModal.$find(".btr-sourceviewer-content")
			content.replaceChildren()
			
			const source = inst.Properties[propName]?.value || ""
			SourceViewer.init(content, source)

			this.sourceViewerModal.$find(".btr-sourceviewer-content").scrollTop = 0
		}

		updateProperties() {
			const properties = this.element.$find(".btr-properties")
			const header = properties.$find(".btr-properties-header")
			const propertyContainer = properties.$find(".btr-properties-container")
			propertyContainer.replaceChildren()

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
			
			const hidden = {}
			
			if("TopSurface" in target.Properties) {
				const sides = ["Back", "Bottom", "Front", "Left", "Right", "Top"]
				let allSmooth = false
				
				for(const side of sides) {
					const valueEntry = target.Properties[`${side}Surface`]
					const value = valueEntry?.value ?? 0
					
					hidden[`${side}SurfaceInput`] = true
					hidden[`${side}ParamA`] = true
					hidden[`${side}ParamB`] = true
					
					if(value !== 0) {
						allSmooth = true
						
						if(value === 7 || value === 8) {
							const inputValue = target.Properties[`${side}SurfaceInput`]?.value ?? 0
							
							if(inputValue === 12) {
								hidden[`${side}SurfaceInput`] = false
								hidden[`${side}ParamB`] = false
							} else if(inputValue === 13) {
								hidden[`${side}SurfaceInput`] = false
								hidden[`${side}ParamA`] = false
								hidden[`${side}ParamB`] = false
							}
						}
					}
				}
				
				if(!allSmooth) {
					for(const side of sides) {
						hidden[`${side}Surface`] = true
					}
				}
			}
			
			for(let [name, prop] of Object.entries(target.Properties)) {
				if(RenamedProperties[name] && RenamedProperties[name] in target.Properties) {
					continue
				}
				
				name = RenamedProperties[name] || name
				
				if(HiddenProperties[name] || hidden[name]) {
					continue
				}

				let group = ApiDump.getPropertyGroup(target.ClassName, name)
				
				if(group === "Unknown") {
					group = "Data"
				}
				
				let groupData = groupMap[group]
				if(!groupData) {
					const order = GroupOrders.indexOf(group)
					
					groupData = groupMap[group] = {
						Name: group,
						Order: order === -1 ? 1000 : order,
						Properties: []
					}

					groups.push(groupData)
				}

				groupData.Properties.push([name, prop])
			}

			for(const group of groups.sort(sortPropertyGroups)) {
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
				
				for(const [name, prop] of group.Properties.sort(sortProperties)) {
					const value = prop.value
					let type = prop.type

					if(name === "LinkedSource" && !value) {
						continue
					} else if(name === "BrickColor" && type === "int") {
						type = "BrickColor"
					}

					const nameItem = html`<div class=btr-property-name title=${name}>${name}</div>`
					const valueItem = html`<div class=btr-property-value></div>`

					if(name === "ClassName" || type === "Parent") {
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
							const id = AssetCache.getAssetIdFromUrl(value)
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
				}
			}
		}
		
		select(items) {
			this.selection.splice(0, this.selection.length)
			
			for(const item of items) {
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
			
			if(view.open.has(item)) {
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
		
		createItem(children, open) {
			const item = {
				numDescendants: 0,
				children: []
			}
			
			if(open) {
				this.defaultView.open.add(item)
			}
			
			for(const childInst of children) {
				const child = this.createItem(childInst.Children, open)
				child.inst = childInst
				child.parent = item
				
				this.bubbleItem(child, this.defaultView, false)
				
				item.numDescendants += child.numDescendants + 1
				item.children.push(child)
			}
			
			item.children.sort(sortChildren)
			
			this.bubbleItem(item, this.defaultView, false)
			return item
		}
		
		setIsItemOpen(item, bool, view) {
			if(view.open.has(item) === !!bool) { return }
			
			if(bool) {
				view.open.add(item)
			} else {
				view.open.delete(item)
			}
			
			this.bubbleItem(item, view)
		}
		
		addModel(title, modelContents, params={}) {
			const modelId = this.modelCounter++
			
			const btn = html`<li btr-model-id="${modelId}"><a title="${title}">${title}</a></li>`
			const didModelLoad = Array.isArray(modelContents)
			
			const model = this.createItem(didModelLoad ? modelContents : [], params?.open ?? true)
			model.id = modelId
			model.didLoad = didModelLoad
			model.isRoot = true
			model.title = title
			
			this.setIsItemOpen(model, true, this.defaultView)
			
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
			
			const addedLines = 5
			
			const visibleStartOffset = Math.max(0, Math.floor(visibleOffsetPx / this.lineHeight) - addedLines)
			const visibleEndOffset = visibleStartOffset + Math.ceil(visibleHeightPx / this.lineHeight) + 1 + addedLines
			
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
						icon: elem.$find(".btr-explorer-icon"),
						nameLabel: elem.$find(".btr-explorer-item-name"),
						item: null
					}
					
					let lastClick = 0
	
					line.btn.$on("click", ev => {
						ev.stopPropagation()
						ev.stopImmediatePropagation()
						ev.preventDefault()
						
						if(line.item) {
							this.select([line.item])
		
							if(Date.now() - lastClick < 500) {
								lastClick = 0
		
								switch(line.item.inst.ClassName) {
								case "Script":
								case "LocalScript":
								case "ModuleScript":
									this.openSourceViewer(line.item.inst, "Source")
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
							this.setIsItemOpen(line.item, !this.activeView.open.has(line.item), this.activeView)
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
				filterView.open.clear()
				filterView.open.add(model)
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
			this.activeView = view
			
			if(!model.calculatedWidths && !model.doingStuff) {
				model.doingStuff = true
				
				setTimeout(() => {
					model.doingStuff = false
					
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
				}, 0)
			}
			
			if(view.running && !view.doingStuff) {
				view.doingStuff = true
				
				setTimeout(() => {
					view.doingStuff = false
					
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
								view.open.add(bubble)
								
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
				}, 0)
			}

			//
			
			this.innerList.style.paddingTop = `${visibleStartOffset * this.lineHeight}px`
			this.innerList.style.height = `${(view.numOpenDescendants.get(model) ?? 0) * this.lineHeight + 4}px`
			this.innerList.style.width = `${model.calculatedWidths ? (view.maxOpenWidth.get(model) ?? model).width : model.maxWidth}px`
			
			//
			
			const setLineItem = (line, item, depth = 0) => {
				if(item !== line.item) {
					line.item = item
					
					if(item) {
						const icon = ApiDump.getExplorerIconIndex(item.inst.ClassName)
						
						line.icon.style.backgroundPosition = `-${(icon % 64) * 16}px -${Math.floor(icon / 64) * 16}px`
						line.nameLabel.textContent = item.inst.Name
						
						line.btn.classList.toggle("btr-explorer-has-children", item ? item.children.length > 0 : false)
						
						line.btn.style.paddingLeft = `${depth * 20}px`
						line.btn.style.display = ""
					} else {
						line.btn.style.display = "none"
					}
				}
				
				line.nameLabel.style.opacity = view.query && !view.matches.has(item) ? (!view.visible.has(item) ? "0.2" : "0.5") : ""
				line.btn.classList.toggle("closed", item ? !this.activeView.open.has(item) : false)
				line.btn.classList.toggle("selected", item ? this.selection.includes(item) : false)
			}
			
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
					
					const numOpenDescendants = view.numOpenDescendants.get(item) ?? 0
					
					if(view.open.has(item) && numOpenDescendants > 0) {
						if(counter + numOpenDescendants <= itemIndex) {
							counter += numOpenDescendants
						} else {
							stack.push(currentIndex)
							current = item
							currentIndex = 0
						}
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
					
					if(this.sourceViewerModal) {
						this.closeSourceViewer()
					}
				}
			}
		}
	}
})()
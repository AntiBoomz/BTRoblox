"use strict"

const SettingsModal = {
	enabled: false,
	
	toggle(force) {
		$.assert(this.enabled, "not enabled")
		this.init()
		
		const visible = typeof force === "boolean" ? force : this.settingsDiv.parentNode !== document.body
		this.visible = visible
		
		if(visible) {
			document.$watch(">body", body => this.visible && body.appendChild(this.settingsDiv))
			
			if(location.hostname === "create.roblox.com") {
				this.settingsDiv.classList.add("btr-dark-theme")
			} else {
				const copyThemeFromElement = target => {
					this.settingsDiv.classList.toggle("btr-light-theme", target.classList.contains("light-theme"))
					this.settingsDiv.classList.toggle("btr-dark-theme", target.classList.contains("dark-theme"))
				}
			
				document.$watch(".light-theme:not(.btr-settings-modal), .dark-theme:not(.btr-settings-modal)", target => {
					if(this.themeObserver || !this.settingsDiv.parentNode) { return }

					this.themeObserver = new MutationObserver(() => copyThemeFromElement(target))
					this.themeObserver.observe(target, { attributeFilter: ["class"], attributes: true })
					copyThemeFromElement(target)
				})
			}

			const lastContentOpen = sessionStorage.getItem("btr-settings-open")
			if(lastContentOpen && this.contentDivs[lastContentOpen]) {
				this.switchContent(lastContentOpen)
			} else {
				this.switchContent("main")
			}
		} else {
			this.switchContent("main")
			
			sessionStorage.removeItem("btr-settings-open")
			this.settingsDiv.remove()

			if(this.themeObserver) {
				this.themeObserver.disconnect()
				this.themeObserver = null
			}
		}
	},
	
	enable() {
		this.enabled = true
		document.$on("click", ".btr-settings-toggle", () => this.toggle())
		
		// we only want to remember settings visibility when navigating same-origin or through history
		if(sessionStorage.getItem("btr-settings-open") && performance.getEntriesByType("navigation")[0]?.type === "navigate") {
			let sameOrigin = false
			
			try { sameOrigin = new URL(document.referrer).host === location.host }
			catch(ex) {}
			
			if(!sameOrigin) {
				sessionStorage.removeItem("btr-settings-open")
			}
		}
		
		try {
			const url = new URL(window.location.href)

			if(url.searchParams.get("btr_settings_open")) {
				sessionStorage.setItem("btr-settings-open", true)

				url.searchParams.delete("btr_settings_open")
				window.history.replaceState(null, null, url.toString())
			}
		} catch(ex) {}

		if(sessionStorage.getItem("btr-settings-open")) {
			try { this.toggle(true) }
			catch(ex) { console.error(ex) }
		}
	},
	
	switchContent(name) {
		$.assert(this.enabled, "not enabled")
		
		if(this.currentContent === name) { return }

		const lastElem = this.currentContent && this.contentDivs[this.currentContent]
		if(lastElem) {
			lastElem.classList.remove("selected")
		}

		const newElem = name && this.contentDivs[name]
		if(newElem) {
			newElem.classList.add("selected")
		}

		this.currentContent = name
		sessionStorage.setItem("btr-settings-open", name)
	},
	
	init() {
		$.assert(this.enabled, "not enabled")
		if(this.settingsDiv) { return }
		
		this.settingsDiv = html`
		<div class=btr-settings-modal>
			<div class=btr-settings>
				<div class=btr-settings-header>
					<div class=btr-settings-header-title>BTRoblox</div>
					<div style="flex: 1 1 auto"></div>
					<div class="btr-settings-header-close btr-settings-toggle">✖</div>
				</div>
				<div class="btr-settings-content selected" id=btr-settings-main data-name=main>
					<group label=General path=general>
						<div>
							<select path=theme>
								<option selected disabled>Select Theme: (%opt%)</option>
								<option value=default>Default</option>
								<option value=simblk>Simply Black</option>
								<option value=sky>Sky</option>
								<option value=red>Red</option>
							</select>
							
							<checkbox devOnly label="Theme Hot Reload" path=themeHotReload></checkbox>
						</div>
	
						<checkbox label="Hide Ads" path=hideAds></checkbox>
						<checkbox label="Fast User Search" path=general.fastSearch></checkbox>
						<div>
							<checkbox label="Show Chat" path=!hideChat></checkbox>
							<checkbox label="Minimize Chat" path=smallChatButton require=!hideChat></checkbox>
						</div>
						<checkbox label="Show 'Copy Id' Context Items" path=enableContextMenus></checkbox>
						<checkbox label="Higher Robux Precision" path=higherRobuxPrecision></checkbox>
						
						<div style="display: inline-block; width: 50%; padding: 2px; float: right;">
							<label style="">Robux to Cash Conversion Rate</label>
							<span style="width: calc(100% - 14px); display: inline-flex;">
								<select id=btr-robuxToCash-currency style="flex: 0 1 auto"></select>
								<select id=btr-robuxToCash-rate style="flex: 1 1 auto; min-width: 0; margin-left: 4px"></select>
							</span>
							<span class=btr-setting-reset-button path=general.robuxToUSDRate></span>
						</div>
					</group>
					<group label=Navigation path=navigation toggleable>
						<checkbox label="Keep Sidebar Open" path=noHamburger require=false></checkbox>
						<button btr-tab=navigation class=btn-control-xs>Modify Buttons</button>
					</group>
					<group label=Home path=home>
						<checkbox label="Show More Connections" path=friendsSecondRow></checkbox>
						<checkbox label="Show Connection Usernames" path=friendsShowUsername></checkbox>
						<checkbox label="Move Favorites to Top" path=favoritesAtTop></checkbox>
						<checkbox label="Hide Connection Activity" path=hideFriendActivity></checkbox>
					</group>
					<group label=Profile path=profile toggleable>
						<checkbox label="Embed Inventory" path=embedInventoryEnabled></checkbox>
					</group>
					<group label=Groups path=groups toggleable>
						<checkbox label="Modify Layout" path=modifyLayout></checkbox>
					</group>
					<group label="Game Details" path=gamedetails toggleable>
						<checkbox label="Highlight Owned Badges" path=showBadgeOwned></checkbox>
						<checkbox label="Compact Badge Stats" path=compactBadgeStats></checkbox>
						<checkbox label="Paged Server List" path=addServerPager></checkbox>
					</group>
					<group label="Item Details" path=itemdetails toggleable>
						<checkbox label="Item Previewer" path=itemPreviewer></checkbox>
						<button btr-tab=itemPreviewerSettings class=btn-control-xs>Previewer Preferences</button>
						<checkbox label="Show Explorer Button" path=explorerButton></checkbox>
						<checkbox label="Show Download Button" path=downloadButton></checkbox>
						<checkbox label="Show Content Button" path=contentButton></checkbox>
					</group>
					<group label=Inventory path=inventory toggleable>
						<checkbox label="Inventory Tools" path=inventoryTools></checkbox>
					</group>
					<group label=Catalog path=catalog toggleable>
						<checkbox label="Show Owned Items" path=showOwnedAssets></checkbox>
					</group>
					<group label="Create" path=create toggleable>
						<checkbox label="Downloadable Version History" path=downloadVersion></checkbox>
						<checkbox label="Modify Asset Options" path=assetOptions></checkbox>
					</group>
					<group label="Advanced" minimizable minimized>
						<div id=btr-settings-wip>
						</div>
						<details id=btr-settings-experiments>
							<summary>Roblox Experiment Editor</summary>
						</details>
						<div style="margin-top: 12px; float:right; width: 100%; clear:both">
							<button id=btr-fix-chat class=btn-control-xs style=float:left>Fix invis chat messages</button>
							<button id=btr-reset-settings class=btn-control-xs style=float:right>Reset settings to default</button>
						</div>
					</group>
				</div>
				
				<div class=btr-settings-content data-name=navigation>
					<div class=btr-settings-content-header>
						<button class="btn-control-sm btr-close-subcontent"><span class=icon-left></span></button>
						<h4>Navigation Buttons</h4>
					</div>
					<div style="display:flex">
						<group label="Sidebar" style="width:50%">
						</group>
						<group label="Header" style="width:50%">
						</group>
					</div>
				</div>
				
				<div class=btr-settings-content id=btr-settings-item-previewer data-name=itemPreviewerSettings>
					<div class=btr-settings-content-header>
						<button class="btn-control-sm btr-close-subcontent"><span class=icon-left></span></button>
						<h4>Item Previewer Preferences</h4>
					</div>
					<div>
						<group>
							<checkbox label="Item Previewer" path=itemdetails.itemPreviewer></checkbox>
							<checkbox label="Hover Previewer" path=general.hoverPreview></checkbox>
							<br>
							<checkbox label="Show Layered Clothing (WIP)" path=general.previewLayeredClothing></checkbox>
							<br>
							<select label="Automatically open previewer:" path=itemdetails.itemPreviewerMode>
								<option value=never>Never</option>
								<option value=animations>For Animations</option>
								<option value=always>Always</option>
							</select>
							<select label="Preview on hover:" path=general.hoverPreviewMode>
								<option value=never>Never</option>
								<option value=always>Always</option>
							</select>
						</group>
					</div>
				</div>
				<div class=btr-settings-footer>
					<div class=btr-settings-footer-version>v${chrome.runtime.getManifest().version}</div>
					<a href=https://x.com/AntiBoomz target=_blank title="Contact me on X" class=btr-settings-footer-x></a>
					<a href=https://www.roblox.com/users/4719353/profile target=_blank title="Check me out on Roblox" class=btr-settings-footer-roblox></a>
					<div class=btr-settings-footer-text>Refresh the page to apply settings</div>
				</div>
			</div>
		</div>`
		
		if(!IS_DEV_MODE) {
			for(const elem of this.settingsDiv.$findAll("[devOnly]")) {
				elem.remove()
			}
		}
		
		if(SETTINGS.loadError) {
			this.settingsDiv.$find(".btr-settings-header").after(html`<div style="width: 100%; flex: 0 0 auto; white-space: pre-line; padding: 4px; text-align: center; background: red; top: 30px; z-index:1000; font-size: 15px; color: white; font-weight: bold;">Settings failed to load, changes may not save</div>`)
		}
		
		if(SHARED_DATA.syncLoadError) {
			this.settingsDiv.$find(".btr-settings-header").after(html`<div style="width: 100%; flex: 0 0 auto; white-space: pre-line; padding: 4px; text-align: center; background: red; top: 30px; z-index:1000; font-size: 15px; color: white; font-weight: bold;">${SHARED_DATA.syncLoadError}</div>`)
		}
		
		this.contentDivs = {}
		
		for(const elem of this.settingsDiv.$findAll(".btr-settings-content[data-name]")) {
			elem.classList.remove("selected")
			this.contentDivs[elem.dataset.name] = elem
		}
	
		this.settingsDiv.$on("click", "[btr-tab]:not([disabled])", ev => this.switchContent(ev.currentTarget.getAttribute("btr-tab")))
		this.settingsDiv.$on("click", ".btr-close-subcontent", () => this.switchContent("main"))

		this.settingsDiv.$on("click", "#btr-fix-chat", () => {
			RobloxApi.chat.getUserConversations(1, 10).then(json => {
				for(const conversation of json) {
					RobloxApi.chat.markAsRead(conversation.id)
				}
			})
		})
		
		//
		
		let labelCounter = 0
		
		{ // Navigation Buttons
			const navButtons = this.settingsDiv.$find(`.btr-settings-content[data-name="navigation"]`)
			const header = navButtons.$find(`group[label="Header"]`)
			const sidebar = navButtons.$find(`group[label="Sidebar"]`)
			
			const onUpdate = []
			
			const createCheckbox = (labelText, callback) => {
				const checkbox = html`<checkbox></checkbox>`
				checkbox.classList.add("btr-settings-checkbox")
				
				const labelIndex = labelCounter++
				const label = html`<label for="btr-settings-input-${labelIndex}" title="${labelText}">${labelText}</label>`
				
				const input = html`<input type=checkbox id="btr-settings-input-${labelIndex}">`
				const resetButton = html`<span class=btr-setting-reset-button></span>`
				
				input.$on("change", () => callback(input.checked))
				resetButton.$on("click", () => callback(null))
				
				checkbox.append(input, label, resetButton)
				return { elem: checkbox, input, resetButton }
			}
			
			for(const element of Object.values(Navigation.elements)) {
				if(element.parent) { continue }
				
				const checkbox = createCheckbox(element.label || element.name, enabled => {
					element.setEnabled(enabled)
				})
				
				const parent = element.name.startsWith("header") ? header : sidebar
				parent.append(checkbox.elem)
				
				onUpdate.push(() => {
					checkbox.input.checked = element.enabled
					checkbox.resetButton.classList.toggle("disabled", element.isDefault)
				})
				
				if(element.settings) {
					for(const setting of Object.values(element.settings)) {
						const settingCheckbox = createCheckbox(setting.label || setting.name, enabled => {
							setting.setEnabled(enabled)
						})
						
						settingCheckbox.elem.style.paddingLeft = "20px"
						parent.append(settingCheckbox.elem)
						
						onUpdate.push(() => {
							settingCheckbox.input.checked = setting.enabled
							settingCheckbox.resetButton.classList.toggle("disabled", setting.isDefault)
						})
					}
				}
			}
			
			const update = () => {
				for(const fn of onUpdate) {
					fn()
				}
			}
			
			SETTINGS.onChange("navigation.elements", update)
			update()
		}
		
		{ // RobuxToCash
			const currencySelect = this.settingsDiv.$find("#btr-robuxToCash-currency")
			const rateSelect = this.settingsDiv.$find("#btr-robuxToCash-rate")

			currencySelect.replaceChildren()
			rateSelect.replaceChildren()

			const currencies = Object.values(RobuxToCash.Currencies)
			
			for(const currency of currencies.filter(x => !x.usdRate))  {
				currencySelect.append(html`<option>${currency.name}</option>`)
			}
			
			for(const currency of currencies.filter(x => x.usdRate).sort((a, b) => (a.name < b.name ? -1 : 1))) {
				currencySelect.append(html`<option title="Rates are estimations based on USD-${currency.name} exchange rate on ${RobuxToCash.UpdateDate}" value="${currency.name}">${currency.name}*</option>`)
			}

			const setRate = () => {
				SETTINGS.set("general.robuxToUSDRate", rateSelect.value)
			}

			currencySelect.$on("change", () => {
				SETTINGS.set("general.robuxToUSDRate", RobuxToCash.OptionLists[currencySelect.value][0].name)
			})

			rateSelect.$on("change", setRate)

			const updateRate = () => {
				const name = RobuxToCash.getSelectedOption().currency.name
				currencySelect.value = name

				rateSelect.replaceChildren()
				let selected = false

				for(const option of RobuxToCash.OptionLists[name]) {
					let fullText = ""
					
					if(option.name === "none") {
						fullText = "No currency selected"
					} else {
						const display = option.name.includes("devex") ? "DevEx"
							: option.name.includes("Subscription") ? "Subscription"
							: option.name.includes("Premium") ? "Premium"
							: "Regular"
						
						const rateText = option.currency.usdRate ?
							`${option.currency.symbol}${(option.cash / 100).toFixed(option.currency.numFractions)} ≈ US$${(option.usdCash / 100).toFixed(2)} = R$${option.robux}`
							: `${option.currency.symbol}${(option.cash / 100).toFixed(option.currency.numFractions)} = R$${option.robux}`
					
						fullText = `${display} (${rateText})`
					}
					
					rateSelect.append(html`<option value="${option.name}">${fullText}</option>`)

					if(option.name === SETTINGS.get("general.robuxToUSDRate")) {
						selected = true
					}
				}
				
				if(selected) {
					rateSelect.value = SETTINGS.get("general.robuxToUSDRate")
				} else {
					rateSelect.value = rateSelect.options[0].value
					setRate()
				}
				
				if(name === "None") {
					rateSelect.setAttribute("disabled", "")
				} else {
					rateSelect.removeAttribute("disabled")
				}
			}

			SETTINGS.onChange("general.robuxToUSDRate", updateRate)
			updateRate()
		}

		{ // Reset Settings
			const resetButton = this.settingsDiv.$find("#btr-reset-settings")
			const resetButtonDefaultText = resetButton.textContent
			let isResetting = false
			let resetInterval
			let resetTimer

			resetButton.$on("click", () => {
				if(!isResetting) {
					isResetting = true

					resetTimer = 3
					resetButton.textContent = `Are you sure? (${resetTimer})`

					resetInterval = setInterval(() => {
						if(--resetTimer > 0) {
							resetButton.textContent = `Are you sure? (${resetTimer})`
							return
						}

						clearInterval(resetInterval)
						resetInterval = null
						resetButton.textContent = resetButtonDefaultText
						isResetting = false
					}, 1e3)
					return
				}

				clearInterval(resetInterval)
				resetInterval = null
				resetButton.textContent = resetButtonDefaultText
				isResetting = false

				SETTINGS.resetToDefault()
			})
		}

		// Settings 

		const settingsDone = {}
		const joinPaths = (group, path) => (!group || path.includes(".") ? path : `${group}.${path}`)

		for(const group of this.settingsDiv.$findAll("group")) {
			const groupPath = group.getAttribute("path") || ""

			const titleContainer = html`<div class=btr-setting-group-title-container></div>`
			const title = html`<h4>${group.getAttribute("label") || ""}</h4>`
			titleContainer.prepend(title)
			group.prepend(titleContainer)

			if(group.hasAttribute("minimizable")) {
				const contentContainer = html`<div class=btr-setting-group-content></div>`
				titleContainer.after(contentContainer)

				while(contentContainer.nextSibling) {
					contentContainer.append(contentContainer.nextSibling)
				}
				
				title.$on("click", () => {
					if(group.hasAttribute("minimized")) {
						group.removeAttribute("minimized")
					} else {
						group.setAttribute("minimized", "")
					}
				})
			}
			
			if(group.hasAttribute("toggleable")) {
				const toggleSetting = group.getAttribute("toggleable") || "enabled"
				const settingPath = joinPaths(groupPath, toggleSetting)
				settingsDone[settingPath] = true

				const toggle = html`<div class=btr-settings-enabled-toggle>`
				title.after(toggle)

				const resetButton = html`<span class=btr-setting-reset-button path=${settingPath}></span>`
				toggle.append(resetButton)

				const update = () => {
					const enabled = SETTINGS.get(settingPath)
					toggle.classList.toggle("checked", enabled)

					group.classList.toggle("btr-group-disabled", !enabled)
				}

				toggle.$on("click", () => {
					SETTINGS.set(settingPath, !SETTINGS.get(settingPath))
				})

				SETTINGS.onChange(settingPath, update)
				update()
			}

			for(const select of group.$findAll("select[path]")) {
				const settingPath = joinPaths(groupPath, select.getAttribute("path"))
				settingsDone[settingPath] = true

				const wrapper = html`<div class=btr-select></div>`
				const resetButton = html`<span class=btr-setting-reset-button path=${settingPath}></span>`

				if(select.hasAttribute("label")) {
					wrapper.append(html`<label>${select.getAttribute("label") || ""}</label>`, html`<br>`)
				}

				select.before(wrapper)
				wrapper.append(select, resetButton)

				const titleOption = select.options[0] && select.options[0].hasAttribute("disabled") ? select.options[0] : null
				const titleOptionFormat = titleOption ? titleOption.textContent : null

				if(titleOption) {
					titleOption.style.display = "none"
				}

				const update = () => {
					select.value = SETTINGS.get(settingPath)

					const selected = select.selectedOptions[0]
					if(selected && titleOption && titleOption !== selected) {
						titleOption.textContent = titleOptionFormat.replace(/%opt%/g, () => selected.textContent)
						select.value = titleOption.value
					}
				}

				select.$on("change", () => {
					const selected = select.selectedOptions[0]
					if(!selected || selected.hasAttribute("disabled")) { return }

					SETTINGS.set(settingPath, select.value)
				})
				
				SETTINGS.onChange(settingPath, update)
				update()

				const requireAttr = select.getAttribute("require") || "enabled"
				const requirePath = joinPaths(groupPath, requireAttr.replace(/^!/, ""))

				if(SETTINGS.hasSetting(requirePath)) {
					const requireUpdate = () => {
						let value = SETTINGS.get(requirePath)
						if(requireAttr.startsWith("!")) { value = !value }

						if(value) {
							select.removeAttribute("disabled")
						} else {
							select.setAttribute("disabled", "")
						}
					}
					
					SETTINGS.onChange(requirePath, requireUpdate)
					requireUpdate()
				}
			}

			for(const checkbox of group.$findAll("checkbox[path]")) {
				const settingAttr = checkbox.getAttribute("path")
				const settingPath = joinPaths(groupPath, settingAttr.replace(/^!/, ""))
				settingsDone[settingPath] = true

				checkbox.classList.add("btr-settings-checkbox")

				const input = html`<input type=checkbox>`
				checkbox.prepend(input)

				const labelIndex = labelCounter++
				input.id = `btr-settings-input-${labelIndex}`

				const labelText = checkbox.hasAttribute("label") ? checkbox.getAttribute("label") : settingPath
				const label = html`<label for=btr-settings-input-${labelIndex} title="${labelText}">${labelText}</label>`
				checkbox.append(label)

				if(SETTINGS.hasSetting(settingPath)) {
					input.$on("change", () => {
						let value = input.checked
						if(settingAttr.startsWith("!")) { value = !value }

						SETTINGS.set(settingPath, value)
					})

					const resetButton = html`<span class=btr-setting-reset-button path=${settingPath}></span>`
					label.after(resetButton)

					const update = () => {
						let value = !!SETTINGS.get(settingPath)
						if(settingAttr.startsWith("!")) { value = !value }

						input.checked = value
					}
	
					SETTINGS.onChange(settingPath, update)
					update()
	
					const requireAttr = checkbox.getAttribute("require") || "enabled"
					const requirePath = joinPaths(groupPath, requireAttr.replace(/^!/, ""))
	
					if(SETTINGS.hasSetting(requirePath)) {
						const requireUpdate = () => {
							let value = SETTINGS.get(requirePath)
							if(requireAttr.startsWith("!")) { value = !value }

							if(value) {
								input.removeAttribute("disabled")
							} else {
								input.setAttribute("disabled", "")
							}
						}
						
						SETTINGS.onChange(requirePath, requireUpdate)
						requireUpdate()
					}
				} else {
					label.textContent += " (Bad setting)"
				}
			}
		}

		const wipGroup = this.settingsDiv.$find("#btr-settings-wip")
		
		for(const [groupPath, settingsGroup] of Object.entries(SETTINGS.loadedSettings)) {
			for(const [settingName, settingValueInfo] of Object.entries(settingsGroup)) {
				const defaultValueInfo = DEFAULT_SETTINGS[groupPath][settingName]
				const settingValue = settingValueInfo.value

				const settingPath = `${groupPath}.${settingName}`
				if(settingsDone[settingPath] || defaultValueInfo.hidden) { continue }

				if(typeof settingValue === "boolean") {
					const checkbox = html`<checkbox></checkbox>`
					const input = html`<input id=btr-settings-input-${labelCounter} type=checkbox>`
					const label = html`<label for=btr-settings-input-${labelCounter++} title="${settingPath}">${settingPath}</label>`

					checkbox.append(input)
					checkbox.append(label)

					const resetButton = html`<span class=btr-setting-reset-button path=${settingPath}></span>`
					checkbox.append(resetButton)

					wipGroup.append(checkbox)

					const update = () => {
						input.checked = !!SETTINGS.get(settingPath)
					}

					input.$on("change", () => {
						SETTINGS.set(settingPath, input.checked)
					})

					SETTINGS.onChange(settingPath, update)
					update()
				} else if(typeof settingValue === "string" && defaultValueInfo.validValues) {
					const select = html`<select style="width:50%">
						<option selected disabled>${settingPath}</option>
					</select>`
					
					for(const value of defaultValueInfo.validValues) {
						select.append(html`<option value="${value}">${value}</option>`)
					}
					
					wipGroup.append(select)
					
					const titleOption = select.options[0] && select.options[0].hasAttribute("disabled") ? select.options[0] : null
					const titleOptionFormat = titleOption ? titleOption.textContent : null

					if(titleOption) {
						titleOption.style.display = "none"
					}

					const update = () => {
						select.value = SETTINGS.get(settingPath)

						const selected = select.selectedOptions[0]
						if(selected && titleOption && titleOption !== selected) {
							titleOption.textContent = titleOptionFormat.replace(/%opt%/g, () => selected.textContent)
							select.value = titleOption.value
						}
						
						for(const option of select.$findAll("option:not([disabled])")) {
							option.textContent = option === selected ? `${option.value} (selected)` : option.value
						}
					}

					select.$on("change", () => {
						const selected = select.selectedOptions[0]
						if(!selected || selected.hasAttribute("disabled")) { return }

						SETTINGS.set(settingPath, select.value)
					})
					
					SETTINGS.onChange(settingPath, update)
					update()
				} else {
					wipGroup.append(html`<div>${settingPath} (${typeof settingValue})`)
				}
			}
		}
		
		for(const btn of this.settingsDiv.$findAll(".btr-setting-reset-button")) {
			btn.append(html`<span class=btr-cross></span>`)
		}
		
		for(const btn of this.settingsDiv.$findAll(".btr-setting-reset-button[path]")) {
			const settingPath = btn.getAttribute("path")

			const update = () => {
				btn.classList.toggle("disabled", SETTINGS.getIsDefault(settingPath))
			}

			btn.$on("click", ev => {
				SETTINGS.reset(settingPath)
				ev.preventDefault()
				ev.stopPropagation()
			})

			SETTINGS.onChange(settingPath, update)
			update()
		}
		
		this.robloxExperimentsChanged()
	},
	
	experiments: {},
	
	getSavedExperiments() {
		const data = SETTINGS.get("general.experiments")
		let saved
		
		try { saved = JSON.parse(data || "{}") }
		catch(ex) { console.error(ex) }
		
		return saved instanceof Object && !Array.isArray(saved) ? saved : {}
	},
	
	robloxExperimentsChanged() {
		if(!this.settingsDiv) { return }
		
		const populate = (experiments, defaultToUndefined) => {
			for(const [experiment, values] of Object.entries(experiments)) {
				let group = this.experiments[experiment]
				
				if(!group) {
					const details = html`<details class=group open><summary title=${experiment}>${experiment}</summary><div class=contents></div></details>`
					
					group = this.experiments[experiment] = {
						name: experiment,
						details: details,
						contents: details.$find(".contents"),
						entries: {}
					}
					
					const keys = Object.keys(this.experiments).sort()
					const next = this.experiments[keys[keys.indexOf(experiment) + 1]]
					
					if(next) {
						next.details.before(details)
					} else {
						this.settingsDiv.$find("#btr-settings-experiments").append(details)
					}
				}
				
				for(const [key, value] of Object.entries(values)) {
					let entry = group.entries[key]
					
					if(!entry) {
						const label = html`<div class=name title=${key}>${key}</div>`
						const resetButton = html`<span class=btr-setting-reset-button><span class=btr-cross></span></span>`
						const input = html`<input class=value type=text>`
						
						const update = initial => {
							resetButton.style.display = input.value ? "" : "none"
							
							let parsedValue = undefined
							let valid = true
							
							if(input.value) {
								try { JSON.parse(input.value) }
								catch(ex) { valid = false }
							}
							
							input.classList.toggle("invalid", !valid)
							
							if(initial) { return }
							
							injectScript.send("updateExperiment", experiment, key, input.value)
							
							const data = this.getSavedExperiments()
							
							if(input.value) {
								data[experiment] ??= {}
								data[experiment][key] = input.value
							} else {
								if(data[experiment]) {
									delete data[experiment][key]
									
									if(Object.keys(data[experiment]).length === 0) {
										delete data[experiment]
									}
								}
							}
							
							SETTINGS.set("general.experiments", JSON.stringify(data))
						}
						
						input.value = this.getSavedExperiments()[experiment]?.[key] || ""
						update(true)
						
						resetButton.$on("click", () => {
							input.value = ""
							update()
						})
						
						input.$on("keydown", ev => ev.keyCode === 13 && input.blur())
						input.$on("blur", () => update())
						
						label.append(resetButton)
						
						entry = group.entries[key] = {
							label: label,
							resetButton: resetButton,
							input: input,
							
							experiment: experiment,
							key: key
						}
						
						const keys = Object.keys(group.entries).sort()
						const next = group.entries[keys[keys.indexOf(key) + 1]]
						
						if(next) {
							next.label.before(label, input)
						} else {
							group.contents.append(label, input)
						}
					}
					
					entry.input.placeholder = JSON.stringify(defaultToUndefined ? undefined : value)
				}
			}
		}
		
		populate(this.getSavedExperiments(), true)
		populate(robloxExperiments)
	}
}
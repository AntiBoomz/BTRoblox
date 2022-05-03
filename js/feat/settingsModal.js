"use strict"

const btrSettingsModal = (() => {
	const settingsDiv = html`
	<div class=btr-settings-modal style=opacity:0>
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
					
					<div style="display: inline-block; width: 50%; padding: 6px 2px;float:right;">
						<label style="">Robux to Cash Conversion Rate</label>
						<span style="width: calc(100% - 14px); display: inline-flex;">
							<select id=btr-robuxToCash-currency style="flex: 0 1 auto"></select>
							<select id=btr-robuxToCash-rate style="flex: 1 1 auto; min-width: 0; margin-left: 4px"></select>
						</span>
						<span class=btr-setting-reset-button path=general.robuxToUSDRate></span>
					</div>
					
					<checkbox label="Lower Default Audio Volume" path=fixAudioVolume></checkbox>
					<checkbox label="Audio Player Controls" path=useNativeAudioPlayer></checkbox>
				</group>
				<group label=Navigation path=navigation toggleable>
					<checkbox label="Keep Sidebar Open" path=noHamburger require=false></checkbox>
					<button btr-tab=navigation class=btn-control-xs>Modify Buttons</button>
				</group>
				<group label=Home path=home>
					<checkbox label="Show Friend Usernames" path=friendsShowUsername></checkbox>
					<checkbox label="Show More Friends" path=friendsSecondRow></checkbox>
				</group>
				<group label=Profile path=profile toggleable>
					<checkbox label="Embed Inventory" path=embedInventoryEnabled></checkbox>
					<checkbox label="Show Last Online" path=lastOnline></checkbox>
				</group>
				<group label=Groups path=groups toggleable=redesign>
					<div>
						<checkbox label="Group Shout Notifications" path=shoutAlerts require=false></checkbox>
						<button btr-tab=shoutFilters class=btn-control-xs>Modify Shout Filters</button>
					</div>
					<div>
						<empty></empty>
						<button btr-tab=groupRedesign class=btn-control-xs>Modify Redesign Options</button>
					</div>
				</group>
				<group label="Game Details" path=gamedetails toggleable>
					<checkbox label="Highlight Owned Badges" path=showBadgeOwned></checkbox>
					<checkbox label="Add Server List Pager" path=addServerPager></checkbox>
				</group>
				<group label="Item Details" path=itemdetails toggleable>
					<checkbox label="Item Previewer" path=itemPreviewer></checkbox>
					<button btr-tab=itemPreviewerSettings class=btn-control-xs>Previewer Preferences</button>
					<checkbox label="Show Explorer Button" path=explorerButton></checkbox>
					<checkbox label="Show Download Button" path=downloadButton></checkbox>
					<checkbox label="Show Content Button" path=contentButton></checkbox>
					<checkbox label="Show Owners Button" path=addOwnersList></checkbox>
				</group>
				<group label=Inventory path=inventory toggleable>
					<checkbox label="Inventory Tools" path=inventoryTools></checkbox>
				</group>
				<group label=Catalog path=catalog toggleable>
					<checkbox label="Show Owned Items" path=showOwnedAssets></checkbox>
				</group>
				<group label="Place Configure" path=placeConfigure>
					<checkbox label="Version History" path=versionHistory></checkbox>
				</group>
				<group label="Advanced" minimizable minimized>
					<div id=btr-settings-wip>
					</div>
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
					<group label="Header">
					</group>
					<group label="Sidebar">
					</group>
				</div>
			</div>
			<div class=btr-settings-content id=btr-settings-shout-filters data-name=shoutFilters>
				<div class=btr-settings-content-header>
					<button class="btn-control-sm btr-close-subcontent"><span class=icon-left></span></button>
					<h4>Group Shout Filters</h4>
				</div>
				<div class=btr-filter-lists>
					<div class=btr-filter-list>
						<h5 class=btr-filter-list-header>Enabled</h5>
						<ul class=btr-filter-enabled>
						</ul>
					</div>
					<div class=btr-filter-center>
					</div>
					<div class=btr-filter-list>
						<h5 class=btr-filter-list-header>Disabled</h5>
						<ul class=btr-filter-disabled>
						</ul>
					</div>
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
			<div class=btr-settings-content id=btr-settings-group-redesign data-name=groupRedesign>
				<div class=btr-settings-content-header>
					<button class="btn-control-sm btr-close-subcontent"><span class=icon-left></span></button>
					<h4>Group Redesign Options</h4>
				</div>
				<group label="Redesign" toggleable=redesign path=groups>
					<checkbox label="Modify Layout" path=modifyLayout require=redesign></checkbox>
					<checkbox label="Make Group Wall Paged" path=pagedGroupWall require=redesign></checkbox>
					<checkbox label="Show Selected Role Member Count" path=selectedRoleCount require=redesign></checkbox>
					<checkbox label="Hide Large Social Container" path=hideBigSocial require=redesign></checkbox>
					<checkbox label="Show Title On Social Icon Hover" path=modifySmallSocialLinksTitle require=redesign></checkbox>
				</group>
			</div>
			<div class=btr-settings-footer>
				<div class=btr-settings-footer-version>v${chrome.runtime.getManifest().version}</div>
				<div class=btr-settings-footer-text>Refresh the page to apply settings</div>
			</div>
		</div>
	</div>`
	
	if(!IS_DEV_MODE) {
		for(const elem of settingsDiv.$findAll("[devOnly]")) {
			elem.remove()
		}
	}
	
	const contentDivs = {}
	settingsDiv.$findAll(".btr-settings-content[data-name]").forEach(elem => {
		elem.classList.remove("selected")
		contentDivs[elem.dataset.name] = elem
	})

	let areFiltersInit = false
	let currentContent

	const switchContent = name => {
		if(currentContent === name) { return }

		const lastElem = currentContent && contentDivs[currentContent]
		if(lastElem) {
			lastElem.classList.remove("selected")
		}

		const newElem = name && contentDivs[name]
		if(newElem) {
			newElem.classList.add("selected")
		}

		currentContent = name
		sessionStorage.setItem("btr-settings-open", name)

		if(name === "shoutFilters") {
			if(!areFiltersInit) {
				areFiltersInit = true
				initShoutFilters()
			}
		}
	}

	let settingsLoadPromise
	let themeObserver

	const copyThemeFromElement = target => {
		settingsDiv.classList.toggle("btr-light-theme", target.classList.contains("light-theme"))
		settingsDiv.classList.toggle("btr-dark-theme", target.classList.contains("dark-theme"))
	}

	const toggleSettingsDiv = force => {
		const visible = typeof force === "boolean" ? force : settingsDiv.parentNode !== document.body

		if(!settingsLoadPromise) {
			settingsLoadPromise = initSettingsDiv().then(() => {
				settingsDiv.style.opacity = ""
			})
		}

		if(visible) {
			document.body.appendChild(settingsDiv)

			document.$watch(".light-theme:not(.btr-settings-modal), .dark-theme:not(.btr-settings-modal)", target => {
				if(themeObserver || !settingsDiv.parentNode) { return }

				themeObserver = new MutationObserver(() => copyThemeFromElement(target))
				themeObserver.observe(target, { attributeFilter: ["class"], attributes: true })
				copyThemeFromElement(target)
			})

			const lastContentOpen = sessionStorage.getItem("btr-settings-open")
			if(lastContentOpen && contentDivs[lastContentOpen]) {
				switchContent(lastContentOpen)
			} else {
				switchContent("main")
			}
		} else {
			switchContent("main")
			sessionStorage.removeItem("btr-settings-open")
			settingsDiv.remove()

			if(themeObserver) {
				themeObserver.disconnect()
				themeObserver = null
			}
		}
	}

	const initShoutFilters = () => {
		const filterContent = settingsDiv.$find("#btr-settings-shout-filters")
		const enabledList = filterContent.$find(".btr-filter-enabled")
		const disabledList = filterContent.$find(".btr-filter-disabled")
		const enabledLabel = enabledList.previousElementSibling
		const disabledLabel = disabledList.previousElementSibling

		const groups = []
		const shoutFilters = {}

		let areGroupsLoaded = false
		let isDataLoaded = false

		const updateLists = () => {
			if(!areGroupsLoaded || !isDataLoaded) { return }
			const currentList = shoutFilters[shoutFilters.mode]

			const list0 = shoutFilters.mode === "blacklist" ? enabledList : disabledList
			const list1 = list0 === disabledList ? enabledList : disabledList

			groups.forEach(group => {
				const tile = group.tile

				if(currentList.includes(group.id)) {
					list1.append(tile)
				} else {
					list0.append(tile)
				}
			})
		}

		const setGroupEnabled = (id, state) => {
			if(!isDataLoaded) { return }

			const list = shoutFilters[shoutFilters.mode]
			const index = list.indexOf(id)

			if((shoutFilters.mode === "blacklist") !== !state) { // if blacklist and state or !blacklist and !state
				if(index === -1) { return }
				list.splice(index, 1)
				MESSAGING.send("setShoutFilter", { id: id, mode: shoutFilters.mode, state: false })
			} else {
				if(index !== -1) { return }
				list.push(id)
				MESSAGING.send("setShoutFilter", { id: id, mode: shoutFilters.mode, state: true })
			}
			
			updateLists()
		}

		const isGroupEnabled = id => {
			if(!isDataLoaded) { return }

			const list = shoutFilters[shoutFilters.mode]
			const index = list.indexOf(id)

			return shoutFilters.mode === "blacklist" ? index === -1 : index !== -1
		}

		const onDrop = (state, ev) => {
			const id = +ev.dataTransfer.getData("btr-group")

			if(Number.isSafeInteger(id)) {
				setGroupEnabled(id, state)
			}

			ev.preventDefault()
			ev.dataTransfer.clearData()
		}

		const validDrag = ev => {
			if(ev.dataTransfer.getData("btr-group")) {
				ev.preventDefault()
			}
		}

		enabledList.$on("dragover", validDrag)
		disabledList.$on("dragover", validDrag)
		enabledList.$on("drop", onDrop.bind(null, true))
		disabledList.$on("drop", onDrop.bind(null, false))

		//

		const updateFilterMode = () => {
			if(shoutFilters.mode === "blacklist") {
				enabledLabel.textContent = "Enabled (Default)"
				disabledLabel.textContent = "Disabled"
			} else {
				enabledLabel.textContent = "Enabled"
				disabledLabel.textContent = "Disabled (Default)"
			}

			updateLists()
		}

		const setFilterMode = mode => {
			shoutFilters.mode = mode
			MESSAGING.send("setShoutFilterMode", shoutFilters.mode)
			updateFilterMode()
		}

		enabledLabel.$on("click", () => setFilterMode("blacklist"))
		disabledLabel.$on("click", () => setFilterMode("whitelist"))

		loggedInUserPromise.then(async userId => {
			const resp = await $.fetch(`https://groups.roblox.com/v1/users/${userId}/groups/roles`)
			const json = await resp.json()

			json.data.map(x => x.group).sort((a, b) => (a.name < b.name ? -1 : 1)).forEach(group => {
				const tile = group.tile = html`
				<li class=btr-filter-group title="${group.name}" draggable=true>
					<div class=btr-filter-group-icon>
						<img draggable=false>
					</div>
					<div class=btr-filter-group-title>
						${group.name}
					</div>
				</li>`

				tile.$on("dragstart", ev => {
					ev.dataTransfer.clearData()
					ev.dataTransfer.setData("btr-group", group.id)
				})

				tile.$on("click", () => {
					setGroupEnabled(group.id, !isGroupEnabled(group.id))
				})

				groups.push(group)
			})

			fetch(`https://thumbnails.roblox.com/v1/groups/icons?groupIds=${groups.map(x => x.id).join(",")}&size=150x150&format=Png&isCircular=false`)
				.then(async resp => {
					const json = await resp.json()

					json.data.forEach(iconData => {
						if(iconData.state === "Completed" && iconData.imageUrl) {
							groups.find(x => x.id === iconData.targetId).tile.$find("img").src = iconData.imageUrl
						}
					})
				})

			areGroupsLoaded = true
			updateLists()
		})

		MESSAGING.send("getShoutFilters", data => {
			Object.assign(shoutFilters, data)
			isDataLoaded = true

			updateFilterMode()
			updateLists()
		})
	}

	const initSettingsDiv = async () => {
		let labelCounter = 0
		
		settingsDiv.$on("click", "[btr-tab]", ev => switchContent(ev.currentTarget.getAttribute("btr-tab")))
		settingsDiv.$on("click", ".btr-close-subcontent", () => switchContent("main"))

		settingsDiv.$on("click", "#btr-fix-chat", () => {
			$.fetch("https://chat.roblox.com/v2/get-user-conversations?pageNumber=1&pageSize=10", {
				credentials: "include",
				xsrf: true
			}).then(async resp => {
				const json = await resp.json()

				json.forEach(({ id }) => {
					$.fetch("https://chat.roblox.com/v2/mark-as-read", {
						credentials: "include",
						xsrf: true,
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ conversationId: id })
					})
				})
			})
		})
		
		if(SETTINGS.loadError) {
			settingsDiv.$find(".btr-settings-header").after(html`<div style="position:absolute; width: 100%; height: 20px; text-align: center; background: red; top: 30px; z-index:1000; font-size: 16px; color: white; font-weight: bold;">Settings failed to load, changes may not save</div>`)
		}

		{
			const navButtons = settingsDiv.$find(`.btr-settings-content[data-name="navigation"]`)
			const header = navButtons.$find(`group[label="Header"]`)
			const sidebar = navButtons.$find(`group[label="Sidebar"]`)
			
			const checkboxes = {}
			
			for(const name in btrNavigation.elements) {
				const element = btrNavigation.elements[name]
				
				const parent = name.startsWith("header") ? header : sidebar
				const checkbox = html`<checkbox></checkbox>`

				checkbox.classList.add("btr-settings-checkbox")

				const input = html`<input type=checkbox>`
				checkbox.prepend(input)

				const labelIndex = labelCounter++
				input.id = `btr-settings-input-${labelIndex}`

				const labelText = element.name || name
				const label = html`<label for=btr-settings-input-${labelIndex}>${labelText}</label>`
				checkbox.append(label)

				input.$on("change", () => {
					element.setEnabled(input.checked)
				})

				const resetButton = html`<span class=btr-setting-reset-button></span>`
				label.after(resetButton)
				
				resetButton.$on("click", () => {
					element.resetEnabled()
				})
				
				parent.append(checkbox)
				
				checkboxes[name] = { element, input, resetButton }
			}
			
			const update = () => {
				for(const name in checkboxes) {
					const { element, input, resetButton } = checkboxes[name]
					input.checked = element.enabled
					resetButton.classList.toggle("disabled", element.isDefault)
				}
			}
			
			SETTINGS.onChange("navigation.elements", update)
			update()
		}
		
		{
			const currencySelect = settingsDiv.$find("#btr-robuxToCash-currency")
			const rateSelect = settingsDiv.$find("#btr-robuxToCash-rate")

			currencySelect.$empty()
			rateSelect.$empty()

			const currencies = Object.values(RobuxToCash.Currencies)
			
			currencies.filter(x => !x.usdRate).forEach(currency => {
				currencySelect.append(html`<option>${currency.name}</option>`)
			})
			
			currencies.filter(x => x.usdRate).sort((a, b) => (a.name < b.name ? -1 : 1)).forEach(currency => {
				currencySelect.append(html`<option title="Rates are estimations based on USD-${currency.name} exchange rate on ${RobuxToCash.UpdateDate}" value="${currency.name}">${currency.name}*</option>`)
			})

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

				rateSelect.$empty()
				let selected = false

				RobuxToCash.OptionLists[name].forEach(option => {
					let fullText = ""
					
					if(option.name === "none") {
						fullText = "No currency selected"
					} else {
						const display = option.name.includes("devex") ? "DevEx"
							: option.name.includes("Premium") ? "Premium"
								: "Regular"
						
						const rateText = option.currency.usdRate ?
							`${option.currency.symbol}${(option.cash / 100).toFixed(2)} ≈ US$${(option.usdCash / 100).toFixed(2)} = R$${option.robux}`
							: `${option.currency.symbol}${(option.cash / 100).toFixed(2)} = R$${option.robux}`
					
						fullText = `${display} (${rateText})`
					}
					
					rateSelect.append(html`<option value="${option.name}">${fullText}</option>`)

					if(option.name === SETTINGS.get("general.robuxToUSDRate")) {
						selected = true
					}
				})
				
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

		{
			const resetButton = settingsDiv.$find("#btr-reset-settings")
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

		settingsDiv.$findAll("group").forEach(group => {
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

				const updateGroup = () => {
					if(group.hasAttribute("minimized")) {
						contentContainer.style.height = `0px`
					} else {
						contentContainer.style.height = `${contentContainer.scrollHeight}px`
					}
				}

				title.$on("click", () => {
					if(group.hasAttribute("minimized")) {
						group.removeAttribute("minimized")
					} else {
						group.setAttribute("minimized", "")
					}

					updateGroup()
				})

				$.setImmediate(updateGroup)
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

			group.$findAll("select[path]").forEach(select => {
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
			})

			group.$findAll("checkbox[path]").forEach(checkbox => {
				const settingAttr = checkbox.getAttribute("path")
				const settingPath = joinPaths(groupPath, settingAttr.replace(/^!/, ""))
				settingsDone[settingPath] = true

				checkbox.classList.add("btr-settings-checkbox")

				const input = html`<input type=checkbox>`
				checkbox.prepend(input)

				const labelIndex = labelCounter++
				input.id = `btr-settings-input-${labelIndex}`

				const labelText = checkbox.hasAttribute("label") ? checkbox.getAttribute("label") : settingPath
				const label = html`<label for=btr-settings-input-${labelIndex}>${labelText}</label>`
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
			})
		})

		const wipGroup = settingsDiv.$find("#btr-settings-wip")
		Object.entries(SETTINGS.loadedSettings).forEach(([groupPath, settingsGroup]) => {
			Object.entries(settingsGroup).forEach(([settingName, settingValueInfo]) => {
				const defaultValueInfo = DEFAULT_SETTINGS[groupPath][settingName]
				const settingValue = settingValueInfo.value

				const settingPath = `${groupPath}.${settingName}`
				if(settingsDone[settingPath] || defaultValueInfo.hidden) { return }

				if(typeof settingValue === "boolean") {
					const checkbox = html`<checkbox></checkbox>`
					const input = html`<input id=btr-settings-input-${labelCounter} type=checkbox>`
					const label = html`<label for=btr-settings-input-${labelCounter++}>${settingPath}`

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
				} else {
					wipGroup.append(html`<div>${settingPath} (${typeof settingValue})`)
				}
			})
		})

		settingsDiv.$findAll(".btr-setting-reset-button").forEach(btn => {
			btn.append(html`<span class=btr-cross></span>`)
		})
		
		settingsDiv.$findAll(".btr-setting-reset-button[path]").forEach(btn => {
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
		})
	}

	return {
		toggle: toggleSettingsDiv
	}
})()

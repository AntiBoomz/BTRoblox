"use strict"

const SettingsDiv = (() => {
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
							<optgroup label="Themes">
								<option value=default>Default</option>
							</optgroup>
							<optgroup label="Legacy Themes">
								<option value=simblk>Simply Black</option>
								<option value=sky>Sky</option>
								<option value=red>Red</option>
								<option value=night>Dark As Night</option>
							</optgroup>
						</select>
						<checkbox label="Legacy Theme Compatibility Mode" path=disableRobloxThemes></checkbox>
					</div>

					<checkbox label="Show Ads" path=!hideAds></checkbox>
					<checkbox label="Fast User Search" path=general.fastSearch></checkbox>
					<div>
						<checkbox label="Show Chat" path=!hideChat></checkbox>
						<checkbox label="Minimize Chat" path=smallChatButton require=!hideChat></checkbox>
					</div>
					<checkbox label="Show 'Copy Id' Context Items" path=enableContextMenus></checkbox>
					<checkbox label="Lower Default Audio Volume" path=fixAudioVolume></checkbox>
					<div style="margin-top: 15px; display: flex;">
						<checkbox label="Show Robux to Cash" path=robuxToUSD style="width: auto"></checkbox>
						<div style="flex: 1 1 auto; text-align: right;">
							<select id=btr-robuxToCash-currency></select>
							<select id=btr-robuxToCash-rate style="margin-left: 4px"></select>
						</div>
					</div>
				</group>
				<group label=Navigation path=navigation toggleable>
					<checkbox label="Keep Sidebar Open" path=noHamburger require=false></checkbox>
					<button id=btr-open-navigation-editor class=btn-control-xs>Modify Navigation Buttons</button>
				</group>
				<group label=Profile path=profile toggleable>
					<checkbox label="Embed Inventory" path=embedInventoryEnabled></checkbox>
					<checkbox label="Show Last Online" path=lastOnline></checkbox>
				</group>
				<group label=Groups path=groups toggleable=redesign>
					<div>
						<checkbox label="Group Shout Notifications" path=shoutAlerts require=false></checkbox>
						<button id=btr-open-shout-filter class=btn-control-xs>Modify Shout Filters</button>
					</div>
					<div>
						<empty></empty>
						<button id=btr-open-group-redesign class=btn-control-xs>Modify Redesign Options</button>
					</div>
				</group>
				<group label="Game Details" path=gamedetails toggleable>
					<checkbox label="Highlight Owned Badges" path=showBadgeOwned></checkbox>
					<checkbox label="Add Server List Pager" path=addServerPager></checkbox>
				</group>
				<group label="Item Details" path=itemdetails toggleable>
					<checkbox label="Item Previewer" path=itemPreviewer></checkbox>
					<button id=btr-open-item-previewer-settings class=btn-control-xs>Previewer Preferences</button>
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
				<group label="WIP / Other" minimizable minimized>
					<div id=btr-settings-wip>
					</div>
					<div style="margin-top: 12px; float:right; width: 100%; clear:both">
						<button id=btr-fix-chat class=btn-control-xs style=float:left>Fix invis chat messages</button>
						<button id=btr-reset-settings class=btn-control-xs style=float:right>Reset settings to default</button>
					</div>
				</group>
			</div>
			<div class=btr-settings-content id=btr-settings-shout-filters data-name=shoutFilters>
				<div class=btr-settings-content-header>
					<button class="btn-control-sm btr-close-subcontent"><span class=icon-left></span></button>
					<h4>Group Shout Filters</h4>
					<div class=btr-settings-header-list>
						<button id=btr-filter-blacklist title="Blacklist: Select groups to hide notifications from"></button>
						<button id=btr-filter-whitelist title="Whitelist: Select groups to get notifications from"></button>
					</div>
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
					<checkbox label="Show User Rank On Group Wall" path=groupWallRanks require=redesign></checkbox>
					<checkbox label="Show Selected Role Member Count" path=selectedRoleCount require=redesign></checkbox>
					<checkbox label="Hide Payout Container" path=hidePayout require=redesign></checkbox>
					<checkbox label="Hide Large Social Container" path=hideBigSocial require=redesign></checkbox>
					<checkbox label="Show Title On Social Icon Hover" path=modifySmallSocialLinksTitle require=redesign></checkbox>
				</group>
			</div>
			<div class=btr-settings-content data-name=navEditor>
				<div class=btr-settings-content-header>
					<button class="btn-control-sm btr-close-subcontent"><span class=icon-left></span></button>
					<h4>Modify Navigation Buttons</h4>
				</div>
				<group>
					<div>Drag buttons to move them</div>
					<div>Double click buttons to toggle visibility</div>
					<div style=width:100%;text-align:right><button id=btr-reset-naveditor class=btn-control-xs>Reset buttons to default</button></div>
				</group>
			</div>
			<div class=btr-settings-footer>
				<div class=btr-settings-footer-version>v${chrome.runtime.getManifest().version}</div>
				<div class=btr-settings-footer-text>Refresh the page to apply settings</div>
			</div>
		</div>
	</div>`
	
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

			if(currentContent === "navEditor") {
				Navigation.lock()
			}
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
		} else if(name === "navEditor") {
			Navigation.unlock()
		}
	}

	let settingsLoadPromise
	const toggleSettingsDiv = force => {
		const visible = typeof force === "boolean" ? force : settingsDiv.parentNode !== document.body

		if(!settingsLoadPromise) {
			settingsLoadPromise = initSettingsDiv().then(() => {
				settingsDiv.style.opacity = ""
			})
		}

		if(visible) {
			document.body.appendChild(settingsDiv)

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
		}
	}

	const initShoutFilters = () => {
		const filterContent = settingsDiv.$find("#btr-settings-shout-filters")
		const enabledList = filterContent.$find(".btr-filter-enabled")
		const disabledList = filterContent.$find(".btr-filter-disabled")
		const groups = []
		const shoutFilters = {}
		let currentList
		let areGroupsLoaded = false
		let isDataLoaded = false

		const updateLists = () => {
			if(!areGroupsLoaded || !isDataLoaded) { return }
			let lastGroup
			let lastChosen

			const list0 = shoutFilters.mode === "blacklist" ? enabledList : disabledList
			const list1 = shoutFilters.mode === "blacklist" ? disabledList : enabledList

			groups.forEach(group => {
				const tile = group.tile
				const isChosen = currentList.indexOf(group.Id) !== -1

				if(isChosen) {
					if(!lastChosen && (tile.parentNode !== list1 || tile.previousElementSibling)) {
						list1.prepend(tile)
					} else if(lastChosen && tile.previousElementSibling !== lastChosen) {
						lastChosen.after(tile)
					}
					lastChosen = tile
				} else {
					if(!lastGroup && (tile.parentNode !== list0 || tile.previousElementSibling)) {
						list0.prepend(tile)
					} else if(lastGroup && tile.previousElementSibling !== lastGroup) {
						lastGroup.after(tile)
					}
					lastGroup = tile
				}
			})
		}

		const validDrag = ev => {
			if(!isDataLoaded) { return }
			if(ev.dataTransfer.types.indexOf("btr-group") !== -1) {
				ev.preventDefault()
			}
		}

		const dropEnable = ev => {
			if(!isDataLoaded) { return }
			if(ev.dataTransfer.types.indexOf("btr-group") === -1) { return }

			const id = +ev.dataTransfer.getData("btr-group")
			const index = currentList.indexOf(id)
			if(index !== -1) {
				currentList.splice(index, 1)
				updateLists()

				const key = shoutFilters.mode === "blacklist" ? "shoutFilterBlacklist" : "shoutFilterWhitelist"
				MESSAGING.send(key, { id, state: false })
			}
			ev.preventDefault()
			ev.dataTransfer.clearData()
		}

		const dropDisable = ev => {
			if(!isDataLoaded) { return }
			if(ev.dataTransfer.types.indexOf("btr-group") === -1) { return }

			const id = +ev.dataTransfer.getData("btr-group")
			if(currentList.indexOf(id) === -1) {
				currentList.push(id)
				updateLists()

				const key = shoutFilters.mode === "blacklist" ? "shoutFilterBlacklist" : "shoutFilterWhitelist"
				MESSAGING.send(key, { id, state: true })
			}
			ev.preventDefault()
			ev.dataTransfer.clearData()
		}

		enabledList.$on("dragover", validDrag)
		disabledList.$on("dragover", validDrag)

		enabledList.$on("drop", ev => {
			if(shoutFilters.mode === "blacklist") { dropEnable(ev) }
			else { dropDisable(ev) }
		})

		disabledList.$on("drop", ev => {
			if(shoutFilters.mode === "blacklist") { dropDisable(ev) }
			else { dropEnable(ev) }
		})

		const blBtn = filterContent.$find("#btr-filter-blacklist")
		const wlBtn = filterContent.$find("#btr-filter-whitelist")

		const updateFilterMode = () => {
			const isBl = shoutFilters.mode === "blacklist"

			blBtn.classList.toggle("btn-secondary-xs", isBl)
			blBtn.classList.toggle("btn-control-xs", !isBl)
			wlBtn.classList.toggle("btn-secondary-xs", !isBl)
			wlBtn.classList.toggle("btn-control-xs", isBl)

			updateLists()
		}

		blBtn.$on("click", () => {
			if(!isDataLoaded) { return }
			shoutFilters.mode = "blacklist"
			currentList = shoutFilters[shoutFilters.mode]
			MESSAGING.send("setShoutFilterMode", shoutFilters.mode)

			updateFilterMode()
		})

		wlBtn.$on("click", () => {
			if(!isDataLoaded) { return }
			shoutFilters.mode = "whitelist"
			currentList = shoutFilters[shoutFilters.mode]
			MESSAGING.send("setShoutFilterMode", shoutFilters.mode)

			updateFilterMode()
		})

		loggedInUserPromise.then(async userId => {
			const resp = await $.fetch(`https://api.roblox.com/users/${userId}/groups`)
			const json = await resp.json()

			json.sort((a, b) => (a.Name < b.Name ? -1 : 1)).forEach(group => {
				const tile = group.tile = html`
				<li class=btr-filter-group title="${group.Name}" draggable=true>
					<div class=btr-filter-group-icon>
						<img src="https://assetgame.roblox.com/asset-thumbnail/image?assetId=${group.EmblemId}&width=150&height=150&format=png" draggable=false>
					</div>
					<div class=btr-filter-group-title>
						${group.Name}
					</div>
				</li>`

				tile.$on("dragstart", ev => {
					ev.dataTransfer.clearData()
					ev.dataTransfer.setData("btr-group", group.Id)
				})

				tile.$on("click", () => {
					if(!isDataLoaded) { return }
					const index = currentList.indexOf(group.Id)

					if(index !== -1) { currentList.splice(index, 1) }
					else { currentList.push(group.Id) }
					updateLists()

					const key = shoutFilters.mode === "blacklist" ? "shoutFilterBlacklist" : "shoutFilterWhitelist"
					MESSAGING.send(key, { id: group.Id, state: index === -1 })
				})

				groups.push(group)
			})

			areGroupsLoaded = true
			updateLists()
		})

		MESSAGING.send("getShoutFilters", data => {
			Object.assign(shoutFilters, data)
			currentList = shoutFilters[shoutFilters.mode]
			isDataLoaded = true
			updateFilterMode()
			updateLists()
		})
	}

	const initSettingsDiv = async () => {
		settingsDiv.$on("click", "#btr-open-shout-filter", () => switchContent("shoutFilters"))
		settingsDiv.$on("click", "#btr-open-navigation-editor", () => switchContent("navEditor"))
		settingsDiv.$on("click", "#btr-open-item-previewer-settings", () => switchContent("itemPreviewerSettings"))
		settingsDiv.$on("click", ".btr-close-subcontent", () => switchContent("main"))
		settingsDiv.$on("click", "#btr-open-group-redesign", () => switchContent("groupRedesign"))

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

		{
			const currencySelect = settingsDiv.$find("#btr-robuxToCash-currency")
			const rateSelect = settingsDiv.$find("#btr-robuxToCash-rate")

			currencySelect.$empty()
			rateSelect.$empty()

			const setRate = () => {
				SETTINGS.set("general.robuxToUSDRate", rateSelect.value)
			}

			const loadRates = name => {
				currencySelect.value = name

				rateSelect.$empty()
				let selected = false

				RobuxToCash.OptionLists[name].forEach(option => {
					const display = option.name.includes("devex") ? "DevEx"
						: option.name.includes("Premium") ? "Premium"
							: "Regular"
					
					const rateText = `${option.currency.symbol}${(option.cash / 100).toFixed(2)} = R$${option.robux}`
					
					rateSelect.append(html`<option value="${option.name}">${display} (${rateText})</option>`)

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
			}

			Object.keys(RobuxToCash.Currencies).forEach(name => {
				currencySelect.append(html`<option>${name}</option>`)
			})

			currencySelect.$on("change", () => {
				loadRates(currencySelect.value)
			})

			rateSelect.$on("change", setRate)

			loadRates(RobuxToCash.getSelectedOption().currency.name)

			//
			const updateDisabled = () => {
				const value = SETTINGS.get("general.robuxToUSD")

				if(value) {
					currencySelect.removeAttribute("disabled")
					rateSelect.removeAttribute("disabled")
				} else {
					currencySelect.setAttribute("disabled", "")
					rateSelect.setAttribute("disabled", "")
				}
			}
			
			SETTINGS.onChange("general.robuxToUSD", updateDisabled)
			updateDisabled()
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

		{
			const resetButton = settingsDiv.$find("#btr-reset-naveditor")
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

				SETTINGS.set("navigation.itemsV2", "")
			})
		}

		// Settings 

		const settingsDone = {}
		let labelCounter = 0

		const joinPaths = (group, path) => (!group || path.includes(".") ? path : `${group}.${path}`)

		settingsDiv.$findAll("group").forEach(group => {
			const groupPath = group.getAttribute("path") || ""

			const titleContainer = html`<div class=btr-setting-group-title-container></div>`
			const title = html`<h4>${group.getAttribute("label") || ""}</h4>`
			titleContainer.prepend(title)
			group.prepend(titleContainer)

			if(group.hasAttribute("minimizable")) {
				const updateGroup = () => {
					if(group.hasAttribute("minimized")) {
						group.style.height = `${title.clientHeight}px`
					} else {
						group.style.height = `${group.scrollHeight + 12}px`
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

				const resetButton = html`<span class=btr-setting-reset-button>🗙</span>`
				toggle.append(resetButton)

				resetButton.$on("click", ev => {
					SETTINGS.reset(settingPath)
					ev.preventDefault()
					ev.stopPropagation()
				})

				const update = () => {
					const enabled = SETTINGS.get(settingPath)
					toggle.classList.toggle("checked", enabled)

					resetButton.classList.toggle("disabled", SETTINGS.getIsDefault(settingPath))

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
				const resetButton = html`<span class=btr-setting-reset-button>🗙</span>`

				if(select.hasAttribute("label")) {
					wrapper.append(html`<label>${select.getAttribute("label") || ""}</label>`)
				}

				select.before(wrapper)
				wrapper.append(select, resetButton)

				resetButton.$on("click", () => {
					SETTINGS.reset(settingPath)
				})

				const titleOption = select.options[0] && select.options[0].hasAttribute("disabled") ? select.options[0] : null
				const titleOptionFormat = titleOption ? titleOption.textContent : null

				if(titleOption) {
					titleOption.style.display = "none"
				}

				const update = () => {
					select.value = SETTINGS.get(settingPath)
					resetButton.classList.toggle("disabled", SETTINGS.getIsDefault(settingPath))

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

			group.$findAll("checkbox").forEach(checkbox => {
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

					const resetButton = html`<span class=btr-setting-reset-button>🗙</span>`
					label.after(resetButton)

					resetButton.$on("click", () => {
						SETTINGS.reset(settingPath)
					})

					const update = () => {
						let value = !!SETTINGS.get(settingPath)
						if(settingAttr.startsWith("!")) { value = !value }

						input.checked = value
						resetButton.classList.toggle("disabled", SETTINGS.getIsDefault(settingPath))
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
				const defaultValueInfo = SETTINGS.defaultSettings[groupPath][settingName]
				const settingValue = settingValueInfo.value

				const settingPath = `${groupPath}.${settingName}`
				if(settingsDone[settingPath] || defaultValueInfo.hidden) { return }

				if(typeof settingValue === "boolean") {
					const checkbox = html`<checkbox></checkbox>`
					const input = html`<input id=btr-settings-input-${labelCounter} type=checkbox>`
					const label = html`<label for=btr-settings-input-${labelCounter++}>${settingPath}`

					checkbox.append(input)
					checkbox.append(label)

					const resetButton = html`<span class=btr-setting-reset-button>🗙</span>`
					checkbox.append(resetButton)
	
					resetButton.$on("click", () => {
						SETTINGS.reset(settingPath)
					})

					wipGroup.append(checkbox)

					const update = () => {
						input.checked = !!SETTINGS.get(settingPath)
						resetButton.classList.toggle("disabled", SETTINGS.getIsDefault(settingPath))
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
	}

	return {
		toggle: toggleSettingsDiv
	}
})()

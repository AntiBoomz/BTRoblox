"use strict"

const settingsDiv = html`
<div class=btr-settings-modal>
	<div class=btr-settings>
		<div class=btr-settings-header>
			<div class=btr-settings-header-title>BTRoblox</div>
			<div class="btr-settings-header-close btr-settings-toggle">⨯</div>
		</div>
		<div class="btr-settings-content selected" id=btr-settings-main data-name=main>
			<group label=General path=general>
				<select path=theme>
					<option value=default>Default</option>
					<option value=simblk>Simply Black</option>
					<option value=sky>Sky</option>
					<option value=red>Red</option>
				</select>
				<br>

				<checkbox label="Show Ads" path=showAds></checkbox>
				<checkbox label="Fast Search" path=fastSearch></checkbox>
				<div>
					<checkbox label="Show Chat" path=chatEnabled></checkbox>
					<checkbox label="Minimize Chat" path=smallChatButton require=chatEnabled></checkbox>
				</div>

				<checkbox label="Show Robux to USD" path=robuxToDollars></checkbox>
			</group>
			<group label=Navigation path=general toggleable=navigationEnabled>
				<checkbox label="Keep Sidebar Open" path=noHamburger></checkbox>
				<checkbox label="Add Blog Feed to Sidebar" path=showBlogFeed></checkbox>
			</group>
			<group label=Profile path=profile toggleable>
				<checkbox label="Embed Inventory" path=embedInventoryEnabled></checkbox>
			</group>
			<group label=Groups path=groups toggleable>
				<checkbox label="Group Shout Notifications" path=shoutAlerts></checkbox>
				<button id=btr-open-shout-filter class=btn-control-xs>Modify Shout Filters</button>
			</group>
			<group label="Game Details" path=gamedetails toggleable>
				<checkbox label="Highlight Owned Badges" path=showBadgeOwned></checkbox>
			</group>
			<group label="Item Details" path=itemdetails toggleable>
				<checkbox label="Item Previewer" path=itemPreviewer></checkbox>
				<button id=btr-open-item-previewer-settings class=btn-control-xs>Previewer Preferences</button>
				<checkbox label="Show Explorer Button" path=explorerButton></checkbox>
				<checkbox label="Show Download Button" path=downloadButton></checkbox>
				<checkbox label="Show Content Button" path=contentButton></checkbox>
				<checkbox label="Show 'This Package Contains'" path=thisPackageContains></checkbox>
			</group>
			<group label=Inventory path=inventory toggleable>
				<checkbox label="Inventory Tools" path=inventoryTools></checkbox>
			</group>
			<group label=Catalog path=catalog toggleable>
			</group>
			<group label="Version History" path=versionhistory toggleable>
			</group>
			<group label="WIP / Other" minimizable minimized id=btr-settings-wip>
			</group>
		</div>
		<div class=btr-settings-content id=btr-settings-shout-filters data-name=shoutFilters>
			<div class=btr-filter-header>
				<button class="btn-control-sm btr-close-subcontent"><span class=icon-left></span></button>
				<h4>Group Shout Filters</h4>
				<div class=btr-filter-type-list>
					<button class=btr-filter-blacklist title="Blacklist: Select groups to not get notifications from"></button>
					<button class=btr-filter-whitelist title="Whitelist: Select groups to get notifications from"></button>
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
			<div class=btr-filter-header>
				<button class="btn-control-sm btr-close-subcontent"><span class=icon-left></span></button>
				<h4>Item Previewer Preferences</h4>
			</div>
			<div>
				<group>
					<checkbox label="Item Previewer" path=itemdetails.itemPreviewer></checkbox>
					<checkbox label="Hover Previewer" path=general.hoverPreview></checkbox>
					<br>
					<br>
					<select label="Automatically open previewer for:" path=itemdetails.itemPreviewerMode>
						<option value=default>Default (Everything)</option>
						<option value=never>Nothing</option>
						<option value=animations>Animations and Packages</option>
						<option value=always>Everything</option>
					</select>
					<select label="Preview on hover for:" path=general.hoverPreviewMode>
						<option value=default>Default (Everything)</option>
						<option value=never>Nothing</option>
						<option value=animations>Animations and Packages</option>
						<option value=always>Everything</option>
					</select>
				</group>
			</div>
		</div>
		<div class=btr-settings-footer>
			<div class=btr-settings-footer-version>v${chrome.runtime.getManifest().version}</div>
			<div class=btr-settings-footer-text>Refresh the page to apply settings</div>
		</div>
	</div>
</div>
</div>`

const toggleSettingsDiv = () => {
	const visible = settingsDiv.parentNode !== document.body

	if(visible) { document.body.appendChild(settingsDiv) }
	else { settingsDiv.remove() }

	if(!settingsDiv.hasAttribute("loaded")) {
		settingsDiv.setAttribute("loaded", "")
		initSettingsDiv()
	}
})

const initSettingsDiv = () => {
	let resolve
	const initSettingsPromise = new Promise(x => resolve = x)

	let currentContent
	const switchContent = name => {
		const next = settingsDiv.$find(`.btr-settings-content[data-name="${name}"]`)
		if(currentContent) {
			currentContent.classList.remove("selected")
		}

		currentContent = next
		if(currentContent) {
			currentContent.classList.add("selected")
		}
	}

	switchContent("main")

	settingsDiv.$find("#btr-open-item-previewer-settings").$on("click", () => {
		switchContent("itemPreviewerSettings")
	})

	settingsDiv.$on("click", ".btr-close-subcontent", () => {
		switchContent("main")
	})

	{ // Shout Filters
		const filterContent = settingsDiv.$find("#btr-settings-shout-filters")
		const enabledList = filterContent.$find(".btr-filter-enabled")
		const disabledList = filterContent.$find(".btr-filter-disabled")
		const groups = []
		const shoutFilters = {}
		let currentList
		let areFiltersInitialized = false
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

		settingsDiv.$find("#btr-open-shout-filter").$on("click", () => {
			switchContent("shoutFilters")

			if(!areFiltersInitialized) {
				areFiltersInitialized = true

				loggedInUserPromise.then(async userId => {
					const resp = await fetch(`https://api.roblox.com/users/${userId}/groups`)
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
		})

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

		const blBtn = filterContent.$find(".btr-filter-blacklist")
		const wlBtn = filterContent.$find(".btr-filter-whitelist")

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
	}

	// Settings
	const settingsDone = {}
	const requires = {}
	let labelCounter = 0

	const getSetting = path => path.split(".").reduce((a, b) => a[b], settings)
	const isInvalidSetting = path => path.split(".").reduce((a, b) => (a ? a[b] : null), settings) === null

	const setSetting = (path, value) => {
		MESSAGING.send("setSetting", { path, value })
	}

	const joinPaths = (group, path) => (!group || path.includes(".") ? path : `${group}.${path}`)

	settingsDiv.$findAll("group").forEach(group => {
		const title = html`<h4>${group.getAttribute("label") || ""}</h4>`
		group.prepend(title)

		if(group.hasAttribute("minimizable")) {
			const updateGroup = () => {
				if(group.hasAttribute("minimized")) {
					group.style.height = `${title.clientHeight}px`
				} else {
					group.style.height = `${group.scrollHeight}px`
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
			initSettingsPromise.then(updateGroup)
		}

		let groupPath = ""
		if(group.hasAttribute("path")) {
			groupPath = `${group.getAttribute("path")}`

			if(group.hasAttribute("toggleable")) {
				const toggleSetting = group.getAttribute("toggleable") || "enabled"
				const settingPath = joinPaths(groupPath, toggleSetting)
				settingsDone[settingPath] = true

				const toggle = html`<div class=btr-settings-enabled-toggle>`
				title.after(toggle)

				const update = state => {
					toggle.classList.toggle("checked", state)

					group.$findAll("input, select").forEach(x => {
						if(!state) { x.setAttribute("disabled", "") }
						else { x.removeAttribute("disabled") }
					})
				}

				toggle.$on("click", () => {
					const state = !getSetting(settingPath)
					setSetting(settingPath, state)
					update(state)
				})

				initSettingsPromise.then(() => update(getSetting(settingPath)))
			}
		}

		const requireHandler = item => {
			if(!item.hasAttribute("require")) { return }
			const requirePath = joinPaths(groupPath, item.getAttribute("require"))

			const target = item.$find("input") || item
	
			if(!requires[requirePath]) { requires[requirePath] = [] }
			requires[requirePath].push(target)
	
			if(!getSetting(requirePath)) {
				target.setAttribute("disabled", "")
			}
		}

		group.$findAll("select").forEach(select => {
			const settingPath = joinPaths(groupPath, select.getAttribute("path"))
			settingsDone[settingPath] = true

			const wrapper = html`<div class=btr-select></div>`
			if(select.hasAttribute("label")) { wrapper.append(html`<label>${select.getAttribute("label") || ""}</label>`) }

			select.before(wrapper)
			wrapper.append(select)

			requireHandler(select)

			select.value = getSetting(settingPath)
			select.$on("change", () => {
				setSetting(settingPath, select.value)
			})
		})

		group.$findAll("checkbox").forEach(checkbox => {
			const settingPath = joinPaths(groupPath, checkbox.getAttribute("path"))
			settingsDone[settingPath] = true

			const input = html`<input id=btr-settings-input-${labelCounter} type=checkbox>`
			const label = html`<label for=btr-settings-input-${labelCounter++}>${checkbox.getAttribute("label")}`

			checkbox.classList.add("btr-settings-checkbox")

			checkbox.append(input)
			checkbox.append(label)

			requireHandler(checkbox)

			if(isInvalidSetting(settingPath)) {
				label.textContent += " (Bad setting)"
				return
			}

			const update = state => {
				const req = requires[settingPath]
				if(!req) { return }

				req.forEach(x => {
					if(!state) { x.setAttribute("disabled", "") }
					else { x.removeAttribute("disabled") }
				})
			}

			input.checked = !!getSetting(settingPath)
			input.$on("change", () => {
				setSetting(settingPath, input.checked)
				update(input.checked)
			})

			update(input.checked)
		})
	})

	const wipGroup = settingsDiv.$find("#btr-settings-wip")
	Object.entries(settings).forEach(([groupPath, settingsGroup]) => {
		Object.entries(settingsGroup).forEach(([settingName, settingValue]) => {
			const settingPath = `${groupPath}.${settingName}`
			if(settingsDone[settingPath]) { return }

			if(typeof settingValue === "boolean") {
				const checkbox = html`<checkbox></checkbox>`
				const input = html`<input id=btr-settings-input-${labelCounter} type=checkbox>`
				const label = html`<label for=btr-settings-input-${labelCounter++}>${settingPath}`

				checkbox.append(input)
				checkbox.append(label)
				wipGroup.append(checkbox)

				input.checked = !!settingValue
				input.$on("change", () => {
					settingsGroup[settingName] = input.checked
					setSetting(settingPath, input.checked)
				})
			} else {
				wipGroup.append(html`<div>${settingPath} (${typeof settingValue})`)
			}
		})
	})

	resolve()
}
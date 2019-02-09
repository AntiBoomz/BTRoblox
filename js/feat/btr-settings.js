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
							<option value=default>Default</option>
							<option value=simblk>Simply Black</option>
							<option value=sky>Sky</option>
							<option value=red>Red</option>
							<option value=night>Dark As Night (WIP)</option>
						</select>
					</div>

					<checkbox label="Hide Ads" path=hideAds></checkbox>
					<checkbox label="Fast User Search" path=general.fastSearch></checkbox>
					<div>
						<checkbox label="Show Chat" path=chatEnabled></checkbox>
						<checkbox label="Minimize Chat" path=smallChatButton require=chatEnabled></checkbox>
					</div>
					<checkbox label="Show 'Copy Id' Context Items" path=enableContextMenus></checkbox>
					<div style=margin-top:5px>
						<checkbox label="Show Robux to USD" path=robuxToUSD></checkbox>
						<select path=robuxToUSDRate>
							<option selected disabled>R$ to USD Rate: (%opt%)</option>
							<optgroup label=DevEx>
								<option value=devex350>DevEx $350</option>
								<option value=devex250>DevEx $250</option>
							</optgroup>
							<optgroup label=NBC>
								<option value=nbc5>NBC $5</option>
								<option value=nbc10>NBC $10</option>
								<option value=nbc25>NBC $25</option>
								<option value=nbc50>NBC $50</option>
								<option value=nbc100>NBC $100</option>
								<option value=nbc200>NBC $200</option>
							</optgroup>
							<optgroup label=BC>
								<option value=bc5>BC $5</option>
								<option value=bc10>BC $10</option>
								<option value=bc25>BC $25</option>
								<option value=bc50>BC $50</option>
								<option value=bc100>BC $100</option>
								<option value=bc200>BC $200</option>
							</optgroup>
						</select>
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
				<group label=Groups path=groups toggleable>
					<div>
						<checkbox label="Group Shout Notifications" path=shoutAlerts require=false></checkbox>
						<button id=btr-open-shout-filter class=btn-control-xs>Modify Shout Filters</button>
					</div>
					<div>
						<checkbox label="Enable Redesign" path=redesign></checkbox>
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
				</group>
				<group label="Version History" path=versionhistory toggleable>
				</group>
				<group label="WIP / Other" minimizable minimized>
					<div id=btr-settings-wip>
					</div>
					<div style="margin-top: 12px; text-align: right;">
						<button id=btr-reset-settings class=btn-control-xs>Reset settings to default</button>
					</div>
				</group>
			</div>
			<div class=btr-settings-content id=btr-settings-shout-filters data-name=shoutFilters>
				<div class=btr-settings-content-header>
					<button class="btn-control-sm btr-close-subcontent"><span class=icon-left></span></button>
					<h4>Group Shout Filters</h4>
					<div class=btr-settings-header-list>
						<button id=btr-filter-blacklist title="Blacklist: Select groups to not get notifications from"></button>
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
				<div>
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
			
			</div>
			<div class=btr-settings-content id=btr-settings-nav-editor data-name=navigationEditor>
				<div class=btr-settings-content-header>
					<button class="btn-control-sm btr-close-subcontent"><span class=icon-left></span></button>
					<h4>Navigation Editor</h4>
					<div class=btr-settings-header-list>
						<button id=btr-naveditor-select-topleft
							data-tab=topleft
							class=btr-settings-header-list-item
							title="Modify the top left navigation"></button>
						<button id=btr-naveditor-select-topright
							data-tab=topright
							class=btr-settings-header-list-item
							title="Modify the top right navigation"></button>
						<button id=btr-naveditor-select-sidebar
							data-tab=sidebar
							class=btr-settings-header-list-item
							title="Modify the sidebar"></button>
					</div>
				</div>
				<div>
					<div id=btr-naveditor-topleft-container class=btr-naveditor-tab-container data-tab=topleft>
						<div class=btr-naveditor-container>
							<div class=btr-fake-header>
								<div class=btr-fake-header-logo></div>
								<ul id=btr-naveditor-topleft class=btr-fake-header-list>
								</ul>
								<div class=btr-fake-search></div>
							</div>
							<ul id=btr-topleft-items class=btr-naveditor-items>
							</ul>
						</div>
					</div>
					<div id=btr-naveditor-topright-container class=btr-naveditor-tab-container data-tab=topright>
						<div class=btr-naveditor-container>
							<div class=btr-fake-header>
								<ul id=btr-naveditor-topright class=btr-fake-header-list>
								</ul>
							</div>
							<ul id=btr-topright-items class=btr-naveditor-items>
							</ul>
						</div>
						
						<group path=navigation>
							<checkbox label="Hide Age Bracket" path=hideAgeBracket></checkbox>
						</group>
					</div>
					<div id=btr-naveditor-sidebar-container class=btr-naveditor-tab-container data-tab=sidebar>
						<div class=btr-naveditor-container style=display:none>
							<div class=btr-fake-header>
							</div>
							<ul id=btr-sidebar-items class=btr-naveditor-items>
								Not Implemented
							</ul>
						</div>
						<group path=navigation>
							<checkbox label="Show Blog Feed" path=showBlogFeed></checkbox>
						</group>
					</div>
				</div>
			</div>
			<div class=btr-settings-footer>
				<div class=btr-settings-footer-version>v${chrome.runtime.getManifest().version}</div>
				<div class=btr-settings-footer-text>Refresh the page to apply settings</div>
			</div>
		</div>
	</div>`
	
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

	let settingsLoadPromise
	const toggleSettingsDiv = () => {
		const visible = settingsDiv.parentNode !== document.body

		if(!settingsLoadPromise) {
			settingsLoadPromise = initSettingsDiv().then(() => {
				settingsDiv.style.opacity = ""
			})
		}

		if(visible) {
			document.body.appendChild(settingsDiv)
			switchContent("main")
		} else {
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

	const NavEditor = {
		isInit: false,
		onTab: {},
		switchTab(name) {
			const btn = this.elem.$find(`.btr-settings-header-list-item[data-tab="${name}"]`)
			const tab = this.elem.$find(`.btr-naveditor-tab-container[data-tab="${name}"]`)

			if(this.tab) {
				this.tab.btn.classList.remove("btn-secondary-xs")
				this.tab.btn.classList.add("btn-control-xs")
				this.tab.tab.style.display = "none"
			}

			btn.classList.remove("btn-control-xs")
			btn.classList.add("btn-secondary-xs")
			tab.style.display = ""
			
			this.tab = { name, btn, tab }

			if(this.onTab[name]) { this.onTab[name]() }
		},
		open() {
			switchContent("navigationEditor")

			if(!this.isInit) { this.init() }
			this.switchTab("topleft")
		},
		init() {
			this.isInit = true
			const navEditor = this.elem = settingsDiv.$find("#btr-settings-nav-editor")

			navEditor.$findAll(".btr-settings-header-list-item").forEach(x => {
				x.classList.add("btn-control-xs")
				x.$on("click", () => this.switchTab(x.dataset.tab))
			})

			navEditor.$findAll(".btr-naveditor-tab-container").forEach(x => {
				x.style.display = "none"
			})

			if(settings.navigation.enabled) {
				this.initTopRight()
				this.initTopLeft()
			} else {
				this.elem.classList.add("btr-nav-disabled")
			}
		},
		initTopRight() {
			const topright = this.elem.$find("#btr-naveditor-topright")
			const container = topright.closest(".btr-naveditor-container")
			const toprightItems = container.$find("#btr-topright-items")
			let dragging

			const allItems = Navigation.topright.getAll().map(name => {
				const elem = html`<li class="btr-naveditor-item btr-naveditor-tr-${name}"></li>`
				const listElem = html`<li class="btr-naveditor-item btr-naveditor-tr-${name}"></li>`
				toprightItems.prepend(listElem)

				const item = { elem, listElem, name }

				if(name === "Settings") {
					item.locked = true
					listElem.remove()
				} else if(name.startsWith("Unknown-")) {
					elem.classList.add("btr-naveditor-tr-idk")
					listElem.classList.add("btr-naveditor-tr-idk")
				}

				return item
			})
			
			let list = Navigation.topright.getCurrent().map(name => allItems.find(x => x.name === name))

			const updatePos = slow => {
				let offset = 0

				list.forEach(x => {
					if(x !== dragging) {
						x.elem.style.transition = slow ? "all .25s" : ""
						x.elem.style.right = `${offset}px`
					}

					x.offset = offset
					x.width = x.listElem.offsetWidth || x.elem.offsetWidth
					offset += x.width
				})
			}

			const updateNav = () => {
				Navigation.topright.setCurrent(
					list.map(x => x.name)
				)
			}

			const forceUpdateElems = () => {
				allItems.forEach(item => {
					if(list.includes(item)) {
						topright.append(item.elem)
						item.listElem.classList.add("disabled")
					} else {
						item.elem.remove()
						item.listElem.classList.remove("disabled")
					}
				})
			}

			forceUpdateElems()
			SETTINGS.onChange("navigation.items", () => {
				setTimeout(() => {
					list = Navigation.topright.getCurrent().map(name => allItems.find(x => x.name === name))
					forceUpdateElems()
					updatePos(false)
				}, 0)
			})


			{ // Fix order and update robux label
				const msg = allItems.find(x => x.name === "bi_Messages")
				const frn = allItems.find(x => x.name === "bi_Friends")
				const robux = allItems.find(x => x.name === "Robux")

				if(robux) {
					if(msg && frn) {
						robux.listElem.before(msg.listElem, frn.listElem)
					}

					const robuxAmt1 = html`<span class=amount></span>`
					const robuxAmt2 = robuxAmt1.cloneNode(true)
					robux.listElem.append(robuxAmt1)
					robux.elem.append(robuxAmt2)
	
					document.$watch("#nav-robux-amount", amt => {
						let lastTextNode
						let lastTextContent
	
						const update = () => {
							const textNode = amt.childNodes[0]
							if(lastTextNode !== textNode) {
								lastTextNode = textNode
								textObserver.disconnect()
								if(textNode) {
									textObserver.observe(textNode, { characterData: true })
								}
							}
	
							if(amt.textContent !== lastTextContent) {
								lastTextContent = robuxAmt1.textContent = robuxAmt2.textContent = amt.textContent
								updatePos(false)
							}
						}
	
						const textObserver = new MutationObserver(update)
						new MutationObserver(update).observe(amt, { childList: true })
						update()
					})
				}
			}

			const mouseup = ev => {
				if(ev.button !== 0) { return }
				window.removeEventListener("mouseup", mouseup)
				window.removeEventListener("mousemove", mousemove)

				const didDrag = dragging
				dragging = null

				didDrag.elem.classList.remove("dragging")
				didDrag.elem.style.transform = ""
				didDrag.elem.style.width = ""
				didDrag.elem.style.top = ""
				didDrag.elem.style.left = ""
				didDrag.elem.style.right = ""

				const index = list.indexOf(didDrag)
				if(index !== -1) {
					topright.append(didDrag.elem)
					updatePos(true)
				} else {
					didDrag.elem.remove()
					didDrag.listElem.classList.remove("disabled")
				}
			}

			const mousemove = ev => {
				if(!dragging) { return }

				const contRect = container.getBoundingClientRect()
				const tlRect = topright.getBoundingClientRect()
				const elemRect = dragging.elem.getBoundingClientRect()
				
				const pixelX = dragging.offX + (ev.clientX - dragging.x)
				const pixelY = dragging.offY + (ev.clientY - dragging.y)

				const isDown = pixelY + elemRect.height / 4 >= tlRect.bottom - contRect.y
				const xOffset = (tlRect.right - contRect.x) - pixelX - elemRect.width / 2

				const clampX = Math.max(list[0].width / 2,
					Math.min(tlRect.width - list[list.length - 1].width / 2,
						pixelX
					)
				)

				const index = list.indexOf(dragging)
				if(index !== -1) {
					dragging.elem.style.left = `${clampX}px`
					dragging.elem.style.top = `${tlRect.y - contRect.y}px`

					if(isDown && !dragging.locked) {
						list.splice(index, 1)
						updatePos(true)
						updateNav()

						dragging.elem.style.left = `${pixelX}px`
						dragging.elem.style.top = `${pixelY}px`
					} else {
						const prev = list[index - 1]
						const next = list[index + 1]

						if(prev && (xOffset < prev.offset + prev.width / 2 || xOffset - elemRect.width / 2 < prev.offset + 10)) {
							list[index] = prev
							list[index - 1] = dragging
							updatePos(true)
							updateNav()
						} else if(next && (xOffset > next.offset + next.width / 2 || xOffset + elemRect.width / 2 > next.offset + next.width - 10)) {
							list[index] = next
							list[index + 1] = dragging
							updatePos(true)
							updateNav()
						}
					}
				} else {
					dragging.elem.style.left = `${pixelX}px`
					dragging.elem.style.top = `${pixelY}px`

					if(!isDown) {
						let newIndex = 0
						
						let item = list[newIndex]
						while(item && xOffset > item.offset + item.width / 2) {
							item = list[++newIndex]
						}

						list.splice(newIndex, 0, dragging)
						updatePos(true)
						updateNav()

						dragging.elem.style.left = `${clampX}px`
						dragging.elem.style.top = `${tlRect.y - contRect.y}px`
					}
				}
			}

			container.$on("mousedown", ".btr-naveditor-item", ev => {
				if(ev.button !== 0) { return }
				const target = ev.currentTarget
				const item = allItems.find(x => x.elem === target || x.listElem === target)
				if(!item) { return }
				dragging = item

				const contRect = container.getBoundingClientRect()
				const rect = target.getBoundingClientRect()
				const lastClick = dragging.lastClick

				dragging.lastClick = Date.now()
				dragging.x = ev.clientX
				dragging.y = ev.clientY
				dragging.offX = rect.x - contRect.x
				dragging.offY = rect.y - contRect.y

				dragging.elem.style.width = `${rect.width}px`
				dragging.elem.style.transition = ""
				dragging.elem.style.right = ""
				dragging.elem.classList.add("dragging")
				dragging.listElem.classList.add("disabled")
				container.append(dragging.elem)

				window.addEventListener("mouseup", mouseup)
				window.addEventListener("mousemove", mousemove)

				mousemove(ev)

				if(!dragging.locked) {
					const index = list.indexOf(dragging)
					if(index !== -1 && lastClick && Date.now() - lastClick < 200) {
						list.splice(index, 1)
						updatePos(true)
						updateNav()
						mouseup(ev)
					}
				}

				ev.preventDefault()
			})

			this.onTab.topright = () => updatePos(false)
		},
		initTopLeft() {
			const topleft = this.elem.$find("#btr-naveditor-topleft")
			const container = topleft.closest(".btr-naveditor-container")
			const topleftItems = container.$find("#btr-topleft-items")
			let dragging

			const allItems = Navigation.topleft.getAll().map(name => {
				const text = name.startsWith("bi_") || name.startsWith("cu_") ? name.slice(3) : name
				const elem = html`<li class=btr-naveditor-item><a>${text}</a></li>`
				const listElem = html`<li class=btr-naveditor-item><a>${text}</a></li>`
				topleftItems.append(listElem)

				return { elem, listElem, name }
			})
			
			let list = Navigation.topleft.getCurrent().map(name => allItems.find(x => x.name === name))

			const updatePos = slow => {
				list.forEach((x, i) => {
					if(x !== dragging) {
						x.elem.style.transition = slow ? "all .25s" : ""
						x.elem.style.left = `${i / list.length * 100}%`
						x.elem.style.width = `${1 / list.length * 100}%`
					}
				})
			}

			const updateNav = () => {
				Navigation.topleft.setCurrent(
					list.map(x => x.name)
				)
			}

			const forceUpdateElems = () => {
				allItems.forEach(item => {
					if(list.includes(item)) {
						topleft.append(item.elem)
						item.listElem.classList.add("disabled")
					} else {
						item.elem.remove()
						item.listElem.classList.remove("disabled")
					}
				})
			}

			forceUpdateElems()
			SETTINGS.onChange("navigation.items", () => {
				setTimeout(() => {
					list = Navigation.topleft.getCurrent().map(name => allItems.find(x => x.name === name))
					forceUpdateElems()
					updatePos(false)
				}, 0)
			})

			const mouseup = ev => {
				if(ev.button !== 0) { return }
				window.removeEventListener("mouseup", mouseup)
				window.removeEventListener("mousemove", mousemove)

				const wasDragging = dragging
				dragging = null

				wasDragging.elem.classList.remove("dragging")
				wasDragging.elem.style.transform = ""
				wasDragging.elem.style.width = ""
				wasDragging.elem.style.top = ""
				wasDragging.elem.style.left = ""

				const index = list.indexOf(wasDragging)
				if(index !== -1) {
					topleft.append(wasDragging.elem)
					updatePos(false)
				} else {
					wasDragging.elem.remove()
					wasDragging.listElem.classList.remove("disabled")
				}
			}

			const mousemove = ev => {
				if(!dragging) { return }

				const contRect = container.getBoundingClientRect()
				const tlRect = topleft.getBoundingClientRect()
				const elemRect = dragging.elem.getBoundingClientRect()


				const itemWidth = 1 / list.length
				
				const pixelX = dragging.offX + (ev.clientX - dragging.x)
				const pixelY = dragging.offY + (ev.clientY - dragging.y)

				const x = (pixelX - (tlRect.x - contRect.x)) / tlRect.width
				const y = (pixelY + elemRect.height / 2 - (tlRect.y - contRect.y)) / tlRect.height

				const clampX = Math.max(tlRect.left - contRect.x - 20,
					Math.min(tlRect.right - contRect.x - elemRect.width + 20,
						pixelX
					)
				)

				const index = list.indexOf(dragging)
				if(index !== -1) {
					dragging.elem.style.left = `${clampX}px`
					dragging.elem.style.top = `${tlRect.y - contRect.y}px`

					if(y > 1) {
						list.splice(index, 1)
						updatePos(true)
						updateNav()

						dragging.elem.style.left = `${pixelX}px`
						dragging.elem.style.top = `${pixelY}px`
					} else {
						const prev = list[index - 1]
						const next = list[index + 1]
						const rectMid = x + itemWidth / 2

						if(prev && rectMid < index / list.length) {
							list[index] = prev
							list[index - 1] = dragging
							updatePos(true)
							updateNav()
						} else if(next && rectMid > (index + 1) / list.length) {
							list[index] = next
							list[index + 1] = dragging
							updatePos(true)
							updateNav()
						}
					}
				} else {
					dragging.elem.style.left = `${pixelX}px`
					dragging.elem.style.top = `${pixelY}px`

					if(y < 1) {
						const newIndex = Math.max(0,
							Math.min(list.length,
								Math.floor((x + elemRect.width / tlRect.width) / (1 / (list.length + 1)))
							)
						)

						list.splice(newIndex, 0, dragging)
						updatePos(true)
						updateNav()

						dragging.elem.style.left = `${clampX}px`
						dragging.elem.style.top = `${tlRect.y - contRect.y}px`
					}
				}
			}

			container.$on("mousedown", ".btr-naveditor-item a", ev => {
				if(ev.button !== 0) { return }
				const target = ev.currentTarget.parentNode
				const item = allItems.find(x => x.elem === target || x.listElem === target)
				if(!item) { return }
				dragging = item

				const contRect = container.getBoundingClientRect()
				const rect = target.getBoundingClientRect()
				const lastClick = dragging.lastClick

				dragging.lastClick = Date.now()
				dragging.x = ev.clientX
				dragging.y = ev.clientY
				dragging.offX = rect.x - contRect.x
				dragging.offY = rect.y - contRect.y

				dragging.elem.style.width = `${rect.width}px`
				dragging.elem.style.transition = ""
				dragging.elem.classList.add("dragging")
				dragging.listElem.classList.add("disabled")
				container.append(dragging.elem)

				window.addEventListener("mouseup", mouseup)
				window.addEventListener("mousemove", mousemove)

				mousemove(ev)

				const index = list.indexOf(dragging)
				if(index !== -1 && lastClick && Date.now() - lastClick < 200) {
					list.splice(index, 1)
					updatePos(true)
					updateNav()
					mouseup(ev)
				}
			})
			
			this.onTab.topleft = () => updatePos(false)
		}
	}

	const initSettingsDiv = async () => {
		let areFiltersInit = false

		await new SyncPromise(resolve =>
			injectCSS("btr-settings.css").$on("load", resolve, { once: true })
		)
		
		settingsDiv.$find("#btr-open-shout-filter").$on("click", () => {
			switchContent("shoutFilters")

			if(!areFiltersInit) {
				areFiltersInit = true
				initShoutFilters()
			}
		})

		settingsDiv.$on("click", "#btr-open-navigation-editor", () => NavEditor.open())

		settingsDiv.$on("click", "#btr-open-item-previewer-settings", () => {
			switchContent("itemPreviewerSettings")
		})

		settingsDiv.$on("click", ".btr-close-subcontent", () => {
			switchContent("main")
		})

		settingsDiv.$on("click", "#btr-open-group-redesign", () => {
			switchContent("groupRedesign")
		})

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

		// Settings 

		const settingsDone = {}
		let labelCounter = 0

		const joinPaths = (group, path) => (!group || path.includes(".") ? path : `${group}.${path}`)

		settingsDiv.$findAll("group").forEach(group => {
			const groupPath = group.getAttribute("path") || ""
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

				$.setImmediate(updateGroup)
			}
			
			if(group.hasAttribute("toggleable")) {
				const toggleSetting = group.getAttribute("toggleable") || "enabled"
				const settingPath = joinPaths(groupPath, toggleSetting)
				settingsDone[settingPath] = true

				const toggle = html`<div class=btr-settings-enabled-toggle>`
				title.after(toggle)

				let lastState
				const update = state => {
					lastState = state
					toggle.classList.toggle("checked", state)
				}

				toggle.$on("click", () => {
					const state = !lastState
					SETTINGS.set(settingPath, state)
					update(state)
				})

				$.setImmediate(() => update(SETTINGS.get(settingPath)))
				SETTINGS.onChange(settingPath, update)
			}

			group.$findAll("select").forEach(select => {
				const settingPath = joinPaths(groupPath, select.getAttribute("path"))
				settingsDone[settingPath] = true

				const wrapper = html`<div class=btr-select></div>`

				if(select.hasAttribute("label")) {
					wrapper.append(html`<label>${select.getAttribute("label") || ""}</label>`)
				}

				select.before(wrapper)
				wrapper.append(select)

				const titleOption = select.options[0] && select.options[0].hasAttribute("disabled") ? select.options[0] : null
				const titleOptionFormat = titleOption ? titleOption.textContent : null

				if(titleOption) {
					titleOption.style.display = "none"
				}

				const update = () => {
					const selected = select.selectedOptions[0]
					if(titleOption && titleOption !== selected) {
						titleOption.textContent = titleOptionFormat.replace(/%opt%/g, () => selected.textContent)
						select.value = titleOption.value
					}
				}

				select.value = SETTINGS.get(settingPath)
				update()

				select.$on("change", () => {
					const selected = select.selectedOptions[0]
					if(!selected || selected.hasAttribute("disabled")) { return }

					SETTINGS.set(settingPath, select.value)
					update()
				})
				
				SETTINGS.onChange(settingPath, value => {
					select.value = value
					update()
				})

				const requirePath = joinPaths(groupPath, select.getAttribute("require") || "enabled")
				if(SETTINGS.isValid(requirePath)) {
					const requireUpdate = value => {
						if(value) {
							select.removeAttribute("disabled")
						} else {
							select.setAttribute("disabled", "")
						}
					}
					
					SETTINGS.onChange(requirePath, requireUpdate)
					requireUpdate(SETTINGS.get(requirePath))
				}
			})

			group.$findAll("checkbox").forEach(checkbox => {
				const settingPath = joinPaths(groupPath, checkbox.getAttribute("path"))
				settingsDone[settingPath] = true

				checkbox.classList.add("btr-settings-checkbox")

				const input = html`<input type=checkbox>`
				checkbox.prepend(input)

				if(checkbox.hasAttribute("label")) {
					input.id = `btr-settings-input-${labelCounter}`
					const label = html`<label for=btr-settings-input-${labelCounter++}>${checkbox.getAttribute("label")}</label>`

					checkbox.append(label)

					if(!SETTINGS.isValid(settingPath)) {
						label.textContent += " (Bad setting)"
						return
					}
				}

				input.checked = !!SETTINGS.get(settingPath)
				input.$on("change", () => {
					SETTINGS.set(settingPath, input.checked)
				})

				SETTINGS.onChange(settingPath, state => input.checked = state)

				const requirePath = joinPaths(groupPath, checkbox.getAttribute("require") || "enabled")
				if(SETTINGS.isValid(requirePath)) {
					const requireUpdate = value => {
						if(value) {
							input.removeAttribute("disabled")
						} else {
							input.setAttribute("disabled", "")
						}
					}
					
					SETTINGS.onChange(requirePath, requireUpdate)
					requireUpdate(SETTINGS.get(requirePath))
				}
			})
		})

		const wipGroup = settingsDiv.$find("#btr-settings-wip")
		Object.entries(settings).forEach(([groupPath, settingsGroup]) => {
			Object.entries(settingsGroup).forEach(([settingName, settingValue]) => {
				const defaultValueInfo = SETTINGS.defaultSettings[groupPath][settingName]
				const settingPath = `${groupPath}.${settingName}`
				if(settingsDone[settingPath] || defaultValueInfo.hidden) { return }

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
						SETTINGS.set(settingPath, input.checked)
					})
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

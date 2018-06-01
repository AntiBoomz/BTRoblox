"use strict"

const getURL = chrome.runtime.getURL

let settings
let currentPage
let blogFeedData

let loggedInUser = -1
let loggedInUserPromise = null

const InjectJS = {
	queue: [],
	started: false,
	start() {
		if(this.started) { return }
		this.started = true
		this.queue.forEach(args => this.send(...args))
		delete this.queue
	},

	send(action, ...detail) {
		if(IS_FIREFOX) { detail = cloneInto(detail, window.wrappedJSObject) }
		document.dispatchEvent(new CustomEvent(`inject.${action}`, { detail }))
	},

	listen(actionList, callback) {
		const cb = ev => callback(...ev.detail)
		actionList.split(" ").forEach(action => {
			document.addEventListener(`content.${action}`, cb)
		})
	}
}

const templateListeners = {}
const domParser = new DOMParser()
function modifyTemplate(id, callback) {
	if(!templateListeners[id]) {
		const listeners = templateListeners[id] = []

		const modify = function(html, end) {
			const doc = domParser.parseFromString(`<body>${html}</body>`, "text/html")
			listeners.forEach(fn => fn(doc.body))
			end(doc.body.innerHTML)
		}

		const name = `TEMPLATE_${id}`
		InjectJS.listen(name, data => {
			modify(data, html => InjectJS.send(name, html))
		})
	}

	templateListeners[id].push(callback)
}

function onDocumentReady(cb) {
	if(document.readyState !== "loading") {
		cb()
	} else {
		document.addEventListener("DOMContentLoaded", cb, { once: true })
	}
}

const FormatNumber = num => String(num).replace(/(\d\d*?)(?=(?:\d{3})+(?:\.|$))/yg, "$1,")
const RobuxToUSD = amt => FormatNumber((amt * DOLLARS_PER_ROBUX_RATIO).toFixed(2))


const friends = html`
<li id="btr-navbar-friends" class="navbar-icon-item">
	<a class="rbx-menu-item" href="/Friends.aspx">
		<span class="icon-nav-friend-btr"></span>
		<span class="btr-nav-notif rbx-text-navbar-right" style="display:none;"></span>
	</a>
</li>`

const messages = html`
<li id="btr-navbar-messages" class="navbar-icon-item">
	<a class="rbx-menu-item" href="/My/Messages#!/inbox">
		<span class="icon-nav-message-btr"></span>
		<span class="btr-nav-notif rbx-text-navbar-right" style="display:none;"></span>
	</a>
</li>`

const blogfeed = html`
<div id="btr-blogfeed" style="display:none;">Blog feed enabled</div>`

const settingsDiv = html`
<div class=btr-settings-modal>
	<div class=btr-settings>
		<div class=btr-settings-header>
			<div class=btr-settings-header-title>BTRoblox</div>
			<div class="btr-settings-header-close btr-settings-toggle">⨯</div>
		</div>
		<div class=btr-settings-content id=btr-settings-main>
			<group label=General path=general>
				<select path=theme>
					<option value=default>Default</option>
					<option value=simblk>Simply Black</option>
					<option value=sky>Sky</option>
					<option value=red>Red</option>
				</select>

				<checkbox label="Show Ads" path=showAds></checkbox>
				<checkbox label="Fast Search" path=fastSearch></checkbox>
				<div>
					<checkbox label="Show Chat" path=chatEnabled></checkbox>
					<checkbox label="Minimize Chat" path=smallChatButton require=chatEnabled></checkbox>
				</div>
			</group>
			<group label=Navigation path=general toggleable=navigationEnabled>
				<checkbox label="Keep Sidebar Open" path=noHamburger></checkbox>
				<checkbox label="Add Blog Feed to Sidebar" path=showBlogFeed></checkbox>
			</group>
			<group label=Profile path=profile toggleable>
				<checkbox label="Embed Inventory" path=embedInventoryEnabled></checkbox>
			</group>
			<group label=Groups path=groups toggleable>
				<div>
					<checkbox label="Group Shout Notifications" path=shoutAlerts></checkbox>
					<button id=btr-open-shout-filter class=btn-control-xs>Modify Shout Filters</button>
				</div>
			</group>
			<group label="Game Details" path=gamedetails toggleable>
				<checkbox label="Highlight Owned Badges" path=showBadgeOwned></checkbox>
			</group>
			<group label="Item Details" path=itemdetails toggleable>
				<checkbox label="Animation Previewer" path=animationPreview></checkbox>
				<checkbox label="Auto-Load Animation Previewer" path=animationPreviewAutoLoad></checkbox>
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
			<group label=WIP minimizable minimized id=btr-settings-wip>
			</group>
		</div>
		<div class=btr-settings-content id=btr-settings-shout-filters style=display:none>
			<div class=btr-filter-header>
				<button id=btr-close-shout-filter class=btn-control-sm><span class=icon-left></span></button>
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
		<div class=btr-settings-footer>
			<div class=btr-settings-footer-version>v${chrome.runtime.getManifest().version}</div>
			<div class=btr-settings-footer-text>Refresh the page to apply settings</div>
		</div>
	</div>
</div>`

const initSettingsDiv = () => {
	let resolve
	const initSettingsPromise = new Promise(x => resolve = x)

	const content = settingsDiv.$find("#btr-settings-main")

	content.$on("mousewheel", e => {
		if(e.deltaY < 0 && content.scrollTop === 0) { return e.preventDefault() }
		if(e.deltaY > 0 && content.scrollTop >= content.scrollHeight - content.clientHeight) { return e.preventDefault() }
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
			content.style.display = "none"
			filterContent.style.display = ""

			if(!areFiltersInitialized) {
				areFiltersInitialized = true

				loggedInUserPromise.then(async userId => {
					const resp = await fetch(`https://api.roblox.com/users/${userId}/groups`)
					const json = await resp.json()

					json.forEach(group => {
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

						tile.$on("dblclick", () => {
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

		filterContent.$find("#btr-close-shout-filter").$on("click", () => {
			content.style.display = ""
			filterContent.style.display = "none"
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
	let labelCounter = 0

	Array.from(content.children).forEach(group => {
		const title = html`<h4>${group.getAttribute("label")}</h4>`
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

		if(group.hasAttribute("path")) {
			const groupPath = group.getAttribute("path")
			const settingsGroup = settings[groupPath]
			settingsDone[groupPath] = settingsDone[groupPath] || {}

			if(group.hasAttribute("toggleable")) {
				const toggleSetting = group.getAttribute("toggleable") || "enabled"
				const inputList = group.getElementsByTagName("input")
				const toggle = html`<div class=btr-settings-enabled-toggle>`
				title.after(toggle)

				const update = state => {
					toggle.classList.toggle("checked", state)
					Array.from(inputList).forEach(x => {
						if(!state) { x.setAttribute("disabled", "") }
						else { x.removeAttribute("disabled") }
					})

					group.$findAll(`[require="${toggleSetting}"] > input`).forEach(x => {
						if(!state) { x.setAttribute("disabled", "") }
						else { x.removeAttribute("disabled") }
					})
				}

				toggle.$on("click", () => {
					const checked = !settingsGroup[toggleSetting]
					settingsGroup[toggleSetting] = checked
					MESSAGING.send("setSetting", { [groupPath]: { [toggleSetting]: checked } })
					update(checked)
				})
				initSettingsPromise.then(() => update(settingsGroup[toggleSetting]))

				settingsDone[groupPath][toggleSetting] = true
			}

			Array.from(group.getElementsByTagName("select")).forEach(select => {
				const settingName = select.getAttribute("path")

				select.value = settingsGroup[settingName]
				select.$on("change", () => {
					settingsGroup[settingName] = select.value
					MESSAGING.send("setSetting", { [groupPath]: { [settingName]: select.value } })
				})

				settingsDone[groupPath][settingName] = true
			})

			Array.from(group.getElementsByTagName("checkbox")).forEach(checkbox => {
				const settingName = checkbox.getAttribute("path")
				const input = html`<input id=btr-settings-input-${labelCounter} type=checkbox>`
				const label = html`<label for=btr-settings-input-${labelCounter++}>${checkbox.getAttribute("label")}`

				checkbox.classList.add("btr-settings-checkbox")

				checkbox.append(input)
				checkbox.append(label)

				if(!(settingName in settingsGroup)) { label.textContent += " (Bad setting)" }
				if(checkbox.hasAttribute("require") && !settingsGroup[checkbox.getAttribute("require")]) { input.setAttribute("disabled", "") }

				input.checked = !!settingsGroup[settingName]
				input.$on("change", () => {
					settingsGroup[settingName] = input.checked
					MESSAGING.send("setSetting", { [groupPath]: { [settingName]: input.checked } })

					group.$findAll(`[require="${settingName}"] > input`).forEach(x => {
						if(!input.checked) { x.setAttribute("disabled", "") }
						else { x.removeAttribute("disabled") }
					})
				})

				settingsDone[groupPath][settingName] = true
			})
		}
	})

	const wipGroup = settingsDiv.$find("#btr-settings-wip")

	Object.entries(settings).forEach(([groupPath, settingsGroup]) => {
		Object.entries(settingsGroup).forEach(([settingName, settingValue]) => {
			if(groupPath in settingsDone && settingName in settingsDone[groupPath]) { return }

			if(typeof settingValue === "boolean") {
				const checkbox = html`<checkbox></checkbox>`
				const input = html`<input id=btr-settings-input-${labelCounter} type=checkbox>`
				const label = html`<label for=btr-settings-input-${labelCounter++}>${groupPath}.${settingName}`

				checkbox.append(input)
				checkbox.append(label)
				wipGroup.append(checkbox)

				input.checked = !!settingValue
				input.$on("change", () => {
					settingsGroup[settingName] = input.checked
					MESSAGING.send("setSetting", { [groupPath]: { [settingName]: input.checked } })
				})
			} else {
				wipGroup.append(html`<div>${groupPath}.${settingName} (${typeof settingValue})`)
			}
		})
	})

	resolve()
}

const initFastSearch = () => {
	const requestCache = {}
	const usernameRegex = /^\w+(?:[ _]?\w+)?$/
	const promiseCache = {}
	const fsResults = []
	const friendsList = []
	let fsUpdateCounter = 0
	let friendsLoaded = false
	let friendsPromise
	let exactTimeout

	try {
		const data = JSON.parse(localStorage.getItem("btr-fastsearch-cache"))
		Object.entries(data.friends).forEach(([name, id]) => {
			requestCache[name.toLowerCase()] = {
				Username: name,
				UserId: id,
				IsFriend: true
			}
		})
	} catch(ex) {}

	const updateCache = () => {
		if(!friendsLoaded) { return }
		const cache = { friends: {} }

		Object.values(friendsList).forEach(friend => {
			cache.friends[friend.Username] = friend.UserId
		})

		localStorage.setItem("btr-fastsearch-cache", JSON.stringify(cache))
	}


	const makeItem = (json, hlFrom, hlTo) => {
		if(hlFrom == null || json.Alias) {
			hlFrom = 0
			hlTo = json.Username.length
		}

		const item = html`
		<li class="rbx-navbar-search-option rbx-clickable-li" data-searchurl=https://www.roblox.com/User.aspx?userName=${json.Username}&wot=>
			<a class=btr-fastsearch-anchor href=https://www.roblox.com/User.aspx?userName=${json.Username}>
				<div class=btr-fastsearch-avatar>
					<img class=btr-fastsearch-thumbnail src=https://www.roblox.com/headshot-thumbnail/image?userId=${json.UserId}&width=48&height=48&format=png>
					<div class=btr-fastsearch-status>
					</div>
				</div>
				<div class=btr-fastsearch-text>
					<div>
						${json.Username.slice(0, hlFrom)}
						<b>${json.Username.slice(hlFrom, hlTo)}</b>
						${json.Username.slice(hlTo)}
					</div>
					<div class="text-label xsmall">
						${json.Alias ? `Formerly '${json.Alias}'` : json.IsFriend ? "You are friends" : ""}
					</div>
				</div>
			</a>
		</li>`

		// Presence
		if(!json.presence) {
			const url = `https://www.roblox.com/presence/user?userId=${json.UserId}`
			json.presence = fetch(url, { credentials: "include" })
				.then(resp => resp.json())
		}

		json.presence.then(presence => {
			switch(presence.UserPresenceType) {
			case 0: break
			case 2: {
				item.$find(".btr-fastsearch-status").classList.add("game")
				const followBtn = html`<button class="btr-fastsearch-follow btn-primary-xs">Join Game</button>`

				if(presence.PlaceId) {
					followBtn.setAttribute("onclick", `return Roblox.GameLauncher.followPlayerIntoGame(${json.UserId}), false`)
				} else {
					followBtn.classList.add("disabled")
				}

				item.$find(".btr-fastsearch-anchor").append(followBtn)
				break
			}
			case 3:
				item.$find(".btr-fastsearch-status").classList.add("studio")
				break
			default: item.$find(".btr-fastsearch-status").classList.add("online")
			}
		})

		return item
	}

	
	const clearResults = list => {
		fsResults.splice(0, fsResults.length).forEach(x => x.remove())
		const sel = list.$find(">.selected")
		if(!sel) {
			list.children[0].classList.add("selected")
		}
	}

	const updateResults = (search, list) => {
		clearTimeout(exactTimeout)
		clearResults(list)

		if(!usernameRegex.test(search)) { return }

		const thisUpdate = ++fsUpdateCounter

		const update = () => {
			if(fsUpdateCounter !== thisUpdate) { return }
			clearResults(list)

			const matches = Object.entries(requestCache)
				.filter(x => x[1] && (x[0] === search || (x[1].IsFriend && !x[1].Alias) && (x.index = x[0].indexOf(search)) !== -1))
			if(!matches.length) { return }

			const sel = list.$find(">.selected")
			if(sel) { sel.classList.remove("selected") }

			matches.forEach(x => x.sort = x[0] === search ? 0 : Math.abs(x[0].length - search.length) / 3 + x.index + (!x[1].IsFriend ? 100 : 0))
			matches.sort((a, b) => a.sort - b.sort)
			const len = Math.min(4, matches.length)

			// Show friends before exact match (if not friend)
			const first = matches[0]
			if(first[0] === search && !first[1].IsFriend) {
				for(let i = 1; i < len; i++) {
					const self = matches[i]
					if(self[1].IsFriend) {
						matches[i] = first
						matches[i - 1] = self
					} else {
						break
					}
				}
			}

			for(let i = 0; i < len; i++) {
				const x = matches[i]

				const json = x[1]
				const item = makeItem(json, x.index, x.index + search.length)

				if(fsResults.length) {
					fsResults[fsResults.length - 1].after(item)
				} else {
					list.prepend(item)
				}

				fsResults.push(item)

				if(i === 0) {
					item.classList.add("selected")
				}
			}
		}
		
		update()

		if(!friendsLoaded) {
			if(!friendsPromise) {
				friendsPromise = new Promise(resolve => {
					loggedInUserPromise.then(userId => {
						const url = `https://www.roblox.com/users/friends/list-json?pageSize=200&userId=${userId}`
						fetch(url, { credentials: "include" }).then(async resp => {
							const json = await resp.json()

							Object.entries(requestCache).forEach(([key, item]) => {
								if(item.IsFriend) {
									delete requestCache[key]
								}
							})

							json.Friends.forEach(friend => {
								const key = friend.Username.toLowerCase()
								const item = {
									IsFriend: true,
									UserId: friend.UserId,
									Username: friend.Username,

									presence: Promise.resolve({
										UserPresenceType: friend.InStudio ? 3 : friend.InGame ? 2 : friend.IsOnline ? 1 : 0,
										LastLocation: friend.LastLocation,
										PlaceId: friend.PlaceId
									})
								}

								requestCache[key] = item
								friendsList[friend.UserId] = item
							})

							friendsLoaded = true
							updateCache()
							resolve(friendsList)
						})
					})
				})
			}

			friendsPromise.then(update)
		}

		if(search.length < 3) { return }

		exactTimeout = setTimeout(() => {
			if(!(search in requestCache)) {
				let cached = promiseCache[search]
				if(!cached) {
					cached = promiseCache[search] = fetch(`https://api.roblox.com/users/get-by-username?username=${search}`)
						.then(async resp => {
							const json = await resp.json()

							if("Id" in json) {
								if(friendsLoaded) {
									const friendItem = friendsList[json.Id]
									if(friendItem) {
										return Object.assign({ Alias: search }, friendItem)
									}
								}

								return { UserId: json.Id, Username: json.Username }
							}
							return false
						})
				}

				cached.then(json => {
					if(!(search in requestCache)) {
						requestCache[search] = json
					}

					if(json) { update() }
				})
			}
		}, 250)
	}

	document.$watch("#navbar-universal-search", search => {
		const input = search.$find("#navbar-search-input")
		const list = search.$find(">ul")

		list.$on("mouseover", ".rbx-navbar-search-option", ev => {
			const last = list.$find(">.selected")
			if(last) { last.classList.remove("selected") }
			ev.currentTarget.classList.add("selected")
		})
		
		let lastValue
		input.$on("keyup", () => {
			if(input.value === lastValue) { return }
			lastValue = input.value
			updateResults(input.value.toLowerCase(), list)
		})

		list.prepend(fsResults)
	})
}

function Init() {

	document.$on("click", ".btr-settings-toggle", () => {
		const visible = settingsDiv.parentNode !== document.body

		if(visible) { document.body.appendChild(settingsDiv) }
		else { settingsDiv.remove() }

		if(!settingsDiv.hasAttribute("loaded")) {
			settingsDiv.setAttribute("loaded", "")
			initSettingsDiv()
		}
	})

	const headWatcher = document.$watch(">head").$then()

	const bodyWatcher = document.$watch(">body", body => {
		body.classList.toggle("btr-no-hamburger", settings.general.noHamburger)
		body.classList.toggle("btr-hide-ads", !settings.general.showAds)
		body.classList.toggle("btr-small-chat-button", settings.general.chatEnabled && settings.general.smallChatButton)
	}).$then()

	const headerWatcher = bodyWatcher.$watch("#header").$then()
	const navWatcher = bodyWatcher.$watch("#navigation").$then()

	bodyWatcher.$watch("#roblox-linkify", linkify => {
		const newRegex = /((?:(?:https?:\/\/)(?:[\w-]+\.)+\w{2,}|(?:[\w-]+\.)+(?:com|net|uk|org|info|tv|gg|io))(?:\/(?:[\w!$&'"()*+,\-.:;=@_~]|%[0-9A-Fa-f]{2})*)*(?:\?(?:[\w!$&'"()*+,\-.:;=@_~?/]|%[0-9A-Fa-f]{2})*)?(?:#(?:[\w!$&'"()*+,\-.:;=@_~?/]|%[0-9A-Fa-f]{2})*)?)(\b)/
		linkify.setAttribute("data-regex", newRegex.source)
	})

	headerWatcher.$watch("#navbar-setting").$then().$watch(".rbx-popover-content > ul", list => {
		list.prepend(html`<li><a class="rbx-menu-item btr-settings-toggle">BTR Settings</a></li>`)
	})
	
	if(settings.general.navigationEnabled) {
		headerWatcher.$watch("#navbar-robux", robux => {
			robux.after(friends)
			friends.after(messages)
		})
		
		headerWatcher.$watch(">div").$then().$watchAll(".rbx-navbar", bar => {
			const buyRobux = bar.$find(".buy-robux")
			if(buyRobux) { buyRobux.parentNode.remove() }

			bar.prepend(html`<li><a class=nav-menu-title href=/home>Home</a></li>`)

			// Roblox+ button fix kekekekeke
			if(bar.children.length > 2) {
				const trap = html`<li style=display:none><a class=nav-menu-title href=/kek>kek</a></li>`
				const trap2 = html`<li style=display:none><a class=nav-menu-title href=/derp>derp</a></li>`

				bar.children[2].before(trap)
				trap.after(trap2)
				onDocumentReady(() => setTimeout(() => {
					if(trap.textContent === "kek" && trap2.textContent === "derp") {
						trap.remove()
						trap2.remove()
					}
				}, 2000))
			}
		})
		
		navWatcher.$watch("#nav-blog", blog => {
			const list = blog.parentNode.parentNode

			const home = list.$find("#nav-home")
			if(home) { home.parentNode.remove() }

			const upgrade = list.$find(".rbx-upgrade-now")
			if(upgrade) { upgrade.remove() }

			blog.parentNode.before(html`
			<li>
				<a href="/premium/membership" id="nav-bc">
					<span class='icon-nav-bc-btr'></span>
					<span>Builders Club</span>
				</a>
			</li>`)

			if(settings.general.showBlogFeed) { blog.after(blogfeed) }

			const trade = list.$find("#nav-trade")
			if(trade) {
				trade.href = "/my/money.aspx"
				const label = trade.$find("span:not([class^='icon-nav'])")
				if(label) { label.textContent = "Money" }
			}


			const navFriends = list.$find("#nav-friends")
			const navMessages = list.$find("#nav-message")
			navMessages.style.display = "none"

			const updateFriends = () => {
				const notif = friends.$find(".btr-nav-notif")
				const count = navFriends.dataset.count

				friends.$find("a").href = navFriends.href
				notif.textContent = count
				notif.style.display = count > 0 ? "" : "none"
			}

			const updateMessages = () => {
				const notif = messages.$find(".btr-nav-notif")
				const count = navMessages.dataset.count

				messages.$find("a").href = navMessages.href
				notif.textContent = count
				notif.style.display = count > 0 ? "" : "none"
			}

			new MutationObserver(updateFriends).observe(navFriends, { attributes: true, attributeFilter: ["href", "data-count"] })
			new MutationObserver(updateMessages).observe(navMessages, { attributes: true, attributeFilter: ["href", "data-count"] })

			updateFriends()
			updateMessages()
		})
	}

	loggedInUserPromise = new Promise(resolve => {
		navWatcher.$watch("#nav-profile", nav => {
			const matches = nav.getAttribute("href").match(/\/users\/(\d+)/)
			loggedInUser = matches ? matches[1] : -1
			resolve(loggedInUser)
		})

		onDocumentReady(() => resolve(-1))
	})

	if(!settings.general.chatEnabled) {
		bodyWatcher.$watch("#chat-container", cont => cont.remove())
	}

	if(!settings.general.showAds) {
		const iframeSelector = `.ads-container iframe,.abp iframe,.abp-spacer iframe,.abp-container iframe,.top-abp-container iframe,
		#AdvertisingLeaderboard iframe,#AdvertisementRight iframe,#MessagesAdSkyscraper iframe,.Ads_WideSkyscraper iframe,
		.profile-ads-container iframe, #ad iframe, iframe[src*="roblox.com/user-sponshorship/"]`

		const iframes = document.getElementsByTagName("iframe")
		new MutationObserver(() => {
			for(let i = iframes.length; i--;) {
				const iframe = iframes[i]
				if(iframe.matches(iframeSelector)) {
					iframe.remove()
				}
			}
		}).observe(document.documentElement, { childList: true, subtree: true })

		const removeScript = x => {
			const cont = x.innerHTML
			if(
				cont.includes("google-analytics.com") ||
				cont.includes("scorecardresearch.com") ||
				cont.includes("cedexis.com") ||
				cont.includes("pingdom.net") ||
				cont.includes("Roblox.Hashcash")
			) {
				x.remove()
			} else if(cont.includes("Roblox.EventStream.Init")) { // Stops e.png logging
				x.innerHTML = x.innerHTML.replace(/"[^"]*"/g, `""`)
			}
		}

		headWatcher.$watchAll("script", removeScript)
		bodyWatcher.$watchAll("script", removeScript)

		if(currentPage && currentPage.name === "home") { // Hashcash :Q_
			bodyWatcher.$watch(".content").$then().$watchAll("script", removeScript)
		}
	}

	if(settings.general.fastSearch) {
		initFastSearch()
	}

	if(settings.general.robuxToDollars) {
		headerWatcher.$watch("#nav-robux-balance", bal => {
			const btn = html`
			<li><a href=/develop/developer-exchange class=rbx-menu-item></a></li>`

			const update = () => {
				const matches = bal.textContent.trim().match(/^([\d,]+)\sRobux$/)
				if(!matches) { return }
				const amt = parseInt(matches[0].replace(/,/g, ""), 10)

				if(!Number.isSafeInteger(amt)) { return }
				btn.firstChild.textContent = `$${RobuxToUSD(amt)} USD`
				bal.parentNode.after(btn)
			}

			const observer = new MutationObserver(update)
			observer.observe(bal, { childList: true })
			update()
		})
	}

	if(settings.general.navigationEnabled && settings.general.showBlogFeed) {
		const updateBlogFeed = data => {
			blogfeed.$empty()

			data.forEach(item => {
				blogfeed.append(html`
				<a class="btr-feed" href="${item.url}">
					<div class="btr-feedtitle">
						${item.title.trim() + " "}
						<span class="btr-feeddate">(${$.dateSince(item.date)} ago)</span>
					</div>
					<div class="btr-feeddesc">${item.desc}</div>
				</a>`)
			})

			blogfeed.style.display = ""
		}

		MESSAGING.send("requestBlogFeed", updateBlogFeed)

		if(blogFeedData) {
			try { updateBlogFeed(blogFeedData) }
			catch(ex) { console.error(ex) }
		}
	}

	if(currentPage && pageInit[currentPage.name]) {
		try { pageInit[currentPage.name].apply(currentPage, currentPage.matches) }
		catch(ex) { console.error(ex) }
	}

	InjectJS.send("INIT", settings, currentPage && currentPage.name, currentPage && currentPage.matches, Object.keys(templateListeners))
}

function PreInit() {
	if(document.contentType !== "text/html") { return }
	const pathname = window.location.pathname

	const exclude = EXCLUDED_PAGES.some(patt => new RegExp(patt, "i").test(pathname))
	if(exclude) { return }

	InjectJS.listen("INJECT_INIT", () => InjectJS.start())
	fetch(chrome.runtime.getURL("js/inject.js")).then(async resp => {
		const script = document.createElement("script")
		script.setAttribute("name", "BTRoblox/inject.js")
		script.textContent = await resp.text()
		
		const parent = document.head || document.documentElement
		parent.prepend(script)
	})

	currentPage = GET_PAGE(pathname)
	STORAGE.get(["settings", "cachedBlogFeedV2"], data => {
		settings = data.settings || JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
		blogFeedData = data.cachedBlogFeedV2

		const cssParent = document.head || document.documentElement
		const injectCSS = path => {
			const link = document.createElement("link")
			link.rel = "stylesheet"
			link.href = chrome.runtime.getURL("css/" + path)
			cssParent.append(link)
		}

		const cssFiles = ["main.css"]
		if(currentPage) { cssFiles.push(...currentPage.css) }

		const theme = settings.general.theme
		cssFiles.forEach(file => {
			injectCSS(file)
			if(theme !== "default") {
				injectCSS(`${theme}/${file}`)
			}
		})

		return Init()
	})
}

PreInit()
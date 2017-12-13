"use strict"

const getURL = chrome.runtime.getURL
const pathname = window.location.pathname.toLowerCase()
const Observer = CreateObserver(document)

let hasDataLoaded = false
let haveContentScriptsLoaded = false
let settings
let currentPage
let blogFeedData;

let loggedInUser = -1
let loggedInUserPromise = null

const InjectJS = {
	_queue: [],
	_started: false,
	_start() {
		if(this._started) return;
		this._started = true
		this._queue.forEach(args => this.send(...args))
		this._queue = []
	},

	send(action, ...detail) {
		if(!this._started) {
			this._queue.push([action, ...detail])
			return;
		}

		document.dispatchEvent(new CustomEvent(`inject.${action}`, { detail }))
	},

	listen(actionList, callback) {
		function cb(event) { callback.apply(this, event.detail) }
		actionList.split(" ").forEach(action => document.addEventListener(`content.${action}`, cb))
	}
}

const templateListeners = {}
function modifyTemplate(id, callback) {
	if(!templateListeners[id]) {
		const listeners = templateListeners[id] = []

		const modify = function(html, end) {
			const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html")
			listeners.forEach(fn => fn(doc.body))
			end(doc.body.innerHTML)
		}

		/* Please stop changing how templates work, roblox!
		Observer.add({
			selector: "#" + id,
			callback: function(template) {
				modify(template.html(), (html) => template.html(html))
			}
		})*/

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

function Init() {
	InjectJS.listen("INJECT_INIT", () => InjectJS._start())

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
	<div class="btr-settings-modal">
		<div class="btr-settings">
			<div class="btr-settings-header">
				<div class="btr-settings-header-title">BTRoblox</div>
				<div class="btr-settings-header-close btr-settings-toggle">⨯</div>
			</div>
			<div class="btr-settings-content">
				<group label="General" path="general">
					<select path="theme">
						<option label="Default" value="default"/>
						<option label="Simply Black" value="simblk"/>
						<option label="Sky" value="sky"/>
						<option label="Red" value="red"/>
					</select>

					<checkbox label="Add Blog Feed to Sidebar" path="showBlogFeed"></checkbox>
					<checkbox label="Show Ads" path="showAds"></checkbox>
					<checkbox label="Keep Sidebar Open" path="noHamburger"></checkbox>
					<checkbox label="Show Chat" path="chatEnabled"></checkbox>
				</group>
				<group label="Profile Changes" path="profile" toggleable>
					<checkbox label="Embed Inventory" path="embedInventoryEnabled"></checkbox>
				</group>
				<group label="Groups Changes" path="groups" toggleable>
					<checkbox label="Group Shout Notifications" path="shoutAlerts"></checkbox>
				</group>
				<group label="Game Details Page Changes" path="gamedetails" toggleable>
					<checkbox label="Highlight Owned Badges" path="showBadgeOwned"></checkbox>
				</group>
				<group label="Item Details Changes" path="itemdetails" toggleable>
					<checkbox label="Animation Previewer" path="animationPreview"></checkbox>
					<checkbox label="Auto-Load Animation Previewer" path="animationPreviewAutoLoad"></checkbox>
					<checkbox label="Show Explorer Button" path="explorerButton"></checkbox>
					<checkbox label="Show Download Button" path="downloadButton"></checkbox>
					<checkbox label="Show Content Button" path="contentButton"></checkbox>
				</group>
				<group label="Inventory Changes" path="inventory" toggleable>
					<checkbox label="Inventory Tools" path="inventoryTools"></checkbox>
				</group>
				<group label="Catalog Changes" path="catalog" toggleable>
				</group>
				<group label="Chat Changes" path="chat" toggleable>
				</group>
				<group label="Version History Changes" path="versionhistory" toggleable>
				</group>
			</div>
			<div class="btr-settings-footer">
				Refresh the page to apply settings
			</div>
		</div>
	</div>`

	document.$on("click", ".btr-settings-toggle", () => {
		const visible = settingsDiv.parentNode !== document.body

		if(visible) document.body.appendChild(settingsDiv);
		else settingsDiv.remove();

		if(!settingsDiv.hasAttribute("loaded")) {
			settingsDiv.setAttribute("loaded", "")
			const content = settingsDiv.$find(".btr-settings-content")

			content.addEventListener("mousewheel", e => {
				if(e.deltaY < 0 && content.scrollTop === 0) return e.preventDefault();
				if(e.deltaY > 0 && content.scrollTop >= content.scrollHeight - content.clientHeight) return e.preventDefault();
			})

			const settingsDone = {}
			let labelCounter = 0
			let wipGroup

			Array.from(content.children).forEach(group => {
				const groupPath = group.getAttribute("path")
				const settingsGroup = settings[groupPath]
				const title = html`<h4>${group.getAttribute("label")}</h4>`
				group.prepend(title)
				title.after(html`<br>`)

				settingsDone[groupPath] = {}

				if(group.hasAttribute("toggleable")) {
					const inputList = group.getElementsByTagName("input")
					const input = html`<input type=checkbox class=btr-settings-enabled-toggle>`
					title.after(input)

					const update = state => {
						Array.from(inputList).forEach(x => {
							if(x === input) return;

							if(!state) x.setAttribute("disabled", "");
							else x.removeAttribute("disabled");
						})
					}

					input.checked = !!settingsGroup.enabled
					input.$on("change", () => {
						settingsGroup.enabled = input.checked
						MESSAGING.send("setSetting", { [groupPath]: { enabled: input.checked } })
						update(input.checked)
					})
					setTimeout(update, 0, input.checked)

					settingsDone[groupPath].enabled = true
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

					checkbox.classList.add("checkbox")

					checkbox.append(input)
					checkbox.append(label)

					if(!(settingName in settingsGroup)) label.textContent += " (Bad setting)";

					input.checked = !!settingsGroup[settingName]
					input.$on("change", () => {
						settingsGroup[settingName] = input.checked
						MESSAGING.send("setSetting", { [groupPath]: { [settingName]: input.checked } })
					})

					settingsDone[groupPath][settingName] = true
				})
			})

			Object.entries(settings).forEach(([groupPath, settingsGroup]) => {
				Object.entries(settingsGroup).forEach(([settingName, settingValue]) => {
					if(groupPath in settingsDone && settingName in settingsDone[groupPath]) return;

					if(!wipGroup) {
						wipGroup = html`<group><h4>WIP</h4><br></group>`
						content.append(wipGroup)
					}

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
		}
	})

	loggedInUserPromise = new Promise(resolve => {
		Observer.one("#nav-profile", nav => {
			const matches = nav.getAttribute("href").match(/\/users\/(\d+)/)
			loggedInUser = matches ? matches[1] : -1
			resolve(loggedInUser)
		})

		onDocumentReady(() => resolve(-1))
	})

	Observer
	.one("head", head => {
		const script = document.createElement("script")
		script.type = "text/javascript"
		script.src = chrome.runtime.getURL("js/inject.js")

		head.append(script)
	})
	.one("body", body => {
		body.classList.toggle("btr-no-hamburger", settings.general.noHamburger)
		body.classList.toggle("btr-hide-ads", !settings.general.showAds)
		body.classList.toggle("btr-newchat", settings.general.chatEnabled && settings.chat.enabled)
	})
	.one("#roblox-linkify", linkify => {
		const newRegex = /((?:(?:https?:\/\/)(?:[\w-]+\.)+\w{2,}|(?:[\w-]+\.)+(?:com|net|uk|org|info|tv|gg|io))(?:\/(?:[\w!$&'"()*+,\-.:;=@_~]|%[0-9A-Fa-f]{2})*)*(?:\?(?:[\w!$&'"()*+,\-.:;=@_~?/]|%[0-9A-Fa-f]{2})*)?(?:#(?:[\w!$&'"()*+,\-.:;=@_~?/]|%[0-9A-Fa-f]{2})*)?)(\b)/
		linkify.setAttribute("data-regex", newRegex.source)
	})
	.one("#navbar-robux", robux => {
		robux.after(friends)
		friends.after(messages)
	})
	.one("#navbar-setting .rbx-popover-content > ul", list => {
		list.prepend(html`<li><a class="rbx-menu-item btr-settings-toggle">BTR Settings</a></li>`)
	})
	.all("#header .rbx-navbar", bar => {
		const buyRobux = bar.$find(".buy-robux")
		if(buyRobux) buyRobux.parentNode.remove();
		bar.prepend(html`<li><a class="nav-menu-title" href="/Home">Home</a></li>`)
	})
	.one("#nav-blog", blog => {
		const list = blog.parentNode.parentNode

		const home = list.$find("#nav-home")
		if(home) home.parentNode.remove();

		const upgrade = list.$find(".rbx-upgrade-now")
		if(upgrade) upgrade.remove();

		blog.parentNode.before(html`
		<li>
			<a href="/Upgrades/BuildersClubMemberships.aspx" id="nav-bc">
				<span class='icon-nav-bc-btr'></span>
				<span>Builders Club</span>
			</a>
		</li>`)

		if(settings.general.showBlogFeed) blog.after(blogfeed);

		const trade = list.$find("#nav-trade")
		if(trade) {
			trade.href = "/My/Money.aspx"
			const label = trade.$find("span:not([class^='icon-nav'])")
			if(label) label.textContent = "Money";
		}


		const navFriends = list.$find("#nav-friends")
		const navMessages = list.$find("#nav-message")
		navMessages.style.display = "none"

		function updateFriends() {
			const notif = friends.$find(".btr-nav-notif")
			const count = navFriends.dataset.count

			friends.$find("a").href = navFriends.href
			notif.textContent = count
			notif.style.display = count > 0 ? "" : "none"
		}

		function updateMessages() {
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

	if(!settings.general.chatEnabled) {
		Observer.one("#chat-container", cont => cont.remove())
	} else {
		modifyTemplate("chat-bar", template => {
			const label = template.$find("#chat-main .chat-header-title")
			label.textContent = "Chat"
		})
	}

	if(!settings.general.showAds) {
		const adSelector = `.ads-container,.abp,.abp-spacer,.abp-container,.top-abp-container,#AdvertisingLeaderboard,
			#AdvertisementRight,#MessagesAdSkyscraper,.Ads_WideSkyscraper,iframe[src*="roblox.com/userads/"],
			.profile-ads-container,#ad,iframe[src*="roblox.com/user-sponsorship/"]`

		CreateObserver(document, { permanent: true })
		.all(adSelector, ad => ad.remove())
		.all("script:not([src])", x => {
			const cont = x.innerHTML
			if(
				cont.indexOf("google-analytics.com") !== -1 ||
				cont.indexOf("googletagservices.com") !== -1 ||
				cont.indexOf("scorecardresearch.com") !== -1 ||
				cont.indexOf("cedexis.com") !== -1
			) {
				x.remove()
			} else if(cont.indexOf("Roblox.EventStream.Init") !== -1) { // Stops e.png logging
				x.innerHTML = x.innerHTML.replace(/"[^"]*"/g, `""`)
			}
		})
	}

	if(settings.general.showBlogFeed) {
		const updateBlogFeed = data => {
			blogfeed.innerHTML = ""

			data.forEach(item => {
				blogfeed.append(html`
				<a class="btr-feed" href="${item.url}">
					<div class="btr-feedtitle">
						${item.title}
						<span class="btr-feeddate">${$.dateSince(item.date)} ago</span>
					</div>
					<div class="btr-feeddesc">${item.desc}</div>
				</a>`)
				// <div class="btr-feedcreator">by ${item.creator}</div>
			})

			blogfeed.style.display = ""
		}

		if(blogFeedData) updateBlogFeed(blogFeedData);
		MESSAGING.send("requestBlogFeed", updateBlogFeed)
	}

	if(currentPage && pageInit[currentPage.name]) {
		pageInit[currentPage.name].apply(currentPage, currentPage.matches)
	}

	onDocumentReady(() => {
		InjectJS.send("INIT", settings, currentPage && currentPage.name, currentPage && currentPage.matches, Object.keys(templateListeners))
	})
}

function PreInit() {
	if(document.contentType !== "text/html") return;

	currentPage = GET_PAGE(pathname)
	STORAGE.get(["settings", "cachedBlogFeed", "themes"], data => {
		settings = data.settings || JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
		blogFeedData = data.cachedBlogFeed

		const cssParent = document.head || document.documentElement
		const injectCSS = path => {
			const link = document.createElement("link")
			link.rel = "stylesheet"
			link.href = chrome.runtime.getURL("css/" + path)
			cssParent.append(link)
		}

		const cssFiles = ["main.css", ...(currentPage && currentPage.css || [])]
		cssFiles.forEach(injectCSS)

		if(data.themes) {
			const theme = settings.general.theme
			const themeData = data.themes[theme]

			if(themeData) {
				cssFiles.forEach(file => file in themeData && injectCSS(`${theme}/${file}`))
			}
		}

		hasDataLoaded = true
		if(haveContentScriptsLoaded) Init();
	})
}

PreInit()
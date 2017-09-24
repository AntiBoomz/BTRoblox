"use strict"

const isDevExtension = chrome.runtime.id !== "hbkpclpemjeibhioopcebchdmohaieln"
const pathname = window.location.pathname.toLowerCase()
const getURL = chrome.runtime.getURL
const Observer = CreateObserver(document)

let hasDataLoaded = false
let haveContentScriptsLoaded = false
let settings
let currentPage
let blogFeedData;

let loggedInUser = -1
let loggedInUserPromise = null


const BackgroundJS = (() => {
	const listenersByType = {}
	let port
	let portTimeout

	const onMessage = msg => {
		const listeners = listenersByType[msg.type]
		if(listeners) {
			for(let i = 0; i < listeners.length; i++) {
				const [callback, once] = listeners[i]
				try {
					const result = callback(msg.data)
					if(once) listeners.splice(i--, 1);
					if(result === true) return true;
				} catch(ex) { console.error(ex) }
			}
		}
	}

	const refreshPort = () => {
		if(!port) {
			port = chrome.runtime.connect({ name: "BackgroundJS.connect" })

			port.onMessage.addListener(onMessage)
			port.onDisconnect.addListener(() => {
				clearTimeout(portTimeout)
				port = null
			})
		}

		clearTimeout(portTimeout)
		portTimeout = setTimeout(() => {
			port.disconnect()
			port = null
		}, 60e3)
	}

	return {
		send(type, data, callback) {
			if(typeof data === "function") {
				callback = data
				data = null
			}

			refreshPort()
			chrome.runtime.sendMessage({ type, data }, callback)
		},
		listen(typeList, callback, once) {
			typeList.split(" ").forEach(type => {
				if(!listenersByType[type]) listenersByType[type] = [];
				listenersByType[type].push([callback, once])
			})
		}
	}
})();

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
	<div id="btr_blogfeed" style="display:none;">Blog feed enabled</div>`

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
						BackgroundJS.send("setSetting", { [groupPath]: { enabled: input.checked } })
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
						BackgroundJS.send("setSetting", { [groupPath]: { [settingName]: select.value } })
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
						BackgroundJS.send("setSetting", { [groupPath]: { [settingName]: input.checked } })
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
							BackgroundJS.send("setSetting", { [groupPath]: { [settingName]: input.checked } })
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
		script.src = getURL("js/inject.js")

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
	.one(".rbx-navbar-right-search", () => {
		const header = $("#header.rbx-header")
		const navbars = header.$find(".nav.rbx-navbar")

		navbars.$find(".buy-robux").parentNode.remove()
		navbars.prepend(html`<li><a class="nav-menu-title" href="/Home">Home</a></li>`)
		navbars.append(html`<li><a class="nav-menu-title" href="/Forum/default.aspx">Forum</a></li>`)

		loggedInUserPromise.then(userId => {
			if(userId === -1) return;

			$("#navbar-robux").after(friends)
			friends.after(messages)

			$(".rbx-popover-content[data-toggle='popover-setting']>ul")
				.prepend(html`<li><a class="rbx-menu-item btr-settings-toggle">BTR Settings</a></li>`)
		})
	})
	.one(".rbx-upgrade-now", () => {
		$.all("#nav-home, #nav-message, #nav-forum").forEach(node => { node.parentNode.style.display = "none" })
		$(".rbx-upgrade-now").style.display = "none"

		$("#nav-forum").parentNode.after(html`
		<li>
			<a href="/Upgrades/BuildersClubMemberships.aspx" id="nav-bc">
				<span class='icon-nav-bc-btr'></span>
				<span>Builders Club</span>
			</a>
		</li>`)

		const trade = $("#nav-trade")
		trade.href = "/My/Money.aspx"
		trade.$find("span:not([class^='icon-nav'])").textContent = "Money"

		if(settings.general.showBlogFeed) $("#nav-blog").after(blogfeed);

		const navFriends = $("#nav-friends")
		const navMessages = $("#nav-message")

		function updateFriends() {
			const notif = friends.$find(".btr-nav-notif")
			const count = navFriends.getAttribute("data-count")

			friends.$find("a").href = navFriends.href
			notif.textContent = count
			notif.style.display = count > 0 ? "" : "none"
		}

		function updateMessages() {
			const notif = messages.$find(".btr-nav-notif")
			const count = navMessages.getAttribute("data-count")

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
				const relativeDate = new Date(item.published).relativeFormat("(z 'ago')")
				blogfeed.append(html`
				<a class="btr_feed" href="${item.url}">
					<div class="btr_feedtitle">
						${item.title}
						<span class="btr_feeddate">${relativeDate}</span>
					</div>
					<div class="btr_feeddesc">${item.desc}</div>
					<div class="btr_feedcreator">by ${item.creator}</div>
				</a>`)
			})

			blogfeed.style.display = ""
		}

		if(blogFeedData) updateBlogFeed(blogFeedData);
		BackgroundJS.listen("blogfeed", updateBlogFeed)
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
	chrome.storage.local.get(["settings", "cachedBlogFeed"], data => {
		settings = data.settings ? data.settings : JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
		blogFeedData = data.cachedBlogFeed

		const cssFiles = ["main.css"]
		if(currentPage && currentPage.css) cssFiles.push(...currentPage.css);

		const cssGroups = ["css/", `css/${settings.general.theme}/`]
		const parent = document.head || document.documentElement
		cssGroups.forEach(group => cssFiles.forEach(filePath => {
			const link = document.createElement("link")
			link.rel = "stylesheet"
			link.href = getURL(group + filePath)

			parent.append(link)
		}))

		if(haveContentScriptsLoaded) Init();
	})

	BackgroundJS.send("requestBlogFeed")
}

PreInit()
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


const BackgroundJS = {
	_listeners: {},
	_reqCounter: 0,
	_started: false,
	_start() {
		if(this._started) return;
		this._started = true
		this._port = chrome.runtime.connect({ name: "contentScript" })

		this._port.onMessage.addListener(msg => {
			if(!(msg instanceof Object) || typeof msg.action !== "string") return;

			const list = this._listeners[msg.action]
			if(list) {
				for(let i = 0; i < list.length; i++) {
					const listener = list[i]
					if(listener.once) list.splice(i--, 1);
					listener.callback(msg.data)
				}
			}
		})
	},
	send(action, ...args) {
		const uid = this._reqCounter++
		let [data, callback] = args
		if(typeof data === "function") {
			callback = data
			data = null
		}


		if(callback) this.listen(`_response_${uid}`, callback);
		this._port.postMessage({ uid, action, data })
	},
	listen(actionList, callback, once) {
		actionList.split(" ").forEach(action => {
			if(!this._listeners[action]) this._listeners[action] = [];
			this._listeners[action].push({ callback, once })
		})
	}
}

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
			this._queue.push(detail)
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
	BackgroundJS._start()
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
	<div id="btr-settings">
		<a class="btr-settings-toggle">x</a>
		<iframe src="${getURL("options.html")}">
	</div>`

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


	let settingsVisible = false
	document.$on("click", ".btr-settings-toggle", () => {
		settingsVisible = !settingsVisible

		if(settingsVisible) document.body.append(settingsDiv)
		else settingsDiv.remove()
	})

	if(!settings.general.chatEnabled) {
		Observer.one("#chat-container", cont => cont.remove())
	} else {
		modifyTemplate("chat-bar", template => {
			const label = template.$find("#chat-main .chat-header-title")
			label.textContent = "Chat"
		})
	}

	if(true) {
		let target
		let audio;

		const audioStop = () => {
			if(target) {
				target.classList.remove("icon-pause")
				target.classList.add("icon-play")
			}
			audio.pause()
		}

		const audioPlay = () => {
			if(target) {
				target.classList.remove("icon-play")
				target.classList.add("icon-pause")
			}
			audio.play()
		}

		document.$on("click", ".MediaPlayerIcon[data-mediathumb-url]", ev => {
			ev.stopImmediatePropagation()

			if(target === ev.currentTarget) return audio.paused ? audioPlay() : audioStop();

			if(!audio) {
				audio = new Audio();

				let checkInterval;
				audio.$on("play", () => {
					clearInterval(checkInterval)
					checkInterval = setInterval(() => {
						if(!target || !document.documentElement.contains(target)) {
							clearInterval(checkInterval)
							audioStop()
						}
					}, 500)
				})
				audio.$on("ended error", () => {
					clearInterval(checkInterval)
					audioStop()
				})
			}

			audioStop()

			target = ev.currentTarget
			audio.src = target.dataset.mediathumbUrl

			audioPlay()
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

	chrome.runtime.sendMessage({ name: "getdata", url: location.href }, data => {
		if(!data) return;
		hasDataLoaded = true

		settings = data.settings
		currentPage = data.currentPage
		blogFeedData = data.blogFeedData

		if(haveContentScriptsLoaded) Init();
	})
}

PreInit()
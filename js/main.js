"use strict"

var pageInit = {}
var loggedInUser = -1
var loggedInUserPromise = null

var isDevExtension = chrome.runtime.id !== "hbkpclpemjeibhioopcebchdmohaieln"
var pathname = window.location.pathname.toLowerCase()
var getURL = chrome.runtime.getURL
var Observer = CreateObserver(document)

function CreateObserver(target, params) {
	var options = Object.assign({ childList: true, subtree: true }, params || {})
	var connected = false
	var observeList = []

	if(!options.permanent) {
		onDocumentReady(() => {
			observeList = []
		})
	}


	var mo = new MutationObserver(mutations => {
		for(var index=0; index < observeList.length; index++) {
			var item = observeList[index]

			switch(item.type) {
				case "one":
					var elem = null

					if(!item.filter) {
						elem = target.querySelector(item.selector)
					} else {
						//var elems = target.querySelectorAll(item.selector)

						for(var i=0; i < mutations.length; i++) {
							var addedNodes = mutations[i].addedNodes
							for(var j=0; j < addedNodes.length; j++) {
								var node = addedNodes[j]
								if(node.nodeType !== 1 || !node.matches(item.selector)) continue; //  || Array.prototype.indexOf.call(elems, node) === -1
								if(!item.filter(node)) continue;
								
								elem = node
								break
							}

							if(elem) break;
						}
					}

					if(!elem) break;
					observeList.splice(index--, 1)

					if(!item.partial) {
						try { item.callback(elem) }
						catch(ex) { console.error("[MutationObserver]", ex) }
					} else {
						item.whole.result[item.index] = elem

						if(--item.whole.resultsLeft === 0) {
							try { item.whole.callback.apply(null, item.whole.result) }
							catch(ex) { console.error("[MutationObserver]", ex) }
						}
					}
				break;
				case "all":
					//var elems = target.querySelectorAll(item.selector)
					//if(!elems.length) break;

					for(var i=0; i < mutations.length; i++) {
						var addedNodes = mutations[i].addedNodes
						for(var j=0; j < addedNodes.length; j++) {
							var node = addedNodes[j]
							if(node.nodeType !== 1 || !node.matches(item.selector)) continue; //  || Array.prototype.indexOf.call(elems, node) === -1
							if(item.filter && !item.filter(node)) continue;

							try { item.callback(node) }
							catch(ex) { console.error("[MutationObserver]", ex) }
						}
					}
				break;
			}
		}

		if(connected && observeList.length === 0) {
			connected = false
			mo.disconnect()
		}
	})

	function firstCheck(item) {
		switch(item.type) {
			case "one":
				var elem

				if(item.filter) {
					var elems = target.querySelectorAll(item.selector)

					for(var i=0; i < elems.length; i++) {
						if(item.filter(elems[i])) {
							elem = elems[i]
							break
						}
					}
				} else {
					elem = target.querySelector(item.selector)
				}

				if(elem) {
					try { item.callback(elem) }
					catch(ex) { console.error("[MutationObserver]", ex) }

					return true
				}

				break
			case "all":
				var elems = target.querySelectorAll(item.selector)

				for(var i=0; i < elems.length; i++) {
					if(item.filter && !item.filter(elems[i])) continue;

					try { item.callback(elems[i]) }
					catch(ex) { console.error("[MutationObserver]", ex) }
				}
				break
		}

		return false
	}


	return {
		one() {
			var selector = arguments[0]
			var filter, callback

			if(arguments.length === 2) {
				callback = arguments[1]
			} else if(arguments.length === 3) {
				filter = arguments[1]
				callback = arguments[2]
			}

			var items = []

			if(Array.isArray(selector)) {
				var whole = {
					result: [],
					resultsLeft: selector.length,
					callback: callback
				}

				for(var i=0; i < selector.length; i++) {
					var item = {
						type: "one",

						partial: true,
						whole: whole,
						index: i,

						selector: selector[i],
						filter: filter
					}

					items.push(item)
				}
			} else {
				var item = {
					type: "one",

					selector: selector,
					filter: filter,
					callback: callback
				}

				items.push(item)
			}

			items.forEach(item => !firstCheck(item) && observeList.push(item))

			if(!connected && observeList.length > 0) {
				connected = true
				mo.observe(target, options)
			}

			return this
		},
		all() {
			var selector = arguments[0]
			var filter, callback

			if(arguments.length === 2) {
				callback = arguments[1]
			} else if(arguments.length === 3) {
				filter = arguments[1]
				callback = arguments[2]
			}

			var item = {
				type: "all",

				selector: selector,
				filter: filter,
				callback: callback
			}

			firstCheck(item)
			observeList.push(item)

			if(!connected) {
				connected = true
				mo.observe(target, options)
			}

			return this
		}
	}
}

var templateListeners = {}
function modifyTemplate(id, callback) {
	if(!templateListeners[id]) {
		var listeners = templateListeners[id] = []
		
		var modify = function(html, end) {
			var doc = new DOMParser().parseFromString("<body>" + html + "</body>", "text/html")
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

		InjectJS.listen("TEMPLATE_" + id, (data) => {
			modify(data, html => InjectJS.send("TEMPLATE_" + id, html))
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



var BackgroundJS = {
	_listeners: {},
	_reqCounter: 0,
	_started: false,
	_start: function() {
		if(this._started) return;
		this._started = true
		this._port = chrome.runtime.connect({ name: "contentScript" })

		this._port.onMessage.addListener((msg) => {
			if(!(msg instanceof Object) || typeof(msg.action) !== "string")
				return;

			var list = this._listeners[msg.action]
			if(list) {
				for(var i=0; i < list.length; i++) {
					var listener = list[i]
					if(listener.once)
						list.splice(i--, 1);

					listener.callback(msg.data)
				}
			}
		})
	},

	send: function(action, data, callback) {
		if(typeof(data) == "function")
			callback = data, data = null;

		var uid = this._reqCounter++

		if(callback)
			this.listen("_response_" + uid, callback);

		this._port.postMessage({
			uid: uid,
			action: action,
			data: data
		})
	},

	listen: function(actionList, callback, once) {
		actionList.split(" ").forEach((action) => {
			if(!this._listeners[action])
				this._listeners[action] = [];

			this._listeners[action].push({
				callback: callback,
				once: once
			})
		})
	}
}; BackgroundJS._start();

var InjectJS = {
	_queue: [],
	_started: false,
	_start: function() {
		if(this._started) return;
		this._started = true
		this._queue.forEach((args) => this.send.apply(this, args))
		this._queue = []
	},

	send: function(action) {
		if(!this._started) {
			this._queue.push(arguments)
			return;
		}

		document.dispatchEvent(new CustomEvent("inject." + action, {detail: Array.prototype.slice.call(arguments, 1)}))
	},

	listen: function(actionList, callback) {
		var realCallback = function(event) {
			callback.apply(this, event.detail)
		}

		actionList.split(" ").forEach(function(action) {
			document.addEventListener("content." + action, realCallback)
		})
	}
}; InjectJS.listen("INJECT_INIT", () => InjectJS._start());


// Premade objects


var friends = html`
<li id="btr-navbar-friends" class="navbar-icon-item">
	<a class="rbx-menu-item" href="/Friends.aspx">
		<span class="icon-nav-friend-btr"></span>
		<span class="btr-nav-notif rbx-text-navbar-right" style="display:none;"></span>
	</a>
</li>`

var messages = html`
<li id="btr-navbar-messages" class="navbar-icon-item">
	<a class="rbx-menu-item" href="/My/Messages#!/inbox">
		<span class="icon-nav-message-btr"></span>
		<span class="btr-nav-notif rbx-text-navbar-right" style="display:none;"></span>
	</a>
</li>`

var blogfeed = html`
<div id="btr_blogfeed" style="display:none;">Blog feed enabled</div>`

var settingsDiv = html`
<div id="btr-settings">
	<a class="btr-settings-toggle">x</a>
	<iframe src="${getURL("options.html")}">
</div>`

var settingsIframe = settingsDiv.$find("iframe")



function Init() {
	loggedInUserPromise = new Promise(resolve => {
		Observer.one("#nav-profile", nav => {
			var matches = nav.getAttribute("href").match(/\/users\/(\d+)/)
			loggedInUser = matches ? matches[1] : -1
			resolve(loggedInUser)
		})

		onDocumentReady(() => resolve(-1))
	})

	Observer
	.one("head", head => {
		var script = document.createElement("script")
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
		var newRegex = /((?:(?:https?:\/\/)(?:[\w\-]+\.)+\w{2,}|(?:[\w\-]+\.)+(?:com|net|uk|org|info|tv|gg|io))(?:\/(?:[\w!$&'\"()*+,\-.:;=@_~]|%[0-9A-Fa-f]{2})*)*(?:\?(?:[\w!$&'\"()*+,\-.:;=@_~?\/]|%[0-9A-Fa-f]{2})*)?(?:#(?:[\w!$&'\"()*+,\-.:;=@_~?\/]|%[0-9A-Fa-f]{2})*)?)(\b)/
		linkify.setAttribute("data-regex", newRegex.source)
	})
	.one(".rbx-navbar-right-search", () => {
		var header = $("#header.rbx-header")
		var navbars = header.$find(".nav.rbx-navbar")

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
		$.all("#nav-home, #nav-message, #nav-forum").forEach(node => node.parentNode.style.display = "none")
		$(".rbx-upgrade-now").style.display = "none"

		$("#nav-forum").parentNode.after(html`
		<li>
			<a href="/Upgrades/BuildersClubMemberships.aspx" id="nav-bc">
				<span class='icon-nav-bc-btr'></span>
				<span>Builders Club</span>
			</a>
		</li>`)

		var trade = $("#nav-trade")
		trade.href = "/My/Money.aspx"
		trade.$find("span:not([class^='icon-nav'])").textContent = "Money"

		if(settings.general.showBlogFeed)
			$("#nav-blog").after(blogfeed);

		var navFriends = $("#nav-friends")
		var navMessages = $("#nav-message")

		function updateFriends() {
			var notif = friends.$find(".btr-nav-notif")
			var count = navFriends.getAttribute("data-count")

			friends.$find("a").href = navFriends.href
			notif.textContent = count
			notif.style.display = count > 0 ? "" : "none"
		}

		function updateMessages() {
			var notif = messages.$find(".btr-nav-notif")
			var count = navMessages.getAttribute("data-count")

			messages.$find("a").href = navMessages.href
			notif.textContent = count
			notif.style.display = count > 0 ? "" : "none"
		}

		new MutationObserver(updateFriends).observe(navFriends, { attributes: true, attributeFilter: ["href", "data-count"] })
		new MutationObserver(updateMessages).observe(navMessages, { attributes: true, attributeFilter: ["href", "data-count"] })

		updateFriends()
		updateMessages()
	})


	var settingsVisible = false
	document.$on("click", ".btr-settings-toggle", () => {
		settingsVisible = !settingsVisible

		if(settingsVisible) {
			document.body.append(settingsDiv)
		} else {
			settingsDiv.remove()
		}
	})

	if(!settings.general.chatEnabled) {
		Observer.one("#chat-container", cont => cont.remove())
	} else {
		modifyTemplate("chat-bar", template => {
			var label = template.$find(".chat-header-label:first-child .chat-header-title")
			label.textContent = "Chat"
		})
	}

	if(!settings.general.showAds) {
		var adSelector = '.ads-container,.abp,.abp-spacer,.abp-container,.top-abp-container,#AdvertisingLeaderboard,\
			#AdvertisementRight,#MessagesAdSkyscraper,.Ads_WideSkyscraper,iframe[src*="roblox.com/userads/"],\
			.profile-ads-container,#ad,iframe[src*="roblox.com/user-sponsorship/"]'

		CreateObserver(document, { permanent: true })
		.all(adSelector, ad => ad.remove())
		.all("script:not([src])", x=> {
			var cont = x.innerHTML
			if(
				cont.indexOf("google-analytics.com") != -1 ||
				cont.indexOf("googletagservices.com") != -1 ||
				cont.indexOf("scorecardresearch.com") != -1 ||
				cont.indexOf("cedexis.com") != -1
			) {
				x.remove()
			} else if(cont.indexOf("Roblox.EventStream.Init") != -1) { // Stops e.png logging
				x.innerHTML = x.innerHTML.replace(/"[^"]*"/g,'""')
			}
		})
	}

	if(settings.general.showBlogFeed) {
		function updateBlogFeed(data) {
			blogfeed.innerHTML = ""

			data.forEach(item => {
				var relativeDate = new Date(item.published).relativeFormat("(z 'ago')")
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

		if(typeof(blogFeedData) !== "undefined")
			updateBlogFeed(blogFeedData);

		BackgroundJS.listen("blogfeed", updateBlogFeed)
	}

	if(currentPage && pageInit[currentPage.name]) {
		pageInit[currentPage.name].apply(currentPage, currentPage.matches)
	}

	onDocumentReady(() => {
		InjectJS.send("INIT", settings, currentPage && currentPage.name, currentPage && currentPage.matches, Object.keys(templateListeners))
	})
}
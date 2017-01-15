"use strict"
var loggedInUser = -1
var loggedInUserPromise = null

var pathname = window.location.pathname.toLowerCase()

function CreateObserver(target) {
	if(target instanceof jQuery)
		target = target[0]

	var observeSettings = { childList: true, subtree: true }
	var observeList = []
	var connected = false

	var mo = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			mutation.addedNodes.forEach(function(node) {
				if(node.nodeType == 1) { // Ís an element
					for(var itemIndex=0; itemIndex<observeList.length; itemIndex++) {
						var item = observeList[itemIndex]

						if(node.matches(item.selector)) {
							var jnode = $(node)

							if(item.parent) {
								observeList.splice(itemIndex--, 1)

								item.parent.result[item.index] = jnode
								if(--item.parent.resultsLeft === 0) {
									try {
										item.parent.callback.apply(null, item.parent.result)
									} catch(exception) {
										console.log("Observer Error:", exception.stack)
									}
								}
							} else {
								if(!item.filter || item.filter.apply(jnode)) {
									if(!item.multiple)
										observeList.splice(itemIndex--,1)

									try {
										item.callback(jnode)
									} catch(exception) {
										console.log("Observer error:",exception.stack)
									}
								}
							}
						}
					}
				}
			})
		})

		if(observeList.length == 0) {
			connected = false
			mo.disconnect()
		}
	});

	return {
		add: function(options) {
			if(!(options instanceof Object) || options instanceof Array)
				return this;

			if(options.condition != null && !options.condition)
				return this;

			if(options.callback == null) {
				console.error("Tried to add an observer without a callback")
				return this;
			}

			if(options.selector == null) {
				console.error("Tries to add an observer without a selector")
				return this;
			}

			if(options.selector instanceof Array) {
				var data = {
					selectors: options.selector,
					result: [],
					resultsLeft: options.selector.length,
					callback: options.callback,
					permanent: options.permanent
				}

				options.selector.forEach(function(selector,index) {
					var result = target.querySelectorAll(selector)
					if(result.length > 0) {
						data.result[index] = $(result[0])
						data.resultsLeft--
					} else {
						observeList.push({
							selector: selector,
							index: index,
							parent: data,
						})
					}
				})

				if(data.resultsLeft == 0) {
					try {
						data.callback.apply(null, data.result)
					} catch(exception) {
						console.log("Observer Error:", exception.stack)
					}
					return this;
				}
			} else {
				var result = target.querySelectorAll(options.selector)
				if(result.length > 0) {
					if(options.multiple) {
						result.forEach(function(item) {
							var jitem = $(item)
							if(!options.filter || options.filter.apply(jitem)) {
								try {
									options.callback(jitem)
								} catch(exception) {
									console.log("Observer Error:",exception.stack)
								}
							}
						})
					} else {
						for(var i=0;i<result.length;i++) {
							var jitem = $(result[i])
							if(!options.filter || options.filter.apply(jitem)) {
								try {
									options.callback(jitem)
								} catch(exception) {
									console.log("Observer Error:",exception.stack)
								}
								return this;
							}
						}
					}
				}

				observeList.push({
					selector: options.selector,
					filter: options.filter,
					callback: options.callback,
					permanent: options.permanent,
					multiple: options.multiple
				})
			}

			if(!connected) {
				connected = true
				mo.observe(target,observeSettings)
			}

			return this
		}
	}
}

var BackgroundJS = {
	send: function(action, data, callback) {
		if(typeof(data) == "function")
			callback = data, data = null;

		if(!this._port) {
			var begin = Date.now()
			this._port = chrome.runtime.connect()
			var callbacks = this._callbacks = {}
			this._uuid = 0

			this._port.onMessage.addListener(function(msg) {
				if(msg.action == "return") {
		//			console.log("Receiving response took", Date.now() - msg.sent, "ms")
					if(callbacks[msg.uuid])
						callbacks[msg.uuid](msg.response)
				}
			})
		//	console.log("Connecting port took", Date.now()-begin, "ms")
		}

		var uuid = this._uuid++
		if(callback)
			this._callbacks[uuid] = callback

		this._port.postMessage({
			uuid: uuid,
			action: action,
			data: data,
			sent: Date.now()
		})
	}
}

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

	listen: function(actionList,callback) {
		var realCallback = function(event) {
			callback.apply(this, event.detail)
		}

		actionList.split(" ").forEach(function(action) {
			document.addEventListener("content."+action, realCallback)
		})
	}
} 
InjectJS.listen("INJECT_INIT", () => InjectJS._start())

var MediaPlayerControls = {
	init: function() {
		if(this._initialized)
			return;

		this._initialized = true


		var audioPlayer = null
		var currentButton = null
		var audioCache = {}

		function end() {
			if(audioPlayer) {
				audioPlayer.pause()
				audioPlayer.currentTime = 0
			}

			if(currentButton) {
				currentButton.removeClass("icon-pause").addClass("icon-play")
				currentButton = null
			}
		}

		this.stop = end

		$(document).on("click",".btr-MediaPlayerControls[data-assetid]",function() {
			var self = $(this)
			var assetId = self.attr("data-assetid")
			if(assetId) {
				if(!audioPlayer) {
					audioPlayer = this._audioPlayer = new Audio()
					audioPlayer.volume = 1
					audioPlayer.onended = end
				}

				if(self.is(currentButton)) {
					if(audioPlayer.paused) {
						audioPlayer.play()
						currentButton.addClass("icon-pause").removeClass("icon-play")
					} else{
						audioPlayer.pause()
						currentButton.removeClass("icon-pause").addClass("icon-play")
					}
				} else {
					if(currentButton)
						currentButton.removeClass("icon-pause").addClass("icon-play")

					currentButton = self;

					if(!audioCache[assetId]) {
						audioCache[assetId] = new Promise(function(resolve) {
							self.addClass("icon-loading")
							downloadAsset("blob",{id:assetId}).then(function(src) {
								self.removeClass("icon-loading")
								resolve(src)
							})
						})
					}

					audioPlayer.pause();

					audioCache[assetId].then(function(src) {
						if(self.is(currentButton)) {
							audioPlayer.src = src;
							audioPlayer.play();
						}
					})

					currentButton.addClass("icon-pause").removeClass("icon-play")
				}
			}

			return false;
		})
	},
	stop: function() {}
}


var Observer = CreateObserver(document)

var templateListeners = {}
function modifyTemplate(id, callback) {
	if(!templateListeners[id]) {
		var listeners = templateListeners[id] = []

		var modify = function(html, end) {
			var doc = new DOMParser().parseFromString(html, "text/html")
			var jbody = $(doc.body)
			listeners.forEach((fn) => fn(jbody))
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
			modify(data, (html) => InjectJS.send("TEMPLATE_" + id, html))
		})
	}

	templateListeners[id].push(callback)
}

// Premade objects

var friends = $('<li id="btr-navbar-friends" class="navbar-icon-item">\
	<a class="rbx-menu-item" href="/Friends.aspx">\
		<span class="icon-nav-friend-btr"></span>\
		<span class="btr-nav-notif rbx-text-navbar-right" style="display:none;"></span>\
	</a>\
</li>')
var messages = $('<li id="btr-navbar-messages" class="navbar-icon-item">\
	<a class="rbx-menu-item" href="/My/Messages#!/inbox">\
		<span class="icon-nav-message-btr"></span>\
		<span class="btr-nav-notif rbx-text-navbar-right" style="display:none;"></span>\
	</a>\
</li>')

var blogfeed = $("<div id='btr_blogfeed'>Blog feed enabled</div>").css("display","none");

var settingsDiv = $("<div id='btr-settings'>" +
	"<a class='btr-settings-toggle'>x</a>" +
"</div>")

var settingsIframe = $("<iframe scrolling='no'/>").appendTo(settingsDiv)



function Init() {
	loggedInUserPromise = new Promise(function(resolve) {
		Observer.add({
			selector: "#nav-profile",
			callback: function(nav) {
				var matches = nav.attr("href").match(/\/users\/(\d+)/)
				loggedInUser = matches&&matches[1]||-1
				resolve(loggedInUser)
			}
		})

		$(document).ready(function() {
			resolve(-1)
		})
	})

	Observer.add({ // Inject.js
		selector: "head",
		callback: function(head) {
			var script = document.createElement("script")
			script.setAttribute("type", "text/javascript")
			script.src = chrome.runtime.getURL("js/inject.js")
			document.head.appendChild(script)
		}
	}).add({
		selector: "body",
		callback: function(body) {
			body.toggleClass("btr-no-hamburger",settings.general.noHamburger)
				.toggleClass("btr-hide-ads",!settings.general.showAds)
				.toggleClass("btr-newchat",settings.general.chatEnabled && settings.chat.enabled)

			settingsDiv.appendTo(body)
		}
	}).add({ // Multi-domain linkify
		selector: "#roblox-linkify",
		callback: function(div) {
			var newRegex = /((?:(?:https?:\/\/)(?:[\w\-]+\.)+\w{2,}|(?:[\w\-]+\.)+(?:com|net|uk|org|info|tv|gg|io))(?:\/(?:[\w!$&'\"()*+,\-.:;=@_~]|%[0-9A-Fa-f]{2})*)*(?:\?(?:[\w!$&'\"()*+,\-.:;=@_~?\/]|%[0-9A-Fa-f]{2})*)?(?:#(?:[\w!$&'\"()*+,\-.:;=@_~?\/]|%[0-9A-Fa-f]{2})*)?)(\b)/
			div.attr("data-regex",newRegex.source)
		}
	}).add({ // Modify topbar
		selector: ".rbx-navbar-right-search",
		callback: function() {
			var header = $("#header.rbx-header");
			var navbars = $(".nav.rbx-navbar",header);

			$(".buy-robux",navbars).parent().hide()
			$("<li><a class='nav-menu-title' href='/Home'>Home</a></li>").prependTo(navbars)
			$("<li><a class='nav-menu-title' href='/Forum/default.aspx'>Forum</a></li>").appendTo(navbars)

			loggedInUserPromise.then(function(loggedInUser) {
				if(loggedInUser > 0) { // is logged in
					friends.insertAfter($("#navbar-robux"))
					messages.insertAfter(friends)

					$('<li><a class="rbx-menu-item btr-settings-toggle">BTR Settings</a></li>')
						.prependTo(".rbx-popover-content[data-toggle='popover-setting']>ul")
				}
			})
		}
	}).add({ // Modify sidebar
		selector: ".rbx-upgrade-now",
		callback: function() {
			var navcol = $("#navigation");
			
			$("#nav-home,#nav-message,#nav-forum").parent().hide()
			$("<li>\
				<a href='/Upgrades/BuildersClubMemberships.aspx' id='nav-bc'>\
					<span class='icon-nav-bc-btr'/><span>Builders Club</span>\
				</a>\
			</li>").insertAfter($("#nav-forum").parent())

			$("#nav-trade>span:not([class^='icon-nav'])").text("Money").parent().attr("href","/My/Money.aspx")

			blogfeed.appendTo($("#nav-blog").parent());

			$(".rbx-upgrade-now").hide();

			friends.find(">a").attr("href",$("#nav-friends").attr("href"))

			var fr_count = $("#nav-friends").attr("data-count");
			if(fr_count > 0)
				friends.find(".btr-nav-notif").show().text(fr_count);
			
			var msg_count = $("#nav-message").attr("data-count");
			if(msg_count > 0)
				messages.find(".btr-nav-notif").show().text(msg_count);
		}
	})

	$(document).on("click",".btr-settings-toggle",function() {
		settingsDiv.toggleClass("visible")
		if(!settingsIframe.attr("src"))
			settingsIframe.attr("src",chrome.runtime.getURL("options.html"))
	})


	InjectJS.listen("Messages.CountChanged",function() {
		$.get("/messages/api/get-my-unread-messages-count",function(n) {
			var notif = messages.find(".btr-nav-notif")
			if(n.count > 0) {
				notif.text(n.count)
				notif.show()
			} else {
				notif.hide()
			}
		})
	})

	InjectJS.listen("Friends.CountChanged",function() {
		$.get("/navigation/getCount",function(n) {
			var a = friends.find("a")
			var notif = friends.find(".btr-nav-notif")
			a.attr("href",n.FriendNavigationUrl)
			if(n.TotalFriendRequests > 0) {
				notif.text(n.TotalFriendRequests)
				notif.show()
			} else {
				notif.hide()
			}
		})
	})

	if(currentPage) {
		var page = pages[currentPage.name]
		if(page.init)
			page.init.apply(page, currentPage.matches);
	}

	if(!settings.general.chatEnabled) {
		Observer.add({
			selector: "#chat-container",
			callback: function(container) {
				container.remove()
			}
		})
	} else {
		modifyTemplate("chat-bar", function(template) {
			var label = template.find(".chat-header-label:first .chat-header-title")
			label.text("Chat")
		})
	}

	if(!settings.general.showAds) {
		Observer.add({
			multiple: true,
			selector: '.ads-container,.abp,.abp-spacer,.abp-container,.top-abp-container,#AdvertisingLeaderboard,\
			#AdvertisementRight,#MessagesAdSkyscraper,.Ads_WideSkyscraper,iframe[src*="roblox.com/userads/"],\
			.profile-ads-container,#ad',
			callback: function(ad) {
				ad.remove();
			}
		}).add({
			multiple: true,
			selector: "script:not([src])",
			callback: function(x) {
				var cont = x.html()
				if(
					cont.indexOf("google-analytics.com") != -1 ||
					cont.indexOf("googletagservices.com") != -1 ||
					cont.indexOf("scorecardresearch.com") != -1 ||
					cont.indexOf("cedexis.com") != -1
				) {
					x.remove()
				} else if(cont.indexOf("Roblox.EventStream.Init") != -1) { // Stops e.png logging
					x.html(x.html().replace(/"[^"]*"/g,'""'))
				}
			}
		})
	}

	if(settings.general.showBlogFeed) {
		BackgroundJS.send("getBlogFeed", (val) => {
			blogfeed.html(val)
			$(".btr_feed", blogfeed).each(function() {
				var self = $(this)
				var date = $(".btr_feeddate", self)
				var actdate = $(".btr_feedactdate", self)
				date.text(new Date(actdate.text()).relativeFormat("(z 'ago')") )
			});

			blogfeed.css("display", "")
		})
	}

	$(document).ready(function() {
		InjectJS.send("INIT", settings, currentPage && currentPage.name, currentPage && currentPage.matches)

		InjectJS.send("INIT_TEMPLATES", Object.keys(templateListeners))
	})
}
"use strict"

let settings
let currentPage
let blogFeedData

let loggedInUser = -1
let loggedInUserPromise = null

const InjectJS = {
	queue: [],

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

		InjectJS.send("TEMPLATE_INIT", id)
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


function Init() {
	document.$on("click", ".btr-settings-toggle", toggleSettingsDiv)

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

	// Roblox+ compatibility
	headerWatcher.$watch("#navbar-rplus", () => {
		$.findAll(".rbx-navbar").forEach(bar => {
			if(bar.children.length < 3) { return }
			const btn = bar.children[2]

			for(let i = 0; i < 5; i++) {
				btn.before(html`<li style=display:none><a class=nav-menu-title href=/asd>asd</a></li>`)
			}
		})
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
		})
		
		navWatcher.$watch("#nav-blog", blog => {
			const list = blog.parentNode.parentNode

			const home = list.$find("#nav-home")
			if(home) { home.parentNode.remove() }

			const upgrade = list.$find(".rbx-upgrade-now")
			if(upgrade) { upgrade.remove() }

			blog.parentNode.before(html`
			<li>
				<a href=/premium/membership id=nav-bc class=font-gray-1>
					<span class=icon-nav-bc-btr></span>
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
		headWatcher.$watch(`meta[name="user-data"]`, meta => {
			const userId = +meta.dataset.userid
			loggedInUser = Number.isSafeInteger(userId) ? userId : -1
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
		.profile-ads-container iframe, #ad iframe, iframe[src*="roblox.com/user-sponsorship/"]`

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
			if(x.src) {
				if(
					x.src.includes("imasdk.googleapis.com") ||
					x.src.includes("radar.cedexis.com")
				) {
					x.remove()
				}
				return
			}

			const cont = x.textContent
			if(
				cont.includes("google-analytics.com") ||
				cont.includes("scorecardresearch.com") ||
				cont.includes("cedexis.com") ||
				cont.includes("pingdom.net") ||
				cont.includes("Roblox.Hashcash") ||
				cont.includes("Roblox.VideoPreRollDFP")
			) {
				x.remove()
			} else if(cont.includes("Roblox.EventStream.Init")) { // Stops e.png logging
				x.textContent = cont.replace(/"[^"]*"/g, `""`)
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
	
	if(settings.general.fixAudioPreview) {
		const fixedAudioCache = {}

		InjectJS.listen("audioPreviewFix", url => {
			if(typeof url !== "string" || url.search(/^https?:\/\/c\d\.rbxcdn\.com\/[0-9a-f]{32}$/i) === -1) { return }
			let cached = fixedAudioCache[url]
			if(!cached) {
				cached = fixedAudioCache[url] = fetch(url, { credentials: "omit", redirect: "manual" })
					.then(async resp => {
						if(!resp.ok || resp.redirected) { return false }
						return URL.createObjectURL(await resp.blob())
					})
			}
			
			cached.then(blobUrl => {
				if(!blobUrl) { return }
				InjectJS.send("audioPreviewFix", url, blobUrl)
			})
		})
	}

	try {
		if(IS_FIREFOX) {
			const manifest = chrome.runtime.getManifest()
			if(manifest.applications.gecko.update_url === "https://antiboomz.com/btroblox/updates.json") { // Is self-signed
				bodyWatcher.$watch("#header", header => {
					header.after(html`
					<div style="position:fixed;left:0;width:100%;height:24px;line-height:24px;background:red;font-weight:bold;color:white;z-index:20;text-align:center;font-size:14px;">
					<a href="https://addons.mozilla.org/en-US/firefox/addon/btroblox/" target="_blank" style="text-decoration:underline">BTRoblox has moved to AMO. Click here to switch.</a>
					</div>`)
				})
			}
		}
	} catch(ex) {}

	if(currentPage && pageInit[currentPage.name]) {
		try { pageInit[currentPage.name].apply(currentPage, currentPage.matches) }
		catch(ex) { console.error(ex) }
	}
}


function PreInit() {
	if(document.contentType !== "text/html") { return }
	if(IS_FIREFOX && document.readyState === "complete") { return } // Stop reloading extension

	const pathname = window.location.pathname
	const exclude = EXCLUDED_PAGES.some(patt => new RegExp(patt, "i").test(pathname))
	if(exclude) { return }

	{
		const script = document.createElement("script")
		script.setAttribute("name", "BTRoblox/inject.js")
		script.textContent = `"use strict";\n(${String(INJECT_SCRIPT)})();`
		
		const parent = document.head || document.documentElement
		parent.prepend(script)
	}
	
	currentPage = GET_PAGE(pathname)
	STORAGE.get(["settings", "cachedBlogFeedV2"], data => {
		settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
		if(data.settings) { APPLY_SETTINGS(data.settings, settings) }
		
		blogFeedData = data.cachedBlogFeedV2

		{ // Change settings to be name: value
			const rec = x => Object.entries(x).forEach(([i, y]) => {
				if(y instanceof Object && "default" in y && "value" in y) {
					x[i] = y.value
				} else {
					rec(y)
				}
			})

			rec(settings)
		}

		InjectJS.send("INIT", settings, currentPage ? currentPage.name : null, currentPage ? currentPage.matches : null, IS_DEV_MODE)

		{ // Inject CSS
			const parent = document.head || document.documentElement

			const injectCSS = path => {
				const link = document.createElement("link")
				link.rel = "stylesheet"
				link.href = getURL("css/" + path)
				parent.prepend(link)
			}
	
			const cssFiles = ["main.css"]
			if(currentPage) { cssFiles.push(...currentPage.css) }
	
			const theme = settings.general.theme
			cssFiles.forEach(file => {
				if(theme !== "default") { injectCSS(`${theme}/${file}`) }
				injectCSS(file)
			})
		}

		Init()
	})
}

PreInit()
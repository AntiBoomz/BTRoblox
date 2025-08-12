"use strict"

const BTRoblox = { element: null }
let currentPage

//

const PAGE_INFO = {
	avatar: {
		matches: ["^/my/avatar"],
		js: ["pages/avatar.js"],
		css: ["avatar.css"]
	},
	catalog: {
		matches: ["^/catalog/?$"],
		js: ["pages/avatar.js"],
		css: ["catalog.css"]
	},
	friends: {
		matches: ["^/users/(\\d+)/friends", "^/users/friends"],
		js: ["pages/friends.js"],
		css: []
	},
	gamedetails: {
		matches: ["^/games/(\\d+)/"],
		js: ["pages/gamedetails.js"],
		css: ["gamedetails.css"]
	},
	games: {
		matches: ["^/(games|discover)/?$"],
		js: [],
		css: ["games.css"]
	},
	groups: {
		matches: ["^/groups/(\\d+)/*", "^/communities/(\\d+)/*"],
		js: ["pages/groups.js"],
		css: ["groups.css"]
	},
	groupadmin: {
		matches: ["^/groups/configure$", "^/communities/configure$"],
		js: ["pages/groupadmin.js"],
		css: []
	},
	home: {
		matches: ["^/home"],
		js: ["pages/home.js"],
		css: ["home.css"]
	},
	inventory: {
		matches: ["^/users/(\\d+)/inventory"],
		js: ["pages/inventory.js"],
		css: ["inventory.css"]
	},
	itemdetails: {
		matches: ["^/(catalog|library|game-pass|badges|bundles)/(\\d+)/"],
		js: ["pages/itemdetails.js"],
		css: ["itemdetails.css"]
	},
	membership: {
		matches: ["^/premium/membership"],
		js: [],
		css: []
	},
	messages: {
		matches: ["^/my/messages"],
		js: ["pages/messages.js"],
		css: ["messages.css"]
	},
	money: {
		matches: ["^/transactions"],
		js: ["pages/money.js"],
		css: ["money.css"]
	},
	profile: {
		matches: ["^/users/(\\d+)/profile"],
		js: ["pages/profile.js"],
		css: ["profile.css"]
	},
	universeconfig: {
		matches: ["^/universes/configure"],
		js: [],
		css: ["universeconfig.css"]
	},
	
	create_dashboard: {
		domainMatches: ["create.roblox.com"],
		matches: ["^/dashboard/"],
		js: ["pages/create_dashboard.js"],
		css: ["create_dashboard.css"]
	},
	create_store: {
		domainMatches: ["create.roblox.com"],
		matches: ["^/store/"],
		js: ["pages/create_store.js"],
		css: ["create_store.css"]
	},
}

//

const backgroundScript = {
	callbacks: {},
	responseCounter: 0,
	
	resetTimeout() {
		if(this.portTimeout) {
			clearTimeout(this.portTimeout)
			this.portTimeout = null
		}
		
		if(this.port && Object.keys(this.callbacks).length === 0) {
			this.portTimeout = setTimeout(() => this.disconnectPort(), 10e3)
		}
	},
	
	initPort() {
		if(this.port) { return }
		if(!chrome.runtime?.id) { return } // dont try to create a port if extension context is invalidated
		
		const port = chrome.runtime.connect()
		this.port = port
		
		port.onMessage.addListener(msg => this.onPortMessage(port, msg))
		port.onDisconnect.addListener(() => {
			if(chrome.runtime.lastError) {} // Clear lastError
			this.disconnectPort()
		})
		
		this.resetTimeout()
	},
	
	disconnectPort() {
		if(!this.port) { return }
		this.port.disconnect()
		this.port = null
		
		this.callbacks = {}
		this.resetTimeout()
	},
	
	onPortMessage(port, msg) {
		const fn = this.callbacks[msg.id]
		if(!fn) { return }

		if(msg.final) {
			delete this.callbacks[msg.id]
			this.resetTimeout()
			
			if(msg.cancel) { return }
		}

		fn(msg.data)
	},
	
	send(name, data, callback) {
		if(typeof data === "function") {
			callback = data
			data = null
		}
		
		const info = { name, data }
		
		if(typeof callback === "function") {
			const id = info.id = this.responseCounter++
			this.callbacks[id] = callback
		}
		
		if(!this.port) { this.initPort() }
		if(this.port) {
			this.port.postMessage(info)
			this.resetTimeout()
		}
	}
}

const injectScript = {
	messageListeners: {},
	
	call(name, fn, ...args) {
		this.send("call", name, args)
	},

	send(action, ...args) {
		BTRoblox.element.dispatchEvent(new CustomEvent(`btroblox/inject/${action}`, {
			detail: IS_FIREFOX ? cloneInto(args, window.wrappedJSObject) : args
		}))
	},

	listen(action, callback, params) {
		let listeners = this.messageListeners[action]
		
		if(!listeners) {
			listeners = this.messageListeners[action] = []
			
			BTRoblox.element.addEventListener(`btroblox/content/${action}`, ev => {
				let args
				
				try { args = IS_FIREFOX ? cloneInto(ev.detail, window) : ev.detail }
				catch(ex) {}
				
				args = Array.isArray(args) ? args : []
				
				for(let i = listeners.length; i--;) {
					try { listeners[i].apply(null, args) }
					catch(ex) { console.error(ex) }
				}
			}, { once: params?.once })
		}
		
		listeners.push(callback)
	},
	
	init(...args) {
		document.dispatchEvent(new CustomEvent(`btroblox/init`, {
			detail: IS_FIREFOX ? cloneInto(args, window.wrappedJSObject) : args
		}))
	}
}

//

const activeStyleSheets = {}
const reloadingStyleSheets = {}

const startReloadingCSS = (path, skipFirst) => {
	if(reloadingStyleSheets[path]) { return }
	
	const styleSheet = activeStyleSheets[path]
	if(!styleSheet) { return }
	
	const key = Date.now()
	reloadingStyleSheets[path] = key
	
	let lastCssText
	
	setInterval(async () => {
		if(reloadingStyleSheets[path] !== key) { return }
		if(document.visibilityState === "hidden") { return }
		if(!chrome.runtime?.id) { return } // Stop if extension context is invalidated
		
		const newUrl = `${chrome.runtime.getURL(path)}?_=${Date.now()}`
		
		const res = await fetch(newUrl)
		const cssText = await res.text()
		
		if(reloadingStyleSheets[path] !== key) { return }
		
		if(lastCssText !== cssText && (lastCssText || !skipFirst)) {
			styleSheet.href = newUrl
		}
		
		lastCssText = cssText
	}, 2000)
}

const insertCSS = (...paths) => {
	for(const path of paths) {
		if(activeStyleSheets[path]) { continue }
		
		const styleSheet = document.createElement("link")
		styleSheet.href = SETTINGS.get("general.themeHotReload") ? `${chrome.runtime.getURL(path)}?_=${Date.now()}` : chrome.runtime.getURL(path)
		styleSheet.rel = "stylesheet"
		
		BTRoblox.element.append(styleSheet)
		
		activeStyleSheets[path] = styleSheet
		
		if(SETTINGS.get("general.themeHotReload")) {
			startReloadingCSS(path, true)
		}
	}
}

const removeCSS = (...paths) => {
	for(const path of paths) {
		const styleSheet = activeStyleSheets[path]
		if(!styleSheet) { continue }
		
		styleSheet.remove()
		delete activeStyleSheets[path]
		delete reloadingStyleSheets[path]
	}
}

//

let currentPageCSS = []

const updatePageCSS = () => {
	const cssFiles = ["main.css", "settingsmodal.css"]
	
	if(location.host === "create.roblox.com") {
		cssFiles.push("create.css")
	}
	
	if(currentPage?.css) {
		cssFiles.push(...currentPage.css)
	}
	
	const theme = SETTINGS.get("general.theme")
	
	if(theme !== "default") {
		cssFiles.push(...cssFiles.map(path => `${theme}/${path}`))
	}
	
	insertCSS(...cssFiles.map(path => `css/${path}`))
	removeCSS(...currentPageCSS.filter(path => !cssFiles.includes(path)).map(path => `css/${path}`))
	
	currentPageCSS = cssFiles
}

//

if(document.contentType === "text/html" && location.protocol !== "blob" && document.readyState === "loading" && !document.querySelector("btroblox")) {
	const btrElement = document.createElement("btroblox")
	const btrStyle = document.createElement("style")
	btrStyle.type = "text/css"
	btrStyle.textContent = "btroblox {display:none!important;}"
	btrElement.append(btrStyle)
	
	document.documentElement.append(btrElement)
	BTRoblox.element = btrElement
	
	SETTINGS.load(() => {
		injectScript.init(
			SETTINGS.serialize(),
			IS_DEV_MODE,
			RobuxToCash.getSelectedOption()
		)
		
		//
		
		const initialized = {}
		
		const getCurrentPage = () => {
			for(const [name, page] of Object.entries(PAGE_INFO)) {
				const domainMatches = page.domainMatches ?? ["www.roblox.com", "web.roblox.com"]
				
				if(!domainMatches.includes(location.hostname)) {
					continue
				}
				
				for(let pattern of page.matches) {
					// Add support for locale urls
					if(pattern.startsWith("^")) {
						pattern = `^(?:/\\w{2}|/\\w{2}-\\w{2,3})?${pattern.slice(1)}`
					}
					//
					
					const matches = location.pathname.match(new RegExp(pattern, "i"))
					if(matches) {
						return { ...page, name, matches: matches.slice(1) }
					}
				}
			}
			
			return null
		}
		
		const onPageChanged = () => {
			if(currentPage) {
				if(pageReset[currentPage.name]) {
					for(const fn of pageReset[currentPage.name]) {
						try { fn.apply(null, currentPage.matches) }
						catch(ex) { console.error(ex) }
					}
				}
			}
			
			currentPage = getCurrentPage()
			
			injectScript.send("setCurrentPage", currentPage ? { name: currentPage.name, matches: currentPage.matches } : null)
			updatePageCSS()
			
			if(!initialized.common) {
				initialized.common = true
				
				if(location.host === "create.roblox.com") {
					try { pageInit.create() }
					catch(ex) { console.error(ex) }
				} else {
					try { pageInit.www() }
					catch(ex) { console.error(ex) }
				}
			}
			
			if(currentPage) {
				if(!initialized[currentPage.name]) {
					initialized[currentPage.name] = true
					
					if(pageInit[currentPage.name]) {
						try { pageInit[currentPage.name]() }
						catch(ex) { console.error(ex) }
					}
				}
				
				if(pageLoad[currentPage.name]) {
					for(const fn of pageLoad[currentPage.name]) {
						try { fn.apply(null, currentPage.matches) }
						catch(ex) { console.error(ex) }
					}
				}
			}
		}
		
		injectScript.listen("onPageChanged", onPageChanged)
		onPageChanged()
		
		if(location.host === "create.roblox.com") {
		} else {
			document.$watch("#content", content => {
				const marker = html`<div id=btr-detect-content style=display:none></div>`
				content.append(marker)
				
				new MutationObserver(() => {
					if(!marker.parentNode) {
						content.append(marker)
						onPageChanged()
					}
				}).observe(content, { childList: true })
			})
		}
		
		//
		
		SETTINGS.onChange("general.theme", () => updatePageCSS())
	})
	
	SHARED_DATA.init()
	
	backgroundScript.send("checkPermissions", hasPermissions => {
		if(!hasPermissions) {
			const oldBanner = $("#btr-permission-banner")
			if(oldBanner) { oldBanner.remove() }
			
			const alert = html`
			<div id=btr-permission-banner style="position:fixed;width:100%;height:24px;left:0;top:40px;background:red;color:white;cursor:pointer;z-index:100000;text-align:center;user-select:none;">
				BTRoblox needs some permissions to work properly. Click here or click the extension button to fix the issue.
			</div>`
			
			document.$watch(">body").$then(body => body.append(alert))
			
			if(IS_CHROME) {
				alert.$on("click", () => {
					backgroundScript.send("requestPermissions", wasGranted => {
						if(wasGranted) {
							location.pathname = location.pathname
						}
					})
				})
			} else {
				alert.textContent = `BTRoblox needs some permissions to work properly. Click the extension button to fix the issue.`
				alert.style.cursor = ""
			}
		}
	})
}
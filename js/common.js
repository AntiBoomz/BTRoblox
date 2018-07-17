"use strict"

const BROWSER_NAME = navigator.userAgent.includes("Edge/") ? "Edge" : navigator.userAgent.includes("Chrome/") ? "Chrome" : "Firefox"
const IS_EDGE = BROWSER_NAME === "Edge"
const IS_FIREFOX = BROWSER_NAME === "Firefox"
const IS_CHROME = BROWSER_NAME === "Chrome"

if(IS_EDGE) { window.chrome = Object.assign({}, browser) }

const IS_DEV_MODE = IS_FIREFOX ? chrome.runtime.id.endsWith("@temporary-addon") :
	IS_CHROME ? chrome.runtime.id === "follfgiodgdohjfmfmnjhnbkecbiobmd" : false

const DOLLARS_PER_ROBUX_RATIO = 350 / 100000
const getURL = chrome.runtime.getURL

const DEFAULT_SETTINGS = {
	general: {
		theme: "default",
		showAds: false,
		noHamburger: true,
		chatEnabled: true,
		smallChatButton: true,
		fastSearch: true,
		robuxToDollars: false,
		fixAudioPreview: true,

		navigationEnabled: true,
		showBlogFeed: true
	},
	catalog: {
		enabled: true
	},
	itemdetails: {
		enabled: true,
		itemPreviewer: true,
		itemPreviewerMode: "default",
		explorerButton: true,
		downloadButton: true,
		contentButton: true,
		imageBackgrounds: true,
		whiteDecalThumbnailFix: true,
		thisPackageContains: true
	},
	gamedetails: {
		enabled: true,
		showBadgeOwned: true
	},
	groups: {
		enabled: true,
		shoutAlerts: true,
		expandGroupList: true
	},
	inventory: {
		enabled: true,
		inventoryTools: true
	},
	profile: {
		enabled: true,
		embedInventoryEnabled: true
	},
	versionhistory: {
		enabled: true
	}
}

const EXCLUDED_PAGES = [
	"^/userads/",
	"^/user-sponsorship/",
	"^/build/upload",
	"^/Feeds/GetUserFeed"
]

const PAGE_INFO = {
	avatar: {
		matches: ["^/my/avatar"],
		css: ["avatar.css"]
	},
	catalog: {
		matches: ["^/catalog/?$"],
		css: ["catalog.css"]
	},
	develop: {
		matches: ["^/develop"],
		css: ["develop.css"]
	},
	gamedetails: {
		matches: ["^/games/(\\d+)/"],
		css: ["gamedetails.css"]
	},
	games: {
		matches: ["^/games/?$"],
		css: ["games.css"]
	},
	groups: {
		matches: ["^/my/groups\\.aspx", "^/groups/group\\.aspx"],
		css: ["groups.css"]
	},
	groupadmin: {
		matches: ["^/my/groupadmin.aspx"],
		css: []
	},
	groupaudit: {
		matches: ["^/groups/audit\\.aspx"],
		css: []
	},
	home: {
		matches: ["^/home"],
		css: ["home.css"]
	},
	inventory: {
		matches: ["^/users/(\\d+)/inventory"],
		css: ["inventory.css"]
	},
	itemdetails: {
		matches: ["^/(?:catalog|library|game-pass|badges)/(\\d+)/"],
		css: ["itemdetails.css"]
	},
	messages: {
		matches: ["^/my/messages"],
		css: ["messages.css"]
	},
	money: {
		matches: ["^/my/money"],
		css: ["money.css"]
	},
	placeconfig: {
		matches: ["^/places/(\\d+)/update"],
		css: ["placeconfig.css"]
	},
	profile: {
		matches: ["^/users/(\\d+)/profile"],
		css: ["profile.css"]
	},
	universeconfig: {
		matches: ["^/universes/configure"],
		css: ["universeconfig.css"]
	}
}

const GET_PAGE = path => {
	for(const [name, page] of Object.entries(PAGE_INFO)) {
		for(const pattern of page.matches) {
			const matches = path.match(new RegExp(pattern, "i"))
			if(matches) {
				return Object.assign({}, page, { name, matches: matches.slice(1) })
			}
		}
	}

	return null
}

const STORAGE = chrome.storage.local
const MESSAGING = (() => {
	if(chrome && chrome.extension && chrome.extension.getBackgroundPage) {
		const listenersByName = {}
		const ports = []

		chrome.runtime.onConnect.addListener(port => {
			let alive = true
			ports.push(port)

			port.onMessage.addListener(msg => {
				const listener = listenersByName[msg.name]

				if(listener) {
					let final = false

					const respond = (response, hasMore) => {
						if(alive && !final && "id" in msg) {
							final = !(hasMore === true)

							port.postMessage({
								id: msg.id,
								data: response,
								final
							})
						}
					}

					respond.cancel = () => {
						if(alive && !final && "id" in msg) {
							final = true
							port.posMessage({ id: msg.id, final, cancel: true })
						}
					}

					listener(msg.data, respond, port)
				}
			})

			port.onDisconnect.addListener(() => {
				alive = false
				const index = ports.indexOf(port)
				if(index !== -1) { ports.splice(index, 1) }
			})
		})

		return {
			ports,
			listen(name, callback) {
				if(typeof name === "object") {
					Object.entries(name).forEach(([key, fn]) => this.listen(key, fn))
					return
				}

				if(!listenersByName[name]) {
					listenersByName[name] = callback
				} else {
					console.warn(`Listener '${name}' already exists`)
				}
			}
		}
	}

	return {
		callbacks: {},
		responseCounter: 0,

		send(name, data, callback) {
			if(typeof data === "function") {
				callback = data
				data = null
			}

			if(!this.port) {
				const port = this.port = chrome.runtime.connect()

				port.onMessage.addListener(msg => {
					const fn = this.callbacks[msg.id]

					if(msg.final) {
						delete this.callbacks[msg.id]
						if(Object.keys(this.callbacks).length === 0) {
							this.portTimeout = setTimeout(() => this.port.disconnect(), 5 * 60e3)
						}

						if(msg.cancel) { return }
					}

					fn(msg.data)
				})

				port.onDisconnect.addListener(() => {
					clearTimeout(this.portTimeout)
					this.port = null
				})

				this.portTimeout = setTimeout(() => this.port.disconnect(), 5 * 60e3)
			}

			const info = { name, data }

			if(typeof callback === "function") {
				const id = info.id = this.responseCounter++
				this.callbacks[id] = callback
				clearTimeout(this.portTimeout)
			}

			this.port.postMessage(info)
		}
	}
})()
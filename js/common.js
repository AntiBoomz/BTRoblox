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
	_version: 2,
	general: {
		theme: { default: true, value: "default" },
		showAds: { default: true, value: false },
		noHamburger: { default: true, value: true },
		chatEnabled: { default: true, value: true },
		smallChatButton: { default: true, value: true },
		fastSearch: { default: true, value: true },
		fixAudioPreview: { default: true, value: true },

		navigationEnabled: { default: true, value: true },
		showBlogFeed: { default: true, value: true },

		robuxToDollars: { default: true, value: false },
		hoverPreview: { default: true, value: true },
		hoverPreviewMode: { default: true, value: "always" }
	},
	catalog: {
		enabled: { default: true, value: true }
	},
	itemdetails: {
		enabled: { default: true, value: true },
		itemPreviewer: { default: true, value: true },
		itemPreviewerMode: { default: true, value: "always" },
		explorerButton: { default: true, value: true },
		downloadButton: { default: true, value: true },
		contentButton: { default: true, value: true },
		imageBackgrounds: { default: true, value: true },
		whiteDecalThumbnailFix: { default: true, value: true },
		thisPackageContains: { default: true, value: true }
	},
	gamedetails: {
		enabled: { default: true, value: true },
		showBadgeOwned: { default: true, value: true }
	},
	groups: {
		enabled: { default: true, value: true },
		shoutAlerts: { default: true, value: true },
		expandGroupList: { default: true, value: true }
	},
	inventory: {
		enabled: { default: true, value: true },
		inventoryTools: { default: true, value: true }
	},
	profile: {
		enabled: { default: true, value: true },
		embedInventoryEnabled: { default: true, value: true }
	},
	versionhistory: {
		enabled: { default: true, value: true }
	}
}

const APPLY_SETTINGS = (data, settings) => {
	Object.entries(settings).forEach(([groupName, group]) => {
		const dataGroup = data[groupName]
		if(!(group instanceof Object || dataGroup instanceof Object)) { return }

		Object.entries(group).forEach(([settingName, sett]) => {
			const dataSett = dataGroup[settingName]
			if(!(sett instanceof Object || dataSett instanceof Object)) { return }

			if(dataSett.default === false && typeof dataSett.value === typeof sett.value && dataSett.value !== sett.value) {
				sett.value = dataSett.value
				sett.default = sett.value === DEFAULT_SETTINGS[groupName][settingName].value
			}
		})
	})
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
							port.postMessage({ id: msg.id, final, cancel: true })
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

				const doDisconnect = () => {
					clearTimeout(this.portTimeout)
					port.disconnect()
					this.port = null
				}

				port.onMessage.addListener(msg => {
					const fn = this.callbacks[msg.id]
					if(!fn) { return }

					if(msg.final) {
						delete this.callbacks[msg.id]
						if(Object.keys(this.callbacks).length === 0) {
							this.portTimeout = setTimeout(doDisconnect, 1 * 60e3)
						}

						if(msg.cancel) { return }
					}

					fn(msg.data)
				})

				port.onDisconnect.addListener(doDisconnect)
				this.portTimeout = setTimeout(doDisconnect, 1 * 60e3)
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
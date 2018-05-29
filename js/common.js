"use strict"

const IS_FIREFOX = typeof chrome !== "undefined" && typeof browser !== "undefined"
const DOLLARS_PER_ROBUX_RATIO = 350 / 100000

const DEFAULT_SETTINGS = {
	general: {
		theme: "default",
		showAds: true,
		noHamburger: true,
		chatEnabled: true,
		smallChatButton: true,
		fastSearch: true,
		robuxToDollars: false,

		navigationEnabled: true,
		showBlogFeed: true
	},
	catalog: {
		enabled: true
	},
	itemdetails: {
		enabled: true,
		animationPreview: true,
		animationPreviewAutoLoad: true,
		explorerButton: false,
		downloadButton: false,
		contentButton: false,
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
		matches: ["^/(?:catalog|library|game-pass)/(\\d+)/"],
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
	const IS_BACKGROUND_SCRIPT = chrome.extension
		&& chrome.extension.getBackgroundPage
		&& chrome.extension.getBackgroundPage() === window

	if(IS_BACKGROUND_SCRIPT) {
		const listenersByName = {}
		const ports = []

		const onConnect = port => {
			if(!port.name) { return port.disconnect() }
			const listener = listenersByName[port.name]
			ports.push(port)

			const onMessage = msg => {
				port.onMessage.removeListener(onMessage)

				if(listener) {
					const respond = (response, isFinal) => {
						if(port) {
							port.postMessage(response)
							if(isFinal !== false) { port.disconnect() }
						} else {
							console.warn("Tried to respond to a closed port")
						}
					}

					try { listener(msg, respond, port) }
					catch(ex) { console.error(ex) }
				}
			}

			const onDisconnect = () => {
				const index = ports.indexOf(port)
				if(index !== -1) { ports.splice(index, 1) }
				
				port.onMessage.removeListener(onMessage)
				port.onDisconnect.removeListener(onDisconnect)
				port = null
			}

			port.onMessage.addListener(onMessage)
			port.onDisconnect.addListener(onDisconnect)
		}

		chrome.runtime.onConnect.addListener(onConnect)

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
		send(name, data, callback) {
			if(typeof data === "function") {
				callback = data
				data = null
			}

			const port = chrome.runtime.connect({ name })
			port.postMessage(data)

			if(typeof callback === "function") {
				port.onMessage.addListener(callback)
			}
		}
	}
})()
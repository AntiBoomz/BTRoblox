"use strict"

const BROWSER_NAME = navigator.userAgent.includes("Edge/") ? "Edge" : navigator.userAgent.includes("Chrome/") ? "Chrome" : "Firefox"
const IS_EDGE = BROWSER_NAME === "Edge"
const IS_FIREFOX = BROWSER_NAME === "Firefox"
const IS_CHROME = BROWSER_NAME === "Chrome"

if(IS_EDGE) { window.chrome = Object.assign({}, browser) }

const IS_DEV_MODE = IS_FIREFOX ? chrome.runtime.id.endsWith("@temporary-addon") :
	IS_CHROME ? chrome.runtime.id === "follfgiodgdohjfmfmnjhnbkecbiobmd" : false

const IS_BACKGROUND_PAGE = chrome && chrome.extension && chrome.extension.getBackgroundPage

const getURL = chrome.runtime.getURL


const DOLLARS_TO_ROBUX_RATIOS = {
	devex350: [350, 100e3],
	devex250: [250, 100e3],

	nbc5: [4.99, 400],
	nbc10: [9.99, 800],
	nbc25: [24.99, 2000],
	nbc50: [49.99, 4500],
	nbc100: [99.99, 10e3],
	nbc200: [199.99, 22500],

	bc5: [4.99, 450],
	bc10: [9.99, 1e3],
	bc25: [24.99, 2750],
	bc50: [49.99, 6e3],
	bc100: [99.99, 15e3],
	bv200: [199.99, 35e3]
}

let DOLLARS_TO_ROBUX_RATIO = DOLLARS_TO_ROBUX_RATIOS.devex350


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
	friends: {
		matches: ["^/users/(\\d+)/friends", "^/users/friends"],
		css: []
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
		matches: ["^/(?:catalog|library|game-pass|badges|bundles)/(\\d+)/"],
		css: ["itemdetails.css"]
	},
	membership: {
		matches: ["^/premium/membership"],
		css: []
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
	if(IS_BACKGROUND_PAGE) {
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


const SETTINGS = (() => {
	const SETTINGS = {
		defaultSettings: {
			_version: 2,
			general: {
				theme: { default: true, value: "default", validValues: ["default", "simblk", "sky", "red", "night"] },
				hideAds: { default: true, value: true },
				chatEnabled: { default: true, value: true },
				smallChatButton: { default: true, value: true },
				fastSearch: { default: true, value: true },
				fixAudioPreview: { default: true, value: true },

				robuxToDollars: { default: true, value: false },
				robuxToDollarsRate: { default: true, value: "devex350", validValues: ["devex350", "devex250", "nbc5", "nbc10", "nbc25", "nbc50", "nbc100", "nbc200", "bc5", "bc10", "bc25", "bc50", "bc100", "bc200"] },
				hoverPreview: { default: true, value: true },
				hoverPreviewMode: { default: true, value: "always", validValues: ["always", "never"] }
			},
			navigation: {
				enabled: { default: true, value: true },
				items: { default: true, value: "", hidden: true },
				hideAgeBracket: { default: true, value: true },
				showBlogFeed: { default: true, value: true },
				noHamburger: { default: true, value: true }
			},
			catalog: {
				enabled: { default: true, value: true }
			},
			itemdetails: {
				enabled: { default: true, value: true },
				itemPreviewer: { default: true, value: true },
				itemPreviewerMode: { default: true, value: "always", validValues: ["always", "animations", "never"] },

				explorerButton: { default: true, value: true },
				downloadButton: { default: true, value: true },
				contentButton: { default: true, value: true },

				imageBackgrounds: { default: true, value: true },
				whiteDecalThumbnailFix: { default: true, value: true },

				addOwnersList: { default: true, value: true },
				thisPackageContains: { default: true, value: true } // Packages are no longer in use..?
			},
			gamedetails: {
				enabled: { default: true, value: true },
				showBadgeOwned: { default: true, value: true },
				addServerPager: { default: true, value: true }
			},
			groups: {
				enabled: { default: true, value: true },
				expandGroupList: { default: true, value: true },
				shoutAlerts: { default: true, value: true }
			},
			inventory: {
				enabled: { default: true, value: true },
				inventoryTools: { default: true, value: true }
			},
			profile: {
				enabled: { default: true, value: true },
				embedInventoryEnabled: { default: true, value: true }
			},
			friends: {
				alwaysShowUnfriend: { default: true, value: true }
			},
			versionhistory: {
				enabled: { default: true, value: true }
			}
		}
	}

	const onChangeListeners = []
	let loadPromise

	if(IS_BACKGROUND_PAGE) {
		MESSAGING.listen({
			setSetting(data, respond) {
				SETTINGS.load(() => {
					SETTINGS.set(data.path, data.value)
				})

				respond()
			}
		})
	}

	const getSetting = (path, root) => path.split(".").reduce((t, i) => (t ? t[i] : null), root)

	return Object.assign(SETTINGS, {
		loaded: false,

		initSettings(loadedData) {
			const settings = JSON.parse(JSON.stringify(SETTINGS.defaultSettings, (key, value) => (key === "validValues" ? undefined : value)))

			if(loadedData) {
				Object.entries(settings).forEach(([groupName, group]) => {
					const dataGroup = loadedData[groupName]
					if(!(group instanceof Object && dataGroup instanceof Object)) { return }
		
					Object.entries(group).forEach(([settingName, setting]) => {
						const dataSetting = dataGroup[settingName]
						if(!(setting instanceof Object && dataSetting instanceof Object)) { return }

						// No need to set default or unchanged settings
						if(dataSetting.default || dataSetting.value === setting.value) { return }

						// Do not load settings of wrong type
						if(typeof dataSetting.value !== typeof setting.value) { return }

						// Do not load invalid values for multi-choice options
						const defaultSetting = this.defaultSettings[groupName][settingName]
						if(defaultSetting.validValues && !defaultSetting.validValues.includes(dataSetting.value)) { return }
						
						setting.value = dataSetting.value
						setting.default = setting.value === defaultSetting.value
					})
				})
			}

			return settings
		},

		load(fn) {
			if(!loadPromise) {
				loadPromise = new Promise(resolve => {
					STORAGE.get(["settings"], data => {
						this.loadedSettings = this.initSettings(data.settings)
						this.loaded = true

						resolve(this.loadedSettings)
					})
				})
			}

			loadPromise.then(fn)
		},

		isValid(settingPath) {
			if(!this.loaded) { throw new Error("Settings are not loaded") }

			const setting = getSetting(settingPath, this.loadedSettings)
			return !!(setting && "value" in setting)
		},

		get(settingPath) {
			if(!this.loaded) { throw new Error("Settings are not loaded") }
			
			const setting = getSetting(settingPath, this.loadedSettings)

			if(!(setting && "value" in setting)) {
				throw new TypeError(`'${settingPath}' is not a valid setting`)
			}

			return setting.value
		},

		set(settingPath, value) {
			if(!this.loaded) { throw new Error("Settings are not loaded") }
			
			const setting = getSetting(settingPath, this.loadedSettings)

			if(!(setting && "value" in setting)) {
				throw new TypeError(`'${settingPath}' is not a valid setting`)
			}

			if(typeof value !== typeof setting.value) {
				throw new TypeError(`Invalid Value - Type mismatch (expected ${typeof setting.value}, got ${typeof value})`)
			}

			const defaultSetting = getSetting(settingPath, this.defaultSettings)
			if(defaultSetting.validValues && !defaultSetting.validValues.includes(value)) {
				throw new TypeError(`Invalid Value - Value '${value}' is not in validValues`)
			}

			if(IS_BACKGROUND_PAGE) {
				if(setting.value !== value) {
					setting.value = value
					setting.default = setting.value === defaultSetting.value

					STORAGE.set({ settings: this.loadedSettings })

					const listeners = onChangeListeners[settingPath]
					if(listeners) {
						listeners.forEach(fn => {
							try { fn(value) }
							catch(ex) { console.error(ex) }
						})
					}
				}
			} else {
				MESSAGING.send("setSetting", { path: settingPath, value })

				const listeners = onChangeListeners[settingPath]
				if(listeners) {
					listeners.forEach(fn => {
						try { fn(value) }
						catch(ex) { console.error(ex) }
					})
				}
			}
		},

		onChange(settingPath, fn) {
			if(!onChangeListeners[settingPath]) {
				onChangeListeners[settingPath] = []
			}

			onChangeListeners[settingPath].push(fn)
		}
	})
})()
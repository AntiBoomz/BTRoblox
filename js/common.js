"use strict"

const MANIFEST = chrome.runtime.getManifest()
const IS_FIREFOX = typeof InstallTrigger !== "undefined"
const IS_CHROME = !IS_FIREFOX

const IS_BACKGROUND_PAGE = !!(chrome && chrome.extension && chrome.extension.getBackgroundPage) && window.location.pathname !== "/sourceviewer.html"
const IS_DEV_MODE = MANIFEST.short_name === "BTRoblox_DEV"

const AssetShortcuts = {
	"res/previewer/characterModels.rbxm": "rbxassetid://2957693598&version=3",
	"res/previewer/face.png": "rbxassetid://2957705858",
	
	"res/previewer/meshes/leftarm.mesh": "rbxassetid://2957740508",
	"res/previewer/meshes/leftleg.mesh": "rbxassetid://2957740624",
	"res/previewer/meshes/rightarm.mesh": "rbxassetid://2957740703",
	"res/previewer/meshes/rightleg.mesh": "rbxassetid://2957740776",
	"res/previewer/meshes/torso.mesh": "rbxassetid://2957740857",
	"res/previewer/heads/head.mesh": "rbxassetid://2957715294",

	"res/previewer/compositing/CompositPantsTemplate.mesh": "rbxassetid://2957742558",
	"res/previewer/compositing/CompositShirtTemplate.mesh": "rbxassetid://2957742631",
	"res/previewer/compositing/CompositTShirt.mesh": "rbxassetid://2957742706",
	"res/previewer/compositing/R15CompositLeftArmBase.mesh": "rbxassetid://2957742791",
	"res/previewer/compositing/R15CompositRightArmBase.mesh": "rbxassetid://2957742881",
	"res/previewer/compositing/R15CompositTorsoBase.mesh": "rbxassetid://2957742957"
}

const getURL = path => AssetShortcuts[path] || chrome.runtime.getURL(path)


// Separated for more accuracy when dealing with massive numbers
const DOLLARS_TO_ROBUX_RATIOS = {
	devex350: [350, 100e3],

	free5: [4.99, 400],
	premium5: [4.99, 440],

	free10: [9.99, 800],
	premium10: [9.99, 880],

	free20: [19.99, 1700],
	premium20: [19.99, 1870],

	free50: [49.99, 4500],
	premium50: [49.99, 4950],

	free100: [99.99, 10000],
	premium100: [99.99, 11000]
}

const SETTINGS = {
	defaultSettings: {
		_version: 2,
		general: {
			theme: { default: true, value: "default", validValues: ["default", "simblk", "sky", "red", "night"] },
			disableRobloxThemes: { default: true, value: false },

			hideAds: { default: true, value: true },
			chatEnabled: { default: true, value: true },
			smallChatButton: { default: true, value: true },
			fastSearch: { default: true, value: true },
			fixAudioPreview: { default: true, value: true },
			fixAudioVolume: { default: true, value: true },

			robuxToUSD: { default: true, value: false },
			robuxToUSDRate: { default: true, value: "devex350", validValues: ["devex350", "free5", "premium5", "free10", "premium10", "free20", "premium20", "free50", "premium50", "free100", "premium100"] },
	
			hoverPreview: { default: true, value: true },
			hoverPreviewMode: { default: true, value: "always", validValues: ["always", "never"] },
		
			enableContextMenus: { default: true, value: true }
		},
		navigation: {
			enabled: { default: true, value: true },
			itemsV2: { default: true, value: "", hidden: true },
			noHamburger: { default: true, value: true }
		},
		catalog: {
			enabled: { default: true, value: true },
			showOwnedAssets: { default: true, value: false }
		},
		itemdetails: {
			enabled: { default: true, value: true },
			itemPreviewer: { default: true, value: true },
			itemPreviewerMode: { default: true, value: "always", validValues: ["always", "animations", "never"] },

			explorerButton: { default: true, value: true },
			downloadButton: { default: true, value: true },
			contentButton: { default: true, value: true },

			showSales: { default: true, value: true },
			showCreatedAndUpdated: { default: true, value: true },

			imageBackgrounds: { default: true, value: true },
			whiteDecalThumbnailFix: { default: true, value: true },

			addOwnersList: { default: true, value: true }
		},
		gamedetails: {
			enabled: { default: true, value: true },
			showBadgeOwned: { default: true, value: true },
			addServerPager: { default: true, value: true }
		},
		groups: {
			shoutAlerts: { default: true, value: true },
			redesign: { default: true, value: true },
			modifyLayout: { default: true, value: true },
			selectedRoleCount: { default: true, value: true },
			pagedGroupWall: { default: true, value: true },
			groupWallRanks: { default: true, value: true },
			hidePayout: { default: true, value: true },
			hideBigSocial: { default: true, value: true },
			modifySmallSocialLinksTitle: { default: true, value: true }
		},
		inventory: {
			enabled: { default: true, value: true },
			inventoryTools: { default: true, value: true }
		},
		profile: {
			enabled: { default: true, value: true },
			embedInventoryEnabled: { default: true, value: true },
			lastOnline: { default: true, value: true }
		},
		friends: {
			alwaysShowUnfriend: { default: true, value: true }
		},
		placeConfigure: {
			versionHistory: { default: true, value: true }
		}
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
		matches: ["^/groups/(\\d+)/*"],
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
		matches: ["^/(catalog|library|game-pass|badges|bundles)/(\\d+)/"],
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
		matches: ["^/my/money\\.aspx"],
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


class SyncPromise extends Promise {
	static resolve(value) {
		return new SyncPromise(resolve => resolve(value))
	}

	static reject(value) {
		return new SyncPromise((_, reject) => reject(value))
	}

	static race(list) {
		return new SyncPromise((resolve, reject) => {
			list.forEach(value => {
				if(value instanceof Promise) {
					value.then(
						value2 => resolve(value2),
						value2 => reject(value2)
					)
				} else {
					resolve(value)
				}
			})
		})
	}

	static all(list) {
		return new SyncPromise((resolve, reject) => {
			const result = new Array(list.length)
			let promisesLeft = list.length

			if(!promisesLeft) {
				return resolve(result)
			}

			const finish = (index, value) => {
				if(index === null) {
					return reject(value)
				}

				result[index] = value
				if(--promisesLeft === 0) {
					resolve(result)
				}
			}

			list.forEach((value, index) => {
				if(value instanceof Promise) {
					value.then(
						value2 => finish(index, value2),
						value2 => finish(null, value2)
					)
				} else {
					finish(index, value)
				}
			})
		})
	}

	static allSettled(list) {
		return new SyncPromise(resolve => {
			const result = new Array(list.length)
			let promisesLeft = list.length

			if(!promisesLeft) {
				return resolve(result)
			}

			const finish = (index, value) => {
				result[index] = value

				if(--promisesLeft === 0) {
					resolve(result)
				}
			}

			list.forEach((value, index) => {
				if(value instanceof Promise) {
					value.then(
						value2 => finish(index, { status: "fulfilled", value: value2 }),
						value2 => finish(index, { status: "rejected", reason: value2 })
					)
				} else {
					finish(index, { status: "fulfilled", value })
				}
			})
		})
	}

	constructor(fn) {
		let res
		let rej

		super((resolve, reject) => {
			res = resolve
			rej = reject
		})

		this._resolveAsync = res
		this._rejectAsync = rej

		this._intState = "pending"
		this._intOnFinish = []

		if(fn) {
			try { fn(value => { this.resolve(value) }, reason => { this.reject(reason) }) }
			catch(ex) { this.reject(ex) }
		}
	}

	_intThen(promise, onresolve, onreject) {
		if(this._intState !== "resolved" && this._intState !== "rejected") {
			this._intOnFinish.push([promise, onresolve, onreject])
			return
		}

		try {
			if(this._intState === "resolved") {
				promise.resolve(onresolve ? onresolve(this._intValue) : this._intValue)
			} else {
				promise.reject(onreject ? onreject(this._intReason) : this._intReason)
			}
		}
		catch(ex) {
			promise.reject(ex)
		}
	}

	_intResolve(value) {
		if(this._intState === "resolved" || this._intState === "rejected") {
			return
		}

		this._intState = "resolved"
		this._intValue = value

		this._resolveAsync(value)
		delete this._resolveAsync
		delete this._rejectAsync

		this._intOnFinish.forEach(args => this._intThen(...args))
		delete this._intOnFinish
	}

	_intReject(reason) {
		if(this._intState === "resolved" || this._intState === "rejected") {
			return
		}

		this._intState = "rejected"
		this._intReason = reason

		this._rejectAsync(reason)
		delete this._resolveAsync
		delete this._rejectAsync

		this._intOnFinish.forEach(args => this._intThen(...args))
		delete this._intOnFinish
	}


	resolve(value) {
		if(this._intState === "pending") {
			this._intState = "waiting"

			if(value instanceof Promise) {
				value.then(x => this._intResolve(x), x => this._intReject(x))
			} else {
				this._intResolve(value)
			}
		}
	}

	reject(reason) {
		if(this._intState === "pending") {
			this._intState = "waiting"

			if(reason instanceof Promise) {
				reason.then(x => this._intResolve(x), x => this._intReject(x))
			} else {
				this._intReject(reason)
			}
		}
	}

	then(onresolve, onreject) {
		const promise = new SyncPromise()
		this._intThen(promise, onresolve, onreject)
		return promise
	}

	catch(onreject) {
		return this.then(null, onreject)
	}

	finally(onfinally) {
		return this.then(() => onfinally(), () => onfinally())
	}
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

				if(!listener) {
					return
				}

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

const PERMISSIONS = {
	hostParams: {
		origins: [
			...chrome.runtime.getManifest().permissions.filter(x => x.includes("://")),
			...chrome.runtime.getManifest().content_scripts.map(x => x.matches).reduce((a, b) => [...a, ...b])
		]
	},

	init() {
		if(IS_BACKGROUND_PAGE) {
			MESSAGING.listen("hasHostAccess", (_, respond) => {
				this.hasHostAccess().then(respond)
			})

			MESSAGING.listen("requestHostAccess", (_, respond) => {
				this.requestHostAccess().then(respond)
			})
		}

		return this
	},

	async hasHostAccess() {
		if(IS_BACKGROUND_PAGE) {
			return new Promise(resolve => chrome.permissions.contains(this.hostParams, bool => resolve(bool)))
		}

		return new Promise(resolve => MESSAGING.send("hasHostAccess", bool => resolve(bool)))
	},

	async requestHostAccess() {
		if(IS_BACKGROUND_PAGE) {
			return new Promise(resolve => chrome.permissions.request(this.hostParams, bool => resolve(bool)))
		}

		return new Promise(resolve => MESSAGING.send("requestHostAccess", bool => resolve(bool)))
	}
}.init()


Object.assign(SETTINGS, {
	_onChangeListeners: [],
	_loadPromise: null,

	loadedSettings: null,
	loaded: false,

	_applySettings(loadedData) {
		if(!(loadedData instanceof Object)) { return }

		Object.entries(loadedData).forEach(([groupName, group]) => {
			if(!(typeof groupName === "string" && group instanceof Object)) { return }

			Object.entries(group).forEach(([settingName, loadedSetting]) => {
				if(!(typeof settingName === "string" && loadedSetting instanceof Object)) { return }
				
				if(!loadedSetting.default) { // Ignore default settings
					this._localSet(`${groupName}.${settingName}`, loadedSetting.value, loadedSetting.default, false)
				}
			})
		})

		if(IS_BACKGROUND_PAGE) {
			STORAGE.set({ settings: this.loadedSettings })
		}
	},

	load(fn) {
		if(!this._loadPromise) {
			this._loadPromise = new SyncPromise(resolve => {
				this.loadedSettings = JSON.parse(JSON.stringify(
					this.defaultSettings,
					(key, value) => (key === "validValues" ? undefined : value)
				))

				STORAGE.get(["settings"], data => {
					if(data.settings) {
						this._applySettings(data.settings)
					}

					this.loaded = true
					resolve()
				})
			})
		}

		this._loadPromise.then(() => fn(this.loadedSettings))
	},
	
	_getSetting(path, root) {
		const index = path.indexOf(".")
		if(index === -1) { return }

		const groupName = path.slice(0, index)
		const settingName = path.slice(index + 1)

		const group = root[groupName]
		if(!(group instanceof Object)) {
			return
		}

		const setting = group[settingName]
		if(!(setting instanceof Object && "value" in setting)) {
			return
		}

		return setting
	},

	_isValid(settingPath, value) {
		const setting = this._getSetting(settingPath, this.loadedSettings)

		if(!setting) {
			return false // Invalid setting
		}

		if(typeof value !== typeof setting.value) {
			return false // Type mismatch
		}

		const defaultSetting = this._getSetting(settingPath, this.defaultSettings)
		if(defaultSetting.validValues && !defaultSetting.validValues.includes(value)) {
			return false // Invalid value
		}

		return true
	},

	_localSet(settingPath, value, isDefault = false, shouldSave = false) {
		if(!this._isValid(settingPath, value)) {
			return false
		}

		const setting = this._getSetting(settingPath, this.loadedSettings)

		if(setting.value === value && !!isDefault === setting.default) {
			return false
		}

		setting.value = value
		setting.default = !!isDefault

		if(shouldSave) {
			if(IS_BACKGROUND_PAGE) {
				STORAGE.set({ settings: this.loadedSettings })
			} else {
				MESSAGING.send("setSetting", { path: settingPath, value, default: !!isDefault })
			}
		}

		const listeners = this._onChangeListeners[settingPath]
		if(listeners) {
			listeners.forEach(fn => {
				try { fn(setting.value, setting.default) }
				catch(ex) { console.error(ex) }
			})
		}


		return true
	},

	hasSetting(settingPath) {
		return !!this._getSetting(settingPath, this.loadedSettings)
	},

	get(settingPath) {
		if(!this.loaded) { throw new Error("Settings are not loaded") }
		
		const setting = this._getSetting(settingPath, this.loadedSettings)
		if(!setting) {
			throw new TypeError(`'${settingPath}' is not a valid setting`)
		}

		return setting.value
	},

	getIsDefault(settingPath) {
		if(!this.loaded) { throw new Error("Settings are not loaded") }
		
		const setting = this._getSetting(settingPath, this.loadedSettings)
		if(!setting) {
			throw new TypeError(`'${settingPath}' is not a valid setting`)
		}

		return setting.default
	},

	reset(settingPath) {
		if(!this.loaded) { throw new Error("Settings are not loaded") }

		const defaultSetting = this._getSetting(settingPath, this.defaultSettings)
		if(!defaultSetting) {
			throw new TypeError(`'${settingPath}' is not a valid setting`)
		}

		const value = defaultSetting.value
		if(!this._isValid(settingPath, value)) {
			throw new Error(`Invalid value '${typeof value} ${String(value)}' to '${settingPath}'`)
		}

		this._localSet(settingPath, value, true, true)
	},

	set(settingPath, value) {
		if(!this.loaded) { throw new Error("Settings are not loaded") }

		if(!this._isValid(settingPath, value)) {
			throw new Error(`Invalid value '${typeof value} ${String(value)}' to '${settingPath}'`)
		}

		this._localSet(settingPath, value, false, true)
	},

	resetToDefault() {
		if(!this.loaded) { throw new Error("Settings are not loaded") }

		Object.entries(this.defaultSettings).forEach(([groupName, group]) => {
			Object.entries(group).forEach(([settingName, setting]) => {
				this._localSet(`${groupName}.${settingName}`, setting.value, true, true)
			})
		})
	},

	onChange(settingPath, fn) {
		if(!this._onChangeListeners[settingPath]) {
			this._onChangeListeners[settingPath] = []
		}

		this._onChangeListeners[settingPath].push(fn)
	}
})

if(IS_BACKGROUND_PAGE) {
	MESSAGING.listen({
		setSetting(data, respond) {
			SETTINGS.load(() => {
				SETTINGS._localSet(data.path, data.value, data.default, true)
			})

			respond()
		}
	})
}
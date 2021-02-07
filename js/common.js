"use strict"

const getURL = chrome.runtime.getURL

const MANIFEST = chrome.runtime.getManifest()
const IS_FIREFOX = typeof InstallTrigger !== "undefined"
const IS_CHROME = !IS_FIREFOX

const IS_BACKGROUND_PAGE = !!(chrome && chrome.extension && chrome.extension.getBackgroundPage)
const IS_DEV_MODE = MANIFEST.short_name === "BTRoblox_DEV"

const STORAGE = chrome.storage.local

const THROW_DEV_WARNING = errorString => {
	console.warn(errorString)

	if(IS_DEV_MODE) {
		alert(errorString)
	}
}

//

const RobuxToCash = {
	// cash is in cents

	RegularPurchaseAmounts: [400, 800, 1700, 4500, 10000],
	PremiumPurchaseAmounts: [440, 880, 1870, 4950, 11000],

	Currencies: {
		USD: { symbol: "$", rates: [499, 999, 1999, 4999, 9999] },
		EUR: { symbol: "€", rates: [499, 999, 2099, 4999, 9999] },
		GBP: { symbol: "£", rates: [459, 899, 1849, 4649, 9299] },
		CAD: { symbol: "CAD", rates: [649, 1299, 2599, 6499, 12999] },
		AUD: { symbol: "AU$", rates: [699, 1399, 2899, 7199, 14499] },
		NZD: { symbol: "NZ$", rates: [799, 1599, 3199, 8999, 16999] },
		MXN: { symbol: "MX$", rates: [8900, 18500, 36500, 91900, 184900] },
		HKD: { symbol: "HK$", rates: [3800, 7800, 15800, 38900, 77900] },
		TWD: { symbol: "NT$", rates: [15000, 30000, 59000, 161000, 321000] },
		CLP: { symbol: "CLP", rates: [330000, 650000, 1290000, 3330000, 6700000] },
		COP: { symbol: "COP", rates: [1490000, 2990000, 5790000, 15500000, 30900000] }
	},
	
	OptionLists: {
		USD: [
			{ name: "devex", cash: 350, robux: 1000 }
		]
	},

	Options: {},

	getSelectedOption() {
		if(!SETTINGS.loaded) {
			return this.Options.devex
		}

		return this.Options[SETTINGS.get("general.robuxToUSDRate")]
	},

	convertAngular(expr) {
		const option = this.getSelectedOption()

		return `${option.currency.symbol}{{((${expr})*${option.cash}/${option.robux} + 0.4999)/100 | number: 2}}`
	},

	convert(robux) {
		const option = this.getSelectedOption()

		const cash = Math.round((robux * option.cash) / option.robux + 0.4999) / 100
		const cashString = formatNumber(cash.toFixed(2))

		return `${option.currency.symbol}${cashString}`
	},

	init() {
		Object.entries(this.Currencies).forEach(([name, currency]) => {
			currency.name = name

			const list = this.OptionLists[name] = this.OptionLists[name] || []
			currency.rates.forEach((cash, index) => {
				list.push(
					{ name: `${name.toLowerCase()}Regular${index}`, cash, robux: this.RegularPurchaseAmounts[index] },
					{ name: `${name.toLowerCase()}Premium${index}`, cash, robux: this.PremiumPurchaseAmounts[index] },
				)
			})
		})

		Object.entries(this.OptionLists).forEach(([name, list]) => {
			const currency = this.Currencies[name]

			list.forEach(option => {
				option.currency = currency
				this.Options[option.name] = option
			})
		})
	}
}

RobuxToCash.init()

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
				if(onreject) {
					promise.resolve(onreject(this._intReason))
				} else {
					promise.reject(this._intReason)
				}
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

//

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


const SETTINGS = {
	defaultSettings: {
		_version: 2,
		general: {
			theme: { value: "default", validValues: ["default", "simblk", "sky", "red", "night"] },
			disableRobloxThemes: { value: false },

			hideAds: { value: false },
			hideChat: { value: false },
			smallChatButton: { value: true },
			fastSearch: { value: true },
			fixAudioVolume: { value: true },

			robuxToUSD: { value: false },
			robuxToUSDRate: { value: "devex", validValues: Object.keys(RobuxToCash.Options), hidden: true },
	
			hoverPreview: { value: true },
			hoverPreviewMode: { value: "always", validValues: ["always", "never"] },
		
			enableContextMenus: { value: true }
		},
		navigation: {
			enabled: { value: true },
			itemsV2: { value: "", hidden: true },
			noHamburger: { value: true },

			moveHomeToTop: { value: true },
			moveFriendsToTop: { value: true },
			moveMessagesToTop: { value: true },

			switchTradeForMoney: { value: true },
			showPremium: { value: true },
			showBlogFeed: { value: true }
		},
		avatar: {
			enabled: { value: true }
		},
		catalog: {
			enabled: { value: true },
			showOwnedAssets: { value: false }
		},
		itemdetails: {
			enabled: { value: true },
			itemPreviewer: { value: true },
			itemPreviewerMode: { value: "always", validValues: ["always", "animations", "never"] },

			explorerButton: { value: true },
			downloadButton: { value: true },
			contentButton: { value: true },

			showSales: { value: true },
			showCreatedAndUpdated: { value: true },

			imageBackgrounds: { value: true },
			whiteDecalThumbnailFix: { value: true },

			addOwnersList: { value: true }
		},
		gamedetails: {
			enabled: { value: true },
			showBadgeOwned: { value: true },
			addServerPager: { value: true }
		},
		groups: {
			shoutAlerts: { value: true },
			redesign: { value: true },
			modifyLayout: { value: true },
			selectedRoleCount: { value: true },
			pagedGroupWall: { value: true },
			groupWallRanks: { value: true },
			hidePayout: { value: true },
			hideBigSocial: { value: true },
			modifySmallSocialLinksTitle: { value: true }
		},
		inventory: {
			enabled: { value: true },
			inventoryTools: { value: true }
		},
		profile: {
			enabled: { value: true },
			embedInventoryEnabled: { value: true },
			lastOnline: { value: true }
		},
		placeConfigure: {
			versionHistory: { value: true }
		}
	},
	
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
			this._save()
		}
	},

	_save() {
		if(!this.loadError) {
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
					const err = chrome.runtime.lastError
					if(err) {
						this.loadError = err
						console.error(err)
					}

					try {
						if(data.settings) {
							this._applySettings(data.settings)
						}
					} catch(ex) {
						console.error(ex)
					}

					this.loaded = true
					resolve()
				})
			})
		}

		this._loadPromise.then(fn)
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

		if(this.loaded) {
			if(shouldSave) {
				if(IS_BACKGROUND_PAGE) {
					this._save()
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
		}

		return true
	},

	hasSetting(settingPath) {
		return !!this._getSetting(settingPath, this.loadedSettings)
	},
	
	serialize() {
		if(!this.loaded) { throw new Error("Settings are not loaded") }
		
		const settings = JSON.parse(JSON.stringify(this.loadedSettings))
		delete settings._version

		// Change settings to be name: value
		Object.values(settings).forEach(group => {
			Object.entries(group).forEach(([name, setting]) => {
				group[name] = setting.value
			})
		})

		return settings
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
			if(!(typeof groupName === "string" && group instanceof Object)) { return }

			Object.entries(group).forEach(([settingName, setting]) => {
				if(!(typeof settingName === "string" && setting instanceof Object)) { return }

				this._localSet(`${groupName}.${settingName}`, setting.value, true, true)
			})
		})

		if(IS_BACKGROUND_PAGE) {
			this.loadError = false
			this._save()
		}
	},

	onChange(settingPath, fn) {
		if(!this._onChangeListeners[settingPath]) {
			this._onChangeListeners[settingPath] = []
		}

		this._onChangeListeners[settingPath].push(fn)
	},


	init() {
		Object.values(this.defaultSettings).forEach(list => {
			if(list instanceof Object) {
				Object.values(list).forEach(x => x.default = true)
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
	}
}

SETTINGS.init()

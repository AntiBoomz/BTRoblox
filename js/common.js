"use strict"

const getURL = chrome.runtime.getURL

const IS_FIREFOX = !!chrome.runtime.getManifest().browser_specific_settings?.gecko
const IS_CHROME = !IS_FIREFOX

const IS_BACKGROUND_PAGE = !self.window || chrome.extension?.getBackgroundPage?.() === self.window
const IS_DEV_MODE = chrome.runtime.getManifest().short_name === "BTRoblox_DEV"

const THROW_DEV_WARNING = errorString => {
	console.warn(errorString)

	if(IS_DEV_MODE) {
		alert(errorString)
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
							this.portTimeout = setTimeout(doDisconnect, 10e3)
						}

						if(msg.cancel) { return }
					}

					fn(msg.data)
				})

				port.onDisconnect.addListener(doDisconnect)
				this.portTimeout = setTimeout(doDisconnect, 10e3)
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
			theme: { value: "default", validValues: ["default", "simblk", "sky", "red"] },

			hideAds: { value: false },
			hideChat: { value: false },
			smallChatButton: { value: true },
			fastSearch: { value: true },
			fixAudioVolume: { value: true },

			robuxToUSDRate: { value: "none", hidden: true },
	
			hoverPreview: { value: true },
			hoverPreviewMode: { value: "always", validValues: ["always", "never"] },
			
			higherRobuxPrecision: { value: true },
			enableContextMenus: { value: true }
		},
		home: {
			friendsShowUsername: { value: true },
			friendsSecondRow: { value: false }
		},
		navigation: {
			enabled: { value: true },
			noHamburger: { value: true },
			elements: { value: "", hidden: true }
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
			shoutAlerts: { value: false },
			redesign: { value: true },
			modifyLayout: { value: true },
			selectedRoleCount: { value: true },
			pagedGroupWall: { value: true },
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
		if(IS_BACKGROUND_PAGE && this.loaded && !this.loadError) {
			STORAGE.set({ settings: this.loadedSettings })
		}
	},

	load(fn) {
		if(!this._loadPromise) {
			this._loadPromise = new Promise(resolve => {
				this.loadedSettings = JSON.parse(JSON.stringify(
					this.defaultSettings,
					(key, value) => (key === "validValues" ? undefined : value)
				))
				
				const tryGetSettings = () => {
					STORAGE.get(["settings"], data => {
						if(data && data.settings) {
							try {
								this._applySettings(data.settings)
							} catch(ex) {
								console.error(ex)
							}
						}
						
						const err = chrome.runtime.lastError
						
						if(err) {
							console.error(err)
							
							if(IS_BACKGROUND_PAGE) {
								setTimeout(tryGetSettings, 20e3)
							}
							
							this.loadError = true // Stops settings from being overwritten
						} else {
							this.loadError = false
						}
						
						if(!this.loaded) {
							this.loaded = true
							resolve()
						}
					})
				}

				tryGetSettings()
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

		return this
	}
}.init()
"use strict"

const DEFAULT_SETTINGS = {
	_version: 2,
	general: {
		theme: { value: "default", validValues: ["default", "simblk", "sky", "red"] },
		themeHotReload: { value: false },

		hideAds: { value: false },
		hideChat: { value: false },
		smallChatButton: { value: true },
		fastSearch: { value: true },
		fixAudioVolume: { value: true },

		robuxToUSDRate: { value: "none", hidden: true },

		hoverPreview: { value: true },
		hoverPreviewMode: { value: "always", validValues: ["always", "never"] },
		
		cacheRobuxAmount: { value: true },
		higherRobuxPrecision: { value: true },
		enableContextMenus: { value: true },
		
		fixFirefoxLocalStorageIssue: { value: false }
	},
	home: {
		friendsShowUsername: { value: false },
		friendsSecondRow: { value: false },
		friendPresenceLinks: { value: false }
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
	develop: {
		addListedButtons: { value: true }
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
		addServerPager: { value: true },
		showServerPing: { value: true }
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
}

Object.values(DEFAULT_SETTINGS).forEach(list => {
	if(list instanceof Object) {
		Object.values(list).forEach(x => x.default = true)
	}
})

const SETTINGS = {
	_onChangeListeners: [],
	_loadPromise: new SyncPromise(),
	
	firstLoad: false,
	loaded: false,
	
	loadedSettings: JSON.parse(JSON.stringify(
		DEFAULT_SETTINGS,
		(key, value) => (key === "validValues" ? undefined : value)
	)),
	
	_save() {
		if(IS_BACKGROUND_PAGE && this.loaded && !this.loadError) {
			STORAGE.set({ settings: this.loadedSettings })
		}
	},
	
	_load(data) {
		if(data) {
			Object.entries(data).forEach(([groupName, group]) => {
				if(!(typeof groupName === "string" && group instanceof Object)) { return }
	
				Object.entries(group).forEach(([settingName, loadedSetting]) => {
					if(!(typeof settingName === "string" && loadedSetting instanceof Object)) { return }
					
					if(!loadedSetting.default) { // Ignore default settings
						this._set(`${groupName}.${settingName}`, loadedSetting.value, loadedSetting.default, false)
					}
				})
			})
		}

		if(IS_BACKGROUND_PAGE) {
			this._save()
		}
		
		if(!this.loaded) {
			this.loaded = true
			this._loadPromise.resolve(this.loadedSettings)
		}
	},

	load(fn) {
		if(!this.firstLoad) {
			this.firstLoad = true
			
			if(IS_BACKGROUND_PAGE) {
				STORAGE.get(["settings"], data => {
					this.loadError = chrome.runtime.lastError
					this._load(data?.settings)
				})
			}
		}

		this._loadPromise.then(fn)
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

		const defaultSetting = this._getSetting(settingPath, DEFAULT_SETTINGS)
		if(defaultSetting.validValues && !defaultSetting.validValues.includes(value)) {
			return false // Invalid value
		}

		return true
	},

	_set(settingPath, value, isDefault = false, shouldSave = false) {
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

			const listeners = [...(this._onChangeListeners[settingPath] ?? []), ...(this._onChangeListeners["*"] ?? [])]
			for(const fn of listeners) {
				try { fn(setting.value, setting.default) }
				catch(ex) { console.error(ex) }
			}
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

	set(settingPath, value) {
		if(!this.loaded) { throw new Error("Settings are not loaded") }

		if(!this._isValid(settingPath, value)) {
			throw new Error(`Invalid value '${typeof value} ${String(value)}' to '${settingPath}'`)
		}

		this._set(settingPath, value, false, true)
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

		const defaultSetting = this._getSetting(settingPath, DEFAULT_SETTINGS)
		if(!defaultSetting) {
			throw new TypeError(`'${settingPath}' is not a valid setting`)
		}

		const value = defaultSetting.value
		if(!this._isValid(settingPath, value)) {
			throw new Error(`Invalid value '${typeof value} ${String(value)}' to '${settingPath}'`)
		}

		this._set(settingPath, value, true, true)
	},
	
	resetToDefault() {
		if(!this.loaded) { throw new Error("Settings are not loaded") }

		Object.entries(DEFAULT_SETTINGS).forEach(([groupName, group]) => {
			if(!(typeof groupName === "string" && group instanceof Object)) { return }

			Object.entries(group).forEach(([settingName, setting]) => {
				if(!(typeof settingName === "string" && setting instanceof Object)) { return }

				this._set(`${groupName}.${settingName}`, setting.value, true, true)
			})
		})

		if(IS_BACKGROUND_PAGE) {
			this.loadError = false
			this._save()
		}
	},

	onChange(settingPath, fn) {
		if(settingPath instanceof Function) {
			fn = settingPath
			settingPath = "*"
		}
		
		if(!this._onChangeListeners[settingPath]) {
			this._onChangeListeners[settingPath] = []
		}

		this._onChangeListeners[settingPath].push(fn)
	}
}

if(IS_BACKGROUND_PAGE) {
	MESSAGING.listen({
		setSetting(data, respond) {
			SETTINGS.load(() => {
				SETTINGS._set(data.path, data.value, data.default, true)
			})

			respond()
		}
	})
	
	SETTINGS.load(() => SHARED_DATA.set("settings", SETTINGS.loadedSettings))
	SETTINGS.onChange(() => SHARED_DATA.set("settings", SETTINGS.loadedSettings))
} else {
	SHARED_DATA.load(() => {
		if(!SHARED_DATA.get("settings")) { return }
		SETTINGS._load(SHARED_DATA.get("settings"))
	})
}
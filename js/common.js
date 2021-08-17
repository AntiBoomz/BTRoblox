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
		COP: { symbol: "COP", rates: [1490000, 2990000, 5790000, 15500000, 30900000] },
		
		// Currency has a fixed usd exchange rate
		
		AED: { symbol: "", usdRate: 3.6725, fixed: true },
		ANG: { symbol: "", usdRate: 1.79, fixed: true },
		AWG: { symbol: "", usdRate: 1.79, fixed: true },
		BBD: { symbol: "$", usdRate: 2, fixed: true },
		BHD: { symbol: "", usdRate: 0.376, fixed: true },
		BMD: { symbol: "$", usdRate: 1, fixed: true },
		BSD: { symbol: "$", usdRate: 1, fixed: true },
		BZD: { symbol: "$", usdRate: 2, fixed: true },
		CUC: { symbol: "", usdRate: 1, fixed: true },
		DJF: { symbol: "", usdRate: 177.7721, fixed: true },
		ERN: { symbol: "Nfk ", usdRate: 15, fixed: true },
		JOD: { symbol: "", usdRate: 0.709, fixed: true },
		KYD: { symbol: "$", usdRate: 1 / 1.20, fixed: true },
		LBP: { symbol: "", usdRate: 1507.5, fixed: true },
		OMR: { symbol: "", usdRate: 0.3845, fixed: true },
		PAB: { symbol: "", usdRate: 1, fixed: true },
		QAR: { symbol: "", usdRate: 3.64, fixed: true },
		SAR: { symbol: "", usdRate: 3.75, fixed: true },
		SVC: { symbol: "", usdRate: 8.75, fixed: true },
		XCD: { symbol: "EC$", usdRate: 2.70, fixed: true },
		
		// Fluctuating exchange rates
		
		AFN: { symbol: "", usdRate: 79.9522702183 },
		ALL: { symbol: "", usdRate: 102.9804709102 },
		AMD: { symbol: "", usdRate: 486.2065889488 },
		AOA: { symbol: "", usdRate: 647.1718000836 },
		ARS: { symbol: "", usdRate: 96.8118922797 },
		AZN: { symbol: "", usdRate: 1.6989786713 },
		BAM: { symbol: "", usdRate: 1.6490605955 },
		BDT: { symbol: "", usdRate: 84.8245541371 },
		BGN: { symbol: "", usdRate: 1.6490605955 },
		BIF: { symbol: "FBu ", usdRate: 1982.025276205 },
		BND: { symbol: "", usdRate: 1.3519072296 },
		BOB: { symbol: "", usdRate: 6.9013928527 },
		BRL: { symbol: "R$", usdRate: 5.2383268456 },
		BTN: { symbol: "", usdRate: 74.2606438149 },
		BWP: { symbol: "P ", usdRate: 11.0199212241 },
		BYN: { symbol: "", usdRate: 2.5101905674 },
		CDF: { symbol: "", usdRate: 1972.7214502493 },
		CHF: { symbol: "", usdRate: 0.9045367944 },
		CLF: { symbol: "", usdRate: 0.0279365417 },
		CNY: { symbol: "CN¥", usdRate: 6.4706141441 },
		CRC: { symbol: "", usdRate: 619.7684619732 },
		CUP: { symbol: "", usdRate: 24.0000583415 },
		CVE: { symbol: "", usdRate: 92.974293197 },
		CZK: { symbol: "", usdRate: 21.4731592042 },
		DKK: { symbol: "", usdRate: 6.2710418635 },
		DOP: { symbol: "", usdRate: 57.071079954 },
		DZD: { symbol: "", usdRate: 134.714633971 },
		EGP: { symbol: "", usdRate: 15.6995149529 },
		ETB: { symbol: "", usdRate: 44.2892835628 },
		FJD: { symbol: "$", usdRate: 2.0886503052 },
		FKP: { symbol: "£", usdRate: 0.7192444396 },
		GEL: { symbol: "", usdRate: 3.1078722934 },
		GHS: { symbol: "GH₵", usdRate: 6.0006170095 },
		GIP: { symbol: "£", usdRate: 0.7192444396 },
		GMD: { symbol: "D ", usdRate: 51.1529942043 },
		GNF: { symbol: "", usdRate: 9754.424831996 },
		GTQ: { symbol: "", usdRate: 7.7451950229 },
		GYD: { symbol: "$", usdRate: 208.7581603022 },
		HNL: { symbol: "", usdRate: 23.7248973449 },
		HRK: { symbol: "", usdRate: 6.3238442738 },
		HTG: { symbol: "", usdRate: 95.9843358639 },
		HUF: { symbol: "", usdRate: 299.9657113196 },
		IDR: { symbol: "", usdRate: 14338.0568082289 },
		ILS: { symbol: "₪", usdRate: 3.2128935432 },
		INR: { symbol: "₹", usdRate: 74.2606438149 },
		IQD: { symbol: "", usdRate: 1459.3717883796 },
		IRR: { symbol: "", usdRate: 42025.5127377942 },
		ISK: { symbol: "", usdRate: 123.9507611753 },
		JMD: { symbol: "$", usdRate: 154.6648649007 },
		JPY: { symbol: "¥", usdRate: 109.0703100934 },
		KES: { symbol: "Ksh", usdRate: 108.6427346028 },
		KGS: { symbol: "", usdRate: 84.7051500147 },
		KHR: { symbol: "", usdRate: 4078.3704680215 },
		KMF: { symbol: "", usdRate: 414.8032450526 },
		KPW: { symbol: "", usdRate: 899.9414925814 },
		KRW: { symbol: "₩", usdRate: 1150.1654605031 },
		KWD: { symbol: "", usdRate: 0.3002901805 },
		KZT: { symbol: "", usdRate: 424.5017193505 },
		LAK: { symbol: "", usdRate: 9552.4081728706 },
		LKR: { symbol: "", usdRate: 199.4675825221 },
		LRD: { symbol: "$", usdRate: 171.6457302267 },
		LSL: { symbol: "", usdRate: 14.3169161372 },
		LYD: { symbol: "", usdRate: 4.5096353816 },
		MAD: { symbol: "", usdRate: 8.9262895255 },
		MDL: { symbol: "", usdRate: 17.8843224812 },
		MGA: { symbol: "Ar ", usdRate: 3799.0070029966 },
		MKD: { symbol: "", usdRate: 51.8451492686 },
		MMK: { symbol: "", usdRate: 1645.451344769 },
		MNT: { symbol: "", usdRate: 2849.715411619 },
		MOP: { symbol: "MOP$", usdRate: 8.0114578695 },
		MUR: { symbol: "Rs ", usdRate: 42.5129080838 },
		MVR: { symbol: "", usdRate: 15.4097168847 },
		MWK: { symbol: "MK ", usdRate: 799.7180362276 },
		MXV: { symbol: "", usdRate: 2.9716347767 },
		MYR: { symbol: "RM ", usdRate: 4.2225177533 },
		MZN: { symbol: "", usdRate: 63.6535551371 },
		NAD: { symbol: "$", usdRate: 14.3169161372 },
		NGN: { symbol: "₦", usdRate: 411.4912642478 },
		NIO: { symbol: "", usdRate: 35.1126738927 },
		NOK: { symbol: "", usdRate: 8.8167922504 },
		NPR: { symbol: "", usdRate: 119.3739849325 },
		PEN: { symbol: "", usdRate: 4.0810383217 },
		PGK: { symbol: "K ", usdRate: 3.5088004452 },
		PHP: { symbol: "₱", usdRate: 49.7398907032 },
		PKR: { symbol: "Rs ", usdRate: 163.051494419 },
		PLN: { symbol: "", usdRate: 3.8400667613 },
		PYG: { symbol: "", usdRate: 6910.596955435 },
		RON: { symbol: "", usdRate: 4.147112287 },
		RSD: { symbol: "", usdRate: 99.0913627834 },
		RUB: { symbol: "", usdRate: 73.028740859 },
		RWF: { symbol: "RF ", usdRate: 994.7385088417 },
		SBD: { symbol: "$", usdRate: 7.9681744213 },
		SCR: { symbol: "Rs ", usdRate: 14.9437534546 },
		SDG: { symbol: "", usdRate: 443.9690331049 },
		SEK: { symbol: "", usdRate: 8.6046273831 },
		SGD: { symbol: "$", usdRate: 1.3519072296 },
		SHP: { symbol: "£", usdRate: 0.7192444396 },
		SLL: { symbol: "Le ", usdRate: 10255.6626082783 },
		SOS: { symbol: "", usdRate: 584.0274362883 },
		SRD: { symbol: "", usdRate: 21.4283516328 },
		SYP: { symbol: "", usdRate: 1257.8616353378 },
		SZL: { symbol: "E ", usdRate: 14.3169161372 },
		THB: { symbol: "", usdRate: 33.0237355524 },
		TJS: { symbol: "", usdRate: 11.4046168926 },
		TMT: { symbol: "", usdRate: 3.4934118528 },
		TND: { symbol: "", usdRate: 2.7568728667 },
		TOP: { symbol: "T$", usdRate: 2.2527708027 },
		TRY: { symbol: "", usdRate: 8.4200800009 },
		TTD: { symbol: "$", usdRate: 6.7849435593 },
		TZS: { symbol: "TSh ", usdRate: 2319.0103697248 },
		UAH: { symbol: "", usdRate: 26.8870124467 },
		UGX: { symbol: "USh ", usdRate: 3551.8635697043 },
		UYU: { symbol: "", usdRate: 43.5826452697 },
		UZS: { symbol: "", usdRate: 10645.6030631652 },
		VES: { symbol: "", usdRate: 3966726.735688612 },
		VND: { symbol: "₫", usdRate: 22917.8687153359 },
		VUV: { symbol: "VT ", usdRate: 111.5628500329 },
		WST: { symbol: "WS$", usdRate: 2.5720014274 },
		XAF: { symbol: "FCFA ", usdRate: 553.0709934034 },
		YER: { symbol: "", usdRate: 250.0860214599 },
		ZAR: { symbol: "R ", usdRate: 14.3169161372 },
		ZMW: { symbol: "K ", usdRate: 19.2100023389 },
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
			
			if(!currency.symbol || (currency.usdRate && (currency.symbol === "$" || currency.symbol === "£"))) {
				currency.symbol = `${name} `
			}
			
			if(currency.usdRate) {
				currency.rates = this.Currencies.USD.rates.map(x => x * currency.usdRate)
			}

			const list = this.OptionLists[name] = this.OptionLists[name] || []
			currency.rates.forEach((cash, index) => {
				const regular = { name: `${name.toLowerCase()}Regular${index}`, cash: cash, robux: this.RegularPurchaseAmounts[index] }
				const premium = { name: `${name.toLowerCase()}Premium${index}`, cash: cash, robux: this.PremiumPurchaseAmounts[index] }
				
				if(currency.usdRate) {
					regular.usdCash = premium.usdCash = this.Currencies.USD.rates[index]
				}
				
				list.push(regular, premium)
			})
		})

		Object.entries(this.OptionLists).forEach(([name, list]) => {
			const currency = this.Currencies[name]

			list.forEach(option => {
				option.currency = currency
				this.Options[option.name] = option
			})
		})

		return this
	}
}.init()

//

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

//

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
			
			higherRobuxPrecision: { value: true },
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
			this._loadPromise = new SyncPromise(resolve => {
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

"use strict"

const Settings = (() => {
	const DEFAULT_SETTINGS = {
		general: {
			theme: "default",
			showBlogFeed: true,

			showAds: false,
			noHamburger: true,

			chatEnabled: true
		},
		catalog: {
			enabled: true
		},
		itemdetails: {
			animationPreview: true,
			animationPreviewAutoLoad: true,
			explorerButton: false
		},
		chat: {
			enabled: true
		},
		gamedetails: {
			enabled: true,
			showBadgeOwned: true
		},
		groups: {
			enabled: true,
			shoutAlerts: true
		},
		inventory: {
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

	const settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS))

	function applySettings(data) {
		let changedSomething = false

		function recurse(par, obj) {
			Object.keys(obj).forEach(index => {
				if(!(index in par)) return;
				const oldVal = par[index]
				const newVal = obj[index]

				if(oldVal instanceof Object) {
					recurse(oldVal, newVal)
				} else if(typeof oldVal === typeof newVal && oldVal !== newVal) {
					changedSomething = true
					par[index] = newVal
				}
			})
		}

		recurse(settings, data)
		return changedSomething
	}

	const onChangeListeners = []
	let getPromise
	return {
		get() {
			if(getPromise) return getPromise;
			getPromise = new Promise(resolve => {
				chrome.storage.local.get(["settings"], data => {
					applySettings(data.settings)
					resolve(settings)
				})
			})

			return getPromise
		},
		set(data) {
			if(!(data instanceof Object)) throw new TypeError("data should be an object");

			if(applySettings(data)) {
				chrome.storage.local.set({ settings })
				onChangeListeners.forEach(fn => fn(settings))
			}
		},
		onChange(cb) {
			onChangeListeners.push(cb)
		}
	}
})();
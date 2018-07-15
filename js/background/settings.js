"use strict"

const Settings = (() => {
	const settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS))

	function applySettings(data) {
		let changedSomething = false

		function recurse(par, obj) {
			Object.keys(obj).forEach(index => {
				if(!(index in par)) { return }
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

	chrome.runtime.onInstalled.addListener(() => {
		// Update cached settings on install
		Settings.get(() => {
			STORAGE.set({ settings })
		})
		
		// Legacy cleanup
		localStorage.removeItem("cssCache")
		if(chrome.alarms) { chrome.alarms.clear("KeepAlive") }
	})

	return {
		get(cb) {
			if(!getPromise) {
				getPromise = new Promise(resolve => {
					STORAGE.get(["settings"], data => {
						if(data.settings instanceof Object) {
							applySettings(data.settings)
						}

						resolve(settings)
					})
				})
			}
			
			getPromise.then(cb)
		},
		set(data) {
			if(!(data instanceof Object)) { throw new TypeError("data should be an object") }
			Settings.get(() => {
				if(applySettings(data)) {
					STORAGE.set({ settings })
					onChangeListeners.forEach(fn => fn(settings))
				}
			})
		},
		onChange(cb) {
			onChangeListeners.push(cb)
		}
	}
})()


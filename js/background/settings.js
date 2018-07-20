"use strict"

const Settings = (() => {
	const settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS))

	function applySettings(data) {
		let changedSomething = false

		function recurse(par, obj, def) {
			Object.entries(par).forEach(([name, value]) => {
				const objValue = obj[name]
				const defaultValue = def[name]

				if(value instanceof Object && objValue instanceof Object) {
					if("default" in value && "value" in value) {
						if(objValue.default === false && typeof objValue.value === typeof value.value && objValue.value !== value.value) {
							value.value = objValue.value
							value.default = value.value === defaultValue.value
							changedSomething = true
						}
					} else {
						recurse(value, objValue, defaultValue)
					}
				} else if(value instanceof Object) {
					if("default" in value && "value" in value) {
						if(typeof value.value === typeof objValue && value.value !== objValue) {
							value.value = objValue
							value.default = value.value === defaultValue.value
							changedSomething = true
						}
					}
				}
			})
		}

		recurse(settings, data, DEFAULT_SETTINGS)
		return changedSomething
	}

	const onChangeListeners = []
	let getPromise

	chrome.runtime.onInstalled.addListener(() => {
		// Update cached settings on install
		Settings.get(() => {
			STORAGE.set({ settings })
		})
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


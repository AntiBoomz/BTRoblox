"use strict"

const Settings = (() => {
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
	const getPromise = new Promise(resolve => {
		STORAGE.get(["settings"], data => {
			if(data.settings instanceof Object) {
				applySettings(data.settings)
			}

			STORAGE.set({ settings })
			resolve(settings)
		})
	})

	return {
		get(cb) {
			getPromise.then(cb)
		},
		set(data) {
			if(!(data instanceof Object)) throw new TypeError("data should be an object");

			if(applySettings(data)) {
				STORAGE.set({ settings })
				onChangeListeners.forEach(fn => fn(settings))
			}
		},
		onChange(cb) {
			onChangeListeners.push(cb)
		}
	}
})();
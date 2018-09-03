"use strict"

const Settings = (() => {
	const settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
	const onChangeListeners = []
	let isLoaded = false
	let loadPromise

	const getSetting = (path, root = settings) => {
		const parts = path.split(".")
		const sett = parts.reduce((t, i) => (t ? t[i] : null), root)

		if(!sett || !("value" in sett)) { throw new TypeError(`'${path}' is not a valid setting`) }

		return sett
	}

	const getDefaultValue = path => getSetting(path, DEFAULT_SETTINGS).value

	return {
		load(cb) {
			if(!loadPromise) {
				loadPromise = new Promise(resolve => {
					STORAGE.get(["settings"], data => {
						if(data.settings instanceof Object) {
							APPLY_SETTINGS(data.settings, settings)
						}

						isLoaded = true
						resolve(this)
					})
				})
			}
			
			loadPromise.then(cb)
		},
		get(path) {
			if(!isLoaded) { throw new Error("Settings are not loaded") }
			return getSetting(path).value
		},
		set(path, value) {
			if(!isLoaded) { throw new Error("Settings are not loaded") }

			const sett = getSetting(path)

			if(typeof sett.value !== typeof value) {
				throw new TypeError(`Invalid value to Settings.set("${path}") (${typeof sett.value} expected, got ${typeof value}`)
			}

			if(sett.value !== value) {
				sett.value = value
				sett.default = sett.value === getDefaultValue(path)

				STORAGE.set({ settings })
				onChangeListeners.forEach(fn => fn(this))
			}
		},
		onChange(cb) {
			onChangeListeners.push(cb)
		}
	}
})()

MESSAGING.listen({
	setSetting(data, respond) {
		Settings.load(() => {
			Settings.set(data.path, data.value)
		})

		respond()
	}
})
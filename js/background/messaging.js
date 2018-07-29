"use strict"

MESSAGING.listen({
	getSettings(data, respond) {
		Settings.get(settings => {
			respond(settings)
		})
	},
	setSetting(data, respond) {
		Settings.set(data)
		respond()
	}
})
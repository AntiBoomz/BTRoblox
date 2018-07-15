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
	},
	
	resolveAssetUrl(url, respond) {
		fetch(url, { credentials: "include", method: "HEAD" }).then(resp => {
			if(!resp.ok) {
				respond({ state: "NOT_OK", status: resp.status, statusText: resp.statusText })
				return
			}

			respond({ state: "SUCCESS", url: resp.url })
		}, ex => {
			respond({ state: "ERROR", message: ex.message })
		})
	}
})
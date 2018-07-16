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
	
	resolveAssetUrl(params, respond) {
		const urlInfo = new URL("https://assetgame.roblox.com/asset/")
		params.forEach(([name, value]) => urlInfo.searchParams.append(name, value))

		fetch(urlInfo.href, { credentials: "include", method: "HEAD" }).then(resp => {
			if(!resp.ok) {
				respond({ state: "NOT_OK", status: resp.status, statusText: resp.statusText })
				return
			}

			if(!resp.url || !resp.url.match(/^https?:\/\/[ct]\d\.rbxcdn\.com(?=\/|$)/i)) {
				respond({ state: "INVALID_RESPONSE", url: resp.url })
			}

			respond({ state: "SUCCESS", url: resp.url.replace(/^http:/, "https:") })
		}, ex => {
			respond({ state: "ERROR", message: ex.message })
		})
	}
})
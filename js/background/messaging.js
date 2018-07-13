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

	getRankName(data, respond) {
		const url = `https://www.roblox.com/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRole&playerid=${data.userId}&groupid=${data.groupId}`
		fetch(url).then(async resp => respond(await resp.text()))
	},

	downloadFile(url, respond) {
		fetch(url, { credentials: "include" })
			.then(async resp => {
				if(!resp.ok) {
					console.error("[Messaging] downloadFile not ok", resp.status, resp.statusText)
					respond({ state: "NOT_OK", status: resp.status, statusText: resp.statusText })
					return
				}

				const blob = await resp.blob()
				respond({ state: "SUCCESS", url: URL.createObjectURL(blob) })
			}, ex => {
				console.error("[Messaging] downloadFile error", ex)
				respond({ state: "ERROR", message: ex.message })
			})
	},

	_execScripts(list, respond, port) {
		const promises = list.map(path => new Promise(resolve => {
			chrome.tabs.executeScript(port.sender.tab.id, { file: path, runAt: "document_start", frameId: port.sender.frameId }, () => {
				const err = chrome.runtime.lastError
				if(err) {
					console.warn("Execute Scripts failure:", err)
				}
				resolve()
			})
		}))

		Promise.all(promises).then(() => respond())
	}
})
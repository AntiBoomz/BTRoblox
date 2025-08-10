"use strict"

// Service worker wont run on browser startup unless these have listeners

chrome.runtime.onStartup.addListener(() => {})
chrome.runtime.onInstalled.addListener(() => {})

//

const contentScript = {
	listenersByName: [],
	ports: [],
	
	onPortAdded(port) {
		this.ports.push(port)

		port.onMessage.addListener(msg => this.onPortMessage(port, msg))
		port.onDisconnect.addListener(() => this.onPortRemoved(port))
	},
	
	onPortRemoved(port) {
		const index = this.ports.indexOf(port)
		if(index !== -1) { this.ports.splice(index, 1) }
	},

	onPortMessage(port, msg) {
		const listener = this.listenersByName[msg.name]

		if(!listener) {
			throw new Error(`Received unknown message ${msg.name}`)
		}

		let final = false

		const respond = (response, hasMore) => {
			if(!final && "id" in msg) {
				final = !(hasMore === true)

				port.postMessage({
					id: msg.id,
					data: response,
					final
				})
			}
		}

		respond.cancel = () => {
			if(!final && "id" in msg) {
				final = true
				port.postMessage({ id: msg.id, final, cancel: true })
			}
		}

		listener(msg.data, respond, port)
	},
	
	listen(name, callback) {
		if(typeof name === "object") {
			for(const [key, fn] of Object.entries(name)) {
				this.listen(key, fn)
			}
			return
		}

		if(!this.listenersByName[name]) {
			this.listenersByName[name] = callback
		} else {
			console.warn(`Listener '${name}' already exists`)
		}
	}
}

chrome.runtime.onConnect.addListener(port => contentScript.onPortAdded(port))

//

const getRequiredPermissions = () => {
	const manifest = chrome.runtime.getManifest()
	
	return {
		origins: [
			...(IS_MANIFEST_V3 ? manifest.host_permissions : manifest.permissions.filter(x => x.includes("://"))),
			...manifest.content_scripts[0].matches
		]
	}
}

const browserAction = IS_MANIFEST_V3 ? chrome.action : chrome.browserAction

browserAction.onClicked.addListener(tab => {
	chrome.permissions.request(getRequiredPermissions(), () => {})
	
	chrome.scripting.executeScript({
		target: { tabId: tab.id },
		func: () => {
			if(typeof SettingsModal !== "undefined" && SettingsModal.enabled) {
				SETTINGS.load(() => SettingsModal.toggle(true))
				return true
			}
		}
	}, results => {
		if(chrome.runtime.lastError) {} // Clear lastError
		
		if(results?.[0]?.result !== true) {
			chrome.tabs.create({ url: "https://www.roblox.com/home?btr_settings_open=true" })
		}
	})
})

contentScript.listen({
	async checkPermissions(_, respond) {
		// Can't check all at once because it doesn't handle overlapping permissions properly.
		// i.e. checking for both *.roblox.com and www.roblox.com will return true even if
		// we don't have www.roblox.com permission (which we explicitly need on Chrome to
		// disable extension click-to-enable functionality).
		
		for(const host of getRequiredPermissions().origins) {
			const contains = await new Promise(resolve => chrome.permissions.contains({ origins: [host] }, resolve))
			if(!contains) { return respond(false) }
		}
		
		respond(true)
	},
	
	requestPermissions(_, respond) {
		chrome.permissions.request(getRequiredPermissions(), respond)
	}
})
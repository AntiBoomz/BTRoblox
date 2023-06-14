"use strict"

const SHARED_DATA = {
	_loadPromise: new Promise(),
	_loaded: false,
	
	lastDataString: null,
	data: { version: 1 },
	
	updateData() {
		const dataString = JSON.stringify(this.data)
		
		if(this.lastDataString === dataString) { return }
		this.lastDataString = dataString
		
		if(IS_CHROME) {
			const url = new URL("data:,")
			url.searchParams.set("data", dataString)
			
			chrome.declarativeNetRequest.updateDynamicRules({
				removeRuleIds: [9001],
				addRules: [{
					action: { type: "redirect", redirect: { url: url.toString() } },
					condition: { urlFilter: "https://www.roblox.com/?btr_settings" },
					id: 9001
				}]
			})
		} else {
			const thisIndex = this.payloadIndex = (this.payloadIndex || 0) + 1
			
			if(this.payloadScript) {
				this.payloadScript.unregister()
				this.payloadScript = null
			}
			
			const details = chrome.runtime.getManifest().content_scripts[0]
			
			browser.contentScripts.register({
				matches: details.matches,
				excludeMatches: details.exclude_matches,
				js: [{
					code: `const SHARED_DATA_PAYLOAD = ${dataString}; if(typeof SHARED_DATA !== "undefined" && SHARED_DATA.payloadPromise) { SHARED_DATA.payloadPromise.$resolve() }`
				}],
				allFrames: details.all_frames,
				runAt: details.run_at
			}).then(payloadScript => {
				if(this.payloadIndex === thisIndex) {
					this.payloadScript = payloadScript
				} else {
					payloadScript.unregister()
				}
			})
		}
	},
	
	get(key) {
		return this.data[key]
	},
	
	set(key, value) {
		this.data[key] = value
		
		if(IS_BACKGROUND_PAGE && this._loaded) {
			$.setImmediate(() => this.updateData())
		}
	},
	
	load(fn) {
		this._loadPromise.then(fn)
	},
	
	async initBackgroundScript() {
		MESSAGING.listen({
			getSharedData: (_, respond) => {
				respond(this.data)
			}
		})
		
		this._loaded = true
		this._loadPromise.$resolve()
	},
	
	async initContentScript() {
		if(IS_CHROME) {
			let syncLoadErrorCounter = parseInt(sessionStorage.getItem("syncLoadError"), 10)
			let dataPayload
			
			if(!Number.isSafeInteger(syncLoadErrorCounter)) {
				syncLoadErrorCounter = 0
			}
			
			if(syncLoadErrorCounter < 3) {
				const request = new XMLHttpRequest()
				request.open("HEAD", "https://www.roblox.com/?btr_settings", false)
				
				try {
					request.send()
					dataPayload = JSON.parse(new URL(request.responseURL).searchParams.get("data"))
				} catch(ex) {}
			}
			
			if(dataPayload instanceof Object) {
				sessionStorage.removeItem("syncLoadError")
			} else {
				sessionStorage.setItem("syncLoadError", syncLoadErrorCounter + 1)
				
				this.syncLoadError = typeof navigator.brave === "undefined"
					? `BTRoblox failed to initialize properly for an unknown reason.\nSome features may not work properly for the time being.`
					: `BTRoblox is currently experiencing issues on the Brave browser.\nSome features may not work properly for the time being.`
				
				dataPayload = await new Promise(resolve => MESSAGING.send("getSharedData", data => resolve(data)))
			}
			
			Object.assign(this.data, dataPayload)
		} else {
			if(typeof SHARED_DATA_PAYLOAD === "undefined") {
				this.payloadPromise = new Promise()
				await this.payloadPromise
			}
			
			Object.assign(this.data, SHARED_DATA_PAYLOAD)
		}
		
		this._loaded = true
		this._loadPromise.$resolve()
	}
}

if(IS_BACKGROUND_PAGE) {
	SHARED_DATA.initBackgroundScript()
}

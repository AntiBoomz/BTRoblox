"use strict"

const SHARED_DATA = {
	_loadPromise: new SyncPromise(),
	_csPromise: null,
	
	updating: false,
	data: {},
	
	update() {
		if(IS_CHROME) {
			const reader = new FileReader()
			
			reader.addEventListener("load", () => {
				chrome.declarativeNetRequest.updateDynamicRules({
					removeRuleIds: [9001],
					addRules: [{
						action: { type: "redirect", redirect: { url: reader.result } },
						condition: { urlFilter: "roblox.com/btr/settings" },
						id: 9001
					}]
				})
			}, { once: true })
			
			reader.readAsDataURL(new Blob([JSON.stringify(this.data)], { type: "application/json" }))
			
		} else {
			if(this._csPromise) { this._csPromise.then(x => x.unregister()) }
			
			const manifest = chrome.runtime.getManifest()
			
			this._csPromise = browser.contentScripts.register({
				allFrames: true,
				runAt: "document_start",
				matches: manifest.content_scripts[0].matches,
				excludeMatches: manifest.content_scripts[0].exclude_matches,
				js: [{
					code: `(${
						data => {
							SHARED_DATA_INIT = data
							if(typeof SHARED_DATA !== "undefined") {
								SHARED_DATA.init(SHARED_DATA_INIT)
							}
						}
					})(${JSON.stringify(this.data)})`
				}]
			})
		}
	},
	
	get(key) {
		return this.data[key]
	},
	set(key, value) {
		this.data[key] = value
		
		if(IS_BACKGROUND_PAGE && !this.updating) {
			this.updating = true
			setTimeout(() => {
				this.updating = false
				this.update()
			}, 10)
		}
	},
	
	load(fn) {
		this._loadPromise.then(fn)
	},
	
	init(object) {
		for(const [key, value] of Object.entries(object)) {
			this.set(key, value)
		}
		
		this._loadPromise.resolve()
	},
	
	start() {
		if(IS_CHROME) {
			const request = new XMLHttpRequest()
			request.open("GET", `${location.origin}/btr/settings`, false)
			request.send(null)
			
			SHARED_DATA.init(JSON.parse(request.responseText))
		} else {
			if(typeof SHARED_DATA_INIT !== "undefined") {
				SHARED_DATA.init(SHARED_DATA_INIT)
			}
		}
	}
}
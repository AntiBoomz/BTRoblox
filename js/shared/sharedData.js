"use strict"

const SHARED_DATA = {
	_loadPromise: new SyncPromise(),
	_loaded: false,
	
	dataUrl: null,
	data: { version: 1 },
	
	updateDataUrl() {
		const dataString = JSON.stringify(this.data)
		
		const url = new URL(getURL("res/icon_128.png"))
		url.searchParams.set("data", dataString)
		
		this.dataUrl = url.toString()
		
		if(IS_CHROME) {
			chrome.declarativeNetRequest.updateDynamicRules({
				removeRuleIds: [9001],
				addRules: [{
					action: { type: "redirect", redirect: { url: this.dataUrl } },
					condition: { urlFilter: "https://btr_settings.roblox.com/" },
					id: 9001
				}]
			})
		} else {
			localStorage.setItem("btrSharedData", dataString)
		}
	},
	
	get(key) {
		return this.data[key]
	},
	
	set(key, value) {
		this.data[key] = value
		
		if(IS_BACKGROUND_PAGE && this._loaded) {
			this.updateDataUrl()
		}
	},
	
	load(fn) {
		this._loadPromise.then(fn)
	},
	
	async initBackgroundScript() {
		if(IS_CHROME) {
			const rules = await chrome.declarativeNetRequest.getDynamicRules()
			const rule = rules.find(x => x.id === 9001)
			
			if(rule) {
				try {
					const data = JSON.parse(new URL(rule.action.redirect.url).searchParams.get("data"))
					
					if(data.version === this.data.version) {
						for(const key of Object.keys(data)) {
							if(!(key in this.data)) {
								this.data[key] = data[key]
							}
						}
					}
				} catch(ex) {}
			}
		} else {
			try {
				const data = JSON.parse(localStorage.getItem("btrSharedData"))
				
				if(data.version === this.data.version) {
					Object.assign(this.data, data)
				}
			} catch(ex) {}
		}
		
		this.updateDataUrl()
		
		if(IS_FIREFOX) {
			chrome.webRequest.onBeforeRequest.addListener(
				() => ({ redirectUrl: this.dataUrl }),
				{ urls: ["https://btr_settings.roblox.com/"] },
				["blocking"]
			)
		}
		
		this._loaded = true
		this._loadPromise.resolve()
	},
	
	initContentScript() {
		const request = new XMLHttpRequest()
		request.open("HEAD", `https://btr_settings.roblox.com/`, false)
		
		try {
			request.send()
			Object.assign(this.data, JSON.parse(new URL(request.responseURL).searchParams.get("data")))
		} catch(ex) {}
		
		this._loaded = true
		this._loadPromise.resolve()
	}
}

if(IS_BACKGROUND_PAGE) {
	SHARED_DATA.initBackgroundScript()
}

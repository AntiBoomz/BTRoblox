"use strict"

importScripts(
	"/js/shared/common.js",
	"/js/shared/utility.js",
	
	"/js/shared/sharedData.js",
	"/js/shared/messaging.js",
	"/js/shared/settings.js",
	
	"/js/bg/contextmenu.js",
	"/js/bg/groupshout.js",
	"/js/bg/blogfeed.js",
	
	"/js/rbx/RobloxApi.js"
)

//

chrome.action.onClicked.addListener(tab => {
	const callback = success => {
		if(!success) {
			chrome.tabs.create({ url: "https://www.roblox.com/home?btr_settings_open=true" })
		}
	}
	
	chrome.scripting.executeScript({
		target: { tabId: tab.id },
		func: () => {
			if(typeof toggleSettingsModal === "function") {
				SETTINGS.load(() => toggleSettingsModal(true))
				return true
			}
		}
	}).then(x => callback(!!x[0].result), () => callback(false))
})

// Service worker wont run on browser startup unless these have listeners

chrome.runtime.onStartup.addListener(() => {})
chrome.runtime.onInstalled.addListener(() => {})

//

MESSAGING.listen({
	loadScripts(assets, respond, port) {
		const scripts = assets.filter(file => file.endsWith(".js"))

		chrome.scripting.executeScript({
			target: { tabId: port.sender.tab.id, frameIds: [port.sender.frameId] },
			files: scripts
		}, () => respond())
	},
	
	async fetch([url, init], respond) {
		try {
			if(init._body) {
				const body = init._body
				
				switch(body.type) {
				case "URLSearchParams":
					init.body = new URLSearchParams(body.data)
					break
				}
	
				delete init._body
			}
	
			let xsrf = init.xsrf
			if(xsrf) {
				if(!init.headers) {
					init.headers = {}
				}

				if((typeof xsrf !== "string" || invalidXsrfTokens[xsrf]) && cachedXsrfToken) {
					xsrf = cachedXsrfToken
				}
	
				if(typeof xsrf === "string") {
					init.headers["X-CSRF-TOKEN"] = xsrf
	
					if(!cachedXsrfToken) {
						cachedXsrfToken = xsrf
					}
				}
	
				delete init.xsrf
			}

			let resp = await fetch(url, init)

			if(xsrf) {
				if(!resp.ok && resp.status === 403 && resp.headers.has("X-CSRF-TOKEN")) {
					if(typeof xsrf === "string") {
						invalidXsrfTokens[xsrf] = true
					}
					
					xsrf = init.headers["X-CSRF-TOKEN"] = resp.headers.get("X-CSRF-TOKEN")

					if(!cachedXsrfToken || invalidXsrfTokens[cachedXsrfToken]) {
						cachedXsrfToken = xsrf
					}

					resp = await fetch(url, init)
				}
			}
			
			let blob = await resp.blob()
			
			if(IS_CHROME) {
				blob = {
					body: Array.from(new Uint8Array(await blob.arrayBuffer())), // lol
					type: blob.type
				}
			}
			
			respond({
				success: true,
				blob: blob,
				status: resp.status,
				statusText: resp.statusText,
				headers: Array.from(resp.headers.entries()),
				redirected: resp.redirected,
				type: resp.type,
				url: resp.url
			})
		} catch(ex) {
			console.error(ex)

			respond({
				success: false,
				error: ex.toString()
			})
		}
	}
})
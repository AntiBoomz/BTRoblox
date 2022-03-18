"use strict"

chrome.browserAction.onClicked.addListener(tab => {
	const callback = success => {
		if(!success) {
			chrome.tabs.create({ url: "https://www.roblox.com/home?btr_settings_open=true" })
		}
	}
	
	chrome.tabs.executeScript(
		tab.id,
		{
			code: `(${
				() => {
					if(typeof toggleSettingsModal !== "undefined") {
						SETTINGS.load(() => toggleSettingsModal(true))
						return true
					}
				}
			})()`,
			runAt: "document_start"
		},
		x => callback(!!(!chrome.runtime.lastError && x && x[0]))
	)
})

//

MESSAGING.listen({
	async loadScripts(assets, respond, port) {
		const scripts = assets.filter(file => file.endsWith(".js"))
		
		for(const file of scripts) {
			await new Promise(resolve =>
				chrome.tabs.executeScript(
					port.sender.tab.id,
					{
						frameId: port.sender.frameId,
						file: file,
						runAt: "document_start"
					},
					resolve
				)
			)
		}
		
		respond()
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
"use strict"

const angularHook = {
	templateCache: {},
	
	modifyTemplate(keyArray, callback) {
		if(typeof keyArray === "string") {
			keyArray = [keyArray]
		}
		
		const listener = {
			finished: false,
			
			update() {
				for(const key of keyArray) {
					if(!angularHook.templateCache[key].body) {
						return
					}
				}
				
				if(this.finished) { return }
				this.finished = true
				
				const args = []
				
				for(const key of keyArray) {
					const cacheEntry = angularHook.templateCache[key]
					cacheEntry.listeners.delete(listener)
					args.push(cacheEntry.body)
				}
				
				try { callback(...args) }
				catch(ex) { console.error(ex) }
				
				for(const key of keyArray) {
					const cacheEntry = angularHook.templateCache[key]
					InjectJS.send("updateTemplate", key, cacheEntry.body.innerHTML)
				}
			}
		}
		
		for(const key of keyArray) {
			const cacheEntry = angularHook.templateCache[key] = angularHook.templateCache[key] || { listeners: new Set(), listening: false }
			cacheEntry.listeners.add(listener)
			
			if(!cacheEntry.listening) {
				cacheEntry.listening = true
				InjectJS.send("listenForTemplate", key)
			}
		}
		
		if(IS_DEV_MODE) {
			$.ready(() => setTimeout(() => {
				if(!listener.finished) {
					console.warn(`Missing templates in modifyTemplate ${JSON.stringify(keyArray)}`)
				}
			}, 5e3))
		}
	},
	
	init() {
		InjectJS.listen("initTemplate", (key, html) => {
			// self closing tag support
			html = html.replace(/<([\w-:]+)([^>]*)\/>/gi, "<$1$2></$1>")
			
			const cacheEntry = angularHook.templateCache[key]
			cacheEntry.body = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html").body
			
			for(const listener of cacheEntry.listeners.values()) {
				listener.update()
			}
		})
	}
}

angularHook.init()
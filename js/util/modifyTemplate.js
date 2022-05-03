"use strict"

const templateCache = {}

function modifyTemplate(keyArray, callback) {
	if(typeof keyArray === "string") {
		keyArray = [keyArray]
	}
	
	const listener = {
		finished: false,
		
		update() {
			for(const key of keyArray) {
				if(!templateCache[key].body) {
					return
				}
			}
			
			if(this.finished) { return }
			this.finished = true
			
			const args = []
			
			for(const key of keyArray) {
				const cacheEntry = templateCache[key]
				cacheEntry.listeners.delete(listener)
				args.push(cacheEntry.body)
			}
			
			try { callback(...args) }
			catch(ex) { console.error(ex) }
			
			for(const key of keyArray) {
				const cacheEntry = templateCache[key]
				InjectJS.send("updateTemplate", key, cacheEntry.body.innerHTML)
			}
		}
	}
	
	$.ready(() => setTimeout(() => {
		if(!listener.finished) {
			THROW_DEV_WARNING(`Missing templates in modifyTemplate ${JSON.stringify(keyArray)}`)
		}
	}, 1000))
	
	for(const key of keyArray) {
		const cacheEntry = templateCache[key] = templateCache[key] || { listeners: new Set(), listening: false }
		cacheEntry.listeners.add(listener)
		
		if(!cacheEntry.listening) {
			cacheEntry.listening = true
			InjectJS.send("listenForTemplate", key)
		}
	}
}

InjectJS.listen("initTemplate", (key, html) => {
	const cacheEntry = templateCache[key]
	cacheEntry.body = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html").body
	
	for(const listener of cacheEntry.listeners.values()) {
		listener.update()
	}
})
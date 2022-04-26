"use strict"

const InjectJS = {
	messageListeners: {},
	listening: false,
	
	injectResults: new Map(),
	injectCounter: 0,
	
	inject(args, fn) {
		if(typeof args === "function") {
			fn = args
			args = []
		}
		
		if(typeof fn !== "function") {
			throw new TypeError("fn is not a function")
		}
		
		if(!Array.isArray(args)) {
			args = [args]
		}
		
		const injectId = this.injectCounter++
		
		const injector = document.createElement("div")
		injector.setAttribute("onclick", `{ let result; try { result = (${fn})(...${JSON.stringify(args)}) } finally {} window.BTRoblox?.contentScript.send("injectResult", ${injectId}, result); }`)
		
		BTRoblox.element.append(injector)
		
		injector.click()
		injector.remove()
		
		return this.injectResults.get(injectId)
	},

	send(action, ...args) {
		BTRoblox.element.dispatchEvent(new CustomEvent(`inject`, {
			detail: IS_FIREFOX ? cloneInto({ action, args }, window.wrappedJSObject) : { action, args }
		}))
	},

	listen(action, callback) {
		this.messageListeners[action] = this.messageListeners[action] || []
		this.messageListeners[action].push(callback)
		
		if(!this.listening) {
			this.listening = true
			
			BTRoblox.element.addEventListener(`content`, ev => {
				const { action, args } = IS_FIREFOX ? cloneInto(ev.detail, window) : ev.detail
				
				const listeners = this.messageListeners[action]
				if(!listeners) { return }
				
				for(let i = listeners.length; i--;) {
					try { listeners[i].apply(null, args) }
					finally {}
				}
			})
		}
	}
}

InjectJS.listen("injectResults", (id, result) => {
	InjectJS.injectResults.set(id, result)
	setTimeout(() => InjectJS.injectResults.delete(id), 0)
})


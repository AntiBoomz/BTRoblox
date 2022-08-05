"use strict"

const InjectJS = {
	messageListeners: {},
	
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
		
		const injector = document.createElement("div")
		injector.setAttribute("onclick", `this.dispatchEvent(new CustomEvent("result", { detail: [(${fn})(...${JSON.stringify(args)})] }))`)
		
		let result
		
		injector.addEventListener("result", ev => {
			try { result = IS_FIREFOX ? cloneInto(ev.detail, window) : ev.detail }
			catch(ex) {}
			
			result = Array.isArray(result) ? result[0] : null
		})
		
		BTRoblox.element.append(injector)
		
		injector.click()
		injector.remove()
		
		return result
	},

	send(action, ...args) {
		BTRoblox.element.dispatchEvent(new CustomEvent(`inject_${action}`, {
			detail: IS_FIREFOX ? cloneInto(args, window.wrappedJSObject) : args
		}))
	},

	listen(action, callback) {
		let listeners = this.messageListeners[action]
		
		if(!listeners) {
			listeners = this.messageListeners[action] = []
			
			BTRoblox.element.addEventListener(`content_${action}`, ev => {
				let args
				
				try { args = IS_FIREFOX ? cloneInto(ev.detail, window) : ev.detail }
				catch(ex) {}
				
				args = Array.isArray(args) ? args : []
				
				for(let i = listeners.length; i--;) {
					try { listeners[i].apply(null, args) }
					catch(ex) { console.error(ex) }
				}
			})
		}
		
		listeners.push(callback)
	}
}
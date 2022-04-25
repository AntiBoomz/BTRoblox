"use strict"

const InjectJS = {
	messageListeners: {},
	listening: false,
	
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
		injector.setAttribute("onclick", `this.dataset.returnValue = JSON.stringify((${fn})(${JSON.stringify(args).slice(1, -1)}))`)
		
		document.documentElement.append(injector)
		injector.click()
		
		let returnValue
		
		try { returnValue = JSON.parse(injector.dataset.returnValue) }
		catch(ex) {}
		
		injector.remove()
		
		return returnValue
	},

	send(action, ...args) {
		try {
			if(IS_FIREFOX) { args = cloneInto(args, window.wrappedJSObject) }
			BTRoblox.element.dispatchEvent(new CustomEvent(`inject`, { detail: { action, args } }))
		} finally {}
	},

	listen(action, callback) {
		this.messageListeners[action] = this.messageListeners[action] || []
		this.messageListeners[action].push(callback)
		
		if(!this.listening) {
			this.listening = true
			
			BTRoblox.element.addEventListener(`content`, ev => {
				const { action, args } = ev.detail
				
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
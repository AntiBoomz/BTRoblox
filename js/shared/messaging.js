"use strict"

let MESSAGING

if(IS_BACKGROUND_PAGE) {
	MESSAGING = {
		listenersByName: [],
		ports: [],
		
		onPortAdded(port) {
			this.ports.push(port)
	
			port.onMessage.addListener(msg => this.onPortMessage(port, msg))
			port.onDisconnect.addListener(() => this.onPortRemoved(port))
		},
		
		onPortRemoved(port) {
			const index = this.ports.indexOf(port)
			if(index !== -1) { this.ports.splice(index, 1) }
		},
	
		onPortMessage(port, msg) {
			const listener = this.listenersByName[msg.name]

			if(!listener) {
				throw new Error(`Received unknown message ${msg.name}`)
			}

			let final = false

			const respond = (response, hasMore) => {
				if(!final && "id" in msg) {
					final = !(hasMore === true)

					port.postMessage({
						id: msg.id,
						data: response,
						final
					})
				}
			}

			respond.cancel = () => {
				if(!final && "id" in msg) {
					final = true
					port.postMessage({ id: msg.id, final, cancel: true })
				}
			}

			listener(msg.data, respond, port)
		},
		
		listen(name, callback) {
			if(typeof name === "object") {
				for(const [key, fn] of Object.entries(name)) {
					this.listen(key, fn)
				}
				return
			}
	
			if(!this.listenersByName[name]) {
				this.listenersByName[name] = callback
			} else {
				console.warn(`Listener '${name}' already exists`)
			}
		}
	}
	
	chrome.runtime.onConnect.addListener(port => MESSAGING.onPortAdded(port))
} else {
	MESSAGING = {
		callbacks: {},
		responseCounter: 0,
		
		resetTimeout() {
			if(this.portTimeout) {
				clearTimeout(this.portTimeout)
				this.portTimeout = null
			}
			
			if(this.port && Object.keys(this.callbacks).length === 0) {
				this.portTimeout = setTimeout(() => this.disconnectPort(), 10e3)
			}
		},
		
		initPort() {
			if(this.port) { return }
			
			const port = chrome.runtime.connect()
			this.port = port
			
			port.onMessage.addListener(msg => this.onPortMessage(port, msg))
			port.onDisconnect.addListener(() => this.disconnectPort())
			
			this.resetTimeout()
		},
		
		disconnectPort() {
			if(!this.port) { return }
			this.port.disconnect()
			this.port = null
			
			this.callbacks = {}
			this.resetTimeout()
		},
		
		onPortMessage(port, msg) {
			const fn = this.callbacks[msg.id]
			if(!fn) { return }

			if(msg.final) {
				delete this.callbacks[msg.id]
				this.resetTimeout()
				
				if(msg.cancel) { return }
			}

			fn(msg.data)
		},
		
		send(name, data, callback) {
			if(typeof data === "function") {
				callback = data
				data = null
			}
			
			const info = { name, data }
			
			if(typeof callback === "function") {
				const id = info.id = this.responseCounter++
				this.callbacks[id] = callback
			}
			
			if(!this.port) { this.initPort() }
			this.port.postMessage(info)
			this.resetTimeout()
		}
	}
}
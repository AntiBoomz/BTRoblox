"use strict"

const EventMap = new WeakMap()
const GetEventProps = (item, init) => {
	if(EventMap.has(item)) { return EventMap.get(item) }

	if(init) {
		const props = {
			listeners: {}
		}
		EventMap.set(item, props)

		return props
	}

	return null
}

class EventEmitter {
	on(eventName, fn, opt = {}) {
		const props = GetEventProps(this, true)

		if(!(eventName in props.listeners)) { props.listeners[eventName] = [] }
		props.listeners[eventName].push({ fn, opt })
		
		return this
	}

	once(eventName, fn, opt = {}) {
		opt.once = true
		return this.on(eventName, fn, opt)
	}

	off(eventName, fn) {
		const props = GetEventProps(this)
		if(!props) { return }

		const listeners = props.listeners[eventName]
		if(!listeners) { return }

		for(let i = listeners.length; i--;) {
			const x = listeners[i]
			if(x.fn === fn) {
				listeners[i] = listeners[listeners.length - 1]
				listeners.pop()
			}
		}

		return this
	}

	trigger(eventName, ...args) {
		const props = GetEventProps(this)
		if(!props) { return }

		const listeners = props.listeners[eventName]
		if(!listeners) { return }
		
		for(const x of listeners.slice()) {
			if(x.opt.once) {
				listeners.splice(listeners.indexOf(x), 1)
			}

			x.fn(...args)
		}
	}
}
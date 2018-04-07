"use strict"

const $ = (() => {
	const $ = function(selector) { return $.find(document, selector) }
	$.all = function(selector) { return $.findAll(document, selector) }
		

	const Months = [
		"January", "February", "March", "April", "May", "June", 
		"July", "August", "September", "October", "November", "December"
	]

	const Days = [
		"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
	]

	const Fixed = (num, len) => ("00" + num).slice(-len)
	const DTF = new Intl.DateTimeFormat("en-us", {timeZoneName: "short"})

	Object.assign($, {
		find(self, selector) {
			return self.querySelector(selector.replace(/(^|,)\s*(?=>)/g, "$&:scope"))
		},
		findAll(self, selector) {
			return self.querySelectorAll(selector.replace(/(^|,)\s*(?=>)/g, "$&:scope"))
		},

		on(self, eventNames, selector, callback, once) {
			if(typeof selector === "function") [selector, callback, once] = [null, selector, callback];

			eventNames.split(" ").forEach(eventType => {
				if(!eventType.length) return;
				if(!self.$events) Object.defineProperty(self, "$events", { value: {} });

				let listeners = self.$events[eventType]
				if(!listeners) listeners = self.$events[eventType] = [];

				const listener = {
					selector,
					callback,
					once,
					handler(...args) {
						const event = args[0]
						if(!selector) return callback.apply(this, args);

						let path = event.path
						if(!path) {
							let target = event.target
							path = [target]
							while(target.parentNode) {
								target = target.parentNode
								path.push(target)
							}
							path.push(window)
						}

						const query = this.$findAll(selector)
						const final = path.indexOf(this)

						const sP = event.stopPropagation
						let hasStoppedPropagation = false
						event.stopPropagation = function(...args) {
							hasStoppedPropagation = true
							return sP.apply(this, args)
						}

						for(let i = 0; i < final; i++) {
							const node = path[i]
							const index = Array.prototype.indexOf.call(query, node)
							if(index === -1) continue;

							Object.defineProperty(event, "currentTarget", { value: node, configurable: true })
							callback.apply(this, args)
							delete event.currentTarget

							if(hasStoppedPropagation) break;
						}
					}
				}

				listeners.push(listener)
				self.addEventListener(eventType, listener.handler, false)
			})

			return self
		},
		once(...args) {
			return this.on(...args, true)
		},
		off(self, eventNames, selector, callback) {
			if(!self.$events) return self;
			if(typeof selector !== "string") [selector, callback] = [null, selector];

			eventNames.split(" ").forEach(eventType => {
				if(!eventType.length) return;
				if(!self.$events) return;

				const listeners = self.$events[eventType]
				if(!listeners) return;

				const removeAll = selector == null && callback == null
				for(let i = 0; i < listeners.length; i++) {
					const listener = listeners[i]
					if(removeAll || (selector && listener.selector === selector) || (callback && listener.callback === callback)) {
						listeners.splice(i--, 1)
						self.removeEventListener(eventType, listener.handler)
					}
				}
			})

			return self
		},
		trigger(self, type, init) { return self.dispatchEvent(new Event(type, init)), self },

		each(self, cb) { Array.prototype.forEach.call(self, cb) },

		dateFormat(date, format) {
			if(typeof date === "string") {
				date = new Date(date)
			}

			return format.replace(/a|A|Z|T|S(SS)?|ss?|mm?|HH?|hh?|D{1,4}|M{1,4}|YY(YY)?|'([^']|'')*'/g, str => {
				switch(str[0]) {
				case "'": return str.slice(1, -1).replace(/''/g, "'")
				case "a": return date.getHours() < 12 ? "am" : "pm"
				case "A": return date.getHours() < 12 ? "AM" : "PM"
				case "Z": return (("+" + -date.getTimezoneOffset() / 60).replace(/^\D?(\D)/, "$1").replace(/^(.)(.)$/, "$10$2") + "00")
				case "T": return DTF.format(date).split(" ")[1]
				case "Y": return ("" + date.getFullYear()).slice(-str.length)
				case "M": return str.length > 2 ? Months[date.getMonth()].slice(0, str.length > 3 ? 9 : 3) : Fixed(date.getMonth() + 1, str.length)
				case "D": return str.length > 2 ? Days[date.getDay()].slice(0, str.length > 3 ? 9 : 3)
					: str.length === 2 ? Fixed(date.getDate(), 2) : date.getDate()
				case "H": return Fixed(date.getHours(), str.length)
				case "h": return Fixed(date.getHours() % 12 || 12, str.length)
				case "m": return Fixed(date.getMinutes(), str.length)
				case "s": return Fixed(date.getSeconds(), str.length)
				case "S": return Fixed(date.getMilliseconds(), str.length)
				default: return "dapoop?"
				}
			})
		},
		dateSince(date, relativeTo) {
			if(relativeTo instanceof Date) {
				relativeTo = relativeTo.getTime()
			} else if(typeof relativeTo === "string") {
				relativeTo = new Date(relativeTo).getTime()
			} else if(!relativeTo) {
				relativeTo = Date.now()
			}

			if(date instanceof Date) {
				date = date.getTime()
			} else if(typeof date === "string") {
				date = new Date(date).getTime()
			}

			const since = (relativeTo - date) / 1000

			const y = Math.floor(since / 3600 / 24 / 365)
			if(y >= 1) return Math.floor(y) + " year" + (y < 2 ? "" : "s");

			const M = Math.floor(since / 3600 / 24 / 31)
			if(M >= 1) return Math.floor(M) + " month" + (M < 2 ? "" : "s");

			const w = Math.floor(since / 3600 / 24 / 7)
			if(w >= 1) return Math.floor(w) + " week" + (w < 2 ? "" : "s");

			const d = Math.floor(since / 3600 / 24)
			if(d >= 1) return Math.floor(d) + " day" + (d < 2 ? "" : "s");

			const h = Math.floor(since / 3600)
			if(h >= 1) return Math.floor(h) + " hour" + (h < 2 ? "" : "s");

			const m = Math.floor(since / 60)
			if(m >= 1) return Math.floor(m) + " minute" + (m < 2 ? "" : "s");

			const s = Math.floor(since)
			return Math.floor(s) + " second" + (Math.floor(s) === 1 ? "" : "s")
		}
	})

	const Assign = (stuff, data) => {
		stuff.forEach(constructor => {
			Object.assign(constructor.prototype, data)
		})
	}

	// Firefox xray stuff, custom constructors ._.'

	Assign([window.EventTarget, EventTarget], {
		$on(...args) { return $.on(this, ...args) },
		$off(...args) { return $.off(this, ...args) },
		$once(...args) { return $.once(this, ...args) },
		$trigger(...args) { return $.trigger(this, ...args) },
	})

	Assign([window.Date, Date], {
		$format(...args) { return $.dateFormat(this, ...args) },
		$since(...args) { return $.dateSince(this, ...args) }
	})

	Assign([window.Element, Element, window.Document, Document, window.DocumentFragment, DocumentFragment], {
		$find(...args) { return $.find(this, ...args) },
		$findAll(...args) { return $.findAll(this, ...args) }
	})

	return $
})();


const htmlstring = function(pieces, ...args) {
	const escapeMap = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#39;",
		"/": "&#x2F;"
	}

	const escapePiece = s => s.replace(/[^\S ]+/g, "").replace(/ {2,}/g, " ");
	const escapeArg = s => s.toString().replace(/[&<>"'/]/g, x => escapeMap[x])

	let result = escapePiece(pieces[0])

	for(let i = 0, len = args.length; i < len; i++) {
		result += escapeArg(args[i]) + escapePiece(pieces[i + 1])
	}

	return result
}

const html = function(...args) {
	const result = htmlstring.apply(this, args)
	const template = document.createElement("template")
	template.innerHTML = result

	return template.content.firstElementChild || template.content.firstChild
}

let mutobvCounter = 0
function CreateObserver(target, params) {
	const options = Object.assign({ childList: true, subtree: true }, params || {})
	const isPermanent = !!options.permanent
	const observeList = []
	let connected = false

	const arrayFind = Array.prototype.find

	let targetSelector
	if(target === document) {
		targetSelector = ":root"
	} else {
		const mutobvId = mutobvCounter++
		target.setAttribute("mutobv", mutobvId)
		targetSelector = `[mutobv="${mutobvId}"]`
	}

	const observer = new MutationObserver(mutations => {
		const callbacks = []

		for(let index = 0; index < observeList.length; index++) {
			const item = observeList[index]

			if(!item.persistent) {
				let elem
				if(item.filter) {
					if(!item.gotFirst) {
						const testElem = target.querySelector(item.selector)
						if(testElem) {
							if(item.filter(testElem)) {
								elem = testElem
							} else {
								item.gotFirst = true
							}
						}
					}

					if(item.gotFirst) {
						elem = arrayFind.call(target.querySelectorAll(item.selector), x => item.filter(x))
					}
				} else {
					elem = target.querySelector(item.selector)
				}

				if(elem) {
					observeList.splice(index--, 1)
					item.whole.result[item.index] = elem

					if(--item.whole.resultsLeft === 0) {
						callbacks.push([item.whole.callback, item.whole.result])
					}
				}
			} else {
				for(let i = 0, mutLen = mutations.length; i < mutLen; i++) {
					const addedNodes = mutations[i].addedNodes
					for(let j = 0, addLen = addedNodes.length; j < addLen; j++) {
						const node = addedNodes[j]
						if(node.nodeType === 1 && node.matches(item.selector)) {
							if(!item.filter || item.filter(node)) {
								callbacks.push([item.callback, [node]])
							}
						}
					}
				}
			}
		}

		if(connected && observeList.length === 0) {
			connected = false
			observer.disconnect()
		}

		callbacks.forEach(([fn, args]) => {
			try { fn(...args) }
			catch(ex) { console.error("[MutationObserver]", ex) }
		})
	})

	return {
		one(selectors, filter, callback) {
			if(!callback) {
				callback = filter
				filter = null
			}

			if(!Array.isArray(selectors)) {
				selectors = [selectors]
			}

			selectors.forEach((sel, i) => {
				selectors[i] = sel.replace(/(^|,)/g, `$1${targetSelector} `)
			})

			const whole = {
				callback,
				result: [],
				resultsLeft: selectors.length
			}

			selectors.forEach((selector, index) => {
				const item = {
					whole, filter, selector, index,
					persistent: false
				}

				let elem
				if(item.filter) {
					elem = arrayFind.call(target.querySelectorAll(item.selector), x => item.filter(x))
				} else {
					elem = target.querySelector(item.selector)
				}

				if(elem) {
					item.whole.result[item.index] = elem

					if(--item.whole.resultsLeft === 0) {
						try { item.whole.callback.apply(null, item.whole.result) }
						catch(ex) { console.error("[MutationObserver]", ex) }
					}
				} else {
					if(!isPermanent && document.readyState !== "loading") {
						console.warn("observer.one called when not loading and not permanent, not listening")
						return
					}
					observeList.push(item)
				}
			})
			
			if(!connected && observeList.length > 0) {
				connected = true
				observer.observe(target, options)
			}

			return this
		},
		all(selector, filter, callback) {
			if(!callback) {
				callback = filter
				filter = null
			}

			selector = selector.replace(/(^|,)/g, `$1${targetSelector} `)
			
			const item = {
				selector, filter, callback,
				persistent: true
			}

			const elems = target.querySelectorAll(item.selector)
			elems.forEach(elem => {
				if(!item.filter || item.filter(elem)) {
					try { item.callback(elem) }
					catch(ex) { console.error("[MutationObserver]", ex) }
				}
			})

			if(!isPermanent && document.readyState !== "loading") {
				console.warn("observer.all called when not loading and not permanent, not listening")
				return this
			}
			
			observeList.push(item)
			if(!connected) {
				connected = true
				observer.observe(target, options)
			}

			return this
		}
	}
}
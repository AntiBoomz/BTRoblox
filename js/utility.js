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

						const query = this.$findAll(selector)
						const final = event.path.indexOf(this)

						const sP = event.stopPropagation
						let hasStoppedPropagation = false
						event.stopPropagation = function(...args) {
							hasStoppedPropagation = true
							return sP.apply(this, args)
						}

						for(let i = 0; i < final; i++) {
							const node = event.path[i]
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
				self.addEventListener(eventType, listener.handler, true)
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

			return format.replace(/a|A|Z|S(SS)?|ss?|mm?|HH?|hh?|D{1,4}|M{1,4}|YY(YY)?|'([^']|'')*'/g, str => {
				switch(str[0]) {
				case "'": return str.slice(1, -1).replace(/''/g, "'")
				case "a": return date.getHours() < 12 ? "am" : "pm"
				case "A": return date.getHours() < 12 ? "AM" : "PM"
				case "Z": return (("+" + -date.getTimezoneOffset() / 60).replace(/^\D?(\D)/, "$1").replace(/^(.)(.)$/, "$10$2") + "00")
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


	Object.assign(EventTarget.prototype, {
		$on(...args) { return $.on(this, ...args) },
		$off(...args) { return $.off(this, ...args) },
		$once(...args) { return $.once(this, ...args) },
		$trigger(...args) { return $.trigger(this, ...args) },
	})

	Object.assign(Date.prototype, {
		$format(...args) { return $.dateFormat(this, ...args) },
		$since(...args) { return $.dateSince(this, ...args) }
	})

	const types = [Element, Document, DocumentFragment]
	types.forEach(x => {
		Object.assign(x.prototype, {
			$find(...args) { return $.find(this, ...args) },
			$findAll(...args) { return $.findAll(this, ...args) }
		})
	})
	
	return $
})();


const htmlstring = function(pieces) {
	const escapeMap = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;",
		"/": "&#x2F;"
	}

	var escapePiece = s => s.replace(/[^\S ]+/g, "").replace(/ {2,}/g, " ");
	var escapeArg = s => s.toString().replace(/[&<>"'\/]/g, x => escapeMap[x])

	var result = escapePiece(pieces[0])

	for(var i=1, len=arguments.length; i<len; i++) {
		var escaped = arguments[i]
		result += escapeArg(arguments[i]) + escapePiece(pieces[i])
	}

	return result
}

const html = function() {
	var result = htmlstring.apply(this, arguments)
	var template = document.createElement("template")
	template.innerHTML = result

	return template.content.firstElementChild || template.content.firstChild
}

function CreateObserver(target, params) {
	const options = Object.assign({ childList: true, subtree: true }, params || {})
	const isPermanent = !!options.permanent
	let observeList = []
	let connected = false

	const arrayFind = Array.prototype.find
	const arrayIndexOf = Array.prototype.indexOf

	const observer = new MutationObserver(mutations => {
		for(let index = 0; index < observeList.length; index++) {
			const item = observeList[index]

			if(!item.persistent) {
				let elem
				if(item.filter) {
					elem = arrayFind.call(target.querySelectorAll(item.selector), x => item.filter(x))
				} else {
					elem = target.querySelector(item.selector)
				}

				if(elem) {
					observeList.splice(index--, 1)
					item.whole.result[item.index] = elem

					if(--item.whole.resultsLeft === 0) {
						try { item.whole.callback.apply(null, item.whole.result) }
						catch(ex) { console.error("[MutationObserver]", ex) }
					}
				}
			} else {
				const elems = target.querySelectorAll(item.selector)

				mutations.forEach(mut => {
					mut.addedNodes.forEach(node => {
						if(arrayIndexOf.call(elems, node) !== -1) {
							if(item.filter && !item.filter(node)) return;

							try { item.callback(node) }
							catch(ex) { console.error("[MutationObserver]", ex) }
						}
					})
				})
			}
		}

		if(connected && observeList.length === 0) {
			connected = false
			observer.disconnect()
		}
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
			
			const item = {
				selector, filter, callback,
				persistent: true
			}

			const elems = target.querySelectorAll(item.selector)
			elems.forEach(elem => {
				if(item.filter && !item.filter(elem)) return;
				try { item.callback(elem) }
				catch(ex) { console.error("[MutationObserver]", ex) }
			})

			if(!isPermanent && document.readyState !== "loading") {
				console.warn("observer.all called when not loading and not permanent, not listening")
				return
			} else {
				observeList.push(item)
				if(!connected) {
					connected = true
					observer.observe(target, options)
				}
			}

			return this
		}
	}
}
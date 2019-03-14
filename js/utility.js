"use strict"

const $ = function(selector) { return $.find(document, selector) }

{
	$.all = function(selector) { return $.findAll(document, selector) }
		

	const Months = [
		"January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"
	]

	const Days = [
		"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
	]

	const Fixed = (num, len) => {
		const str = String(num)
		const amt = len - str.length
		return amt > 0 ? "0".repeat(amt) + str : str
	}

	let DTF

	const Observers = new WeakMap()
	const DirectObservers = new WeakMap()

	const handleMutations = (mut, self) => {
		const listeners = self.listeners

		if(listeners.length) {
			for(let i = listeners.length; i--;) {
				const item = listeners[i]
				const elem = item.getter()

				if(elem) {
					const last = listeners.pop()
					if(item !== last) { listeners[i] = last }

					item.resolve(elem)
				}
			}
		}

		if(!listeners.length) {
			self.disconnect()
			Observers.delete(self.target)
		}
	}

	const handleDirectMutations = (mutations, self) => {
		const listeners = self.listeners

		if(listeners.length) {
			for(let k = listeners.length; k--;) {
				const item = listeners[k]

				if(!item.stopped) {
					for(let i = mutations.length; i--;) {
						const addedNodes = mutations[i].addedNodes
						for(let j = addedNodes.length; j--;) {
							const node = addedNodes[j]
							if(node.nodeType !== 1) { continue }

							let matches = false
							switch(item.type) {
							case "name": matches = node.nodeName.toLowerCase() === item.selector; break
							case "class": matches = node.classList.contains(item.selector); break
							case "id": matches = node.id === item.selector; break
							}
			
							if(matches) {
								if(item.callback) {
									try { item.callback(node, () => item.stopped = true) }
									catch(ex) { console.error(ex) }
								}
								
								if(item.once || item.stopped) {
									item.stopped = true
									i = 0 // To break mutations loop
									break
								}
							}
						}
					}
				}

				if(item.stopped) {
					const last = listeners.pop()
					if(item !== last) { listeners[k] = last }
				}
			}
		}

		if(!listeners.length) {
			self.disconnect()
			DirectObservers.delete(self.target)
		}
	}

	const watchAllSelectorRegex = /^((?:#|\.)?[\w-]+)$/
	const watcherProto = {
		$watch(...args) {
			const finishPromise = this.targetPromise.then(target => target.$watch(...args).finishPromise)

			return {
				targetPromise: this.targetPromise,
				finishPromise,
				__proto__: watcherProto
			}
		},

		$watchAll(...args) {
			this.targetPromise.then(target => {
				target.$watchAll(...args)
			})

			return this
		},

		$then(cb) {
			if(!this.finishPromise) { throw new Error("Tried to call $then before $watch") }
			
			const nxt = {
				targetPromise: this.finishPromise,
				finishPromise: null,
				__proto__: watcherProto
			}

			if(cb) {
				cb(nxt)
				return this
			}

			return nxt
		},

		$promise() {
			return this.finishPromise || this.targetPromise
		}
	}

	const defaultToDict = (x, v) => x[v] = true
	
	const immediateStatus = { counter: 0 }
	const immediatePromise = Promise.resolve()

	Object.assign($, {
		fetch(...args) {
			return new SyncPromise(resolve => {
				MESSAGING.send("fetch", args, async respData => {
					const blobResp = await fetch(respData.blobUrl)

					const resp = new Response(
						await blobResp.blob(),
						{
							status: respData.status,
							statusText: respData.statusText,
							headers: respData.headers
						}
					)

					Object.defineProperties(resp, {
						redirected: { value: respData.redirected },
						type: { value: respData.type },
						url: { value: respData.url }
					})

					if(!resp.ok) {
						console.error(args.length > 1 && args[1].method || "GET", resp.url, `${resp.status} (${resp.statusText})`)
					}

					resolve(resp)
				})
			})
		},
		
		toDict(fn, ...args) {
			if(typeof fn !== "function" && fn !== null) {
				throw new TypeError("No function given to toDict")
			}
			if(!fn) { fn = defaultToDict }

			const obj = {}
			args.forEach((val, index) => fn(obj, val, index))
			return obj
		},

		watch(target, selectors, filter, callback) {
			if(!callback) {
				callback = filter
				filter = null
			}

			if((target instanceof Document) || (target instanceof DocumentFragment)) {
				target = target.documentElement
			}

			if(!Array.isArray(selectors)) {
				selectors = [selectors]
			}

			let observer = Observers.get(target)

			const promises = selectors.map(selector => new SyncPromise(resolve => {
				let getter

				if(selector.indexOf(",") === -1) {
					if(document.contains(target)) {
						const idMatch = selector.match(/^\s*#([\w-]+)\s*$/)
						if(idMatch) {
							const id = idMatch[1]
							getter = () => {
								const elem = document.getElementById(id)

								if(elem && !target.contains(elem)) {
									getter = () => target.$find(selector)
									return getter()
								}
								
								return elem
							}
						}

						const classMatch = selector.match(/^\s*\.([\w-]+)\s*$/)
						if(classMatch) {
							const className = classMatch[1]
							const collection = document.getElementsByClassName(className)
							if(collection.length < 10) {
								getter = () => {
									if(collection.length >= 10) {
										getter = () => target.$find(selector)
										return getter()
									}

									for(let i = 0, len = collection.length; i < len; i++) {
										const elem = collection[i]
										if(target.contains(elem)) {
											return elem
										}
									}

									return null
								}
							}
						}
					}

					const directMatch = selector.match(/^\s*>\s*((?:\.|#)?[\w-]+)\s*$/)
					if(directMatch) {
						const match = directMatch[1]
						target.$watchAll(match, (node, disable) => {
							if(filter && !filter(node)) { return }
							disable()
							resolve(node)
						})
						return
					}
				}

				if(!getter) { getter = () => target.$find(selector) }
				const elem = getter()

				if(elem) {
					resolve(elem)
				} else {
					if(!observer) {
						observer = new MutationObserver(handleMutations)
						Observers.set(target, observer)
	
						observer.listeners = []
						observer.target = target
	
						observer.observe(target, { childList: true, subtree: true })
					}

					observer.listeners.push({ getter, resolve })
				}
			}))

			const finishPromise = SyncPromise.all(promises).then(elems => {
				if(callback) {
					try { callback(...elems) }
					catch(ex) { console.error(ex) }
				}

				return elems[0]
			})

			return {
				targetPromise: SyncPromise.resolve(target),
				finishPromise,
				__proto__: watcherProto
			}
		},

		watchAll(target, selector, callback, argProps) {
			selector = selector.trim()
			if(!watchAllSelectorRegex.test(selector)) {
				throw new Error(`Invalid selector '${selector}', only simple selectors allowed`)
			}

			const props = {}
			if(argProps instanceof Object) { Object.assign(props, argProps) }

			let item
			if(selector[0] === ".") {
				item = { type: "class", selector: selector.slice(1), callback, once: props.once }
			} else if(selector[0] === "#") {
				item = { type: "id", selector: selector.slice(1), callback, once: props.once }
			} else {
				item = { type: "name", selector, callback, once: props.once }
			}

			const spent = Array.from(target.children).some(node => {
				let matches = false

				switch(item.type) {
				case "name": matches = node.nodeName.toLowerCase() === item.selector.toLowerCase(); break
				case "class": matches = node.classList.contains(item.selector); break
				case "id": matches = node.id === item.selector; break
				}

				if(matches) {
					if(item.callback) {
						try { item.callback(node, () => item.stopped = true) }
						catch(ex) { console.error(ex) }
					}

					if(item.once || item.stopped) { return true }
				}

				return false
			})

			if(!spent) {
				let observer = DirectObservers.get(target)
				if(!observer) {
					observer = new MutationObserver(handleDirectMutations)
					DirectObservers.set(target, observer)

					observer.listeners = [item]
					observer.target = target

					observer.observe(target, { childList: true, subtree: false })
				} else {
					observer.listeners.push(item)
				}
			}
		},

		setImmediate(cb, ...args) {
			const key = immediateStatus.counter++
			immediateStatus[key] = true

			immediatePromise.then(() => {
				if(immediateStatus[key]) {
					delete immediateStatus[key]
					cb(...args)
				}
			})

			return key
		},

		clearImmediate(key) {
			delete immediateStatus[key]
		},

		find(self, selector) {
			if(IS_EDGE) {
				const oldId = self.id
				self.id = "btr-find-thang"
				try {
					const result = self.querySelector(selector.replace(/(^|,)\s*(?=>)/g, "$&#btr-find-thang"))
					self.id = oldId
					return result
				} catch(ex) {
					self.id = oldId
					throw ex
				}
			}

			return self.querySelector(selector.replace(/(^|,)\s*(?=>)/g, "$&:scope"))
		},
		findAll(self, selector) {
			if(IS_EDGE) {
				const oldId = self.id
				self.id = "btr-find-thang"
				try {
					const result = self.querySelectorAll(selector.replace(/(^|,)\s*(?=>)/g, "$&#btr-find-thang"))
					self.id = oldId
					return result
				} catch(ex) {
					self.id = oldId
					throw ex
				}
			}

			return self.querySelectorAll(selector.replace(/(^|,)\s*(?=>)/g, "$&:scope"))
		},

		empty(self) {
			while(self.lastChild) { self.removeChild(self.lastChild) }
		},

		on(self, eventNames, selector, callback, once) {
			if(typeof selector === "function") { [selector, callback, once] = [null, selector, callback] }

			eventNames.split(" ").forEach(eventType => {
				if(!eventType.length) { return }
				if(!self.$events) { Object.defineProperty(self, "$events", { value: {} }) }

				let listeners = self.$events[eventType]
				if(!listeners) { listeners = self.$events[eventType] = [] }

				const listener = {
					selector,
					callback,
					once,
					handler(...args) {
						const event = args[0]
						if(!selector) { return callback.apply(this, args) }

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
						event.stopPropagation = function(...spArgs) {
							hasStoppedPropagation = true
							return sP.apply(this, spArgs)
						}

						for(let i = 0; i < final; i++) {
							const node = path[i]
							const index = Array.prototype.indexOf.call(query, node)
							if(index === -1) { continue }

							Object.defineProperty(event, "currentTarget", { value: node, configurable: true })
							callback.apply(this, args)
							delete event.currentTarget

							if(hasStoppedPropagation) { break }
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
			if(!self.$events) { return self }
			if(typeof selector !== "string") { [selector, callback] = [null, selector] }

			eventNames.split(" ").forEach(eventType => {
				if(!eventType.length) { return }
				if(!self.$events) { return }

				const listeners = self.$events[eventType]
				if(!listeners) { return }

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
		trigger(self, type, init) {
			self.dispatchEvent(new Event(type, init))
			return self
		},

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
				case "T":
					if(!DTF) { DTF = new Intl.DateTimeFormat("en-us", { timeZoneName: "short" }) }
					return DTF.format(date).split(" ")[1]
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
			if(y >= 1) { return Math.floor(y) + " year" + (y < 2 ? "" : "s") }

			const M = Math.floor(since / 3600 / 24 / 31)
			if(M >= 1) { return Math.floor(M) + " month" + (M < 2 ? "" : "s") }

			const w = Math.floor(since / 3600 / 24 / 7)
			if(w >= 1) { return Math.floor(w) + " week" + (w < 2 ? "" : "s") }

			const d = Math.floor(since / 3600 / 24)
			if(d >= 1) { return Math.floor(d) + " day" + (d < 2 ? "" : "s") }

			const h = Math.floor(since / 3600)
			if(h >= 1) { return Math.floor(h) + " hour" + (h < 2 ? "" : "s") }

			const m = Math.floor(since / 60)
			if(m >= 1) { return Math.floor(m) + " minute" + (m < 2 ? "" : "s") }

			const s = Math.floor(since)
			return Math.floor(s) + " second" + (Math.floor(s) === 1 ? "" : "s")
		},

		strToBuffer(str) {
			const buff = new ArrayBuffer(str.length)
			const view = new Uint8Array(buff)

			for(let i = str.length; i--;) {
				view[i] = str.charCodeAt(i)
			}

			return buff
		},

		bufferToStr(buff) {
			if(buff instanceof ArrayBuffer) { buff = new Uint8Array(buff) }
			const result = []

			for(let i = 0; i < buff.length; i += 0x8000) {
				result.push(String.fromCharCode.apply(null, buff.subarray(i, i + 0x8000)))
			}

			return result.join("")
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
		$trigger(...args) { return $.trigger(this, ...args) }
	})

	Assign([window.Date, Date], {
		$format(...args) { return $.dateFormat(this, ...args) },
		$since(...args) { return $.dateSince(this, ...args) }
	})

	Assign([window.Element, Element, window.Document, Document, window.DocumentFragment, DocumentFragment], {
		$find(...args) { return $.find(this, ...args) },
		$findAll(...args) { return $.findAll(this, ...args) },
		$watch(...args) { return $.watch(this, ...args) },
		$watchAll(...args) { return $.watchAll(this, ...args) }
	})

	Assign([window.Node, Node], {
		$empty() { return $.empty(this) }
	})
}

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

		[...listeners].forEach(x => {
			if(x.opt.once) {
				listeners.splice(listeners.indexOf(x), 1)
			}

			x.fn(...args)
		})
	}
}

const htmlstring = function(pieces, ...args) {
	if(!Array.isArray(pieces)) { pieces = [pieces] }

	const escapeMap = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#39;",
		"/": "&#x2F;"
	}

	const escapePiece = s => s.replace(/\b\n\s*\b/g, " ").replace(/\n[^\S ]*/g, "")
	const escapeArg = s => String(s).replace(/[&<>"'/]/g, x => escapeMap[x])

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
"use strict"

//

class SyncPromise extends Promise {
	static resolve(value) {
		return new SyncPromise(resolve => resolve(value))
	}

	static reject(value) {
		return new SyncPromise((_, reject) => reject(value))
	}

	static race(list) {
		return new SyncPromise((resolve, reject) => {
			list.forEach(value => {
				if(value instanceof Promise) {
					value.then(
						value2 => resolve(value2),
						value2 => reject(value2)
					)
				} else {
					resolve(value)
				}
			})
		})
	}

	static all(list) {
		return new SyncPromise((resolve, reject) => {
			const result = new Array(list.length)
			let promisesLeft = list.length

			if(!promisesLeft) {
				return resolve(result)
			}

			const finish = (index, value) => {
				if(index === null) {
					return reject(value)
				}

				result[index] = value
				if(--promisesLeft === 0) {
					resolve(result)
				}
			}

			list.forEach((value, index) => {
				if(value instanceof Promise) {
					value.then(
						value2 => finish(index, value2),
						value2 => finish(null, value2)
					)
				} else {
					finish(index, value)
				}
			})
		})
	}

	static allSettled(list) {
		return new SyncPromise(resolve => {
			const result = new Array(list.length)
			let promisesLeft = list.length

			if(!promisesLeft) {
				return resolve(result)
			}

			const finish = (index, value) => {
				result[index] = value

				if(--promisesLeft === 0) {
					resolve(result)
				}
			}

			list.forEach((value, index) => {
				if(value instanceof Promise) {
					value.then(
						value2 => finish(index, { status: "fulfilled", value: value2 }),
						value2 => finish(index, { status: "rejected", reason: value2 })
					)
				} else {
					finish(index, { status: "fulfilled", value })
				}
			})
		})
	}

	constructor(fn) {
		let res
		let rej

		super((resolve, reject) => {
			res = resolve
			rej = reject
		})

		this._resolveAsync = res
		this._rejectAsync = rej

		this._intState = "pending"
		this._intOnFinish = []

		if(fn) {
			try { fn(value => { this.resolve(value) }, reason => { this.reject(reason) }) }
			catch(ex) { this.reject(ex) }
		}
	}

	_intThen(promise, onresolve, onreject) {
		if(this._intState !== "resolved" && this._intState !== "rejected") {
			this._intOnFinish.push([promise, onresolve, onreject])
			return
		}

		try {
			if(this._intState === "resolved") {
				promise.resolve(onresolve ? onresolve(this._intValue) : this._intValue)
			} else {
				if(onreject) {
					promise.resolve(onreject(this._intReason))
				} else {
					promise.reject(this._intReason)
				}
			}
		}
		catch(ex) {
			promise.reject(ex)
		}
	}

	_intResolve(value) {
		if(this._intState === "resolved" || this._intState === "rejected") {
			return
		}

		this._intState = "resolved"
		this._intValue = value

		this._resolveAsync(value)
		delete this._resolveAsync
		delete this._rejectAsync

		this._intOnFinish.forEach(args => this._intThen(...args))
		delete this._intOnFinish
	}

	_intReject(reason) {
		if(this._intState === "resolved" || this._intState === "rejected") {
			return
		}

		this._intState = "rejected"
		this._intReason = reason

		this._rejectAsync(reason)
		delete this._resolveAsync
		delete this._rejectAsync

		this._intOnFinish.forEach(args => this._intThen(...args))
		delete this._intOnFinish
	}


	resolve(value) {
		if(this._intState === "pending") {
			this._intState = "waiting"

			if(value instanceof Promise) {
				value.then(x => this._intResolve(x), x => this._intReject(x))
			} else {
				this._intResolve(value)
			}
		}
	}

	reject(reason) {
		if(this._intState === "pending") {
			this._intState = "waiting"

			if(reason instanceof Promise) {
				reason.then(x => this._intResolve(x), x => this._intReject(x))
			} else {
				this._intReject(reason)
			}
		}
	}

	then(onresolve, onreject) {
		const promise = new SyncPromise()
		this._intThen(promise, onresolve, onreject)
		return promise
	}

	catch(onreject) {
		return this.then(null, onreject)
	}

	finally(onfinally) {
		return this.then(() => onfinally(), () => onfinally())
	}
}

//

const $ = (() => {
	let $
	
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
	
	const Assign = (stuff, data) => {
		stuff.forEach(constructor => {
			Object.assign(constructor.prototype, data)
		})
	}

	const defaultToDict = (x, v) => x[v] = true
	
	const immediateStatus = { counter: 0 }
	const immediatePromise = Promise.resolve()
	let cachedXsrfToken
	let DTF
	
	if(self.document) {
		$ = function(selector) { return $.find(document, selector) }
		$.all = function(selector) { return $.findAll(document, selector) }
		
		const Observers = new WeakMap()
		const DirectObservers = new WeakMap()
	
		const handleMutations = (mut, self) => {
			const listeners = self.listeners
			let index = 0
	
			while(index < listeners.length) {
				const item = listeners[index]
	
				if(!item.stopped) {
					item.execute()
				}
	
				if(item.stopped) {
					listeners.splice(index, 1)
				} else {
					index++
				}
			}
	
			if(!listeners.length) {
				self.disconnect()
				Observers.delete(self.target)
			}
		}
	
		const handleDirectMutations = (mutations, self) => {
			const listeners = self.listeners
			let index = 0
	
			while(index < listeners.length) {
				const item = listeners[index]
	
				if(!item.stopped) {
					for(let mutIndex = 0, mutLen = mutations.length; mutIndex < mutLen; mutIndex++) {
						const addedNodes = mutations[mutIndex].addedNodes
						for(let nodeIndex = 0, nodeLen = addedNodes.length; nodeIndex < nodeLen; nodeIndex++) {
							const node = addedNodes[nodeIndex]
							if(node.nodeType !== 1) { continue }
	
							if(item.matches(node)) {
								item.resolve(node)
	
								if(item.stopped) {
									mutIndex = mutations.length // break both loops
									break
								}
							}
						}
					}
				}
	
				if(item.stopped) {
					listeners.splice(index, 1)
				} else {
					index++
				}
			}
	
			if(!listeners.length) {
				self.disconnect()
				DirectObservers.delete(self.target)
			}
		}
	
		const watchAllSelectorRegex = /^((?:#|\.)?[\w-]+|\*)$/
		const watcherProto = {
			$watch(...args) {
				const finishPromise = this.targetPromise.then(target => target.$watch(...args).finishPromise)
	
				return {
					targetPromise: this.targetPromise,
					finishPromise,
	
					parent: this.parent,
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
				const nxt = {
					targetPromise: this.finishPromise || this.targetPromise,
					finishPromise: null,
					
					parent: this,
					__proto__: watcherProto
				}
	
				if(cb) {
					nxt.targetPromise.then(cb)
				}
	
				return nxt
			},
	
			$back() {
				if(!this.parent) {
					throw new Error("Cannot call $back on a top level watcher")
				}
	
				return this.parent
			},
	
			$promise() {
				return this.finishPromise || this.targetPromise
			}
		}
			
		const addWatch = (target, selector, filter, props, resolve) => {
			const item = {
				checked: new WeakSet(),
				foundFirst: false,
				stopped: false,

				resolve(node) {
					if(props && props.continuous) {
						resolve(node, () => this.stopped = true)
					} else {
						this.stopped = true
						resolve(node)
					}
				},

				execute() {
					if(!this.foundFirst) {
						const elem = target.$find(selector)

						if(!elem) {
							return
						}

						this.foundFirst = true
						this.checked.add(elem)

						if(!filter || filter(elem)) {
							item.resolve(elem)
		
							if(item.stopped) {
								return
							}
						}
					}

					const matches = target.$findAll(selector)

					for(let index = 0, len = matches.length; index < len; index++) {
						const match = matches[index]

						if(!this.checked.has(match)) {
							this.checked.add(match)

							if(!filter || filter(match)) {
								this.resolve(match)

								if(this.stopped) {
									return
								}
							}
						}
					}
				}
			}

			item.execute()

			if(!item.stopped) {
				let observer = Observers.get(target)

				if(!observer) {
					observer = new MutationObserver(handleMutations)
					Observers.set(target, observer)

					observer.listeners = []
					observer.target = target

					observer.observe(target, { childList: true, subtree: true })
				}

				observer.listeners.push(item)
			}
		}
		
		Object.assign($, {
			ready(fn) {
				if(document.readyState !== "loading") {
					fn()
				} else {
					document.addEventListener("DOMContentLoaded", fn, { once: true })
				}
			},

			wrapWith(self, wrap) {
				self.before(wrap)
				wrap.append(self)
			},

			watch(target, selectors, filter, callback, props) {
				if(typeof callback !== "function") {
					props = callback
					callback = filter
					filter = null
				}

				if((target instanceof Document) || (target instanceof DocumentFragment)) {
					target = target.documentElement
				}

				if(!Array.isArray(selectors)) {
					selectors = [selectors]
				}

				let finishPromise

				if(props && props.continuous) {
					if(selectors.length !== 1) {
						throw new TypeError("Multiple selectors with continuous watch")
					}

					addWatch(target, selectors[0], filter, props, node => {
						try { callback(node) }
						catch(ex) { console.error(ex) }
					})
				} else {
					const promises = selectors.map(selector => new SyncPromise(resolve => addWatch(target, selector, filter, props, resolve)))

					finishPromise = Promise.all(promises).then(elems => {
						if(callback) {
							try { callback(...elems) }
							catch(ex) { console.error(ex) }
						}
		
						return elems[0]
					})
				}

				return {
					targetPromise: Promise.resolve(target),
					finishPromise,
					__proto__: watcherProto
				}
			},

			watchAll(target, selector, callback, props = {}) {
				selector = selector.trim()

				if(!watchAllSelectorRegex.test(selector)) {
					throw new Error(`Invalid selector '${selector}', only simple selectors allowed`)
				}

				let matches

				if(selector === "*") {
					matches = () => true
				} else if(selector[0] === ".") {
					const match = selector.slice(1)
					matches = node => node.classList.contains(match)
				} else if(selector[0] === "#") {
					const match = selector.slice(1)
					matches = node => node.id === match
				} else {
					const match = selector.toLowerCase()
					matches = node => node.nodeName.toLowerCase() === match
				}

				const item = {
					once: props.once || false,
					stopped: false,

					matches,
					resolve(node) {
						if(callback) {
							try { callback(node, () => this.stopped = true) }
							catch(ex) { console.error(ex) }
						}
		
						if(this.once) {
							this.stopped = true
						}
					}
				}

				Array.from(target.children).some(node => {
					if(item.matches(node)) {
						item.resolve(node)
					}

					return item.stopped
				})

				if(!item.stopped) {
					let observer = DirectObservers.get(target)

					if(!observer) {
						observer = new MutationObserver(handleDirectMutations)
						DirectObservers.set(target, observer)

						observer.listeners = []
						observer.target = target

						observer.observe(target, { childList: true, subtree: false })
					}

					observer.listeners.push(item)
				}
			},

			find(self, selector) {
				return self.querySelector(selector.replace(/(^|,)\s*(?=>)/g, "$&:scope"))
			},
			findAll(self, selector) {
				return self.querySelectorAll(selector.replace(/(^|,)\s*(?=>)/g, "$&:scope"))
			},

			empty(self) {
				while(self.lastChild) { self.removeChild(self.lastChild) }
			},

			on(self, events, selector, callback, config) {
				if(typeof selector === "function") { [selector, callback, config] = [null, selector, callback] }
				if(!self.$events) { Object.defineProperty(self, "$events", { value: {} }) }

				events.split(" ").forEach(eventType => {
					eventType = eventType.trim()

					const eventName = eventType.replace(/^([^.]+).*$/, "$1")
					if(!eventName) { return }

					let listeners = self.$events[eventType]
					if(!listeners) { listeners = self.$events[eventType] = [] }

					const handler = event => {
						if(!selector) {
							return callback.call(self, event, self)
						}

						const fn = event.stopImmediatePropagation
						let immediateStop = false

						event.stopImmediatePropagation = function() {
							immediateStop = true
							return fn.call(this)
						}

						const path = event.composedPath()
						const maxIndex = path.indexOf(self)
						for(let i = 0; i < maxIndex; i++) {
							const node = path[i]

							if(node.matches(selector)) {
								Object.defineProperty(event, "currentTarget", { value: node, configurable: true })
								callback.call(self, event, self)
								delete event.currentTarget

								if(immediateStop) { break }
							}
						}

						delete event.stopImmediatePropagation
					}

					const listener = {
						selector, callback,
						params: [eventName, handler, config]
					}

					listeners.push(listener)
					self.addEventListener(...listener.params)
				})

				return self
			},
			once(self, events, selector, callback, config) {
				if(typeof selector === "function") { [selector, callback, config] = [null, selector, callback] }
				return this.on(self, events, selector, callback, { ...config, once: true })
			},
			off(self, events, selector, callback) {
				if(!self.$events) { return self }
				if(typeof selector !== "string") { [selector, callback] = [null, selector] }

				events.split(" ").forEach(eventType => {
					eventType = eventType.trim()

					const listeners = self.$events[eventType]
					if(!listeners) { return }

					for(let i = listeners.length; i--;) {
						const x = listeners[i]
						if((!selector || x.selector === selector) && (!callback || x.callback === callback)) {
							self.removeEventListener(...x.params)
							listeners.splice(i, 1)
						}
					}

					if(!listeners.length) {
						delete self.$events[eventType]
					}
				})

				return self
			},
			trigger(self, type, init) {
				self.dispatchEvent(new Event(type, init))
				return self
			}
		})
		
		Assign([self.EventTarget, EventTarget], {
			$on(...args) { return $.on(this, ...args) },
			$off(...args) { return $.off(this, ...args) },
			$once(...args) { return $.once(this, ...args) },
			$trigger(...args) { return $.trigger(this, ...args) }
		})

		Assign([self.Element, Element, self.Document, Document, self.DocumentFragment, DocumentFragment], {
			$find(...args) { return $.find(this, ...args) },
			$findAll(...args) { return $.findAll(this, ...args) },
			$watch(...args) { return $.watch(this, ...args) },
			$watchAll(...args) { return $.watchAll(this, ...args) }
		})

		Assign([self.Node, Node], {
			$empty() { return $.empty(this) },
			$wrapWith(...args) { return $.wrapWith(this, ...args) }
		})
	} else {
		$ = {}
	}

	Object.assign($, {
		each(self, cb) { Array.prototype.forEach.call(self, cb) },
		
		fetch(url, init = {}) {
			if(init.body) {
				if(init.body instanceof URLSearchParams) {
					init._body = { type: "URLSearchParams", data: init.body.toString() }
					delete init.body
				} else if(typeof init.body !== "string") {
					throw new TypeError("init.body should be a string")
				}
			}

			if(init.xsrf) {
				if(!cachedXsrfToken) {
					const matches = document.documentElement.innerHTML.match(/XsrfToken\.setToken\('([^']+)'\)/)

					if(matches) {
						cachedXsrfToken = matches[1]
					}
				}

				init.xsrf = cachedXsrfToken || true
			}

			return new SyncPromise((resolve, reject) => {
				MESSAGING.send("fetch", [url, init], async respData => {
					if(!respData.success) {
						console.error("$.fetch Error:", respData.error)
						reject(new Error(respData.error))
						return
					}

					const resp = await fetch(respData.dataUrl)
					URL.revokeObjectURL(respData.dataUrl)

					Object.defineProperties(resp, {
						ok: { value: respData.ok },
						status: { value: respData.status },
						statusText: { value: respData.statusText },
						headers: { value: new Headers(respData.headers) },
						redirected: { value: respData.redirected },
						type: { value: respData.type },
						url: { value: respData.url }
					})

					if(!resp.ok) {
						console.error(`${init.method && init.method.toUpperCase() || "GET"} ${resp.url} ${resp.status} (${resp.statusText})`)
					}

					resolve(resp)
				})
			})
		},
		
		onceFn(fn) {
			let result
			return function(...args) {
				if(fn) {
					result = fn.apply(this, args)
					fn = null
				}
				return result
			}
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
		dateSince(date, relativeTo, short = false) {
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

			if(Math.floor(since) <= 0) {
				return "Just now"
			}

			const y = Math.floor(since / 3600 / 24 / 365)
			if(y >= 1) { return Math.floor(y) + (short ? " yr" : " year" + (y < 2 ? "" : "s")) + " ago" }

			const M = Math.floor(since / 3600 / 24 / 31)
			if(M >= 1) { return Math.floor(M) + (short ? " mon" : " month" + (M < 2 ? "" : "s")) + " ago" }

			const w = Math.floor(since / 3600 / 24 / 7)
			if(w >= 1) { return Math.floor(w) + (short ? " wk" : " week" + (w < 2 ? "" : "s")) + " ago" }

			const d = Math.floor(since / 3600 / 24)
			if(d >= 1) { return Math.floor(d) + (short ? " dy" : " day" + (d < 2 ? "" : "s")) + " ago" }

			const h = Math.floor(since / 3600)
			if(h >= 1) { return Math.floor(h) + (short ? " hr" : " hour" + (h < 2 ? "" : "s")) + " ago" }

			const m = Math.floor(since / 60)
			if(m >= 1) { return Math.floor(m) + (short ? " min" : " minute" + (m < 2 ? "" : "s")) + " ago" }

			const s = Math.floor(since)
			return Math.floor(s) + (short ? " sec" : " second" + (Math.floor(s) === 1 ? "" : "s")) + " ago"
		},

		hashString(str) {
			let hash = 0

			for(let i = 0, len = str.length; i < len; i++) {
				hash = (((hash << 5) - hash) + str.charCodeAt(i)) | 0
			}

			return (hash >>> 0).toString(16).toUpperCase()
		}
	})

	Assign([self.Date, Date], {
		$format(...args) { return $.dateFormat(this, ...args) },
		$since(...args) { return $.dateSince(this, ...args) }
	})
	
	return $
})()

//

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

	const elem = template.content.firstElementChild || template.content.firstChild
	
	if(elem) {
		elem.remove()
	}

	return elem
}

const assert = (bool, ...msg) => {
	if(!bool) { throw new Error(...msg) }
}

const stringToBuffer = str => {
	const buff = new ArrayBuffer(str.length)
	const view = new Uint8Array(buff)

	for(let i = str.length; i--;) {
		view[i] = str.charCodeAt(i)
	}

	return buff
}

const bufferToString = buffer => {
	if(buffer instanceof ArrayBuffer) { buffer = new Uint8Array(buffer) }
	const result = []

	for(let i = 0; i < buffer.length; i += 0x8000) {
		result.push(String.fromCharCode.apply(null, buffer.subarray(i, i + 0x8000)))
	}

	return result.join("")
}
"use strict"

const INJECT_SCRIPT = (settings, currentPage, IS_DEV_MODE) => {
	"use strict"
	
	const BTRoblox = window.BTRoblox = window.BTRoblox || {}
	BTRoblox.element = document.querySelector("btroblox")
	
	const onReady = fn => {
		if(document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", fn, { once: true })
		} else {
			Promise.resolve().then(fn)
		}
	}

	const onSet = (a, b, c) => {
		if(a[b]) { return c(a[b]) }

		Object.defineProperty(a, b, {
			enumerable: false,
			configurable: true,
			set(v) {
				delete a[b]
				a[b] = v
				c(v)
			}
		})
	}

	const hijackFunction = (...args) => {
		if(args.length === 2) {
			return new Proxy(args[0], { apply: args[1] })
		}

		return args[0][args[1]] = new Proxy(args[0][args[1]], { apply: args[2] })
	}
	
	const assert = (bool, ...args) => {
		if(!bool) { throw new Error(...args) }
		return bool
	}
	
	//
	
	const contentScript = {
		messageListeners: {},
		
		send(action, ...args) {
			BTRoblox.element.dispatchEvent(new CustomEvent(`content_${action}`, { detail: args }))
		},
		listen(action, callback) {
			let listeners = this.messageListeners[action]
			
			if(!listeners) {
				listeners = this.messageListeners[action] = []
				
				BTRoblox.element.addEventListener(`inject_${action}`, ev => {
					const args = Array.isArray(ev.detail) ? ev.detail : []
					
					for(let i = listeners.length; i--;) {
						try { listeners[i].apply(null, args) }
						catch(ex) { console.error(ex) }
					}
				})
			}
			
			listeners.push(callback)
		}
	}

	const angularHook = {
		templateListeners: {},
		cachedTemplates: {},
		templateCaches: [],
		
		//
		
		moduleListeners: [],
		loadedModules: {},

		applyEntry(module, entry, callback) {
			const [, type, data] = entry
			
			if(type === "constant" || type === "component") {
				try { callback(data[1]) }
				catch(ex) { console.error(ex) }
				return
			}
			
			const hijack = (a, b, injects) => {
				const fn = a[b]
				
				if(typeof fn === "function") {
					hijackFunction(a, b, (target, thisArg, args) => {
						const argMap = {}
						
						for(const [i, arg] of Object.entries(args)) {
							argMap[injects[i]] = arg
						}
						
						return callback.call(thisArg, target, args, argMap)
					})
				}
			}
			
			if(typeof data[1] === "function") {
				hijack(data, 1, data[1].$inject)
			} else {
				hijack(data, data.length - 1, data)
			}
		},

		initEntry(module, entry) {
			const name = entry[2][0]
			const listeners = this.moduleListeners[module.name]?.[name]
			if(!listeners) { return }
			
			for(const callback of listeners) {
				this.applyEntry(module, entry, callback)
			}
		},
		
		//
		
		hijackModule(moduleName, objects) {
			let module
			
			try { module = angular.module(moduleName) }
			catch(ex) {}
			
			if(module) {
				for(const data of module._invokeQueue) {
					const callback = objects[data[2][0]]
					if(callback) {
						this.applyEntry(module, data, callback)
					}
				}
			}
			
			for(const [name, callback] of Object.entries(objects)) {
				this.moduleListeners[moduleName] = this.moduleListeners[moduleName] ?? {}
				this.moduleListeners[moduleName][name] = this.moduleListeners[moduleName][name] ?? []
				this.moduleListeners[moduleName][name].push(callback)
			}
		},
		
		//
		
		initModule(module) {
			if(this.loadedModules[module.name] === module) { return }
			this.loadedModules[module.name] = module
			
			if(module.name === "ng") {
				// Behold the monstrosity~
				
				hijackFunction(module._configBlocks[0][2][0], 1, (target, thisArg, args) => {
					hijackFunction(args[0], "provider", (target, thisArg, args) => {
						if(args[0] instanceof Object && "$templateCache" in args[0]) {
							args[0].$templateCache = new Proxy(args[0].$templateCache, {
								construct: (target, args) => {
									const result = new target(...args)
									
									hijackFunction(result.$get, 1, (target, thisArg, args) => {
										const cache = target.apply(thisArg, args)
										this.templateCaches.push(cache)
										
										hijackFunction(cache, "put", (target, thisArg, args) => {
											const key = args[0]
											
											if(this.templateListeners[key]) {
												delete this.templateListeners[key]
												contentScript.send("initTemplate", key, args[1])
											}
											
											if(this.cachedTemplates[key]) {
												args[1] = this.cachedTemplates[key]
											}
											
											return target.apply(thisArg, args)
										})
										
										return cache
									})
									
									return result
								}
							})
						}
						
						return target.apply(thisArg, args)
					})
					
					return target.apply(thisArg, args)
				})
			}
			
			for(const entry of module._invokeQueue) {
				this.initEntry(module, entry)
			}
			
			const init = (target, thisArg, args) => {
				for(const entry of args) {
					this.initEntry(module, entry)
				}
				
				return target.apply(thisArg, args)
			}
			
			hijackFunction(module._invokeQueue, "unshift", init)
			hijackFunction(module._invokeQueue, "push", init)
		},
		
		init() {
			contentScript.listen("updateTemplate", (key, html) => {
				this.cachedTemplates[key] = html
				
				for(const cache of this.templateCaches) {
					if(cache.get(key)) {
						cache.put(key, html)
					}
				}
			})
			
			contentScript.listen("listenForTemplate", key => {
				for(const cache of this.templateCaches) {
					const html = cache.get(key)
					
					if(html) {
						contentScript.send("initTemplate", key, html)
						return
					}
				}
				
				this.templateListeners[key] = true
			})
			
			onSet(window, "angular", angular => {
				onSet(angular, "module", () => {
					let didInitNg = false
					
					hijackFunction(angular, "module", (target, thisArg, args) => {
						if(!didInitNg) {
							didInitNg = true
							this.initModule(target.call(angular, "ng"))
						}
						
						const module = target.apply(thisArg, args)
						this.initModule(module)
						return module
					})
				})
			})
		}
	}
	
	const reactHook = {
		functionProxies: new WeakMap(),
		
		constructorReplaces: [],
		injectedContent: [],
		
		stateQueue: [],
		stateIndex: 0,
		
		// Content injection
		
		flattenChildren(children) {
			return (Array.isArray(children) ? children : [children]).flat(16)
		},
		
		selectorMatches(elem, selectors) {
			if(!elem?.props) {
				return false
			}
			
			main:
			for(const selector of (Array.isArray(selectors) ? selectors : [selectors])) {
				if(selector.type && (typeof elem.type !== "string" || selector.type.toLowerCase() !== elem.type.toLowerCase())) {
					continue main
				}
				
				if(selector.key && selector.key !== elem.key) {
					continue main
				}
				
				if(selector.hasProps) {
					for(const key of selector.hasProps) {
						if(!(key in elem.props)) {
							continue main
						}
					}
				}
				
				if(selector.props) {
					for(const key of Object.keys(selector.props)) {
						if(selector.props[key] !== elem.props[key]) {
							continue main
						}
					}
				}
				
				if(selector.classList) {
					const classes = typeof elem.props.className === "string" ? elem.props.className.split(/\s+/g) : []
					
					for(const className of selector.classList) {
						if(!classes.includes(className)) {
							continue main
						}
					}
				}
				
				return true
			}
			
			return false
		},
		
		// Global state
		
		createGlobalState(value) {
			return {
				listeners: new Set(),
				value: value,
				counter: 0,
				
				update() {
					this.counter++
					
					for(const setValue of this.listeners.values()) {
						setValue(this.counter)
					}
				}
			}
		},
		
		useGlobalState(globalState) {
			const [, setValue] = React.useState()
			
			React.useEffect(() => {
				globalState.listeners.add(setValue)
				return () => {
					globalState.listeners.delete(setValue)
				}
			}, [])
			
			return globalState.value
		},
		
		// 
		
		hijackConstructor(filter, handler) {
			this.constructorReplaces.push({
				filter, handler, index: this.constructorReplaces.length
			})
		},
		
		hijackUseState(filter) {
			if("expectedValue" in filter && filter.filter) {
				throw new TypeError("can't have both filter.expectedValue and filter.filter")
			}
			
			if(Number.isSafeInteger(filter.index)) {
				if(filter.index < 0) {
					throw new TypeError("filter.index is not a positive integer")
				}
				
				filter = {
					...filter,
					index: this.stateIndex + filter.index + 1
				}
				
			} else if(filter.filter) {
				// we good
				
			} else {
				throw new TypeError("neither filter.index or filter.filter is not set")
			}
			
			this.stateQueue.push(filter)
			
			Promise.resolve().then(() => {
				const index = this.stateQueue.indexOf(filter)
				
				if(index !== -1) {
					this.stateQueue.splice(index, 1)
					
					if(IS_DEV_MODE) {
						console.log("failed to resolve hijackUseState", filter)
						alert("failed to resolve hijackUseState")
					}
				}
			})
		},
		
		queryElement(targets, query, depth = 5, matchRoot = false) {
			for(const target of (Array.isArray(targets) ? targets : [targets])) {
				if(!target?.props) {
					continue
				}
				
				if(typeof query === "function") {
					if(query(target)) {
						return target
					}
				} else {
					for(const selector of (Array.isArray(query) ? query : [query])) {
						if(this.selectorMatches(target, selector)) {
							if(!selector.next) {
								return target
							}
							
							const result = this.queryElement(target.props.children, selector.next, depth - 1, selector.direct)
							
							if(result) {
								return result
							}
						}
					}
				}
				
				if(depth >= 2 && !matchRoot) {
					const result = this.queryElement(target.props.children, query, depth - 1, matchRoot)
					
					if(result) {
						return result
					}
				}
			}
			
			return null
		},
		
		//
		
		parseReactStringSelector(selector) {
			assert(!/[[+~]/.exec(selector), "complex selectors not supported")
			const result = []
			
			for(const option of selector.split(/,/)) {
				let directChild = false
				let previous
				
				for(let piece of option.split(/\s+|(?=>)/)) {
					piece = piece.trim()
					if(!piece.length) { continue }
					
					if(piece[0] === ">") {
						assert(!directChild, "duplicate direct child selector")
						directChild = true
						
						if(piece.length === 1) {
							continue
						}
						
						piece = piece.slice(1)
					}
					
					const attributes = piece.split(/(?=[#.])/)
					const obj = {}
					
					if(directChild) {
						obj.direct = true
					}
					
					for(const attr of attributes) {
						if(attr[0] === ".") {
							obj.classList = obj.classList ?? []
							obj.classList.push(attr.slice(1))
						} else if(attr[0] === "#") {
							obj.props = obj.props ?? {}
							obj.props.id = attr.slice(1)
						} else {
							if(attr !== "*") { // unset obj.type acts as universal selector
								obj.type = attr.toLowerCase()
							}
						}
					}
					
					if(previous) {
						previous.next = obj
					} else {
						result.push(obj) // Add first selector to result
					}
					
					previous = obj
					directChild = false
				}
			}
			
			return result
		},

		parseReactSelector(selectors) {
			selectors = Array.isArray(selectors) ? selectors : [selectors]
			const result = []
			
			for(let i = 0, len = selectors.length; i < len; i++) {
				const selector = selectors[i]
				
				if(typeof selector === "string") {
					result.push(...reactHook.parseReactStringSelector(selector))
					continue
				}
				
				if(selector.selector) {
					assert(!selector.next)
					const selectors = reactHook.parseReactStringSelector(selector)
					
					const fillMissingData = targets => {
						for(const target of targets) {
							if(target.next) {
								fillMissingData(target.next)
								continue
							}
							
							for(const key of selector) {
								if(key === "selector") { continue }
								const value = selector[key]
								
								if(Array.isArray(value)) {
									target[key] = target[key] ?? []
									target[key].push(...value)
									
								} else if(typeof value === "object" && value !== null) {
									target[key] = target[key] ?? {}
									Object.assign(target[key], value)
									
								} else {
									target[key] = value
								}
							}
						}
					}
					
					fillMissingData(selectors)
					result.push(...selectors)
					continue
				}
				
				result.push(selector)
			}
			
			return result
		},
		
		//
		
		onCreateElement(result) {
			const type = result.type
			const props = result.props
			
			if(typeof type === "function" && this.functionProxies.get(type) !== false) {
				const handlers = this.constructorReplaces.filter(info => info.filter(result))
				
				if(handlers.length > 0) {
					let proxies = this.functionProxies.get(type)
					
					if(!proxies) {
						proxies = {}
						this.functionProxies.set(type, proxies)
					}
					
					const key = handlers.map(x => x.index).join("_")
					let proxy = proxies[key]
					
					if(!proxy) {
						proxy = type
						
						for(const info of handlers) {
							proxy = new Proxy(proxy, { apply: info.handler })
						}
						
						this.functionProxies.set(proxy, false)
						proxies[key] = proxy
					}
					
					// Okay, this is hacky as heck...
					// There's user level code that breaks if result.type is directly
					// set to proxy, so we need to make it only return proxy when we're
					// not executing a component render function.
					
					Object.defineProperty(result, "type", {
						enumerable: true,
						configurable: true,
						get: () => {
							// According to ReactFiberHooks.js, dispatcher will be set to ContextOnlyDispatcher when not rendering
							const dispatcher = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current
							const isRendering = dispatcher && dispatcher.useCallback !== dispatcher.useEffect
							return isRendering ? type : proxy
						},
						set: x => {
							delete result.type
							result.type = x
						}
					})
				}
			}
			
			//
			
			if(!this.injectingContent) {
				this.injectingContent = true
				
				try {
					const childrenModified = new WeakSet()
					
					for(const content of this.injectedContent) {
						const target = this.queryElement(result, content.selector, 5, true)
						if(!target) { continue }
						
						if(content.action === "append") {
							if(!childrenModified.has(target)) {
								childrenModified.add(target)
								target.props.children = this.flattenChildren(target.props.children)
							}
							
							const children = target.props.children
							let index = 0
							
							if(typeof content.index === "number") {
								index = content.index
							} else if(typeof content.index === "object") {
								for(let i = 0; i < children.length; i++) {
									const child = children[i]
									
									if(child.props && this.selectorMatches(child, content.index.selector)) {
										index = i + (content.index.offset || 0) + 1
										break
									}
								}
							}
							
							children.splice(
								index, 0,
								reactHook.createElement(content.elemType, {
									key: content.elemId,
									id: content.elemId,
									dangerouslySetInnerHTML: { __html: " " }
								})
							)
						} else if(content.callback) {
							const returnValue = content.callback(target, result)
							
							if(returnValue && returnValue !== result) {
								return returnValue
							}
						}
					}
				} finally {
					this.injectingContent = false
				}
			}
			
			return result
		},
		
		inject(data) {
			data = { ...data }
			data.selector = this.parseReactSelector(data.selector)
			
			if(typeof data.index === "object") {
				data.index = { ...data.index }
				data.index.selector = this.parseReactSelector(data.index.selector)
			}
			
			this.injectedContent.push(data)
		},
		
		init() {
			contentScript.listen("reactInject", data => {
				reactHook.inject(data)
			})
			
			onSet(window, "React", React => {
				reactHook.createElement = React.createElement
				
				hijackFunction(React, "createElement", (target, thisArg, args) => {
					let result = target.apply(thisArg, args)
					
					try { result = reactHook.onCreateElement(result) }
					catch(ex) { console.error(ex) }
					
					return result
				})
				
				hijackFunction(React, "useState", (target, thisArg, args) => {
					this.stateIndex += 1
					
					const originalValue = args[0]
					const matches = []
					
					for(let i = 0; i < this.stateQueue.length; i++) {
						const filter = this.stateQueue[i]
						let filterFn = filter.filter
						
						if(filter.index) {
							if(filter.index !== this.stateIndex) {
								continue
							}
							
						} else if(filterFn) {
							if(!filterFn.call(filter, originalValue, args[0])) {
								continue
							}
							
							filterFn = null
						}
						
						this.stateQueue.splice(i--, 1)
						
						if("expectedValue" in filter && originalValue !== filter.expectedValue) {
							continue
						} else if(filterFn && filterFn.call(filter, originalValue, args[0])) {
							continue
						}
						
						if(filter.transform) {
							args[0] = filter.transform(args[0])
						}
						
						matches.push(filter)
					}
					
					let result = target.apply(thisArg, args)
					
					for(const filter of matches) {
						if(filter.transform) {
							hijackFunction(result, 1, (target, thisArg, args) => {
								args[0] = filter.transform(args[0])
								return target.apply(thisArg, args)
							})
						}
						
						if(filter.replace) {
							result = filter.replace(result)
						}
					}
					
					return result
				})
			})
		}
	}
	
	//

	reactHook.init()
	angularHook.init()
	
	Object.assign(window.BTRoblox, {
		settings,
		currentPage,
		IS_DEV_MODE,
		
		contentScript,
		angularHook,
		reactHook,
		
		hijackFunction,
		onReady,
		onSet,
		assert
	})
}
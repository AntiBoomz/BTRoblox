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
		constructorProxies: new WeakMap(),
		constructorReplaces: [],
		elementListeners: [],
		injectedContent: [],
		renderTarget: null,
		
		//
		
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
		
		queryElement(targets, queries, depth = 5, mustMatchRoot = false, all = false) {
			if(!Array.isArray(targets)) { targets = [targets] }
			if(!Array.isArray(queries)) { queries = [queries] }
			
			const temp = all ? [] : null
			
			for(const target of targets) {
				if(!target?.props) {
					continue
				}
				
				for(const query of queries) {
					if(typeof query === "function") {
						if(query(target)) {
							if(all) {
								temp.push(target)
							} else {
								return target
							}
						}
					} else {
						if(this.selectorMatches(target, selector)) {
							if(!selector.next) {
								if(all) {
									if(!temp.includes(target)) {
										temp.push(target)
									}
									continue
								} else {
									return target
								}
							}
							
							const result = this.queryElement(target.props.children, selector.next, depth - 1, selector.direct, all)
							
							if(result) {
								if(all) {
									temp.push(...all)
								} else {
									return result
								}
							}
						}
					}
				}
				
				if(depth >= 2 && !mustMatchRoot) {
					const result = this.queryElement(target.props.children, queries, depth - 1, mustMatchRoot, all)
					
					if(result) {
						if(all) {
							temp.push(...all)
						} else {
							return result
						}
					}
				}
			}
			
			if(all && temp.length > 0) {
				return temp
			}
			
			return null
		},
		
		//
		
		createGlobalState(value) {
			return {
				listeners: new Set(),
				value: value,
				counter: 0,
				
				set(value) {
					this.value = value
					this.update()
				},
				
				update() {
					this.counter++
					
					for(const setValue of this.listeners.values()) {
						setValue(this.counter)
					}
				}
			}
		},
		
		useGlobalState(globalState) {
			const [, setValue] = this.React.useState()
			
			this.React.useEffect(() => {
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
				index: this.constructorReplaces.length,
				filter, handler
			})
		},
		
		hijackElement(filter, handler) {
			this.elementListeners.push({ filter, handler })
		},
		
		hijackUseState(filter, transform) {
			const renderTarget = this.renderTarget
			
			if(!renderTarget) {
				throw new TypeError("not in a render method")
			}
			
			if(!renderTarget.hijackState) { renderTarget.hijackState = [] }
			renderTarget.hijackState.push({ filter, transform })
		},
		
		//
		
		parseReactStringSelector(selector) {
			assert(!/[[+~]/.exec(selector), "complex selectors not supported")
			const result = []
			
			for(const option of selector.split(/,/)) {
				let nextIsDirect = false
				let previous
				
				for(let piece of option.split(/\s+|(?=>)/)) {
					piece = piece.trim()
					if(!piece.length) { continue }
					
					if(piece[0] === ">") {
						assert(!nextIsDirect, "duplicate direct child selector")
						nextIsDirect = true
						
						if(piece.length === 1) {
							continue
						}
						
						piece = piece.slice(1)
					}
					
					const attributes = piece.split(/(?=[#.])/)
					const obj = {}
					
					if(nextIsDirect) {
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
					nextIsDirect = false
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
		
		flatten(children) {
			return (Array.isArray(children) ? children : [children]).flat(16)
		},
		
		applyInjectedContent(root) {
			const recurse = (targets, matches, depth, direct=false) => {
				let modifiedTargets = false
				
				targets = reactHook.flatten(targets)
				
				for(let targetIndex = 0; targetIndex < targets.length; targetIndex++) {
					const target = targets[targetIndex]
					
					if(!target?.props) {
						continue
					}
					
					const childMatches = []
					
					for(const { selector, content } of matches) {
						if(this.selectorMatches(target, selector)) {
							if(selector.next) {
								childMatches.push({ selector: selector.next, content })
							} else {
								if(content.action) {
									if(content.action === "append") {
										const children = reactHook.flatten(target.props.children)
										let index = 0
										
										if(typeof content.index === "number") {
											index = content.index
										} else if(typeof content.index === "object") {
											for(let i = 0; i < children.length; i++) {
												const child = children[i]
												
												if(child.props && reactHook.selectorMatches(child, content.index.selector)) {
													index = i + (content.index.offset || 0) + 1
													break
												}
											}
										}
										
										children.splice(
											index, 0,
											this.React.createElement(content.elemType, {
												key: content.elemId,
												id: content.elemId,
												dangerouslySetInnerHTML: { __html: " " }
											})
										)
										
										target.props.children = children
									}
								} else {
									try {
										const replace = content.callback(target, root, content)
										
										if(replace && replace !== target) {
											targets[targetIndex] = replace
											modifiedTargets = true
										}
									} catch(ex) {
										console.error(ex)
									}
								}
							}
						}
						
						if(!selector.direct && !direct) {
							childMatches.push({ selector, content })
						}
					}
					
					if(childMatches.length > 0 && depth > 0) {
						const newChildren = recurse(target.props.children, childMatches, depth - 1, false)
						
						if(newChildren) {
							target.props.children = newChildren
						}
					}
				}
				
				return modifiedTargets ? targets : null
			}
			
			const matches = []
			
			for(const content of this.injectedContent) {
				for(const selector of content.selector) {
					matches.push({ selector, content })
				}
			}
			
			return recurse([root], matches, 5, true)
		},
		
		getProxy(type, props) {
			let typeFn
			let key
			
			if(typeof type === "function") {
				typeFn = type
			} else if(typeof type === "object") {
				if(typeof type.render === "function") {
					typeFn = type.render
					key = "render"
				} else if(typeof type.type === "function") {
					typeFn = type.type
					key = "type"
				}
			}
			
			if(!typeFn) {
				return null
			}
			
			const handlers = this.constructorReplaces.filter(info => info.filter(typeFn, props))
			
			if(!handlers.length) {
				return null
			}
			
			let cache = this.constructorProxies.get(type)
			
			if(!cache) {
				cache = {}
				this.constructorProxies.set(type, cache)
			}
			
			const cacheKey = handlers.map(x => x.index).join("_")
			let proxy = cache[cacheKey]
			
			if(!proxy) {
				proxy = typeFn
				
				for(const info of handlers) {
					proxy = new Proxy(proxy, { apply: info.handler })
				}
				
				if(key) {
					const fnProxy = proxy
					
					proxy = new Proxy(type, {
						get(target, _key) {
							return _key === key ? fnProxy : target[_key]
						}
					})
				}
				
				this.constructorProxies.set(proxy, false)
				cache[cacheKey] = proxy
			}
			
			return proxy
		},
		
		onCreateElement(target, thisArg, args) {
			let result = target.apply(thisArg, args)
			
			try {
				const type = result.type
				
				if(this.constructorProxies.get(type) !== false) {
					const proxy = this.getProxy(type, result.props)
					
					if(proxy) {
						// Okay, this is hacky as heck...
						// There's user level code that breaks if result.type is directly
						// set to proxy, so we need to make it only return proxy when we're
						// not rendering a component.
						
						Object.defineProperty(result, "type", {
							configurable: true,
							get() {
								return reactHook.renderTarget ? type : proxy
							},
							set: x => {
								delete result.type
								result.type = x
							}
						})
					}
				}
			} catch(ex) {
				console.error(ex)
			}
			
			for(const { filter, handler } of this.elementListeners) {
				try {
					if(filter(result)) {
						handler(result)
					}
				} catch(ex) {
					console.error(ex)
				}
			}
			
			try {
				const newResult = this.applyInjectedContent(result)
				
				if(newResult) {
					result = newResult[0]
				}
			} catch(ex) {
				console.error(ex)
			}
			
			return result
		},
		
		onUseState(target, thisArg, args) {
			const renderTarget = this.renderTarget
			
			if(!renderTarget?.hijackState) {
				const result = target.apply(thisArg, args)
				
				if(renderTarget) {
					renderTarget.state.push(result)
				}
				
				return result
			}
				
			const stateIndex = renderTarget.state.length
			const matching = []
			
			for(const filter of renderTarget.hijackState) {
				if(!filter.resolved && filter.filter(args[0], stateIndex)) {
					filter.resolved = true
					
					if(filter.transform) {
						args[0] = filter.transform(args[0], true)
					}
					
					matching.push(filter)
				}
			}
			
			const result = target.apply(thisArg, args)
			
			for(const filter of matching) {
				if(filter.transform) {
					result[1] = new Proxy(result[1], {
						apply(target, thisArg, args) {
							args[0] = filter.transform(args[0], false)
							return target.apply(thisArg, args)
						}
					})
				}
			}
			
			renderTarget.state.push(result)
			
			return result
		},
		
		onReact(_react) {
			this.React = _react
			
			hijackFunction(this.React, "createElement", this.onCreateElement.bind(this))
			hijackFunction(this.React, "useState", this.onUseState.bind(this))
			
			const dispatcher = this.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher
			let current = dispatcher.current
			
			// let lastFiber
				
			// Object.defineProperty(Object.prototype, "updateQueue", {
			// 	configurable: true,
			// 	get() { return undefined },
			// 	set(value) {
			// 		Object.defineProperty(this, "updateQueue", {
			// 			enumerable: true,
			// 			configurable: true,
			// 			get() { return value },
			// 			set(_value) {
			// 				value = _value
							
			// 				if(value === null) {
			// 					lastFiber = this
			// 				}
			// 			}
			// 		})
			// 	}
			// })
			
			Object.defineProperty(dispatcher, "current", {
				enumerable: true,
				get() { return current },
				set(value) {
					current = value
					
					// According to ReactFiberHooks.js, current will be set to ContextOnlyDispatcher when not rendering
					if(current && current.useCallback !== current.useEffect) {
						reactHook.renderTarget = {
							// fiber: lastFiber,
							state: []
						}
					} else {
						reactHook.renderTarget = null
					}
				}
			})
		},
		
		createElement(...args) {
			return this.React.createElement(...args)
		},
		
		//
		
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
			contentScript.listen("reactInject", data => reactHook.inject(data))
			onSet(window, "React", this.onReact.bind(this))
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
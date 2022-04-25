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
	
	//
	
	const contentScript = {
		messageListeners: {},
		listening: false,
		
		send(action, ...args) {
			BTRoblox.element.dispatchEvent(new CustomEvent(`content`, { detail: { action, args } }))
		},
		listen(action, callback) {
			this.messageListeners[action] = this.messageListeners[action] || []
			this.messageListeners[action].push(callback)
			
			if(!this.listening) {
				this.listening = true
				
				BTRoblox.element.addEventListener(`inject`, ev => {
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
						args.forEach((x, i) => argMap[injects[i]] = x)
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
		constructorReplaces: [],
		injectedContent: [],
		
		stateQueue: [],
		stateIndex: 0,
		
		// Content injection
		
		processContent(args) {
			const props = args[1]
			
			const rootElem = {
				type: args[0],
				key: props.key,
				props: {
					...props,
					key: null,
					children: args.slice(2)
				}
			}
			
			const childrenModified = new WeakSet()
			
			for(const content of this.injectedContent) {
				const target = this.contentQuery(content.selector, rootElem)
				if(!target) { continue }
				
				if(!childrenModified.has(target)) {
					childrenModified.add(target)
					target.props.children = this.flattenChildren(target.props.children)
					
					if(target === rootElem) {
						args.splice(2, args.length - 2, target.props.children)
					}
				}
				
				const children = target.props.children
				let index = 0
				
				if(typeof content.index === "number") {
					index = content.index
				} else if (typeof content.index === "object") {
					for(let i = 0; i < children.length; i++) {
						const child = children[i]
						
						if(child.props && this.selectorsMatch(content.index.selector, child)) {
							index = i + (content.index.offset || 0) + 1
							break
						}
					}
				}
				
				children.splice(
					index,
					0,
					React.createElement(content.elemType, {
						key: content.elemId,
						id: content.elemId,
						dangerouslySetInnerHTML: { __html: " " }
					})
				)
			}
		},
		
		flattenChildren(children) {
			return (Array.isArray(children) ? children : [children]).flat(16)
		},
		
		selectorMatches(selector, elem) {
			if(!elem.props) {
				return false
			}
			
			if(selector.type && (typeof elem.type !== "string" || selector.type.toLowerCase() !== elem.type.toLowerCase())) {
				return false
			}
			
			if(selector.key && selector.key !== elem.key) {
				return false
			}
			
			if(selector.hasProps) {
				for(const key of selector.hasProps) {
					if(!(key in elem.props)) {
						return false
					}
				}
			}
			
			if(selector.props) {
				for(const key in selector.props) {
					if(selector.props[key] !== elem.props[key]) {
						return false
					}
				}
			}
			
			if(selector.classList) {
				const classes = elem.props.className?.split(/\s+/g) ?? []
				
				for(const className of selector.classList) {
					if(!classes.includes(className)) {
						return false
					}
				}
			}
		
			return true
		},
		
		selectorsMatch(selectors, elem) {
			for(const selector of selectors) {
				if(this.selectorMatches(selector, elem)) {
					return true
				}
			}
			
			return false
		},
		
		contentQuery(selectors, elem) {
			for(const selector of selectors) {
				if(!this.selectorMatches(selector, elem)) { continue }
				
				if(selector.next) {
					let current = [elem.props.children]
					let next = []
					
					let depth = 0
					while(current.length && depth < 4) {
						for(const list of current) {
							for(const child of this.flattenChildren(list)) {
								if(!child?.props) { continue }
								
								if(this.selectorMatches(selector.next, child)) {
									return child
								}
								
								if(child.props.children) {
									next.push(child.props.children)
								}
							}
						}
						
						current = next
						next = []
						depth++
					}
					
					return null
				} else {
					return elem
				}
			}
			
			return null
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
				filter, handler
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
		
		queryElement(self, filter, n = 5) {
			if(self && filter(self)) {
				return self
			}
			
			let children = self?.props?.children
			if(!children) { return }
			
			if(!Array.isArray(children)) {
				children = [children]
			}
			
			for(const child of children) {
				if(filter(child)) {
					return child
				}
			}
			
			if(n >= 2) {
				for(const child of children) {
					const result = reactHook.queryElement(child, filter, n - 1)
					if(result) {
						return result
					}
				}
			}
		},
		
		//
		
		onCreateElement(args) {
			const props = args[1]
			
			if(typeof args[0] === "function") {
				let handler = args[0]
				
				for(const info of this.constructorReplaces) {
					if(info.filter(args)) {
						handler = new Proxy(handler, { apply: info.handler })
					}
				}
				
				args[0] = handler
			}
			
			if(props?.dangerouslySetInnerHTML?.__html !== " ") { // Skip our own elems
				this.processContent(args)
			}
		},
		
		init() {
			contentScript.listen("reactInject", data => {
				this.injectedContent.push(data)
			})
			
			onSet(window, "React", React => {
				hijackFunction(React, "createElement", (target, thisArg, args) => {
					if(args[1] == null) {
						args[1] = {}
					}
					
					try { reactHook.onCreateElement(args) }
					catch(ex) { console.error(ex) }
					
					return target.apply(thisArg, args)
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
		hijackAngular: angularHook.hijackModule.bind(angularHook),
		onReady,
		onSet
	})
}
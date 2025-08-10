"use strict"

document.addEventListener("btroblox/init", ev => {
	const [settings, IS_DEV_MODE, selectedRobuxToCashOption] = ev.detail
	
	const BTRoblox = window.BTRoblox = { element: document.querySelector("btroblox") }
	let currentPage
	
	const util = {
		ready(fn) {
			if(document.readyState === "loading") {
				document.addEventListener("DOMContentLoaded", fn, { once: true })
			} else {
				Promise.resolve().then(fn)
			}
		},
		
		assert(bool, ...args) {
			if(!bool) { throw new Error(...args) }
			return bool
		}
	}
	
	const onSet = (a, b, c) => {
		if(a[b]) { return c(a[b]) }
		
		let descriptor
		try { descriptor = Object.getOwnPropertyDescriptor(a, b) } catch(ex) {}
		
		Object.defineProperty(a, b, {
			enumerable: false,
			configurable: true,
			set(v) {
				delete a[b]
				try { Object.defineProperty(a, b, descriptor) } catch(ex) {}
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
	
	const xhrTransforms = []
	
	const hijackXHR = fn => {
		xhrTransforms.push(fn)
		
		if(xhrTransforms.length === 1) {
			const xhrDetails = new WeakMap()
			
			hijackFunction(window, "fetch", (target, thisArg, args) => {
				let [url, params] = args
				
				if(typeof url === "string") {
					const request = {
						...(params || {}),
						method: params?.method || "GET",
						url: url,
						onRequest: [],
						onResponse: []
					}
					
					for(const fn of xhrTransforms) {
						try { fn(request) }
						catch(ex) { console.error(ex) }
					}
					
					for(const fn of request.onRequest) {
						try { fn(request) }
						catch(ex) { console.error(ex) }
					}
					
					args[1] = { ...request }
					
					delete args[1].url
					delete args[1].onRequest
					delete args[1].onResponse
					
					const hijackResponse = res => {
						if(!request.onResponse.length) { return res }
						
						hijackFunction(res, "clone", (target, thisArg, args) => {
							return hijackResponse(target.apply(thisArg, args))
						})
						
						hijackFunction(res, "json", (target, thisArg, args) => {
							const promise = target.apply(thisArg, args)
							
							return promise.then(json => {
								for(const fn of request.onResponse) {
									try { fn(json, request) }
									catch(ex) { console.error(ex) }
								}
								
								return json
							})
						})
						
						hijackFunction(res, "text", (target, thisArg, args) => {
							const promise = target.apply(thisArg, args)
							
							return promise.then(text => {
								try {
									const json = JSON.parse(text)
									
									for(const fn of request.onResponse) {
										try { fn(json, request) }
										catch(ex) { console.error(ex) }
									}
									
									text = JSON.stringify(json)
								} catch(ex) {
									console.error(ex)
								}
								
								return text
							})
						})
						
						return res
					}
					
					return target.apply(thisArg, args).then(hijackResponse)
				}
				
				return target.apply(thisArg, args)
			})
			
			hijackFunction(XMLHttpRequest.prototype, "open", (target, xhr, args) => {
				const method = args[0]
				const url = args[1]
				
				xhrDetails.delete(xhr)
				
				if(typeof method === "string" && typeof url === "string") {
					const request = {
						method: method,
						url: url,
						onRequest: [],
						onResponse: []
					}
					
					for(const fn of xhrTransforms) {
						try { fn(request) }
						catch(ex) { console.error(ex) }
					}
					
					if(request.onResponse.length) {
						const responseText = {
							configurable: true,
							
							get() {
								delete xhr.responseText
								let text = xhr.responseText
								
								try {
									const json = JSON.parse(text)
									
									for(const fn of request.onResponse) {
										try { fn(json, request) }
										catch(ex) { console.error(ex) }
									}
									
									text = JSON.stringify(json)
								} catch(ex) {
									console.error(ex)
								}
								
								Object.defineProperty(xhr, "responseText", responseText)
								return text
							}
						}
						
						Object.defineProperty(xhr, "responseText", responseText)
					}
					
					args[0] = request.method
					args[1] = request.url
					
					if(request.onRequest.length) {
						xhrDetails.set(xhr, request)
					}
				}
				
				return target.apply(xhr, args)
			})
			
			hijackFunction(XMLHttpRequest.prototype, "send", (target, xhr, args) => {
				const request = xhrDetails.get(xhr)
				
				if(request) {
					xhrDetails.delete(xhr)
					
					request.body = args[0]
					
					for(const fn of request.onRequest) {
						try { fn(request) }
						catch(ex) { console.error(ex) }
					}
					
					args[0] = request.body
				}
				
				return target.apply(xhr, args)
			})
		}
	}
	
	//
	
	const formatNumber = num => String(num).replace(/(\d\d*?)(?=(?:\d{3})+(?:\.|$))/yg, "$1,")
	
	const RobuxToCash = {
		selectedRobuxToCashOption: selectedRobuxToCashOption,
		
		getSelectedOption() {
			return this.selectedRobuxToCashOption
		},
		convert(robux) {
			const option = this.getSelectedOption()
			
			const cash = Math.round((robux * option.cash) / option.robux + 0.4999) / 100
			const cashString = formatNumber(cash.toFixed(option.currency.numFractions))
			
			return `${option.currency.symbol}${cashString}`
		}
	}
	
	const contentScript = {
		messageListeners: {},
		
		send(action, ...args) {
			BTRoblox.element.dispatchEvent(new CustomEvent(`btroblox/content/${action}`, { detail: args }))
		},
		listen(action, callback) {
			let listeners = this.messageListeners[action]
			
			if(!listeners) {
				listeners = this.messageListeners[action] = []
				
				BTRoblox.element.addEventListener(`btroblox/inject/${action}`, ev => {
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
						const argsMap = {}
						
						for(const [i, arg] of Object.entries(args)) {
							argsMap[injects[i]] = arg
						}
						
						return callback(target, thisArg, args, argsMap)
					})
				}
			}
			
			if(typeof data[1] === "function") {
				hijack(data, 1, data[1].$inject)
			} else {
				hijack(data, data.length - 1, data)
			}
		},
		
		applyConfig(module, config, callback) {
			const injects = config[2][0]
			
			if(typeof injects[injects.length - 1] !== "function") { return }
			
			hijackFunction(injects, injects.length - 1, (target, thisArg, args) => {
				const argsMap = {}
				
				for(let i = 0; i < injects.length - 1; i++) {
					argsMap[injects[i]] = args[i]
				}
				
				return callback(target, thisArg, args, argsMap)
			})
		},
		
		//
		
		hijackModule(moduleName, objects) {
			let module
			
			try { module = angular.module(moduleName) }
			catch(ex) {}
			
			if(module) {
				for(const entry of module._invokeQueue) {
					const callback = objects[entry[2][0]]
					if(callback) {
						this.applyEntry(module, entry, callback)
					}
				}
			}
			
			for(const [name, callback] of Object.entries(objects)) {
				this.moduleListeners[moduleName] = this.moduleListeners[moduleName] ?? {}
				this.moduleListeners[moduleName][name] = this.moduleListeners[moduleName][name] ?? []
				this.moduleListeners[moduleName][name].push(callback)
			}
		},
		
		hijackConfig(moduleName, callback) {
			let module
			
			try { module = angular.module(moduleName) }
			catch(ex) {}
			
			if(module) {
				for(const config of module._configBlocks) {
					this.applyConfig(module, config, callback)
				}
			}
			
			this.moduleListeners[moduleName] = this.moduleListeners[moduleName] ?? {}
			this.moduleListeners[moduleName].__configs = this.moduleListeners[moduleName].__configs ?? []
			this.moduleListeners[moduleName].__configs.push(callback)
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
			
			const route = (queue, callback) => {
				for(const entry of queue) {
					callback(entry)
				}
				
				const init = (target, thisArg, args) => {
					for(const entry of args) {
						callback(entry)
					}
					
					return target.apply(thisArg, args)
				}
				
				hijackFunction(queue, "unshift", init)
				hijackFunction(queue, "push", init)
			}
			
			route(module._configBlocks, config => {
				const listeners = this.moduleListeners[module.name]?.__configs
				if(!listeners) { return }
				
				for(const callback of listeners) {
					this.applyConfig(module, config, callback)
				}
			})
			
			route(module._invokeQueue, entry => {
				const name = entry[2][0]
				
				const listeners = this.moduleListeners[module.name]?.[name]
				if(!listeners) { return }
				
				for(const callback of listeners) {
					this.applyEntry(module, entry, callback)
				}
			})
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
		cachedSelectors: {},
		constructorProxies: new WeakMap(),
		constructorReplaces: [],
		injectedContent: [],
		globalHijackState: [],
		renderTarget: null,
		
		//
		
		parseReactStringSelector(selector) {
			if(this.cachedSelectors[selector]) {
				return this.cachedSelectors[selector]
			}
			
			util.assert(!/[[+~]/.exec(selector), "complex selectors not supported")
			const result = []
			
			for(const option of selector.split(/,/)) {
				let nextIsDirect = false
				let previous
				
				for(let piece of option.split(/\s+|(?=>)/)) {
					piece = piece.trim()
					if(!piece.length) { continue }
					
					if(piece[0] === ">") {
						util.assert(!nextIsDirect, "duplicate direct child selector")
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
			
			this.cachedSelectors[selector] = result
			
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
				
				// if(selector.selector) {
				// 	util.assert(!selector.next)
				// 	const selectors = reactHook.parseReactStringSelector(selector)
				
				// 	const fillMissingData = targets => {
					// 		for(const target of targets) {
				// 			if(target.next) {
				// 				fillMissingData(target.next)
				// 				continue
				// 			}
				
				// 			for(const key of selector) {
				// 				if(key === "selector") { continue }
				// 				const value = selector[key]
				
				// 				if(Array.isArray(value)) {
				// 					target[key] = target[key] ?? []
				// 					target[key].push(...value)
				
				// 				} else if(typeof value === "object" && value !== null) {
				// 					target[key] = target[key] ?? {}
				// 					Object.assign(target[key], value)
				
				// 				} else {
					// 					target[key] = value
				// 				}
				// 			}
				// 		}
				// 	}
				
				// 	fillMissingData(selectors)
				// 	result.push(...selectors)
				// 	continue
				// }
				
				result.push(selector)
			}
			
			return result
		},
		
		selectorMatches(elem, selectors) {
			if(!elem?.props) {
				return false
			}
			
			main:
			for(const selector of this.parseReactSelector(selectors)) {
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
		
		queryElement(targets, queries, depth = 5, mustMatchRoot = false, all = false, path = false) {
			if(all && path) { throw Error("Can't do both all and path") }
			
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
							} else if(path) {
								return [target]
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
								} else if(path) {
									return [target]
								} else {
									return target
								}
							}
							
							const result = this.queryElement(target.props.children, selector.next, depth - 1, selector.direct, all, path)
							
							if(result) {
								if(all) {
									temp.push(...all)
								} else if(path) {
									result.unshift(target)
									return result
								} else {
									return result
								}
							}
						}
					}
				}
				
				if(depth >= 2 && !mustMatchRoot) {
					const result = this.queryElement(target.props.children, queries, depth - 1, mustMatchRoot, all, path)
					
					if(result) {
						if(all) {
							temp.push(...all)
						} else if(path) {
							result.unshift(target)
							return result
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
		
		_queryList(list, selectors, depth, all = false, path = false) {
			for(const child of list) {
				if(Array.isArray(child)) {
					const result = this._queryList(child, selectors, depth, all, path)
					
					if(result) {
						return result
					}
					
				} else if(child?.props) {
					const newSelectors = []
					let matches = false
					
					for(const selector of selectors) {
						if(typeof selector === "function") {
							if(selector(child)) {
								matches = true
								if(!all) { break }
							}
						} else {
							if(reactHook.selectorMatches(child, selector)) {
								if(selector.next) {
									newSelectors.push(selector.next)
								} else {
									matches = true
									if(!all) { break }
								}
							}
							
							if(!selector.direct) {
								newSelectors.push(selector)
							}
						}
					}
					
					if(matches) {
						if(all) {
							if(path) {
								all.push([...path, child])
							} else {
								all.push(child)
							}
						} else {
							if(path) {
								path.push(child)
								return path
							} else {
								return child
							}
						}
					}
					
					if(newSelectors.length > 0 && depth > 0) {
						if(path) { path.push(child) }
						const result = this._queryList([child.props.children], newSelectors, depth - 1, all, path)
						if(path) { path.pop() }
						
						if(result) {
							return result
						}
					}
				}
			}
		},
		
		querySelector(element, selectors, depth = 5, path = false) {
			if(!element?.props) { return null }
			selectors = this.parseReactSelector(selectors)
			
			return this._queryList([element.props.children], selectors, depth, false, path ? [element] : null)
		},
		
		querySelectorAll(element, selectors, depth = 5, path = false) {
			if(!element?.props) { return null }
			selectors = this.parseReactSelector(selectors)
			
			const all = []
			this._queryList([element.props.children], selectors, depth, all, path ? [element] : null)
			
			return all
		},
		
		//
		
		wrappedProto: {
			btrIsWrapped: true,
			
			matches(selector) {
				return reactHook.selectorMatches(this[0], selector)
			},
			
			parent() {
				if(this.path?.length >= 2) {
					const wrapped = reactHook.wrap(this.path.at(-2))
					wrapped.path = this.path.slice(0, -1)
					return wrapped
				}
				return null
			},
			
			prepend(elem) {
				let children = this[0].props.children
				
				if(!children) {
					children = this[0].props.children = []
				} else if(!Array.isArray(children)) {
					children = this[0].props.children = [children]
				}
				
				children.unshift(elem.btrIsWrapped ? elem[0] : elem)
			},
			
			append(elem) {
				let children = this[0].props.children
				
				if(!children) {
					children = this[0].props.children = []
				} else if(!Array.isArray(children)) {
					children = this[0].props.children = [children]
				}
				
				children.push(elem.btrIsWrapped ? elem[0] : elem)
			},
			
			replaceWith(elem) {
				this.before(elem)
				this.remove()
			},
			
			remove() {
				const parent = this.path?.length >= 2 ? this.path.at(-2) : null
				if(!parent) { return }
				
				let children = parent.props.children
				
				if(!children) {
					children = parent.props.children = []
				} else if(!Array.isArray(children)) {
					children = parent.props.children = [children]
				}
				
				let index = children.indexOf(this[0])
				
				if(index === -1) {
					children = parent.props.children = children.flat(16)
					index = children.indexOf(this[0])
				}
				
				if(index !== -1) {
					children.splice(index, 1)
				}
			},
			
			before(...elems) {
				const parent = this.path?.length >= 2 ? this.path.at(-2) : null
				if(!parent) { return }
				
				let children = parent.props.children
				
				if(!children) {
					children = parent.props.children = []
				} else if(!Array.isArray(children)) {
					children = parent.props.children = [children]
				}
				
				let index = children.indexOf(this[0])
				
				if(index === -1) {
					children = parent.props.children = children.flat(16)
					index = children.indexOf(this[0])
				}
				
				if(index !== -1) {
					for(const elem of elems) {
						children.splice(index, 0, elem.btrIsWrapped ? elem[0] : elem)
						index += 1
					}
				}
			},
			
			after(...elems) {
				const parent = this.path?.length >= 2 ? this.path.at(-2) : null
				if(!parent) { return }
				
				let children = parent.props.children
				
				if(!children) {
					children = parent.props.children = []
				} else if(!Array.isArray(children)) {
					children = parent.props.children = [children]
				}
				
				let index = children.indexOf(this[0])
				
				if(index === -1) {
					children = parent.props.children = children.flat(16)
					index = children.indexOf(this[0])
				}
				
				if(index !== -1) {
					for(const elem of elems) {
						children.splice(index + 1, 0, elem.btrIsWrapped ? elem[0] : elem)
						index += 1
					}
				}
			},
			
			find(selector, depth = 5) {
				const path = reactHook.querySelector(this[0], selector, depth, true)
				if(!path) { return null }
				
				const wrapped = reactHook.wrap(path.at(-1))
				wrapped.path = path
				
				return wrapped
			}
		},
		
		unwrap(elem) {
			return elem?.btrIsWrapped ? elem[0] : elem
		},
		
		wrap(reactElement) {
			const wrapped = { [0]: reactElement, __proto__: this.wrappedProto }
			return wrapped
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
		
		hijackUseState(filter, transform, permanent) {
			const renderTarget = this.renderTarget
			
			if(!renderTarget) {
				throw new TypeError("not in a render method")
			}
			
			if(!renderTarget.hijackState) { renderTarget.hijackState = [] }
			renderTarget.hijackState.push({ filter, transform, permanent })
		},
		
		hijackUseStateGlobal(filter, transform) {
			this.globalHijackState.push({ filter, transform })
		},
		
		inject(selector, callback) {
			this.injectedContent.push({
				selector: this.parseReactSelector(selector),
				callback: callback
			})
		},
		
		//
		
		flatten(children) {
			return (Array.isArray(children) ? children : [children]).flat(16)
		},
		
		nextConstructorReplace(render, index, thisArg, args) {
			for(; index < reactHook.constructorReplaces.length; index++) {
				const info = reactHook.constructorReplaces[index]
				
				if(info.filter(render, args[0])) {
					return info.handler(function(...args) {
						return reactHook.nextConstructorReplace(render, index + 1, this, args)
					}, thisArg, args)
				}
			}
			
			return render.apply(thisArg, args)
		},
		
		renderProxyProps: {
			apply(render, thisArg, args) {
				if(reactHook.renderTarget) {
					return reactHook.nextConstructorReplace(render, 0, thisArg, args)
				}
				
				return render.apply(thisArg, args)
			}
		},
		
		applyProxy(result) {
			const type = result.type
			if(!type) { return }
			
			let target, key, render
			
			if(typeof type === "function") {
				if(type.prototype?.isReactComponent) {
					target = type.prototype
					key = "render"
					render = type.prototype.render
				} else {
					target = result
					key = "type"
					render = type
				}
			} else if(typeof type === "object") {
				if(typeof type.render === "function") {
					target = type
					key = "render"
					render = type.render
				} else if(typeof type.type === "function") {
					target = type
					key = "type"
					render = type.type
				}
			}
			
			if(typeof render === "function" && !this.constructorProxies.get(render)) {
				const proxy = new Proxy(render, this.renderProxyProps)
				this.constructorProxies.set(proxy, true)
				target[key] = proxy
			}
		},
		
		onCreateElement(target, thisArg, args) {
			let result = target.apply(thisArg, args)
			
			for(const content of this.injectedContent) {
				try {
					const matching = []
					let wrapped
					
					for(const selector of content.selector) {
						if(reactHook.selectorMatches(result, selector)) {
							if(selector.next) {
								matching.push(selector)
							} else {
								if(!wrapped) { wrapped = reactHook.wrap(result) }
								
								const replaced = content.callback(wrapped)
								
								if(replaced) {
									if(!replaced?.props) {
										return replaced
									}
									
									result = reactHook.unwrap(replaced)
									wrapped = null
								}
							}
						}
					}
					
					if(matching.length > 0) {
						for(const path of reactHook.querySelectorAll(result, matching, 5, true)) {
							const wrapped = reactHook.wrap(path.at(-1))
							wrapped.path = path
							
							content.callback(wrapped)
						}
					}
					
				} catch(ex) {
					console.error(ex)
				}
			}
			
			return result
		},
		
		onUseState(target, thisArg, args) {
			const renderTarget = this.renderTarget
			
			if(!renderTarget) {
				return target.apply(thisArg, args)
			}
			
			const stateIndex = renderTarget.state.length
			const matching = []
			
			const run = (list, canResolve) => {
				for(const filter of list) {
					if(!filter.resolved && filter.filter(args[0], stateIndex)) {
						if(canResolve) {
							filter.resolved = true
						}
						
						if(filter.transform) {
							args[0] = filter.transform(args[0], true)
						}
						
						matching.push(filter)
					}
				}
			}
			
			if(renderTarget.hijackState) {
				run(renderTarget.hijackState, !renderTarget.permanent)
			}
			
			run(this.globalHijackState)
			
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
			
			Object.defineProperty(Object.prototype, "lanes", {
				configurable: true,
				get() { return undefined },
				set(value) {
					Object.defineProperty(this, "lanes", {
						enumerable: true,
						configurable: true,
						writable: true,
						value: value
					})
					
					if("tag" in this && "pendingProps" in this) {
						const fiber = this
						
						if(!fiber.btrAttached) {
							fiber.btrAttached = true
							
							let type = fiber.type
							try {
								reactHook.applyProxy(fiber)
							} catch(ex) {
								console.error(ex)
							}
							
							Object.defineProperty(fiber, "type", {
								configurable: true,
								get() { return type },
								set(newType) {
									type = newType
									try {
										reactHook.applyProxy(fiber)
									} catch(ex) {
										console.error(ex)
									}
								}
							})
						}
					}
					
					// console.log("fiber?", this)
					
					// Object.defineProperty(this, "updateQueue", {
					// 	enumerable: true,
					// 	configurable: true,
					// 	get() { return value },
					// 	set(_value) {
					// 		value = _value
					
					// 		if(value === null) {
					// 			lastFiber = this
					// 		}
					// 	}
					// })
				}
			})
			
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
		
		init() {
			onSet(window, "React", this.onReact.bind(this))
			onSet(window, "ReactJSX", jsx => {
				hijackFunction(jsx, "jsxs", this.onCreateElement.bind(this))
				hijackFunction(jsx, "jsx", this.onCreateElement.bind(this))
			})
		}
	}
	
	//
	
	const injectedFunctions = {
		// Insert injected functions here,
		"assetRefinement": () => {
			onSet(window, "Roblox", Roblox => {
				onSet(Roblox, "AvatarAccoutrementService", AvatarAccoutrementService => {
					let wearingAssets
					let avatarRules
					
					hijackFunction(AvatarAccoutrementService, "removeAssetFromAvatar", (target, thisArg, args) => {
						if(args[0] === "btrGetWearingAssets") {
							wearingAssets = args[1]
							throw "BTRoblox: abort (this should never be visible)"
						}
						
						return target.apply(thisArg, args)
					})
					
					angularHook.hijackModule("avatar", {
						avatarController(target, thisArg, args, argsMap) {
							const result = target.apply(thisArg, args)
							
							try {
								const { $scope, avatarConstantService } = argsMap
								
								const updateWearingAssets = () => {
									if(!wearingAssets || !avatarRules) { return }
									
									for(const item of wearingAssets) {
										if(avatarRules.accessoryRefinementTypes.includes(item.assetType.id)) {
											if(!item.meta) { item.meta = { version: 1 } }
											if(!item.meta.position) { item.meta.position = { X: 0, Y: 0, Z: 0 } }
											if(!item.meta.rotation) { item.meta.rotation = { X: 0, Y: 0, Z: 0 } }
											if(!item.meta.scale) { item.meta.scale = { X: 1, Y: 1, Z: 1 } }
										}
									}
								}
								
								$scope.btrUpdateItem = item => {
									if(item.meta?.scale && item.btrScale) {
										item.meta.scale.X = item.btrScale
										item.meta.scale.Y = item.btrScale
										item.meta.scale.Z = item.btrScale
									}
									
									$scope.onHatSlotClicked({ id: -1, assetType: { id: 8, name: "Hat" } })
								}
								
								$scope.btrRefreshWearingAssets = () => {
									try { $scope.onHatSlotClicked("btrGetWearingAssets") }
									catch(ex) {}
									
									$scope.btrWearingAssets = wearingAssets || []
									updateWearingAssets()
								}
								
								$scope.btrRefreshWearingAssets()
								
								$scope.$on(avatarConstantService.events.wornAssetsChanged, (event, assetIds) => {
									$scope.btrRefreshWearingAssets()
								})
								
								$scope.$on(avatarConstantService.events.avatarRulesLoaded, (event, rules) => {
									$scope.btrAvatarRules = avatarRules = rules
									$scope.btrBounds = {}
									
									for(const [assetTypeName, lowerBounds] of Object.entries(avatarRules.accessoryRefinementLowerBounds)) {
										const upperBounds = avatarRules.accessoryRefinementUpperBounds[assetTypeName]
										
										const wearableAssetType = avatarRules.wearableAssetTypes.find(x => x.name.replace(/\s/, "") === assetTypeName)
										const assetBounds = $scope.btrBounds[wearableAssetType?.id] = {}
										
										for(const [category, values] of Object.entries(lowerBounds)) {
											const bounds = assetBounds[category] = {}
											
											for(const [key, value] of Object.entries(values)) {
												bounds[key.slice(0, 1).toUpperCase()] = {
													min: value,
													max: upperBounds[category][key]
												}
											}
										}
									}
									
									updateWearingAssets()
								})
								
							} catch(ex) {
								console.error(ex)
								if(IS_DEV_MODE) { alert("hijackAngular Error") }
							}
							
							return result
						}
					})
				})
			})
		},
		"removeAccessoryLimits": () => {
			const accessoryAssetTypeIds = [8, 41, 42, 43, 44, 45, 46, 47, 57, 58]
			const layeredAssetTypeIds = [64, 65, 66, 67, 68, 69, 70, 71, 72]
			
			onSet(window, "Roblox", Roblox => {
				onSet(Roblox, "AvatarAccoutrementService", AvatarAccoutrementService => {
					angularHook.hijackModule("avatar", {
						avatarController(target, thisArg, args, argsMap) {
							const result = target.apply(thisArg, args)
							
							try {
								const { $scope } = argsMap
								
								hijackFunction($scope, "validateAdvancedAccessories", (target, thisArg, args) => {
									if(settings.avatar.removeLayeredLimits) {
										return true
									}
									
									// filter out all hairs so they dont throw errors
									args[0] = args[0].filter(x => x.assetType !== 41)
									
									return target.apply(thisArg, args)
								})
							} catch(ex) {
								console.error(ex)
								if(IS_DEV_MODE) { alert("hijackAngular Error") }
							}
							
							return result
						}
					})
					
					hijackFunction(AvatarAccoutrementService, "getAdvancedAccessoryLimit", (target, thisArg, args) => {
						if(accessoryAssetTypeIds.includes(+args[0]) || layeredAssetTypeIds.includes(+args[0])) {
							return
						}
						
						return target.apply(thisArg, args)
					})
					
					hijackFunction(AvatarAccoutrementService, "addAssetToAvatar", (target, thisArg, args) => {
						const result = target.apply(thisArg, args)
						const assets = [args[0], ...args[1]]
						
						let accessoriesLeft = 10
						let layeredLeft = 10
						
						for(let i = 0; i < assets.length; i++) {
							const asset = assets[i]
							const assetTypeId = asset?.assetType?.id
							
							const isAccessory = accessoryAssetTypeIds.includes(assetTypeId)
							const isLayered = layeredAssetTypeIds.includes(assetTypeId) || assetTypeId === 41
							
							let valid = true
							
							if(isAccessory || isLayered) {
								if(isAccessory && accessoriesLeft <= 0) {
									valid = false
								}
								
								if(isLayered && layeredLeft <= 0) {
									valid = false
								}
								
								if(!settings.avatar.removeLayeredLimits && layeredAssetTypeIds.includes(assetTypeId)) {
									if(!result.includes(asset)) {
										valid = false
									}
								}
							} else {
								valid = result.includes(asset)
							}
							
							if(valid) {
								if(isAccessory) { accessoriesLeft-- }
								if(isLayered) { layeredLeft-- }
							} else {
								assets.splice(i--, 1)
							}
						}
						
						return assets
					})
				})
			})
		},
		"fullRangeBodyColors": () => {
			angularHook.hijackModule("avatar", {
				avatarController(target, thisArg, args, argsMap) {
					const result = target.apply(thisArg, args)
					
					try {
						const { $scope, $rootScope, avatarConstantService } = argsMap
						
						contentScript.listen("skinColorUpdated", () => {
							$scope.refreshThumbnail()
							$scope.$digest()
						})
						
						contentScript.listen("skinColorError", () => {
							$scope.systemFeedback.error(avatarConstantService.bodyColors.failedToUpdate)
							$scope.$digest()
						})
						
						$scope.$on(avatarConstantService.events.avatarDetailsLoaded, (event, avatarDetails) => {
							contentScript.send("updateSkinColors")
						})

						$rootScope.$on(avatarConstantService.events.bodyColorsChanged, (event, bodyColors) => {
							contentScript.send("updateSkinColors")
						})
						
					} catch(ex) {
						console.error(ex)
						if(IS_DEV_MODE) { alert("hijackAngular Error") }
					}
					
					return result
				}
			})
		},
		"showOwnedAssets": () => {
			const ownedAssets = {}
			
			contentScript.listen("updateOwnedAssets", changes => {
				for(const [assetId, isOwned] of Object.entries(changes)) {
					ownedAssets[+assetId]?.set(isOwned)
				 }
			})
			
			reactHook.hijackConstructor( // ItemCard
				(type, props) => "unitsAvailableForConsumption" in props && "id" in props,
				(target, thisArg, args) => {
					const props = args[0]
					const result = target.apply(thisArg, args)
					
					if(props.type === "Asset" && props.id) {
						let state = ownedAssets[props.id]
						
						if(!state) {
							state = reactHook.createGlobalState(false)
							ownedAssets[props.id] = state
							
							contentScript.send("checkOwnedAsset", props.id)
						}
						
						const owned = reactHook.useGlobalState(state)
						
						if(owned) {
							result.props.className = (result.props.className ?? "") + " btr-owned"
							
							const parent = reactHook.queryElement(result, x => x.props.className?.includes("item-card-link"))
							
							if(parent) {
								let children = parent.props.children
								
								if(!Array.isArray(children)) {
									children = parent.props.children = children ? [children] : []
								}
								
								children.unshift(reactHook.createElement("span", {
									className: "btr-item-owned",
									children: reactHook.createElement("span", {
										className: "icon-checkmark-white-bold",
										title: "You own this item"
									})
								}))
							}
						}
					}
					
					return result
				}
			)
		},
		"linkify": className => $?.(`.${className}`).linkify?.(),
		"redirectEvents": (fromSelector, toSelector) => {
			const from = document.querySelector(fromSelector)
			const to = document.querySelector(toSelector)
			
			if(!from || !to) {
				console.log("redirectEvents fail", fromSelector, toSelector, from, to)
				return
			}
			
			const events = [
				"cancel", "click", "close", "contextmenu", "copy", "cut", "auxclick", "dblclick",
				"dragend", "dragstart", "drop", "focusin", "focusout", "input", "invalid",
				"keydown", "keypress", "keyup", "mousedown", "mouseup", "paste", "pause", "play",
				"pointercancel", "pointerdown", "pointerup", "ratechange", "reset", "seeked",
				"submit", "touchcancel", "touchend", "touchstart", "volumechange", "drag", "dragenter",
				"dragexit", "dragleave", "dragover", "mousemove", "mouseout", "mouseover", "pointermove",
				"pointerout", "pointerover", "scroll", "toggle", "touchmove", "wheel", "abort",
				"animationend", "animationiteration", "animationstart", "canplay", "canplaythrough",
				"durationchange", "emptied", "encrypted", "ended", "error", "gotpointercapture", "load",
				"loadeddata", "loadedmetadata", "loadstart", "lostpointercapture", "playing", "progress",
				"seeking", "stalled", "suspend", "timeupdate", "transitionend", "waiting", "change",
				"compositionend", "textInput", "compositionstart", "compositionupdate"
			]
			
			const methods = [
				"stopImmediatePropagation", "stopPropagation", "preventDefault",
				"getModifierState", "composedPath",
			]
			
			const callback = event => {
				const clone = new event.constructor(event.type, new Proxy(event, {
					get(target, prop) {
						return prop === "bubbles" ? false : target[prop]
					}
				}))
				
				Object.defineProperties(clone, {
					target: { value: event.target },
					bubbles: { value: event.bubbles },
				})
				
				for(const method of methods) {
					if(typeof clone[method] === "function") {
						clone[method] = new Proxy(clone[method], {
							apply(target, thisArg, args) {
								if(thisArg === clone) {
									target.apply(thisArg, args)
									return event[method].apply(event, args)
								}
								
								return target.apply(thisArg, args)
							}
						})
					}
				}
				
				if(!to.dispatchEvent(clone)) {
					event.preventDefault()
				}
			}
			
			for(const event of events) {
				from.addEventListener(event, callback, { capture: true })
			}
		},
		"initReactFriends": () => {
			reactHook.hijackConstructor( // FriendsCarouselContainer
				(type, props) => "profileUserId" in props && "carouselName" in props, 
				(target, thisArg, args) => {
					const props = args[0]
					const carouselName = props.carouselName
					
					// disable MustHideConnections so that friends load in faster
					reactHook.hijackUseState(
						(value, index) => value === false && index == 4,
						(value, initial) => initial ? true : value
					)
					
					const result = target.apply(thisArg, args)
					
					// if MustHideConnect is enabled, communicate that to profile code somehow
					if(reactHook.renderTarget?.state?.[4]?.[0] === false) {
						const noFriendsLabel = reactHook.querySelector(result, ".friends-carousel-0-friends")
						
						if(noFriendsLabel) {
							noFriendsLabel.props.className += " btr-friends-carousel-disabled"
						}
					}
					
					return result
				}
			)
			
			reactHook.hijackConstructor( // FriendsList
				(type, props) => "friendsList" in props, 
				(target, thisArg, args) => {
					const props = args[0]
					const friendsList = props.friendsList
					const carouselName = props.carouselName
					
					let showSecondRow = false
					
					if(carouselName === "WebHomeFriendsCarousel") {
						showSecondRow = settings.home.friendsSecondRow
					} else if(carouselName === "WebProfileFriendsCarousel") {
						showSecondRow = settings.home.friendsSecondRow
						
						// Fixes an issue where profile friends list shows one too few friends
						props.isAddFriendsTileEnabled = false
					}
					
					if(showSecondRow) {
						reactHook.hijackUseState( // visibleFriendsList
							(value, index) => value === friendsList,
							(value, initial) => {
								if(value && friendsList && !initial) {
									let count = value.length * 2
									
									if(carouselName === "WebHomeFriendsCarousel") {
										const isTwoLines = value.length < friendsList.length
										localStorage.setItem("BTRoblox:homeFriendsIsTwoLines", isTwoLines ? "true" : "false")
										
										// account for Add Friends button
										count += 1
									}
									
									return friendsList.slice(0, count)
								}
								
								return value
							}
						)
					}
					
					const result = target.apply(thisArg, args)
					
					try { result.props.className = `${result.props.className ?? ""} btr-friends-list` }
					catch(ex) { console.error(ex) }
					
					if(showSecondRow) {
						try { result.props.className = `${result.props.className ?? ""} btr-friends-secondRow` }
						catch(ex) { console.error(ex) }
						
						if(carouselName === "WebHomeFriendsCarousel") {
							if(!friendsList && localStorage.getItem("BTRoblox:homeFriendsIsTwoLines") === "true") {
								try { result.props.className = `${result.props.className ?? ""} btr-friends-loading-two-lines` }
								catch(ex) { console.error(ex) }
							}
						}
					}
					
					return result
				}
			)
			
			if(settings.home.friendsShowUsername) {
				const friendsState = reactHook.createGlobalState({})
				
				hijackXHR(request => {
					if(request.method === "POST" && request.url === "https://apis.roblox.com/user-profile-api/v1/user/profiles/get-profiles") {
						request.onRequest.push(request => {
							const json = JSON.parse(request.body)
							
							if(!json.fields.includes("names.username")) {
								json.fields.push("names.username")
							}
							
							request.body = JSON.stringify(json)
						})
						
						request.onResponse.push(json => {
							for(const user of json.profileDetails) {
								friendsState.value[user.userId] = user
							}
							
							friendsState.update()
						})
					}
				})
				
				reactHook.hijackConstructor( // FriendTileContent
					(type, props) => props.displayName && props.userProfileUrl,
					(target, thisArg, args) => {
						const result = target.apply(thisArg, args)
						
						try {
							const userId = args[0].id
							
							const labels = reactHook.queryElement(result, x => x.props.className?.includes("friends-carousel-tile-labels"))
							if(labels && Array.isArray(labels.props.children)) {
								const friends = reactHook.useGlobalState(friendsState)
								const friend = friends[userId]
								
								if(friend) {
									labels.props.children.splice(1, 0, 
										reactHook.createElement("div", {
											className: "friends-carousel-tile-sublabel btr-friends-carousel-username-label",
											children: reactHook.createElement("span", {
												className: "btr-friends-carousel-username",
												children: `@${friend.names.username}`
											})
										})
									)
								}
							}
						} catch(ex) {
							console.error(ex)
						}
						
						return result
					}
				)
			}
			
			if(settings.home.friendPresenceLinks) {
				reactHook.hijackConstructor( // FriendTileDropdown
					(type, props) => props.friend && props.gameUrl,
					(target, thisArg, args) => {
						const result = target.apply(thisArg, args)
						
						try {
							const card = result.props.children?.[0]
							
							if(card?.props.className?.includes("in-game-friend-card")) {
								result.props.children[0] = reactHook.createElement("a", {
									href: args[0].gameUrl,
									style: { display: "contents" },
									onClick: event => event.preventDefault(),
									children: card
								})
							}
						} catch(ex) {
							console.error(ex)
						}
						
						return result
					}
				)
			}
		},
		"initReactRobuxToCash": () => {
			reactHook.inject(".text-robux-lg", elem => {
				const originalText = elem[0].props.children
				if(typeof originalText !== "string") { return }
				
				const robux = parseInt(originalText.replace(/\D/g, ""), 10)
				
				if(Number.isSafeInteger(robux)) {
					const cash = RobuxToCash.convert(robux)
					
					elem.append(reactHook.createElement("span", {
						className: "btr-robuxToCash-big",
						children: ` (${cash})`
					}))
				}
			})
			
			reactHook.inject(".text-robux-tile", elem => {
				const originalText = elem[0].props.children
				if(typeof originalText !== "string") { return }
				
				const robux = parseInt(originalText.replace(/\D/g, ""), 10)
				
				if(Number.isSafeInteger(robux)) {
					const cash = RobuxToCash.convert(robux)
					
					elem.append(reactHook.createElement("span", {
						className: "btr-robuxToCash-tile",
						children: ` (${cash})`
					}))
				}
			})
			
			reactHook.inject(".text-robux", elem => {
				const originalText = elem[0].props.children
				if(typeof originalText !== "string") { return }
				
				const robux = parseInt(originalText.replace(/\D/g, ""), 10)
				
				if(Number.isSafeInteger(robux)) {
					const cash = RobuxToCash.convert(robux)
					
					elem.append(reactHook.createElement("span", {
						className: "btr-robuxToCash",
						children: ` (${cash})`
					}))
				}
			})
			
			reactHook.inject(".icon-robux-container", elem => {
				const child = elem.find(x => "amount" in x.props)
				
				if(child) {
					const cash = RobuxToCash.convert(child[0].props.amount ?? 0)
					
					child.after(reactHook.createElement("span", {
						className: "btr-robuxToCash",
						children: ` (${cash})`
					}))
					
					return
				}
			})
		},
		"setupPopovers": () => {
			Roblox?.BootstrapWidgets?.SetupPopover(null, null, "[data-bind^='popover-btr-']")
		},
		"addBTRSettings": () => {
			reactHook.inject("#settings-popover-menu", elem => {
				elem.prepend(reactHook.createElement("li", {
					dangerouslySetInnerHTML: { __html: `<a class="rbx-menu-item btr-settings-toggle">BTR Settings</a>`}
				}))
			})
		},
		"fixFirefoxLocalStorageIssue": () => {
			onSet(window, "CoreRobloxUtilities", CoreRobloxUtilities => {
				if(!CoreRobloxUtilities?.localStorageService?.saveDataByTimeStamp) { return }
				
				const lss = CoreRobloxUtilities.localStorageService
				const localCache = {}
				
				hijackFunction(lss, "storage", () => true)
				
				hijackFunction(lss, "removeLocalStorage", (fn, thisArg, args) => {
					delete localCache[args[0]]
					return fn.apply(thisArg, args)
				})
				
				hijackFunction(lss, "getLocalStorage", (fn, thisArg, args) => {
					if(args[0] in localCache) {
						return JSON.parse(localCache[args[0]])
					}
					
					return fn.apply(thisArg, args)
				})
				
				hijackFunction(lss, "setLocalStorage", (fn, thisArg, args) => {
					try {
						delete localCache[args[0]]
						return fn.apply(thisArg, args)
					} catch(ex) {
						localCache[args[0]] = JSON.stringify(args[1])
						console.error(ex)
					}
				})
			})
		},
		"cacheRobuxAmount": () => {
			reactHook.hijackConstructor(
				(type, props) => "isGetCurrencyCallDone" in props && "isExperimentCallDone" in props && "robuxAmount" in props,
				(target, thisArg, args) => {
					try {
						const props = args[0]
						
						if(props.isGetCurrencyCallDone && props.isExperimentCallDone) {
							if(Number.isSafeInteger(props.robuxAmount)) {
								localStorage.setItem("BTRoblox:cachedRobux", props.robuxAmount)
							}
						} else {
							const cachedRobux = localStorage.getItem("BTRoblox:cachedRobux")
							
							if(cachedRobux) {
								props.isExperimentCallDone = true
								props.isGetCurrencyCallDone = true
								props.robuxAmount = +cachedRobux
							}
						}
					} catch {}
					
					return target.apply(thisArg, args)
				}
			)
		},
		"higherRobuxPrecision": () => {
			let hijackTruncValue = false

			onSet(window, "CoreUtilities", CoreUtilities => {
				hijackFunction(CoreUtilities.abbreviateNumber, "getTruncValue", (target, thisArg, args) => {
					if(hijackTruncValue && args.length === 1) {
						try {
							return target.apply(thisArg, [args[0], 100_000, null, 2])
						} catch(ex) {
							console.error(ex)
						}
					}

					return target.apply(thisArg, args)
				})
			})

			reactHook.hijackConstructor(
				(type, props) => "robuxAmount" in props && type.toString().includes("nav-robux-amount"),
				(target, thisArg, args) => {
					hijackTruncValue = true
					const result = target.apply(thisArg, args)
					hijackTruncValue = false
					return result
				}
			)
		},
		"shoutAlerts": () => {
			const shoutNotifications = []
			const shoutListeners = []
			
			contentScript.listen("setRecentShouts", notifs => {
				shoutNotifications.splice(0, shoutNotifications.length, ...notifs)
				
				for(const fn of shoutListeners.splice(0, shoutListeners.length)) {
					fn(shoutNotifications)
				}
			})
			
			angularHook.hijackModule("notificationStream", {
				notificationStreamController(target, thisArg, args, argsMap) {
					try {
						const { $scope, notificationStreamService } = argsMap
						let addShoutsToNotifs = false
						
						onSet($scope, "getRecentNotifications", () => {
							hijackFunction($scope, "getRecentNotifications", (target, thisArg, args) => {
								addShoutsToNotifs = true
								const result = target.apply(thisArg, args)
								addShoutsToNotifs = false
								
								return result
							})
						})
						
						hijackFunction(notificationStreamService, "getRecentNotifications", (target, thisArg, args) => {
							const result = target.apply(thisArg, args)
							
							if(addShoutsToNotifs) {
								const promise = new Promise(resolve => shoutListeners.push(resolve))
								contentScript.send("getRecentShouts")
								
								return result.then(async data => {
									const shouts = await promise
									
									try {
										for(const shout of shouts) {
											const entry = {
												id: `btr-groupshout-${shout.groupId}`,
												notificationSourceType: "BTRobloxGroupShout",
												eventDate: shout.updated,
												isInteracted: shout.interacted,
												metadataCollection: [],
												eventCount: 1,
												content: null
											}
											
											$scope.notifications[entry.id] = entry
											
											if($scope.notificationIds.indexOf(entry.id) === -1) {
												$scope.notificationIds.push(entry.id)
											}
										}
									} catch(ex) {}
									
									return data
								})
							}
							
							return result
						})
						
					} catch(ex) {
						console.error(ex)
						if(IS_DEV_MODE) { alert("hijackAngular Error") }
					}
					
					const result = target.apply(thisArg, args)
					return result
				},
				
				notificationStreamService(target, thisArg, args, argsMap) {
					const result = target.apply(thisArg, args)
					
					try {
						hijackFunction(result, "unreadCount", (target, thisArg, args) => {
							const result = target.apply(thisArg, args)
							const promise = new Promise(resolve => shoutListeners.push(resolve))
							
							contentScript.send("getRecentShouts")
							
							return result.then(async data => {
								const shouts = await promise
								
								for(const shout of shouts) {
									if(!shout.interacted) {
										data.unreadNotifications += 1
									}
								}
								
								return data
							})
						})
						
						hijackFunction(result, "clearUnread", (target, thisArg, args) => {
							contentScript.send("markShoutsAsInteracted")
							return target.apply(thisArg, args)
						})
					} catch(ex) {
						console.error(ex)
						if(IS_DEV_MODE) { alert("hijackAngular Error") }
					}
					
					return result
				}
			})
		},
		"hideFriendActivity": () => {
			hijackXHR(request => {
				if(request.method === "POST" && request.url.match(/^https:\/\/apis\.roblox\.com\/discovery-api\/omni-recommendation(-metadata)?$/i)) {
					request.onResponse.push(json => {
						if(json?.contentMetadata?.Game) {
							for(const gameData of Object.values(json.contentMetadata.Game)) {
								delete gameData.friendActivityTitle
							}
						}
					})
				}
			})
		},
		"smallChatButton": () => {
			angularHook.hijackModule("chat", {
				chatController(target, thisArg, args, argsMap) {
					const result = target.apply(thisArg, args)

					try {
						const { $scope, chatUtility } = argsMap

						const library = $scope.chatLibrary
						const width = library.chatLayout.widthOfChat

						$scope.$watch(() => library.chatLayout.collapsed, value => {
							library.chatLayout.widthOfChat = value ? 54 + 6 : width
							chatUtility.updateDialogsPosition(library)
						})
					} catch(ex) {
						console.error(ex)
						if(IS_DEV_MODE) { alert("hijackAngular Error") }
					}

					return result
				}
			})
		},
		"hijackAuth": () => {
			let didSendFirstAuth = false
			
			hijackXHR(request => {
				if(!didSendFirstAuth && request.method === "GET" && request.url === `https://users.roblox.com/v1/users/authenticated`) {
					request.onResponse.push(json => {
						if(!didSendFirstAuth) {
							didSendFirstAuth = true
							contentScript.send("onFirstAuth", json)
						}
					})
				}
			})
		},
		"webpackHook": () => {
			const webpackHook = {
				processedModules: new WeakSet(),
				propertyHandlers: new Map(),
				moduleHandlers: [],
				objects: {},
				
				onModule(fn) {
					this.moduleHandlers.push(fn)
				},
				
				onProperty(keys, fn) {
					if(!Array.isArray(keys)) { keys = [keys] }
					
					const callback = keys.length >= 2 ? obj => {
						for(const key of keys) {
							if(!Object.hasOwn(obj, key)) {
								return
							}
						}
						
						fn(obj)
					} : fn
					
					for(const key of keys) {
						let list = this.propertyHandlers.get(key)
						
						if(!list) {
							list = []
							
							Object.defineProperty(Object.prototype, key, {
								configurable: true,
								set(value) {
									Object.defineProperty(this, key, {
										configurable: true,
										enumerable: true,
										writable: true,
										value: value
									})
									
									for(const fn of list) {
										try { fn(args[0]) }
										catch(ex) { console.error(ex) }
									}
								}
							})
							
							if(!this.propertyHandlers.size) {
								const propertyHandlers = this.propertyHandlers
								
								Object.defineProperty = new Proxy(Object.defineProperty, {
									apply(target, thisArg, args) {
										const result = target.apply(thisArg, args)
										
										const list = propertyHandlers.get(args[1])
										if(list) {
											for(const fn of list) {
												try { fn(args[0]) }
												catch(ex) { console.error(ex) }
											}
										}
										
										return result
									}
								})
							}
							
							this.propertyHandlers.set(key, list)
						}
						
						list.push(callback)
					}
				},
				
				init() {
					onSet(window, "webpackChunk_N_E", chunks => {
						const addChunk = chunk => {
							for(const id of Object.keys(chunk)) {
								hijackFunction(chunk, id, (target, thisArg, args) => {
									const result = target.apply(thisArg, args)
									
									try {
										const module = args[0].exports
										if(typeof module === "object" && !this.processedModules.has(module)) {
											this.processedModules.add(module)
											
											for(const fn of this.moduleHandlers) {
												try { fn(module, target) }
												catch(ex) { console.error(ex) }
											}
										}
									} catch(ex) {
										console.error(ex)
									}
									
									return result
								})
							}
						}
						
						const override = pushfn => new Proxy(pushfn, {
							apply: (target, thisArg, args) => {
								for(const chunk of args) {
									try { addChunk(chunk[1]) }
									catch(ex) { console.error(ex) }
								}
								
								return target.apply(thisArg, args)
							}
						})
						
						let pushoverride = override(chunks.push)
						
						Object.defineProperty(chunks, "push", {
							enumerable: false,
							configurable: true,
							set(fn) { pushoverride = override(fn) },
							get() { return pushoverride }
						})
						
						for(const chunk of chunks) {
							try { addChunk(chunk[1]) }
							catch(ex) { console.error(ex) }
						}
					})
				}
			}
			
			const { objects } = webpackHook
			
			objects.Mui = {}
			
			webpackHook.onModule((module, target) => {
				if("jsx" in module && "jsxs" in module) {
					hijackFunction(module, "jsx", reactHook.onCreateElement.bind(reactHook))
					hijackFunction(module, "jsxs", reactHook.onCreateElement.bind(reactHook))
					objects.jsx = module.jsx
					
				} else if("useState" in module && "useCallback" in module) {
					reactHook.onReact(module)
					objects.React = module
					
				} else if("useRouter" in module) {
					objects.NextRouter = module
				}
				
				const moduleCode = target.toString()
				
				if(moduleCode.includes(`name:"MenuItem"`)) {
					objects.Mui.MenuItem = Object.values(module)[0]
				} else if(moduleCode.includes(`name:"Button"`)) {
					objects.Mui.Button = Object.values(module)[0]
				} else if(moduleCode.includes(`name:"Divider"`)) {
					objects.Mui.Divider = Object.values(module)[0]
				}
			})
			
			BTRoblox.webpackHook = webpackHook
			
			webpackHook.init()
		},
		"createAddBTRSettings": () => {
			const { webpackHook } = BTRoblox
			const { objects } = webpackHook
			
			reactHook.hijackConstructor(
				(type, props) => props.settingsHref,
				(target, thisArg, args) => {
					const result = target.apply(thisArg, args)
					
					try {
						const list = reactHook.queryElement(result, x => x.props.id === "top-navigation-authentication-status-menu")
						
						if(list) {
							list.props.children.unshift(
								objects.jsx(objects.Mui.MenuItem, {
									children: "BTR Settings",
									className: "btr-settings-toggle"
								})
							)
						}
					} catch(ex) {
						console.error(ex)
					}
					
					return result
				}
			)
		},
		"createAssetOptions": () => {
			const { webpackHook } = BTRoblox
			const { objects } = webpackHook
			
			const Link = (url, entry) => objects.jsx("a", {
				href: url,
				style: { all: "unset", display: "contents" },
				className: "btr-next-anchor",
				children: entry,
				key: entry.key
			})
			
			document.addEventListener("click", ev => {
				const anchor = ev.target.nodeName === "A" ? ev.target : ev.target.closest("a")
				
				if(anchor?.classList.contains("btr-next-anchor")) {
					if(!ev.shiftKey && !ev.ctrlKey && objects.NextRouter) {
						ev.preventDefault()
						objects.NextRouter.router.push(anchor.href)
					}
				}
			})
			
			reactHook.hijackConstructor(
				(type, props) => props.itemType && props.updateItem,
				(target, thisArg, args) => {
					const result = target.apply(thisArg, args)
					
					try {
						if(result?.props["data-testid"] === "experience-options-menu") {
							const children = [result.props.children].flat(10).filter(x => x)
							result.props.children = children
							
							if(args[0].itemType === "Game") {
								let index = children.findIndex(x => x?.props?.onClick && reactHook.queryElement(x, x => x?.props?.itemKey === "Action.CopyURL"))
								if(index !== -1) { children.splice(index, 1) }
								
								index = children.findIndex(x => x?.key === "Action.OpenInNewTab")
								if(index !== -1) { children.splice(index, 1) }
								
								index = children.findIndex(x => x?.key === "Action.CopyURL")
								if(index !== -1) { children.splice(index, 1) }
								
								index = children.findIndex(x => x?.key === "Action.CopyUniverseID")
								if(index !== -1) { children.splice(index, 1) }
								
								index = children.findIndex(x => x?.props.itemKey === "Action.CopyStartPlaceID")
								if(index !== -1) { children[index].props.style = { display: "none" } } // HACK: Keep in dom for styling purposes
								
								index = children.findIndex(x => x?.key === "Action.OpenExperienceDetails")
								if(index !== -1) {
									const entry = children[index]
									delete entry.props.onClick
									
									children[index] = Link(`https://www.roblox.com/games/${args[0].creation.assetId}/`, entry)
								}
								
								index = children.findIndex(x => x?.key === "Action.ConfigureLocalization")
								if(index !== -1) {
									const entry = children[index]
									delete entry.props.onClick
									
									children[index] = Link(`/dashboard/creations/experiences/${args[0].creation.universeId}/localization`, entry)
								}
								
								index = children.findIndex(x => x?.key === "Action.ViewRealTimeStats")
								if(index !== -1) {
									const entry = children[index]
									delete entry.props.onClick
									
									children[index] = Link(`/dashboard/creations/experiences/${args[0].creation.universeId}/analytics/performance`, entry)
									
									// HACK: Make a copy for styling purposes
									children.splice(index + 1, 0, { ...entry, key: undefined, props: { ...entry.props, children: null, style: { display: "none" } }})
								}
								
								index = children.findIndex(x => x?.key === "Action.CreateBadge")
								if(index !== -1) {
									const entry = children[index]
									delete entry.props.onClick
									
									children[index] = Link(`/dashboard/creations/experiences/${args[0].creation.universeId}/badges/create`, entry)
								}
								
								index = children.findIndex(x => x?.key === "Action.OpenExperienceDetails")
								children.splice(
									index + 1, 0,
									Link(
										`/dashboard/creations/experiences/${args[0].creation.universeId}/overview`,
										objects.jsx(objects.Mui.MenuItem, { children: "Configure Experience" }),
									),
									Link(
										`/dashboard/creations/experiences/${args[0].creation.universeId}/places/${args[0].creation.assetId}/configure`,
										objects.jsx(objects.Mui.MenuItem, { children: "Configure Start Place" })
									)
								)
							} else if(args[0].itemType === "CatalogAsset") {
								let index = children.findIndex(x => x?.key === "Action.OpenInNewTab")
								if(index !== -1) { children.splice(index, 1) }
								
								children.splice(
									0, 0,
									Link(
										`https://www.roblox.com/catalog/${args[0].creation.assetId}/`,
										objects.jsx(objects.Mui.MenuItem, { children: "View on Roblox" })
									),
									Link(
										`/dashboard/creations/catalog/${args[0].creation.assetId}/configure`,
										objects.jsx(objects.Mui.MenuItem, { children: "Configure Asset" })
									)
								)
								
								index = children.findIndex(x => x?.props?.itemKey === "Action.Analytics")
								if(index !== -1) {
									const entry = children[index]
									delete entry.props.onClick
									
									children[index] = Link(`/dashboard/creations/catalog/${args[0].creation.assetId}/analytics`, entry)
								}
								
								index = children.findIndex(x => x?.key === "Action.CopyURL")
								if(index !== -1) { children.splice(index, 1) }
								
								index = children.findIndex(x => x?.props.children === "Copy Asset ID")
								if(index !== -1) { children.splice(index, 1) }
								
								index = children.findIndex(x => x?.props.children === "Copy Asset URI")
								if(index !== -1) { children.splice(index, 1) }
							}
						}
					} catch(ex) {
						console.error(ex)
					}
					
					return result
				}
			)
			
			reactHook.hijackConstructor(
				(type, props) => props.menuItems && props.setMenuOpen,
				(target, thisArg, args) => {
					const result = target.apply(thisArg, args)
					
					try {
						const parent = result?.props.children?.[1]
						if(parent?.props) {
							const children = [parent.props.children].flat(10).filter(x => x)
							parent.props.children = children
							
							const assetDetail = children.find(x => x?.key === "open-asset-detail")
							if(assetDetail) {
								const assetId = assetDetail.props.assetId
								
								// let index = children.indexOf(assetDetail)
								// if(index !== -1) { children.splice(index, 1) }
								
								let index = children.findIndex(x => x?.key === "copy-asset-id")
								if(index !== -1) { children.splice(index, 1) }
								
								children.splice(
									children.indexOf(assetDetail) + 1,
									0,
									// objects.jsx(objects.Mui.Divider, {}),
									Link(
										`/dashboard/creations/store/${assetId}/configure`,
										objects.jsx(objects.Mui.MenuItem, { children: "Configure Asset" })
									)
								)
							}
						}
					} catch(ex) {
						console.error(ex)
					}
					
					return result
				}
			)
		},
		"createDownloadVersion": () => {
			const { webpackHook } = BTRoblox
			const { objects } = webpackHook 
			
			reactHook.hijackConstructor(
				(type, props) => "version" in props,
				(target, thisArg, args) => {
					const result = target.apply(thisArg, args)
					
					try {
						if(result?.props["data-testid"]?.startsWith("version-history")) {
							const version = args[0].version
							const right = result.props.children[3]
							
							if(!Array.isArray(right.props.children)) {
								right.props.children = [right.props.children]
							}
							
							right.props.children.unshift(
								objects.jsx(objects.Mui.Button, {
									className: "btr-download-version",
									btrVersion: version.assetVersionNumber,
									btrAssetId: version.assetId,
									size: "small",
									color: "secondary",
									style: {
										"margin-right": right.props.children[0] ? "5px" : "",
									},
									children: [
										objects.jsx("span", {
											className: "btr-mui-circular-progress-root",
											style: {
												width: "20px",
												height: "20px",
												position: "absolute",
												left: "7px",
												display: "none"
											},
											children: objects.jsx("svg", {
												className: "btr-mui-circular-progress-svg",
												focusable: false,
												viewBox: "22 22 44 44",
												children: objects.jsx("circle", {
													className: "btr-mui-circular-progress",
													"stroke-width": 3.6,
													fill: "none",
													cx: 44,
													cy: 44,
													r: 20.2
												})
											})
										}),
										objects.jsx("svg", {
											className: "MuiSvgIcon-root btr-download-icon",
											focusable: false,
											viewBox: "0 0 24 24",
											style: {
												height: "19px",
												"margin-right": "5px",
												fill: "currentcolor"
											},
											children: objects.jsx("path", {
												d: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"
											})
										}),
										" ", "Download",,
									]
								})
							)
						}
					} catch(ex) {
						console.error(ex)
					}
					
					return result
				}
			)
		},
		"marketplacePageChanged": () => {
			hijackFunction(history, "pushState", (target, thisArg, args) => {
				const result = target.apply(thisArg, args)
				contentScript.send("stateChange")
				return result
			})
			
			hijackFunction(history, "replaceState", (target, thisArg, args) => {
				const result = target.apply(thisArg, args)
				contentScript.send("stateChange")
				return result
			})
		},
		"pagedServers": () => {
			const largePageSize = 100
			const pageSize = 12
			
			const btrPager = { currentPage: 1, targetPage: 1, maxPage: 1, loading: false }
			const promises = {}
			const cursors = []
			
			const btrPagerState = reactHook.createGlobalState(btrPager)
			const serverParams = { sortOrder: "Desc", excludeFullGames: false }
			
			const loadLargePage = async (placeId, largePageIndex) => {
				if(largePageIndex >= cursors.length + 2) {
					throw new Error("Tried to load page with no cursor")
				}
				
				const cursor = cursors[largePageIndex - 2] ?? ""
				
				const url = `https://games.roblox.com/v1/games/${placeId}/servers/Public?sortOrder=${serverParams.sortOrder}&excludeFullGames=${serverParams.excludeFullGames}&limit=${largePageSize}&cursor=${cursor}`
				let promise = promises[url]
				
				if(!promise) {
					let numRetries = 0
					
					const tryRetry = async res => {
						if(res.status === 429 && numRetries < 2) {
							numRetries += 1
							await new Promise(resolve => setTimeout(resolve, 3e3))
							return fetch(url, { credentials: "include" })
						}
						
						return res
					}
					
					promise = promises[url] = fetch(url, { credentials: "include" }).then(tryRetry).then(res => (res.ok ? res.json() : null)).catch(() => null).finally(() => delete promises[url])
				}
				
				const json = await promise
				
				if(!json) {
					throw new Error("Failed to load")
				}
				
				const maxServer = (largePageIndex - 1) * largePageSize + json.data.length
				const maxPage = Math.max(1, Math.floor((maxServer - 1) / pageSize) + 1)
				
				if(json.nextPageCursor) {
					cursors[largePageIndex - 1] = json.nextPageCursor
					
					if(maxPage >= btrPager.maxPage) {
						btrPager.maxPage = maxPage
						btrPager.foundMaxPage = false
						btrPager.hasMore = true
						btrPagerState.update()
					}
				} else {
					const isMaxPage = json.data.length > 0 || largePageIndex === 1
					
					if(isMaxPage || maxPage <= btrPager.maxPage) {
						btrPager.maxPage = maxPage
						btrPager.foundMaxPage = json.data.length > 0 || largePageIndex === 1
						btrPager.hasMore = false
						btrPagerState.update()
					}
				}
				
				return json
			}
			
			const updateMaxPage = async (placeId, skipPageIndex) => {
				const largePageIndex = Math.min(
					Math.floor((btrPager.maxPage * pageSize - 1) / largePageSize) + 1,
					cursors.length + (btrPager.foundMaxPage ? 1 : 0)
				)
				
				if(largePageIndex === skipPageIndex) {
					return
				}
				
				const attemptFindMaxPage = async () => {
					for(let i = largePageIndex; i >= 1; i--) {
						await loadLargePage(placeId, i)
						
						if(btrPager.foundMaxPage || btrPager.hasMore) {
							break
						}
					}
				}
				
				btrPager.updatingMaxPage = true
				btrPagerState.update()
				
				return attemptFindMaxPage().finally(() => {
					btrPager.updatingMaxPage = false
					btrPagerState.update()
				})
			}
			
			const loadServers = async placeId => {
				const largePages = {}
				
				outer:
				while(true) {
					const targetPage = btrPager.targetPage
					
					const serversFrom = (targetPage - 1) * pageSize + 1
					const serversTo = serversFrom + pageSize - 1
					
					const largeFrom = Math.min(cursors.length + 1, Math.floor((serversFrom - 1) / largePageSize) + 1)
					let largeTo = Math.floor((serversTo - 1) / largePageSize) + 1
					
					for(let largePageIndex = largeFrom; largePageIndex <= largeTo; largePageIndex++) {
						const json = largePages[largePageIndex]
						
						if(!json) {
							largePages[largePageIndex] = await loadLargePage(placeId, largePageIndex)
							continue outer
						}
						
						if(!json.nextPageCursor) {
							const maxServer = (largePageIndex - 1) * largePageSize + json.data.length
							const maxPage = Math.max(1, Math.floor((maxServer - 1) / pageSize) + 1)
							
							if(maxPage < targetPage) {
								btrPager.targetPage = maxPage
								btrPagerState.update()
								continue outer
							}
							
							largeTo = largePageIndex
							break
						}
					}
					
					btrPager.currentPage = targetPage
					btrPagerState.update()
					
					const result = []
					
					for(let largePageIndex = largeFrom; largePageIndex <= largeTo; largePageIndex++) {
						const json = largePages[largePageIndex]
						const startIndex = (largePageIndex - 1) * largePageSize
						
						result.push(...json.data.slice(Math.max(0, (serversFrom - 1) - startIndex), Math.max(0, serversTo - startIndex)))
					}
					
					if(!btrPager.updatingMaxPage) {
						updateMaxPage(placeId, largeTo)
					}
					
					return result
				}
			}
			
			let getGameInstancesPromise
			const btrGetPublicGameInstances = (placeId, cursor, params) => {
				if(!params?.btrRefresh) {
					const sortOrder = params?.sortOrder === "Asc" ? "Asc" : "Desc"
					const excludeFullGames = params?.excludeFullGames ? true : false
					
					if(serverParams.sortOrder !== sortOrder || serverParams.excludeFullGames !== excludeFullGames) {
						getGameInstancesPromise = null
						
						serverParams.sortOrder = sortOrder
						serverParams.excludeFullGames = excludeFullGames
						
						btrPager.targetPage = 1
					}
				}
				
				if(!getGameInstancesPromise) {
					btrPager.loading = true
					btrPagerState.update()
					
					const thisPromise = getGameInstancesPromise = loadServers(placeId).then(
						servers => ({
							data: {
								nextPageCursor: btrPager.currentPage < btrPager.maxPage ? "idk" : null,
								data: servers
							}
						}),
						() => null
					).finally(() => {
						if(getGameInstancesPromise === thisPromise) {
							btrPager.loading = false
							btrPagerState.update()
							
							getGameInstancesPromise = null
						}
					})
				}
				
				return getGameInstancesPromise
			}
			
			const btrPagerConstructor = ({ refreshGameInstances }) => {
				const btrPager = reactHook.useGlobalState(btrPagerState)
				
				const canPrev = !btrPager.loading && btrPager.currentPage > 1
				const canNext = !btrPager.loading && (!btrPager.foundMaxPage || btrPager.currentPage < (btrPager.maxPage ?? 2))
				
				const inputRef = React.useRef()
				
				const updateInputWidth = () => {
					inputRef.current.style.width = "0px"
					inputRef.current.style.width = `${Math.max(32, Math.min(100, inputRef.current.scrollWidth + 12))}px`
				}
				
				React.useEffect(updateInputWidth, [])
				
				React.useEffect(() => {
					inputRef.current.value = btrPager.currentPage
				}, [btrPager.currentPage])
				
				const submit = pressedEnter => {
					const num = parseInt(inputRef.current.value, 10)
		
					if(Number.isSafeInteger(num) && (pressedEnter || btrPager.targetPage !== num)) {
						btrPager.targetPage = Math.max(1, num)
						refreshGameInstances({ btrRefresh: true })
					} else {
						inputRef.current.value = btrPager.currentPage
					}
				}
				
				return React.createElement(
					"div", { className: "btr-pager-holder btr-server-pager" },
					React.createElement(
						"ul", { className: "btr-pager" },
						
						React.createElement(
							"li", { className: `btr-pager-first` },
							React.createElement(
								"button", {
									className: "btn-generic-first-page-sm",
									disabled: !canPrev,
									onClick() {
										if(!canPrev) { return }
										btrPager.targetPage = 1
										refreshGameInstances({ btrRefresh: true })
									}
								},
								React.createElement(
									"span", { className: "icon-first-page" }
								)
							)
						),
						
						React.createElement(
							"li", { className: `btr-pager-prev` },
							React.createElement(
								"button", {
									className: "btn-generic-left-sm",
									disabled: !canPrev,
									onClick() {
										if(!canPrev) { return }
										btrPager.targetPage = Math.max(1, btrPager.currentPage - 1)
										refreshGameInstances({ btrRefresh: true })
									}
								},
								React.createElement(
									"span", { className: "icon-left" }
								)
							)
						),
						
						React.createElement(
							"li", { className: `btr-pager-mid` },
							React.createElement(
								"span", {},
								"Page",
							),
							React.createElement(
								"input", {
									className: "btr-pager-cur",
									type: "text",
									ref: inputRef,
									
									onChange() {
										updateInputWidth()
									},
									
									onKeyDown(e) {
										if(e.which === 13) {
											submit(true)
											e.target.blur()
										}
									},
									
									onBlur(e) {
										submit(false)
									}
								}
							),
							React.createElement(
								"span", {},
								` of `,
								
								React.createElement(
									"span", {
										className: "btr-pager-total"
									},
									btrPager.foundMaxPage ? `${btrPager.maxPage}` : btrPager.maxPage > 1 ? `${btrPager.maxPage}+` : "1"
								)
							)
						),
						
						React.createElement(
							"li", { className: `btr-pager-next` },
							React.createElement(
								"button", {
									className: "btn-generic-right-sm",
									disabled: !canNext,
									onClick() {
										if(!canNext) { return }
										btrPager.targetPage = btrPager.currentPage + 1
										refreshGameInstances({ btrRefresh: true })
									}
								},
								React.createElement(
									"span", { className: "icon-right" }
								)
							)
						),
						
						React.createElement(
							"li", { className: `btr-pager-last` },
							React.createElement(
								"button", {
									className: "btn-generic-last-page-sm",
									disabled: !canNext,
									onClick() {
										if(!canNext) { return }
										btrPager.targetPage = Math.max(btrPager.maxPage ?? 1, btrPager.currentPage + 50)
										refreshGameInstances({ btrRefresh: true })
									}
								},
								React.createElement(
									"span", { className: "icon-last-page" }
								)
							)
						)
					)
				)
			}
			
			const useSyncExternalStore = (subscribe, getSnapshot) => {
				const [counter, setCounter] = React.useState(0)
				const snapshot = getSnapshot()
				
				const refresh = () => {
					if(!Object.is(snapshot, getSnapshot())) {
						setCounter(counter + 1)
					}
				}
				
				React.useEffect(() => (refresh(), subscribe(refresh)))
				
				return snapshot
			}
			
			const globalServerRegions = {}
			const onRegionsChanged = new Set()
			
			if(settings.gamedetails.showServerRegion) {
				contentScript.listen("setServerRegion", (jobId, details) => {
					if(JSON.stringify(details) !== JSON.stringify(globalServerRegions[jobId])) {
						globalServerRegions[jobId] = details
						
						for(const fn of onRegionsChanged) {
							fn()
						}
					}
				})
			}
			
			reactHook.hijackConstructor(
				(type, props) => props.getGameServers,
				(target, thisArg, args) => {
					const props = args[0]
					
					if(settings.gamedetails.addServerPager && (props.getGameServers?.name === "getPublicGameInstances" || props.getGameServers === btrGetPublicGameInstances)) {
						props.getGameServers = btrGetPublicGameInstances
					}
					
					return target.apply(thisArg, args)
				}
			)
			
			reactHook.hijackConstructor(
				(type, props) => props.loadMoreGameInstances && "headerTitle" in props,
				(target, thisArg, args) => {
					const props = args[0]
					
					if(props.type === "public") {
						props.btrPagerEnabled = true
						props.showLoadMoreButton = false
					}
					
					const result = target.apply(thisArg, args)
					
					try {
						const list = reactHook.queryElement(result, x => x.props.id?.includes("running-games"))
						
						if(props.btrPagerEnabled) {
							list.props.children.push(
								React.createElement(btrPagerConstructor, {
									refreshGameInstances: props.refreshGameInstances
								})
							)
						}
						
						const ul = reactHook.queryElement(list, x => x.type === "ul", 5)
						const servers = ul?.props?.children
						
						if(servers) {
							for(const server of [servers].flat()) {
								server.props.btrGameInstance = props?.gameInstances?.find(x => x.id === server.props.id)
							}
						}
					} catch(ex) {
						console.error(ex)
					}
					
					return result
				}
			)
			
			reactHook.hijackConstructor( // GameInstanceCard
				(type, props) => props.gameServerStatus,
				(target, thisArg, args) => {
					const result = target.apply(thisArg, args)
					const placeId = args[0].placeId
					const jobId = args[0].id
					
					if(jobId) {
						const joinBtn = reactHook.queryElement(result, x => x.props.className?.includes("game-server-join-btn"))
						if(joinBtn) {
							joinBtn.props["data-btr-instance-id"] = jobId
						}
						
						let serverDetails
						
						const regionSetting = settings.gamedetails.showServerRegion
						const showPing = ["ping", "both", "combined"].includes(regionSetting)
						const showRegion = ["region", "both", "combined"].includes(regionSetting)
						
						if(showRegion) {
							serverDetails = useSyncExternalStore(callback => {
								onRegionsChanged.add(callback)
								return () => onRegionsChanged.delete(callback)
							}, () => globalServerRegions[jobId])
							
							React.useEffect(() => {
								contentScript.send("getServerRegion", placeId, jobId)
							}, [jobId])
						}
						
						const gameInstance = args[0].btrGameInstance
						if(gameInstance) {
							const status = reactHook.queryElement(result, x => x.props.className?.includes("rbx-game-status"))
							
							if(status) {
								if(showRegion && regionSetting !== "combined") {
									status.props.children += `\nRegion: ${
										!serverDetails ? "Loading"
										: !serverDetails.location ? serverDetails.statusText
										: `${serverDetails.location.city}, ${serverDetails.location.country.name === "United States" ? serverDetails.location.region.code : serverDetails.location.country.code}`
								}`
										
									// Okay, this is hacky, BUT...
									// United Kingdom wraps over by 1 character, so let's increase size for it lmao
									// not needed anymore
									
									// if(serverDetails?.location?.country.name === "United Kingdom") {
									// 	if(!status.props.style) { status.props.style = {} }
									// 	status.props.style.width = "105%"
									// }
								}
								
								if(showPing) {
									status.props.children += `\nPing: ${gameInstance.ping ?? 0}ms`
									
									if(showRegion && regionSetting === "combined") {
										status.props.children += ` (${
										!serverDetails ? "Loading" :
										serverDetails.location ? serverDetails.location.country.code :
										serverDetails.statusText
									})`
									}
								}
								
								if(showRegion) {
									status.props.title = 
										!serverDetails ? "Loading"
										: !serverDetails.location ? serverDetails.statusTextLong
										: (
											serverDetails.location.country.name === "United States" ? `${serverDetails.location.city}, ${serverDetails.location.region.name}, ${serverDetails.location.country.name}`
											: `${serverDetails.location.city}, ${serverDetails.location.country.name}` 
										)
									
									if(serverDetails?.address) {
										status.props.title += ` (${serverDetails?.address})`
									}
								}
							}
						}
					}
					
					return result
				}
			)
			
			reactHook.hijackUseStateGlobal(
				(value, index) => ["tab-about", "tab-game-instances", "tab-store"].includes(value),
				(value, initial) => {
					if(value === "tab-about" && window.location.hash !== "#!/about") {
						return "tab-game-instances"
					}
					
					return value
				}
			)
		},
		"gamedetails": () => {
			reactHook.inject(".game-description-container", elem => {
				return reactHook.createElement("div", { style: { display: "contents" } },
					reactHook.createElement("div", { id: "btr-description-wrapper", style: { display: "contents" } }, elem[0])
				)
			})
			
			reactHook.inject(".container-list.games-detail", elem => {
				return reactHook.createElement("div", { style: { display: "contents" } },
					reactHook.createElement("div", { id: "btr-recommendations-wrapper", style: { display: "contents" } }, elem[0])
				)
			})
			
			reactHook.inject(".game-social-links .btn-secondary-lg", elem => {
				const socials = reactHook.renderTarget?.state[0]?.[0]
				const entry = socials?.find(x => x.id === +elem[0].key)
				
				if(entry) {
					elem[0].props.href = entry.url
					
					hijackFunction(elem[0].props, "onClick", (target, thisArg, args) => {
						const event = args[0]
						event.preventDefault()
						
						const result = target.apply(thisArg, args)
						return result
					})
				}
			})
		},
		"groupsModifyLayout": () => {
			angularHook.hijackModule("group", {
				groupController(target, thisArg, args, argsMap) {
					const result = target.apply(thisArg, args)
					
					try {
						const { $scope, groupDetailsConstants } = argsMap
						
						groupDetailsConstants.tabs.about.translationKey = "Heading.Members"
						
						groupDetailsConstants.tabs.games = {
							state: "about",
							btrCustomTab: "games",
							translationKey: "Heading.Games"
						}
						
						groupDetailsConstants.tabs.payouts = {
							state: "about",
							btrCustomTab: "payouts",
							translationKey: "Heading.Payouts"
						}
						
						$scope.btrCustomTab = {
							name: null
						}
						
						hijackFunction($scope, "groupDetailsTabs", (target, thisArg, args) => {
							let result = target.apply(thisArg, args)
							
							const entries = Object.entries(result)
							
							if($scope.library?.currentGroup?.areGroupGamesVisible) {
								entries.splice(1, 0, ["games", groupDetailsConstants.tabs.games])
							}
							
							if($scope.isAuthenticatedUser && $scope.layout?.btrPayoutsEnabled) {
								entries.push(["payouts", groupDetailsConstants.tabs.payouts])
							}
							
							result = Object.fromEntries(entries)
							
							return result
						})
						
						// this doesnt get called unless we start on group shout page
						// doing it here since we always show shouts
						$scope.initVerifiedBadgesForGroupShout()
					} catch(ex) {
						console.error(ex)
					}
					
					return result
				},
				groupTab(target, thisArg, args) {
					const result = target.apply(thisArg, args)
					
					try {
						result.scope.btrCustomTab = "="
					} catch(ex) {
						console.error(ex)
					}
					
					return result
				}
			})
			
			angularHook.hijackModule("groupPayouts", {
				groupPayouts(component) {
					component.bindings.layout = "="
				},
				groupPayoutsController(target, thisArg, args, argsMap) {
					const result = target.apply(thisArg, args)
					
					try {
						const { groupPayoutsService } = argsMap
						const controller = thisArg
						
						hijackFunction(groupPayoutsService, "getGroupPayoutRecipients", (target, thisArg, args) => {
							const result = target.apply(thisArg, args)
							
							try {
								result.then(
									recipients => controller.layout.btrPayoutsEnabled = recipients.length > 0,
									() => controller.layout.btrPayoutsEnabled = false
								)
							} catch(ex) {
								console.error(ex)
							}
							
							return result
						})
					} catch(ex) {
						console.error(ex)
					}
	
					return result
				}
			})
		},
		"pagedGroupWall": () => {
			const createCustomPager = (ctrl, { $scope }) => {
				const wallPosts = []
				const pageSize = 10
				let loadMorePromise = null
				let nextPageCursor = ""
				let requestCounter = 0
				let lastPageNum = 0
				let isLoadingPosts = false
				let activeLoadMore = 0
	
				const btrPagerStatus = {
					prev: false,
					next: false,
					input: false,
					pageNum: 1
				}
	
				const setPageNumber = page => {
					btrPagerStatus.prev = page > 0
					btrPagerStatus.next = !!nextPageCursor || wallPosts.length > ((page + 1) * pageSize)
					btrPagerStatus.input = true
					btrPagerStatus.pageNum = page + 1
	
					lastPageNum = page
	
					const startIndex = page * pageSize
					const endIndex = startIndex + pageSize
	
					$scope.groupWall.posts = wallPosts.slice(startIndex, endIndex).map($scope.convertResultToPostObject)
					$scope.$applyAsync()
				}
	
				const loadMorePosts = () => {
					if(loadMorePromise) {
						return loadMorePromise
					}
					
					const currentLoadMore = activeLoadMore += 1
					
					return loadMorePromise = Promise.resolve().then(async () => {
						const groupId = ctrl.groupId || $scope.library.currentGroup.id
						const url = `https://groups.roblox.com/v2/groups/${groupId}/wall/posts?sortOrder=Desc&limit=100&cursor=${nextPageCursor}`
						
						let res
						
						while(true) {
							res = await fetch(url, { credentials: "include" })
							if(activeLoadMore !== currentLoadMore) { return }
							
							if(!res.ok) {
								await new Promise(resolve => setTimeout(resolve, 1e3))
								if(activeLoadMore !== currentLoadMore) { return }
								continue
							}
							
							break
						}
						
						const json = await res.json()
						if(activeLoadMore !== currentLoadMore) { return }
						
						nextPageCursor = json.nextPageCursor || null
						wallPosts.push(...json.data.filter(x => x.poster))
	
						loadMorePromise = null
					})
				}
	
				const requestWallPosts = page => {
					if(!Number.isSafeInteger(page)) { return }
					const myCounter = ++requestCounter
	
					btrPagerStatus.prev = false
					btrPagerStatus.next = false
					btrPagerStatus.input = false
	
					page = Math.max(0, Math.floor(page))
					isLoadingPosts = true
	
					const startIndex = page * pageSize
					const endIndex = startIndex + pageSize
					
					const tryAgain = () => {
						if(requestCounter !== myCounter) { return }
	
						if(wallPosts.length < endIndex && nextPageCursor !== null) {
							loadMorePosts().then(tryAgain)
							return
						}
	
						const maxPage = Math.max(0, Math.floor((wallPosts.length - 1) / pageSize))
						setPageNumber(Math.min(maxPage, page))
	
						isLoadingPosts = false
					}
	
					tryAgain()
				}
	
				$scope.groupWall.pager.isBusy = () => isLoadingPosts
				$scope.groupWall.pager.loadNextPage = () => {}
				$scope.groupWall.pager.loadFirstPage = () => {
					wallPosts.splice(0, wallPosts.length)
					nextPageCursor = ""
					loadMorePromise = null
					activeLoadMore += 1
					requestWallPosts(0)
				}
				
				$scope.btrAttachInput = () => {
					const input = document.querySelector(".btr-comment-pager input")
		
					const updateInputWidth = () => {
						input.style.width = "0px"
						input.style.width = `${Math.max(32, Math.min(100, input.scrollWidth + 12))}px`
					}
					
					input.addEventListener("input", updateInputWidth)
					input.addEventListener("change", updateInputWidth)
					
					const descriptor = {
						configurable: true,
						
						get() {
							delete this.value
							const result = this.value
							Object.defineProperty(input, "value", descriptor)
							return result
						},
						set(x) {
							delete this.value
							this.value = x
							Object.defineProperty(input, "value", descriptor)
							updateInputWidth()
						}
					}
					
					Object.defineProperty(input, "value", descriptor)
				}
	
				$scope.btrPagerStatus = btrPagerStatus
				$scope.btrLoadWallPosts = cursor => {
					let pageNum = lastPageNum
	
					if(cursor === "prev") {
						pageNum = lastPageNum - 1
					} else if(cursor === "next") {
						pageNum = lastPageNum + 1
					} else if(cursor === "input") {
						const input = document.querySelector(".btr-comment-pager input")
						const value = parseInt(input.value, 10)
	
						if(Number.isSafeInteger(value)) {
							pageNum = Math.max(0, value - 1)
						}
					} else if(cursor === "first") {
						pageNum = lastPageNum - 50
					} else if(cursor === "last") {
						pageNum = lastPageNum + 50
					}
	
					requestWallPosts(pageNum)
				}
			}
	
			angularHook.hijackModule("group", {
				groupWallController(target, thisArg, args, argsMap) {
					const result = target.apply(thisArg, args)
	
					try {
						createCustomPager(thisArg, argsMap)
					} catch(ex) {
						console.error(ex)
						if(IS_DEV_MODE) { alert("hijackAngular Error") }
					}
	
					return result
				}
			})
		},
		"favoritesAtTop": () => {
			hijackXHR(request => {
				if(request.method === "POST" && request.url.match(/^https:\/\/apis\.roblox\.com\/discovery-api\/omni-recommendation(-metadata)?$/i)) {
					request.onResponse.push(json => {
						if(settings.home.favoritesAtTop && json?.sorts) {
							const favoritesSort = json.sorts.find(x => x.topicId === 100000001)
							const continueSort = json.sorts.find(x => x.topicId === 100000003)
							
							if(favoritesSort) {
								json.sorts.splice(json.sorts.indexOf(favoritesSort), 1)
								json.sorts.splice(1, 0, favoritesSort)
							}
							
							if(continueSort) {
								json.sorts.splice(json.sorts.indexOf(continueSort), 1)
								json.sorts.splice(1, 0, continueSort)
							}
						}
					})
				}
			})
		},
		"showRecommendationPlayerCount": () => {
			reactHook.hijackConstructor(
				(type, props) => "wideTileType" in props && "gameData" in props && "playerCountStyle" in props,
				(target, thisArg, args) => {
					const props = args[0]
					props.playerCountStyle = "Footer"
					return target.apply(thisArg, args)
				}
			)
		},
		"instantGameHoverAction": () => {
			reactHook.inject(".hover-game-tile.old-hover", elem => {
				const props = elem[0].props
				
				const [isFocused, setIsFocused] = reactHook.React.useState(false)
				
				props.className = (props.className ?? "").replace(/\bfocused\b/, "")
				props.className += " btr-game-hover-fix"
				
				if(isFocused) {
					props.className += " focused"
				}
				
				props.onMouseOver = new Proxy(props.onMouseOver ?? (() => {}), {
					apply(target, thisArg, args) {
						setIsFocused(true)
						return target.apply(thisArg, args)
					}
				})
				
				props.onMouseLeave = new Proxy(props.onMouseLeave ?? (() => {}), {
					apply(target, thisArg, args) {
						setIsFocused(false)
						return target.apply(thisArg, args)
					}
				})
			})
		},
		"inventoryTools": () => {
			angularHook.hijackModule("inventory", {
				inventoryContentController(target, thisArg, args, argsMap) {
					const result = target.apply(thisArg, args)
					
					try {
						const { $scope } = argsMap
						
						$scope.$watch("$ctrl.assets", () => {
							setTimeout(() => contentScript.send("inventoryUpdateEnd"), 0)
						})
						
					} catch(ex) {
						console.error(ex)
						if(IS_DEV_MODE) { alert("hijackAngular Error") }
					}
					
					return result
				}
			})
		},
		"refreshInventory": () => {
			const scope = angular.element(document.querySelector("assets-explorer")).scope()
			const ctrl = scope?.$parent?.$ctrl
			
			if(ctrl) {
				const real1 = ctrl.cursorPager.loadPreviousPage
				const real2 = ctrl.assetsPager.canLoadPreviousPage
				
				ctrl.cursorPager.loadPreviousPage = ctrl.cursorPager.reloadCurrentPage
				ctrl.assetsPager.canLoadPreviousPage = () => true
				
				try { ctrl.assetsPager.loadPreviousPage() }
				catch(ex) {}
				
				ctrl.cursorPager.loadPreviousPage = real1
				ctrl.assetsPager.canLoadPreviousPage = real2
			}
		},
		"itemdetails": () => {
			reactHook.hijackConstructor(
				(type, props) => "itemDetails" in props,
				(target, thisArg, args) => {
					const result = target.apply(thisArg, args)
					
					try {
						const props = args[0]
						
						if(result?.props?.className?.includes("item-details-info-header")) {
							const { itemDetails } = props
							
							result.props.children.splice(1, 0, reactHook.createElement("div", {
								className: "btr-buttons",
								dangerouslySetInnerHTML: { __html: "" },
								
								"data-btr-asset-id": itemDetails.id,
								"data-btr-asset-type-id": itemDetails.assetType,
								"data-btr-item-type": itemDetails.itemType,
							}))
						}
					} catch(ex) {
						console.error(ex)
					}
					
					return result
				}
			)
		},
		"refreshMessages": () => {
			const scope = angular.element(document.querySelector(`div[ng-controller="messagesController"]`))?.scope()
			
			if(scope) {
				scope.getMessages(scope.currentStatus.activeTab, scope.currentStatus.currentPage)
				scope.$digest()
			}
		},
		"messages": () => {
			angularHook.hijackModule("messages", {
				messagesNav(target, thisArg, args, argsMap) {
					const result = target.apply(thisArg, args)

					try {
						const { $location } = argsMap
						
						hijackFunction(result, "link", (target, thisArg, args) => {
							try {
								const [$state] = args
								
								$state.btr_setPage = $event => {
									const value = +$event.target.value

									if(!Number.isNaN(value)) {
										$location.search({ page: value })
										$event.target.value = value
									} else {
										$event.target.value = $state.currentStatus.currentPage
									}
								}
							} catch(ex) {
								console.error(ex)
								if(IS_DEV_MODE) { alert("hijackAngular Error") }
							}

							return target.apply(thisArg, args)
						})
					} catch(ex) {
						console.error(ex)
						if(IS_DEV_MODE) { alert("hijackAngular Error") }
					}

					return result
				}
			})
		},
		"money": () => {
			reactHook.inject(".balance-label.icon-robux-container", elem => {
				const list = elem[0].props.children[0]?.props.children
				
				if(Array.isArray(list)) {
					const robux = parseInt(list.at(-1).replace(/\D/g, ""), 10)
					
					if(Number.isSafeInteger(robux)) {
						const cash = RobuxToCash.convert(robux)
						
						list.push(reactHook.createElement("span", {
							className: "btr-robuxToCash",
							children: ` (${cash})`
						}))
					}
				}
			})
		},
		"profile": () => {
			angularHook.hijackModule("peopleList", {
				layoutService(target, thisArg, args, argsMap) {
					const result = target.apply(thisArg, args)
					result.maxNumberOfFriendsDisplayed = 10
					return result
				}
			})
			
			reactHook.inject(".profile-tab-content", tabContent => {
				for(const child of tabContent[0].props.children) {
					switch(child.key) {
					case "About":
					case "CurrentlyWearing":
					case "FavoriteExperiences":
					case "Friends":
					case "Collections":
					case "Communities":
					case "RobloxBadges":
					case "PlayerBadges":
					case "Statistics":
					case "Experiences":
					case "CreationsModels":
					case "Clothing":
						delete child.props.children
						break
					default:
						if(IS_DEV_MODE) {
							console.log(`Unknown component '${child.key}'`)
						}
					}
				}
			})
		},
		"adblock.js": () => {
			util.ready(() => {
				if(window.Roblox?.PrerollPlayer) {
					window.Roblox.PrerollPlayer.waitForPreroll = x => $.Deferred().resolve(x)
				}

				if(window.Roblox?.VideoPreRollDFP) {
					window.Roblox.VideoPreRollDFP = null
				}
			})
		},
		"fastsearch": () => {
			reactHook.inject("#navbar-universal-search, .navbar-search", elem => {
				elem.find("ul")?.prepend(reactHook.createElement("div", {
					id: "btr-fastsearch-container",
					dangerouslySetInnerHTML: { __html: "" }
				}))
			})
		},
		"navigation": () => {
			reactHook.inject("ul.navbar-right", elem => {
				const robux = elem.find(x => "robuxAmount" in x.props)
				
				if(robux) {
					robux.before(
						reactHook.createElement("div", {
							id: "btr-placeholder-friends",
							style: { display: "none" },
							dangerouslySetInnerHTML: { __html: "" }
						}),
						reactHook.createElement("div", {
							id: "btr-placeholder-messages",
							style: { display: "none" },
							dangerouslySetInnerHTML: { __html: "" }
						}),
					)
				}
			})
			
			reactHook.inject(".left-col-list", elem => {
				const trade = elem.find(x => x.key === "trade")
				if(trade) {
					trade.after(
						reactHook.createElement("div", {
							id: "btr-placeholder-money",
							style: { display: "none" },
							dangerouslySetInnerHTML: { __html: "" }
						}),
					)
				}
				
				const blog = elem.find(x => x.key === "blog")
				if(blog) {
					blog.before(
						reactHook.createElement("div", {
							id: "btr-placeholder-premium",
							style: { display: "none" },
							dangerouslySetInnerHTML: { __html: "" }
						}),
					)
					
					blog.after(
						reactHook.createElement("div", {
							id: "btr-placeholder-blogfeed",
							style: { display: "none" },
							dangerouslySetInnerHTML: { __html: "" }
						}),
					)
				}
			})
		}
		// Stop inserting injected functions here
	}
	
	contentScript.listen("call", (name, args) => {
		injectedFunctions[name](...args)
	})
	
	//
	
	contentScript.listen("setCurrentPage", _currentPage => {
		currentPage = _currentPage
	})
	
	reactHook.init()
	angularHook.init()
}, { once: true })
"use strict"

const INJECT_SCRIPT = (settings, IS_DEV_MODE, selectedRobuxToCashOption) => {
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
	
	const assert = (bool, ...args) => {
		if(!bool) { throw new Error(...args) }
		return bool
	}
	
	const xhrTransforms = []
	
	const hijackXHR = fn => {
		xhrTransforms.push(fn)
		
		if(xhrTransforms.length === 1) {
			const xhrDetails = new WeakMap()
			
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
		getSelectedOption() {
			return selectedRobuxToCashOption
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
				// 	assert(!selector.next)
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
						path.push(child)
						const result = this._queryList([child.props.children], newSelectors, depth - 1, all, path)
						path.pop()
						
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

	reactHook.init()
	angularHook.init()
	
	//
	
	contentScript.listen("setCurrentPage", currentPage => {
		BTRoblox.currentPage = currentPage
	})
	
	//
	
	Object.assign(window.BTRoblox, {
		settings,
		IS_DEV_MODE,
		RobuxToCash,
		
		contentScript,
		angularHook,
		reactHook,
		
		hijackFunction,
		hijackXHR,
		onReady,
		onSet,
		assert
	})
}
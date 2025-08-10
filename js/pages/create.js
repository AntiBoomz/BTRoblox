"use strict"

pageInit.create = () => {
	// Init global features
	
	Navigation.init()
	SettingsModal.enable()
	
	//
	
	injectScript.call("hijackAuth", () => {
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
	})
	
	injectScript.listen("onFirstAuth", json => {
		const userId = json?.id ?? -1
		
		loggedInUser = Number.isSafeInteger(userId) ? userId : -1
		loggedInUserPromise.$resolve(loggedInUser)
	}, { once: true })
	
	//
	
	if(!SETTINGS.get("create.enabled")) {
		return
	}
	
	injectScript.call("webpackHook", () => {
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
	})
	
	// Add settings
	injectScript.call("createAddBTRSettings", () => {
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
	})
}
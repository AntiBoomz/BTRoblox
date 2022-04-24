"use strict"

const INJECT_SCRIPT = (settings, currentPage, matches, IS_DEV_MODE) => {
	"use strict"
	
	const contentScript = {
		send(action, ...args) {
			document.dispatchEvent(new CustomEvent("content." + action, { detail: args }))
		},
		listen(actions, callback, props) {
			const actionList = actions.split(" ")
			const once = props && props.once

			const cb = ev => {
				if(once) {
					actionList.forEach(action => {
						document.removeEventListener(`inject.${action}`, cb)
					})
				}

				return callback(...ev.detail)
			}

			actionList.forEach(action => {
				document.addEventListener(`inject.${action}`, cb)
			})
		}
	}

	const modifyTemplate = {
		cachedResults: {},
		listeningFor: {},
		caches: new Set(),
		
		update(key) {
			this.caches.forEach(cache => {
				const oldValue = cache.get(key)
				if(oldValue) {
					this.putTemplate(cache, key, oldValue)
				}
			})
		},

		listenForTemplate(key) {
			this.listeningFor[key] = true
			this.update(key)
		},

		putTemplate($templateCache, key, value) {
			if(key in this.cachedResults) {
				value = this.cachedResults[key]
			}
			
			this.cachedResults[key] = value
			$templateCache.real_put(key, value)
			
			if(this.listeningFor[key]) {
				delete this.listeningFor[key]

				contentScript.listen(`TEMPLATE_${key}`, changedValue => {
					this.cachedResults[key] = changedValue
					$templateCache.real_put(key, changedValue)
					this.update(key)
				})
				
				contentScript.send(`TEMPLATE_${key}`, $templateCache.get(key))
			}
			
			return $templateCache.get(key)
		},

		addCache($templateCache) {
			if(this.caches.has($templateCache)) {
				return
			}

			this.caches.add($templateCache)

			$templateCache.real_put = $templateCache.put
			$templateCache.put = (key, value) => this.putTemplate($templateCache, key, value)
		}
	}

	const reactHook = {
		constructorReplaces: [],
		injectedContent: [],
		
		stateQueue: [],
		stateIndex: 0,
		
		// Content injection
		
		contentInject(data) {
			this.injectedContent.push(data)
		},
		
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

	function hijackFunction(a, b, c) {
		if(arguments.length === 2) {
			return new Proxy(a, { apply: b })
		}

		return a[b] = new Proxy(a[b], { apply: c })
	}

	//

	const angularListeners = {}

	const angularApplyEntry = (module, entry, callback) => {
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
	}

	const angularInitEntry = (module, entry) => {
		const name = entry[2][0]
		const listeners = angularListeners[module.name]?.[name]
		if(!listeners) { return }
		
		for(const callback of listeners) {
			angularApplyEntry(module, entry, callback)
		}
	}

	const hijackAngular = (moduleName, objects) => {
		let module
		
		try { module = angular.module(moduleName) }
		catch(ex) {}
		
		if(module) {
			for(const data of module._invokeQueue) {
				const callback = objects[data[2][0]]
				if(callback) {
					angularApplyEntry(module, data, callback)
				}
			}
		}
		
		for(const [name, callback] of Object.entries(objects)) {
			angularListeners[moduleName] = angularListeners[moduleName] ?? {}
			angularListeners[moduleName][name] = angularListeners[moduleName][name] ?? []
			angularListeners[moduleName][name].push(callback)
		}
	}

	//

	function preInit() {
		reactHook.init()
		
		onSet(window, "angular", angular => {
			onSet(angular, "module", () => {
				const initModule = module => {
					if(module.name === "ng") {
						module.run($templateCache => modifyTemplate.addCache($templateCache))
					}
					
					for(const entry of module._invokeQueue) {
						angularInitEntry(module, entry)
					}
					
					const init = (target, thisArg, args) => {
						for(const entry of args) {
							angularInitEntry(module, entry)
						}
						
						return target.apply(thisArg, args)
					}
					
					hijackFunction(module._invokeQueue, "unshift", init)
					hijackFunction(module._invokeQueue, "push", init)
				}
				
				// This wont catch initializing ng, so may as well
				// do it on the first module init.
				let didInitNg = false
				
				hijackFunction(angular, "module", (origFn, thisArg, args) => {
					if(!didInitNg) {
						didInitNg = true
						initModule(origFn.call(angular, "ng"))
					}
					
					const module = origFn.apply(thisArg, args)
					initModule(module)
					return module
				})
			})
		})
		
		//

		if(currentPage === "inventory" && settings.inventory.enabled && settings.inventory.inventoryTools) {
			hijackAngular("assetsExplorer", {
				assetsService(handler, args) {
					const result = handler.apply(this, args)

					try {
						const tbuat = result.beginUpdateAssetsItems
						result.beginUpdateAssetsItems = function(...iargs) {
							const promise = tbuat.apply(result, iargs)

							contentScript.send("inventoryUpdateBegin")
							promise.then(() => {
								setTimeout(() => {
									contentScript.send("inventoryUpdateEnd")
								}, 0)
							})

							return promise
						}
					} catch(ex) {
						console.error(ex)
						if(IS_DEV_MODE) { alert("hijackAngular Error") }
					}

					return result
				}
			})
		}

		if(currentPage === "home" && settings.home.friendsSecondRow) {
			hijackAngular("peopleList", {
				peopleListContainer(handler, args) {
					const directive = handler.apply(this, args)
					
					directive.link = ($scope, iElem) => {
						const elem = iElem[0]
						
						let showSecondRow = true
						
						try { showSecondRow = !!localStorage.getItem("btr-showSecondRow") }
						catch(ex) { console.error(ex) }
						
						elem.classList.toggle("btr-home-secondRow", showSecondRow)
						
						$scope.$watch("library.numOfFriends", numOfFriends => {
							if(numOfFriends == null) { return }
							
							showSecondRow = numOfFriends > 9
							elem.classList.toggle("btr-home-secondRow", showSecondRow)
							
							if(showSecondRow) {
								localStorage.setItem("btr-showSecondRow", "1")
							} else {
								localStorage.removeItem("btr-showSecondRow")
							}
						})
					}
					
					return directive
				},
				layoutService(handler, args) {
					const result = handler.apply(this, args)
					result.maxNumberOfFriendsDisplayed = 18
					return result
				}
			})
		}
		
		if(currentPage === "profile" && settings.profile.enabled) {
			hijackAngular("peopleList", {
				layoutService(handler, args) {
					const result = handler.apply(this, args)
					result.maxNumberOfFriendsDisplayed = 10
					return result
				}
			})
		}

		if(currentPage === "avatar" && settings.avatar.enabled) {
			const accessoryAssetTypeIds = [8, 41, 42, 43, 44, 45, 46, 47]

			hijackAngular("avatar", {
				avatarController(handler, args, argsMap) {
					const result = handler.apply(this, args)

					try {
						const { $scope, avatarTypeService } = argsMap

						const setMaxNumbers = () => {
							try {
								Object.values(avatarTypeService.assetTypeNameLookup).forEach(assetType => {
									if(accessoryAssetTypeIds.includes(assetType.id)) {
										assetType.maxNumber = 10
									}
								})
							} catch(ex) { console.error(ex) }
						}

						setMaxNumbers()
						
						hijackFunction($scope, "validateAdvancedAccessories", (target, thisArg, args) => {
							return true
						})
						
						hijackFunction(avatarTypeService, "setAssetTypeLookups", (target, thisArg, args) => {
							const result = target.apply(thisArg, args)
							setMaxNumbers()
							return result
						})

						hijackFunction($scope, "onItemClicked", (target, thisArg, args) => {
							const item = args[0]

							if(item instanceof Object && item.type === "Asset" && !item.selected && accessoryAssetTypeIds.includes(item.assetType.id)) {
								const origName = item.assetType.name
								item.assetType.name = "Accessory"

								const result = target.apply(thisArg, args)
								item.assetType.name = origName

								return result
							}

							return target.apply(thisArg, args)
						})
					} catch(ex) { console.error(ex) }

					return result
				}
			})
		}

		if(currentPage === "messages") {
			hijackAngular("messages", {
				messagesNav(handler, args, argMap) {
					const result = handler.apply(this, args)

					try {
						const { $location } = argMap

						const link = result.link
						result.link = function(u) {
							try {
								u.btr_setPage = function($event) {
									const value = +$event.target.value

									if(!Number.isNaN(value)) {
										$location.search({ page: value })
										$event.target.value = value
									} else {
										$event.target.value = u.currentStatus.currentPage
									}
								}
							} catch(ex) {
								console.error(ex)
								if(IS_DEV_MODE) { alert("hijackAngular Error") }
							}

							return link.call(this, u)
						}
					} catch(ex) {
						console.error(ex)
						if(IS_DEV_MODE) { alert("hijackAngular Error") }
					}

					return result
				}
			})
		}
	}

	function documentReady() {
		if(!window.jQuery) {
			console.warn("[BTR] window.jQuery not set")
			return
		}

		if(typeof Roblox !== "undefined") {
			if(settings.general.fixAudioVolume) {
				const audioService = Roblox.Audio && Roblox.Audio.AudioService

				if(audioService && audioService.getAudioPlayer) {
					hijackFunction(audioService, "getAudioPlayer", (target, thisArg, args) => {
						const origAudio = window.Audio

						const audioProxy = new Proxy(origAudio, {
							construct(target, args) {
								const audio = new target(...args)
								audio.volume = 0.3
								return audio
							}
						})

						window.Audio = audioProxy
						const result = target.apply(thisArg, args)
						window.Audio = origAudio
						return result
					})
				}
			}

			if(settings.general.hideAds) {
				if(Roblox.PrerollPlayer) {
					Roblox.PrerollPlayer.waitForPreroll = x => $.Deferred().resolve(x)
				}

				if(Roblox.VideoPreRollDFP) {
					Roblox.VideoPreRollDFP = null
				}
			}

			if(currentPage === "develop") {
				if(Roblox.BuildPage) {
					Roblox.BuildPage.GameShowcase = new Proxy(Roblox.BuildPage.GameShowcase || {}, {
						set(target, name, value) {
							target[name] = value
							const table = document.querySelector(`.item-table[data-rootplace-id="${name}"]`)
							if(table) { table.dataset.inShowcase = value }
							return true
						}
					})
				}
			}
		} else {
			console.warn("[BTR] window.Roblox not set")
		}
	}

	//
	
	window.BTRoblox = window.BTRoblox ?? {}
	Object.assign(window.BTRoblox, {
		settings, currentPage, matches, IS_DEV_MODE,
		
		contentScript,
		reactHook,
		
		hijackFunction,
		hijackAngular,
		onReady,
		onSet
	})
	
	contentScript.listen("setupPopover", () => {
		Roblox.BootstrapWidgets.SetupPopover()
	})

	contentScript.listen("linkify", target => {
		if(window.Roblox?.Linkify) { $(target).linkify() }
		else { target.classList.add("linkify") }
	})

	contentScript.listen("reactInject", (...args) => reactHook.contentInject(...args))
	contentScript.listen("initTemplate", key => modifyTemplate.listenForTemplate(key))
	
	//
	
	contentScript.send("init")
	
	//
	
	preInit()
	onReady(documentReady)
}
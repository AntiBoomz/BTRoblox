"use strict"

const INJECT_SCRIPT = (settings, currentPage, matches, IS_DEV_MODE) => {
	"use strict"
	
	const ContentJS = {
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

				ContentJS.listen(`TEMPLATE_${key}`, changedValue => {
					this.cachedResults[key] = changedValue
					$templateCache.real_put(key, changedValue)
					this.update(key)
				})
				
				ContentJS.send(`TEMPLATE_${key}`, $templateCache.get(key))
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
		
		if(settings.general.fixFirefoxLocalStorageIssue) {
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
		}
		
		if(settings.general.cacheRobuxAmount) {
			reactHook.hijackConstructor(
				([fn, props]) => "robuxAmount" in props && fn.toString().includes("nav-robux-amount"),
				(target, thisArg, args) => {
					const result = target.apply(thisArg, args)
					
					try {
						const amountLabel = reactHook.queryElement(result, x => x.props?.id === "nav-robux-amount")
						
						if(amountLabel) {
							if(amountLabel.props.children) {
								if(typeof amountLabel.props.children === "string") {
									localStorage.setItem("btr-cached-robux", amountLabel.props.children)
								}
							} else {
								const cached = localStorage.getItem("btr-cached-robux")
								
								if(cached) {
									amountLabel.props.children = cached
								}
							}
						}
					} catch(ex) {}
					
					return result
				}
			)
		}
		
		if(settings.general.higherRobuxPrecision) {
			let hijackTruncValue = false

			onSet(window, "CoreUtilities", CoreUtilities => {
				hijackFunction(CoreUtilities.abbreviateNumber, "getTruncValue", (target, thisArg, args) => {
					if(hijackTruncValue && args.length === 1) {
						const result = target.apply(thisArg, args)

						if(result.endsWith("+") && result.length < 5) {
							try {
								return target.apply(thisArg, [args[0], null, null, result.length - 1])
							} catch(ex) {
								console.error(ex)
							}
						}

						return result
					}

					return target.apply(thisArg, args)
				})
			})

			reactHook.hijackConstructor(
				([fn, props]) => "robuxAmount" in props && fn.toString().includes("nav-robux-amount"),
				(target, thisArg, args) => {
					hijackTruncValue = true
					const result = target.apply(thisArg, args)
					hijackTruncValue = false
					return result
				}
			)
		}
		
		if(settings.general.smallChatButton) {
			hijackAngular("chat", {
				chatController(func, args, argMap) {
					const result = func.apply(this, args)

					try {
						const { $scope, chatUtility } = argMap

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
		}

		if(currentPage === "inventory" && settings.inventory.enabled && settings.inventory.inventoryTools) {
			hijackAngular("assetsExplorer", {
				assetsService(handler, args) {
					const result = handler.apply(this, args)

					try {
						const tbuat = result.beginUpdateAssetsItems
						result.beginUpdateAssetsItems = function(...iargs) {
							const promise = tbuat.apply(result, iargs)

							ContentJS.send("inventoryUpdateBegin")
							promise.then(() => {
								setTimeout(() => {
									ContentJS.send("inventoryUpdateEnd")
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

		if(currentPage === "groups" && settings.groups.redesign) {
			if(settings.groups.modifySmallSocialLinksTitle) {
				hijackAngular("socialLinksJumbotron", {
					socialLinkIcon(component) {
						component.bindings.title = "<"
					}
				})
			}

			if(settings.groups.pagedGroupWall) {
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
							
							let resp
							
							while(true) {
								resp = await fetch(url, { credentials: "include" })
								if(activeLoadMore !== currentLoadMore) { return }
								
								if(resp.status === 429) {
									await new Promise(resolve => setTimeout(resolve, 5e3))
									if(activeLoadMore !== currentLoadMore) { return }
									continue
								}
								
								break
							}
							
							const json = await resp.json()
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

				hijackAngular("group", {
					groupWallController(func, args, argMap) {
						const result = func.apply(this, args)

						try {
							createCustomPager(this, argMap)
						} catch(ex) {
							console.error(ex)
							if(IS_DEV_MODE) { alert("hijackAngular Error") }
						}

						return result
					}
				})
			}
		}
		
		if(currentPage === "gamedetails" && settings.gamedetails.enabled) {
			const placeId = matches[0]
			
			const btrPager = { currentPage: 1, targetPage: 1, hasMore: false, loading: false }
			const cursors = []
			
			const findMaxPage = async largePageIndex => {
				if(largePageIndex * 10 >= Math.max(btrPager.targetPage, btrPager.currentPage, btrPager.startingMaxPage ?? 1) + 200) {
					btrPager.updatingMaxPage = false
					btrPagerState.update()
					return null
				}
				
				const cursor = cursors[largePageIndex - 2] ?? ""
				const url = `https://games.roblox.com/v1/games/${placeId}/servers/Public?sortOrder=Desc&limit=100&cursor=${cursor}`
				
				await new Promise(resolve => setTimeout(resolve, 100))
				
				return fetch(url, { credentials: "include" }).then(async res => {
					if(!res.ok) {
						return Promise.reject()
					}
					
					const json = await res.json()
					const numSmallPages = Math.floor((json.data.length - 1) / 10) + 1
					
					if(numSmallPages === 0 && largePageIndex > 1) {
						cursors.splice(largePageIndex - 2, cursors.length)
						return findMaxPage(largePageIndex - 1)
					}
					
					if(json.nextPageCursor) {
						cursors[largePageIndex - 1] = json.nextPageCursor
						
						btrPager.maxPage = largePageIndex * 10 + 1
						btrPagerState.update()
						
						return findMaxPage(largePageIndex + 1)
					}
					
					btrPager.maxPage = (largePageIndex - 1) * 10 + Math.max(1, numSmallPages)
					btrPager.updatingMaxPage = false
					btrPager.foundMaxPage = true
					btrPagerState.update()
				}).catch(async () => {
					await new Promise(resolve => setTimeout(resolve, 400))
					return findMaxPage(cursors.length + 1)
				})
			}
			
			const btrPagerState = reactHook.createGlobalState(btrPager)
			
			const btrGetPublicGameInstances = () => {
				let updatedMaxPage = false
				
				btrPager.targetPage = Math.max(1, btrPager.targetPage)
				btrPager.loading = true
				
				const loadServers = targetPage => {
					let largePageIndex = Math.floor((targetPage - 1) / 10) + 1
					let smallPageIndex = (targetPage - 1) % 10 + 1
					
					let cursor
					let limit
					
					if(targetPage <= 1) {
						cursor = ""
						limit = 10
					} else {
						if(largePageIndex - 2 >= cursors.length) {
							largePageIndex = cursors.length + 1
							smallPageIndex = 10
						}
						
						cursor = cursors[largePageIndex - 2] ?? ""
						limit = 100
					}
					
					const url = `https://games.roblox.com/v1/games/${placeId}/servers/Public?sortOrder=Desc&limit=${limit}&cursor=${cursor}`
					
					return fetch(url, { credentials: "include" }).then(async res => {
						if(!res.ok) {
							return Promise.reject()
						}
						
						const json = await res.json()
						
						if(limit === 100) {
							const numSmallPages = Math.floor((json.data.length - 1) / 10) + 1
							
							if(numSmallPages === 0 && largePageIndex > 1) {
								cursors.splice(largePageIndex - 2, cursors.length)
								return loadServers((largePageIndex - 1) * 10)
							}
							
							if(numSmallPages > 0 || largePageIndex === 1) {
								const largestKnownPage = (largePageIndex - 1) * 10 + Math.max(1, numSmallPages)
								
								if(json.nextPageCursor) {
									if((btrPager.maxPage ?? -1) < largestKnownPage + 1) {
										btrPager.maxPage = largestKnownPage + 1
										btrPagerState.update()
									}
								} else {
									btrPager.maxPage = largestKnownPage
									btrPager.foundMaxPage = true
									btrPagerState.update()
									updatedMaxPage = true
								}
							}
							
							if(json.nextPageCursor) {
								cursors[largePageIndex - 1] = json.nextPageCursor
								
								if(targetPage > largePageIndex * 10) {
									return loadServers(targetPage)
								}
							}
							
							if(smallPageIndex > numSmallPages) {
								smallPageIndex = Math.max(1, numSmallPages)
							}
							
							json.nextPageCursor = (json.nextPageCursor || smallPageIndex < numSmallPages) ? "idk" : ""
							json.data = json.data.slice((smallPageIndex - 1) * 10, smallPageIndex * 10)
						} else {
							if(!json.nextPageCursor) {
								btrPager.maxPage = 1
								btrPager.foundMaxPage = true
								btrPagerState.update()
								updatedMaxPage = true
							}
						}
						
						if(!updatedMaxPage && !btrPager.updatingMaxPage) {
							if(limit === 100 || btrPager.maxPage) {
								btrPager.updatingMaxPage = true
								btrPagerState.update()
								
								findMaxPage(cursors.length + 1)
							}
						}
						
						btrPager.currentPage = (largePageIndex - 1) * 10 + smallPageIndex
						btrPager.loading = false
						
						return { data: json }
					}).catch(() => {
						btrPager.loading = false
						return null
					})
				}
				
				return loadServers(btrPager.targetPage)
			}
			
			const btrPagerConstructor = ({ refreshGameInstances }) => {
				const btrPager = reactHook.useGlobalState(btrPagerState)
				
				const canPrev = !btrPager.loading && btrPager.currentPage > 1
				const canNext = !btrPager.loading && btrPager.currentPage < (btrPager.maxPage ?? 2)
				
				const inputRef = React.useRef()
				
				const updateInputWidth = () => {
					inputRef.current.style.width = "0px"
					inputRef.current.style.width = `${Math.max(32, Math.min(100, inputRef.current.scrollWidth + 12))}px`
				}
				
				React.useEffect(updateInputWidth, [])
				
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
										refreshGameInstances()
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
										btrPager.targetPage = btrPager.currentPage - 1
										refreshGameInstances()
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
									defaultValue: btrPager.currentPage,
									ref: inputRef,
									
									onChange() {
										updateInputWidth()
									},
									
									onKeyDown(e) {
										if(e.which === 13) {
											e.target.blur()
										}
									},
									
									onBlur(e) {
										const num = parseInt(e.target.value, 10)
		
										if(!Number.isNaN(num)) {
											btrPager.targetPage = num
											refreshGameInstances()
										} else {
											e.target.value = btrPager.currentPage
										}
									}
								}
							),
							React.createElement(
								"span", {},
								` of `,
								
								React.createElement(
									"span", {
										className: "btr-pager-total",
										title: (!btrPager.foundMaxPage && !btrPager.updatingMaxPage) ? "Click to load more" : null,
										style: {
											opacity: (!btrPager.foundMaxPage && !btrPager.updatingMaxPage) ? "0.7" : null,
											cursor: (!btrPager.foundMaxPage && !btrPager.updatingMaxPage) ? "pointer" : null
										},
										
										onClick() {
											if(!btrPager.updatingMaxPage && !btrPager.foundMaxPage) {
												btrPager.updatingMaxPage = true
												btrPager.startingMaxPage = btrPager.maxPage ?? 1
												findMaxPage(cursors.length + 1)
											}
										}
									},
									btrPager.maxPage ? `${btrPager.maxPage}${btrPager.foundMaxPage ? "" : "+"}` : "??"
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
										refreshGameInstances()
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
										refreshGameInstances()
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
			
			reactHook.hijackConstructor( // RunningGameServers
				args => args[1]?.getGameServers,
				(target, thisArg, args) => {
					const [props] = args
					
					if(settings.gamedetails.addServerPager && (props.getGameServers?.name === "getPublicGameInstances" || props.getGameServers === btrGetPublicGameInstances)) {
						props.getGameServers = btrGetPublicGameInstances
						
						const result = target.apply(thisArg, args)
						
						try {
							const serverList = reactHook.queryElement(result, x => x.props.gameInstances)
							
							if(serverList) {
								serverList.props.btrPagerEnabled = true
							}
							
						} catch(ex) {
							console.error(ex)
						}
						
						return result
					}
					
					return target.apply(thisArg, args)
				}
			)
			
			reactHook.hijackConstructor( // GameSection
				args => args[1]?.loadMoreGameInstances,
				(target, thisArg, args) => {
					if(args[0].btrPagerEnabled) {
						args[0].showLoadMoreButton = false
					}
					
					const result = target.apply(thisArg, args)
					
					try {
						const list = reactHook.queryElement(result, x => x.props.id?.includes("running-games"))
						
						if(args[0].btrPagerEnabled) {
							list.props.children.push(
								React.createElement(btrPagerConstructor, {
									refreshGameInstances: args[0].refreshGameInstances
								})
							)
						}
						
						if(settings.gamedetails.showServerPing) {
							const ul = reactHook.queryElement(list, x => x.type === "ul", 5)
							
							let servers = ul?.props?.children
							if(servers) {
								if(!Array.isArray(servers)) { servers = [servers] }
								
								for(const server of servers) {
									const serverInfo = args[0]?.gameInstances?.find(x => x.id === server.props.id)

									if(serverInfo) {
										server.props.gameServerStatus += `\nPing: ${serverInfo.ping ?? 0}ms`
									}
								}
							}
						}
					} catch(ex) {
						console.error(ex)
					}
					
					return result
				}
			)
			
			reactHook.hijackConstructor( // GameInstance
				args => args[1]?.gameServerStatus,
				(target, thisArg, args) => {
					const result = target.apply(thisArg, args)
					
					try {
						const list = reactHook.queryElement(result, x => x.props?.className?.includes("game-server-players"))
						let entries = list?.props?.children
						
						if(entries) {
							if(!Array.isArray(entries)) { entries = [entries] }
							
							for(const entry of entries) {
								const thumb = reactHook.queryElement(entry, x => x.props?.type === "AvatarHeadshot")
								
								if(thumb && thumb.props.token?.startsWith("btr/")) {
									const token = thumb.props.token
									thumb.type = "span"
									
									for(const key of Object.keys(thumb.props)) {
										delete thumb.props[key]
									}
									
									thumb.props.className = "thumbnail-2d-container avatar-card-image"
									thumb.props.children = React.createElement(
										"img", { src: token.slice(4) }
									)
								}
							}
						}
					} catch(ex) {
						console.error(ex)
					}
					
					return result
				}
			)
			
			const updateHash = ev => {
				const hash = location.hash
				
				if(ev && new window.URL(ev.newURL).hash !== hash) {
					return
				}
				
				if(!hash || !ev && hash !== "#!/about" && hash !== "#!/store" && hash !== "#!/game-instances") {
					history.replaceState("", document.title, location.pathname + location.search + "#!/game-instances")
					setTimeout(() => history.replaceState("", document.title, location.pathname + location.search + hash), 0)
				}
			}
			
			onReady(() => {
				window.addEventListener("hashchange", updateHash)
				updateHash()
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
	
	ContentJS.listen("setupPopover", () => {
		Roblox.BootstrapWidgets.SetupPopover()
	})

	ContentJS.listen("linkify", target => {
		if(window.Roblox?.Linkify) { $(target).linkify() }
		else { target.classList.add("linkify") }
	})

	ContentJS.listen("reactInject", (...args) => reactHook.contentInject(...args))
	ContentJS.listen("initTemplate", key => modifyTemplate.listenForTemplate(key))
	
	//
	
	ContentJS.send("init")
	
	//
	
	preInit()
	onReady(documentReady)
}
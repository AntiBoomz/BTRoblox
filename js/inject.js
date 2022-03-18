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
		
		contentInject(data) {
			this.injectedContent.push(data)
		},
		
		replaceConstructor(filter, handler) {
			this.constructorReplaces.push({
				filter, handler
			})
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
		
		querySelector(selectors, elem) {
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

		onCreateElement(args) {
			const props = args[1]
			
			if(!settings || !(props instanceof Object)) {
				return
			}

			if(typeof args[0] === "function") {
				for(const info of this.constructorReplaces) {
					if(info.filter(args)) {
						args[0] = new Proxy(args[0], { apply: info.handler })
					}
				}
			}
			
			if(props?.dangerouslySetInnerHTML?.__html !== " ") { // Skip our own elems
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
					const target = this.querySelector(content.selector, rootElem)
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
			}
		}
	}

	//

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

		a[b] = new Proxy(a[b], { apply: c })
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

		onSet(window, "React", React => {
			hijackFunction(React, "createElement", (target, thisArg, args) => {
				try { reactHook.onCreateElement(args) }
				catch(ex) { console.error(ex) }
				return target.apply(thisArg, args)
			})
		})
	}

	function settingsLoaded() {
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

			reactHook.replaceConstructor(
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

			if(currentPage === "gamedetails" && settings.gamedetails.enabled) {
				if(Roblox.RunningGameInstances) {
					// Legacy server list code
					
					// Server pagers
					const createPager = gameInstance => {
						let curPage = 1
						let maxPage = 1

						$(".rbx-running-games-load-more").hide() // Hide Load More
						$(".rbx-running-games-footer > .pager").hide() // Hide Roblox+ pager?

						const pager = $(`
						<div class=btr-pager-holder>
							<ul class="pager btr-server-pager">
								<li class=first><a><span class=icon-first-page></a></li>
								<li class=pager-prev><a><span class=icon-left></a></li>
								<li class=pager-mid>
									Page <input class=pager-cur type=text></input>
									of <span class=pager-total></span>
								</li>
								<li class=pager-next><a><span class=icon-right></a></li>
								<li class=last><a><span class=icon-last-page></a></li>
							</ul>
						</div>`).appendTo($(".rbx-running-games-footer"))

						const updatePager = () => {
							pager.find(".pager-cur").val(curPage)
							pager.find(".pager-total").text(maxPage)

							pager.find(".first").toggleClass("disabled", curPage <= 1)
							pager.find(".pager-prev").toggleClass("disabled", curPage <= 1)
							pager.find(".last").toggleClass("disabled", curPage >= maxPage)
							pager.find(".pager-next").toggleClass("disabled", curPage >= maxPage)

							$(".rbx-game-server-join").removeAttr("href")
						}

						$.ajaxPrefilter(options => {
							if(!options.url.includes("/games/getgameinstancesjson")) { return }

							const startIndex = +new URLSearchParams(options.data).get("startIndex")
							if(!Number.isSafeInteger(startIndex)) { return }

							const success = options.success
							options.success = function(...args) {
								curPage = Math.floor(startIndex / 10) + 1
								maxPage = Math.max(1, Math.ceil(args[0].TotalCollectionSize / 10))
								
								$("#rbx-game-server-item-container").find(">.rbx-game-server-item, >.section-content-off").remove()
								updatePager()

								if(!args[0].Collection.length) {
									$("#rbx-game-server-item-container").append(`<p class=section-content-off>No Servers Found.</p>`)
								}

								const result = success.apply(this, args)
								
								if(settings.gamedetails.showServerPing) {
									$("#rbx-game-server-item-container > li").each((_, row) => {
										const info = args[0].Collection.find(x => x.Guid === row.dataset.gameid)
										
										if(info) {
											$(".rbx-game-status", row).append($(`<div>`).text(`Ping: ${info.Ping}ms`))
										}
									})
								}
								
								return result
							}
						})

						pager
							.on("click", ".pager-prev:not(.disabled)", () => {
								gameInstance.fetchServers(placeId, Math.max((curPage - 2) * 10, 0))
							})
							.on("click", ".pager-next:not(.disabled)", () => {
								gameInstance.fetchServers(placeId, Math.min(curPage * 10, (maxPage - 1) * 10))
							})
							.on("click", ".first:not(.disabled)", () => {
								gameInstance.fetchServers(placeId, 0)
							})
							.on("click", ".last:not(.disabled)", () => {
								gameInstance.fetchServers(placeId, (maxPage - 1) * 10)
							})
							.on({
								blur() {
									const text = $(this).val()
									let num = parseInt(text, 10)

									if(!Number.isNaN(num)) {
										num = Math.max(1, Math.min(maxPage, num))
										gameInstance.fetchServers(placeId, (num - 1) * 10)
									}
								},
								keypress(e) {
									if(e.which === 13) {
										$(this).blur()
									}
								}
							}, ".pager-cur")
					}

					const init = () => {
						if(settings.gamedetails.addServerPager) {
							createPager(Roblox.RunningGameInstances)
						}

						// Init tab
						const tabBtn = document.querySelector(".rbx-tab.active a")
						if(tabBtn) {
							jQuery(tabBtn).trigger("shown.bs.tab")
						}
					}

					if(Roblox.RunningGameInstances) {
						setTimeout(init, 0)
					}
				
				} else {
					const btrPager = { currentPage: 1, maxPage: 1, loading: false }
					let gPGIProxy
					
					const query = (self, filter, n = 5) => {
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
								const result = query(child, filter, n - 1)
								if(result) {
									return result
								}
							}
						}
					}
					
					reactHook.replaceConstructor( // RunningGameServers
						args => args[1]?.getGameServers,
						(target, thisArg, args) => {
							const enablePager = settings.gamedetails.addServerPager && args[0]?.getGameServers?.name === "getPublicGameInstances"
							
							if(enablePager) {
								if(!gPGIProxy) {
									gPGIProxy = new Proxy(args[0].getGameServers, {
										apply(target, thisArg, args) {
											btrPager.currentPage = Math.max(1, Math.min(btrPager.currentPage, btrPager.maxPage))
											btrPager.loading = true
											
											const url = `https://www.roblox.com/games/getgameinstancesjson?placeId=${args[0]}&startIndex=${(btrPager.currentPage - 1) * 10}&_=${Date.now()}`
											
											return fetch(url, { credentials: "include" }).then(async res => {
												const json = await res.json()
												
												btrPager.maxPage = Math.max(1, Math.floor((json.TotalCollectionSize - 1) / 10))
												btrPager.loading = false
												
												return {
													data: {
														previousPageCursor: null,
														nextPageCursor: "idk",
														data: json.Collection.map(x => ({
															id: x.Guid,
															maxPlayers: x.Capacity,
															playing: x.CurrentPlayers.length,
															ping: x.Ping,
															fps: x.Fps,
															playerTokens: x.CurrentPlayers.map(x => `btr/${x.Thumbnail.Url}`),
															players: []
														}))
													}
												}
											})
										}
									})
								}
								
								args[0].getGameServers = gPGIProxy
							}
							
							const result = target.apply(thisArg, args)
							
							if(enablePager) {
								try {
									const serverList = query(result, x => x.props.gameInstances)
									
									if(serverList) {
										serverList.props.btrPager = btrPager
									}
									
								} catch(ex) {
									console.error(ex)
								}
							}
							
							return result
						}
					)
					
					reactHook.replaceConstructor( // GameSection
						args => args[1]?.loadMoreGameInstances,
						(target, thisArg, args) => {
							if(args[0].btrPager) {
								args[0].showLoadMoreButton = false
							}
							
							const result = target.apply(thisArg, args)
							
							try {
								const list = query(result, x => x.props.id?.includes("running-games"))
								
								if(args[0].btrPager) {
									const canPrev = !btrPager.loading && btrPager.currentPage > 1
									const canNext = !btrPager.loading && btrPager.currentPage < btrPager.maxPage
									
									list.props.children.push(React.createElement(
										"div", { className: "btr-pager-holder" },
										React.createElement(
											"ul", { className: "pager btr-server-pager" },
											
											React.createElement(
												"li", { className: `first${!canPrev ? " disabled" : ""}` },
												React.createElement(
													"a", {
														onClick() {
															if(!canPrev) { return }
															btrPager.currentPage = 1
															args[0].refreshGameInstances()
														}
													},
													React.createElement(
														"span", { className: "icon-first-page" }
													)
												)
											),
											
											React.createElement(
												"li", { className: `pager-prev${!canPrev ? " disabled" : ""}` },
												React.createElement(
													"a", {
														onClick() {
															if(!canPrev) { return }
															btrPager.currentPage -= 1
															args[0].refreshGameInstances()
														}
													},
													React.createElement(
														"span", { className: "icon-left" }
													)
												)
											),
											
											React.createElement(
												"li", { className: "pager-mid" },
												"Page ",
												React.createElement(
													"input", {
														className: "pager-cur",
														type: "text",
														defaultValue: args[0].btrPager.currentPage,
														
														onKeyDown(e) {
															if(e.which === 13) {
																e.target.blur()
															}
														},
														
														onBlur(e) {
															const num = parseInt(e.target.value, 10)
							
															if(!Number.isNaN(num)) {
																btrPager.currentPage = num
																args[0].refreshGameInstances()
															}
														}
													}
												),
												" of ",
												React.createElement(
													"span", { className: "pager-total" },
													args[0].btrPager.maxPage
												)
											),
											
											React.createElement(
												"li", { className: `pager-next${!canNext ? " disabled" : ""}` },
												React.createElement(
													"a", {
														onClick() {
															if(!canNext) { return }
															btrPager.currentPage += 1
															args[0].refreshGameInstances()
														}
													},
													React.createElement(
														"span", { className: "icon-right" }
													)
												)
											),
											
											React.createElement(
												"li", { className: `last${!canNext ? " disabled" : ""}` },
												React.createElement(
													"a", {
														onClick() {
															if(!canNext) { return }
															btrPager.currentPage = btrPager.maxPage
															args[0].refreshGameInstances()
														}
													},
													React.createElement(
														"span", { className: "icon-last-page" }
													)
												)
											)
										)
									))
								}
								
								if(settings.gamedetails.showServerPing) {
									const ul = query(list, x => x.type === "ul", 5)
									
									let servers = ul?.props?.children
									if(servers) {
										if(!Array.isArray(servers)) { servers = [servers] }
										
										for(const server of servers) {
											const serverInfo = args[0]?.gameInstances?.find(x => x.id === server.props.id)
		
											if(serverInfo) {
												server.props.gameServerStatus += `\nPing: ${serverInfo.ping}ms`
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
					
					reactHook.replaceConstructor( // GameInstance
						args => args[1]?.gameServerStatus,
						(target, thisArg, args) => {
							const result = target.apply(thisArg, args)
							
							try {
								const list = query(result, x => x.props?.className?.includes("game-server-players"))
								let entries = list?.props?.children
								
								if(entries) {
									if(!Array.isArray(entries)) { entries = [entries] }
									
									for(const entry of entries) {
										const thumb = query(entry, x => x.props?.type === "AvatarHeadshot")
										
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
					
					
					setTimeout(() => {
						// Init tab
						const tabBtn = document.querySelector(".rbx-tab.active a")
						if(tabBtn) {
							const hash = window.location.hash
							tabBtn.click()
							
							if(window.location.hash !== hash) {
								setTimeout(() => {
									history.replaceState("", document.title, window.location.pathname + window.location.search + hash)
								}, 0)
							}
						}
					}, 0)
				}
			} else if(currentPage === "develop") {
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
	settingsLoaded()
		
	if(document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", documentReady, { once: true })
	} else {
		Promise.resolve().then(documentReady)
	}
}
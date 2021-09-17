"use strict"

const InjectJS = {
	queue: [],

	send(action, ...detail) {
		try {
			if(IS_FIREFOX) { detail = cloneInto(detail, window.wrappedJSObject) }
			document.dispatchEvent(new CustomEvent(`inject.${action}`, { detail }))
		} catch(ex) {
			console.error(ex)
		}
	},

	listen(actions, callback, props) {
		const actionList = actions.split(" ")
		const once = props && props.once

		const cb = ev => {
			if(once) {
				actionList.forEach(action => {
					document.removeEventListener(`content.${action}`, cb)
				})
			}

			if(!ev.detail) {
				console.warn("[BTRoblox] Didn't get event detail from InjectJS", actions)
				return
			}

			return callback(...ev.detail)
		}

		actionList.forEach(action => {
			document.addEventListener(`content.${action}`, cb)
		})
	},
	
	injectFunction(fn, ...args) {
		const script = document.createElement("script")
		script.async = true
		script.type = "text/javascript"
		script.textContent = `(${fn})(${JSON.stringify(args).slice(1, -1)})`
		document.documentElement.prepend(script)
	}
}


if(IS_VALID_PAGE) { InjectJS.injectFunction(() => {
	"use strict"
	
	let IS_DEV_MODE
	let settings
	let currentPage
	let matches

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
		args: null,
		replacements: [],
		cachedReplacements: new WeakMap(),

		onCreateElement(args) {
			if(!settings || !(args[1] instanceof Object)) {
				return
			}

			if(typeof args[0] === "function") {
				const fn = args[0]
				let replace = this.cachedReplacements.get(fn)

				if(!this.cachedReplacements.has(fn)) {
					for(const info of this.replacements) {
						if(!info.found && !info.fnMap.has(fn)) {
							try {
								if(info.filter(args)) {
									info.found = true
									info.fnMap.set(fn, new Proxy(fn, { apply: info.handler }))
								} else {
									info.fnMap.set(fn, false)
								}
							} catch(ex) {
								console.error(ex)
							}
						}

						replace = info.fnMap.get(fn)
						if(replace) { break }
					}

					this.cachedReplacements.set(fn, replace || false)
				}

				if(replace) {
					args[0] = replace
				}
			}

			try { this.handler(args) }
			catch(ex) { console.error(ex) }
		},

		replaceConstructor(filter, handler) {
			this.cachedReplacements = new WeakMap()
			this.replacements.push({ filter, handler, fnMap: new WeakMap() })
		},

		handler(args) {
			const type = args[0]
			const props = args[1]
			
			//if(props.id === "navbar-universal-search" || props.className?.includes(" navbar-search ")) {
			if(props['data-testid'] === "navigation-search-input" || props.className?.includes(" navbar-search ")) {
				const ul = args.find(x => typeof x === "object" && x.type === "ul")
				
				if(ul) {
					if(!Array.isArray(ul.props.children)) {
						ul.props.children = [ul.props.children]
					}

					ul.props.children.unshift(
						React.createElement("div", { key: "btrFastSearch", id: "btr-fastsearch-container", dangerouslySetInnerHTML: { __html: " " } })
					)
				}
			}

			switch(props.id) {
			case "settings-popover-menu": {
				args.splice(2, 0,
					React.createElement("li", { key: "btrSettings" },
						React.createElement("a", {
							className: "rbx-menu-item btr-settings-toggle"
						}, "BTR Settings")
					)
				)
				break
			}
			}

			switch(type) {
			case "ul": {
				if(props.className) {
					const classes = props.className.split(/\s+/g)
					const hasClass = name => classes.includes(name)
					
					if(settings.navigation.enabled) {
						if(hasClass("rbx-navbar")) {
							const list = args.find(x => Array.isArray(x))
							
							if(list) {
								list.splice(0, 0,
									React.createElement("li", { id: "btr-home", dangerouslySetInnerHTML: { __html: " " } })
								)
							}
						} else if(hasClass("navbar-right")) {
							const robuxIndex = args.findIndex((x, i) => i >= 2 && x instanceof Object && x.props && "robuxAmount" in x.props)

							if(robuxIndex !== -1) {
								args.splice(robuxIndex, 0,
									React.createElement("li", { key: "btrMessages", id: "btr-messages-container", dangerouslySetInnerHTML: { __html: " " } }),
									React.createElement("li", { key: "btrFriends", id: "btr-friends-container", dangerouslySetInnerHTML: { __html: " " } })
								)
							}
						} else if(hasClass("left-col-list")) {
							const list = args.slice(2).find(x => Array.isArray(x))

							if(list) {
								const blogIndex = list.findIndex(x => x.key === "blog")

								if(blogIndex !== -1) {
									list.splice(blogIndex + 1, 0,
										React.createElement("div", { id: "btr-blogfeed-container", dangerouslySetInnerHTML: { __html: " " } }),
									)
								}
							}
						}
					}
				}
				break
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

	//
	
	function hijackAngular(moduleName, objects) {
		try {
			const module = angular.module(moduleName)
			const done = {}

			module._invokeQueue.forEach(data => {
				const [, type, data2] = data
				const [name, value] = data2
				const fn = objects[name]
				if(!fn) { return }

				done[name] = true
				if(type === "constant" || type === "component") {
					try { fn(value) }
					catch(ex) { console.error(ex) }

					return
				}

				if(typeof value === "function") {
					const injects = value.$inject
					const oldFn = value

					data2[1] = new Proxy(oldFn, {
						apply(target, thisArg, args) {
							const argMap = {}
							args.forEach((x, i) => argMap[injects[i]] = x)

							return fn.call(thisArg, target, args, argMap)
						}
					})
				} else {
					const injects = value
					const oldFn = value[value.length - 1]

					if(typeof oldFn === "function") {
						value[value.length - 1] = new Proxy(oldFn, {
							apply(target, thisArg, args) {
								const argMap = {}
								args.forEach((x, i) => argMap[injects[i]] = x)
	
								return fn.call(thisArg, target, args, argMap)
							}
						})
					} else {
						done[name] = false
					}
				}
			})

			if(IS_DEV_MODE) {
				Object.keys(objects).forEach(name => {
					if(!done[name]) {
						console.warn(`Failed to hijack ${moduleName}.${name}`)
						if(IS_DEV_MODE) { alert(`hijackAngular Missing Module '${moduleName}.${name}'`) }
					}
				})
			}
		} catch(ex) {
			if(IS_DEV_MODE) {
				console.warn(ex)
			}
		}
	}
	
	function hijackFunction(a, b, c) {
		if(arguments.length === 2) {
			return new Proxy(a, { apply: b })
		}

		a[b] = new Proxy(a[b], { apply: c })
	}
	
	//
	
	function preInit() {
		onSet(window, "angular", async angular => {
			await Promise.resolve() // Wait for angular to load
			angular.module("ng").run($templateCache => modifyTemplate.addCache($templateCache))
		})

		onSet(window, "React", React => {
			hijackFunction(React, "createElement", (target, thisArg, args) => {
				reactHook.onCreateElement(args)
				return target.apply(thisArg, args)
			})
		})
	}

	function documentReady() {
		if(!window.jQuery) {
			console.warn("[BTR] window.jQuery not set")
			return
		}

		if(window.angular) {
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
										if($event.which === 13) {
											const value = $event.target.value
		
											if(!Number.isNaN(value)) {
												$location.search({ page: value })
											} else {
												$event.target.value = u.currentStatus.currentPage
											}
		
											$event.preventDefault()
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
		} else {
			console.warn("[BTR] window.angular not set")
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
				const placeId = matches[0]

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

							return success.apply(this, args)
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
	
	//

	ContentJS.listen("TEMPLATE_INIT", key => modifyTemplate.listenForTemplate(key))

	ContentJS.listen("INIT", (...initData) => {
		[settings, currentPage, matches, IS_DEV_MODE] = initData
		
		if(document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", documentReady)
		} else {
			documentReady()
		}
	})

	//

	preInit()
})
}

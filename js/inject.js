"use strict"

const INJECT_SCRIPT = () => {
	const templates = {}
	let settingsAreLoaded = false
	let gtsNode

	let settings
	let currentPage
	let matches
	let IS_DEV_MODE

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

	function HijackAngular(moduleName, objects) {
		try {
			const module = angular.module(moduleName)
			const done = {}

			module._invokeQueue.forEach(data => {
				const [, type, [name, value]] = data
				const fn = objects[name]
				if(!fn) { return }

				done[name] = true
				if(type === "constant" || type === "component") {
					try { fn(value) }
					catch(ex) { console.error(ex) }

					return
				}

				const oldFn = value[value.length - 1]
				if(typeof oldFn === "function") {
					value[value.length - 1] = function(...args) {
						const argMap = {}
						args.forEach((x, i) => argMap[value[i]] = x)

						return fn.call(this, oldFn, args, argMap)
					}
				}
			})

			if(IS_DEV_MODE) {
				Object.keys(objects).forEach(name => {
					if(!done[name]) {
						console.warn(`Failed to hijack ${moduleName}.${name}`)
						if(IS_DEV_MODE) { alert("HijackAngular Missing Module") }
					}
				})
			}
		} catch(ex) {
			if(IS_DEV_MODE) {
				console.warn(ex)
			}
		}
	}
	
	function PreInit() {
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

		if(window.googletag) {
			if(IS_DEV_MODE) {
				console.warn("[BTRoblox] Failed to load inject before googletag")
			}
		} else {
			onSet(window, "googletag", gtag => onSet(gtag, "cmd", () => {
				let didIt = false

				const proto = Node.prototype
				const insertBefore = proto.insertBefore
				proto.insertBefore = function(...args) {
					const node = args[0]
					if(node instanceof Node && node.nodeName === "SCRIPT" && node.src.includes("googletagservices.com")) {
						didIt = true

						if(!settingsAreLoaded) {
							gtsNode = { this: this, node }
							return
						} else if(settings.general.hideAds) {
							return
						}
					}

					return insertBefore.apply(this, args)
				}

				setTimeout(() => {
					proto.insertBefore = insertBefore

					if(!didIt && IS_DEV_MODE) {
						alert("Failed to rek googletag")
					}
				}, 0)
			}))
		}
	}

	function PostInit() {
		if(gtsNode) {
			if(!settings.general.hideAds) {
				gtsNode.this.insertBefore(gtsNode.node)
			}

			gtsNode = null
		}
	}

	function DocumentReady() {
		if(!window.jQuery) {
			console.warn("[BTR] window.jQuery not set")
			return
		}

		if(window.angular) {
			angular.module("ng").run($templateCache => {
				const put = $templateCache.put
				$templateCache.put = (key, value) => {
					const result = put.call($templateCache, key, value)

					if(templates[key]) {
						delete templates[key]

						ContentJS.listen(`TEMPLATE_${key}`, changedValue => {
							put.call($templateCache, key, changedValue)
						})

						ContentJS.send(`TEMPLATE_${key}`, value)
						return
					}

					return result
				}
			})



			if(settings.general.smallChatButton) {
				HijackAngular("chat", {
					chatController(func, args, argMap) {
						const result = func.apply(this, args)

						try {
							const { $scope } = argMap

							const library = $scope.chatLibrary
							const width = library.chatLayout.widthOfChat
	
							$scope.$watch(() => library.chatLayout.collapsed, value => {
								library.chatLayout.widthOfChat = value ? 54 + 6 : width
								library.dialogDict.collapsed = value
							})
						} catch(ex) {
							console.error(ex)
							if(IS_DEV_MODE) { alert("HijackAngular Error") }
						}

						return result
					}
				})
			}

			if(currentPage === "inventory" && settings.inventory.enabled && settings.inventory.inventoryTools) {
				HijackAngular("assetsExplorer", {
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
							if(IS_DEV_MODE) { alert("HijackAngular Error") }
						}

						return result
					}
				})
			}

			if(currentPage === "messages") {
				HijackAngular("messages", {
					rbxMessagesNav(handler, args, argMap) {
						const result = handler.apply(this, args)

						try {
							const { $location } = argMap

							const link = result.link
							result.link = function(u) {
								u.keyDown = function($event) {
									if($event.which === 13) {
										const value = $event.target.textContent * 1
	
										if(!Number.isNaN(value)) {
											$location.search({ page: value })
										} else {
											$event.target.textContent = u.currentStatus.currentPage
										}
	
										$event.preventDefault()
									}
								}
								return link.call(this, u)
							}
						} catch(ex) {
							console.error(ex)
							if(IS_DEV_MODE) { alert("HijackAngular Error") }
						}

						return result
					}
				})
			}

			if(currentPage === "groups" && settings.groups.redesign) {
				if(settings.groups.modifySmallSocialLinksTitle) {
					HijackAngular("socialLinksJumbotron", {
						socialLinkIcon(component) {
							component.bindings.title = "<"
						}
					})
				}

				if(settings.groups.pagedGroupWall) {
					const createCustomPager = ({ $scope }) => {
						const wallPosts = []
						const pageSize = 10
						let loadMorePromise = null
						let nextPageCursor = ""
						let requestCounter = 0
						let lastPageNum = 0
						let isLoadingPosts = false

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

							return loadMorePromise = new Promise(async resolve => {
								const groupId = $scope.library.currentGroup.id
								const baseUrl = `https://groups.roblox.com/v2/groups/${groupId}/wall/posts?sortOrder=Desc&limit=100&cursor=`
								
								const resp = await fetch(baseUrl + nextPageCursor, { credentials: "include" })
								const json = await resp.json()

								if(!loadMorePromise) { return }

								nextPageCursor = json.nextPageCursor || null
								wallPosts.push(...json.data.filter(x => x.poster))

								loadMorePromise = null
								resolve()
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

					HijackAngular("group", {
						groupWallController(func, args, argMap) {
							const result = func.apply(this, args)

							try {
								createCustomPager(argMap)
							} catch(ex) {
								console.error(ex)
								if(IS_DEV_MODE) { alert("HijackAngular Error") }
							}

							return result
						}
					})
				}
			}
		} else {
			console.warn("[BTR] window.angular not set")
		}

		if(settings.general.fixAudioVolume) {
			$(document).on("jPlayer_ready", "#MediaPlayerSingleton", ev => {
				const audio = ev.currentTarget.querySelector("audio")
				if(audio) {
					audio.volume = 0.3
				}
			})
		}

		if(settings.general.fixAudioPreview) {
			const fixing = {}

			ContentJS.listen("fixAudioPreview", (url, blobUrl) => {
				if(!fixing[url]) { return }
				delete fixing[url]
				
				console.warn("[BTRoblox] Fixed broken audio previewer")

				document.querySelectorAll(`.MediaPlayerIcon[data-mediathumb-url="${url}"]`).forEach(btn => {
					btn.classList.add("btr-audioFix")
					setTimeout(() => btn.classList.remove("btr-audioFix"), 5e3)

					if(btn.classList.contains("icon-pause")) { btn.click() }

					btn.dataset.mediathumbUrl = blobUrl
					btn.click()
				})
			})

			$(document).on("jPlayer_canplay", "#MediaPlayerSingleton", ev => {
				delete fixing[ev.jPlayer.status.src]
			})

			$(document).on("jPlayer_error", "#MediaPlayerSingleton", ev => {
				const errorInfo = ev.jPlayer.error
				const url = errorInfo.context
				const data = fixing[url]

				if(errorInfo.type === "e_url" && data) {
					clearTimeout(data.timeout)
					ContentJS.send("fixAudioPreview", url)
				}
			})

			$(document).on("jPlayer_loadstart", "#MediaPlayerSingleton", ev => {
				const url = ev.jPlayer.status.src

				if(url.includes("rbxcdn.com") && !fixing[url]) {
					const data = fixing[url] = {}

					data.timeout = setTimeout(() => {
						if(fixing[url]) {
							ContentJS.send("fixAudioPreview", url)
						}
					}, 500)
				}
			})
		}

		if(typeof Roblox !== "undefined") {
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

					const pager = $(`
					<div class=btr-pager-holder>
						<ul class="pager btr-server-pager">
							<li class=first><a><span class=icon-first-page></a></li>
							<li class=pager-prev><a><span class=icon-left></a></li>
							<li class=pager-mid>
								Page&nbsp;
								<input class=pager-cur type=text></input>
								&nbsp;of&nbsp;
								<span class=pager-total></span>
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
			if(IS_DEV_MODE) {
				alert("[BTR] window.Roblox not set")
			}
		}

		if(typeof Sys !== "undefined" && Sys.WebForms != null) {
			const prm = Sys.WebForms.PageRequestManager.getInstance()

			prm.add_pageLoaded(() => ContentJS.send("ajaxUpdate"))
		}
	}

	ContentJS.listen("TEMPLATE_INIT", key => templates[key] = true)
	ContentJS.listen("linkify", cl => {
		const target = $(`.${cl}`)
		target.removeClass(cl)
		if(window.Roblox && Roblox.Linkify) { target.linkify() }
		else { target.addClass("linkify") }
	})

	ContentJS.listen("INIT", (...initData) => {
		[settings, currentPage, matches, IS_DEV_MODE] = initData
		settingsAreLoaded = true

		PostInit()

		if(document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", DocumentReady)
		} else {
			DocumentReady()
		}
	})

	PreInit()
}

"use strict"

const INJECT_SCRIPT = () => {
	const templates = {}
	let templateRequestCounter = 0
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

			module._invokeQueue.forEach(x => {
				const name = x[2][0]
				const newhandler = objects[name]

				if(typeof newhandler === "function") {
					const data = x[2][1]
					const oldhandler = data[data.length - 1]

					data[data.length - 1] = function(...args) {
						const argMap = {}

						for(let i = 0; i < data.length - 1; i++) {
							argMap[data[i]] = args[i]
						}

						return newhandler.call(this, oldhandler, args, argMap)
					}

					done[name] = true
				}
			})

			if(IS_DEV_MODE) {
				Object.entries(objects).forEach(([name]) => {
					if(!done[name]) {
						console.warn(`Failed to hijack ${moduleName}.${name}`)
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
		if(window.googletag) {
			if(IS_DEV_MODE) {
				console.warn("[BTRoblox] Failed to load inject before googletag")
			}
		} else {
			const googletag = window.googletag = {}

			Object.defineProperty(googletag, "cmd", {
				enumerable: false,
				configurable: true,
				set: value => {
					delete googletag.cmd
					googletag.cmd = value

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
				}
			})
		}
	}


	function PostInit() {
		if(!window.jQuery) {
			console.warn("[BTR] window.jQuery not set")
			return
		}

		if(window.angular) {
			angular.module("ng").run(["$templateCache", t => {
				const put = t.put
				t.put = (key, value) => {
					if(templates[key]) {
						delete templates[key]
						const id = ++templateRequestCounter

						ContentJS.listen(`TEMPLATE_${id}`, changedValue => {
							put.call(t, key, changedValue)
						}, { once: true })

						put.call(t, key, value)
						ContentJS.send(`TEMPLATE_${key}`, id, value)
						return
					}

					return put.call(t, key, value)
				}
			}])

			if(settings.general.smallChatButton) {
				HijackAngular("chat", {
					chatController(func, args) {
						const scope = args[0]
						func.apply(this, args)

						const library = scope.chatLibrary
						const width = library.chatLayout.widthOfChat

						scope.$watch(() => library.chatLayout.collapsed, value => {
							library.chatLayout.widthOfChat = value ? 54 + 6 : width
							library.dialogDict.collapsed = value
						})
					}
				})
			}

			if(currentPage === "inventory" && settings.inventory.enabled && settings.inventory.inventoryTools) {
				HijackAngular("assetsExplorer", {
					assetsService(handler, args) {
						const result = handler.apply(this, args)
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

						return result
					}
				})
			}

			if(currentPage === "messages") {
				HijackAngular("messages", {
					rbxMessagesNav(handler, args) {
						const result = handler.apply(this, args)

						const link = result.link
						result.link = function(u) {
							u.keyDown = function($event) {
								if($event.which === 13) {
									const value = $event.target.textContent * 1
									if(!Number.isNaN(value)) {
										args[1].search({ page: value })
									} else {
										$event.target.textContent = u.currentStatus.currentPage
									}

									$event.preventDefault()
								}
							}
							
							return link.call(this, u)
						}

						return result
					}
				})
			}

			if(currentPage === "groups" && settings.groups.enabled && settings.groups.redesign) {
				if(settings.groups.modifyLayout) {
					HijackAngular("group", {
						layout(func, args) {
							const result = func.apply(this, args)
							result.aboutText = "Members"
							return result
						},
						groupController(func, args, argMap) {
							const result = func.apply(this, args)
							const { $scope } = argMap

							$scope.getTabsCount = new Proxy($scope.getTabsCount, {
								apply(target, thisArg, targs) {
									return target.apply(thisArg, targs) + ($scope.library.currentGroup.areGroupGamesVisible ? 1 : 0)
								}
							})

							return result
						}
					})
				}
				if(settings.groups.pagedGroupWall) {
					const createCustomPager = $scope => {
						const wallPosts = []
						const pageSize = 10
						let loadMorePromise = null
						let nextPageCursor = ""
						let requestCounter = 0
						let lastPageNum = 0
						let isLoadingPosts = false

						window.test = $scope

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
						$scope.groupWall.pager.loadFirstPage = () => {
							wallPosts.splice(0, wallPosts.length)
							nextPageCursor = ""
							loadMorePromise = null
							requestWallPosts(0)
						}
						$scope.groupWall.pager.loadNextPage = () => {}

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
							createCustomPager(argMap.$scope)
							return result
						}
					})
				}
			}
		} else {
			console.warn("[BTR] window.angular not set")
		}

		if(settings.general.fixAudioPreview) {
			ContentJS.listen("audioPreviewFix", (url, blobUrl) => {
				document.querySelectorAll(`.MediaPlayerIcon[data-mediathumb-url="${url}"]`).forEach(btn => {
					btn.classList.add("btr-audioFix")
					btn.dataset.mediathumbUrl = blobUrl
					btn.click()
				})

				console.warn("[BTRoblox] Fixed broken audio previewer")
			})

			$(document).on("jPlayer_error", "#MediaPlayerSingleton", ev => {
				const errorInfo = ev.jPlayer.error
				const url = errorInfo.context

				if(errorInfo.type === "e_url" && url.includes("rbxcdn.com")) {
					ContentJS.send("audioPreviewFix", url)
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

		if(gtsNode) {
			if(!settings.general.hideAds) {
				gtsNode.this.insertBefore(gtsNode.node)
			}

			gtsNode = null
		}

		if(document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", PostInit)
		} else {
			PostInit()
		}
	})

	PreInit()
}

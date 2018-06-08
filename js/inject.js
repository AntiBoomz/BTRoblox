"use strict"

{
	const ContentJS = {
		send(action, ...args) {
			document.dispatchEvent(new CustomEvent("content." + action, { detail: args }))
		},
		listen(actionList, callback) {
			const cb = ev => callback(...ev.detail)
			actionList.split(" ").forEach(action => {
				document.addEventListener("inject." + action, cb)
			})
		}
	}

	function HijackAngular(module, objects) {
		module._invokeQueue.forEach(x => {
			const newhandler = objects[x[2][0]]

			if(typeof newhandler === "function") {
				const data = x[2][1]
				const oldhandler = data[data.length - 1]

				data[data.length - 1] = function(...args) {
					return newhandler.call(this, oldhandler, args)
				}
			}
		})
	}

	const modifiedTemplates = {}

	function DoTemplates(templates) {
		const args = ["$templateCache", $templateCache => {
			templates.forEach(id => {
				if(id in modifiedTemplates) { return }
				const data = $templateCache.get(id)

				if(data) {
					ContentJS.listen("TEMPLATE_" + id, newdata => {
						modifiedTemplates[id] = newdata
					})
					ContentJS.send("TEMPLATE_" + id, data)
				}
			})

			Object.entries(modifiedTemplates).forEach(([name, template]) => {
				if($templateCache.get(name)) {
					$templateCache.put(name, template)
				}
			})
		}]

		const templateApps = ["chatAppHtmlTemplateApp", "pageTemplateApp", "baseTemplateApp"]
		templateApps.forEach(templateName => {
			try { angular.module(templateName).run(args) } catch(ex) { }
		})
	}

	function OnInit(settings, currentPage, matches, templates, IS_DEV_MODE) {
		if(!settings.general.showAds && !window.googletag) {
			const googletag = {}
			let state = 0

			window.googletag = new Proxy(googletag, {
				set(target, name, value) {
					target[name] = value
					if(state === 0 && name === "cmd") {
						state = 1
						window.googletag = googletag

						const proto = Node.prototype
						const insertBefore = proto.insertBefore
						proto.insertBefore = function(...args) {
							const node = args[0]
							if(node instanceof Node && node.nodeName === "SCRIPT" && node.src.includes("googletagservices.com")) {
								state = 2
								return
							}

							return insertBefore.apply(this, args)
						}

						setTimeout(() => proto.insertBefore = insertBefore, 0)
					}
					return true
				}
			})

			if(IS_DEV_MODE) {
				const onload = () => {
					if(state !== 2) {
						alert(`Failed to remove gpt.js (${state})`)
					}
				}

				document.addEventListener("DOMContentLoaded", onload, { once: true })
			}
		} else if(window.googletag && IS_DEV_MODE) {
			alert("Failed to load inject before googletag")
		}

		const postInit = () => {
			if(typeof jQuery === "undefined") {
				if(IS_DEV_MODE) {
					alert("[BTR] window.jQuery not set")
				}
				return
			}

			if(typeof angular !== "undefined") {
				DoTemplates(templates)

				if(settings.general.smallChatButton) {
					try {
						HijackAngular(angular.module("chat"), {
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
					} catch(ex) {}
				}

				if(currentPage === "inventory" && settings.inventory.enabled && settings.inventory.inventoryTools) {
					try {
						HijackAngular(angular.module("assetsExplorer"), {
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
					} catch(ex) {}
				}

				if(currentPage === "messages") {
					try {
						HijackAngular(angular.module("messages"), {
							rbxMessagesNav(handler, args) {
								const result = handler.apply(this, args)
								let isWorking = false
			
								function getMessages(page, callback) {
									$.get(`/messages/api/get-messages?messageTab=0&pageNumber=${page}&pageSize=20`, callback)
								}
			
								function getMessageCount(callback) {
									$.get("/messages/api/get-my-unread-messages-count", callback)
								}
			
								function markMessagesAsRead(list, callback) {
									$.post("/messages/api/mark-messages-read", { messageIds: list }, callback)
								}
			
								function markAllAsRead() {
									if(isWorking) { return }
									isWorking = true
										
									const messages = []
									const pages = []
									let running = 0
									let maxPage = 0
									let count = 0

									const progress = $("<progress value='0' max='0' style='width:100%'>")
										.insertAfter(".roblox-messages-btns")

									function checkForUnread(data) {
										Object.values(data.Collection).forEach(msg => {
											if(!msg.IsRead) {
												messages.push(msg.Id)
											}
										})
		
										progress.val(messages.length)
									}

									function readPage(page) {
										if(page < maxPage && messages.length < count) {
											if(pages[page] === true) {
												readPage(page + 1)
												return
											}
		
											getMessages(page, data => {
												checkForUnread(data)
												readPage(page + 1)
											})
										} else if(--running === 0) {
											markMessagesAsRead(messages, () => {
												window.location.reload()
											})
										}
									}
			
									getMessageCount(countData => {
										if(countData.count === 0) {
											window.location.reload()
											return
										}
			
										count = countData.count
										progress.attr("max", count)
			
										getMessages(0, data => {
											maxPage = data.TotalPages
											checkForUnread(data)
											for(let i = 0; i < 4; i++) {
												running++
												readPage(1 + Math.floor(i / 4 * maxPage))
											}
										})
									})
								}

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

									u.markAllAsRead = markAllAsRead
									
									return link.call(this, u)
								}

								return result
							}
						})
					} catch(ex) { console.log(ex) }
				}
			} else {
				if(IS_DEV_MODE) {
					alert("[BTR] window.angular not set")
				}
			}

			{
				// Let's fix Roblox's audio player \o/
				ContentJS.listen("audioPreviewFix", (url, blobUrl) => {
					document.querySelectorAll(`.MediaPlayerIcon[data-mediathumb-url="${url}"]`).forEach(btn => {
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
				if(!settings.general.showAds) {
					if(Roblox.PrerollPlayer) {
						Roblox.PrerollPlayer.waitForPreroll = x => $.Deferred().resolve(x)
					}

					if(Roblox.VideoPreRollDFP) {
						Roblox.VideoPreRollDFP = null
					}
				}

				if(currentPage === "gamedetails" && settings.gamedetails.enabled) {
					const placeId = matches[0]

					// Properly select initial tab
					$(() => {
						const tabBtn = $(".rbx-tab.active")
						if(tabBtn.length) {
							tabBtn.removeClass("active")
							tabBtn.find("a").click()
						}
					})

					// Server pagers
					const createPager = gameInstance => {
						let curIndex = 0
						let maxSize = 0

						$(`.rbx-running-games-load-more`).hide() // Hide Load More

						const pager = $(`
						<div class='btr-server-pager'>
							<button type='button' class='btn-control-sm btr-server-first'>First</button>
							<button type='button' class='btn-control-sm btr-server-prev'>Prev</button>
							<span style='margin:0 10px;vertical-align:middle;line-height:100%'>
								<input type='text' class='rbx-input-field btr-server-input'> of <span class='btr-server-max'>0</span>
							</span>
							<button type='button' class='btn-control-sm btr-server-next'>Next</button>
							<button type='button' class='btn-control-sm btr-server-last'>Last</button>
						</div>`).appendTo(`.rbx-running-games-footer`)

						const updatePager = function() {
							const curPage = Math.floor(curIndex / 10) + 1
							const maxPage = Math.floor(maxSize / 10) + 1
							pager.find(".btr-server-input").val(curPage)
							pager.find(".btr-server-max").text(maxPage)

							pager.find(".btr-server-first").toggleClass("disabled", curPage <= 1)
							pager.find(".btr-server-prev").toggleClass("disabled", curPage <= 1)
							pager.find(".btr-server-last").toggleClass("disabled", curPage === maxPage)
							pager.find(".btr-server-next").toggleClass("disabled", curPage === maxPage)

							$(`.rbx-game-server-join`).removeAttr("href")
						}

						$.ajaxPrefilter(options => {
							if(options.url !== "/games/getgameinstancesjson") { return }

							const startIndex = +new URLSearchParams(options.data).get("startIndex")
							if(!Number.isSafeInteger(startIndex)) { return }

							options.success = new Proxy(options.success, {
								apply(target, thisArg, args) {
									curIndex = startIndex
									maxSize = args[0].TotalCollectionSize

									$("#rbx-game-server-item-container").find(">.rbx-game-server-item").remove()
									updatePager()
									return target.apply(thisArg, args)
								}
							})
						})

						pager
							.on("click", ".btr-server-last:not(.disabled)", () => {
								gameInstance.fetchServers(placeId, maxSize - maxSize % 10)
							})
							.on("click", ".btr-server-next:not(.disabled)", () => {
								gameInstance.fetchServers(placeId, Math.min(maxSize - (maxSize % 10), curIndex + 10))
							})
							.on("click", ".btr-server-prev:not(.disabled)", () => {
								gameInstance.fetchServers(placeId, Math.max(0, curIndex - 10))
							})
							.on("click", ".btr-server-first:not(.disabled)", () => {
								gameInstance.fetchServers(placeId, 0)
							})
							.on({
								blur() {
									const maxPage = Math.floor(maxSize / 10) + 1
									const text = $(this).val()
									let num = parseInt(text, 10)

									if(!Number.isNaN(num)) {
										num = Math.min(maxPage, Math.max(1, num))
										gameInstance.fetchServers(placeId, (num - 1) * 10)
									}
								},
								keypress(e) {
									if (e.which === 13) {
										$(this).blur()
									}
								}
							}, ".btr-server-input")
					}

					if(Roblox.RunningGameInstances) {
						createPager(Roblox.RunningGameInstances)
					} else {
						if(IS_DEV_MODE) {
							alert("[BTR] Roblox.RunningGameInstances not set")
						}
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

				if(currentPage === "groups" && settings.groups.enabled) {
					prm.add_pageLoaded(() => $(".GroupWallPane .linkify").linkify())
				}
			}
		}

		if(document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", postInit)
		} else {
			postInit()
		}
	}

	ContentJS.listen("INIT", OnInit)
	ContentJS.listen("refreshInventory", () => $(".btr-it-reload").click())
	ContentJS.listen("linkify", cl => {
		const target = $(`.${cl}`)
		target.removeClass(cl)
		if(window.Roblox && Roblox.Linkify) { target.linkify() }
		else { target.addClass("linkify") }
	})

	ContentJS.send("INJECT_INIT")
}

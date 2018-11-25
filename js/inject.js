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
		} catch(ex) {
			if(IS_DEV_MODE) {
				console.warn(ex)
			}
		}
	}

	function PreInit() {
		if(window.googletag) {
			if(IS_DEV_MODE) {
				alert("Failed to load inject before googletag")
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
		} else {
			console.warn("[BTR] window.angular not set")
		}

		if(settings.general.fixAudioPreview) {
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
					<ul class="pager btr-server-pager">
						<li class=first><a><span class=icon-first-page></a></li>
						<li class=pager-prev><a><span class=icon-left></a></li>
						<li class=pager-cur>
							<input type=text class=input-field>
						</li>
						<li class=pager-total>
							<span style=padding-top:0;>of</span>
							<span class=btr-server-max style=padding-top:0;>0</span>
						</li>
						<li class=pager-next><a><span class=icon-right></a></li>
						<li class=last><a><span class=icon-last-page></a></li>
					</ul>`).appendTo($(".rbx-running-games-footer"))

					const updatePager = () => {
						pager.find(".pager-cur input").val(curPage)
						pager.find(".btr-server-max").text(maxPage)

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
						}, ".pager-cur input")
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

			if(currentPage === "groups" && settings.groups.enabled) {
				prm.add_pageLoaded(() => $(".GroupWallPane .linkify").linkify())
			}
		}

		if(currentPage === "groups" && settings.groups.enabled) {
			window.fitStringToWidthSafeText = text => text
			const items = document.querySelectorAll(".GroupListName")
			
			items.forEach(item => {
				item.classList.remove("GroupListName")
				const text = item.textContent
				item.textContent = ""

				const span = document.createElement("span")
				span.textContent = text
				span.classList.add("btr-groupListName")
				item.append(span)
			})

			$(() => {
				items.forEach(item => {
					item.classList.add("GroupListName")
				})
			})
		}
	}

	ContentJS.listen("TEMPLATE_INIT", key => templates[key] = true)
	ContentJS.listen("refreshInventory", () => $(".btr-it-reload").click())
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

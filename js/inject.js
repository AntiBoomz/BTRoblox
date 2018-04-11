"use strict"

{
	const ContentJS = {
		send(action, ...args) {
			document.dispatchEvent(
				new CustomEvent("content." + action, { detail: args })
			)
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
				if(id in modifiedTemplates) return;
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

	function OnInit(settings, currentPage, matches, templates) {
		if(typeof jQuery === "undefined") return;
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
								library.chatLayout.widthOfChat = value ? 54 + 6 : width;
								library.dialogDict.collapsed = value;
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
								if(isWorking) return;
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
											return;
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
										return;
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
		}


		if(typeof Roblox !== "undefined") {
			if(!settings.general.showAds && Roblox.PrerollPlayer) {
				Roblox.PrerollPlayer.waitForPreroll = x => $.Deferred().resolve(x);
			}

			if(currentPage === "gamedetails" && settings.gamedetails.enabled) {
				const placeId = matches[0]

				$(() => {
					const tabBtn = $(".rbx-tab.active")
					if(tabBtn.length) {
						tabBtn.removeClass("active")
						tabBtn.find("a").click()
					}
				})

				const createPager = (gameInstance, isFriends) => {
					const prefix = isFriends ? ".rbx-friends" : ".rbx"
					let curIndex = 0
					let maxSize = 0

					$(`${prefix}-running-games-load-more`).hide() // Hide Load More

					const pager = $(`
					<div class='btr-server-pager'>
						<button type='button' class='btn-control-sm btr-server-first'>First</button>
						<button type='button' class='btn-control-sm btr-server-prev'>Prev</button>
						<span style='margin:0 10px;vertical-align:middle;line-height:100%'>
							<input type='text' class='rbx-input-field btr-server-input'> of <span class='btr-server-max'>0</span>
						</span>
						<button type='button' class='btn-control-sm btr-server-next'>Next</button>
						<button type='button' class='btn-control-sm btr-server-last'>Last</button>
					</div>`).appendTo(`${prefix}-running-games-footer`);

					const updatePager = function() {
						const curPage = Math.floor(curIndex / 10) + 1
						const maxPage = Math.floor(maxSize / 10) + 1
						pager.find(".btr-server-input").val(curPage)
						pager.find(".btr-server-max").text(maxPage)

						pager.find(".btr-server-first").toggleClass("disabled", curPage <= 1)
						pager.find(".btr-server-prev").toggleClass("disabled", curPage <= 1)
						pager.find(".btr-server-last").toggleClass("disabled", curPage === maxPage)
						pager.find(".btr-server-next").toggleClass("disabled", curPage === maxPage)

						$(`${prefix}-game-server-join`).removeAttr("href")
					}

					const url = isFriends ? "/games/getfriendsgameinstances" : "/games/getgameinstancesjson"
					$.ajaxPrefilter(options => {
						if(options.url === url) {
							const success = options.success
							options.success = function(i, ...args) {
								curIndex = +options.url.match(/startindex=(\d+)/)[1]
								maxSize = i.TotalCollectionSize

								gameInstance.clearInstances()
								updatePager()

								return success.call(this, i, ...args)
							}
						}
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

				// if(Roblox.FriendsRunningGameInstances) createPager(Roblox.FriendsRunningGameInstances, true);
				if(Roblox.AllRunningGameInstances) createPager(Roblox.AllRunningGameInstances);
			} else if(currentPage === "develop") {
				if(Roblox.BuildPage) {
					Roblox.BuildPage.GameShowcase = new Proxy(Roblox.BuildPage.GameShowcase || {}, {
						set(target, name, value) {
							target[name] = value
							const table = document.querySelector(`.item-table[data-rootplace-id="${name}"]`)
							if(table) table.dataset.inShowcase = value;
							return true
						}
					})
				}
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

	ContentJS.listen("INIT", OnInit)
	ContentJS.listen("refreshInventory", () => $(".btr-it-reload").click())

	ContentJS.send("INJECT_INIT")
}

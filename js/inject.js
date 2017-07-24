(function() {
	var ContentJS = {
		send: function(action) {
			document.dispatchEvent(new CustomEvent("content." + action, {detail: Array.prototype.slice.call(arguments, 1)}))
		},
		listen: function(actionList,callback) {
			var realCallback = function(event) {
				callback.apply(this, event.detail)
			}
			actionList.split(" ").forEach(function(action) {
				document.addEventListener("inject."+action,realCallback)
			})
		}
	}

	function HijackAngular(module, objects) {
		module._invokeQueue.forEach((x,i) => {
			var newhandler = objects[x[2][0]]

			if(typeof(newhandler) == "function") {
				var data = x[2][1]
				var oldhandler = data[data.length-1]

				data[data.length-1] = function() {
					return newhandler.apply(this, [ oldhandler, arguments ])
				}
			}
		})
	}

	var templates = []
	var modifiedTemplates = {}

	function OnTemplateListen(id) {
		templates.push(id)
	}

	function DoTemplates(templates) {
		var args = ["$templateCache", ($templateCache) => {
			templates.forEach((id) => {
				if(!(id in modifiedTemplates)) {
					var data = $templateCache.get(id)
					if(data) {
						ContentJS.listen("TEMPLATE_" + id, (newdata) => {
							modifiedTemplates[id] = newdata
						})
						ContentJS.send("TEMPLATE_" + id, data)
					}
				}
			})

			for(var name in modifiedTemplates) {
				if($templateCache.get(name)) {
					$templateCache.put(name, modifiedTemplates[name])
				}
			}
		}]

		const templateApps = ["chatAppHtmlTemplateApp", "pageTemplateApp", "baseTemplateApp"]
		templateApps.forEach(templateName => {
			try { angular.module(templateName).run(args) } catch(ex) { }
		})
	}

	function OnInit(settings, page, matches, templates) {
		if(typeof(jQuery) === "undefined") return;
		if(typeof(angular) !== "undefined") {
			DoTemplates(templates)

			if(settings.chat.enabled) {
				try {
					HijackAngular(angular.module("chat"), {
						chatController: function(func,args) {
							var scope = args[0], 
								chatService = args[1];
							func.apply(this,args)

							var library = scope.chatLibrary
							var width = library.chatLayout.widthOfChat

							scope.$watch(function() {
								return library.chatLayout.collapsed;
							},function(value) {
								library.chatLayout.widthOfChat = value ? 54+6 : width;
								library.dialogDict.collapsed = value;
							})
						}
					})
				} catch(ex) {}
			}

			if(page === "inventory" && settings.inventory.inventoryTools) {
				try {
					HijackAngular(angular.module("assetsExplorer"),{
						assetsService: function(handler,args) {
							var result = handler.apply(this,args)

							var tbuat = result.beginUpdateAssetsItems
							result.beginUpdateAssetsItems = function() {
								var promise = tbuat.apply(result,arguments)
								ContentJS.send("inventoryUpdateBegin")
								promise.then(function() {
									setTimeout(function() {
										ContentJS.send("inventoryUpdateEnd")
									},0)
								})
								return promise
							}

							return result
						}
					})
				} catch(ex) {}
			}

			if(page === "messages") {
				try {
					HijackAngular(angular.module("messages"),{
						rbxMessagesNav: function(handler,args) {
							var result = handler.apply(this,args)
							var link = result.link

							result.link = function(u) {
								u.keyDown = function($event) {
									if($event.which == 13) {
										var value = $event.target.textContent*1
										if(!isNaN(value)) {
											args[1].search({page:value})
										} else {
											$event.target.textContent = u.currentStatus.currentPage
										}

										$event.preventDefault()
									}
								}
								var isWorking = false

								function getMessages(page,callback) {
									$.get("/messages/api/get-messages?messageTab=0&pageNumber="+page+"&pageSize=20",callback)
								}

								function getMessageCount(callback) {
									$.get("/messages/api/get-my-unread-messages-count",callback)
								}

								function markMessagesAsRead(list,callback) {
									$.post("/messages/api/mark-messages-read",{"messageIds":list},callback)
								}

								u.markAllAsRead = function() {
									if(isWorking) return;
									isWorking = true

									getMessageCount(function(data) {
										if(data.count == 0) {
											location.reload()
											return;
										}

										var count = data.count

										var progress = $("<progress value='0' max='0' style='width:100%'>")
											.attr("max",count)
											.insertAfter(".roblox-messages-btns")

										var running = 0
										var messages = []
										var pages = []
										var maxPage = 0

										function checkForUnread(data) {
											for(var i in data.Collection) {
												var msg = data.Collection[i]
												if(!msg.IsRead)
													messages.push(msg.Id)
											}

											progress.val(messages.length)
										}

										function readPage(page) {
											if(page < maxPage && messages.length < count) {
												if(pages[page] == true) {
													readPage(page+1)
													return;
												}
												getMessages(page,function(data) {
													checkForUnread(data)
													readPage(page+1)
												})
											} else {
												if(--running == 0) {
													markMessagesAsRead(messages,function() {
														location.reload()
													})
												}
											}
										}

										getMessages(0,function(data) {
											maxPage = data.TotalPages
											checkForUnread(data)
											for(var i=0;i<4;i++) {
												running++
												readPage(1+Math.floor(i/4*maxPage))
											}
										})
									})
								}
								return link.apply(this,arguments)
							}

							return result
						}
					})
				} catch(ex) {
					// Nothing
				}
			}
		}


		if(typeof Roblox !== "undefined") {
			if(!settings.general.showAds && Roblox.PrerollPlayer) {
				Roblox.PrerollPlayer.waitForPreroll = x => $.Deferred().resolve(x);
			}

			if(page === "gamedetails") {
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

					const pager = $(
					`<div class='btr-server-pager'>
						<button type='button' class='btn-control-sm btr-server-first'>First</button>
						<button type='button' class='btn-control-sm btr-server-prev'>Prev</button>
						<span style='margin:0 10px;vertical-align:middle;line-height:100%'>
							<input type='text' class='rbx-input-field btr-server-input'> of <span class='btr-server-max'>0</span>
						</span>
						<button type='button' class='btn-control-sm btr-server-next'>Next</button>
						<button type='button' class='btn-control-sm btr-server-last'>Last</button>
					</div>`
					).appendTo(`${prefix}-running-games-footer`);

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

					pager.on("click", ".btr-server-last:not(.disabled)", () => {
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

							if(!isNaN(num)) {
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

				if(Roblox.FriendsRunningGameInstances) createPager(Roblox.FriendsRunningGameInstances, true);
				if(Roblox.AllRunningGameInstances) createPager(Roblox.AllRunningGameInstances);
			}
		}

		if(typeof Sys !== "undefined" && Sys.WebForms != null) {
			const prm = Sys.WebForms.PageRequestManager.getInstance()

			prm.add_pageLoaded(() => ContentJS.send("ajaxUpdate"))

			if(page === "groups" && settings.groups.enabled) {
				prm.add_pageLoaded(() => $(".GroupWallPane .linkify").linkify())
			}
		}
	}

	ContentJS.listen("INIT", OnInit)
	ContentJS.listen("refreshInventory", () => $(".btr-it-reload").click())

	ContentJS.send("INJECT_INIT")
})();

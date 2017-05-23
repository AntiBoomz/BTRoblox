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

	function HijackAngular(module,objects) {
		module._invokeQueue.forEach(function(x,i) {
			var newhandler = objects[x[2][0]]

			if(typeof(newhandler) == "function") {
				var data = x[2][1];
				var oldhandler = data[data.length-1];

				data[data.length-1] = function() {
					return newhandler.apply(this,[oldhandler,arguments])
				}
			}
		});
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

		try { angular.module("pageTemplateApp").run(args) } catch(ex) { }
		try { angular.module("baseTemplateApp").run(args) } catch(ex) { }
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

			if(page === "avatar" && settings.avatar.moreColors) {
				try {
					var avatar = angular.module("avatar")
					avatar._invokeQueue.forEach(item => {
						/*if(item[1] === "constant" && item[2][0] === "avatarConstants") {
							var avatarConstants = item[2][1]
							var palette = avatarConstants.bodyColors.palette
							var fullpalette = {
								"45":"#B4D2E4","1024":"#AFDDFF","11":"#80BBDC","102":"#6E99CA","23":"#0D69AC","1010":"#0000FF","1012":"#2154B9","1011":"#002060","1027":"#9FF3E9","1018":"#12EED4","151":"#789082","1022":"#7F8E64","135":"#74869D","1019":"#00FFFF","1013":"#04AFEC","107":"#008F9C","1028":"#CCFFCC","29":"#A1C48C","119":"#A4BD47","37":"#4B974B","1021":"#3A7D15","1020":"#00FF00","28":"#287F47","141":"#27462D","1029":"#FFFFCC",
								"226":"#FDEA8D","1008":"#C1BE42","24":"#F5CD30","1017":"#FFAF00","1009":"#FFFF00","1005":"#FFAF00","105":"#E29B40","1025":"#FFC9C9","125":"#EAB892","101":"#DA867A","1007":"#A34B4B","1016":"#FF66CC","1032":"#FF00BF","1004":"#FF0000","21":"#C4281C","9":"#E8BAC8","1026":"#B1A7FF","1006":"#B480FF","153":"#957977","1023":"#8C5B9F","1015":"#AA00AA","1031":"#6225D1","104":"#6B327C","5":"#D7C59A","1030":"#FFCC99",
								"18":"#CC8E69","106":"#DA8541","38":"#A05F35","1014":"#AA5500","217":"#7C5C46","192":"#694028","1001":"#F8F8F8","1":"#F2F3F3","208":"#E5E4DF","1002":"#CDCDCD","194":"#A3A2A5","199":"#635F62","26":"#1B2A35","1003":"#111111","364":"#5A4C42","359":"#AF9483","361":"#564236","351":"#BC9B5D","352":"#C7AC78","330":"#FF98DC","305":"#527CAE","321":"#A75E9B","310":"#5B9A4C","317":"#7C9C6B","334":"#F8D96D"
							}
							
							for(var brickColorId in fullpalette) {
								if(!palette.find(x => x.brickColorId == brickColorId)) {
									palette.push({brickColorId, hexColor: fullpalette[brickColorId]})
								}
							}
						}*/
					})
				} catch(ex) { }
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
				} catch(ex) {}
			}
		}

		if(typeof(Roblox) !== "undefined") {
			if(!settings.general.showAds && Roblox.PrerollPlayer) {
				Roblox.PrerollPlayer.waitForPreroll = x => $.Deferred().resolve(x);
			}

			if(page === "gamedetails") {
				var placeId = matches[0]

				if(Roblox.PrivateServer != null && Roblox.PrivateServer.initServerTab != null)
					Roblox.PrivateServer.initServerTab()
				else
					console.log("[BTR] Unable to init private servers")
		
				if(Roblox.GameInstance != null && Roblox.GameInstance.init != null) {
					var curIndex = 0;
					var maxSize = 0;

					var realAjax = $.ajax;
					var fakeAjax = function(data) {
						var success = data.success;
						data.success = function(i) {
							curIndex = data.data.startindex;
							maxSize = i.TotalCollectionSize;
							Roblox.GameInstance.clearInstances()
							updatePager();
							success.apply(this,arguments);
						}
						return realAjax.apply(this,arguments);
					};
					

					(function(fetchServers) {
						Roblox.GameInstance.fetchServers = function(a,b) {
							$.ajax = fakeAjax;
							fetchServers.apply(this,arguments);
							$.ajax = realAjax;
						}
					})(Roblox.GameInstance.fetchServers)
					

					$(".rbx-running-games-load-more").hide() // Hide Load More

					var pager = $(
					"<div class='btr-server-pager'>"+
						"<button type='button' class='btn-control-sm btr-server-first'>First</button>"+
						"<button type='button' class='btn-control-sm btr-server-prev'>Prev</button>"+
						"<span style='margin:0 10px;vertical-align:middle;line-height:100%'>"+
							"<input type='text' pattern='\\d*' class='rbx-input-field btr-server-input'> of <span class='btr-server-max'>0</span>"+
						"</span>"+
						"<button type='button' class='btn-control-sm btr-server-next'>Next</button>"+
						"<button type='button' class='btn-control-sm btr-server-last'>Last</button>"+
					"</div>"
					).appendTo(".rbx-running-games-footer");

					var updatePager = function() {
						var curPage = Math.floor(curIndex/10)+1
						var maxPage = Math.floor(maxSize/10)+1
						pager.find(".btr-server-input").val(curPage)
						pager.find(".btr-server-max").text(maxPage)

						pager.find(".btr-server-first").toggleClass("disabled",curPage<=1);
						pager.find(".btr-server-prev").toggleClass("disabled",curPage<=1);
						pager.find(".btr-server-last").toggleClass("disabled",curPage==maxPage);
						pager.find(".btr-server-next").toggleClass("disabled",curPage==maxPage);

						$(".rbx-game-server-join").removeAttr("href")
					}

					pager.on("click",".btr-server-last:not(.disabled)",function() {
						Roblox.GameInstance.fetchServers(placeId,maxSize-maxSize%10);
					}).on("click",".btr-server-next:not(.disabled)",function() {
						Roblox.GameInstance.fetchServers(placeId,Math.min(maxSize-maxSize%10,curIndex+10));
					}).on("click",".btr-server-prev:not(.disabled)",function() {
						Roblox.GameInstance.fetchServers(placeId,Math.max(0,curIndex-10));
					}).on("click",".btr-server-first:not(.disabled)",function() {
						Roblox.GameInstance.fetchServers(placeId,0);
					}).on({
						blur:function() {
							var maxPage = Math.floor(maxSize/10)+1
							var text = $(this).val()
							var num = parseInt(text)
							if(!isNaN(num)) {
								num = Math.min(maxPage,Math.max(1,num))
								Roblox.GameInstance.fetchServers(placeId,(num-1)*10)
							}
						},
						keypress:function(e) {
							if (e.which == 13) {
								$(this).blur()
							}
						}
					},".btr-server-input")

					Roblox.GameInstance.init();
					Roblox.GameInstance.fetchFirstServers();
				}
			}
		}

		if(typeof(Sys) != "undefined" && Sys.WebForms != null) {
			var prm = Sys.WebForms.PageRequestManager.getInstance()

			prm.add_pageLoaded(function() {
				ContentJS.send("ajaxUpdate")
			})

			if(page == "groups" && settings.groups.enabled) {
				prm.add_pageLoaded(function() {
					$(".GroupWallPane .linkify").linkify()
				})
			}
		}
	}

	ContentJS.listen("INIT", OnInit)
	ContentJS.listen("refreshInventory", () => $(".btr-it-reload").click())

	ContentJS.send("INJECT_INIT")
})();

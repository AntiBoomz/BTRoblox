"use strict"

var robloxTimeZone = (function() {
	/*
		Roblox website is generally in Central Timezone CT
		CT is further divided into:
		1. CST: Central Standard Time, UTC-6
		2. CDT: Central Daylight Time, UTC-5
		Daylight Saving Time (DST) is in effect between march and november
		or to be more exact:
		DST starts on the second Sunday in March at 02:00 CST, which is 08:00 UTC
		DST ends on the first Sunday in November at 01:00 CST, which is 07:00 UTC
	*/

	var timeStamp = new Date()
	var month = timeStamp.getUTCMonth() + 1
	var date = timeStamp.getUTCDate()
	var weekday = timeStamp.getUTCDay()
	var hour = timeStamp.getUTCHours()

	var someSunday = date + 7 - weekday
	var firstSunday = someSunday - Math.floor(someSunday/7)*7
	var secondSunday = firstSunday + 7

	if(
		(month > 3 && month < 11) || // Within daytime months
		(month == 3 && ( // Or march and DST has begun
			date > secondSunday || 
			(date == secondSunday && hour >= 8)
		)) ||
		(month == 11 && ( // Or november and DST has not ended
			date < firstSunday ||
			(date == firstSunday && hour < 7)
		))
	) {
		return "CDT"
	}

	return "CST"
})();

function RobloxTimeToLocal(dateString,format) {
	dateString += " " + robloxTimeZone

	if(isNaN(Date.parse(dateString)))
		return false

	return format == null ? new Date(dateString) : new Date(dateString).format(format)
}

function createNewPager() {
	var pager = $(
	'<div class="btr-pager-holder pager-holder">' +
		'<ul class="pager">' +
			'<li class="pager-prev"><a><span class="icon-left"></span></a></li>' +
			'<li class="pager-mid">'+
				'<span>Page</span>'+
				'<span class="pager-cur" type="text" value="">'+
			'</li>' +
			'<li class="pager-next"><a><span class="icon-right"></span></a></li>' +
		'</ul>' +
	'</div>')

	var prev = pager.find(".pager-prev")
	var next = pager.find(".pager-next")
	var cur = pager.find(".pager-cur")

	pager.curPage = 1

	pager.setPage = function(page) {
		pager.curPage = page
		cur.text(pager.curPage)
	}
	pager.prev = function(fn) {
		if(arguments.length === 0) {
			pager.one("btr-pager-prev", (ev) => !ev.isDefaultPrevented() ? pager.setPage(pager.curPage-1) : null)
			return pager.trigger("btr-pager-prev");
		}

		pager.on("btr-pager-prev", fn);
	}
	pager.next = function(fn) {
		if(arguments.length === 0) {
			pager.one("btr-pager-next", (ev) => !ev.isDefaultPrevented() ? pager.setPage(pager.curPage+1) : null)
			return pager.trigger("btr-pager-next");
		}

		pager.on("btr-pager-next", fn);
	}
	pager.togglePrev = (bool) => prev.toggleClass("disabled", !bool);
	pager.toggleNext = (bool) => next.toggleClass("disabled", !bool);

	pager.togglePrev(false)
	pager.toggleNext(false)
	pager.setPage(1)

	prev.find("a").click(() => pager.prev())
	next.find("a").click(() => pager.next())

	return pager
}

var createPager = function() {
	var html = 
	'<div class="btr-pager-holder pager-holder">' +
		'<ul class="pager">' +
			'<li class="pager-prev"><a><span class="icon-left"></span></a></li>' +
			'<li class="pager-mid">'+
				'<span>Page</span>'+
				'<input class="pager-cur" type="text" value="">'+
				'<span>of</span>'+
				'<span class="pager-tot"></span>'+
			'</li>' +
			'<li class="pager-next"><a><span class="icon-right"></span></a></li>' +
		'</ul>' +
	'</div>';

	return function() {
		var pager = $(html)
		var prev = pager.find(".pager-prev")
		var next = pager.find(".pager-next")
		var cur = pager.find(".pager-cur").val(1)
		var tot = pager.find(".pager-tot").text("")

		var self = $.extend(pager, {
			curPage: 0,
			maxPage: 0,

			setPage: function(value) {
				var page = Math.max(0,Math.min(self.maxPage, value))

				if(this.curPage != page) {
					this.curPage = page;

					cur.val(this.curPage+1)
				}

				prev.toggleClass("disabled", this.curPage == 0)
				next.toggleClass("disabled", this.curPage == this.maxPage)
			},
			setMaxPage: function(value) {
				if(value < 0)
					value = 0

				this.maxPage = value
				tot.text(this.maxPage+1)

				/*if(this.maxPage > 0)
					pager.show();
				else
					pager.hide();*/

				next.toggleClass("disabled", this.curPage == this.maxPage)
			}
		});

		function setPage(page) {
			var page = Math.max(0, Math.min(self.maxPage, page))
			if(self.curPage != page) {
				self.one("btr-pager-onchange.default", (ev, page) => {
					if(!ev.isDefaultPrevented())
						self.setPage(page);
				});
				self.trigger("btr-pager-onchange", page)
			}
		}

		prev.find("a").click(() => { setPage(self.curPage-1), self.trigger("btr-pager-prev") })
		next.find("a").click(() => { setPage(self.curPage+1), self.trigger("btr-pager-next") })
		cur.on("keydown",function(ev) {
			if(ev.keyCode == 13) {
				var page = parseInt(this.value)
				if(!isNaN(page))
					setPage(page-1);
			}
		});

		self.setPage(0)
		self.setMaxPage(0)

		return self
	}
}();

var XsrfPromise;
function getXsrfToken(callback) {
	if(!XsrfPromise) {
		XsrfPromise = new Promise(function(success,failure) {
			Observer.add({
				selector: "script:not([src])",
				filter: function() { return this.text().indexOf("XsrfToken.setToken") != -1; },
				callback: function(x) {
					var match = x.text().match(/setToken\('(.*)'\)/);
					if(match) {
						success(match[1]);
					} else {
						console.log("Getting XsrfToken failed");
					}
				}
			})
		});
	}

	XsrfPromise.then(callback)
}

function downloadAsset(type,params) {
	return new Promise(function(resolve) {
		BackgroundJS.send("getBlob","http://www.roblox.com/Asset/?"+$.param(params),function(bloburl) {
			var xhr = new XMLHttpRequest();
			xhr.open("GET",bloburl);

			switch(type) {
				case "blob":
					xhr.responseType = "blob";
					xhr.onload = function() {
						resolve(window.URL.createObjectURL(xhr.response));
						window.URL.revokeObjectURL(bloburl);
					}
					break;
				case "arraybuffer":
					xhr.responseType = "arraybuffer";
					xhr.onload = function() {
						resolve(xhr.response);
						window.URL.revokeObjectURL(bloburl);
					}
					break;
				default:
					throw type;
			}
			
			xhr.send();
		});
	});
}

/*
var avatarApi = {
	baseUrl: "https://avatar.roblox.com/v1/",
	get: function(url, data, cb) {
		if(typeof(data) == "function")
			cb = data, data = null;

		$.ajax({
			type: "GET",
			url: this.baseUrl + url,
			data: data,
			dataType: "json",
			headers: { "X-CSRF-TOKEN": this.csrfToken }
		}).done(cb).fail((xhr) => {
			if(xhr.status == 403) {
				this.csrfToken = xhr.getResponseHeader("X-CSRF-TOKEN")
				this.get(url, data, cb)
			}
		})
	},
	post: function(url, data, cb) {
		if(typeof(data) == "function")
			cb = data, data = null;

		$.ajax({
			type: "POST",
			url: this.baseUrl + url,
			data: data ? JSON.stringify(data) : null,
			dataType: "json",
			contentType: "application/json",
			headers: { "X-CSRF-TOKEN": this.csrfToken }
		}).done(cb).fail((xhr) => {
			if(xhr.status == 403) {
				this.csrfToken = xhr.getResponseHeader("X-CSRF-TOKEN")
				this.post(url, data, cb)
			}
		})
	},

	getRules: function(cb) { this.get("avatar-rules", cb) },
	getData: function(cb) { this.get("avatar", cb) },

	setType: function(type, cb) { this.post("avatar/set-player-avatar-type", {playerAvatarType: type}, cb) },
	setBodyColors: function(dict, cb) {	this.post("avatar/set-body-colors", dict, cb) },
	setScales: function(width, height, cb) { this.post("avatar/set-scales", {width: width, height: height}, cb) },
	setWearing: function(list, cb) { this.post("avatar/set-wearing-assets", {assetIds: list}, cb) },
	wear: function(assetId, cb) { this.post("avatar/wear-asset", {assetId: assetId}, cb) },
	unwear: function(assetId, cb) { this.post("avatar/unwear-asset", {assetId: assetId}, cb) },

	createOutfit: function(data, cb) { this.post("outfits/create", data, cb) },
	updateOutfit: function(id, data, cb) { this.post("outfits/"+id+"/update", data, cb) },
	wearOutfit: function(id, cb) { this.post("outfits/"+id+"/wear", cb) },
	deleteOutfit: function(id, cb) { this.post("outfits/"+id+"/delete", cb) },
	getOutfitPage: function(page, amt, cb) { 
		loggedInUserPromise.then((userId) => this.get("users/"+userId+"/outfits", {page:page, itemsPerPage:amt}, cb))
	}
}*/


pages.character.init = function() {
	/*if(location.search == "?new") {
		var master = $("<div id='MasterContainer'>")

		Observer.add({
			selector: "body",
			callback: function(body) {
				body.addClass("btr-characterPage")
			}
		}).add({
			selector: "#MasterContainer",
			callback: function(cont) {
				master.insertAfter(cont)
				cont.remove()
			}
		})

		var wrapper = $("<div class='btr-mainWrapper' />").appendTo(master)

		var avatar = $("<div class='btr-avatar' />").appendTo(wrapper)
		var wearing = $("<div class='btr-wearing' />").appendTo(wrapper)
		var inventory = $("<div class='btr-inventory' />").appendTo(wrapper)

		var innerAvatar = $("<div class='btr-innerAvatar' />").appendTo(avatar)

		var modeSwitch = $("<div class='btr-modeSwitch btr-switch'>" +
			"<div class='btr-switch-off'>R6</div>" +
			"<div class='btr-switch-on'>R15</div>" +
			"<input type='checkbox'>" + 
			"<div class='btr-switch-flip'>" +
				"<div class='btr-switch-off'>R6</div>" +
				"<div class='btr-switch-on'>R15</div>" +
			"</div>" +
		"</div").appendTo(avatar).find("input")

		modeSwitch.on("change", function(event) {
			if(IsR15 != this.checked) {
				var val = IsR15 = this.checked

				avatarApi.setType(IsR15 ? "R15" : "R6", (json) => {
					if(json.success) {
						IsR15 = val
						modeSwitch.attr("checked", IsR15)
						reloadData()
					}
				})
			}
		})

		var viewerPromise = new Promise((resolve) => {
			BackgroundJS.send("execScript", ["RBXMParser.js", "https://raw.githubusercontent.com/AntiBoomz/BTRoblox/master/out/animPreview.js"], () => {
				setTimeout(() => resolve(ANTI.Create3dPreview(innerAvatar)), 0) // Errors + BackgroundJS = kri
			})
		})
		var IsR15 = false
		var avatarRules = null
		var avatarData = null
		var colorDict = {}

		function reloadData() {
			if(!avatarRules)
				return;

			avatarApi.getData((data) => {
				avatarData = data
				IsR15 = avatarData.playerAvatarType == "R15"
				modeSwitch.attr("checked", IsR15)

				viewerPromise.then((viewer) => {
					if(avatarData === data) {
						var customData = Object.assign({}, data)
						customData.bodyColors = {}
						for(var name in data.bodyColors) {
							customData.bodyColors[name] = colorDict[data.bodyColors[name]]
						}

						viewer.updateCharacter(customData)
					}
				})
			})
		}

		avatarApi.getRules((rules) => {
			console.log("rules", rules)
			avatarRules = rules
			rules.bodyColorsPalette.forEach((color) => colorDict[color.brickColorId]=color.hexColor)
			reloadData()
		})
	}*/
}

pages.home.init = function() {
	Observer.add({
		multiple: true,
		selector: ".feeds .list-item .text-date-hint",
		callback: function(span) {
			var fixedTimeStamp = RobloxTimeToLocal(span.text().replace("|",""), "MMM D, YYYY | hh:mm A")
			if(fixedTimeStamp) {
				span.attr("btr-original-content",span.text())
				span.text(fixedTimeStamp)
			}
		}
	})
}

pages.messages.init = function() {
	Observer.add({
		multiple: true,
		permanent: true,
		selector: ".messageDivider",
		callback: function(msg) {
			var span = msg.find(".message-summary-date")
			var fixedTimeStamp = RobloxTimeToLocal(span.text().replace("|",""), "MMM D, YYYY | hh:mm A")
			if(fixedTimeStamp) {
				span.attr("btr-original-content",span.text())
				span.text(fixedTimeStamp)
			}
		}
	}).add({
		multiple: true,
		permanent: true,
		selector: ".roblox-message-body",
		callback: function(msg) {
			var span = msg.find(".subject .date")
			var fixedTimeStamp = RobloxTimeToLocal(span.text().replace("|",""), "MMM D, YYYY | hh:mm A")
			if(fixedTimeStamp) {
				span.attr("btr-original-content",span.text())
				span.text(fixedTimeStamp)
			}
		}
	})

	modifyTemplate("messages-nav", function(template) {
		template.find(".CurrentPage")
			.addClass("btr-CurrentPage")
			.attr("contentEditable",true)
			.attr("ng-keydown","keyDown($event)")

		$("<button class='btr-markAllAsReadInbox btn-control-sm' ng-click='markAllAsRead()'>" +
			"Mark All As Read" +
		"</button>").insertAfter(template.find(".roblox-markAsUnreadInbox"))
	});
}

pages.develop.init = function() {
	Observer.add({
		multiple: true,
		selector: ".item-table[data-in-showcase]",
		callback: function(table) {
			$("<tr>" +
				"<td>" +
					"<a class='btr-showcase-status'/>" +
				"</td>" +
			"</tr>").appendTo(table.find(".details-table>tbody"))
		}
	})

	$(document).on("click",".btr-showcase-status",function() {
		var self = $(this)
		var table = self.closest(".item-table");
		var placeId = parseInt(table.attr("data-item-id"))
		var isVisible = table.attr("data-in-showcase").toLowerCase()=="true"

		getXsrfToken(function(token) {
			$.ajax({
				url: "/game/toggle-profile",
				type: "post",
				data: {
					placeId: placeId,
					addToProfile: !isVisible
				},
				dataType: "json",
				headers: {
					"X-CSRF-TOKEN": token
				},
				success: function(json) {
					if(json.isValid)
						table.attr("data-in-showcase",json.data.inShowcase)
				}
			});
		})
	})
}

pages.itemdetails.init = function(assetId) {
	Observer.add({
		selector: "#item-details-description",
		callback: function(desc) {
			desc.addClass("linkify")

			desc.contents().each(function(_,node) {
				if(node.nodeType == 3) {
					node.nodeValue = node.nodeValue.trim()
				}
			})
		}
	}).add({
		multiple: true,
		permanent: true,
		selector: "#AjaxCommentsContainer .comments .comment-item",
		callback: function(comment) {
			var span = comment.find(".text-date-hint")
			var fixedTimeStamp = RobloxTimeToLocal(span.text().replace("|",""), "MMM D, YYYY | hh:mm A")
			if(fixedTimeStamp) {
				span.attr("btr-original-content",span.text())
				span.text(fixedTimeStamp)
			}
		}
	})

	/*
	if(settings.catalog.animationPreview) {
		Observer.add({
			selector: [".item-type-field-container .field-content","#AssetThumbnail .thumbnail-span"],
			callback: function(label,thumb) {
				if(label.text() == "Animation") {
					thumb.addClass("btr-preview-loading")
						.addClass("btr-animation-preview")

					loggedInUserPromise.then((userId) => {
						if(userId == -1)
							userId = 0;

						downloadAsset("arraybuffer", {id:assetId}).then((buffer) => {
							BackgroundJS.send("execScript", ["RBXMParser.js", "three.min.js", "animPreview.js"], () => {
								var anim = null

								try {
									var rbxm = ANTI.ParseRBXM(buffer)
									anim = ANTI.ParseAnimationData(rbxm)
								} catch(ex) {
									console.warn("[BTRoblox] Unable to load animation previewer:", ex.message)
									thumb.removeClass("btr-preview-loading")
									return;
								}

								//ANTI.Create3dPreview(thumb, userId, anim)
							})
						});
					})
				}
			}
		})
	}*/
}

pages.gamedetails.init = function(placeId) {
	if(!settings.gamedetails.enabled)
		return;

	var gameDataPromise = new Promise(function(solve) {
		BackgroundJS.send("getProductInfo",placeId,function(data) {
			solve(data);
		})
	})

	Observer.add({
		selector: ["#tab-about","#tab-game-instances"],
		callback: function(aboutTab,serversTab) {
			aboutTab.appendTo(".nav-tabs").removeClass("active").find(".text-lead").text("Commentary");
			serversTab.prependTo(".nav-tabs").addClass("active")
		}
	}).add({
		selector: ["#about","#game-instances"],
		callback: function(about,servers) {
			about.removeClass("active")
			servers.addClass("active")
		}
	}).add({
		selector: [".game-about-container",".game-about-container .section-content",".game-main-content"],
		callback: function(container,content,newParent) {
			content.removeAttr("class").addClass("btr-description").appendTo(newParent);
			container.remove();
		}
	}).add({
		selector: ".tab-content",
		callback: function(container) {
			container.addClass("section")
		}
	}).add({
		multiple: true,
		selector: ".tab-content .tab-pane",
		callback: function(pane) {
			pane.addClass("section-content")
		}
	}).add({
		selector: [".badge-container",".game-main-content"],
		callback: function(badges,prevChild) {
			var container = $("<div class='col-xs-12 btr-badges-container'/>").insertAfter(prevChild);
			badges.appendTo(container);
		}
	}).add({
		multiple: true,
		selector: ".badge-container .badge-row",
		callback: function(self) {
			var url = self.find(".badge-image>a").attr("href");
			self.find(".badge-data-container>.badge-name").wrap($("<a>").attr("href",url));

			self.find(".badge-data-container>p.para-overflow").removeClass("para-overflow");
		}
	}).add({
		selector: "#carousel-game-details",
		callback: function(carousel) {
			carousel.attr("data-is-video-autoplayed-on-ready","false")
		}
	}).add({
		selector: ".game-stats-container .game-stat:nth-child(3) .text-lead",
		callback: function(label) {
			gameDataPromise.then(function(data) {
				label.text( new Date(data.Updated).relativeFormat("zz 'ago'") )
			});
		}
	}).add({
		selector: ".rbx-visit-button-closed, #MultiplayerVisitButton",
		callback: function() {
			if($(".rbx-visit-button-closed").length > 0)
				return;

			var mainPlaceId = $("#MultiplayerVisitButton").attr("placeid");
			if(placeId != mainPlaceId) {
				var box = $(
				"<div class='btr_partofuniverse'>" +
					"This place is part of " +
					"<a class='text-link' href='//www.roblox.com/games/{0}/'></a>" +
					"<div class='VisitButton VisitButtonPlayGLI btr_universevisitbtn' placeid='{0}' data-action='play' data-is-membership-level-ok='true'>" +
						"<a class='btn-secondary-md'>Play</a>" +
					"</div>" +
				"</div>"
				).elemFormat(mainPlaceId).prependTo($(".game-main-content"))

				$(".game-main-content #game-context-menu").css("top","72px");

				BackgroundJS.send("getProductInfo",mainPlaceId,function(data) {
					var link = $(">a",box);
					link.attr("href",link.attr("href")+data.Name.replace(/[^\w-\s]+/g,"").replace(/\s+/g,"-"))
					link.text(data.Name)
				})
			}
		}
	}).add({
		multiple: true,
		permanent: true,
		selector: "#AjaxCommentsContainer .comments .comment-item",
		callback: function(comment) {
			var span = comment.find(".text-date-hint")
			var fixedTimeStamp = RobloxTimeToLocal(span.text().replace("|",""), "MMM D, YYYY | hh:mm A")
			if(fixedTimeStamp) {
				span.attr("btr-original-content",span.text())
				span.text(fixedTimeStamp)
			}
		}
	})

	$(document).ready(function() {
		if($("#AjaxCommentsContainer").length == 0) {
			$("<div class='section-content-off'>Comments have been disabled for this place</div>").appendTo("#about")
		}

		if(settings.gamedetails.showBadgeOwned) {
			loggedInUserPromise.then(function(userId) {
				if(userId > 0) {
					var badges = []
					$(".badge-container .badge-row").each(function(_,obj) {
						var self = $(obj)
						var badgeId = self.find(".badge-image>a").attr("href").match(/(\d+)$/)[1]
						badges.push([self,badgeId])
					});

					var loadBadge = function(i) {
						var self = badges[i][0]
						var badgeId = badges[i][1]
						self.addClass("btr_badgeownedloading")
						ajaxQueue.new({
							url: "//api.roblox.com/Ownership/HasAsset?userId="+userId+"&assetId="+badgeId,
							type: "GET",
							success: function(val) {
								if(val==false) {
									self.addClass("btr_notowned")
									self.find(".badge-image img").attr("title","You do not own this badge")
								}
							},
							complete: function() {
								self.removeClass("btr_badgeownedloading")
							},
							error: function() {
								setTimeout(loadBadge,10000,i)
							}
						})
						if(i+1 < badges.length) {
							if(i%20 == 0) {
								setTimeout(loadBadge,1000,i+1)
							} else {
								loadBadge(i+1)
							}
						}
					}

					if(badges.length)
						loadBadge(0);
				}
			})
		}
	})
}

pages.groups.init = function() {
	if(!settings.groups.enabled)
		return;

	var rankNamePromises = {}

	Observer.add({
		selector: "body",
		callback: function(body) {
			body.addClass("btr-groups")
		}
	}).add({
		selector: "#GroupDescP",
		callback: function(desc) {
			var fullDesc = $("#GroupDesc_Full")
			if(fullDesc.length > 0) {
				desc.find("pre").text(fullDesc.val())
				fullDesc.remove()
			}
		}
	}).add({
		selector: "#ctl00_cphRoblox_GroupStatusPane_StatusDate",
		callback: function(span) {
			var fixedTimeStamp = RobloxTimeToLocal(span.text())
			if(fixedTimeStamp) {
				var dateString = Date.now() - fixedTimeStamp.getTime() < 7*24*60*60*1000 // Was less than a week ago
					? fixedTimeStamp.relativeFormat("zz 'ago'")
					: fixedTimeStamp.format("M/D/YYYY h:mm:ss A")

				span.attr("btr-original-content",span.text())
				span.text(dateString)
			}
		}
	}).add({
		multiple: true,
		permanent: true,
		selector: ".AlternatingItemTemplateOdd, .AlternatingItemTemplateEven",
		callback: function(self) {
			self.addClass("btr_comment")

			self.find(".UserLink").prependTo(self.find(".RepeaterText"))

			var hasDelete = false, hasExile = false

			self.find(".GroupWall_PostBtns>a").each(function(_,obj) {
				var self = $(obj)
				self.addClass("btn-control").addClass("btn-control-medium").css("line-height","").css("float","")

				self.text(self.text().replace(/^[\s•]+/,'').trim())
				if(self.text() == "Delete") {
					hasDelete = true;
					self.attr("href",
						"javascript:Roblox.GenericConfirmation.open({"+
							"titleText: \"Delete This Comment?\","+
							"bodyContent: \"Are you sure you wish to delete this comment?\","+
							"acceptText: \"Delete\","+
							"declineText: \"Cancel\","+
							"escClose:true,"+
							"acceptColor: Roblox.GenericConfirmation.green,"+
							"imageUrl: \"/images/Icons/img-alert.png\","+
							"onAccept: function() {"+
								self.attr("href").replace("javascript:","")+
							"}"+
						"});"
					)
				} else if(self.text() == "Exile User") {
					hasExile = true;
					self.prependTo(self.parent())
				}
			})

			if(!hasDelete)
				$("<a class='btn-control btn-control-medium disabled'>Delete</a>").prependTo(self.find(".GroupWall_PostBtns"))
			if(!hasExile)
				$("<a class='btn-control btn-control-medium disabled'>Exile User</a>").prependTo(self.find(".GroupWall_PostBtns"))

			var dateSpan = self.find(".GroupWall_PostDate")
				.children()
					.prependTo(self.find(".GroupWall_PostBtns"))
					.filter("span")
						.addClass("btr_groupwallpostdate")
			var fixedTimeStamp = RobloxTimeToLocal(dateSpan.text())
			if(fixedTimeStamp) {
				var dateString = Date.now() - fixedTimeStamp.getTime() < 24*60*60*1000
					? fixedTimeStamp.relativeFormat("zz 'ago'")
					: fixedTimeStamp.format("M/D/YYYY h:mm:ss A")

				dateSpan.attr("btr-original-content",dateSpan.text())
				dateSpan.text(dateString)
			}


			self.find(".GroupWall_PostDate").remove()


			var groupId = null
			var userId = null
			try {
				groupId = $("#ClanInvitationData").attr("data-group-id") || document.location.search.match("gid=(\\d+)")[1]
				userId = self.find(".UserLink a").attr("href").match(/users\/(\d+)/)[1]
			} catch(ex) {}
			if(groupId && userId) {
				var span = $("<span class='btr_grouprank'/>").insertAfter(self.find(".UserLink a"))

				if(!rankNamePromises[userId]) {
					rankNamePromises[userId] = new Promise(function(resolve) {
						BackgroundJS.send("getRankName",{userId:userId,groupId:groupId},function(rankname) {
							resolve(rankname)
						})
					})
				}

				rankNamePromises[userId].then(function(rankname) {
					span.text("("+rankname+")")
				})
			}
		}
	})

	// TODO: Group audit timestamps (separate)
	// TODO: Group admin timestamps (separate)
}

pages.profile.init = function(userId) {
	if(!settings.profile.enabled)
		return;

	var left = $(
	"<div class='btr-profile-col-2 btr-profile-left'>" +
		"<div class='placeholder-about' style='display:none'/>" +
		"<div class='placeholder-robloxbadges' style='display:none'/>" +
		"<div class='placeholder-playerbadges' style='display:none'/>" +
		"<div class='placeholder-groups' style='display:none'/>" +
	"</div>")

	var right = $(
	"<div class='btr-profile-col-2 btr-profile-right'>" +
		"<div class='placeholder-games' style='display:none'/>" +
		"<div class='placeholder-friends' style='display:none'/>" +
		"<div class='placeholder-favorites' style='display:none'/>" +
	"</div>")

	var bottom = $(
	"<div class='btr-profile-col-1 btr-profile-bottom'>" +
		"<div class='placeholder-collections' style='display:none'/>" +
		"<div class='placeholder-inventory' style='display:none'/>" +
	"</div>")

	Observer.add({
		selector: "body",
		callback: function(body) {
			body.addClass("btr-profile")
		}
	}).add({
		selector: ".profile-container",
		callback: function(container) {
			left.appendTo(container)
			right.insertAfter(left)
			bottom.insertAfter(right)
		}
	}).add({ // About
		selector: ".profile-about",
		callback: function(about) {
			left.find(".placeholder-about").replaceWith(about)

			about.find(".tooltip-pastnames").attr("data-container","body") // Display tooltip over side panel
			about.find(".profile-about-content-text").addClass("linkify")

			var content = about.find(">.section-content")

			var status = $(".profile-avatar-status")
			var statusDiv = $("<div class='btr-header-status-parent'/>").prependTo(content)
			var statusText = $("<span class='btr-header-status-text'/>").appendTo(statusDiv)
			var statusLabel = $("<span>").appendTo(statusText)

			if(status.length == 0) {
				statusText.addClass("btr-status-offline")
				statusLabel.text("Offline")
			} else {
				var statusTitle = status.attr("title")

				if(status.hasClass("icon-game")) {
					var a = $("<a>").attr("title",statusTitle).append(statusText).appendTo(statusDiv)
					statusText.addClass("btr-status-ingame")
					statusLabel.text(statusTitle)

					Observer.add({
						selector: "script:not([src])",
						filter: function() { return this.html().indexOf("play_placeId") != -1 },
						callback: function(script) {
							var matches = script.html().match(/play_placeId = (\d+)/)
							if(matches && matches[1] != "0") {
								var placeId = matches[1]
								var urlTitle = statusTitle.replace(/\s+/g,"-").replace(/[^\w\-]/g,"")
								a.attr("href","/games/{0}/{1}".format(placeId,urlTitle))

								$("<a class='btr-header-status-follow-button'/>")
									.text("\uD83D\uDEAA")
									.attr("title","Follow")
									.attr("onclick","Roblox.GameLauncher.followPlayerIntoGame({0});".format(userId))
									.appendTo(a)

								if(statusTitle == "In Game") {
									BackgroundJS.send("getProductInfo",placeId,function(data) {
										urlTitle = data.Name.replace(/\s+/g,"-").replace(/[^\w\-]/g,"")
										a.attr("href","/games/{0}/{1}".format(placeId,urlTitle))
										statusLabel.text(data.Name)
									})
								}
							} 
						}
					})
				} else if(status.hasClass("icon-studio")) {
					statusText.addClass("btr-status-studio")
					statusLabel.text(statusTitle)
				} else {
					statusText.addClass("btr-status-online")
					statusLabel.text(statusTitle)
				}
			}

			Observer.add({
				selector: ".profile-avatar",
				callback: function(avatar) {
					avatar.insertBefore(about.find(".profile-about-content"))

					avatar.find(">h3").remove()
					avatar.find(".profile-avatar-left,.profile-avatar-right").removeClass("col-sm-6").addClass("btr-profile-col-1")

					avatar.find(".enable-three-dee").text("3D") // It's initialized as empty
					$("<span class='btr-toggle-items btn-control btn-control-sm'>Show Items</span>").appendTo(avatar.find("#UserAvatar"))

					$(document).on("click",".btr-toggle-items",function() {
						var items = $(".profile-avatar-right")
						items.toggleClass("visible",!items.hasClass("visible"))

						$(this).text(items.hasClass("visible") ? "Hide Items" : "Show Items")
					})
				}
			}).add({
				selector: ".profile-statistics",
				callback: function(stats) {
					stats.find(".profile-stats-container").insertAfter(about.find(".profile-about-content"))
					stats.remove()
				}
			})
		}
	}).add({ // Roblox Badges
		selector: "#about>.section>.container-header>h3",
		filter: function() { return this.text().indexOf("Roblox Badges") != -1 },
		callback: function(h3) {
			var badges = h3.parent().parent()
			left.find(".placeholder-robloxbadges").replaceWith(badges)

			badges.addClass("btr-profile-robloxbadges")
			badges.find(".assets-count").remove()
			badges.find(".btn-more").attr("ng-show",badges.find(".badge-list").children().length > 10 ? "true" : "false")
		}
	}).add({ // Player Badges
		selector: "#about>.section>.container-header>h3",
		filter: function() { return this.text().indexOf("Player Badges") != -1 },
		callback: function(h3) {
			var badges = h3.parent().parent()
			left.find(".placeholder-playerbadges").replaceWith(badges)

			badges.addClass("btr-profile-playerbadges")
			badges.find(".assets-count").remove()

			var hlist = badges.find(".hlist")
			hlist.addClass("btr-hlist")

			var isLoading = false
			var prevData = null

			var pager = createNewPager()
			pager.insertAfter(hlist)

			pager.prev((ev) => {
				if(!isLoading && prevData && prevData.Data && prevData.Data.previousPageCursor) {
					loadPage(prevData.Data.Page-1, prevData.Data.previousPageCursor)
				}

				ev.preventDefault()
			})

			pager.next((ev) => {
				if(!isLoading && prevData && prevData.Data && prevData.Data.nextPageCursor) {
					loadPage(prevData.Data.Page+1, prevData.Data.nextPageCursor)
				}

				ev.preventDefault()
			})

			function loadPage(page, cursor) {
				isLoading = true
				var url = "/users/inventory/list-json?assetTypeId=21&itemsPerPage=10&userId={0}&cursor={1}&pageNumber={2}".format(userId, cursor, page)

				$.get(url, (json) => {
					isLoading = false
					prevData = json

					if(json && json.IsValid) {
						pager.setPage(json.Data.Page)
						pager.togglePrev(json.Data.previousPageCursor != null)
						pager.toggleNext(json.Data.nextPageCursor != null)
						hlist.empty()

						if(json.Data.Items.length === 0) {
							$("<div class='section-content-off btr-section-content-off'/>")
								.text((userId == loggedInUser ? "You have" : "This user has")+" no badges".format(text,categoryName))
								.appendTo(hlist)
						
						} else {
							$.each(json.Data.Items, (_, data) => {
								$(
								"<li class='list-item badge-item asset-item'>" +
									"<a href='{0}' class='badge-link' title='{2}'>" +
										"<img src='{1}' alt='{2}'>" +
										"<span class='item-name text-overflow'>{2}</span>" +
									"</a>" +
								"</li>").elemFormat(data.Item.AbsoluteUrl,data.Thumbnail.Url,data.Item.Name)
									.appendTo(hlist)
							})
						}
					}
				})
			}

			loadPage(1, "")
		}
	}).add({ // Groups
		selector: "#groups-switcher",
		callback: function(switcher) {
			var groups = switcher.parent().parent()
			left.find(".placeholder-groups").replaceWith(groups)

			groups.addClass("btr-profile-groups")

			var hlist = groups.find(".group-list").appendTo($("<div class='section-content'/>").appendTo(groups))

			groups.find(".container-header>.container-buttons, .profile-slide-container").remove()

			var pageSize = 8
			var pager = createPager()
			pager.insertAfter(hlist)

			pager.on("btr-pager-onchange",function(ev,page) {
				loadPage(page)
			})

			function loadPage(page) {
				hlist.children().each(function(index,obj) {
					$(obj).toggleClass("visible",Math.floor(index/pageSize) == page)
				})
			}

			CreateObserver(hlist).add({
				multiple: true,
				selector: ".list-item",
				callback: function(parent) {
					var card = parent.find(".game-card").insertAfter(parent)
					parent.remove()
					card.toggleClass("visible",Math.floor(card.index()/pageSize) == 0)
					pager.setMaxPage(Math.floor((hlist.children().length-1)/pageSize))

					card.find(".card-thumb").each(function(_,obj) {
						var thumb = $(obj)

						thumb.addClass("unloaded")
						thumb.attr("src",thumb.attr("data-src"))
						thumb.on("load",function() { $(this).removeClass("unloaded") })
					})
				}
			})
		}
	}).add({ // Games
		selector: ".profile-game",
		callback: function(games) {
			right.find(".placeholder-games").replaceWith(games)

			games.addClass("section")

			var switcher = games.find("#games-switcher")//.hide()
			games.find(".game-grid").attr("ng-cloak","").addClass("section-content")

			var oldlist = games.find("#games-switcher>.hlist").hide()
			var cont = $("<div class='section-content'/>").insertBefore(switcher)
			var hlist = $("<ul class='hlist btr-games-list'/>").appendTo(cont)

			$(document).on("click",".btr-game-button",function(event) {
				if($(event.target).parents(".btr-game-dropdown").length > 0) return;
				var item = $(this).parent()

				item.toggleClass("selected")
				hlist.find(".btr-game.selected").not(item).removeClass("selected")
			})

			var pageSize = 10
			var pager = createPager()
			pager.insertAfter(hlist)

			pager.on("btr-pager-onchange",function(ev,page) {
				loadPage(page)
			})

			function loadPage(page) {
				hlist.children().each(function(index,obj) {
					$(obj).toggleClass("visible",Math.floor(index/pageSize) == page)
						.toggleClass("selected",index == page*pageSize)
				})
			}

			CreateObserver(oldlist).add({
				multiple: true,
				selector: ".slide-item-container",
				callback: function(slide) {
					var index = slide.attr("data-index")
					var placeId = slide.find(".slide-item-image").attr("data-emblem-id")

					var item = $(
					"<li class='btr-game'>" + 
						"<div class='btr-game-button'>" +
							"<span class='btr-game-title'>{Title}</span>" +
						"</div>" +
						"<div class='btr-game-content'>"+
							"<div class='btr-profile-col-1 btr-game-thumb-container'>" +
								"<a href='{Url}'><img class='btr-game-thumb unloaded'></a>" +
								"<a href='{Url}'><img class='btr-game-icon' src='{IconThumb}'></a>" +
							"</div>" +
							"<div class='btr-profile-col-1 btr-game-desc linkify'>" +
								"{Desc}" +
							"</div>" +
							"<div class='btr-profile-col-1 btr-game-info'>" +
								"<div class='btr-profile-col-2 btr-game-playbutton-container'>" +
									"<div class='btr-game-playbutton VisitButton VisitButtonPlayGLI btn-primary-lg' placeid='{PlaceId}' data-action='play' data-is-membership-level-ok='true'>" +
										"Play" +
									"</div>" +
								"</div>" +
								"<div class='btr-profile-col-2 btr-game-stats'/>" +
							"</div>" +
						"</div>" +
					"</li>").elemFormat({
						PlaceId: placeId,
						Title: slide.find(".slide-item-name").text(),
						Desc: slide.find(".slide-item-description").text(),
						Url: slide.find(".slide-item-emblem-container>a").attr("href"),
						IconThumb: slide.find(".slide-item-image").attr("data-src")
					})

					item.toggleClass("visible",Math.floor(index/pageSize) == 0)
					item.find(".btr-game-stats").append(slide.find(".slide-item-stats>.hlist"))
					item.find(".unloaded").on("load",function() { $(this).removeClass("unloaded") })

					loggedInUserPromise.then(function(loggedInUser) {
						if(userId == loggedInUser) {
							$('<span class="btr-game-dropdown">' +
								'<a class="rbx-menu-item" data-toggle="popover" data-container="body" data-bind="btr-placedrop-{PlaceId}" style="float:right;margin-top:-4px;">' +
									'<span class="icon-more"></span>' +
								'</a>' +
								'<div data-toggle="btr-placedrop-{PlaceId}" style="display:none">' +
									'<ul class="dropdown-menu" role="menu">' +
										'<li><div onclick="Roblox.GameLauncher.buildGameInStudio({PlaceId})"><a>Build</a></div></li>' +
										'<li><div onclick="Roblox.GameLauncher.editGameInStudio({PlaceId})"><a>Edit</a></div></li>' +
										'<li><a href="/places/{PlaceId}/update"><div>Configure this Place</div></a></li>' +
										'<li><a href="/my/newuserad.aspx?targetid={PlaceId}&targettype=asset"><div>Advertise this Place</div></a></li>' +
										'<li><a href="/develop?selectedPlaceId={PlaceId}&View=21"><div>Create a Badge for this Place</div></a></li>' +
										'<li><a href="/develop?selectedPlaceId={PlaceId}&View=34"><div>Create a Game Pass</div></a></li>' +
										'<li><a href="/places/{PlaceId}/stats"><div>Developer Stats</div></a></li>' +
										'<li><a class="btr-btn-toggle-profile"><div>Remove from Profile</div></a></li>' +
										'<li><a class="btr-btn-shutdown-all"><div>Shut Down All Instances</div></a></li>' +
									'</ul>' +
								'</div>' +
							'</span>').elemFormat({ PlaceId: placeId })
							.appendTo(item.find(".btr-game-button"))
							
							item.on("click",".btr-btn-toggle-profile",function() {
								getXsrfToken(function(token) {
									$.ajax({
										url: "/game/toggle-profile",
										type: "post",
										data: {
											placeId: placeId,
											addToProfile: false
										},
										dataType: "json",
										headers: {
											"X-CSRF-TOKEN": token
										},
										success: function() {
											location.reload()
										}
									})
								})
							}).on("click",".btr-btn-shutdown-all",function() {
								getXsrfToken(function(token) {
									$.ajax({
										url: "/Games/shutdown-all-instances",
										type: "post",
										data: {
											placeId: placeId
										},
										dataType: "json",
										headers: {
											"X-CSRF-TOKEN": token
										},
										success: function() {
										}
									})
								})
							})
						}
					})

					
					if(!isNaN(placeId)) {
						var thumbUrl = "/Asset-Thumbnail/Json?assetId={0}&width=576&height=324&format=png".format(placeId);

						function getBigThumb() {
							$.get(thumbUrl,function(json) {
								if(json && json.Final) {
									item.find(".btr-game-thumb").attr("src",json.Url)
								} else {
									setTimeout(getBigThumb,200)
								}
							})
						}
						getBigThumb()
					}

					if(index == 0) {
						item.addClass("selected")
					}

					slide.remove()
					item.appendTo(hlist)

					pager.setMaxPage(Math.floor((hlist.children().length-1)/pageSize))
				}
			})
		}
	}).add({ // Friends
		selector: ".home-friends",
		callback: function(friends) {
			right.find(".placeholder-friends").replaceWith(friends)
			if(friends.find(".hlist").children().length==9) {
				$.get("//api.roblox.com/users/{0}/friends".format(userId),function(list) {
					if(list.length > 9) {
						friends.find(".hlist").append($(
						"<li class='list-item friend'>"+
							"<div class='avatar-container'>"+
								"<a href='https://www.roblox.com/users/{0}/profile' class='avatar avatar-card-fullbody friend-link' title='{1}'>"+
									"<span class='avatar-card-link friend-avatar'><img alt='{1}' class='avatar-card-image' src='/Thumbs/Avatar.ashx?x=100&y=100&userId={0}'></span>"+
									"<span class='text-overflow friend-name'>{1}</span>"+
								"</a>"+
							"</div>"+
						"</li>"
						).elemFormat(list[9].Id,list[9].Username))
					}
				})
			}
		}
	}).add({ // Favorites
		selector: ".favorite-games-container",
		callback: function(favorites) {
			right.find(".placeholder-favorites").replaceWith(favorites)

			favorites.addClass("section").addClass("btr-profile-favorites")
			var cont = $("<div class='section-content'/>").appendTo(favorites)
			var hlist = favorites.find(".hlist").appendTo(cont)
			var header = favorites.find(".container-header")

			header.find("h3").text("Favorite Places")

			var isLoading = false
			var pageSize = 6
			var lastCategory = null

			var pager = createPager()
			pager.insertAfter(hlist)

			pager.on("btr-pager-onchange",function(ev,page) {
				loadPage(lastCategory,page)
				return false;
			})


			var dropDown = $(
			'<div class="input-group-btn">' +
				'<button type="button" class="input-dropdown-btn" data-toggle="dropdown" aria-expanded="false">' +
					'<span class="rbx-selection-label" data-bind="label">Places</span>' +
					'<span class="icon-down-16x16"></span>' +
				'</button>' +
				'<ul data-toggle="dropdown-menu" class="dropdown-menu" role="menu">' +
					'<li data-value="24"><a href="#">Animations</a></li>' +
					'<li data-value="3"><a href="#">Audio</a></li>' +
					'<li data-value="21"><a href="#">Badges</a></li>' +
					'<li data-value="13"><a href="#">Decals</a></li>' +
					'<li data-value="18"><a href="#">Faces</a></li>' +
					'<li data-value="19"><a href="#">Gear</a></li>' +
					'<li data-value="8"><a href="#">Hats</a></li>' +
					'<li data-value="17"><a href="#">Heads</a></li>' +
					'<li data-value="10"><a href="#">Models</a></li>' +
					'<li data-value="32"><a href="#">Packages</a></li>' +
					'<li data-value="12"><a href="#">Pants</a></li>' +
					'<li data-value="9"><a href="#">Places</a></li>' +
					'<li data-value="38"><a href="#">Plugins</a></li>' +
					'<li data-value="11"><a href="#">Shirts</a></li>' +
					'<li data-value="2"><a href="#">T-Shirts</a></li>' +
				'</ul>' +
			'</div>').insertAfter(header.find(".btn-more"))
			
			dropDown.find('.dropdown-menu li').click(function(ev) {
				var category = $(ev.currentTarget).attr("data-value")
				if(!isNaN(category)) {
					loadPage(category,0)
				}
			})

			function loadPage(category, page) {
				if(isLoading) return;
				isLoading = true

				lastCategory = category

				var url = "/users/favorites/list-json?thumbWidth=150&thumbHeight=150" + 
					"&userId={0}&itemsPerPage={1}&assetTypeId={2}&pageNumber={3}".format(userId,pageSize,category,page+1)

				$.get(url, function(json) {
					isLoading = false;

					if(json && json.IsValid) {
						pager.setPage(page)
						pager.setMaxPage(Math.ceil(json.Data.TotalItems/pageSize)-1)

						hlist.empty()

						var categoryName = dropDown.find("[data-bind='label']").text() || "ERROR";

						header.find("h3").text("Favorite "+categoryName);

						if(category == 3)
							MediaPlayerControls.init()

						MediaPlayerControls.stop()

						var items = json.Data.Items;
						if(items.length == 0) {
							var text = userId==loggedInUser
								? "You have" 
								: $("div[data-profileusername]").attr("data-profileusername") + " has"

							$("<div class='section-content-off btr-section-content-off'/>")
								.text("{0} no favorite {1}".format(text,categoryName))
								.appendTo(hlist)
						} else {
							$.each(items,function(_,data) {
								var item = $("<li class='list-item game-card'>"+
									"<div class='card-item game-card-container'>"+
										"<a href='{AbsoluteUrl}' title='{AssetName}'>"+
											"<div class='game-card-thumb-container'>"+
												"<img class='game-card-thumb card-thumb unloaded' alt='{AssetName}' src='{ThumbnailUrl}'>"+
							(category == 3 ?	"<div class='btr-MediaPlayerControls icon-play' data-assetid='{AssetId}'/>" : "") +
											"</div>"+
											"<div class='text-overflow game-card-name' title='{AssetName}' ng-non-bindable>{AssetName}</div>"+
										"</a>"+
										"<div class='game-card-name-secondary'>"+
											"<span class='text-label xsmall'>By </span>"+
											"<a class='text-link xsmall text-overflow' title='{CreatorName}' href={CreatorUrl}>{CreatorName}</a>"+
										"</div>"+
									"</div>"+
								"</li>"
								).elemFormat({
									AbsoluteUrl: data.Item.AbsoluteUrl,
									AssetName: data.Item.Name,
									AssetId: data.Item.AssetId,
									ThumbnailUrl: data.Thumbnail.Url,
									CreatorName: data.Creator.Name,
									CreatorUrl: data.Creator.CreatorProfileLink
								}).appendTo(hlist)
								
								item.find(".unloaded").on("load",function() { $(this).removeClass("unloaded") })
							})
						}
					}
				})
			}

			loadPage(9,0)
		}
	}).add({ // Collections
		selector: ".profile-collections",
		callback: function(collections) {
			bottom.find(".placeholder-collections").replaceWith(collections)
		}
	})

	if(!settings.profile.embedInventoryEnabled) {
		bottom.find(".placeholder-inventory").replaceWith(
			$("<div style='width:100%;text-align:center;'>" +
				"<a href='./inventory' class='btn-secondary-xs btn-more inventory-link'>" +
					"Inventory" +
				"</a>" +
			"</div>")
		)
	} else {
		bottom.find(".placeholder-inventory").replaceWith(
			$("<div>" +
				"<iframe id='btr-injected-inventory' src='/users/{0}/inventory' scrolling='no'>" +
			"</div>").elemFormat(userId)
		)
	}

	$(document).ready(function() {
		$(".profile-container").find("div[class^='placeholder-']").remove()
	})
}

pages.inventory.init = function(userId) {
	if(settings.profile.embedInventoryEnabled && top.location != self.location) {
		var embedParent = $(top.document).find("#btr-injected-inventory")

		if(embedParent.length > 0) {
			Observer.add({
				selector: "script:not([src])",
				filter: function() { return this.html().indexOf("if (top.location != self.location)") != -1; },
				callback: function(script) {
					script.remove()
				}
			}).add({
				selector: "script:not([src])",
				filter: function() { return this.html().indexOf("Roblox.DeveloperConsoleWarning.showWarning()") != -1; },
				callback: function(script) {
					script.remove()
				}
			}).add({
				selector: "head",
				callback: function(head) {
					$("<base target='_top'>").appendTo(head)
				}
			}).add({
				selector: "body",
				callback: function(body) {
					body.addClass("btr-embed")

					setInterval(function() {
						embedParent.css("height",(body.height() + 10) + "px")
					},100)
				}
			}).add({
				selector: "#chat-container",
				callback: function(chat) {
					chat.remove()
				}
			})
		}
	}

	if(settings.inventory.inventoryTools) {
		modifyTemplate("assets-list", function(template) {
			var visibility = "staticData.isOwnPage && (currentData.category.name == 'Models' || currentData.category.name == 'Meshes' || currentData.category.name == 'Decals' || currentData.category.name == 'Animations' || currentData.category.name == 'Audio')"

			$('<div class="header-content">' +
				'<a class="hidden btr-it-reload" ng-click="newPage(currentData.currentPage)"/>' +
				'<a class="btn btn-secondary-sm btr-it-btn btr-it-remove disabled" style="float:right;margin:4px 10px;">Remove</a>' +
			'</div>').attr("ng-show",visibility)
				.insertAfter(template.find(".assets-explorer-title"))

			$('<span class="checkbox btr-it-checkbox">'+
				'<input type="checkbox" id="btr-it-box{{$index}}" class="btr-it-box">'+
				'<label for="btr-it-box{{$index}}" style="position:absolute;left:6px;top:6px;width:auto;"></label>'+
			'</span>').attr("ng-show",visibility)
				.appendTo(template.find("#assetsItems .item-card-container"))
		});

		var isRemoving = false
		var shiftPressed = false
		var lastPressed = null

		var updateButtons = function() {
			$(".btr-it-btn").toggleClass("disabled",$(".btr-it-box:checked").length < 1)
		}

		$(document).on("keyup keydown", function(ev) {
			shiftPressed = ev.shiftKey
		})

		InjectJS.listen("inventoryUpdateEnd", updateButtons)

		$(document).on("change",".btr-it-box", function(ev) {
			var id = parseInt(this.id.substring(10))

			if(shiftPressed && lastPressed != null && id != lastPressed) {
				var from = Math.min(id, lastPressed)
				var to = Math.max(id, lastPressed)
				var value = this.checked

				for(var i = from; i <= to; i++) {
					$("#btr-it-box"+i)[0].checked = value
				}
			}

			lastPressed = id
			updateButtons()
		}).on("click",".item-card-link", function(ev) {
			var checked = $(".btr-it-box:checked");
			if(checked.length > 0) {
				ev.preventDefault()
			}
		}).on("click",".btr-it-remove", function() {
			if(isRemoving) return;

			var checked = $(".btr-it-box:checked");
			if(checked.length > 0) {
				isRemoving = true
				var data = []
				for(var i=0;i<checked.length;i++) {
					var self = $(checked[i].parentNode.parentNode.parentNode)
					var matches = self.find(".item-card-link").attr("href").match("\\?id=(\\d+)")

					if(matches && !isNaN(parseInt(matches[1]))) {
						data.push({
							obj: $(self),
							assetId: matches[1]
						})
					}
				}

				var itemsLeft = data.length
				
				var removeItem = function(index,retries) {
					var x = data[index]
					if(x) {
						$.getJSON("//api.roblox.com/Marketplace/ProductInfo?assetId="+x.assetId,function(data) {
							if(!data) return;

							if(data.AssetTypeId == 10 || data.AssetTypeId == 13 || data.AssetTypeId == 40 || data.AssetTypeId == 3 || data.AssetTypeId == 24) {
								getXsrfToken(function(token) {
									$.ajax({
										url: "/asset/delete-from-inventory",
										type: "post",
										data: {
											assetId: x.assetId
										},
										dataType: "json",
										headers: {
											"X-CSRF-TOKEN": token
										}
									}).done(function() {
										x.obj.remove()
										if(--itemsLeft == 0) {
											isRemoving = false
											InjectJS.send("refreshInventory")
										}
									}).fail(function() {
										if(!retries || retries < 5) {
											setTimeout(removeItem,250,index,(retries||0)+1)
										} else {
											console.log("Retries exhausted")
										}
									})
								})
							} else {
								console.log("Bad assettypeid",data.AssetTypeId)
							}
						})
					} 

					setTimeout(removeItem,250,index + 1)
				}

				removeItem(0)
			}
		})
	}
}















/*

pages.placeconfig.init = function() {
	$("#versionHistory").css("height","1000px")
	var cont = $("#versionHistoryItems")

	var updateTableContainer = function(tablecont) {
		if(tablecont.length == 0)
			return;

		tablecont.css("height","auto")

		tablecont.find("tbody>tr:first").html("<th>Thumbnail</th><th style='text-align:left'>Version Data</th><th/><th/>")

		tablecont.find("tbody>tr:not(:first)").each(function(_,obj) {
			var self = $(obj)

			var td1 = self.find(">td:nth-child(1)"),
				td2 = self.find(">td:nth-child(2)"),
				td3 = self.find(">td:nth-child(3)")

			var versionId = td3.find("span").attr("data-asset-version-id");
			var versionN = td1.text();

			var imgtd = $("<td style='width:80px;height:80px;padding-right:6px;padding-top:0;'/>")
			var htd = $("<td style='width:110px;white-space:pre-line;text-align:left;font-weight:600;'>Version Number:\nCreated:</td>")
			var dtd = $("<td style='text-align:left;white-space:pre-line'>").text(versionN+"\n"+td2.text())
			var btd = self.find(">td:last")

			var img = $("<img style='width:100%;height:100%;'>").appendTo(imgtd)

			sendMessage("getVHThumb",{versionId:versionId},function(data) {
				img.attr("src",data.replace(/^https?:/,""));
			});

			var btn = $('<span class="btn-control btn-control-medium btr_downloadLink">Download place</span>')
				.attr("data-asset-version-id",versionId)
				.attr("data-asset-version",versionN)
				.appendTo(td3);

			self.empty().append(imgtd).append(htd).append(dtd).append(btd)
		})
	}

	var updatePagerContainer = function(pagercont) {
		if(pagercont.length == 0)
			return;

		var pn = pagercont.find(".robloxVersionHistoryPageNum")
		pn.attr("contentEditable",true).css("display","inline-block").css("min-width","5px").css("border","1px solid #b8b8b8").css("padding","0 4px")

		var currentPage = parseInt(pn.text())
		var maxPage = parseInt(pagercont.text().match(/of (\d+)/)[1])

		pn.on("keydown",function(event) {
			if(event.keyCode == 13) {
				var newpage = parseInt(pn.text())
				if(!isFinite(newpage)) {
					pn.text(currentPage)
					return;
				}

				newpage = Math.max(1,Math.min(maxPage,newpage))

				if(currentPage == newpage) {
					pn.text(currentPage)
					return;
				}

				if(currentPage != maxPage) {
					pn.text(newpage-1)
					pagercont.find("span.next").click()
				} else {
					pn.text(newpage+1)
					pagercont.find("span.previous").click()
				}
			}
		})
	}

	mutateObserve(cont).addmul(
		".pagerContainer",
		updatePagerContainer,
		true
	).addmul(
		".versionHistoryTableContainer",
		updateTableContainer,
		true
	)

	cont.on("click",".btr_downloadLink",function() {
		var versionId = $(this).attr("data-asset-version-id");
		if(versionId != null) {
			var fileName = ($("#basicSettings>input").attr("value") || "place").replace(/[^\w \-\.]+/g,"").replace(/ {2,}/g," ").trim()
							+ "-" + ($(this).attr("data-asset-version") || "idk")
							+ ".rbxl";

			downloadAsset("blob",{assetVersionId:versionId}).then(function(bloburl) {
				var a = $("<a>").attr("download",fileName).attr("href",bloburl).appendTo("body");
				a[0].click()
				a.remove()
				window.URL.revokeObjectURL(bloburl)
			});
		}
	});
}

pages.character.preinit = function() {
	if(!settings.character.enabled)
		return false;
	
	$("body").addClass("btr-newwardrobe")
}

pages.character.init = function() {
	var charBody = $("#Body")
	var oldContainer = charBody.find(">.MyRobloxContainer").hide()

	var container = $("<div><h1>Character Customizer</h1></div>").addClass("btr_MyRobloxContainer").appendTo(charBody)
	var column1 = $("<div></div>").addClass("btr_Column1").appendTo(container)
	var column2 = $("<div></div>").addClass("btr_Column2").appendTo(container)
	$("<br clear='all'>").appendTo(container)
	
	oldContainer.find(">.Column1f").children().appendTo(column1).find("#ctl00_ctl00_cphRoblox_cphMyRobloxContent_cmdInvalidateThumbnails").attr("href","javascript:Roblox.ThumbnailView.reloadThumbnail();")

	var inv = $("<div id='btr_inv'><h2>Wardrobe</h2><br/></div>").appendTo(column2)
	var invtabs = $(
	"<ul id='btr_invtabs'>" +
		"<li class='btr_invtabbtn SquareTabGray' assetType='17'><a>Heads</a></li>" +
		"<li class='btr_invtabbtn SquareTabGray' assetType='18'><a>Faces</a></li>" +
		"<li class='btr_invtabbtn SquareTabGray selected' assetType='8'><a>Hats</a></li>" +
		"<li class='btr_invtabbtn SquareTabGray' assetType='2'><a>T-Shirts</a></li>" +
		"<li class='btr_invtabbtn SquareTabGray' assetType='11'><a>Shirts</a></li>" +
		"<li class='btr_invtabbtn SquareTabGray' assetType='12'><a>Pants</a></li>" +
		"<li class='btr_invtabbtn SquareTabGray' assetType='19'><a>Gear</a></li>" +
		"<li class='btr_invtabbtn SquareTabGray' assetType='32'><a>Body</a></li>" +
		"<li class='btr_invtabbtn SquareTabGray' assetType='outfits'><a>Outfits</a></li>" +
	"</ul>").appendTo(inv)
	
	var invpages = $("<div id='btr_invpages'></div>").appendTo(inv)
	var topbar = $("<div id='btr_invbar'></div>").appendTo(invpages)
	var search = $("<div class='btr_search'></div>").appendTo(topbar)
	var searchbar = $("<input type='text' class='btr-search-bar' value=''>").appendTo(search)
	var searchclose = $("<span class='btr-search-close'>x</span>").hide().appendTo(search)
	var searchbtn = $("<div class='btr_searchbtn'>").appendTo(search)

	var noresults = $("<div id='btr_invnosearch' class='rbx-text-danger' style='display:none;text-align:center;padding:20px;'>No results found</div>").appendTo(invpages)
	var curAssetType = "8";
	var assets = {}


	var applySearch = function() {
		var txt = searchbar.val().toLowerCase();
		if(txt.length>0)
			searchclose.show();
		else
			searchclose.hide();

		var as = assets[curAssetType]
		if(!as) {
			noresults.hide()
			return;
		}
		var total = 0;
		for(var i=0;i<as.length;i++) {
			var x = as[i];
			if(txt.length == 0 || x.namelwr.indexOf(txt) != -1) {
				x.obj.css("display","")
				total++;
			} else {
				x.obj.css("display","none")
			}
		}
		if(total == 0) {
			noresults.show()
		} else {
			noresults.hide()
		}
	}

	searchbtn.click(applySearch)

	searchbar.on("input",function() {
		applySearch();
	})

	searchclose.click(function() {
		searchbar.val("")
		applySearch();
	})

	var urlPromise = new Promise(function(success,failure) {
		loggedInUserPromise.then(function(userId) {
			success("//www.roblox.com/users/inventory/list-json?thumbWidth=110&thumbHeight=110&itemsPerPage=1000&assetTypeId={0}&pageNumber={1}&userId="+userId)
		})
	})

	var loadAssets = function(assetType,pageNumber,assetCallback) {
		urlPromise.then(function(url) {
			$.get(url.format(assetType,pageNumber),function(json) {
				if(!json.IsValid) {
					console.log("Inventory json is not valid",assetType,pageNumber)
					return;
				}

				var data = json.Data;

				assetCallback(data.Items)

				if(data.End < data.TotalItems-1) {
					setTimeout(loadAssets,150,assetType,pageNumber+1,assetCallback)
				}
			})
		})
	}


	invtabs.on("click",".btr_invtabbtn",function() {
		var self = $(this);
		var assetType = self.attr("assetType")

		curAssetType = assetType;

		invtabs.find(".btr_invtabbtn").not(self).removeClass("selected")
		self.addClass("selected")

		var page = invpages.find(".btr-hlist").addClass("hidden").filter("[assetType='{0}']".format(assetType)).removeClass("hidden")

		if(isNaN(assetType)) {
			topbar.hide()
		} else {
			topbar.show()
		}
		applySearch()
	})

	$(".btr_invtabbtn",invtabs).each(function(_,obj) {
		var self = $(obj);
		var assetType = self.attr("assetType")
		var invpage = $("<ul class='btr-invpage btr-hlist'/>").toggleClass("hidden",!self.hasClass("selected")).attr("assetType",assetType).appendTo(invpages)

		if(!isNaN(assetType)) {
			var assetList = []
			assets[assetType] = assetList

			var assetCallback = function(items) {
				items.forEach(function(data) {
					var item = data.Item;
					var product = data.Product || {};
					var thumbnail = data.Thumbnail;


					var itemUrl = "//www.roblox.com/{0}-item?id={1}".format(
						item.Name.replace(/[^a-zA-Z0-9]/g," ").trim().replace(/\s+/g,"-"),
						item.AssetId
					)

					var obj = $(
					"<li class='btr-list-item'>" +
						"<span class='btr-item-link' data-asset-id='{0}' data-wear='true'>" +
							"<span class='btr-item-thumb'>" +
								(product.IsLimitedUnique?"<div class='btr-item-serial-number rbx-font-xs'>#{4}</div>" : "") +
								"<img src='{1}' alt='{3}' title='Click to wear'>" +
								(product.IsLimitedUnique?"<span class='btr-item-overlay icon-limited-unique-label rbx-font-xs'/>" : "") +
								(product.IsLimited?	"<span class='btr-item-overlay icon-limited-label rbx-font-xs'/>" : "") +
							"</span>" +
							"<a class='rbx-font-xs btr-item-name btr-item-catalog-link btr-text-overflow' target='_blank' href='{2}' title='{3}'>{3}</a>" +
						"</span>" +
					"</li>"
					).elemFormat(item.AssetId,thumbnail.Url,itemUrl,item.Name,product.SerialNumber).appendTo(invpage)

					assetList.push({name:item.Name,namelwr:item.Name.toLowerCase(),obj:obj})

					if(curAssetType == assetType)
						applySearch();
				})
			}

			loadAssets(assetType,1,assetCallback)
			if(assetType==32) {
				loadAssets(29,1,assetCallback)
				loadAssets(28,1,assetCallback)
				loadAssets(30,1,assetCallback)
				loadAssets(31,1,assetCallback)
				loadAssets(27,1,assetCallback)
			}
		}
	})
	
	
	// Outfits

	var oft = $("#OutfitsTab").attr("id","#OutfitsTabOld")
	var ofl = $("<div id='OutfitsTab' class='btr_outfitlist'></div>").appendTo($(".btr-invpage[assetType='outfits']"))
	oft.children().appendTo(ofl)

	var worn_div = $("<div id='btr_wornItems'><h2>Currently Wearing</h2><br/></div>").appendTo(column2)
	var worn_container = $("<ul id='btr_wornItemContainer' class='btr-hlist'/>").appendTo(worn_div)
	var wornhtml = "";
	var wearingIdentifier = 0

	var getPostBackDataFromString = function(str) {
		return str.replace(/ /g,"").match(/__doPostBack\((.+)\)/)[1].replace(/['"]/g,"").split(",");
	}

	var doPostBackFromStringAsync = function(str,callback,theForm) {
		var data = getPostBackDataFromString(str)

		var theForm = theForm || $("#aspnetForm")
		theForm[0].__EVENTTARGET.value = data[0]
		theForm[0].__EVENTARGUMENT.value = data[1]

		$.post(theForm[0].action,theForm.serialize(),callback)
	}

	var loadMoreItems = function(callback,data) {
		var me = wearingIdentifier;
		$.post("//www.roblox.com/My/Character.aspx?btr_moreWornItemsPlz",data||"",function(data) {
			if(wearingIdentifier != me)
				return;
			var fakeDoc = document.implementation.createHTMLDocument("fakeDoc");
			fakeDoc.write(data);

			var body = $(fakeDoc.body)
			var cont = body.find("#ctl00_ctl00_cphRoblox_cphMyRobloxContent_AccoutrementsPane")

			cont.find(".Asset").each(function(_,obj) {
				var self = $(obj),
					imgsrc = self.find("img").attr("src"),
					name = self.find(".AssetName").text().trim(),
					url = self.find(".AssetName>a").attr("href"),
					id = url.match(/id=(\d+)$/)[1],
					type = self.find(".AssetType>.Detail").text().trim();

				$(
				"<li class='btr-list-item'>" +
					"<span class='btr-item-link' data-asset-id='{0}' data-wear='false'>" +
						"<span class='btr-item-thumb'>" +
							"<img src='{1}' alt='{3}' title='Click to remove'>" +
						"</span>" +
						"<a class='rbx-font-xs btr-item-name btr-item-catalog-link btr-text-overflow' target='_blank' href='{2}' title='{3}'>{3}</a>" +
						"<span class='rbx-font-xs btr-item-type btr-text-overflow'>Type: {4}</span>" +
					"</span>" +
				"</li>"
				).elemFormat(id,imgsrc,url,name,type).hide().appendTo(worn_container);
			})

			var nextButton = $("#ctl00_ctl00_cphRoblox_cphMyRobloxContent_AccoutrementsDataPager_Footer a:not([disabled])",fakeDoc).filter(function(){return this.innerText=="Next"})

			if(nextButton.length > 0) {
				var data = getPostBackDataFromString(nextButton.attr("href"))

				var theForm = body.find("#aspnetForm")
				theForm[0].__EVENTTARGET.value = data[0]
				theForm[0].__EVENTARGUMENT.value = data[1]

				loadMoreItems(callback,theForm.serialize())
			} else {
				if(callback)
					callback()
			}

			data = null;
			fakeDoc = null;
			body = null;
			cont = null;
			nextButton = null;
		})
	}

	var loadWornItems = function() {
		wearingIdentifier = Math.random()
		var oldstuff = $(">*",worn_container);
		var loading = $('<div class="btr_loading"></div>').appendTo(worn_container);
		loadMoreItems(function() {
			oldstuff.remove();
			loading.remove();
			$(">*",worn_container).show()
			Message.send("refreshThumbnail")
		});
	}

	loadWornItems();
	Message.addListener("ajaxUpdate",function() {
		loadWornItems();
	})

	$(document).on("click",".btr_invobjthumb,.btr-item-link",function(ev) {
		if($(ev.target).hasClass("btr-item-catalog-link")) return;

		var self = $(this)
		var id = self.attr('data-asset-id');
		var shouldWear = self.attr('data-wear');

		if(id) {
			$.get("//m.roblox.com/items/"+id,function(data) {
				var reqVerToken = data.match(/__RequestVerificationToken" type="hidden" value="([^"]+)/)[1];
				var userAssetId = data.match(/userAssetId" type="hidden" value="([^"]+)/)[1];
				if(reqVerToken && userAssetId) {
					var postData = "__RequestVerificationToken={0}&userAssetId={1}&wearing={2}".format(reqVerToken,userAssetId,shouldWear);
					$.post("//m.roblox.com/Catalog/WearOrRemoveItem",postData,function() {
						loadWornItems();
					});
				} else {
					console.log("Broken mobile site?");
				}
			}) 
		}
	})

	$(document).on('mousewheel','.btr-invpage',function(event){
		if(this.scrollHeight==this.clientHeight)
			return; // Nothing to scroll over here

		if(event.originalEvent.deltaY>0&&this.scrollTop>=this.scrollHeight-this.clientHeight) {
			event.preventDefault();
			event.stopPropagation();
		}
	});

	documentObserve.addmul(
		".ColorPickerItem:not(.btr-modified)",
		function(item) {
			item.addClass("btr-modified")
			var string = item.attr("onclick")
			item.attr("onclick","$.modal.close();")

			// I can't remove the original event handler from here, so gotta clone it :/
			var newItem = item.clone()
			item.replaceWith(newItem).remove()
			
			newItem.click(function() {
				doPostBackFromStringAsync(string,function() {
					Message.send("refreshAllUpdatePanels");
				})
			})
		},
		true
	)
}


var robloxTimeZone = (function() {
	var timeStamp = new Date();
	var month = timeStamp.getUTCMonth()+1
	var date = timeStamp.getUTCDate()
	var weekday = timeStamp.getDay()
	var hour = timeStamp.getUTCHours()

	if(month >= 3 && month <= 11) { // within march and november
		if(month == 3) { // march
			var someSunday = date+7-weekday
			var secondSunday = someSunday - (Math.floor(someSunday/7)-1)*7
			if(date < secondSunday || (date==secondSunday && hour-6<2))
				return "CST"
		} else if(month == 11) { // november
			var someSunday = date+7-weekday
			var firstSunday = someSunday - Math.floor(someSunday/7)*7
			if(date > firstSunday || (date==firstSunday && hour-5>1))
				return "CST"
		}
		return "CDT";
	}
	return "CST"
})();

*/
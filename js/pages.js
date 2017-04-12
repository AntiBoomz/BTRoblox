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
		'<ul class="btr-pager pager">' +
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

function downloadAsset(type, params, callback) {
	BackgroundJS.send("downloadFile", "http://www.roblox.com/asset/?" + $.param(params), (bloburl) => {
		var xhr = new XMLHttpRequest()
		xhr.open("GET", bloburl, true)
		xhr.responseType = type
		xhr.onload = () => callback(xhr.response);
		xhr.send()
	})
}

var alreadyLoaded = {}
function execScripts(list, cb) {
	for(var i=0; i<list.length; i++) {
		var path = list[i]
		if(alreadyLoaded[path]) {
			list.splice(i--, 1)
		} else {
			alreadyLoaded[path] = true
		}
	}

	if(list.length === 0) {
		cb()
	} else {
		BackgroundJS.send("execScript", list, cb)
	}
}

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
}


pageInit.home = function() {
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

pageInit.messages = function() {
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

pageInit.develop = function() {
	Observer.add({
		multiple: true,
		selector: "#MyCreationsTab .item-table[data-in-showcase]",
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

const InvalidExplorableAssetTypeIds = [1, 3, 4, 5, 6, 7, 16, 21, 22, 33, 34, 35, 37, 39]
const AnimationPreviewAssetTypeIds = [24, 32, 48, 49, 50, 51, 52, 53, 54, 55, 56]
const WearableAssetTypeIds = [2, 8, 11, 12, 18, 28, 29, 30, 31, 41, 42, 43, 44, 45, 46, 47]
const UniqueWearableAssetTypeIds = [2, 11, 12, 18, 28, 29, 30, 31]
const AssetTypeIds = (() => {
	var a = "Accessory | "
	var b = "Animation | "

	return [ null,
		"Image", "T-Shirt", "Audio", "Mesh", "Lua", "HTML", "Text", "Accessory | Hat", "Place", "Model", // 10
		"Shirt", "Pants", "Decal", "null", "null", "Avatar", "Head", "Face", "Gear", "null", // 20
		"Badge", "Group Emblem", "null", "Animation", "Arms", "Legs", "Torso", "Right Arm", "Left Arm", "Left Leg", // 30
		"Right Leg", "Package", "YouTubeVideo", "Game Pass", "App", "null", "Code", "Plugin", "SolidModel", "MeshPart", // 40
		a+"Hair", a+"Face", a+"Neck", a+"Shoulder", a+"Front", a+"Back", a+"Waist", // 47
		b+"Climb", b+"Death", b+"Fall", b+"Idle", b+"Jump", b+"Run", b+"Swim", b+"Walk", b+"Pose" // 56
	]
})();

function Create3dPreview(readyCb) {
	var container = $("<div style='width:100%;height:100%;'>")
	var modeSwitch = $("<div class='btr-switch' style='position:absolute;top:6px;right:6px;'>" +
		"<div class='btr-switch-off'>R6</div>" +
		"<div class='btr-switch-on'>R15</div>" +
		"<input type='checkbox'>" + 
		"<div class='btr-switch-flip'>" +
			"<div class='btr-switch-off'>R6</div>" +
			"<div class='btr-switch-on'>R15</div>" +
		"</div>" +
	"</div>").appendTo(container).find("input")

	var dropdown = $(
	"<div class='input-group-btn' style='position:absolute;top:6px;left:6px;width:140px'>" +
		"<button type='button' class='input-dropdown-btn' data-toggle='dropdown'>" +
			"<span class='rbx-selection-label' data-bind='label'></span>" +
			"<span class='icon-down-16x16'></span>" +
		"</button>" +
		"<ul data-toggle='dropdown-menu' class='dropdown-menu' role='menu'>" +
		"</ul>" +
	"</div>").hide().appendTo(container)

	var rulesPromise = null
	var isLoaded = false
	var scene = null

	var animDebounce = 0
	var appDebounce = 0

	var currentAnim = null
	var preview = {
		domElement: container,
		switch: modeSwitch,

		setPlayerType: function(playerType) {
			console.assert(playerType === "R6" || playerType === "R15")
			this.playerType = playerType

			var isChecked = playerType === "R15"
			if(modeSwitch[0].checked !== isChecked) {
				modeSwitch[0].checked = isChecked
				modeSwitch.trigger("change")
			}

			if(scene)
				scene.avatar.setPlayerType(playerType);
		},
		loadDefaultAppearance: function(modifierCb) {
			if(!rulesPromise) rulesPromise = new Promise(resolve => avatarApi.getRules(resolve));

			avatarApi.getData((data) => {
				if(modifierCb)
					modifierCb(data);

				this.applyAppearance(data)
			})
		},
		applyAppearance: function(data) {
			this.appearanceData = data
			if(!scene)
				return;

			if(!rulesPromise) rulesPromise = new Promise(resolve => avatarApi.getRules(resolve));

			var appKey = ++appDebounce
			rulesPromise.then(rules => {
				if(appDebounce !== appKey)
					return;

				if(data.playerAvatarType && !this.playerType)
					preview.setPlayerType(data.playerAvatarType);

				if(data.bodyColors) {
					var bodyColors = {}
					$.each(data.bodyColors, (name, value) => {
						var index = name.toLowerCase().replace(/colorid$/, "")
						var bodyColor = rules.bodyColorsPalette.find(x => x.brickColorId === value)
						bodyColors[index] = bodyColor.hexColor
					})

					scene.avatar.setBodyColors(bodyColors)
				}
				
				if(data.assets) {
					data.assets.forEach(assetInfo => {
						scene.avatar.addAsset(assetInfo.id, assetInfo.assetType.id)
					})
				}
			})
		},
		addDropdown: function(id, name) {
			var menu = dropdown.find(".dropdown-menu")
			$("<li data-name='{0}' data-assetId='{1}'><a href='#'>{0}</a></li>")
				.elemFormat(name, id)
				.appendTo(menu)

			if(menu.children().length === 2)
				dropdown.show();
		},
		setDropdown: function(name) {
			dropdown.find("[data-bind='label']").text(name);
		},
		playAnimation: function(animId, matchPlayerType, cb) {
			function playAnimation(anim) {
				if(matchPlayerType) {
					var playerType = "R6"
					var r15Parts = ["lowertorso", "uppertorso", "leftupperarm", "leftlowerarm", "lefthand", "rightupperarm", "rightlowerarm", "righthand", "leftupperleg", "leftlowerleg", "leftfoot", "rightupperleg", "rightlowerleg", "rightfoot"]

					for(var i=0; i<r15Parts.length; i++) {
						if(r15Parts[i] in anim.Limbs) {
							playerType = "R15"
							break;
						}
					}

					preview.setPlayerType(playerType)
				}
				

				currentAnim = anim
				if(scene) {
					scene.avatar.animator.play(anim)
				}
			}


			var animIndex = ++animDebounce

			AssetCache.loadModel(animId, model => {
				if(!model) {
					console.log("Failed to load animation: Invalid model", animId)
					if(cb) cb(new Error("Invalid model"));
					return
				}

				if(animDebounce !== animIndex)
					return;

				try { var anim = ANTI.ParseAnimationData(model) } 
				catch(ex) {
					console.log("Failed to load animation:", ex)
					if(cb) cb(ex);
					return
				}

				playAnimation(anim)
				if(cb) cb(null);
			})

			return this
		}
	}

	dropdown.on("click", ".dropdown-menu>li[data-name]", (ev) => {
		var animName = ev.currentTarget.getAttribute("data-name")
		var animId = ev.currentTarget.getAttribute("data-assetId")
		if(animName && animId) {
			preview.setDropdown(animName)
			preview.playAnimation(animId)
		}
	})

	modeSwitch.on("change", (ev) => {
		var playerType = ev.currentTarget.checked ? "R15": "R6"
		preview.setPlayerType(playerType)
	})

	execScripts(["lib/three.min.js", "js/RBXParser.js", "js/RBXScene.js"], () => {
		ANTI.RBXScene.ready((RBXScene) => {
			scene = window.scene = preview.scene = new RBXScene()
			scene.canvas.appendTo(container)

			if(preview.playerType)
				scene.avatar.setPlayerType(preview.playerType);

			if(currentAnim)
				scene.avatar.animator.play(currentAnim);

			if(preview.appearanceData)
				preview.applyAppearance(preview.appearanceData);

			if(readyCb)
				readyCb(scene, preview);
		})
	})

	return preview
}

pageInit.itemdetails = function(assetId) {
	var assetTypePromise = new Promise(resolve => Observer.add({
		selector: ".item-type-field-container .field-content",
		callback: function(typeLabel) {
			resolve(typeLabel.text().trim())
		}
	}))

	Observer.add({
		selector: "#item-details-description",
		callback: function(desc) {
			desc.addClass("linkify")
			desc.contents().each((_,node) => node.nodeType===3&&(node.nodeValue=node.nodeValue.trim()))
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

	assetTypePromise.then(assetTypeName => {
		var assetTypeId = AssetTypeIds.indexOf(assetTypeName)

		if(assetTypeId === -1) {
			if(isDevExtension)
				alert("Unknown asset type " + assetTypeName);

			return;
		}

		function enableExplorer() {
			var explorerInitialized = false
			var explorer = null

			var btn = $(
			"<div class='btr-explorer-button'>" + 
				"<a class='btr-icon-explorer' data-toggle='popover' data-bind='btr-explorer-content'></a>" +
				"<div class='rbx-popover-content' data-toggle='btr-explorer-content'>" +
					"<div class='btr-explorer-parent'></div>" +
				"</div>" +
			"</div>")

			btn.on("click", () => {
				if(!explorer)
					return false;

				if(!explorerInitialized) {
					explorerInitialized = true

					if(assetTypeId === 32) { // Package
						AssetCache.loadText(assetId, text => text.split(";").forEach(id => {
							AssetCache.loadModel(id, model => explorer.addView(id.toString(), model))
						}))
					} else {
						AssetCache.loadModel(assetId, model => explorer.addView("Main", model))
					}
				}

				var parent = $("div:not('.rbx-popover-content')>.btr-explorer-parent")
				if(parent.length === 0)
					return;

				parent.find(".btr-modelviewer").replaceWith(explorer.domElement)
			})

			execScripts(["js/Explorer.js"], () => {
				explorer = new Explorer()
				explorer.domElement.clone().appendTo(btn.find(".btr-explorer-parent"))
			})

			Observer.add({
				selector: "#item-container>.section-content",
				callback: function(cont) {
					btn.appendTo(cont)
					cont.parent().addClass("btr-explorer-btn-shown")
				}
			})
		}

		function enablePreview(readyCb) {
			var preview = Create3dPreview(readyCb)
			var container = $("<div class='item-thumbnail-container btr-preview-container'>")
			preview.domElement.appendTo(container)

			var visible = false
			var oldContainer = null

			preview.toggleVisible = function(bool) {
				visible = typeof(bool) === "boolean" ? bool : !visible
				if(!oldContainer)
					return;

				if(visible) {
					oldContainer.hide()
					container.insertAfter(oldContainer)
				} else {
					container.detach()
					oldContainer.show()
				}
			}

			Observer.add({
				selector: "#AssetThumbnail",
				callback: function(oldCont) {
					oldContainer = oldCont.parent()
					preview.toggleVisible(visible)
				}
			})

			return preview
		}

		execScripts(["js/RBXParser.js", "js/AssetCache.js"], () => {
			if(settings.catalog.explorerButton && InvalidExplorableAssetTypeIds.indexOf(assetTypeId) === -1) {
				if(assetTypeId === 10) {
					var itemContainer = $("#item-container")
					if(itemContainer.length === 0)
						return;

					if(itemContainer.attr("data-is-purchase-enabled").toLowerCase() === "true" // Is public
						|| itemContainer.find(".item-name-container .label-checkmark").length !== 0) { // or is in inventory
						enableExplorer()
					} else {
						loggedInUserPromise.then(userId => {
							if(itemContainer.attr("data-user-id") == userId) { // or you're the creator
								enableExplorer()
							}
						})
					}
				} else {
					enableExplorer()
				}
			}

			if(settings.catalog.animationPreview && AnimationPreviewAssetTypeIds.indexOf(assetTypeId) !== -1) {
				function parseAnimPackage(assetId, cb) {
					AssetCache.loadModel(assetId, model => {
						var dict = {}

						model.forEach(folder => {
							if(folder.ClassName !== "Folder" || folder.Name !== "R15Anim")
								return;

							folder.Children.forEach(value => {
								if(value.ClassName !== "StringValue")
									return;

								var animName = value.Name

								value.Children.forEach((anim, i) => {
									if(anim.ClassName !== "Animation")
										return;

									var animId = ANTI.RBXParseContentUrl(anim.AnimationId)
									if(animId) {
										var index = animName + (i === 0 ? "" : "_" + (i+1))
										dict[index] = animId
									}
								})
							})
						})

						cb(dict)
					})
				}

				function onPreviewReady(scene) {
					scene.avatar.animator.onstop = () => {
						setTimeout(() => scene.avatar.animator.play(), 2000)
					}
				}

				function onAppearenceLoaded(data) {
					delete data.playerAvatarType;
				}

				var preview = enablePreview(onPreviewReady)

				switch(assetTypeId) {
					case 32: // Package
						AssetCache.loadText(assetId, text => {
							var assetIds = text.split(";")
							var first = true

							function addAnims(anims) {
								$.each(anims, (name, animId) => {
									preview.addDropdown(animId, name)
									if(first) {
										first = false
										preview.setDropdown(name)
										preview.playAnimation(animId, true)
									}
								})
							}

							parseAnimPackage(assetIds[0], anims => {
								if(Object.keys(anims).length === 0)
									return preview.destroy();

								preview.toggleVisible(true)
								preview.loadDefaultAppearance(onAppearenceLoaded)

								addAnims(anims)
								for(var i=1; i<assetIds.length; i++) {
									parseAnimPackage(assetIds[i], addAnims)
								}
							})
						})
						break;
					case 24: // Custom Animation
						preview.playAnimation(assetId, true, err => {
							if(!err) {
								preview.toggleVisible(true)
								preview.loadDefaultAppearance(onAppearenceLoaded)
							}
						})
						break;
					default: // PlayerAnimation
						parseAnimPackage(assetId, anims => {
							if(Object.keys(anims).length === 0)
								return preview.destroy();

							preview.toggleVisible(true)
							preview.loadDefaultAppearance(onAppearenceLoaded)

							var first = true
							$.each(anims, (name, animId) => {
								preview.addDropdown(animId, name)
								if(first) {
									first = false
									preview.setDropdown(name)
									preview.playAnimation(animId, true)
								}
							})
						})
						break;
				}
			}

			if(true && WearableAssetTypeIds.indexOf(assetTypeId) !== -1) {
				var btn = $("<span class='btr-preview-btn rbx-btn-control-sm'>").text("\uD83D\uDC41")
				var preview = null

				if(assetTypeId === 2) {
					btn.addClass("btr-rightmost")
				}

				$(document).on("click", ".btr-preview-btn", () => {
					if(!preview) {
						preview = enablePreview()
						preview.loadDefaultAppearance((data) => {
							var assets = data.assets

							if(UniqueWearableAssetTypeIds.indexOf(assetTypeId) !== -1) {
								for(var i=0; i<assets.length; i++) {
									var assetInfo = assets[i]
									if(assetInfo.assetType.id === assetTypeId) {
										assets.splice(i--, 1)
										break;
									}
								}
							}

							assets.push({
								id: assetId,
								assetType: {
									id: assetTypeId
								}
							})
						})
						preview.toggleVisible(true)

						function updateAnim() {
							var animId = preview.playerType === "R15" ? 507766388 : 180435571
							preview.playAnimation(animId)
						}

						preview.switch.on("change", updateAnim)
						updateAnim()

						btn.clone().appendTo(preview.domElement)
					} else {
						preview.toggleVisible()
					}
				})

				Observer.add({
					selector: "#AssetThumbnail",
					callback: function(cont) {
						btn.appendTo(cont)
					}
				})
			}
		})
	})
}

pageInit.gamedetails = function(placeId) {
	if(!settings.gamedetails.enabled)
		return;

	var gameDataPromise = new Promise(resolve => BackgroundJS.send("getProductInfo", placeId, resolve))
	var newContainer = $("<div class='col-xs-12 btr-game-main-container section-content'>")

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
		selector: [".game-about-container", ".game-about-container .section-content", ".game-main-content"],
		callback: function(oldContainer, descContent, mainContent) {
			newContainer.insertBefore(mainContent)
			mainContent.removeClass("section-content").appendTo(newContainer)
			descContent.removeClass("section-content").addClass("btr-description").insertAfter(mainContent)

			oldContainer.remove();
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
			var container = $("<div class='col-xs-12 btr-badges-container'/>").insertAfter(newContainer);
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
				"<div class='btr-universe-box'>" +
					"This place is part of " +
					"<a class='btr-universe-name text-link' href='//www.roblox.com/games/{0}/'></a>" +
					"<div class='VisitButton VisitButtonPlayGLI btr-universe-visit-button' placeid='{0}' data-action='play' data-is-membership-level-ok='true'>" +
						"<a class='btn-secondary-md'>Play</a>" +
					"</div>" +
				"</div>"
				).elemFormat(mainPlaceId).prependTo(newContainer)

				BackgroundJS.send("getProductInfo", mainPlaceId, (data) => {
					var anchor = box.find(".btr-universe-name")
					anchor.text(data.Name)
					anchor.attr("href", anchor.attr("href") + data.Name.replace(/[^\w-\s]+/g,"").replace(/\s+/g,"-"))
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
						var badgeId = self.find(".badge-image>a").attr("href").match(/catalog\/(\d+)\//)[1]
						badges.push([self, badgeId])
					});

					var loadBadge = function(i) {
						var self = badges[i][0]
						var badgeId = badges[i][1]
						self.addClass("btr_badgeownedloading")
						$.get("//api.roblox.com/Ownership/HasAsset?userId={0}&assetId={1}".format(userId, badgeId), (val) => {
							self.removeClass("btr_badgeownedloading")

							if(val === false) {
								self.addClass("btr_notowned")
								self.find(".badge-image img").attr("title", "You do not own this badge")
							}
						})

						if(i + 1 < badges.length)
							setTimeout(loadBadge, 100, i+1);
					}

					if(badges.length)
						loadBadge(0);
				}
			})
		}
	})
}

function CreateNewVersionHistory(assetId, assetType) {
	var parent = $("<div class='btr-versionHistory'></div>")

	var cont = $("<ul class='btr-versionList'></ul>").appendTo(parent)

	var thumbnailCache = {}
	var pageSize = 15
	var realPageSize = 50
	var isBusy = false
	var pager = createPager()
	pager.insertAfter(cont)

	var cards = []
	for(var i=0; i<pageSize; i++) {
		cards[i] = $(
		"<li class='list-item'>" +
			"<div class='version-card'>" +
				"<div class='version-dropdown'>" +
					"<a class='rbx-menu-item' data-toggle='popover' data-container='body' data-bind='btr-versiondrop-{0}'>" +
						"<span class='icon-more'></span>" +
					"</a>" +
					"<div data-toggle='btr-versiondrop-{0}'>" +
						"<ul class='dropdown-menu btr-version-dropdown-menu'>" +
							"<li><a class='version-revert' data-versionId=''>Revert</a></li>" +
							"<li><a class='version-download' data-versionId=''>Download</a></li>" +
						"</ul>" +
					"</div>" +
				"</div>" +
				"<div class='version-thumb-container'><img class='version-thumb'></div>" +
				"<div class='version-number'>Version </div>" +
				"<div class='version-date'></div>" +
			"</div>" +
		"</li>").elemFormat(i).hide().appendTo(cont)
	}


	pager.on("btr-pager-onchange", function(ev, page) {
		loadPage(page)
		return false
	})

	function loadPage(page) {
		if(isBusy)
			return;
		isBusy = true;

		var pageStart = page * pageSize
		var from = Math.floor(pageStart/realPageSize)
		var to = Math.floor((pageStart+pageSize-1)/realPageSize)
		var versionData = []

		var promises = []
		for(var i=from; i<=to; i++) {
			promises.push(new Promise((resolve) => {
				var pageNum = i
				var startIndex = pageNum*realPageSize

				$.getJSON("//api.roblox.com/assets/{0}/versions?page={1}".format(assetId, pageNum+1), (json) => {
					if(pageNum === 0) {
						realPageSize = json.length
						var maxVer = json[0].VersionNumber
						pager.setMaxPage(Math.floor((maxVer-1)/pageSize))
					}

					json.forEach((val,ind) => { versionData[startIndex+ind] = val })

					resolve()
				})
			}))
		}

		Promise.all(promises).then(() => {
			isBusy = false
			pager.setPage(page)

			cards.forEach((card, ind) => {
				var data = versionData[pageStart+ind]

				if(!data) {
					card.hide()
					return;
				}

				card.find(".version-revert").attr("data-versionId", data.Id)
				card.find(".version-download").attr("data-version", data.VersionNumber)
				card.find(".version-number").text("Version " + data.VersionNumber)
				card.find(".version-date").text(new Date(data.Created).format("M/D/YY hh:mm A"))

				var img = card.find(".version-thumb")
				img.hide()
				/* New roblox thumbnails ruined this ;-;
				img.attr("src", "").hide()
				function tryGetThumbnail() {
					if(thumbnailCache[data.Id])
						return img.attr("src", thumbnailCache[data.Id]);

					$.get("/Thumbs/RawAsset.ashx?assetVersionId={0}&imageFormat=png&width=110&height=110".format(data.Id), (data) => {
						if(data === "PENDING")
							return setTimeout(tryGetThumbnail, 1000);

						thumbnailCache[data.Id] = data
						img.attr("src", data).show()
					})
				}

				tryGetThumbnail()*/
				card.show()
			})
		})
	}

	$(document).on("click", "a.version-revert", (ev) => {
		if(isBusy)
			return;

		var versionId = parseInt($(ev.target).attr("data-versionId"))
		if(isNaN(versionId))
			return;

		isBusy = true

		getXsrfToken((token) => {
			$.ajax({
				method: "POST",
				url: "/places/revert",
				data: { assetVersionID: versionId },
				headers: { "X-CSRF-TOKEN": token },
				success: () => {
					isBusy = false
					loadPage(0)
				},
				error: () => {
					isBusy = false
				}
			})
		})
	}).on("click", "a.version-download", (ev) => {
		if(isBusy)
			return;
		
		var version = parseInt($(ev.target).attr("data-version"))
		if(isNaN(version))
			return;
		isBusy = true

		var fileName = "{0}-{1}.rbx{2}".format(
			($("#basicSettings>input").attr("value") || "place").replace(/[^\w \-\.]+/g,"").replace(/ {2,}/g," ").trim(),
			version,
			assetType === "place" ? "l" : "m"
		)

		downloadAsset("blob", { id: assetId, version: version }, (blob) => {
			isBusy = false
			startDownload(URL.createObjectURL(blob), fileName)
		})
	})

	loadPage(0)

	return parent
}

function startDownload(blob, fileName) {
	var link = document.createElement("a")
	link.setAttribute("download", fileName || "file")
	link.setAttribute("href", blob)
	document.body.append(link)
	link.click()
	link.remove()
}

pageInit.configureplace = function(placeId) {
	if(!settings.versionhistory.enabled)
		return;

	var newVersionHistory = CreateNewVersionHistory(placeId, "place")
	var jszipPromise = null

	Observer.add({
		selector: "#versionHistoryItems",
		callback: function(cont) {
			newVersionHistory.insertAfter(cont)
			cont.remove()
		}
	}).add({
		selector: "#versionHistory>.headline h2",
		callback: function(header) {
			$("<a class='btn btn-secondary-sm btr-downloadAsZip' style='float:right;margin-top:4px;'>Download as .zip</a>").insertAfter(header)
		}
	})

	$(document).on("click", ".btr-downloadAsZip:not(.disabled)", (ev) => {
		var btn = $(ev.target)
		var origText = btn.text()
		btn.toggleClass("disabled", true)
		btn.text("Preparing...")
		var loadedCount = 0
		var versionCount = 0

		var fileName = ($("#basicSettings>input").attr("value") || "place")
			.replace(/[^\w \-\.]+/g,"")
			.replace(/ {2,}/g," ")
			.trim()

		if(!jszipPromise) {
			jszipPromise = new Promise((resolve) => {
				execScripts(["lib/jszip.min.js"], resolve)
			})
		}

		jszipPromise.then(() => {
			var zip = new JSZip()
			var queue = []
			var finishedLoading = false
			var sentZip = false
			var activeLoaders = 0

			function loadPage(page, cb) {
				$.getJSON("//api.roblox.com/assets/{0}/versions?page={1}".format(placeId, page), cb)
			}

			function loadFile() {
				if(queue.length === 0) {
					if(finishedLoading) {
						if(--activeLoaders === 0) {
							btn.text("Generating .zip...")
							zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 }, streamFiles: true }).then((blob) => {
								btn.text(origText).toggleClass("disabled", false)
								startDownload(URL.createObjectURL(blob), fileName + ".zip")
							})
						}
						return;
					}

					return setTimeout(loadFile, 100);
				}

				var data = queue.splice(0, 1)[0]
				btn.text("Downloading {0}/{1}".format(++loadedCount, versionCount))
				downloadAsset("arraybuffer", { id: placeId, version: data.VersionNumber }, (buffer) => {
					zip.file(fileName + "-" + data.VersionNumber + ".rbxl", buffer)
					setTimeout(loadFile, 100)
				})
			}

			btn.text("Downloading 0/?")
			loadPage(1, (json) => {
				if(json.length === 0) {
					btn.text("Failed...")
					setTimeout(() => {
						btn.text(origText)
						btn.toggleClass("disabled", false)
					}, 2000)
					return;
				}
				versionCount = json[0].VersionNumber
				var maxPage = Math.floor((versionCount-1)/json.length) + 1
				var curPage = 2

				queue.push.apply(queue, json)

				function nextPage() {
					if(curPage > maxPage) {
						finishedLoading = true
						return;
					}

					loadPage(curPage++, (list) => {
						queue.push.apply(queue, list)
						nextPage()
					})
				}

				nextPage()

				for(var i=0; i<5; i++) {
					activeLoaders++
					loadFile()
				}
			})
		})
	})
}

pageInit.groups = function() {
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

pageInit.profile = function(userId) {
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
		selector: [".profile-game", "#games-switcher"],
		callback: function(games, switcher) {
			right.find(".placeholder-games").replaceWith(games)

			games.addClass("section")
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

			hlist.on("click", ".btr-toggle-description", function() {
				var btn = $(this)
				var desc = btn.closest(".btr-game-desc")

				desc.toggleClass("expanded")
				btn.text(desc.hasClass("expanded") ? "Show Less" : "Read More")
			})

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
								"<span class='btr-game-desc-content'>{Desc}</span>" +
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

					item.toggleClass("visible", index/pageSize < 1)
					item.find(".btr-game-stats").append(slide.find(".slide-item-stats>.hlist"))
					item.find(".unloaded").on("load", function() { $(this).removeClass("unloaded") })

					loggedInUserPromise.then((loggedInUser) => {
						if(userId != loggedInUser)
							return;

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
						
						item.on("click",".btr-btn-toggle-profile", () => {
							getXsrfToken((token) => {
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
						}).on("click",".btr-btn-shutdown-all", () => {
							getXsrfToken((token) => {
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
					})

					function retryUntilFinal(url, cb) {
						$.getJSON(url, (json) => json && json.Final ? cb(json) : setTimeout(retryUntilFinal, 500, url, cb))
					}

					var iconRetryUrl = slide.find(".slide-item-image").attr("data-retry")
					if(iconRetryUrl) {
						retryUntilFinal(iconRetryUrl, (json) => {
							item.find(".btr-game-icon").attr(src, json.Url)
						})
					}
					
					if(!isNaN(placeId)) {
						var thumbUrl = "/asset-thumbnail/json?assetId={0}&width=768&height=432&format=png".format(placeId)

						retryUntilFinal(thumbUrl, (json) => {
							item.find(".btr-game-thumb").attr("src", json.Url)
						})
					}

					if(index == 0) {
						item.addClass("selected")
					}

					slide.remove()
					item.appendTo(hlist)

					pager.setMaxPage(Math.floor((hlist.children().length-1)/pageSize))

					var desc = item.find(".btr-game-desc")
					var heig = desc.find("span").height()

					if(heig > 170) {
						$("<span class='btr-toggle-description'>Read More</span>").appendTo(desc)
					}
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
			$("<div style='text-align:center;'>" +
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

pageInit.inventory = function(userId) {
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
					var matches = self.find(".item-card-link").attr("href").match(/(?:\/(?:catalog|library)\/|[?&]id=)(\d+)/)

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
						$.getJSON("//api.roblox.com/Marketplace/ProductInfo?assetId="+x.assetId, (data) => {
							if(!data) return;

							if(data.AssetTypeId == 10 || data.AssetTypeId == 13 || data.AssetTypeId == 40 || data.AssetTypeId == 3 || data.AssetTypeId == 24) {
								getXsrfToken((token) => {
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
									}).done(() => {
										x.obj.remove()
										if(--itemsLeft == 0) {
											isRemoving = false
											InjectJS.send("refreshInventory")
										}
									}).fail(() => {
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

var hasCsLoaded = true
if(typeof(hasBeenInit) !== "undefined") Init();
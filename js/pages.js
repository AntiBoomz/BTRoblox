"use strict"

function GetRobloxTimeZone() {
	var month = serverDate.getUTCMonth() + 1
	var date = serverDate.getUTCDate()
	var weekday = serverDate.getUTCDay()
	var hour = serverDate.getUTCHours()

	// DST starts on the second Sunday in March at 02:00 CST, which is 08:00 UTC
	// DST ends on the first Sunday in November at 01:00 CST, which is 07:00 UTC

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
}

function RobloxTime(dateString) {
	dateString += " " + GetRobloxTimeZone()
	return Date.parse(dateString) ? new Date(dateString) : false
}

function createPager(noSelect) {
	var pager = html`
	<div class="btr-pager-holder">
		<ul class="pager">
			<li class="pager-prev"><a><span class="icon-left"></span></a></li>
			<li class="pager-mid">
				Page <span class="pager-cur" type="text" value=""></span>
			</li>
			<li class="pager-next"><a><span class="icon-right"></span></a></li>
		</ul>
	</div>`

	if(!noSelect) {
		pager.$find(".pager-mid").innerHTML = htmlstring`
		Page <input class="pager-cur" type="text" value=""> of <span class="pager-total"></span>`
	}

	var prev = pager.$find(".pager-prev")
	var next = pager.$find(".pager-next")
	var cur = pager.$find(".pager-cur")

	Object.assign(pager, {
		curPage: 1,

		setPage(page) {
			this.curPage = page
			if(noSelect) {
				cur.textContent = page
				this.togglePrev(page > 1)
			} else {
				cur.value = page
				this.togglePrev(page > 1)
				this.toggleNext(page < this.maxPage)
			}
		},

		togglePrev(bool) { prev.classList.toggle("disabled", !bool) },
		toggleNext(bool) { next.classList.toggle("disabled", !bool) }
	})

	pager.setPage(1)

	prev.$find("a").$on("click", () => pager.onprevpage && pager.onprevpage())
	next.$find("a").$on("click", () => pager.onnextpage && pager.onnextpage())

	if(!noSelect) {
		var tot = pager.$find(".pager-total")
		pager.maxPage = 1

		Object.assign(pager, {
			onprevpage() { this.curPage>1 && this.onsetpage && this.onsetpage(this.curPage-1) },
			onnextpage() { this.curPage<this.maxPage && this.onsetpage && this.onsetpage(this.curPage+1) },

			setMaxPage(maxPage) {
				this.maxPage = maxPage
				tot.textContent = maxPage

				this.toggleNext(this.curPage < maxPage)
			}
		})

		pager.setMaxPage(1)

		cur.$on("keydown", e => {
			if(e.keyCode === 13 && pager.onsetpage) {
				var page = parseInt(cur.value)
				if(isNaN(page)) return;

				page = Math.max(1, Math.min(pager.maxPage, page))

				if(pager.curPage !== page) {
					pager.onsetpage(page)
				} else {
					pager.setPage(page)
				}
			}
		})
	}

	return pager
}

function Create3dPreview(readyCb) {
	var container = html`
	<div style="width:100%;height:100%;">
		<div class='btr-switch' style='position:absolute;top:6px;right:6px;'>
			<div class='btr-switch-off'>R6</div>
			<div class='btr-switch-on'>R15</div>
			<input type='checkbox'> 
			<div class='btr-switch-flip'>
				<div class='btr-switch-off'>R6</div>
				<div class='btr-switch-on'>R15</div>
			</div>
		</div>
		<div class='input-group-btn' style='position:absolute;top:6px;left:6px;width:140px;display:none'>
			<button type='button' class='input-dropdown-btn' data-toggle='dropdown'>
				<span class='rbx-selection-label' data-bind='label'></span>
				<span class='icon-down-16x16'></span>
			</button>
			<ul data-toggle='dropdown-menu' class='dropdown-menu' role='menu'></ul>
		</div>
	</div>`

	var modeSwitch = container.$find(".btr-switch input")
	var dropdown = container.$find(".input-group-btn")

	var rulesPromise = null
	var isLoaded = false
	var scene = null

	var animDebounce = 0
	var appDebounce = 0

	var currentAnim = null
	var preview = {
		domElement: container,
		switch: modeSwitch,

		setPlayerType(playerType) {
			console.assert(playerType === "R6" || playerType === "R15")
			this.playerType = playerType

			var isChecked = playerType === "R15"
			if(modeSwitch.checked !== isChecked) {
				modeSwitch.checked = isChecked
				modeSwitch.$trigger("change")
			}

			if(scene)
				scene.avatar.setPlayerType(playerType);
		},
		loadDefaultAppearance(modifierCb) {
			if(!rulesPromise) rulesPromise = new Promise(resolve => avatarApi.getRules(resolve));

			avatarApi.getData((data) => {
				if(modifierCb)
					modifierCb(data);

				this.applyAppearance(data)
			})
		},
		applyAppearance(data) {
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
					forEach(data.bodyColors, (value, name) => {
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
		addDropdown(id, name) {
			var menu = dropdown.$find(".dropdown-menu")
			menu.append(html`<li data-name="${name}" data-assetId="${id}"><a href="#">${name}</a></li>`)

			if(menu.children.length === 2)
				dropdown.style.display = "";
		},
		setDropdown(name) {
			dropdown.$find("[data-bind='label']").textContent = name
		},
		playAnimation(animId, matchPlayerType, cb) {
			function playAnimation(anim) {
				if(matchPlayerType) {
					const R15BodyPartNames = [
						"LeftFoot", "LeftHand", "LeftLowerArm", "LeftLowerLeg", "LeftUpperArm", "LeftUpperLeg", "LowerTorso", 
						"RightFoot", "RightHand", "RightLowerArm", "RightLowerLeg", "RightUpperArm", "RightUpperLeg", "UpperTorso"
					]

					var isR15 = false

					for(var name in anim.keyframes) {
						if(R15BodyPartNames.indexOf(name) !== -1) {
							isR15 = true
							break;
						}
					}
					
					preview.setPlayerType(isR15 ? "R15" : "R6")
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

	dropdown.$on("click", ".dropdown-menu>li[data-name]", e => {
		var animName = e.currentTarget.getAttribute("data-name")
		var animId = e.currentTarget.getAttribute("data-assetId")
		if(animName && animId) {
			preview.setDropdown(animName)
			preview.playAnimation(animId)
		}
	})

	modeSwitch.$on("change", e => {
		var playerType = modeSwitch.checked ? "R15": "R6"
		preview.setPlayerType(playerType)
	})

	execScripts(["lib/three.min.js", "js/RBXParser.js", "js/RBXScene.js"], () => {
		ANTI.RBXScene.ready(RBXScene => {
			scene = window.scene = preview.scene = new RBXScene()
			container.append(scene.canvas)

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

function CreateNewVersionHistory(assetId, assetType) {
	var versionHistory = html`<div class="btr-versionHistory"></div>`
	var versionList = html`<ul class="btr-versionList"></ul>`
	var pager = createPager()

	var isBusy = false
	var pageSize = 15
	var actualPageSize

	pager.onsetpage = loadPage

	versionHistory.$on("click", ".version-revert", e => {
		if(isBusy) return;

		var versionId = parseInt(e.currentTarget.getAttribute("data-versionId"))
		if(isNaN(versionId)) return;

		isBusy = true

		getXsrfToken(token => request({
			method: "POST",
			url: "/places/revert",
			data: { assetVersionID: versionId },
			headers: { "X-CSRF-TOKEN": token },
			success: () => {
				isBusy = false
				loadPage(1)
			},
			error: () => {
				isBusy = false
			}
		}))
	})
	.$on("click", ".version-download", e => {
		if(isBusy)
			return;
		
		var version = parseInt(e.currentTarget.getAttribute("data-version"))
		if(isNaN(version))
			return;

		isBusy = true

		var placeNameInput = $("#basicSettings>input")
		var placeName = (placeNameInput ? placeNameInput.value : "place").replace(/[^\w \-\.]+/g,"").replace(/ {2,}/g," ").trim()
		var fileExt = assetType === "place" ? "rbxl" : "rbxm"
		var fileName = `${placeName}-${version}.${fileExt}`

		downloadAsset("blob", { id: assetId, version }, blob => {
			isBusy = false
			startDownload(URL.createObjectURL(blob), fileName)
		})
	})

	function getPage(page, target) {
		return new Promise(resolve => {
			var url = `//api.roblox.com/assets/${assetId}/versions?page=${page}`
			request.getJson(url, json => {
				if(Array.isArray(target)) {
					var offset = (page-1) * actualPageSize

					json.forEach((v,i) => {
						target[offset + i] = v
					})
				} else {
					target(json)
				}

				resolve()
			})
		})
	}

	function loadPage(page) {
		if(isBusy) return;
		isBusy = true

		var promises = []
		var items = []
		var itemStart = (page-1) * pageSize
		var itemEnd = itemStart + pageSize - 1

		var pageFrom = Math.floor(itemStart/actualPageSize) + 1
		var pageTo = Math.floor(itemEnd/actualPageSize) + 1

		for(var i=pageFrom; i <= pageTo; i++) {
			promises.push( getPage(i, items) )
		}

		Promise.all(promises).then(() => {
			constructPage(items, itemStart, itemEnd)
			isBusy = false
			pager.setPage(page)
		})
	}

	function constructPage(items, itemStart, itemEnd){
		versionList.innerHTML = ""

		for(var i=itemStart; i <= itemEnd; i++) {
			var item = items[i]
			if(!item)
				break;

			var card = html`
			<li class="list-item">
				<div class="version-card">
					<div class="version-dropdown">
						<a class="rbx-menu-item" data-toggle="popover" data-container="body" data-bind="btr-versiondrop-${i}">
							<span class="icon-more"></span>
						</a>
						<div data-toggle="btr-versiondrop-${i}">
							<ul class="dropdown-menu btr-version-dropdown-menu">
								<li><a class="version-revert" data-versionId="${item.Id}">Revert</a></li>
								<li><a class="version-download" data-version="${item.VersionNumber}">Download</a></li>
							</ul>
						</div>
					</div>
					<div class="version-thumb-container"><img class="version-thumb" style="display:none"></div>
					<div class="version-number">Version ${item.VersionNumber}</div>
					<div class="version-date">${new Date(item.Created).format("M/D/YY hh:mm A")}</div>
				</div>
			</li>`

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
			versionList.append(card)
		}
	}

	isBusy = true
	getPage(1, json => {
		actualPageSize = json.length
		pager.setMaxPage(Math.floor((json[0].VersionNumber-1)/pageSize) + 1)
		pager.setPage(1)
		constructPage(json, 0, pageSize-1)
		isBusy = false
	})

	versionHistory.append(versionList)
	versionHistory.append(pager)

	return versionHistory
}


var XsrfPromise;
function getXsrfToken(callback) {
	if(!XsrfPromise) {
		XsrfPromise = new Promise(resolve => {
			Observer.one(
				"script:not([src])",
				x => x.textContent.indexOf("XsrfToken.setToken") !== -1,
				x => {
					var match = x.textContent.match(/setToken\('(.*)'\)/)
					if(match) {
						resolve(match[1])
					} else {
						console.log("Getting XsrfToken failed")
					}
				}
			)
		})
	}

	XsrfPromise.then(callback)
}

function downloadAsset(type, params, callback) {
	BackgroundJS.send("downloadFile", "http://www.roblox.com/asset/?" + request.params(params), bloburl => {
		request({
			method: "GET",
			url: bloburl,
			dataType: type,
			success: data => callback(data)
		})
	})
}

function startDownload(blob, fileName) {
	var link = document.createElement("a")
	link.setAttribute("download", fileName || "file")
	link.setAttribute("href", blob)
	document.body.append(link)
	link.click()
	link.remove()
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


const InvalidExplorableAssetTypeIds = [1, 3, 4, 5, 6, 7, 16, 21, 22, 32, 33, 34, 35, 37, 39]
const AnimationPreviewAssetTypeIds = [24, 32, 48, 49, 50, 51, 52, 53, 54, 55, 56]
const WearableAssetTypeIds = [2, 8, 11, 12, 18, 27, 28, 29, 30, 31, 41, 42, 43, 44, 45, 46, 47]
const UniqueWearableAssetTypeIds = [2, 11, 12, 18, 27, 28, 29, 30, 31]
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




var avatarApi = {
	baseUrl: "https://avatar.roblox.com/v1/",
	get: function(url, data, cb) {
		if(typeof(data) == "function")
			cb = data, data = null;

		request({
			method: "GET",
			url: this.baseUrl + url,
			params: data,
			dataType: "json",
			headers: { "X-CSRF-TOKEN": this.csrfToken },
			success: json => cb(json),
			failure: xhr => {
				if(xhr.status === 403) {
					this.csrfToken = xhr.getResponseHeader("X-CSRF-TOKEN")
					this.get(url, data, cb)
				}
			}
		})
	},
	post: function(url, data, cb) {
		if(typeof(data) == "function")
			cb = data, data = null;

		request({
			method: "POST",
			url: this.baseUrl + url,
			json: JSON.stringify(data),
			dataType: "json",
			headers: { "X-CSRF-TOKEN": this.csrfToken },
			success: json => cb(json),
			failure: xhr => {
				if(xhr.status == 403) {
					this.csrfToken = xhr.getResponseHeader("X-CSRF-TOKEN")
					this.post(url, data, cb)
				}
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
	Observer.all(".feeds .list-item .text-date-hint", span => {
		var fixedDate = RobloxTime(span.textContent.replace("|",""))
		if(fixedDate) {
			span.setAttribute("btr-timestamp", "")
			span.textContent = fixedDate.format("MMM D, YYYY | hh:mm A")
		}
	})
}

pageInit.messages = function() {
	Observer.one(".roblox-messages-container", container => {
		CreateObserver(container, { permanent: true })
		.all(".messageDivider", row => {
			var span = row.$find(".message-summary-date")
			var fixedDate = RobloxTime(span.textContent.replace("|",""))
			if(fixedDate) {
				span.setAttribute("btr-timestamp", "")
				span.textContent = fixedDate.format("MMM D, YYYY | hh:mm A")
			}
		})
		.all(".roblox-message-body", msg => {
			var span = msg.$find(".subject .date")
			var fixedDate = RobloxTime(span.textContent.replace("|",""))
			if(fixedDate) {
				span.setAttribute("btr-timestamp", "")
				span.textContent = fixedDate.format("MMM D, YYYY | hh:mm A")
			}
		})
	})

	modifyTemplate("messages-nav", template => {
		var curPage = template.$find(".CurrentPage")
		curPage.classList.add("btr-CurrentPage")
		curPage.setAttribute("contentEditable", true)
		curPage.setAttribute("ng-keydown", "keyDown($event)")

		template.$find(".roblox-markAsUnreadInbox").append(html`
		<button class="btr-markAllAsReadInbox btn-control-sm" ng-click="markAllAsRead()">
			Mark All As Read
		</button>`)
	});
}

pageInit.develop = function() {
	Observer.all("#MyCreationsTab .item-table[data-in-showcase][data-type='universes']", table => {
		table.$find(".details-table>tbody").append(html`<tr><td><a class='btr-showcase-status'/></td></tr>`)

		table.$on("click", ".btr-showcase-status", e => {
			var placeId = parseInt(table.getAttribute("data-rootplace-id"))
			var isVisible = table.getAttribute("data-in-showcase").toLowerCase() === "true"

			if(isNaN(placeId))
				return;

			getXsrfToken(token => {
				request({
					method: "POST",
					url: "/game/toggle-profile",
					data: {
						placeId: placeId,
						addToProfile: !isVisible
					},
					dataType: "json",
					headers: { "X-CSRF-TOKEN": token },
					success: json => {
						if(json.isValid) {
							table.setAttribute("data-in-showcase", json.data.inShowcase)
						}
					}
				})
			})
		})
	})
}

pageInit.itemdetails = function(assetId) {
	var assetTypePromise = new Promise(resolve => {
		Observer.one(".item-type-field-container .field-content", label => resolve(label.textContent.trim()))
	})

	Observer.one("#AjaxCommentsContainer .comments", cont => {
		CreateObserver(cont, { permanent: true, subtree: false })
		.all(".comment-item", comment => {
			var span = comment.$find(".text-date-hint")
			var fixedDate = RobloxTime(span.textContent.replace("|",""))
			if(fixedDate) {
				span.setAttribute("btr-timestamp", "")
				span.textContent = fixedDate.format("MMM D, YYYY | hh:mm A")
			}
		})
	})
	.one(".item-type-field-container .field-content", typeLabel => {
		var assetTypeName = typeLabel.textContent.trim()
		var assetTypeId = AssetTypeIds.indexOf(assetTypeName)

		if(assetTypeId === -1) {
			if(isDevExtension)
				alert("Unknown asset type " + assetTypeName);

			return;
		}

		function enableExplorer() {
			var explorerInitialized = false
			var explorer = null

			execScripts(["js/Explorer.js"], () => explorer = new Explorer())

			var btn = html`
			<div>
				<a class="btr-explorer-button" data-toggle="popover" data-bind="btr-explorer-content">
					<span class="btr-icon-explorer"</span>
				</a>
				<div class="rbx-popover-content" data-toggle="btr-explorer-content">
					<div class="btr-explorer-parent"></div>
				</div>
			</div>`

			Observer.one("#item-container>.section-content", cont => {
				cont.append(btn)
				cont.parentNode.classList.toggle("btr-explorer-btn-shown")
			})

			btn.$on("click", () => {
				if(!explorer)
					return false;

				if(!explorerInitialized) {
					explorerInitialized = true

					if(assetTypeId === 32) { // Package, I disabled package exploring elsewhere
						AssetCache.loadText(assetId, text => text.split(";").forEach(id => {
							AssetCache.loadModel(id, model => explorer.addView(id.toString(), model))
						}))
					} else {
						AssetCache.loadModel(assetId, model => explorer.addView("Main", model))
					}
				}

				setTimeout(() => {
					var parent = $("div:not(.rbx-popover-content)>.btr-explorer-parent")
					if(parent)
						parent.replaceWith(explorer.domElement);
				}, 0)
			})
		}

		function enablePreview(readyCb) {
			var preview = Create3dPreview(readyCb)
			var container = html`<div class="item-thumbnail-container btr-preview-container">`
			container.append(preview.domElement)
			var button = null

			var visible = false
			var initialized = false
			var oldContainer = null

			preview.toggleVisible = function(bool) {
				visible = typeof(bool) === "boolean" ? bool : !visible
				if(!oldContainer)
					return;

				if(visible) {
					if(!initialized){
						initialized = true

						if(preview.onInit)
							preview.onInit();
					}
					oldContainer.style.display = "none"
					oldContainer.after(container)
				} else {
					container.remove()
					oldContainer.style.display = ""
				}
			}

			preview.createButtons = function() {
				preview.enableBtn = html`<span class="btr-preview-btn rbx-btn-control-sm">\uD83D\uDC41</span>`
				preview.disableBtn = preview.enableBtn.cloneNode(true)

				if(oldContainer)
					oldContainer.$find("#AssetThumbnail").append(preview.enableBtn);

				preview.domElement.append(preview.disableBtn)

				document.$on("click", ".btr-preview-btn", () => preview.toggleVisible())
			}


			Observer.one("#AssetThumbnail", oldCont => {
				oldContainer = oldCont.parentNode
				preview.toggleVisible(visible)

				if(preview.enableBtn)
					oldContainer.$find("#AssetThumbnail").append(preview.enableBtn);
			})


			return preview
		}

		execScripts(["js/RBXParser.js", "js/AssetCache.js"], () => {
			if(settings.catalog.explorerButton && InvalidExplorableAssetTypeIds.indexOf(assetTypeId) === -1) {
				if(assetTypeId === 10) {
					var itemContainer = $("#item-container")
					if(itemContainer) {
						var isPublic = !!itemContainer.getAttribute("data-seller-name")
						var isOwned = !!itemContainer.$find(".item-name-container .label-checkmark")

						if(isPublic || isOwned) {
							enableExplorer()
						} else {
							loggedInUserPromise.then(loggedInUser => {
								CreateObserver(itemContainer)
								.one(`.item-name-container a[href*="/users/"]`, anchor => {
									var matches = anchor.href.match(/\/users\/(\d+)/)
									if(matches && matches[1] == loggedInUser) {
										enableExplorer()
									}
								})
							})
						}
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

				function enable() {
					preview.toggleVisible(true)
					preview.createButtons()
					preview.loadDefaultAppearance(data => {
						delete data.playerAvatarType;
					})
				}


				var preview = enablePreview(onPreviewReady)

				if(settings.catalog.animationPreviewAutoLoad) {
					loadAnimations()
				} else {
					preview.onInit = loadAnimations
				}


				function loadAnimations() {
					switch(assetTypeId) {
						case 32: // Package
							AssetCache.loadText(assetId, text => {
								var assetIds = text.split(";")
								var first = true

								function addAnims(anims) {
									forEach(anims, (animId, name) => {
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
										return;

									enable()
									addAnims(anims)

									for(var i=1; i<assetIds.length; i++) {
										parseAnimPackage(assetIds[i], addAnims)
									}
								})
							})
						break;
						case 24: // Custom Animation
							preview.playAnimation(assetId, true, err => {
								if(!err)
									enable();
							})
						break;
						default: // PlayerAnimation
							parseAnimPackage(assetId, anims => {
								if(Object.keys(anims).length === 0)
									return preview.destroy();

								enable()

								var first = true
								forEach(anims, (animId, name) => {
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
			} else if(true && WearableAssetTypeIds.indexOf(assetTypeId) !== -1) {
				var preview = enablePreview()
				preview.createButtons()

				preview.onInit = () => {
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

					function updateAnim() {
						var animId = preview.playerType === "R15" ? 507766388 : 180435571
						preview.playAnimation(animId)
					}

					preview.switch.$on("change", updateAnim)
					updateAnim()
				}
			}

			if(true && assetTypeId === 32) {
				var cont = html`
				<div class="btr-package-contents">
					<div class="container-header">
						<h3>This Package Contains...</h3>
					</div>
					<ul class="hlist">
					</ul>
				</div>`

				var assetThumb = "https://assetgame.roblox.com/asset-thumbnail/image?width=150&height=150&format=png&assetId="

				AssetCache.loadText(assetId, text => {
					text.split(";").forEach(assetId => {
						var card = html`
						<li class="list-item item-card">
							<div class="item-card-container">
								<a class="item-card-link" href="https://www.roblox.com/catalog/${assetId}/">
									<div class="item-card-thumb-container">
										<img class="item-card-thumb" src="${assetThumb}${assetId}">
									</div>
									<div class="text-overflow item-card-name">Loading</div>
								</a>
								<div class="text-overflow item-card-creator">
									<span class="xsmall text-label">By</span>
									<a class="xsmall text-overflow text-link">ROBLOX</a>
								</div>
								<div class="text-overflow item-card-price">
									<span class="text-label">Offsale</span>
								</div>
							</div>
						</li>`

						BackgroundJS.send("getProductInfo", assetId, data => {
							if(data.IsForSale) {
								if(data.PriceInRobux) {
									card.$find(".item-card-price").innerHTML = htmlstring`
									<span class="icon-robux-16x16"></span>
									<span class="text-robux">${data.PriceInRobux}</span>`
								} else {
									var label = card.$find(".item-card-price .text-label")
									label.classList.add("text-robux")
									label.textContent = "Free"
								}
							} else {
								card.$find(".item-card-price .text-label").textContent = "Offsale"
							}

							var creator = card.$find(".item-card-creator .text-link")
							creator.href = `https//www.roblox.com/users/${data.Creator.Id}/profile`
							creator.textContent = data.Creator.Name

							card.$find(".item-card-name").textContent = data.Name
							card.$find(".item-card-link").href += data.Name.replace(/[^a-zA-Z0-9]+/g, "-")
						})

						

						cont.$find(".hlist").append(card)
					})
				})

				Observer.one("#item-container>.section-content", content => content.after(cont))
			}
		})
	})
}

pageInit.gamedetails = function(placeId) {
	if(!settings.gamedetails.enabled)
		return;

	var newContainer = html`<div class="col-xs-12 btr-game-main-container section-content">`

	Observer.one(["#tab-about", "#tab-game-instances"], (aboutTab, gameTab) => {
		aboutTab.$find(".text-lead").textContent = "Commentary"

		aboutTab.classList.remove("active")
		gameTab.classList.add("active")

		var parent = aboutTab.parentNode
		parent.append(aboutTab)
		parent.prepend(gameTab)
	})
	.one(["#about", "#game-instances"], (about, games) => {
		about.classList.remove("active")
		games.classList.add("active")
	})
	.one(".game-main-content", mainCont => {
		mainCont.classList.remove("section-content")
		mainCont.before(newContainer)
		newContainer.prepend(mainCont)
	})
	.one(".game-about-container>.section-content", descCont => {
		var aboutCont = descCont.parentNode

		descCont.classList.remove("section-content")
		descCont.classList.add("btr-description")
		newContainer.append(descCont)

		aboutCont.remove()
	})
	.one(".tab-content", cont => {
		cont.classList.add("section")
		CreateObserver(cont, { subtree: false }).all(".tab-pane", pane => {
			pane.classList.add("section-content")
		})
	})
	.one(".badge-container", badges => {
		badges.classList.add("btr-badges-container")
		newContainer.after(badges)

		if(settings.gamedetails.showBadgeOwned) {
			var lastRequest = null
			var onSeeMoreBadges = new Promise(resolve => Observer.one("#badges-see-more", btn => btn.$once("click", resolve)))

			var getIsBadgeOwned = (badgeId, cb) => {
				//var url = `//api.roblox.com/Ownership/HasAsset?userId=${loggedInUser}&assetId=${badgeId}`
				var url = `//www.roblox.com/Game/Badge/HasBadge.ashx?UserID=${loggedInUser}&BadgeID=${badgeId}`
				request.get(url, result => cb(result === "Success"), () => cb(true))
			}
		}

		CreateObserver(badges).all(".badge-row", row => {
			var url = row.$find(".badge-image>a").href
			var label = row.$find(".badge-name")
			label.innerHTML = htmlstring`<a href="${url}">${label.textContent}</a>`
			row.$find("p.para-overflow").classList.remove("para-overflow")

			if(settings.gamedetails.showBadgeOwned) {
				var badgeId = url.match(/catalog\/(\d+)\//)
				if(!badgeId) return;

				badgeId = badgeId[1]
				row.classList.add("btr_badgeownedloading")

				var cb = val => {
					row.classList.remove("btr_badgeownedloading")
					if(!val) {
						row.classList.add("btr_notowned")
						row.$find("img").title = "You do not own this badge"
					}
				}

				if(!row.classList.contains("badge-see-more-row")) {
					 getIsBadgeOwned(badgeId, cb)
				} else {
					lastRequest = new Promise(resolve => {
						var prev = lastRequest || onSeeMoreBadges

						prev.then(() => getIsBadgeOwned(badgeId, isOwned => {
							cb(isOwned)
							setTimeout(resolve, 100)
						}))
					})
				}
			}
		})
	})
	.one("#carousel-game-details", details => details.setAttribute("data-is-video-autoplayed-on-ready", "false"))
	.one(".game-stats-container .game-stat", x => x.$find(".text-label").textContent === "Updated", stat => {
		BackgroundJS.send("getProductInfo", placeId, data => {
			stat.$find(".text-lead").textContent = new Date(data.Updated).relativeFormat("zz 'ago'", serverDate)
		})
	})
	.one(".rbx-visit-button-closed, #MultiplayerVisitButton", btn => {
		if(btn.classList.contains("rbx-visit-button-closed"))
			return;

		var rootPlaceId = btn.getAttribute("placeid")
		if(placeId === rootPlaceId)
			return;

		var box = html`
		<div class='btr-universe-box'>
			This place is part of 
			<a class='btr-universe-name text-link' href='//www.roblox.com/games/${rootPlaceId}/'></a>
			<div class='VisitButton VisitButtonPlayGLI btr-universe-visit-button' placeid='${rootPlaceId}' data-action='play' data-is-membership-level-ok='true'>
				<a class='btn-secondary-md'>Play</a>
			</div>
		</div>`

		var anchor = box.$find(".btr-universe-name")

		newContainer.prepend(box)
		BackgroundJS.send("getProductInfo", rootPlaceId, data => {
			anchor.textContent = data.Name
			anchor.href = anchor.href + data.Name.replace(/[^\w\-\s]+/g, "").replace(/\s+/g, "-")
		})
	})
	.one("#AjaxCommentsContainer .comments", cont => {
		CreateObserver(cont, { permanent: true, subtree: false })
		.all(".comment-item", comment => {
			var span = comment.$find(".text-date-hint")
			var fixedDate = RobloxTime(span.textContent.replace("|",""))
			if(fixedDate) {
				span.setAttribute("btr-timestamp", "")
				span.textContent = fixedDate.format("MMM D, YYYY | hh:mm A")
			}
		})
	})

	onDocumentReady(function() {
		if($("#AjaxCommentsContainer") == null) {
			$("#about").append(html`<div class="section-content-off">Comments have been disabled for this place</div>`)
		}
	})
}

pageInit.configureplace = function(placeId) {
	if(!settings.versionhistory.enabled)
		return;

	var newVersionHistory = CreateNewVersionHistory(placeId, "place")
	var jszipPromise = null

	Observer.one("#versionHistoryItems", cont => cont.replaceWith(newVersionHistory))
	.one("#versionHistory>.headline h2", header => {
		header.after(html`<a class="btn btn-secondary-sm btr-downloadAsZip" style="float:right;margin-top:4px;">Download as .zip</a>`)
	})

	document.$on("click", ".btr-downloadAsZip:not(.disabled)", e => {
		var btn = e.currentTarget
		var origText = btn.textContent
		var loadedCount = 0
		var versionCount = 0

		var placeNameInput = $("#basicSettings>input")
		var fileName = (placeNameInput ? placeNameInput.value : "place").replace(/[^\w \-\.]+/g,"").replace(/ {2,}/g," ").trim()

		btn.classList.add("disabled")
		btn.textContent = "Preparing..."

		if(!jszipPromise)
			jszipPromise = new Promise(resolve => execScripts(["lib/jszip.min.js"], resolve));

		jszipPromise.then(() => {
			var zip = new JSZip()
			var queue = []
			var finishedLoading = false
			var sentZip = false
			var activeLoaders = 0

			function loadPage(page, cb) {
				var url = `//api.roblox.com/assets/${placeId}/versions?page=${page}`
				request.getJson(url, cb)
			}

			function loadFile() {
				if(queue.length === 0) {
					if(finishedLoading) {
						if(--activeLoaders === 0) {
							btn.textContent = "Generating .zip..."

							var options = { 
								type: "blob", 
								compression: "DEFLATE", 
								compressionOptions: { level: 6 }, 
								streamFiles: true
							}

							zip.generateAsync(options).then(blob => {
								btn.classList.remove("disabled")
								btn.textContent = origText
								startDownload(URL.createObjectURL(blob), fileName + ".zip")
							})
						}
						return;
					}

					return setTimeout(loadFile, 100);
				}

				var data = queue.splice(0, 1)[0]
				btn.textContent = `Downloading ${++loadedCount}/${versionCount}`
				downloadAsset("arraybuffer", { id: placeId, version: data.VersionNumber }, (buffer) => {
					zip.file(`${fileName}-${data.VersionNumber}.rbxl`, buffer)
					setTimeout(loadFile, 100)
				})
			}

			btn.textContent = "Fetching version info..."
			loadPage(1, json => {
				if(!json.length) {
					btn.textContent = "Failed..."

					setTimeout(() => {
						btn.classList.remove("disabled")
						btn.textContent = origText
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

					loadPage(curPage++, list => {
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


	Observer.one("body", body => body.classList.add("btr-groups"))
	.one(["#GroupDescP pre", "#GroupDesc_Full"], (desc, fullDesc) => {
		desc.textContent = fullDesc.value
		fullDesc.remove()
	})
	.one("#ctl00_cphRoblox_GroupStatusPane_StatusDate", span => {
		var fixedDate = RobloxTime(span.textContent)
		if(fixedDate) {
			span.setAttribute("btr-timestamp", "")
			span.textContent = fixedDate.relativeFormat("zz 'ago'", serverDate)
			span.title = fixedDate.format("M/D/YYYY h:mm:ss A")
		}
	})
	.one("#ctl00_cphRoblox_GroupWallPane_GroupWallUpdatePanel", wall => {
		CreateObserver(wall, { permanent: true, subtree: false })
		.all(".AlternatingItemTemplateOdd, .AlternatingItemTemplateEven", post => {
			post.classList.add("btr_comment")

			var content = post.$find(".RepeaterText")
			var postDate = post.$find(".GroupWall_PostDate")
			var postBtns = post.$find(".GroupWall_PostBtns")
			var userLink = post.$find(".UserLink")
			var dateSpan = postDate.firstElementChild

			var defBtns = Array.from(postBtns.children)
			var deleteButton = defBtns.find(x => x.textContent.indexOf("Delete") !== -1)
			var exileButton = defBtns.find(x => x.textContent.indexOf("Exile User") !== -1)

			content.prepend(userLink)
			content.append(postBtns)

			var firstBtn = postBtns.firstChild
			while(postDate.firstElementChild)
				firstBtn.before(postDate.firstElementChild);

			postDate.parentNode.remove()

			if(exileButton) {
				exileButton.textContent = "Exile User"
				exileButton.classList.add("btn-control", "btn-control-medium")
				exileButton.style = ""
			} else {
				exileButton = html`<a class="btn-control btn-control-medium disabled">Exile User</a>`
				if(deleteButton)
					deleteButton.before(exileButton);
				else
					postBtns.append(exileButton);
			}


			if(deleteButton) {
				deleteButton.textContent = "Delete"
				deleteButton.classList.add("btn-control", "btn-control-medium")
				deleteButton.style = ""

				if(deleteButton.href.startsWith("javascript:")) {
					deleteButton.href = `
					javascript:Roblox.GenericConfirmation.open({
						titleText: "Delete This Comment?",
						bodyContent: "Are you sure you wish to delete this comment?",
						acceptText: "Delete",
						declineText: "Cancel",
						escClose: true,
						acceptColor: Roblox.GenericConfirmation.green,
						imageUrl: "/images/Icons/img-alert.png",
						onAccept() { ${deleteButton.href.substring(11)} }
					});`
				}
			} else {
				deleteButton = html`<a class="btn-control btn-control-medium disabled">Delete</a>`
				postBtns.append(deleteButton)
			}

			dateSpan.classList.add("btr_groupwallpostdate")
			var fixedDate = RobloxTime(dateSpan.textContent)
			if(fixedDate) {
				dateSpan.setAttribute("btr-timestamp", "")
				dateSpan.textContent = fixedDate.relativeFormat("zz 'ago'")
				dateSpan.title = fixedDate.format("M/D/YYYY h:mm:ss A")
			}

			var groupId, userId
			try {
				groupId = $("#ClanInvitationData").getAttribute("data-group-id") || document.location.search.match("gid=(\\d+)")[1]
				userId = userLink.$find("a").href.match(/users\/(\d+)/)[1]
			} catch(ex) {}

			if(groupId && userId) {
				var span = html`<span class="btr_grouprank"></span>`
				userLink.append(span)

				if(!rankNamePromises[userId]) {
					var options = { userId, groupId }
					rankNamePromises[userId] = new Promise(resolve => BackgroundJS.send("getRankName", options, resolve))
				}

				rankNamePromises[userId].then(rankname => {
					userLink.append(html`<span class="btr_grouprank">(${rankname})</span>`)
				})
			}
		})
	})

	// TODO: Group audit timestamps (separate)
	// TODO: Group admin timestamps (separate)
}

pageInit.profile = function(userId) {
	if(!settings.profile.enabled)
		return;

	var left = html`
	<div class="btr-profile-col-2 btr-profile-left">
		<div class="placeholder-about" style="display:none"></div>
		<div class="placeholder-robloxbadges" style="display:none">
			<div class="container-header"><h3>Roblox Badges</h3></div>
			<div class="section-content">
				<span class="section-content-off btr-section-content-off">This user has no Roblox Badges</span>
			</div>
		</div>
		<div class="placeholder-playerbadges" style="display:none">
			<div class="container-header"><h3>Player Badges</h3></div>
			<div class="section-content">
				<ul class="hlist">
					<span class="section-content-off btr-section-content-off">This user has no Player Badges</span>
				</ul>
			</div>
		</div>
		<div class="placeholder-groups" style="display:none">
			<div class="container-header"><h3>Groups</h3></div>
			<div class="section-content">
				<ul class="hlist">
					<span class="section-content-off btr-section-content-off">This user is not in any Groups</span>
				</ul>
			</div>
		</div>
	</div>`

	var right = html`
	<div class="btr-profile-col-2 btr-profile-right">
		<div class="placeholder-games" style="display:none">
			<div class="container-header"><h3>Games</h3></div>
			<div class="section-content">
				<span class="section-content-off btr-section-content-off">This user has no active Games</span>
			</div>
		</div>
		<div class="placeholder-friends" style="display:none">
			<div class="container-header"><h3>Friends</h3></div>
			<div class="section-content">
				<span class="section-content-off btr-section-content-off">This user has no Friends</span>
			</div>
		</div>
		<div class="placeholder-favorites btr-profile-favorites style="display:none"">
			<div class="container-header">
				<h3>Favorite Places</h3>
				<a href="./favorites" class="btn-secondary-xs btn-fixed-width btn-more">Favorites</a>
			</div>
			<div class="section-content">
				<ul class="hlist game-cards">
					<span class="section-content-off btr-section-content-off">This user has no favorite Places</span>
				</ul>
			</div>
		</div>
	</div>`

	var bottom = html`
	<div class="btr-profile-col-1 btr-profile-bottom">
		<div class="placeholder-collections" style="display:none"></div>
		<div class="placeholder-inventory" style="display:none"></div>
	</div>`

	Observer.one("body", body => body.classList.add("btr-profile"))
	.one(".container-main + *", () => { // Once container-main has loaded
		document.$findAll(`.profile-container>div>div[class^="placeholder-"]`).forEach(item => {
			item.style.display = ""
		})

		var oldContainer = $(".profile-container > .rbx-tabs-horizontal")
		if(oldContainer) {
			oldContainer.remove()
		}
	})
	.one(".profile-container", cont => (cont.append(left),cont.append(right), cont.append(bottom)))
	.one(".profile-about", about => {
		left.$find(".placeholder-about").replaceWith(about)

		var tooltip = about.$find(".tooltip-pastnames")
		if(tooltip)
			tooltip.setAttribute("data-container", "body"); // Display tooltip over side panel

		about.$find(".profile-about-content-text").classList.add("linkify")

		var content = about.$find(">.section-content")

		var status = $(".profile-avatar-status")
		var statusDiv = html`<div class="btr-header-status-parent"></div>`
		content.prepend(statusDiv)
		var statusText = html`<span class="btr-header-status-text"></span>`
		statusDiv.append(statusText)
		var statusLabel = html`<span></span>`
		statusText.append(statusLabel)

		if(!status) {
			statusText.classList.add("btr-status-offline")
			statusLabel.textContent = "Offline"
		} else {
			var statusTitle = status.getAttribute("title")

			if(status.classList.contains("icon-game")) {
				statusText.classList.add("btr-status-ingame")
				statusLabel.textContent = statusTitle

				Observer.one("script:not([src])", x => x.innerHTML.indexOf("play_placeId") !== -1, script => {
					var matches = script.innerHTML.match(/play_placeId = (\d+)/)
					if(matches && matches[1] != "0") {
						var placeId = matches[1]
						var urlTitle = statusTitle.replace(/\s+/g, "-").replace(/[^\w\-]/g, "")

						var anchor = html`<a href="/games/${placeId}/${urlTitle}" title="${statusTitle}"></a>`
						statusText.replaceWith(anchor)
						anchor.append(statusText)

						var onclick = `Roblox.GameLauncher.followPlayerIntoGame(${userId})`
						anchor.append(html`
						<a class="btr-header-status-follow-button" title="Follow" onclick="${onclick}">\uD83D\uDEAA</a>`)

						if(statusTitle === "In Game") {
							BackgroundJS.send("getProductInfo", placeId, data => {
								urlTitle = data.Name.replace(/\s+/g, "-").replace(/[^\w\-]/g, "")
								anchor.href = `/games/${placeId}/${urlTitle}`
								statusLabel.textContent = data.Name
							})
						}
					} 
				})
			} else if(status.classList.contains("icon-studio")) {
				statusText.classList.add("btr-status-studio")
				statusLabel.textContent = statusTitle
			} else {
				statusText.classList.add("btr-status-online")
				statusLabel.textContent = statusTitle
			}
		}

		Observer.one(".profile-avatar", avatar => {
			about.$find(".profile-about-content").before(avatar)
			avatar.$find(">h3").remove()

			var avatarLeft = avatar.$find(".profile-avatar-left")
			var avatarRight = avatar.$find(".profile-avatar-right")

			avatarLeft.classList.remove("col-sm-6")
			avatarRight.classList.remove("col-sm-6")

			avatarLeft.classList.add("btr-profile-col-1")
			avatarRight.classList.add("btr-profile-col-1")

			avatar.$find(".enable-three-dee").textContent = "3D" // It's initialized as empty

			var toggleItems = html`<span class="btr-toggle-items btn-control btn-control-sm">Show Items</span>`
			avatar.$find("#UserAvatar").append(toggleItems)

			toggleItems.$on("click", () => {
				var visible = !avatarRight.classList.contains("visible")
				avatarRight.classList.toggle("visible", visible)

				toggleItems.textContent = visible ? "Hide Items" : "Show Items"
			})
		})
		.one(".profile-statistics", stats => {
			about.$find(".profile-about-content").after(stats.$find(".profile-stats-container"))
			stats.remove()
		})
	})
	.one("#about>.section>.container-header>h3", x => x.textContent.indexOf("Roblox Badges") !== -1, h3 => {
		var badges = h3.parentNode.parentNode
		left.$find(".placeholder-robloxbadges").replaceWith(badges)

		badges.classList.add("btr-profile-robloxbadges")
		//badges.$find(".assets-count").remove()
		badges.$find(".btn-more").setAttribute("ng-show", badges.$find(".badge-list").children.length > 10 ? "true" : "false")
	})
	.one("#games-switcher", switcher => {
		var games = switcher.parentNode
		right.$find(".placeholder-games").replaceWith(games)

		games.classList.add("section")

		var grid = games.$find(".game-grid")
		grid.classList.add("section-content")
		grid.setAttribute("ng-cloak", "")

		var oldlist = switcher.$find(">.hlist")
		var cont = html`<div class="#games-switcher section-content" ng-hide="isGridOn"></div>`
		switcher.replaceWith(cont)

		var hlist = html`<ul class="hlist btr-games-list"></ul>`
		cont.append(hlist)

		var pageSize = 10
		var pager = createPager()
		hlist.after(pager)

		pager.onsetpage = loadPage

		function loadPage(page) {
			pager.setPage(page)

			forEach(hlist.children, (obj, index) => {
				obj.classList.toggle("visible", Math.floor(index/pageSize)+1 === page) 
			})

			select(hlist.children[(page-1)*pageSize])
		}

		function select(item) {
			if(item.$getThumbnail) {
				item.$getThumbnail()
				delete item.$getThumbnail
			}

			item.classList.toggle("selected")
			hlist.$findAll(".btr-game.selected").forEach(x => x!==item && x.classList.remove("selected"))
		}

		hlist.$on("click", ".btr-game-button", e => !e.target.matches(".btr-game-dropdown *")&&select(e.currentTarget.parentNode))
		.$on("click", ".btr-toggle-description", e => {
			var btn = e.currentTarget
			var desc = btn.parentNode
			var expanded = !desc.classList.contains("expanded")

			desc.classList.toggle("expanded", expanded)
			btn.textContent = expanded ? "Show Less" : "Read More"
		})
		.$on("click", ".btr-btn-toggle-profile", () => {
			var placeId = e.currentTarget.getAttribute("data-placeid")
			getXsrfToken(token => {
				request({
					method: "POST",
					url: "/game/toggle-profile",
					data: { placeId, addToProfile: false },
					dataType: "json",
					headers: { "X-CSRF-TOKEN": token },
				})
			})
		})
		.$on("click", ".btr-btn-shutdown-all", () => {
			getXsrfToken(token => {
				request({
					method: "POST",
					url: "/Games/shutdown-all-instances",
					data: { placeId },
					dataType: "json",
					headers: { "X-CSRF-TOKEN": token }
				})
			})
		})

		CreateObserver(oldlist, { subtree: false }).all(".slide-item-container .slide-item-stats>.hlist", stats => {
			var slide = stats.closest(".slide-item-container")
			var index = +slide.getAttribute("data-index")
			var placeId = slide.$find(".slide-item-image").getAttribute("data-emblem-id")

			var title = slide.$find(".slide-item-name").textContent
			var desc = slide.$find(".slide-item-description").textContent
			var url = slide.$find(".slide-item-emblem-container>a").href
			var iconThumb = slide.$find(".slide-item-image").getAttribute("data-src")

			var item = html`
			<li class="btr-game">
				<div class="btr-game-button">
					<span class="btr-game-title">${title}</span>
				</div>
				<div class="btr-game-content">
					<div class="btr-profile-col-1 btr-game-thumb-container">
						<a href="${url}"><img class="btr-game-thumb"></a>
						<a href="${url}"><img class="btr-game-icon" src="${iconThumb}"></a>
					</div>
					<div class="btr-profile-col-1 btr-game-desc linkify">
						<span class="btr-game-desc-content">${desc}</span>
					</div>
					<div class="btr-profile-col-1 btr-game-info">
						<div class="btr-profile-col-2 btr-game-playbutton-container">
							<div class="btr-game-playbutton VisitButton VisitButtonPlayGLI btn-primary-lg"
								placeid="${placeId}" data-action="play" data-is-membership-level-ok="true">
								Play
							</div>
						</div>
						<div class="btr-profile-col-2 btr-game-stats"></div>
					</div>
				</div>
			</li>`

			item.classList.toggle("visible", index/pageSize < 1)
			item.$find(".btr-game-stats").append(slide.$find(".slide-item-stats>.hlist"))

			loggedInUserPromise.then(loggedInUser => {
				if(userId != loggedInUser)
					return;

				item.$find(".btr-game-button").append(html`
				<span class="btr-game-dropdown">
					<a class="rbx-menu-item" data-toggle="popover" data-container="body" 
						data-bind="btr-placedrop-${placeId}" style="float:right;margin-top:-4px;">
						<span class="icon-more"></span>
					</a>
					<div data-toggle="btr-placedrop-${placeId}" style="display:none">
						<ul class="dropdown-menu" role="menu">
							<li><div onclick="Roblox.GameLauncher.buildGameInStudio(${placeId})"><a>Build</a></div></li>
							<li><div onclick="Roblox.GameLauncher.editGameInStudio(${placeId})"><a>Edit</a></div></li>
							<li><a href="/places/${placeId}/update"><div>Configure this Place</div></a></li>
							<li><a href="/my/newuserad.aspx?targetid=${placeId}&targettype=asset"><div>Advertise this Place</div></a></li>
							<li><a href="/develop?selectedPlaceId=${placeId}&View=21"><div>Create a Badge for this Place</div></a></li>
							<li><a href="/develop?selectedPlaceId=${placeId}&View=34"><div>Create a Game Pass</div></a></li>
							<li><a href="/places/${placeId}/stats"><div>Developer Stats</div></a></li>
							<li><a class="btr-btn-toggle-profile" data-placeid="${placeId}"><div>Remove from Profile</div></a></li>
							<li><a class="btr-btn-shutdown-all" data-placeid="${placeId}"><div>Shut Down All Instances</div></a></li>
						</ul>
					</div>
				</span>`)
			})

			hlist.append(item)
			pager.setMaxPage(Math.floor((hlist.children.length-1)/pageSize) + 1)

			var iconRetryUrl = slide.$find(".slide-item-image").getAttribute("data-retry")

			function getThumbnail() {
				function retryUntilFinal(url, cb) {
					request.getJson(url, json => json && json.Final ? cb(json) : setTimeout(retryUntilFinal, 500, url, cb))
				}
				
				if(iconRetryUrl) {
					retryUntilFinal(iconRetryUrl, json => {
						item.$find(".btr-game-icon").src = json.Url
					})
				}
				
				if(!isNaN(placeId)) {
					var thumbUrl = `/asset-thumbnail/json?assetId=${placeId}&width=768&height=432&format=png`
					retryUntilFinal(thumbUrl, json => {
						item.$find(".btr-game-thumb").src = json.Url
					})
				}
			}

			if(index === 0) {
				item.classList.add("selected")
				getThumbnail()
			} else {
				item.$getThumbnail = getThumbnail
			}


			var desc = item.$find(".btr-game-desc")
			if(desc.scrollHeight > 170) // scrollHeight is not set before appending
				desc.append(html`<span class="btr-toggle-description">Read More</span>`);
		})
	})
	.one(".home-friends", friends => {
		right.$find(".placeholder-friends").replaceWith(friends)
		var hlist = friends.$find(".hlist")

		if(hlist.children.length === 9) {
			var url = `//api.roblox.com/users/${userId}/friends`

			request.getJson(url, list => {
				if(list.length > 9) {
					var item = list[9]

					var profileUrl = `/users/${item.Id}/profile`
					var thumbUrl = `/Thumbs/Avatar.ashx?x=100&y=100&userId=${item.Id}`

					hlist.append(html`
					<li class="list-item friend">
						<div class="avatar-container">
							<a href="${profileUrl}" class="avatar avatar-card-fullbody friend-link" title="${item.Username}">
								<span class="avatar-card-link friend-avatar">
									<img alt="${item.Username}" class="avatar-card-image" src="${thumbUrl}">
								</span>
								<span class="text-overflow friend-name">${item.Username}</span>
							</a>
						</div>
					</li>`)
				}
			})
		}
	})
	.one(".favorite-games-container", favorites => favorites.remove())
	.one(".profile-collections", collections => bottom.$find(".placeholder-collections").replaceWith(collections))

	var initPlayerBadges = () => {
		var badges = left.$find(".placeholder-playerbadges")
		badges.classList.add("btr-profile-playerbadges")

		var hlist = badges.$find(".hlist")

		var isLoading = false
		var prevData = null

		var pager = createPager(true)
		hlist.after(pager)

		pager.onprevpage = () => {
			if(!isLoading && prevData && prevData.Data && prevData.Data.previousPageCursor) {
				loadPage(prevData.Data.Page-1, prevData.Data.previousPageCursor)
			}
		}

		pager.onnextpage = () => {
			if(!isLoading && prevData && prevData.Data && prevData.Data.nextPageCursor) {
				loadPage(prevData.Data.Page+1, prevData.Data.nextPageCursor)
			}
		}

		function loadPage(page, cursor) {
			isLoading = true
			var url = `/users/inventory/list-json?assetTypeId=21&itemsPerPage=10&userId=${userId}&cursor=${cursor}&pageNumber=${page}`

			request.getJson(url, json => {
				isLoading = false
				prevData = json

				if(json && json.IsValid) {
					pager.setPage(json.Data.Page)
					pager.togglePrev(json.Data.previousPageCursor != null)
					pager.toggleNext(json.Data.nextPageCursor != null)
					hlist.innerHTML = ""

					if(json.Data.Items.length === 0) {
						var text = `${userId == loggedInUser ? "You have" : "This user has"} no badges`
						hlist.append(html`<div class="section-content-off btr-section-content-off">${text}</div>`)
					} else {
						forEach(json.Data.Items, data => {
							hlist.append(html`
							<li class="list-item badge-item asset-item">
								<a href="${data.Item.AbsoluteUrl}" class="badge-link" title="${data.Item.Name}">
									<img src="${data.Thumbnail.Url}" alt="${data.Item.Name}">
									<span class="item-name text-overflow">${data.Item.Name}</span>
								</a>
							</li>`)
						})
					}
				}
			})
		}

		loadPage(1, "")
	}

	var initGroups = () => {
		var groups = left.$find(".placeholder-groups")
		groups.classList.add("btr-profile-groups")

		var hlist = groups.$find(".hlist")
		var pageSize = 8

		var pager = createPager()
		hlist.after(pager)
		pager.onsetpage = loadPage

		function loadPage(page) {
			pager.setPage(page)

			forEach(hlist.children, (obj, index) => {
				obj.classList.toggle("visible", Math.floor(index/pageSize)+1 === page)
			})
		}

		var url = `https://www.roblox.com/users/profile/playergroups-json?userId=${userId}`
		request.getJson(url, json => {
			pager.setMaxPage(Math.floor((json.NumberOfGroups-1)/pageSize) + 1)

			hlist.innerHTML = ""
			json.Groups.forEach((item, index) => {
				var parent = html`
				<li class="list-item game-card ${index<pageSize?"visible":""}">
					<a class="card-item game-card-container" href="${item.GroupUrl}">
						<div class="game-card-thumb-container">
							<img class="game-card-thumb card-thumb unloaded" src="${item.Emblem.Url}">
						</div>
						<div class="text-overflow game-card-name" title="${item.Name}">${item.Name}</div>
						<div class="text-overflow game-card-name-secondary">
							${item.Members} ${item.Members === 1 ? "Member" : "Members"}
						</div>
						<div class="text-overflow game-card-name-secondary">${item.Rank}</div>
					</a>
				</li>`

				var thumb = parent.$find(".card-thumb")
				thumb.$once("load", () => thumb.classList.remove("unloaded"))

				hlist.append(parent)
			})

			hlist.style["min-height"] = `${hlist.scrollHeight}px`
		})
	}

	var initFavorites = () => { // Favorites
		var favorites = right.$find(".placeholder-favorites")
		var hlist = favorites.$find(".hlist")

		var header = favorites.$find(".container-header h3")
		header.textContent = "Favorite Places"

		var isLoading = false
		var pageSize = 6
		var lastCategory = null

		var pager = createPager()
		hlist.after(pager)

		pager.onsetpage = page => loadPage(lastCategory, page)

		var dropdown = html`
		<div class="input-group-btn">
			<button type="button" class="input-dropdown-btn" data-toggle="dropdown" aria-expanded="false">
				<span class="rbx-selection-label" data-bind="label">Places</span>
				<span class="icon-down-16x16"></span>
			</button>
			<ul data-toggle="dropdown-menu" class="dropdown-menu" role="menu">
				<li data-value="24"><a href="#">Animations</a></li>
				<li data-value="3"><a href="#">Audio</a></li>
				<li data-value="21"><a href="#">Badges</a></li>
				<li data-value="13"><a href="#">Decals</a></li>
				<li data-value="18"><a href="#">Faces</a></li>
				<li data-value="19"><a href="#">Gear</a></li>
				<li data-value="8"><a href="#">Hats</a></li>
				<li data-value="17"><a href="#">Heads</a></li>
				<li data-value="10"><a href="#">Models</a></li>
				<li data-value="32"><a href="#">Packages</a></li>
				<li data-value="12"><a href="#">Pants</a></li>
				<li data-value="9"><a href="#">Places</a></li>
				<li data-value="38"><a href="#">Plugins</a></li>
				<li data-value="11"><a href="#">Shirts</a></li>
				<li data-value="2"><a href="#">T-Shirts</a></li>
			</ul>
		</div>`

		var dropdownLabel = dropdown.$find(".rbx-selection-label")
		favorites.$find(".container-header .btn-more").after(dropdown)


		dropdown.$on("click", ".dropdown-menu li", e => {
			var category = +e.currentTarget.getAttribute("data-value")
			if(isNaN(category)) return;

			loadPage(category, 1)
		})


		function loadPage(category, page) {
			if(isLoading) return;
			isLoading = true

			lastCategory = category

			var params = {
				thumbWidth: 150,
				thumbHeight: 150,
				userId: userId,
				itemsPerPage: pageSize,
				assetTypeId: category,
				pageNumber: page
			}

			var url = `/users/favorites/list-json?${request.params(params)}`
			request.getJson(url, json => {
				isLoading = false

				if(json && json.IsValid) {
					pager.setPage(page)
					pager.setMaxPage(Math.floor((json.Data.TotalItems-1)/pageSize) + 1)

					hlist.innerHTML = ""

					var categoryName = dropdownLabel.textContent
					header.textContent = `Favorite ${categoryName}`

					var items = json.Data.Items
					if(!items.length) {
						hlist.append(html`<div class='section-content-off btr-section-content-off'>This user has no favorite ${categoryName}</div>`)
					} else {
						items.forEach(data => {
							var item = html`
							<li class="list-item game-card">
								<div class="card-item game-card-container">
									<a href="${data.Item.AbsoluteUrl}" title="${data.Item.Name}">
										<div class="game-card-thumb-container">
											<img class="game-card-thumb card-thumb unloaded" alt="${data.Item.Name}" src="${data.Thumbnail.Url}">
										</div>
										<div class="text-overflow game-card-name" title="${data.Item.Name}" ng-non-bindable>${data.Item.Name}</div>
									</a>
									<div class="game-card-name-secondary">
										<span class="text-label xsmall">By </span>
										<a class="text-link xsmall text-overflow" title="${data.Creator.Name}" href="${data.Creator.CreatorProfileLink}">
											${data.Creator.Name}
										</a>
									</div>
								</div>
							</li>`
							hlist.append(item)
							item.$find(".unloaded").$once("load", e => e.currentTarget.classList.remove("unloaded"))
						})
					}
				}
			})
		}

		loadPage(9, 1)
	}

	initPlayerBadges()
	initGroups()
	initFavorites()

	if(settings.profile.embedInventoryEnabled) {
		onDocumentReady(() => {
			bottom.$find(".placeholder-inventory").replaceWith(html`
			<div>
				<iframe id="btr-injected-inventory" src="/users/${userId}/inventory" scrolling="no">
			</div>`)
		})
	} else {
		bottom.$find(".placeholder-inventory").remove()
	}
}

pageInit.avatar = function() {
}

pageInit.inventory = function(userId) {
	if(settings.profile.embedInventoryEnabled && top.location != self.location) {
		var embedParent = top.document.$find("#btr-injected-inventory")

		if(embedParent) {
			Observer.one("head", head => head.append(html`<base target="_top"></base>`))
			.all("script:not([src])", script => {
				var src = script.innerHTML
				if(src.indexOf("if (top.location != self.location)") !== -1 ||
					src.indexOf("Roblox.DeveloperConsoleWarning.showWarning()") !== -1) {
					script.remove()
				}
			})
			.one("#chat-container", chat => chat.remove())
			.one("body", body => {
				body.classList.add("btr-embed")
				setInterval(() => embedParent.style.height = `${body.scrollHeight}px`, 100)
			})
		}
	}

	if(settings.inventory.inventoryTools) {
		modifyTemplate("assets-list", template => {
			var categories = ["Models", "Meshes", "Decals", "Animations", "Audio"]
			categories.forEach((v,i) => categories[i] = `currentData.category.name == "${v}"`)

			var visibility = `staticData.isOwnPage && (${categories.join(" || ")})`

			template.$find(".assets-explorer-title").after(html`
			<div class="header-content" ng-show="${visibility}">
				<a class="hidden btr-it-reload" ng-click="newPage(currentData.currentPage)"/>
				<a class="btn btn-secondary-sm btr-it-btn btr-it-remove disabled" style="float:right;margin:4px 10px;">Remove</a>
			</div>`)

			template.$find("#assetsItems .item-card-container").append(html`
			<span class="checkbox btr-it-checkbox" ng-show="${visibility}">
				<input type="checkbox" id="btr-it-box{{$index}}" class="btr-it-box" data-index="{{$index}}">
				<label for="btr-it-box{{$index}}" style="position:absolute;left:6px;top:6px;width:auto;"></label>
			</span>`)
		})

		var isRemoving = false
		var shiftPressed = false
		var lastPressed = null

		var updateButtons = function() {
			$(".btr-it-btn").classList.toggle("disabled", $(".btr-it-box:checked") != null)
		}

		InjectJS.listen("inventoryUpdateEnd", updateButtons)

		document.$on("keyup keydown", e => shiftPressed = e.shiftKey)
		.$on("change", ".btr-it-box", e => {
			var id = +e.currentTarget.getAttribute("data-index")

			if(shiftPressed && lastPressed != null && id != lastPressed) {
				var from = Math.min(id, lastPressed)
				var to = Math.max(id, lastPressed)
				var value = e.currentTarget.checked

				for(var i = from; i <= to; i++) {
					$(`#btr-it-box${i}`).checked = value
				}
			}

			lastPressed = id
			updateButtons()
		})
		.$on("click",".item-card-link", e => {
			if($(".btr-it-box:checked") != null) {
				return false;
			}
		}).$on("click",".btr-it-remove", e => {
			if(isRemoving)
				return;

			var checked = $.all(".btr-it-box:checked")

			if(!checked.length)
				return;

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
			var validAssetTypes = [ 10, 13, 40, 3, 24 ]
			
			var removeItem = function(index,retries) {
				var x = data[index]
				if(x) {
					$.getJSON("//api.roblox.com/Marketplace/ProductInfo?assetId="+x.assetId, data =>{
						if(!data)
							return;

						if(validAssetTypes.indexOf(data.AssetTypeId) === -1)
							return console.log("Bad assetType", data);

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
					})
				} 

				setTimeout(removeItem, 250, index + 1)
			}

			removeItem(0)
		})
	}
}

;(() => {
var match = document.cookie.match("BTR-Data=([^;]*)")
if(match) {
	var data = match[1]
	data = decodeURIComponent(data)
	data = JSON.parse(data)

	if(!data.invalid) {
		window.settings = data.settings
		window.currentPage = data.currentPage
		window.serverDate = new Date(data.serverDate)
		window.blogFeedData = data.blogFeedData

		document.documentElement.prepend(html`<link rel="stylesheet" href="${getURL("css/_merged.css")}?${location.href}">`)

		Init()
	} else {
		console.log("invalid = true")
	}
} else {
	console.log("No data cookie")
}
})();

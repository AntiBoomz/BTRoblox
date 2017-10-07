"use strict"

const pageInit = {}
const startDate = new Date()


const InvalidExplorableAssetTypeIds = [1, 3, 4, 5, 6, 7, 16, 21, 22, 32, 33, 34, 35, 37, 39]
const AnimationPreviewAssetTypeIds = [24, 32, 48, 49, 50, 51, 52, 53, 54, 55, 56]
const WearableAssetTypeIds = [2, 8, 11, 12, 18, 27, 28, 29, 30, 31, 41, 42, 43, 44, 45, 46, 47]
const UniqueWearableAssetTypeIds = [2, 11, 12, 18, 27, 28, 29, 30, 31]
const InvalidDownloadableAssetTypeIds = [5, 6, 7, 16, 21, 32, 33, 34, 35, 37]
const AssetTypeIds = (() => {
	const acc = ["Hair", "Face", "Neck", "Shoulder", "Front", "Back", "Waist"]
	const anim = ["Climb", "Death", "Fall", "Idle", "Jump", "Run", "Swim", "Walk", "Pose"]

	acc.forEach((value, index) => { acc[index] = `Accessory | ${value}` })
	anim.forEach((value, index) => { anim[index] = `Animation | ${value}` })

	return [null,
		"Image", "T-Shirt", "Audio", "Mesh", "Lua", "HTML", "Text", "Accessory | Hat", "Place", "Model", // 10
		"Shirt", "Pants", "Decal", "null", "null", "Avatar", "Head", "Face", "Gear", "null", // 20
		"Badge", "Group Emblem", "null", "Animation", "Arms", "Legs", "Torso", "Right Arm", "Left Arm", "Left Leg", // 30
		"Right Leg", "Package", "YouTubeVideo", "Game Pass", "App", "null", "Code", "Plugin", "SolidModel", "MeshPart", // 40
		...acc, // 47
		...anim // 56
	]
})();
const ContainerAssetTypeIds = {
	2: { typeId: 1, filter: x => x.ClassName === "ShirtGraphic", prop: "Graphic" },
	11: { typeId: 1, filter: x => x.ClassName === "Shirt", prop: "ShirtTemplate" },
	12: { typeId: 1, filter: x => x.ClassName === "Pants", prop: "PantsTemplate" },
	13: { typeId: 1, filter: x => x.ClassName === "Decal", prop: "Texture" },
	18: { typeId: 1, filter: x => x.ClassName === "Decal", prop: "Texture" },
	40: { typeId: 4, filter: x => x.ClassName === "MeshPart", prop: "MeshID" }
}


const avatarApi = {
	baseUrl: "https://avatar.roblox.com/v1/",
	get(path, ...args) {
		let [data, cb] = args
		if(typeof data === "function") {
			cb = data
			data = null
		}

		const url = this.baseUrl + path + "?" + new URLSearchParams(data).toString()
		fetch(url, {
			method: "GET",
			headers: { "X-CSRF-TOKEN": this.csrfToken },
			credentials: "include"
		}).then(async response => cb(await response.json()))
	},
	post(url, ...args) {
		let [data, cb] = args
		if(typeof data === "function") {
			cb = data
			data = null
		}

		const url = this.baseUrl + path
		fetch(url, {
			method: "POST",
			headers: { "X-CSRF-TOKEN": this.csrfToken },
			body: JSON.stringify(data)
		}).then(async response => cb(await response.json()))
	},

	getRules(cb) { this.get("avatar-rules", cb) },
	getData(cb) { this.get("avatar", cb) },

	setType(type, cb) { this.post("avatar/set-player-avatar-type", { playerAvatarType: type }, cb) },
	setBodyColors(dict, cb) {	this.post("avatar/set-body-colors", dict, cb) },
	setScales(width, height, cb) { this.post("avatar/set-scales", { width, height }, cb) },
	setWearing(list, cb) { this.post("avatar/set-wearing-assets", { assetIds: list }, cb) },
	wear(assetId, cb) { this.post("avatar/wear-asset", { assetId }, cb) },
	unwear(assetId, cb) { this.post("avatar/unwear-asset", { assetId }, cb) },

	createOutfit(data, cb) { this.post("outfits/create", data, cb) },
	updateOutfit(id, data, cb) { this.post(`outfits/${id}/update`, data, cb) },
	wearOutfit(id, cb) { this.post(`outfits/${id}/wear`, cb) },
	deleteOutfit(id, cb) { this.post(`outfits/${id}/delete`, cb) },
	getOutfitPage(page, amt, cb) {
		loggedInUserPromise.then(userId => this.get(`users/${userId}/outfits`, { page, itemsPerPage: amt }, cb))
	}
}


async function getProductInfo(assetId) {
	const response = await fetch(`https://api.roblox.com/marketplace/productinfo?assetId=${assetId}`)
	return response.json()
}


function downloadFile(url, type) {
	return new Promise(resolve => MESSAGING.send("downloadFile", url, resolve))
		.then(async bloburl => {
			if(!bloburl) throw new Error("Failed to download file");

			const response = await fetch(bloburl)
			URL.revokeObjectURL(bloburl)
			switch(type) {
				case "blob": return response.blob()
				case "text": return response.text()
				case "json": return response.json()
				default: return response.arrayBuffer()
			}
		})
}

function downloadAsset(params, type) {
	if(!(params instanceof Object)) params = { id: params };
	params = new URLSearchParams(params).toString()
	const url = `https://www.roblox.com/asset/?${params}`

	return downloadFile(url, type)
}

const alreadyLoaded = {}
function execScripts(list, cb) {
	for(let i = 0; i < list.length; i++) {
		const path = list[i]
		if(alreadyLoaded[path]) {
			list.splice(i--, 1)
		} else {
			alreadyLoaded[path] = true
		}
	}

	if(list.length === 0) {
		cb()
	} else {
		MESSAGING.send("_execScripts", list, cb)
	}
}

let XsrfPromise;
function getXsrfToken(callback) {
	if(!XsrfPromise) {
		XsrfPromise = new Promise(resolve => {
			Observer.one(
				"script:not([src])",
				x => x.textContent.indexOf("XsrfToken.setToken") !== -1,
				x => {
					const match = x.textContent.match(/setToken\('(.*)'\)/)
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

function startDownload(blob, fileName) {
	const link = document.createElement("a")
	link.setAttribute("download", fileName || "file")
	link.setAttribute("href", blob)
	document.body.append(link)
	link.click()
	link.remove()
}

function GetRobloxTimeZone() {
	const month = startDate.getUTCMonth() + 1
	const date = startDate.getUTCDate()
	const weekday = startDate.getUTCDay()
	const hour = startDate.getUTCHours()

	// DST starts on the second Sunday in March at 02:00 CST, which is 08:00 UTC
	// DST ends on the first Sunday in November at 01:00 CST, which is 07:00 UTC

	const someSunday = date + 7 - weekday
	const firstSunday = someSunday - Math.floor(someSunday / 7) * 7
	const secondSunday = firstSunday + 7

	if(
		(month > 3 && month < 11) || // Within daytime months
		(month === 3 && ( // Or march and DST has begun
			date > secondSunday ||
			(date === secondSunday && hour >= 8)
		)) ||
		(month === 11 && ( // Or november and DST has not ended
			date < firstSunday ||
			(date === firstSunday && hour < 7)
		))
	) {
		return "CDT"
	}

	return "CST"
}

function RobloxTime(dateString) {
	return Date.parse(dateString) ? new Date(`${dateString} ${GetRobloxTimeZone()}`) : false
}


function createPager(noSelect) {
	const pager = html`
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

	const prev = pager.$find(".pager-prev")
	const next = pager.$find(".pager-next")
	const cur = pager.$find(".pager-cur")

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
		const tot = pager.$find(".pager-total")
		pager.maxPage = 1

		Object.assign(pager, {
			onprevpage() { if(this.curPage > 1 && this.onsetpage) this.onsetpage(this.curPage - 1); },
			onnextpage() { if(this.curPage < this.maxPage && this.onsetpage) this.onsetpage(this.curPage + 1); },

			setMaxPage(maxPage) {
				this.maxPage = maxPage
				tot.textContent = maxPage

				this.toggleNext(this.curPage < maxPage)
			}
		})

		pager.setMaxPage(1)

		cur.$on("keydown", e => {
			if(e.keyCode === 13 && pager.onsetpage) {
				let page = parseInt(cur.value, 10)
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
	const container = html`
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

	const modeSwitch = container.$find(".btr-switch input")
	const dropdown = container.$find(".input-group-btn")

	let rulesPromise = null
	let scene = null

	let animDebounce = 0
	let appDebounce = 0

	let currentAnim = null
	const preview = {
		domElement: container,
		switch: modeSwitch,

		setPlayerType(playerType) {
			assert(playerType === "R6" || playerType === "R15")
			this.playerType = playerType

			const isChecked = playerType === "R15"
			if(modeSwitch.checked !== isChecked) {
				modeSwitch.checked = isChecked
				modeSwitch.$trigger("change")
			}

			if(scene) scene.avatar.setPlayerType(playerType);
		},
		loadDefaultAppearance(modifierCb) {
			if(!rulesPromise) rulesPromise = new Promise(resolve => avatarApi.getRules(resolve));

			avatarApi.getData(data => {
				if(modifierCb) modifierCb(data);

				this.applyAppearance(data)
			})
		},
		applyAppearance(data) {
			this.appearanceData = data
			if(!scene) return;

			if(!rulesPromise) rulesPromise = new Promise(resolve => avatarApi.getRules(resolve));

			const appKey = ++appDebounce
			rulesPromise.then(rules => {
				if(appDebounce !== appKey) return;

				if(data.playerAvatarType && !this.playerType) preview.setPlayerType(data.playerAvatarType);

				if(data.bodyColors) {
					const bodyColors = {}

					Object.entries(data.bodyColors).forEach(([name, value]) => {
						const index = name.toLowerCase().replace(/colorid$/, "")
						const bodyColor = rules.bodyColorsPalette.find(x => x.brickColorId === value)
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
			const menu = dropdown.$find(".dropdown-menu")
			menu.append(html`<li data-name="${name}" data-assetId="${id}"><a href="#">${name}</a></li>`)

			if(menu.children.length === 2) dropdown.style.display = "";
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

					const isR15 = R15BodyPartNames.some(x => x in anim.keyframes)
					preview.setPlayerType(isR15 ? "R15" : "R6")
				}

				currentAnim = anim
				if(scene) {
					scene.avatar.animator.play(anim)
				}
			}


			const animIndex = ++animDebounce

			AssetCache.loadModel(animId, model => {
				if(!model) {
					console.log("Failed to load animation: Invalid model", animId)
					if(cb) cb(new Error("Invalid model"));
					return
				}

				if(animDebounce !== animIndex) return;

				let anim
				try {
					anim = new RBXParser.AnimationParser().parse(model)
				} catch(ex) {
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
		const animName = e.currentTarget.getAttribute("data-name")
		const animId = e.currentTarget.getAttribute("data-assetId")
		if(animName && animId) {
			preview.setDropdown(animName)
			preview.playAnimation(animId)
		}
	})

	modeSwitch.$on("change", () => {
		const playerType = modeSwitch.checked ? "R15" : "R6"
		preview.setPlayerType(playerType)
	})

	execScripts(["lib/three.min.js", "js/RBXParser.js", "js/RBXScene.js"], () => {
		RBXScene.ready(() => {
			scene = window.scene = preview.scene = new RBXScene.Scene()
			container.append(scene.canvas)

			if(preview.playerType) scene.avatar.setPlayerType(preview.playerType);
			if(currentAnim) scene.avatar.animator.play(currentAnim);
			if(preview.appearanceData) preview.applyAppearance(preview.appearanceData);
			if(readyCb) readyCb(scene, preview);
		})
	})

	return preview
}

function CreateNewVersionHistory(assetId, assetType) {
	const versionHistory = html`<div class="btr-versionHistory"></div>`
	const versionList = html`<ul class="btr-versionList"></ul>`
	const pager = createPager()
	const pageSize = 15

	let isBusy = false
	let actualPageSize

	async function getPage(page, target) {
		const url = `//api.roblox.com/assets/${assetId}/versions?page=${page}`
		const response = await fetch(url, { credentials: "include" })
		const json = await response.json()

		if(Array.isArray(target)) {
			const offset = (page - 1) * actualPageSize

			json.forEach((v, i) => {
				target[offset + i] = v
			})
		} else {
			target(json)
		}
	}

	function constructPage(items, itemStart, itemEnd) {
		versionList.innerHTML = ""

		for(let i = itemStart; i <= itemEnd; i++) {
			const item = items[i]
			if(!item) break;

			const card = html`
			<li class="list-item">
				<div class="version-card">
					<div class="version-dropdown">
						<a class="rbx-menu-item" data-toggle="popover" data-container="body" data-bind="btr-versiondrop-${i}">
							<span class="icon-more"></span>
						</a>
						<div data-toggle="btr-versiondrop-${i}">
							<ul class="dropdown-menu btr-version-dropdown-menu">
								<li><a class="btr-version-revert" data-versionId="${item.Id}">Revert</a></li>
								<li><a class="btr-version-download" data-version="${item.VersionNumber}">Download</a></li>
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

		const script = document.createElement("script")
		script.innerHTML = "Roblox.BootstrapWidgets.SetupPopover()"
		versionList.append(script)
	}


	function loadPage(page) {
		if(isBusy) return;
		isBusy = true

		const promises = []
		const items = []
		const itemStart = (page - 1) * pageSize
		const itemEnd = itemStart + pageSize - 1

		const pageFrom = Math.floor(itemStart / actualPageSize) + 1
		const pageTo = Math.floor(itemEnd / actualPageSize) + 1

		for(let i = pageFrom; i <= pageTo; i++) {
			promises.push(getPage(i, items))
		}

		Promise.all(promises).then(() => {
			constructPage(items, itemStart, itemEnd)
			isBusy = false
			pager.setPage(page)
		})
	}

	document.documentElement
	.$on("click", ".btr-version-revert", e => {
		if(isBusy) return;

		const versionId = parseInt(e.currentTarget.getAttribute("data-versionId"), 10)
		if(isNaN(versionId)) return;

		isBusy = true

		getXsrfToken(async token => {
			const response = await fetch("/places/revert", {
				method: "POST",
				credentials: "include",
				headers: { "X-CSRF-TOKEN": token },
				body: new URLSearchParams({ assetVersionID: versionId })
			})

			isBusy = false
			if(response.status === 200) loadPage(1);
		})
	})
	.$on("click", ".btr-version-download", e => {
		if(isBusy) return;

		const version = parseInt(e.currentTarget.getAttribute("data-version"), 10)
		if(isNaN(version)) return;

		isBusy = true

		const placeNameInput = $("#basicSettings>input")
		const placeName = (placeNameInput ? placeNameInput.value : "place").replace(/[^\w \-.]+/g, "").replace(/ {2,}/g, " ").trim()
		const fileExt = assetType === "place" ? "rbxl" : "rbxm"
		const fileName = `${placeName}-${version}.${fileExt}`

		downloadAsset({ id: assetId, version }, "blob").then(blob => {
			isBusy = false
			startDownload(URL.createObjectURL(blob), fileName)
		})
	})

	pager.onsetpage = loadPage


	isBusy = true
	getPage(1, json => {
		actualPageSize = json.length
		pager.setMaxPage(Math.floor((json[0].VersionNumber - 1) / pageSize) + 1)
		pager.setPage(1)
		constructPage(json, 0, pageSize - 1)
		isBusy = false
	})

	versionHistory.append(versionList)
	versionHistory.append(pager)

	return versionHistory
}


pageInit.home = function() {
	Observer.all(".feeds .list-item .text-date-hint", span => {
		const fixedDate = RobloxTime(span.textContent.replace("|", ""))
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
			const span = row.$find(".message-summary-date")
			const fixedDate = RobloxTime(span.textContent.replace("|", ""))
			if(fixedDate) {
				span.setAttribute("btr-timestamp", "")
				span.textContent = fixedDate.format("MMM D, YYYY | hh:mm A")
			}
		})
		.all(".roblox-message-body", msg => {
			const span = msg.$find(".subject .date")
			const fixedDate = RobloxTime(span.textContent.replace("|", ""))
			if(fixedDate) {
				span.setAttribute("btr-timestamp", "")
				span.textContent = fixedDate.format("MMM D, YYYY | hh:mm A")
			}
		})
	})

	modifyTemplate("messages-nav", template => {
		const curPage = template.$find(".CurrentPage")
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
	Observer.one("#MyCreationsTab", tab => {
		const observer = CreateObserver(tab, { permanent: true })

		observer.all(".item-table[data-in-showcase][data-type='universes']", table => {
			table.$find(".details-table>tbody").append(html`<tr><td><a class='btr-showcase-status'/></td></tr>`)

			table.$on("click", ".btr-showcase-status", () => {
				const placeId = parseInt(table.getAttribute("data-rootplace-id"), 10)
				const isVisible = table.getAttribute("data-in-showcase").toLowerCase() === "true"

				if(isNaN(placeId)) return;

				const toggleProfile = token => {
					fetch("/game/toggle-profile", {
						method: "POST",
						credentials: "include",
						headers: { "X-CSRF-TOKEN": token },
						body: new URLSearchParams({ placeId, addToProfile: !isVisible })
					}).then(async response => {
						if(!response.ok) {
							assert(!response.headers.get("X-CSRF-TOKEN"))
							return toggleProfile(response.headers.get("X-CSRF-TOKEN"))
						}

						const json = await response.json()
						if(json.isValid) {
							table.setAttribute("data-in-showcase", json.data.inShowcase)
						}
					})
				}

				getXsrfToken(toggleProfile)
			})
		})
	})
}

pageInit.itemdetails = function(assetId) {
	if(!settings.itemdetails.enabled) return;

	Observer.one("#AjaxCommentsContainer .comments", cont => {
		CreateObserver(cont, { permanent: true, subtree: false })
		.all(".comment-item", comment => {
			const span = comment.$find(".text-date-hint")
			const fixedDate = RobloxTime(span.textContent.replace("|", ""))
			if(fixedDate) {
				span.setAttribute("btr-timestamp", "")
				span.textContent = fixedDate.format("MMM D, YYYY | hh:mm A")
			}
		})
	})
	.one(".item-type-field-container .field-content", typeLabel => {
		const assetTypeName = typeLabel.textContent.trim()
		const assetTypeId = AssetTypeIds.indexOf(assetTypeName)

		if(assetTypeId === -1) return;

		function enableExplorer() {
			let explorerInitialized = false
			let explorer = null

			execScripts(["js/Explorer.js"], () => { explorer = new Explorer() })

			const btn = html`
			<div>
				<a class="btr-explorer-button" data-toggle="popover" data-bind="btr-explorer-content">
					<span class="btr-icon-explorer"</span>
				</a>
				<div class="rbx-popover-content" data-toggle="btr-explorer-content">
					<div class="btr-explorer-parent"></div>
				</div>
			</div>`

			Observer.one("#item-container > .section-content", cont => {
				cont.append(btn)
				cont.parentNode.classList.add("btr-explorer-btn-shown")
			})

			btn.$on("click", () => {
				if(!explorer) return false;

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
					const parent = $("div:not(.rbx-popover-content)>.btr-explorer-parent")
					if(parent) parent.replaceWith(explorer.domElement);
				}, 0)
			})
		}

		function enablePreview(readyCb) {
			const container = html`<div class="item-thumbnail-container btr-preview-container">`
			let visible = false
			let initialized = false
			let oldContainer = null

			const preview = Create3dPreview(scene => {
				if(readyCb) readyCb(scene, preview);

				if(visible) scene.start();
			})
			container.append(preview.domElement)

			preview.toggleVisible = function(bool) {
				visible = typeof bool === "boolean" ? bool : !visible
				if(!oldContainer) return;

				if(visible) {
					if(!initialized) {
						initialized = true

						if(preview.onInit) preview.onInit();
					}
					oldContainer.style.display = "none"
					oldContainer.after(container)
					if(preview.scene) preview.scene.start();
				} else {
					container.remove()
					oldContainer.style.display = ""
					if(preview.scene) preview.scene.stop();
				}
			}

			preview.createButtons = function() {
				const cont = html`<div class="btr-thumb-btn-container">
					<div class="btr-thumb-btn rbx-btn-control-sm btr-hats-btn"><span class="btr-icon-hat"></span></div>
					<div class="btr-thumb-btn rbx-btn-control-sm btr-body-btn"><span class="btr-icon-body"></span></div>
					<div class="btr-thumb-btn rbx-btn-control-sm btr-preview-btn checked"><span class="btr-icon-preview"></span></div>
				</div>`

				preview.domElement.append(cont)

				const outCont = html`<div class="btr-thumb-btn-container">
					<div class="btr-thumb-btn rbx-btn-control-sm btr-preview-btn"><span class="btr-icon-preview"></span></div>
				</div>`

				if(oldContainer) oldContainer.$find("#AssetThumbnail").append(outCont);

				document.$on("click", ".btr-preview-btn", () => preview.toggleVisible())
				.$on("click", ".btr-hats-btn", ev => {
					if(!preview.scene) return;

					const self = ev.currentTarget
					const checked = !self.classList.contains("checked")
					self.classList.toggle("checked", checked)

					preview.scene.avatar.accessories.forEach(acc => {
						if(acc.asset.assetId === assetId) return;
						acc.obj.visible = !checked
					})
				})
				.$on("click", ".btr-body-btn", ev => {
					if(!preview.scene) return;

					const self = ev.currentTarget
					const checked = !self.classList.contains("checked")
					self.classList.toggle("checked", checked)

					preview.scene.avatar.bodyparts.forEach(bp => {
						if(bp.asset.assetId === assetId) return;
						bp.hidden = checked
					})
					preview.scene.avatar.refreshBodyParts()
				})
			}


			Observer.one("#AssetThumbnail", oldCont => {
				oldContainer = oldCont.parentNode
				preview.toggleVisible(visible)

				if(preview.outCont)	oldContainer.$find("#AssetThumbnail").append(preview.outCont);
			})


			return preview
		}

		const canAccessPromise = new Promise(resolve => {
			if(assetTypeId !== 10) return resolve(true);
			Observer.one("#item-container", itemCont => {
				if(itemCont.dataset.userassetId) return resolve(true);
				Observer.one(".price-container .action-button > *", btn => {
					resolve(btn.nodeName === "BUTTON" && !btn.disabled)
				})
			})
		})

		execScripts(["js/RBXParser.js", "js/AssetCache.js"], () => {

			if(settings.itemdetails.animationPreview && AnimationPreviewAssetTypeIds.indexOf(assetTypeId) !== -1) {
				const preview = enablePreview(scene => {
					scene.avatar.animator.onstop = () => {
						setTimeout(() => scene.avatar.animator.play(), 2000)
					}
				})

				const parseAnimPackage = (id, cb) => {
					AssetCache.loadModel(id, model => {
						const dict = {}
						const folder = model.find(x => x.ClassName === "Folder" && x.Name === "R15Anim")
						folder.Children.filter(x => x.ClassName === "StringValue").forEach(value => {
							const animName = value.Name

							value.Children.forEach((anim, i) => {
								if(anim.ClassName !== "Animation") return;

								const animId = RBXParser.parseContentUrl(anim.AnimationId)
								if(animId) {
									const index = animName + (i === 0 ? "" : `_${i + 1}`)
									dict[index] = animId
								}
							})
						})

						cb(dict)
					})
				}

				const enable = () => {
					preview.toggleVisible(true)
					preview.createButtons()
					preview.loadDefaultAppearance(data => {
						delete data.playerAvatarType;
					})
				}

				const loadAnimations = () => {
					switch(assetTypeId) {
					case 32: // Package
						AssetCache.loadText(assetId, text => {
							const assetIds = text.split(";")
							let first = true

							function addAnims(anims) {
								Object.entries(anims).forEach(([name, animId]) => {
									preview.addDropdown(animId, name)
									if(first) {
										first = false
										preview.setDropdown(name)
										preview.playAnimation(animId, true)
									}
								})
							}

							parseAnimPackage(assetIds[0], anims => {
								if(Object.keys(anims).length === 0) return;

								enable()
								addAnims(anims)

								for(let i = 1; i < assetIds.length; i++) {
									parseAnimPackage(assetIds[i], addAnims)
								}
							})
						})
						break;
					case 24: // Custom Animation
						preview.playAnimation(assetId, true, err => {
							if(!err) enable();
						})
						break;
					default: // PlayerAnimation
						parseAnimPackage(assetId, anims => {
							if(Object.keys(anims).length === 0) return preview.destroy();

							enable()

							let first = true
							Object.entries(anims).forEach(([name, animId]) => {
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

				if(settings.itemdetails.animationPreviewAutoLoad) {
					loadAnimations()
				} else {
					preview.onInit = loadAnimations
				}
			} else if(true && WearableAssetTypeIds.indexOf(assetTypeId) !== -1) {
				const preview = enablePreview()
				preview.createButtons()

				preview.onInit = () => {
					preview.loadDefaultAppearance(data => {
						const assets = data.assets

						if(UniqueWearableAssetTypeIds.indexOf(assetTypeId) !== -1) {
							for(let i = 0; i < assets.length; i++) {
								const assetInfo = assets[i]
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
						const animId = preview.playerType === "R15" ? 507766388 : 180435571
						preview.playAnimation(animId)
					}

					preview.switch.$on("change", updateAnim)
					updateAnim()
				}
			}

			canAccessPromise.then(canAccess => {
				if(!canAccess) return;

				if(settings.itemdetails.explorerButton && InvalidExplorableAssetTypeIds.indexOf(assetTypeId) === -1) {
					enableExplorer()
				}

				if(settings.itemdetails.downloadButton && InvalidDownloadableAssetTypeIds.indexOf(assetTypeId) === -1) {
					const btn = html`<a class="btr-download-button"><div class="btr-icon-download"></div></a>`
					let dlPromise
					
					Observer.one("#item-container > .section-content", cont => {
						cont.append(btn)
						cont.parentNode.classList.add("btr-download-btn-shown")
					})
	
					function doNamedDownload(event) {
						event.preventDefault()
						if(!dlPromise) {
							dlPromise = downloadAsset(assetId, "blob")
								.then(blob => URL.createObjectURL(blob))
						}
	
						dlPromise.then(bloburl => {
							const title = $("#item-container .item-name-container h2")
							let fileName = title ? title.textContent.trim().replace(/[^a-zA-Z0-9_]+/g, "-") : new URL(btn.href).pathname
						
							switch(assetTypeId) {
							case 1:
								fileName += ".png"
								break;
							case 3:
								fileName += ".mp3"
								break;
							case 4:
								fileName += ".mesh"
								break;
							default:
								fileName += ".rbxm"
							}
	
							startDownload(bloburl, fileName)
						})
					}
	
					btn.href = `/asset/?id=${assetId}`
					btn.$on("click", doNamedDownload)
				}

				const assetTypeContainer = ContainerAssetTypeIds[assetTypeId]
				if(settings.itemdetails.contentButton && assetTypeContainer) {
					const btn = html`<a class="btr-content-button disabled" href="#"><div class="btr-icon-content"></div></a>`
	
					Observer.one("#item-container > .section-content", cont => {
						cont.append(btn)
						cont.parentNode.classList.add("btr-content-btn-shown")
					})
	
					AssetCache.loadModel(assetId, model => {
						const inst = model.find(assetTypeContainer.filter)
						if(!inst) return;
	
						const actId = RBXParser.parseContentUrl(inst[assetTypeContainer.prop])
						if(!actId) return;
	
						btn.href = `/catalog/${actId}`
						btn.classList.remove("disabled")
					})
				}
			})

			if(true && (assetTypeId === 1 || assetTypeId === 13)) {
				Observer.one("#AssetThumbnail", thumb => {
					const btns = html`
					<div class="btr-bg-btn-cont">
						<div class="btr-bg-btn" data-color="white"></div>
						<div class="btr-bg-btn" data-color="black"></div>
						<div class="btr-bg-btn" data-color="none"></div>
					</div>`

					thumb.append(btns)

					btns.$on("click", ".btr-bg-btn", ev => {
						const color = ev.currentTarget.dataset.color
						const prev = btns.$find(".selected")

						if(prev) prev.classList.remove("selected");
						ev.currentTarget.classList.add("selected")

						thumb.dataset.btrBg = color
						localStorage["btr-item-thumb-bg"] = color
					})
						.$on("mouseenter", ".btr-bg-btn", ev => {
							thumb.dataset.btrBg = ev.currentTarget.dataset.color
						})
						.$on("mouseleave", ".btr-bg-btn", ev => {
							thumb.dataset.btrBg = localStorage["btr-item-thumb-bg"]
						})


					const selectedBg = localStorage["btr-item-thumb-bg"] || "white"
					btns.$find(`[data-color="${selectedBg}"]`).click()
				})
			}

			if(true && assetTypeId === 13) {
				const transparentTexture = "https://t6.rbxcdn.com/3707fe58b613498a0f1fc7d11faeccf3"

				Observer.one(`#AssetThumbnail .thumbnail-span img`, img => {
					if(img.src !== transparentTexture) return;

					AssetCache.loadModel(assetId, model => {
						const decal = model.find(x => x.ClassName === "Decal")
						if(!decal) return;

						const imgId = RBXParser.parseContentUrl(decal.Texture)
						if(!imgId) return;

						const url = `/asset-thumbnail/json?width=420&height=420&format=png&assetId=${imgId}`
						function fetchThumb() {
							fetch(url).then(async response => {
								const data = await response.json()

								if(!data.Final) setTimeout(fetchThumb, 200);
								else img.src = data.Url;
							})
						}

						fetchThumb()
					})
				})
			}

			if(true && assetTypeId === 32) {
				const cont = html`
				<div class="btr-package-contents">
					<div class="container-header">
						<h3>This Package Contains...</h3>
					</div>
					<ul class="hlist">
					</ul>
				</div>`

				const assetThumb = "https://assetgame.roblox.com/asset-thumbnail/image?width=150&height=150&format=png&assetId="

				AssetCache.loadText(assetId, text => {
					text.split(";").forEach(childId => {
						const card = html`
						<li class="list-item item-card">
							<div class="item-card-container">
								<a class="item-card-link" href="https://www.roblox.com/catalog/${childId}/">
									<div class="item-card-thumb-container">
										<img class="item-card-thumb" src="${assetThumb}${childId}">
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

						getProductInfo(childId).then(data => {
							if(data.IsForSale) {
								if(data.PriceInRobux) {
									card.$find(".item-card-price").innerHTML = htmlstring`
									<span class="icon-robux-16x16"></span>
									<span class="text-robux">${data.PriceInRobux}</span>`
								} else {
									const label = card.$find(".item-card-price .text-label")
									label.classList.add("text-robux")
									label.textContent = "Free"
								}
							} else {
								card.$find(".item-card-price .text-label").textContent = "Offsale"
							}

							const creator = card.$find(".item-card-creator .text-link")
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
	if(!settings.gamedetails.enabled) return;

	const newContainer = html`<div class="col-xs-12 btr-game-main-container section-content">`

	Observer.one(["#tab-about", "#tab-game-instances"], (aboutTab, gameTab) => {
		aboutTab.$find(".text-lead").textContent = "Commentary"

		aboutTab.classList.remove("active")
		gameTab.classList.add("active")

		const parent = aboutTab.parentNode
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
		const aboutCont = descCont.parentNode

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
		badges.classList.add("col-xs-12", "btr-badges-container")
		newContainer.after(badges)

		const badgeInfo = {}

		CreateObserver(badges).all(".badge-row .badge-stats-container", stats => {
			const row = stats.closest(".badge-row")

			const url = row.$find(".badge-image>a").href
			const label = row.$find(".badge-name")
			label.innerHTML = htmlstring`<a href="${url}">${label.textContent}</a>`
			row.$find("p.para-overflow").classList.remove("para-overflow")

			if(settings.gamedetails.showBadgeOwned) {
				const match = url.match(/catalog\/(\d+)\//)
				if(!match) return;

				const badgeId = +match[1]
				const info = badgeInfo[badgeId]

				if(info) {
					row.classList.toggle("btr_notowned", !info.IsOwned)
				} else {
		//			row.classList.add("btr_badgeownedloading")
					badgeInfo[badgeId] = {
						btrElement: row
					}
				}
			}
		})

		if(settings.gamedetails.showBadgeOwned) {
		//	onDocumentReady(() => {
			const url = `//www.roblox.com/badges/list-badges-for-place?placeId=${placeId}`
			fetch(url, { credentials: "include" }).then(async response => {
				const json = await response.json()

				json.GameBadges.forEach(data => {
					const info = badgeInfo[data.BadgeAssetId]
					if(info) {
						Object.assign(info, data)
						info.btrElement.classList.toggle("btr_notowned", !info.IsOwned)
		//				info.btrElement.classList.remove("btr_badgeownedloading")
					} else {
						badgeInfo[data.BadgeAssetId] = data
					}
				})
			})
		//	})
		}
	})
	.one("#carousel-game-details", details => details.setAttribute("data-is-video-autoplayed-on-ready", "false"))
	.one(".game-stats-container .game-stat", x => x.$find(".text-label").textContent === "Updated", stat => {
		const xhr = new XMLHttpRequest()
		xhr.open("GET", `https://api.roblox.com/marketplace/productinfo?assetId=${placeId}`)
		xhr.responseType = "json"

		xhr.onload = function() {
			const data = this.response
			const serverDate = new Date(this.getResponseHeader("Date"))
			stat.$find(".text-lead").textContent = new Date(data.Updated).relativeFormat("zz 'ago'", serverDate)
		}

		xhr.send()
	})
	.one(".rbx-visit-button-closed, #MultiplayerVisitButton", btn => {
		if(btn.classList.contains("rbx-visit-button-closed")) return;

		const rootPlaceId = btn.getAttribute("placeid")
		if(placeId === rootPlaceId) return;

		const box = html`
		<div class='btr-universe-box'>
			This place is part of 
			<a class='btr-universe-name text-link' href='//www.roblox.com/games/${rootPlaceId}/'></a>
			<div class='VisitButton VisitButtonPlayGLI btr-universe-visit-button' placeid='${rootPlaceId}' data-action='play' data-is-membership-level-ok='true'>
				<a class='btn-secondary-md'>Play</a>
			</div>
		</div>`

		const anchor = box.$find(".btr-universe-name")

		newContainer.prepend(box)
		getProductInfo(rootPlaceId).then(data => {
			anchor.textContent = data.Name
			anchor.href += data.Name.replace(/[^\w\-\s]+/g, "").replace(/\s+/g, "-")
		})
	})
	.one("#AjaxCommentsContainer .comments", cont => {
		CreateObserver(cont, { permanent: true, subtree: false })
		.all(".comment-item", comment => {
			const span = comment.$find(".text-date-hint")
			const fixedDate = RobloxTime(span.textContent.replace("|", ""))
			if(fixedDate) {
				span.setAttribute("btr-timestamp", "")
				span.textContent = fixedDate.format("MMM D, YYYY | hh:mm A")
			}
		})
	})

	onDocumentReady(() => {
		if($("#AjaxCommentsContainer") == null) {
			$("#about").append(html`<div class="section-content-off">Comments have been disabled for this place</div>`)
		}
	})
}

pageInit.catalog = function() {
	if(!settings.catalog.enabled) return;
	Observer.one("body", body => body.classList.add("btr-inventory"))

	modifyTemplate("catalog-item-card", template => {
		template.$find(".item-card-container").classList.add("btr-item-card-container")

		const hover = html`<div class="btr-item-card-more">
			<div class=text-secondary>
				<div class="text-overflow item-card-label">Updated: <span class=btr-updated-label>Loading...</span></div>
				<div class="text-overflow item-card-label">Sales: <span class=btr-sales-label>Loading...</span></div>
				<div class="text-overflow item-card-label" ng-if="!item.Creator">By <span class="text-link creator-name" ng-click="creatorClick($event, 'https://www.roblox.com/users/1/profile')">ROBLOX</span></div>
			</div>
		</div>`
		hover.append(template.$find(".creator-name").parentNode)
		template.$find(".item-card-caption").append(hover)
	})

	const productCache = {}

	document.$on("mouseover", ".btr-item-card-container", ev => {
		const self = ev.currentTarget

		if(self.dataset.btrHoverInit === "true") return;
		self.dataset.btrHoverInit = "true"

		const matches = self.closest("a").href.match(/\/catalog\/(\d+)/)
		if(!matches) return;

		const assetId = matches[1]
		let promise = productCache[assetId]
		if(!promise) promise = productCache[assetId] = getProductInfo(assetId);

		promise.then(data => {
			const updated = new Date(data.Updated).relativeFormat("zz 'ago'", startDate)
			const sales = data.Sales

			const ulabel = self.$find(".btr-updated-label")
			ulabel.textContent = updated
			ulabel.title = updated

			const slabel = self.$find(".btr-sales-label")
			slabel.textContent = sales
			slabel.title = sales
		})
	})
}

pageInit.configureuniverse = function() {
	if(!settings.universeconfig.enabled) return;
	Observer.one("body", body => body.classList.add("btr-uconf"))

	const universeId = new URLSearchParams(location.search).get("id")
	if(!universeId) return;

	Observer.one(`#navbar .verticaltab[data-maindiv="developerProducts"]`, devProd => {
		devProd.after(html`
		<div class="verticaltab" data-maindiv="assets">
			<a href="#">Assets (WIP)</a>
		</div>`)
	})
	.one("#developerProducts", devProd => {
		const cont = html`
		<div id=assets class=configure-tab style=display:none>
			<div class=headline><h2>Asset Explorer</h2></div>
			<ul class=btr-asset-list>
				<li>Loading...</li>
			</ul>
		</div>`
		devProd.after(cont)

		function init() {
			document.head.append(html`<link href="${chrome.runtime.getURL("lib/prism.css")}" rel="stylesheet" />`)
			const prismPromise = new Promise(resolve => execScripts(["lib/prism.js"], resolve))

			const url = `https://api.roblox.com/universes/get-aliases?universeId=${universeId}&page=1`
			fetch(url, { credentials: "include", headers: { useragent: "Roblox/WinInet" } })
				.then(async resp => {
					const json = await resp.json()
					console.log(json)

					const list = cont.$find(".btr-asset-list")
					list.innerHTML = ""
					if(!json.Aliases.length) return list.append(html`<li>This game has no assets</li>`);

					json.Aliases.forEach(alias => {
						const asset = alias.Asset
						const li = html`<li class=btr-asset-item></li>`

						const btn = html`
						<div class=btr-asset-button>
							${alias.Name}
							<a class=btr-asset-link href=/library/${asset.Id}/${asset.Name.replace(/\W+/g, "-")}>🌐</a>
						</div>`
						li.append(btn)

						const content = html`
						<div class=btr-asset-content>
							Unloaded
						</div>`
						li.append(content)

						let hasLoaded = false

						list.append(li)
						btn.$on("click", ev => {
							if(ev.target !== btn) return;
							li.classList.toggle("open")

							if(!hasLoaded) {
								hasLoaded = true
								content.innerHTML = ""

								if(alias.Type === 1) {
									const hl = html`<div class=btr-cc><pre class="language-lua line-numbers"><code class=language-lua></code></pre><div>`
									const code = hl.$find("code")
									content.append(hl)

									const applySource = source => {
										code.textContent = source.replace(/^\-\-rbxsig.+\r?\n(?:\-\-rbxassetid.+\r?\n)?/, "")
										Prism.highlightElement(code)
									}

									downloadAsset(asset.Id, "text").then(applySource)

									const select = html`<select class=btr-asset-version-select></select>`
									btn.append(select)

									fetch(`//api.roblox.com/assets/${asset.Id}/versions`, { credentials: "include" })
										.then(async resp => {
											const json = await resp.json()
											const verCount = json[0].VersionNumber

											for(let version = verCount; version > 0; version--) {
												const option = html`<option value=${version}>Version ${version}</option>`
												select.append(option)
											}

											select.firstElementChild.textContent += " (Current)"

											select.value = verCount

											const versionCache = []
											let reqCounter = 0
											select.$on("change", () => {
												if(!versionCache[select.value]) {
													versionCache[select.value] = downloadAsset(
														{ id: asset.Id, version: select.value },
														"text"
													)

													code.textContent = "loading..."
												}

												const reqId = ++reqCounter
												versionCache[select.value].then(source => {
													if(reqCounter !== reqId) return;
													applySource(source)
												})
											})
										})
								}
							}
						})
					})
				})
		}

		let observer = new MutationObserver(() => {
			if(cont.offsetParent) {
				observer.disconnect()
				observer = null
				init()
			}
		})
		observer.observe(cont, { attributes: true })
	})
}

pageInit.configureplace = function(placeId) {
	if(!settings.versionhistory.enabled) return;

	const newVersionHistory = CreateNewVersionHistory(placeId, "place")
	let jszipPromise = null

	Observer.one("#versionHistoryItems", cont => cont.replaceWith(newVersionHistory))
	.one("#versionHistory>.headline h2", header => {
		header.after(html`<a class="btn btn-secondary-sm btr-downloadAsZip" style="float:right;margin-top:4px;">Download as .zip</a>`)
	})

	document.$on("click", ".btr-downloadAsZip:not(.disabled)", e => {
		const btn = e.currentTarget
		const origText = btn.textContent
		let loadedCount = 0
		let versionCount = 0

		const placeNameInput = $("#basicSettings>input")
		const fileName = (placeNameInput ? placeNameInput.value : "place").replace(/[^\w \-.]+/g, "").replace(/ {2,}/g, " ").trim()

		btn.classList.add("disabled")
		btn.textContent = "Preparing..."

		if(!jszipPromise) jszipPromise = new Promise(resolve => execScripts(["lib/jszip.min.js"], resolve));

		jszipPromise.then(() => {
			const zip = new JSZip()
			const queue = []
			let finishedLoading = false
			let activeLoaders = 0

			function loadPage(page, cb) {
				const url = `//api.roblox.com/assets/${placeId}/versions?page=${page}`
				fetch(url, { credentials: "include" }).then(async response => {
					const json = await response.json()
					cb(json)
				})
			}

			function loadFile() {
				if(queue.length === 0) {
					if(finishedLoading) {
						if(--activeLoaders === 0) {
							btn.textContent = "Generating .zip..."

							const options = {
								type: "blob",
								compression: "DEFLATE",
								compressionOptions: { level: 6 },
								streamFiles: true
							}

							zip.generateAsync(options).then(blob => {
								btn.classList.remove("disabled")
								btn.textContent = origText
								startDownload(URL.createObjectURL(blob), `${fileName}.zip`)
							})
						}
						return;
					}

					return setTimeout(loadFile, 100);
				}

				const data = queue.shift()
				btn.textContent = `Downloading ${++loadedCount}/${versionCount}`

				function tryDownload() {
					downloadAsset({ id: placeId, version: data.VersionNumber })
						.then(buffer => {
							zip.file(`${fileName}-${data.VersionNumber}.rbxl`, buffer)
							setTimeout(loadFile, 100)
						})
						.catch(ex => {
							console.warn(ex)
							setTimeout(tryDownload, 1000)
						})
				}

				tryDownload()
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
				const maxPage = Math.floor((versionCount - 1) / json.length) + 1
				let curPage = 2

				queue.push(...json)

				function nextPage() {
					if(curPage > maxPage) {
						finishedLoading = true
						return;
					}

					loadPage(curPage++, list => {
						queue.push(...list)
						nextPage()
					})
				}

				nextPage()

				for(let i = 0; i < 5; i++) {
					activeLoaders++
					loadFile()
				}
			})
		})
	})
}

pageInit.groups = function() {
	if(!settings.groups.enabled) return;

	const rankNameCache = {}

	Observer.one("body", body => body.classList.add("btr-groups"))
	.one(["#GroupDescP pre", "#GroupDesc_Full"], (desc, fullDesc) => {
		desc.textContent = fullDesc.value
		fullDesc.remove()
	})
	.one("#ctl00_cphRoblox_GroupStatusPane_StatusDate", span => {
		const fixedDate = RobloxTime(span.textContent)
		if(fixedDate) {
			span.setAttribute("btr-timestamp", "")
			span.textContent = fixedDate.relativeFormat("zz 'ago'", startDate)
			span.title = fixedDate.format("M/D/YYYY h:mm:ss A")
		}
	})
	.one("#ctl00_cphRoblox_GroupWallPane_GroupWallUpdatePanel", wall => {
		CreateObserver(wall, { permanent: true, subtree: false })
		.all(".AlternatingItemTemplateOdd, .AlternatingItemTemplateEven", post => {
			post.classList.add("btr_comment")

			const content = post.$find(".RepeaterText")
			const postDate = post.$find(".GroupWall_PostDate")
			const postBtns = post.$find(".GroupWall_PostBtns")
			const userLink = post.$find(".UserLink")
			const dateSpan = postDate.firstElementChild

			const defBtns = Array.from(postBtns.children)
			let deleteButton = defBtns.find(x => x.textContent.indexOf("Delete") !== -1)
			let exileButton = defBtns.find(x => x.textContent.indexOf("Exile User") !== -1)

			content.prepend(userLink)
			content.append(postBtns)

			const firstBtn = postBtns.firstChild
			while(postDate.firstElementChild) firstBtn.before(postDate.firstElementChild);

			postDate.parentNode.remove()

			if(deleteButton) {
				deleteButton.textContent = "Delete"
				deleteButton.classList.add("btn-control", "btn-control-medium")
				deleteButton.style = ""

				if(deleteButton.href.startsWith("javascript")) {
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
				if(exileButton) exileButton.before(deleteButton);
				else postBtns.append(deleteButton)
			}

			if(exileButton) {
				exileButton.textContent = "Exile User"
				exileButton.classList.add("btn-control", "btn-control-medium")
				exileButton.style = ""
			} else {
				exileButton = html`<a class="btn-control btn-control-medium disabled">Exile User</a>`
				postBtns.append(exileButton)
			}

			dateSpan.classList.add("btr_groupwallpostdate")
			const fixedDate = RobloxTime(dateSpan.textContent)
			if(fixedDate) {
				dateSpan.setAttribute("btr-timestamp", "")
				dateSpan.textContent = fixedDate.relativeFormat("zz 'ago'")
				dateSpan.title = fixedDate.format("M/D/YYYY h:mm:ss A")
			}

			let groupId
			let userId
			try {
				groupId = $("#ClanInvitationData").getAttribute("data-group-id") || document.location.search.match("gid=(\\d+)")[1]
				userId = userLink.$find("a").href.match(/users\/(\d+)/)[1]
			} catch(ex) {
				// Do nothing
			}

			if(groupId && userId) {
				const span = html`<span class="btr_grouprank"></span>`
				userLink.append(span)
				
				let promise = rankNameCache[userId]
				if(!promise) promise = rankNameCache[userId] = new Promise(resolve => MESSAGING.send("getRankName", { userId, groupId }, resolve));
				
				promise.then(rankname => {
					userLink.append(html`<span class="btr_grouprank">(${rankname})</span>`)
				})
			}
		})
	})

	// TODO: Group audit timestamps (separate)
	// TODO: Group admin timestamps (separate)
}

pageInit.profile = function(userId) {
	if(!settings.profile.enabled) return;

	const left = html`
	<div class="btr-profile-col-2 btr-profile-left">
		<div class="btr-profile-about profile-about">
			<div class="container-header"><h3>About</h3></div>
			<div class="section-content">
				<div class="placeholder-status" style="display:none"></div>
				<div class="placeholder-avatar" style="display:none"></div>
				<div class="placeholder-desc" style="display:none"></div>
				<div class="placeholder-stats" style="display:none"></div>
				<div class="placeholder-footer" style="display:none"></div>
			</div>
		</div>
		<div class="placeholder-robloxbadges">
			<div class="container-header"><h3>Roblox Badges</h3></div>
			<div class="section-content">
				<div class="section-content-off btr-section-content-off">This user has no Roblox Badges</div>
			</div>
		</div>
		<div class="btr-profile-playerbadges">
			<div class="container-header"><h3>Player Badges</h3></div>
			<div class="section-content">
				<ul class="hlist">
					<div class="section-content-off btr-section-content-off">This user has no Player Badges</div>
				</ul>
			</div>
		</div>
		<div class="btr-profile-groups">
			<div class="container-header"><h3>Groups</h3></div>
			<div class="section-content">
				<ul class="hlist">
					<div class="section-content-off btr-section-content-off">This user is not in any Groups</div>
				</ul>
			</div>
		</div>
	</div>`

	const right = html`
	<div class="btr-profile-col-2 btr-profile-right">
		<div class="placeholder-games">
			<div class="container-header"><h3>Games</h3></div>
			<div class="section-content">
				<div class="section-content-off btr-section-content-off">This user has no active Games</div>
			</div>
		</div>
		<div class="placeholder-friends">
			<div class="container-header"><h3>Friends</h3></div>
			<div class="section-content">
				<div class="section-content-off btr-section-content-off">This user has no Friends</div>
			</div>
		</div>
		<div class="btr-profile-favorites">
			<div class="container-header">
				<h3>Favorite Places</h3>
				<a href="./favorites" class="btn-secondary-xs btn-fixed-width btn-more">Favorites</a>
			</div>
			<div class="section-content">
				<ul class="hlist game-cards">
					<div class="section-content-off btr-section-content-off">This user has no favorite Places</div>
				</ul>
			</div>
		</div>
	</div>`

	const bottom = html`
	<div class="btr-profile-col-1 btr-profile-bottom">
		<div class="placeholder-collections" style="display:none"></div>
		<div class="placeholder-inventory" style="display:none"></div>
	</div>`

	Observer.one("body", body => body.classList.add("btr-profile"))
	.one(".profile-container>.rbx-tabs-horizontal", cont => cont.before(left, right, bottom))
	.one(".profile-about-content", desc => {
		left.$find(".placeholder-desc").replaceWith(desc)

		desc.$find(".profile-about-content-text").classList.add("linkify")
	})
	.one(".profile-about-footer", footer => {
		left.$find(".placeholder-footer").replaceWith(footer)

		const tooltip = footer.$find(".tooltip-pastnames")
		if(tooltip) tooltip.setAttribute("data-container", "body"); // Display tooltip over side panel
	})
	.one(".profile-about .profile-social-networks", social => left.$find(".btr-profile-about .container-header").append(social))
	.one(".profile-header-top .header-caption", () => { // Wait for the first element after status
		const status = $(".profile-avatar-status")
		const statusDiv = html`<div class="btr-header-status-parent"></div>`
		left.$find(".placeholder-status").replaceWith(statusDiv)
		const statusText = html`<span class="btr-header-status-text"></span>`
		statusDiv.append(statusText)
		const statusLabel = html`<span></span>`
		statusText.append(statusLabel)

		if(!status) {
			statusText.classList.add("btr-status-offline")
			statusLabel.textContent = "Offline"
		} else {
			const statusTitle = status.getAttribute("title")

			if(status.classList.contains("icon-game")) {
				statusText.classList.add("btr-status-ingame")
				statusLabel.textContent = statusTitle

				Observer.one("script:not([src])", x => x.innerHTML.indexOf("play_placeId") !== -1, script => {
					const matches = script.innerHTML.match(/play_placeId\s*=\s*(\d+)/)
					if(matches && matches[1] !== "0") {
						const placeId = matches[1]
						let urlTitle = statusTitle.replace(/\s+/g, "-").replace(/[^\w-]/g, "")

						const anchor = html`<a href="/games/${placeId}/${urlTitle}" title="${statusTitle}"></a>`
						statusText.replaceWith(anchor)
						anchor.append(statusText)

						const onclick = `Roblox.GameLauncher.followPlayerIntoGame(${userId})`
						anchor.append(html`
						<a class="btr-header-status-follow-button" title="Follow" onclick="${onclick}">\uD83D\uDEAA</a>`)

						if(statusTitle === "In Game") {
							getProductInfo(placeId).then(data => {
								urlTitle = data.Name.replace(/\s+/g, "-").replace(/[^\w-]/g, "")
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
	})
	.one(".profile-avatar", avatar => {
		left.$find(".placeholder-avatar").replaceWith(avatar)
		avatar.$find(".container-header").remove()

		const avatarLeft = avatar.$find(".profile-avatar-left")
		const avatarRight = avatar.$find(".profile-avatar-right")

		avatar.classList.remove("section")
		avatarLeft.classList.remove("col-sm-6", "section-content")
		avatarRight.classList.remove("col-sm-6", "section-content")

		const toggleItems = html`<span class="btr-toggle-items btn-control btn-control-sm">Show Items</span>`
		avatar.$find("#UserAvatar").append(toggleItems)

		function toggleVisible(ev) {
			const visible = !avatarRight.classList.contains("visible")
			avatarRight.classList.toggle("visible", visible)

			toggleItems.textContent = visible ? "Hide Items" : "Show Items"
			ev.stopImmediatePropagation()
		}

		toggleItems.$on("click", toggleVisible)
		document.body.$on("click", ev => {
			if(!avatarRight.contains(ev.target) && avatarRight.classList.contains("visible")) toggleVisible(ev);
		})
	})
	.one(".profile-stats-container", stats => {
		stats.closest(".profile-statistics").remove()
		left.$find(".placeholder-stats").replaceWith(stats)
	})
	.one("#about>.section>.container-header>h3", x => x.textContent.indexOf("Roblox Badges") !== -1, h3 => {
		const badges = h3.parentNode.parentNode
		left.$find(".placeholder-robloxbadges").replaceWith(badges)

		badges.classList.add("btr-profile-robloxbadges")
		// badges.$find(".assets-count").remove()
		badges.$find(".btn-more").setAttribute("ng-show", badges.$find(".badge-list").children.length > 10 ? "true" : "false")
	})
	.one("#games-switcher", switcher => {
		const games = switcher.parentNode
		right.$find(".placeholder-games").replaceWith(games)

		games.classList.add("section")

		const grid = games.$find(".game-grid")
		grid.classList.add("section-content")
		grid.setAttribute("ng-cloak", "")

		const cont = html`<div id="games-switcher" class="section-content" ng-hide="isGridOn"></div>`
		switcher.classList.add("btr-remove-on-profile-load")
		switcher.style.display = "none"
		switcher.after(cont)


		const hlist = html`<ul class="hlist btr-games-list" ng-non-bindable></ul>`
		cont.append(hlist)

		const pageSize = 10
		const pager = createPager()
		hlist.after(pager)

		function select(item) {
			if(item.$getThumbnail) {
				item.$getThumbnail()
				delete item.$getThumbnail
			}

			item.classList.toggle("selected")
			hlist.$findAll(".btr-game.selected").forEach(x => x !== item && x.classList.remove("selected"))
		}

		function loadPage(page) {
			pager.setPage(page)

			hlist.children.$forEach((obj, index) => {
				obj.classList.toggle("visible", Math.floor(index / pageSize) + 1 === page)
			})

			select(hlist.children[(page - 1) * pageSize])
		}

		hlist.$on("click", ".btr-game-button", e => !e.target.matches(".btr-game-dropdown *") && select(e.currentTarget.parentNode))
		.$on("click", ".btr-toggle-description", e => {
			const btn = e.currentTarget
			const desc = btn.parentNode
			const expanded = !desc.classList.contains("expanded")

			desc.classList.toggle("expanded", expanded)
			btn.textContent = expanded ? "Show Less" : "Read More"
		})
		.$on("click", ".btr-btn-toggle-profile", () => {
			const placeId = e.currentTarget.getAttribute("data-placeid")
			getXsrfToken(token => {
				fetch("/game/toggle-profile", {
					method: "POST",
					credentials: "include",
					headers: { "X-CSRF-TOKEN": token },
					body: new URLSearchParams({ placeId, addToProfile: false })
				})
			})
		})
		.$on("click", ".btr-btn-shutdown-all", () => {
			getXsrfToken(token => {
				fetch("/Games/shutdown-all-instances", {
					method: "POST",
					credentials: "include",
					headers: { "X-CSRF-TOKEN": token },
					body: new URLSearchParams({ placeId })
				})
			})
		})

		pager.onsetpage = loadPage

		CreateObserver(switcher).all(".hlist .slide-item-container .slide-item-stats>.hlist", stats => {
			const slide = stats.closest(".slide-item-container")
			const index = +slide.getAttribute("data-index")
			const placeId = slide.$find(".slide-item-image").getAttribute("data-emblem-id")

			const title = slide.$find(".slide-item-name").textContent
			const desc = slide.$find(".slide-item-description").textContent
			const url = slide.$find(".slide-item-emblem-container>a").href
			const iconThumb = slide.$find(".slide-item-image").getAttribute("data-src")

			const item = html`
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

			item.classList.toggle("visible", (index / pageSize) < 1)
			item.$find(".btr-game-stats").append(slide.$find(".slide-item-stats>.hlist"))

			loggedInUserPromise.then(loggedInUser => {
				if(userId !== loggedInUser) return;

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
			pager.setMaxPage(Math.floor((hlist.children.length - 1) / pageSize) + 1)

			const iconRetryUrl = slide.$find(".slide-item-image").getAttribute("data-retry")

			function getThumbnail() {
				function retryUntilFinal(thumbUrl, cb) {
					fetch(thumbUrl).then(async response => {
						const json = await response.json()

						if(json && json.Final) cb(json);
						else setTimeout(retryUntilFinal, 500, thumbUrl, cb);
					})
				}

				if(iconRetryUrl) {
					retryUntilFinal(iconRetryUrl, json => {
						item.$find(".btr-game-icon").src = json.Url
					})
				}

				if(!isNaN(placeId)) {
					const thumbUrl = `/asset-thumbnail/json?assetId=${placeId}&width=768&height=432&format=png`
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

			// scrollHeight is not set before appending
			const descElem = item.$find(".btr-game-desc")
			if(descElem.scrollHeight > 170) descElem.append(html`<span class="btr-toggle-description">Read More</span>`);
		})
	})
	.one(".home-friends", friends => {
		right.$find(".placeholder-friends").replaceWith(friends)
		const hlist = friends.$find(".hlist")

		if(hlist.children.length === 9) {
			const url = `//api.roblox.com/users/${userId}/friends`
			fetch(url).then(async response => {
				const list = await response.json()
				if(list.length <= 9) return;
				const item = list[9]

				const profileUrl = `/users/${item.Id}/profile`
				const thumbUrl = `/Thumbs/Avatar.ashx?x=100&y=100&userId=${item.Id}`

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
			})
		}
	})
	.one(".favorite-games-container", favorites => favorites.remove())
	.one(".profile-collections", collections => bottom.$find(".placeholder-collections").replaceWith(collections))

	function initPlayerBadges() {
		const badges = left.$find(".btr-profile-playerbadges")
		const hlist = badges.$find(".hlist")
		const pager = createPager(true)
		hlist.after(pager)

		let isLoading = false
		let prevData = null

		function loadPage(page, cursor) {
			isLoading = true

			const url = `/users/inventory/list-json?assetTypeId=21&itemsPerPage=10&userId=${userId}&cursor=${cursor}&pageNumber=${page}`
			fetch(url).then(async response => {
				const json = await response.json()
				isLoading = false
				prevData = json

				if(json && json.IsValid) {
					pager.setPage(json.Data.Page)
					pager.togglePrev(json.Data.previousPageCursor != null)
					pager.toggleNext(json.Data.nextPageCursor != null)
					hlist.innerHTML = ""

					if(json.Data.Items.length === 0) {
						const text = `${userId === loggedInUser ? "You have" : "This user has"} no badges`
						hlist.append(html`<div class="section-content-off btr-section-content-off">${text}</div>`)
					} else {
						json.Data.Items.forEach(data => {
							hlist.append(html`
							<li class="list-item badge-item asset-item" ng-non-bindable>
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

		pager.onprevpage = () => {
			if(!isLoading && prevData && prevData.Data && prevData.Data.previousPageCursor) {
				loadPage(prevData.Data.Page - 1, prevData.Data.previousPageCursor)
			}
		}

		pager.onnextpage = () => {
			if(!isLoading && prevData && prevData.Data && prevData.Data.nextPageCursor) {
				loadPage(prevData.Data.Page + 1, prevData.Data.nextPageCursor)
			}
		}

		onDocumentReady(() => loadPage(1, ""))
	}

	function initGroups() {
		const groups = left.$find(".btr-profile-groups")
		const hlist = groups.$find(".hlist")
		hlist.setAttribute("ng-non-bindable", "")
		const pageSize = 8

		const pager = createPager()
		hlist.after(pager)

		function loadPage(page) {
			pager.setPage(page)

			hlist.children.$forEach((obj, index) => {
				obj.classList.toggle("visible", Math.floor(index / pageSize) + 1 === page)
			})
		}

		pager.onsetpage = loadPage

		onDocumentReady(() => {
			const url = `https://www.roblox.com/users/profile/playergroups-json?userId=${userId}`
			fetch(url).then(async response => {
				const json = await response.json()

				pager.setMaxPage(Math.floor((json.NumberOfGroups - 1) / pageSize) + 1)

				hlist.innerHTML = ""
				json.Groups.forEach((item, index) => {
					const parent = html`
					<li class="list-item game-card ${index < pageSize ? "visible" : ""}">
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

					const thumb = parent.$find(".card-thumb")
					thumb.$once("load", () => thumb.classList.remove("unloaded"))

					hlist.append(parent)
				})

				hlist.style["min-height"] = `${hlist.scrollHeight}px`
			})
		})
	}

	function initFavorites() { // Favorites
		const favorites = right.$find(".btr-profile-favorites")
		const hlist = favorites.$find(".hlist")
		hlist.setAttribute("ng-non-bindable", "")

		const header = favorites.$find(".container-header h3")
		header.textContent = "Favorite Places"

		const pageSize = 6
		const pager = createPager()
		hlist.after(pager)

		let isLoading = false
		let lastCategory = null

		const dropdown = html`
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

		const dropdownLabel = dropdown.$find(".rbx-selection-label")
		favorites.$find(".container-header .btn-more").after(dropdown)

		function loadPage(category, page) {
			if(isLoading) return;
			isLoading = true

			lastCategory = category

			const params = new URLSearchParams({
				userId,
				thumbWidth: 150,
				thumbHeight: 150,
				itemsPerPage: pageSize,
				assetTypeId: category,
				pageNumber: page
			}).toString()

			const url = `/users/favorites/list-json?${params}`
			fetch(url).then(async response => {
				const json = await response.json()
				isLoading = false

				if(json && json.IsValid) {
					pager.setPage(page)
					pager.setMaxPage(Math.floor((json.Data.TotalItems - 1) / pageSize) + 1)

					hlist.innerHTML = ""

					const categoryName = dropdownLabel.textContent
					header.textContent = `Favorite ${categoryName}`

					const items = json.Data.Items
					if(!items.length) {
						hlist.append(html`<div class='section-content-off btr-section-content-off'>This user has no favorite ${categoryName}</div>`)
					} else {
						items.forEach(data => {
							const item = html`
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

		dropdown.$on("click", ".dropdown-menu li", e => {
			const category = +e.currentTarget.getAttribute("data-value")
			if(isNaN(category)) return;

			loadPage(category, 1)
		})
		pager.onsetpage = page => loadPage(lastCategory, page)

		onDocumentReady(() => loadPage(9, 1))
	}

	initPlayerBadges()
	initGroups()
	initFavorites()

	onDocumentReady(() => {
		const oldContainer = $(".profile-container > .rbx-tabs-horizontal")
		if(oldContainer) {
			oldContainer.remove()
		}

		$.all(".btr-remove-on-profile-load").forEach(item => item.remove())

		if(settings.profile.embedInventoryEnabled) {
			bottom.$find(".placeholder-inventory").replaceWith(html`
			<div>
				<iframe id="btr-injected-inventory" src="/users/${userId}/inventory" scrolling="no" sandbox="allow-same-origin allow-scripts allow-top-navigation-by-user-activation">
			</div>`)
		} else {
			bottom.$find(".placeholder-inventory").remove()
		}

		/*
		document.$findAll(`.profile-container>div>div[class^="placeholder-"]`).forEach(item => {
			item.style.display = ""
			item.classList.forEach(className => className.startsWith("placeholder-") && item.classList.remove(className))
		})*/
	})
}

pageInit.avatar = function() {
}

pageInit.inventory = function() {
	if(settings.profile.embedInventoryEnabled && top.location !== self.location) {
		const embedParent = top.document.$find("#btr-injected-inventory")

		if(embedParent) {
			Observer.one("head", head => head.append(html`<base target="_top"></base>`))
			.all("script:not([src])", script => {
				const src = script.innerHTML
				if(src.indexOf("top.location=self.location") !== -1 ||
					src.indexOf("Roblox.DeveloperConsoleWarning.showWarning()") !== -1) {
					script.remove()
				}
			})
			.one("#chat-container", chat => chat.remove())
			.one("body", body => {
				body.classList.add("btr-embed")
				setInterval(() => { embedParent.style.height = `${body.scrollHeight}px` }, 100)
			})
		}
	}

	if(!settings.inventory.enabled) return;

	if(settings.inventory.inventoryTools) {
		modifyTemplate("assets-list", template => {
			const categories = ["Models", "Meshes", "Decals", "Animations", "Audio"]
			categories.forEach((v, i) => { categories[i] = `currentData.category.name == "${v}"` })

			const visibility = `staticData.isOwnPage && (${categories.join(" || ")})`

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

		let isRemoving = false
		let shiftPressed = false
		let lastPressed = null

		const updateButtons = function() {
			$(".btr-it-btn").classList.toggle("disabled", !$(".btr-it-box:checked"))
		}

		InjectJS.listen("inventoryUpdateEnd", updateButtons)

		document.$on("keyup keydown", e => { shiftPressed = e.shiftKey })
		.$on("change", ".btr-it-box", e => {
			const id = +e.currentTarget.dataset.index

			if(shiftPressed && lastPressed != null && id !== lastPressed) {
				const from = Math.min(id, lastPressed)
				const to = Math.max(id, lastPressed)
				const value = e.currentTarget.checked

				for(let i = from; i <= to; i++) {
					$(`#btr-it-box${i}`).checked = value
				}
			}

			lastPressed = id
			updateButtons()
		})
		.$on("click", ".item-card-link", () => {
			if($(".btr-it-box:checked") != null) return false;
		}).$on("click", ".btr-it-remove", () => {
			if(isRemoving) return;

			const checked = $.all(".btr-it-box:checked")
			if(!checked.length) return;

			isRemoving = true
			const items = []
			for(let i = 0; i < checked.length; i++) {
				const self = checked[i].closest(".item-card")
				const matches = self.$find(".item-card-link").href.match(/(?:\/(?:catalog|library)\/|[?&]id=)(\d+)/)

				if(matches && !isNaN(parseInt(matches[1], 10))) {
					items.push({
						obj: self,
						assetId: matches[1]
					})
				}
			}

			const validAssetTypes = [10, 13, 40, 3, 24]
			let itemsLeft = items.length

			function removeItem(index, retries) {
				const item = items[index]
				if(item) {
					const url = `//api.roblox.com/Marketplace/ProductInfo?assetId=${item.assetId}`
					fetch(url).then(async response => {
						const data = await response.json()
						if(validAssetTypes.indexOf(data.AssetTypeId) === -1)
							return console.log("Bad assetType", data);

						getXsrfToken(token => {
							fetch("/asset/delete-from-inventory", {
								method: "POST",
								credentials: "include",
								headers: { "X-CSRF-TOKEN": token },
								body: new URLSearchParams({ assetId: item.assetId })
							}).then(() => {
								item.obj.remove()
								if(--itemsLeft === 0) {
									isRemoving = false
									InjectJS.send("refreshInventory")
								}
							})
						})
					})

					setTimeout(removeItem, 250, index + 1)
				}
			}

			removeItem(0)
		})
	}
}

haveContentScriptsLoaded = true
if(hasDataLoaded) Init();
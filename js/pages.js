"use strict"

const pageInit = {}
const startDate = new Date()


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
})()

const InvalidExplorableAssetTypeIds = [1, 3, 4, 5, 6, 7, 16, 21, 22, 32, 33, 34, 35, 37]
const AnimationPreviewAssetTypeIds = [24, 32, 48, 49, 50, 51, 52, 53, 54, 55, 56]
const WearableAssetTypeIds = [2, 8, 11, 12, 17, 18, 27, 28, 29, 30, 31, 41, 42, 43, 44, 45, 46, 47]
const UniqueWearableAssetTypeIds = [2, 11, 12, 17, 18, 27, 28, 29, 30, 31] // Used in RBXPreview.js
const InvalidDownloadableAssetTypeIds = [5, 6, 7, 16, 21, 32, 33, 34, 35, 37]
const ContainerAssetTypeIds = {
	2: { typeId: 1, filter: x => x.ClassName === "ShirtGraphic", prop: "Graphic" },
	11: { typeId: 1, filter: x => x.ClassName === "Shirt", prop: "ShirtTemplate" },
	12: { typeId: 1, filter: x => x.ClassName === "Pants", prop: "PantsTemplate" },
	13: { typeId: 1, filter: x => x.ClassName === "Decal", prop: "Texture" },
	18: { typeId: 1, filter: x => x.ClassName === "Decal", prop: "Texture" },
	40: { typeId: 4, filter: x => x.ClassName === "MeshPart", prop: "MeshID" }
}


async function getProductInfo(assetId) {
	const response = await fetch(`https://api.roblox.com/marketplace/productinfo?assetId=${assetId}`)
	return response.json()
}

function downloadFile(url, type) {
	return new Promise(resolve => MESSAGING.send("downloadFile", url, resolve))
		.then(async bloburl => {
			if(!bloburl) { throw new Error("Failed to download file") }

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
	if(!(params instanceof Object)) { params = { id: params } }
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


let cachedXsrfToken
function csrfFetch(url, init) {
	if(!init) { init = {} }
	if(!init.headers) { init.headers = {} }

	if(cachedXsrfToken === undefined) {
		cachedXsrfToken = null
		Observer.one(
			"script:not([src])",
			x => x.textContent.indexOf("XsrfToken.setToken") !== -1,
			x => {
				const match = x.textContent.match(/setToken\('(.*)'\)/)
				if(match) { cachedXsrfToken = match[1] }
			}
		)
	}

	init.headers["X-CSRF-TOKEN"] = cachedXsrfToken

	let retryCount = 0

	const handle = response => {
		if(response.status === 403 && response.statusText === "XSRF Token Validation Failed") {
			if(++retryCount < 2) {
				cachedXsrfToken = init.headers["X-CSRF-TOKEN"] = response.headers.get("X-CSRF-TOKEN")
				return fetch(url, init).then(handle)
			}
		}

		return response
	}

	return fetch(url, init).then(handle)
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

function GetAssetFileType(assetTypeId, buffer) {
	if(buffer instanceof ArrayBuffer) { buffer = new Uint8Array(buffer) }

	switch(assetTypeId) {
	case 1: return "png"
	case 3:
		if(buffer) {
			const header = new TextDecoder("ascii").decode(buffer.subarray(0, 4))
			switch(header) {
			case "RIFF": return "wav"
			case "OggS": return "ogg"
			default: return "mp3"
			}
		}
		
		return "mp3"
	case 4: return "mesh"
	case 9: return (buffer && buffer[7] !== 0x21) && "rbxlx" || "rbxl"
	default: return (buffer && buffer[7] !== 0x21) && "rbxmx" || "rbxm"
	}
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
			onprevpage() { if(this.curPage > 1 && this.onsetpage) { this.onsetpage(this.curPage - 1) } },
			onnextpage() { if(this.curPage < this.maxPage && this.onsetpage) { this.onsetpage(this.curPage + 1) } },

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
				if(Number.isNaN(page)) { return }

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

function CreateNewVersionHistory(assetId, assetType) {
	const versionHistory = html`<div class="btr-versionHistory"></div>`
	const versionList = html`<ul class="btr-versionList"></ul>`
	const pager = createPager()
	const pageSize = 15

	let isBusy = false
	let actualPageSize

	async function getPage(page, target) {
		const url = `https://api.roblox.com/assets/${assetId}/versions?page=${page}`
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
		versionList.$empty()

		for(let i = itemStart; i <= itemEnd; i++) {
			const item = items[i]
			if(!item) { break }

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
					<div class="version-date">${new Date(item.Created).$format("M/D/YY hh:mm A (T)")}</div>
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

			tryGetThumbnail() */
			versionList.append(card)
		}

		const script = document.createElement("script")
		script.innerHTML = "Roblox.BootstrapWidgets.SetupPopover()"
		versionList.append(script)
	}


	function loadPage(page) {
		if(isBusy) { return }
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
			if(isBusy) { return }

			const versionId = parseInt(e.currentTarget.getAttribute("data-versionId"), 10)
			if(Number.isNaN(versionId)) { return }

			isBusy = true

			csrfFetch("https://www.roblox.com/places/revert", {
				method: "POST",
				credentials: "include",
				body: new URLSearchParams({ assetVersionID: versionId })
			}).then(response => {
				isBusy = false
				if(response.status === 200) { loadPage(1) }
			})
		})
		.$on("click", ".btr-version-download", e => {
			if(isBusy) { return }

			const version = parseInt(e.currentTarget.getAttribute("data-version"), 10)
			if(Number.isNaN(version)) { return }

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

let linkifyCounter = 0
function Linkify(elem) {
	const className = `btr-linkify-pls-${linkifyCounter++}`
	elem.classList.add(className)
	InjectJS.send("linkify", className)
}

pageInit.home = function() {
	Observer.all(".feeds .list-item .text-date-hint", span => {
		const fixedDate = RobloxTime(span.textContent.replace("|", ""))
		if(fixedDate) {
			span.setAttribute("btr-timestamp", "")
			span.textContent = fixedDate.$format("MMM D, YYYY | hh:mm A (T)")
		}
	})
}

pageInit.money = function() {
	if(settings.general.robuxToDollars) {
		Observer
			.one("#MyTransactions_tab table > tbody", table => {
				CreateObserver(table, { permanent: true, subtree: false })
					.all(".datarow", item => {
						const label = item.$find(".Amount .robux")
						if(!label) { return }
						const usd = RobuxToUSD(label.textContent.replace(/,/g, ""))
						label.after(html`<span style=color:#060;font-size:12px;font-weight:bold;>&nbsp;($${usd})</span>`)
					})
			})
			.one("#Summary_tab table > tbody", table => {
				CreateObserver(table)
					.one(".robux", label => {
						const usdLabel = html`<span style=color:#060;font-size:12px;font-weight:bold;></span>`
						label.after(usdLabel)

						const update = () => {
							const usd = RobuxToUSD(label.textContent.replace(/,/g, ""))
							usdLabel.textContent = ` ($${usd})`
						}

						new MutationObserver(update).observe(label, { childList: true })
						update()
					})
					.all("td.Credit", label => {
						const update = () => {
							if(label.$find("span")) { return }
							const text = label.textContent.replace(/,/g, "").trim()
							if(!text) { return }
							const usd = RobuxToUSD(text)
							label.append(html`<span style=color:#060;font-size:12px;font-weight:bold;>&nbsp;($${usd})</span>`)
						}

						new MutationObserver(update).observe(label, { childList: true })
						update()
					})
			})
	}
}

pageInit.messages = function() {
	Observer.one(".roblox-messages-container", container => {
		CreateObserver(container, { permanent: true })
			.all(".messageDivider", row => {
				const span = row.$find(".message-summary-date")
				const fixedDate = RobloxTime(span.textContent.replace("|", ""))
				if(fixedDate) {
					span.setAttribute("btr-timestamp", "")
					span.textContent = fixedDate.$format("MMM D, YYYY | hh:mm A (T)")
				}
			})
			.all(".roblox-message-body", msg => {
				const span = msg.$find(".subject .date")
				const fixedDate = RobloxTime(span.textContent.replace("|", ""))
				if(fixedDate) {
					span.setAttribute("btr-timestamp", "")
					span.textContent = fixedDate.$format("MMM D, YYYY | hh:mm A (T)")
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
	})
}

pageInit.develop = function() {
	Observer.one("#MyCreationsTab", tab => {
		const observer = CreateObserver(tab, { permanent: true })

		observer.all(".item-table[data-in-showcase][data-type='universes']", table => {
			table.$find(".details-table>tbody").append(html`<tr><td><a class='btr-showcase-status'/></td></tr>`)

			table.$on("click", ".btr-showcase-status", () => {
				const placeId = parseInt(table.getAttribute("data-rootplace-id"), 10)
				const isVisible = table.getAttribute("data-in-showcase").toLowerCase() === "true"

				if(Number.isNaN(placeId)) { return }

				csrfFetch("https://www.roblox.com/game/toggle-profile", {
					method: "POST",
					credentials: "include",
					body: new URLSearchParams({ placeId, addToProfile: !isVisible })
				}).then(async response => {
					const json = await response.json()
					if(json.isValid) {
						table.setAttribute("data-in-showcase", json.data.inShowcase)
					}
				})
			})
		})
	})
}

pageInit.itemdetails = function(assetId) {
	if(!settings.itemdetails.enabled) { return }

	if(settings.general.robuxToDollars) {
		Observer
			.one(".icon-robux-price-container .text-robux-lg", label => {
				const usd = RobuxToUSD(label.textContent.replace(/,/g, ""))
				label.after(
					html`<span class=text-robux-lg>&nbsp;($${usd})</span>`
				)
			})
			.one(".recommended-items .item-card-price .text-robux", label => {
				label.style.display = "inline"
				label.textContent += ` ($\{{::(item.Item.Price*${DOLLARS_PER_ROBUX_RATIO})|number:2}})`
				label.title = "R$ " + label.textContent
			})
			.one("#item-average-price", label => {
				const observer = new MutationObserver(() => {
					observer.disconnect()
					const usd = RobuxToUSD(label.textContent.replace(/,/g, ""))
					label.textContent += ` ($${usd})`
				})

				observer.observe(label, { childList: true })
			})
			.one(".resellers", resellers => {
				CreateObserver(resellers, { permanent: true })
					.all(".list-item", item => {
						const label = item.$find(".reseller-price-container .text-robux")
						const usd = RobuxToUSD(label.textContent.replace(/,/g, ""))
						label.textContent += ` ($${usd})`
					})
			})
	}

	Observer
		.one("#AjaxCommentsContainer .comments", cont => {
			CreateObserver(cont, { permanent: true, subtree: false })
				.all(".comment-item", comment => {
					const span = comment.$find(".text-date-hint")
					const fixedDate = RobloxTime(span.textContent.replace("|", ""))
					if(fixedDate) {
						span.setAttribute("btr-timestamp", "")
						span.textContent = fixedDate.$format("MMM D, YYYY | hh:mm A (T)")
					}
				})
		})
		.one(".item-type-field-container .field-content", typeLabel => {
			const assetTypeName = typeLabel.textContent.trim()
			const assetTypeId = AssetTypeIds.indexOf(assetTypeName)
			if(assetTypeId === -1) { return }

			const canAccessPromise = new Promise(resolve => {
				if(assetTypeId !== 10) { return resolve(true) }
				Observer.one("#item-container", itemCont => {
					if(itemCont.dataset.userassetId) { return resolve(true) }
					Observer.one(".price-container .action-button > *", btn => {
						resolve(btn.nodeName === "BUTTON" && !btn.disabled)
					})
				})
			})

			const gCPCache = {}
			const getCachedProductInfo = id => (gCPCache[id] = gCPCache[id] || getProductInfo(id))

			execScripts(["js/RBXParser.js", "js/AssetCache.js"], () => {
				const previewAnim = settings.itemdetails.animationPreview && AnimationPreviewAssetTypeIds.indexOf(assetTypeId) !== -1
				const previewAsset = true && WearableAssetTypeIds.indexOf(assetTypeId) !== -1

				if(previewAnim || previewAsset || assetTypeId === 32) {
					execScripts(["js/RBXPreview.js"], () => {
						let preview
						let container

						const toggleEnabled = enabled => {
							const oldCont = $("#AssetThumbnail").parentNode
							if(enabled) {
								oldCont.style.display = "none"
								oldCont.after(container)
							} else {
								oldCont.style.display = ""
								container.remove()
							}

							preview.setEnabled(enabled)
						}

						const loadPreview = () => {
							if(preview) { return }

							preview = new RBXPreview.AvatarPreviewer()
							container = html`
							<div class="item-thumbnail-container btr-preview-container">
								<div class="btr-thumb-btn-container">
									<div class="btr-thumb-btn rbx-btn-control-sm btr-hats-btn"><span class="btr-icon-hat"></span></div>
									<div class="btr-thumb-btn rbx-btn-control-sm btr-body-btn"><span class="btr-icon-body"></span></div>
									<div class="btr-thumb-btn rbx-btn-control-sm btr-preview-btn checked"><span class="btr-icon-preview"></span></div>
								</div>
							</div>`

							document.$on("click", ".btr-hats-btn", ev => {
								const self = ev.currentTarget
								const disabled = !self.classList.contains("checked")
								self.classList.toggle("checked", disabled)

								preview.setAccessoriesVisible(!disabled)
							})
							
							document.$on("click", ".btr-body-btn", ev => {
								const self = ev.currentTarget
								const disabled = !self.classList.contains("checked")
								self.classList.toggle("checked", disabled)

								preview.setPackagesVisible(!disabled)
							})

							container.append(preview.container)

							Observer.one("#AssetThumbnail", thumb => {
								thumb.classList.add("btr-preview-enabled")
								thumb.append(html`<div class="btr-thumb-btn-container">
									<div class="btr-thumb-btn rbx-btn-control-sm btr-preview-btn"><span class="btr-icon-preview"></span></div>
								</div>`)
							})

							document.$on("click", ".btr-preview-btn", ev => {
								const self = ev.currentTarget
								const checked = !self.classList.contains("checked")

								toggleEnabled(checked)
							})
						}


						if(previewAnim || previewAsset) {
							const doPreview = (id, typeId) => {
								const isAnim = AnimationPreviewAssetTypeIds.indexOf(typeId) !== -1
								const isAsset = WearableAssetTypeIds.indexOf(typeId) !== -1
								if(!isAnim && !isAsset && typeId !== 32) { return }
	
								if(typeId === 32) {
									AssetCache.loadText(id, text => text.split(";").forEach(itemId => {
										getCachedProductInfo(itemId).then(json => doPreview(itemId, json.AssetTypeId))
									}))
									return
								}
	
								if(!preview) {
									loadPreview()
	
									if(previewAnim && settings.itemdetails.animationPreviewAutoLoad) {
										onDocumentReady(() => toggleEnabled(true))
									}
								}
	
								if(isAnim) {
									preview.disableDefaultAnimations = true
	
									if(typeId === 24) {
										preview.onInit(() => {
											preview.addAnimation(String(id), id)
										})
									} else {
										preview.onInit(() => {
											AssetCache.loadModel(id, model => {
												const folder = model.find(x => x.ClassName === "Folder" && x.Name === "R15Anim")
												if(!folder) { return }
	
												folder.Children.filter(x => x.ClassName === "StringValue").forEach(value => {
													const animName = value.Name
	
													value.Children.filter(x => x.ClassName === "Animation").forEach((anim, i) => {
														const name = animName + (i === 0 ? "" : `_${i + 1}`)
														const animId = RBXParser.parseContentUrl(anim.AnimationId)
														if(!animId) { return }
	
														preview.addAnimation(name, animId)
													})
												})
											})
										})
									}
								} else if(isAsset) {
									preview.addAsset(id, typeId, { previewTarget: true })
								}
							}
	
							doPreview(assetId, assetTypeId)
						}
					})
				}

				canAccessPromise.then(canAccess => {
					if(!canAccess) { return }

					if(settings.itemdetails.explorerButton && InvalidExplorableAssetTypeIds.indexOf(assetTypeId) === -1) {
						let explorerInitialized = false

						const explorerPromise = new Promise(resolve => {
							execScripts(["js/Explorer.js"], () => resolve(new Explorer()))
						})

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

						document.body.$on("click", ".btr-explorer-parent", ev => {
							ev.stopImmediatePropagation()
						})

						CreateObserver(btn, { subtree: false }).all(".popover", popover => {
							explorerPromise.then(explorer => {
								if(!explorerInitialized) {
									explorerInitialized = true

									if(assetTypeId === 32) { // Package, I disabled package exploring elsewhere
										AssetCache.loadText(assetId, text => text.split(";").forEach(id => {
											AssetCache.loadModel(id, model => explorer.addModel(id.toString(), model))
										}))
									} else {
										AssetCache.loadModel(assetId, model => explorer.addModel("Main", model))
									}
								}

								popover.$find(".btr-explorer-parent").replaceWith(explorer.element)

								const popLeft = explorer.element.getBoundingClientRect().right + 276 >= document.documentElement.clientWidth
								explorer.element.$find(".btr-properties").classList.toggle("left", popLeft)
							})
						})
					}

					if(settings.itemdetails.downloadButton && InvalidDownloadableAssetTypeIds.indexOf(assetTypeId) === -1) {
						const btn = html`<a class="btr-download-button"><div class="btr-icon-download"></div></a>`

						Observer.one("#item-container > .section-content", cont => {
							cont.append(btn)
							cont.parentNode.classList.add("btr-download-btn-shown")
						})

						const doNamedDownload = event => {
							event.preventDefault()

							downloadAsset(assetId, "arraybuffer").then(ab => {
								const blobUrl = URL.createObjectURL(new Blob([ab]))

								const title = $("#item-container .item-name-container h2")
								let fileName = title
									? title.textContent.trim().replace(/[^a-zA-Z0-9_]+/g, "-")
									: new URL(btn.href).pathname

								fileName += `.${GetAssetFileType(assetTypeId, ab)}`

								startDownload(blobUrl, fileName)
								URL.revokeObjectURL(blobUrl)
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
							if(!inst) { return }
		
							const actId = RBXParser.parseContentUrl(inst[assetTypeContainer.prop])
							if(!actId) { return }
		
							btn.href = `/catalog/${actId}`
							btn.classList.remove("disabled")
						})
					}
				})

				if(settings.itemdetails.imageBackgrounds && (assetTypeId === 1 || assetTypeId === 13)) {
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

							if(prev) { prev.classList.remove("selected") }
							ev.currentTarget.classList.add("selected")

							thumb.dataset.btrBg = color
							localStorage["btr-item-thumb-bg"] = color
						})
							.$on("mouseenter", ".btr-bg-btn", ev => {
								thumb.dataset.btrBg = ev.currentTarget.dataset.color
							})
							.$on("mouseleave", ".btr-bg-btn", () => {
								thumb.dataset.btrBg = localStorage["btr-item-thumb-bg"]
							})


						const selectedBg = localStorage["btr-item-thumb-bg"] || "white"
						btns.$find(`[data-color="${selectedBg}"]`).click()
					})
				}

				if(settings.itemdetails.whiteDecalThumbnailFix && assetTypeId === 13) {
					// const transparentTexture = "https://t6.rbxcdn.com/3707fe58b613498a0f1fc7d11faeccf3"

					Observer.one("#AssetThumbnail .thumbnail-span img", img => {
						// if(img.src !== transparentTexture) return;

						AssetCache.loadModel(assetId, model => {
							const decal = model.find(x => x.ClassName === "Decal")
							if(!decal) { return }

							const imgId = RBXParser.parseContentUrl(decal.Texture)
							if(!imgId) { return }

							const preload = new Image()
							preload.src = `https://assetgame.roblox.com/asset/?id=${imgId}`
							preload.onload = () => {
								preload.onload = null
								img.src = preload.src
							}
						})
					})
				}

				if(settings.itemdetails.thisPackageContains && assetTypeId === 32) {
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

							getCachedProductInfo(childId).then(data => {
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
								creator.href = `https://www.roblox.com/users/${data.Creator.Id}/profile`
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
	if(!settings.gamedetails.enabled) { return }

	const newContainer = html`<div class="col-xs-12 btr-game-main-container section-content">`

	if(settings.general.robuxToDollars) {
		Observer
			.one("#rbx-passes-container", passes => {
				CreateObserver(passes, { permanent: true, subtree: false })
					.all(".list-item", item => {
						const label = item.$find(".text-robux")
						const usd = RobuxToUSD(label.textContent.replace(/,/g, ""))
						label.after(html`<span class=text-robux style=float:right>&nbsp;($${usd})</span>`)
					})
			})
			.one("#rbx-gear-container", gears => {
				CreateObserver(gears, { permanent: true, subtree: false })
					.all(".list-item", item => {
						const label = item.$find(".text-robux")
						const usd = RobuxToUSD(label.textContent.replace(/,/g, ""))
						label.after(html`<span class=text-robux style=float:right>&nbsp;($${usd})</span>`)
					})
			})
	}

	Observer
		.one("body", body => {
			body.classList.add("btr-gamedetails")
		})
		.one(["#tab-about", "#tab-game-instances"], (aboutTab, gameTab) => {
			aboutTab.$find(".text-lead").textContent = "Recommended"

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
			CreateObserver(cont, { subtree: false }).all(".tab-pane:not(#about)", pane => {
				pane.classList.add("section-content")
			})
		})
		.one(".badge-container", badges => {
			badges.classList.add("col-xs-12", "btr-badges-container")
			newContainer.after(badges)

			const isOwned = {}

			CreateObserver(badges).all(".badge-row .badge-stats-container", stats => {
				const row = stats.closest(".badge-row")

				const url = row.$find(".badge-image>a").href
				const label = row.$find(".badge-name")
				label.innerHTML = htmlstring`<a href="${url}">${label.textContent}</a>`
				row.$find("p.para-overflow").classList.remove("para-overflow")

				if(settings.gamedetails.showBadgeOwned) {
					const match = url.match(/catalog\/(\d+)\//)
					if(!match) { return }

					const badgeId = +match[1]

					if(badgeId in isOwned) {
						row.classList.toggle("btr-notowned", !isOwned[badgeId])
					} else {
						isOwned[badgeId] = row
					}
				}
			})

			if(settings.gamedetails.showBadgeOwned) {
				const url = `https://www.roblox.com/badges/list-badges-for-place?placeId=${placeId}`
				fetch(url, { credentials: "include" }).then(async response => {
					const json = await response.json()

					json.GameBadges.forEach(data => {
						const elem = isOwned[data.BadgeAssetId]
						if(elem) {
							elem.classList.toggle("btr-notowned", !data.IsOwned)
						} else {
							isOwned[data.BadgeAssetId] = data.IsOwned
						}
					})
				})
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
				const label = stat.$find(".text-lead")
				label.title = new Date(data.Updated).$format("M/D/YYYY h:mm:ss A (T)")
				label.textContent = `${$.dateSince(data.Updated, serverDate)} ago`
			}

			xhr.send()
		})
		.one(".rbx-visit-button-closed, #MultiplayerVisitButton", btn => {
			if(btn.classList.contains("rbx-visit-button-closed")) { return }

			const rootPlaceId = btn.getAttribute("placeid")
			if(placeId === rootPlaceId) { return }

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
						span.textContent = fixedDate.$format("MMM D, YYYY | hh:mm A (T)")
					}
				})
		})

	onDocumentReady(() => {
		const placeEdit = $("#game-context-menu .dropdown-menu .VisitButtonEditGLI")
		if(placeEdit) {
			placeEdit.parentNode.parentNode.append(
				html`<li><a class=btr-download-place><div>Download</div></a></li>`
			)

			document.$on("click", ".btr-download-place", () => {
				downloadAsset(placeId, "arraybuffer").then(ab => {
					const blobUrl = URL.createObjectURL(new Blob([ab]))

					const splitPath = window.location.pathname.split("/")
					const type = GetAssetFileType(9, ab)

					startDownload(blobUrl, `${splitPath[splitPath.length - 1]}.${type}`)
					URL.revokeObjectURL(blobUrl)
				})
			})
		}
	})
}

pageInit.catalog = function() {
	if(!settings.catalog.enabled) { return }
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

		if(self.dataset.btrHoverInit === "true") { return }
		self.dataset.btrHoverInit = "true"

		const matches = self.closest("a").href.match(/\/catalog\/(\d+)/)
		if(!matches) { return }

		const assetId = matches[1]
		let promise = productCache[assetId]
		if(!promise) { promise = productCache[assetId] = getProductInfo(assetId) }

		promise.then(data => {
			const updated = `${$.dateSince(data.Updated, startDate)} ago`
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

pageInit.placeconfig = function(placeId) {
	if(!settings.versionhistory.enabled) { return }

	const newVersionHistory = CreateNewVersionHistory(placeId, "place")

	Observer
		.one("#versionHistoryItems", cont => cont.replaceWith(newVersionHistory))
		.one("#versionHistory>.headline h2", header => {
			header.after(html`<a class="btn btn-secondary-sm btr-downloadAsZip" style="float:right;margin-top:4px;">Download as .zip</a>`)
		})

	document.$on("click", ".btr-downloadAsZip:not(.disabled)", e => {
		const btn = e.currentTarget
		const origText = btn.textContent

		const placeNameInput = $("#basicSettings>input")
		const fileName = (placeNameInput ? placeNameInput.value : "place").replace(/[^\w \-.]+/g, "").replace(/ {2,}/g, " ").trim()

		btn.classList.add("disabled")
		btn.textContent = "Loading versions..."

		const files = []
		const centralDirectory = []
		let numFiles = 0
		let fileOffset = 0
		let centralLength = 0

		let totalVersions
		let nextVersion = 1
		let loadersAlive = 5

		const crcTable = []
		for(let i = 0; i < 256; i++) {
			let n = i
			for(let j = 0; j < 8; j++) { n = n & 1 ? (n >>> 1) ^ 0xEDB88320 : (n >>> 1) }

			crcTable[i] = n
		}

		const crc32 = buffer => {
			let crc = -1
			
			for(let i = 0, l = buffer.byteLength; i < l; i++) {
				crc = (crc >>> 8) ^ crcTable[(crc ^ buffer[i]) & 0xFF]
			}

			return ~crc
		}

		const loadFile = () => {
			if(nextVersion > totalVersions) {
				if(--loadersAlive === 0) {
					btn.textContent = "Generating file..."

					const eoc = new Uint8Array(22)
					const eview = new DataView(eoc.buffer)
					eview.setUint32(0, 0x06054b50, true)
					eview.setUint16(8, numFiles, true)
					eview.setUint16(10, numFiles, true)
					eview.setUint32(12, centralLength, true)
					eview.setUint32(16, fileOffset, true)

					const blob = new Blob([...files, ...centralDirectory, eoc])
					const bloburl = URL.createObjectURL(blob)

					btn.classList.remove("disabled")
					btn.textContent = origText

					startDownload(bloburl, `${fileName}.zip`)
				}
				return
			}

			const version = nextVersion++
			let retryTime = 1000

			const tryDownload = () => {
				downloadAsset({ id: placeId, version }).then(file => {
					const nameStr = `${fileName}-${version}.rbxl`
					const name = new TextEncoder().encode(nameStr)

					const date = new Date()
					const modTime = (((date.getHours() << 6) | date.getMinutes()) << 5) | date.getSeconds() / 2
					const modDate = ((((date.getFullYear() - 1980) << 4) | (date.getMonth() + 1)) << 5) | date.getDate()

					const cfile = file
					const crc = crc32(new Uint8Array(file))

					const header = new Uint8Array(30 + name.byteLength)
					const hview = new DataView(header.buffer)
					hview.setUint32(0, 0x04034b50, true)
					hview.setUint32(4, 0x08080014, true)
					hview.setUint16(10, modTime, true)
					hview.setUint16(12, modDate, true)
					hview.setUint32(14, crc, true)
					hview.setUint32(18, cfile.byteLength, true)
					hview.setUint32(22, file.byteLength, true)
					hview.setUint16(26, name.byteLength, true)
					header.set(name, 30)

					const footer = new Uint8Array(16)
					const fview = new DataView(footer.buffer)
					fview.setUint32(0, 0x08074b50, true)
					fview.setUint32(4, crc, true)
					fview.setUint32(8, cfile.byteLength, true)
					fview.setUint32(12, file.byteLength, true)

					const central = new Uint8Array(46 + name.byteLength)
					const cview = new DataView(central.buffer)
					cview.setUint32(0, 0x02014b50, true)
					cview.setUint16(4, 0x0014, true)
					central.set(header.subarray(4, 30), 6)
					cview.setUint32(42, fileOffset, true)
					central.set(name, 46)

					files.push(header.buffer, cfile, footer.buffer)
					centralDirectory.push(central.buffer)
					fileOffset += header.byteLength + cfile.byteLength + footer.byteLength
					centralLength += central.byteLength

					numFiles++
					btn.textContent = `Downloading ${numFiles}/${totalVersions}`

					setTimeout(loadFile, 100)
				}).catch(ex => {
					console.error(ex)
					setTimeout(tryDownload, retryTime)
					retryTime *= 1.5
				})
			}
			tryDownload()
		}

		const url = `https://api.roblox.com/assets/${placeId}/versions`
		fetch(url, { credentials: "include" }).then(async resp => {
			let json
			try { json = await resp.json() }
			catch(ex) { console.warn(ex) }

			if(!json || !json.length) {
				btn.textContent = "Failed..."

				setTimeout(() => {
					btn.classList.remove("disabled")
					btn.textContent = origText
				}, 2000)
				
				return
			}
			
			totalVersions = json[0].VersionNumber
	
			for(let i = 0, l = loadersAlive; i < l; i++) {
				loadFile()
			}
		})
	})
}

pageInit.groupadmin = function() {
	if(settings.general.robuxToDollars) {
		Observer
			.one("#GroupTitle .robux", label => {
				const usd = RobuxToUSD(label.textContent.replace(/,/g, ""))
				label.after(html`<span style=color:#060;font-size:12px;font-weight:bold;>&nbsp;($${usd})</span>`)
			})
			.one("#revenue .summary .summary-container", summary => {
				CreateObserver(summary, { permanent: true, subtree: false })
					.all(".columns-container", cont => {
						cont.$findAll(".robux").forEach(label => {
							const usd = RobuxToUSD(label.textContent.replace(/,/g, ""))
							label.after(html`<span style=color:#060;font-size:12px;font-weight:bold;>&nbsp;($${usd})</span>`)
						})

						cont.$findAll("td.credit").forEach(label => {
							if(!label.textContent) { return }
							const usd = RobuxToUSD(label.textContent.replace(/,/g, ""))
							label.append(html`<span style=color:#060;font-size:12px;font-weight:bold;>&nbsp;($${usd})</span>`)
						})
					})
			})
			.one("#revenue .line-item tbody", table => {
				CreateObserver(table, { permanent: true, subtree: false })
					.all("tr", row => {
						const label = row.$find(".robux")
						if(!label) { return }
						const usd = RobuxToUSD(label.textContent.replace(/,/g, ""))
						label.after(html`<span style=color:#060;font-size:12px;font-weight:bold;>&nbsp;($${usd})</span>`)
					})
			})
	}

	Observer.one("#JoinRequests", requests => {
		CreateObserver(requests, { permanent: true, subtree: false })
			.all("#JoinRequestsList", list => {
				list.$findAll("tbody > tr > td:nth-child(3)").forEach(label => {
					const fixedDate = RobloxTime(label.textContent)
					if(!fixedDate) { return }
					label.setAttribute("btr-timestamp", "")
					label.textContent = `${$.dateSince(fixedDate, new Date())} ago`
					label.title = fixedDate.$format("M/D/YYYY h:mm:ss A (T)")
				})
			})
	})
}

pageInit.groups = function() {
	if(settings.general.robuxToDollars) {
		Observer.one("#ctl00_cphRoblox_rbxGroupFundsPane_GroupFunds .robux", label => {
			label.style.display = "inline-block" // To fix whitespace
			const usd = RobuxToUSD(label.textContent.replace(/,/g, ""))
			label.after(html`<span style=color:#060;font-size:12px;font-weight:bold;>&nbsp;($${usd})</span>`)
		})
	}

	if(!settings.groups.enabled) { return }
	const notInGroup = window.location.pathname.search(/^\/groups\/group.aspx/i) !== -1
	const rankNameCache = {}

	Observer
		.one("body", body => body.classList.add("btr-groups"))
		.one(["#GroupDescP pre", "#GroupDesc_Full"], (desc, fullDesc) => {
			desc.textContent = fullDesc.value
			fullDesc.remove()
		})
		.one("#ctl00_cphRoblox_GroupStatusPane_StatusDate", span => {
			const fixedDate = RobloxTime(span.textContent)
			if(fixedDate) {
				span.setAttribute("btr-timestamp", "")
				span.textContent = `${$.dateSince(fixedDate, startDate)} ago`
				span.title = fixedDate.$format("M/D/YYYY h:mm:ss A (T)")
			}
		})
		.one("#ctl00_cphRoblox_GroupWallPane_GroupWallUpdatePanel", wall => {
			const script = Array.from($.all("script")).find(x => x.innerHTML.indexOf("Roblox.ExileModal.InitializeGlobalVars") !== -1)
			const groupId = script ? parseInt(script.innerHTML.replace(/^.*InitializeGlobalVars\(\d+, (\d+).*$/m, "$1"), 10) : NaN

			CreateObserver(wall, { permanent: true, subtree: false })
				.all(".AlternatingItemTemplateOdd, .AlternatingItemTemplateEven", post => {
					post.classList.add("btr-comment")

					const content = post.$find(".RepeaterText")
					const postDate = post.$find(".GroupWall_PostDate")
					const postBtns = post.$find(".GroupWall_PostBtns")
					const userLink = post.$find(".UserLink")
					const dateSpan = postDate.firstElementChild

					const defBtns = Array.from(postBtns.children)
					const deleteButton = defBtns.find(x => x.textContent.indexOf("Delete") !== -1)
					const exileButton = defBtns.find(x => x.textContent.indexOf("Exile User") !== -1)

					content.prepend(userLink)
					content.append(postBtns)

					const firstBtn = postBtns.firstChild
					while(postDate.firstElementChild) { firstBtn.before(postDate.firstElementChild) }

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
					} else if(!notInGroup) {
						const btn = html`<a class="btn-control btn-control-medium disabled">Delete</a>`
						if(exileButton) { exileButton.before(btn) }
						else { postBtns.append(btn) }
					}

					if(exileButton) {
						exileButton.textContent = "Exile User"
						exileButton.classList.add("btn-control", "btn-control-medium")
						exileButton.style = ""
					} else if(!notInGroup) {
						const btn = html`<a class="btn-control btn-control-medium disabled">Exile User</a>`
						postBtns.append(btn)
					}

					dateSpan.classList.add("btr-groupwallpostdate")
					const fixedDate = RobloxTime(dateSpan.textContent)
					if(fixedDate) {
						dateSpan.setAttribute("btr-timestamp", "")
						dateSpan.textContent = `${$.dateSince(fixedDate)} ago`
						dateSpan.title = fixedDate.$format("M/D/YYYY h:mm:ss A (T)")
					}

					const anchor = userLink.$find("a")
					const userId = anchor ? parseInt(anchor.href.replace(/^.*\/users\/(\d+)\/.*$/, "$1"), 10) : NaN
					
					if(Number.isSafeInteger(groupId) && Number.isSafeInteger(userId)) {
						const span = html`<span class="btr-grouprank"></span>`
						userLink.append(span)
						
						let promise = rankNameCache[userId]
						if(!promise) { promise = rankNameCache[userId] = new Promise(resolve => MESSAGING.send("getRankName", { userId, groupId }, resolve)) }
						
						promise.then(rankname => {
							userLink.append(html`<span class="btr-grouprank">(${rankname})</span>`)
						})
					}
				})
		})
	
	if(settings.groups.expandGroupList) {
		Observer.one("script:not([src])",
			x => x.innerHTML.indexOf(`'windowDisplay': 8,`) !== -1,
			x => {
				x.innerHTML = x.innerHTML.replace(/'windowDisplay': 8/, "'windowDisplay': 16")

				setTimeout(() => {
					const outer = $(".CarouselPager .content-outer")
					const inner = $(".CarouselPager .content-inner")
					if(outer && inner && outer.clientHeight >= inner.clientHeight) {
						outer.style.height = "auto"
						inner.style.position = "relative"
					}
				}, 0)
			}
		)
	}

	// TODO: Group audit timestamps (separate)
	// TODO: Group admin timestamps (separate)
}

pageInit.profile = function(userId) {
	if(!settings.profile.enabled) { return }

	const left = html`
	<div class="btr-profile-left">
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
	<div class="btr-profile-right">
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
	<div class="btr-profile-bottom">
		<div class="placeholder-collections" style="display:none"></div>
		<div class="placeholder-inventory" style="display:none"></div>
	</div>`

	const gamesRequest = fetch(`https://www.roblox.com/users/profile/playergames-json?userId=${userId}`)
		.then(async response => (await response.json()).Games)
	
	Observer
		.one("body", body => body.classList.add("btr-profile"))
		.one(".profile-container .rbx-tabs-horizontal", cont => {
			cont.before(left, right, bottom)
			cont.parentNode.classList.add("btr-profile-container")
			cont.setAttribute("ng-if", "false") // Let's make angular clean it up :)
		})
		.one(".profile-about-content", desc => {
			left.$find(".placeholder-desc").replaceWith(desc)

			desc.$find(".profile-about-content-text").classList.add("linkify")
		})
		.one(".profile-about-footer", footer => {
			left.$find(".placeholder-footer").replaceWith(footer)

			const tooltip = footer.$find(".tooltip-pastnames")
			if(tooltip) { tooltip.setAttribute("data-container", "body") } // Display tooltip over side panel
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
				if(!avatarRight.contains(ev.target) && avatarRight.classList.contains("visible")) { toggleVisible(ev) }
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

				$.each(hlist.children, (obj, index) => {
					obj.classList.toggle("visible", Math.floor(index / pageSize) + 1 === page)
				})

				select(hlist.children[(page - 1) * pageSize])
			}

			hlist
				.$on("click", ".btr-game-button", e => !e.target.matches(".btr-game-dropdown *") && select(e.currentTarget.parentNode))
				.$on("click", ".btr-toggle-description", e => {
					const btn = e.currentTarget
					const desc = btn.parentNode
					const expanded = !desc.classList.contains("expanded")

					desc.classList.toggle("expanded", expanded)
					btn.textContent = expanded ? "Show Less" : "Read More"
				})
				.$on("click", ".btr-btn-toggle-profile", () => {
					const placeId = e.currentTarget.getAttribute("data-placeid")
					csrfFetch("https://www.roblox.com/game/toggle-profile", {
						method: "POST",
						credentials: "include",
						body: new URLSearchParams({ placeId, addToProfile: false })
					})
				})
				.$on("click", ".btr-btn-shutdown-all", () => {
					csrfFetch("https://www.roblox.com/Games/shutdown-all-instances", {
						method: "POST",
						credentials: "include",
						body: new URLSearchParams({ placeId })
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

				const gamePromise = gamesRequest.then(list => list.find(x => +x.PlaceID === +placeId))

				const item = html`
				<li class="btr-game">
					<div class="btr-game-button">
						<span class="btr-game-title">${title}</span>
					</div>
					<div class="btr-game-content">
						<div class="btr-game-thumb-container">
							<a href="${url}"><img class="btr-game-thumb"></a>
							<a href="${url}"><img class="btr-game-icon" src="${iconThumb}"></a>
						</div>
						<div class="btr-game-desc">
							<span class="btr-game-desc-content">${desc}</span>
						</div>
						<div class="btr-game-info">
							<div class="btr-game-playbutton-container">
								<div class="btr-game-playbutton VisitButton VisitButtonPlayGLI btn-primary-lg"
									placeid="${placeId}" data-action="play" data-is-membership-level-ok="true">
									Play
								</div>
							</div>
							<div class="btr-game-stats"></div>
						</div>
					</div>
				</li>`

				item.classList.toggle("visible", (index / pageSize) < 1)
				item.$find(".btr-game-stats").append(slide.$find(".slide-item-stats>.hlist"))

				loggedInUserPromise.then(loggedInUser => {
					if(userId !== loggedInUser) { return }

					const dropdown = html`
					<span class="btr-game-dropdown">
						<a class="rbx-menu-item" data-toggle="popover" data-container="body" 
							data-bind="btr-placedrop-${placeId}" style="float:right;margin-top:-4px;">
							<span class="icon-more"></span>
						</a>
						<div data-toggle="btr-placedrop-${placeId}" style="display:none">
							<ul class="dropdown-menu" role="menu">
								<li><a onclick=Roblox.GameLauncher.editGameInStudio(${placeId})><div>Edit</div></a></li>
								<li><a href="/places/${placeId}/stats"><div>Developer Stats</div></a></li>
								<li><a href="/places/${placeId}/update"><div>Configure this Place</div></a></li>
								<li><a class="btr-btn-toggle-profile" data-placeid="${placeId}"><div>Remove from Profile</div></a></li>
								<li><a class="btr-btn-shutdown-all" data-placeid="${placeId}"><div>Shut Down All Instances</div></a></li>
							</ul>
						</div>
					</span>`

					item.$find(".btr-game-button").append(dropdown)

					gamePromise.then(data => {
						if(!data) { return }

						dropdown.$find(".dropdown-menu").children[2].after(
							html`<li><a href=/universes/configure?id=${data.UniverseID}><div>Configure this Game</div></a></li>`
						)
					})
				})

				hlist.append(item)
				pager.setMaxPage(Math.floor((hlist.children.length - 1) / pageSize) + 1)

				const iconRetryUrl = slide.$find(".slide-item-image").getAttribute("data-retry")

				function getThumbnail() {
					function retryUntilFinal(thumbUrl, cb) {
						fetch(thumbUrl).then(async response => {
							const json = await response.json()

							if(json && json.Final) { cb(json) }
							else { setTimeout(retryUntilFinal, 500, thumbUrl, cb) }
						})
					}

					if(iconRetryUrl) {
						retryUntilFinal(iconRetryUrl, json => {
							item.$find(".btr-game-icon").src = json.Url
						})
					}

					if(!Number.isNaN(placeId)) {
						const thumbUrl = `https://www.roblox.com/asset-thumbnail/json?assetId=${placeId}&width=768&height=432&format=png`
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

				const descElem = item.$find(".btr-game-desc")
				const descContent = item.$find(".btr-game-desc-content")

				const updateDesc = () => {
					const add = descElem.scrollHeight > 170
					const toggle = descElem.$find(".btr-toggle-description")

					if(add && !toggle) { descElem.append(html`<span class="btr-toggle-description">Read More</span>`) }
					else if(!add && toggle) { toggle.remove() }

					descContent.classList.toggle("btr-no-description", descContent.textContent.trim() === "")
				}
				
				updateDesc()
				gamePromise.then(data => {
					if(data) { descContent.textContent = data.Description }
					Linkify(descContent)
					updateDesc()
				})
			})
		})
		.one(".home-friends", friends => {
			right.$find(".placeholder-friends").replaceWith(friends)
			const hlist = friends.$find(".hlist")

			if(hlist.children.length === 9) {
				fetch(`https://api.roblox.com/users/${userId}/friends`).then(async response => {
					const list = await response.json()
					if(list.length < 10) { return }
					const friend = list[9]

					hlist.append(html`
					<li class="list-item friend">
						<div class="avatar-container">
							<a href="/users/${friend.Id}/profile" class="avatar avatar-card-fullbody friend-link" title="${friend.Username}">
								<span class="avatar-card-link friend-avatar">
									<img alt="${friend.Username}" class="avatar-card-image" src="/avatar-thumbnail/image?userId=${friend.Id}&width=100&height=100&format=png">
								</span>
								<span class="text-overflow friend-name">${friend.Username}</span>
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

			const url = `https://www.roblox.com/users/inventory/list-json?assetTypeId=21&itemsPerPage=10&userId=${userId}&cursor=${cursor}&pageNumber=${page}`
			fetch(url).then(async response => {
				const json = await response.json()
				isLoading = false
				prevData = json

				if(json && json.IsValid) {
					pager.setPage(json.Data.Page)
					pager.togglePrev(json.Data.previousPageCursor != null)
					pager.toggleNext(json.Data.nextPageCursor != null)
					hlist.$empty()

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

			$.each(hlist.children, (obj, index) => {
				obj.classList.toggle("visible", Math.floor(index / pageSize) + 1 === page)
			})
		}

		pager.onsetpage = loadPage

		onDocumentReady(() => {
			const url = `https://www.roblox.com/users/profile/playergroups-json?userId=${userId}`
			fetch(url).then(async response => {
				const json = await response.json()

				pager.setMaxPage(Math.floor((json.NumberOfGroups - 1) / pageSize) + 1)
				if(json.NumberOfGroups === 0) { return }
				hlist.$empty()

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
			if(isLoading) { return }
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

			const url = `https://www.roblox.com/users/favorites/list-json?${params}`
			fetch(url).then(async response => {
				const json = await response.json()
				isLoading = false

				if(json && json.IsValid) {
					pager.setPage(page)
					pager.setMaxPage(Math.floor((json.Data.TotalItems - 1) / pageSize) + 1)
					hlist.$empty()

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

		const onclick = ev => {
			const cat = +ev.currentTarget.getAttribute("data-value")
			if(Number.isSafeInteger(cat)) {
				loadPage(cat, 1)
			}
		}

		dropdown.$findAll(".dropdown-menu li").forEach(btn => btn.$on("click", onclick))

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
			const cont = html`
			<div>
				<iframe id="btr-injected-inventory" src="/users/${userId}/inventory" scrolling="no" sandbox="allow-same-origin allow-scripts allow-top-navigation-by-user-activation">
			</div>`
			bottom.$find(".placeholder-inventory").replaceWith(cont)

			const iframe = cont.$find("iframe")
			setInterval(() => {
				try {
					iframe.style.height = `${iframe.contentWindow.document.body.scrollHeight}px`
				} catch(ex) {}
			}, 100)
		} else {
			bottom.$find(".placeholder-inventory").remove()
		}

		/*
		document.$findAll(`.profile-container>div>div[class^="placeholder-"]`).forEach(item => {
			item.style.display = ""
			item.classList.forEach(className => className.startsWith("placeholder-") && item.classList.remove(className))
		}) */
	})
}

pageInit.avatar = function() {
}

pageInit.inventory = function() {
	if(settings.profile.embedInventoryEnabled && window.top !== window) {
		Observer
			.one("head", head => head.append(html`<base target="_top"></base>`))
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
			})
	}

	if(!settings.inventory.enabled) { return }

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

		document
			.$on("keyup keydown", e => { shiftPressed = e.shiftKey })
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
				if($(".btr-it-box:checked") != null) { return false }
			})
			.$on("click", ".btr-it-remove", () => {
				if(isRemoving) { return }

				const checked = $.all(".btr-it-box:checked")
				if(!checked.length) { return }

				isRemoving = true
				const items = []
				for(let i = 0; i < checked.length; i++) {
					const self = checked[i].closest(".item-card")
					const matches = self.$find(".item-card-link").href.match(/(?:\/(?:catalog|library)\/|[?&]id=)(\d+)/)

					if(matches && !Number.isNaN(parseInt(matches[1], 10))) {
						items.push({
							obj: self,
							assetId: matches[1]
						})
					}
				}

				const validAssetTypes = [10, 13, 40, 3, 24]
				let itemsLeft = items.length

				function removeItem(index) {
					const item = items[index]
					if(item) {
						const url = `https://api.roblox.com/Marketplace/ProductInfo?assetId=${item.assetId}`
						fetch(url).then(async response => {
							const data = await response.json()
							if(validAssetTypes.indexOf(data.AssetTypeId) === -1) { return console.log("Bad assetType", data) }

							csrfFetch("https://www.roblox.com/asset/delete-from-inventory", {
								method: "POST",
								credentials: "include",
								body: new URLSearchParams({ assetId: item.assetId })
							}).then(() => {
								item.obj.remove()
								if(--itemsLeft === 0) {
									isRemoving = false
									InjectJS.send("refreshInventory")
								}
							})
						})

						setTimeout(removeItem, 250, index + 1)
					}
				}

				removeItem(0)
			})
	}
}

PreInit()
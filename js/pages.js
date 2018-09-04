"use strict"

const pageInit = {}
const startDate = new Date()

const AssetTypeIds = (() => {
	const acc = ["Hair", "Face", "Neck", "Shoulder", "Front", "Back", "Waist"]
	const anim = ["Climb", "Death", "Fall", "Idle", "Jump", "Run", "Swim", "Walk", "Pose"]

	acc.forEach((value, index) => { acc[index] = `${value}Accessory` })
	anim.forEach((value, index) => { anim[index] = `${value}Animation` })

	return [null,
		"Image", "TShirt", "Audio", "Mesh", "Lua", "HTML", "Text", "Hat", "Place", "Model", // 10
		"Shirt", "Pants", "Decal", "null", "null", "Avatar", "Head", "Face", "Gear", "null", // 20
		"Badge", "Group Emblem", "null", "Animation", "Arms", "Legs", "Torso", "RightArm", "LeftArm", "LeftLeg", // 30
		"RightLeg", "Package", "YouTubeVideo", "Game Pass", "App", "null", "Code", "Plugin", "SolidModel", "MeshPart", // 40
		...acc, // 47
		...anim // 56
	]
})()

const CheckAccessAssetTypeIds = [2, 3, 4, 10, 11, 12, 24, 39, 40]
const InvalidExplorableAssetTypeIds = [1, 3, 4, 5, 6, 7, 16, 21, 22, 32, 33, 34, 35, 37]
const AnimationPreviewAssetTypeIds = [24, 48, 49, 50, 51, 52, 53, 54, 55, 56]
const PackageAssetTypeIds = [27, 28, 29, 30, 31]
const WearableAssetTypeIds = [2, 8, 11, 12, 17, 18, ...PackageAssetTypeIds, 41, 42, 43, 44, 45, 46, 47]
const InvalidDownloadableAssetTypeIds = [5, 6, 7, 16, 21, 32, 33, 34, 35, 37]
const ContainerAssetTypeIds = {
	2: { typeId: 1, filter: x => x.ClassName === "ShirtGraphic", prop: "Graphic" },
	11: { typeId: 1, filter: x => x.ClassName === "Shirt", prop: "ShirtTemplate" },
	12: { typeId: 1, filter: x => x.ClassName === "Pants", prop: "PantsTemplate" },
	13: { typeId: 1, filter: x => x.ClassName === "Decal", prop: "Texture" },
	18: { typeId: 1, filter: x => x.ClassName === "Decal", prop: "Texture" },
	40: { typeId: 4, filter: x => x.ClassName === "MeshPart", prop: "MeshID" }
}

const ProhibitedReasons = {
	UniverseDoesNotHaveARootPlace: "This game has no root place.",
	UniverseRootPlaceIsNotActive: "This game is not active",
	InsufficientPermissionFriendsOnly: "This game is friends only.",
	InsufficientPermissionGroupOnly: "Group members only.",
	UnderReview: "This game is under moderation review."
}

async function getUncachedProductInfo(assetId) {
	const response = await fetch(`https://api.roblox.com/marketplace/productinfo?assetId=${assetId}`)
	return response.json()
}

const productCache = {}
function getProductInfo(assetId) {
	return productCache[assetId] = productCache[assetId] || getUncachedProductInfo(assetId)
}

function getXsrfToken() {
	const x = Array.prototype.find.call(
		$.all("body > script:not([src])"),
		y => y.textContent.includes("XsrfToken.setToken")
	)

	if(x) {
		return x.textContent.replace(/^[^]*XsrfToken\.setToken\('([^']+)'\)[^]*$/, "$1")
	}

	return null
}

let cachedXsrfToken
function csrfFetch(url, init) {
	if(!init) { init = {} }
	if(!init.headers) { init.headers = {} }

	if(!cachedXsrfToken) {
		cachedXsrfToken = getXsrfToken()
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
			const header = $.bufferToStr(buffer.subarray(0, 4))
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

function createPager(noSelect, hideWhenEmpty) {
	const pager = html`
	<div class=btr-pager-holder>
		<ul class=pager>
			<li class=pager-prev><a><span class=icon-left></span></a></li>
			<li class=pager-mid>
				Page <span class=pager-cur type=text value></span>
			</li>
			<li class=pager-next><a><span class=icon-right></span></a></li>
		</ul>
	</div>`

	if(!noSelect) {
		const mid = pager.$find(".pager-mid")
		mid.innerHTML = htmlstring`Page <input class=pager-cur type=text value> of <span class=pager-total></span>`
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

				if(hideWhenEmpty) {
					pager.style.display = maxPage < 2 ? "none" : ""
				}

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

let linkifyCounter = 0
function Linkify(elem) {
	const className = `btr-linkify-pls-${linkifyCounter++}`
	elem.classList.add(className)
	InjectJS.send("linkify", className)
}

const HoverPreview = (() => {
	const lastPreviewedAssets = []
	let preview
	let debounceCounter = 0
	let currentTarget

	const initPreview = () => {
		preview = this.preview = new RBXPreview.AvatarPreviewer(true)

		preview.disableDefaultAnimations = true
		preview.setEnabled(true)
	
		preview.container.style.position = "absolute"
		preview.container.style.top = "0"
		preview.container.style.pointerEvents = "none"
		
		preview.onInit(() => {
			preview.scene.cameraControlsEnabled = false
			preview.scene.cameraRotation.set(0.15, 0.25, 0)
			preview.scene.cameraZoom = 3.5
		})
	}

	return {
		register(selector, thumbContSelector) {
			document.$on("mouseover", selector, ev => {
				const self = ev.currentTarget
				const anchor = self.$find((`a[href*="/catalog/"]`))
				if(!anchor) { return console.log("no anchor") }

				const assetId = anchor.href.replace(/^.+\/catalog\/(\d+)\/.+$/, "$1")
				if(!Number.isSafeInteger(+assetId)) { return }
	
				if(currentTarget === self) { return }
				currentTarget = self
				
				if(preview) {
					preview.container.remove()

					while(lastPreviewedAssets.length) {
						preview.removeAssetPreview(lastPreviewedAssets.pop())
					}
				}
		
				const debounce = ++debounceCounter
				getProductInfo(assetId).then(data => {
					if(self !== currentTarget || debounceCounter !== debounce) { return }
					let loadPreview = false

					switch(settings.itemdetails.itemPreviewerMode) {
					default: case "default":
					case "always":
						loadPreview = true
						break
					case "animations":
						loadPreview = AnimationPreviewAssetTypeIds.includes(data.AssetTypeId) || PackageAssetTypeIds.includes(data.AssetTypeId) || assetTypeId === 32
						break
					case "never":
						break
					}

					if(!loadPreview) { return }
	
					if(WearableAssetTypeIds.includes(data.AssetTypeId)) {
						if(!preview) {
							initPreview()
						}
						self.$find(thumbContSelector).append(preview.container)

						preview.addAssetPreview(assetId, data.AssetTypeId)
						lastPreviewedAssets.push(assetId)
					} else if(data.AssetTypeId === 32) {
						AssetCache.loadText(assetId, text => {
							if(self !== currentTarget || debounceCounter !== debounce) { return }

							text.split(";").map(itemId => getProductInfo(itemId).then(json => {
								if(self !== currentTarget || debounceCounter !== debounce) { return }

								if(WearableAssetTypeIds.includes(json.AssetTypeId)) {
									if(!preview) {
										initPreview()
									}
									self.$find(thumbContSelector).append(preview.container)

									preview.addAssetPreview(itemId, json.AssetTypeId)
									lastPreviewedAssets.push(itemId)
								}
							}))
						})
					}
				})
		
				self.addEventListener("mouseleave", () => {
					if(currentTarget !== self) { return }
					currentTarget = null

					if(preview) {
						preview.container.remove()

						while(lastPreviewedAssets.length) {
							preview.removeAssetPreview(lastPreviewedAssets.pop())
						}
					}
				}, { once: true })
			})
		}
	}
})()
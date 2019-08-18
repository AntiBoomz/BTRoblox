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

const StrictCheckAssetTypeIds = [2, 3, 10, 11, 12, 13, 18, 24, 39, 40]
const InvalidExplorableAssetTypeIds = [1, 3, 4, 5, 6, 7, 16, 21, 22, 32, 33, 34, 35, 37]
const AnimationPreviewAssetTypeIds = [24, 48, 49, 50, 51, 52, 53, 54, 55, 56]
const WearableAssetTypeIds = [2, 8, 11, 12, 17, 18, 27, 28, 29, 30, 31, 41, 42, 43, 44, 45, 46, 47]
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
	const response = await $.fetch(`https://api.roblox.com/marketplace/productinfo?assetId=${assetId}`)
	return response.json()
}

const productCache = {}
function getProductInfo(assetId) {
	return productCache[assetId] = productCache[assetId] || getUncachedProductInfo(assetId)
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
	const invalidThumbnails = [
		`https://t1.rbxcdn.com/2a8edb4fb90f669af867371f927e4b46`,
		`https://t4.rbxcdn.com/6aa6eb3c8680be7c47f1122f4fb9ebf2`
	]

	const ClothingParts = {
		shirt: [
			"LowerTorso", "UpperTorso", "Torso",
			"LeftUpperArm", "LeftLowerArm", "LeftHand", "LeftArm",
			"RightUpperArm", "RightLowerArm", "RightHand", "RightArm"
		],
		pants: [
			"LeftUpperLeg", "LeftLowerLeg", "LeftFoot", "LeftLeg",
			"RightUpperLeg", "RightLowerLeg", "RightFoot", "RightLeg"
		],
		tshirt: [
			"LowerTorso", "UpperTorso", "Torso"
		],
		face: ["Head"]
	}

	const frontCameraRotation = [0.15, 0.25, 0]
	const backCameraRotation = [0.15, 2.89, 0]

	const bundleCache = {}
	const lastPreviewedAssets = []
	const invalidAssets = {}
	let preview
	let debounceCounter = 0
	let currentTarget

	const setCameraDir = cameraDir => {
		if(cameraDir === "Back") {
			preview.scene.cameraRotation.set(...backCameraRotation)
		} else {
			preview.scene.cameraRotation.set(...frontCameraRotation)
		}
	}

	const initPreview = () => {
		preview = this.preview = new RBXPreview.AvatarPreviewer({
			simple: true,
			disableDefaultAnimations: false
		})
	
		preview.container.style.position = "absolute"
		preview.container.style.top = "0"
		preview.container.style.pointerEvents = "none"
		
		preview.scene.cameraControlsEnabled = false
		preview.scene.cameraRotation.set(...frontCameraRotation)

		const rotBtn = html`<span class="btr-hover-preview-camera-rotate"></span>`
		preview.container.append(rotBtn)

		rotBtn.$on("mousedown", ev => {
			if(ev.button !== 0) { return }
			let reqId
			let last

			const update = time => {
				const elapsed = time - (last || time)
				last = time

				preview.scene.cameraRotation.y += elapsed / 1e3
				reqId = requestAnimationFrame(update)
			}

			reqId = requestAnimationFrame(update)

			document.documentElement.$once("mouseup", () => {
				if(ev.button !== 0) { return }
				cancelAnimationFrame(reqId)
			})

			ev.preventDefault()
		}).$on("click", ev => ev.preventDefault())
	}

	const clearTarget = () => {
		if(currentTarget) {
			currentTarget = null
			debounceCounter++
		}

		if(preview) {
			const parent = preview.container.parentNode
			if(parent instanceof Element) { parent.classList.remove("btr-preview-container-parent") }

			preview.setEnabled(false)
			preview.container.remove()

			while(lastPreviewedAssets.length) {
				lastPreviewedAssets.pop().remove()
			}
		}
	}

	return {
		register(selector, thumbContSelector) {
			if(settings.general.hoverPreviewMode === "never") { return }

			document.$on("mouseover", `${selector} ${thumbContSelector}`, async ev => {
				const thumbCont = ev.currentTarget

				const self = thumbCont.closest(selector)
				if(!self || currentTarget === self) { return }

				const anchor = self.$find(`a[href*="/catalog/"],a[href*="/bundles/"]`)
				if(!anchor) { return }

				const assetId = anchor.href.replace(/^.*\/(?:bundles|catalog)\/(\d+)\/.*$/, "$1")
				if(!Number.isSafeInteger(+assetId)) { return }

				clearTarget()
				if(invalidAssets[assetId]) { return }

				const img = thumbCont.$find("img")
				if(img && invalidThumbnails.includes(img.src)) { return }

				const debounce = ++debounceCounter
				const assetPromises = []
				currentTarget = self

				const mouseLeave = () => {
					if(currentTarget !== self) { return }
					thumbCont.classList.remove("btr-preview-loading")
					clearTarget()
				}

				thumbCont.addEventListener("mouseleave", mouseLeave, { once: true })

				const isBundle = anchor.href.includes("/bundles/")

				const finalizeLoad = () => {
					if(debounceCounter !== debounce) { return }

					if(!assetPromises.length) {
						invalidAssets[assetId] = true
						thumbCont.classList.remove("btr-preview-loading")
						clearTarget()
						return
					}

					const avatar = preview.scene.avatar

					preview.startLoadingAssets()
					preview.appearanceLoadedPromise.then(() => avatar.waitForAppearance()).then(() => {
						if(debounceCounter !== debounce) { return }

						thumbCont.classList.remove("btr-preview-loading")

						const wasSomethingChanged = lastPreviewedAssets.find(asset => !asset.isEmpty())
						if(!wasSomethingChanged) {
							invalidAssets[assetId] = true
							clearTarget()
							return
						}

						// Let other asset listeners run
						// otherwise accessories do not get properly initialized .-.'
						$.setImmediate(() => {
							if(debounceCounter !== debounce) { return }

							preview.scene.update()
							avatar.animator.reset()
							preview.scene.render()

							const addedObjects = new Set()
							let cameraDir

							lastPreviewedAssets.forEach(asset => {
								asset.accessories.forEach(acc => {
									if(acc.obj) {
										addedObjects.add(acc.obj)

										if(acc.attName.endsWith("BackAttachment")) {
											if(!cameraDir) {
												cameraDir = "Back"
											}
										} else {
											cameraDir = "Front"
										}
									}
								})

								asset.bodyparts.forEach(bp => {
									if(bp.obj) {
										addedObjects.add(bp.obj)
										cameraDir = "Front"
									}
								})

								asset.clothing.forEach(clothing => {
									const parts = ClothingParts[clothing.target]
									if(parts) {
										parts.forEach(name => (name in avatar.parts && addedObjects.add(avatar.parts[name].rbxMesh)))
									}
								})
							})

							if(addedObjects.size) {
								const box = new THREE.Box3()

								addedObjects.forEach(obj => {
									const geom = obj.geometry
									geom.computeBoundingSphere()

									const sphere = geom.boundingSphere
									const worldCenter = new THREE.Vector3().setFromMatrixPosition(obj.matrixWorld)
									const worldEuler = new THREE.Euler().setFromRotationMatrix(obj.matrixWorld)

									worldCenter.add(sphere.center.clone().applyEuler(worldEuler))

									const radius = sphere.radius * Math.max(...obj.scale.toArray())

									box.expandByPoint(worldCenter.addScalar(radius))
									box.expandByPoint(worldCenter.addScalar(-2 * radius))
								})

								const center = box.max.clone().add(box.min).divideScalar(2)
								const radius = box.max.clone().sub(center).multiply(new THREE.Vector3(1, 1, 0.5)).length()

								preview.scene.cameraFocus.copy(center)
								preview.scene.cameraZoom = 2 + radius * 0.8

								setCameraDir(cameraDir || "Front")
							} else {
								preview.scene.cameraFocus.set(0, 3, 0)
								preview.scene.cameraZoom = 3
								
								setCameraDir("Front")
							}

							preview.scene.update()
							preview.scene.render()

							const thumb = self.$find(thumbContSelector)
							thumb.append(preview.container)
							thumb.classList.add("btr-preview-container-parent")
						})
					})
				}

				const addAssetPreview = itemId => {
					if(!preview) { initPreview() }

					const asset = preview.addAssetPreview(itemId)
					if(!asset) { return }

					preview.setEnabled(true)
					thumbCont.classList.add("btr-preview-loading")

					lastPreviewedAssets.push(asset)
					assetPromises.push(asset.loadPromise)
				}
				
				if(isBundle) {
					let promise = bundleCache[assetId]

					if(!promise) {
						const url = `https://catalog.roblox.com/v1/bundles/${assetId}/details`
						promise = bundleCache[assetId] = $.fetch(url).then(resp => resp.json())
					}

					promise.then(json => {
						if(debounceCounter !== debounce) { return }
						if(json.bundleType === "AvatarAnimations") { return }

						json.items.forEach(item => {
							if(item.type === "Asset") {
								addAssetPreview(item.id)
							}
						})

						finalizeLoad()
					})
				} else {
					getProductInfo(assetId).then(data => {
						if(debounceCounter !== debounce) { return }

						if(WearableAssetTypeIds.includes(data.AssetTypeId)) {
							addAssetPreview(assetId)
							finalizeLoad()
						}
					})
				}
			})
		}
	}
})()
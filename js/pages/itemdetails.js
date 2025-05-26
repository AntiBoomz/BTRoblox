"use strict"

const initPreview = async (assetId, assetTypeId, isBundle) => {
	if(!SETTINGS.get("itemdetails.itemPreviewer")) { return }
	
	const isPreviewable = AnimationPreviewAssetTypeIds.includes(assetTypeId) || WearableAssetTypeIds.includes(assetTypeId)
	if(!isBundle && !isPreviewable) { return }
	
	const previewerMode = SETTINGS.get("itemdetails.itemPreviewerMode")
	let autoLoading = false
	
	const assetPromises = []
	let currentOutfitId
	let playedAnimation
	let bundleType
	let preview
	
	let previewPromise = new Promise(resolve => {})
	
	const setOutfit = outfitId => {
		if(!preview) {
			currentOutfitId = outfitId
			return
		}
		
		preview.setBundleOutfit(outfitId)
		
		if(bundleType !== "AvatarAnimations") {
			preview.selectOutfit("bundle")
		}
	}
	
	const loadPreview = $.onceFn(async () => {
		await loadOptionalLibrary("previewer")
		preview = new ItemPreviewer()
		
		if(currentOutfitId) {
			setOutfit(currentOutfitId)
		}
		
		// Add default animations
		const disabledTypes = [
			AssetType.ClimbAnimation, AssetType.FallAnimation, AssetType.IdleAnimation,
			AssetType.JumpAnimation, AssetType.RunAnimation, AssetType.SwimAnimation,
			AssetType.WalkAnimation, AssetType.Animation, AssetType.EmoteAnimation
		]
		
		if(!disabledTypes.includes(assetTypeId) && bundleType !== "AvatarAnimations") {
			const defaultAnims = {
				run: [913376220],
				walk: [913402848],
				swim: [913384386],
				swimidle: [913389285],
				jump: [507765000],
				idle: [507766388, 507766666],
				fall: [507767968],
				climb: [507765644]
			}
			
			for(const [animType, assetIds] of Object.entries(defaultAnims)) {
				for(const assetId of assetIds) {
					preview.addBundleAnimation(assetId, animType, "")
				}
			}
			
			preview.playAnimation(defaultAnims.idle[0])
		}
		
		previewPromise.$resolve(preview)
	})
		
	const addAsset = async (assetId, assetTypeId, assetName, meta) => {
		if(AnimationPreviewAssetTypeIds.includes(assetTypeId)) {
			await loadPreview()
			preview.setVisible(true)
			
			if(!autoLoading && (previewerMode === "always" || previewerMode === "animations")) {
				autoLoading = true
				$.ready(() => preview.setEnabled(true))
			}
			
			if(assetTypeId === 24) {
				// Animation asset, no need to process
				preview.addAnimation(assetId, assetName)
				
				if(!playedAnimation) {
					playedAnimation = true
					preview.initPlayerTypeFromPlayingAnimation = true
					preview.playAnimation(assetId)
				}
				
			} else if(assetTypeId === 61) {
				// Emote asset, contains an Animation
				const model = await AssetCache.loadModel(assetId)
				const animation = model.find(x => x.ClassName === "Animation")
				const animationId = AssetCache.getAssetIdFromUrl(animation.AnimationId)
				
				preview.addAnimation(animationId, assetName)
				
				if(!playedAnimation) {
					playedAnimation = true
					preview.initPlayerTypeFromPlayingAnimation = true
					preview.playAnimation(animationId)
				}
				
			} else {
				// Avatar animation
				const model = await AssetCache.loadModel(assetId)
				const folder = model.find(x => x.Name === "R15Anim")
				
				for(const value of folder.Children) {
					if(value.ClassName !== "StringValue") { continue }
					
					preview.removeBundleAnimations(value.Name)
					
					for(const animation of value.Children) {
						if(animation.ClassName !== "Animation") { continue }
						
						const animationId = AssetCache.getAssetIdFromUrl(animation.AnimationId)
						
						preview.addBundleAnimation(animationId, value.Name, assetName)

						if(!playedAnimation && (!isBundle || value.Name === "idle")) {
							playedAnimation = true
							preview.initPlayerTypeFromPlayingAnimation = true
							preview.playAnimation(animationId)
						}
					}
				}
			}
			
		} else if(WearableAssetTypeIds.includes(assetTypeId)) {
			await loadPreview()
			
			const asset = preview.addAssetPreview(assetId, assetTypeId, meta)
			if(!asset) { return }
			
			preview.setVisible(true)
			
			if(!autoLoading && previewerMode === "always") {
				autoLoading = true
				$.ready(() => preview.setEnabled(true))
			}
		}
	}
	
	if(document.visibilityState === "hidden") {
		await new Promise(resolve => document.$on("visibilitychange", () => resolve(), { once: true }))
	}
	
	if(isBundle) {
		assetPromises.push(
			RobloxApi.catalog.getBundleDetails(assetId).then(async details => {
				bundleType = details.bundleType
				
				const outfitPromise = new Promise(resolve => {
					const promises = []
					
					for(const item of details.items) {
						if(item.type === "UserOutfit") {
							promises.push(RobloxApi.avatar.getOutfitDetails(item.id).then(details => {
								if(details?.outfitType === "Avatar") {
									resolve(details)
								}
							}))
						}
					}
					
					Promise.all(promises).then(() => resolve(null))
				})
				
				const bundlePromises = []
				
				bundlePromises.push(
					outfitPromise.then(outfit => {
						if(outfit) {
							setOutfit(outfit.id)
						}
					})
				)
				
				for(const item of details.items) {
					if(item.type === "Asset") {
						bundlePromises.push(
							AssetCache.resolveAsset(item.id).then(async assetRequest => {
								const outfit = await outfitPromise
								return addAsset(item.id, assetRequest.assetTypeId, item.name, outfit?.assets.find(x => x.id === item.id)?.meta)
							})
						)
					}
				}
				
				return Promise.all(bundlePromises)
			})
		)
	} else {
		assetPromises.push(
			addAsset(assetId, assetTypeId, $("#item-container")?.dataset.itemName || "Asset")
		)
	}
	
	Promise.all(assetPromises).then(async () => {
		if(!preview) { return null }
		
		await preview.waitForAppearance()
		
		let gotAnything = false
		
		for(const asset of preview.previewAssets.values()) {
			if(!asset.isEmpty()) {
				gotAnything = true
				break
			}
		}
		
		if(!gotAnything && !currentOutfitId && !playedAnimation) {
			console.log("We've got nothing, let's just remove previewer")
			preview.setEnabled(false)
			preview.setVisible(false)
		}
	}).finally(() => {
		if(!preview) {
			previewPromise.$resolve(null)
		}
	})
	
	return previewPromise
}

const canDownloadAssetCache = {}
const canDownloadAsset = (assetId, assetTypeId) => canDownloadAssetCache[assetId] = canDownloadAssetCache[assetId] || (async () => {
	// NOTE: This assumes you have the marketplace/itemdetails page for the item open at the moment
	// Marketplace pages for models you don't have access to are hidden, so we dont need to check those
	
	if(/*assetTypeId === AssetType.Model ||*/ assetTypeId === AssetType.Plugin || assetTypeId === AssetType.Audio) {
		const json = await RobloxApi.assetdelivery.requestAssetV2(assetId, { browserAssetRequest: true })
		
		if(!json?.locations) {
			return false
		}
	}
	
	return true
})()

const initExplorer = async (assetId, assetTypeId, isBundle) => {
	if(!SETTINGS.get("itemdetails.explorerButton") || !isBundle && InvalidExplorableAssetTypeIds.includes(assetTypeId)) {
		return
	}
	
	if(!isBundle) {
		const canDownload = await canDownloadAsset(assetId, assetTypeId)
		if(!canDownload) { return }
	}
	
	const btnCont = html`
	<div class="btr-explorer-button-container btr-temp-fixed">
		<a class=btr-explorer-button>
			<span class=btr-icon-explorer></span>
		</a>
		<div class=btr-explorer-popover>
			<div class=btr-explorer-parent></div>
		</div>
	</div>`

	loadOptionalLibrary("explorer").then(() => {
		const explorer = new Explorer()
		let explorerInitialized = false
		
		const popover = btnCont.$find(".btr-explorer-popover")
		popover.$find(".btr-explorer-parent").replaceWith(explorer.element)
		
		btnCont.$on("click", ".btr-explorer-button", () => {
			if(popover.classList.contains("visible")) {
				popover.classList.remove("visible")
				explorer.setActive(false)
				return
			}
			
			popover.classList.add("visible")
			popover.style.left = `calc(50% - ${popover.clientWidth / 2}px)`
			
			if(!explorerInitialized) {
				explorerInitialized = true
				
				const updateLoadingText = perc => explorer.setLoadingText(`Loading... ${Math.floor(perc * 100 + 0.5)}%`)
				explorer.setLoadingText(`Downloading...`)
				
				if(isBundle) {
					let first = true
					RobloxApi.catalog.getBundleDetails(assetId).then(async details => {
						for(const item of details.items) {
							if(item.type === "Asset") {
								AssetCache.loadModel(item.id, { async: true, onProgress: first && updateLoadingText }, model => explorer.addModel(item.name, model))
								first = false
							}
						}
					})
				
				} else if(assetTypeId === AssetType.Head || assetTypeId === AssetType.DynamicHead) {
					AssetCache.loadModel(assetId, { async: true, onProgress: updateLoadingText, format: "avatar_meshpart_head" }, model => {
						AssetCache.loadModel(assetId, { async: true }, model => explorer.addModel("SpecialMesh", model))
						explorer.addModel("MeshPart", model)
					})
					
				} else if(AccessoryAssetTypeIds.includes(assetTypeId)) {
					AssetCache.loadModel(assetId, { async: true, onProgress: updateLoadingText, format: "avatar_meshpart_accessory" }, model => {
						if(assetTypeId <= AssetType.WaistAccessory) { // is not layered clothing
							AssetCache.loadModel(assetId, { async: true }, model => explorer.addModel("SpecialMesh", model))
						}
						explorer.addModel("MeshPart", model)
					})
					
				} else {
					AssetCache.loadModel(assetId, { async: true, onProgress: updateLoadingText }, model => explorer.addModel("Default", model, { open: assetTypeId !== AssetType.Place }))
				}
			}
			
			explorer.select([])
			explorer.setActive(true)

			const popLeft = explorer.element.getBoundingClientRect().right + 276 >= document.documentElement.clientWidth
			explorer.element.$find(".btr-properties").classList.toggle("left", popLeft)
		})
		
		document.body.$on("mousedown", ev => {
			if(popover.classList.contains("visible") && !btnCont.contains(ev.target) && !explorer.getRootElement().contains(ev.target)) {
				popover.classList.remove("visible")
				explorer.setActive(false)
			}
		})
	})
	
	return btnCont
}

const initDownloadButton = async (assetId, assetTypeId, isBundle) => {
	if(isBundle) {
		return
	}
	
	if(!SETTINGS.get("itemdetails.downloadButton") || InvalidDownloadableAssetTypeIds.includes(assetTypeId)) {
		return
	}

	const canDownload = await canDownloadAsset(assetId, assetTypeId)
	if(!canDownload) { return }
	
	const btnCont = html`
	<div class=btr-download-button-container>
		<a class=btr-download-button>
			<span class=btr-icon-download></span>
		</a>
	</div>`
	
	const downloadButton = btnCont.$find("a")

	const download = (data, fileType) => {
		const title = $("#item-container .item-name-container h2")
		const fileName = `${title && formatUrlName(title.textContent, "") || assetId.toString()}.${fileType || getAssetFileType(assetTypeId, data)}`

		const blobUrl = URL.createObjectURL(new Blob([data], { type: "binary/octet-stream" }))
		startDownload(blobUrl, fileName)
		URL.revokeObjectURL(blobUrl)
	}

	const doNamedDownload = event => {
		const target = event.currentTarget
		event.preventDefault()
		
		if(downloadButton.classList.contains("disabled")) {
			return
		}
		
		downloadButton.classList.add("disabled")
		downloadButton.classList.add("loading")

		const format = target.getAttribute("format") ?? undefined
		
		if(format === "obj") {
			AssetCache.loadMesh(assetId, mesh => {
				downloadButton.classList.remove("disabled")
				downloadButton.classList.remove("loading")
				
				const lines = []

				lines.push("o Mesh")

				for(let i = 0, len = mesh.vertices.length; i < len; i += 3) {
					lines.push(`v ${mesh.vertices[i]} ${mesh.vertices[i + 1]} ${mesh.vertices[i + 2]}`)
				}

				lines.push("")

				for(let i = 0, len = mesh.normals.length; i < len; i += 3) {
					lines.push(`vn ${mesh.normals[i]} ${mesh.normals[i + 1]} ${mesh.normals[i + 2]}`)
				}

				lines.push("")

				for(let i = 0, len = mesh.uvs.length; i < len; i += 2) {
					lines.push(`vt ${mesh.uvs[i]} ${mesh.uvs[i + 1]}`)
				}

				lines.push("")
				
				// only use the first lod
				const faces = mesh.faces.subarray(mesh.lods[0] * 3, mesh.lods[1] * 3)
				
				for(let i = 0, len = faces.length; i < len; i += 3) {
					const a = faces[i] + 1
					const b = faces[i + 1] + 1
					const c = faces[i + 2] + 1
					lines.push(`f ${a}/${a}/${a} ${b}/${b}/${b} ${c}/${c}/${c}`)
				}

				download(lines.join("\n"), "obj")
			})
		} else {
			AssetCache.loadBuffer(assetId, { browserAssetRequest: assetTypeId === AssetType.Audio, format: format }, buffer => {
				downloadButton.classList.remove("disabled")
				downloadButton.classList.remove("loading")
				
				if(!buffer) {
					alert("Failed to download")
					return
				}

				download(buffer)
			})
		}
	}
	
	const assetUrl = AssetCache.toAssetUrl(assetId)
	
	if(assetTypeId === AssetType.Mesh) {
		const popoverTemplate = html`
		<div class=btr-download-popover>
			<ul>
				<li>
					<a class=btr-download href="${assetUrl}">Download as .mesh</a>
				</li>
				<li>
					<a class=btr-download format=obj>Download as .obj</a>
				</li>
			</ul>
		</div>`
		
		if(IS_DEV_MODE) {
			popoverTemplate.$find("ul").append(html`
			<li>
				<a class=btr-log-mesh>Print to console</a>
			</li>`)
			
			btnCont.$on("click", ".btr-log-mesh", () => {
				AssetCache.loadMesh(assetId, mesh => {
					console.log(mesh)
				})
			})
		}
		
		downloadButton.$on("click", event => {
			event.preventDefault()
			event.stopPropagation()
			popoverTemplate.classList.toggle("visible")
		})
		
		document.$on("click", event => {
			if(popoverTemplate.classList.contains("visible")) {
				popoverTemplate.classList.toggle("visible")
			}
		})
		
		downloadButton.after(popoverTemplate)
		btnCont.$on("click", ".btr-download", doNamedDownload)
		
	} else if(assetTypeId === AssetType.Head || assetTypeId === AssetType.DynamicHead) {
		downloadButton.dataset.toggle = "popover"
		downloadButton.dataset.bind = "popover-btr-download"
		
		const popoverTemplate = html`
		<div class=rbx-popover-content data-toggle=popover-btr-download>
			<ul class=dropdown-menu role=menu>
				<li>
					<a class=btr-download format=avatar_meshpart_head href="${assetUrl}">Download MeshPart</a>
				</li>
				<li>
					<a class=btr-download>Download SpecialMesh</a>
				</li>
			</ul>
		</div>`
		
		downloadButton.after(popoverTemplate)
		btnCont.$on("click", ".btr-download", doNamedDownload)
		
	} else if(AccessoryAssetTypeIds.includes(assetTypeId)) {
		if(assetTypeId <= AssetType.WaistAccessory) {
			downloadButton.dataset.toggle = "popover"
			downloadButton.dataset.bind = "popover-btr-download"
			
			const popoverTemplate = html`
			<div class=rbx-popover-content data-toggle=popover-btr-download>
				<ul class=dropdown-menu role=menu>
					<li>
						<a class=btr-download format=avatar_meshpart_accessory href="${assetUrl}">Download MeshPart</a>
					</li>
					<li>
						<a class=btr-download>Download SpecialMesh</a>
					</li>
				</ul>
			</div>`
			
			downloadButton.after(popoverTemplate)
			btnCont.$on("click", ".btr-download", doNamedDownload)
		} else {
			downloadButton.href = assetUrl
			downloadButton.setAttribute("format", "avatar_meshpart_accessory")
			downloadButton.$on("click", doNamedDownload)
		}
	} else {
		downloadButton.href = assetUrl
		downloadButton.$on("click", doNamedDownload)
	}
	
	if(downloadButton.dataset.toggle) {
		setTimeout(() => { // a bit ugly, but eh
			InjectJS.inject(() => {
				Roblox?.BootstrapWidgets?.SetupPopover(null, null, "[data-bind^='popover-btr-']")
			})
		}, 0)
	}
	
	return btnCont
}

const initContentButton = async (assetId, assetTypeId) => {
	if(!SETTINGS.get("itemdetails.contentButton")) {
		return
	}
	
	const getAssetUrl = ContainerAssetTypeIds[assetTypeId]
	if(!getAssetUrl) {
		return
	}

	const canDownload = await canDownloadAsset(assetId, assetTypeId)
	if(!canDownload) { return }
	
	const btnCont = html`
	<div class=btr-content-button-container>
		<a class="btr-content-button disabled" href="#">
			<span class=btr-icon-content></span>
		</a>
	</div>`

	AssetCache.loadModel(assetId, model => {
		const contentUrl = getAssetUrl(model)
		const contentId = AssetCache.getAssetIdFromUrl(contentUrl)
		
		if(contentId) {
			btnCont.$find(">a").href = `https://www.roblox.com/library/${contentId}/` // marketplace needs full domain
			btnCont.$find(">a").classList.remove("disabled")
		}
	})
	
	return btnCont
}

pageInit.itemdetails = () => {
	if(RobuxToCash.isEnabled()) {
		angularHook.modifyTemplate("asset-resale-data-pane", template => {
			for(const elem of template.$findAll(`.text-robux`)) {
				const cashText = ` (${RobuxToCash.convertAngular(elem.getAttribute("ng-bind").replace(/\|.*$/, "").replace(/^.*formatNumber\((.*)\)[^)]*$/, "$1"))})`
				elem.after(html`<span class=btr-robuxToCash>${cashText}</span>`)
			}
		})
		
		angularHook.modifyTemplate("resellers-list", template => {
			for(const elem of template.$findAll(`.text-robux`)) {
				const cashText = ` (${RobuxToCash.convertAngular(elem.getAttribute("ng-bind").replace(/\|.*$/, "").replace(/^.*formatNumber\((.*)\)[^)]*$/, "$1"))})`
				elem.after(html`<span class=btr-robuxToCash>${cashText}</span>`)
			}
		})
	}

	if(SETTINGS.get("general.hoverPreview")) {
		loadOptionalLibrary("previewer").then(() => {
			HoverPreview.register(".item-card", ".item-card-thumb-container")
		})
	}

	if(!SETTINGS.get("itemdetails.enabled")) { return }
	
	InjectJS.inject(() => {
		const { reactHook } = window.BTRoblox
		
		reactHook.hijackConstructor(
			(type, props) => "itemDetails" in props,
			(target, thisArg, args) => {
				const result = target.apply(thisArg, args)
				
				try {
					const props = args[0]
					
					if(result?.props?.className?.includes("item-details-info-header")) {
						const { itemDetails } = props
						
						result.props.children.splice(1, 0, reactHook.createElement("div", {
							className: "btr-buttons",
							dangerouslySetInnerHTML: { __html: "" },
							
							"data-btr-asset-id": itemDetails.id,
							"data-btr-asset-type-id": itemDetails.assetType,
							"data-btr-item-type": itemDetails.itemType,
						}))
					}
				} catch(ex) {
					console.error(ex)
				}
				
				return result
			}
		)
	})
	
	onPageReset(() => {
	})
	
	onPageLoad((category, assetIdString) => {
		const assetId = Number.parseInt(assetIdString, 10)
		
		document.$watch("#content").$then().$watch(">#item-details-container, >#item-container", container => {
			const isReactItemDetails = container.id === "item-details-container"
			
			// if(SETTINGS.get("itemdetails.addOwnersList")) {
			// 	let wasOwnersListSetup = false
				
			// 	const setupOwnersList = (parent, name, ownerAssetId, initData) => {
			// 		if(wasOwnersListSetup) { return }
			// 		wasOwnersListSetup = true

			// 		const owners = html`
			// 		<div class=btr-owners-container style=display:none>
			// 			<div class=container-header>
			// 				<h2>Owners</h2>
			// 			</div>
			// 			<div class=section-content>
			// 			</div>
			// 			<button class="btn-control-sm btr-see-more-owners">See More</button>
			// 		</div>`

			// 		const ownersList = owners.$find(".section-content")
			// 		parent.before(owners)

			// 		//

			// 		let firstLoaded = false
			// 		let isLoading = false
			// 		let cursor = ""

			// 		const btns = html`<div style="position: relative; float: right; height: 28px; margin-bottom: -28px; margin-top: 5px;"></div>`
			// 		const parBtn = html`<button class="btn-secondary-xs active" style=float:right;margin:2px;>${name}</button>`
			// 		const ownBtn = html`<button class=btn-control-xs style=float:right;margin:2px;>Owners</button>`

			// 		btns.append(parBtn, ownBtn)
			// 		owners.before(btns)

			// 		ownBtn.$on("click", () => {
			// 			parBtn.classList.replace("btn-secondary-xs", "btn-control-xs")
			// 			ownBtn.classList.replace("btn-control-xs", "btn-secondary-xs")

			// 			parBtn.classList.remove("active")
			// 			ownBtn.classList.add("active")

			// 			parent.style.display = "none"
			// 			owners.style.display = ""

			// 			if(!firstLoaded && !initData) {
			// 				loadOwners()
			// 			}
			// 		})

			// 		parBtn.$on("click", () => {
			// 			ownBtn.classList.replace("btn-secondary-xs", "btn-control-xs")
			// 			parBtn.classList.replace("btn-control-xs", "btn-secondary-xs")

			// 			ownBtn.classList.remove("active")
			// 			parBtn.classList.add("active")

			// 			owners.style.display = "none"
			// 			parent.style.display = ""
			// 		})

			// 		//
					
			// 		const seeMore = owners.$find(".btr-see-more-owners")

			// 		const createElement = ({ userId, userName, item }) => {
			// 			const url = userId ? `/users/${userId}/profile` : ""

			// 			const elem = html`
			// 			<div class=btr-owner-item>
			// 				<a href="${url}" title="${userName}" class="avatar avatar-headshot-md list-header">
			// 					<img class=avatar-card-image 
			// 						src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
			// 						alt="${userName}"
			// 					>
			// 				</a>
			// 				<div class=btr-owner-cont>
			// 					<a class="text-name username" title="${userName}" href="${url}">${userName}</a>
			// 					<div class=btr-owner-date>Since ${new Date(item.updated).$format("M/D/YYYY hh:mm:ss")}</div>
			// 				</div>
			// 				<div class=btr-serial>${item.serialNumber ? `#${item.serialNumber}` : `N/A`}</div>
			// 			</div>`

			// 			if(userId) {
			// 				RobloxApi.thumbnails.getAvatarHeadshots([userId]).then(json => {
			// 					elem.$find(".avatar-card-image").src = json.data[0].imageUrl
			// 				})
			// 			} else {
			// 				for(const anchor of elem.$findAll("a")) {
			// 					anchor.removeAttribute("href")
			// 				}
			// 			}

			// 			return elem
			// 		}

			// 		const getNames = request => {
			// 			const userIds = Object.keys(request)
			// 			if(!userIds.length) { return Promise.resolve() }

			// 			return RobloxApi.users.getUserDetails(userIds).then(json => {
			// 				for(const user of json.data) {
			// 					const list = request[user.id]
								
			// 					if(list) {
			// 						for(const entry of list) {
			// 							entry.userName = user.name
			// 						}
			// 					}
			// 				}
			// 			})
			// 		}

			// 		const createElements = (data, isInitial) => {
			// 			const request = {}
			// 			const elems = []
						
			// 			for(const item of data) {
			// 				if(item.owner && (item.owner.type !== "User" || item.owner.id === 1)) { continue }
			// 				if(!item.owner && !item.serialNumber) { continue }

			// 				if(item.owner) {
			// 					const userId = item.owner.id

			// 					const self = {
			// 						item,
			// 						userId,
			// 						userName: `User#${userId}`
			// 					}

			// 					const list = request[userId] = request[userId] || []
			// 					list.push(self)
			// 					elems.push(self)
			// 				} else {
			// 					const self = {
			// 						item,
			// 						userId: 0,
			// 						userName: `Hidden User`
			// 					}

			// 					elems.push(self)
			// 				}
			// 			}

			// 			getNames(request).finally(() => {
			// 				isLoading = false
			// 				seeMore.textContent = "See More"
			// 				seeMore.removeAttribute("disabled")
							
			// 				if(!firstLoaded && !isInitial) {
			// 					firstLoaded = true
			// 					ownersList.replaceChildren()
			// 				}
							
			// 				for(const elem of elems) {
			// 					ownersList.append(createElement(elem))
			// 				}
			// 			})
			// 		}

			// 		const loadOwners = () => {
			// 			if(isLoading) { return }
			// 			isLoading = true

			// 			seeMore.textContent = "Loading..."
			// 			seeMore.setAttribute("disabled", "")

			// 			const maxRetries = 10
			// 			let retriesLeft = maxRetries

			// 			const request = () => {
			// 				RobloxApi.inventory.getAssetOwners(ownerAssetId, 100, cursor).then(json => {
			// 					if(!json?.data) {
			// 						if(retriesLeft > 0) {
			// 							retriesLeft--
			// 							seeMore.textContent = `Loading... (${maxRetries - retriesLeft})`
			// 							setTimeout(request, 2e3)
			// 						} else {
			// 							isLoading = false
			
			// 							const failText = seeMore.textContent = "Failed to load owners, try again later"
			// 							setTimeout(() => (seeMore.textContent === failText ? seeMore.textContent = "See More" : null), 2e3)
			
			// 							seeMore.removeAttribute("disabled")
			// 						}
			// 						return
			// 					}
			
			// 					if(json.nextPageCursor) {
			// 						cursor = json.nextPageCursor
			// 					} else {
			// 						seeMore.remove()
			// 					}
			
			// 					createElements(json.data)
			// 				})
			// 			}
						
			// 			request()
			// 		}

			// 		if(initData) {
			// 			createElements(initData.data, true)

			// 			if(!initData.nextPageCursor) {
			// 				seeMore.remove()
			// 			}
			// 		}

			// 		seeMore.$on("click", loadOwners)
			// 	}

			// 	const itemIdPromise = new Promise(resolve => {
			// 		if(category === "bundles") {
			// 			document.$watch(
			// 				".bundle-items .item-card-link[href], #item-list-container-included-items .item-card-link[href]",
			// 				x => !x.textContent.trim().startsWith("Rthro"),
			// 				firstItem => {
			// 					const itemId = firstItem.href.replace(/^.*roblox\.com\/[^/]+\/(\d+).*$/, "$1")
			// 					resolve(itemId)
			// 				}
			// 			)
			// 		} else {
			// 			resolve(assetId)
			// 		}
			// 	})
				
			// 	itemIdPromise.then(itemId => {
			// 		RobloxApi.inventory.getAssetOwners(itemId, 10).then(json => {
			// 			if(!json?.data) {
			// 				return
			// 			}
						
			// 			document.$watch("asset-resale-pane, #recommendations-container, .bundle-items, #item-list-container-recommendations, #item-list-container-included-items", parent => {
			// 				const title = (parent.id === "recommendations-container" || parent.id === "item-list-container-recommendations") ? "Recommended"
			// 					: (parent.classList.contains("bundle-items") || parent.id === "item-list-container-included-items") ? "Included Items"
			// 					: "Resellers"
							
			// 				setupOwnersList(parent, title, itemId, json)
			// 			})
			// 		})
			// 	})
			// }
			
			container.$watch("#type-content, .item-type-field-container .field-content", typeField => {
				const isNewStyle = !typeField.classList.contains("field-content")
				
				const createRow = (label, content) => {
					return isReactItemDetails ? html`
					<div class="clearfix item-info-row-container" style=display:none>
						<div class="font-header-1 text-subheader text-label text-overflow row-label">${label}</div>
						<span class="btr-row-value font-body text">${content}</span>
					</div>` : isNewStyle ? html`
					<div class="clearfix item-field-container" style=display:none>
						<div class="font-header-1 text-subheader text-label text-overflow field-label">${label}</div>
						<span class="btr-row-value font-body text">${content}</span>
					</div>` : html`
					<div class="clearfix item-field-container" style=display:none>
						<div class="text-label text-overflow field-label">${label}</div>
						<span class="btr-row-value field-content">${content}</span>
					</div>`
				}
				
				if(SETTINGS.get("itemdetails.showSales") && category !== "bundles") {
					const salesContainer = createRow("Sales", "")
					
					typeField.parentNode.after(salesContainer)
					
					const show = sales => {
						if(typeof sales === "number") { salesContainer.$find(".btr-row-value").textContent = formatNumber(sales) }
						salesContainer.style.display = ""
					}
					
					const hide = () => {
						salesContainer.style.display = "none"
					}
					
					let canConfigure = false
					
					document.$watch("#configure-item", () => {
						canConfigure = true
						show()
					})

					if(category === "game-pass") {
						RobloxApi.gamepasses.getGamepassDetails(assetId).then(data => {
							const sales = data?.Sales
							
							if(Number.isSafeInteger(sales) && (canConfigure || sales > 0)) {
								show(sales)
							} else {
								hide()
							}
						})
					} else if(category === "badges") {
						salesContainer.$find(".text-label").textContent = "Awarded"
						show()
						
						RobloxApi.badges.getBadgeDetails(assetId).then(data => {
							const numAwarded = data?.statistics?.awardedCount
							
							if(Number.isSafeInteger(numAwarded)) {
								show(numAwarded)
							} else {
								hide()
							}
						})
					} else {
						RobloxApi.economy.getAssetDetails(assetId).then(data => {
							const sales = data?.Sales
							
							if(Number.isSafeInteger(sales) && (canConfigure || sales > 0)) {
								show(sales)
							} else {
								hide()
							}
						})
					}
				}
				
				if(SETTINGS.get("itemdetails.showCreatedAndUpdated") && category !== "bundles") {
					// remove old created/updated label
					if(isReactItemDetails) {
						const oldLabel = Array.from($.all("#item-details .wait-for-i18n-format-render")).find(x => !isNaN(Date.parse(x.textContent)))
						
						if(oldLabel) {
							oldLabel.parentNode.remove()
						}
					} else {
						const oldLabel = $("#item-details .date-time-i18n")
						
						if(oldLabel) {
							oldLabel.closest(".field-content")?.parentNode.remove()
						}
					}
					
					const createdContainer = createRow("Created", "")
					const updatedContainer = createRow("Updated", "")
					
					typeField.parentNode.after(createdContainer, updatedContainer)
					
					const show = (created, updated) => {
						if(created) { createdContainer.$find(".btr-row-value").textContent = new Date(created).$format("MMM DD, YYYY h:mm:ss A") }
						if(updated) { updatedContainer.$find(".btr-row-value").textContent = new Date(updated).$format("MMM DD, YYYY h:mm:ss A") }
						createdContainer.style.display = ""
						updatedContainer.style.display = ""
					}
					
					const hide = () => {
						createdContainer.style.display = "none"
						updatedContainer.style.display = "none"
					}
					
					show()

					if(category === "game-pass") {
						RobloxApi.gamepasses.getGamepassDetails(assetId).then(data => {
							show(data.Created, data.Updated)
						})
					} else if(category === "badges") {
						RobloxApi.badges.getBadgeDetails(assetId).then(data => {
							show(data.created, data.updated)
						})
					} else {
						RobloxApi.economy.getAssetDetails(assetId).then(data => {
							show(data.Created, data.Updated)
						})
					}
				}
			})
			
			if(isReactItemDetails) {
				// modern item details page
				
				container.$watch(".btr-buttons", buttons => {
					const assetId = +buttons.dataset.btrAssetId
					const itemType = buttons.dataset.btrItemType
					
					const isBundle = itemType === "Bundle"
					const assetTypeId = isBundle ? null : +buttons.dataset.btrAssetTypeId
					
					initPreview(assetId, assetTypeId, isBundle).then(preview => {
						if(!document.contains(buttons)) { return } // already changed page
						
						const parent = document.querySelector(".item-thumbnail-container, #item-thumbnail-container-frontend").parentNode
						preview.setParent(parent)
					})
					
					initExplorer(assetId, assetTypeId, isBundle).then(btnCont => {
						if(!btnCont) { return }
						buttons.append(btnCont)
					})
					
					initDownloadButton(assetId, assetTypeId, isBundle).then(btnCont => {
						if(!btnCont) { return }
						buttons.append(btnCont)
					})
					
					initContentButton(assetId, assetTypeId, isBundle).then(btnCont => {
						if(!btnCont) { return }
						buttons.append(btnCont)
					})
				})
			} else {
				// legacy item details page (used for badges/gamepasses)
				
				container.$watch(".text-robux-lg", elem => {
					const originalText = elem.textContent
					const robux = parseInt(originalText.replace(/\D/g, ""), 10)
					
					if(Number.isSafeInteger(robux)) {
						const cash = RobuxToCash.convert(robux)
						
						elem.append(html`<span class=btr-robuxToCash-big> (${cash})</span>`)
					}
				})
			}
		})
	})
}
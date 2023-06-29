"use strict"

const initPreview = async (assetId, assetTypeId, isBundle) => {
	if(!SETTINGS.get("itemdetails.itemPreviewer")) { return }
	
	const isPreviewable = AnimationPreviewAssetTypeIds.includes(assetTypeId) || WearableAssetTypeIds.includes(assetTypeId)
	if(!isBundle && !isPreviewable) { return }
	
	const previewerMode = SETTINGS.get("itemdetails.itemPreviewerMode")
	let autoLoading = false
	
	let currentOutfitId
	let playedAnimation
	let bundleType
	let preview
	
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
		
		preview.waitForAppearance().then(() => {
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
		})
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
					preview.applyAnimationPlayerType = true
					preview.playAnimation(assetId)
				}
				
			} else if(assetTypeId === 61) {
				// Emote asset, contains an Animation
				const model = await AssetCache.loadModel(assetId)
				const animation = model.find(x => x.ClassName === "Animation")
				const animationId = AssetCache.resolveAssetId(animation.AnimationId)
				
				preview.addAnimation(animationId, assetName)
				
				if(!playedAnimation) {
					playedAnimation = true
					preview.applyAnimationPlayerType = true
					preview.playAnimation(animationId)
				}
				
			} else {
				// Avatar animation
				const model = await AssetCache.loadModel(assetId)
				const folder = model.find(x => x.Name === "R15Anim")
				
				for(const value of folder.Children) {
					if(value.ClassName !== "StringValue") { continue }
					
					for(const animation of value.Children) {
						if(animation.ClassName !== "Animation") { continue }
						
						const animationId = AssetCache.resolveAssetId(animation.AnimationId)
						
						if(isBundle) {
							preview.addBundleAnimation(animationId, value.Name, assetName)

							if(!playedAnimation && value.Name === "run") {
								playedAnimation = true
								preview.applyAnimationPlayerType = true
								preview.playAnimation(animationId)
							}
						} else {
							preview.addAnimation(animationId, value.Name)

							if(!playedAnimation) {
								playedAnimation = true
								preview.applyAnimationPlayerType = true
								preview.playAnimation(animationId)
							}
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
		const details = await RobloxApi.catalog.getBundleDetails(assetId)
		bundleType = details.bundleType
		
		const outfitPromise = new Promise(resolve => {
			const promises = []
			
			for(const item of details.items) {
				if(item.type === "UserOutfit") {
					promises.push(RobloxApi.avatar.getOutfitDetails(item.id).then(details => {
						if(details.outfitType === "Avatar") {
							resolve(details)
						}
					}))
				}
			}
			
			Promise.all(promises).then(() => resolve(null))
		})
		
		outfitPromise.then(outfit => {
			if(outfit) {
				setOutfit(outfit.id)
			}
		})
		
		for(const item of details.items) {
			if(item.type === "Asset") {
				RobloxApi.economy.getAssetDetails(item.id).then(async data => {
					const outfit = await outfitPromise
					addAsset(item.id, data.AssetTypeId, item.name, outfit?.assets.find(x => x.id === item.id)?.meta)
				})
			}
		}
	} else {
		addAsset(assetId, assetTypeId, "Asset")
	}
}

const validAssetUrlCache = {}
const getCurrentValidAssetUrl = async (assetId, assetTypeId) => validAssetUrlCache[assetId] = validAssetUrlCache[assetId] || new Promise(resolve => {
	if(InvalidDownloadableAssetTypeIds.includes(assetTypeId)) {
		return resolve(null) // This asset is not a downloadable one (badge, gamepasses)
	}
	
	const defaultAssetUrl = AssetCache.toAssetUrl(assetId)
	
	if(BTRoblox.currentPage.name === "itemdetails") {
		const itemCont = $("#item-container")
		let creatorId = parseInt(itemCont?.dataset.expectedSellerId, 10)
		
		if(Number.isNaN(creatorId)) {
			creatorId = parseInt($(`.item-name-container a[href$="/profile"]`)?.href.match(/\/users\/(\d+)\//i)?.[1], 10)
		}
		
		if(creatorId === 1 || creatorId === loggedInUser) {
			return resolve(defaultAssetUrl)
		}
		
		if($("#configure-item")) {
			return resolve(defaultAssetUrl)
		}
	} else if(BTRoblox.currentPage.name === "marketplace") {
		const configureButton = $(`a[href*="/library/configure?id=${assetId}"]`)
		
		if(configureButton) {
			return resolve(defaultAssetUrl)
		}
	}
	
	if(assetTypeId === AssetType.Audio || assetTypeId === AssetType.Shirt || assetTypeId === AssetType.Pants || assetTypeId === AssetType.TShirt) {
		// Disabling this for clothing because people were using btr to steal and reupload clothing
		const promises = []
		
		promises.push(RobloxApi.economy.getAssetDetails(assetId).then(json => {
			if(json?.Creator?.Id === 1 || json?.Creator?.Id === loggedInUser) {
				resolve(defaultAssetUrl)
			}
		}))
		
		promises.push(RobloxApi.develop.userCanManage(loggedInUser, assetId).then(json => {
			console.log(json)
			if(json?.CanManage) {
				resolve(defaultAssetUrl)
			}
		}))
		
		Promise.allSettled(promises).finally(() => resolve(null))
		return
	}
	
	if(assetTypeId === AssetType.Model || assetTypeId === AssetType.Plugin) {
		if(BTRoblox.currentPage.name === "itemdetails") {
			const itemCont = $("#item-container")
			
			if(itemCont?.dataset.userassetId) {
				return resolve(defaultAssetUrl) // We have this asset in our inventory
			}
		}
		
		RobloxApi.assetdelivery.requestAssetV2(assetId).then(json => {
			if(!json.locations) {
				console.log("no locations")
				return resolve(null)
			}
			
			resolve(defaultAssetUrl)
		})
		
		return
	}
	
	resolve(defaultAssetUrl)
})

const initExplorer = async (assetId, assetTypeId, isBundle) => {
	if(!SETTINGS.get("itemdetails.explorerButton") || !isBundle && InvalidExplorableAssetTypeIds.includes(assetTypeId)) {
		return
	}
	
	if(!isBundle) {
		const assetUrl = await getCurrentValidAssetUrl(assetId, assetTypeId)
		
		if(!assetUrl) {
			console.log("no valid asset url")
			return
		}
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
			popover.style.left = `${-popover.clientWidth / 2}px`
			
			if(!explorerInitialized) {
				explorerInitialized = true
				
				if(isBundle) {
					RobloxApi.catalog.getBundleDetails(assetId).then(async details => {
						for(const item of details.items) {
							if(item.type === "Asset") {
								AssetCache.loadModel(item.id, { async: true }, model => explorer.addModel(item.name, model))
							}
						}
					})
					
				} else if(assetTypeId === AssetType.Head || assetTypeId === AssetType.DynamicHead) {
					AssetCache.loadModel(assetId, { async: true, format: "avatar_meshpart_head" }, model => explorer.addModel("MeshPart", model))
					AssetCache.loadModel(assetId, { async: true }, model => explorer.addModel("SpecialMesh", model))
					
				} else {
					AssetCache.loadModel(assetId, { async: true }, model => explorer.addModel("Default", model, { open: assetTypeId !== AssetType.Place }))
				}
			}
			
			explorer.select([])
			explorer.setActive(true)

			const popLeft = explorer.element.getBoundingClientRect().right + 276 >= document.documentElement.clientWidth
			explorer.element.$find(".btr-properties").classList.toggle("left", popLeft)
		})
		
		document.body.$on("click", ev => {
			if(popover.classList.contains("visible") && !btnCont.contains(ev.target)) {
				popover.classList.remove("visible")
				explorer.setActive(false)
			}
		})
	})
	
	return btnCont
}

const initDownloadButton = async (assetId, assetTypeId) => {
	if(!SETTINGS.get("itemdetails.downloadButton") || InvalidDownloadableAssetTypeIds.includes(assetTypeId)) {
		return
	}

	const assetUrl = await getCurrentValidAssetUrl(assetId, assetTypeId)
	if(!assetUrl) {
		return
	}
	
	const btnCont = html`
	<div class=btr-download-button-container>
		<a class=btr-download-button>
			<span class=btr-icon-download></span>
		</a>
	</div>`

	const download = (data, fileType) => {
		const title = $("#item-container .item-name-container h2")
		const fileName = `${title && formatUrlName(title.textContent, "") || assetId.toString()}.${fileType || getAssetFileType(assetTypeId, data)}`

		const blobUrl = URL.createObjectURL(new Blob([data], { type: "binary/octet-stream" }))
		startDownload(blobUrl, fileName)
		URL.revokeObjectURL(blobUrl)
	}

	const doNamedDownload = event => {
		const self = event.currentTarget
		event.preventDefault()

		if(assetTypeId === 4 && self.classList.contains("btr-download-obj")) {
			AssetCache.loadMesh(assetUrl, mesh => {
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
			AssetCache.loadBuffer(assetUrl, buffer => {
				if(!buffer) {
					alert("Failed to download")
					return
				}

				download(buffer)
			})
		}
	}

	const btn = btnCont.$find("a")
	if(assetTypeId === 4) {
		btn.dataset.toggle = "popover"
		btn.dataset.bind = "popover-btr-download"
		
		const popoverTemplate = html`
		<div class=rbx-popover-content data-toggle=popover-btr-download>
			<ul class=dropdown-menu role=menu>
				<li>
					<a class=btr-download-mesh href="${assetUrl}">Download as .mesh</a>
				</li>
				<li>
					<a class=btr-download-obj>Download as .obj</a>
				</li>
			</ul>
		</div>`
		
		if(IS_DEV_MODE) {
			popoverTemplate.$find("ul").append(html`
			<li>
				<a class=btr-log-mesh>Print to console</a>
			</li>`)
			
			btnCont.$on("click", ".btr-log-mesh", () => {
				AssetCache.loadMesh(assetUrl, mesh => {
					console.log(mesh)
				})
			})
		}
		
		btn.after(popoverTemplate)
		btnCont.$on("click", ".btr-download-mesh, .btr-download-obj", doNamedDownload)
	} else {
		btn.href = assetUrl
		btn.$on("click", doNamedDownload)
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

	const assetUrl = await getCurrentValidAssetUrl(assetId, assetTypeId)
	if(!assetUrl) {
		return
	}
	
	const btnCont = html`
	<div class=btr-content-button-container>
		<a class="btr-content-button disabled" href="#">
			<span class=btr-icon-content></span>
		</a>
	</div>`

	AssetCache.loadModel(assetId, model => {
		const contentUrl = getAssetUrl(model)
		const contentId = AssetCache.resolveAssetId(contentUrl)
		
		if(contentId) {
			btnCont.$find(">a").href = `https://www.roblox.com/library/${contentId}/` // marketplace needs full domain
			btnCont.$find(">a").classList.remove("disabled")
		}
	})
	
	return btnCont
}

pageInit.itemdetails = (category, assetIdString) => {
	const assetId = Number.parseInt(assetIdString, 10)

	if(RobuxToCash.isEnabled()) {
		document.$watch(".icon-robux-price-container .text-robux-lg", label => {
			const cash = RobuxToCash.convert(parseInt(label.textContent.replace(/\D/g, ""), 10))
			
			label.after(
				html`<span class=btr-robuxToCash-big>&nbsp;(${cash})</span>`
			)
		})
			.$watch("#item-average-price", label => {
				const update = () => {
					const amt = parseInt(label.textContent.replace(/\D/g, ""), 10)
					
					if(!Number.isSafeInteger(amt)) {
						return
					}
					
					observer.disconnect()
					
					const cash = RobuxToCash.convert(amt)
					label.textContent += ` (${cash})`
				}

				const observer = new MutationObserver(update)
				observer.observe(label, { characterData: true })
				update()
			})
			.$watch(".resellers .vlist").$then()
				.$watchAll(".list-item", item => {
					const label = item.$find(".reseller-price-container .text-robux")
					const btn = item.$find(".PurchaseButton")

					const cash = RobuxToCash.convert(+(btn ? btn.dataset.expectedPrice : ""))
					label.textContent += ` (${cash})`
				})
		
		if(category !== "game-pass") {
			modifyTemplate("recommendations", template => {
				for(const label of template.$findAll(".item-card-price .text-robux-tile")) {
					const cashText = ` (${RobuxToCash.convertAngular("item.price")})`
					const cashTitle = `R$ {{::${label.getAttribute("ng-bind")}}}${cashText}`
					
					const span = html`<span class=btr-robuxToCash-tile ng-show="${label.getAttribute("ng-show")}">${cashText}</span>`
					span.setAttribute("title", cashTitle)
					
					label.after(span)
					label.setAttribute("title", cashTitle)
				}
			})
		}
	}

	if(SETTINGS.get("general.hoverPreview")) {
		loadOptionalLibrary("previewer").then(() => {
			HoverPreview.register(".item-card", ".item-card-thumb-container")
		})
	}
	
	if(SETTINGS.get("general.useNativeAudioPlayer")) {
		document.$watch("#item-container", itemContainer => {
			itemContainer.$watch(".MediaPlayerIcon[data-mediathumb-url]", mediaPlayer => {
				useNativeAudioPlayer(mediaPlayer, true)
			})
		})
	}

	if(!SETTINGS.get("itemdetails.enabled")) { return }

	document.$watch("#AjaxCommentsContainer").$then().$watch(".comments").$then()
		.$watchAll(".comment-item", comment => {
			const span = comment.$find(".text-date-hint")
			const fixedDate = robloxTimeToDate(span.textContent.replace("|", ""))

			if(fixedDate) {
				span.setAttribute("btr-timestamp", "")
				span.textContent = fixedDate.$format("MMM D, YYYY | hh:mm A (T)")
			}
		})
	

	if(SETTINGS.get("itemdetails.addOwnersList")) {
		let wasOwnersListSetup = false
		
		const setupOwnersList = (parent, name, ownerAssetId, initData) => {
			if(wasOwnersListSetup) { return }
			wasOwnersListSetup = true

			const owners = html`
			<div class=btr-owners-container style=display:none>
				<div class=container-header>
					<h2>Owners</h2>
				</div>
				<div class=section-content>
				</div>
				<button class="btn-control-sm btr-see-more-owners">See More</button>
			</div>`

			const ownersList = owners.$find(".section-content")
			parent.before(owners)

			//

			let firstLoaded = false
			let isLoading = false
			let cursor = ""

			const btns = html`<div style="position: relative; float: right; height: 28px; margin-bottom: -28px; margin-top: 5px;"></div>`
			const parBtn = html`<button class="btn-secondary-xs active" style=float:right;margin:2px;>${name}</button>`
			const ownBtn = html`<button class=btn-control-xs style=float:right;margin:2px;>Owners</button>`

			btns.append(parBtn, ownBtn)
			owners.before(btns)

			ownBtn.$on("click", () => {
				parBtn.classList.replace("btn-secondary-xs", "btn-control-xs")
				ownBtn.classList.replace("btn-control-xs", "btn-secondary-xs")

				parBtn.classList.remove("active")
				ownBtn.classList.add("active")

				parent.style.display = "none"
				owners.style.display = ""

				if(!firstLoaded && !initData) {
					loadOwners()
				}
			})

			parBtn.$on("click", () => {
				ownBtn.classList.replace("btn-secondary-xs", "btn-control-xs")
				parBtn.classList.replace("btn-control-xs", "btn-secondary-xs")

				ownBtn.classList.remove("active")
				parBtn.classList.add("active")

				owners.style.display = "none"
				parent.style.display = ""
			})

			//
			
			const seeMore = owners.$find(".btr-see-more-owners")

			const createElement = ({ userId, userName, item }) => {
				const url = userId ? `/users/${userId}/profile` : ""

				const elem = html`
				<div class=btr-owner-item>
					<a href="${url}" title="${userName}" class="avatar avatar-headshot-md list-header">
						<img class=avatar-card-image 
							src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
							alt="${userName}"
						>
					</a>
					<div class=btr-owner-cont>
						<a class="text-name username" title="${userName}" href="${url}">${userName}</a>
						<div class=btr-owner-date>Since ${new Date(item.updated).$format("M/D/YYYY hh:mm:ss")}</div>
					</div>
					<div class=btr-serial>${item.serialNumber ? `#${item.serialNumber}` : `N/A`}</div>
				</div>`

				if(userId) {
					RobloxApi.thumbnails.getAvatarHeadshots([userId]).then(json => {
						elem.$find(".avatar-card-image").src = json.data[0].imageUrl
					})
				} else {
					elem.$findAll("a").forEach(x => x.removeAttribute("href"))
				}

				return elem
			}

			const getNames = request => {
				const userIds = Object.keys(request)
				if(!userIds.length) { return Promise.resolve() }

				return RobloxApi.users.getUserDetails(userIds).then(json => {
					for(const user of json.data) {
						const list = request[user.id]
						
						if(list) {
							for(const entry of list) {
								entry.userName = user.name
							}
						}
					}
				})
			}

			const createElements = (data, isInitial) => {
				const request = {}
				const elems = []
				
				for(const item of data) {
					if(item.owner && (item.owner.type !== "User" || item.owner.id === 1)) { continue }
					if(!item.owner && !item.serialNumber) { continue }

					if(item.owner) {
						const userId = item.owner.id

						const self = {
							item,
							userId,
							userName: `User#${userId}`
						}

						const list = request[userId] = request[userId] || []
						list.push(self)
						elems.push(self)
					} else {
						const self = {
							item,
							userId: 0,
							userName: `Hidden User`
						}

						elems.push(self)
					}
				}

				getNames(request).finally(() => {
					isLoading = false
					seeMore.textContent = "See More"
					seeMore.removeAttribute("disabled")
					
					if(!firstLoaded && !isInitial) {
						firstLoaded = true
						ownersList.$empty()
					}

					elems.forEach(
						x => ownersList.append(createElement(x))
					)
				})
			}

			const loadOwners = () => {
				if(isLoading) { return }
				isLoading = true

				seeMore.textContent = "Loading..."
				seeMore.setAttribute("disabled", "")

				const maxRetries = 10
				let retriesLeft = maxRetries

				const request = () => {
					RobloxApi.inventory.getAssetOwners(ownerAssetId, 100, cursor).then(json => {
						if(!json?.data) {
							if(retriesLeft > 0) {
								retriesLeft--
								seeMore.textContent = `Loading... (${maxRetries - retriesLeft})`
								setTimeout(request, 2e3)
							} else {
								isLoading = false
	
								const failText = seeMore.textContent = "Failed to load owners, try again later"
								setTimeout(() => (seeMore.textContent === failText ? seeMore.textContent = "See More" : null), 2e3)
	
								seeMore.removeAttribute("disabled")
							}
							return
						}
	
						if(json.nextPageCursor) {
							cursor = json.nextPageCursor
						} else {
							seeMore.remove()
						}
	
						createElements(json.data)
					})
				}
				
				request()
			}

			if(initData) {
				createElements(initData.data, true)

				if(!initData.nextPageCursor) {
					seeMore.remove()
				}
			}

			seeMore.$on("click", loadOwners)
		}

		const itemIdPromise = new Promise(resolve => {
			if(category === "bundles") {
				document.$watch(
					".bundle-items .item-card-link[href]",
					x => !x.textContent.trim().startsWith("Rthro"),
					firstItem => {
						const itemId = firstItem.href.replace(/^.*roblox\.com\/[^/]+\/(\d+).*$/, "$1")
						resolve(itemId)
					}
				)
			} else {
				resolve(assetId)
			}
		})


		itemIdPromise.then(itemId => {
			RobloxApi.inventory.getAssetOwners(itemId, 10).then(json => {
				if(!json?.data) {
					return
				}

				document.$watch("#item-container").$then()
					.$watch(">asset-resale-pane, >#recommendations-container,>.bundle-items", parent => {
						const title = parent.id === "recommendations-container" ? "Recommended"
							: parent.classList.contains("bundle-items") ? "Included Items"
								: "Resellers"
						
						setupOwnersList(parent, title, itemId, json)
					})
			})
		})
	}

	if(SETTINGS.get("itemdetails.showCreatedAndUpdated") && category !== "bundles") {
		const createdLabel = html`
		<div class="clearfix item-field-container">
			<div class="font-header-1 text-subheader text-label text-overflow field-label">Created</div>
			<span class="field-content"></div>
		</div>`

		let updatedLabel

		let createdTS
		let updatedTS

		const apply = () => {
			if(!updatedLabel || !createdTS) {
				return
			}

			createdLabel.$find(".field-content").textContent = new Date(createdTS).$format("MMM DD, YYYY h:mm:ss A")
			updatedLabel.$find(".field-content").textContent = new Date(updatedTS).$format("MMM DD, YYYY h:mm:ss A")
		}

		document.$watch(
			"#item-details .item-field-container .field-label",
			label => label.textContent === "Updated",
			label => {
				updatedLabel = label.parentNode
				updatedLabel.before(createdLabel)
				apply()

				updatedLabel.$find(".field-content").classList.remove("date-time-i18n")
			}
		)

		if(category === "game-pass") {
			RobloxApi.gamepasses.getGamepassDetails(assetId).then(data => {
				createdTS = data.Created
				updatedTS = data.Updated
				apply()
			})
		} else if(category === "badges") {
			RobloxApi.badges.getBadgeDetails(assetId).then(data => {
				createdTS = data.created
				updatedTS = data.updated
				apply()
			})
		} else {
			RobloxApi.economy.getAssetDetails(assetId).then(data => {
				createdTS = data.Created
				updatedTS = data.Updated
				apply()
			})
		}
	}
	
	if(SETTINGS.get("itemdetails.showSales")) {
		const elem = html`
		<div class="clearfix item-field-container" style="display:none">
			<div class="font-header-1 text-label text-overflow field-label">Sales</div>
			<span class=field-content></div>
		</div>`
		
		document.$watch(
			"#item-details .item-field-container .field-label",
			label => label.textContent === "Updated",
			label => label.parentNode.after(elem)
		)

		const apply = sales => {
			elem.style.display = ""
			elem.$find(".field-content").textContent = formatNumber(sales)
		}

		if(category === "game-pass") {
			RobloxApi.gamepasses.getGamepassDetails(assetId).then(data => {
				const sales = data?.Sales
				
				if(Number.isSafeInteger(sales) && sales > 0) {
					apply(sales)
				}
			})
		} else if(category !== "bundles") {
			RobloxApi.economy.getAssetDetails(assetId).then(data => {
				const sales = data?.Sales
				
				if(Number.isSafeInteger(sales) && sales > 0) {
					apply(sales)
				}
			})
		}
	}

	if(category === "bundles") {
		document.$watch("#item-container > .section-content", () => {
			initPreview(assetId, null, true)
			
			initExplorer(assetId, null, true).then(btnCont => {
				if(!btnCont) { return }
				const parent = $("#item-container > .section-content")
				
				parent.append(btnCont)
				parent.parentNode.classList.add("btr-explorer-btn-shown")
			})
		})

		return
	}
	
	document.$watch("#item-container", itemCont => {
		let assetTypeId = parseInt(itemCont.dataset.assetTypeId, 10)
		
		if(category === "game-pass") {
			assetTypeId = AssetType.GamePass
		}
		
		if(!Number.isSafeInteger(assetTypeId)) {
			if(IS_DEV_MODE) { alert(`Invalid assetTypeId for ${itemCont.dataset.assetType}`) }
			return
		}

		initPreview(assetId, assetTypeId)

		itemCont.$watch(">.section-content", () => {
			initExplorer(assetId, assetTypeId).then(btnCont => {
				if(!btnCont) { return }
				const parent = $("#item-container > .section-content")
				
				parent.append(btnCont)
				parent.parentNode.classList.add("btr-explorer-btn-shown")
			})
			
			initDownloadButton(assetId, assetTypeId).then(btnCont => {
				if(!btnCont) { return }
				const parent = $("#item-container > .section-content")
				
				parent.append(btnCont)
				parent.parentNode.classList.add("btr-download-btn-shown")
			})
			
			initContentButton(assetId, assetTypeId).then(btnCont => {
				if(!btnCont) { return }
				const parent = $("#item-container > .section-content")
				
				parent.append(btnCont)
				parent.parentNode.classList.add("btr-content-btn-shown")
			})
		})

		if(SETTINGS.get("itemdetails.imageBackgrounds") && (assetTypeId === 1 || assetTypeId === 13)) {
			itemCont.$watch("#AssetThumbnail", thumb => {
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
					.$on("mouseover", ".btr-bg-btn", ev => {
						thumb.dataset.btrBg = ev.currentTarget.dataset.color
					})
					.$on("mouseout", ".btr-bg-btn", () => {
						thumb.dataset.btrBg = localStorage["btr-item-thumb-bg"]
					})


				const selectedBg = localStorage["btr-item-thumb-bg"] || "white"
				btns.$find(`[data-color="${selectedBg}"]`).click()
			})
		}
	})
}
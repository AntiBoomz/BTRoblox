"use strict"

const initPreview = async (assetId, assetTypeId, isBundle) => {
	if(!SETTINGS.get("itemdetails.itemPreviewer")) { return }
	
	const isPreviewable = AnimationPreviewAssetTypeIds.includes(assetTypeId) || WearableAssetTypeIds.includes(assetTypeId)
	const isPackage = assetTypeId === 32

	if(isPackage || isBundle || isPreviewable) {
		await loadOptionalLibrary("previewer")

		const previewerMode = SETTINGS.get("itemdetails.itemPreviewerMode")
		const preview = new ItemPreviewer()

		let playedAnim = false
		let autoLoading = false
		let bundleOutfitId

		const addAssetPreview = async (itemId, itemName = "Unknown") => {
			const assetPreview = preview.addAssetPreview(itemId)
			const model = await AssetCache.loadModel(itemId)
			
			let isAnimation = false
			
			for(const child of model) {
				if(child.ClassName === "Folder" && child.Name === "R15Anim") {
					for(const value of child.Children) {
						if(value.ClassName !== "StringValue") { continue }
						
						for(const anim of value.Children) {
							if(anim.ClassName !== "Animation") { continue }

							const animId = AssetCache.resolveAssetId(anim.AnimationId)
							if(!animId) { continue }

							isAnimation = true

							if(isBundle) {
								preview.addBundleAnimation(animId, value.Name, itemName)

								if(!playedAnim && value.Name === "run") {
									playedAnim = true
									preview.playAnimation(animId)
								}
							} else {
								preview.addAnimation(animId, value.Name)

								if(!playedAnim) {
									playedAnim = true
									preview.playAnimation(animId)
								}
							}
						}
					}
				} else if(child.ClassName === "KeyframeSequence") {
					isAnimation = true

					preview.addAnimation(itemId, String(itemId))
					preview.playAnimation(itemId)
				} else if(child.ClassName === "Animation") {
					isAnimation = true

					const animId = child.AnimationId
					preview.addAnimation(animId, child.Name)
					preview.playAnimation(animId)
				}
			}

			if(assetPreview || isAnimation) {
				preview.setVisible(true)

				if(isAnimation) {
					preview.applyAnimationPlayerType = true
				}

				if(!autoLoading && (previewerMode === "always" || previewerMode === "animations" && isAnimation)) {
					autoLoading = true
					$.ready(() => preview.setEnabled(true))
				}
			}
		}

		if(isBundle) {
			const details = await RobloxApi.catalog.getBundleDetails(assetId)
			
			for(const item of details.items) {
				if(item.type === "Asset") {
					addAssetPreview(item.id, item.name)
				} else if(item.type === "UserOutfit") {
					bundleOutfitId = item.id
					preview.setBundleOutfit(bundleOutfitId)
					
					if(details.bundleType !== "AvatarAnimations") {
						preview.selectOutfit("bundle")
					}
				}
			}
		} else if(isPackage) {
			const text = await AssetCache.loadText(assetId)
			
			for(const itemId of text.split(";")) {
				addAssetPreview(itemId)
			}
		} else {
			const isAnim = AnimationPreviewAssetTypeIds.includes(assetTypeId)
			const isAsset = WearableAssetTypeIds.includes(assetTypeId)

			if(isAnim || isAsset) {
				addAssetPreview(assetId)
			}
		}
	}
}

let currentValidAssetPromise
const getCurrentValidAssetUrl = async (assetId, assetTypeId) => currentValidAssetPromise = currentValidAssetPromise || new SyncPromise(resolve => {
	const itemCont = $("#item-container") // This is never called before container is loaded
	if(!itemCont) {
		resolve(null)
		throw new Error("getCurrentValidAssetUrl was called before #item-container loaded")
	}

	if(InvalidDownloadableAssetTypeIds.includes(assetTypeId)) {
		return resolve(null) // This asset is not a downloadable one (badge, gamepasses)
	}

	const defaultAssetUrl = AssetCache.toAssetUrl(assetId)

	if((assetTypeId === 2 /* T-Shirt */ || assetTypeId === 11 /* Shirt */ || assetTypeId === 12 /* Pants */) && !IS_DEV_MODE) {
		// Special case to stop people from using BTR to steal clothing
		// Only be valid if owned by roblox or configure exists

		itemCont.$watch(".item-name-container a", creatorLink => {
			if(creatorLink.href.match(/\/users\/1\//)) {
				resolve(defaultAssetUrl)
			}
		})

		itemCont.$watch("#configure-item", () => resolve(defaultAssetUrl))
		
		$.ready(() => resolve(null)) // Failure case
		return
	}

	if(assetTypeId === 3 /* Audio */) {
		// Audio is a bit special, as you can only download audio that was created by you or Roblox
		// So we're going to get rbxcdn url from the previewer

		// Gotta specify #AssetThumbnail as recommendations are also in itemCont
		itemCont.$watch("#AssetThumbnail .MediaPlayerIcon", icon => {
			resolve(icon.dataset.mediathumbUrl)
		})

		$.ready(() => resolve(null)) // Failure case
		return
	}

	if(itemCont.dataset.userassetId) {
		return resolve(defaultAssetUrl) // We have this asset in our inventory
	}

	if(assetTypeId === 10 /* Model */ || assetTypeId === 38 /* Plugin */) {
		// These are the only types that can't be downloaded if they're private
		// So we send a head request to see if we can access the asset, if yes, then return that
		
		$.fetch(`https://assetdelivery.roblox.com/v1/assetId/${assetId}`, { credentials: "include" }).then(async resp => {
			if(!resp.ok) {
				return resolve(null)
			}

			const json = await resp.json()
			if(!json || !json.location) {
				return resolve(null)
			}

			resolve(defaultAssetUrl) // Results is used in links, so returning assetdelivery url over rbxcdn makes stuff more consistent
		})

		return
	}

	resolve(defaultAssetUrl)
})

const initExplorer = async (assetId, assetTypeId, isBundle) => {
	if(!SETTINGS.get("itemdetails.explorerButton") || !isBundle && InvalidExplorableAssetTypeIds.includes(assetTypeId)) {
		return
	}
	
	const btnCont = html`
	<div style=display:none>
		<a class="btr-explorer-button" data-toggle="popover" data-bind="btr-explorer-content">
			<span class="btr-icon-explorer"</span>
		</a>
		<div class="rbx-popover-content" data-toggle="btr-explorer-content">
			<div class="btr-explorer-parent"></div>
		</div>
	</div>`

	const parent = $("#item-container > .section-content")
	parent.append(btnCont)

	if(!isBundle) {
		const assetUrl = await getCurrentValidAssetUrl(assetId, assetTypeId)
		if(!assetUrl) {
			btnCont.remove()
			return
		}
	}

	btnCont.style.display = ""
	parent.parentNode.classList.add("btr-explorer-btn-shown")

	//

	await loadOptionalLibrary("explorer")
	const explorer = new Explorer()
	let explorerInitialized = false

	btnCont.$watchAll(".popover", popover => {
		if(!explorerInitialized) {
			explorerInitialized = true

			if(isBundle) {
				RobloxApi.catalog.getBundleDetails(assetId).then(async details => {
					details.items.forEach(item => {
						if(item.type === "Asset") {
							AssetCache.loadModel(item.id, model => explorer.addModel(item.name, model))
						}
					})
				})
			} else if(assetTypeId === 32) {
				AssetCache.loadText(assetId, text => text.split(";").forEach(id => {
					AssetCache.loadModel(id, model => explorer.addModel(id.toString(), model))
				}))
			} else {
				AssetCache.loadModel(assetId, model => explorer.addModel("Main", model))
			}
		}

		explorer.select([])

		popover.$find(".btr-explorer-parent").replaceWith(explorer.element)

		const popLeft = explorer.element.getBoundingClientRect().right + 276 >= document.documentElement.clientWidth
		explorer.element.$find(".btr-properties").classList.toggle("left", popLeft)
	})
}

const initDownloadButton = async (assetId, assetTypeId) => {
	if(!SETTINGS.get("itemdetails.downloadButton") || InvalidDownloadableAssetTypeIds.includes(assetTypeId)) {
		return
	}

	const btnCont = html`<div style=display:none><a class="btr-download-button"><div class="btr-icon-download"></div></a></div>`
	const parent = $("#item-container > .section-content")
	parent.append(btnCont)

	const assetUrl = await getCurrentValidAssetUrl(assetId, assetTypeId)
	if(!assetUrl) {
		btnCont.remove()
		return
	}

	btnCont.style.display = ""
	parent.parentNode.classList.add("btr-download-btn-shown")

	//

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
				
				for(let i = 0, len = mesh.faces.length; i < len; i += 3) {
					lines.push(`f ${mesh.faces[i] + 1} ${mesh.faces[i + 1] + 1} ${mesh.faces[i + 2] + 1}`)
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

		btn.after(html`
		<div class=rbx-popover-content data-toggle=popover-btr-download>
			<ul class=dropdown-menu role=menu>
				<li>
					<a class=btr-download-mesh href="${assetUrl}">Download as .mesh</a>
				</li>
				<li>
					<a class=btr-download-obj>Download as .obj</a>
				</li>
			</ul>
		</div>
		`)

		btn.parentNode.$on("click", ".btr-download-mesh, .btr-download-obj", doNamedDownload)
	} else {
		btn.href = assetUrl
		btn.$on("click", doNamedDownload)
	}
}

const initContentButton = async (assetId, assetTypeId) => {
	const assetTypeContainer = ContainerAssetTypeIds[assetTypeId]
	
	if(!SETTINGS.get("itemdetails.contentButton") || !assetTypeContainer) {
		return
	}

	const btn = html`<a class="btr-content-button disabled" href="#" style=display:none><div class="btr-icon-content"></div></a>`
	const parent = $("#item-container > .section-content")
	parent.append(btn)

	const assetUrl = await getCurrentValidAssetUrl(assetId, assetTypeId)
	if(!assetUrl) {
		btn.remove()
		return
	}

	btn.style.display = ""
	parent.parentNode.classList.add("btr-content-btn-shown")

	//

	AssetCache.loadModel(assetId, model => {
		const inst = model.find(assetTypeContainer.filter)
		if(!inst) { return }

		const actId = AssetCache.resolveAssetId(inst[assetTypeContainer.prop])
		if(!actId) { return }

		btn.href = `/catalog/${actId}`
		btn.classList.remove("disabled")
	})
}

pageInit.itemdetails = function(category, assetIdString) {
	const assetId = Number.parseInt(assetIdString, 10)

	if(RobuxToCash.isEnabled()) {
		document.$watch(".icon-robux-price-container .text-robux-lg", label => {
			const cash = RobuxToCash.convert(+label.textContent.replace(/,/g, ""))
			label.after(
				html`<span class=btr-robuxToCash-big>&nbsp;(${cash})</span>`
			)
		})
			.$watch("#item-average-price", label => {
				const update = () => {
					const amt = +label.textContent.replace(/,/g, "")
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
					<h3>Owners</h3>
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

				const thumbUrl = userId
					? `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=60&height=60&format=png`
					: `https://t0.rbxcdn.com/36eac87cdcca4e2027787d6ceae80507`

				const elem = html`
				<div class=btr-owner-item>
					<a href="${url}" title="${userName}" class="avatar avatar-headshot-md list-header">
						<img class=avatar-card-image 
							src="${thumbUrl}"
							alt="${userName}"
						>
					</a>
					<div class=btr-owner-cont>
						<a class="text-name username" title="${userName}" href="${url}">${userName}</a>
						<div class=btr-owner-date>Since ${new Date(item.updated).$format("M/D/YYYY hh:mm:ss")}</div>
					</div>
					<div class=btr-serial>${item.serialNumber ? `#${item.serialNumber}` : `N/A`}</div>
				</div>`

				if(!userId) {
					elem.$findAll("a").forEach(x => x.removeAttribute("href"))
				}

				return elem
			}

			const getNames = request => {
				const keys = Object.keys(request)
				if(!keys.length) { return SyncPromise.resolve() }

				return $.fetch(`https://users.roblox.com/v1/users`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						userIds: keys
					})
				}).then(async resp => {
					const json = await resp.json()

					json.data.forEach(user => {
						const list = request[user.id]

						list.forEach(x => {
							x.userName = user.name
						})
					})
				})
			}

			const createElements = data => {
				const request = {}
				const elems = []

				data.forEach(item => {
					if(item.owner && (item.owner.type !== "User" || item.owner.id === 1)) { return }
					if(!item.owner && !item.serialNumber) { return }

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
							userName: `Unknown User`
						}

						elems.push(self)
					}
				})

				getNames(request).finally(() => {
					isLoading = false
					seeMore.textContent = "See More"
					seeMore.removeAttribute("disabled")

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

				const url = `https://inventory.roblox.com/v2/assets/${ownerAssetId}/owners?limit=100&cursor=${cursor}`
				const maxRetries = 10
				let retriesLeft = maxRetries

				const handler = async resp => {
					if(!resp.ok) {
						if(retriesLeft > 0) {
							retriesLeft--
							seeMore.textContent = `Loading... (${maxRetries - retriesLeft})`
							setTimeout(() => $.fetch(url).then(handler), 2e3)
						} else {
							isLoading = false

							const failText = seeMore.textContent = "Failed to load owners, try again later"
							setTimeout(() => (seeMore.textContent === failText ? seeMore.textContent = "See More" : null), 2e3)

							seeMore.removeAttribute("disabled")
						}
						return
					}

					if(!firstLoaded) {
						firstLoaded = true
						ownersList.$empty()
					}

					const json = await resp.json()

					if(json.nextPageCursor) {
						cursor = json.nextPageCursor
					} else {
						seeMore.remove()
					}

					createElements(json.data)
				}

				$.fetch(url, { credentials: "include" }).then(handler)
			}

			if(initData) {
				createElements(initData.data)

				if(!initData.nextPageCursor) {
					seeMore.remove()
				}
			}

			seeMore.$on("click", loadOwners)
		}

		const itemIdPromise = new SyncPromise(resolve => {
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
			const checkUrl = `https://inventory.roblox.com/v2/assets/${itemId}/owners?limit=10`

			fetch(checkUrl, { credentials: "include" }).then(async resp => {
				if(resp.status === 403) {
					return
				}

				const initData = resp.ok && (await resp.json())

				document.$watch("#item-container").$then()
					.$watch(">asset-resale-pane, >#recommendations-container,>.bundle-items", parent => {
						const title = parent.id === "recommendations-container" ? "Recommended"
							: parent.classList.contains("bundle-items") ? "Included Items"
								: "Resellers"
						
						setupOwnersList(parent, title, itemId, initData)
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
			$.fetch(`https://api.roblox.com/marketplace/game-pass-product-info?gamePassId=${assetId}`).then(async resp => {
				if(!resp.ok) { return }

				({ Created: createdTS, Updated: updatedTS } = await resp.json())
				apply()
			})
		} else if(category === "badges") {
			$.fetch(`https://badges.roblox.com/v1/badges/${assetId}`).then(async resp => {
				if(!resp.ok) { return }

				({ created: createdTS, updated: updatedTS } = await resp.json())
				apply()
			})
		} else {
			RobloxApi.api.getProductInfo(assetId).then(data => {
				({ Created: createdTS, Updated: updatedTS } = data)
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
			$.fetch(`https://api.roblox.com/marketplace/game-pass-product-info?gamePassId=${assetId}`).then(async resp => {
				if(!resp.ok) { return }

				const sales = (await resp.json()).Sales
				if(sales) {
					apply(sales)
				}
			})
		} else if(category !== "bundles") {
			RobloxApi.api.getProductInfo(assetId).then(info => {
				const sales = info?.Sales
				
				if(Number.isSafeInteger(sales) && sales > 0) {
					apply(sales)
				}
			})
		}
	}

	if(category === "bundles") {
		document.$watch("#item-container > .section-content", () => {
			initPreview(assetId, null, true)
			initExplorer(assetId, null, true)
		})

		return
	}
	
	document.$watch("#item-container", itemCont => {
		const assetTypeName = itemCont.dataset.assetType
		const assetTypeId = AssetTypeIds.indexOf(assetTypeName)
		
		if(assetTypeId === -1) {
			if(IS_DEV_MODE) { alert(`Missing assetTypeId for ${assetTypeName}`) }
			return
		}

		initPreview(assetId, assetTypeId)

		itemCont.$watch(">.section-content", () => {
			initExplorer(assetId, assetTypeId)
			initDownloadButton(assetId, assetTypeId)
			initContentButton(assetId, assetTypeId)
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

		if(SETTINGS.get("itemdetails.whiteDecalThumbnailFix") && assetTypeId === 13) {
			const emptyImg = "https://t3.rbxcdn.com/a95654871aa1ffd3c6fc38e1ac3bf369"
			let fixingThumb = false
			let newThumb

			const fixThumb = thumb => {
				if(newThumb) { thumb.src = newThumb }
				if(fixingThumb || thumb.src !== emptyImg) { return }

				fixingThumb = true

				AssetCache.loadModel(assetId, model => {
					const decal = model.find(x => x.ClassName === "Decal")
					if(!decal) { return }

					const imgId = AssetCache.resolveAssetId(decal.Texture)
					if(!imgId) { return }

					newThumb = `https://assetgame.roblox.com/asset-thumbnail/image?assetId=${imgId}&width=420&height=420`

					$.all(".thumbnail-span > img, .thumbnail-span-original > img").forEach(img => {
						img.src = newThumb
					})
				})
			}

			itemCont.$watch("#AssetThumbnail").$then().$watchAll(".thumbnail-span", parent => {
				parent.$watchAll("img", img => {
					new MutationObserver(() => fixThumb(img)).observe(img, { attributes: true, attributeFilter: ["src"] })
					fixThumb(img)
				})
			})
		}
	})
}
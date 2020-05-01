"use strict"

const initPreview = async (assetId, assetTypeId, isBundle) => {
	const isPreviewable = AnimationPreviewAssetTypeIds.includes(assetTypeId) || WearableAssetTypeIds.includes(assetTypeId)
	const isPackage = assetTypeId === 32

	if(settings.itemdetails.itemPreviewer && (isPackage || isBundle || isPreviewable)) {
		await OptionalLoader.loadPreviewer()

		const previewerMode = settings.itemdetails.itemPreviewerMode
		const preview = new ItemPreviewer()
		let playedAnim = false
		let autoLoading = false
		let bundleOutfitId

		const addAssetPreview = (itemId, itemName = "Unknown") => {
			const assetPreview = preview.addAssetPreview(itemId)

			AssetCache.loadModel(itemId, model => {
				let isAnimation = false

				model.forEach(child => {
					if(child.ClassName === "Folder" && child.Name === "R15Anim") {
						child.Children.forEach(value => {
							if(value.ClassName !== "StringValue") { return }

							value.Children.forEach(anim => {
								if(anim.ClassName !== "Animation") { return }

								const animId = AssetCache.resolveAssetId(anim.AnimationId)
								if(!animId) { return }

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
										console.log("Play", animId)
										preview.playAnimation(animId)
									}
								}
							})
						})
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
				})

				if(assetPreview || isAnimation) {
					preview.setVisible(true)
	
					if(isAnimation) {
						preview.autoLoadPlayerType = false
						preview.setPlayerTypeOnAnim = true
					}
	
					if(!autoLoading && (previewerMode === "always" || previewerMode === "animations" && isAnimation)) {
						autoLoading = true
						$.ready(() => preview.setEnabled(true))
					}
				}
			})
		}

		if(isBundle) {
			const url = `https://catalog.roblox.com/v1/bundles/${assetId}/details`
			$.fetch(url).then(async resp => {
				const data = await resp.json()

				data.items.forEach(item => {
					if(item.type === "Asset") {
						addAssetPreview(item.id, item.name)
					} else if(item.type === "UserOutfit") {
						bundleOutfitId = item.id
						preview.setBundleOutfit(bundleOutfitId)
						
						if(data.bundleType !== "AvatarAnimations") {
							preview.selectOutfit("bundle")
						}
					}
				})
			})
		} else if(isPackage) {
			AssetCache.loadText(assetId, text => {
				text.split(";").forEach(itemId => {
					addAssetPreview(itemId)
				})
			})
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

	if(assetTypeId === 2 /* T-Shirt */ || assetTypeId === 11 /* Shirt */ || assetTypeId === 12 /* Pants */) {
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

	if(itemCont.dataset.userassetId) {
		return resolve(defaultAssetUrl) // We have this asset in our inventory
	}

	if(assetTypeId === 3 /* Audio */) {
		// Audio is a bit special, as you can only download audio you own or was made by Roblox
		// So we're going to get rbxcdn url from the previewer

		itemCont.$watch("#AssetThumbnail").$then().$watch("> .MediaPlayerControls .MediaPlayerIcon", icon => {
			resolve(icon.dataset.mediathumbUrl)
		})

		$.ready(() => resolve(null)) // Failure case
		return
	}

	if(assetTypeId === 10 /* Model */ || assetTypeId === 38 /* Plugin */) {
		// These are the only types that can't be downloaded if they're private
		// So we send a head request to see if we can access the asset, if yes, then return that
		
		fetch(`https://assetdelivery.roblox.com/v1/assetId/${assetId}`, { credentials: "include" }).then(async resp => {
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
	if(!settings.itemdetails.explorerButton || !isBundle && InvalidExplorableAssetTypeIds.includes(assetTypeId)) {
		return console.log("inv")
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

	await OptionalLoader.loadExplorer()
	const explorer = new Explorer()
	let explorerInitialized = false

	btnCont.$watchAll(".popover", popover => {
		if(!explorerInitialized) {
			explorerInitialized = true

			if(isBundle) {
				const url = `https://catalog.roblox.com/v1/bundles/${assetId}/details`

				$.fetch(url).then(async resp => {
					const data = await resp.json()
	
					data.items.forEach(item => {
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

		popover.$find(".btr-explorer-parent").replaceWith(explorer.element)

		const popLeft = explorer.element.getBoundingClientRect().right + 276 >= document.documentElement.clientWidth
		explorer.element.$find(".btr-properties").classList.toggle("left", popLeft)
	})
}

const initDownloadButton = async (assetId, assetTypeId) => {
	if(!settings.itemdetails.downloadButton || InvalidDownloadableAssetTypeIds.includes(assetTypeId)) {
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
		const fileName = `${title && FormatUrlName(title.textContent, "") || assetId.toString()}.${fileType || GetAssetFileType(assetTypeId, data)}`

		const blobUrl = URL.createObjectURL(new Blob([data]))
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
	
	if(!settings.itemdetails.contentButton || !assetTypeContainer) {
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

pageInit.itemdetails = function(category, assetId) {
	if(settings.general.robuxToUSD) {
		document.$watch(".icon-robux-price-container .text-robux-lg", label => {
			const usd = RobuxToUSD(label.textContent.replace(/,/g, ""))
			label.after(
				html`<span class=text-robux-lg>&nbsp;($${usd})</span>`
			)
		})
			.$watch("#item-average-price", label => {
				const observer = new MutationObserver(() => {
					observer.disconnect()
					const usd = RobuxToUSD(label.textContent.replace(/,/g, ""))
					label.textContent += ` ($${usd})`
				})

				observer.observe(label, { childList: true })
			})
			.$watch(".resellers .vlist").$then()
				.$watchAll(".list-item", item => {
					const label = item.$find(".reseller-price-container .text-robux")
					const btn = item.$find(".PurchaseButton")
					const usd = RobuxToUSD(btn ? btn.dataset.expectedPrice : "")
					label.textContent += ` ($${usd})`
				})
		
		modifyTemplate("recommendations", template => {
			const label = template.$find(".item-card-price .text-robux-tile")

			if(label) {
				label.style.display = "inline"
				label.textContent += ` ($\{{::((item.price*${GetRobuxRatio()[0]})/${GetRobuxRatio()[1]}) | number:2}})`
				label.title = "R$ " + label.textContent
			} else {
				if(IS_DEV_MODE) {
					alert("BTRoblox modifyTemplate('recommendations'): Missing label")
				}
			}
		})
	}

	if(settings.general.hoverPreview) {
		OptionalLoader.loadPreviewer().then(() => {
			HoverPreview.register(".item-card", ".item-card-thumb-container")
		})
	}

	if(!settings.itemdetails.enabled) { return }

	document.$watch("#AjaxCommentsContainer").$then().$watch(".comments").$then()
		.$watchAll(".comment-item", comment => {
			const span = comment.$find(".text-date-hint")
			const fixedDate = RobloxTime(span.textContent.replace("|", ""))
			if(fixedDate) {
				span.setAttribute("btr-timestamp", "")
				span.textContent = fixedDate.$format("MMM D, YYYY | hh:mm A (T)")
			}
		})
	

	if(settings.itemdetails.addOwnersList) {
		let wasOwnersListSetup = false
		
		const setupOwnersList = (parent, name, ownerAssetId = assetId) => {
			if(wasOwnersListSetup) { return }
			wasOwnersListSetup = true

			const owners = html`
			<div class=btr-owners-container>
				<div class=container-header>
					<h3>Owners</h3>
				</div>
				<div class=section-content>
				</div>
				<button class="btn-control-sm btr-see-more-owners">See More</button>
			</div>`

			const ownersList = owners.$find(".section-content")

			parent.classList.add("btr-owners-parent")
			parent.append(owners)

			let firstLoaded = false
			let isLoading = false
			let cursor = ""
			
			parent.$watch(".container-header", header => {
				const rBtn = html`<button class=btn-secondary-xs style=float:right;margin:2px;>${name}</button>`
				const oBtn = html`<button class=btn-control-xs style=float:right;margin:2px;>Owners</button>`
				header.append(rBtn, oBtn)
				
				oBtn.$on("click", () => {
					parent.classList.add("btr-owners-active")

					rBtn.classList.replace("btn-secondary-xs", "btn-control-xs")
					oBtn.classList.replace("btn-control-xs", "btn-secondary-xs")

					owners.$find(".container-header").append(rBtn, oBtn)

					if(!firstLoaded) {
						loadOwners()
					}
				})

				rBtn.$on("click", () => {
					parent.classList.remove("btr-owners-active")

					oBtn.classList.replace("btn-secondary-xs", "btn-control-xs")
					rBtn.classList.replace("btn-control-xs", "btn-secondary-xs")

					header.append(rBtn, oBtn)
				})
			})

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

			const loadOwners = () => {
				if(isLoading) { return }
				isLoading = true

				if(!firstLoaded) {
					firstLoaded = true
				}

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

					const json = await resp.json()

					if(json.nextPageCursor) {
						cursor = json.nextPageCursor
					} else {
						seeMore.remove()
					}

					const request = {}
					const elems = []

					json.data.forEach(item => {
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

				$.fetch(url, { credentials: "include" }).then(handler)
			}

			seeMore.$on("click", loadOwners)
		}

		if(category === "bundles") {
			document.$watch(
				".bundle-items .item-card-link[href]",
				x => !x.textContent.trim().startsWith("Rthro"),
				firstItem => {
					const itemId = firstItem.href.replace(/^.*roblox\.com\/[^/]+\/(\d+).*$/, "$1")

					const h3 = $(".bundle-items > h3")
					const header = html`<div class=container-header></div>`
					h3.before(header)
					header.append(h3)
	
					setupOwnersList(header.parentNode, "Included Items", itemId)
				}
			)
		} else {
			document.$watch(".recommendations-container, #resellers", parent => {
				setupOwnersList(parent, parent.$find("h3").textContent)
			})
		}
	}
	
	if(settings.itemdetails.showSales) {
		const elem = html`
		<div class="clearfix item-field-container">
			<div class="text-label text-overflow field-label">Sales</div>
			<span class=field-content></div>
		</div>`

		document.$watch("#item-details-description", desc => {
			desc.parentNode.before(elem)
		})

		const apply = sales => {
			elem.$find(".field-content").textContent = FormatNumber(sales)
		}

		if(category === "game-pass") {
			$.fetch(`https://api.roblox.com/marketplace/game-pass-product-info?gamePassId=${assetId}`).then(async resp => {
				if(!resp.ok) { return }
				apply((await resp.json()).Sales)
			})
		} else if(category === "bundles") {
			const url = "https://catalog.roblox.com/v1/catalog/items/details"
			
			const request = $.fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					items: [
						{ id: assetId, itemType: "Bundle", key: `Bundle_${assetId}` }
					]
				}),
				xsrf: true
			})

			request.then(async resp => {
				const json = await resp.json()
				apply(json.data[0].purchaseCount)
			})
		} else {
			getProductInfo(assetId).then(data => apply(data.Sales))
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

		if(settings.itemdetails.imageBackgrounds && (assetTypeId === 1 || assetTypeId === 13)) {
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

		if(settings.itemdetails.whiteDecalThumbnailFix && assetTypeId === 13) {
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
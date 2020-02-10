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

const initExplorer = async (assetId, assetTypeId) => {
	const btn = html`
	<div>
		<a class="btr-explorer-button" data-toggle="popover" data-bind="btr-explorer-content">
			<span class="btr-icon-explorer"</span>
		</a>
		<div class="rbx-popover-content" data-toggle="btr-explorer-content">
			<div class="btr-explorer-parent"></div>
		</div>
	</div>`

	document.$watch("#item-container").$then().$watch(">.section-content", cont => {
		cont.append(btn)
		cont.parentNode.classList.add("btr-explorer-btn-shown")
	})

	await OptionalLoader.loadExplorer()
	const explorer = new Explorer()
	let explorerInitialized = false
	
	explorer.element.$on("click", ev => {
		ev.stopPropagation()
	})

	btn.$watchAll(".popover", popover => {
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
		document.$watch("body", () => initPreview(assetId, null, true)) // Gotta wait for body for previewer to not break
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

		const canAccessPromise = new SyncPromise(resolve => {
			const data = itemCont.dataset
			const canAccess = data.userassetId || (data.productId && !+data.expectedPrice)
			if(canAccess) { return resolve(true) }

			itemCont.$watch(".item-name-container a", creatorLink => {
				const creatorId = +creatorLink.href.replace(/^.*roblox.com\/users\/(\d+)\/.*$/, "$1")
				resolve(creatorId === 1 || creatorId === loggedInUser)
			})
		})

		canAccessPromise.then(canAccess => {
			const strictDisabled = !canAccess && StrictCheckAssetTypeIds.includes(assetTypeId)

			if(settings.itemdetails.explorerButton && !InvalidExplorableAssetTypeIds.includes(assetTypeId) && (!strictDisabled || assetTypeId === 24)) {
				initExplorer(assetId, assetTypeId)
			}

			if(settings.itemdetails.downloadButton && !InvalidDownloadableAssetTypeIds.includes(assetTypeId) && !strictDisabled) {
				let isDownloading = false

				const createDownloadButton = actualUrl => {
					const btn = html`<a class="btr-download-button"><div class="btr-icon-download"></div></a>`
					
					document.$watch("#item-container").$then().$watch(">.section-content", cont => {
						cont.append(btn)
						cont.parentNode.classList.add("btr-download-btn-shown")
					})

					const doNamedDownload = event => {
						const self = event.currentTarget
						event.preventDefault()

						if(isDownloading) { return }
						isDownloading = true

						const download = (ab, fileType) => {
							const blobUrl = URL.createObjectURL(new Blob([ab]))

							const title = $("#item-container .item-name-container h2")
							let fileName = title
								? title.textContent.trim().replace(/[^a-zA-Z0-9_]+/g, "-").replace(/(^-+)|(-+$)/g, "")
								: new URL(btn.href).pathname

							fileName += `.${fileType || GetAssetFileType(assetTypeId, ab)}`

							startDownload(blobUrl, fileName)
							URL.revokeObjectURL(blobUrl)
						}

						if(assetTypeId === 4 && self.classList.contains("btr-download-obj")) {
							AssetCache.loadMesh(actualUrl || assetId, mesh => {
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
							AssetCache.loadBuffer(actualUrl || assetId, ab => {
								isDownloading = false
	
								if(!(ab instanceof ArrayBuffer)) {
									alert("Failed to download")
									return
								}
	
								download(ab)
							})
						}
					}
					
					if(assetTypeId === 4) {
						btn.dataset.toggle = "popover"
						btn.dataset.bind = "popover-btr-download"

						btn.after(html`
						<div class=rbx-popover-content data-toggle=popover-btr-download>
							<ul class=dropdown-menu role=menu>
								<li>
									<a class=btr-download-mesh href="/asset/?id=${assetId}">Download as .mesh</a>
								</li>
								<li>
									<a class=btr-download-obj>Download as .obj</a>
								</li>
							</ul>
						</div>
						`)

						btn.parentNode.$on("click", ".btr-download-mesh, .btr-download-obj", doNamedDownload)
					} else {
						btn.href = actualUrl || `/asset/?id=${assetId}`
						btn.$on("click", doNamedDownload)
					}
				}

				if(assetTypeId === 3) {
					document.$watch("#item-container", cont => {
						if(+cont.dataset.expectedSellerId === 1) { return }
						
						document.$watch("#AssetThumbnail").$then().$watch(".MediaPlayerIcon", icon => {
							const mediaUrl = icon.dataset.mediathumbUrl
							if(mediaUrl) {
								createDownloadButton(mediaUrl)
							}
						})
					})
				} else {
					createDownloadButton()
				}
			}

			const assetTypeContainer = ContainerAssetTypeIds[assetTypeId]
			if(settings.itemdetails.contentButton && assetTypeContainer && !strictDisabled) {
				const btn = html`<a class="btr-content-button disabled" href="#"><div class="btr-icon-content"></div></a>`

				document.$watch("#item-container").$then().$watch(">.section-content", cont => {
					cont.append(btn)
					cont.parentNode.classList.add("btr-content-btn-shown")
				})

				AssetCache.loadModel(assetId, model => {
					const inst = model.find(assetTypeContainer.filter)
					if(!inst) { return }

					const actId = AssetCache.resolveAssetId(inst[assetTypeContainer.prop])
					if(!actId) { return }

					btn.href = `/catalog/${actId}`
					btn.classList.remove("disabled")
				})
			}
		})

		if(settings.itemdetails.imageBackgrounds && (assetTypeId === 1 || assetTypeId === 13)) {
			document.$watch("#AssetThumbnail", thumb => {
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

			const fixThumb = () => {
				if(newThumb) { img.src = newThumb }
				if(fixingThumb || img.src !== emptyImg) { return }

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

			document.$watch("#AssetThumbnail").$then().$watchAll(".thumbnail-span", parent => {
				parent.$watchAll("img", img => {
					new MutationObserver(() => fixThumb(img)).observe(img, { attributes: true, attributeFilter: ["src"] })
					fixThumb(img)
				})
			})
		}
	})
}
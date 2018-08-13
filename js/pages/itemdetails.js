"use strict"

pageInit.itemdetails = function(assetId) {
	if(!settings.itemdetails.enabled) { return }

	if(settings.general.robuxToDollars) {
		document.$watch(".icon-robux-price-container .text-robux-lg", label => {
			const usd = RobuxToUSD(label.textContent.replace(/,/g, ""))
			label.after(
				html`<span class=text-robux-lg>&nbsp;($${usd})</span>`
			)
		})
			.$watch(".recommended-items .item-card-price .text-robux", label => {
				label.style.display = "inline"
				label.textContent += ` ($\{{::(item.Item.Price*${DOLLARS_PER_ROBUX_RATIO})|number:2}})`
				label.title = "R$ " + label.textContent
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
					const usd = RobuxToUSD(label.textContent.replace(/,/g, ""))
					label.textContent += ` ($${usd})`
				})
	}

	document.$watch("#AjaxCommentsContainer").$then().$watch(".comments").$then()
		.$watchAll(".comment-item", comment => {
			const span = comment.$find(".text-date-hint")
			const fixedDate = RobloxTime(span.textContent.replace("|", ""))
			if(fixedDate) {
				span.setAttribute("btr-timestamp", "")
				span.textContent = fixedDate.$format("MMM D, YYYY | hh:mm A (T)")
			}
		})
	
	document.$watch("#item-container", itemCont => {
		const assetTypeName = itemCont.dataset.assetType
		const assetTypeId = AssetTypeIds.indexOf(assetTypeName)
		if(assetTypeId === -1) {
			if(IS_DEV_MODE) { alert(`Missing assetTypeId for ${assetTypeName}`) }
			return
		}

		const previewAnim = AnimationPreviewAssetTypeIds.includes(assetTypeId)
		const previewAsset = WearableAssetTypeIds.includes(assetTypeId)
		const previewPackage = PackageAssetTypeIds.includes(assetTypeId)

		if(settings.itemdetails.itemPreviewer && (previewAnim || previewAsset || previewPackage || assetTypeId === 32)) {
			const preview = new RBXPreview.AvatarPreviewer()
			const container = html`
			<div class="item-thumbnail-container btr-preview-container">
				<div class="btr-thumb-btn-container">
					<div class="btr-thumb-btn rbx-btn-control-sm btr-hats-btn"><span class="btr-icon-hat"></span></div>
					<div class="btr-thumb-btn rbx-btn-control-sm btr-body-btn"><span class="btr-icon-body"></span></div>
					<div class="btr-thumb-btn rbx-btn-control-sm btr-preview-btn checked"><span class="btr-icon-preview"></span></div>
				</div>
			</div>`
			
			container.append(preview.container)

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

			document.$watch("#AssetThumbnail", thumb => {
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


			let lastAnimPromise
			let autoLoadPreview = false

			switch(settings.itemdetails.itemPreviewerMode) {
			default: case "default":
			case "always":
				autoLoadPreview = true
				break
			case "animations":
				autoLoadPreview = previewAnim || previewPackage || assetTypeId === 32
				break
			case "never":
				break
			}
			
			if(autoLoadPreview) {
				onDocumentReady(() => toggleEnabled(true))
			}


			const doPreview = (id, typeId) => {
				const isAnim = AnimationPreviewAssetTypeIds.indexOf(typeId) !== -1
				const isAsset = WearableAssetTypeIds.indexOf(typeId) !== -1

				if(isAnim) {
					preview.autoLoadPlayerType = false
					preview.setPlayerTypeOnAnim = true

					if(typeId === 24) {
						preview.onInit(() => {
							preview.addAnimation(String(id), id)
						})
					} else {
						const loadAnim = async () => {
							const model = await AssetCache.loadModel(id)
							const folder = model.find(x => x.ClassName === "Folder" && x.Name === "R15Anim")
							if(!folder) { return }

							folder.Children.filter(x => x.ClassName === "StringValue").forEach(value => {
								const animName = value.Name

								value.Children.filter(x => x.ClassName === "Animation").forEach((anim, i) => {
									const name = animName + (i === 0 ? "" : `_${i + 1}`)
									const animId = AssetCache.resolveAssetId(anim.AnimationId)
									if(!animId) { return }

									preview.addAnimation(name, animId)
								})
							})
						}

						lastAnimPromise = (lastAnimPromise || new Promise(x => preview.onInit(x))).then(loadAnim)
					}
				} else if(isAsset) {
					preview.addAssetPreview(id, typeId)
				}
			}

			if(assetTypeId === 32) {
				AssetCache.loadText(assetId, text => {
					const promises = text.split(";").map(itemId => getProductInfo(itemId))
					promises[0].then(json => doPreview(json.AssetId, json.AssetTypeId))

					Promise.all(promises.slice(1)).then(list => {
						list.forEach(json => doPreview(json.AssetId, json.AssetTypeId))
					})
				})
			} else {
				doPreview(assetId, assetTypeId)
			}
		}

		const canAccessPromise = new Promise(resolve => {
			if(!CheckAccessAssetTypeIds.includes(assetTypeId)) { return resolve(true) }

			const data = itemCont.dataset
			const canAccess = data.userassetId || (data.productId && !+data.expectedPrice)
			if(canAccess) { return resolve(true) }

			itemCont.$watch(".item-name-container a[href*=\"/users/\"]", creatorLink => {
				const creatorId = +String(creatorLink.href).replace(/^.*roblox.com\/users\/(\d+).*$/, "$1")
				if(!Number.isSafeInteger(creatorId)) { return resolve(false) }
				if(creatorId === 1) { return resolve(true) }
				
				loggedInUserPromise.then(userId => resolve(creatorId === +userId))
			})
		})

		canAccessPromise.then(canAccess => {
			if(!canAccess) { return }

			if(settings.itemdetails.explorerButton && InvalidExplorableAssetTypeIds.indexOf(assetTypeId) === -1) {
				const explorer = new Explorer()
				let explorerInitialized = false

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

				document.body.$on("click", ".btr-explorer-parent", ev => {
					ev.stopImmediatePropagation()
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

			if(settings.itemdetails.downloadButton && InvalidDownloadableAssetTypeIds.indexOf(assetTypeId) === -1) {
				let isDownloading = false

				const createDownloadButton = actualUrl => {
					const btn = html`<a class="btr-download-button"><div class="btr-icon-download"></div></a>`
					
					document.$watch("#item-container").$then().$watch(">.section-content", cont => {
						cont.append(btn)
						cont.parentNode.classList.add("btr-download-btn-shown")
					})

					const doNamedDownload = event => {
						event.preventDefault()

						if(isDownloading) { return }
						isDownloading = true

						AssetCache.loadBuffer(actualUrl || assetId, ab => {
							isDownloading = false

							if(!(ab instanceof ArrayBuffer)) {
								alert("Failed to download")
								return
							}

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
	
					btn.href = actualUrl || `/asset/?id=${assetId}`
					btn.$on("click", doNamedDownload)
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
			if(settings.itemdetails.contentButton && assetTypeContainer) {
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
			const emptyImg = "https://t6.rbxcdn.com/3707fe58b613498a0f1fc7d11faeccf3"
			const invalidImg = "https://t5.rbxcdn.com/7e9f63b26670543d8296072a2738a519"

			document.$watch("#AssetThumbnail").$then().$watch(".thumbnail-span img", img => {
				const fixThumbnail = () => {
					AssetCache.loadModel(assetId, model => {
						const decal = model.find(x => x.ClassName === "Decal")
						if(!decal) { return }

						const imgId = AssetCache.resolveAssetId(decal.Texture)
						if(!imgId) { return }

						let waitTime = 100

						const url = `https://assetgame.roblox.com/asset-thumbnail/json?assetId=${imgId}&width=420&height=420`
						const load = () => {
							fetch(url).then(async resp => {
								const json = await resp.json()

								if(json.Final) {
									img.src = json.Url
								} else {
									setTimeout(load, waitTime += 100)
								}
							})
						}

						load()
					})
				}

				if(img.src === invalidImg) {
					const observer = new MutationObserver(() => {
						observer.disconnect()
						if(img.src === emptyImg) {
							fixThumbnail()
						}
					})

					observer.observe(img, { attributes: true, attributeFilter: ["src"] })
				} else if(img.src === emptyImg) {
					fixThumbnail()
				}
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

					getProductInfo(childId).then(data => {
						if(data.IsForSale) {
							if(data.PriceInRobux) {
								const price = card.$find(".item-card-price")
								price.innerHTML = htmlstring`
								<span class=icon-robux-16x16></span>
								<span class=text-robux>${data.PriceInRobux}</span>`
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

			document.$watch("#item-container").$then().$watch(">.section-content", content => content.after(cont))
		}
	})
}
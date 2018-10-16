"use strict"


class ItemPreviewer extends RBXPreview.AvatarPreviewer {
	constructor(isBundle) {
		super()

		this.isShown = false

		const container = html`<div class=btr-preview-container></div>`
		container.append(this.container)
		this.container = container

		const typeSwitch = this.typeSwitch = html`
		<div class="btr-switch btr-playertype-switch" style="position:absolute;top:6px;right:6px">
			<div class=btr-switch-off>R6</div>
			<div class=btr-switch-on>R15</div>
			<input type=checkbox> 
			<div class=btr-switch-flip>
				<div class=btr-switch-off>R6</div>
				<div class=btr-switch-on>R15</div>
			</div>
		</div>`

		this.dropdown = html`
		<div class="input-group-btn btr-dropdown-container" style="position:absolute;top:6px;left:6px;width:140px;display:none">
			<button type=button class=input-dropdown-btn data-toggle=dropdown>
				<span class=rbx-selection-label data-bind=label></span>
				<span class=icon-down-16x16></span>
			</button>
			<ul data-toggle=dropdown-menu class=dropdown-menu role=menu></ul>
		</div>`

		const buttons = this.buttons = html`
		<div class=btr-thumb-btn-container>
			<div class="btr-thumb-btn rbx-btn-control-sm btr-hats-btn"><span class=btr-icon-hat></span></div>
			<div class="btr-thumb-btn rbx-btn-control-sm btr-body-btn"><span class=btr-icon-body></span></div>
			<div class="btr-thumb-btn rbx-btn-control-sm btr-preview-btn"><span class=btr-icon-preview></span></div>
		</div>`

		const typeInput = typeSwitch.$find("input")

		this.on("playertypechanged", type => {
			typeInput.checked = type === "R15"
		})

		typeInput.$on("change", () => {
			this.setPlayerType(typeInput.checked ? "R15" : "R6")
		})


		buttons.$on("click", ".btr-hats-btn", ev => {
			const self = ev.currentTarget
			const disabled = !self.classList.contains("checked")
			self.classList.toggle("checked", disabled)

			this.setAccessoriesVisible(!disabled)
		})
		
		buttons.$on("click", ".btr-body-btn", ev => {
			const self = ev.currentTarget
			const disabled = !self.classList.contains("checked")
			self.classList.toggle("checked", disabled)

			this.setPackagesVisible(!disabled)
		})

		document.$watch("#AssetThumbnail .enable-three-dee", btn => {
			if(btn.classList.contains("three-dee-animated-icon")) {
				const newBtn = html`<div class="btr-thumb-btn rbx-btn-control-sm btr-play-btn"></div>`
				const icon = html`<span></span>`
				newBtn.append(icon)
				buttons.append(newBtn)

				let playing = true

				const update = () => {
					icon.classList.toggle("icon-bigplay", !playing)
					icon.classList.toggle(isBundle ? "icon-pause-fill" : "icon-bigstop", playing)

					icon.style.backgroundPositionX = isBundle && !playing ? "-28px" : ""

					this.scene.avatar.animator.speed = playing ? 1 : 0
				}

				update()
				newBtn.$on("click", () => {
					playing = !playing
					update()
				})
			}
		})

		const disableOrigThumbs = () => {
			setTimeout(() => {
				if(this.enabled) {
					const btn = $("#AssetThumbnail .three-dee-animated-icon")
					if(btn && !btn.$find(".icon-bigplay")) {
						btn.click()
					}
				}
			}, 0)
		}

		onDocumentReady(disableOrigThumbs)

		const previewBtn = buttons.$find(".btr-preview-btn")
		
		this.on("enabled", () => {
			previewBtn.classList.add("checked")
			document.$watch("#AssetThumbnail", thumb => {
				thumb.classList.add("btr-preview-active")
				thumb.parentNode.before(this.container)
			})
			
			disableOrigThumbs()
		})

		this.on("disabled", () => {
			previewBtn.classList.remove("checked")
			document.$watch("#AssetThumbnail", thumb => {
				thumb.classList.remove("btr-preview-active")
				this.container.remove()
			})
		})

		previewBtn.$on("click", () => this.setEnabled(!this.enabled))

		this.on("animationloaded", (data, assetId) => {
			const anim = this.anims.find(x => x.assetId === assetId)
			if(anim && anim.name === "swim") {
				this.scene.avatar.offsetPos.set(0, 1.5, .5)
				this.scene.avatar.offsetRot.set(-Math.PI / 2, 0, 0)
			} else {
				this.scene.avatar.offsetPos.set(0, 0, 0)
				this.scene.avatar.offsetRot.set(0, 0, 0)
			}
		})
		
		this.scene.cameraFocus.y -= 0.5
	}

	setVisible(bool) {
		if(this.isShown === !!bool) { return }
		this.isShown = !!bool

		document.$watch("#AssetThumbnail", thumb => {
			if(this.isShown) {
				thumb.classList.add("btr-preview-enabled")
				thumb.append(this.dropdown, this.typeSwitch, this.buttons)
				if(this.bundleAnims) { thumb.append(this.bundleAnims) }
			} else {
				thumb.classList.remove("btr-preview-enabled")
				this.dropdown.remove()
				this.typeSwitch.remove()
				this.buttons.remove()
				if(this.bundleAnims) { this.bundleAnims.remove() }
			}
		})
	}

	playAnimation(name) {
		super.playAnimation(name)
		
		if(this.dropdown) {
			this.dropdown.$find("[data-bind='label']").textContent = name
		}
	}

	addAnimation(name, assetId) {
		super.addAnimation(name, assetId)

		if(this.anims.length === 1) {
			this.playAnimation(name)
		}

		if(this.dropdown) {
			const elem = html`<li><a>${name}</a></li>`
			elem.$on("click", () => this.playAnimation(name))

			const menu = this.dropdown.$find(".dropdown-menu")
			menu.append(elem)

			this.dropdown.style.display = this.anims.length < 2 ? "none" : ""
		}
	}

	initBundleAnimations() {
		if(!this.bundleAnims) {
			this.bundleAnims = html`
			<div class=btr-bundle-animations>
				<div class="btr-bundle-btn btn-control-xs" data-anim=run disabled><div class=btr-anim-icon-run></div></div>
				<div class="btr-bundle-btn btn-control-xs" data-anim=walk disabled><div class=btr-anim-icon-walk></div></div>
				<div class="btr-bundle-btn btn-control-xs" data-anim=fall disabled><div class=btr-anim-icon-fall></div></div>
				<div class="btr-bundle-btn btn-control-xs" data-anim=jump disabled><div class=btr-anim-icon-jump></div></div>
				<div class="btr-bundle-btn btn-control-xs" data-anim=idle disabled><div class=btr-anim-icon-idle></div></div>
				<div class="btr-bundle-btn btn-control-xs" data-anim=swim disabled><div class=btr-anim-icon-swim></div></div>
				<div class="btr-bundle-btn btn-control-xs" data-anim=climb disabled><div class=btr-anim-icon-climb></div></div>
			</div>`

			this.bundleAlts = {}
			this.buttons.after(this.bundleAnims)

			// Move camera down
			this.scene.cameraFocus.y -= 1
		}
	}

	addBundleAnimation(name, assetId, assetTypeId, assetName) {
		super.addAnimation(name, assetId)
		this.initBundleAnimations()

		const animName = AssetTypeIds[assetTypeId].slice(0, -9).toLowerCase()
		const root = this.bundleAnims.$find(`.btr-bundle-btn[data-anim="${animName}"]`)
	
		if(root) {
			let btn

			if(name === animName) {
				btn = root
				root.removeAttribute("disabled")
			} else {
				let altCont = this.bundleAlts[animName]
				if(!altCont) {
					altCont = this.bundleAlts[animName] = html`<div class=btr-bundle-alt-container></div>`
					root.prepend(altCont)
				}

				const alt = btn = html`<div class="btr-bundle-btn-alt btn-control-xs">ALT</div>`

				if(name === "swimidle") { alt.textContent = "IDLE" }
				else if(name === "pose") { alt.textContent = "POSE" }

				altCont.prepend(alt)
			}
			
			btn.$on("click", ev => {
				delete this.bundleWaitingAnim

				this.bundleAnims.$findAll(".selected").forEach(x => x.classList.remove("selected"))
				btn.classList.add("selected")
				this.playAnimation(name)

				const curName = $("#current-animation-name")
				if(curName) { curName.textContent = assetName }

				ev.stopImmediatePropagation()
				ev.preventDefault()
			})

			if(name === "run" && (this.bundleWaitingAnim || !this.currentAnim)) {
				btn.click()
			} else if(!this.currentAnim && !this.bundleWaitingAnim) {
				this.bundleWaitingAnim = true

				setTimeout(() => {
					if(!this.currentAnim) {
						btn.click()
						this.bundleWaitingAnim = true
					}
				}, 250)
			}
			
			if(!this.currentAnim) {
				if(name === "run") {
					btn.click()
				} else if(!this.bundleWaitingAnim) {
					this.bundleWaitingAnim = true
					setTimeout(() => {
						if(!this.currentAnim) {
							btn.click()
						}
					}, 1e3)
				}
			}
		}
	}
}


const initPreview = (assetId, assetTypeId, isBundle) => {
	const previewAnim = AnimationPreviewAssetTypeIds.includes(assetTypeId)
	const previewAsset = WearableAssetTypeIds.includes(assetTypeId)
	const previewPackage = assetTypeId === 32

	if(settings.itemdetails.itemPreviewer && (previewAnim || previewAsset || previewPackage || isBundle)) {
		let preview
		let autoLoadPreview = false

		switch(settings.itemdetails.itemPreviewerMode) {
		case "always": default:
			autoLoadPreview = true
			break
		case "animations":
			autoLoadPreview = previewAnim || previewPackage
			break
		case "never":
			break
		}

		let lastAnimPromise
		const doPreview = (id, typeId, productInfo) => {
			const isAnim = AnimationPreviewAssetTypeIds.indexOf(typeId) !== -1
			const isAsset = WearableAssetTypeIds.indexOf(typeId) !== -1

			if(!preview) {
				preview = new ItemPreviewer(isBundle, isAnim)

				preview.setVisible(true)
				if(autoLoadPreview) { onDocumentReady(() => preview.setEnabled(true)) }
			}

			if(isAnim) {
				preview.autoLoadPlayerType = false
				preview.setPlayerTypeOnAnim = true

				if(typeId === 24) {
					preview.addAnimation(String(id), id)
				} else {
					if(isBundle) {
						preview.initBundleAnimations()
					}

					const loadAnim = async () => {
						const model = await AssetCache.loadModel(id)
						const folder = model.find(x => x.ClassName === "Folder" && x.Name === "R15Anim")
						if(!folder) { return }

						folder.Children.filter(x => x.ClassName === "StringValue").forEach(value => {
							const animName = value.Name

							value.Children.filter(x => x.ClassName === "Animation").forEach((anim, i) => {
								const animId = AssetCache.resolveAssetId(anim.AnimationId)
								if(!animId) { return }

								const name = animName + (i === 0 ? "" : `_${i + 1}`)

								if(isBundle) {
									preview.addBundleAnimation(name, animId, typeId, productInfo.Name)
								} else {
									preview.addAnimation(name, animId)
								}
							})
						})
					}

					if(autoLoadPreview) {
						lastAnimPromise = loadAnim()
					} else {
						const initPromise = new Promise(x => preview.on("init", x))
						lastAnimPromise = (lastAnimPromise || initPromise).then(loadAnim)
					}
				}
			} else if(isAsset) {
				preview.addAssetPreview(id, typeId)
			}
		}

		if(isBundle) {
			const url = `https://catalog.roblox.com/v1/bundles/${assetId}/details`
			fetch(url).then(async resp => {
				const data = await resp.json()

				data.items.forEach(item => {
					if(item.type === "Asset") {
						getProductInfo(item.id).then(json => doPreview(json.AssetId, json.AssetTypeId, json))
					}
				})
			})
		} else if(previewPackage) {
			AssetCache.loadText(assetId, text => {
				text.split(";").forEach(itemId => {
					getProductInfo(itemId).then(json => doPreview(json.AssetId, json.AssetTypeId, json))
				})
			})
		} else {
			doPreview(assetId, assetTypeId)
		}
	}
}


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
				label.textContent += ` ($\{{::((item.Item.Price*${DOLLARS_TO_ROBUX_RATIO[0]})/${DOLLARS_TO_ROBUX_RATIO[1]})|number:2}})`
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

	if(settings.general.hoverPreview) {
		HoverPreview.register(".item-card", ".item-card-thumb-container")
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
		if(itemCont.dataset.itemType !== "Asset") {
			if(itemCont.dataset.itemType === "Bundle") {
				initPreview(assetId, null, true)
			}
			return
		}
		
		const assetTypeName = itemCont.dataset.assetType
		const assetTypeId = AssetTypeIds.indexOf(assetTypeName)
		if(assetTypeId === -1) {
			if(IS_DEV_MODE) { alert(`Missing assetTypeId for ${assetTypeName}`) }
			return
		}

		initPreview(assetId, assetTypeId)

		const canAccessPromise = new Promise(resolve => {
			if(!CheckAccessAssetTypeIds.includes(assetTypeId)) { return resolve(true) }

			const data = itemCont.dataset
			const canAccess = data.userassetId || (data.productId && !+data.expectedPrice)
			if(canAccess) { return resolve(true) }

			itemCont.$watch(".item-name-container a", creatorLink => {
				const creatorId = +String(creatorLink.href).replace(/^.*roblox.com\/users\/(\d+).*$/, "$1")
				if(!Number.isSafeInteger(creatorId)) { return resolve(false) }
				if(creatorId === 1) { return resolve(true) }
				
				loggedInUserPromise.then(userId => resolve(creatorId === +userId))
			})
		})

		canAccessPromise.then(canAccess => {
			const softAccess = canAccess || !canAccess && (assetTypeId !== 3 && assetTypeId !== 10) && !ContainerAssetTypeIds[assetTypeId]
			if(!softAccess) { return }

			if(settings.itemdetails.explorerButton && !InvalidExplorableAssetTypeIds.includes(assetTypeId)) {
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

			if(settings.itemdetails.downloadButton && !InvalidDownloadableAssetTypeIds.includes(assetTypeId)) {
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
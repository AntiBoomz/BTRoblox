"use strict"


class ItemPreviewer extends RBXPreview.AvatarPreviewer {
	constructor() {
		super()

		window.scene = this.scene
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
			<div class="btr-thumb-popup btr-body-popup">
				<label>Height</label>
				<label class=value>90%</label>
				<input type=range min=0 max=1 value=0 step=.01 data-target=height>

				<label>Width</label>
				<label class=value>90%</label>
				<input type=range min=0 max=1 value=0 step=.01 data-target=width>

				<label>Head</label>
				<label class=value>90%</label>
				<input type=range min=0 max=1 value=0 step=.01 data-target=head>

				<label>Body Type</label>
				<label class=value>90%</label>
				<input type=range min=0 max=1 value=0 step=.01 data-target=bodyType>

				<label>Proportions</label>
				<label class=value>90%</label>
				<input type=range min=0 max=1 value=0 step=.01 data-target=proportion>
			</div>
		</div>`

		const bodyPopup = buttons.$find(".btr-body-popup")

		const loadSliders = () => {
			bodyPopup.$findAll(">input").forEach(input => {
				const scaleName = input.dataset.target
				const rule = this.avatarRules.scales[scaleName]
				const label = input.previousElementSibling

				const update = () => {
					label.textContent = Math.floor(input.value * 100 + 0.5) + "%"
				}

				input.$on("input", () => {
					update()

					const targetScales = this.packagesVisible ? this.appearance.scales : this.defaultScales
					targetScales[scaleName] = +input.value

					if(scaleName === "width") {
						targetScales.depth = 0.5 + targetScales.width / 2 // What a surprise, undefined scaling behavior.,,
					}

					this.scene.avatar.setScales(targetScales)
				})

				input.min = rule.min
				input.max = rule.max
				input.step = rule.increment

				input.value = this.appearance.scales[scaleName]
				update()

				this.on("packagesToggled", () => {
					input.value = this.packagesVisible ? this.scene.avatar.scales[scaleName] : this.defaultScales[scaleName]
					update()
				})
			})
		}

		if(this.avatarRules) {
			loadSliders()
		} else {
			this.once("avatarRulesLoaded", loadSliders)
		}

		const typeInput = typeSwitch.$find("input")
		bodyPopup.classList.toggle("disabled", !typeInput.checked)

		this.on("playertypechanged", type => {
			typeInput.checked = type === "R15"
			bodyPopup.classList.toggle("disabled", !typeInput.checked)
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

		const disableOrigThumbs = () => {
			setTimeout(() => {
				if(this.enabled) {
					const btn = $("#AssetThumbnail .three-dee-animated-icon")
					if(btn && btn.$find(".icon-pause-fill, .icon-bigstop-fill")) {
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


		this.on("enabled", () => {
			const animName = $("#current-animation-name")
			if(animName) {
				this.prevAnimName = animName.textContent
				animName.textContent = this.currentAnimName || ""
			}
		})

		this.on("disabled", () => {
			const animName = $("#current-animation-name")
			if(animName && typeof this.prevAnimName === "string") {
				animName.textContent = this.prevAnimName
				this.prevAnimName = null
			}
		})
	}

	setVisible(bool) {
		if(this.isShown === !!bool) { return }
		this.isShown = !!bool

		document.$watch(["#AssetThumbnail", "#AssetThumbnail .thumbnail-buttons"], (thumb, btns) => {
			if(this.isShown) {
				thumb.classList.add("btr-preview-enabled")
				thumb.append(this.dropdown, this.typeSwitch)
				btns.append(this.buttons)
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

			const parent = $("#AssetThumbnail")
			if(parent) {
				parent.append(this.bundleAnims)
			}

			// Move camera down
			this.scene.cameraOffset.y -= 1
		}
	}

	addBundleAnimation(name, assetId, assetTypeId, assetName) {
		super.addAnimation(name, assetId)
		this.initBundleAnimations()

		const animName = AssetTypeIds[assetTypeId].slice(0, -9).toLowerCase()
		const root = this.bundleAnims.$find(`.btr-bundle-btn[data-anim="${animName}"]`)
	
		if(root) {
			const isAlt = name !== animName
			let altCont
			let btn

			if(!isAlt) {
				btn = root
				root.removeAttribute("disabled")
			} else {
				altCont = this.bundleAlts[animName]
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

				if(isAlt) {
					altCont.classList.add("selected")
					root.classList.add("selected")
				}

				this.playAnimation(name)

				const curName = $("#current-animation-name")
				if(curName) {
					this.currentAnimName = assetName
					curName.textContent = assetName
				}

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
	const isPreviewable = AnimationPreviewAssetTypeIds.includes(assetTypeId) || WearableAssetTypeIds.includes(assetTypeId)
	const isPackage = assetTypeId === 32

	if(settings.itemdetails.itemPreviewer && (isPackage || isBundle || isPreviewable)) {
		const previewerMode = settings.itemdetails.itemPreviewerMode
		let autoLoading = false
		let lastAnimPromise
		let preview

		const doPreview = (id, typeId, productInfo) => {
			const isAnim = AnimationPreviewAssetTypeIds.indexOf(typeId) !== -1
			const isAsset = WearableAssetTypeIds.indexOf(typeId) !== -1

			if(!isAnim && !isAsset) { return }

			if(!preview) {
				preview = new ItemPreviewer(isBundle, isAnim)
				preview.setVisible(true)

				if(previewerMode === "always") {
					autoLoading = true
					onDocumentReady(() => preview.setEnabled(true))
				}
			}

			if(isAnim) {
				preview.autoLoadPlayerType = false
				preview.setPlayerTypeOnAnim = true

				if(!autoLoading && previewerMode === "animations") {
					autoLoading = true
					onDocumentReady(() => preview.setEnabled(true))
				}

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

					if(autoLoading) {
						lastAnimPromise = loadAnim()
					} else {
						const initPromise = new SyncPromise(x => preview.on("init", x))
						lastAnimPromise = (lastAnimPromise || initPromise).then(loadAnim)
					}
				}
			} else if(isAsset) {
				preview.addAssetPreview(id, typeId)
			}
		}

		if(isBundle) {
			const url = `https://catalog.roblox.com/v1/bundles/${assetId}/details`
			$.fetch(url).then(async resp => {
				const data = await resp.json()

				data.items.forEach(item => {
					if(item.type === "Asset") {
						getProductInfo(item.id).then(json => doPreview(json.AssetId, json.AssetTypeId, json))
					}
				})
			})
		} else if(isPackage) {
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


pageInit.itemdetails = function(category, assetId) {
	if(settings.general.robuxToUSD) {
		document.$watch(".icon-robux-price-container .text-robux-lg", label => {
			const usd = RobuxToUSD(label.textContent.replace(/,/g, ""))
			label.after(
				html`<span class=text-robux-lg>&nbsp;($${usd})</span>`
			)
		})
			.$watch(".recommended-items .item-card-price .text-robux", label => {
				label.style.display = "inline"
				label.textContent += ` ($\{{::((item.Item.Price*${GetRobuxRatio()[0]})/${GetRobuxRatio()[1]})|number:2}})`
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
					const btn = item.$find(".PurchaseButton")
					const usd = RobuxToUSD(btn ? btn.dataset.expectedPrice : "")
					label.textContent += ` ($${usd})`
				})
	}

	if(settings.general.hoverPreview) {
		HoverPreview.register(".item-card", ".item-card-thumb-container")
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
			const nameCache = {}

			const getUserName = userId => {
				const cached = nameCache[userId]

				if(cached) {
					return cached
				}

				return nameCache[userId] = new SyncPromise(resolve =>
					MESSAGING.send("getUserName", userId, resolve)
				)
			}

			const createElement = (userId, userName, item) => html`
				<div class=btr-owner-item>
					<a href=/users/${userId}/profile title="${userName}" class="avatar avatar-headshot-md list-header">
						<img class=avatar-card-image 
							src=https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=60&height=60&format=png
							alt="${userName}"
						>
					</a>
					<div class=btr-owner-cont>
						<a class="text-name username" title="${userName}" href=/users/${userId}/profile>${userName}</a>
						<div class=btr-owner-date>Since ${new Date(item.updated).$format("M/D/YYYY hh:mm:ss")}</div>
					</div>
					<div class=btr-serial>${item.serialNumber ? `#${item.serialNumber}` : `N/A`}</div>
				</div>`

			const loadOwners = () => {
				if(isLoading) { return }
				isLoading = true

				seeMore.textContent = "Loading..."
				seeMore.setAttribute("disabled", "")

				const url = `https://inventory.roblox.com/v2/assets/${ownerAssetId}/owners?limit=50&cursor=${cursor}`
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

					const data = await resp.json()

					if(!firstLoaded) {
						firstLoaded = true
						// TODO(anti): Remove (and create before request) a "Loading" thang
					}

					if(data.nextPageCursor) {
						cursor = data.nextPageCursor
						isLoading = false
						seeMore.textContent = "See More"
						seeMore.removeAttribute("disabled")
					} else {
						seeMore.remove()
					}

					data.data.forEach(item => {
						if(!item.owner || item.owner.type !== "User" || item.owner.id === 1) { return }
						const userId = item.owner.id
						const result = getUserName(userId)

						const elem = createElement(userId, result instanceof Promise ? `User#${userId}` : result, item)
						owners.$find(".section-content").append(elem)

						if(result instanceof Promise) {
							result.then(userName => {
								elem.replaceWith(createElement(userId, userName, item))
							})
						}
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
	
	if(settings.itemdetails.showSales && category !== "bundles") {
		const elem = html`
		<div class="clearfix item-field-container">
			<div class="text-label text-overflow field-label">Sales</div>
			<span class=field-content>-</div>
		</div>`

		document.$watch("#item-details-description", desc => {
			desc.parentNode.before(elem)
		})

		const apply = data => {
			elem.$find(".field-content").textContent = FormatNumber(data.Sales)
		}

		if(category === "game-pass") {
			$.fetch(`http://api.roblox.com/marketplace/game-pass-product-info?gamePassId=${assetId}`).then(async resp => {
				if(!resp.ok) { return }
				apply(await resp.json())
			})
		} else {
			getProductInfo(assetId).then(apply)
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
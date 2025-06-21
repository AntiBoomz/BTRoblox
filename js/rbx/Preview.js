"use strict"

const outfitCache = {}
let avatarRulePromise

function getAvatarRules() {
	if(!avatarRulePromise) {
		avatarRulePromise = RobloxApi.avatar.getAvatarRules()
	}

	return avatarRulePromise
}

function solveBodyColors(bodyColor3s) {
	const bodyColors = {}

	for(const [name, value] of Object.entries(bodyColor3s)) {
		const key = name.slice(0, -6) // remove Color3 from the end
		bodyColors[key] = `#${value}`
	}

	return bodyColors
}

function getOutfitData(id) {
	if(!outfitCache[id]) {
		return outfitCache[id] = RobloxApi.avatar.getOutfitDetails(id).then(data => {
			data = { ...data }

			data.scales = data.scale
			delete data.scale

			data.bodyColors = solveBodyColors(data.bodyColor3s)
			delete data.bodyColor3s
			
			return data
		})
	}

	return outfitCache[id]
}

function getPlayerAppearance(userId) {
	if(!outfitCache["user" + userId]) {
		return outfitCache["user" + userId] = RobloxApi.avatar.getUserAvatar(userId).then(data => {
			data = { ...data }
			
			data.bodyColors = solveBodyColors(data.bodyColor3s)
			delete data.bodyColor3s
			
			return data
		})
	}

	return outfitCache["user" + userId]
}

function getCurrentAppearance() {
	if(!outfitCache.default) {
		return outfitCache.default = RobloxApi.avatar.getCurrentAvatar().then(async data => {
			if(!data || data.errors) {
				return getOutfitData(1116516198)
			}
			
			data = { ...data }
			
			data.bodyColors = solveBodyColors(data.bodyColor3s)
			delete data.bodyColor3s
			
			return data
		})
	}

	return outfitCache.default
}

const SkippableAssetTypes = [
	19, // Gear
	24, // Animation
	48, 49, 50, 51, 52, 53, 54, 55, 56, 61, 78 // Avatar Animations
]

const LayeredAssetTypes = [64, 65, 66, 67, 68, 69, 70, 71, 72]

//idle, walk, run, jump, fall, climb
const R15Anims = [507766388, 913402848, 913376220, 507765000, 507767968, 507765644]
const R6Anims = [180435571, 180426354, 180426354, 125750702, 180436148, 180436334]

const R6AnimParts = ["Torso", "Left Arm", "Right Arm", "Left Leg", "Right Leg"]

class AvatarPreviewer extends EventEmitter {
	constructor(opts = {}) {
		super()

		this.enabled = false
		this.initialized = false

		this.scene = new RBXScene.AvatarScene()
		this.avatar = this.scene.avatar

		this.container = html`<div class=btr-preview-container></div>`
		this.container.append(this.scene.canvas)

		this.outfitAssets = new Set()
		this.previewAssets = new Set()
		
		this.autoLoadPlayerType = "autoLoadPlayerType" in opts ? !!opts.autoLoadPlayerType : true
		this.defaultAnimationsDisabled = !!opts.defaultAnimationsDisabled
		this.initPlayerTypeFromPlayingAnimation = false
		this.outfitAccessoriesVisible = true

		this.outfitLoaded = false
		this.shouldLoadOutfit = null

		this.appearance = null
		this.playerType = null

		this.currentAnim = null
		this.loadingAnim = null
		this.playingAnim = null
		
		this.avatar.on("layeredRequestStateChanged", state => {
			this.container.classList.toggle("btr-layered-loading", state === "fetching")
		})
		
		const invalidLayeredClothingMarker = html`<div class=btr-invalid-layered>!</div>`
		
		this.avatar.on("hasInvalidLayeredClothingChanged", hasInvalidLayeredClothing => {
			if(hasInvalidLayeredClothing) {
				this.container.append(invalidLayeredClothingMarker)
			} else {
				invalidLayeredClothingMarker.remove()
			}
		})
	}

	//

	setEnabled(bool) {
		if(this.enabled === !!bool) {
			return
		}

		this.enabled = !!bool

		if(this.enabled) {
			if(!this.initialized) {
				this.initialized = true
				this.trigger("init")
			}
			
			if(!this.outfitLoaded) {
				this._loadOutfit(...(this.shouldLoadOutfit ?? []))
			}

			if(!this.playingAnim) {
				if(this.currentAnim) {
					this.loadAnimation(this.currentAnim)
				} else if(!this.defaultAnimationsDisabled) {
					this.loadDefaultAnimation()
				}
			}

			this.scene.start()
			this.trigger("enabled")
		} else {
			this.scene.stop()
			this.trigger("disabled")
		}
	}

	setPlayerType(playerType) {
		if(this.playerType === playerType) {
			return
		}

		this.playerType = playerType
		this.scene.avatar.setPlayerType(playerType)

		if(this.enabled) {
			if(!this.currentAnim && !this.defaultAnimationsDisabled) {
				this.loadDefaultAnimation()
			}
			else if (this.currentAnim) {
				this.playAnimation(this.currentAnim)
			}
		}

		this.trigger("playerTypeChanged", playerType)
	}

	setOutfitAccessoriesVisible(bool) {
		this.outfitAccessoriesVisible = !!bool
		
		for(const asset of this.outfitAssets) {
			if(AccessoryAssetTypeIds.includes(asset.assetTypeId)) {
				asset.setEnabled(this.outfitAccessoriesVisible)
			}
		}
	}

	//

	setOutfit(outfitId, outfitType) {
		this.outfitLoaded = false

		if(this.enabled) {
			this._loadOutfit(outfitId, outfitType)
		} else {
			this.shouldLoadOutfit = [outfitId, outfitType]
		}
	}

	_loadOutfit(outfitId, outfitType) {
		const debounce = performance.now()
		let outfitPromise
		
		this.outfitDebounce = debounce
		delete this.shouldLoadOutfit

		if(outfitType === "Outfit" && outfitId) {
			outfitPromise = getOutfitData(outfitId)
		} else if(outfitType === "Player" && outfitId) {
			outfitPromise = getPlayerAppearance(outfitId)
		} else {
			outfitPromise = getCurrentAppearance()
		}
		
		outfitPromise.then(result => {
			if(this.outfitDebounce !== debounce) {
				return
			}

			this.outfitDebounce = null
			this.onOutfitLoaded(result)
		})
	}

	onOutfitLoaded(data) {
		this.appearance = JSON.parse(JSON.stringify(data))

		this.avatar.setScales(data.scales)
		this.avatar.setBodyColors(data.bodyColors)

		if(!this.playerType && this.autoLoadPlayerType) {
			this.setPlayerType(data.playerAvatarType)
		}
		
		for(const asset of this.outfitAssets) {
			asset.remove()
		}
		
		for(const asset of data.assets) {
			if(!SkippableAssetTypes.includes(asset.assetType.id)) {
				this.addAsset(asset.id, asset.assetType.id, asset.meta)
			}
		}

		this.outfitLoaded = true
		this.trigger("appearanceLoaded")
	}

	//

	waitForOutfit() {
		if(this.outfitLoaded) {
			return Promise.resolve()
		}

		return new Promise(resolve => this.once("appearanceLoaded", () => resolve()))
	}
	
	waitForAppearance() {
		const promises = []

		promises.push(
			this.waitForOutfit().then(() => {
				this.avatar.startLoadingAssets()
				return this.avatar.waitForAppearance()
			})
		)

		if(!this.playingAnim) {
			if(this.currentAnim) {
				this.loadAnimation(this.currentAnim)
			} else if(!this.defaultAnimationsDisabled) {
				this.loadDefaultAnimation()
			}
		}

		if(!this.playingAnim && this.loadingAnim) {
			promises.push(new Promise(resolve => this.once("animationLoaded", () => resolve())))
		}

		return Promise.all(promises)
	}

	addAsset(assetId, assetTypeId, meta) {
		const asset = this.avatar.addAsset(assetId, assetTypeId, meta)
		if(!asset) { return }

		this.outfitAssets.add(asset)
		
		asset.on("update", () => {
			if(AccessoryAssetTypeIds.includes(asset.assetTypeId)) {
				asset.setEnabled(this.outfitAccessoriesVisible)
			}
		})
		
		asset.once("remove", () => {
			this.outfitAssets.delete(asset)
		})

		return asset
	}

	addAssetPreview(assetId, assetTypeId, meta) {
		if(LayeredAssetTypes.includes(assetTypeId)) {
			if(!meta) { meta = { order: 1, version: 1 } }
			meta.order = 10
		}
		
		const asset = this.avatar.addAsset(assetId, assetTypeId, meta)
		if(!asset) { return }

		asset.setPriority(2)

		this.previewAssets.add(asset)
		asset.once("remove", () => {
			this.previewAssets.delete(asset)
		})
		
		return asset
	}

	//

	loadAnimation(assetId, fadeIn) {
		this.loadingAnim = assetId
		
		AssetCache.loadAnimation(assetId, data => {
			if(this.loadingAnim !== assetId) {
				return
			}
			
			if(this.playingAnim) {
				this.scene.avatar.animator.stop(this.playingAnim.track, this.playingAnim.fadeSwitch)
				this.playingAnim = null
			}

			this.loadingAnim = null
			this.playingAnim = { id: assetId, data: data }
			
			this.playingAnim.track = this.scene.avatar.animator.play(data, {
				fadeIn: fadeIn ?? 0,
				loop: true,
				onloop: !this.currentAnim && (() => {
					if(this.loadingAnim) { return }
					let animId
					
					if(R15Anims.includes(this.playingAnim.id)) {
						const roll = Math.random()
						animId = roll < 9 / 11 ? R15Anims[0] : roll < 10 / 11 ? R15Anims[1] : R15Anims[2]
		
					} else if(R6Anims.includes(this.playingAnim.id)) {
						const roll = Math.random()
						animId = roll < 9 / 10 ? R6Anims[0] : R6Anims[1]
					}
					
					if(animId && animId !== this.playingAnim.id) {
						this.playingAnim.fadeSwitch = 0.15
						this.loadAnimation(animId, 0.15)
					}
				})
			})

			if(this.currentAnim && this.initPlayerTypeFromPlayingAnimation) {
				this.initPlayerTypeFromPlayingAnimation = false
				this.setPlayerType(R6AnimParts.some(x => x in data.keyframes) ? "R6" : "R15")
			}

			this.trigger("animationLoaded", data, assetId)
		})
	}

	loadDefaultAnimation() {
		this.currentAnim = null
		this.loadingAnim = null

		if(this.playingAnim) {
			this.scene.avatar.animator.stop(this.playingAnim.track)
			this.playingAnim = null
		}

		if(this.enabled) {
			this.loadAnimation(this.playerType === "R15" ? R15Anims[0] : R6Anims[0])
		}
	}

	playAnimation(animId) {
		this.currentAnim = animId
		this.loadingAnim = null

		if (this.playerType == "R6") {
			const r15Index = R15Anims.indexOf(animId);
			if (r15Index !== -1) {
				animId = R6Anims[r15Index];
			}
		}

		if(this.playingAnim) {
			this.scene.avatar.animator.stop(this.playingAnim.track)
			this.playingAnim = null
		}

		if(this.enabled) {
			this.loadAnimation(animId)
		}
	}
}

class ItemPreviewer extends AvatarPreviewer {
	constructor() {
		super()

		window.scene = this.scene
		this.currentOutfit = "current"
		this.isVisible = false
		this.animMap = {}

		const container = html`<div class=btr-preview-container-itempage></div>`
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
		<div class="input-group-btn btr-dropdown-container" style="position:absolute;top:6px;left:6px;display:none;min-width:100px;max-width:280px;width:auto;">
			<button type=button class=input-dropdown-btn data-toggle=dropdown>
				<span class=rbx-selection-label data-bind=label style="overflow:hidden;text-overflow:ellipsis;max-width:230px;"></span>
				<span class=icon-down-16x16 style="margin-left:8px"></span>
			</button>
			<ul data-toggle=dropdown-menu class=dropdown-menu role=menu style="position:relative"></ul>
		</div>`

		this.dropdownMenu = this.dropdown.$find(".dropdown-menu")

		this.bundleAlts = {}
		this.bundleAnims = html`
		<div class=btr-bundle-animations style=display:none>
			<div class="btr-bundle-btn btn-control-xs" data-anim=run disabled><div class=btr-anim-icon-run></div></div>
			<div class="btr-bundle-btn btn-control-xs" data-anim=walk disabled><div class=btr-anim-icon-walk></div></div>
			<div class="btr-bundle-btn btn-control-xs" data-anim=fall disabled><div class=btr-anim-icon-fall></div></div>
			<div class="btr-bundle-btn btn-control-xs" data-anim=jump disabled><div class=btr-anim-icon-jump></div></div>
			<div class="btr-bundle-btn btn-control-xs" data-anim=idle disabled><div class=btr-anim-icon-idle></div></div>
			<div class="btr-bundle-btn btn-control-xs" data-anim=swim disabled><div class=btr-anim-icon-swim></div></div>
			<div class="btr-bundle-btn btn-control-xs" data-anim=climb disabled><div class=btr-anim-icon-climb></div></div>
		</div>`
		
		this.animNameLabel = html`<div class=btr-animation-name></div>`

		const buttons = this.buttons = html`
		<div class=btr-thumb-btn-container>
			<div class="btr-thumb-btn btn-control-xs btr-hats-btn"><span class=btr-icon-hat></span></div>
			<div class="btr-thumb-btn btn-control-xs btr-body-btn checked"><span class=btr-icon-body></span></div>
			<div class="btr-thumb-btn btn-control-xs btr-preview-btn"><span class=btr-icon-preview></span></div>
			<div class="btr-thumb-popup btr-body-popup">

				<div class=btr-body-outfits>
					<label class=btr-outfit-header>Outfits</label>

					<div class="btr-body-outfit-btn selected" data-outfit=current>
						<div class=btr-body-outfit-icon>
							<img src="">
						</div>
						<span class=btr-body-outfit-title>Current</span>
					</div>
					<div class=btr-body-outfit-btn data-outfit=bundle style=display:none>
						<div class=btr-body-outfit-icon>
							<img src="https://tr.rbxcdn.com/0291e3569377d17f1ea852a773ad56a5/110/110/Decal/Png">
						</div>
						<span class=btr-body-outfit-title>Bundle</span>
					</div>
					<div class=btr-body-outfit-btn data-outfit=default>
						<div class=btr-body-outfit-icon>
							<img src="https://tr.rbxcdn.com/cd6c66bb06aa97e00e4d79169e6d74e5/150/150/Avatar/Png">
						</div>
						<span class=btr-body-outfit-title>Default</span>
					</div>
				</div>

				<div>
					<label>Height</label>
					<label class=value>90%</label>
					<input type=range min=0 max=1 value=0 step=.01 data-target=height>
				</div>

				<div>
					<label>Width</label>
					<label class=value>90%</label>
					<input type=range min=0 max=1 value=0 step=.01 data-target=width>
				</div>

				<div>
					<label>Head</label>
					<label class=value>90%</label>
					<input type=range min=0 max=1 value=0 step=.01 data-target=head>
				</div>

				<div>
					<label>Body Type</label>
					<label class=value>90%</label>
					<input type=range min=0 max=1 value=0 step=.01 data-target=bodyType>
				</div>

				<div>
					<label>Proportions</label>
					<label class=value>90%</label>
					<input type=range min=0 max=1 value=0 step=.01 data-target=proportion>
				</div>
			</div>
		</div>`
		
		loggedInUserPromise.then(userId => {
			RobloxApi.thumbnails.getAvatarThumbnails([userId]).then(json => {
				buttons.$find(`.btr-body-outfit-btn[data-outfit="current"] img`).src = json.data[0].imageUrl
			})
		})
		
		container.append(this.dropdown, this.typeSwitch, this.bundleAnims, this.animNameLabel, this.buttons)

		const bodyPopup = buttons.$find(".btr-body-popup")
		const inputSliders = []

		const loadSliders = rules => {
			for(const input of bodyPopup.$findAll("input")) {
				const scaleName = input.dataset.target
				const rule = rules.scales[scaleName]
				const label = input.previousElementSibling

				const update = () => {
					label.textContent = Math.floor(input.value * 100 + 0.5) + "%"
					
					if(IS_CHROME) {
						input.style.setProperty("--btr-input-perc", `${(input.value - input.min) / (input.max - input.min) * 100}%`)
					}
				}

				input.$on("input", () => {
					update()

					const targetScales = this.appearance.scales
					targetScales[scaleName] = +input.value

					if(scaleName === "width") {
						targetScales.depth = 0.5 + targetScales.width / 2 // What a surprise, undefined scaling behavior...
					}

					this.scene.avatar.setScales(targetScales)
					this.selectOutfit("custom")
				})

				input.min = rule.min
				input.max = rule.max
				input.step = rule.increment

				inputSliders.push({ input, update, scaleName })
			}
		}

		const updateSliders = () => {
			if(!this.appearance) { return }
			
			for(const slider of inputSliders) {
				slider.input.value = this.appearance.scales[slider.scaleName]
				slider.update()
			}
		}
		
		getAvatarRules().then(rules => {
			loadSliders(rules)
			updateSliders()
		})

		this.on("appearanceLoaded", updateSliders)

		const typeInput = typeSwitch.$find("input")
		const typeUpdate = () => {
			typeInput.checked = this.playerType === "R15"
			
			for(const input of bodyPopup.$findAll("input")) {
				input.toggleAttribute("disabled", !typeInput.checked)
			}
		}

		this.on("playerTypeChanged", typeUpdate)
		typeUpdate()

		typeInput.$on("change", () => {
			this.setPlayerType(typeInput.checked ? "R15" : "R6")
		})

		buttons.$on("click", ".btr-body-outfit-btn", ev => {
			const self = ev.currentTarget
			const target = self.dataset.outfit
			if(!target || self.classList.contains("selected")) { return }
			if(target === "bundle" && !this.bundleOutfitId) { return }

			this.selectOutfit(target)
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

		$.ready(disableOrigThumbs)
		
		const hatsBtn = this.hatsBtn = buttons.$find(".btr-hats-btn")
		hatsBtn.classList.toggle("checked", this.outfitAccessoriesVisible)
		hatsBtn.$on("click", () => {
			this.setOutfitAccessoriesVisible(!this.outfitAccessoriesVisible)
		})
		
		const previewBtn = buttons.$find(".btr-preview-btn")
		
		this.on("enabled", () => {
			previewBtn.classList.add("checked")
			this.parent?.classList.add("btr-preview-active")
			this.parent?.classList.remove("btr-preview-inactive")
			
			disableOrigThumbs()
		})

		this.on("disabled", () => {
			previewBtn.classList.remove("checked")
			this.parent?.classList.remove("btr-preview-active")
			this.parent?.classList.add("btr-preview-inactive")
		})

		previewBtn.$on("click", () => this.setEnabled(!this.enabled))

		this.on("animationLoaded", (data, assetId) => {
			const anim = this.getAnimation(assetId)

			if(anim && anim.animType === "swim") {
				this.scene.avatarOffset.position.set(0, 0, .5)
				this.scene.avatarOffset.rotation.set(-Math.PI / 2, 0, 0)
			} else {
				this.scene.avatarOffset.position.set(0, 0, 0)
				this.scene.avatarOffset.rotation.set(0, 0, 0)
			}
		})
	}

	selectOutfit(target) {
		if(this.currentOutfit === target) { return }
		this.currentOutfit = target
		
		switch(target) {
		case "custom":
			break
		case "current":
			this.setOutfit(null)
			break
		case "bundle":
			this.setOutfit(this.bundleOutfitId, "Outfit")
			break
		case "default":
			this.setOutfit(1116516198, "Outfit")
			break
		default:
			if(target.startsWith("plr-")) {
				this.setOutfit(+target.slice(4), "Player")
			}
		}
		
		for(const btn of this.buttons.$findAll(".btr-body-outfit-btn.selected")) {
			btn.classList.remove("selected")
		}

		const button = this.buttons.$find(`.btr-body-outfit-btn[data-outfit="${target}"]`)
		if(button) { button.classList.add("selected") }
	}
	
	setOutfitAccessoriesVisible(bool) {
		super.setOutfitAccessoriesVisible(bool)
		this.hatsBtn.classList.toggle("checked", this.outfitAccessoriesVisible)
	}
	
	setParent(parent) {
		if(!parent) { parent = null }
		if(this.parent === parent) { return }
		
		this.parent?.classList.remove("btr-preview-active")
		this.parent?.classList.remove("btr-preview-inactive")
		
		this.parent = parent
		this.updateParent()
	}

	setVisible(bool) {
		if(this.isVisible === !!bool) { return }
		this.isVisible = !!bool
		
		this.updateParent()
	}
	
	updateParent() {
		if(this.isVisible) {
			this.parent?.classList.toggle("btr-preview-active", this.enabled)
			this.parent?.classList.toggle("btr-preview-inactive", !this.enabled)
			this.parent?.prepend(this.container)
		} else {
			this.parent?.classList.remove("btr-preview-active")
			this.parent?.classList.remove("btr-preview-inactive")
			this.container.remove()
		}
	}

	setBundleOutfit(outfitId) {
		this.bundleOutfitId = outfitId
		
		const bundleOutfitBtn = this.buttons.$find(`.btr-body-outfit-btn[data-outfit="bundle"]`)

		if(outfitId) {
			bundleOutfitBtn.style.display = ""
			bundleOutfitBtn.$find("img").src = ``
			
			const url = `https://thumbnails.roblox.com/v1/users/outfits?userOutfitIds=${outfitId}&size=150x150&format=Png&isCircular=false`
			fetch(url).then(async resp => {
				const result = (await resp.json()).data[0]
				
				if(result && result.imageUrl) {
					bundleOutfitBtn.$find("img").src = result.imageUrl
				}
			})
		} else {
			bundleOutfitBtn.style.display = "none"
		}
	}

	getAnimation(animId) {
		return this.animMap[animId]
	}

	playAnimation(animId) {
		const anim = this.getAnimation(animId)
		if(!anim) { return console.warn("No anim", animId) }

		super.playAnimation(anim.assetId)
		
		const label = this.dropdown.$find("[data-bind='label']")
		label.textContent = anim.isBundleAnim ? "Emotes" : anim.name
		label.title = anim.isBundleAnim ? "" : anim.name

		if(this.hasBundleAnims) {
			for(const sel of this.bundleAnims.$findAll(".selected")) {
				sel.classList.remove("selected")
			}

			if(anim.isBundleAnim) {
				for(const sel of anim.selections) {
					sel.classList.add("selected")
				}
			}
			
			this.animNameLabel.textContent = anim.name || ""
		}
	}

	updateAnimButtons() {
		if(Object.values(this.animMap).length >= 2) {
			if(!this.hasBundleAnims && Object.values(this.animMap).find(x => x.isBundleAnim)) {
				this.hasBundleAnims = true
				
				this.bundleAnims.style.display = ""
				this.animNameLabel.textContent = Object.values(this.animMap).find(x => x.assetId === this.currentAnim)?.name || ""

				// Move camera down
				this.scene.cameraOffset.y -= 1
			}

			if(!this.hasDropdown && this.dropdownMenu.children.length >= 1) {
				this.hasDropdown = true
				this.dropdown.style.display = ""
			}
		} else {
			this.animNameLabel.textContent = ""
			
			if(this.hasBundleAnims) {
				this.hasBundleAnims = false
				this.bundleAnims.style.display = "none"
				
				// Move camera back up
				this.scene.cameraOffset.y += 1
			}
			
			if(this.hasDropdown) {
				this.hasDropdown = false
				this.dropdown.style.display = "none"
			}
		}
	}
	
	addAnimation(assetId, name) {
		const anims = Object.values(this.animMap).map(x => x.name)
		if(anims.includes(name)) {
			for(let i = 2; i < Infinity; i++) {
				const newName = `${name} (${i})`

				if(!anims.includes(newName)) {
					name = newName
					break
				}
			}
		}

		const anim = this.animMap[assetId] = { assetId }
		anim.name = name
		
		const btn = html`<li><a title="${anim.name}" style="text-overflow:ellipsis;overflow:hidden">${anim.name}</a></li>`
		btn.$on("click", () => this.playAnimation(anim.assetId))

		this.dropdownMenu.append(btn)
		this.updateAnimButtons()

		return anim
	}
	
	removeBundleAnimations(animType) {
		for(const anim of Object.values(this.animMap).filter(x => x.animType === animType)) {
			delete this.animMap[anim.assetId]
			
			if(anim.isAlt) {
				anim.btn.remove()
			} else {
				anim.btn.setAttribute("disabled", "")
				anim.btn.$off("click", anim.onclick)
			}
		}
	}

	addBundleAnimation(assetId, origAnimType, assetName) {
		let animType = origAnimType
		let isAlt = false
		let altText

		if(animType === "pose") {
			isAlt = true
			altText = "POSE"
			animType = "idle"
		} else if(animType === "swimidle") {
			isAlt = true
			altText = "IDLE"
			animType = "swim"
		}

		const root = this.bundleAnims.$find(`.btr-bundle-btn[data-anim="${animType}"]`)
		if(!root) {
			this.addAnimation(assetId, animType)
			return
		}
		
		let btn = root
		
		if(!isAlt && !root.hasAttribute("disabled")) {
			isAlt = true
			altText = "ALT"
		}
		
		const anim = {
			assetId: assetId,
			name: assetName,
			animType: origAnimType,
			altText: altText,
			isAlt: isAlt,
			isBundleAnim: true,
			selections: [root]
		}
		
		this.animMap[anim.assetId] = anim

		if(isAlt) {
			const alts = this.bundleAlts[animType] = this.bundleAlts[animType] || { list: [] }

			if(!alts.cont) {
				alts.cont = html`<div class=btr-bundle-alt-container></div>`
				root.prepend(alts.cont)
			}

			btn = html`<div class="btr-bundle-btn-alt btn-control-xs">${anim.altText}</div>`
			alts.cont.prepend(btn)

			anim.selections.push(alts.cont, btn)
		} else {
			btn.removeAttribute("disabled")
		}
		
		anim.btn = btn
		
		anim.onclick = ev => {
			this.playAnimation(anim.assetId)

			ev.stopImmediatePropagation()
			ev.preventDefault()
		}
		
		anim.btn.$on("click", anim.onclick)
		this.updateAnimButtons()
		
		return anim
	}
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
			"LowerTorso", "UpperTorso", "Torso",
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
	
	const updatePreviewCamera = () => {
		const addedObjects = new Set()
		let cameraDir
		
		for(const asset of lastPreviewedAssets) {
			const state = asset.getState(preview.avatar.playerType)
			if(!state) { continue }
			
			for(const acc of state.accessories) {
				if(!acc.obj) { continue }
				
				addedObjects.add(acc.obj)
				
				if(acc.attachment?.name?.endsWith("BackAttachment")) {
					if(!cameraDir) {
						cameraDir = "Back"
					}
				} else {
					cameraDir = "Front"
				}
			}
			
			for(const bp of state.bodyparts) {
				const part = preview.avatar.parts[bp.target]
				
				if(part?.isMesh) {
					addedObjects.add(part)
					cameraDir = "Front"
				}
			}
			
			for(const clothing of state.clothing) {
				const parts = ClothingParts[clothing.target]
				
				if(parts) {
					for(const partName of parts) {
						const part = preview.avatar.parts[partName]
						
						if(part?.isMesh) {
							addedObjects.add(part)
						}
					}
				}
			}
		}

		if(!addedObjects.size) {
			addedObjects.add(preview.avatar.root)
		}

		//
		
		const box = new THREE.Box3()
		const box2 = new THREE.Box3()

		const expandBox = () => {
			preview.avatar.root.updateWorldMatrix(true, true)
			
			const expandBy = object => {
				if(object.geometry instanceof THREE.BufferGeometry && object.geometry.getAttribute("position")) {
					if(!object.geometry.boundingBox) {
						object.geometry.computeBoundingBox()
					}

					box2.copy(object.geometry.boundingBox)
					box2.applyMatrix4(object.matrixWorld)

					box.union(box2)
				}
				
				for(const child of object.children) {
					expandBy(child)
				}
			}
			
			for(const object of addedObjects) {
				expandBy(object)
			}
		}

		preview.scene.update()
		expandBox()
		
		if(box.isEmpty()) {
			box.set(
				new THREE.Vector3(-2, 0, -0.5),
				new THREE.Vector3(2, 5, 0.5),
			)
		}

		preview.scene.cameraFocus.copy(box.max).add(box.min).multiplyScalar(0.5)
		preview.scene.cameraFocus.y += (box.max.y - box.min.y) * 0.01
		preview.scene.cameraZoom = Math.max(2.5, box.max.clone().sub(box.min).length() * 0.9)
		
		setCameraDir(cameraDir || "Front")
	}

	const initPreview = () => {
		preview = this.preview = new AvatarPreviewer()

		// preview.container.style.position = "absolute"
		// preview.container.style.top = "0"
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

			document.documentElement.$on("mouseup", () => {
				if(ev.button !== 0) { return }
				cancelAnimationFrame(reqId)
			}, { once: true })

			ev.preventDefault()
		}).$on("click", ev => ev.preventDefault())
	}

	const clearTarget = () => {
		currentTarget = null
		debounceCounter++

		if(preview) {
			preview.setEnabled(false)
			
			preview.container.parentNode?.classList.remove("btr-preview-container-parent")
			preview.container.remove()

			while(lastPreviewedAssets.length) {
				lastPreviewedAssets.pop().remove()
			}
		}
	}

	return {
		register(selector, thumbContSelector) {
			if(SETTINGS.get("general.hoverPreviewMode") === "never") { return }

			document.$on("mouseover", `${selector} ${thumbContSelector}`, async ev => {
				const thumbCont = ev.currentTarget

				const self = thumbCont.closest(selector)
				if(!self || currentTarget === self) { return }

				const anchor = self.$find(`a[href*="/catalog/"],a[href*="/library/"],a[href*="/bundles/"]`)
				if(!anchor) { return }

				const assetId = parseInt(anchor.href.replace(/^.*\/(?:bundles|catalog|library)\/(\d+)\/?.*$/, "$1"), 10)
				if(!Number.isSafeInteger(assetId)) { return }

				clearTarget()
				if(invalidAssets[assetId]) { return }

				const img = thumbCont.$find("img")
				if(img && invalidThumbnails.includes(img.src)) { return }
				
				const isLibraryItem = anchor.href.includes("/library/")

				const debounce = ++debounceCounter
				currentTarget = self

				const mouseLeave = () => {
					thumbCont.classList.remove("btr-preview-loading")

					if(currentTarget === self) {
						clearTarget()
					}
				}

				thumbCont.addEventListener("mouseleave", mouseLeave, { once: true })

				const isBundle = anchor.href.includes("/bundles/")
				let targetOutfitId
				let playingAnimId

				const finalizeLoad = () => {
					if(debounceCounter !== debounce) { return }

					if(!lastPreviewedAssets.length && !playingAnimId) {
						invalidAssets[assetId] = true
						thumbCont.classList.remove("btr-preview-loading")
						clearTarget()
						return
					}

					preview.setOutfit(targetOutfitId, "Outfit")
					preview.initPlayerTypeFromPlayingAnimation = true

					if(preview.appearance) {
						preview.setPlayerType(preview.appearance.playerAvatarType)
					}

					if(playingAnimId) {
						preview.playAnimation(playingAnimId)
					} else {
						preview.loadDefaultAnimation()
					}

					preview.waitForAppearance().then(() => {
						if(debounceCounter !== debounce) { return }
						thumbCont.classList.remove("btr-preview-loading")

						if(!playingAnimId) {
							const didSomethingChange = lastPreviewedAssets.find(asset => !asset.isEmpty())

							if(!didSomethingChange) {
								invalidAssets[assetId] = true
								clearTarget()
								return
							}
						}
						
						updatePreviewCamera()
						
						thumbCont.append(preview.container)
						thumbCont.classList.add("btr-preview-container-parent")
					})
				}

				const addAssetPreview = (assetId, assetTypeId, meta) => {
					if(!preview) { initPreview() }

					if(assetTypeId === 24) {
						playingAnimId = assetId
					} else {
						const asset = preview.addAssetPreview(assetId, assetTypeId, meta)
						if(!asset) { return }

						lastPreviewedAssets.push(asset)
					}
					
					if(isLibraryItem) {
						thumbCont.classList.add("btr-preview-loading")
					}

					preview.setEnabled(true)
				}
				
				const addItems = async items => {
					if(debounceCounter !== debounce) { return }

					const outfit = items.find(x => x?.outfitType === "Avatar")
					if(outfit) {
						targetOutfitId = outfit.id
					}
					
					let curAnim
					for(const item of items) {
						if(!item || item.outfitType) { continue }
						
						if(WearableAssetTypeIds.includes(item.AssetTypeId)) {
							addAssetPreview(item.AssetId, item.AssetTypeId, outfit?.assets.find(x => x.id === item.AssetId)?.meta)
							
						} else if(AnimationPreviewAssetTypeIds.includes(item.AssetTypeId)) {
							if(!curAnim || item.AssetTypeId === 61 || item.AssetTypeId === 51 && curAnim.AssetTypeId !== 61) {
								curAnim = item
							}
						}
					}

					if(curAnim) {
						if(curAnim.AssetTypeId === 24) { // Animation
							addAssetPreview(curAnim.AssetId, 24)
							
						} else if(curAnim.AssetTypeId === 61) { // EmoteAnimation
							const model = await AssetCache.loadModel(curAnim.AssetId)
							if(debounceCounter !== debounce) { return }

							const anim = model.find(x => x.ClassName === "Animation")
							const animId = anim && AssetCache.getAssetIdFromUrl(anim.AnimationId)

							if(animId) {
								addAssetPreview(animId, 24)
							}
							
						} else {
							const model = await AssetCache.loadModel(curAnim.AssetId)
							if(debounceCounter !== debounce) { return }

							const folder = model.find(x => x.Name === "R15Anim" && x.ClassName === "Folder")
							const group = folder && (folder.Children.find(x => x.Name.toLowerCase().includes("idle")) || folder.Children[0])
							const anim = group && group.Children
								.map(x => ({ id: AssetCache.getAssetIdFromUrl(x.AnimationId), weight: x.Children.length && x.Children[0].Value || 0 }))
								.filter(x => x.id)
								.reduce((prev, cur) => ((!prev || cur.weight > prev.weight) ? cur : prev))
							
							if(anim) {
								addAssetPreview(anim.id, 24)
							}
						}
					}
					
					finalizeLoad()
				}
				
				if(!isLibraryItem) {
					thumbCont.classList.add("btr-preview-loading")
				}
				
				if(isBundle) {
					const details = await RobloxApi.catalog.getBundleDetails(assetId)
					const promises = []
					
					for(const item of details.items) {
						if(item.type === "Asset") {
							promises.push(AssetCache.resolveAsset(item.id).then(assetRequest => ({ AssetId: item.id, AssetTypeId: assetRequest.assetTypeId })))
							
						} else if(item.type === "UserOutfit") {
							promises.push(RobloxApi.avatar.getOutfitDetails(item.id))
						}
					}
					
					addItems(await Promise.all(promises))
				} else {
					const info = await AssetCache.resolveAsset(assetId).then(
						assetRequest => ({ AssetId: assetId, AssetTypeId: assetRequest.assetTypeId }),
						() => null
					)
					
					addItems([info])
				}
			})
		}
	}
})()
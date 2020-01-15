"use strict"

const RBXPreview = (() => {
	const outfitCache = {}
	let avatarRulePromise

	function tryGet(url) {
		let retries = 0

		const callback = async resp => {
			if(!resp.ok) {
				if(++retries > 5) {
					console.warn(`[RBXPreview] Failed to load '${url}'`)
					return
				}

				await new SyncPromise(res => setTimeout(res, 1e3))
				return $.fetch(url, { credentials: "include" }).then(callback)
			}

			return resp.json()
		}

		return $.fetch(url, { credentials: "include" }).then(callback)
	}

	function getAvatarRules() {
		if(!avatarRulePromise) {
			avatarRulePromise = tryGet(`https://avatar.roblox.com/v1/avatar-rules`)
		}

		return avatarRulePromise
	}

	function solveBodyColors(origColors, rules) {
		const bodyColors = {}
		if(!origColors) { return bodyColors }

		Object.entries(origColors).forEach(([name, value]) => {
			const index = name.toLowerCase().replace(/colorid$/, "")
			const bodyColor = rules.bodyColorsPalette.find(x => x.brickColorId === value)
			bodyColors[index] = bodyColor.hexColor
		})

		return bodyColors
	}

	function getOutfitData(id) {
		if(!outfitCache[id]) {
			const outfitPromise = tryGet(`https://avatar.roblox.com/v1/outfits/${id}/details`)

			return outfitCache[id] = SyncPromise.all([getAvatarRules(), outfitPromise]).then(([rules, data]) => {
				data = { ...data }

				data.scales = data.scale
				delete data.scale

				data.bodyColors = solveBodyColors(data.bodyColors, rules)
				return [rules, data]
			})
		}

		return outfitCache[id]
	}

	function getPlayerAppearance(userId) {
		if(!outfitCache["user" + userId]) {
			const outfitPromise = tryGet(`https://avatar.roblox.com/v1/users/${userId}/avatar`)

			return outfitCache["user" + userId] = SyncPromise.all([getAvatarRules(), outfitPromise]).then(([rules, data]) => {
				data = { ...data }
				data.bodyColors = solveBodyColors(data.bodyColors, rules)
				return [rules, data]
			})
		}

		return outfitCache["user" + userId]
	}

	function getDefaultAppearance() {
		if(!outfitCache.default) {
			const outfitPromise = tryGet(`https://avatar.roblox.com/v1/avatar`)

			return outfitCache.default = SyncPromise.all([getAvatarRules(), outfitPromise]).then(([rules, data]) => {
				data = { ...data }
				data.bodyColors = solveBodyColors(data.bodyColors, rules)
				return [rules, data]
			})
		}

		return outfitCache.default
	}

	const SkippableAssetTypes = [
		19, // Gear
		24, // Animation
		48, 49, 50, 51, 52, 53, 54, 55, 56 // Avatar Animations
	]

	class Previewer extends EventEmitter {
		constructor() {
			super()

			this.enabled = false
			this.initialized = false
		}

		setEnabled(bool) {
			this.enabled = !!bool

			if(this.enabled) {
				if(!this.initialized) {
					this.initialized = true
					this.trigger("init")
				}
				this.trigger("enabled")
			} else {
				this.trigger("disabled")
			}
		}
	}

	class AvatarPreviewer extends Previewer {
		constructor(opts = {}) {
			super()
			this.container = html`<div class=btr-preview-container style="width:100%; height:100%;"></div>`

			this.playerType = null
			this.outfitAssets = new Set()
			this.previewAssets = new Set()

			this.animLoadCounter = 0
			this.currentAnim = null

			this.autoLoadPlayerType = true
			this.accessoriesVisible = true
			this.disableDefaultAnimations = "disableDefaultAnimations" in opts ? opts.disableDefaultAnimations : false

			this.appearance = null
			this.waitForAppearance = "waitForAppearance" in opts ? opts.waitForAppearance : true
			this.appearanceLoadedPromise = new SyncPromise()

			this.scene = new RBXScene.AvatarScene()
			this.container.append(this.scene.canvas)

			const avatar = this.scene.avatar

			const R15Anims = [507766666, 507766951, 507766388]
			const R6Anims = [180435792, 180435571]

			avatar.animator.onloop = () => {
				if(this.currentAnim) { return } // Not playing default anim

				if(R15Anims.includes(this.playingAnim)) {
					const roll = Math.random()
					const animId = roll < 1 / 11 ? R15Anims[0] : roll < 2 / 11 ? R15Anims[1] : R15Anims[2]

					if(this.currentAnim !== animId) {
						this.loadAnimation(animId, .5)
					}
				} else if(R6Anims.includes(this.playingAnim)) {
					const roll = Math.random()
					const animId = roll < 0.1 ? R6Anims[0] : R6Anims[1]

					if(this.currentAnim !== animId) {
						this.loadAnimation(animId, .5)
					}
				}
			}

			avatar.animator.onstop = () => setTimeout(() => avatar.animator.play(), 2000)

			this.on("enabled", () => {
				this.scene.start()

				if(!this.playingAnim) {
					if(this.currentAnim) {
						this.loadAnimation(this.currentAnim)
					} else if(!this.disableDefaultAnimations) {
						this.loadDefaultAnimation()
					}
				}
			})

			this.on("disabled", () => {
				this.scene.stop()
			})

			this.on("init", () => {
				this.reloadOutfit()

				if(this.waitForAppearance) {
					setTimeout(() => {
						if(!this.playerType) {
							this.setPlayerType("R15")
							this.playerType = null
						}
	
						this.appearanceLoadedPromise.resolve()
					}, 2e3)
				}
			})
		}

		startLoadingAssets() {
			this.scene.avatar.appearance.startLoadingAssets()
		}

		reloadOutfit() {
			let outfitPromise

			if(this.outfitId) {
				if(typeof this.outfitId === "string" && this.outfitId.startsWith("plr-")) {
					outfitPromise = getPlayerAppearance(this.outfitId.slice(4))
				} else {
					outfitPromise = getOutfitData(this.outfitId)
				}
			} else {
				outfitPromise = getDefaultAppearance()
			}

			this.outfitPromise = outfitPromise

			outfitPromise.then(([rules, data]) => {
				if(this.outfitPromise !== outfitPromise) {
					return
				}

				this.appearanceLoaded(data, rules)
			})
		}

		appearanceLoaded(data, rules) {
			this.appearance = data

			if(!this.avatarRules) {
				this.avatarRules = rules
				this.trigger("avatarRulesLoaded")
			}

			this.scene.avatar.setScales(data.scales)
			this.scene.avatar.setBodyColors(data.bodyColors)

			if(this.autoLoadPlayerType && !this.playerType) {
				this.setPlayerType(data.playerAvatarType)
			}

			this.outfitAssets.forEach(asset => asset.remove())

			data.assets.forEach(asset => {
				if(!SkippableAssetTypes.includes(asset.assetType.id)) {
					this.addAsset(asset.id)
				}
			})

			this.scene.avatar.waitForAppearance()
				.then(() => this.appearanceLoadedPromise.resolve())
			
			this.trigger("appearanceLoaded")
		}

		setPlayerType(type) {
			if(this.playerType === type) { return }

			this.playerType = type
			this.scene.avatar.setPlayerType(type)

			if(!this.currentAnim && !this.disableDefaultAnimations) {
				this.loadDefaultAnimation()
			}

			this.trigger("playertypechanged", type)
		}

		setAccessoriesVisible(bool) {
			const visible = this.accessoriesVisible = !!bool

			this.outfitAssets.forEach(asset => {
				if(asset.accessories.length) {
					asset.setEnabled(visible)
				}
			})
		}

		addAssetPreview(assetId) {
			const asset = this.scene.avatar.appearance.addAsset(assetId)
			if(!asset) { return }

			asset.setPriority(2)

			this.previewAssets.add(asset)
			asset.once("remove", () => {
				this.previewAssets.delete(asset)
			})

			return asset
		}

		addAsset(assetId) {
			const asset = this.scene.avatar.appearance.addAsset(assetId)
			if(!asset) { return }

			this.outfitAssets.add(asset)
			asset.once("remove", () => {
				this.outfitAssets.delete(asset)
			})

			return asset
		}

		loadDefaultAnimation() {
			this.scene.avatar.animator.pause()
			this.playingAnim = null

			if(this.enabled) {
				const animId = this.playerType === "R15" ? 507766388 : 180435571
				this.loadAnimation(animId)
			} else {
				this.animLoadCounter++
			}
		}

		loadAnimation(assetId, fadeIn) {
			const index = ++this.animLoadCounter

			AssetCache.loadAnimation(assetId, data => {
				if(this.animLoadCounter !== index) { return }

				if(this.setPlayerTypeOnAnim && this.currentAnim) {
					this.setPlayerTypeOnAnim = false

					const R6AnimParts = ["Torso", "Left Arm", "Right Arm", "Left Leg", "Right Leg"]
					const isR6 = R6AnimParts.some(x => x in data.keyframes)

					this.setPlayerType(isR6 ? "R6" : "R15")
				}

				this.playingAnim = assetId
				this.scene.avatar.animator.play(data, fadeIn || 0)

				this.trigger("animationloaded", data, assetId)
			})
		}

		playAnimation(animId) {
			this.currentAnim = animId
			this.scene.avatar.animator.pause()
			this.playingAnim = null

			if(this.enabled) {
				this.loadAnimation(animId)
			} else {
				this.animLoadCounter++
			}
		}
	}

	return {
		AvatarPreviewer
	}
})()

class ItemPreviewer extends RBXPreview.AvatarPreviewer {
	constructor() {
		super()

		window.scene = this.scene
		this.isShown = false
		this.animMap = {}

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

		const buttons = this.buttons = html`
		<div class=btr-thumb-btn-container>
			<div class="btr-thumb-btn btn-control-xs btr-hats-btn"><span class=btr-icon-hat></span></div>
			<div class="btr-thumb-btn btn-control-xs btr-body-btn"><span class=btr-icon-body></span></div>
			<div class="btr-thumb-btn btn-control-xs btr-preview-btn"><span class=btr-icon-preview></span></div>
			<div class="btr-thumb-popup btr-body-popup">

				<div class=btr-body-outfits>
					<label>Outfits</label>

					<div class="btr-body-outfit-btn selected" data-outfit=current>
						<div class=btr-body-outfit-icon>
							<img src="https://www.roblox.com/avatar-thumbnail/image?userId=4719353&width=150&height=150&format=png">
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
							<img src="https://www.roblox.com/outfit-thumbnail/image?width=150&height=150&format=png&userOutfitId=1116516198">
						</div>
						<span class=btr-body-outfit-title>Default</span>
					</div>
					<div class=btr-body-outfit-btn data-outfit=custom>
						<div class=btr-body-outfit-icon>
							<img src="https://tr.rbxcdn.com/0291e3569377d17f1ea852a773ad56a5/110/110/Decal/Png">
						</div>
						<span class=btr-body-outfit-title>Custom</span>
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

		const bodyPopup = buttons.$find(".btr-body-popup")
		// const bodyBtn = buttons.$find(".btr-body-btn")

		const inputSliders = []
		const customOutfitBtn = buttons.$find(`.btr-body-outfit-btn[data-outfit="custom"]`)

		this.bundleOutfitBtn = buttons.$find(`.btr-body-outfit-btn[data-outfit="bundle"]`)

		const loadSliders = () => {
			bodyPopup.$findAll("input").forEach(input => {
				const scaleName = input.dataset.target
				const rule = this.avatarRules.scales[scaleName]
				const label = input.previousElementSibling

				const update = () => {
					label.textContent = Math.floor(input.value * 100 + 0.5) + "%"
				}

				input.$on("input", () => {
					update()

					const targetScales = this.appearance.scales
					targetScales[scaleName] = +input.value

					if(scaleName === "width") {
						targetScales.depth = 0.5 + targetScales.width / 2 // What a surprise, undefined scaling behavior.,,
					}

					this.scene.avatar.setScales(targetScales)

					if(!customOutfitBtn.classList.contains("selected")) {
						this.selectOutfit("custom")
					}
				})

				input.min = rule.min
				input.max = rule.max
				input.step = rule.increment

				inputSliders.push({ input, update, scaleName })
			})
		}

		const updateSliders = () => {
			inputSliders.forEach(({ input, update, scaleName }) => {
				input.value = this.appearance.scales[scaleName]
				update()
			})
		}

		if(this.avatarRules) {
			loadSliders()
			updateSliders()
		} else {
			this.once("avatarRulesLoaded", loadSliders)
		}

		this.on("appearanceLoaded", updateSliders)

		const typeInput = typeSwitch.$find("input")
		const typeUpdate = () => {
			typeInput.checked = this.playerType === "R15"
			bodyPopup.$findAll("input").forEach(x => x.toggleAttribute("disabled", !typeInput.checked))
			// bodyPopup.classList.toggle("disabled", !typeInput.checked)
			// bodyBtn.toggleAttribute("disabled", !typeInput.checked)
		}

		this.on("playertypechanged", typeUpdate)
		typeUpdate()

		typeInput.$on("change", () => {
			this.setPlayerType(typeInput.checked ? "R15" : "R6")
		})

		buttons.$on("click", ".btr-hats-btn", ev => {
			const self = ev.currentTarget
			const disabled = !self.classList.contains("checked")
			self.classList.toggle("checked", disabled)

			this.setAccessoriesVisible(!disabled)
		})

		/*
		buttons.$on("click", ".btr-body-btn", ev => {
			const self = ev.currentTarget
			const disabled = !self.classList.contains("checked")
			self.classList.toggle("checked", disabled)

			this.setPackagesVisible(!disabled)
		})
		*/

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
			const anim = this.getAnimation(assetId)

			if(anim && anim.animType === "swim") {
				this.scene.avatar.offsetPos.set(0, 0, .5)
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

	selectOutfit(target) {
		target = target || "current"

		if(target === "current") {
			this.outfitId = null
		} else if(target === "bundle") {
			this.outfitId = this.bundleOutfitId
		} else if(target === "default") {
			this.outfitId = 1116516198
		} else if(target !== "custom") {
			this.outfitId = target
		}

		this.buttons.$findAll(".btr-body-outfit-btn.selected").forEach(x => x.classList.remove("selected"))
		this.buttons.$find(`.btr-body-outfit-btn[data-outfit="${target}"]`).classList.add("selected")

		if(target !== "custom") {
			this.reloadOutfit()
		}
	}

	setVisible(bool) {
		if(this.isShown === !!bool) { return }
		this.isShown = !!bool

		document.$watch(["#AssetThumbnail", "#AssetThumbnail .thumbnail-buttons"], (thumb, btns) => {
			if(this.isShown) {
				thumb.classList.add("btr-preview-enabled")
				thumb.append(this.dropdown, this.typeSwitch, this.bundleAnims)
				btns.append(this.buttons)
			} else {
				thumb.classList.remove("btr-preview-enabled")
				this.dropdown.remove()
				this.typeSwitch.remove()
				this.bundleAnims.remove()
				this.buttons.remove()
			}
		})
	}

	setBundleOutfit(outfitId) {
		this.bundleOutfitId = outfitId

		if(outfitId) {
			this.bundleOutfitBtn.style.display = ""
			this.bundleOutfitBtn.$find("img").src = `https://www.roblox.com/outfit-thumbnail/image?width=150&height=150&format=png&userOutfitId=${outfitId}`
		} else {
			this.bundleOutfitBtn.style.display = "none"
		}
	}

	getAnimation(animId) {
		return this.animMap[animId]
	}

	playAnimation(animId) {
		const anim = this.getAnimation(animId)
		if(!anim) { return console.warn("No anim", animId) }

		super.playAnimation(anim.assetId)
		
		if(this.hasDropdown) {
			const label = this.dropdown.$find("[data-bind='label']")
			label.textContent = anim.isBundleAnim ? "Emotes" : anim.name
			label.title = anim.isBundleAnim ? "" : anim.name
		}

		if(this.hasBundleAnims) {
			this.bundleAnims.$findAll(".selected").forEach(x => x.classList.remove("selected"))

			if(anim.isBundleAnim) {
				anim.selections.forEach(sel => {
					sel.classList.add("selected")
				})
			}
			
			const curName = $("#current-animation-name")
			if(curName) {
				this.currentAnimName = anim.name
				curName.textContent = anim.name
			}
		}
	}

	addAnimation(assetId, name) {
		if(this.getAnimation(name)) {
			for(let i = 2; i < Infinity; i++) {
				const newName = `${name}_${i}`

				if(!this.getAnimation(newName)) {
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

		if(!this.hasDropdown && (this.dropdownMenu.children.length >= 2 || this.hasBundleAnims)) {
			this.hasDropdown = true
			this.dropdown.style.display = ""
		}

		return anim
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
		
		if(!this.hasBundleAnims) {
			this.hasBundleAnims = true
			this.bundleAnims.style.display = ""

			// Move camera down
			this.scene.cameraOffset.y -= 1
		}

		if(!this.hasDropdown && this.dropdownMenu.children.length >= 1) {
			this.hasDropdown = true
			this.dropdown.style.display = ""
		}

		const anim = this.animMap[assetId] = { assetId }
		anim.name = assetName
		anim.animType = origAnimType
		anim.isBundleAnim = true
		anim.selections = [root]

		let btn = root
		if(!isAlt && !root.hasAttribute("disabled")) {
			isAlt = true
			altText = "ALT"
		}

		if(isAlt) {
			const alts = this.bundleAlts[animType] = this.bundleAlts[animType] || { list: [] }

			if(!alts.cont) {
				alts.cont = html`<div class=btr-bundle-alt-container></div>`
				root.prepend(alts.cont)
			}

			btn = html`<div class="btr-bundle-btn-alt btn-control-xs">${altText}</div>`
			alts.cont.prepend(btn)

			anim.selections.push(alts.cont, btn)
		} else {
			btn.removeAttribute("disabled")
		}

		btn.$on("click", ev => {
			this.playAnimation(anim.assetId)

			ev.stopImmediatePropagation()
			ev.preventDefault()
		})
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
				let targetOutfitId

				const finalizeLoad = () => {
					if(debounceCounter !== debounce) { return }

					if(!assetPromises.length) {
						invalidAssets[assetId] = true
						thumbCont.classList.remove("btr-preview-loading")
						clearTarget()
						return
					}

					preview.outfitId = targetOutfitId
					preview.reloadOutfit()

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

						$.setImmediate(() => {
							if(debounceCounter !== debounce) { return }

							preview.scene.update()
							avatar.animator.reset()
							avatar.update()
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
								addedObjects.forEach(obj => box.expandByObject(obj))

								const center = box.max.clone().add(box.min).divideScalar(2)
								const radius = box.max.clone().sub(center).length()

								preview.scene.cameraFocus.copy(center)
								preview.scene.cameraZoom = Math.max(2.75, radius * 1.7)

								setCameraDir(cameraDir || "Front")
							} else {
								preview.scene.cameraFocus.set(0, 3, 0)
								preview.scene.cameraZoom = 3
								
								setCameraDir("Front")
							}

							const thumb = self.$find(thumbContSelector)
							thumb.append(preview.container)
							thumb.classList.add("btr-preview-container-parent")

							preview.scene.update()
							preview.scene.render()
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

						targetOutfitId = null

						json.items.forEach(item => {
							if(item.type === "Asset") {
								addAssetPreview(item.id)
							} else if(item.type === "UserOutfit") {
								targetOutfitId = item.id
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
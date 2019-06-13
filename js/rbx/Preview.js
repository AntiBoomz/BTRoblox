"use strict"

const RBXPreview = (() => {
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

		Object.entries(origColors).forEach(([name, value]) => {
			const index = name.toLowerCase().replace(/colorid$/, "")
			const bodyColor = rules.bodyColorsPalette.find(x => x.brickColorId === value)
			bodyColors[index] = bodyColor.hexColor
		})

		return bodyColors
	}

	function getOutfitData(id) {
		const outfitPromise = tryGet(`https://avatar.roblox.com/v1/outfits/${id}/details`)

		return SyncPromise.all([getAvatarRules(), outfitPromise]).then(([rules, data]) => {
			data = { ...data }

			data.scales = data.scale
			delete data.scale

			data.bodyColors = solveBodyColors(data.bodyColors, rules)
			return [rules, data]
		})
	}

	function getDefaultAppearance() {
		const outfitPromise = tryGet(`https://avatar.roblox.com/v1/avatar`)

		return SyncPromise.all([getAvatarRules(), outfitPromise]).then(([rules, data]) => {
			data = { ...data }
			data.bodyColors = solveBodyColors(data.bodyColors, rules)
			return [rules, data]
		})
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
			this.animMap = {}
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
			this.isAppearanceLoaded = false

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
						this.loadAnimation(this.currentAnim.assetId)
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
				outfitPromise = getOutfitData(this.outfitId)
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

			const promises = data.assets
				.filter(asset => !SkippableAssetTypes.includes(asset.assetType.id))
				.map(asset => this.addAsset(asset.id))
				.filter(x => x)
			
			SyncPromise.all(promises).finally(() => this.appearanceLoadedPromise.resolve())
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

		getAnimation(animId) {
			return this.animMap[animId]
		}

		playAnimation(animId) {
			const anim = this.getAnimation(animId)
			if(!anim) { return }

			this.currentAnim = anim
			this.scene.avatar.animator.pause()
			this.playingAnim = null

			if(this.enabled) {
				this.loadAnimation(anim.assetId)
			} else {
				this.animLoadCounter++
			}
		}

		addAnimation(animId) {
			return this.animMap[animId] = { assetId: animId }
		}
	}

	return {
		AvatarPreviewer
	}
})()
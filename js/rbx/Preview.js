"use strict"

const RBXPreview = (() => {
	let avatarRulePromise
	function getAvatarRules() {
		if(!avatarRulePromise) {
			const url = "https://avatar.roblox.com/v1/avatar-rules"
			avatarRulePromise = csrfFetch(url, { credentials: "include" }).then(resp => resp.json())
		}

		return avatarRulePromise
	}

	function getAvatarData() {
		const url = "https://avatar.roblox.com/v1/avatar"
		return csrfFetch(url, { credentials: "include" }).then(resp => resp.json())
	}

	function getDefaultAppearance(cb) {
		Promise.all([getAvatarRules(), getAvatarData()]).then(([rules, data]) => {
			cb(data, rules)
		})
	}

	class Previewer {
		constructor() {
			this.enabled = false
			this.initialized = false

			this._onInit = []
		}

		onInit(cb) {
			if(this.initialized) { cb() }
			else { this._onInit.push(cb) }
		}

		setEnabled(bool) {
			bool = !!bool
			if(this.enabled === bool) { return }
			this.enabled = bool

			if(!this.initialized) {
				this.initialized = true

				this._onInit.forEach(cb => cb.call(this))
				delete this._onInit

				this.container.append(this.scene.canvas)
				if(this.enabled) { this.scene.start() }
			} else if(this.scene) {
				if(this.enabled) { this.scene.start() }
				else { this.scene.stop() }
			}
		}
	}

	class AvatarPreviewer extends Previewer {
		constructor() {
			super()
			this.container = html`
			<div style="width:100%; height:100%">
				<div class=btr-switch style="position:absolute;top:6px;right:6px">
					<div class=btr-switch-off>R6</div>
					<div class=btr-switch-on>R15</div>
					<input type=checkbox> 
					<div class=btr-switch-flip>
						<div class=btr-switch-off>R6</div>
						<div class=btr-switch-on>R15</div>
					</div>
				</div>
				<div class=input-group-btn style="position:absolute;top:6px;left:6px;width:140px;display:none">
					<button type=button class=input-dropdown-btn data-toggle=dropdown>
						<span class=rbx-selection-label data-bind=label></span>
						<span class=icon-down-16x16></span>
					</button>
					<ul data-toggle=dropdown-menu class=dropdown-menu role=menu></ul>
				</div>
			</div>`

			const ptSwitch = this.ptSwitch = this.container.$find(".btr-switch > input")
			const dropdown = this.dropdown = this.container.$find(".input-group-btn")
			this.menu = dropdown.$find(".dropdown-menu")

			ptSwitch.$on("change", () => {
				this.setPlayerType(ptSwitch.checked ? "R15" : "R6")
			})

			dropdown.$on("click", ".dropdown-menu>li", ev => {
				this.selectAnimation(+ev.currentTarget.dataset.id)
			})

			this.animList = []
			this.assets = []

			this.onInit(() => {
				const scene = this.scene = new RBXScene.AvatarScene()
				window.scene = scene

				scene.avatar.setPlayerType("R6")
				if(this.animList.length) { this.selectAnimation(0, true) }
				if(this.assets.length) { this.assets.forEach(asset => scene.avatar.addAsset(asset)) }

				if(this.areAccessoriesVisible === false) { this.setAccessoriesVisible(false) }
				if(this.arePackagesVisible === false) { this.setPackagesVisible(false) }

				getDefaultAppearance((data, rules) => {
					// Body Colors
					const bodyColors = {}

					Object.entries(data.bodyColors).forEach(([name, value]) => {
						const index = name.toLowerCase().replace(/colorid$/, "")
						const bodyColor = rules.bodyColorsPalette.find(x => x.brickColorId === value)
						bodyColors[index] = bodyColor.hexColor
					})

					scene.avatar.setBodyColors(bodyColors)

					// Player Type
					if(this.animList.length === 0) {
						this.setPlayerType(this.playerType || data.playerAvatarType)
					}

					// Assets
					data.assets.forEach(asset => {
						this.addAsset(asset.id, asset.assetType.id)
					})
				})

				scene.avatar.animator.onstop = function() {
					setTimeout(() => this.play(), 2000)
				}
			})
		}

		setPlayerType(type) {
			this.playerType = type
			if(this.scene) { this.scene.avatar.setPlayerType(type) }
			this.ptSwitch.checked = type === "R15"

			if(!this.animList.length && this.disableDefaultAnimations !== true) {
				const animId = type === "R15" ? 507766388 : 180435571
				this.stopAnimation()
				AssetCache.loadAnimation(animId, anim => {
					if(!anim || this.currentAnimation !== null) { return }
					this.playAnimation(anim)
				})
			}
		}

		setPackagesVisible(bool) {
			this.arePackagesVisible = bool
			if(this.scene) {
				this.scene.avatar.bodyparts.forEach(bp => {
					if(bp.asset.info && bp.asset.info.previewTarget) { return }
					bp.hidden = !bool
				})
				this.scene.avatar.refreshBodyParts()
			}
		}

		setAccessoriesVisible(bool) {
			this.areAccessoriesVisible = bool
			if(this.scene) {
				this.scene.avatar.accessories.forEach(acc => {
					if(acc.asset.info && acc.asset.info.previewTarget) { return }
					acc.obj.visible = bool
				})
			}
		}

		addAsset(assetId, assetTypeId, info) {
			const asset = { assetId, assetTypeId, info }

			if(UniqueWearableAssetTypeIds.indexOf(assetTypeId) !== -1) {
				const old = this.assets.find(x => x.assetTypeId === assetTypeId)
				if(old) {
					if(old.info && old.info.previewTarget) { return }
					this.removeAsset(old)
				}
			}

			this.assets.push(asset)
			if(this.scene) { this.scene.avatar.addAsset(asset) }
		}

		removeAsset(asset) {
			const index = this.assets.indexOf(asset)
			if(index === -1) { return }

			this.assets.splice(index, 1)
			if(this.scene) {
				const avatar = this.scene.avatar

				const bp = avatar.bodyparts.findIndex(x => x.asset === asset)
				if(bp !== -1) { avatar.bodyparts.splice(bp, 1) }

				const acc = avatar.accessories.findIndex(x => x.asset === asset)
				if(acc !== -1) { avatar.accessories.splice(acc, 1) }

				avatar.refresh()
			}
		}

		playAnimation(anim) {
			if(this.currentAnimation === anim) { return }
			this.currentAnimation = anim
			if(this.scene) { this.scene.avatar.animator.play(anim) }
		}

		stopAnimation() {
			this.currentAnimation = null
			if(this.scene) { this.scene.avatar.animator.pause() }
		}

		selectAnimation(index, matchPlayerType) {
			this.selectedAnimation = index
			const anim = this.animList[index]

			this.dropdown.$find("[data-bind='label']").textContent = anim.name

			if(!anim.promise) { anim.promise = new Promise(resolve => AssetCache.loadAnimation(anim.assetId, resolve)) }

			this.stopAnimation()
			anim.promise.then(data => {
				if(this.selectedAnimation !== index) { return }
				if(matchPlayerType) {
					const R15BodyPartNames = [
						"LeftFoot", "LeftHand", "LeftLowerArm", "LeftLowerLeg", "LeftUpperArm", "LeftUpperLeg", "LowerTorso",
						"RightFoot", "RightHand", "RightLowerArm", "RightLowerLeg", "RightUpperArm", "RightUpperLeg", "UpperTorso"
					]

					const isR15 = R15BodyPartNames.some(x => x in data.keyframes)
					this.setPlayerType(isR15 ? "R15" : "R6")
				}

				this.playAnimation(data)
			})
		}

		addAnimation(name, assetId) {
			const index = this.animList.length
			this.animList[index] = { name, assetId }

			const elem = html`<li data-id=${index}><a href=#>${name}</a></li>`
			this.menu.append(elem)

			if(index === 1) { this.dropdown.style.display = "" }
			if(this.selectedAnimation == null && index === 0) { this.selectAnimation(index, true) }
		}
	}

	return {
		AvatarPreviewer
	}
})()
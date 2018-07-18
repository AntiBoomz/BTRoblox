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

	const R6AnimParts = ["Torso", "Left Arm", "Right Arm", "Left Leg", "Right Leg"]

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

			this.playerType = null
			this.anims = []
			this.assets = []

			this.animLoadCounter = 0
			this.currentAnim = null

			this.accessoriesVisible = true
			this.packagesVisible = true
			this.disableDefaultAnimations = false

			this.onInit(() => {
				const scene = this.scene = window.scene = new RBXScene.AvatarScene()
				const avatar = scene.avatar

				if(this.currentAnim) { this.loadAnimation(this.currentAnim.assetId) }
				this.assets.forEach(asset => scene.avatar.addAsset(asset))

				if(this.playerType) { this.setPlayerType(this.playerType) }
				this.setPackagesVisible(this.packagesVisible)
				this.setAccessoriesVisible(this.accessoriesVisible)

				getDefaultAppearance((data, rules) => {
					this.appearance = data
					const bodyColors = {}

					Object.entries(data.bodyColors).forEach(([name, value]) => {
						const index = name.toLowerCase().replace(/colorid$/, "")
						const bodyColor = rules.bodyColorsPalette.find(x => x.brickColorId === value)
						bodyColors[index] = bodyColor.hexColor
					})

					avatar.setBodyColors(bodyColors)
					if(this.packagesVisible) { avatar.setScales(data.scales) }

					if(!this.playerType && !this.getPlayerTypeFromAnim) {
						this.setPlayerType(data.playerAvatarType)
					}

					data.assets.forEach(asset => this.addAsset(asset.id, asset.assetType.id))
				})

				avatar.animator.onstop = () => setTimeout(() => avatar.animator.play(), 2000)
			})
		}

		setPlayerType(type) {
			this.playerType = type
			this.ptSwitch.checked = type === "R15"

			if(this.initialized) {
				this.scene.avatar.setPlayerType(type)

				if(!this.currentAnim && !this.disableDefaultAnimations) {
					const animId = type === "R15" ? 507766388 : 180435571
					this.loadAnimation(animId)
				}
			}
		}

		setPackagesVisible(bool) {
			const visible = this.packagesVisible = !!bool
			if(this.initialized) {
				this.scene.avatar.bodyparts.forEach(bp => {
					if(bp.asset.info && bp.asset.info.previewTarget) { return }
					bp.hidden = !visible
				})

				if(visible) {
					if(this.appearance) {
						this.scene.avatar.setScales(this.appearance.scales)
					}
				} else {
					this.scene.avatar.setScales({
						width: 1,
						height: 1,
						depth: 1,
						head: 1,
						proportion: 0,
						bodyType: 0
					})
				}

				this.scene.avatar.shouldRefreshBodyParts = true
			}
		}

		setAccessoriesVisible(bool) {
			const visible = this.accessoriesVisible = !!bool
			if(this.initialized) {
				this.scene.avatar.accessories.forEach(acc => {
					if(acc.asset.info && acc.asset.info.previewTarget) { return }
					acc.obj.visible = visible
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

			if(this.initialized) {
				this.scene.avatar.addAsset(asset)
			}
		}

		removeAsset(asset) {
			const index = this.assets.indexOf(asset)
			if(index === -1) { return }
			this.assets.splice(index, 1)

			if(this.initialized) {
				this.scene.avatar.removeAsset(asset)
			}
		}

		loadAnimation(assetId) {
			const index = ++this.animLoadCounter

			if(this.initialized) {
				this.scene.avatar.animator.pause()
			}

			AssetCache.loadAnimation(assetId, data => {
				if(this.animLoadCounter !== index) { return }

				if(this.getPlayerTypeFromAnim) {
					this.getPlayerTypeFromAnim = false
					const isR6 = R6AnimParts.some(x => x in data.keyframes)
					this.setPlayerType(isR6 ? "R6" : "R15")
				}

				if(this.initialized) {
					this.scene.avatar.animator.play(data)
				}
			})
		}

		playAnimation(name) {
			const anim = this.anims.find(x => x.name === name)
			if(!anim) { return }

			this.currentAnim = anim
			this.dropdown.$find("[data-bind='label']").textContent = name

			this.loadAnimation(anim.assetId)
		}

		addAnimation(name, assetId) {
			const anim = { name, assetId }
			this.anims.push(anim)

			const elem = html`<li><a href=#>${name}</a></li>`
			this.menu.append(elem)

			elem.$on("click", () => this.playAnimation(name))

			if(this.anims.length === 1) { this.playAnimation(name) }
			else if(this.anims.length === 2) { this.dropdown.style.display = "" }
		}
	}

	return {
		AvatarPreviewer
	}
})()
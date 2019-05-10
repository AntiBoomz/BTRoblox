"use strict"

const RBXAvatar = (() => {
	const Vector3 = THREE.Vector3
	
	const R6BodyPartNames = ["Torso", "Left Arm", "Right Arm", "Left Leg", "Right Leg"]
	const R15BodyPartNames = [
		"LeftFoot", "LeftHand", "LeftLowerArm", "LeftLowerLeg", "LeftUpperArm", "LeftUpperLeg", "LowerTorso",
		"RightFoot", "RightHand", "RightLowerArm", "RightLowerLeg", "RightUpperArm", "RightUpperLeg", "UpperTorso"
	]

	const UniqueAssetTypeIds = [
		2, 11, 12, 17, 18, 28, 29, 30, 31
	]

	const ScaleMods = {
		Default: {
			LeftHand: new Vector3(1.066, 1.174, 1.231),
			LeftLowerArm: new Vector3(1.129, 1.342, 1.132),
			LeftUpperArm: new Vector3(1.129, 1.342, 1.132),
			RightHand: new Vector3(1.066, 1.174, 1.231),
			RightLowerArm: new Vector3(1.129, 1.342, 1.132),
			RightUpperArm: new Vector3(1.129, 1.342, 1.132),
			UpperTorso: new Vector3(1.033, 1.309, 1.14),
			LeftFoot: new Vector3(1.079, 1.267, 1.129),
			LeftLowerLeg: new Vector3(1.023, 1.506, 1.023),
			LeftUpperLeg: new Vector3(1.023, 1.506, 1.023),
			RightFoot: new Vector3(1.079, 1.267, 1.129),
			RightLowerLeg: new Vector3(1.023, 1.506, 1.023),
			RightUpperLeg: new Vector3(1.023, 1.506, 1.023),
			LowerTorso: new Vector3(1.033, 1.309, 1.14),
			Head: new Vector3(0.942, 0.942, 0.942)
		},
		Rthro: {
			LeftHand: new Vector3(1.39, 0.967, 1.201),
			LeftLowerArm: new Vector3(1.121, 0.681, 0.968),
			LeftUpperArm: new Vector3(1.121, 0.681, 0.968),
			RightHand: new Vector3(1.39, 0.967, 1.201),
			RightLowerArm: new Vector3(1.121, 0.681, 0.968),
			RightUpperArm: new Vector3(1.121, 0.681, 0.968),
			UpperTorso: new Vector3(1.014, 0.814, 0.924),
			LeftFoot: new Vector3(1.404, 0.953, 0.931),
			LeftLowerLeg: new Vector3(0.978, 0.814, 1.056),
			LeftUpperLeg: new Vector3(0.978, 0.814, 1.056),
			RightFoot: new Vector3(1.404, 0.953, 0.931),
			RightLowerLeg: new Vector3(0.978, 0.814, 1.056),
			RightUpperLeg: new Vector3(0.978, 0.814, 1.056),
			LowerTorso: new Vector3(1.014, 0.814, 0.924),
			Head: new Vector3(1.6, 1.6, 1.6)
		},
		Proportion: {
			LeftHand: new Vector3(1.125, 1, 1.125),
			LeftLowerArm: new Vector3(1.125, 1.111, 1.125),
			LeftUpperArm: new Vector3(1.125, 1.111, 1.125),
			RightHand: new Vector3(1.125, 1, 1.125),
			RightLowerArm: new Vector3(1.125, 1.111, 1.125),
			RightUpperArm: new Vector3(1.125, 1.111, 1.125),
			UpperTorso: new Vector3(1.141, 1.087, 1.125),
			LeftFoot: new Vector3(1.048, 1.118, 1.125),
			LeftLowerLeg: new Vector3(1.048, 1.158, 1.125),
			LeftUpperLeg: new Vector3(1.048, 1.075, 1.125),
			RightFoot: new Vector3(1.048, 1.118, 1.125),
			RightLowerLeg: new Vector3(1.048, 1.158, 1.125),
			RightUpperLeg: new Vector3(1.048, 1.075, 1.125),
			LowerTorso: new Vector3(1.048, 1.303, 1.125),
			Head: new Vector3(1.051, 1, 1.051)
		}
	}

	function applyMesh(obj, mesh) {
		const geom = obj.geometry

		geom.addAttribute("position", new THREE.BufferAttribute(mesh.vertices, 3))
		geom.addAttribute("normal", new THREE.BufferAttribute(mesh.normals, 3))
		geom.addAttribute("uv", new THREE.BufferAttribute(mesh.uvs, 2))
		geom.setIndex(new THREE.BufferAttribute(mesh.faces, 1))

		// geom.computeBoundingSphere()

		geom.verticesNeedUpdate = true
		geom.elementsNeedUpdate = true
		geom.uvsNeedUpdate = true
		geom.normalsNeedUpdate = true
		geom.groupsNeedUpdate = true

		obj.visible = true
	}

	function clearGeometry(obj) {
		const geom = obj.geometry

		geom.removeAttribute("position")
		geom.removeAttribute("normal")
		geom.removeAttribute("uv")
		geom.setIndex(null)

		// geom.computeBoundingSphere()

		geom.verticesNeedUpdate = true
		geom.elementsNeedUpdate = true
		geom.uvsNeedUpdate = true
		geom.normalsNeedUpdate = true
		geom.groupsNeedUpdate = true

		obj.visible = false
	}

	function CFrame(x, y, z, r00, r01, r02, r10, r11, r12, r20, r21, r22) {
		return new THREE.Matrix4().set(
			r00, r01, r02, x,
			r10, r11, r12, y,
			r20, r21, r22, z,
			0, 0, 0, 1
		)
	}

	function InvertCFrame(...args) {
		return new THREE.Matrix4().getInverse(args[0] instanceof THREE.Matrix4 ? args[0] : CFrame(...args))
	}
	
	function solidColorDataURL(r, g, b) {
		return "data:image/gif;base64,R0lGODlhAQABAPAA"
			+ btoa(String.fromCharCode(0, r, g, b, 255, 255))
			+ "/yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="
	}

	const emptySrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII="
	const graySrc = solidColorDataURL(163, 162, 165)
	const mergeUpdateQueue = []

	function setImageSource(img, src) {
		src = src || emptySrc
		if(img.src !== src) {
			img.src = src

			if(img.complete) {
				img.updateOnLoad = null
				img.updateListeners.forEach(fn => fn())
			} else {
				img.updateOnLoad = src
			}
		}
	}

	function createImage() {
		const img = new Image()
		img.src = emptySrc
		img.crossOrigin = "anonymous"

		img.updateListeners = []
		img.addEventListener("load", () => {
			if(img.complete && img.src === img.updateOnLoad) {
				img.updateListeners.forEach(fn => fn())
			}
		})

		return img
	}

	function createTexture(img) {
		if(!img) { img = createImage() }

		const texture = new THREE.Texture(img)
		texture.minFilter = THREE.LinearFilter

		if(img instanceof Image) {
			img.updateListeners.push(() => texture.needsUpdate = true)
		}

		return texture
	}

	function mergeTexture(width, height, ...images) {
		width = 2 ** Math.ceil(Math.log2(width))
		height = 2 ** Math.ceil(Math.log2(height))

		const canvas = document.createElement("canvas")
		const ctx = canvas.getContext("2d")
		canvas.width = width
		canvas.height = height

		const texture = new THREE.Texture(canvas)
		texture.minFilter = THREE.LinearFilter
		texture.wrapS = THREE.RepeatWrapping
		texture.wrapT = THREE.RepeatWrapping

		const stack = []

		function updateFinal() {
			ctx.clearRect(0, 0, canvas.width, canvas.height)

			stack.forEach(img => {
				if(img instanceof HTMLCanvasElement || img.src !== "" && img.src !== emptySrc) {
					ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height)
				}
			})

			texture.needsUpdate = true
		}

		function requestUpdateFinal() {
			if(!mergeUpdateQueue.includes(updateFinal)) {
				mergeUpdateQueue.push(updateFinal)
			}
		}

		images.forEach(img => {
			stack.push(img)

			if(img instanceof Image) {
				// img.addEventListener("load", updateFinal, false)
				img.updateListeners.push(requestUpdateFinal)
			} else if(img instanceof HTMLCanvasElement) {
				// img.addEventListener("compositeupdate", requestUpdateFinal, false)
				img.updateListeners.push(requestUpdateFinal)
			}
		})

		updateFinal()
		return texture
	}

	class Avatar {
		constructor() {
			this.model = new THREE.Group()
			this.animator = new RBXAnimator()
			this.appearance = new RBXAppearance()

			this.accessories = []
			this.attachments = {}
			this.joints = {}
			this.parts = {}

			this.playerType = null

			this.offset = new THREE.Group()
			this.model.add(this.offset)

			this.offsetPos = this.offset.position
			this.offsetRot = this.offset.rotation

			const att = new THREE.Group()
			att.position.set(0, 0.5, 0)
			this.defaultHatAttachment = { obj: att }

			this.scales = {
				width: 1,
				height: 1,
				depth: 1,
				head: 1,
				proportion: 0,
				bodyType: 0
			}

			this.appearance.on("update", () => this.shouldRefreshBodyParts = true)
		}

		init() {
			if(this.hasInit) { throw new Error("Avatar has already been initialized") }
			this.hasInit = true

			const textures = this.textures = {
				pants: createTexture(),
				shirt: createTexture(),
				tshirt: createTexture()
			}

			const images = this.images = {
				base: {},
				over: {},

				clothing: {
					pants: textures.pants.image,
					shirt: textures.shirt.image,
					tshirt: textures.tshirt.image,
					face: createImage()
				}
			}

			AssetCache.loadImage(true, getURL("res/previewer/face.png"), url => {
				images.clothing.face.defaultSrc = url
				this.shouldRefreshBodyParts = true
			})

			this.headComposite = new RBXComposites.Texture(false, RBXComposites.HeadCompositeConstructor, textures)
			this.r6Composite = new RBXComposites.Texture(true, RBXComposites.R6CompositeConstructor, textures)

			const leftMesh = getURL("res/previewer/compositing/R15CompositLeftArmBase.mesh")
			const rightMesh = getURL("res/previewer/compositing/R15CompositRightArmBase.mesh")

			this.r15Composites = {
				torso: new RBXComposites.Texture(true, RBXComposites.R15TorsoCompositeConstructor, textures),
				leftarm: new RBXComposites.Texture(true, RBXComposites.R15LimbCompositeConstructor, textures.shirt, leftMesh),
				rightarm: new RBXComposites.Texture(true, RBXComposites.R15LimbCompositeConstructor, textures.shirt, rightMesh),
				leftleg: new RBXComposites.Texture(true, RBXComposites.R15LimbCompositeConstructor, textures.pants, leftMesh),
				rightleg: new RBXComposites.Texture(true, RBXComposites.R15LimbCompositeConstructor, textures.pants, rightMesh)
			}

			images.base.Head = createImage()
			images.over.Head = createImage()
			textures.Head = mergeTexture(256, 256, this.headComposite.canvas, images.base.Head, images.over.Head, images.clothing.face)

			R6BodyPartNames.forEach(name => {
				const base = images.base[name] = createImage()
				const over = images.over[name] = createImage()

				textures[name] = mergeTexture(1024, 512, this.r6Composite.canvas, base, over)
			})

			R15BodyPartNames.forEach(name => {
				const compositeName = name.toLowerCase().replace(/upper|lower/g, "").replace(/hand/g, "arm").replace(/foot/g, "leg")
				const composite = this.r15Composites[compositeName]
				const over = images.over[name] = createImage()

				textures[name] = mergeTexture(composite.canvas.width, composite.canvas.height, composite.canvas, over)
			})

			RBXAvatarRigs.load(() => {
				this.shouldRefreshRig = true
			})

			if(this.bodyColors) {
				this.setBodyColors(this.bodyColors)
			}
		}

		update() {
			if(this.shouldRefreshRig) {
				this._refreshRig()
			}

			if(this.shouldRefreshBodyParts) {
				this._refreshBodyParts()
			}

			this.animator.update()

			const composites = this.playerType === "R6" ? [this.headComposite, this.r6Composite] : [this.headComposite, ...Object.values(this.r15Composites)]
			composites.forEach(comp => {
				if(comp.needsUpdate) {
					comp.update()
				}
			})

			while(mergeUpdateQueue.length) {
				mergeUpdateQueue.shift()()
			}
		}

		resetScales() {
			this.setScales({
				width: 1,
				height: 1,
				depth: 1,
				head: 1,
				proportion: 0,
				bodyType: 0
			})
		}

		setScales(scales) {
			Object.keys(this.scales).forEach(name => {
				if(name in scales) {
					this.scales[name] = scales[name]
				}
			})

			this.shouldRefreshBodyParts = true
		}

		addAsset(assetId, assetTypeId) {
			return this.appearance.addAsset(assetId, assetTypeId)
		}

		setBodyColors(bodyColors) {
			this.bodyColors = bodyColors
			if(!this.hasInit) { return }

			this.r6Composite.bodyColors = bodyColors
			this.r6Composite.shouldUpdateBodyColors = true
			this.r6Composite.update()

			Object.entries(this.r15Composites).forEach(([name, composite]) => {
				if(!bodyColors[name]) { return }

				composite.background = bodyColors[name]
				composite.update()
			})

			this.headComposite.background = bodyColors.head
			this.headComposite.update()
		}

		setPlayerType(playerType) {
			if(this.playerType === playerType) { return }
			this.playerType = playerType
			this.shouldRefreshRig = true
		}

		getScaleMod(partName, scaleType, partScaleType) { // Only use partScaleType with accessories! C:
			if(this.playerType !== "R15") { return new Vector3(1, 1, 1) }

			let baseScale
			let startScale
			let endScale

			if(partName === "Head") {
				baseScale = new Vector3().setScalar(this.scales.head)
			} else {
				baseScale = new Vector3(this.scales.width, this.scales.height, this.scales.depth)
			}

			if(scaleType === "ProportionsNormal") {
				const bodyMod = ScaleMods.Rthro[partName] || new Vector3(1, 1, 1)
				const propMod = ScaleMods.Proportion[partName] || new Vector3(1, 1, 1)

				if(partScaleType && partScaleType !== "ProportionsNormal" && partScaleType !== "ProportionsSlender") {
					const defaultMod = ScaleMods.Default[partName] || new Vector3(1, 1, 1)

					startScale = bodyMod.clone()
					endScale = bodyMod.clone().multiply(defaultMod).multiply(new Vector3(1, 1, 1).lerp(new Vector3(1, 1, 1).divide(propMod), this.scales.proportion))
				} else {
					startScale = bodyMod.clone()
					endScale = new Vector3(1, 1, 1).lerp(new Vector3(1, 1, 1).divide(propMod), this.scales.proportion)
				}
			} else if(scaleType === "ProportionsSlender") {
				const bodyMod = ScaleMods.Rthro[partName] || new Vector3(1, 1, 1)
				const propMod = ScaleMods.Proportion[partName] || new Vector3(1, 1, 1)

				if(partScaleType && partScaleType !== "ProportionsNormal" && partScaleType !== "ProportionsSlender") {
					const defaultMod = ScaleMods.Default[partName] || new Vector3(1, 1, 1)

					startScale = bodyMod.clone().multiply(propMod)
					endScale = bodyMod.clone().multiply(defaultMod).multiply(propMod).multiply(new Vector3(1, 1, 1).lerp(new Vector3(1, 1, 1).divide(propMod), this.scales.proportion))
				} else {
					startScale = bodyMod.clone().multiply(propMod)
					endScale = propMod.clone().lerp(new Vector3(1, 1, 1), this.scales.proportion)
				}
			} else {
				const bodyMod = ScaleMods.Default[partName] || new Vector3(1, 1, 1)
				const propMod = ScaleMods.Proportion[partName] || new Vector3(1, 1, 1)

				if(partScaleType && (partScaleType === "ProportionsNormal" || partScaleType === "ProportionsSlender")) {
					const rthroMod = ScaleMods.Rthro[partName] || new Vector3(1, 1, 1)

					startScale = new Vector3(1, 1, 1)
					endScale = new Vector3(1, 1, 1).divide(rthroMod).multiply(new Vector3(1, 1, 1).lerp(new Vector3(1, 1, 1).divide(propMod), this.scales.proportion))
				} else {
					startScale = new Vector3(1, 1, 1)
					endScale = bodyMod.clone().multiply(new Vector3(1, 1, 1).lerp(new Vector3(1, 1, 1).divide(propMod), this.scales.proportion))
				}
			}

			return baseScale.multiply(startScale.lerp(endScale, this.scales.bodyType))
		}

		_refreshRig() {
			if(!RBXAvatarRigs.loaded) { return }
			this.shouldRefreshRig = false
		
			if(this.root) {
				this.offset.remove(this.root)

				const recDispose = tar => {
					if(tar.isMesh) {
						if(tar.geometry) { tar.geometry.dispose() }
						if(tar.material) { tar.material.dispose() }
					}

					tar.children.forEach(recDispose)
				}
				recDispose(this.root)
			}

			const parts = this.parts = {}
			const attachments = this.attachments = {}
			const joints = this.joints = {}
			const animJoints = {}

			const CreateModel = tree => {
				const obj = new THREE.Group()
				obj.name = tree.name
				obj.rbxOrigSize = tree.origSize
				obj.rbxScaleMod = new Vector3(1, 1, 1)
				obj.rbxScaleModPure = new Vector3(1, 1, 1)
				parts[tree.name] = obj

				if(tree.name !== "HumanoidRootPart") {
					const mat = new THREE.MeshLambertMaterial({ map: this.textures[tree.name], transparent: true })
					const mesh = new THREE.Mesh(undefined, mat)
					mesh.castShadow = true
					mesh.visible = false

					obj.rbxMesh = mesh
					obj.rbxDefaultMesh = tree.meshid
					obj.add(mesh)
				}

				Object.entries(tree.attachments).forEach(([name, cframe]) => {
					const att = new THREE.Group()
					obj.add(att)
					attachments[name] = { cframe, obj: att, parent: obj }
				})

				tree.children.forEach(child => {
					const childObj = CreateModel(child)
					const c0 = new THREE.Group()
					const c1 = new THREE.Group()
					const joint = new THREE.Group()

					obj.add(c0)
					c0.add(joint)
					joint.add(c1)
					c1.add(childObj)

					joints[child.JointName] = animJoints[child.name] = {
						c0,
						c1,
						joint,
						part0: obj,
						part1: childObj,
						origC0: child.C0,
						origC1: child.C1
					}
				})

				return obj
			}

			if(this.playerType === "R6") {
				this.root = CreateModel(RBXAvatarRigs.R6Tree)
				this.root.position.set(0, 3, 0)
			} else if(this.playerType === "R15") {
				this.root = CreateModel(RBXAvatarRigs.R15Tree)
				this.root.position.set(0, 2.35, 0)
			} else {
				return
			}

			parts.Head.add(this.defaultHatAttachment.obj)

			this.offset.add(this.root)
			this.animator.setJoints(animJoints)

			this._refreshBodyParts()
		}

		_refreshBodyParts() {
			if(!RBXAvatarRigs.loaded) { return }
			this.shouldRefreshBodyParts = false

			const perTypes = {}
			const assets = []

			this.appearance.assets.forEach(asset => {
				if(!asset.loaded) {
					asset.load()
					if(!asset.loaded) { return }
				}

				if(!asset.enabled) { return }

				if(UniqueAssetTypeIds.includes(asset.typeId)) {
					if(!perTypes[asset.typeId] || perTypes[asset.typeId].priority <= asset.priority) {
						perTypes[asset.typeId] = asset
					}
				} else {
					assets.push(asset)
				}
			})

			assets.push(...Object.values(perTypes))

			const parts = {}
			const joints = {}
			const attachments = {}
			const clothing = {}
			const accessories = []
			
			assets.forEach(asset => {
				asset.bodyparts.forEach(bp => {
					if(bp.playerType && bp.playerType !== this.playerType) { return }
					parts[bp.target] = Object.assign(parts[bp.target] || {}, bp)
				})

				asset.attachments.forEach(att => {
					const realAtt = this.attachments[att.target]
					if(!realAtt || att.part !== realAtt.parent.name) { return }

					if(att.cframe) {
						attachments[att.target] = att.cframe
					} else {
						attachments[att.target] = realAtt.cframe.clone().setPosition(att.pos)
					}
				})

				asset.clothing.forEach(cloth => {
					clothing[cloth.target] = cloth.texId
				})

				asset.accessories.forEach(acc => {
					accessories.push(acc)
				})

				if(this.playerType === "R15") {
					asset.joints.forEach(joint => {
						const realJoint = this.joints[joint.target]
						if(!realJoint) { return }
						if(!joints[joint.target]) { joints[joint.target] = {} }

						const isPart0 = joint.part === realJoint.part0.name
						if(joint.cframe) {
							joints[joint.target][joint.part] = isPart0 ? joint.cframe : InvertCFrame(joint.cframe)
						} else {
							const orig = isPart0 ? realJoint.origC0 : realJoint.origC1
							joints[joint.target][joint.part] = orig.clone().setPosition(isPart0 ? joint.pos : joint.pos.clone().negate())
						}
					})
				}
			})

			Object.entries(this.images.clothing).forEach(([name, img]) => {
				setImageSource(img, img.defaultSrc || "")

				const texId = clothing[name]
				if(texId) {
					AssetCache.loadImage(true, texId, url => {
						setImageSource(img, url)
					})
				}
			})

			Object.entries(this.parts).forEach(([partName, part]) => {
				const changes = parts[partName]

				if(this.playerType === "R15") {
					part.rbxScaleType = changes && changes.scaleType
					part.rbxScaleMod = this.getScaleMod(part.name, part.rbxScaleType)
				}

				if(part.rbxMesh) {
					const opacity = changes && "opacity" in changes ? changes.opacity : 1
					if(part.rbxMeshOpacity !== opacity) {
						part.rbxMeshOpacity = opacity
						part.rbxMesh.material.opacity = opacity
						part.rbxMesh.material.needsUpdate = true
					}

					const meshId = changes && changes.meshId || part.rbxDefaultMesh
					if(part.rbxMeshId !== meshId) {
						part.rbxMeshId = meshId
						clearGeometry(part.rbxMesh)
						AssetCache.loadMesh(true, meshId, mesh => part.rbxMeshId === meshId && applyMesh(part.rbxMesh, mesh))
					}

					const baseImg = this.images.base[partName]
					const baseTexId = changes && changes.baseTexId || ""
					if(baseImg && baseImg.rbxTexId !== baseTexId) {
						baseImg.rbxTexId = baseTexId

						if(baseTexId) {
							setImageSource(baseImg, graySrc)
							AssetCache.loadImage(true, baseTexId, url => baseImg.rbxTexId === baseTexId && setImageSource(baseImg, url))
						} else {
							setImageSource(baseImg, "")
						}
					}

					const overImg = this.images.over[partName]
					const overTexId = changes && changes.overTexId || ""
					if(overImg && overImg.rbxTexId !== overTexId) {
						overImg.rbxTexId = overTexId
						
						if(overTexId) {
							setImageSource(overImg, graySrc)
							AssetCache.loadImage(true, overTexId, url => overImg.rbxTexId === overTexId && setImageSource(overImg, url))
						} else {
							setImageSource(overImg, "")
						}
					}
				}
			})
			
			const updateSizes = () => {
				Object.entries(this.parts).forEach(([partName, part]) => {
					const changes = parts[partName]
					const scale = changes && changes.scale ? [...changes.scale] : [1, 1, 1]
					const size = changes && changes.size || part.rbxOrigSize

					if(this.playerType === "R15") {
						scale[0] *= part.rbxScaleMod.x
						scale[1] *= part.rbxScaleMod.y
						scale[2] *= part.rbxScaleMod.z
					}
	
					part.rbxSize = scale.map((x, i) => x * size[i])

					if(part.rbxMesh) {
						part.rbxMesh.scale.set(...scale)
					}
				})
				
				Object.entries(this.joints).forEach(([jointName, joint]) => {
					const changes = joints[jointName]
					const C0 = changes && changes[joint.part0.name] || joint.origC0
					const C1 = changes && changes[joint.part1.name] || joint.origC1
	
					joint.c0.position.setFromMatrixPosition(C0).multiply(joint.part0.rbxScaleMod)
					joint.c0.rotation.setFromRotationMatrix(C0)
	
					joint.c1.position.setFromMatrixPosition(C1).multiply(joint.part1.rbxScaleMod)
					joint.c1.rotation.setFromRotationMatrix(C1)
				})
			}

			updateSizes()

			// Attachments must be updated before leg stretching
			Object.entries(this.attachments).forEach(([attName, att]) => {
				const cframe = attachments[attName] || att.cframe

				att.obj.position.setFromMatrixPosition(cframe).multiply(att.parent.rbxScaleMod)
				att.obj.rotation.setFromRotationMatrix(cframe)
			})

			// HipHeight and leg stretching
			if(this.playerType === "R15") {
				const calcRootY = (off, name) => {
					const joint = this.joints[name]
					return off - joint.c1.position.y - joint.c0.position.y
				}

				let leftHeight = ["Root", "LeftHip", "LeftKnee", "LeftAnkle"].reduce(calcRootY, 0) + this.parts.LeftFoot.rbxSize[1] / 2
				let rightHeight = ["Root", "RightHip", "RightKnee", "RightAnkle"].reduce(calcRootY, 0) + this.parts.LeftFoot.rbxSize[1] / 2

				// Stretch legs to same level

				const leftLegHeight = leftHeight - calcRootY(0, "Root") + this.joints.LeftHip.c0.position.y
				const rightLegHeight = rightHeight - calcRootY(0, "Root") + this.joints.RightHip.c0.position.y

				if(leftLegHeight >= 0.1 && rightLegHeight >= 0.1) {
					const scale = rightLegHeight / leftLegHeight

					if(scale > 1) {
						this.parts.LeftUpperLeg.rbxScaleMod.multiplyScalar(scale)
						this.parts.LeftLowerLeg.rbxScaleMod.multiplyScalar(scale)
						this.parts.LeftFoot.rbxScaleMod.multiplyScalar(scale)
						leftHeight = rightHeight
					} else {
						this.parts.RightUpperLeg.rbxScaleMod.divideScalar(scale)
						this.parts.RightLowerLeg.rbxScaleMod.divideScalar(scale)
						this.parts.RightFoot.rbxScaleMod.divideScalar(scale)
						rightHeight = leftHeight
					}

					updateSizes()
				}

				// Calculate hip height

				const rootHeight = this.parts.HumanoidRootPart.rbxSize[1] / 2
				const [min, max] = [leftHeight - rootHeight, rightHeight - rootHeight].sort((a, b) => a - b)

				const hipHeight = min / max >= 0.95 ? min : max

				this.root.position.y = hipHeight + rootHeight
				this.animator.setRootScale(hipHeight / 1.35)
			}

			// Remove old accessories
			for(let i = this.accessories.length; i--;) {
				const acc = this.accessories.pop()
				if(!accessories.includes(acc)) {
					acc.obj.parent.remove(acc.obj)
					acc.att = null
				}
			}

			// Update accessories
			accessories.forEach(acc => {
				if(!acc.obj) {
					const img = createImage()
					setImageSource(img, graySrc)

					const tex = mergeTexture(256, 256, img)
					tex.needsUpdate = true

					const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true })
					const obj = acc.obj = new THREE.Mesh(undefined, mat)
					obj.visible = false
					obj.castShadow = true

					if(acc.meshId) {
						AssetCache.loadMesh(true, acc.meshId, mesh => applyMesh(obj, mesh))
					}

					if(acc.texId) {
						AssetCache.loadImage(true, acc.texId, url => {
							setImageSource(img, url)
							tex.needsUpdate = true
						})
					}
				}

				// Update color
				if(acc.color) { acc.obj.material.color.setRGB(acc.color[0], acc.color[1], acc.color[2]) }
				if("opacity" in acc) { acc.obj.material.opacity = acc.opacity }


				// Attach to correct attachment
				const att = this.attachments[acc.attName] || this.defaultHatAttachment
				if(acc.att !== att) {
					acc.att = att
					att.obj.add(acc.obj)
				}
				
				// Scale and Position
				const parent = att ? att.parent : this.parts.Head
				const scale = parent ? this.getScaleMod(parent.name, acc.scaleType, parent.rbxScaleType) : new Vector3(1, 1, 1)
				acc.obj.scale.set(...acc.scale).multiply(scale)

				// Roblox Weirdness: Attachmentless accessories (defaultHatAttachment) do not get position-scaled
				if(att) {
					acc.obj.position.setFromMatrixPosition(acc.attCFrame).multiply(scale)
					acc.obj.rotation.setFromRotationMatrix(acc.attCFrame)
				} else {
					acc.obj.position.setFromMatrixPosition(acc.cframe)
					acc.obj.rotation.setFromRotationMatrix(acc.cframe)
				}

				// Roblox Weirdness: Mesh.Offset doesn't get position-scaled
				if(acc.offset) {
					acc.obj.position.add(new Vector3(...acc.offset).applyQuaternion(acc.obj.quaternion))
				}

				acc.obj.matrixWorldNeedsUpdate = true

				this.accessories.push(acc)
			})
		}
	}

	return {
		Avatar,

		R6BodyPartNames,
		R15BodyPartNames,

		CFrame,
		InvertCFrame,
		applyMesh
	}
})()

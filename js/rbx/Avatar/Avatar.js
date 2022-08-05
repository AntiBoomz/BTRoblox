"use strict"

const RBXAvatar = (() => {
	const Vector3 = THREE.Vector3
	
	function applyMesh(obj, mesh) {
		const geom = obj.geometry

		geom.setAttribute("position", new THREE.BufferAttribute(mesh.vertices, 3))
		geom.setAttribute("normal", new THREE.BufferAttribute(mesh.normals, 3))
		geom.setAttribute("uv", new THREE.BufferAttribute(mesh.uvs, 2))
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

		geom.deleteAttribute("position")
		geom.deleteAttribute("normal")
		geom.deleteAttribute("uv")
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
	
	const scalePosition = (matrix, scale) => {
		const elements = matrix.elements
		elements[12] *= scale.x
		elements[13] *= scale.y
		elements[14] *= scale.z
		return matrix
	}
	
	function solidColorDataURL(r, g, b) {
		return `data:image/gif;base64,R0lGODlhAQABAPAA${btoa(String.fromCharCode(0, r, g, b, 255, 255))}/yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==`
	}

	function createImage(src) {
		const img = new Image()
		img.src = src
		img.crossOrigin = "anonymous"
		img.updateListeners = []

		return img
	}
	
	function createSourceFunction(fn, filter) {
		return {
			fn: fn,
			filter: filter,
			onUpdateListeners: [],

			update() {
				this.onUpdateListeners.forEach(fn => fn())
			},

			onUpdate(fn) {
				this.onUpdateListeners.push(fn)
			}
		}
	}

	function createSource(image) {
		return {
			image: image || emptyImage,
			onUpdateListeners: [],

			setImage(img) {
				if(!img) { return }
				this.image = img
				this.onUpdateListeners.forEach(fn => fn())
			},

			onUpdate(fn) {
				this.onUpdateListeners.push(fn)
			}
		}
	}

	const emptyImage = createImage("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=")
	const grayImage = createImage(solidColorDataURL(163, 162, 165))
	const whiteImage = createImage(solidColorDataURL(255, 255, 255))

	const R6BodyPartNames = ["Torso", "Left Arm", "Right Arm", "Left Leg", "Right Leg"]
	const R15BodyPartNames = [
		"LeftFoot", "LeftHand", "LeftLowerArm", "LeftLowerLeg", "LeftUpperArm", "LeftUpperLeg", "LowerTorso",
		"RightFoot", "RightHand", "RightLowerArm", "RightLowerLeg", "RightUpperArm", "RightUpperLeg", "UpperTorso"
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

	const texturesToMerge = new Set()
	
	function mergeTexture(width, height, ...sources) {
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
		let needsUpdate = false

		function updateFinal() {
			needsUpdate = false
			texturesToMerge.delete(updateFinal)

			const isDirty = stack.some(entry => entry.dirty)
			if(!isDirty) { return }
			
			for(const entry of stack) {
				entry.dirty = false
				
				if(entry.source.fn) {
					entry.source.fn(ctx)
				} else {
					const img = entry.source.canvas || entry.source.image

					entry._lastImage = img

					if(img !== emptyImage) {
						ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, width, height)
					}
				}
			}

			texture.needsUpdate = true
		}

		const requestUpdateFinal = () => {
			if(needsUpdate) { return }
			needsUpdate = true
			
			texturesToMerge.add(updateFinal)

			$.setImmediate(() => {
				if(!needsUpdate) { return }
				needsUpdate = false
				updateFinal()
			})
		}
		
		const background = createSourceFunction(ctx => {
			if(texture.background) {
				ctx.fillStyle = texture.background
				ctx.fillRect(0, 0, width, height)
			} else {
				ctx.clearRect(0, 0, width, height)
			}
		})
		
		sources.unshift(background)
		
		texture.setBackground = color => {
			texture.background = color || null
			background.update()
		}
		
		for(const source of sources) {
			const entry = { source, dirty: true }
			stack.push(entry)

			source.onUpdate(() => {
				if(source.canvas || source.fn) {
					entry.dirty = source.filter ? source.filter(source) : true
				} else {
					entry.dirty = source.image !== entry._lastImage
				}

				requestUpdateFinal()
			})
		}

		requestUpdateFinal()
		
		return texture
	}
	
	const tempMatrix = new THREE.Matrix4()
	const oneVector = new THREE.Vector3(1, 1, 1)

	class Avatar {
		constructor() {
			this.root = new THREE.Group()
			this.animator = new RBXAnimator()
			this.appearance = new RBXAppearance()

			this.baseLoadedPromise = new SyncPromise()
			
			this.jointsArray = []
			this.accessories = []
			this.attachments = {}
			this.joints = {}
			this.parts = {}

			this.playerType = null
			
			this.hipOffset = new THREE.Vector3()
			this.offset = new THREE.Vector3()
			this.offsetRot = new THREE.Euler()

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

			const sources = this.sources = {
				pants: createSource(),
				shirt: createSource(),
				tshirt: createSource(),
				face: createSource(),
				
				bodyColorsR6: createSourceFunction(ctx => {
					if(!this.bodyColors) { return }
					
					ctx.fillStyle = this.bodyColors.torso
					ctx.fillRect(0, 0, 192, 448)
					ctx.fillRect(194, 322, 272, 76)
					ctx.fillRect(272, 401, 148, 104)
			
					ctx.fillStyle = this.bodyColors.rightarm
					ctx.fillRect(200, 0, 192, 320)
					ctx.fillRect(420, 400, 148, 104)
					ctx.fillRect(758, 322, 76, 76)
					ctx.fillRect(898, 322, 76, 76)
			
					ctx.fillStyle = this.bodyColors.leftarm
					ctx.fillRect(400, 0, 192, 320)
					ctx.fillRect(568, 400, 148, 104)
					ctx.fillRect(828, 322, 76, 76)
					ctx.fillRect(194, 394, 76, 76)
			
					ctx.fillStyle = this.bodyColors.rightleg
					ctx.fillRect(600, 0, 192, 320)
					ctx.fillRect(716, 400, 148, 104)
					ctx.fillRect(466, 322, 76, 76)
					ctx.fillRect(610, 322, 76, 76)
			
					ctx.fillStyle = this.bodyColors.leftleg
					ctx.fillRect(800, 0, 192, 320)
					ctx.fillRect(864, 400, 148, 104)
					ctx.fillRect(542, 322, 76, 76)
					ctx.fillRect(684, 322, 76, 76)
				}),

				base: {},
				over: {}
			}
			
			sources.face.defaultImage = getURL("res/previewer/face.png")

			for(const partName of ["Head", ...R6BodyPartNames, ...R15BodyPartNames]) {
				sources.base[partName] = createSource()
				sources.over[partName] = createSource()
			}
			
			const composites = this.composites = {
				r6: new RBXComposites.R6Composite(sources),
				torso: new RBXComposites.R15TorsoComposite(sources),
				leftarm: new RBXComposites.R15LeftArmComposite(sources),
				leftleg: new RBXComposites.R15LeftLegComposite(sources),
				rightarm: new RBXComposites.R15RightArmComposite(sources),
				rightleg: new RBXComposites.R15RightLegComposite(sources)
			}
			
			const textures = this.textures = {
				Head: mergeTexture(256, 256, sources.base.Head, sources.face, sources.over.Head)
			}
			
			for(const name of R6BodyPartNames) {
				textures[name] = mergeTexture(1024, 512, sources.bodyColorsR6, sources.base[name], composites.r6, sources.over[name])
			}
			
			for(const name of R15BodyPartNames) {
				const limb = name.toLowerCase().replace(/upper|lower/g, "").replace(/hand/g, "arm").replace(/foot/g, "leg")
				const composite = composites[limb]
				
				textures[name] = mergeTexture(composite.canvas.width, composite.canvas.height, sources.base[name], composite, sources.over[name])
			}
			
			//

			const loaders = []

			loaders.push(
				RBXAvatarRigs.load().then(() => {
					this.shouldRefreshRig = true
				})
			)

			Object.values(this.composites).forEach(comp => {
				loaders.push(...comp.loaders)
			})
			
			if(this.bodyColors) {
				this.setBodyColors(this.bodyColors)
			}
			
			SyncPromise.all(loaders).then(() => this.baseLoadedPromise.resolve())
		}

		waitForAppearance() {
			const loaders = [this.baseLoadedPromise]
			
			this.appearance.assets.forEach(asset => {
				loaders.push(asset.loadPromise)
			})

			return SyncPromise.all(loaders).then(() => {
				this.update()
			})
		}

		update() {
			if(this.shouldRefreshRig) {
				this._refreshRig()
			}

			if(this.shouldRefreshBodyParts) {
				this._refreshBodyParts()
			}
			
			this.animator.update()
			
			//
			
			this.root.position.copy(this.hipOffset).add(this.offset)
			this.root.rotation.copy(this.offsetRot)
			
			for(const joint of this.jointsArray) {
				tempMatrix.compose(joint.position, joint.quaternion, oneVector)
				joint.part1.matrixNoScale.multiplyMatrices(joint.part0.matrixNoScale, joint.bakedC0).multiply(tempMatrix).multiply(joint.bakedC1)
				joint.part1.matrix.copy(joint.part1.matrixNoScale).scale(joint.part1.scale)
				joint.part1.matrixWorldNeedsUpdate = true
			}
			
			for(const acc of this.accessories) {
				if(acc.parent) {
					acc.obj.matrix.multiplyMatrices(acc.parent.matrixNoScale, acc.bakedCFrame)
					acc.obj.matrixWorldNeedsUpdate = true
				}
			}

			// Update composites

			const activeComposites = this.playerType === "R6"
				? [this.composites.r6]
				: [this.composites.torso, this.composites.leftarm, this.composites.rightarm, this.composites.leftleg, this.composites.rightleg]

			for(const comp of activeComposites) {
				if(comp.needsUpdate) {
					comp.update()
				}
			}
			
			
			while(texturesToMerge.size > 0) {
				texturesToMerge.forEach(fn => fn())
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

		setBodyColors(bodyColors) {
			this.bodyColors = bodyColors
			if(!this.hasInit) { return }
			
			this.sources.bodyColorsR6.update()
			
			for(const name of ["Head", ...R15BodyPartNames]) {
				const limb = name.toLowerCase().replace(/upper|lower/g, "").replace(/hand/g, "arm").replace(/foot/g, "leg")
				this.textures[name].setBackground(this.bodyColors?.[limb])
			}
		}

		setPlayerType(playerType) {
			if(this.playerType === playerType) { return }
			this.playerType = playerType
			this.shouldRefreshRig = true
		}

		getScaleMod(partName, scaleType, partScaleType) { // Only use partScaleType with accessories! C:
			if(this.playerType !== "R15") { return new Vector3(1, 1, 1) }

			const result = new Vector3()

			if(partName === "Head") {
				result.setScalar(this.scales.head)
			} else {
				result.set(this.scales.width, this.scales.height, this.scales.depth)
			}

			const defaultMod = ScaleMods.Default[partName]

			if(!defaultMod) {
				return result
			}

			const rthroMod = ScaleMods.Rthro[partName]
			const propMod = ScaleMods.Proportion[partName]

			const startScale = new Vector3()
			const endScale = new Vector3()

			if(scaleType === "ProportionsNormal") {
				startScale.copy(rthroMod)

				if(partScaleType && partScaleType !== "ProportionsNormal" && partScaleType !== "ProportionsSlender") {
					endScale.multiply(rthroMod).multiply(defaultMod).multiply(
						new Vector3(1, 1, 1).lerp(
							new Vector3(1, 1, 1).divide(propMod),
							this.scales.proportion
						)
					)
				} else {
					endScale.set(1, 1, 1).lerp(
						new Vector3(1, 1, 1).divide(propMod),
						this.scales.proportion
					)
				}
			} else if(scaleType === "ProportionsSlender") {
				startScale.copy(rthroMod).multiply(propMod)

				if(partScaleType && partScaleType !== "ProportionsNormal" && partScaleType !== "ProportionsSlender") {
					endScale.copy(rthroMod).multiply(defaultMod).multiply(propMod).multiply(
						new Vector3(1, 1, 1).lerp(
							new Vector3(1, 1, 1).divide(propMod),
							this.scales.proportion
						)
					)
				} else {
					endScale.copy(propMod).lerp(
						new Vector3(1, 1, 1),
						this.scales.proportion
					)
				}
			} else {
				startScale.set(1, 1, 1)

				if(partScaleType && (partScaleType === "ProportionsNormal" || partScaleType === "ProportionsSlender")) {
					endScale.set(1, 1, 1).divide(rthroMod).multiply(
						new Vector3(1, 1, 1).lerp(
							new Vector3(1, 1, 1).divide(propMod),
							this.scales.proportion
						)
					)
				} else {
					endScale.copy(defaultMod).multiply(
						new Vector3(1, 1, 1).lerp(
							new Vector3(1, 1, 1).divide(propMod),
							this.scales.proportion
						)
					)
				}
			}

			result.multiply(
				startScale.lerp(endScale, this.scales.bodyType)
			)

			return result
		}

		_refreshRig() {
			if(!RBXAvatarRigs.loaded) { return }
			this.shouldRefreshRig = false
			
			//
			
			const recDispose = tar => {
				if(tar.isMesh) {
					if(tar.geometry) { tar.geometry.dispose() }
					if(tar.material) { tar.material.dispose() }
				}

				tar.children.forEach(recDispose)
			}
			
			for(let i = this.root.children.length; i--;) {
				const child = this.root.children[i]
				recDispose(child)
				this.root.remove(child)
			}
			
			//
			
			this.jointsArray = []
			
			const attachments = this.attachments = {}
			const joints = this.joints = {}
			const parts = this.parts = {}
			const animJoints = {}

			const CreateModel = tree => {
				let obj
				
				if(tree.name !== "HumanoidRootPart") {
					const mat = new THREE.MeshStandardMaterial({ map: this.textures[tree.name], transparent: false })
					obj = new THREE.Mesh(undefined, mat)
					obj.frustumCulled = false
					obj.castShadow = true
					
					obj.rbxDefaultBodypart = {
						meshId: tree.meshid
					}
					
					obj.rbxMesh = obj
				} else {
					obj = new THREE.Group()
				}
				
				obj.matrixAutoUpdate = false
				obj.name = tree.name
				
				// Custom stuff
				obj.rbxOrigSize = tree.origSize
				obj.rbxScaleMod = new Vector3(1, 1, 1)
				obj.rbxScaleModPure = new Vector3(1, 1, 1)
				obj.matrixNoScale = new THREE.Matrix4()
				//
				
				this.root.add(obj)
				parts[tree.name] = obj

				Object.entries(tree.attachments).forEach(([name, cframe]) => {
					attachments[name] = {
						origCFrame: cframe.clone(),
						bakedCFrame: cframe,
						parent: obj
					}
				})

				tree.children.forEach(child => {
					const childObj = CreateModel(child)

					const joint = joints[child.JointName] = animJoints[child.name] = {
						position: new THREE.Vector3(),
						quaternion: new THREE.Quaternion(),
						
						origC0: child.C0,
						origC1: child.C1,
						bakedC0: child.C0.clone(),
						bakedC1: child.C1.clone(),
						
						part0: obj,
						part1: childObj
					}
					
					this.jointsArray.push(joint)
				})

				return obj
			}

			if(this.playerType === "R6") {
				CreateModel(RBXAvatarRigs.R6Tree)
				this.hipOffset.set(0, 3, 0)
			} else if(this.playerType === "R15") {
				CreateModel(RBXAvatarRigs.R15Tree)
				this.hipOffset.set(0, 2.35, 0)
			}
			
			this.jointsArray.reverse()
			
			this.animator.setJoints(animJoints)
			this._refreshBodyParts()
		}

		_refreshBodyParts() {
			if(!RBXAvatarRigs.loaded) { return }
			this.shouldRefreshBodyParts = false

			const assets = []

			this.appearance.assets.forEach(asset => {
				if(!asset.loaded) {
					asset.load()
					if(!asset.loaded) { return }
				}

				if(!asset.enabled) { return }

				asset.lastIndex = assets.length
				assets.push(asset)
			})

			assets.sort((a, b) => (a.priority === b.priority ? a.lastIndex - b.lastIndex : a.priority - b.priority))

			const attachmentOverride = {}
			const jointOverride = {}
			const accessories = []
			const bodyparts = {}
			const clothing = {}
			
			for(const asset of assets) {
				for(const bodypart of asset.bodyparts) {
					bodypart.obj = null
					
					if(!bodypart.playerType || bodypart.playerType === this.playerType) {
						bodyparts[bodypart.target] = bodypart
					}
				}
				
				for(const att of asset.attachments) {
					const realAtt = this.attachments[att.target]
					
					if(realAtt && att.part === realAtt.parent.name) {
						attachmentOverride[att.target] = att.cframe
					}
				}
				
				for(const cloth of asset.clothing) {
					clothing[cloth.target] = cloth.texId
				}
				
				accessories.push(...asset.accessories)

				if(this.playerType === "R15") {
					for(const joint of asset.joints) {
						const realJoint = this.joints[joint.target]
						if(!realJoint) { continue }
						
						const data = jointOverride[joint.target] || (jointOverride[joint.target] = {})
						
						if(joint.part === realJoint.part0.name) {
							data.c0 = joint.cframe
						} else if(joint.part === realJoint.part1.name) {
							data.c1 = joint.cframe
						}
					}
				}
			}
			
			for(const name of ["shirt", "pants", "tshirt", "face"]) {
				const source = this.sources[name]
				let texId = clothing[name] || source.defaultImage || ""

				if(name === "face" && bodyparts.Head && bodyparts.Head.disableFace) {
					texId = ""
				}
				
				if(source.rbxTexId !== texId) {
					source.rbxTexId = texId
					source.setImage(emptyImage)
					
					if(texId) {
						AssetCache.loadImage(true, texId, img => {
							if(source.rbxTexId === texId) {
								source.setImage(img)
							}
						})
					}
				}
			}
			
			for(const [partName, part] of Object.entries(this.parts)) {
				const bodypart = bodyparts[partName] || part.rbxDefaultBodypart

				if(this.playerType === "R15") {
					part.rbxScaleType = bodypart?.scaleType
					part.rbxScaleMod = this.getScaleMod(part.name, part.rbxScaleType)
				}
				
				if(!bodypart) {
					continue
				}
				
				// Mark bodypart as active
				bodypart.obj = part.rbxMesh
					
				// Update material
				const material = part.rbxMesh.material
				
				if(bodypart.pbrEnabled) {
					const maps = [
						["normalMap", bodypart.normalMapId],
						["roughnessMap", bodypart.roughnessMapId],
						["metalnessMap", bodypart.metalnessMapId],
					]
					
					for(const [key, id] of maps) {
						let map = material[key]
						
						if(id) {
							if(!map) {
								map = material[key] = new THREE.Texture(whiteImage)
							}
							
							AssetCache.loadImage(true, id, img => {
								map.image = img
								map.needsUpdate = true
							})
						}
					}
				} else {
					material.normalMap = null
					material.roughnessMap = null
					material.metalnessMap = null
				}
				
				// Update opacity
				const opacity = bodypart.opacity ?? 1
				
				if(material.opacity !== opacity) {
					material.opacity = opacity
					material.transparent = opacity < 1
					material.needsUpdate = true
				}
				
				// Update mesh
				const meshId = bodypart.meshId
				
				if(part.rbxMeshId !== meshId) {
					part.rbxMeshId = meshId
					clearGeometry(part.rbxMesh)
					AssetCache.loadMesh(true, meshId, mesh => part.rbxMeshId === meshId && applyMesh(part.rbxMesh, mesh))
				}
				
				// Update textures
				const baseSource = this.sources.base[partName]
				const baseTexId = bodypart.baseTexId || ""
				
				if(baseSource.rbxTexId !== baseTexId) {
					baseSource.rbxTexId = baseTexId
					baseSource.setImage(emptyImage)
					
					if(baseTexId) {
						AssetCache.loadImage(true, baseTexId, img => {
							if(baseSource.rbxTexId === baseTexId) {
								baseSource.setImage(img)
							}
						})
					}
				}

				const overSource = this.sources.over[partName]
				const overTexId = bodypart.overTexId || ""
				
				if(overSource.rbxTexId !== overTexId) {
					overSource.rbxTexId = overTexId
					overSource.setImage(emptyImage)
					
					if(overTexId) {
						AssetCache.loadImage(true, overTexId, img => {
							if(overSource.rbxTexId === overTexId) {
								overSource.setImage(img)
							}
						})
					}
				}
			}
			
			//
			
			const updateSizes = () => {
				Object.entries(this.parts).forEach(([partName, part]) => {
					const bodypart = bodyparts[partName] || part.rbxDefaultBodypart
					
					const size = bodypart?.size || part.rbxOrigSize
					let scale = bodypart?.scale || [1, 1, 1]

					if(this.playerType === "R15") {
						scale = [
							scale[0] * part.rbxScaleMod.x,
							scale[1] * part.rbxScaleMod.y,
							scale[2] * part.rbxScaleMod.z
						]
					}
	
					part.rbxSize = scale.map((x, i) => x * size[i])
					
					if(part.rbxMesh) {
						part.rbxMesh.scale.set(...scale)
					}
				})
				
				Object.entries(this.joints).forEach(([jointName, joint]) => {
					if(jointName !== "Root") {
						const override = jointOverride[jointName]
						const C0 = override?.c0 || joint.origC0
						const C1 = override?.c1 || joint.origC1
	
						const scale0 = joint.part0.rbxScaleMod
						const scale1 = joint.part1.rbxScaleMod
						
						scalePosition(joint.bakedC0.copy(C0), scale0)
						scalePosition(joint.bakedC1.getInverse(C1), scale1)
					}
				})
				
				if(this.playerType === "R15") {
					const rootJoint = this.joints.Root
					const rightHip = this.joints.RightHip
					const leftHip = this.joints.LeftHip
					
					const rootHeight = rootJoint.part0.rbxSize[1]
					const lowerTorsoHeight = rootJoint.part1.rbxSize[1]
					const minHipOffset = Math.min(rightHip.bakedC0.elements[13], leftHip.bakedC0.elements[13])
					
					rootJoint.bakedC0.makeTranslation(0, -rootHeight / 2 - lowerTorsoHeight / 2 - minHipOffset, 0)
					rootJoint.bakedC1.makeTranslation(0, lowerTorsoHeight / 2, 0)
				}
			}

			updateSizes()

			// HipHeight and leg stretching
			if(this.playerType === "R15") {
				const calcHeight = name => {
					const joint = this.joints[name]
					return -joint.bakedC1.elements[13] - joint.bakedC0.elements[13]
				}

				// Stretch legs to same level
				let leftLegHeight = -this.joints.LeftHip.bakedC1.elements[13] + calcHeight("LeftKnee") + calcHeight("LeftAnkle") + this.parts.LeftFoot.rbxSize[1] / 2
				let rightLegHeight = -this.joints.RightHip.bakedC1.elements[13] + calcHeight("RightKnee") + calcHeight("RightAnkle") + this.parts.RightFoot.rbxSize[1] / 2

				if(leftLegHeight >= 0.1 && rightLegHeight >= 0.1) {
					const scale = new Vector3(1, rightLegHeight / leftLegHeight, 1)

					if(scale > 1) {
						this.parts.LeftUpperLeg.rbxScaleMod.multiply(scale)
						this.parts.LeftLowerLeg.rbxScaleMod.multiply(scale)
						this.parts.LeftFoot.rbxScaleMod.multiply(scale)
						leftLegHeight = rightLegHeight
					} else {
						this.parts.RightUpperLeg.rbxScaleMod.divide(scale)
						this.parts.RightLowerLeg.rbxScaleMod.divide(scale)
						this.parts.RightFoot.rbxScaleMod.divide(scale)
						rightLegHeight = leftLegHeight
					}

					updateSizes()
				}

				// Calculate hip height
				const rootHeight = this.parts.HumanoidRootPart.rbxSize[1]
				
				let min = leftLegHeight
				let max = rightLegHeight
				if(max < min) { [max, min] = [min, max] }

				const hipHeight = min >= max * 0.95 ? min : max

				this.hipOffset.setY(hipHeight + rootHeight / 2)
				this.animator.setRootScale(hipHeight / 2)
			}
			
			// Update attachments
			Object.entries(this.attachments).forEach(([attName, att]) => {
				const origCFrame = attachmentOverride[attName] || att.origCFrame
				scalePosition(att.bakedCFrame.copy(origCFrame), att.parent.rbxScaleMod)
			})

			// Remove old accessories
			for(let i = this.accessories.length; i--;) {
				const acc = this.accessories.pop()
				
				if(!accessories.includes(acc)) {
					if(acc.obj && acc.obj.parent) {
						acc.obj.parent.remove(acc.obj)
					}
					
					acc.att = null
				}
			}

			// Update accessories
			for(const acc of accessories) {
				if(!acc.obj) {
					const color = new THREE.Color(1, 1, 1)
					const opacity = acc.opacity ?? 1
					
					const source = createSource(emptyImage)
					const texture = mergeTexture(256, 256, source)
					
					let metalnessTexture
					let roughnessTexture
					let normalTexture
					
					if(acc.pbrAlphaMode === 1) {
						source.setImage(whiteImage)
					} else {
						const background = new THREE.Color(...acc.baseColor)
						
						if(!acc.pbrEnabled && acc.texId) {
							background.setRGB(1, 1, 1)
						}
						
						texture.setBackground("#" + background.getHexString())
					}
					
					if(acc.vertexColor) {
						color.setRGB(...acc.vertexColor)
					}
					
					if(acc.texId) {
						AssetCache.loadImage(true, acc.texId, img => {
							source.setImage(img)
						})
					}
					
					if(acc.normalMapId) {
						normalTexture = new THREE.Texture(whiteImage)
						
						AssetCache.loadImage(true, acc.normalMapId, img => {
							normalTexture.image = img
							normalTexture.needsUpdate = true
						})
					}
					
					if(acc.metalnessMapId) {
						metalnessTexture = new THREE.Texture(whiteImage)
						
						AssetCache.loadImage(true, acc.metalnessMapId, img => {
							metalnessTexture.image = img
							metalnessTexture.needsUpdate = true
						})
					}
					
					if(acc.roughnessMapId) {
						roughnessTexture = new THREE.Texture(whiteImage)
						
						AssetCache.loadImage(true, acc.roughnessMapId, img => {
							roughnessTexture.image = img
							roughnessTexture.needsUpdate = true
						})
					}
					
					const material = new THREE.MeshStandardMaterial({
						map: texture,
						normalMap: normalTexture,
						metalnessMap: metalnessTexture,
						roughnessMap: roughnessTexture,
						transparent: opacity < 1 || acc.pbrAlphaMode === 1,
						opacity: opacity
					})
					
					const obj = acc.obj = new THREE.Mesh(undefined, material)
					obj.matrixAutoUpdate = false
					obj.frustumCulled = false
					obj.visible = false
					obj.castShadow = true
					
					if(acc.meshId) {
						AssetCache.loadMesh(true, acc.meshId, mesh => applyMesh(obj, mesh))
					}
					
					acc.bakedCFrame = new THREE.Matrix4()
				}

				// Attach to correct attachment
				
				const attachment = this.attachments[acc.attName]
				const parent = attachment ? attachment.parent : this.parts.Head
				
				if(parent) {
					// Scale
					
					const scaleMod = this.getScaleMod(parent.name, acc.scaleType, parent.rbxScaleType)
					acc.obj.scale.set(...(acc.scale || [1, 1, 1])).multiply(scaleMod)
					
					// Position
					
					if(attachment) {
						acc.bakedCFrame.copy(attachment.bakedCFrame).multiply(
							scalePosition(tempMatrix.copy(acc.attCFrame), scaleMod)
						)
					} else {
						// Legacy hats, position is not scaled
						acc.bakedCFrame.makeTranslation(0, 0.5, 0)
						
						if(acc.legacyHatCFrame) {
							acc.bakedCFrame.multiply(acc.legacyHatCFrame)
						}
					}
					
					// Mesh offset (not scaled)
					
					if(acc.offset) {
						acc.bakedCFrame.multiply(tempMatrix.makeTranslation(...acc.offset))
					}
					
					// Apply scale to bakedCFrame
					
					acc.bakedCFrame.scale(acc.obj.scale)
					
					//
					
					acc.parent = parent
					
					if(!acc.obj.parent) {
						this.root.add(acc.obj)
					}
					
					this.accessories.push(acc)
				} else {
					acc.parent = null
					
					if(acc.obj.parent) {
						acc.obj.parent.remove(acc.obj)
					}
				}
			}
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

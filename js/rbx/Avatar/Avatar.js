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

	function CFrameToMatrix4(x, y, z, r00, r01, r02, r10, r11, r12, r20, r21, r22) {
		return new THREE.Matrix4().fromArray([
			r00, r01, r02, 0,
			r10, r11, r12, 0,
			r20, r21, r22, 0,
			x, y, z, 1
		])
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
	
	function createTexture(img) {
		const texture = new THREE.Texture(img)
		texture.minFilter = THREE.LinearFilter
		texture.wrapS = THREE.RepeatWrapping
		texture.wrapT = THREE.RepeatWrapping
		texture.needsUpdate = true
		
		return texture
	}
	
	class MergeSource {
		static fromRGB(r, g, b) {
			return (new MergeSource()).setRGB(r, g, b)
		}
		
		static fromHex(hex) {
			return (new MergeSource()).setHex(hex)
		}
		
		constructor(value) {
			this._value = value || null
			this.listeners = []
		}
		
		getImage() {
			if(this._value instanceof Image) {
				return this._value
			} else if(typeof this._value === "string") {
				const rgb = parseInt(this._value.slice(1), 16)
				return createImage(solidColorDataURL(rgb >> 16 & 255, rgb >> 8 & 255, rgb & 255))
			}
			
			return emptyImage
		}
		
		drawImage(ctx, canvas) {
			if(this._value instanceof Image) {
				ctx.drawImage(this._value, 0, 0, this._value.width, this._value.height, 0, 0, canvas.width, canvas.height)
				
			} else if(typeof this._value === "function") {
				this._value(ctx, canvas)
				
			} else if(typeof this._value === "string") {
				ctx.fillStyle = this._value
				ctx.fillRect(0, 0, canvas.width, canvas.height)
			}
		}
		
		getValue() {
			return this._value
		}
		
		setValue(value) {
			if(this._value !== (value || null)) {
				this._value = value || null
				this.update()
			}
			
			return this
		}
		
		setHex(hex) { return this.setValue(hex[0] !== "#" ? "#" + hex : hex) }
		setRGB(r, g, b) { return this.setValue("#" + (new THREE.Color(r, g, b)).getHex()) }
		setImage(img) { return this.setValue(img) }
		
		toTexture() {
			return createTexture(this.getImage())
		}
		
		update() {
			for(const listener of this.listeners) {
				listener(this)
			}
		}
		
		onUpdate(listener) {
			this.listeners.push(listener)
		}
		
		removeOnUpdate(listener) {
			const index = this.listeners.indexOf(listener)
			
			if(index !== -1) {
				this.listeners.splice(index, 1)
			}
		}
	}
	
	class MergeTexture extends THREE.Texture {
		constructor(width, height, ...sources) {
			const canvas = document.createElement("canvas")
			canvas.width = width
			canvas.height = height
			
			super(canvas)
			
			this.minFilter = THREE.LinearFilter
			this.wrapS = THREE.RepeatWrapping
			this.wrapT = THREE.RepeatWrapping
			
			this.canvas = canvas
			this.context = canvas.getContext("2d")
			this.stack = []
			
			this.sourceListener = source => {
				for(const entry of this.stack) {
					if(entry.source === source) {
						entry.dirty = true
						this.requestUpdate()
					}
				}
			}
			
			for(let source of sources) {
				if(source instanceof Image) {
					source = new MergeSource(source)
				}
				
				this.stack.push({ source: source, dirty: true, enabled: true })
				source.onUpdate(this.sourceListener)
			}
			
			this.requestUpdate()
		}
		
		setSourceEnabled(index, isEnabled) {
			const entry = this.stack[index]
			
			if(entry.enabled !== isEnabled) {
				entry.enabled = isEnabled
				entry.dirty = true
				this.requestUpdate()
			}
		}
		
		requestUpdate() {
			this.btrNeedsUpdate = true
		}
		
		update() {
			this.btrNeedsUpdate = false
			
			if(!this.stack.some(x => x.dirty)) {
				return
			}
			
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
			
			for(const entry of this.stack) {
				entry.dirty = false
				
				if(entry.enabled) {
					entry.source.drawImage(this.context, this.canvas)
				}
			}
			
			this.needsUpdate = true
		}
		
		dispose() {
			for(const entry of this.stack) {
				entry.source.removeOnUpdate(this.sourceListener)
			}
			
			super.dispose()
		}
	}

	const emptyImage = createImage("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=")

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
	
	const tempMatrix = new THREE.Matrix4()
	const tempMatrix2 = new THREE.Matrix4()
	const tempVector = new THREE.Vector3()
	
	const oneVector = new THREE.Vector3(1, 1, 1)
	const zeroVector = new THREE.Vector3()
	const identQuat = new THREE.Quaternion()
	
	let compositeRenderer

	class Avatar {
		constructor() {
			this.root = new THREE.Group()
			this.animator = new RBXAnimator()
			this.appearance = new RBXAppearance()

			this.baseLoadedPromise = new SyncPromise()
			
			this.activeMaterials = []
			this.sortedJointsArray = []
			this.accessories = []
			this.attachments = {}
			this.joints = {}
			this.parts = {}

			this.playerType = null
			this.animRootScale = 1
			
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
			
			this.bodyColors = {
				head: "#A3A2A5",
				torso: "#A3A2A5",
				leftarm: "#A3A2A5",
				rightarm: "#A3A2A5",
				leftleg: "#A3A2A5",
				rightleg: "#A3A2A5"
			}
			
			if(!compositeRenderer) {
				compositeRenderer = new THREE.WebGLRenderer({ alpha: true })
			}

			this.appearance.on("update", () => this.shouldRefreshBodyParts = true)
		}

		init() {
			if(this.hasInit) { throw new Error("Avatar has already been initialized") }
			this.hasInit = true

			const sources = this.sources = {
				pants: new MergeSource(),
				shirt: new MergeSource(),
				tshirt: new MergeSource(),
				face: new MergeSource(),
				
				bodyColors: {
					R6: new MergeSource(ctx => {
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
					
					head: MergeSource.fromHex("#A3A2A5"),
					torso: MergeSource.fromHex("#A3A2A5"),
					leftarm: MergeSource.fromHex("#A3A2A5"),
					leftleg: MergeSource.fromHex("#A3A2A5"),
					rightarm: MergeSource.fromHex("#A3A2A5"),
					rightleg: MergeSource.fromHex("#A3A2A5")
				},
				
				pbr: {},
				base: {}
			}
			
			const textures = this.textures = {
				pbr: {}
			}
			
			const composites = this.composites = {
				r6: new RBXComposites.R6Composite(sources),
				torso: new RBXComposites.R15TorsoComposite(sources),
				leftarm: new RBXComposites.R15LeftArmComposite(sources),
				leftleg: new RBXComposites.R15LeftLegComposite(sources),
				rightarm: new RBXComposites.R15RightArmComposite(sources),
				rightleg: new RBXComposites.R15RightLegComposite(sources)
			}
			
			sources.face.defaultImage = getURL("res/previewer/face.png")
			
			for(const name of ["Head", ...R6BodyPartNames]) {
				sources.base[name] = new MergeSource()
				sources[name] = new MergeSource()
				
				textures[name] =
					name === "Head" ? new MergeTexture(256, 256, sources.bodyColors.head, sources.base[name], sources[name], sources.face)
					: new MergeTexture(1024, 512, sources.bodyColors.R6, sources.base[name], composites.r6, sources[name])
			}

			for(const name of R15BodyPartNames) {
				const limb = name.toLowerCase().replace(/upper|lower|\s/g, "").replace(/hand/g, "arm").replace(/foot/g, "leg")
				const composite = composites[limb]
				
				sources[name] = new MergeSource()
				textures[name] = new MergeTexture(composite.canvas.width, composite.canvas.height, sources.bodyColors[limb], composite, sources[name])
			}
			
			for(const name of ["Head", ...R6BodyPartNames, ...R15BodyPartNames]) {
				const limb = name.toLowerCase().replace(/upper|lower|\s/g, "").replace(/hand/g, "arm").replace(/foot/g, "leg")
				
				sources.pbr[name] = new MergeSource()
				textures.pbr[name] = new MergeTexture(1024, 1024, sources.bodyColors[limb], sources.pbr[name])
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
			
			//
			
			this.animator.update()
			
			this.root.position.copy(this.hipOffset).add(this.offset)
			this.root.rotation.copy(this.offsetRot)
			
			for(const joint of this.sortedJointsArray) {
				const transform = this.animator.getJointTransform(joint.part1.name)
				
				let position = transform?.position || zeroVector
				let quaternion = transform?.quaternion || identQuat
				
				if(this.playerType === "R15" && joint.part1.name === "LowerTorso") {
					position = tempVector.copy(position).multiplyScalar(this.animRootScale)
				}
				
				tempMatrix.compose(position, quaternion, oneVector)
				
				joint.part1.matrixNoScale.multiplyMatrices(joint.part0.matrixNoScale, joint.bakedC0).multiply(tempMatrix).multiply(tempMatrix2.copy(joint.bakedC1).invert())
				joint.part1.rbxUnscaledMatrix.multiplyMatrices(joint.part0.rbxUnscaledMatrix, joint.C0).multiply(tempMatrix).multiply(tempMatrix2.copy(joint.C1).invert())
				
				joint.part1.matrix.copy(joint.part1.matrixNoScale).scale(tempVector.set(...joint.part1.rbxScale))
				joint.part1.matrixWorldNeedsUpdate = true
			}
			
			//
			
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
					comp.update(compositeRenderer)
				}
			}
			
			
			for(const material of this.activeMaterials) {
				if(!material) { continue }
				
				for(const key of ["map", "normalMap", "roughnessMap", "metalnessMap"]) {
					const texture = material[key]
					
					if(texture instanceof MergeTexture) {
						if(texture.btrNeedsUpdate) {
							texture.update()
						}
					}
				}
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
			for(const name of Object.keys(this.scales)) {
				if(name in scales) {
					this.scales[name] = scales[name]
				}
			}

			this.shouldRefreshBodyParts = true
		}

		setBodyColors(bodyColors) {
			this.bodyColors = bodyColors
			
			this.sources?.bodyColors.R6.update()
			
			for(const [key, value] of Object.entries(this.bodyColors)) {
				this.sources?.bodyColors[key].setHex(value)
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
				
				for(const child of tar.children) {
					recDispose(child)
				}
			}
			
			for(let i = this.root.children.length; i--;) {
				const child = this.root.children[i]
				recDispose(child)
				this.root.remove(child)
			}
			
			//
			
			this.sortedJointsArray = []
			
			const attachments = this.attachments = {}
			const joints = this.joints = {}
			const parts = this.parts = {}

			const CreateModel = tree => {
				let obj
				
				if(tree.name !== "HumanoidRootPart") {
					obj = new THREE.SkinnedMesh(undefined, new THREE.MeshStandardMaterial({ map: this.textures[tree.name], transparent: false }))
					obj.isSkinnedMesh = false
					obj.bindMode = "detached"
					obj.frustumCulled = false
					obj.castShadow = true
				} else {
					obj = new THREE.Group()
				}
				
				obj.matrixAutoUpdate = false
				obj.name = tree.name
				
				// Custom stuff
				obj.rbxDefaultBodypart = {
					meshId: tree.meshid
				}
				
				obj.rbxOrigSize = tree.origSize
				obj.rbxScaleMod = new Vector3(1, 1, 1)
				obj.matrixNoScale = new THREE.Matrix4()
				obj.rbxPoseMatrix = new THREE.Matrix4()
				obj.rbxUnscaledMatrix = new THREE.Matrix4()
				//
				
				this.root.add(obj)
				parts[tree.name] = obj
				
				for(const [name, cframe] of Object.entries(tree.attachments)) {
					attachments[name] = {
						origCFrame: cframe,
						cframe: cframe.clone(),
						bakedCFrame: cframe.clone(),
						parent: obj
					}
				}

				for(const child of tree.children) {
					const childObj = CreateModel(child)

					const joint = joints[child.JointName] = {
						origC0: child.C0,
						origC1: child.C1,
						
						C0: child.C0.clone(),
						C1: child.C1.clone(),
						
						bakedC0: child.C0.clone(),
						bakedC1: child.C1.clone(),
						
						part0: obj,
						part1: childObj,
						
						name: child.JointName
					}
					
					joint.bone = new THREE.Bone()
					joint.bone.matrix.copy(joint.origC1)
					joint.bone.matrixWorldNeedsUpdate = true
					childObj.add(joint.bone)
					// bone.matrix.copy(joint.bakedC0)
					
					this.sortedJointsArray.push(joint)
				}

				return obj
			}

			if(this.playerType === "R6") {
				CreateModel(RBXAvatarRigs.R6Tree)
				this.hipOffset.set(0, 3, 0)
			} else if(this.playerType === "R15") {
				CreateModel(RBXAvatarRigs.R15Tree)
				this.hipOffset.set(0, 2.35, 0)
			}
			
			this.sortedJointsArray.reverse()
			this._refreshBodyParts()
		}

		_refreshBodyParts() {
			if(!RBXAvatarRigs.loaded) { return }
			
			this.shouldRefreshBodyParts = false
			this.activeMaterials = []
			
			const attachmentOverride = {}
			const clothingOverride = {}
			const bodypartOverride = {}
			const accessories = []
			const assets = []
			
			for(const asset of this.appearance.assets) {
				if(!asset.enabled) { continue }
				
				if(!asset.loaded) {
					asset.load()
				}

				if(asset.loaded && asset.enabled) {
					asset.lastIndex = assets.length
					assets.push(asset)
				}
			}

			assets.sort((a, b) => (a.priority === b.priority ? a.lastIndex - b.lastIndex : a.priority - b.priority))
			
			for(const asset of assets) {
				for(const bodypart of asset.bodyparts) {
					if(!bodypart.playerType || bodypart.playerType === this.playerType) {
						bodypartOverride[bodypart.target] = bodypart
					}
				}
				
				for(const att of asset.attachments) {
					const override = attachmentOverride[att.part] = attachmentOverride[att.part] || {}
					override[att.target] = att
				}
				
				for(const cloth of asset.clothing) {
					clothingOverride[cloth.target] = cloth.texId
				}
				
				accessories.push(...asset.accessories)
			}
			
			// Update clothing
			for(const name of ["shirt", "pants", "tshirt", "face"]) {
				const source = this.sources[name]
				let texId = clothingOverride[name] || source.defaultImage || ""

				if(name === "face" && bodypartOverride.Head?.disableFace) {
					texId = ""
				}
				
				if(source.rbxTexId !== texId) {
					source.rbxTexId = texId
					source.setImage(null)
					
					if(texId) {
						AssetCache.loadImage(true, texId, img => {
							if(source.rbxTexId === texId) {
								source.setImage(img)
							}
						})
					}
				}
			}
			
			// Update attachments
			for(const [attName, att] of Object.entries(this.attachments)) {
				const override = attachmentOverride[att.parent.name]?.[attName]
				att.cframe.copy(override?.cframe || att.origCFrame)
			}
			
			// Update joints
			for(const joint of this.sortedJointsArray) {
				const overrideC0 = attachmentOverride[joint.part0.name]?.[`${joint.name}RigAttachment`]
				const overrideC1 = attachmentOverride[joint.part1.name]?.[`${joint.name}RigAttachment`]
				
				joint.C0.copy(overrideC0?.cframe || joint.origC0)
				joint.C1.copy(overrideC1?.cframe || joint.origC1)
				
				joint.part1.rbxPoseMatrix.copy(joint.part0.rbxPoseMatrix).multiply(joint.C0).multiply(tempMatrix.copy(joint.C1).invert())
			}
			
			// Update parts
			for(const [partName, part] of Object.entries(this.parts)) {
				const bodypart = bodypartOverride[partName] || part.rbxDefaultBodypart
				part.rbxBodypart = bodypart

				if(this.playerType === "R15") {
					part.rbxScaleType = bodypart?.scaleType
					part.rbxScaleMod = this.getScaleMod(part.name, part.rbxScaleType)
				}
				
				if(!part.isMesh) {
					continue
				}
				
				// Update opacity
				const material = part.material
				const opacity = bodypart.opacity ?? 1
				
				if(material.opacity !== opacity) {
					material.opacity = opacity
					material.transparent = opacity < 1
				}
				
				// Update mesh
				const meshId = bodypart.meshId
				
				if(part.rbxMeshId !== meshId) {
					part.rbxMeshId = meshId
					clearGeometry(part)
					
					if(meshId) {
						AssetCache.loadMesh(true, meshId, mesh => {
							if(part.rbxMeshId === meshId) {
								applyMesh(part, mesh)
								
								if(part.skeleton) {
									part.skeleton.dispose()
									delete part.skeleton
								}
								
								if(mesh.bones) {
									part.isSkinnedMesh = true
									
									const indices = mesh.skinIndices
									const weights = mesh.skinWeights
									const inverses = []
									const bones = []
									
									for(const bone of mesh.bones) {
										const inverse = new THREE.Matrix4()
										
										bones.push({ matrixWorld: new THREE.Matrix4(), inverse: inverse })
										inverses.push(inverse)
									}
									
									part.geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(indices, 4))
									part.geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(weights, 4))
									
									part.skeleton = new THREE.Skeleton(bones, inverses)
									part.bind(part.skeleton, new THREE.Matrix4())
									
									const real_update = part.skeleton.update
									
									part.skeleton.update = () => {
										for(let i = 0; i < mesh.bones.length; i++) {
											const bone = mesh.bones[i]
											const out = bones[i]
											
											const ref = this.parts[bone.name] || part
											
											const scale = new THREE.Vector3(
												1 / part.rbxScaleMod.x,
												1 / part.rbxScaleMod.y,
												1 / part.rbxScaleMod.z
											)
											
											out.matrixWorld.copy(ref.rbxUnscaledMatrix)
											
											out.matrixWorld.elements[12] = part.matrix.elements[12] + (ref.rbxUnscaledMatrix.elements[12] - part.rbxUnscaledMatrix.elements[12]) / scale.x
											out.matrixWorld.elements[13] = part.matrix.elements[13] + (ref.rbxUnscaledMatrix.elements[13] - part.rbxUnscaledMatrix.elements[13]) / scale.y
											out.matrixWorld.elements[14] = part.matrix.elements[14] + (ref.rbxUnscaledMatrix.elements[14] - part.rbxUnscaledMatrix.elements[14]) / scale.z
											
											out.matrixWorld.premultiply(tempMatrix.copy(part.matrix).invert())
											out.inverse.copy(ref.rbxPoseMatrix).multiply(part.rbxPoseMatrix.clone().invert()).scale(scale).invert()
										}
										
										return real_update.call(part.skeleton)
									}
								} else {
									part.isSkinnedMesh = false
									
									part.geometry.deleteAttribute("skinIndex")
									part.geometry.deleteAttribute("skinWeight")
								}
							}
						})
					}
				}
				
				// Update textures
				const textures = [
					[this.sources.base[partName], null, bodypart.baseTexId],
					[this.sources[partName], null, bodypart.texId],
					
					[this.sources.pbr[partName], null, bodypart.colorMapId],
					[material, "normalMap", bodypart.normalMapId],
					[material, "roughnessMap", bodypart.roughnessMapId],
					[material, "metalnessMap", bodypart.metalnessMapIdId],
				]
				
				if(bodypart.pbrEnabled) {
					material.map = this.textures.pbr[partName]
					
					// only draw bodycolor if alphamode = 0
					material.map.setSourceEnabled(0, bodypart.pbrAlphaMode === 0)
				} else {
					material.map = this.textures[partName]
				}
				
				for(const [target, prop, texId] of textures) {
					if(!target) { continue }
					
					const key = `rbx${prop || "texId"}`
					if(target[key] === texId) { continue }
					
					const setImage = img => {
						if(prop) {
							target[prop]?.dispose()
							target[prop] = null
							
							if(img) {
								target[prop] = createTexture(img)
							}
						} else {
							target.setImage(img)
						}
					}
					
					target[key] = texId
					setImage(null)
					
					if(texId) {
						AssetCache.loadImage(true, texId, img => {
							if(target[key] === texId) {
								setImage(img)
							}
						})
					}
				}
				
				//
				
				this.activeMaterials.push(material)
			}
			
			// Humanoid scaling
			const updateSizes = () => {
				// Scale parts
				for(const part of Object.values(this.parts)) {
					const scaleMod = part.rbxScaleMod
					
					part.rbxSize = part.rbxBodypart.size || part.rbxOrigSize
					part.rbxScale = part.rbxBodypart.scale || [1, 1, 1]

					if(this.playerType === "R15") {
						part.rbxSize = [
							part.rbxSize[0] * scaleMod.x,
							part.rbxSize[1] * scaleMod.y,
							part.rbxSize[2] * scaleMod.z
						]
						
						part.rbxScale = [
							part.rbxScale[0] * scaleMod.x,
							part.rbxScale[1] * scaleMod.y,
							part.rbxScale[2] * scaleMod.z
						]
					}
					
					if(part.isMesh) {
						part.scale.set(...part.rbxScale)
					}
				}
				
				// Scale joints
				for(const [jointName, joint] of Object.entries(this.joints)) {
					if(jointName !== "Root") {
						scalePosition(joint.bakedC0.copy(joint.C0), joint.part0.rbxScaleMod)
						scalePosition(joint.bakedC1.copy(joint.C1), joint.part1.rbxScaleMod)
					}
				}
				
				// Scale attachments
				for(const att of Object.values(this.attachments)) {
					scalePosition(att.bakedCFrame.copy(att.cframe), att.parent.rbxScaleMod)
				}
				
				// Scale rootjoint
				if(this.playerType === "R15") {
					const rootJoint = this.joints.Root
					const rightHip = this.joints.RightHip
					const leftHip = this.joints.LeftHip
					
					const rootHeight = rootJoint.part0.rbxSize[1]
					const lowerTorsoHeight = rootJoint.part1.rbxSize[1]
					const minHipOffset = Math.min(rightHip.bakedC0.elements[13], leftHip.bakedC0.elements[13])
					
					rootJoint.bakedC0.makeTranslation(0, -rootHeight / 2 - lowerTorsoHeight / 2 - minHipOffset, 0)
					rootJoint.bakedC1.makeTranslation(0, -lowerTorsoHeight / 2, 0)
				}
			}

			updateSizes()

			// HipHeight and leg stretching
			if(this.playerType === "R15") {
				const calcHeight = name => {
					const joint = this.joints[name]
					return joint.bakedC1.elements[13] - joint.bakedC0.elements[13]
				}

				// Stretch legs to same level
				let leftLegHeight = this.joints.LeftHip.bakedC1.elements[13] + calcHeight("LeftKnee") + calcHeight("LeftAnkle") + this.parts.LeftFoot.rbxSize[1] / 2
				let rightLegHeight = this.joints.RightHip.bakedC1.elements[13] + calcHeight("RightKnee") + calcHeight("RightAnkle") + this.parts.RightFoot.rbxSize[1] / 2

				if(leftLegHeight >= 0.1 && rightLegHeight >= 0.1) {
					const scale = new Vector3(1, rightLegHeight / leftLegHeight, 1)

					if(scale.y > 1) {
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
				this.animRootScale = hipHeight / 2
			}

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
					const opacity = acc.opacity ?? 1
					let material
					
					if(acc.pbrEnabled) {
						const background = new MergeSource()
						const texture = new MergeSource()
						
						if(acc.pbrAlphaMode === 0) {
							background.setRGB(...acc.baseColor.map(x => x * 255))
						}
						
						material = new THREE.MeshStandardMaterial({
							transparent: opacity < 1 || acc.pbrAlphaMode === 1,
							opacity: opacity,
							map: new MergeTexture(1024, 1024, background, texture)
						})
						
						if(acc.colorMapId) {
							AssetCache.loadImage(true, acc.colorMapId, img => {
								texture.setImage(img)
							})
						}
						
						if(acc.normalMapId) {
							AssetCache.loadImage(true, acc.normalMapId, img => {
								material.normalMap = createTexture(img)
							})
						}
						
						if(acc.metalnessMapId) {
							AssetCache.loadImage(true, acc.metalnessMapId, img => {
								material.metalnessMap = createTexture(img)
							})
						}
						
						if(acc.roughnessMapId) {
							AssetCache.loadImage(true, acc.roughnessMapId, img => {
								material.roughnessMap = createTexture(img)
							})
						}
					} else {
						material = new THREE.MeshStandardMaterial({
							transparent: opacity < 1,
							opacity: opacity,
							map: MergeSource.fromRGB(...acc.baseColor.map(x => x * 255)).toTexture()
						})
						
						if(acc.texId) {
							AssetCache.loadImage(true, acc.texId, img => {
								material.map = new MergeTexture(256, 256, img)
							})
							
							if(acc.vertexColor) {
								material.color = new THREE.Color(...acc.vertexColor)
							}
						}
					}
					
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
				
				this.activeMaterials.push(acc.obj.material)
			}
		}
	}

	return {
		Avatar,

		R6BodyPartNames,
		R15BodyPartNames,

		CFrameToMatrix4,
		applyMesh
	}
})()

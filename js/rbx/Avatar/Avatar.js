"use strict"

const RBXAvatar = (() => {
	function applyMesh(obj, baseMesh) {
		const geom = obj.geometry
		let appliedMesh = baseMesh
		
		if(baseMesh.lods.length > 2) {
			if(!baseMesh.firstLod) {
				const firstLod = baseMesh.firstLod = { ...baseMesh }
				firstLod.faces = firstLod.faces.subarray(baseMesh.lods[0] * 3, baseMesh.lods[1] * 3)
				
				let maxVertex = 0
				
				for(let i = firstLod.faces.length; i--;) {
					maxVertex = Math.max(maxVertex, firstLod.faces[i])
				}
				
				maxVertex += 1
				
				if(maxVertex < firstLod.vertices.length / 3) {
					if(firstLod.skinIndices) {
						firstLod.skinIndices = firstLod.skinIndices.subarray(0, maxVertex * 4)
						firstLod.skinWeights = firstLod.skinWeights.subarray(0, maxVertex * 4)
					}
					
					firstLod.vertices = firstLod.vertices.subarray(0, maxVertex * 3)
					firstLod.normals = firstLod.normals.subarray(0, maxVertex * 3)
					firstLod.uvs = firstLod.uvs.subarray(0, maxVertex * 2)
				}
			}
			
			appliedMesh = baseMesh.firstLod
		}
		
		if(obj.rbxMesh !== appliedMesh && obj instanceof THREE.SkinnedMesh) {
			if(obj.skeleton) {
				obj.skeleton.dispose()
				delete obj.skeleton
			}
			
			if(baseMesh.bones) {
				const bones = []
				
				obj.isSkinnedMesh = true
				obj.rbxBones = bones
				
				geom.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(appliedMesh.skinIndices, 4))
				geom.setAttribute("skinWeight", new THREE.Float32BufferAttribute(appliedMesh.skinWeights, 4))
				
				const boneCount = {}
				
				for(let i = 0; i < appliedMesh.skinIndices.length; i++) {
					if((appliedMesh.skinWeights[i] ?? 0) > 0) {
						const boneIndex = appliedMesh.skinIndices[i]
						boneCount[boneIndex] = (boneCount[boneIndex] ?? 0) + 1
					}
				}
				
				for(const [i, meshBone] of Object.entries(baseMesh.bones)) {
					const bone = {
						name: meshBone.name,
						cframe: CFrameToMatrix4(...meshBone.cframe),
						count: boneCount[i] ?? 0,
						
						matrixWorld: new THREE.Matrix4(),
						inverse: new THREE.Matrix4()
					}
					
					bones.push(bone)
				}
				
				obj.skeleton = new THREE.Skeleton(bones, bones.map(x => x.inverse))
				
				obj.skeleton.btr_apply = obj.skeleton.update
				obj.skeleton.update = () => {}
				
				obj.bind(obj.skeleton, new THREE.Matrix4())
				
			} else {
				obj.isSkinnedMesh = false
				delete obj.rbxBones
				
				geom.deleteAttribute("skinIndex")
				geom.deleteAttribute("skinWeight")
			}
		}
		
		obj.rbxMesh = baseMesh
		delete obj.rbxLayered
		
		geom.setAttribute("position", new THREE.BufferAttribute(appliedMesh.vertices, 3))
		geom.setAttribute("normal", new THREE.BufferAttribute(appliedMesh.normals, 3))
		geom.setAttribute("uv", new THREE.BufferAttribute(appliedMesh.uvs, 2))
		geom.setIndex(new THREE.BufferAttribute(appliedMesh.faces, 1))
		
		// geom.computeBoundingSphere()

		obj.visible = true
	}
	
	function clearGeometry(obj) {
		const geom = obj.geometry

		if(obj instanceof THREE.SkinnedMesh) {
			if(obj.skeleton) {
				obj.skeleton.dispose()
				delete obj.skeleton
			}
			
			obj.isSkinnedMesh = false
			delete obj.rbxBones
			
			geom.deleteAttribute("skinIndex")
			geom.deleteAttribute("skinWeight")
		}
		
		delete obj.rbxMesh
		delete obj.rbxLayered
		
		geom.deleteAttribute("position")
		geom.deleteAttribute("normal")
		geom.deleteAttribute("uv")
		geom.setIndex(null)

		// geom.computeBoundingSphere()

		obj.visible = false
	}

	function CFrameToMatrix4(x, y, z, r00, r01, r02, r10, r11, r12, r20, r21, r22) {
		return new THREE.Matrix4().fromArray([
			r00, r10, r20, 0,
			r01, r11, r21, 0,
			r02, r12, r22, 0,
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
	
	const LocalAssets = {
		"res/previewer/characterModels.rbxm": "rbxassetid://11829118051&version=1",
		"res/previewer/face.png": "rbxassetid://2957705858",
		
		"res/previewer/meshes/leftarm.mesh": "rbxassetid://2957740508",
		"res/previewer/meshes/leftleg.mesh": "rbxassetid://2957740624",
		"res/previewer/meshes/rightarm.mesh": "rbxassetid://2957740703",
		"res/previewer/meshes/rightleg.mesh": "rbxassetid://2957740776",
		"res/previewer/meshes/torso.mesh": "rbxassetid://2957740857",
		"res/previewer/heads/head.mesh": "rbxassetid://2957715294",
	
		"res/previewer/compositing/CompositPantsTemplate.mesh": "rbxassetid://2957742558",
		"res/previewer/compositing/CompositShirtTemplate.mesh": "rbxassetid://2957742631",
		"res/previewer/compositing/CompositTShirt.mesh": "rbxassetid://2957742706",
		"res/previewer/compositing/R15CompositLeftArmBase.mesh": "rbxassetid://2957742791",
		"res/previewer/compositing/R15CompositRightArmBase.mesh": "rbxassetid://2957742881",
		"res/previewer/compositing/R15CompositTorsoBase.mesh": "rbxassetid://2957742957"
	}
	
	const R6BodyPartNames = ["Torso", "Left Arm", "Right Arm", "Left Leg", "Right Leg"]
	const R15BodyPartNames = [
		"LeftFoot", "LeftHand", "LeftLowerArm", "LeftLowerLeg", "LeftUpperArm", "LeftUpperLeg", "LowerTorso",
		"RightFoot", "RightHand", "RightLowerArm", "RightLowerLeg", "RightUpperArm", "RightUpperLeg", "UpperTorso"
	]
	
	const ScaleMods = {
		Default: {
			LeftFoot: new THREE.Vector3(1.0789999961853027, 1.2669999599456787, 1.128999948501587),
			LeftHand: new THREE.Vector3(1.065999984741211, 1.1740000247955322, 1.2309999465942383),
			LeftLowerArm: new THREE.Vector3(1.128999948501587, 1.3420000076293945, 1.1319999694824219),
			LeftLowerLeg: new THREE.Vector3(1.0230000019073486, 1.50600004196167, 1.0230000019073486),
			LeftUpperArm: new THREE.Vector3(1.128999948501587, 1.3420000076293945, 1.1319999694824219),
			LeftUpperLeg: new THREE.Vector3(1.0230000019073486, 1.50600004196167, 1.0230000019073486),
			LowerTorso: new THREE.Vector3(1.0329999923706055, 1.309000015258789, 1.1399999856948853),
			RightFoot: new THREE.Vector3(1.0789999961853027, 1.2669999599456787, 1.128999948501587),
			RightHand: new THREE.Vector3(1.065999984741211, 1.1740000247955322, 1.2309999465942383),
			RightLowerArm: new THREE.Vector3(1.128999948501587, 1.3420000076293945, 1.1319999694824219),
			RightLowerLeg: new THREE.Vector3(1.0230000019073486, 1.50600004196167, 1.0230000019073486),
			RightUpperArm: new THREE.Vector3(1.128999948501587, 1.3420000076293945, 1.1319999694824219),
			RightUpperLeg: new THREE.Vector3(1.0230000019073486, 1.50600004196167, 1.0230000019073486),
			UpperTorso: new THREE.Vector3(1.0329999923706055, 1.309000015258789, 1.1399999856948853),
			Head: new THREE.Vector3(0.9419999718666077, 0.9419999718666077, 0.9419999718666077),
		},
		Rthro: {
			LeftFoot: new THREE.Vector3(1.4040000438690186, 0.953000009059906, 0.9309999942779541),
			LeftHand: new THREE.Vector3(1.3899999856948853, 0.9670000076293945, 1.2009999752044678),
			LeftLowerArm: new THREE.Vector3(1.121000051498413, 0.6809999942779541, 0.968000054359436),
			LeftLowerLeg: new THREE.Vector3(0.9779999852180481, 0.8140000104904175, 1.055999994277954),
			LeftUpperArm: new THREE.Vector3(1.121000051498413, 0.6809999942779541, 0.968000054359436),
			LeftUpperLeg: new THREE.Vector3(0.9779999852180481, 0.8140000104904175, 1.055999994277954),
			LowerTorso: new THREE.Vector3(1.0140000581741333, 0.8140000104904175, 0.9240000247955322),
			RightFoot: new THREE.Vector3(1.4040000438690186, 0.953000009059906, 0.9309999942779541),
			RightHand: new THREE.Vector3(1.3899999856948853, 0.9670000076293945, 1.2009999752044678),
			RightLowerArm: new THREE.Vector3(1.121000051498413, 0.6809999942779541, 0.968000054359436),
			RightLowerLeg: new THREE.Vector3(0.9779999852180481, 0.8140000104904175, 1.055999994277954),
			RightUpperArm: new THREE.Vector3(1.121000051498413, 0.6809999942779541, 0.968000054359436),
			RightUpperLeg: new THREE.Vector3(0.9779999852180481, 0.8140000104904175, 1.055999994277954),
			UpperTorso: new THREE.Vector3(1.0140000581741333, 0.8140000104904175, 0.9240000247955322),
			Head: new THREE.Vector3(1.600000023841858, 1.600000023841858, 1.600000023841858)
		},
		Proportion: {
			LeftFoot: new THREE.Vector3(0.9541984796524048, 0.8944543600082397, 0.8888888955116272),
			LeftHand: new THREE.Vector3(0.8888888359069824, 1, 0.8888888955116272),
			LeftLowerArm: new THREE.Vector3(0.8888888359069824, 0.9000899791717529, 0.8888888955116272),
			LeftLowerLeg: new THREE.Vector3(0.9541985392570496, 0.8635578751564026, 0.8888888955116272),
			LeftUpperArm: new THREE.Vector3(0.8888888359069824, 0.9000899791717529, 0.8888888955116272),
			LeftUpperLeg: new THREE.Vector3(0.9541985392570496, 0.9302325248718262, 0.8888888955116272),
			LowerTorso: new THREE.Vector3(0.9541985392570496, 0.7674597501754761, 0.8888888955116272),
			RightFoot: new THREE.Vector3(0.9541984796524048, 0.8944543600082397, 0.8888888955116272),
			RightHand: new THREE.Vector3(0.8888888359069824, 1, 0.8888888955116272),
			RightLowerArm: new THREE.Vector3(0.8888888359069824, 0.9000899791717529, 0.8888888955116272),
			RightLowerLeg: new THREE.Vector3(0.9541985392570496, 0.8635578751564026, 0.8888888955116272),
			RightUpperArm: new THREE.Vector3(0.8888888359069824, 0.9000899791717529, 0.8888888955116272),
			RightUpperLeg: new THREE.Vector3(0.9541985392570496, 0.9302325248718262, 0.8888888955116272),
			UpperTorso: new THREE.Vector3(0.8764241933822632, 0.9199632406234741, 0.8888888955116272),
			Head: new THREE.Vector3(0.9514747858047485, 1, 0.9514747858047485),
		}
	}
	
	const tempMatrix = new THREE.Matrix4()
	const tempVector = new THREE.Vector3()
	
	let compositeRenderer
	
	const invalidRenderMetaAssetIds = {}
	const invalidLayeredAssetIds = {}
	
	const skinnedWorld = new THREE.Matrix4()
	const skinnedInverse = new THREE.Matrix4()
	
	class Avatar extends EventEmitter {
		constructor() {
			super()
			this.root = new THREE.Group()
			this.animator = new RBXAnimator()
			this.appearance = new RBXAppearance()

			this.baseLoadedPromise = new Promise()
			
			this.activeMaterials = []
			this.sortedJointsArray = []
			this.accessories = []
			this.attachments = {}
			this.joints = {}
			this.parts = {}

			this.playerType = null
			this.hipHeight = 2
			
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
				leftArm: "#A3A2A5",
				rightArm: "#A3A2A5",
				leftLeg: "#A3A2A5",
				rightLeg: "#A3A2A5"
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
				
						ctx.fillStyle = this.bodyColors.rightArm
						ctx.fillRect(200, 0, 192, 320)
						ctx.fillRect(420, 400, 148, 104)
						ctx.fillRect(758, 322, 76, 76)
						ctx.fillRect(898, 322, 76, 76)
				
						ctx.fillStyle = this.bodyColors.leftArm
						ctx.fillRect(400, 0, 192, 320)
						ctx.fillRect(568, 400, 148, 104)
						ctx.fillRect(828, 322, 76, 76)
						ctx.fillRect(194, 394, 76, 76)
				
						ctx.fillStyle = this.bodyColors.rightLeg
						ctx.fillRect(600, 0, 192, 320)
						ctx.fillRect(716, 400, 148, 104)
						ctx.fillRect(466, 322, 76, 76)
						ctx.fillRect(610, 322, 76, 76)
				
						ctx.fillStyle = this.bodyColors.leftLeg
						ctx.fillRect(800, 0, 192, 320)
						ctx.fillRect(864, 400, 148, 104)
						ctx.fillRect(542, 322, 76, 76)
						ctx.fillRect(684, 322, 76, 76)
					}),
					
					head: MergeSource.fromHex("#A3A2A5"),
					torso: MergeSource.fromHex("#A3A2A5"),
					leftArm: MergeSource.fromHex("#A3A2A5"),
					leftLeg: MergeSource.fromHex("#A3A2A5"),
					rightArm: MergeSource.fromHex("#A3A2A5"),
					rightLeg: MergeSource.fromHex("#A3A2A5")
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
				leftArm: new RBXComposites.R15LeftArmComposite(sources),
				leftLeg: new RBXComposites.R15LeftLegComposite(sources),
				rightArm: new RBXComposites.R15RightArmComposite(sources),
				rightLeg: new RBXComposites.R15RightLegComposite(sources)
			}
			
			sources.face.defaultImage = RBXAvatar.LocalAssets[`res/previewer/face.png`]
			
			for(const name of ["Head", ...R6BodyPartNames]) {
				sources.base[name] = new MergeSource()
				sources[name] = new MergeSource()
				
				textures[name] =
					name === "Head" ? new MergeTexture(256, 256, sources.bodyColors.head, sources.base[name], sources[name], sources.face)
					: new MergeTexture(1024, 512, sources.bodyColors.R6, sources.base[name], composites.r6, sources[name])
			}

			for(const name of R15BodyPartNames) {
				const limb = name.replace(/\s|Lower|Upper/g, "").replace(/Hand|Foot/, x => ({ Hand: "Arm", Foot: "Leg" })[x]).replace(/^./, x => x.toLowerCase())
				const composite = composites[limb]
				
				sources[name] = new MergeSource()
				textures[name] = new MergeTexture(composite.canvas.width, composite.canvas.height, sources.bodyColors[limb], composite, sources[name])
			}
			
			for(const name of ["Head", ...R6BodyPartNames, ...R15BodyPartNames]) {
				const limb = name.replace(/\s|Lower|Upper/g, "").replace(/Hand|Foot/, x => ({ Hand: "Arm", Foot: "Leg" })[x]).replace(/^./, x => x.toLowerCase())
				
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
			
			for(const composite of Object.values(this.composites)) {
				loaders.push(...composite.loaders)
			}
			
			if(this.bodyColors) {
				this.setBodyColors(this.bodyColors)
			}
			
			Promise.all(loaders).then(() => this.baseLoadedPromise.$resolve())
		}

		async waitForAppearance() {
			await this.baseLoadedPromise
			let finalCheck = false
			
			while(true) {
				let loaded = true
				
				for(const asset of this.appearance.assets) {
					if(!asset.enabled) { continue }
					
					if(!asset.isLoaded(this.playerType)) {
						loaded = false
						break
					}
				}
				
				if(loaded) {
					if(!finalCheck) {
						finalCheck = true
						this.update() // force load new accessories, if necessary
						continue
					}
					
					break
				}
				
				finalCheck = false
				await new Promise(resolve => requestAnimationFrame(resolve))
			}
		}

		updateBones(obj) {
			for(const joint of this.sortedJointsArray) {
				if(obj.rbxLayered?.wrapLayer) {
					joint.skinnedPoseMatrix.multiplyMatrices(joint.part0.skinnedPoseMatrix, joint.bakedC0)
					joint.part1.skinnedPoseMatrix.multiplyMatrices(joint.skinnedPoseMatrix, joint.bakedC1Inverse)
				} else {
					if(obj.rbxBodypart) {
						joint.skinnedPoseMatrix.multiplyMatrices(joint.part0.skinnedPoseMatrix, joint.C0)
						joint.part1.skinnedPoseMatrix.multiplyMatrices(joint.skinnedPoseMatrix, joint.C1Inverse)
					}
					
					joint.skinnedNoScale
						.multiplyMatrices(joint.part0.skinnedNoScale, scalePosition(tempMatrix.copy(joint.C0), obj.rbxScaleMod))
						.multiply(joint.transform)
					
					joint.part1.skinnedNoScale
						.multiplyMatrices(joint.skinnedNoScale, scalePosition(tempMatrix.copy(joint.C1Inverse), obj.rbxScaleMod))
				}
			}
			
			if(obj.rbxAccessory) {
				const acc = obj.rbxAccessory
				
				obj.skinnedPoseMatrix.multiplyMatrices(acc.parent.skinnedPoseMatrix, acc.bakedCFrame)
				obj.skinnedNoScale.multiplyMatrices(acc.parent.skinnedNoScale, acc.bakedCFrame)
			}
			
			if(!obj.rbxLayered?.wrapLayer) {
				skinnedWorld
					.copy(obj.matrix).invert()
					.multiply(obj.matrixNoScale)
					.multiply(tempMatrix.copy(obj.skinnedNoScale).invert())
			}
			
			for(const bone of obj.rbxBones) {
				const joint = this.joints[bone.name]
				
				if(!joint || bone.count === 0) {
					bone.matrixWorld.identity()
					bone.inverse.identity()
					continue
				}
				
				if(obj.rbxLayered?.wrapLayer) {
					bone.matrixWorld.copy(obj.matrix).invert().multiply(joint.matrixNoScale)
					bone.inverse.copy(obj.skinnedPoseMatrix).invert().multiply(joint.skinnedPoseMatrix).invert()
					
					// scale a bit with obj so it looks better when waiting for layered stuff to load
					const target = obj.rbxLayered.rbxScaleModTarget
					
					if(target && this.parts[target]) {
						bone.inverse.scale(tempVector.copy(this.parts[target].rbxScaleMod).divide(obj.rbxLayered.rbxScaleMod))
					}
					
				} else if(obj.rbxBodypart) {
					bone.matrixWorld.multiplyMatrices(skinnedWorld, joint.skinnedNoScale)
					bone.inverse.copy(obj.skinnedPoseMatrix).invert().multiply(joint.skinnedPoseMatrix).invert()
					
					scalePosition(bone.inverse, obj.rbxScaleMod).scale(obj.scale)
					
				} else {
					bone.matrixWorld.multiplyMatrices(skinnedWorld, joint.skinnedNoScale)
					bone.inverse.copy(bone.cframe).invert()
					
					scalePosition(bone.inverse, obj.rbxScaleMod).scale(obj.scale)
				}
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
			
			this.root.position.copy(this.offset)
			this.root.rotation.copy(this.offsetRot)
			
			this.root.position.y += this.hipHeight + (this.parts.HumanoidRootPart?.rbxSize[1] ?? 0) / 2
			
			// Update joints
			for(const joint of this.sortedJointsArray) {
				const transform = this.animator.getJointTransform(joint.part0.name, joint.part1.name)
				
				if(transform) {
					joint.transform.compose(transform.position, transform.quaternion, tempVector.set(1, 1, 1))
				} else {
					joint.transform.identity()
				}
				
				if(this.playerType === "R15" && joint.part1.name === "LowerTorso") {
					scalePosition(joint.transform, tempVector.setScalar(this.hipHeight / 2))
				}
				
				joint.matrixNoScale.multiplyMatrices(joint.part0.matrixNoScale, joint.bakedC0).multiply(joint.transform)
				joint.part1.matrixNoScale.multiplyMatrices(joint.matrixNoScale, joint.bakedC1Inverse)
				
				joint.part1.matrix.copy(joint.part1.matrixNoScale).scale(joint.part1.scale)
				joint.part1.matrixWorldNeedsUpdate = true
			}
			
			// Update accessories
			for(const acc of this.accessories) {
				if(!acc.parent) { continue }

				acc.obj.matrixNoScale.multiplyMatrices(acc.parent.matrixNoScale, acc.bakedCFrame)
				
				acc.obj.matrix.copy(acc.obj.matrixNoScale).scale(acc.obj.scale)
				acc.obj.matrixWorldNeedsUpdate = true
			}
			
			// Update layered clothing
			this._refreshLayeredClothing()
			
			// Update bones
			for(const part of Object.values(this.parts)) {
				if(part.rbxBones) {
					this.updateBones(part)
					part.skeleton.btr_apply()
				}
			}
			
			for(const acc of this.accessories) {
				if(acc.parent && acc.obj.rbxBones) {
					this.updateBones(acc.obj)
					acc.obj.skeleton.btr_apply()
				}
			}
			
			// Update composites
			const activeComposites = this.playerType === "R6"
				? [this.composites.r6]
				: [this.composites.torso, this.composites.leftArm, this.composites.rightArm, this.composites.leftLeg, this.composites.rightLeg]

			for(const comp of activeComposites) {
				if(comp.needsUpdate) {
					comp.update(compositeRenderer)
				}
			}
			
			// Update materials
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

		getScaleMod(partName, scaleType, partScaleType, result) { // Only use partScaleType with accessories! C:
			if(!result) { result = new THREE.Vector3() }
			
			if(this.playerType !== "R15") {
				return result.set(1, 1, 1)
			}

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

			const startScale = new THREE.Vector3()
			const endScale = new THREE.Vector3()

			if(scaleType === "ProportionsNormal") {
				startScale.copy(rthroMod)
				endScale.set(1, 1, 1).lerp(propMod, this.scales.proportion)

				if(partScaleType && partScaleType !== "ProportionsNormal" && partScaleType !== "ProportionsSlender") {
					endScale.multiply(tempVector.copy(rthroMod).multiply(defaultMod))
				}
			} else if(scaleType === "ProportionsSlender") {
				startScale.copy(rthroMod).multiply(tempVector.set(1, 1, 1).divide(propMod))
				endScale.set(1, 1, 1).divide(propMod).lerp(tempVector.set(1, 1, 1), this.scales.proportion)

				if(partScaleType && partScaleType !== "ProportionsNormal" && partScaleType !== "ProportionsSlender") {
					endScale.multiply(tempVector.copy(rthroMod).multiply(defaultMod))
				}
			} else {
				startScale.set(1, 1, 1)
				endScale.copy(defaultMod).multiply(tempVector.set(1, 1, 1).lerp(propMod, this.scales.proportion))

				if(partScaleType && (partScaleType === "ProportionsNormal" || partScaleType === "ProportionsSlender")) {
					endScale.divide(tempVector.copy(rthroMod).multiply(defaultMod))
				}
			}

			result.multiply(startScale.lerp(endScale, this.scales.bodyType))
			
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

			const CreateModel = (tree, parentJoint) => {
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
					meshId: tree.meshId,
					wrapTarget: tree.wrapTarget
				}
				
				obj.rbxBodypart = obj.rbxDefaultBodypart
				obj.rbxOrigSize = tree.origSize
				obj.rbxScaleMod = new THREE.Vector3(1, 1, 1)
				
				obj.layeredMatrix = new THREE.Matrix4()
				obj.matrixNoScale = new THREE.Matrix4()
				obj.skinnedNoScale = new THREE.Matrix4()
				obj.skinnedPoseMatrix = new THREE.Matrix4()
				//
				
				this.root.add(obj)
				parts[tree.name] = obj
				
				for(const [name, cframe] of Object.entries(tree.attachments)) {
					attachments[name] = {
						origCFrame: cframe,
						cframe: cframe.clone(),
						bakedCFrame: cframe.clone(),
						parent: obj,
						name: name
					}
				}

				for(const child of tree.children) {
					const joint = joints[child.name] = {
						origC0: child.C0,
						origC1: child.C1,
						
						C0: child.C0.clone(),
						C1Inverse: child.C1.clone().invert(),
						
						bakedC0: child.C0.clone(),
						bakedC1Inverse: child.C1.clone().invert(),
						
						transform: new THREE.Matrix4(),
						
						layeredMatrix: new THREE.Matrix4(),
						matrixNoScale: new THREE.Matrix4(),
						skinnedNoScale: new THREE.Matrix4(),
						skinnedPoseMatrix: new THREE.Matrix4(),
						
						parent: parentJoint,
						name: child.JointName
					}
					
					const childObj = CreateModel(child, joint)
					
					joint.part0 = obj
					joint.part1 = childObj
					
					this.sortedJointsArray.push(joint)
				}

				return obj
			}

			if(this.playerType === "R6") {
				CreateModel(RBXAvatarRigs.R6Tree)
			} else if(this.playerType === "R15") {
				CreateModel(RBXAvatarRigs.R15Tree)
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
			const accessories = {}
			const assets = []
			
			for(const asset of this.appearance.assets) {
				if(!asset.enabled) { continue }
				
				const state = asset.load(this.playerType)
				
				if(state.loaded) {
					asset.lastIndex = assets.length
					assets.push(asset)
				}
			}

			assets.sort((a, b) => (a.priority === b.priority ? a.lastIndex - b.lastIndex : a.priority - b.priority))
			
			for(const asset of assets) {
				const state = asset.getState(this.playerType)
				if(!state) { continue }
				
				for(const bodypart of state.bodyparts) {
					bodypartOverride[bodypart.target] = bodypart
				}
				
				for(const acc of state.accessories) {
					accessories[asset.id] = acc
				}
				
				for(const cloth of state.clothing) {
					clothingOverride[cloth.target] = cloth.texId
				}
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
			if(this.playerType === "R15") {
				for(const bodypart of Object.values(bodypartOverride)) {
					for(const att of bodypart.attachments) {
						const override = attachmentOverride[att.part] = attachmentOverride[att.part] || {}
						override[att.target] = att
					}
				}
			}
			
			for(const [attName, att] of Object.entries(this.attachments)) {
				const override = attachmentOverride[att.parent.name]?.[attName]
				att.cframe.copy(override?.cframe || att.origCFrame)
			}
			
			// Update joints
			for(const joint of this.sortedJointsArray) {
				const overrideC0 = attachmentOverride[joint.part0.name]?.[`${joint.name}RigAttachment`]
				const overrideC1 = attachmentOverride[joint.part1.name]?.[`${joint.name}RigAttachment`]
				
				joint.C0.copy(overrideC0?.cframe || joint.origC0)
				joint.C1Inverse.copy(overrideC1?.cframe || joint.origC1).invert()
			}
			
			// Update parts
			for(const part of Object.values(this.parts)) {
				const bodypart = bodypartOverride[part.name] || part.rbxDefaultBodypart
				part.rbxBodypart = bodypart

				if(this.playerType === "R15") {
					part.rbxScaleType = bodypart?.scaleType
					this.getScaleMod(part.name, part.rbxScaleType, null, part.rbxScaleMod)
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
					delete part.rbxMeshLoading
					
					clearGeometry(part)
					
					if(meshId) {
						part.rbxMeshLoading = meshId
						
						AssetCache.loadMesh(true, meshId, mesh => {
							if(part.rbxMeshLoading === meshId) {
								delete part.rbxMeshLoading
								applyMesh(part, mesh)
							}
						})
					}
				}
				
				// Update textures
				const textures = [
					[this.sources.base[part.name], null, bodypart.baseTexId],
					[this.sources[part.name], null, bodypart.texId],
					
					[this.sources.pbr[part.name], null, bodypart.colorMapId],
					[material, "normalMap", bodypart.normalMapId],
					[material, "roughnessMap", bodypart.roughnessMapId],
					[material, "metalnessMap", bodypart.metalnessMapIdId],
				]
				
				if(bodypart.pbrEnabled) {
					material.map = this.textures.pbr[part.name]
					
					// only draw bodycolor if alphamode = 0
					material.map.setSourceEnabled(0, bodypart.pbrAlphaMode === 0)
					
					if(bodypart.pbrAlphaMode === 1) { // Transparent
						material.transparent = true
					}
				} else {
					material.map = this.textures[part.name]
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
				for(const joint of Object.values(this.joints)) {
					scalePosition(joint.bakedC0.copy(joint.C0), joint.part0.rbxScaleMod)
					scalePosition(joint.bakedC1Inverse.copy(joint.C1Inverse), joint.part1.rbxScaleMod)
				}
				
				// Scale attachments
				for(const att of Object.values(this.attachments)) {
					scalePosition(att.bakedCFrame.copy(att.cframe), att.parent.rbxScaleMod)
				}
				
				// Scale rootjoint so that the lowest hip joint aligns with bottom of rootpart
				if(this.playerType === "R15") {
					const rootJoint = this.joints.LowerTorso
					const rightHip = this.joints.RightUpperLeg
					const leftHip = this.joints.LeftUpperLeg
					
					rootJoint.bakedC0.elements[13] =
						- rootJoint.bakedC1Inverse.elements[13]
						- Math.min(rightHip.bakedC0.elements[13], leftHip.bakedC0.elements[13])
						- Math.max(0.05, rootJoint.part0.rbxSize[1]) / 2
				}
			}

			updateSizes()

			// HipHeight and leg stretching
			if(this.playerType === "R15") {
				let leftLegSize =
					- this.joints.LeftUpperLeg.bakedC1Inverse.elements[13]
					- this.joints.LeftLowerLeg.bakedC0.elements[13]
					- this.joints.LeftLowerLeg.bakedC1Inverse.elements[13]
					- this.joints.LeftFoot.bakedC0.elements[13]
					- this.joints.LeftFoot.bakedC1Inverse.elements[13]
					+ Math.max(0.05, this.parts.LeftFoot.rbxSize[1]) / 2
				
				let rightLegSize =
					- this.joints.RightUpperLeg.bakedC1Inverse.elements[13]
					- this.joints.RightLowerLeg.bakedC0.elements[13]
					- this.joints.RightLowerLeg.bakedC1Inverse.elements[13]
					- this.joints.RightFoot.bakedC0.elements[13]
					- this.joints.RightFoot.bakedC1Inverse.elements[13]
					+ Math.max(0.05, this.parts.RightFoot.rbxSize[1]) / 2
				
				if(leftLegSize >= 0.1 && rightLegSize >= 0.1) {
					const scale = rightLegSize / leftLegSize
					
					if(scale > 1) {
						this.parts.LeftUpperLeg.rbxScaleMod.y *= scale
						this.parts.LeftLowerLeg.rbxScaleMod.y *= scale
						this.parts.LeftFoot.rbxScaleMod.y *= scale
						leftLegSize = rightLegSize
					} else if(scale < 1) {
						this.parts.RightUpperLeg.rbxScaleMod.y /= scale
						this.parts.RightLowerLeg.rbxScaleMod.y /= scale
						this.parts.RightFoot.rbxScaleMod.y /= scale
						rightLegSize = leftLegSize
					}
					
					updateSizes()
				}
				
				const rootHeight =
					-this.joints.LowerTorso.bakedC0.elements[13]
					- this.joints.LowerTorso.bakedC1Inverse.elements[13]
					- Math.max(0.05, this.parts.HumanoidRootPart.rbxSize[1]) / 2
				
				let min = rootHeight - this.joints.LeftUpperLeg.bakedC0.elements[13] + leftLegSize
				let max = rootHeight - this.joints.RightUpperLeg.bakedC0.elements[13] + rightLegSize
				if(min < max) { [min, max] = [max, min] }
				
				this.hipHeight = min >= max * 0.95 ? min : max
			} else {
				this.hipHeight = 2
			}
			
			// Remove old accessories
			const accArray = Object.values(accessories)
			
			for(let i = this.accessories.length; i--;) {
				const acc = this.accessories[i]
				
				if(!accArray.includes(acc)) {
					this.accessories.splice(i, 1)
					
					if(acc.obj && acc.obj.parent) {
						acc.obj.parent.remove(acc.obj)
					}
					
					acc.attachment = null
					acc.parent = null
				}
			}

			// Update accessories
			for(const acc of accArray) {
				if(acc.wrapLayer) {
					if(!SETTINGS.get("general.previewLayeredClothing")) {
						continue
					}
					
					if(this.playerType !== "R15") {
						continue
					}
				}
				
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
					
					const obj = acc.obj = new THREE.SkinnedMesh(undefined, material)
					obj.isSkinnedMesh = false
					obj.bindMode = "detached"
					obj.matrixAutoUpdate = false
					obj.frustumCulled = false
					obj.visible = false
					obj.castShadow = true
					
					obj.rbxScaleMod = new THREE.Vector3(1, 1, 1)
					obj.rbxAccessory = acc
					
					obj.layeredMatrix = new THREE.Matrix4()
					obj.matrixNoScale = new THREE.Matrix4()
					obj.skinnedNoScale = new THREE.Matrix4()
					obj.skinnedPoseMatrix = new THREE.Matrix4()
					
					if(acc.meshId) {
						obj.rbxMeshLoading = acc.meshId
						
						AssetCache.loadMesh(true, acc.meshId, mesh => {
							delete obj.rbxMeshLoading
							applyMesh(obj, mesh)
						})
					}
					
					acc.bakedCFrame = new THREE.Matrix4()
				}
				
				// Attach to correct attachment
				const attCFrame = new THREE.Matrix4()
				let attachment
				
				for(const att of acc.attachments) {
					if(this.attachments[att.name]) {
						attachment = this.attachments[att.name]
						attCFrame.copy(att.cframe)
						break
					}
				}
				
				const parent = attachment ? attachment.parent : this.parts.Head
				
				if(parent) {
					// Scale
					this.getScaleMod(parent.name, acc.scaleType, parent.rbxScaleType, acc.obj.rbxScaleMod)
					acc.obj.scale.set(...(acc.scale || [1, 1, 1])).multiply(acc.obj.rbxScaleMod)
					
					// Position
					if(attachment) {
						acc.bakedCFrame.copy(attachment.bakedCFrame).multiply(
							scalePosition(tempMatrix.copy(attCFrame), acc.obj.rbxScaleMod)
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
					
					//
					
					acc.attachment = attachment
					acc.parent = parent
					
					if(!acc.obj.parent) {
						this.root.add(acc.obj)
					}
					
					if(!this.accessories.includes(acc)) {
						this.accessories.push(acc)
					}
					
					this.activeMaterials.push(acc.obj.material)
				} else {
					acc.parent = null
					
					if(acc.obj.parent) {
						acc.obj.parent.remove(acc.obj)
					}
				}
			}
		}
		
		getLayeredRequest() {
			if(!SETTINGS.get("general.previewLayeredClothing")) { return null }
			if(this.playerType !== "R15") { return null }
			
			const accessories = []

			for(const acc of this.accessories) {
				if(!acc.wrapLayer) { continue }
				if(invalidLayeredAssetIds[acc.asset.id]) { continue }
				
				if(acc.obj.rbxMeshLoading) { // Don't request layered stuff if mesh is not loaded yet
					return null
				}
				
				if(acc.obj.rbxMesh) {
					accessories.push({
						id: acc.asset.id,
						meta: !invalidRenderMetaAssetIds[acc.asset.id] ? acc.asset.meta : undefined
					})
				}
			}
			
			if(accessories.length === 0) {
				return null
			}
			
			const bodyparts = []
		
			for(const part of Object.values(this.parts)) {
				const bodypart = part.rbxBodypart
				if(invalidLayeredAssetIds[bodypart.asset?.id]) { continue }
				
				if(part.rbxMeshLoading) { // Don't request layered stuff if mesh is not loaded yet
					return null
				}
				
				if(part.rbxMesh && bodypart.asset) {
					if(!bodyparts.find(x => x.id === bodypart.asset.id)) { // Multiple parts can share the same asset
						bodyparts.push({ id: bodypart.asset.id })
					}
				}
			}
			
			const scales = { ...this.scales }
			const bodyColors = {}
			
			for(const [name, color] of Object.entries(this.bodyColors)) {
				bodyColors[name + "Color"] = color
			}
			
			const request = { bodyColors, scales, accessories, bodyparts }
			
			// sort assets by id for hashing
			accessories.sort((a, b) => b.id - a.id)
			bodyparts.sort((a, b) => b.id - a.id)
			
			request.hash = $.hashString(JSON.stringify(request))
			
			return request
		}
		
		_refreshLayeredClothing() {
			if(this.layeredRequestState === "fetching") { return }
			
			const now = performance.now()
			if(now - (this.lastLayeredRequest ?? 0) < 100) { return }
			
			this.lastLayeredRequest = now
			const request = this.getLayeredRequest()
			
			if(request?.hash !== this.layeredFinishedRequest?.hash) {
				for(const part of Object.values(this.parts)) {
					if(part.rbxLayered) {
						applyMesh(part, part.rbxMesh)
					}
				}
				
				if(!request) {
					this.layeredRequestState = null
					this.layeredFinishedRequest = request
					
					for(const acc of this.accessories) {
						if(acc.obj.rbxLayered) {
							applyMesh(acc.obj, acc.obj.rbxMesh)
						}
					}
					
					return
				}
				
				this.layeredRequestState = "fetching"
				this.trigger("layeredRequestStateChanged", this.layeredRequestState)
				
				this._fetchLayeredClothing(request).then(done => {
					if(done === true) {
						this.layeredRequestState = "done"
						this.layeredFinishedRequest = request
						
						this.trigger("layeredRequestStateChanged", this.layeredRequestState)
						
					} else {
						if(this.layeredRequestState === "fetching") {
							setTimeout(() => {
								this.layeredRequestState = null
								this.trigger("layeredRequestStateChanged", this.layeredRequestState)
							}, 2000)
						}
					}
				})
			}
		}
		
		async _fetchLayeredClothing(request) {
			let objHash = btrLocalStorage.getItem(`btrLayeredCache-${request.hash}`)
			
			if(!objHash) {
				const body = {
					avatarDefinition: {
						assets: [
							{ id: 11187668197 }, // anchor
							...request.accessories,
							...request.bodyparts
						],
						bodyColors: request.bodyColors,
						scales: request.scales,
						playerAvatarType: {
							playerAvatarType: "R15"
						}
					},
					thumbnailConfig: {
						thumbnailId: 3,
						thumbnailType: "3d",
						size: "420x420"
					}
				}
				
				// sort assets in case roblox's cache cares about the order
				body.avatarDefinition.assets.sort((a, b) => b.id - a.id)
				
				const json = await RobloxApi.avatar.renderAvatar(body).catch(() => null)
				if(!json || request?.hash !== this.getLayeredRequest()?.hash) { return }
				
				if(json.errors) {
					for(const error of json.errors) {
						if(error.code === 2) {
							const assetId = parseInt(error.field?.match(/AssetId: (\d+)/)?.[1], 10)
							if(!Number.isSafeInteger(assetId)) { continue }
							
							if(error.field?.startsWith("InvalidAsset ")) {
								invalidLayeredAssetIds[assetId] = true
							} else if(error.field?.startsWith("InvalidMeta ")) {
								invalidRenderMetaAssetIds[assetId] = true
							}
						}
					}
				}
				
				if(!json?.imageUrl) {
					return
				}
				
				const render = await fetch(json.imageUrl).then(res => res.json())
				if(request?.hash !== this.getLayeredRequest()?.hash) { return }
				
				objHash = render.obj
				
				if(objHash) {
					btrLocalStorage.setItem(`btrLayeredCache-${request.hash}`, objHash, { expires: Date.now() + 5 * 60e3 })
				}
			}
			
			const objFile = await fetch(AssetCache.getHashUrl(objHash, "t")).then(res => res.text())
			if(request?.hash !== this.getLayeredRequest()?.hash) { return }
			
			// Read obj file
			const lines = objFile.split("\n")
			const groups = []
			
			let vertexCounter = 1
			let group
			
			for(const line of lines) {
				if(line.startsWith("g ")) {
					const name = line.slice(2)
					
					group = { name: name, vertices: [], uvs: [], faces: [], normals: [], vertexStartIndex: vertexCounter }
					groups.push(group)
				} else if(line.startsWith("f ")) {
					const a = line.slice(2).trim().split(/ |\//g)
					
					group.faces.push(
						+a[0] - group.vertexStartIndex,
						+a[3] - group.vertexStartIndex,
						+a[6] - group.vertexStartIndex
					)
				} else if(line.startsWith("v ")) {
					const pieces = line.split(" ")
					group.vertices.push(+pieces[1], +pieces[2], +pieces[3])
					vertexCounter += 1
					
				} else if(line.startsWith("vt ")) {
					const pieces = line.split(" ")
					group.uvs.push(+pieces[1], +pieces[2])
					
				} else if(line.startsWith("vn ")) {
					const pieces = line.split(" ")
					group.normals.push(+pieces[1], +pieces[2], +pieces[3])
				}
			}
			
			// Calculate layeredMatrix for all parts
			for(const joint of this.sortedJointsArray) {
				joint.layeredMatrix.multiplyMatrices(joint.part0.layeredMatrix, joint.bakedC0)
				joint.part1.layeredMatrix.multiplyMatrices(joint.layeredMatrix, joint.bakedC1Inverse)
			}

			// Find and locate anchor
			const anchor = groups.find(x => x.name.startsWith("Handle") && x.faces.length === 36 && $.hashString(JSON.stringify([x.faces, x.uvs])) === "4734F03A")
			groups.splice(groups.indexOf(anchor), 1)
			
			const attachment = this.attachments.HatAttachment
			const scaleMod = this.getScaleMod(attachment.parent.name, "Classic", attachment.parent.rbxScaleType)
			const bakedCFrame = scalePosition(new THREE.Matrix4().makeTranslation(-0.013, -0.554, -0.657), scaleMod)
			
			const layeredAnchorMatrix = attachment.parent.layeredMatrix.clone().multiply(attachment.bakedCFrame).multiply(bakedCFrame)
			const inverseRenderMatrix = new THREE.Matrix4()
			
			for(let i = 0; i < anchor.vertices.length; i += 3) {
				inverseRenderMatrix.elements[12] += anchor.vertices[i]
				inverseRenderMatrix.elements[13] += anchor.vertices[i + 1]
				inverseRenderMatrix.elements[14] += anchor.vertices[i + 2]
			}
			
			inverseRenderMatrix.elements[12] /= anchor.vertices.length / 3
			inverseRenderMatrix.elements[13] /= anchor.vertices.length / 3
			inverseRenderMatrix.elements[14] /= anchor.vertices.length / 3
			
			inverseRenderMatrix.invert().premultiply(layeredAnchorMatrix)
			
			const transform = new THREE.Matrix4()
			const vertex = new THREE.Matrix4()
			
			// Resolve bodyparts
			const uvBoxes = [
				[0, 0, 1, 1],
				[0, 752 / 1024, 388 / 1024, 272 / 1024],
				[240 / 1024, 456 / 1024, 256 / 1024, 296 / 1024],
				[496 / 1024, 740 / 1024, 264 / 1024, 284 / 1024],
				[760 / 1024, 740 / 1024, 264 / 1024, 284 / 1024],
				[496 / 1024, 456 / 1024, 264 / 1024, 284 / 1024],
				[760 / 1024, 456 / 1024, 264 / 1024, 284 / 1024],
			]
			
			const getGroupMatch = (obj, group, box) => {
				const mesh = obj.rbxMesh.firstLod || obj.rbxMesh
				
				if(group.uvs.length !== mesh.uvs.length) {
					return null
				}
				
				const [x0, y0, width, height] = box
				
				for(let i = 0; i < group.uvs.length; i += 2) {
					const u = (group.uvs[i] - x0) / width
					const v = (group.uvs[i + 1] - y0) / height
					
					const u2 = mesh.uvs[i]
					const v2 = mesh.uvs[i + 1]
					
					if(Math.abs(u2 - u) > 0.01 || Math.abs(v2 - v) > 0.01) {
						return null
					}
				}
				
				return true
			}
			
			const getGroupMatchPartial = (obj, group, box) => {
				const mesh = obj.rbxMesh.firstLod || obj.rbxMesh
				
				if(group.uvs.length > mesh.uvs.length) {
					return null
				}
				
				const [x0, y0, width, height] = box
				const mapping = []
				
				let search = 0
				
				outer:
				for(let i = 0; i < group.uvs.length; i += 2) {
					const u = (group.uvs[i] - x0) / width
					const v = (group.uvs[i + 1] - y0) / height
					
					while(search < mesh.uvs.length) {
						const u2 = mesh.uvs[search]
						const v2 = mesh.uvs[search + 1]
						
						search += 2
						
						if(Math.abs(u2 - u) < 0.01 && Math.abs(v2 - v) < 0.01) {
							mapping.push(search / 2 - 1)
							continue outer
						}
					}
					
					return null
				}
				
				return mapping
			}
			
			const playerGroups = groups.filter(x => x.name.startsWith("Player")).sort((a, b) => b.uvs.length - a.uvs.length)
			let numEmptyPartsAccepted = 15 - playerGroups.length
			
			for(const part of Object.values(this.parts)) {
				if(!part.isMesh || !part.rbxMesh) { continue }
				if(invalidLayeredAssetIds[part.rbxBodypart.asset?.id]) { continue }
				
				const matches = []
				
				for(const group of playerGroups) {
					for(const box of uvBoxes) {
						const mapping = getGroupMatchPartial(part, group, box)
						
						if(mapping) {
							matches.push({ group, box, mapping })
						}
					}
				}
				
				if(matches.length === 0) {
					if(numEmptyPartsAccepted > 0) {
						// If the whole part was hidden by HSR, it doesn't get added into the render
						numEmptyPartsAccepted -= 1
					} else {
						console.log("Failed to find match")
						
						if(IS_DEV_MODE) {
							console.log(part.name, part.rbxMesh)
							console.log(matches)
							console.log(groups)
							
							// setTimeout(() => alert("Failed to find match for bodypart"), 0)
						}
					}
					
					part.rbxLayered = { wrapTarget: part.rbxBodypart.wrapTarget || part.rbxDefaultBodypart.wrapTarget }
					
					part.geometry.deleteAttribute("position")
					part.geometry.deleteAttribute("normal")
					part.geometry.deleteAttribute("uv")
					part.geometry.setIndex(null)
					continue
				}
				
				if(matches.length >= 2) {
					// If more than two match, somehow choose one of them
					// My best idea atm is just to compare distance from
					// vertices to where the part should be
					
					const px = part.layeredMatrix.elements[12]
					const py = part.layeredMatrix.elements[13]
					const pz = part.layeredMatrix.elements[14]
					
					let closestDistance = Infinity
					let closest
					
					for(const match of matches) {
						const step = Math.floor(group.vertices.length / 3 / 50) * 3
						let x = 0, y = 0, z = 0, count = 0
						
						for(let i = 0; i < group.vertices.length; i += step) {
							x += group.vertices[i]
							y += group.vertices[i + 1]
							z += group.vertices[i + 2]
							count += 1
						}
						
						const distance = (x / count - px) ** 2 + (x / count - py) ** 2 + (x / count - pz) ** 2
						
						if(distance < closestDistance) {
							closestDistance = distance
							closest = match
						}
					}
					
					matches.splice(0, matches.length, closest)
				}
				
				const { group, mapping } = matches[0]
				playerGroups.splice(playerGroups.indexOf(group), 1) // only match each group once
				
				const mesh = part.rbxMesh.firstLod || part.rbxMesh
				
				// apply transformed vertices and normals
				transform.copy(part.layeredMatrix).invert().multiply(inverseRenderMatrix)
				
				// Order of vertices matters for bones/skinnedmesh stuff, so update vertices in place rather than just replacing them all
				const vertices = mesh.vertices.slice()
				const normals = mesh.normals.slice()
				
				for(let mapIndex = 0; mapIndex < mapping.length; mapIndex++) {
					const groupIndex = mapIndex * 3
					const meshIndex = mapping[mapIndex] * 3
					
					vertex.makeTranslation(
						group.vertices[groupIndex + 0],
						group.vertices[groupIndex + 1],
						group.vertices[groupIndex + 2]
					).premultiply(transform)
					
					vertices[meshIndex + 0] = vertex.elements[12] / part.rbxScale[0]
					vertices[meshIndex + 1] = vertex.elements[13] / part.rbxScale[1]
					vertices[meshIndex + 2] = vertex.elements[14] / part.rbxScale[2]
					
					vertex.makeTranslation(
						group.normals[groupIndex + 0] - transform.elements[12],
						group.normals[groupIndex + 1] - transform.elements[13],
						group.normals[groupIndex + 2] - transform.elements[14]
					).premultiply(transform)
					
					normals[meshIndex + 0] = vertex.elements[12]
					normals[meshIndex + 1] = vertex.elements[13]
					normals[meshIndex + 2] = vertex.elements[14]
				}
				
				// Order of faces doesn't seem to matter though, so we can just directly use the group faces as long as we map the vertex indices
				const faces = Uint32Array.from(group.faces)
				
				for(let i = 0; i < faces.length; i++) {
					faces[i] = mapping[faces[i]]
				}
				//
				
				part.geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))
				part.geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3))
				part.geometry.setIndex(new THREE.BufferAttribute(faces, 1))
				
				part.rbxLayered = { wrapTarget: part.rbxBodypart.wrapTarget || part.rbxDefaultBodypart.wrapTarget }
			}
			
			// Resolve accessories
			const handleGroups = groups.filter(x => x.name.startsWith("Handle") && x !== anchor).sort((a, b) => b.uvs.length - a.uvs.length)
			let numEmptyAccessoriesAccepted = request.accessories.length - handleGroups.length
			
			const accessoriesProcessed = {}
			
			const processAccessory = acc => {
				const matches = []
				const obj = acc.obj
					
				for(const group of handleGroups) {
					if(getGroupMatch(obj, group, uvBoxes[0])) {
						matches.push({ group })
					}
				}
				
				if(matches.length !== 1) {
					if(matches.length === 0 && numEmptyAccessoriesAccepted > 0) {
						numEmptyAccessoriesAccepted -= 1
					} else {
						console.log("Could not resolve asset in render")
						
						if(IS_DEV_MODE) {
							console.log(acc.asset.id, obj.rbxMesh)
							console.log(matches)
							console.log(groups)
							console.log(request)
							setTimeout(() => alert("Could not resolve asset in render"), 0)
						}
					}
					
					return false
				}
				
				const { group } = matches[0]
				handleGroups.splice(handleGroups.indexOf(group), 1) // only match each group once
				
				const mesh = obj.rbxMesh.firstLod || obj.rbxMesh
				const result = {}
				
				// apply transformed vertices and normals
				const vertices = mesh.vertices.slice()
				const normals = mesh.normals.slice()
				
				obj.layeredMatrix.multiplyMatrices(acc.parent.layeredMatrix, acc.bakedCFrame)
				transform.copy(obj.layeredMatrix).invert().multiply(inverseRenderMatrix)
				
				for(let i = 0; i < vertices.length; i += 3) {
					vertex.makeTranslation(
						group.vertices[i + 0],
						group.vertices[i + 1],
						group.vertices[i + 2]
					).premultiply(transform)
					
					vertices[i + 0] = vertex.elements[12]
					vertices[i + 1] = vertex.elements[13]
					vertices[i + 2] = vertex.elements[14]
					
					/*
					// Unapply skinning (doesnt work)
					const p = {
						x: vertices[i + 0] / obj.scale.x,
						y: vertices[i + 1] / obj.scale.y,
						z: vertices[i + 2] / obj.scale.z
					}
					
					const x = { x: 0, y: 0, z: 0 }
					const y = { x: 0, y: 0, z: 0 }
					const z = { x: 0, y: 0, z: 0 }
					
					const skinIndex = i / 3 * 4
					
					for(let j = 0; j < 4; j++) {
						const weight = mesh.skinWeights[skinIndex + j]
						
						if(weight !== 0) {
							const boneIndex = mesh.skinIndices[skinIndex + j]
							const bone = obj.rbxBones[boneIndex]
							
							tempMatrix.multiplyMatrices(bone.matrixWorld, bone.inverse)
							
							const e = tempMatrix.elements
							
							x.x += e[0] * weight
							x.y += e[4] * weight
							x.z += e[8] * weight
							p.x -= e[12] * weight
							
							y.x += e[1] * weight
							y.y += e[5] * weight
							y.z += e[9] * weight
							p.y -= e[13] * weight
							
							z.x += e[2] * weight
							z.y += e[6] * weight
							z.z += e[10] * weight
							p.z -= e[14] * weight
						}
					}
					
					const det = x.z * (y.x * z.y - y.y * z.x) + x.y * (y.z * z.x - y.x * z.z) + x.x * (y.y * z.z - y.z * z.y)
					
					if(det === 0) {
						console.log("det=0")
						det = 1e-10
					}
					
					vertices[i + 0] = (p.z * (x.y * y.z - x.z * y.y) + p.y * (x.z * z.y - x.y * z.z) + p.x * (y.y * z.z - y.z * z.y)) / det
					vertices[i + 1] = (p.z * (x.z * y.x - x.x * y.z) + p.y * (x.x * z.z - x.z * z.x) + p.x * (y.z * z.x - y.x * z.z)) / det
					vertices[i + 2] = (p.z * (x.x * y.y - x.y * y.x) + p.y * (x.y * z.x - x.x * z.y) + p.x * (y.x * z.y - y.y * z.x)) / det
					*/
					
					vertex.makeTranslation(
						group.normals[i + 0] - transform.elements[12],
						group.normals[i + 1] - transform.elements[13],
						group.normals[i + 2] - transform.elements[14]
					).premultiply(transform)
					
					normals[i + 0] = vertex.elements[12]
					normals[i + 1] = vertex.elements[13]
					normals[i + 2] = vertex.elements[14]
				}
				
				result.vertices = new THREE.BufferAttribute(vertices, 3)
				result.normals = new THREE.BufferAttribute(normals, 3)
				
				// disable hidden faces
				// if(group.faces.length < mesh.faces.length) {
					const faces = mesh.faces.slice()
					let search = 0
					
					outer:
					for(let i = 0; i < group.faces.length; i += 3) {
						const a = group.faces[i + 0]
						const b = group.faces[i + 1]
						const c = group.faces[i + 2]
						
						while(true) {
							if(search >= faces.length) {
								break outer
							}
							
							if(faces[search + 0] === a && faces[search + 1] === b && faces[search + 2] === c) {
								search += 3
								break
							}
							
							faces[search + 0] = -1
							faces[search + 1] = -1
							faces[search + 2] = -1
							search += 3
						}
					}
					
					for(; search < faces.length; search++) {
						faces[search] = -1
					}
					
					result.faces = new THREE.BufferAttribute(faces, 1)
				// }
					
				return result
			}
			
			for(const acc of Object.values(this.accessories)) {
				if(!acc.obj.rbxMesh || !request.accessories.find(x => x.id === acc.asset.id)) { continue }
				let result = accessoriesProcessed[acc.asset.id]
				
				if(result == null) {
					result = accessoriesProcessed[acc.asset.id] = processAccessory(acc)
				}
				
				if(result) {
					if(result.vertices) {
						acc.obj.geometry.setAttribute("position", result.vertices)
						acc.obj.geometry.setAttribute("normal", result.normals)
					}
					
					if(result.faces) {
						acc.obj.geometry.setIndex(result.faces)
					}
				} else {
					acc.obj.geometry.deleteAttribute("position")
					acc.obj.geometry.deleteAttribute("normal")
					acc.obj.geometry.deleteAttribute("uv")
					acc.obj.geometry.setIndex(null)
				}
				
				const mainBone = acc.obj.rbxBones.filter(x => this.parts[x.name]).reduce((a, b) => (a.count > b.count ? a : b))
				
				acc.obj.rbxLayered = {
					wrapLayer: acc.wrapLayer,
					rbxScaleModTarget: mainBone ? mainBone.name : acc.obj.parent?.name ?? null,
					rbxScaleMod: mainBone ? this.parts[mainBone.name].rbxScaleMod.clone() : acc.obj.parent.rbxScaleMod?.clone() ?? null
				}
			}
			
			return true
		}
	}

	return {
		Avatar,
		
		LocalAssets,
		R6BodyPartNames,
		R15BodyPartNames,

		CFrameToMatrix4,
		applyMesh
	}
})()

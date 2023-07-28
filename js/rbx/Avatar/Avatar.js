"use strict"

const RBXAvatar = (() => {
	const Vector3 = THREE.Vector3
	
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
		
		if(obj instanceof THREE.SkinnedMesh) {
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
				
				for(const meshBone of baseMesh.bones) {
					const bone = {
						name: meshBone.name,
						matrixWorld: new THREE.Matrix4(),
						inverse: new THREE.Matrix4()
					}
					
					bones.push(bone)
				}
				
				obj.skeleton = new THREE.Skeleton(bones, bones.map(x => x.inverse))
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
	
	const requestsMatch = (request, otherRequest) => {
		let matches = false
		
		if(request && otherRequest) {
			matches = true
			
			outer:
			for(const [key, dict] of Object.entries(request)) {
				const lastDict = otherRequest[key]
				
				if(Object.keys(dict).length !== Object.keys(lastDict).length) {
					matches = false
					break
				}
				
				for(const [key, value] of Object.entries(dict)) {
					if(lastDict[key] !== value) {
						matches = false
						break outer
					}
				}
			}
		} else if(!request && !otherRequest) {
			matches = true
		}
		
		return matches
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
	
	const inversePoseMatrix = new THREE.Matrix4()
	const inverseMatrix = new THREE.Matrix4()
	
	let compositeRenderer
	
	try {
		for(let i = localStorage.length; i--;) {
			const key = localStorage.key(i)
			
			if(key.startsWith("btrLayeredCache-")) {
				try {
					const json = JSON.parse(localStorage.getItem(key))
					
					if(Date.now() > json.expires) {
						localStorage.removeItem(key)
					}
				} catch(ex) {
					localStorage.removeItem(key)
				}
			}
		}
	} catch(ex) {}
	
	const invalidRenderMetaAssetIds = {}
	const invalidRenderAssetIds = {}
	
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
			
			sources.face.defaultImage = getURL("res/previewer/face.png")
			
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

			Object.values(this.composites).forEach(comp => {
				loaders.push(...comp.loaders)
			})
			
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
				const transform = this.animator.getJointTransform(joint.part1.name)
				
				if(transform) {
					joint.transform.compose(transform.position, transform.quaternion, tempVector.set(1, 1, 1))
				} else {
					joint.transform.identity()
				}
				
				if(this.playerType === "R15" && joint.part1.name === "LowerTorso") {
					scalePosition(joint.transform, tempVector.setScalar(this.hipHeight / 2))
				}
				
				joint.part1.matrixNoScale
					.multiplyMatrices(joint.part0.matrixNoScale, joint.bakedC0)
					.multiply(joint.transform)
					.multiply(tempMatrix.copy(joint.bakedC1).invert())
				
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
			if(this.playerType === "R15" && SETTINGS.get("general.previewLayeredClothing")) {
				this._refreshLayeredClothing()
			}
			
			// Update bones
			const updateBones = (obj, acc) => {
				if(acc && obj.rbxLayered?.wrapLayer) {
					const scale = obj.rbxScaleMod.clone().divide(obj.rbxLayered.scaleMod)
					
					for(const joint of this.sortedJointsArray) {
						joint.part1.skinnedMatrix
							.multiplyMatrices(joint.part0.skinnedMatrix, joint.bakedC0)
							.multiply(tempMatrix.copy(joint.bakedC1).invert())
					}
					
					acc.obj.skinnedMatrix.multiplyMatrices(acc.parent.skinnedMatrix, acc.bakedCFrame)
					
					inversePoseMatrix.copy(obj.skinnedMatrix).invert()
					inverseMatrix.copy(obj.matrix).invert().multiply(obj.matrixNoScale).multiply(tempMatrix.copy(obj.matrixNoScale).invert())
					
					for(const bone of obj.rbxBones) {
						const ref = bone.name.endsWith("_end") && this.parts[bone.name.slice(0, -4)] || this.parts[bone.name] || obj
						
						bone.matrixWorld.multiplyMatrices(inverseMatrix, ref.matrixNoScale).scale(scale)
						bone.inverse.multiplyMatrices(inversePoseMatrix, ref.skinnedMatrix).invert()
					}
					
					return
				}
				
				for(const joint of this.sortedJointsArray) {
					joint.part1.skinnedMatrix
						.multiplyMatrices(joint.part0.skinnedMatrix, scalePosition(tempMatrix.copy(joint.C0), obj.rbxScaleMod))
						.multiply(joint.transform)
						.multiply(scalePosition(tempMatrix.copy(joint.C1).invert(), obj.rbxScaleMod))
				}
				
				if(acc) {
					acc.obj.skinnedMatrix.multiplyMatrices(acc.parent.skinnedMatrix, acc.bakedCFrame)
				}
				
				inversePoseMatrix.copy(obj.rbxPoseMatrix).invert()
				inverseMatrix.copy(obj.matrix).invert()
					.multiply(obj.matrixNoScale)
					.multiply(tempMatrix.copy(obj.skinnedMatrix).invert())
				
				for(const bone of obj.rbxBones) {
					const ref = bone.name.endsWith("_end") && this.parts[bone.name.slice(0, -4)] || this.parts[bone.name] || obj
					
					bone.matrixWorld.multiplyMatrices(inverseMatrix, ref.skinnedMatrix).scale(obj.rbxScaleMod)
					bone.inverse.multiplyMatrices(inversePoseMatrix, ref.rbxPoseMatrix).invert()
				}
			}
			
			for(const part of Object.values(this.parts)) {
				if(part.rbxBones) {
					updateBones(part)
				}
			}
			
			for(const acc of this.accessories) {
				if(acc.parent && acc.obj.rbxBones) {
					updateBones(acc.obj, acc)
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
					meshId: tree.meshId
				}
				
				obj.rbxOrigWrapTarget = tree.wrapTarget
				obj.rbxOrigSize = tree.origSize
				
				obj.rbxScaleMod = new Vector3(1, 1, 1)
				obj.matrixNoScale = new THREE.Matrix4()
				obj.rbxPoseMatrix = new THREE.Matrix4()
				obj.skinnedMatrix = new THREE.Matrix4()
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
						
						transform: new THREE.Matrix4(),
						
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
				
				const loadState = asset.load(this.playerType)
				
				if(loadState.loaded) {
					asset.lastIndex = assets.length
					assets.push(asset)
				}
			}

			assets.sort((a, b) => (a.priority === b.priority ? a.lastIndex - b.lastIndex : a.priority - b.priority))
			
			for(const asset of assets) {
				for(const bodypart of asset.bodyparts) {
					if(!bodypart.playerType || bodypart.playerType === this.playerType) {
						const previous = bodypartOverride[bodypart.target]
						
						if(previous?.asset === asset && bodypart.target === "Head" && !bodypart.playerType) {
							// prioritize meshpart (playerType=R15) heads over specialmesh (playerType=null)
							continue
						}
						
						bodypartOverride[bodypart.target] = bodypart
					}
				}
				
				for(const cloth of asset.clothing) {
					clothingOverride[cloth.target] = cloth.texId
				}
				
				if(asset.accessories.length) {
					accessories[asset.id] = asset.accessories[0]
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
				joint.C1.copy(overrideC1?.cframe || joint.origC1)
				
				joint.part1.rbxPoseMatrix
					.multiplyMatrices(joint.part0.rbxPoseMatrix, joint.C0)
					.multiply(tempMatrix.copy(joint.C1).invert())
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
					clearGeometry(part)
					
					if(meshId) {
						AssetCache.loadMesh(true, meshId, mesh => {
							if(part.rbxMeshId === meshId) {
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
					scalePosition(joint.bakedC1.copy(joint.C1), joint.part1.rbxScaleMod)
				}
				
				// Scale attachments
				for(const att of Object.values(this.attachments)) {
					scalePosition(att.bakedCFrame.copy(att.cframe), att.parent.rbxScaleMod)
				}
				
				// Scale rootjoint so that the lowest hip joint aligns with bottom of rootpart
				if(this.playerType === "R15") {
					const rootJoint = this.joints.Root
					const rightHip = this.joints.RightHip
					const leftHip = this.joints.LeftHip
					
					rootJoint.bakedC0.elements[13] =
						rootJoint.bakedC1.elements[13]
						- Math.min(rightHip.bakedC0.elements[13], leftHip.bakedC0.elements[13])
						- Math.max(0.05, rootJoint.part0.rbxSize[1]) / 2
				}
			}

			updateSizes()

			// HipHeight and leg stretching
			if(this.playerType === "R15") {
				let leftLegSize =
					this.joints.LeftHip.bakedC1.elements[13]
					- this.joints.LeftKnee.bakedC0.elements[13]
					+ this.joints.LeftKnee.bakedC1.elements[13]
					- this.joints.LeftAnkle.bakedC0.elements[13]
					+ this.joints.LeftAnkle.bakedC1.elements[13]
					+ Math.max(0.05, this.parts.LeftFoot.rbxSize[1]) / 2
				
				let rightLegSize =
					this.joints.RightHip.bakedC1.elements[13]
					- this.joints.RightKnee.bakedC0.elements[13]
					+ this.joints.RightKnee.bakedC1.elements[13]
					- this.joints.RightAnkle.bakedC0.elements[13]
					+ this.joints.RightAnkle.bakedC1.elements[13]
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
					-this.joints.Root.bakedC0.elements[13]
					+ this.joints.Root.bakedC1.elements[13]
					- Math.max(0.05, this.parts.HumanoidRootPart.rbxSize[1]) / 2
				
				let min = rootHeight - this.joints.LeftHip.bakedC0.elements[13] + leftLegSize
				let max = rootHeight - this.joints.RightHip.bakedC0.elements[13] + rightLegSize
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
					obj.bindMode = "detached"
					obj.isSkinnedMesh = false
					obj.matrixAutoUpdate = false
					obj.frustumCulled = false
					obj.visible = false
					obj.castShadow = true
					
					obj.rbxScaleMod = new THREE.Vector3(1, 1, 1)
					obj.matrixNoScale = new THREE.Matrix4()
					obj.rbxPoseMatrix = new THREE.Matrix4()
					obj.skinnedMatrix = new THREE.Matrix4()
					
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
					this.getScaleMod(parent.name, acc.scaleType, parent.rbxScaleType, acc.obj.rbxScaleMod)
					acc.obj.scale.set(...(acc.scale || [1, 1, 1])).multiply(acc.obj.rbxScaleMod)
					
					// Position
					if(attachment) {
						acc.bakedCFrame.copy(attachment.bakedCFrame).multiply(
							scalePosition(tempMatrix.copy(acc.attCFrame), acc.obj.rbxScaleMod)
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
					
					acc.obj.rbxPoseMatrix.multiplyMatrices(parent.rbxPoseMatrix, acc.bakedCFrame)
					
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
			const accessories = {}
			let request = null
			
			for(const acc of this.accessories) {
				if(acc.obj.rbxMesh && acc.wrapLayer) {
					accessories[acc.asset.id] = acc
				}
			}
			
			if(Object.values(accessories).length > 0) {
				const scales = { ...this.scales }
				const bodyColors = {}
				const bodyparts = {}
				
				for(const [name, color] of Object.entries(this.bodyColors)) {
					bodyColors[name + "Color"] = color
				}
				
				for(const part of Object.values(this.parts)) {
					if(part.rbxMesh && part.rbxBodypart.asset) {
						bodyparts[part.name] = part.rbxBodypart
					}
				}
				
				request = { scales, accessories, bodyColors, bodyparts }
			}
			
			return request
		}
		
		_refreshLayeredClothing() {
			if(this.layeredRequestState === "fetching") { return }
			const request = this.getLayeredRequest()
			
			if(!requestsMatch(request, this.layeredFinishedRequest)) {
				if(!request) {
					this.layeredRequestState = null
					this.layeredFinishedRequest = request
					
					for(const part of Object.values(this.parts)) {
						if(part.rbxLayered) {
							applyMesh(part, part.rbxMesh)
						}
					}
					
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
			const anchorAssetId = 11187668197
			
			const body = {
				avatarDefinition: {
					assets: [
						{ id: anchorAssetId } // anchor
					],
					bodyColors: request.bodyColors,
					scales: request.scales,
					playerAvatarType: {
						playerAvatarType: "R15"
					}
				},
				thumbnailConfig: {
					size: "420x420",
					thumbnailId: 3,
					thumbnailType: "3d"
				}
			}
		
			for(const acc of Object.values(request.accessories)) {
				if(!body.avatarDefinition.assets.find(x => x.id === acc.asset.id) && !invalidRenderAssetIds[acc.asset.id]) {
					body.avatarDefinition.assets.push({ id: acc.asset.id, meta: !invalidRenderMetaAssetIds[acc.asset.id] ? acc.asset.meta : undefined })
				}
			}
			
			for(const bp of Object.values(request.bodyparts)) {
				if(!body.avatarDefinition.assets.find(x => x.id === bp.asset.id) && !invalidRenderAssetIds[bp.asset.id]) {
					body.avatarDefinition.assets.push({ id: bp.asset.id })
				}
			}
			
			body.avatarDefinition.assets.sort((a, b) => a.id - b.id) // sort assets for hashing
			
			const bodyHash = $.hashString(JSON.stringify(body))
			let objHash
			
			try {
				objHash = JSON.parse(localStorage.getItem(`btrLayeredCache-${bodyHash}`)).objHash
			} catch(ex) {}
			
			if(!objHash) {
				const json = await RobloxApi.avatar.renderAvatar(body)
				if(!requestsMatch(request, this.getLayeredRequest())) { return }
				
				if(json.errors) {
					for(const error of json.errors) {
						if(error.code === 2) {
							const assetId = parseInt(error.field?.match(/AssetId: (\d+)/)?.[1], 10)
							if(!Number.isSafeInteger(assetId)) { continue }
							
							if(error.field?.startsWith("InvalidAsset ")) {
								invalidRenderAssetIds[assetId] = true
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
				if(!requestsMatch(request, this.getLayeredRequest())) { return }
				
				objHash = render.obj
				
				if(objHash) {
					try {
						localStorage.setItem(`btrLayeredCache-${bodyHash}`, JSON.stringify({ expires: Date.now() + 5 * 60e3, objHash: objHash }))
					} catch(ex) {}
				}
			}
			
			const obj = await fetch(AssetCache.getHashUrl(objHash)).then(res => res.text())
			if(!requestsMatch(request, this.getLayeredRequest())) { return }
			
			// Read obj file
			const lines = obj.split("\n")
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
			if(!this.parts.HumanoidRootPart.layeredMatrix) {
				this.parts.HumanoidRootPart.layeredMatrix = new THREE.Matrix4()
			}
			
			for(const joint of this.sortedJointsArray) {
				if(!joint.part1.layeredMatrix) {
					joint.part1.layeredMatrix = new THREE.Matrix4()
				}
				
				joint.part1.layeredMatrix.multiplyMatrices(joint.part0.layeredMatrix, joint.bakedC0).multiply(tempMatrix.copy(joint.bakedC1).invert())
			}

			// Find and locate anchor
			const anchor = groups.find(x => x.name.startsWith("Handle") && x.faces.length === 36 && $.hashString(JSON.stringify([x.faces, x.uvs])) === "4734F03A")
			
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
				
				if(group.uvs.length > mesh.uvs.length) {
					return null
				}
				
				const [x0, y0, width, height] = box
				const result = []
				let search = 0
				
				for(let i = 0; i < group.uvs.length; i += 2) {
					const u = (group.uvs[i] - x0) / width
					const v = (group.uvs[i + 1] - y0) / height
					
					while(true) {
						if(search >= mesh.uvs.length) {
							return null
						}
						
						const u2 = mesh.uvs[search]
						const v2 = mesh.uvs[search + 1]
						
						search += 2
						
						if(Math.abs(u2 - u) < 0.01 && Math.abs(v2 - v) < 0.01) {
							break
						}
					}
					
					result.push(search / 2 - 1)
				}
					
				return result
			}
			
			const playerGroups = groups.filter(x => x.name.startsWith("Player")).sort((a, b) => b.uvs.length - a.uvs.length)
			let numEmptyPartsAccepted = 15 - playerGroups.length
			
			for(const part of Object.values(this.parts)) {
				if(!part.isMesh) { continue }
				const matches = []
				
				for(const group of playerGroups) {
					for(const box of uvBoxes) {
						const match = getGroupMatch(part, group, box)
						
						if(match) {
							matches.push({ group, box, match })
						}
					}
				}
				
				if(matches.length !== 1) {
					if(matches.length === 0 && numEmptyPartsAccepted > 0) {
						// If the whole part was hidden by HSR, it doesn't get added into the render
						numEmptyPartsAccepted -= 1
						
						part.geometry.deleteAttribute("position")
						part.geometry.deleteAttribute("normal")
						part.geometry.deleteAttribute("uv")
						part.geometry.setIndex(null)
						
						part.rbxLayered = { wrapTarget: part.rbxBodypart.wrapTarget || part.rbxOrigWrapTarget }
						
					} else {
						console.log("Failed to find match")
						console.log(part.name, part.rbxMesh)
						console.log(matches)
						console.log(groups)
						
						if(IS_DEV_MODE) {
							setTimeout(() => alert("Failed to find match for bodypart"), 0)
						}
						
						if(part.rbxLayered) {
							applyMesh(part, part.rbxMesh)
						}
					}
					
					continue
				}
				
				const { group, box: [x0, y0, width, height] } = matches[0]
				playerGroups.splice(playerGroups.indexOf(group), 1) // only match each group once
				
				const vertices = new Float32Array(group.vertices)
				const normals = new Float32Array(group.normals)
				const uvs = new Float32Array(group.uvs)
				const faces = new Uint32Array(group.faces)
				
				transform.copy(part.layeredMatrix).invert().multiply(inverseRenderMatrix)
				
				for(let i = 0; i < vertices.length; i += 3) {
					vertex.makeTranslation(
						vertices[i + 0],
						vertices[i + 1],
						vertices[i + 2]
					).premultiply(transform)
					
					vertices[i + 0] = vertex.elements[12] / part.rbxScale[0]
					vertices[i + 1] = vertex.elements[13] / part.rbxScale[1]
					vertices[i + 2] = vertex.elements[14] / part.rbxScale[2]
				}
				
				for(let i = 0; i < uvs.length; i += 2) {
					uvs[i] = (uvs[i] - x0) / width
					uvs[i + 1] = (uvs[i + 1] - y0) / height
				}
				
				part.geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))
				part.geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3))
				part.geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2))
				part.geometry.setIndex(new THREE.BufferAttribute(faces, 1))
				
				part.rbxLayered = { wrapTarget: part.rbxBodypart.wrapTarget || part.rbxOrigWrapTarget }
			}
			
			// Resolve accessories
			const handleGroups = groups.filter(x => x.name.startsWith("Handle") && x !== anchor).sort((a, b) => b.uvs.length - a.uvs.length)
			let numEmptyAccessoriesAccepted = Object.values(request.accessories).length - handleGroups.length
			
			const emptyAccessories = []
			
			for(const acc of Object.values(this.accessories)) {
				if(!request.accessories[acc.asset.id]) { continue } // in case we have multiple copies of an asset
				const matches = []
				
				for(const group of handleGroups) {
					const match = getGroupMatch(acc.obj, group, uvBoxes[0])
					
					if(match) {
						matches.push({ group, match })
					}
				}
				
				if(matches.length !== 1) {
					if(matches.length === 0 && numEmptyAccessoriesAccepted > 0) {
						// If the whole accessory was hidden by HSR, it doesn't get added into the render
						
						if(!emptyAccessories.includes(acc.asset.id)) {
							emptyAccessories.push(acc.asset.id)
							numEmptyAccessoriesAccepted -= 1
						}
						
					} else {
						console.log("Could not resolve asset in render")
						console.log(acc.asset.id, acc.obj.rbxMesh)
						console.log(matches)
						console.log(groups)
						
						if(IS_DEV_MODE) {
							setTimeout(() => alert("Could not resolve asset in render"), 0)
						}
					}
					
					acc.obj.geometry.deleteAttribute("position")
					acc.obj.geometry.deleteAttribute("normal")
					acc.obj.geometry.deleteAttribute("uv")
					acc.obj.geometry.setIndex(null)
					
					continue
				}
				
				const { group, match } = matches[0]
				const mesh = acc.obj.rbxMesh.firstLod || acc.obj.rbxMesh
				
				const vertices = mesh.vertices.slice()
				const normals = mesh.normals.slice()
				const faces = mesh.faces.slice()
				
				const layeredAccMatrix = acc.parent.layeredMatrix.clone().multiply(acc.bakedCFrame)
				transform.copy(layeredAccMatrix).invert().multiply(inverseRenderMatrix)
				
				// apply transformed vertices and normals
				for(let i = 0, len = group.vertices.length / 3; i < len; i++) {
					const index = match[i]
					
					vertex.makeTranslation(
						group.vertices[i * 3 + 0],
						group.vertices[i * 3 + 1],
						group.vertices[i * 3 + 2]
					).premultiply(transform)
					
					vertices[index * 3 + 0] = vertex.elements[12]
					vertices[index * 3 + 1] = vertex.elements[13]
					vertices[index * 3 + 2] = vertex.elements[14]
					
					vertex.makeTranslation(
						group.normals[i * 3 + 0] - transform.elements[12],
						group.normals[i * 3 + 1] - transform.elements[13],
						group.normals[i * 3 + 2] - transform.elements[14]
					).premultiply(transform)
					
					normals[index * 3 + 0] = vertex.elements[12]
					normals[index * 3 + 1] = vertex.elements[13]
					normals[index * 3 + 2] = vertex.elements[14]
				}
				
				// disable hidden faces
				let search = 0
				
				outer:
				for(let i = 0; i < group.faces.length; i += 3) {
					const a = match[group.faces[i + 0]]
					const b = match[group.faces[i + 1]]
					const c = match[group.faces[i + 2]]
					
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
				
				acc.obj.geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))
				acc.obj.geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3))
				acc.obj.geometry.setIndex(new THREE.BufferAttribute(faces, 1))
				
				acc.obj.rbxLayered = { wrapLayer: acc.wrapLayer, scaleMod: acc.obj.rbxScaleMod.clone() }
			}
			
			return true
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

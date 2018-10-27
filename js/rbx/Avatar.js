"use strict"

const RBXAvatar = (() => {
	const Vector3 = THREE.Vector3

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

	function InvertCFrame(cframe) { return new THREE.Matrix4().getInverse(cframe) }
	
	function solidColorDataURL(r, g, b) {
		return "data:image/gif;base64,R0lGODlhAQABAPAA"
			+ btoa(String.fromCharCode(0, r, g, b, 255, 255))
			+ "/yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="
	}

	const emptySrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII="
	const graySrc = solidColorDataURL(163, 162, 165)

	function setImageSource(img, src) {
		src = src || emptySrc
		if(img.src !== src) {
			img.src = src
			if(img.updateListeners) {
				img.updateListeners.forEach(fn => fn())
			}
		}
	}

	function createImage() {
		const img = new Image()
		img.src = emptySrc
		img.crossOrigin = "anonymous"
		return img
	}

	function createTexture(img) {
		if(!img) { img = createImage() }

		const texture = new THREE.Texture(img)
		texture.minFilter = THREE.LinearFilter

		if(img instanceof Image) {
			img.addEventListener("load", () => texture.needsUpdate = true, false)

			img.updateListeners = img.updateListeners || []
			img.updateListeners.push(() => texture.needsUpdate = true)
		}

		return texture
	}

	function mergeTexture(width, height, ...images) {
		const canvas = document.createElement("canvas")
		const ctx = canvas.getContext("2d")
		canvas.width = width
		canvas.height = height

		const texture = new THREE.Texture(canvas)
		texture.minFilter = THREE.LinearFilter

		const stack = []

		function updateFinal() {
			ctx.clearRect(0, 0, canvas.width, canvas.height)

			stack.forEach(img => {
				if(img instanceof HTMLCanvasElement || img.src !== "" && img.src !== emptySrc) {
					ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
				}
			})

			texture.needsUpdate = true
		}

		images.forEach(img => {
			stack.push(img)

			if(img instanceof Image) {
				img.addEventListener("load", updateFinal, false)
				img.updateListeners = img.updateListeners || []
				img.updateListeners.push(updateFinal)
			} else if(img instanceof HTMLCanvasElement) {
				img.addEventListener("compositeupdate", updateFinal, false)
			}
		})

		updateFinal()
		return texture
	}

	const R6BodyPartNames = ["Torso", "Left Arm", "Right Arm", "Left Leg", "Right Leg"]
	const R15BodyPartNames = [
		"LeftFoot", "LeftHand", "LeftLowerArm", "LeftLowerLeg", "LeftUpperArm", "LeftUpperLeg", "LowerTorso",
		"RightFoot", "RightHand", "RightLowerArm", "RightLowerLeg", "RightUpperArm", "RightUpperLeg", "UpperTorso"
	]

	const HeadMeshes = {
		6340170: "headA", 6340101: "headB", 6340258: "headC", 6340192: "headD", 8330576: "headE", 6340161: "headF",
		8330389: "headG", 6340208: "headH", 6340141: "headI", 6340133: "headJ", 8330578: "headK", 6340269: "headL",
		6340154: "headM", 6340198: "headN", 6340213: "headO", 6340227: "headP"
	}

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

	const AvatarRigs = {
		loaded: false,
		R6Tree: null,
		R15Tree: null,

		load(fn) {
			if(this.hasInit) {
				if(typeof fn === "function") { fn() }
				return
			}
			this.hasInit = true

			const RecurseTree = model => {
				const parts = {}
	
				const recursePart = part => {
					if(part.Name in parts) { return parts[part.Name] }
					const partData = {
						name: part.Name,
						children: [],
						attachments: {}
					}
	
					parts[part.Name] = partData
	
					part.Children.forEach(item => {
						if(item.ClassName === "Attachment") {
							partData.attachments[item.Name] = CFrame(...item.CFrame)
						} else if(item.ClassName === "Motor6D") {
							const part0Data = recursePart(item.Part0)
							const part1Data = recursePart(item.Part1)
	
							part1Data.JointName = item.Name
							part1Data.C0 = CFrame(...item.C0)
							part1Data.C1 = InvertCFrame(CFrame(...item.C1))
	
							part0Data.children.push(part1Data)
						}
					})
	
					if(part.ClassName === "MeshPart") {
						partData.meshid = part.MeshID
						partData.origSize = [...(part.size || part.Size)]
					} else if(part.Name === "Head") {
						partData.meshid = getURL(`res/previewer/heads/head.mesh`)
					} else if(R6BodyPartNames.indexOf(part.Name) !== -1) {
						const fname = part.Name.toLowerCase().replace(/\s/g, "")
						partData.meshid = getURL(`res/previewer/meshes/${fname}.mesh`)
					}
	
					return partData
				}
	
				model.Children.forEach(item => {
					if(item.ClassName === "Part" || item.ClassName === "MeshPart") {
						recursePart(item)
					}
				})
	
				return parts.HumanoidRootPart
			}
	
			const R6Promise = new Promise(resolveTree => {
				const path = getURL("res/previewer/character.rbxm")
				AssetCache.loadModel(true, path, model => {
					const tree = RecurseTree(model[0])
					resolveTree(tree)
				})
			})
	
			const R15Promise = new Promise(resolveTree => {
				const path = getURL("res/previewer/characterR15.rbxm")
				AssetCache.loadModel(true, path, model => {
					const tree = RecurseTree(model[0])
					resolveTree(tree)
				})
			})

			
			Promise.all([R6Promise, R15Promise]).then(([R6Tree, R15Tree]) => {
				this.R6Tree = R6Tree
				this.R15Tree = R15Tree
				this.loaded = true

				if(typeof fn === "function") { fn() }
			})
		}
	}


	let compositeRenderer = null
	class CompositeTexture {
		constructor(hasThree, constructorFn, ...args) {
			if(hasThree) {
				if(!compositeRenderer) { compositeRenderer = new THREE.WebGLRenderer({ alpha: true }) }

				this.scene = new THREE.Scene()
				this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100)

				const ambient = new THREE.AmbientLight(0xFFFFFF)
				this.scene.add(ambient)
			}

			this.canvas = document.createElement("canvas")
			this.context = this.canvas.getContext("2d")

			this.beforeComposite = []
			this.afterComposite = []
			this.width = 1024
			this.height = 1024

			constructorFn.apply(this, args)

			this.canvas.width = this.width
			this.canvas.height = this.height

			if(this.camera) { this.camera.updateProjectionMatrix() }

			this.update()
		}

		update() {
			const ctx = this.context

			if(this.background) {
				ctx.fillStyle = this.background
				ctx.fillRect(0, 0, this.width, this.height)
			}

			if(this.scene) {
				compositeRenderer.setSize(this.width, this.height)
				compositeRenderer.render(this.scene, this.camera)
			}

			this.beforeComposite.forEach(fn => fn())
			if(this.scene) { ctx.drawImage(compositeRenderer.domElement, 0, 0, this.width, this.height) }
			this.afterComposite.forEach(fn => fn())

			this.canvas.dispatchEvent(new CustomEvent("compositeupdate"))
		}
	}

	function HeadCompositeConstructor() {
		this.background = "#A3A2A5"
		this.width = 256
		this.height = 256
	}

	function R6CompositeConstructor(textures) {
		this.width = 1024
		this.height = 512

		const size = 2

		this.camera = new THREE.OrthographicCamera(-size / 2, size / 2, size / 4, -size / 4, 0.1, 100)
		this.scene.scale.set(size / 1024, size / 1024, size / 1024)
		this.camera.position.set(size / 2, size / 4, 10)
		this.camera.rotation.set(0, 0, 0)

		const pantsmesh = this.pantsmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
			transparent: true,
			map: textures.pants
		}))
		pantsmesh.visible = false
		pantsmesh.renderOrder = 1
		this.scene.add(pantsmesh)

		const shirtmesh = this.shirtmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
			transparent: true,
			map: textures.shirt
		}))
		shirtmesh.visible = false
		shirtmesh.renderOrder = 2
		this.scene.add(shirtmesh)

		const tshirtmesh = this.tshirtmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
			transparent: true,
			map: textures.tshirt
		}))
		tshirtmesh.visible = false
		tshirtmesh.renderOrder = 3
		this.scene.add(tshirtmesh)

		textures.shirt.image.$on("load", () => this.update())
		textures.pants.image.$on("load", () => this.update())
		textures.tshirt.image.$on("load", () => this.update())

		let meshUrl = getURL("res/previewer/compositing/CompositShirtTemplate.mesh")
		AssetCache.loadMesh(true, meshUrl, mesh => applyMesh(shirtmesh, mesh))

		meshUrl = getURL("res/previewer/compositing/CompositPantsTemplate.mesh")
		AssetCache.loadMesh(true, meshUrl, mesh => applyMesh(pantsmesh, mesh))

		meshUrl = getURL("res/previewer/compositing/CompositTShirt.mesh")
		AssetCache.loadMesh(true, meshUrl, mesh => applyMesh(tshirtmesh, mesh))

		this.shouldUpdateBodyColors = true
		this.bodyColors = {
			head: "#A3A2A5",
			torso: "#A3A2A5",
			rightarm: "#A3A2A5",
			leftarm: "#A3A2A5",
			rightleg: "#A3A2A5"
		}

		this.background = "#7F7F7F"

		const ctx = this.context
		let cachedBodyColors = ctx.createImageData(1024, 512)

		this.beforeComposite.push(() => {
			if(this.shouldUpdateBodyColors) {
				this.shouldUpdateBodyColors = false
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

				cachedBodyColors = ctx.getImageData(0, 0, 1024, 512)
			} else {
				ctx.putImageData(cachedBodyColors, 0, 0)
			}
		})
	}

	function R15TorsoCompositeConstructor(textures) {
		this.background = "#A3A2A5"
		this.width = 388
		this.height = 272

		this.camera = new THREE.OrthographicCamera(-this.width / 2, this.width / 2, this.height / 2, -this.height / 2, 0.1, 100)
		this.camera.position.set(this.width / 2, this.height / 2, 10)
		this.camera.rotation.set(0, 0, 0)

		const pantsmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
			transparent: true,
			map: textures.pants
		}))
		pantsmesh.visible = false
		pantsmesh.renderOrder = 0
		this.scene.add(pantsmesh)

		const shirtmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
			transparent: true,
			map: textures.shirt
		}))
		shirtmesh.visible = false
		shirtmesh.renderOrder = 1
		this.scene.add(shirtmesh)

		textures.tshirt.image.$on("load", () => this.update())
		textures.shirt.image.$on("load", () => this.update())
		textures.pants.image.$on("load", () => this.update())

		const meshUrl = getURL("res/previewer/compositing/R15CompositTorsoBase.mesh")
		AssetCache.loadMesh(true, meshUrl, mesh => {
			applyMesh(shirtmesh, mesh)
			applyMesh(pantsmesh, mesh)
		})

		this.afterComposite.push(() => {
			this.context.drawImage(textures.tshirt.image, 2, 74, 128, 128)
		})
	}

	function R15LimbCompositeConstructor(texture, meshUrl) {
		this.background = "#A3A2A5"
		this.width = 264
		this.height = 284

		this.camera = new THREE.OrthographicCamera(-this.width / 2, this.width / 2, this.height / 2, -this.height / 2, 0.1, 100)
		this.camera.position.set(this.width / 2, this.height / 2, 10)
		this.camera.rotation.set(0, 0, 0)

		const obj = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
			transparent: true,
			map: texture
		}))
		obj.visible = false
		this.scene.add(obj)

		texture.image.$on("load", () => this.update())

		AssetCache.loadMesh(true, meshUrl, mesh => applyMesh(obj, mesh))
	}

	class Avatar {
		constructor() {
			this.model = new THREE.Group()
			this.animator = new RBXAnimator()

			this.assets = []
			this.assetMap = {}

			this.accessories = []
			this.bodyparts = []

			this.parts = {}
			this.attachments = {}
			this.joints = {}

			this.scales = {
				width: 1,
				height: 1,
				depth: 1,
				head: 1,
				proportion: 0,
				bodyType: 0
			}
			
			this.playerType = null

			this.offsetPos = this.model.position
			this.offsetRot = new THREE.Euler()

			const att = this.defaultHatAttachment = new THREE.Group()
			att.position.set(0, 0.5, 0)
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
				over: {}
			}

			this.headComposite = new CompositeTexture(false, HeadCompositeConstructor, textures)
			this.r6Composite = new CompositeTexture(true, R6CompositeConstructor, textures)

			const leftMesh = getURL("res/previewer/compositing/R15CompositLeftArmBase.mesh")
			const rightMesh = getURL("res/previewer/compositing/R15CompositRightArmBase.mesh")

			this.r15Composites = {
				torso: new CompositeTexture(true, R15TorsoCompositeConstructor, textures),
				leftarm: new CompositeTexture(true, R15LimbCompositeConstructor, textures.shirt, leftMesh),
				rightarm: new CompositeTexture(true, R15LimbCompositeConstructor, textures.shirt, rightMesh),
				leftleg: new CompositeTexture(true, R15LimbCompositeConstructor, textures.pants, leftMesh),
				rightleg: new CompositeTexture(true, R15LimbCompositeConstructor, textures.pants, rightMesh)
			}

			images.base.Head = createImage()
			images.over.Head = createImage()
			images.over.Head.defaultSrc = getURL("res/previewer/face.png")
			textures.Head = mergeTexture(256, 256, this.headComposite.canvas, images.base.Head, images.over.Head)

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

			AvatarRigs.load(() => {
				this.shouldRefreshRig = true
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

		async addAsset(assetId, assetTypeId) {
			if(this.assetMap[assetId]) { return }
			const asset = this.assetMap[assetId] = {
				assetId,
				assetTypeId,
				enabled: true
			}

			this.assets.push(asset)

			asset.toggle = (enabled, force) => {
				if(asset.enabled !== !!enabled || force) {
					asset.enabled = !!enabled

					if(asset.enabled) {
						if(asset.enable) { asset.enable() }
					} else {
						if(asset.disable) { asset.disable() }
					}
				}
			}

			switch(assetTypeId) {
			case 27: case 28: case 29: case 30: case 31: { // Bodyparts
				asset.unique = true
				
				const result = []

				const model = await AssetCache.loadModel(assetId)

				const R6Folder = model.find(x => x.Name === "R6")
				const R15Folder = model.find(x => x.Name === "R15ArtistIntent") || model.find(x => x.Name === "R15")

				if(R6Folder) {
					const BodyPartEnum = [null, "Torso", "Left Arm", "Right Arm", "Left Leg", "Right Leg"]

					R6Folder.Children.filter(x => x.ClassName === "CharacterMesh").forEach(charmesh => {
						const target = BodyPartEnum[charmesh.BodyPart]
						if(!target) { return }

						result.push({
							target,
							asset,
							type: "R6",
							meshId: +charmesh.MeshId ? AssetCache.toAssetUrl(charmesh.MeshId) : null,
							baseTexId: +charmesh.BaseTextureId ? AssetCache.toAssetUrl(charmesh.BaseTextureId) : null,
							overTexId: +charmesh.OverlayTextureId ? AssetCache.toAssetUrl(charmesh.OverlayTextureId) : null
						})
					})
				}

				if(R15Folder) {
					R15Folder.Children.filter(x => x.ClassName === "MeshPart").forEach(part => {
						const target = part.Name
						if(R15BodyPartNames.indexOf(target) === -1) { return }

						const bodypart = {
							target,
							asset,
							type: "R15",
							joints: [],
							attachments: [],
							meshId: part.MeshID,
							overTexId: part.TextureID,
							transparency: part.Transparency || 0,
							size: [...(part.size || part.Size)]
						}

						result.push(bodypart)

						part.Children.filter(x => x.ClassName === "Attachment").forEach(inst => {
							if(inst.Name.endsWith("RigAttachment")) {
								const jointName = inst.Name.substring(0, inst.Name.length - 13)
								const cframe = CFrame(...inst.CFrame)
								bodypart.joints.push({ jointName, cframe })
							}
							
							const attName = inst.Name
							const cframe = CFrame(...inst.CFrame)
							bodypart.attachments.push({ attName, cframe })
						})

						const scaleType = part.Children.find(x => x.Name === "AvatarPartScaleType")
						if(scaleType) {
							bodypart.scaleType = scaleType.Value
						}
					})
				}

				asset.enable = () => {
					this.bodyparts.push(...result)
					this.shouldRefreshBodyParts = true
				}

				asset.disable = () => {
					result.forEach(bp => {
						const index = this.bodyparts.indexOf(bp)
						if(index !== -1) {
							this.bodyparts.splice(index, 1)
						}
					})

					this.shouldRefreshBodyParts = true
				}
				break
			}
			case 17: { // Head
				asset.unique = true

				if(assetId in HeadMeshes) {
					const name = HeadMeshes[assetId]
					const meshUrl = getURL(`res/previewer/heads/${name}.mesh`)
					const result = { asset, target: "Head", meshId: meshUrl }

					asset.enable = () => {
						this.bodyparts.push(result)
						this.shouldRefreshBodyParts = true
					}

					asset.disable = () => {
						const index = this.bodyparts.indexOf(result)
						if(index !== -1) {
							this.bodyparts.splice(index, 1)
							this.shouldRefreshBodyParts = true
						}
					}
				} else {
					const model = await AssetCache.loadModel(assetId)

					const mesh = model.find(x => x.ClassName === "SpecialMesh")
					if(!mesh) {
						asset.failed = true
						break
					}

					const result = {
						asset,
						target: "Head",
						meshId: mesh.MeshId,
						baseTexId: mesh.TextureId,
						scale: [...mesh.Scale],
						attachments: [],
						joints: []
					}

					mesh.Children.filter(x => x.ClassName === "Vector3Value" && x.Name.endsWith("Attachment")).forEach(inst => {
						if(inst.Name.endsWith("RigAttachment")) {
							const jointName = inst.Name.substring(0, inst.Name.length - 13)
							result.joints.push({ jointName, pos: new Vector3(...inst.Value) })
						}

						const attName = inst.Name
						result.attachments.push({ attName, pos: new Vector3(...inst.Value) })
					})
					
					const scaleType = mesh.Children.find(x => x.Name === "AvatarPartScaleType")
					if(scaleType) {
						result.scaleType = scaleType.Value
					}

					asset.enable = () => {
						this.bodyparts.push(result)
						this.shouldRefreshBodyParts = true
					}

					asset.disable = () => {
						const index = this.bodyparts.indexOf(result)
						if(index !== -1) {
							this.bodyparts.splice(index, 1)
							this.shouldRefreshBodyParts = true
						}
					}
				}
				break
			}
			case 18: { // Face
				asset.unique = true
				
				const model = await AssetCache.loadModel(assetId)

				const face = model.find(x => x.ClassName === "Decal" && x.Name === "face")
				if(!face) {
					asset.failed = true
					break
				}

				const result = {
					asset,
					isFace: true,
					target: "Head",
					overTexId: face.Texture
				}

				asset.enable = () => {
					this.bodyparts.push(result)
					this.shouldRefreshBodyParts = true
				}

				asset.disable = () => {
					const index = this.bodyparts.indexOf(result)
					if(index !== -1) {
						this.bodyparts.splice(index, 1)
						this.shouldRefreshBodyParts = true
					}
				}
				break
			}
			case 8: case 41: case 42: case 43:
			case 44: case 45: case 46: case 47: { // Accessories
				const model = await AssetCache.loadModel(assetId)

				const accInst = model.find(x => x.ClassName === "Accessory")
				if(!accInst) { asset.failed = true; break }

				const hanInst = accInst.Children.find(x => x.Name === "Handle")
				if(!hanInst) { asset.failed = true; break }

				const meshInst = hanInst.Children.find(x => x.ClassName === "SpecialMesh")
				if(!meshInst) { asset.failed = true; break }

				const meshId = meshInst.MeshId
				const texId = meshInst.TextureId

				if(!meshId) { asset.failed = true; break }

				const img = createImage()
				const tex = mergeTexture(256, 256, img)

				setImageSource(img, graySrc)
				tex.needsUpdate = true

				const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true })
				mat.opacity = 1 - (meshInst.Transparency || 0)
				const obj = new THREE.Mesh(undefined, mat)
				obj.visible = false
				obj.castShadow = true

				if(meshInst.VertexColor) {
					const VC = meshInst.VertexColor
					mat.color.setRGB(VC[0], VC[1], VC[2])
				}

				const cframe = accInst.AttachmentPoint ? InvertCFrame(CFrame(...accInst.AttachmentPoint)) : new THREE.Matrix4()
				const scale = meshInst.Scale ? [...meshInst.Scale] : [1, 1, 1]
				const offset = new Vector3(...(meshInst.Offset || [0, 0, 0]))

				const attInst = hanInst.Children.find(x => x.ClassName === "Attachment")
				const attName = attInst ? attInst.Name : null
				const attCFrame = attInst ? (attInst.CFrame ? InvertCFrame(CFrame(...attInst.CFrame)) : new THREE.Matrix4()) : null

				const att = this.attachments[attName]
				if(att) { att.obj.add(obj) }
				else { this.defaultHatAttachment.add(obj) }

				const result = { obj, asset, attName, attCFrame, att, scale, cframe, offset }
				let initialized = false

				
				const scaleType = hanInst.Children.find(x => x.Name === "AvatarPartScaleType")
				if(scaleType) {
					result.scaleType = scaleType.Value
				}


				asset.enable = async () => {
					this.accessories.push(result)
					this.shouldRefreshBodyParts = true

					if(!initialized) {
						initialized = true

						const meshPromise = AssetCache.loadMesh(true, meshId, mesh => applyMesh(obj, mesh))

						if(texId) {
							await AssetCache.loadImage(true, texId, url => {
								setImageSource(img, url)
								tex.needsUpdate = true
							})
						}

						await meshPromise
					}
				}

				asset.disable = () => {
					if(result.obj.parent) {
						result.obj.parent.remove(result.obj)
					}

					const index = this.accessories.indexOf(result)
					if(index !== -1) {
						this.accessories.splice(index, 1)
					}
				}

				break
			}
			case 11: { // Shirt
				asset.unique = true
				
				const model = await AssetCache.loadModel(assetId)

				const clothing = model.find(x => x.ClassName === "Shirt")
				if(!clothing) { asset.failed = true; break }

				const img = this.textures.shirt.image
				const texId = clothing.ShirtTemplate
				let result

				asset.enable = async () => {
					setImageSource(img, result || "")
					
					if(!result && texId) {
						result = await AssetCache.loadImage(true, texId)
						if(!asset.enabled) { return }
						setImageSource(img, result)
					}
				}

				asset.disable = () => {
					setImageSource(img, result || "")
				}
				break
			}
			case 2: { // T-Shirt
				asset.unique = true
				
				const model = await AssetCache.loadModel(assetId)

				const clothing = model.find(x => x.ClassName === "ShirtGraphic")
				if(!clothing) { asset.failed = true; break }

				const img = this.textures.tshirt.image
				const texId = clothing.Graphic
				let result

				asset.enable = async () => {
					setImageSource(img, result || "")
					
					if(!result && texId) {
						result = await AssetCache.loadImage(true, texId)
						if(!asset.enabled) { return }
						setImageSource(img, result)
					}
				}

				asset.disable = () => {
					setImageSource(img, result || "")
				}

				break
			}
			case 12: { // Pants
				asset.unique = true

				const model = await AssetCache.loadModel(assetId)

				const clothing = model.find(x => x.ClassName === "Pants")
				if(!clothing) { asset.failed = true; break }

				const img = this.textures.pants.image
				const texId = clothing.PantsTemplate
				let result

				asset.enable = async () => {
					setImageSource(img, result || "")
					
					if(!result && texId) {
						result = await AssetCache.loadImage(true, texId)
						if(!asset.enabled) { return }
						setImageSource(img, result)
					}
				}

				asset.disable = () => {
					setImageSource(img, result || "")
				}

				break
			}
			case 48: case 49: case 50: case 51:
			case 52: case 53: case 54: case 55: case 56: { // Animations
				this.removeAsset(assetId)
				return
			}
			default: console.log("Unimplemented asset type", assetTypeId, assetId)
			}

			if(asset.failed) {
				console.error(`Failed to load asset ${assetId} of type ${assetTypeId}`)
				this.removeAsset(assetId)
				return
			}

			if(asset.enabled) {
				if(asset.unique) {
					for(let i = this.assets.length; i--;) {
						const x = this.assets[i]
						if(x.assetTypeId === assetTypeId && x !== asset) {
							x.toggle(false)
						}
					}
				}
				
				const result = asset.enable()
				if(result instanceof Promise) {
					await result
				}
			}
		}

		removeAsset(assetId) {
			const asset = this.assetMap[assetId]
			if(asset) {
				delete this.assetMap[assetId]
				this.assets.splice(this.assets.indexOf(asset), 1)

				const wasEnabled = asset.enabled
				asset.toggle(false)

				if(wasEnabled && asset.unique) {
					for(let i = this.assets.length; i--;) {
						const x = this.assets[i]
						if(x.assetTypeId === asset.assetTypeId) {
							x.toggle(true)
							break
						}
					}
				}
			}
		}

		setPlayerType(playerType) {
			if(this.playerType === playerType) { return }
			this.playerType = playerType
			this.shouldRefreshRig = true
		}

		getScaleMod(part, scaleType) {
			const partName = part.name
			const scale = new Vector3(1, 1, 1)
			
			if(partName === "Head") {
				scale.setScalar(this.scales.head)
			} else {
				scale.set(this.scales.width, this.scales.height, this.scales.depth)
			}

			let bodyMod = ScaleMods.Default[partName]
			let propMod = ScaleMods.Proportion[partName]
			let bodyScale = this.scales.bodyType
			let propScale = this.scales.proportion * this.scales.bodyType

			switch(scaleType) {
			case "ProportionsNormal":
				bodyMod = ScaleMods.Rthro[partName]
				bodyScale = 1 - bodyScale
				break
			case "ProportionsSlender":
				bodyMod = ScaleMods.Rthro[partName]
				propMod = new Vector3(1, 1, 1).divide(propMod)
				bodyScale = 1 - bodyScale
				propScale = 1 - propScale
				break
			}

			if(!bodyMod) { bodyMod = new Vector3(1, 1, 1) }
			if(!propMod) { propMod = new Vector3(1, 1, 1) }

			return scale
				.multiply(new Vector3(1, 1, 1).lerp(bodyMod, bodyScale))
				.divide(new Vector3(1, 1, 1).lerp(propMod, propScale))
		}


		_refreshRig() {
			if(!AvatarRigs.loaded) { return }
			this.shouldRefreshRig = false
		
			if(this.root) {
				this.model.remove(this.root)

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
				this.root = CreateModel(AvatarRigs.R6Tree)
				this.root.position.set(0, 3, 0)
			} else if(this.playerType === "R15") {
				this.root = CreateModel(AvatarRigs.R15Tree)
				this.root.position.set(0, 2.35, 0)
			} else {
				return
			}

			this.root.rotation.copy(this.offsetRot)
			this.offsetRot = this.root.rotation

			parts.Head.add(this.defaultHatAttachment)

			this.model.add(this.root)
			this.animator.setJoints(animJoints)

			this.accessories.forEach(acc => {
				const att = this.attachments[acc.attName]
				if(att) {
					acc.att = att
					att.obj.add(acc.obj)
				} else {
					acc.att = null
					this.defaultHatAttachment.add(acc.obj)
				}
			})

			this._refreshBodyParts()
		}

		_refreshBodyParts() {
			if(!AvatarRigs.loaded) { return }
			this.shouldRefreshBodyParts = false

			const changedParts = {}
			const changedJoints = {}
			const changedAttachments = {}

			this.bodyparts.forEach(bp => {
				if(bp.hidden || (bp.type && bp.type !== this.playerType)) { return }
				if(bp.meshId || bp.baseTexId || bp.overTexId || bp.transparency) {
					changedParts[bp.target] = Object.assign(changedParts[bp.target] || {}, bp)
				}

				if(bp.joints && this.playerType === "R15") {
					bp.joints.forEach(data => {
						if(!this.joints[data.jointName]) { return }
						if(!changedJoints[data.jointName]) { changedJoints[data.jointName] = {} }

						if(data.cframe) {
							changedJoints[data.jointName][bp.target] = data.cframe
						} else if(data.pos) {
							const joint = this.joints[data.jointName]
							const orig = data.target === joint.part0.name ? joint.origC0.clone() : InvertCFrame(joint.origC1)
							changedJoints[data.jointName][bp.target] = orig.setPosition(data.pos)
						}
					})
				}

				if(bp.attachments) {
					bp.attachments.forEach(data => {
						if(!this.attachments[data.attName]) { return }

						if(data.cframe) {
							changedAttachments[data.attName] = data.cframe
						} else if(data.pos) {
							const att = this.attachments[data.attName]
							changedAttachments[data.attName] = att.cframe.clone().setPosition(data.pos)
						}
					})
				}
			})

			Object.entries(this.parts).forEach(([partName, part]) => {
				const change = changedParts[partName]
				const meshId = change && change.meshId || part.rbxDefaultMesh
				const scale = [...(change && change.scale || [1, 1, 1])]

				if(this.playerType === "R15") {
					part.rbxScaleMod = this.getScaleMod(part, change && change.scaleType)

					scale[0] *= part.rbxScaleMod.x
					scale[1] *= part.rbxScaleMod.y
					scale[2] *= part.rbxScaleMod.z
				}

				if(part.rbxMesh) {
					if(part.rbxMeshId !== meshId) {
						part.rbxMeshId = meshId
						clearGeometry(part.rbxMesh)
						AssetCache.loadMesh(true, meshId, mesh => part.rbxMeshId === meshId && applyMesh(part.rbxMesh, mesh))
					}

					const opacity = 1 - (change && change.transparency || 0)
					if(part.rbxMesh.material.opacity !== opacity) {
						part.rbxMesh.material.opacity = opacity
						part.rbxMesh.material.needsUpdate = true
					}

					part.rbxMesh.scale.set(...scale)

					const size = change && change.size || part.rbxOrigSize
					if(size) {
						part.rbxSize = size.map((x, i) => x * scale[i])
					}

					const baseImg = this.images.base[partName]
					const overImg = this.images.over[partName]
					const baseTexId = change && change.baseTexId || ""
					const overTexId = change && change.overTexId || ""

					if(baseImg && baseImg.rbxTexId !== baseTexId) {
						baseImg.rbxTexId = baseTexId
						if(baseTexId) {
							setImageSource(baseImg, baseImg.defaultSrc || graySrc)
							AssetCache.loadImage(true, baseTexId, url => baseImg.rbxTexId === baseTexId && setImageSource(baseImg, url))
						} else {
							setImageSource(baseImg, baseImg.defaultSrc || "")
						}
					}

					if(overImg && overImg.rbxTexId !== overTexId) {
						overImg.rbxTexId = overTexId
						if(overTexId) {
							setImageSource(overImg, overImg.defaultSrc || graySrc)
							AssetCache.loadImage(true, overTexId, url => overImg.rbxTexId === overTexId && setImageSource(overImg, url))
						} else {
							setImageSource(overImg, overImg.defaultSrc || "")
						}
					}
				}
			})
			
			this.accessories.forEach(acc => {
				const parent = acc.att ? acc.att.parent : this.parts.Head
				const scale = parent ? this.getScaleMod(parent, acc.scaleType) : new Vector3(1, 1, 1)
				acc.obj.scale.set(...acc.scale).multiply(scale)

				// Staying faithful to source material
				// And coding in some bugs :D

				// Bug #1: Attachmentless accessories (defaultHatAttachment) do not get position-scaled
				if(acc.att) {
					acc.obj.position.setFromMatrixPosition(acc.attCFrame).multiply(scale)
					acc.obj.rotation.setFromRotationMatrix(acc.attCFrame)
				} else {
					acc.obj.position.setFromMatrixPosition(acc.cframe)
					acc.obj.rotation.setFromRotationMatrix(acc.cframe)
				}

				// Bug #2: Mesh.Offset doesn't get position-scaled
				if(acc.offset) { acc.obj.position.add(acc.offset) }

				acc.obj.matrixWorldNeedsUpdate = true
			})

			Object.entries(this.joints).forEach(([jointName, joint]) => {
				const change = changedJoints[jointName]
				const C0 = change && change[joint.part0.name] || joint.origC0
				const C1 = change && change[joint.part1.name] && InvertCFrame(change[joint.part1.name]) || joint.origC1

				joint.c0.position.setFromMatrixPosition(C0).multiply(joint.part0.rbxScaleMod)
				joint.c0.rotation.setFromRotationMatrix(C0)

				joint.c1.position.setFromMatrixPosition(C1).multiply(joint.part1.rbxScaleMod)
				joint.c1.rotation.setFromRotationMatrix(C1)
			})

			Object.entries(this.attachments).forEach(([attName, att]) => {
				const cframe = changedAttachments[attName] || att.cframe

				att.obj.position.setFromMatrixPosition(cframe).multiply(att.parent.rbxScaleMod)
				att.obj.rotation.setFromRotationMatrix(cframe)
			})

			
			if(this.playerType === "R15") {
				const calcRootY = (off, name) => {
					const joint = this.joints[name]
					return off - joint.c1.position.y - joint.c0.position.y
				}

				const leftJoints = ["Root", "LeftHip", "LeftKnee", "LeftAnkle"]
				const rightJoints = ["Root", "RightHip", "RightKnee", "RightAnkle"]

				const rootHeight = this.parts.HumanoidRootPart.rbxScaleMod.y * 1

				const left = leftJoints.reduce(calcRootY, 0) + this.parts.LeftFoot.rbxSize[1] / 2 - rootHeight
				const right = rightJoints.reduce(calcRootY, 0) + this.parts.RightFoot.rbxSize[1] / 2 - rootHeight

				const min = Math.min(left, right)
				const max = Math.max(left, right)

				const hipHeight = min / max >= 0.95 ? min : max
				this.root.position.y = hipHeight + rootHeight

				this.animator.setRootScale(hipHeight / 1.35)
			}
		}
	}

	return {
		Avatar
	}
})()

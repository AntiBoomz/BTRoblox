"use strict"

const RBXAvatar = (() => {
	function applyMesh(obj, mesh) {
		const geom = obj.geometry

		geom.addAttribute("position", new THREE.BufferAttribute(mesh.vertices, 3))
		geom.addAttribute("normal", new THREE.BufferAttribute(mesh.normals, 3))
		geom.addAttribute("uv", new THREE.BufferAttribute(mesh.uvs, 2))
		geom.setIndex(new THREE.BufferAttribute(mesh.faces, 1))

		geom.computeBoundingSphere()
		obj.visible = true
	}

	function clearGeometry(obj) {
		const geom = obj.geometry

		geom.removeAttribute("position")
		geom.removeAttribute("normal")
		geom.removeAttribute("uv")
		geom.setIndex(null)

		geom.computeBoundingSphere()
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

	const emptySrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII="
	function setImageSource(img, src) {
		src = src || emptySrc
		if(img.src !== src) {
			img.src = src
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
			img.$on("load", () => {
				texture.needsUpdate = true
				return true
			})
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
				if(img instanceof HTMLCanvasElement || img.src !== "") {
					ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
				}
			})

			texture.needsUpdate = true
		}

		images.forEach(img => {
			stack.push(img)

			if(img instanceof Image) {
				img.$on("load", updateFinal)
			} else if(img instanceof HTMLCanvasElement) {
				img.$on("compositeupdate", updateFinal)
			}
		})

		updateFinal()
		return texture
	}

	function solidColorDataURL(r, g, b) {
		return "data:image/gif;base64,R0lGODlhAQABAPAA"
			+ btoa(String.fromCharCode(0, r, g, b, 255, 255))
			+ "/yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="
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
		BodyType: {
			LeftHand: [0.066, 0.174, 0.231],
			LeftLowerArm: [0.129, 0.342, 0.132],
			LeftUpperArm: [0.129, 0.342, 0.132],
			RightHand: [0.066, 0.174, 0.231],
			RightLowerArm: [0.129, 0.342, 0.132],
			RightUpperArm: [0.129, 0.342, 0.132],
			UpperTorso: [0.033, 0.309, 0.14],
			LeftFoot: [0.079, 0.267, 0.129],
			LeftLowerLeg: [0.023, 0.506, 0.023],
			LeftUpperLeg: [0.023, 0.506, 0.023],
			RightFoot: [0.079, 0.267, 0.129],
			RightLowerLeg: [0.023, 0.506, 0.023],
			RightUpperLeg: [0.023, 0.506, 0.023],
			LowerTorso: [0.033, 0.309, 0.14],
			Head: [-0.058, -0.058, -0.058]
		},
		Proportion: {
			LeftHand: [-0.118444, 0, -0.136778],
			LeftLowerArm: [-0.125444, -0.134079, -0.125778],
			LeftUpperArm: [-0.125444, -0.134079, -0.125778],
			RightHand: [-0.118444, 0, -0.136778],
			RightLowerArm: [-0.125444, -0.134079, -0.125778],
			RightUpperArm: [-0.125444, -0.134079, -0.125778],
			UpperTorso: [-0.127654, -0.104768, -0.126667],
			LeftFoot: [-0.0494199, -0.133726, -0.125444],
			LeftLowerLeg: [-0.0468549, -0.205482, -0.113667],
			LeftUpperLeg: [-0.0468549, -0.10507, -0.113667],
			RightFoot: [-0.0494199, -0.133726, -0.125444],
			RightLowerLeg: [-0.0468549, -0.205482, -0.113667],
			RightUpperLeg: [-0.0468549, -0.10507, -0.113667],
			LowerTorso: [-0.047313, -0.304395, -0.126667],
			Head: [-0.0457108, -5.96046e-08, -0.0457108]
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
			
			this.ptDebounce = 0

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
				const R15Folder = model.find(x => x.Name === "R15Fixed") || model.find(x => x.Name === "R15")

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
							transparency: part.Transparency || 0
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
						scale: [...mesh.Scale]
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

				const tex = createTexture()
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
				const offset = new THREE.Vector3(...(meshInst.Offset || [0, 0, 0]))

				const attInst = hanInst.Children.find(x => x.ClassName === "Attachment")
				const attName = attInst ? attInst.Name : null
				const attCFrame = attInst ? (attInst.CFrame ? InvertCFrame(CFrame(...attInst.CFrame)) : new THREE.Matrix4()) : null

				const att = this.attachments[attName]
				if(att) { att.obj.add(obj) }
				else { this.defaultHatAttachment.add(obj) }

				const result = { obj, asset, attName, attCFrame, att, scale, cframe, offset }
				let initialized = false

				asset.enable = async () => {
					this.accessories.push(result)
					this.shouldRefreshBodyParts = true

					if(!initialized) {
						initialized = true

						const meshPromise = AssetCache.loadMesh(true, meshId, mesh => applyMesh(obj, mesh))
						let texPromise

						setImageSource(tex.image, solidColorDataURL(163, 162, 165))
						if(texId) {
							texPromise = AssetCache.loadImage(true, texId, url => { setImageSource(tex.image, url) })
						}

						await meshPromise
						if(texPromise) {
							await texPromise
						}
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
				obj.rbxScaleMod = new THREE.Vector3(1, 1, 1)

				if(tree.name !== "HumanoidRootPart") {
					parts[tree.name] = obj
					const mat = new THREE.MeshLambertMaterial({ map: this.textures[tree.name], transparent: true })
					const mesh = new THREE.Mesh(undefined, mat)
					mesh.castShadow = true
					mesh.visible = false

					obj.rbxMesh = mesh
					obj.rbxDefaultMesh = tree.meshid
					obj.rbxDefaultScale = [1, 1, 1]
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
				this.model.position.set(0, 3, 0)
				this.root = CreateModel(AvatarRigs.R6Tree)
			} else {
				this.model.position.set(0, 2.35, 0)
				this.root = CreateModel(AvatarRigs.R15Tree)
			}

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

				if(bp.joints) {
					bp.joints.forEach(data => {
						if(!changedJoints[data.jointName]) { changedJoints[data.jointName] = {} }
						changedJoints[data.jointName][bp.target] = data.cframe
					})
				}

				if(bp.attachments) {
					bp.attachments.forEach(data => {
						changedAttachments[data.attName] = data.cframe
					})
				}
			})

			if(this.playerType === "R15") {
				const hipHeight = 1.35 * (1 + this.scales.bodyType) - this.scales.proportion * 0.3
				const totalOffset = (1 + hipHeight) * this.scales.height

				this.model.position.y = totalOffset
			}

			Object.entries(this.parts).forEach(([partName, part]) => {
				const change = changedParts[partName]
				const meshId = change && change.meshId || part.rbxDefaultMesh
				const scale = [...(change && change.scale || part.rbxDefaultScale)]

				if(part.rbxMeshId !== meshId) {
					part.rbxMeshId = meshId
					clearGeometry(part.rbxMesh)
					AssetCache.loadMesh(true, meshId, mesh => part.rbxMeshId === meshId && applyMesh(part.rbxMesh, mesh))
				}

				if(this.playerType === "R15") {
					if(partName === "Head") {
						part.rbxScaleMod.setScalar(this.scales.head)
					} else {
						part.rbxScaleMod.set(this.scales.width, this.scales.height, this.scales.depth)
					}

					const bodyScaleMod = ScaleMods.BodyType[partName] || [1, 1, 1]
					const propScaleMod = ScaleMods.Proportion[partName] || [1, 1, 1]

					part.rbxScaleMod.multiply(new THREE.Vector3(
						1 + (bodyScaleMod[0] + propScaleMod[0] * this.scales.proportion) * this.scales.bodyType,
						1 + (bodyScaleMod[1] + propScaleMod[1] * this.scales.proportion) * this.scales.bodyType,
						1 + (bodyScaleMod[2] + propScaleMod[2] * this.scales.proportion) * this.scales.bodyType
					))
					
					scale[0] *= part.rbxScaleMod.x
					scale[1] *= part.rbxScaleMod.y
					scale[2] *= part.rbxScaleMod.z
				}

				const opacity = 1 - (change && change.transparency || 0)
				if(part.rbxMesh.material.opacity !== opacity) {
					part.rbxMesh.material.opacity = opacity
					part.rbxMesh.material.needsUpdate = true
				}

				part.rbxMesh.scale.set(...scale)

				const baseImg = this.images.base[partName]
				const overImg = this.images.over[partName]
				const baseTexId = change && change.baseTexId || ""
				const overTexId = change && change.overTexId || ""

				if(baseImg && baseImg.rbxTexId !== baseTexId) {
					baseImg.rbxTexId = baseTexId
					setImageSource(baseImg, baseImg.defaultSrc || "")
					if(baseTexId) { AssetCache.loadImage(true, baseTexId, url => baseImg.rbxTexId === baseTexId && setImageSource(baseImg, url)) }
				}

				if(overImg && overImg.rbxTexId !== overTexId) {
					overImg.rbxTexId = overTexId
					setImageSource(overImg, overImg.defaultSrc || "")
					if(overTexId) { AssetCache.loadImage(true, overTexId, url => overImg.rbxTexId === overTexId && setImageSource(overImg, url)) }
				}
			})
			
			this.accessories.forEach(acc => {
				const parent = acc.att ? acc.att.parent : this.parts.Head
				const scale = parent ? parent.rbxScaleMod : new THREE.Vector3(1, 1, 1)
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
			})

			Object.entries(this.joints).forEach(([jointName, joint]) => {
				const change = changedJoints[jointName]
				const C0 = change && change[joint.part0.name] || joint.origC0
				const C1 = change && change[joint.part1.name] && InvertCFrame(change[joint.part1.name]) || joint.origC1

				joint.c0.position.setFromMatrixPosition(C0).multiply(joint.part0.rbxScaleMod)
				joint.c0.rotation.setFromRotationMatrix(C0)

				joint.c1.position.setFromMatrixPosition(C1).multiply(joint.part0.rbxScaleMod)
				joint.c1.rotation.setFromRotationMatrix(C1)
			})

			Object.entries(this.attachments).forEach(([attName, att]) => {
				const cframe = changedAttachments[attName] || att.cframe

				att.obj.position.setFromMatrixPosition(cframe).multiply(att.parent.rbxScaleMod)
				att.obj.rotation.setFromRotationMatrix(cframe)
			})
		}
	}

	return {
		Avatar
	}
})()

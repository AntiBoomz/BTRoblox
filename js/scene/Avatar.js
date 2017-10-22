"use strict"

Object.assign(RBXScene, (() => {
	function applyMesh(obj, mesh) {
		const geom = obj.geometry

		geom.addAttribute("position", new THREE.BufferAttribute(mesh.vertices, 3))
		geom.addAttribute("normal", new THREE.BufferAttribute(mesh.normals, 3))
		geom.addAttribute("uv", new THREE.BufferAttribute(mesh.uvs, 2))
		geom.setIndex(new THREE.BufferAttribute(mesh.faces, 1))

		geom.computeBoundingSphere()
	}

	function clearGeometry(obj) {
		const geom = obj.geometry

		geom.removeAttribute("position")
		geom.removeAttribute("normal")
		geom.removeAttribute("uv")
		geom.setIndex(null)

		geom.computeBoundingSphere()
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

	function createImage() {
		const img = new Image()
		img.crossOrigin = "Anonymous"
		return img
	}

	function createTexture(img) {
		if(!img) img = createImage();

		const texture = new THREE.Texture(img)
		texture.minFilter = THREE.LinearFilter

		if(img instanceof Image) {
			img.addEventListener("load", () => {
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
					ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
				}
			})

			texture.needsUpdate = true
		}

		images.forEach(img => {
			stack.push(img)

			if(img instanceof Image) {
				img.addEventListener("load", updateFinal)
			} else if(img instanceof HTMLCanvasElement) {
				img.addEventListener("compositeupdate", updateFinal)
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

	const avatarTreePromise = new Promise(resolve => {
		const modelUrl = chrome.runtime.getURL("res/previewer/avatars.rbxm")

		function CreateTree(model) {
			const joints = {}

			function get(item) {
				let part = joints[item.Name]
				if(!part) {
					part = joints[item.Name] = { name: item.Name, children: [], attachments: {} }

					if(item.ClassName === "MeshPart") {
						part.meshid = RBXParser.parseContentUrl(item.MeshID)
					} else {
						const formatted = item.Name.toLowerCase().replace(/\s/g, "")
						part.meshid = chrome.runtime.getURL(`res/previewer/r6/${formatted}.mesh`)
					}
				}

				return part
			}

			function recurse(item) {
				if(item.ClassName === "Motor6D" && item.Part0 && item.Part1) {
					const part0 = get(item.Part0)
					const part1 = get(item.Part1)

					part0.children.push(part1)
					part1.parent = part0

					part1.JointName = item.Name
					part1.C0 = CFrame(...item.C0)
					part1.C1 = InvertCFrame(CFrame(...item.C1))
				} else if(item.ClassName === "Attachment" && !item.Name.endsWith("RigAttachment")) {
					const part = get(item.Parent)
					part.attachments[item.Name] = CFrame(...item.CFrame)
				}

				item.Children.forEach(recurse)
			}

			recurse(model)

			const rootPart = Object.values(joints).find(x => x.parent == null)
			return rootPart
		}

		AssetCache.loadModel(modelUrl, model => {
			const r6 = model.find(x => x.Name === "R6")
			const r15 = model.find(x => x.Name === "R15")

			resolve([CreateTree(r6), CreateTree(r15)])
		})
	})

	const R6BodyPartNames = [ "Torso", "Left Arm", "Right Arm", "Left Leg", "Right Leg" ]
	const R15BodyPartNames = [
		"LeftFoot", "LeftHand", "LeftLowerArm", "LeftLowerLeg", "LeftUpperArm", "LeftUpperLeg", "LowerTorso",
		"RightFoot", "RightHand", "RightLowerArm", "RightLowerLeg", "RightUpperArm", "RightUpperLeg", "UpperTorso"
	]

	const bounce = x => (x < 0.36363636
		? 7.5625 * x ** 2 : x < 0.72727272
		? 7.5625 * (x - 0.54545454) ** 2 + 0.75 : x < 0.90909090
		? 7.5625 * (x - 0.81818181) ** 2 + 0.9375
		: 7.5625 * (x - 0.95454545) ** 2 + 0.984375);

	const EasingStyles = [
		[ // Linear
			x => x, // In
			x => x, // Out
			x => x  // InOut
		],
		[ // Constant
			() => 1,
			() => 0,
			x => (x >= .5 ? 1 : 0)
		],
		[ // Elastic
			x => -(2 ** (-10 * (1 - x))) * Math.sin(20.944 * (0.925 - x)),
			x => (2 ** (-10 * x)) * Math.sin(20.944 * (x - 0.075)) + 1,
			x => (x < .5
				? -0.5 * (2 ** (-10 * (1 - 2 * x))) * Math.sin(13.9626 * (0.8875 - 2 * x))
				: 1 + 0.5 * (2 ** (-10 * (2 * x - 1))) * Math.sin(13.9626 * (2 * x - 1.1125)))
		],
		[ // Cubic
			x => 1 - (1 - x) ** 3,
			x => x ** 3,
			x => (x < .5 ? 4 * x ** 3 : 1 - 4 * (1 - x) ** 3)
		],
		[ // Bounce
			x => 1 - bounce(1 - x),
			x => bounce(x),
			x => (x < .5 ? 0.5 - 0.5 * bounce(1 - 2 * x) : 1 - 0.5 * bounce(2 - 2 * x))
		]
	]

	class Animator {
		constructor(joints) {
			this.playing = false
			this.anim = null
			this.speed = 1

			this.setJoints(joints)
		}

		setJoints(joints) {
			this.joints = joints
		}

		play(anim) {
			if(anim) this.anim = anim;

			this.playing = true
			this.timePosition = 0
			this.previousUpdate = performance.now() / 1000
		}

		pause() {
			this.playing = false
		}

		resume() {
			this.playing = true
			this.previousUpdate = performance.now() / 1000
		}

		update() {
			if(!this.playing || !this.anim || !this.joints) return;

			const time = performance.now() / 1000
			const delta = time - this.previousUpdate
			this.previousUpdate = time
			this.timePosition += delta * this.speed

			if(this.timePosition > this.anim.length) {
				if(this.anim.loop) {
					this.timePosition = this.timePosition % this.anim.length
				} else {
					this.playing = false
					this.timePosition = 0

					if(this.onstop) this.onstop()
					return;
				}
			}

			const currentTime = this.timePosition
			const emptyFrame = {
				time: 0,
				pos: [0, 0, 0],
				rot: [0, 0, 0]
			}

			const nextQuat = new THREE.Quaternion()
			Object.entries(this.anim.keyframes).forEach(([name, keyframes]) => {
				if(!this.joints[name]) return;

				const joint = this.joints[name].joint
				const next = keyframes.find(x => x.time >= currentTime)

				if(!next) {
					const last = keyframes[keyframes.length - 1]
					joint.position.set(...last.pos)
					joint.quaternion.set(...last.rot)
				} else {
					const prev = keyframes[keyframes.indexOf(next) - 1] || emptyFrame
					const length = next.time - prev.time
					const easing = (EasingStyles[prev.easingstyle] || EasingStyles[0])[prev.easingdir || 0]
					const alpha = length === 0 ? 1 : easing((currentTime - prev.time) / length)

					joint.position.set(
						prev.pos[0] + (next.pos[0] - prev.pos[0]) * alpha,
						prev.pos[1] + (next.pos[1] - prev.pos[1]) * alpha,
						prev.pos[2] + (next.pos[2] - prev.pos[2]) * alpha,
					)

					joint.quaternion.set(...prev.rot).slerp(nextQuat.set(...next.rot), alpha)
				}
			})
		}
	}

	let compositeRenderer = null
	class CompositeTexture {
		constructor(hasThree, constructorFn, ...args) {
			if(hasThree) {
				if(!compositeRenderer) compositeRenderer = new THREE.WebGLRenderer({ alpha: true });

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

			if(this.camera) this.camera.updateProjectionMatrix();

			this.update()
		}

		update() {
			const ctx = this.context

			if(this.background){
				ctx.fillStyle = this.background
				ctx.fillRect(0, 0, this.width, this.height)
			}

			if(this.scene) {
				compositeRenderer.setSize(this.width, this.height)
				compositeRenderer.render(this.scene, this.camera)
			}

			this.beforeComposite.forEach(fn => fn())
			if(this.scene) ctx.drawImage(compositeRenderer.domElement, 0, 0, this.width, this.height);
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

		const shirtmesh = this.shirtmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
			transparent: true,
			map: textures.shirt
		}))
		this.scene.add(shirtmesh)

		const pantsmesh = this.pantsmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
			transparent: true,
			map: textures.pants
		}))
		this.scene.add(pantsmesh)

		const tshirtmesh = this.tshirtmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
			transparent: true,
			map: textures.tshirt
		}))
		this.scene.add(tshirtmesh)

		textures.shirt.image.addEventListener("load", () => this.update())
		textures.pants.image.addEventListener("load", () => this.update())
		textures.tshirt.image.addEventListener("load", () => this.update())

		let meshUrl = chrome.runtime.getURL("res/previewer/r6/shirtTemplate.mesh")
		AssetCache.loadMesh(meshUrl, mesh => applyMesh(shirtmesh, mesh))

		meshUrl = chrome.runtime.getURL("res/previewer/r6/pantsTemplate.mesh")
		AssetCache.loadMesh(meshUrl, mesh => applyMesh(pantsmesh, mesh))

		meshUrl = chrome.runtime.getURL("res/previewer/r6/tshirtTemplate.mesh")
		AssetCache.loadMesh(meshUrl, mesh => applyMesh(tshirtmesh, mesh))

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

		this.camera = new THREE.OrthographicCamera(-this.width/2, this.width/2, this.height/2, -this.height/2, 0.1, 100)
		this.camera.position.set(this.width/2, this.height/2, 10)
		this.camera.rotation.set(0, 0, 0)

		const shirtmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
			transparent: true,
			map: textures.shirt
		}))
		this.scene.add(shirtmesh)

		const pantsmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
			transparent: true,
			map: textures.pants
		}))
		pantsmesh.position.set(0,0,.1)
		this.scene.add(pantsmesh)

		textures.tshirt.image.addEventListener("load", () => this.update())
		textures.shirt.image.addEventListener("load", () => this.update())
		textures.pants.image.addEventListener("load", () => this.update())

		const meshUrl = chrome.runtime.getURL("res/previewer/r15/R15CompositTorsoBase.mesh")
		AssetCache.loadMesh(meshUrl, mesh => {
			applyMesh(shirtmesh, mesh)
			applyMesh(pantsmesh, mesh)
		})

		this.afterComposite.push(() => {
			this.context.drawImage(textures.tshirt.image, 2, 78, 126, 128)
		})
	}

	function R15LimbCompositeConstructor(texture, meshUrl) {
		this.background = "#A3A2A5"
		this.width = 264
		this.height = 284

		this.camera = new THREE.OrthographicCamera(-this.width/2, this.width/2, this.height/2, -this.height/2, 0.1, 100)
		this.camera.position.set(this.width/2, this.height/2, 10)
		this.camera.rotation.set(0, 0, 0)

		const obj = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
			transparent: true,
			map: texture
		}))
		this.scene.add(obj)

		texture.image.addEventListener("load", () => this.update())

		AssetCache.loadMesh(meshUrl, mesh => applyMesh(obj, mesh))
	}

	class Avatar {
		static ready(fn) {
			avatarTreePromise.then(() => fn())
		}

		constructor() {
			this.model = new THREE.Group()
			this.animator = new Animator()

			this.accessories = []
			this.bodyparts = []

			this.parts = {}
			this.attachments = {}
			this.joints = {}

			this.ptDebounce = 0
		}

		init() {
			assert(!this.hasInit, "already has init")
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

			const leftMesh = chrome.runtime.getURL("res/previewer/r15/R15CompositLeftArmBase.mesh")
			const rightMesh = chrome.runtime.getURL("res/previewer/r15/R15CompositRightArmBase.mesh")

			this.r15Composites = {
				torso: new CompositeTexture(true, R15TorsoCompositeConstructor, textures),
				leftarm: new CompositeTexture(true, R15LimbCompositeConstructor, textures.shirt, leftMesh),
				rightarm: new CompositeTexture(true, R15LimbCompositeConstructor, textures.shirt, rightMesh),
				leftleg: new CompositeTexture(true, R15LimbCompositeConstructor, textures.pants, leftMesh),
				rightleg: new CompositeTexture(true, R15LimbCompositeConstructor, textures.pants, rightMesh)
			}

			images.base.Head = createImage()
			images.over.Head = createImage()
			images.over.Head.defaultSrc = chrome.runtime.getURL("res/previewer/r6/face.png")
			textures.Head = mergeTexture(256, 256, this.headComposite.canvas, images.base.Head, images.over.Head)

			R6BodyPartNames.forEach(name => {
				const base = images.base[name] = createImage()
				const over = images.over[name] = createImage()

				textures[name] = mergeTexture(1024, 512, base, this.r6Composite.canvas, over)
			})

			R15BodyPartNames.forEach(name => {
				const compositeName = name.toLowerCase().replace(/upper|lower/g, "").replace(/hand/g, "arm").replace(/foot/g, "leg")
				const composite = this.r15Composites[compositeName]
				const over = images.over[name] = createImage()

				textures[name] = mergeTexture(composite.canvas.width, composite.canvas.height, composite.canvas, over)
			})
		}

		setBodyColors(bodyColors) {
			this.r6Composite.bodyColors = bodyColors
			this.r6Composite.shouldUpdateBodyColors = true
			this.r6Composite.update()

			Object.entries(this.r15Composites).forEach(([name, composite]) => {
				if(!bodyColors[name]) return;

				composite.background = bodyColors[name]
				composite.update()
			})

			this.headComposite.background = bodyColors.head
			this.headComposite.update()
		}

		addAsset(asset) {
			const { assetId, assetTypeId } = asset

			switch(assetTypeId) {
			// Bodyparts
			case 27: case 28: case 29: case 30: case 31:
				AssetCache.loadModel(assetId, model => {
					const R6Folder = model.find(x => x.Name === "R6")
					const R15Folder = model.find(x => x.Name === "R15")

					if(R6Folder) {
						const BodyPartEnum = [ null, "Torso", "Left Arm", "Right Arm", "Left Leg", "Right Leg" ]

						R6Folder.Children.filter(x => x.ClassName === "CharacterMesh").forEach(charmesh => {
							const target = BodyPartEnum[charmesh.BodyPart]
							if(!target) return;

							this.bodyparts.push({
								target,
								asset,
								type: "R6",
								meshId: charmesh.MeshId,
								baseTexId: charmesh.BaseTextureId,
								overTexId: charmesh.OverlayTextureId
							})
						})
					}

					if(R15Folder) {
						R15Folder.Children.filter(x => x.ClassName === "MeshPart").forEach(part => {
							const target = part.Name
							if(R15BodyPartNames.indexOf(target) === -1) return;

							const bodypart = {
								target,
								asset,
								type: "R15",
								joints: [],
								attachments: [],
								meshId: RBXParser.parseContentUrl(part.MeshID),
								overTexId: RBXParser.parseContentUrl(part.TextureID)
							}

							this.bodyparts.push(bodypart)

							part.Children.filter(x => x.ClassName === "Attachment").forEach(inst => {
								if(inst.Name.endsWith("RigAttachment")) {
									const jointName = inst.Name.substring(0, inst.Name.length - 13)
									const cframe = CFrame(...inst.CFrame)
									bodypart.joints.push({ jointName, cframe })
								} else {
									const attName = inst.Name
									const cframe = CFrame(...inst.CFrame)
									bodypart.attachments.push({ attName, cframe })
								}
							})
						})
					}

					this.refreshBodyParts()
				})
				break
			case 17: // Head
				AssetCache.loadModel(assetId, model => {
					const mesh = model.find(x => x.ClassName === "SpecialMesh")
					if(!mesh) return;
					this.bodyparts.push({
						asset,
						target: "Head",
						meshId: RBXParser.parseContentUrl(mesh.MeshId),
						baseTexId: RBXParser.parseContentUrl(mesh.TextureId),
						scale: mesh.Scale
					})

					this.refreshBodyParts()
				})
				break
			case 18: // Face
				AssetCache.loadModel(assetId, model => {
					const face = model.find(x => x.ClassName === "Decal" && x.Name === "face")
					if(!face) return;
					this.bodyparts.push({
						asset,
						isFace: true,
						target: "Head",
						overTexId: RBXParser.parseContentUrl(face.Texture)
					})

					this.refreshBodyParts()
				})
				break;
			// Accessories
			case 8: case 41: case 42: case 43:
			case 44: case 45: case 46: case 47:
				AssetCache.loadModel(assetId, model => {
					const accInst = model.find(x => x.ClassName === "Accessory")
					if(!accInst) return;

					const hanInst = accInst.Children.find(x => x.Name === "Handle")
					if(!hanInst) return;

					const meshInst = hanInst.Children.find(x => x.ClassName === "SpecialMesh")
					const attInst = hanInst.Children.find(x => x.ClassName === "Attachment")
					if(!meshInst) return console.warn(`[RBXScene.Avatar] Missing meshInst for ${assetId}`);

					if(!attInst) return console.warn(`[RBXScene.Avatar] Missing attInst for ${assetId}`);

					const attName = attInst.Name
					const meshId = RBXParser.parseContentUrl(meshInst.MeshId)
					const texId = RBXParser.parseContentUrl(meshInst.TextureId)

					if(!meshId) return console.warn(`[RBXScene.Avatar] Invalid meshId for ${assetId} '${meshInst.MeshId}'`);
					if(!texId) console.warn(`[RBXScene.Avatar] Invalid texId for ${assetId} '${meshInst.MeshId}'`);

					const tex = createTexture()
					const mat = new THREE.MeshLambertMaterial({ map: tex })
					const obj = new THREE.Mesh(undefined, mat)
					obj.castShadow = true

					AssetCache.loadMesh(meshId, mesh => applyMesh(obj, mesh))

					tex.image.src = solidColorDataURL(163, 162, 165)
					if(texId) AssetCache.loadImage(texId, url => { tex.image.src = url });

					const cframe = attInst.CFrame

					if(meshInst.Offset) {
						cframe[0] += meshInst.Offset[0]
						cframe[1] += meshInst.Offset[1]
						cframe[2] += meshInst.Offset[2]
					}

					if(meshInst.Scale) obj.scale.set(...meshInst.Scale);

					const matrix = InvertCFrame(CFrame(...cframe))
					obj.position.setFromMatrixPosition(matrix)
					obj.rotation.setFromRotationMatrix(matrix)

					this.accessories.push({ attName, obj, asset })

					const attachment = this.attachments[attName]
					if(attachment) attachment.obj.add(obj);
				})
				break;
			case 11:
				AssetCache.loadModel(assetId, model => {
					const shirt = model.find(x => x.ClassName === "Shirt")
					if(!shirt) return;

					const texId = RBXParser.parseContentUrl(shirt.ShirtTemplate)
					if(texId) AssetCache.loadImage(texId, url => { this.textures.shirt.image.src = url });
				})
				break;
			case 2:
				AssetCache.loadModel(assetId, model => {
					const tshirt = model.find(x => x.ClassName === "ShirtGraphic")
					if(!tshirt) return;

					const texId = RBXParser.parseContentUrl(tshirt.Graphic)
					if(texId) AssetCache.loadImage(texId, url => { this.textures.tshirt.image.src = url });
				})
				break;
			case 12:
				AssetCache.loadModel(assetId, model => {
					const pants = model.find(x => x.ClassName === "Pants")
					if(!pants) return;

					const texId = RBXParser.parseContentUrl(pants.PantsTemplate)
					if(texId) AssetCache.loadImage(texId, url => { this.textures.pants.image.src = url });
				})
				break;
			default:
				console.log("Unimplemented asset type", assetTypeId, assetId);
			}
		}

		setPlayerType(playerType) {
			if(this.playerType === playerType) return;
			this.playerType = playerType
			this.refresh()
		}

		refresh() {
			const ptKey = ++this.ptDebounce

			avatarTreePromise.then(([R6Tree, R15Tree]) => {
				if(this.ptDebounce !== ptKey) return;

				if(this.root) {
					this.model.remove(this.root)

					const recDispose = tar => {
						if(tar.isMesh) {
							if(tar.geometry) tar.geometry.dispose();
							if(tar.material) tar.material.dispose();
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

					if(tree.name !== "HumanoidRootPart") {
						parts[tree.name] = obj
						const mat = new THREE.MeshLambertMaterial({ map: this.textures[tree.name] })
						const mesh = new THREE.Mesh(undefined, mat)
						mesh.castShadow = true

						obj.rbxMesh = mesh
						obj.rbxDefaultMesh = tree.meshid
						obj.rbxDefaultScale = [1, 1, 1]
						obj.add(mesh)
					}

					Object.entries(tree.attachments).forEach(([name, cframe]) => {
						const att = new THREE.Group()
						obj.add(att)

						attachments[name] = { cframe, obj: att }
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
							part0: tree.name,
							part1: child.name,
							origC0: child.C0,
							origC1: child.C1
						}
					})

					return obj
				}

				if(this.playerType === "R6") {
					this.model.position.set(0, 3, 0)
					this.root = CreateModel(R6Tree)
				} else {
					this.model.position.set(0, 2.33, 0)
					this.root = CreateModel(R15Tree)
				}

				this.model.add(this.root)
				this.animator.setJoints(animJoints)

				this.accessories.forEach(acc => {
					const attachment = acc.attachment = this.attachments[acc.attName]
					if(attachment) attachment.obj.add(acc.obj);
				})

				this.refreshBodyParts()
			})
		}

		refreshBodyParts() {
			const changedParts = {}
			const changedJoints = {}
			const changedAttachments = {}

			this.bodyparts.forEach(bp => {
				if(bp.hidden || (bp.type && bp.type !== this.playerType)) return;
				if(bp.meshId || bp.baseTexId || bp.overTexId) {
					const change = changedParts[bp.target] = changedParts[bp.target] || {}
					if(bp.meshId) change.meshId = bp.meshId;
					if(bp.baseTexId) change.baseTexId = bp.baseTexId;
					if(bp.overTexId) change.overTexId = bp.overTexId;
					if(bp.scale) change.scale = bp.scale;
				}

				if(bp.joints) {
					bp.joints.forEach(data => {
						if(!changedJoints[data.jointName]) changedJoints[data.jointName] = {};
						changedJoints[data.jointName][bp.target] = data.cframe
					})
				}

				if(bp.attachments) {
					bp.attachments.forEach(data => {
						changedAttachments[data.attName] = data.cframe
					})
				}
			})

			Object.entries(this.parts).forEach(([partName, part]) => {
				const change = changedParts[partName]
				const meshId = change && change.meshId || part.rbxDefaultMesh
				const scale = change && change.scale || part.rbxDefaultScale

				if(part.rbxMeshId !== meshId) {
					part.rbxMeshId = meshId
					clearGeometry(part.rbxMesh)
					AssetCache.loadMesh(meshId, mesh => part.rbxMeshId === meshId && applyMesh(part.rbxMesh, mesh))
				}

				if(part.rbxMeshScale !== scale) {
					part.rbxMeshScale = scale
					part.rbxMesh.scale.set(...scale)
				}

				const baseImg = this.images.base[partName]
				const overImg = this.images.over[partName]
				const baseTexId = change && change.baseTexId || 0
				const overTexId = change && change.overTexId || 0

				if(baseImg && baseImg.rbxTexId !== baseTexId) {
					baseImg.rbxTexId = baseTexId
					baseImg.src = baseImg.defaultSrc || ""
					if(baseTexId > 0) AssetCache.loadImage(baseTexId, url => baseImg.rbxTexId === baseTexId && (baseImg.src = url));
					else baseImg.$trigger("load"); // Need to trigger load to update textures
				}

				if(overImg && overImg.rbxTexId !== overTexId) {
					overImg.rbxTexId = overTexId
					overImg.src = overImg.defaultSrc || ""
					if(overTexId > 0) AssetCache.loadImage(overTexId, url => overImg.rbxTexId === overTexId && (overImg.src = url));
					else overImg.$trigger("load"); // Need to trigger load to update textures
				}
			})

			Object.entries(this.joints).forEach(([jointName, joint]) => {
				const change = changedJoints[jointName]
				const C0 = change && change[joint.part0] || joint.origC0
				const C1 = change && change[joint.part1] && InvertCFrame(change[joint.part1]) || joint.origC1

				joint.c0.position.setFromMatrixPosition(C0)
				joint.c0.rotation.setFromRotationMatrix(C0)

				joint.c1.position.setFromMatrixPosition(C1)
				joint.c1.rotation.setFromRotationMatrix(C1)
			})

			Object.entries(this.attachments).forEach(([attName, att]) => {
				const cframe = changedAttachments[attName] || att.cframe

				att.obj.position.setFromMatrixPosition(cframe)
				att.obj.rotation.setFromRotationMatrix(cframe)
			})
		}
	}

	return {
		Avatar,
		Animator
	}
})());
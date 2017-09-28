"use strict"

RBXScene.Avatar = (function() {
	function applyMesh(obj, mesh) {
		var geom = obj.geometry

		geom.addAttribute("position", new THREE.BufferAttribute(mesh.vertices, 3))
		geom.addAttribute("normal", new THREE.BufferAttribute(mesh.normals, 3))
		geom.addAttribute("uv", new THREE.BufferAttribute(mesh.uvs, 2))
		geom.setIndex(new THREE.BufferAttribute(mesh.faces, 1))

		geom.computeBoundingSphere()
	}

	function clearGeometry(obj) {
		var geom = obj.geometry
		geom.removeAttribute("position")
		geom.removeAttribute("normal")
		geom.removeAttribute("uv")
		geom.setIndex(null)

		geom.computeBoundingSphere()
	}

	function CFrame(x,y,z, r00,r01,r02, r10,r11,r12, r20,r21,r22) {
		return new THREE.Matrix4().set(
			r00, r01, r02, x,
			r10, r11, r12, y,
			r20, r21, r22, z,
			 0,   0,   0,  1
		)
	}

	function InvertCFrame(cframe) { return new THREE.Matrix4().getInverse(cframe) }

	function createImage() {
		var img  = new Image()
		img.crossOrigin = "Anonymous"

		return img
	}

	function createTexture(img) {
		if(!img)
			img = createImage();

		var texture = new THREE.Texture(img)
		texture.minFilter = THREE.LinearFilter

		if(img instanceof Image) {
			img.addEventListener("load", () => {
				texture.needsUpdate = true
				return true
			})
		}

		return texture
	}

	function mergeTexture(width, height) {
		var canvas = document.createElement("canvas")
		var ctx = canvas.getContext("2d")
		canvas.width = width
		canvas.height = height

		var texture = new THREE.Texture(canvas)
		texture.minFilter = THREE.LinearFilter

		var stack = []
		var updateTimeout = null

		function updateFinal() {
			ctx.clearRect(0, 0, canvas.width, canvas.height)

			stack.forEach(img => {
				if(img instanceof HTMLCanvasElement || img.src !== "") {
					ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
				}
			})

			texture.needsUpdate = true
		}

		function requestUpdate() {
			clearTimeout(updateTimeout)
			updateTimeout = setTimeout(updateFinal, 30)
		}

		for(var i=2; i<arguments.length; i++) {
			var img = arguments[i]
			stack.push(img)

			if(img instanceof Image) {
				img.addEventListener("load", updateFinal)
			} else if(img instanceof HTMLCanvasElement) {
				img.addEventListener("compositeupdate", updateFinal)
			}
		}

		updateFinal()
		return texture
	}

	function solidColorDataURL(r, g, b) {
		return "data:image/gif;base64,R0lGODlhAQABAPAA" 
			+ btoa(String.fromCharCode(0, r, g, b, 255, 255)) 
			+ "/yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="
	}

	var avatarTreePromise = new Promise(resolve => {
		var modelUrl = chrome.runtime.getURL("res/previewer/avatars.rbxm")

		function CreateTree(model) {
			var joints = {}

			function get(item) {
				var part = joints[item.Name]
				if(!part) {
					part = joints[item.Name] = { name: item.Name, children: [], attachments: {} }

					if(item.ClassName === "MeshPart") {
						part.meshid = RBXParser.parseContentUrl(item.MeshID)
					} else {
						var formatted = item.Name.toLowerCase().replace(/\s/g, "")
						part.meshid = chrome.runtime.getURL(`res/previewer/r6/${formatted}.mesh`)
					}
				}

				return part
			}

			function recurse(item) {
				if(item.ClassName === "Motor6D" && item.Part0 && item.Part1) {
					var part0 = get(item.Part0)
					var part1 = get(item.Part1)

					part0.children.push(part1)
					part1.parent = part0

					part1.JointName = item.Name
					part1.C0 = CFrame.apply(null, item.C0)
					part1.C1 = InvertCFrame(CFrame.apply(null, item.C1))
				} else if(item.ClassName === "Attachment" && !item.Name.endsWith("RigAttachment")) {
					var part = get(item.Parent)
					part.attachments[item.Name] = CFrame.apply(null, item.CFrame)
				}

				item.Children.forEach(recurse)
			}

			recurse(model)

			var rootPart = Object.values(joints).find(x => x.parent == null)
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

	var compositeRenderer = null

	function CompositeTexture(hasThree, constructorFn) {
		if(hasThree) {
			if(!compositeRenderer) compositeRenderer = new THREE.WebGLRenderer({ alpha: true });

			var scene = this.scene = new THREE.Scene()
			var camera = this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100)

			var ambient = new THREE.AmbientLight(0xFFFFFF)
			scene.add(ambient)
		}

		var canvas = this.canvas = document.createElement("canvas")
		var ctx = this.context = canvas.getContext("2d")

		this.beforeComposite = []
		this.afterComposite = []
		this.width = 1024
		this.height = 1024

		constructorFn.apply(this, Array.prototype.slice.call(arguments, 2))

		canvas.width = this.width
		canvas.height = this.height

		if(this.camera)
			this.camera.updateProjectionMatrix();

		this.update()
	}

	Object.assign(CompositeTexture.prototype, {
		update() {
			var ctx = this.context

			if(this.background){
				ctx.fillStyle = this.background
				ctx.fillRect(0,0, this.width, this.height)
			}

			if(this.scene) {
				compositeRenderer.setSize(this.width, this.height)
				compositeRenderer.render(this.scene, this.camera)
			}

			this.beforeComposite.forEach(fn => fn())
			if(this.scene) ctx.drawImage(compositeRenderer.domElement, 0,0, this.width, this.height);
			this.afterComposite.forEach(fn => fn())

			this.canvas.dispatchEvent(new CustomEvent("compositeupdate"))
		}
	})

	function HeadCompositeConstructor() {
		this.texture = createTexture(this.canvas)
		this.background = "#A3A2A5"
		this.width = 256
		this.height = 256

		this.face = createTexture()
		this.face.image.src = chrome.runtime.getURL("res/previewer/r6/face.png")

		this.face.image.addEventListener("load", () => this.update())

		this.afterComposite.push(() => {
			this.context.drawImage(this.face.image, 0,0, 256,256)
			this.texture.needsUpdate = true
		})
	}

	function R6CompositeConstructor(textures) {
		this.width = 1024
		this.height = 512

		var size = 2

		this.camera = new THREE.OrthographicCamera(-size/2, size/2, size/4, -size/4, 0.1, 100)
		this.scene.scale.set(size/1024, size/1024, size/1024)
		this.camera.position.set(size/2, size/4, 10)
		this.camera.rotation.set(0, 0, 0)

		var shirtmesh = this.shirtmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
			transparent: true,
			map: textures.shirt
		}))
		this.scene.add(shirtmesh)

		var pantsmesh = this.pantsmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
			transparent: true,
			map: textures.pants
		}))
		this.scene.add(pantsmesh)

		var tshirtmesh = this.tshirtmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
			transparent: true,
			map: textures.tshirt
		}))
		this.scene.add(tshirtmesh)

		textures.shirt.image.addEventListener("load", () => this.update())
		textures.pants.image.addEventListener("load", () => this.update())
		textures.tshirt.image.addEventListener("load", () => this.update())

		var meshUrl = chrome.runtime.getURL("res/previewer/r6/shirtTemplate.mesh")
		AssetCache.loadMesh(meshUrl, mesh => applyMesh(shirtmesh, mesh))

		var meshUrl = chrome.runtime.getURL("res/previewer/r6/pantsTemplate.mesh")
		AssetCache.loadMesh(meshUrl, mesh => applyMesh(pantsmesh, mesh))

		var meshUrl = chrome.runtime.getURL("res/previewer/r6/tshirtTemplate.mesh")
		AssetCache.loadMesh(meshUrl, mesh => applyMesh(tshirtmesh, mesh))
		
		this.shouldUpdateBodyColors = true
		this.bodyColors = {
			head: "#A3A2A5",
			torso: "#A3A2A5",
			rightarm: "#A3A2A5",
			leftarm: "#A3A2A5",
			rightleg: "#A3A2A5",
			rightarm: "#A3A2A5"
		}

		this.background = "#7F7F7F"

		var ctx = this.context
		var cachedBodyColors = ctx.createImageData(1024, 512)
		this.beforeComposite.push(() => {
			if(this.shouldUpdateBodyColors) {
				this.shouldUpdateBodyColors = false
				ctx.fillStyle = this.bodyColors.torso
				ctx.fillRect(0,0, 192,448)
				ctx.fillRect(194,322, 272,76)
				ctx.fillRect(272,401, 148,104)

				ctx.fillStyle = this.bodyColors.rightarm
				ctx.fillRect(200,0, 192,320)
				ctx.fillRect(420,400, 148,104)
				ctx.fillRect(758,322, 76,76)
				ctx.fillRect(898,322, 76,76)

				ctx.fillStyle = this.bodyColors.leftarm
				ctx.fillRect(400,0, 192,320)
				ctx.fillRect(568,400, 148,104)
				ctx.fillRect(828,322, 76,76)
				ctx.fillRect(194,394, 76,76)

				ctx.fillStyle = this.bodyColors.rightleg
				ctx.fillRect(600,0, 192,320)
				ctx.fillRect(716,400, 148,104)
				ctx.fillRect(466,322, 76,76)
				ctx.fillRect(610,322, 76,76)

				ctx.fillStyle = this.bodyColors.leftleg
				ctx.fillRect(800,0, 192,320)
				ctx.fillRect(864,400, 148,104)
				ctx.fillRect(542,322, 76,76)
				ctx.fillRect(684,322, 76,76)

				cachedBodyColors = ctx.getImageData(0,0, 1024,512)
			} else {
				ctx.putImageData(cachedBodyColors, 0,0)
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

		var shirtmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
			transparent: true,
			map: textures.shirt
		}))
		this.scene.add(shirtmesh)

		var pantsmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
			transparent: true,
			map: textures.pants
		}))
		pantsmesh.position.set(0,0,.1)
		this.scene.add(pantsmesh)

		textures.tshirt.image.addEventListener("load", () => this.update())
		textures.shirt.image.addEventListener("load", () => this.update())
		textures.pants.image.addEventListener("load", () => this.update())

		var meshUrl = chrome.runtime.getURL("res/previewer/r15/R15CompositTorsoBase.mesh")
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

		var obj = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
			transparent: true,
			map: texture
		}))
		this.scene.add(obj)

		texture.image.addEventListener("load", () => this.update())

		AssetCache.loadMesh(meshUrl, mesh => applyMesh(obj, mesh))
	}

	function Avatar() {
		this.model = new THREE.Group()
		this.animator = new RBXScene.Animator()

		this.accessories = []
		this.bodyparts = []

		this.parts = {}
		this.attachments = {}
		this.joints = {}

		this.ptDebounce = 0
	}

	Object.assign(Avatar.prototype, {
		init() {
			assert(!this.hasInit, "already has init")
			this.hasInit = true

			var textures = this.textures = {
				pants: createTexture(),
				shirt: createTexture(),
				tshirt: createTexture()
			}

			var images = this.images = {
				base: {},
				over: {}
			}

			this.headComposite = new CompositeTexture(false, HeadCompositeConstructor)
			this.r6Composite = new CompositeTexture(true, R6CompositeConstructor, textures)

			var leftMesh = chrome.runtime.getURL("res/previewer/r15/R15CompositLeftArmBase.mesh")
			var rightMesh = chrome.runtime.getURL("res/previewer/r15/R15CompositRightArmBase.mesh")

			this.r15Composites = {
				torso: new CompositeTexture(true, R15TorsoCompositeConstructor, textures),
				leftarm: new CompositeTexture(true, R15LimbCompositeConstructor, textures.shirt, leftMesh),
				rightarm: new CompositeTexture(true, R15LimbCompositeConstructor, textures.shirt, rightMesh),
				leftleg: new CompositeTexture(true, R15LimbCompositeConstructor, textures.pants, leftMesh),
				rightleg: new CompositeTexture(true, R15LimbCompositeConstructor, textures.pants, rightMesh)
			}

			textures.Head = this.headComposite.texture

			R6BodyPartNames.forEach(name => {
				var base = images.base[name] = createImage()
				var over = images.over[name] = createImage()

				textures[name] = mergeTexture(1024,512, base, this.r6Composite.canvas, over)
			})

			R15BodyPartNames.forEach(name => {
				var compositeName = name.toLowerCase().replace(/upper|lower/g, "").replace(/hand/g, "arm").replace(/foot/g, "leg")
				var composite = this.r15Composites[compositeName]
				var over = images.over[name] = createImage()

				textures[name] = mergeTexture(composite.canvas.width,composite.canvas.height, composite.canvas, over)
			})
		},
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
		},
		addAsset(assetId, assetTypeId) {
			var asset = { assetId, assetTypeId }
			switch(assetTypeId) {
				// Bodyparts
				case 27: case 28: 
				case 29: case 30: case 31:
					AssetCache.loadModel(assetId, model => {
						var R6Folder = model.find(x => x.Name === "R6")
						var R15Folder = model.find(x => x.Name === "R15")

						var Apply = (target, meshId, baseTexId, overTexId) => {
							var bodypart = { asset, meshId, target, baseTexId, overTexId }

							this.bodyparts.push(bodypart)
							return bodypart
						}

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
								var target = part.Name
								if(R15BodyPartNames.indexOf(target) === -1)
									return;

								var bodypart = {
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
										var jointName = inst.Name.substring(0, inst.Name.length - 13)
										var cframe = CFrame.apply(null, inst.CFrame)
										bodypart.joints.push({ jointName, cframe })
									} else {
										var attName = inst.Name
										var cframe = CFrame.apply(null, inst.CFrame)
										bodypart.attachments.push({ attName, cframe })
									}
								})
							})
						}

						this.refreshBodyParts()
					})
					break

				// Accessories
				case 8: case 41: case 42: case 43:
				case 44: case 45: case 46: case 47:
					AssetCache.loadModel(assetId, model => {
						model.filter(x => x.ClassName === "Accessory").forEach(accInst => {
							var hanInst = accInst.Children.find(x => x.Name === "Handle")

							if(!hanInst) return;

							var meshInst = hanInst.Children.find(x => x.ClassName === "SpecialMesh")
							var attInst = hanInst.Children.find(x => x.ClassName === "Attachment")

							if(!meshInst)
								return console.warn(`[RBXScene.Avatar] Missing meshInst for ${assetId}`);

							if(!attInst)
								return console.warn(`[RBXScene.Avatar] Missing attInst for ${assetId}`);

							var attName = attInst.Name
							var meshId = RBXParser.parseContentUrl(meshInst.MeshId)
							var texId = RBXParser.parseContentUrl(meshInst.TextureId)

							if(!meshId) 
								return console.warn(`[RBXScene.Avatar] Invalid meshId for ${assetId} '${meshInst.MeshId}'`);

							if(!texId) 
								console.warn(`[RBXScene.Avatar] Invalid texId for ${assetId} '${meshInst.MeshId}'`);

							var tex = createTexture()
							var mat = new THREE.MeshLambertMaterial({ map: tex })
							var obj = new THREE.Mesh(undefined, mat)
							obj.castShadow = true

							AssetCache.loadMesh(meshId, mesh => applyMesh(obj, mesh))

							tex.image.src = solidColorDataURL(163, 162, 165)
							if(texId)
								AssetCache.loadImage(texId, url => tex.image.src = url);

							var cframe = attInst.CFrame

							if(meshInst.Offset) {
								cframe[0] += meshInst.Offset[0]
								cframe[1] += meshInst.Offset[1]
								cframe[2] += meshInst.Offset[2]
							}

							if(meshInst.Scale) {
								obj.scale.set(meshInst.Scale[0], meshInst.Scale[1], meshInst.Scale[2])
							}

							var matrix = InvertCFrame(CFrame.apply(null, cframe))
							obj.position.setFromMatrixPosition(matrix)
							obj.rotation.setFromRotationMatrix(matrix)

							this.accessories.push({ attName, obj, asset })

							var attachment = this.attachments[attName]
							if(attachment) attachment.obj.add(obj);
						})
					})
					break;
				case 11:
					AssetCache.loadModel(assetId, model => {
						model.forEach((shirt) => {
							if(shirt.ClassName !== "Shirt")
								return;

							var texId = RBXParser.parseContentUrl(shirt.ShirtTemplate)
							if(texId)
								AssetCache.loadImage(texId, url => this.textures.shirt.image.src = url);
						})
					})
					break;
				case 2:
					AssetCache.loadModel(assetId, model => {
						model.forEach((tshirt) => {
							if(tshirt.ClassName !== "ShirtGraphic")
								return;

							var texId = RBXParser.parseContentUrl(tshirt.Graphic)
							if(texId)
								AssetCache.loadImage(texId, url => this.textures.tshirt.image.src = url);
						})
					})
					break;
				case 12:
					AssetCache.loadModel(assetId, model => {
						model.forEach((pants) => {
							if(pants.ClassName !== "Pants")
								return;

							var texId = RBXParser.parseContentUrl(pants.PantsTemplate)
							if(texId)
								AssetCache.loadImage(texId, url => this.textures.pants.image.src = url);
						})
					})
					break;
				case 18:
					AssetCache.loadModel(assetId, model => {
						model.forEach((face) => {
							if(face.ClassName !== "Decal" || face.Name !== "face")
								return;

							var texId = RBXParser.parseContentUrl(face.Texture)
							if(texId)
								AssetCache.loadImage(texId, url => this.headComposite.face.image.src = url);
						})
					})
					break;
				default:
					console.log("Unimplemented asset type", assetTypeId, assetId);
			}
		},
		setPlayerType(playerType) {
			if(this.playerType === playerType)
				return;

			this.playerType = playerType
			this.refresh()
		},
		refresh() {
			var ptKey = ++this.ptDebounce

			avatarTreePromise.then(([R6Tree, R15Tree]) => {
				if(this.ptDebounce !== ptKey) return;

				if(this.root) {
					this.model.remove(this.root)

					function recDispose(tar) {
						if(tar.isMesh) {
							if(tar.geometry) tar.geometry.dispose();
							if(tar.material) tar.material.dispose();
						}

						tar.children.forEach(recDispose)
					}
					recDispose(this.root)
				}

				var parts = this.parts = {}
				var attachments = this.attachments = {}
				var joints = this.joints = {}
				var animJoints = {}

				var CreateModel = tree => {
					var obj
					if(tree.name !== "HumanoidRootPart") {
						var mat = new THREE.MeshLambertMaterial({ map: this.textures[tree.name] })
						obj = parts[tree.name] = new THREE.Mesh(undefined, mat)
						obj.castShadow = true

						obj.rbxDefaultMesh = tree.meshid
					} else {
						obj = new THREE.Group()
					}
					obj.name = tree.name

					Object.entries(tree.attachments).forEach(([name, cframe]) => {
						var att = new THREE.Group()
						obj.add(att)

						attachments[name] = { cframe, obj: att }
					})

					tree.children.forEach(child => {
						var childObj = CreateModel(child)
						var c0 = new THREE.Group()
						var c1 = new THREE.Group()
						var joint = new THREE.Group()

						obj.add(c0)
						c0.add(joint)
						joint.add(c1)
						c1.add(childObj)

						joints[child.JointName] = animJoints[child.name] = { 
							c0, c1, joint,
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
					this.model.position.set(0, 2.35, 0)
					this.root = CreateModel(R15Tree)
				}
				
				this.model.add(this.root)
				this.animator.setJoints(animJoints)

				this.accessories.forEach(acc => {
					var attachment = acc.attachment = this.attachments[acc.attName]
					if(attachment) attachment.obj.add(acc.obj);
				})
				
				this.refreshBodyParts()
			})
		},
		refreshBodyParts() {
			var changedParts = {}
			var changedJoints = {}
			var changedAttachments = {}

			this.bodyparts.forEach(bp => {
				if(bp.hidden || bp.type !== this.playerType) return;
				if(bp.meshId || bp.baseTexId || bp.overTexId) {
					changedParts[bp.target] = {
						meshId: bp.meshId,
						baseTexId: bp.baseTexId,
						overTexId: bp.overTexId
					}
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

			console.log(changedParts)

			Object.entries(this.parts).forEach(([partName, part]) => {
				var change = changedParts[partName]
				var meshId = change && change.meshId || part.rbxDefaultMesh

				if(part.rbxMeshId !== meshId) {
					part.rbxMeshId = meshId
					clearGeometry(part)
					AssetCache.loadMesh(meshId, mesh => part.rbxMeshId === meshId && applyMesh(part, mesh))
				}

				var baseImg = this.images.base[partName]
				var overImg = this.images.over[partName]
				var baseTexId = change && change.baseTexId || 0
				var overTexId = change && change.overTexId || 0

				if(baseImg && baseImg.rbxTexId !== baseTexId) {
					baseImg.rbxTexId = baseTexId
					baseImg.src = ""
					if(baseTexId > 0) AssetCache.loadImage(baseTexId, url => baseImg.rbxTexId === baseTexId && (baseImg.src = url));
					else baseImg.$trigger("load"); // Need to trigger load to update textures
				}

				if(overImg && overImg.rbxTexId !== overTexId) {
					overImg.rbxTexId = overTexId
					overImg.src = ""
					if(overTexId > 0) AssetCache.loadImage(overTexId, url => overImg.rbxTexId === overTexId && (overImg.src = url));
					else overImg.$trigger("load"); // Need to trigger load to update textures
				}
			})

			Object.entries(this.joints).forEach(([jointName, joint]) => {
				var change = changedJoints[jointName]
				var C0 = change && change[joint.part0] || joint.origC0
				var C1 = change && change[joint.part1] && InvertCFrame(change[joint.part1]) || joint.origC1

				joint.c0.position.setFromMatrixPosition(C0)
				joint.c0.rotation.setFromRotationMatrix(C0)

				joint.c1.position.setFromMatrixPosition(C1)
				joint.c1.rotation.setFromRotationMatrix(C1)
			})

			Object.entries(this.attachments).forEach(([attName, att]) => {
				var cframe = changedAttachments[attName] || att.cframe

				att.obj.position.setFromMatrixPosition(cframe)
				att.obj.rotation.setFromRotationMatrix(cframe)
			})
		}
	})
	
	Avatar.ready = (fn) => {
		avatarTreePromise.then(() => fn())
	}

	return Avatar
})();
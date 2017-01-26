// BTR-RBXScene-AssetCache.js
"use strict"

ANTI.RBXScene.Avatar = (function() {
	var AssetCache = ANTI.RBXScene.AssetCache
	var Animator = ANTI.RBXScene.Animator
	var parseContentUrl = ANTI.RBXParseContentUrl

	function applyMeshToGeometry(geom, mesh) {
		geom.addAttribute("position", new THREE.BufferAttribute(mesh.vertices, 3))
		geom.addAttribute("normal", new THREE.BufferAttribute(mesh.normals, 3))
		geom.addAttribute("uv", new THREE.BufferAttribute(mesh.uvs, 2))
		geom.setIndex(new THREE.BufferAttribute(mesh.faces, 1))
		geom.uvsNeedUpdate = true
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

	function createTexture(url) {
		var texture = new THREE.Texture()

		var img = texture.image = new Image()
		img.crossOrigin = "Anonymous"
		img.addEventListener("load", () => {
			texture.needsUpdate = true
			return true
		})

		if(url)
			img.src = url;

		return texture
	}

	var R6Joints = {
		leftleg: { c0: CFrame(-1,-1,0,-0,-0,-1,0,1,0,1,0,0), c1: CFrame(-0.5,1,0,-0,-0,-1,0,1,0,1,0,0) },
		leftarm: { c0: CFrame(-1,0.5,0,-0,-0,-1,0,1,0,1,0,0), c1: CFrame(0.5,0.5,0,-0,-0,-1,0,1,0,1,0,0) },
		head: { c0: CFrame(0,1,0,-1,-0,-0,0,0,1,0,1,0), c1: CFrame(0,-0.5,0,-1,-0,-0,0,0,1,0,1,0) },
		rightleg: { c0: CFrame(1,-1,0,0,0,1,0,1,0,-1,-0,-0), c1: CFrame(0.5,1,0,0,0,1,0,1,0,-1,-0,-0) },
		rightarm: { c0: CFrame(1,0.5,0,0,0,1,0,1,0,-1,-0,-0), c1: CFrame(-0.5,0.5,0,0,0,1,0,1,0,-1,-0,-0) },
		torso: { c0: CFrame(0,0,0,-1,-0,-0,0,0,1,0,1,0), c1: CFrame(0,0,0,-1,-0,-0,0,0,1,0,1,0) }
	}

	var R6Attachments = {
		head: { Hair: [0,0.6,0], Hat: [0,0.6,0], FaceFront: [0,0,-0.6], FaceCenter: [0,0,0] },
		torso: { Neck: [0,1,0], BodyFront: [0,0,-0.5], BodyBack: [0,0,0.5], LeftCollar: [-1,1,0], RightCollar: [1,1,0], WaistFront: [0,-1,-0.5], WaistCenter: [0,-1,0], WaistBack: [0,-1,0.5] },
		leftarm: { LeftShoulder: [0,1,0] },
		rightarm: { RightShoulder: [0,1,0] }
	}

	function CompositeTexture(hasThree, constructorFn) {
		if(hasThree) {
			var scene = this.scene = new THREE.Scene()
			var camera = this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100)

			var ambient = new THREE.AmbientLight(0xFFFFFF)
			scene.add(ambient)
		}

		var canvas = this.canvas = document.createElement("canvas")
		var ctx = this.context = canvas.getContext("2d")

		this.texture = createTexture()
		this.beforeComposite = []
		this.afterComposite = []
		this.width = 1024
		this.height = 1024

		constructorFn.call(this)

		canvas.width = this.width
		canvas.height = this.height

		if(this.camera)
			this.camera.updateProjectionMatrix();
	}

	var compositeRenderer = null

	Object.assign(CompositeTexture.prototype, {
		update: function() {
			var ctx = this.context

			if(this.background){
				ctx.fillStyle = this.background
				ctx.fillRect(0,0, this.width, this.height)
			}

			if(this.scene) {
				if(!compositeRenderer) {
					compositeRenderer = new THREE.WebGLRenderer({ alpha: true })
				}
				compositeRenderer.setSize(this.width, this.height)
				compositeRenderer.render(this.scene, this.camera)
			}
			this.beforeComposite.forEach(fn => fn())
			if(this.scene) ctx.drawImage(compositeRenderer.domElement, 0,0, this.width, this.height);
			this.afterComposite.forEach(fn => fn())

			this.texture.image.src = this.canvas.toDataURL()
		}
	})

	function HeadCompositeConstructor() {
		this.width = 256
		this.height = 256

		this.face = createTexture()
		this.face.image.src = chrome.runtime.getURL("res/previewer/r6/face.png")

		this.face.image.addEventListener("load", () => this.update())

		this.afterComposite.push(() => {
			this.context.drawImage(this.face.image, 0,0, 256,256)
		})
	}

	function R6CompositeConstructor() {
		this.width = 1024
		this.height = 512

		var size = 2

		this.camera = new THREE.OrthographicCamera(-size/2, size/2, size/4, -size/4, 0.1, 100)
		this.scene.scale.set(size/1024, size/1024, size/1024)
		this.camera.position.set(size/2, size/4, 10)
		this.camera.rotation.set(0, 0, 0)

		var shirtmesh = this.shirtmesh = new THREE.Mesh(undefined, new THREE.MeshPhongMaterial())
		this.scene.add(shirtmesh)

		var pantsmesh = this.pantsmesh = new THREE.Mesh(undefined, new THREE.MeshPhongMaterial())
		this.scene.add(pantsmesh)

		var tshirtmesh = this.tshirtmesh = new THREE.Mesh(undefined, new THREE.MeshPhongMaterial())
		this.scene.add(tshirtmesh)

		var shirt = this.shirt = shirtmesh.material.map = createTexture()
		var pants = this.pants = pantsmesh.material.map = createTexture()
		var tshirt = this.tshirt = tshirtmesh.material.map = createTexture()

		pants.minFilter = THREE.LinearFilter
		shirt.minFilter = THREE.LinearFilter
		tshirt.minFilter = THREE.LinearFilter

		shirtmesh.material.transparent = true
		pantsmesh.material.transparent = true
		tshirtmesh.material.transparent = true

		shirt.image.addEventListener("load", () => this.update())
		pants.image.addEventListener("load", () => this.update())
		tshirt.image.addEventListener("load", () => this.update())

		var meshUrl = chrome.runtime.getURL("res/previewer/r6/shirtTemplate.mesh")
		AssetCache.loadUrl(meshUrl, asset => applyMeshToGeometry(shirtmesh.geometry, asset.as("mesh")))

		var meshUrl = chrome.runtime.getURL("res/previewer/r6/pantsTemplate.mesh")
		AssetCache.loadUrl(meshUrl, asset => applyMeshToGeometry(pantsmesh.geometry, asset.as("mesh")))

		var meshUrl = chrome.runtime.getURL("res/previewer/r6/tshirtTemplate.mesh")
		AssetCache.loadUrl(meshUrl, asset => applyMeshToGeometry(tshirtmesh.geometry, asset.as("mesh")))
		
		var ctx = this.context
		var cachedBodyColors = ctx.createImageData(1024, 512)
		this.beforeComposite.push(() => {
			if(this.shouldUpdateBodyColors) {
				this.shouldUpdateBodyColors = false
				var bc = this.bodyColors
				ctx.fillStyle = bc.torsoColorId
				ctx.fillRect(0,0, 192,448)
				ctx.fillRect(194,322, 272,76)
				ctx.fillRect(272,401, 148,104)

				ctx.fillStyle = bc.rightArmColorId
				ctx.fillRect(200,0, 192,320)
				ctx.fillRect(420,400, 148,104)
				ctx.fillRect(758,322, 76,76)
				ctx.fillRect(898,322, 76,76)

				ctx.fillStyle = bc.leftArmColorId
				ctx.fillRect(400,0, 192,320)
				ctx.fillRect(568,400, 148,104)
				ctx.fillRect(828,322, 76,76)
				ctx.fillRect(194,394, 76,76)

				ctx.fillStyle = bc.rightLegColorId
				ctx.fillRect(600,0, 192,320)
				ctx.fillRect(716,400, 148,104)
				ctx.fillRect(466,322, 76,76)
				ctx.fillRect(610,322, 76,76)

				ctx.fillStyle = bc.leftLegColorId
				ctx.fillRect(800,0, 192,320)
				ctx.fillRect(864,400, 148,104)
				ctx.fillRect(542,322, 76,76)
				ctx.fillRect(684,322, 76,76)

				cachedBodyColors = ctx.getImageData(0,0, 1024,512)
			}

			ctx.putImageData(cachedBodyColors, 0,0)
		})
	}

	function R15TorsoCompositeConstructor() {
		this.width = 388
		this.height = 272

		this.camera = new THREE.OrthographicCamera(-this.width/2, this.width/2, this.height/2, -this.height/2, 0.1, 100)
		this.camera.position.set(this.width/2, this.height/2, 10)
		this.camera.rotation.set(0, 0, 0)

		var shirtmesh = new THREE.Mesh(undefined, new THREE.MeshPhongMaterial())
		this.scene.add(shirtmesh)

		var pantsmesh = new THREE.Mesh(undefined, new THREE.MeshPhongMaterial())
		pantsmesh.position.set(0,0,.1)
		this.scene.add(pantsmesh)

		var shirt = this.shirt = shirtmesh.material.map = createTexture()
		shirtmesh.material.transparent = true
		shirt.minFilter = THREE.LinearFilter

		var pants = this.pants = pantsmesh.material.map = createTexture()
		pantsmesh.material.transparent = true
		pants.minFilter = THREE.LinearFilter

		shirt.image.addEventListener("load", () => this.update())
		pants.image.addEventListener("load", () => this.update())

		var meshUrl = chrome.runtime.getURL("res/previewer/r15/R15CompositTorsoBase.mesh")
		AssetCache.loadUrl(meshUrl, asset => {
			applyMeshToGeometry(shirtmesh.geometry, asset.as("mesh"))
			applyMeshToGeometry(pantsmesh.geometry, asset.as("mesh"))
		})
	}

	function R15LeftCompositeConstructor() {
		this.width = 264
		this.height = 284

		this.camera = new THREE.OrthographicCamera(-this.width/2, this.width/2, this.height/2, -this.height/2, 0.1, 100)
		this.camera.position.set(this.width/2, this.height/2, 10)
		this.camera.rotation.set(0, 0, 0)

		var mesh = new THREE.Mesh(undefined, new THREE.MeshPhongMaterial())
		this.scene.add(mesh)

		var meshtexture = this.meshtexture = mesh.material.map = createTexture()
		mesh.material.transparent = true
		meshtexture.minFilter = THREE.LinearFilter

		meshtexture.image.addEventListener("load", () => this.update())

		var meshUrl = chrome.runtime.getURL("res/previewer/r15/R15CompositLeftArmBase.mesh")
		AssetCache.loadUrl(meshUrl, asset => applyMeshToGeometry(mesh.geometry, asset.as("mesh")))
	}

	function R15RightCompositeConstructor() {
		this.width = 264
		this.height = 284

		this.camera = new THREE.OrthographicCamera(-this.width/2, this.width/2, this.height/2, -this.height/2, 0.1, 100)
		this.camera.position.set(this.width/2, this.height/2, 10)
		this.camera.rotation.set(0, 0, 0)

		var mesh = new THREE.Mesh(undefined, new THREE.MeshPhongMaterial())
		this.scene.add(mesh)

		var meshtexture = this.meshtexture = mesh.material.map = createTexture()
		mesh.material.transparent = true
		meshtexture.minFilter = THREE.LinearFilter

		meshtexture.image.addEventListener("load", () => this.update())

		var meshUrl = chrome.runtime.getURL("res/previewer/r15/R15CompositRightArmBase.mesh")
		AssetCache.loadUrl(meshUrl, asset => applyMeshToGeometry(mesh.geometry, asset.as("mesh")))
	}

	function Avatar(playerType) {
		var model = this.model = new THREE.Object3D()
		this.animator = new Animator()
		this.accessories = []

		this.headComposite = new CompositeTexture(false, HeadCompositeConstructor)
		this.headComposite.material = new THREE.MeshPhongMaterial()
		this.headComposite.material.map = this.headComposite.texture

		this.r6Composite = new CompositeTexture(true, R6CompositeConstructor)
		this.r6Composite.material = new THREE.MeshPhongMaterial()
		this.r6Composite.material.map = this.r6Composite.texture

		this.r15Composites = {
			torso: new CompositeTexture(true, R15TorsoCompositeConstructor),
			leftArm: new CompositeTexture(true, R15LeftCompositeConstructor),
			rightArm: new CompositeTexture(true, R15RightCompositeConstructor),
			leftLeg: new CompositeTexture(true, R15LeftCompositeConstructor),
			rightLeg: new CompositeTexture(true, R15RightCompositeConstructor),
		}

		for(var name in this.r15Composites) {
			var composite = this.r15Composites[name]
			var mat = composite.material = new THREE.MeshPhongMaterial()
			mat.map = composite.texture
		}


		if(playerType)
			this.setPlayerType(playerType);
	}

	Object.assign(Avatar.prototype, {
		setBodyColors: function(bc) {
			this.r6Composite.bodyColors = bc
			this.r6Composite.shouldUpdateBodyColors = true
			this.r6Composite.update()

			$.each(this.r15Composites, (name, composite) => {
				composite.background = bc[name + "ColorId"]
				composite.update()
			})

			this.headComposite.background = bc.headColorId
			this.headComposite.update()
		},
		addAsset: function(assetInfo) {
			switch(assetInfo.assetType.id) {
				case 8: case 41: case 42: case 43:
				case 44: case 45: case 46: case 47:
					AssetCache.loadAsset(assetInfo.id, (asset) => {
						var model = asset.as("model")
						model.forEach((acc) => {
							if(acc.ClassName !== "Accessory")
								return;

							acc.Children.forEach((han) => {
								if(han.ClassName.indexOf("Part") === -1)
									return;

								var mesh = null
								var att = null
								han.Children.forEach((item) => {
									if(item.ClassName === "SpecialMesh")
										mesh = item;
									else if(item.ClassName === "Attachment")
										att = item;
								})

								if(!att)
									return console.log("Couldn't find attachment in asset " + assetInfo.id, model);

								if(!mesh)
									return console.log("Couldn't find mesh in asset " + assetInfo.id, model);

								var attachmentPoint = this.attachmentPoints[att.Name]
								var meshId = parseContentUrl(mesh.MeshId)
								var texId = parseContentUrl(mesh.TextureId)

								if(!attachmentPoint)
									return console.log("Invalid attachment point in asset " + assetInfo.id, att.Name, model);

								if(!meshId)
									return console.log("Couldn't parse mesh id for " + assetInfo.id, model);

								var obj = new THREE.Mesh(undefined, new THREE.MeshPhongMaterial())
								AssetCache.loadAsset(meshId, (asset) => applyMeshToGeometry(obj.geometry, asset.as("mesh")))
								if(texId) {
									var tex = obj.material.map = createTexture()
									AssetCache.loadAsset(texId, (asset) => tex.image.src=asset.as("bloburl"))
								}

								var offset = att.CFrame.slice(0)
								if(mesh.Offset) {
									offset[0] += mesh.Offset[0]
									offset[1] += mesh.Offset[1]
									offset[2] += mesh.Offset[2]
								}

								if(mesh.Scale) {
									obj.scale.set(mesh.Scale[0], mesh.Scale[1], mesh.Scale[2])
								}

								var matrix = CFrame.apply(null, offset)
								matrix.getInverse(matrix)
								obj.position.setFromMatrixPosition(matrix)
								obj.rotation.setFromRotationMatrix(matrix)

								this.accessories.push(obj)

								obj.attachmentPoint = att.Name
								attachmentPoint.add(obj)
							})
						})
					})
					break;
				case 11:
					AssetCache.loadAsset(assetInfo.id, (asset) => {
						var model = asset.as("model")
						model.forEach((shirt) => {
							if(shirt.ClassName !== "Shirt")
								return;

							var shirtId = parseContentUrl(shirt.ShirtTemplate)
							AssetCache.loadAsset(shirtId, (asset) => {
								this.r6Composite.shirt.image.src = asset.as("bloburl")
								this.r15Composites.torso.shirt.image.src = asset.as("bloburl")
								this.r15Composites.leftArm.meshtexture.image.src = asset.as("bloburl")
								this.r15Composites.rightArm.meshtexture.image.src = asset.as("bloburl")
							})
						})
					})
					break;
				case 2:
					AssetCache.loadAsset(assetInfo.id, (asset) => {
						var model = asset.as("model")
						model.forEach((tshirt) => {
							if(tshirt.ClassName !== "ShirtGraphic")
								return;

							var tshirtId = parseContentUrl(tshirt.Graphic)
							AssetCache.loadAsset(tshirtId, (asset) => {
								this.r6Composite.tshirt.image.src = asset.as("bloburl")
							})
						})
					})
					break;
				case 12:
					AssetCache.loadAsset(assetInfo.id, (asset) => {
						var model = asset.as("model")
						model.forEach((pants) => {
							if(pants.ClassName !== "Pants")
								return;

							var pantsId = parseContentUrl(pants.PantsTemplate)
							AssetCache.loadAsset(pantsId, (asset) => {
								this.r6Composite.pants.image.src = asset.as("bloburl")
								this.r15Composites.torso.pants.image.src = asset.as("bloburl")
								this.r15Composites.leftLeg.meshtexture.image.src = asset.as("bloburl")
								this.r15Composites.rightLeg.meshtexture.image.src = asset.as("bloburl")
							})
						})
					})
					break;
				case 18:
					AssetCache.loadAsset(assetInfo.id, (asset) => {
						var model = asset.as("model")
						model.forEach((face) => {
							if(face.ClassName !== "Decal" || face.Name !== "face")
								return;

							var faceId = parseContentUrl(face.Texture)
							AssetCache.loadAsset(faceId, (asset) => this.headComposite.face.image.src=asset.as("bloburl"))
						})
					})
					break;
				default:
					console.log("Unimplemented asset type", assetInfo);
			}
		},
		setPlayerType: function(playerType) {
			if(this.playerType === playerType)
				return;

			if(this.parts)
				this.model.remove.apply(this.model, this.model.children);

			this.playerType = playerType
			var parts = this.parts = {}
			var joints = this.joints = {}
			var attachmentPoints = this.attachmentPoints = {}

			this.animator.setJoints(joints)

			if(playerType === "R6") {
				this.model.position.set(0, 3, 0)

				var head = parts.head = new THREE.Mesh(undefined, this.headComposite.material)
				var torso = parts.torso = new THREE.Mesh(undefined, this.r6Composite.material)
				var rightarm = parts.rightarm = new THREE.Mesh(undefined, this.r6Composite.material)
				var leftarm = parts.leftarm = new THREE.Mesh(undefined, this.r6Composite.material)
				var rightleg = parts.rightleg = new THREE.Mesh(undefined, this.r6Composite.material)
				var leftleg = parts.leftleg = new THREE.Mesh(undefined, this.r6Composite.material)

				torso.add(head, rightarm, leftarm, rightleg, leftleg)
				this.model.add(torso)

				$.each(parts, (name, part) => {
					part.castShadow = true
					var meshUrl = chrome.runtime.getURL("res/previewer/r6/" + name + ".mesh")
					AssetCache.loadUrl(meshUrl, asset => applyMeshToGeometry(part.geometry, asset.as("mesh")))
				})

				$.each(R6Attachments, (partName, dict) => {
					var part = parts[partName]
					$.each(dict, (name, pos) => {
						var attachment = attachmentPoints[name + "Attachment"] = new THREE.Object3D()
						attachment.position.fromArray(pos)
						part.add(attachment)
					})
				})

				$.each(R6Joints, (name, baseJoint) => {
					var joint = joints[name] = {}
					var part = joint.part1 = parts[name]
					var pivot = joint.pivot = new THREE.Object3D()
					var parent = joint.part0 = part.parent

					var c0 = joint.c0 = new THREE.Object3D()
					var c1 = joint.c1 = new THREE.Object3D()

					var c0Matrix = baseJoint.c0
					var c1Matrix = new THREE.Matrix4().getInverse(baseJoint.c1)

					c0.position.setFromMatrixPosition(c0Matrix)
					c0.rotation.setFromRotationMatrix(c0Matrix)

					c1.position.setFromMatrixPosition(c1Matrix)
					c1.rotation.setFromRotationMatrix(c1Matrix)

					c1.add(part)
					pivot.add(c1)
					c0.add(pivot)
					parent.add(c0)
				})

				this.accessories.forEach((acc) => {
					var attachmentPoint = attachmentPoints[acc.attachmentPoint]
					attachmentPoint.add(acc)
				})
			} else if(playerType === "R15") {
				this.model.position.set(0, 2.233, 0)
				AssetCache.loadUrl(chrome.runtime.getURL("res/previewer/r15/characterR15_3.rbxm"), (asset) => {
					var model = asset.as("model")[0]
					var rigData = this.rigData = {
						LeftWrist: { part0Name: "LeftLowerArm", part1Name: "LeftHand" },
						LeftElbow: { part0Name: "LeftUpperArm", part1Name: "LeftLowerArm" },
						LeftShoulder: { part0Name: "UpperTorso", part1Name: "LeftUpperArm" },
						RightWrist: { part0Name: "RightLowerArm", part1Name: "RightHand" },
						RightElbow: { part0Name: "RightUpperArm", part1Name: "RightLowerArm" },
						RightShoulder: { part0Name: "UpperTorso", part1Name: "RightUpperArm" },
						Waist: { part0Name: "LowerTorso", part1Name: "UpperTorso" },
						LeftAnkle: { part0Name: "LeftLowerLeg", part1Name: "LeftFoot" },
						LeftKnee: { part0Name: "LeftUpperLeg", part1Name: "LeftLowerLeg" },
						LeftHip: { part0Name: "LowerTorso", part1Name: "LeftUpperLeg" },
						RightAnkle: { part0Name: "RightLowerLeg", part1Name: "RightFoot" },
						RightKnee: { part0Name: "RightUpperLeg", part1Name: "RightLowerLeg" },
						RightHip: { part0Name: "LowerTorso", part1Name: "RightUpperLeg" },
						Root: { part0Name: "HumanoidRootPart", part1Name: "LowerTorso" },
						Neck: { part0Name: "UpperTorso", part1Name: "Head" },
					}

					model.Children.forEach((part) => {
						if(part.ClassName !== "MeshPart" && part.ClassName !== "Part")
							return;

						var name = part.Name.toLowerCase()
						var obj = null
						if(part.Name === "HumanoidRootPart") {
							obj = this.model
						} else {
							var compositeName = name.replace(/(upper|lower)/g, "").replace("hand","arm").replace("foot","leg").replace("arm", "Arm").replace("leg", "Leg")
							var composite = name === "head"
								? this.headComposite
								: this.r15Composites[compositeName]

							var material = composite ? composite.material : new THREE.MeshPhongMaterial()
							obj = parts[name] = new THREE.Mesh(undefined, material)
							obj.castShadow = true

							if(part.Name === "Head") {
								var meshUrl = chrome.runtime.getURL("res/previewer/r6/head.mesh")
								AssetCache.loadUrl(meshUrl, asset => applyMeshToGeometry(obj.geometry, asset.as("mesh")))
							} else {
								var meshId = parseContentUrl(part.MeshID)
								AssetCache.loadAsset(meshId, asset => applyMeshToGeometry(obj.geometry, asset.as("mesh")))
							}
						}

						part.Children.forEach((item) => {
							if(item.ClassName === "Attachment") {
								var isRigAttachment = item.Name.substr(-13) == "RigAttachment"
								if(isRigAttachment) {
									var jointName = item.Name.slice(0, -13)
									var data = rigData[jointName]

									if(!data)
										return console.log("Unknown rig attachment", item.Name);

									if(data.part0Name === part.Name) {
										data.part0 = obj
										data.c0 = CFrame.apply(null, item.CFrame)
									} else if(data.part1Name === part.Name) {
										data.part1 = obj
										data.c1 = CFrame.apply(null, item.CFrame)
									} else {
										console.log("Not part0 or part1?", item.Name)
									}
								} else {
									var attachment = attachmentPoints[item.Name] = new THREE.Object3D()
									obj.add(attachment)

									var matrix = CFrame.apply(null, item.CFrame)
									attachment.position.setFromMatrixPosition(matrix)
									attachment.rotation.setFromRotationMatrix(matrix)
								}
							}
						})
					})

					$.each(rigData, (_, data) => {
						var joint = data.joint = joints[data.part1Name.toLowerCase()] = {}
						joint.part0 = data.part0
						joint.part1 = data.part1

						var c0 = joint.c0 = new THREE.Object3D()
						var c1 = joint.c1 = new THREE.Object3D()
						var pivot = joint.pivot = new THREE.Object3D()

						var c0Matrix = data.c0
						var c1Matrix = new THREE.Matrix4().getInverse(data.c1)

						c0.position.setFromMatrixPosition(c0Matrix)
						c0.rotation.setFromRotationMatrix(c0Matrix)

						c1.position.setFromMatrixPosition(c1Matrix)
						c1.rotation.setFromRotationMatrix(c1Matrix)	

						c1.add(joint.part1)
						pivot.add(c1)
						c0.add(pivot)
						joint.part0.add(c0)
					})

					this.accessories.forEach((acc) => {
						var attachmentPoint = attachmentPoints[acc.attachmentPoint]
						attachmentPoint.add(acc)
					})
				})
			}
		}
	})

	return Avatar
})();
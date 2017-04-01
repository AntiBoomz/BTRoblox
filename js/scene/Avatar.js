// BTR-RBXScene-Avatar.js
"use strict"

ANTI.RBXScene.Avatar = (function() {
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

	function clearGeometry(geom) {
		geom.removeAttribute("position")
		geom.removeAttribute("normal")
		geom.removeAttribute("uv")
		geom.setIndex(null)
		geom.elementsNeedUpdate = true
		geom.verticesNeedUpdate = true
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
				if(img.src !== "") {
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

		return texture
	}

	function solidColorDataURL(r, g, b) {
		return "data:image/gif;base64,R0lGODlhAQABAPAA" 
			+ btoa(String.fromCharCode(0, r, g, b, 255, 255)) 
			+ "/yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="
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

	const R6BodyPartNames = [
		"torso", "leftarm", "rightarm", "leftleg", "rightleg"
	]

	const R15BodyPartNames = [
		"leftfoot", "lefthand", "leftlowerarm", "leftlowerleg", "leftupperarm", "leftupperleg", "lowertorso", 
		"rightfoot", "righthand", "rightlowerarm", "rightlowerleg", "rightupperarm", "rightupperleg", "uppertorso"
	]

	function CompositeTexture(hasThree, constructorFn) {
		if(hasThree) {
			var scene = this.scene = new THREE.Scene()
			var camera = this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100)

			var ambient = new THREE.AmbientLight(0xFFFFFF)
			scene.add(ambient)
		}

		var canvas = this.canvas = document.createElement("canvas")
		var ctx = this.context = canvas.getContext("2d")

		this.texture = createTexture(canvas)
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

			this.canvas.dispatchEvent(new CustomEvent("compositeupdate"))
			this.texture.needsUpdate = true
		}
	})

	function HeadCompositeConstructor() {
		this.background = "#A3A2A5"
		this.width = 256
		this.height = 256

		this.face = createTexture()
		this.face.image.src = chrome.runtime.getURL("res/previewer/r6/face.png")

		this.face.image.addEventListener("load", () => this.update())

		this.afterComposite.push(() => {
			this.context.drawImage(this.face.image, 0,0, 256,256)
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

		var shirtmesh = this.shirtmesh = new THREE.Mesh(undefined, new THREE.MeshPhongMaterial({
			transparent: true,
			map: textures.shirt
		}))
		this.scene.add(shirtmesh)

		var pantsmesh = this.pantsmesh = new THREE.Mesh(undefined, new THREE.MeshPhongMaterial({
			transparent: true,
			map: textures.pants
		}))
		this.scene.add(pantsmesh)

		var tshirtmesh = this.tshirtmesh = new THREE.Mesh(undefined, new THREE.MeshPhongMaterial({
			transparent: true,
			map: textures.tshirt
		}))
		this.scene.add(tshirtmesh)

		textures.shirt.image.addEventListener("load", () => this.update())
		textures.pants.image.addEventListener("load", () => this.update())
		textures.tshirt.image.addEventListener("load", () => this.update())

		var meshUrl = chrome.runtime.getURL("res/previewer/r6/shirtTemplate.mesh")
		AssetCache.loadUrl(meshUrl, asset => applyMeshToGeometry(shirtmesh.geometry, asset.as("mesh")))

		var meshUrl = chrome.runtime.getURL("res/previewer/r6/pantsTemplate.mesh")
		AssetCache.loadUrl(meshUrl, asset => applyMeshToGeometry(pantsmesh.geometry, asset.as("mesh")))

		var meshUrl = chrome.runtime.getURL("res/previewer/r6/tshirtTemplate.mesh")
		AssetCache.loadUrl(meshUrl, asset => applyMeshToGeometry(tshirtmesh.geometry, asset.as("mesh")))
		
		this.shouldUpdateBodyColors = true
		this.bodyColors = {
			head: "#A3A2A5",
			torso: "#A3A2A5",
			rightarm: "#A3A2A5",
			leftarm: "#A3A2A5",
			rightleg: "#A3A2A5",
			rightarm: "#A3A2A5"
		}

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

		var shirtmesh = new THREE.Mesh(undefined, new THREE.MeshPhongMaterial({
			transparent: true,
			map: textures.shirt
		}))
		this.scene.add(shirtmesh)

		var pantsmesh = new THREE.Mesh(undefined, new THREE.MeshPhongMaterial({
			transparent: true,
			map: textures.pants
		}))
		pantsmesh.position.set(0,0,.1)
		this.scene.add(pantsmesh)

		textures.shirt.image.addEventListener("load", () => this.update())
		textures.pants.image.addEventListener("load", () => this.update())

		var meshUrl = chrome.runtime.getURL("res/previewer/r15/R15CompositTorsoBase.mesh")
		AssetCache.loadUrl(meshUrl, asset => {
			applyMeshToGeometry(shirtmesh.geometry, asset.as("mesh"))
			applyMeshToGeometry(pantsmesh.geometry, asset.as("mesh"))
		})
	}

	function R15LimbCompositeConstructor(texture, meshUrl) {
		this.background = "#A3A2A5"
		this.width = 264
		this.height = 284

		this.camera = new THREE.OrthographicCamera(-this.width/2, this.width/2, this.height/2, -this.height/2, 0.1, 100)
		this.camera.position.set(this.width/2, this.height/2, 10)
		this.camera.rotation.set(0, 0, 0)

		var mesh = new THREE.Mesh(undefined, new THREE.MeshPhongMaterial({
			transparent: true,
			map: texture
		}))
		this.scene.add(mesh)

		texture.image.addEventListener("load", () => this.update())

		AssetCache.loadUrl(meshUrl, asset => applyMeshToGeometry(mesh.geometry, asset.as("mesh")))
	}

	function Avatar(playerType) {
		var model = this.model = new THREE.Object3D()
		this.animator = new Animator()
		this.accessories = []
		this.charmeshes = {
			parts: {},
			rig: {},
			att: {}
		}
		this.attachmentPoints = {}
		this.parts = {}
		this.joints = {}

		this.ptDebounce = 0

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

		R6BodyPartNames.forEach(name => {
			var base = images.base[name] = createImage()
			var over = images.over[name] = createImage()

			textures[name] = mergeTexture(1024,512, base, this.r6Composite.texture.image, over)
		})

		R15BodyPartNames.forEach(name => {
			var compositeName = name.toLowerCase().replace(/upper|lower/g, "").replace(/hand/g, "arm").replace(/foot/g, "leg")
			var composite = this.r15Composites[compositeName]
			var over = images.over[name] = createImage()

			textures[name] = mergeTexture(composite.canvas.width,composite.canvas.height, composite.texture.image, over)
		})

		if(playerType)
			this.setPlayerType(playerType);
	}

	Object.assign(Avatar.prototype, {
		setBodyColors: function(bodyColors) {
			this.r6Composite.bodyColors = bodyColors
			this.r6Composite.shouldUpdateBodyColors = true
			this.r6Composite.update()

			$.each(this.r15Composites, (name, composite) => {
				if(!bodyColors[name])
					return;

				composite.background = bodyColors[name]
				composite.update()
			})

			this.headComposite.background = bodyColors.head
			this.headComposite.update()
		},
		addAsset: function(assetId, assetTypeId) {
			switch(assetTypeId) {
				// Bodyparts
				case 27: case 28: 
				case 29: case 30: case 31:
					var charmeshes = this.charmeshes
					AssetCache.loadAsset(assetId, (asset) => {
						var model = asset.as("model")

						model.forEach((folder) => {
							if(folder.ClassName !== "Folder")
								return;

							if(folder.Name === "R15") {
								folder.Children.forEach((part) => {
									if(part.ClassName !== "MeshPart")
										return;

									var name = part.Name.toLowerCase()
									var bodypart = charmeshes.parts[name] = {}
									var meshId = parseContentUrl(part.MeshID)

									if(this.parts[name]) {
										var obj = this.parts[name]
										obj.useDefaultMesh = false
										clearGeometry(obj.geometry)
									}

									AssetCache.loadAsset(meshId, asset => {
										var mesh = bodypart.mesh = asset.as("mesh")

										if(this.parts[name])
											applyMeshToGeometry(this.parts[name].geometry, mesh);
									})

									var texId = parseContentUrl(part.TextureID)
									if(texId)
										AssetCache.loadAsset(texId, asset => this.images.over[name].src = asset.as("bloburl"));


									part.Children.forEach((item) => {
										if(item.ClassName !== "Attachment")
											return;

										var isRigAttachment = item.Name.substr(-13) == "RigAttachment"
										if(isRigAttachment) {
											var jointName = item.Name.slice(0, -13)
											var cframe = CFrame.apply(null, item.CFrame)

											if(!charmeshes.rig[jointName])
												charmeshes.rig[jointName] = {};

											charmeshes.rig[jointName][part.Name] = cframe

											if(this.rigData && this.rigData[jointName]) {
												var data = this.rigData[jointName]
												var joint = data.joint

												if(data.part0Name === part.Name) {
													data.c0 = cframe

													joint.c0.position.setFromMatrixPosition(data.c0)
													joint.c0.rotation.setFromRotationMatrix(data.c0)
												} else if(data.part1Name === part.Name) {
													data.c1 = cframe
													var c1Matrix = new THREE.Matrix4().getInverse(data.c1)

													joint.c1.position.setFromMatrixPosition(c1Matrix)
													joint.c1.rotation.setFromRotationMatrix(c1Matrix)
												}
											}
										} else {
											var cframe = CFrame.apply(null, item.CFrame)
											var att = this.attachmentPoints[item.Name]

											charmeshes.att[item.Name] = cframe

											if(att) {
												att.position.setFromMatrixPosition(cframe)
												att.rotation.setFromRotationMatrix(cframe)
											}
										}
									})
								})
							} else if(folder.Name === "R6") {
								folder.Children.forEach((charmesh) => {
									if(charmesh.ClassName !== "CharacterMesh")
										return;

									var name = (["head", "torso", "leftarm", "rightarm", "leftleg", "rightleg"])[charmesh.BodyPart.Value]
									var bodypart = charmeshes.parts[name] = {}
									var meshId = charmesh.MeshId

									if(this.parts[name]) {
										var obj = this.parts[name]
										obj.useDefaultMesh = false
										clearGeometry(obj.geometry)
									}

									AssetCache.loadAsset(meshId, (asset) => {
										var mesh = bodypart.mesh = asset.as("mesh")

										if(this.parts[name])
											applyMeshToGeometry(this.parts[name].geometry, mesh);
									})

									var baseTexId = charmesh.BaseTextureId
									if(baseTexId > 0) {
										AssetCache.loadAsset(baseTexId, (asset) => {
											this.images.base[name].src = asset.as("bloburl");
										})
									}

									var overTexId = charmesh.OverlayTextureId
									if(overTexId > 0) {
										AssetCache.loadAsset(overTexId, (asset) => {
											this.images.over[name].src = asset.as("bloburl");
										})
									}
								})
							}
						})
					})
					break

				// Accessories
				case 8: case 41: case 42: case 43:
				case 44: case 45: case 46: case 47:
					AssetCache.loadAsset(assetId, (asset) => {
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
									return console.log("Couldn't find attachment in asset " + assetId, model);

								if(!mesh)
									return console.log("Couldn't find mesh in asset " + assetId, model);

								
								var meshId = parseContentUrl(mesh.MeshId)
								var texId = parseContentUrl(mesh.TextureId)

								if(!meshId)
									return console.log("Couldn't parse mesh id for " + assetId, model);

								var obj = new THREE.Mesh(undefined, new THREE.MeshPhongMaterial())
								var tex = obj.material.map = createTexture()
								tex.image.src = solidColorDataURL(163, 162, 165)

								AssetCache.loadAsset(meshId, (asset) => applyMeshToGeometry(obj.geometry, asset.as("mesh")))
								if(texId) {
									AssetCache.loadAsset(texId, (asset) => {
										tex.image.src = asset.as("bloburl")
									})
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

								var attachmentPoint = this.attachmentPoints[att.Name]
								if(attachmentPoint)
									attachmentPoint.add(obj);
							})
						})
					})
					break;
				case 11:
					AssetCache.loadAsset(assetId, (asset) => {
						var model = asset.as("model")
						model.forEach((shirt) => {
							if(shirt.ClassName !== "Shirt")
								return;

							var texId = parseContentUrl(shirt.ShirtTemplate)
							if(texId)
								AssetCache.loadAsset(texId, asset => this.textures.shirt.image.src = asset.as("bloburl"));
						})
					})
					break;
				case 2:
					AssetCache.loadAsset(assetId, (asset) => {
						var model = asset.as("model")
						model.forEach((tshirt) => {
							if(tshirt.ClassName !== "ShirtGraphic")
								return;

							var texId = parseContentUrl(tshirt.Graphic)
							if(texId)
								AssetCache.loadAsset(texId, asset => this.textures.tshirt.image.src = asset.as("bloburl"));
						})
					})
					break;
				case 12:
					AssetCache.loadAsset(assetId, (asset) => {
						var model = asset.as("model")
						model.forEach((pants) => {
							if(pants.ClassName !== "Pants")
								return;

							var texId = parseContentUrl(pants.PantsTemplate)
							if(texId)
								AssetCache.loadAsset(texId, asset => this.textures.pants.image.src = asset.as("bloburl"));
						})
					})
					break;
				case 18:
					AssetCache.loadAsset(assetId, (asset) => {
						var model = asset.as("model")
						model.forEach((face) => {
							if(face.ClassName !== "Decal" || face.Name !== "face")
								return;

							var texId = parseContentUrl(face.Texture)
							if(texId)
								AssetCache.loadAsset(texId, asset => this.headComposite.face.image.src = asset.as("bloburl"));
						})
					})
					break;
				default:
					console.log("Unimplemented asset type", assetTypeId, assetId);
			}
		},
		setPlayerType: function(playerType) {
			if(this.playerType === playerType)
				return;

			if(this.parts) {
				this.model.remove.apply(this.model, this.model.children)
				for(var name in this.parts) {
					var obj = this.parts[name]
					obj.geometry.dispose()
				}
				this.model.children.forEach(child => child.dispose())
			}

			this.playerType = playerType
			var parts = this.parts = {}
			var joints = this.joints = {}
			var attachmentPoints = this.attachmentPoints = {}

			var ptKey = ++this.ptDebounce

			this.animator.setJoints(joints)

			if(playerType === "R6") {
				this.model.position.set(0, 3, 0)

				parts.head = new THREE.Mesh(undefined, new THREE.MeshPhongMaterial({
					map: this.headComposite.texture
				}))

				R6BodyPartNames.forEach(name => {
					parts[name] = new THREE.Mesh(undefined, new THREE.MeshPhongMaterial({
						map: this.textures[name]
					}))
				})

				parts.torso.add(parts.head, parts.rightarm, parts.leftarm, parts.rightleg, parts.leftleg)
				this.model.add(parts.torso)

				$.each(parts, (name, part) => {
					part.castShadow = true

					var meshdata = this.charmeshes.parts[name]
					if(meshdata) {
						if(meshdata.mesh) {
							applyMeshToGeometry(part.geometry, meshdata.mesh)
						}
					} else {
						part.useDefaultMesh = true
						var meshUrl = chrome.runtime.getURL("res/previewer/r6/" + name + ".mesh")
						AssetCache.loadUrl(meshUrl, asset => {
							if(part.useDefaultMesh) {
								applyMeshToGeometry(part.geometry, asset.as("mesh"));
							}
						})
					}
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
					if(this.ptDebounce !== ptKey)
						return;

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
							var material = null
							if(name === "head") {
								material = new THREE.MeshPhongMaterial({
									map: this.headComposite.texture
								})
							} else {
								material = new THREE.MeshPhongMaterial({
									map: this.textures[name]
								})
							}

							obj = parts[name] = new THREE.Mesh(undefined, material)
							obj.castShadow = true

							var meshdata = this.charmeshes.parts[name]
							if(meshdata) {
								if(meshdata.mesh) {
									applyMeshToGeometry(obj.geometry, meshdata.mesh)
								}
							} else {
								obj.useDefaultMesh = true
								if(part.Name === "Head") {
									var meshUrl = chrome.runtime.getURL("res/previewer/r6/head.mesh")
									AssetCache.loadUrl(meshUrl, asset => {
										if(obj.useDefaultMesh)
											applyMeshToGeometry(obj.geometry, asset.as("mesh"));
									})
								} else {
									var meshId = parseContentUrl(part.MeshID)
									AssetCache.loadAsset(meshId, asset => {
										if(obj.useDefaultMesh)
											applyMeshToGeometry(obj.geometry, asset.as("mesh"));
									})
								}
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

									var jointdata = this.charmeshes.rig[jointName]
									var cframe = CFrame.apply(null, item.CFrame)

									if(data.part0Name === part.Name) {
										data.part0 = obj
										data.c0 = jointdata && jointdata[part.Name] || cframe
									} else if(data.part1Name === part.Name) {
										data.part1 = obj
										data.c1 = jointdata && jointdata[part.Name] || cframe
									} else {
										console.log("Not part0 or part1?", item.Name)
									}
								} else {
									var attachment = attachmentPoints[item.Name] = new THREE.Object3D()
									obj.add(attachment)

									var matrix = this.charmeshes.att[item.Name] || CFrame.apply(null, item.CFrame)
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

						//console.log(_, c0Matrix.elements[12], c0Matrix.elements[13], c0Matrix.elements[14])

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
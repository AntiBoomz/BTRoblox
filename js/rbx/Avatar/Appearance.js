"use strict"

const RBXAppearance = (() => {
	const Vector3 = THREE.Vector3
	const CFrame = RBXAvatar.CFrame
	const InvertCFrame = RBXAvatar.InvertCFrame
	
	const BodyPartEnum = [null, "Torso", "Left Arm", "Right Arm", "Left Leg", "Right Leg"]

	const R15FolderPriority = ["R15ArtistIntent", "R15", "R15Fixed"]

	const HeadMeshes = {
		6340170: "headA", 6340101: "headB", 6340258: "headC", 6340192: "headD", 8330576: "headE", 6340161: "headF",
		8330389: "headG", 6340208: "headH", 6340141: "headI", 6340133: "headJ", 8330578: "headK", 6340269: "headL",
		6340154: "headM", 6340198: "headN", 6340213: "headO", 6340227: "headP"
	}

	class Asset extends EventEmitter {
		constructor(assetId) {
			super()

			this.id = assetId
			this.active = true
			this.enabled = true
			this.loaded = false
			this.didLoadSucceed = false
			this.priority = 1

			this.accessories = []
			this.bodyparts = []
			this.joints = []
			this.attachments = []
			this.clothing = []
			this.loaders = []

			this.loadPromise = new SyncPromise(resolve => {
				this.once("success", resolve)
				this.once("fail", resolve)
			})
		}

		isEmpty() {
			return !(this.accessories.length || this.bodyparts.length || this.joints.length || this.attachments.length || this.clothing.length)
		}

		load() {
			if(this.loaded || this.loading) { return }
			this.loading = true

			if(this.id in HeadMeshes) {
				const name = HeadMeshes[this.id]
				const meshUrl = getURL(`res/previewer/heads/${name}.mesh`)

				this.addBodyPart({ target: "Head", meshId: meshUrl })
				return
			}

			AssetCache.loadModel(this.id, model => {
				if(!model) { return this.fail() }
				if(!this.active) { return }

				let R15Folders

				model.forEach(child => {
					switch(child.ClassName) {
					case "Folder": {
						switch(child.Name) {
						case "R15ArtistIntent": case "R15Fixed": case "R15": {
							if(!R15Folders) { R15Folders = [] }
							R15Folders.push(child)
						} break

						case "R6": {
							this.loadBodyPartR6(child)
						} break
						}
					} break

					case "SpecialMesh": {
						this.loadHead(child)
					} break

					case "Accessory": case "Hat": {
						this.loadAccessory(child)
					} break

					case "Decal": {
						if(child.Name === "face") {
							this.addClothing({
								target: "face",
								texId: child.Texture
							})
						}
					} break

					case "Shirt": {
						this.addClothing({
							target: "shirt",
							texId: child.ShirtTemplate
						})
					} break

					case "Pants": {
						this.addClothing({
							target: "pants",
							texId: child.PantsTemplate
						})
					} break

					case "ShirtGraphic": {
						this.addClothing({
							target: "tshirt",
							texId: child.Graphic
						})
					} break
					}
				})

				if(R15Folders) {
					// Load the R15 folder with highest priority

					R15Folders.sort((a, b) => R15FolderPriority.indexOf(a.Name) - R15FolderPriority.indexOf(b.Name))
					this.loadBodyPartR15(R15Folders[0])
				}

				const fail = () => {
					this.loaded = true
					this.didLoadSucceed = false
	
					this.trigger("fail")
					this.trigger("update")
				}
		
				const success = () => {
					this.loaded = true
					this.didLoadSucceed = true
	
					this.trigger("success")
					this.trigger("update")
				}

				if(!this.loaders.length) {
					success()
				} else {
					SyncPromise.all(this.loaders).then(success, fail)
				}

				delete this.loaders
			})
		}

		setEnabled(enabled) {
			if(this.enabled !== !!enabled) {
				this.enabled = !!enabled
				this.trigger("update")
			}
		}

		addLoader(promise) { this.loaders.push(promise) }

		addAttachment(data) { this.attachments.push(data) }
		addAccessory(data) {
			this.accessories.push(data)

			if(data.meshId) { this.addLoader(AssetCache.loadMesh(true, data.meshId)) }
			if(data.texId) { this.addLoader(AssetCache.loadImage(true, data.texId)) }
		}
		addBodyPart(data) {
			this.bodyparts.push(data)

			if(data.meshId) { this.addLoader(AssetCache.loadMesh(true, data.meshId)) }
			if(data.baseTexId) { this.addLoader(AssetCache.loadImage(true, data.baseTexId)) }
			if(data.overTexId) { this.addLoader(AssetCache.loadImage(true, data.overTexId)) }
		}
		addClothing(data) {
			this.clothing.push(data)

			if(data.texId) { this.addLoader(AssetCache.loadImage(true, data.texId)) }
		}
		addJoint(data) { this.joints.push(data) }

		setPriority(priority) {
			this.priority = priority

			if(this.loaded && this.didLoadSucceed) {
				this.trigger("update")
			}
		}

		remove() {
			if(this.active) {
				this.active = false
				this.trigger("remove")
			}
		}
		
		loadHead(mesh) {
			const scaleTypeValue = mesh.Children.find(x => x.Name === "AvatarPartScaleType")
			const scaleType = scaleTypeValue ? scaleTypeValue.Value : null

			this.addBodyPart({
				target: "Head",
				meshId: mesh.MeshId,
				baseTexId: mesh.TextureId,
				scale: [...mesh.Scale],
				scaleType
			})

			mesh.Children.filter(x => x.ClassName === "Vector3Value" && x.Name.endsWith("Attachment")).forEach(inst => {
				if(inst.Name.endsWith("RigAttachment")) {
					const jointName = inst.Name.substring(0, inst.Name.length - 13)

					this.addJoint({
						target: jointName,
						pos: new Vector3(...inst.Value),

						part: "Head",
						scaleType
					})
				}

				this.addAttachment({
					target: inst.Name,
					pos: new Vector3(...inst.Value),

					part: "Head",
					scaleType
				})
			})
		}

		loadBodyPartR6(folder) {
			folder.Children.filter(x => x.ClassName === "CharacterMesh").forEach(charmesh => {
				const target = BodyPartEnum[charmesh.BodyPart]
				if(!target) { return }
				
				this.addBodyPart({
					playerType: "R6",
					target,

					meshId: +charmesh.MeshId ? AssetCache.toAssetUrl(charmesh.MeshId) : null,
					baseTexId: +charmesh.BaseTextureId ? AssetCache.toAssetUrl(charmesh.BaseTextureId) : null,
					overTexId: +charmesh.OverlayTextureId ? AssetCache.toAssetUrl(charmesh.OverlayTextureId) : null
				})
			})
		}

		loadBodyPartR15(folder) {
			folder.Children.filter(x => x.ClassName === "MeshPart").forEach(part => {
				const scaleTypeValue = part.Children.find(x => x.Name === "AvatarPartScaleType")
				const scaleType = scaleTypeValue ? scaleTypeValue.Value : null

				this.addBodyPart({
					playerType: "R15",
					target: part.Name,

					meshId: part.MeshID,
					overTexId: part.TextureID,
					opacity: 1 - (part.Transparency || 0),
					size: [...(part.size || part.Size)],

					scaleType
				})

				part.Children.filter(x => x.ClassName === "Attachment").forEach(inst => {
					if(inst.Name.endsWith("RigAttachment")) {
						const jointName = inst.Name.substring(0, inst.Name.length - 13)
						this.addJoint({
							target: jointName,
							cframe: CFrame(...inst.CFrame),

							part: part.Name,
							scaleType
						})
					}

					this.addAttachment({
						target: inst.Name,
						cframe: CFrame(...inst.CFrame),

						part: part.Name,
						scaleType
					})
				})
			})
		}

		loadAccessory(accInst) {
			const hanInst = accInst.Children.find(x => x.Name === "Handle")
			if(!hanInst) { return }

			const meshInst = hanInst.Children.find(x => x.ClassName === "SpecialMesh")
			if(!meshInst) { return }
			
			const attInst = hanInst.Children.find(x => x.ClassName === "Attachment")

			const scaleTypeValue = hanInst.Children.find(x => x.Name === "AvatarPartScaleType")
			const scaleType = scaleTypeValue ? scaleTypeValue.Value : null

			const meshId = meshInst.MeshId
			const texId = meshInst.TextureId

			this.addAccessory({
				meshId,
				texId,
				color: meshInst.VertexColor ? [...meshInst.VertexColor] : null,
				opacity: 1 - (meshInst.Transparency || 0),

				cframe: accInst.AttachmentPoint ? InvertCFrame(...accInst.AttachmentPoint) : new THREE.Matrix4(),

				scale: meshInst.Scale ? [...meshInst.Scale] : null,
				offset: meshInst.Offset ? [...meshInst.Offset] : null,

				attName: attInst ? attInst.Name : null,
				attCFrame: attInst ? (attInst.CFrame ? InvertCFrame(...attInst.CFrame) : new THREE.Matrix4()) : null,

				scaleType
			})
		}
	}

	class Appearance extends EventEmitter {
		constructor() {
			super()

			this.assets = new Set()
		}

		startLoadingAssets() {
			this.assets.forEach(asset => asset.load())
		}
		
		addAsset(assetId) {
			const asset = new Asset(assetId)
			this.assets.add(asset)

			const onUpdate = () => this.trigger("update")
			asset.on("update", onUpdate)

			asset.once("remove", () => {
				this.assets.delete(asset)
				asset.off("update", onUpdate)
			})

			onUpdate()
			return asset
		}
	}

	return Appearance
})()
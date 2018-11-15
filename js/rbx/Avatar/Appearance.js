"use strict"

const RBXAppearance = (() => {
	const Vector3 = THREE.Vector3
	const CFrame = RBXAvatar.CFrame
	const InvertCFrame = RBXAvatar.InvertCFrame
	
	const BodyPartEnum = [null, "Torso", "Left Arm", "Right Arm", "Left Leg", "Right Leg"]

	const HeadMeshes = {
		6340170: "headA", 6340101: "headB", 6340258: "headC", 6340192: "headD", 8330576: "headE", 6340161: "headF",
		8330389: "headG", 6340208: "headH", 6340141: "headI", 6340133: "headJ", 8330578: "headK", 6340269: "headL",
		6340154: "headM", 6340198: "headN", 6340213: "headO", 6340227: "headP"
	}

	class Asset extends EventEmitter {
		constructor(assetId, assetTypeId, assetType) {
			super()

			this.id = assetId
			this.type = assetType
			this.typeId = assetTypeId
			this.enabled = true
			this.loaded = false
			this.didLoadSucceed = false
			this.priority = 1

			this.accessories = []
			this.bodyparts = []
			this.joints = []
			this.attachments = []
			this.clothing = []
		}

		load() {
			if(this.loaded || this.loading) { return }
			this.loading = true
			this[this.type]()
		}

		setEnabled(enabled) {
			if(this.enabled !== !!enabled) {
				this.enabled = !!enabled
				this.trigger("update")
			}
		}

		addAttachment(data) { this.attachments.push(data) }
		addAccessory(data) { this.accessories.push(data) }
		addBodyPart(data) { this.bodyparts.push(data) }
		addClothing(data) { this.clothing.push(data) }
		addJoint(data) { this.joints.push(data) }

		setPriority(priority) {
			this.priority = priority

			if(this.loaded && this.didLoadSucceed) {
				this.trigger("update")
			}
		}

		remove() {
			this.trigger("remove")
		}

		fail() {
			if(!this.loaded) {
				this.loaded = true
				this.didLoadSucceed = false

				this.trigger("fail")
				this.trigger("update")
			}
		}

		success() {
			if(!this.loaded) {
				this.loaded = true
				this.didLoadSucceed = true

				this.trigger("success")
				this.trigger("update")
			}
		}
		
		head() {
			if(this.id in HeadMeshes) {
				const name = HeadMeshes[this.id]
				const meshUrl = getURL(`res/previewer/heads/${name}.mesh`)

				this.addBodyPart({ target: "Head", meshId: meshUrl })
				return
			}

			AssetCache.loadModel(this.id, model => {
				if(!model) { return this.fail() }

				const mesh = model.find(x => x.ClassName === "SpecialMesh")
				if(!mesh) { return this.fail() }
				
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

				this.success()
			})
		}

		bodypart() {
			AssetCache.loadModel(this.id, model => {
				if(!model) { return this.fail() }
				
				const R6Folder = model.find(x => x.Name === "R6")
				const R15Folder = model.find(x => x.Name === "R15ArtistIntent") || model.find(x => x.Name === "R15")

				if(R6Folder) {
					R6Folder.Children.filter(x => x.ClassName === "CharacterMesh").forEach(charmesh => {
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

				if(R15Folder) {
					R15Folder.Children.filter(x => x.ClassName === "MeshPart").forEach(part => {
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

				this.success()
			})
		}

		accessory() {
			AssetCache.loadModel(this.id, model => {
				if(!model) { return this.fail() }
				
				const accInst = model.find(x => x.ClassName === "Accessory" || x.ClassName === "Hat")
				if(!accInst) { return this.fail() }

				const hanInst = accInst.Children.find(x => x.Name === "Handle")
				if(!hanInst) { return this.fail() }

				const meshInst = hanInst.Children.find(x => x.ClassName === "SpecialMesh")
				if(!meshInst) { return this.fail() }
				
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

				SyncPromise.all([
					AssetCache.loadMesh(true, meshId),
					AssetCache.loadImage(true, texId)
				]).then(() => this.success())
			})
		}

		face() {
			AssetCache.loadModel(this.id, model => {
				if(!model) { return this.fail() }
				
				const face = model.find(x => x.ClassName === "Decal" && x.Name === "face")
				if(!face) { return this.fail() }

				this.addClothing({
					target: "face",
					texId: face.Texture
				})

				this.success()
			})
		}

		shirt() {
			AssetCache.loadModel(this.id, model => {
				if(!model) { return this.fail() }
				
				const shirt = model.find(x => x.ClassName === "Shirt")
				if(!shirt) { return this.fail() }

				this.addClothing({
					target: "shirt",
					texId: shirt.ShirtTemplate
				})

				this.success()
			})
		}

		pants() {
			AssetCache.loadModel(this.id, model => {
				if(!model) { return this.fail() }
				
				const pants = model.find(x => x.ClassName === "Pants")
				if(!pants) { return this.fail() }

				this.addClothing({
					target: "pants",
					texId: pants.PantsTemplate
				})

				this.success()
			})
		}

		tshirt() {
			AssetCache.loadModel(this.id, model => {
				if(!model) { return this.fail() }
				
				const tshirt = model.find(x => x.ClassName === "ShirtGraphic")
				if(!tshirt) { return this.fail() }

				this.addClothing({
					target: "tshirt",
					texId: tshirt.Graphic
				})

				this.success()
			})
		}
	}

	class Appearance extends EventEmitter {
		constructor() {
			super()

			this.assets = new Set()
		}

		getAssetType(assetTypeId) {
			switch(assetTypeId) {
			case 17: return "head"
			case 18: return "face"
			case 11: return "shirt"
			case 2: return "tshirt"
			case 12: return "pants"

			case 8: case 41: case 42: case 43:
			case 44: case 45: case 46: case 47: return "accessory"

			case 27: case 28: case 29: case 30: case 31: return "bodypart"

			case 48: case 49: case 50: case 51:
			case 52: case 53: case 54: case 55: case 56: return null // Animations

			default: console.log("Unimplemented asset type", assetTypeId)
			}
		}
		
		addAsset(assetId, assetTypeId) {
			const assetType = this.getAssetType(assetTypeId)
			if(!assetType) { return null }

			const asset = new Asset(assetId, assetTypeId, assetType)
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
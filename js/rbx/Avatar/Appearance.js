"use strict"

const RBXAppearance = (() => {
	const BodyPartEnum = [null, "Torso", "Left Arm", "Right Arm", "Left Leg", "Right Leg"]
	const R15FolderPriority = ["R15ArtistIntent", "R15", "R15Fixed"]
	const HeadMeshes = {
		"rbxasset://avatar/heads/head.mesh": "rbxassetid://2957715294",
		"rbxasset://avatar/heads/headA.mesh": "rbxassetid://2957717479",
		"rbxasset://avatar/heads/headB.mesh": "rbxassetid://2957719621",
		"rbxasset://avatar/heads/headC.mesh": "rbxassetid://2957735435",
		"rbxasset://avatar/heads/headD.mesh": "rbxassetid://2957735527",
		"rbxasset://avatar/heads/headE.mesh": "rbxassetid://2957735616",
		"rbxasset://avatar/heads/headF.mesh": "rbxassetid://2957735708",
		"rbxasset://avatar/heads/headG.mesh": "rbxassetid://2957735779",
		"rbxasset://avatar/heads/headH.mesh": "rbxassetid://2957735870",
		"rbxasset://avatar/heads/headI.mesh": "rbxassetid://2957735956",
		"rbxasset://avatar/heads/headJ.mesh": "rbxassetid://2957736171",
		"rbxasset://avatar/heads/headK.mesh": "rbxassetid://2957736290",
		"rbxasset://avatar/heads/headL.mesh": "rbxassetid://2957736404",
		"rbxasset://avatar/heads/headM.mesh": "rbxassetid://2957736496",
		"rbxasset://avatar/heads/headN.mesh": "rbxassetid://2957736621",
		"rbxasset://avatar/heads/headO.mesh": "rbxassetid://2957736751",
		"rbxasset://avatar/heads/headP.mesh": "rbxassetid://2957736879"
	}

	class Asset extends EventEmitter {
		constructor(assetId, assetTypeId = null) {
			super()

			this.id = assetId
			this.assetTypeId = assetTypeId
			
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
			
			this.loadPromise = new SyncPromise()
		}

		isEmpty() {
			return !(this.accessories.length || this.bodyparts.length || this.joints.length || this.attachments.length || this.clothing.length)
		}

		async load() {
			if(this.loaded || this.loading) { return this.loadPromise }
			this.loading = true

			const finish = success => {
				this.loading = false
				this.loaded = true

				this.didLoadSucceed = success

				this.trigger("update")
				this.loadPromise.resolve()
			}
			
			let request = this.id
			
			if(!this.assetTypeId) {
				const json = await RobloxApi.api.getProductInfo(this.id)
				this.assetTypeId = json.AssetTypeId
			}
			
			if(this.assetTypeId === AssetType.Head) { // head
				request = { id: this.id, format: "avatar_meshpart_head" }
			}
			
			AssetCache.loadModel(request, model => {
				if(!this.active) { return }
				if(!model) { return finish(false) }
				
				switch(this.assetTypeId) {
				case AssetType.TShirt:
					this.addClothing({
						target: "tshirt",
						texId: this.validateAndPreload("Image", model[0].Graphic)
					})
					break
				case AssetType.Shirt:
					this.addClothing({
						target: "shirt",
						texId: this.validateAndPreload("Image", model[0].ShirtTemplate)
					})
					break
				case AssetType.Pants:
					this.addClothing({
						target: "pants",
						texId: this.validateAndPreload("Image", model[0].PantsTemplate)
					})
					break
				case AssetType.Face:
					this.addClothing({
						target: "face",
						texId: this.validateAndPreload("Image", model[0].Texture)
					})
					break
				
				case AssetType.Head:
				case AssetType.Torso:
				case AssetType.RightArm:
				case AssetType.LeftArm:
				case AssetType.LeftLeg:
				case AssetType.RightLeg: {
					const R15Folders = []
					
					for(const child of model) {
						if(child.ClassName === "SpecialMesh") {
							if(this.assetTypeId === AssetType.Head) {
								this.loadHeadR6(child)
							}
							
						} else if(child.ClassName === "MeshPart") {
							if(this.assetTypeId === AssetType.Head) {
								this.loadBodyPartsR15([child])
							}
							
						} else if(child.ClassName === "Folder") {
							if(child.Name === "R6") {
								this.loadBodyPartsR6(child.Children)
								
							} else if(R15FolderPriority.includes(child.Name)) {
								R15Folders.push(child)
							}
						}
					}
					
					if(R15Folders.length > 0) {
						R15Folders.sort((a, b) => R15FolderPriority.indexOf(a.Name) - R15FolderPriority.indexOf(b.Name))
						this.loadBodyPartsR15(R15Folders[0].Children)
					}
					
					break
				}
				
				default:
					if(this.assetTypeId === 8 || Object.entries(AssetType).find(x => x[1] === this.assetTypeId)?.[0]?.includes("Accessory")) {
						this.loadAccessory(model[0])
					}
					
				}

				SyncPromise.allSettled(this.loaders).then(() => finish(true))
				delete this.loaders
			})

			return this.loadPromise
		}

		setEnabled(enabled) {
			if(this.enabled !== !!enabled) {
				this.enabled = !!enabled
				this.trigger("update")
			}
		}

		addLoader(promise) { this.loaders.push(promise) }
		
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
			if(this.active) {
				this.active = false
				this.trigger("remove")
			}
		}
		
		validateAndPreload(assetType, assetUrl) {
			if(!assetUrl || !AssetCache.isValidAssetUrl(assetUrl)) {
				return null
			}
			
			switch(assetType) {
			case "Mesh":
				this.addLoader(AssetCache.loadMesh(true, assetUrl))
				break
			case "Image":
				this.addLoader(AssetCache.loadImage(true, assetUrl))
				break
			default:
				throw new Error("Invalid assetType")
			}
			
			return assetUrl
		}
		
		loadHeadR6(mesh) {
			const scaleTypeValue = mesh.Children.find(x => x.Name === "AvatarPartScaleType")
			const scaleType = scaleTypeValue ? scaleTypeValue.Value : null
			
			this.addBodyPart({
				target: "Head",
				
				meshId: this.validateAndPreload("Mesh", HeadMeshes[mesh.MeshId] || mesh.MeshId),
				overTexId: this.validateAndPreload("Image", mesh.TextureId),
				
				disableFace: mesh.Tags?.includes("NoFace") || false,
				
				scale: [...mesh.Scale],
				scaleType: scaleType
			})

			for(const inst of mesh.Children) {
				if(inst.ClassName !== "Vector3Value" || !x.Name.endsWith("Attachment")) { continue }
				const cframe = new THREE.Matrix4().setPosition(...inst.Value)
				
				if(inst.Name.endsWith("RigAttachment")) {
					const jointName = inst.Name.substring(0, inst.Name.length - 13)

					this.addJoint({
						target: jointName,
						cframe: cframe,

						part: "Head",
						scaleType: scaleType
					})
				}

				this.addAttachment({
					target: inst.Name,
					cframe: cframe,

					part: "Head",
					scaleType: scaleType
				})
			}
		}

		loadBodyPartsR6(charmeshes) {
			for(const charmesh of charmeshes) {
				const target = BodyPartEnum[charmesh.BodyPart]
				if(!target) { continue }
				
				this.addBodyPart({
					playerType: "R6",
					target: target,

					meshId: this.validateAndPreload("Mesh", +charmesh.MeshId ? AssetCache.toAssetUrl(charmesh.MeshId) : null),
					baseTexId: this.validateAndPreload("Image", +charmesh.BaseTextureId ? AssetCache.toAssetUrl(charmesh.BaseTextureId) : null),
					overTexId: this.validateAndPreload("Image", +charmesh.OverlayTextureId ? AssetCache.toAssetUrl(charmesh.OverlayTextureId) : null)
				})
			}
		}

		loadBodyPartsR15(parts) {
			for(const part of parts) {
				if(part.ClassName !== "MeshPart") { continue }
				
				const scaleTypeValue = part.Children.find(x => x.Name === "AvatarPartScaleType")
				const scaleType = scaleTypeValue ? scaleTypeValue.Value : null
				
				const bp = {
					playerType: this.assetTypeId === AssetType.Head ? null : "R15",
					target: part.Name,
					
					meshId: this.validateAndPreload("Mesh", part.MeshID || part.MeshId),
					
					opacity: 1 - (part.Transparency || 0),
					size: [...(part.size || part.Size)],

					scaleType: scaleType
				}
				
				if(this.assetTypeId === AssetType.Head) {
					bp.disableFace = !part.Children.find(x => x.ClassName === "Decal" && x.Name.toLowerCase() === "face")
				}
				
				const surfaceAppearance = part.Children.find(x => x.ClassName === "SurfaceAppearance")
				
				if(surfaceAppearance) {
					// alpha mode doesnt seem to do anything for bodyparts, we can ignore it
					
					bp.pbrEnabled = true
					bp.colorMapId = this.validateAndPreload("Image", surfaceAppearance.ColorMap)
					bp.normalMapId = this.validateAndPreload("Image", surfaceAppearance.NormalMap)
					bp.roughnessMapId = this.validateAndPreload("Image", surfaceAppearance.RoughnessMap)
					bp.metalnessMapId = this.validateAndPreload("Image", surfaceAppearance.MetalnessMap)
				} else {
					bp.overTexId = this.validateAndPreload("Image", part.TextureID || part.TextureId)
				}
				
				this.addBodyPart(bp)
				
				for(const inst of part.Children) {
					if(inst.ClassName !== "Attachment") { continue }
					
					const cframe = RBXAvatar.CFrameToMatrix4(...inst.CFrame)
					
					if(inst.Name.endsWith("RigAttachment")) {
						const jointName = inst.Name.substring(0, inst.Name.length - 13)
						
						this.addJoint({
							target: jointName,
							cframe: cframe,

							part: part.Name,
							scaleType: scaleType
						})
					}

					this.addAttachment({
						target: inst.Name,
						cframe: cframe,

						part: part.Name,
						scaleType: scaleType
					})
				}
			}
		}

		loadAccessory(accInst) {
			const hanInst = accInst.Children.find(x => x.Name === "Handle")
			if(!hanInst) { return }
			
			const scaleTypeValue = hanInst.Children.find(x => x.Name === "AvatarPartScaleType")
			const attInst = hanInst.Children.find(x => x.ClassName === "Attachment")

			const scaleType = scaleTypeValue ? scaleTypeValue.Value : null
			let baseColor = hanInst.Color || hanInst.Color3uint8
			
			if(!baseColor) {
				const brickColor = BrickColor[hanInst.BrickColor] || BrickColor[194]
				baseColor = brickColor.color.map(x => x / 255)
			}
			
			const acc = {
				attName: attInst ? attInst.Name : null,
				attCFrame: attInst ? RBXAvatar.CFrameToMatrix4(...attInst.CFrame).invert() : new THREE.Matrix4(),
				
				baseColor: [...baseColor],
				opacity: 1 - (hanInst.Transparency || 0),
				
				legacyHatCFrame: accInst.AttachmentPoint ? RBXAvatar.CFrameToMatrix4(...accInst.AttachmentPoint).invert() : new THREE.Matrix4(),
				scaleType: scaleType
			}
			
			if(hanInst.ClassName === "MeshPart") {
				const wrapLayer = hanInst.Children.find(x => x.ClassName === "WrapLayer")
				if(wrapLayer) { return } // unimplemented
				
				const size = hanInst.Size || hanInst.size
				const initialSize = hanInst.InitialSize
				
				acc.scale = [size[0] / initialSize[0], size[1] / initialSize[1], size[2] / initialSize[2]]
				acc.meshId = this.validateAndPreload("Mesh", hanInst.MeshID || hanInst.MeshId)
				
				const surfaceAppearance = hanInst.Children.find(x => x.ClassName === "SurfaceAppearance")
				
				if(surfaceAppearance) {
					acc.pbrEnabled = true
					acc.pbrAlphaMode = surfaceAppearance.AlphaMode
					
					acc.colorMapId = this.validateAndPreload("Image", surfaceAppearance.ColorMap)
					acc.normalMapId = this.validateAndPreload("Image", surfaceAppearance.NormalMap)
					acc.roughnessMapId = this.validateAndPreload("Image", surfaceAppearance.RoughnessMap)
					acc.metalnessMapId = this.validateAndPreload("Image", surfaceAppearance.MetalnessMap)
				} else {
					acc.texId = this.validateAndPreload("Image", hanInst.TextureID || hanInst.TextureId)
				}
			} else {
				const meshInst = hanInst.Children.find(x => x.ClassName === "SpecialMesh")
				if(!meshInst) { return }
				
				acc.meshId = this.validateAndPreload("Mesh", meshInst.MeshId)
				acc.texId = this.validateAndPreload("Image", meshInst.TextureId)
				
				acc.vertexColor = meshInst.VertexColor ? [...meshInst.VertexColor] : null
				acc.offset = meshInst.Offset ? [...meshInst.Offset] : null
				acc.scale = meshInst.Scale ? [...meshInst.Scale] : null
			}
			
			this.addAccessory(acc)
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
		
		addAsset(assetId, assetTypeId = null) {
			const asset = new Asset(assetId, assetTypeId)
			this.assets.add(asset)

			const onUpdate = () => this.trigger("update")
			asset.on("update", onUpdate)

			asset.once("remove", () => {
				this.assets.delete(asset)
				asset.off("update", onUpdate)
				onUpdate()
			})

			onUpdate()
			return asset
		}
	}

	return Appearance
})()
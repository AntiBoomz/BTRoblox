"use strict"

const RBXAppearance = (() => {
	const CFrame = RBXAvatar.CFrame
	const InvertCFrame = RBXAvatar.InvertCFrame
	
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
				request = {
					id: this.id,
					accept: "rbx-format/avatar_meshpart_head"
				}
			}
			
			AssetCache.loadModel(request, model => {
				if(!this.active) { return }
				if(!model) { return finish(false) }
				
				switch(this.assetTypeId) {
				case AssetType.TShirt:
					this.addClothing({
						target: "tshirt",
						texId: model[0].Graphic
					})
					break
				case AssetType.Shirt:
					this.addClothing({
						target: "shirt",
						texId: model[0].ShirtTemplate
					})
					break
				case AssetType.Pants:
					this.addClothing({
						target: "pants",
						texId: model[0].PantsTemplate
					})
					break
				case AssetType.Face:
					this.addClothing({
						target: "face",
						texId: model[0].Texture
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
		
		loadHeadR6(mesh) {
			const scaleTypeValue = mesh.Children.find(x => x.Name === "AvatarPartScaleType")
			const scaleType = scaleTypeValue ? scaleTypeValue.Value : null
			
			this.addBodyPart({
				target: "Head",
				
				meshId: HeadMeshes[mesh.MeshId] || mesh.MeshId,
				baseTexId: mesh.TextureId,
				
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

					meshId: +charmesh.MeshId ? AssetCache.toAssetUrl(charmesh.MeshId) : null,
					baseTexId: +charmesh.BaseTextureId ? AssetCache.toAssetUrl(charmesh.BaseTextureId) : null,
					overTexId: +charmesh.OverlayTextureId ? AssetCache.toAssetUrl(charmesh.OverlayTextureId) : null
				})
			}
		}

		loadBodyPartsR15(parts) {
			for(const part of parts) {
				if(part.ClassName !== "MeshPart") { continue }
				
				const scaleTypeValue = part.Children.find(x => x.Name === "AvatarPartScaleType")
				const scaleType = scaleTypeValue ? scaleTypeValue.Value : null
				
				let meshId = part.MeshID
				let texId = part.TextureID
				
				let pbrEnabled
				let normalMapId
				let roughnessMapId
				let metalnessMapId
				
				const surfaceAppearance = part.Children.find(x => x.ClassName === "SurfaceAppearance")
				
				if(surfaceAppearance) {
					// we can ignore alphamode for bodyparts, it doesnt seem to work?
					pbrEnabled = true
					texId = surfaceAppearance.ColorMap
					normalMapId = surfaceAppearance.NormalMap
					roughnessMapId = surfaceAppearance.RoughnessMap
					metalnessMapId = surfaceAppearance.MetalnessMap
				}
				
				const bp = {
					playerType: "R15",
					target: part.Name,

					pbrEnabled: pbrEnabled,
					normalMapId: normalMapId,
					roughnessMapId: roughnessMapId,
					metalnessMapId: metalnessMapId,
					
					meshId: meshId,
					overTexId: texId,
					
					opacity: 1 - (part.Transparency || 0),
					size: [...(part.size || part.Size)],

					scaleType: scaleType
				}
				
				if(this.assetTypeId === AssetType.Head) {
					delete bp.playerType
					bp.disableFace = !part.Children.find(x => x.ClassName === "Decal" && x.Name.toLowerCase() === "face")
					
					bp.baseTexId = bp.overTexId
					delete bp.overTexId
				}

				this.addBodyPart(bp)
				
				for(const inst of part.Children) {
					if(inst.ClassName !== "Attachment") { continue }
					
					const cframe = CFrame(...inst.CFrame)
					
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
			
			let vertexColor
			let offset
			let scale
			let attName
			let attCFrame
			let meshId
			let texId
			
			let pbrEnabled
			let pbrAlphaMode
			let normalMapId
			let roughnessMapId
			let metalnessMapId
			
			if(hanInst.ClassName === "MeshPart") {
				const wrapLayer = hanInst.Children.find(x => x.ClassName === "WrapLayer")
				const surfaceAppearance = hanInst.Children.find(x => x.ClassName === "SurfaceAppearance")
				
				if(wrapLayer) { return } // unimplemented
				
				const size = hanInst.size
				const initialSize = hanInst.InitialSize
				
				scale = [size[0] / initialSize[0], size[1] / initialSize[1], size[2] / initialSize[2]]
				meshId = hanInst.MeshID
				texId = hanInst.TextureID
				
				if(surfaceAppearance) {
					pbrEnabled = true
					pbrAlphaMode = surfaceAppearance.AlphaMode
					texId = surfaceAppearance.ColorMap
					normalMapId = surfaceAppearance.NormalMap
					roughnessMapId = surfaceAppearance.RoughnessMap
					metalnessMapId = surfaceAppearance.MetalnessMap
				}
			} else {
				const meshInst = hanInst.Children.find(x => x.ClassName === "SpecialMesh")
				if(!meshInst) { return }
				
				vertexColor = meshInst.VertexColor ? [...meshInst.VertexColor] : null
				offset = meshInst.Offset ? [...meshInst.Offset] : null
				scale = meshInst.Scale ? [...meshInst.Scale] : null
				meshId = meshInst.MeshId
				texId = meshInst.TextureId
			}
			
			const attInst = hanInst.Children.find(x => x.ClassName === "Attachment")
			
			if(attInst) {
				attName = attInst.Name
				attCFrame = attInst.CFrame ? InvertCFrame(...attInst.CFrame) : new THREE.Matrix4()
			}

			const scaleTypeValue = hanInst.Children.find(x => x.Name === "AvatarPartScaleType")
			const scaleType = scaleTypeValue ? scaleTypeValue.Value : null
			
			let baseColor = hanInst.Color || hanInst.Color3uint8
			
			if(!baseColor) {
				const brickColor = BrickColor[hanInst.BrickColor] || BrickColor[194]
				baseColor = brickColor.color.map(x => x / 255)
			}
			
			this.addAccessory({
				vertexColor: vertexColor,
				offset: offset,
				scale: scale,
				attName: attName,
				attCFrame: attCFrame,
				
				pbrEnabled: pbrEnabled,
				pbrAlphaMode: pbrAlphaMode,
				normalMapId: normalMapId,
				roughnessMapId: roughnessMapId,
				metalnessMapId: metalnessMapId,
				
				meshId: meshId,
				texId: texId,
				
				baseColor: [...baseColor],
				opacity: 1 - (hanInst.Transparency || 0),
				
				legacyHatCFrame: accInst.AttachmentPoint ? InvertCFrame(...accInst.AttachmentPoint) : new THREE.Matrix4(),
				scaleType: scaleType
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
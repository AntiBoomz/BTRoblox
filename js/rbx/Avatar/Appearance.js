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
		constructor(assetId, assetTypeId, meta) {
			assert(Number.isSafeInteger(assetTypeId), "no assetTypeId")
			super()

			this.id = assetId
			this.assetTypeId = assetTypeId
			this.meta = meta
			
			this.active = true
			this.enabled = true
			this.priority = 1
			
			this.states = {}
		}

		isEmpty() {
			for(const state of Object.values(this.states)) {
				if(state.accessories.length || state.bodyparts.length || state.clothing.length) {
					return false
				}
			}
			
			return true
		}
		
		getState(playerType) {
			const request = {}
			
			if(playerType !== "R6") {
				if(this.assetTypeId === AssetType.Head || this.assetTypeId === AssetType.DynamicHead) {
					request.format = "avatar_meshpart_head"
				} else if(AccessoryAssetTypeIds.includes(this.assetTypeId)) {
					request.format = "avatar_meshpart_accessory"
				}
			}
			
			const requestKey = request.format ?? ""
			
			if(!this.states[requestKey]) {
				this.states[requestKey] = {
					request: request,
					
					loaded: false,
					loading: false,
					loadPromise: new Promise(),
					
					accessories: [],
					bodyparts: [],
					clothing: [],
				}
			}
			
			return this.states[requestKey]
		}
		
		isLoaded(...loadParams) {
			return this.getState(...loadParams).loaded
		}

		load(...loadParams) {
			const state = this.getState(...loadParams)
			if(!state) { return null }
			
			if(state.loaded || state.loading) { return state }
			state.loading = true

			const finish = success => {
				state.loading = false
				state.loaded = true

				this.trigger("update")
				state.loadPromise.$resolve()
			}
			
			AssetCache.loadModel(this.id, state.request, model => {
				if(!this.active) { return }
				if(!model) { return finish(false) }
				
				this.loaders = []
				
				switch(this.assetTypeId) {
				case AssetType.TShirt:
					state.clothing.push({
						asset: this,
						target: "tshirt",
						texId: this.validateAndPreload("Image", model[0].Graphic)
					})
					break
				case AssetType.Shirt:
					state.clothing.push({
						asset: this,
						target: "shirt",
						texId: this.validateAndPreload("Image", model[0].ShirtTemplate)
					})
					break
				case AssetType.Pants:
					state.clothing.push({
						asset: this,
						target: "pants",
						texId: this.validateAndPreload("Image", model[0].PantsTemplate)
					})
					break
				case AssetType.Face:
					state.clothing.push({
						asset: this,
						target: "face",
						texId: this.validateAndPreload("Image", model[0].Texture)
					})
					break
				
				case AssetType.DynamicHead:
				case AssetType.Head:
				case AssetType.Torso:
				case AssetType.RightArm:
				case AssetType.LeftArm:
				case AssetType.LeftLeg:
				case AssetType.RightLeg: {
					const R15Folders = []
					
					for(const child of model) {
						if(child.ClassName === "SpecialMesh") {
							if(this.assetTypeId === AssetType.Head || this.assetTypeId === AssetType.DynamicHead) {
								this.loadHeadR6(state, child)
							}
							
						} else if(child.ClassName === "MeshPart") {
							if(this.assetTypeId === AssetType.Head || this.assetTypeId === AssetType.DynamicHead) {
								this.loadBodyPartsR15(state, [child])
							}
							
						} else if(child.ClassName === "Folder") {
							if(child.Name === "R6") {
								this.loadBodyPartsR6(state, child.Children)
								
							} else if(R15FolderPriority.includes(child.Name)) {
								R15Folders.push(child)
							}
						}
					}
					
					if(R15Folders.length > 0) {
						R15Folders.sort((a, b) => R15FolderPriority.indexOf(a.Name) - R15FolderPriority.indexOf(b.Name))
						this.loadBodyPartsR15(state, R15Folders[0].Children)
					}
					
					break
				}
				
				default:
					if(AccessoryAssetTypeIds.includes(this.assetTypeId)) {
						this.loadAccessory(state, model[0])
					}
					
				}

				Promise.allSettled(this.loaders).then(() => finish(true))
				delete this.loaders
			})

			return state
		}

		setEnabled(enabled) {
			if(this.enabled !== !!enabled) {
				this.enabled = !!enabled
				this.trigger("update")
			}
		}


		setPriority(priority) {
			this.priority = priority
			this.trigger("update")
		}

		remove() {
			if(this.active) {
				this.active = false
				this.trigger("remove")
			}
		}
		
		validateAndPreload(assetType, assetUrl) {
			if(!assetUrl || !AssetCache.isValidAssetUrl(assetUrl) || !this.loaders) {
				return null
			}
			
			switch(assetType) {
			case "Mesh":
				this.loaders.push(AssetCache.loadMesh(true, assetUrl))
				break
			case "Image":
				this.loaders.push(AssetCache.loadImage(true, assetUrl))
				break
			default:
				throw new Error("Invalid assetType")
			}
			
			return assetUrl
		}
		
		loadHeadR6(state, mesh) {
			const scaleTypeValue = mesh.Children.find(x => x.Name === "AvatarPartScaleType")
			const scaleType = scaleTypeValue ? scaleTypeValue.Value : null
			
			const bp = {
				asset: this,
				attachments: [],
				target: "Head",
				
				meshId: this.validateAndPreload("Mesh", HeadMeshes[mesh.MeshId] || mesh.MeshId),
				texId: this.validateAndPreload("Image", mesh.TextureId),
				
				disableFace: mesh.Tags?.includes("NoFace") || false,
				
				scale: [...mesh.Scale],
				scaleType: scaleType
			}
			
			for(const inst of mesh.Children) {
				if(inst.ClassName !== "Vector3Value" || !inst.Name.endsWith("Attachment")) { continue }
				
				bp.attachments.push({
					target: inst.Name,
					cframe: new THREE.Matrix4().setPosition(...inst.Value),

					part: "Head",
					scaleType: scaleType
				})
			}
			
			state.bodyparts.push(bp)
		}

		loadBodyPartsR6(state, charmeshes) {
			for(const charmesh of charmeshes) {
				const target = BodyPartEnum[charmesh.BodyPart]
				if(!target) { continue }
				
				state.bodyparts.push({
					asset: this,
					attachments: [],
					target: target,

					meshId: this.validateAndPreload("Mesh", +charmesh.MeshId ? AssetCache.toAssetUrl(charmesh.MeshId) : null),
					texId: this.validateAndPreload("Image", +charmesh.OverlayTextureId ? AssetCache.toAssetUrl(charmesh.OverlayTextureId) : null),
					
					baseTexId: this.validateAndPreload("Image", +charmesh.BaseTextureId ? AssetCache.toAssetUrl(charmesh.BaseTextureId) : null)
				})
			}
		}

		loadBodyPartsR15(state, parts) {
			for(const part of parts) {
				if(part.ClassName !== "MeshPart") { continue }
				
				const scaleTypeValue = part.Children.find(x => x.Name === "AvatarPartScaleType")
				const scaleType = scaleTypeValue ? scaleTypeValue.Value : null
				
				const bp = {
					asset: this,
					attachments: [],
					target: part.Name,
					
					meshId: this.validateAndPreload("Mesh", part.MeshID || part.MeshId),
					
					opacity: 1 - (part.Transparency || 0),
					size: [...(part.size || part.Size)],

					scaleType: scaleType
				}
				
				if(this.assetTypeId === AssetType.Head || this.assetTypeId === AssetType.DynamicHead) {
					bp.disableFace = !part.Children.find(x => x.ClassName === "Decal" && x.Name.toLowerCase() === "face")
				}
				
				const surfaceAppearance = part.Children.find(x => x.ClassName === "SurfaceAppearance")
				
				if(surfaceAppearance) {
					bp.pbrEnabled = true
					bp.pbrAlphaMode = surfaceAppearance.AlphaMode ?? 0
					
					bp.colorMapId = this.validateAndPreload("Image", surfaceAppearance.ColorMap)
					bp.normalMapId = this.validateAndPreload("Image", surfaceAppearance.NormalMap)
					bp.roughnessMapId = this.validateAndPreload("Image", surfaceAppearance.RoughnessMap)
					bp.metalnessMapId = this.validateAndPreload("Image", surfaceAppearance.MetalnessMap)
				} else {
					bp.texId = this.validateAndPreload("Image", part.TextureID || part.TextureId)
				}
				
				const wrapTarget = part.Children.find(x => x.ClassName === "WrapTarget")
				
				if(wrapTarget) {
					bp.wrapTarget = {
						cageMeshId: wrapTarget.CageMeshId ?? "",
						cageOrigin: RBXAvatar.CFrameToMatrix4(...wrapTarget.CageOrigin),
						stiffness: wrapTarget.Stiffness ?? 0
					}
				}
				
				for(const inst of part.Children) {
					if(inst.ClassName !== "Attachment") { continue }
					
					bp.attachments.push({
						target: inst.Name,
						cframe: RBXAvatar.CFrameToMatrix4(...inst.CFrame),

						part: part.Name,
						scaleType: scaleType
					})
				}
				
				state.bodyparts.push(bp)
			}
		}

		loadAccessory(state, accInst) {
			const hanInst = accInst.Children.find(x => x.Name === "Handle")
			if(!hanInst) { return }
			
			const scaleTypeValue = hanInst.Children.find(x => x.Name === "AvatarPartScaleType")
			const scaleType = scaleTypeValue ? scaleTypeValue.Value : null
			
			let baseColor = hanInst.Color || hanInst.Color3uint8
			if(!baseColor) {
				const brickColor = BrickColor[hanInst.BrickColor] || BrickColor[194]
				baseColor = brickColor.color.map(x => x / 255)
			}
			
			const acc = {
				asset: this,
				attachments: [],
				
				baseColor: [...baseColor],
				opacity: 1 - (hanInst.Transparency || 0),
				
				legacyHatCFrame: accInst.AttachmentPoint ? RBXAvatar.CFrameToMatrix4(...accInst.AttachmentPoint).invert() : new THREE.Matrix4(),
				scaleType: scaleType
			}
			
			for(let att of hanInst.Children) {
				if(att.ClassName === "Attachment") {
					acc.attachments.push({
						name: att.Name,
						cframe: RBXAvatar.CFrameToMatrix4(...att.CFrame).invert()
					})
				}
			}
			
			if(hanInst.ClassName === "MeshPart") {
				const size = hanInst.Size || hanInst.size
				const initialSize = hanInst.InitialSize
				
				acc.scale = [size[0] / initialSize[0], size[1] / initialSize[1], size[2] / initialSize[2]]
				acc.meshId = this.validateAndPreload("Mesh", hanInst.MeshID || hanInst.MeshId)
				
				const surfaceAppearance = hanInst.Children.find(x => x.ClassName === "SurfaceAppearance")
				if(surfaceAppearance) {
					acc.pbrEnabled = true
					acc.pbrAlphaMode = surfaceAppearance.AlphaMode ?? 0
					
					acc.colorMapId = this.validateAndPreload("Image", surfaceAppearance.ColorMap)
					acc.normalMapId = this.validateAndPreload("Image", surfaceAppearance.NormalMap)
					acc.roughnessMapId = this.validateAndPreload("Image", surfaceAppearance.RoughnessMap)
					acc.metalnessMapId = this.validateAndPreload("Image", surfaceAppearance.MetalnessMap)
				} else {
					acc.texId = this.validateAndPreload("Image", hanInst.TextureID || hanInst.TextureId)
				}
				
				const wrapLayer = hanInst.Children.find(x => x.ClassName === "WrapLayer")
				if(wrapLayer) {
					if((wrapLayer.AutoSkin ?? 0) === 0) {
						acc.wrapLayer = {
							cageMeshId: wrapLayer.CageMeshId ?? "",
							cageOrigin: RBXAvatar.CFrameToMatrix4(...wrapLayer.CageOrigin),
							refMeshId: wrapLayer.ReferenceMeshId ?? "",
							refOrigin: RBXAvatar.CFrameToMatrix4(...wrapLayer.ReferenceOrigin),
							puffiness: wrapLayer.Puffiness ?? 0,
							order: wrapLayer.Order ?? 0
						}
					} else {
						acc.hasAutoSkinWrapLayer = true
					}
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
			
			state.accessories.push(acc)
		}
	}

	class Appearance extends EventEmitter {
		constructor() {
			super()

			this.assets = new Set()
		}

		startLoadingAssets() {
			for(const asset of this.assets) {
				asset.load()
			}
		}
		
		addAsset(assetId, assetTypeId, meta = null) {
			const asset = new Asset(assetId, assetTypeId, meta)
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
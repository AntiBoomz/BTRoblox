"use strict"

{
	const rmdClassIcons = {
		Keyframe: 60, Texture: 10, Message: 33, Sound: 11, RopeConstraint: 89, Status: 2, ReplicatedStorage: 70, ClickDetector: 41, Lighting: 13, Decal: 7, Weld: 34,
		BindableEvent: 67, TremoloSoundEffect: 84, Sparkles: 42, SoundGroup: 85, StarterCharacterScripts: 78, PrismaticConstraint: 88, NetworkReplicator: 29,
		Vector3Value: 4, ReverbSoundEffect: 84, ScreenGui: 47, SunRaysEffect: 83, UIGridLayout: 26, CompressorSoundEffect: 84, TrussPart: 1, FloorWire: 4, TextBox: 51,
		PyramidPart: 1, IntValue: 4, ServerStorage: 69, Chat: 33, CustomEvent: 4, Workspace: 19, BodyPosition: 14, VehicleSeat: 35, SelectionBox: 54, CornerWedgePart: 1,
		ArcHandles: 56, Handles: 53, Flag: 38, RightAngleRampPart: 1, UISizeConstraint: 26, ColorCorrectionEffect: 83, Animation: 60, UnionOperation: 73, PlayerScripts: 78,
		StarterPlayerScripts: 78, SurfaceLight: 13, NetworkServer: 15, Pose: 60, LocalScript: 18, TouchTransmitter: 37, Explosion: 36, TextureTrail: 4, ModuleScript: 76,
		Backpack: 20, ParticleEmitter: 80, Player: 12, ChatService: 33, BindableFunction: 66, RodConstraint: 90, TextLabel: 50, PlayerGui: 46, ImageLabel: 49, Platform: 35,
		Seat: 35, FlagStand: 39, HingeConstraint: 87, CylinderMesh: 8, SpawnLocation: 25, Shirt: 43, IntConstrainedValue: 4, DistortionSoundEffect: 84, BodyVelocity: 14,
		UIAspectRatioConstraint: 26, ForceField: 37, BodyGyro: 14, Hat: 45, BrickColorValue: 4, CharacterMesh: 60, StringValue: 4, Teams: 23, TestService: 68,
		UITextSizeConstraint: 26, BlurEffect: 83, GuiMain: 47, Color3Value: 4, CoreGui: 46, BlockMesh: 8, ScrollingFrame: 48, SpotLight: 13, EchoSoundEffect: 84, Fire: 61,
		Team: 24, RemoteFunction: 74, Camera: 5, NetworkClient: 16, AnimationTrack: 60, UIListLayout: 26, EqualizerSoundEffect: 84, MarketplaceService: 46, Players: 21,
		ServerScriptService: 71, ImageButton: 52, BillboardGui: 64, MeshPart: 73, PartPairLasso: 57, ShirtGraphic: 40, BodyForce: 14, Tool: 17, BodyAngularVelocity: 14,
		NegateOperation: 72, StarterPack: 20, NumberValue: 4, ReplicatedFirst: 70, PrismPart: 1, Part: 1, SpringConstraint: 91, CFrameValue: 4, Hint: 33, ParallelRampPart: 1,
		TerrainRegion: 65, SurfaceSelection: 55, Dialog: 62, RocketPropulsion: 14, Folder: 77, DoubleConstrainedValue: 4, SelectionSphere: 54, Configuration: 58, Model: 2,
		DialogChoice: 63, PointLight: 13, Accoutrement: 32, Smoke: 59, CustomEventReceiver: 4, SpecialMesh: 8, Sky: 28, SkateboardPlatform: 35, Accessory: 32, Pants: 44,
		HopperBin: 22, BodyThrust: 14, Humanoid: 9, RayValue: 4, SelectionPointLasso: 57, TextButton: 51, StarterGear: 20, SurfaceGui: 64, StarterPlayer: 79,
		ChorusSoundEffect: 84, Terrain: 65, SelectionPartLasso: 57, Debris: 30, WedgePart: 1, PitchShiftSoundEffect: 84, RemoteEvent: 75, ObjectValue: 4, JointInstance: 34,
		AnimationController: 60, Frame: 48, SoundService: 31, StarterGui: 46, BallSocketConstraint: 86, FlangeSoundEffect: 84, Attachment: 81, BoolValue: 4, BloomEffect: 83,
		GuiButton: 52, Script: 6
	}

	const hiddenProperties = ["PhysicsData", "MeshData", "ChildData", "InitialSize", "formFactorRaw", "ScriptGuid"]

	const propertyGroups = {
		Appearance: {
			Order: 0,
			List: [
				"BrickColor", "Material", "Reflectance", "Transparency", "WaterColor", "WaterReflectance", "WaterTransparency", "WaterWaveSize",
				"WaterWaveSpeed"
			]
		},
		Data: { Order: 1, List: [] },
		Camera: { Order: 2, List: ["CameraSubject", "CameraType"] },
		Behavior: {
			Order: 3,
			List: [
				"AllowThirdPartySales", "Archivable", "FallenPartsDestroyHeight", "FilteringEnabled", "Fravity", "PGSPhysicsSolverEnabled",
				"StreamingEnabled", "CanCollide", "Locked", "Anchored", "LoadStringEnabled"
			] 
		},
		Part: { Order: 4, List: ["Size", "Shape"] },
		Fog: { Order: 4, List: ["FogColor", "FogEnd", "FogStart"] },
		"Surface Inputs": {
			Order: 5,
			List: [
				"BackParamA", "BackParamB", "BackSurfaceInput", "BottomParamA", "BottomParamB", "BottomSurfaceInput", "FrontParamA", "FrontParamB",
				"FrontSurfaceInput", "LeftParamA", "LeftParamB", "LeftSurfaceInput", "RightParamA", "RightParamB", "RightSurfaceInput", "TopParamA",
				"TopParamB", "TopSurfaceInput"
			] 
		},
		Surface: { Order: 5, List: ["BackSurface", "BottomSurface", "FrontSurface", "LeftSurface", "RightSurface", "TopSurface"] }
	}

	const TransProperties = { size: "Size", scale: "Scale", shape: "Shape" }

	const propertyOrder = []
	Object.values(propertyGroups).forEach(group => {
		group.List.forEach(propName => propertyOrder[propName] = group.Order)
	})

	function fixNum(v) { return Math.round(v * 1e3) / 1e3 }
	function fixNums(arr) {
		const copy = arr.slice(0)
		copy.forEach((v, i) => copy[i] = fixNum(v))
		return copy
	}

	const sortProperties = (a, b) => {
		const diff = (propertyOrder[a] || propertyGroups.Data.Order) - (propertyOrder[b] || propertyGroups.Data.Order)
		return diff === 0 ? (a < b ? -1 : 1) : diff
	}

	class Explorer {
		constructor() {
			this.models = []
			this.selection = []

			const element = this.element = html`
			<div class="btr-explorer-parent">
				<div class="btr-explorer">
					<div class="btr-explorer-header hidden"></div>
					<div class="btr-explorer-loading" style="text-align:center;margin-top:12px;">Loading</div>
				</div>
				<div class="btr-properties">
					<div class="btr-properties-header"></div>
					<ul class="btr-properties-list">
					</ul>
				</div>
			</div>"`

			element.$on("click", ".btr-explorer", () => this.select([]))
				.$on("mousewheel", ".btr-explorer, .btr-properties-list", ev => {
					if(!ev.shiftKey && ev.deltaY !== 0) {
						const cont = ev.currentTarget
						const up = ev.deltaY < 0
						if(up && cont.scrollTop === 0 || !up && cont.scrollTop === cont.scrollHeight - cont.clientHeight) {
							ev.preventDefault()
						}
					}
				})
			
			this.select([])
		}

		select(items) {
			const oldItems = this.selection
			this.selection = items

			oldItems.forEach(item => { item.element.classList.remove("selected") })
			items.forEach(item => { item.element.classList.add("selected") })

			const properties = this.element.$find(".btr-properties")
			const header = properties.$find(".btr-properties-header")
			const propertyList = properties.$find(".btr-properties-list")
			propertyList.$empty()

			if(!items.length) {
				header.textContent = "Properties"
				properties.style.display = "none"
				return
			}

			properties.style.display = ""

			const target = items[0]
			header.textContent = `Properties - ${target.ClassName} "${target.Name}"`

			const names = Object.keys(target.Properties)
				.filter(propName => hiddenProperties.indexOf(propName) === -1)
				.sort(sortProperties)
			
			for(let i = 0, length = names.length; i < length; i++) {
				const name = names[i]
				const prop = target.Properties[name]
				const displayName = TransProperties[name] || name

				const item = html`
				<li class="btr-property-item">
					<div class="btr-property-name" title="${displayName}">${displayName}</div>
					<div class="btr-property-value"></div>
				</li>`

				const valuediv = item.$find(".btr-property-value")
				const value = prop.value

				switch(prop.type) {
				case "int64": {
					valuediv.textContent = value
					break
				}
				case "int":
				case "float":
				case "double": {
					valuediv.textContent = fixNum(value)
					break
				}
				case "string": {
					const input = html`<input type=text>`

					if(value.length > 120) {
						input.value = input.title = value.slice(0, 117) + "..."

						const more = html`<a class=more>...</a>`

						more.$on("click", () => {
							const doc = window.open("", "_blank").document
							const pre = doc.createElement("pre")
							pre.textContent = value
							doc.body.append(pre)
						})

						valuediv.append(more)
					} else {
						input.value = input.title = value
					}

					input.$on("keydown", ev => ev.preventDefault())
					valuediv.append(input)
					break
				}
				case "bool": {
					const input = html`<input type=checkbox>`
					input.checked = value
					input.$on("click", ev => ev.preventDefault())
					valuediv.append(input)
					break
				}
				case "Instance":
					valuediv.textContent = value ? value.Name : ""
					break
				case "CFrame":
				case "Color3":
				case "Vector2":
				case "Vector3":
					valuediv.textContent = fixNums(value).join(", ")
					break
				case "Enum":
					valuediv.textContent = "Enum " + value
					break
				case "UDim2":
					valuediv.textContent = `{${fixNums(value[0]).join(", ")}}, {${fixNums(value[1]).join(", ")}}`
					break
				case "PhysicalProperties":
					valuediv.textContent = value.CustomPhysics ?
						fixNums([value.Density, value.Friction, value.Elasticity, value.FrictionWeight, value.ElasticityWeight]).join(", ") :
						"false"
					break
				default:
					console.log("Unknown property type", name, prop)
					valuediv.textContent = String(value)
				}

				if(!valuediv.title) {
					valuediv.title = valuediv.textContent
				}

				propertyList.append(item)
			}
		}

		addModel(title, model) {
			const lists = this.element.$find(".btr-explorer")
			const header = this.element.$find(".btr-explorer-header")
			const element = html`<ul class=btr-explorer-list></ul>`
			const btn = html`<div class=btr-explorer-view-btn>${title}</div>`

			if(this.models.length) {
				header.classList.remove("hidden")
				element.classList.add("hidden")
			} else {
				btn.classList.add("selected")
				this.element.$find(".btr-explorer-loading").remove()
			}

			btn.$on("click", () => {
				lists.$findAll(">.btr-explorer-list").forEach(x => x.classList.add("hidden"))
				element.classList.remove("hidden")
				header.$findAll(">.btr-explorer-view-btn").forEach(x => x.classList.remove("selected"))
				btn.classList.add("selected")
				this.select([])
			})

			const create = (inst, parent) => {
				const icon = rmdClassIcons[inst.ClassName] || 0
				const item = html`
				<li class=btr-explorer-item-container>
					<div class=btr-explorer-more></div>
					<div class=btr-explorer-item>
						<div class=btr-explorer-icon style="background-position:-${icon * 16}px 0"></div>
						${inst.Name}
					</div>
				</li>`

				const itemBtn = inst.element = item.$find(".btr-explorer-item")
				itemBtn.$on("click", ev => {
					this.select([inst])
					ev.stopPropagation()
				})

				item.$find(".btr-explorer-more").$on("click", ev => {
					ev.currentTarget.parentNode.classList.toggle("closed")
					ev.stopPropagation()
				})

				if(inst.Children.length) {
					item.classList.add("btr-explorer-has-children")
					const childList = html`<ul class=btr-explorer-childlist></ul>`
					inst.Children.forEach(child => create(child, childList))
					item.append(childList)
				}

				parent.append(item)
			}

			model.forEach(inst => create(inst, element))

			header.append(btn)
			lists.append(element)
			this.models.push(model)
		}
	}

	window.Explorer = Explorer
}
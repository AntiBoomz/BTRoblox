"use strict"

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

const hiddenProperties = ["PhysicsData", "MeshData", "ChildData", "InitialSize", "formFactorRaw"]

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


function Explorer() {
	this.isShown = false
	this.views = []

	const domElement = this.domElement = html`
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

	this.loadingElement = domElement.$find(".btr-explorer-loading")
	let selection = []

	function fixNum(v) { return Math.round(v * 1e3) / 1e3 }
	function fixNums(arr) {
		let copy = arr.slice(0)
		copy.forEach((v, i) => copy[i] = fixNum(v))
		return copy
	}

	function setSelection(list) {
		selection.forEach(item => item.classList.remove("selected"))

		selection = list
		list.forEach(item => item.classList.add("selected"))

		let propertyList = domElement.$find(".btr-properties-list")
		propertyList.innerHTML = ""

		if(list.length) {
			domElement.$find(".btr-properties").style.display = ""
			let target = list[0].rbxinstance

			let title = `Properties - ${target.ClassName} "${target.Name}"`
			domElement.$find(".btr-properties-header").textContent = title

			Object.keys(target.Properties).sort((a, b) => {
				let ao = propertyOrder[a]
				let bo = propertyOrder[b]

				let diff = (ao || propertyGroups.Data.Order) - (bo || propertyGroups.Data.Order)
				return diff === 0 ? (a < b ? -1 : 1) : diff
			}).forEach(name => {
				if(hiddenProperties.indexOf(name) !== -1) return;
				const prop = target.Properties[name]
				const displayName = TransProperties[name] || name

				const item = html`
				<li class="btr-property-item">
					<div class="btr-property-name" title="${displayName}">${displayName}</div>
					<div class="btr-property-value"></div>
				</li>`

				const valuediv = item.$find(".btr-property-value")
				let value = prop.value

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
					value = value.trim()
					if(value.length > 120) {
						const blobUrl = URL.createObjectURL(new Blob([value]))
						value = value.substring(0, 117) + "..."

						valuediv.append(html`<a class="more" target="_blank" href="${blobUrl}">...</a>`)
					}
					const input = html`<textarea title="${value}" onkeypress="return false"></textarea>`
					input.value = value
					valuediv.append(input)
					break
				}
				case "bool": {
					const input = html`<input type="checkbox" disabled="true">`
					input.checked = value
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

				valuediv.setAttribute("title", valuediv.textContent)
				propertyList.append(item)
			})
		} else {
			domElement.$find(".btr-properties").style.display = "none"
			domElement.$find(".btr-properties-header").textContent = "Properties"
		}
	}

	setSelection([])

	domElement.$on("click", e => e.stopPropagation())
		.$on("click", ".btr-explorer", e => setSelection([]))
		.$on("click", ".hasChildren>.btr-explorer-more", e => {
			e.stopPropagation()
			e.currentTarget.parentNode.classList.toggle("closed")
		}).$on("click", ".btr-explorer-item", e => {
			e.stopPropagation()
			setSelection([e.currentTarget])
		})
.$on("mousewheel", ".btr-explorer, .btr-properties-list", e => {
			if(e.shiftKey) return;

			let el = e.currentTarget
			if((e.deltaY > 0 && el.scrollTop === el.scrollHeight - el.clientHeight) || (e.deltaY < 0 && el.scrollTop === 0)) {
				return false
			}
		})
.$on("click", ".btr-explorer-view-btn:not(.selected)", e => {
			let id = e.target.getAttribute("data-index")
			if(this.selectedView) {
				this.selectedView.button.classList.remove("selected")
				this.selectedView.domElement.classList.add("hidden")
			}

			this.selectedView = this.views[id]
			this.selectedView.button.classList.add("selected")
			this.selectedView.domElement.classList.remove("hidden")
		})
}

Object.assign(Explorer.prototype, {
	addView(title, model) {
		let view = {}
		this.views.push(view)

		view.title = title
		view.model = model

		let domElement = view.domElement = html`<ul class="btr-explorer-list"></ul>`
		let btn = view.button = html`<div class="btr-explorer-view-btn" data-index="${this.views.length - 1}">${view.title}</div>`

		if(this.views.length === 1) {
			btn.classList.add("selected")
			this.selectedView = view
			this.loadingElement.remove()
		} else {
			domElement.classList.add("hidden")
		}

		if(this.views.length === 2) {
			this.domElement.$find(".btr-explorer-header").classList.remove("hidden")
		}

		function createElements(target, parentElement) {
			let item = html`
			<li class='btr-explorer-item-container'>
				<div class='btr-explorer-more'></div>
				<div class='btr-explorer-item'>
					<div class='btr-explorer-icon' style='background-position:-${(rmdClassIcons[target.ClassName] || 0) * 16}px 0;'></div>
					${target.Name}
				</div>
			</li>`
			parentElement.append(item)

			item.$find(".btr-explorer-item").rbxinstance = target

			if(target.Children.length > 0) {
				item.classList.add("hasChildren")
				let childList = html`<ul class="btr-explorer-childlist"></ul>`
				item.append(childList)

				for(let i = 0; i < target.Children.length; i++) {
					createElements(target.Children[i], childList)
				}
			}
		}

		for(let i = 0; i < model.length; i++) {
			createElements(model[i], domElement)
		}

		this.domElement.$find(".btr-explorer-header").append(btn)
		this.domElement.$find(".btr-explorer").append(domElement)
	}
})
"use strict"

{
	const ExplorerData = {
		RMD: {
			CornerWedgePart: 1, ParallelRampPart: 1, Part: 1, PrismPart: 1, PyramidPart: 1, RightAngleRampPart: 1,
			TrussPart: 1, WedgePart: 1, Model: 2, Status: 2, BoolValue: 4, BrickColorValue: 4, CFrameValue: 4,
			Color3Value: 4, CustomEvent: 4, CustomEventReceiver: 4, DoubleConstrainedValue: 4, FloorWire: 4,
			IntConstrainedValue: 4, IntValue: 4, NumberValue: 4, ObjectValue: 4, RayValue: 4, StringValue: 4,
			ValueBase: 4, Vector3Value: 4, Camera: 5, RenderingTest: 5, Script: 6, Decal: 7, BlockMesh: 8,
			CylinderMesh: 8, SpecialMesh: 8, Humanoid: 9, Texture: 10, Sound: 11, Player: 12, Light: 13,
			Lighting: 13, PointLight: 13, SpotLight: 13, SurfaceLight: 13, BodyAngularVelocity: 14, BodyForce: 14,
			BodyGyro: 14, BodyPosition: 14, BodyThrust: 14, BodyVelocity: 14, RocketPropulsion: 14, NetworkServer: 15,
			NetworkClient: 16, Tool: 17, LocalScript: 18, Workspace: 19, Backpack: 20, StarterGear: 20,
			StarterPack: 20, Players: 21, HopperBin: 22, Teams: 23, Team: 24, SpawnLocation: 25,
			UIAspectRatioConstraint: 26, UIGridLayout: 26, UIListLayout: 26, UIPadding: 26, UIPageLayout: 26,
			UIScale: 26, UISizeConstraint: 26, UITableLayout: 26, UITextSizeConstraint: 26, Sky: 28,
			NetworkReplicator: 29, Debris: 30, SoundService: 31, Accessory: 32, Accoutrement: 32, Chat: 33,
			ChatService: 33, Hint: 33, Message: 33, JointInstance: 34, Weld: 34, Platform: 35, Seat: 35,
			SkateboardPlatform: 35, VehicleSeat: 35, Explosion: 36, ForceField: 37, TouchTransmitter: 37, Flag: 38,
			FlagStand: 39, ShirtGraphic: 40, ClickDetector: 41, Sparkles: 42, Shirt: 43, Pants: 44, Hat: 45,
			CoreGui: 46, MarketplaceService: 46, PlayerGui: 46, PluginGuiService: 46, StarterGui: 46, GuiMain: 47,
			ScreenGui: 47, Frame: 48, ScrollingFrame: 48, ImageLabel: 49, TextLabel: 50, TextBox: 51, TextButton: 51,
			GuiButton: 52, ImageButton: 52, Handles: 53, SelectionBox: 54, SelectionSphere: 54, SurfaceSelection: 55,
			ArcHandles: 56, PartPairLasso: 57, SelectionPartLasso: 57, SelectionPointLasso: 57, Configuration: 58,
			Smoke: 59, Animation: 60, AnimationController: 60, AnimationTrack: 60, CharacterMesh: 60, Keyframe: 60,
			Pose: 60, Fire: 61, Dialog: 62, DialogChoice: 63, BillboardGui: 64, SurfaceGui: 64, Terrain: 65,
			TerrainRegion: 65, BindableFunction: 66, BindableEvent: 67, TestService: 68, ServerStorage: 69,
			ReplicatedFirst: 70, ReplicatedStorage: 70, ServerScriptService: 71, NegateOperation: 72, MeshPart: 73,
			UnionOperation: 73, RemoteFunction: 74, RemoteEvent: 75, ModuleScript: 76, Folder: 77, PlayerScripts: 78,
			StarterCharacterScripts: 78, StarterPlayerScripts: 78, StarterPlayer: 79, ParticleEmitter: 80, Attachment: 81,
			AlignOrientation: 82, AlignPosition: 82, LineForce: 82, Torque: 82, VectorForce: 82, BloomEffect: 83,
			BlurEffect: 83, ColorCorrectionEffect: 83, SunRaysEffect: 83, ChorusSoundEffect: 84, CompressorSoundEffect: 84,
			DistortionSoundEffect: 84, EchoSoundEffect: 84, EqualizerSoundEffect: 84, FlangeSoundEffect: 84,
			PitchShiftSoundEffect: 84, ReverbSoundEffect: 84, TremoloSoundEffect: 84, SoundGroup: 85,
			BallSocketConstraint: 86, Constraint: 86, HingeConstraint: 87, PrismaticConstraint: 88,
			SlidingBallConstraint: 88, RopeConstraint: 89, RodConstraint: 90, SpringConstraint: 91,
			LocalizationService: 92, Trail: 93, WeldConstraint: 94, CylindricalConstraint: 95, Beam: 96,
			LocalizationTable: 97
		},
		EnumDefinitions: {
			ActuatorRelativeTo: ["Attachment0", "Attachment1", "World"],
			ActuatorType: ["None", "Motor", "Servo"],
			AnimationPriority: { 0: "Idle", 1: "Movement", 2: "Action", 1000: "Core" },
			AspectType: ["FitWithinMaxSize", "ScaleWithParentSize"],
			BinType: ["Script", "GameTool", "Grab", "Clone", "Hammer"],
			BodyPart: ["Head", "Torso", "LeftArm", "RightArm", "LeftLeg", "RightLeg"],
			ButtonStyle: ["Custom", "RobloxButtonDefault", "RobloxButton", "RobloxRoundButton", "RobloxRoundDefaultButton", "RobloxRoundDropdownButton"],
			CameraType: ["Fixed", "Attach", "Watch", "Track", "Follow", "Custom", "Scriptable", "Orbital"],
			CollisionFidelity: ["Default", "Hull", "Box"],
			DialogBehaviorType: ["SinglePlayer", "MultiplePlayers"],
			DialogPurpose: ["Quest", "Help", "Shop"],
			DialogTone: ["Neutral", "Friendly", "Enemy"],
			DominantAxis: ["Width", "Height"],
			EasingDirection: ["In", "Out", "InOut"],
			EasingStyle: ["Linear", "Sine", "Back", "Quad", "Quart", "Quint", "Bounce", "Elastic"],
			ElasticBehavior: ["WhenScrollable", "Always", "Never"],
			ExplosionType: ["NoCraters", "Craters", "CratersAndDebris"],
			FillDirection: ["Horizontal", "Vertical"],
			Font: ["Legacy", "Arial", "ArialBold", "SourceSans", "SourceSansBold", "SourceSansLight", "SourceSansItalic", "Bodoni", "Garamond", "Cartoon", "Code", "Highway", "SciFi", "Arcade", "Fantasy", "Antique", "SourceSansSemibold"],
			FontSize: ["Size8", "Size9", "Size10", "Size11", "Size12", "Size14", "Size18", "Size24", "Size36", "Size48", "Size28", "Size32", "Size42", "Size60", "Size96"],
			FormFactor: ["Symmetric", "Brick", "Plate", "Custom"],
			FrameStyle: ["Custom", "ChatBlue", "RobloxSquare", "RobloxRound", "ChatGreen", "ChatRed", "DropShadow"],
			HandlesStyle: ["Resize", "Movement"],
			HorizontalAlignment: ["Center", "Left", "Right"],
			HumanoidDisplayDistanceType: ["Viewer", "Subject", "None"],
			HumanoidHealthDisplayType: ["DisplayWhenDamaged", "AlwaysOn", "AlwaysOff"],
			HumanoidRigType: ["R6", "R15"],
			Material: {
				256: "Plastic", 272: "SmoothPlastic", 288: "Neon", 512: "Wood", 528: "WoodPlanks", 784: "Marble", 788: "Basalt", 800: "Slate", 804: "CrackedLava", 816: "Concrete", 820: "Limestone", 832: "Granite", 836: "Pavement", 848: "Brick", 864: "Pebble", 880: "Cobblestone",
				896: "Rock", 912: "Sandstone", 1040: "CorrodedMetal", 1056: "DiamondPlate", 1072: "Foil", 1088: "Metal", 1280: "Grass", 1284: "LeafyGrass", 1296: "Sand", 1312: "Fabric", 1328: "Snow", 1344: "Mud", 1360: "Ground", 1376: "Asphalt", 1392: "Salt", 1536: "Ice",
				1552: "Glacier", 1568: "Glass", 1792: "Air", 2048: "Water"
			},
			InputType: { 0: "NoInput", 1: "LeftTread", 2: "RightTread", 3: "Steer", 4: "Throttle", 6: "UpDown", 7: "Action1", 8: "Action2", 9: "Action3", 10: "Action4", 11: "Action5", 12: "Constant", 13: "Sin" },
			MeshType: ["Head", "Torso", "Wedge", "Sphere", "Cylinder", "FileMesh", "Brick", "Prism", "Pyramid", "ParallelRamp", "RightAngleRamp", "CornerWedge"],
			NameOcclusion: ["NoOcclusion", "EnemyOcclusion", "OccludeAll"],
			NormalId: ["Right", "Top", "Back", "Left", "Bottom", "Front"],
			PartType: ["Ball", "Block", "Cylinder"],
			PoseEasingDirection: ["In", "Out", "InOut"],
			PoseEasingStyle: ["Linear", "Constant", "Elastic", "Cubic", "Bounce"],
			RollOffMode: ["Inverse", "Linear", "LinearSquare", "InverseTapered"],
			ScaleType: ["Stretch", "Slice", "Tile", "Fit", "Crop"],
			ScreenOrientation: ["LandscapeLeft", "LandscapeRight", "LandscapeSensor", "Portrait", "Sensor"],
			ScrollBarInset: ["None", "ScrollBar", "Always"],
			ScrollingDirection: { 1: "X", 2: "Y", 4: "XY" },
			SizeConstraint: ["RelativeXY", "RelativeXX", "RelativeYY"],
			SortOrder: ["Name", "Custom", "LayoutOrder"],
			StartCorner: ["TopLeft", "TopRight", "BottomLeft", "BottomRight"],
			Style: ["AlternatingSupports", "BridgeStyleSupports", "NoSupports"],
			SurfaceType: ["Smooth", "Glue", "Weld", "Studs", "Inlet", "Universal", "Hinge", "Motor", "SteppingMotor", "Unjoinable", "SmoothNoOutlines"],
			TableMajorAxis: ["RowMajor", "ColumnMajor"],
			TextTruncate: ["None", "AtEnd"],
			TextXAlignment: ["Left", "Right", "Center"],
			TextYAlignment: ["Top", "Center", "Bottom"],
			TextureMode: ["Stretch", "Wrap", "Static"],
			VerticalAlignment: ["Center", "Top", "Bottom"],
			VerticalScrollBarPosition: ["Right", "Left"],
			ZIndexBehavior: ["Global", "Sibling"]
		},
		PropertyEnums: {
			RelativeTo: "ActuatorRelativeTo",
			ActuatorType: "ActuatorType",
			AngularActuatorType: "ActuatorType",
			Priority: "AnimationPriority",
			AspectType: "AspectType",
			BinType: "BinType",
			BodyPart: "BodyPart",
			Style: { _: "ButtonStyle", Frame: "FrameStyle", Handles: "HandlesStyle", TrussPart: "Style" },
			CameraType: "CameraType",
			BehaviorType: "DialogBehaviorType",
			Purpose: "DialogPurpose",
			Tone: "DialogTone",
			DominantAxis: "DominantAxis",
			EasingDirection: { _: "EasingDirection", Pose: "PoseEasingDirection" },
			EasingStyle: { _: "EasingStyle", Pose: "PoseEasingStyle" },
			ElasticBehavior: "ElasticBehavior",
			ExplosionType: "ExplosionType",
			FillDirection: "FillDirection",
			Font: "Font",
			FormFactor: "FormFactor",
			CollisionFidelity: "CollisionFidelity",
			FontSize: "FontSize",
			HorizontalAlignment: "HorizontalAlignment",
			DisplayDistanceType: "HumanoidDisplayDistanceType",
			HealthDisplayType: "HumanoidHealthDisplayType",
			RigType: "HumanoidRigType",
			BackSurfaceInput: "InputType",
			BottomSurfaceInput: "InputType",
			FrontSurfaceInput: "InputType",
			LeftSurfaceInput: "InputType",
			RightSurfaceInput: "InputType",
			TopSurfaceInput: "InputType",
			FloorMaterial: "Material",
			Material: "Material",
			NameOcclusion: "NameOcclusion",
			Face: "NormalId",
			FaceId: "NormalId",
			MeshType: "MeshType",
			TargetSurface: "NormalId",
			EmissionDirection: "NormalId",
			Shape: "PartType",
			RollOffMode: "RollOffMode",
			ScaleType: "ScaleType",
			ScreenOrientation: "ScreenOrientation",
			HorizontalScrollBarInset: "ScrollBarInset",
			VerticalScrollBarInset: "ScrollBarInset",
			ScrollingDirection: "ScrollingDirection",
			SizeConstraint: "SizeConstraint",
			SortOrder: "SortOrder",
			StartCorner: "StartCorner",
			BackSurface: "SurfaceType",
			BottomSurface: "SurfaceType",
			FrontSurface: "SurfaceType",
			LeftSurface: "SurfaceType",
			RightSurface: "SurfaceType",
			TopSurface: "SurfaceType",
			MajorAxis: "TableMajorAxis",
			TextTruncate: "TextTruncate",
			TextXAlignment: "TextXAlignment",
			TextYAlignment: "TextYAlignment",
			TextureMode: "TextureMode",
			VerticalAlignment: "VerticalAlignment",
			VerticalScrollBarPosition: "VerticalScrollBarPosition",
			ZIndexBehavior: "ZIndexBehavior"
		},
		BodyColors: {
			1: "White", 2: "Grey", 3: "Light yellow", 5: "Brick yellow", 6: "Light green (Mint)", 9: "Light reddish violet", 11: "Pastel Blue", 12: "Light orange brown", 18: "Nougat", 21: "Bright red",
			22: "Med. reddish violet", 23: "Bright blue", 24: "Bright yellow", 25: "Earth orange", 26: "Black", 27: "Dark grey", 28: "Dark green", 29: "Medium green", 36: "Lig. Yellowich orange",
			37: "Bright green", 38: "Dark orange", 39: "Light bluish violet", 40: "Transparent", 41: "Tr. Red", 42: "Tr. Lg blue", 43: "Tr. Blue", 44: "Tr. Yellow", 45: "Light blue", 47: "Tr. Flu. Reddish orange",
			48: "Tr. Green", 49: "Tr. Flu. Green", 50: "Phosph. White", 100: "Light red", 101: "Medium red", 102: "Medium blue", 103: "Light grey", 104: "Bright violet", 105: "Br. yellowish orange",
			106: "Bright orange", 107: "Bright bluish green", 108: "Earth yellow", 110: "Bright bluish violet", 111: "Tr. Brown", 112: "Medium bluish violet", 113: "Tr. Medi. reddish violet",
			115: "Med. yellowish green", 116: "Med. bluish green", 118: "Light bluish green", 119: "Br. yellowish green", 120: "Lig. yellowish green", 121: "Med. yellowish orange", 123: "Br. reddish orange",
			124: "Bright reddish violet", 125: "Light orange", 126: "Tr. Bright bluish violet", 127: "Gold", 128: "Dark nougat", 131: "Silver", 133: "Neon orange", 134: "Neon green", 135: "Sand blue",
			136: "Sand violet", 137: "Medium orange", 138: "Sand yellow", 140: "Earth blue", 141: "Earth green", 143: "Tr. Flu. Blue", 145: "Sand blue metallic", 146: "Sand violet metallic",
			147: "Sand yellow metallic", 148: "Dark grey metallic", 149: "Black metallic", 150: "Light grey metallic", 151: "Sand green", 153: "Sand red", 154: "Dark red", 157: "Tr. Flu. Yellow", 158: "Tr. Flu. Red",
			168: "Gun metallic", 176: "Red flip/flop", 178: "Yellow flip/flop", 179: "Silver flip/flop", 180: "Curry", 190: "Fire Yellow", 191: "Flame yellowish orange", 192: "Reddish brown",
			193: "Flame reddish orange", 194: "Medium stone grey", 195: "Royal blue", 196: "Dark Royal blue", 198: "Bright reddish lilac", 199: "Dark stone grey", 200: "Lemon metalic", 208: "Light stone grey",
			209: "Dark Curry", 210: "Faded green", 211: "Turquoise", 212: "Light Royal blue", 213: "Medium Royal blue", 216: "Rust", 217: "Brown", 218: "Reddish lilac", 219: "Lilac", 220: "Light lilac",
			221: "Bright purple", 222: "Light purple", 223: "Light pink", 224: "Light brick yellow", 225: "Warm yellowish orange", 226: "Cool yellow", 232: "Dove blue", 268: "Medium lilac", 301: "Slime green",
			302: "Smoky grey", 303: "Dark blue", 304: "Parsley green", 305: "Steel blue", 306: "Storm blue", 307: "Lapis", 308: "Dark indigo", 309: "Sea green", 310: "Shamrock", 311: "Fossil", 312: "Mulberry",
			313: "Forest green", 314: "Cadet blue", 315: "Electric blue", 316: "Eggplant", 317: "Moss", 318: "Artichoke", 319: "Sage green", 320: "Ghost grey", 321: "Lilac", 322: "Plum", 323: "Olivine",
			324: "Laurel green", 325: "Quill grey", 327: "Crimson", 328: "Mint", 329: "Baby blue", 330: "Carnation pink", 331: "Persimmon", 332: "Maroon", 333: "Gold", 334: "Daisy orange", 335: "Pearl",
			336: "Fog", 337: "Salmon", 338: "Terra Cotta", 339: "Cocoa", 340: "Wheat", 341: "Buttermilk", 342: "Mauve", 343: "Sunrise", 344: "Tawny", 345: "Rust", 346: "Cashmere", 347: "Khaki", 348: "Lily white",
			349: "Seashell", 350: "Burgundy", 351: "Cork", 352: "Burlap", 353: "Beige", 354: "Oyster", 355: "Pine Cone", 356: "Fawn brown", 357: "Hurricane grey", 358: "Cloudy grey", 359: "Linen", 360: "Copper",
			361: "Dirt brown", 362: "Bronze", 363: "Flint", 364: "Dark taupe", 365: "Burnt Sienna", 1001: "Institutional white", 1002: "Mid gray", 1003: "Really black", 1004: "Really red", 1005: "Deep orange",
			1006: "Alder", 1007: "Dusty Rose", 1008: "Olive", 1009: "New Yeller", 1010: "Really blue", 1011: "Navy blue", 1012: "Deep blue", 1013: "Cyan", 1014: "CGA brown", 1015: "Magenta", 1016: "Pink",
			1017: "Deep orange", 1018: "Teal", 1019: "Toothpaste", 1020: "Lime green", 1021: "Camo", 1022: "Grime", 1023: "Lavender", 1024: "Pastel light blue", 1025: "Pastel orange", 1026: "Pastel violet",
			1027: "Pastel blue-green", 1028: "Pastel green", 1029: "Pastel yellow", 1030: "Pastel brown", 1031: "Royal purple", 1032: "Hot pink"
		},
		PropertyGroups: [
			{
				Name: "Appearance",
				Properties: [
					"BrickColor", "Color", "Material", "MaterialColors", "Reflectance", "Transparency", "WaterColor",
					"WaterReflectance", "WaterTransparency", "WaterWaveSize", "WaterWaveSpeed", "SelectionImageObject",
					"Color3", "Texture", "LightEmission", "LightInfluence", "TextureLength", "TextureMode", "TextureSpeed",
					"ZOffset", "Beam.Enabled", "Padding"
				]
			},
			{
				Name: "Data",
				Properties: []
			},
			{
				Name: "Camera",
				Properties: [
					"CameraSubject", "CameraType"
				]
			},
			{
				Name: "Shape",
				Properties: [
					"CurveSize0", "CurveSize1", "FaceCamera", "Segments", "Width0", "Width1", "Beam.Attachment1", "Beam.Attachment0"
				]
			},
			{
				Name: "Behavior",
				Properties: [
					"Anchored", "Archivable", "CanCollide", "CollisionFidelity", "CollisionGroupId", "Disabled", "Locked",
					"ClipsDescendants", "NextSelectionDown", "NextSelectionLeft", "NextSelectionRight", "NextSelectionUp",
					"MaxSize", "MinSize", "FillDirection", "HorizontalAlignment", "SortOrder", "VerticalAlignment"
				]
			},
			{
				Name: "Motion",
				Properties: ["Acceleration"]
			},
			{
				Name: "Particles",
				Properties: ["Drag", "LockedToPart", "VelocityInheritance"]
			},
			{
				Name: "Emission",
				Properties: [
					"EmissionDirection", "ParticleEmitter.Enabled", "ParticleEmitter.Lifetime", "ParticleEmitter.Rate", "ParticleEmitter.Rotation",
					"ParticleEmitter.RotSpeed", "ParticleEmitter.Speed", "ParticleEmitter.SpreadAngle"
				]
			},
			{
				Name: "Part",
				Properties: [
					"CustomPhysicalProperties", "Shape", "BasePart.Size"
				]
			},
			{
				Name: "Image",
				Properties: [
					"Image", "ImageColor3", "ImageRectOffset", "ImageRectSize", "ImageTransparency", "ScaleType", "SliceCenter",
					"TileSize"
				]
			},
			{
				Name: "Text",
				Properties: [
					"Font", "Text", "TextColor3", "TextScaled", "TextSize", "TextStrokeColor3", "TextStrokeTransparency",
					"TextTransparency", "TextWrapped", "TextXAlignment", "TextYAlignment", "FontSize"
				]
			},
			{
				Name: "Localization",
				Properties: [
					"AutoLocalize", "RootLocalizationTable"
				]
			},
			{
				Name: "SurfaceInputs",
				Properties: [
					"BackParamA", "BackParamB", "BackSurfaceInput", "BottomParamA", "BottomParamB", "BottomSurfaceInput",
					"FrontParamA", "FrontParamB", "FrontSurfaceInput", "LeftParamA", "LeftParamB", "LeftSurfaceInput",
					"RightParamA", "RightParamB", "RightSurfaceInput", "TopParamA", "TopParamB", "TopSurfaceInput"
				]
			},
			{
				Name: "Surface",
				Properties: [
					"BackSurface", "BottomSurface", "FrontSurface", "LeftSurface", "RightSurface", "TopSurface"
				]
			},
			{
				Name: "Other",
				Properties: [
					"LODX", "LODY", "FormFactor", "Bevel", "Bevel Roundness", "Bulge", "DraggingV1", "ControllerFlagShown", "Controller", "Tags",
					"InitialSize", "ScriptGuid", "Elasticity", "Friction", "Localize", "SizeFromContents"
				]
			}
		],
		RenamedProperties: { size: "Size", scale: "Scale", shape: "Shape", archivable: "Archivable", Color3uint8: "Color", formFactorRaw: "FormFactor" },
		HiddenProperties: [
			"PhysicsData", "MeshData", "ChildData", "ModelInPrimary"
		]
	}

	const DefaultPropertyGroup = ExplorerData.PropertyGroups.find(x => x.Name === "Data")
	const PropertyToGroup = {}
	const PropertyHidden = {}

	ExplorerData.PropertyGroups.forEach((group, index) => {
		group.Order = index
		group.Properties.forEach(name => {
			if(name in PropertyToGroup) {
				console.warn("[BTRoblox] Property conflict for", name)
			}

			PropertyToGroup[name] = group
		})
	})

	ExplorerData.HiddenProperties.forEach(name => PropertyHidden[name] = true)

	Object.entries(ExplorerData.PropertyEnums).forEach(([prop, enums]) => {
		if(typeof enums === "string") {
			ExplorerData.PropertyEnums[prop] = { _: ExplorerData.EnumDefinitions[enums] }
			return
		}

		Object.entries(enums).forEach(([className, enumName]) => {
			enums[className] = ExplorerData.EnumDefinitions[enumName]
		})
	})

	delete ExplorerData.EnumDefinitions

	function fixNum(v) { return Math.round(v * 1e3) / 1e3 }
	function fixNums(arr) {
		const copy = arr.slice(0)
		copy.forEach((v, i) => copy[i] = fixNum(v))
		return copy
	}

	const sortPropertyGroups = (a, b) => a.Order - b.Order
	const sortProperties = (a, b) => (a[0] < b[0] ? -1 : 1)

	const getPropertyGroup = (name, prop, target) => {
		if(name === "Size" && prop.type === "Vector3" && target.ClassName !== "BoxHandleAdornment") {
			return PropertyToGroup["BasePart.Size"]
		}

		return PropertyToGroup[`${target.ClassName}.${name}`] || PropertyToGroup[name] || DefaultPropertyGroup
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
					<div class="btr-properties-container">
					</div>
				</div>
			</div>"`

			element.$on("click", ".btr-explorer", () => this.select([]))
			this.select([])
		}

		openText(value) {
			const doc = window.open("", "_blank").document
			const pre = doc.createElement("pre")
			pre.textContent = value
			doc.body.append(pre)
		}

		select(items) {
			const oldItems = this.selection
			this.selection = items

			oldItems.forEach(item => { item.element.classList.remove("selected") })
			items.forEach(item => { item.element.classList.add("selected") })

			const properties = this.element.$find(".btr-properties")
			const header = properties.$find(".btr-properties-header")
			const propertyContainer = properties.$find(".btr-properties-container")
			propertyContainer.$empty()

			if(!items.length) {
				header.textContent = "Properties"
				properties.style.display = "none"
				return
			}

			properties.style.display = ""

			const target = items[0]
			header.textContent = `Properties - ${target.ClassName} "${target.Name}"`

			const groups = []
			const groupMap = {}
			Object.entries(target.Properties).forEach(([name, prop]) => {
				name = ExplorerData.RenamedProperties[name] || name
				if(PropertyHidden[name]) { return }

				const group = getPropertyGroup(name, prop, target)
				
				let groupData = groupMap[group.Name]
				if(!groupData) {
					groupData = groupMap[group.Name] = Object.assign({}, group)
					groupData.Properties = []

					groups.push(groupData)
				}

				groupData.Properties.push([name, prop])
			})

			groups.sort(sortPropertyGroups).forEach(group => {
				const titleButton = html`<div class=btr-property-group>${group.Name}</div>`
				const propertiesList = html`<div class=btr-properties-list></div>`
				propertyContainer.append(titleButton, propertiesList)

				titleButton.$on("click", () => {
					titleButton.classList.toggle("closed")
				})

				group.Properties.sort(sortProperties).forEach(([name, prop]) => {
					const nameItem = html`<div class=btr-property-name title=${name}>${name}</div>`
					const valueItem = html`<div class=btr-property-value></div>`

					const value = prop.value
					switch(prop.type) {
					case "int64": {
						valueItem.textContent = value
						break
					}
					case "int":
					case "float":
					case "double": {
						valueItem.textContent = fixNum(value)
						break
					}
					case "string": {
						const input = html`<input type=text readonly>`

						const tooLong = value.length > 120
						if(tooLong || value.includes("\n")) {
							input.value = input.title = (tooLong ? value.slice(0, 117) + "..." : value)

							const more = html`<a class=more>...</a>`
							more.$on("click", () => this.openText(value))

							valueItem.append(more)
						} else {
							const id = RBXParser.resolveAssetId(value)
							if(id) {
								const more = html`<a class=more href="/library/${id}/Redirect" target=_blank>🔗</a>`
								more.title = "Go to asset"
								valueItem.append(more)
							}

							input.value = input.title = value
						}

						valueItem.append(input)
						break
					}
					case "bool": {
						const input = html`<input type=checkbox disabled>`
						input.checked = value
						valueItem.append(input)
						break
					}
					case "Instance":
						valueItem.textContent = value ? value.Name : ""
						break
					case "CFrame":
					case "Vector2":
					case "Vector3":
						valueItem.textContent = fixNums(value).join(", ")
						break
					case "Color3": {
						const rgb = value.map(x => Math.round(x * 255))
						valueItem.textContent = `[${rgb.join(", ")}]`
						valueItem.prepend(html`<span class=btr-color3-preview style=background-color:rgb(${rgb.join(",")})></span>`)
						break
					}
					case "BrickColor":
						valueItem.textContent = ExplorerData.BodyColors[value] || String(value)
						break
					case "Enum": {
						let enumItems = ExplorerData.PropertyEnums[name]
						if(enumItems) { enumItems = enumItems[target.ClassName] || enumItems._ }
						if(enumItems && enumItems[value]) {
							valueItem.textContent = enumItems[value]
						} else {
							valueItem.textContent = "Enum " + value
						}
						break
					}
					case "Rect2D":
						valueItem.textContent = `${fixNums(value).join(", ")}`
						break
					case "UDim":
						valueItem.textContent = `${fixNums(value).join(", ")}`
						break
					case "UDim2":
						valueItem.textContent = `{${fixNums(value[0]).join(", ")}}, {${fixNums(value[1]).join(", ")}}`
						break
					case "PhysicalProperties":
						valueItem.textContent = value.CustomPhysics ?
							fixNums([value.Density, value.Friction, value.Elasticity, value.FrictionWeight, value.ElasticityWeight]).join(", ") :
							"false"
						break
					default:
						console.log("Unknown property type", name, prop)
						valueItem.textContent = String(value)
					}

					if(!valueItem.title) {
						valueItem.title = valueItem.textContent
					}

					const cont = html`
					<div class=btr-property>
						<div class=btr-property-more></div>
						<div class=btr-property-inner></div>
					</div>`
					cont.$find(".btr-property-inner").append(nameItem, valueItem)
					propertiesList.append(cont)
				})
			})
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
				const icon = ExplorerData.RMD[inst.ClassName] || 0
				const item = html`
				<li class=btr-explorer-item-container>
					<div class=btr-explorer-more></div>
					<div class=btr-explorer-item>
						<div class=btr-explorer-icon style="background-position:-${icon * 16}px 0"></div>
						${inst.Name}
					</div>
				</li>`

				const itemBtn = inst.element = item.$find(".btr-explorer-item")
				let lastClick

				itemBtn.$on("click", ev => {
					this.select([inst])
					ev.stopPropagation()

					if(lastClick && Date.now() - lastClick < 500) {
						lastClick = null

						switch(inst.ClassName) {
						case "Script":
						case "LocalScript":
						case "ModuleScript":
							this.openText(inst.Source || "")
							break
						default:
							item.classList.toggle("closed")
						}
					} else {
						lastClick = Date.now()
					}
				})

				item.$find(".btr-explorer-more").$on("click", ev => {
					item.classList.toggle("closed")
					ev.stopPropagation()
				})

				parent.append(item)

				if(inst.Children.length) {
					item.classList.add("btr-explorer-has-children")
					const childList = html`<ul class=btr-explorer-childlist></ul>`
					inst.Children.forEach(child => create(child, childList))
					item.after(childList)
				}
			}

			model.forEach(inst => create(inst, element))

			header.append(btn)
			lists.append(element)
			this.models.push(model)
		}
	}

	window.Explorer = Explorer
}
/* eslint-disable */
"use strict"

const ApiDump = (() => {
	const Data = {
		Categories: ["Data","Behavior","Appearance","Derived Data","Shape","Goals","Thrust","Turn","Camera","Image","Attachments","Compliance","AlignOrientation","AlignPosition","BallSocket","Limits","TwistLimits","Hinge","Servo","Motor","Derived","LineForce","Rod","Rope","Slider","Cylinder","AngularLimits","AngularServo","AngularMotor","Spring","Torque","VectorForce","Axes","Localization","Text","Scrolling","State","Control","Game","Surface Inputs","Surface","Part ","Teams","Forcefield","Motion","Particles","Emission","Input","Parts"],
		Enums: [
			["AnimationPriority",{0:"Idle",1:"Movement",2:"Action",1000:"Core"}],
			["ScreenOrientation",["LandscapeLeft","LandscapeRight","LandscapeSensor","Portrait","Sensor"]],
			["TextureMode",["Stretch","Wrap","Static"]],
			["CameraType",["Fixed","Attach","Watch","Track","Follow","Custom","Scriptable","Orbital"]],
			["BodyPart",["Head","Torso","LeftArm","RightArm","LeftLeg","RightLeg"]],
			["ActuatorType",["None","Motor","Servo"]],
			["ActuatorRelativeTo",["Attachment0","Attachment1","World"]],
			["MeshType",["Head","Torso","Wedge","Sphere","Cylinder","FileMesh","Brick","Prism","Pyramid","ParallelRamp","RightAngleRamp","CornerWedge"]],
			["DialogBehaviorType",["SinglePlayer","MultiplePlayers"]],
			["DialogPurpose",["Quest","Help","Shop"]],
			["DialogTone",["Neutral","Friendly","Enemy"]],
			["ExplosionType",["NoCraters","Craters","CratersAndDebris"]],
			["NormalId",["Right","Top","Back","Left","Bottom","Front"]],
			["SizeConstraint",["RelativeXY","RelativeXX","RelativeYY"]],
			["FrameStyle",["Custom","ChatBlue","RobloxSquare","RobloxRound","ChatGreen","ChatRed","DropShadow"]],
			["ButtonStyle",["Custom","RobloxButtonDefault","RobloxButton","RobloxRoundButton","RobloxRoundDefaultButton","RobloxRoundDropdownButton"]],
			["ScaleType",["Stretch","Slice","Tile","Fit","Crop"]],
			["Font",["Legacy","Arial","ArialBold","SourceSans","SourceSansBold","SourceSansLight","SourceSansItalic","Bodoni","Garamond","Cartoon","Code","Highway","SciFi","Arcade","Fantasy","Antique","SourceSansSemibold"]],
			["FontSize",["Size8","Size9","Size10","Size11","Size12","Size14","Size18","Size24","Size36","Size48","Size28","Size32","Size42","Size60","Size96"]],
			["TextTruncate",["None","AtEnd"]],
			["TextXAlignment",["Left","Right","Center"]],
			["TextYAlignment",["Top","Center","Bottom"]],
			["ElasticBehavior",["WhenScrollable","Always","Never"]],
			["ScrollBarInset",["None","ScrollBar","Always"]],
			["ScrollingDirection",["X","Y",,"XY"]],
			["VerticalScrollBarPosition",["Right","Left"]],
			["ZIndexBehavior",["Global","Sibling"]],
			["HandlesStyle",["Resize","Movement"]],
			["BinType",["Script","GameTool","Grab","Clone","Hammer"]],
			["HumanoidDisplayDistanceType",["Viewer","Subject","None"]],
			["Material",{256:"Plastic",272:"SmoothPlastic",288:"Neon",512:"Wood",528:"WoodPlanks",784:"Marble",788:"Basalt",800:"Slate",804:"CrackedLava",816:"Concrete",820:"Limestone",832:"Granite",836:"Pavement",848:"Brick",864:"Pebble",880:"Cobblestone",896:"Rock",912:"Sandstone",1040:"CorrodedMetal",1056:"DiamondPlate",1072:"Foil",1088:"Metal",1280:"Grass",1284:"LeafyGrass",1296:"Sand",1312:"Fabric",1328:"Snow",1344:"Mud",1360:"Ground",1376:"Asphalt",1392:"Salt",1536:"Ice",1552:"Glacier",1568:"Glass",1792:"Air",2048:"Water"}],
			["HumanoidHealthDisplayType",["DisplayWhenDamaged","AlwaysOn","AlwaysOff"]],
			["NameOcclusion",["NoOcclusion","EnemyOcclusion","OccludeAll"]],
			["HumanoidRigType",["R6","R15"]],
			["SurfaceType",["Smooth","Glue","Weld","Studs","Inlet","Universal","Hinge","Motor","SteppingMotor","Unjoinable","SmoothNoOutlines"]],
			["InputType",["NoInput","LeftTread","RightTread","Steer","Throttle",,"UpDown","Action1","Action2","Action3","Action4","Action5","Constant","Sin"]],
			["FormFactor",["Symmetric","Brick","Plate","Custom"]],
			["PartType",["Ball","Block","Cylinder"]],
			["CollisionFidelity",["Default","Hull","Box"]],
			["Style",["AlternatingSupports","BridgeStyleSupports","NoSupports"]],
			["PathStatus",["Success","ClosestNoPath","ClosestOutOfRange","FailStartNotEmpty","FailFinishNotEmpty","NoPath"]],
			["PoseEasingDirection",["In","Out","InOut"]],
			["PoseEasingStyle",["Linear","Constant","Elastic","Cubic","Bounce"]],
			["RollOffMode",["Inverse","Linear","LinearSquare","InverseTapered"]],
			["PlaybackState",["Begin","Delayed","Playing","Paused","Completed","Cancelled"]],
			["AspectType",["FitWithinMaxSize","ScaleWithParentSize"]],
			["DominantAxis",["Width","Height"]],
			["FillDirection",["Horizontal","Vertical"]],
			["HorizontalAlignment",["Center","Left","Right"]],
			["SortOrder",["Name","Custom","LayoutOrder"]],
			["VerticalAlignment",["Center","Top","Bottom"]],
			["StartCorner",["TopLeft","TopRight","BottomLeft","BottomRight"]],
			["EasingDirection",["In","Out","InOut"]],
			["EasingStyle",["Linear","Sine","Back","Quad","Quart","Quint","Bounce","Elastic"]],
			["TableMajorAxis",["RowMajor","ColumnMajor"]]
		],
		Classes: [
			["Instance",{Archivable:1}],
			["Accoutrement",{AttachmentForward:2,AttachmentPoint:2,AttachmentPos:2,AttachmentRight:2,AttachmentUp:2}],
			["Accessory",1],
			["Hat",1],
			["AnimationTrack",{Priority:[]}],
			["Attachment",{Axis:3,SecondaryAxis:3,Visible:2,WorldAxis:3,WorldCFrame:3,WorldOrientation:3,WorldPosition:3,WorldRotation:3,WorldSecondaryAxis:3}],
			["PlayerGui",{CurrentScreenOrientation:[,1],ScreenOrientation:[,1],SelectionImageObject:2}],
			["Beam",{Attachment0:4,Attachment1:4,Color:2,CurveSize0:4,CurveSize1:4,Enabled:2,FaceCamera:4,LightEmission:2,LightInfluence:2,Segments:4,Texture:2,TextureLength:2,TextureMode:[2,2],TextureSpeed:2,Transparency:2,Width0:4,Width1:4,ZOffset:2}],
			["BodyAngularVelocity",{AngularVelocity:5,MaxTorque:5,P:5}],
			["BodyForce",{Force:5}],
			["BodyGyro",{CFrame:5,D:5,MaxTorque:5,P:5}],
			["BodyPosition",{D:5,MaxForce:5,P:5,Position:5}],
			["BodyThrust",{Force:5,Location:5}],
			["BodyVelocity",{MaxForce:5,P:5,Velocity:5}],
			["RocketPropulsion",{CartoonFactor:5,MaxSpeed:6,MaxThrust:6,MaxTorque:7,Target:5,TargetOffset:5,TargetRadius:5,ThrustD:6,ThrustP:6,TurnD:7,TurnP:7}],
			["Button",{ClickableWhenViewportHidden:2,Enabled:2,Icon:2}],
			["Camera",{CameraSubject:8,CameraType:[8,3]}],
			["BodyColors",{HeadColor:2,HeadColor3:2,LeftArmColor:2,LeftArmColor3:2,LeftLegColor:2,LeftLegColor3:2,RightArmColor:2,RightArmColor3:2,RightLegColor:2,RightLegColor3:2,TorsoColor:2,TorsoColor3:2}],
			["CharacterMesh",{BodyPart:[,4]}],
			["Pants",{PantsTemplate:2}],
			["Shirt",{ShirtTemplate:2}],
			["ShirtGraphic",{Graphic:2}],
			["Skin",{SkinColor:2}],
			["ClickDetector",{CursorIcon:9}],
			["Constraint",{Attachment0:10,Attachment1:10,Color:2,Enabled:1,Visible:2}],
			["AlignOrientation",24,{MaxAngularVelocity:11,MaxTorque:11,PrimaryAxisOnly:12,ReactionTorqueEnabled:12,Responsiveness:11,RigidityEnabled:12}],
			["AlignPosition",24,{ApplyAtCenterOfMass:13,MaxForce:11,MaxVelocity:11,ReactionForceEnabled:13,Responsiveness:11,RigidityEnabled:13}],
			["BallSocketConstraint",24,{LimitsEnabled:14,Radius:2,Restitution:15,TwistLimitsEnabled:15,TwistLowerAngle:16,TwistUpperAngle:16,UpperAngle:15}],
			["HingeConstraint",24,{ActuatorType:[17,5],AngularSpeed:18,AngularVelocity:19,CurrentAngle:20,LimitsEnabled:17,LowerAngle:15,MotorMaxAcceleration:19,MotorMaxTorque:19,Radius:2,Restitution:15,ServoMaxTorque:18,TargetAngle:18,UpperAngle:15}],
			["LineForce",24,{ApplyAtCenterOfMass:21,InverseSquareLaw:21,Magnitude:21,MaxForce:21,ReactionForceEnabled:21}],
			["RodConstraint",24,{CurrentDistance:20,Length:22,Thickness:2}],
			["RopeConstraint",24,{CurrentDistance:20,Length:23,Restitution:23,Thickness:2}],
			["SlidingBallConstraint",24,{ActuatorType:[24,5],CurrentPosition:20,LimitsEnabled:24,LowerLimit:15,MotorMaxAcceleration:19,MotorMaxForce:19,Restitution:15,ServoMaxForce:18,Size:2,Speed:18,TargetPosition:18,UpperLimit:15,Velocity:19}],
			["CylindricalConstraint",32,{AngularActuatorType:[25,5],AngularLimitsEnabled:25,AngularRestitution:26,AngularSpeed:27,AngularVelocity:28,CurrentAngle:20,InclinationAngle:25,LowerAngle:26,MotorMaxAngularAcceleration:28,MotorMaxTorque:28,RotationAxisVisible:2,ServoMaxTorque:27,TargetAngle:27,UpperAngle:26,WorldRotationAxis:20}],
			["PrismaticConstraint",32],
			["SpringConstraint",24,{Coils:2,CurrentLength:20,Damping:29,FreeLength:29,LimitsEnabled:29,MaxForce:29,MaxLength:15,MinLength:15,Radius:2,Stiffness:29,Thickness:2}],
			["Torque",24,{RelativeTo:[30,6],Torque:30}],
			["VectorForce",24,{ApplyAtCenterOfMass:31,Force:31,RelativeTo:[31,6]}],
			["SkateboardController",{Steer:32,Throttle:32}],
			["SpecialMesh",{MeshType:[,7]}],
			["Dialog",{BehaviorType:[,8],Purpose:[,9],Tone:[,10]}],
			["Explosion",{ExplosionType:[,11]}],
			["FaceInstance",{Face:[,12]}],
			["Decal",42,{Color3:2,LocalTransparencyModifier:2,Shiny:2,Specular:2,Texture:2,Transparency:2}],
			["Texture",43,{StudsPerTileU:2,StudsPerTileV:2}],
			["GuiBase2d",{AutoLocalize:33,Localize:33,RootLocalizationTable:33}],
			["GuiObject",45,{ClipsDescendants:1,Draggable:1,NextSelectionDown:1,NextSelectionLeft:1,NextSelectionRight:1,NextSelectionUp:1,SelectionImageObject:2,SizeConstraint:[,13]}],
			["Frame",46,{Style:[,14]}],
			["GuiButton",46,{Style:[,15]}],
			["ImageButton",48,{Image:9,ImageColor3:9,ImageRectOffset:9,ImageRectSize:9,ImageTransparency:9,IsLoaded:9,ScaleType:[9,16],SliceCenter:9,TileSize:9}],
			["TextButton",48,{Font:[34,17],FontSize:[34,18],LineHeight:34,Text:34,TextBounds:34,TextColor:34,TextColor3:34,TextFits:34,TextScaled:34,TextSize:34,TextStrokeColor3:34,TextStrokeTransparency:34,TextTransparency:34,TextTruncate:[34,19],TextWrap:34,TextWrapped:34,TextXAlignment:[34,20],TextYAlignment:[34,21]}],
			["GuiLabel",46],
			["ImageLabel",46,{Image:9,ImageColor3:9,ImageRectOffset:9,ImageRectSize:9,ImageTransparency:9,IsLoaded:9,ScaleType:[9,16],SliceCenter:9,TileSize:9}],
			["TextLabel",46,{Font:[34,17],FontSize:[34,18],LineHeight:34,Text:34,TextBounds:34,TextColor:34,TextColor3:34,TextFits:34,TextScaled:34,TextSize:34,TextStrokeColor3:34,TextStrokeTransparency:34,TextTransparency:34,TextTruncate:[34,19],TextWrap:34,TextWrapped:34,TextXAlignment:[34,20],TextYAlignment:[34,21]}],
			["Scale9Frame",46],
			["ScrollingFrame",46,{AbsoluteWindowSize:35,BottomImage:35,CanvasPosition:35,CanvasSize:35,ElasticBehavior:[35,22],HorizontalScrollBarInset:[35,23],MidImage:35,ScrollBarThickness:35,ScrollingDirection:[35,24],ScrollingEnabled:35,TopImage:35,VerticalScrollBarInset:[35,23],VerticalScrollBarPosition:[35,25]}],
			["TextBox",46,{Font:[34,17],FontSize:[34,18],LineHeight:34,PlaceholderColor3:34,PlaceholderText:34,Text:34,TextBounds:34,TextColor:34,TextColor3:34,TextFits:34,TextScaled:34,TextSize:34,TextStrokeColor3:34,TextStrokeTransparency:34,TextTransparency:34,TextTruncate:[34,19],TextWrap:34,TextWrapped:34,TextXAlignment:[34,20],TextYAlignment:[34,21]}],
			["LayerCollector",45,{ZIndexBehavior:[,26]}],
			["BillboardGui",57,{ClipsDescendants:1}],
			["PluginGui",57],
			["ScreenGui",57],
			["GuiMain",57],
			["SurfaceGui",57,{ClipsDescendants:1,Face:[,12],ZOffset:2}],
			["GuiBase3d",{Color:2,Color3:2,Transparency:2}],
			["FloorWire",63,{Texture:2,TextureSize:2}],
			["PVAdornment",63],
			["HandleAdornment",63],
			["BoxHandleAdornment",63],
			["ConeHandleAdornment",63],
			["CylinderHandleAdornment",63],
			["ImageHandleAdornment",63],
			["LineHandleAdornment",63],
			["SphereHandleAdornment",63],
			["ParabolaAdornment",63],
			["SelectionBox",63,{LineThickness:2,SurfaceColor:2,SurfaceColor3:2,SurfaceTransparency:2}],
			["SelectionSphere",63,{SurfaceColor:2,SurfaceColor3:2,SurfaceTransparency:2}],
			["PartAdornment",63],
			["HandlesBase",63],
			["ArcHandles",63],
			["Handles",63,{Style:[2,27]}],
			["SurfaceSelection",63,{TargetSurface:[,12]}],
			["SelectionLasso",63],
			["SelectionPartLasso",63],
			["SelectionPointLasso",63],
			["HopperBin",{BinType:[,28]}],
			["Tool",{CanBeDropped:1,Enabled:36,Grip:2,GripForward:2,GripPos:2,GripRight:2,GripUp:2,ManualActivationOnly:1,RequiresHandle:1,ToolTip:2}],
			["Flag",85],
			["Humanoid",{AutoJumpEnabled:37,AutoRotate:37,DisplayDistanceType:[,29],FloorMaterial:[37,30],Health:38,HealthDisplayType:[,31],HipHeight:38,Jump:37,JumpPower:38,MaxHealth:38,MaxSlopeAngle:38,MoveDirection:37,NameOcclusion:[,32],PlatformStand:37,RigType:[,33],SeatPart:37,Sit:37,TargetPoint:37,WalkSpeed:38,WalkToPart:37,WalkToPoint:37}],
			["KeyframeSequence",{Priority:[]}],
			["Light",{Brightness:2,Color:2,Enabled:2,Shadows:2}],
			["PointLight",89,{Range:2}],
			["SpotLight",89,{Angle:2,Face:[2,12],Range:2}],
			["SurfaceLight",89,{Angle:2,Face:[2,12],Range:2}],
			["LocalizationTable",{DevelopmentLanguage:33,Root:1,SourceLocaleId:33}],
			["BaseScript",{Disabled:1}],
			["CoreScript",94],
			["Script",94],
			["LocalScript",94],
			["Message",{Text:2}],
			["Hint",98],
			["BasePart",{Anchored:1,BackParamA:39,BackParamB:39,BackSurface:[40,34],BackSurfaceInput:[39,35],BottomParamA:39,BottomParamB:39,BottomSurface:[40,34],BottomSurfaceInput:[39,35],BrickColor:2,CanCollide:1,CollisionGroupId:1,Color:2,CustomPhysicalProperties:41,Elasticity:41,Friction:41,FrontParamA:39,FrontParamB:39,FrontSurface:[40,34],FrontSurfaceInput:[39,35],LeftParamA:39,LeftParamB:39,LeftSurface:[40,34],LeftSurfaceInput:[39,35],Locked:1,Material:[2,30],ReceiveAge:41,Reflectance:2,ResizeIncrement:1,ResizeableFaces:1,RightParamA:39,RightParamB:39,RightSurface:[40,34],RightSurfaceInput:[39,35],Size:41,TopParamA:39,TopParamB:39,TopSurface:[40,34],TopSurfaceInput:[39,35],Transparency:2}],
			["CornerWedgePart",100],
			["FormFactorPart",100,{FormFactor:[41,36]}],
			["Part",102,{Shape:[41,37]}],
			["FlagStand",103],
			["Platform",103],
			["Seat",103,{Disabled:37,Occupant:37}],
			["SkateboardPlatform",103,{Controller:37,ControllingHumanoid:37,Steer:37,StickyWheels:37,Throttle:37}],
			["SpawnLocation",103,{AllowTeamChangeOnTouch:42,Duration:43,Enabled:1,Neutral:42,TeamColor:42}],
			["WedgePart",102],
			["MeshPart",100,{CollisionFidelity:[1,38],MeshID:2,MeshId:2,TextureID:2}],
			["PartOperation",100,{CollisionFidelity:[1,38]}],
			["NegateOperation",111],
			["UnionOperation",111],
			["Terrain",100,{MaterialColors:2,WaterColor:2,WaterReflectance:2,WaterTransparency:2,WaterWaveSize:2,WaterWaveSpeed:2}],
			["TrussPart",100,{Style:[41,39]}],
			["VehicleSeat",100,{AreHingesDetected:37,Disabled:37,HeadsUpDisplay:37,MaxSpeed:37,Occupant:37,Steer:37,SteerFloat:37,Throttle:37,ThrottleFloat:37,Torque:37,TurnSpeed:37}],
			["ParticleEmitter",{Acceleration:44,Color:2,Drag:45,EmissionDirection:[46,12],Enabled:46,Lifetime:46,LightEmission:2,LightInfluence:2,LockedToPart:45,Rate:46,RotSpeed:46,Rotation:46,Size:2,Speed:46,SpreadAngle:46,Texture:2,Transparency:2,VelocityInheritance:45,VelocitySpread:46,ZOffset:2}],
			["Path",{Status:[,40]}],
			["Pose",{EasingDirection:[,41],EasingStyle:[,42]}],
			["PostEffect",{Enabled:36}],
			["BloomEffect",120,{Intensity:36,Size:36,Threshold:36}],
			["BlurEffect",120,{Size:36}],
			["ColorCorrectionEffect",120,{Brightness:36,Contrast:36,Saturation:36,TintColor:36}],
			["SunRaysEffect",120,{Intensity:36,Spread:36}],
			["Sky",{CelestialBodiesShown:2,MoonAngularSize:2,MoonTextureId:2,SkyboxBk:2,SkyboxDn:2,SkyboxFt:2,SkyboxLf:2,SkyboxRt:2,SkyboxUp:2,StarCount:2,SunAngularSize:2,SunTextureId:2}],
			["Sound",{PlayOnRemove:1,RollOffMode:[,43]}],
			["SoundEffect",{Enabled:36,Priority:36}],
			["ChorusSoundEffect",127,{Depth:36,Mix:36,Rate:36}],
			["CompressorSoundEffect",127,{Attack:36,GainMakeup:36,Ratio:36,Release:36,SideChain:36,Threshold:36}],
			["DistortionSoundEffect",127,{Level:36}],
			["EchoSoundEffect",127,{Delay:36,DryLevel:36,Feedback:36,WetLevel:36}],
			["EqualizerSoundEffect",127,{HighGain:36,LowGain:36,MidGain:36}],
			["FlangeSoundEffect",127,{Depth:36,Mix:36,Rate:36}],
			["PitchShiftSoundEffect",127,{Octave:36}],
			["ReverbSoundEffect",127,{DecayTime:36,Density:36,Diffusion:36,DryLevel:36,WetLevel:36}],
			["TremoloSoundEffect",127,{Depth:36,Duty:36,Frequency:36}],
			["SoundGroup",{Volume:36}],
			["Trail",{Color:2,Enabled:46,FaceCamera:2,Lifetime:46,LightEmission:2,LightInfluence:2,MaxLength:46,MinLength:46,Texture:2,TextureLength:2,TextureMode:[2,2],Transparency:2,WidthScale:46}],
			["Translator",{LocaleId:1}],
			["TweenBase",{PlaybackState:[1,44]}],
			["Tween",140],
			["UIAspectRatioConstraint",{AspectRatio:1,AspectType:[1,45],DominantAxis:[1,46]}],
			["UISizeConstraint",{MaxSize:1,MinSize:1}],
			["UITextSizeConstraint",{MaxTextSize:1,MinTextSize:1}],
			["UIGridStyleLayout",{FillDirection:[1,47],HorizontalAlignment:[1,48],SortOrder:[1,49],VerticalAlignment:[1,50]}],
			["UIGridLayout",145,{CellPadding:2,CellSize:2,FillDirectionMaxCells:1,StartCorner:[1,51]}],
			["UIListLayout",145,{Padding:2}],
			["UIPageLayout",145,{Animated:2,Circular:2,EasingDirection:[2,52],EasingStyle:[2,53],GamepadInputEnabled:47,Padding:2,ScrollWheelInputEnabled:47,TouchInputEnabled:47,TweenTime:2}],
			["UITableLayout",145,{FillEmptySpaceColumns:2,FillEmptySpaceRows:2,MajorAxis:[1,54],Padding:2}],
			["UIPadding",{PaddingBottom:1,PaddingLeft:1,PaddingRight:1,PaddingTop:1}],
			["UIScale",{Scale:1}],
			["WeldConstraint",{Enabled:1,Part0:48,Part1:48}]
		]
	}

	const RMD = {
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
	}

	const BrickColors = {
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
	}

	
	const ZeroClassName = Data.Classes[0][0]
	let isPrepared = false
	const prepare = () => {
		if(isPrepared) { return }
		isPrepared = true

		const enums = Data.Enums
		const enumDict = Data.Enums = {}
		enums.forEach(([name, items]) => enumDict[name] = items)

		const classes = Data.Classes
		const classDict = Data.Classes = {}
		classes.forEach(([className, superClass, members]) => {
			if(!members && superClass) {
				members = superClass
				superClass = null
			}

			superClass = classes[superClass || 0][0]
			superClass = className === superClass ? null : classDict[superClass]
			
			if(members) {
				Object.entries(members).forEach(([prop, value]) => {
					if(typeof value === "number") {
						members[prop] = {
							Group: Data.Categories[value]
						}
					} else {
						const [cat, enumType] = value
	
						members[prop] = {
							Group: Data.Categories[cat || 0],
							Enum: enums[enumType || 0][1]
						}
					}
				})
			}

			classDict[className] = {
				Name: className,
				Superclass: superClass,
				Members: members
			}
		})
	}

	const getPropInfo = (className, prop) => {
		prepare()
		let target = Data.Classes[className] || Data.Classes[ZeroClassName]

		while(target) {
			if(target.Members) {
				const propInfo = target.Members[prop]
				if(propInfo) { return propInfo }
			}
			target = target.Superclass
		}

		return null
	}

	return {
		getEnum(name) {
			prepare()
			return Data.Enums[name]
		},
		getPropertyGroup(className, prop) {
			prepare()
			const propInfo = getPropInfo(className, prop)
			return propInfo ? propInfo.Group : "Data"
		},
		getPropertyEnumName(className, prop, value) {
			prepare()
			const propInfo = getPropInfo(className, prop)
			return (propInfo && propInfo.Enum) ? propInfo.Enum[value] : null
		},
		getBrickColorName(value) {
			return BrickColors[value]
		},
		getExplorerIconIndex(className) {
			return RMD[className] || 0
		}
	}
})()
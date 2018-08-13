/* eslint-disable */
"use strict"

const ApiDump = (() => {
	const Data = {
		Categories: ["Data","Behavior","Appearance","Derived Data","Shape","Goals","Thrust","Turn","Camera","Image","Attachments","Compliance","AlignOrientation","AlignPosition","BallSocket","Limits","TwistLimits","Hinge","Servo","Motor","Derived","LineForce","Rod","Rope","Slider","Cylinder","AngularLimits","AngularServo","AngularMotor","Spring","Torque","VectorForce","Axes","Localization","Text","Scrolling","State","Control","Game","Surface Inputs","Surface","Part ","Teams","Forcefield","Motion","Particles","Emission","Input","Parts"],
		Enums: [
			["TextureMode",["Stretch","Wrap","Static"]],["CameraType",["Fixed","Attach","Watch","Track","Follow","Custom","Scriptable","Orbital"]],["BodyPart",["Head","Torso","LeftArm","RightArm","LeftLeg","RightLeg"]],["ActuatorType",["None","Motor","Servo"]],["ActuatorRelativeTo",["Attachment0","Attachment1","World"]],["MeshType",["Head","Torso","Wedge","Sphere","Cylinder","FileMesh","Brick","Prism","Pyramid","ParallelRamp","RightAngleRamp","CornerWedge"]],["DialogBehaviorType",["SinglePlayer","MultiplePlayers"]],["DialogPurpose",["Quest","Help","Shop"]],["DialogTone",["Neutral","Friendly","Enemy"]],["ExplosionType",["NoCraters","Craters","CratersAndDebris"]],["NormalId",["Right","Top","Back","Left","Bottom","Front"]],["SizeConstraint",["RelativeXY","RelativeXX","RelativeYY"]],["FrameStyle",["Custom","ChatBlue","RobloxSquare","RobloxRound","ChatGreen","ChatRed","DropShadow"]],["ButtonStyle",["Custom","RobloxButtonDefault","RobloxButton","RobloxRoundButton","RobloxRoundDefaultButton","RobloxRoundDropdownButton"]],["ScaleType",["Stretch","Slice","Tile","Fit","Crop"]],["Font",["Legacy","Arial","ArialBold","SourceSans","SourceSansBold","SourceSansLight","SourceSansItalic","Bodoni","Garamond","Cartoon","Code","Highway","SciFi","Arcade","Fantasy","Antique","SourceSansSemibold"]],["FontSize",["Size8","Size9","Size10","Size11","Size12","Size14","Size18","Size24","Size36","Size48","Size28","Size32","Size42","Size60","Size96"]],["TextTruncate",["None","AtEnd"]],["TextXAlignment",["Left","Right","Center"]],["TextYAlignment",["Top","Center","Bottom"]],["ElasticBehavior",["WhenScrollable","Always","Never"]],["ScrollBarInset",["None","ScrollBar","Always"]],["ScrollingDirection",["X","Y",,"XY"]],["VerticalScrollBarPosition",["Right","Left"]],["ZIndexBehavior",["Global","Sibling"]],["HandlesStyle",["Resize","Movement"]],["BinType",["Script","GameTool","Grab","Clone","Hammer"]],["HumanoidDisplayDistanceType",["Viewer","Subject","None"]],["Material",{256:"Plastic",272:"SmoothPlastic",288:"Neon",512:"Wood",528:"WoodPlanks",784:"Marble",788:"Basalt",800:"Slate",804:"CrackedLava",816:"Concrete",820:"Limestone",832:"Granite",836:"Pavement",848:"Brick",864:"Pebble",880:"Cobblestone",896:"Rock",912:"Sandstone",1040:"CorrodedMetal",1056:"DiamondPlate",1072:"Foil",1088:"Metal",1280:"Grass",1284:"LeafyGrass",1296:"Sand",1312:"Fabric",1328:"Snow",1344:"Mud",1360:"Ground",1376:"Asphalt",1392:"Salt",1536:"Ice",1552:"Glacier",1568:"Glass",1792:"Air",2048:"Water"}],["HumanoidHealthDisplayType",["DisplayWhenDamaged","AlwaysOn","AlwaysOff"]],["NameOcclusion",["NoOcclusion","EnemyOcclusion","OccludeAll"]],["HumanoidRigType",["R6","R15"]],["AnimationPriority",{0:"Idle",1:"Movement",2:"Action",1000:"Core"}],["SurfaceType",["Smooth","Glue","Weld","Studs","Inlet","Universal","Hinge","Motor","SteppingMotor","Unjoinable","SmoothNoOutlines"]],["InputType",["NoInput","LeftTread","RightTread","Steer","Throttle",,"UpDown","Action1","Action2","Action3","Action4","Action5","Constant","Sin"]],["FormFactor",["Symmetric","Brick","Plate","Custom"]],["PartType",["Ball","Block","Cylinder"]],["CollisionFidelity",["Default","Hull","Box"]],["Style",["AlternatingSupports","BridgeStyleSupports","NoSupports"]],["PoseEasingDirection",["In","Out","InOut"]],["PoseEasingStyle",["Linear","Constant","Elastic","Cubic","Bounce"]],["RollOffMode",["Inverse","Linear","LinearSquare","InverseTapered"]],["PlaybackState",["Begin","Delayed","Playing","Paused","Completed","Cancelled"]],["AspectType",["FitWithinMaxSize","ScaleWithParentSize"]],["DominantAxis",["Width","Height"]],["FillDirection",["Horizontal","Vertical"]],["HorizontalAlignment",["Center","Left","Right"]],["SortOrder",["Name","Custom","LayoutOrder"]],["VerticalAlignment",["Center","Top","Bottom"]],["StartCorner",["TopLeft","TopRight","BottomLeft","BottomRight"]],["EasingDirection",["In","Out","InOut"]],["EasingStyle",["Linear","Sine","Back","Quad","Quart","Quint","Bounce","Elastic"]],["TableMajorAxis",["RowMajor","ColumnMajor"]]
		],
		Classes: [
			["Instance",{Archivable:1}],["Accoutrement",{AttachmentForward:2,AttachmentPoint:2,AttachmentPos:2,AttachmentRight:2,AttachmentUp:2},[2,32]],["Accessory",1,{},[3,32]],["Hat",1,{},[3,45]],["Animation",{},[22,60]],["AnimationController",{},[22,60]],["Attachment",{Axis:3,SecondaryAxis:3,Visible:2,WorldAxis:3,WorldCFrame:3,WorldOrientation:3,WorldPosition:3,WorldRotation:3,WorldSecondaryAxis:3},[3,81]],["Beam",{Attachment0:4,Attachment1:4,Color:2,CurveSize0:4,CurveSize1:4,Enabled:2,FaceCamera:4,LightEmission:2,LightInfluence:2,Segments:4,Texture:2,TextureLength:2,TextureMode:[],TextureSpeed:2,Transparency:2,Width0:4,Width1:4,ZOffset:2},[3,96]],["BindableEvent",{},[5,67]],["BindableFunction",{},[4,66]],["BodyAngularVelocity",{AngularVelocity:5,MaxTorque:5,P:5},[14,14]],["BodyForce",{Force:5},[14,14]],["BodyGyro",{CFrame:5,D:5,MaxTorque:5,P:5},[14,14]],["BodyPosition",{D:5,MaxForce:5,P:5,Position:5},[14,14]],["BodyThrust",{Force:5,Location:5},[14,14]],["BodyVelocity",{MaxForce:5,P:5,Velocity:5},[14,14]],["RocketPropulsion",{CartoonFactor:5,MaxSpeed:6,MaxThrust:6,MaxTorque:7,Target:5,TargetOffset:5,TargetRadius:5,ThrustD:6,ThrustP:6,TurnD:7,TurnP:7},[14,14]],["Button",{ClickableWhenViewportHidden:2,Enabled:2,Icon:2}],["Camera",{CameraSubject:8,CameraType:[8,1]},[0,5]],["BodyColors",{HeadColor:2,HeadColor3:2,LeftArmColor:2,LeftArmColor3:2,LeftLegColor:2,LeftLegColor3:2,RightArmColor:2,RightArmColor3:2,RightLegColor:2,RightLegColor3:2,TorsoColor:2,TorsoColor3:2},2],["CharacterMesh",{BodyPart:[,2]},[22,60]],["Clothing",{},2],["Pants",21,{PantsTemplate:2},[2,44]],["Shirt",21,{ShirtTemplate:2},[2,43]],["ShirtGraphic",{Graphic:2},[2,40]],["Skin",{SkinColor:2},2],["ClickDetector",{CursorIcon:9},[3,41]],["Configuration",{},[22,58]],["Constraint",{Attachment0:10,Attachment1:10,Color:2,Enabled:1,Visible:2},[3,86]],["AlignOrientation",28,{MaxAngularVelocity:11,MaxTorque:11,PrimaryAxisOnly:12,ReactionTorqueEnabled:12,Responsiveness:11,RigidityEnabled:12},[3,82]],["AlignPosition",28,{ApplyAtCenterOfMass:13,MaxForce:11,MaxVelocity:11,ReactionForceEnabled:13,Responsiveness:11,RigidityEnabled:13},[3,82]],["BallSocketConstraint",28,{LimitsEnabled:14,Radius:2,Restitution:15,TwistLimitsEnabled:15,TwistLowerAngle:16,TwistUpperAngle:16,UpperAngle:15},[3,86]],["HingeConstraint",28,{ActuatorType:[17,3],AngularSpeed:18,AngularVelocity:19,CurrentAngle:20,LimitsEnabled:17,LowerAngle:15,MotorMaxAcceleration:19,MotorMaxTorque:19,Radius:2,Restitution:15,ServoMaxTorque:18,TargetAngle:18,UpperAngle:15},[3,87]],["LineForce",28,{ApplyAtCenterOfMass:21,InverseSquareLaw:21,Magnitude:21,MaxForce:21,ReactionForceEnabled:21},[3,82]],["RodConstraint",28,{CurrentDistance:20,Length:22,Thickness:2},[3,90]],["RopeConstraint",28,{CurrentDistance:20,Length:23,Restitution:23,Thickness:2},[3,89]],["SlidingBallConstraint",28,{ActuatorType:[24,3],CurrentPosition:20,LimitsEnabled:24,LowerLimit:15,MotorMaxAcceleration:19,MotorMaxForce:19,Restitution:15,ServoMaxForce:18,Size:2,Speed:18,TargetPosition:18,UpperLimit:15,Velocity:19},[3,88]],["CylindricalConstraint",36,{AngularActuatorType:[25,3],AngularLimitsEnabled:25,AngularRestitution:26,AngularSpeed:27,AngularVelocity:28,CurrentAngle:20,InclinationAngle:25,LowerAngle:26,MotorMaxAngularAcceleration:28,MotorMaxTorque:28,RotationAxisVisible:2,ServoMaxTorque:27,TargetAngle:27,UpperAngle:26,WorldRotationAxis:20},[3,95]],["PrismaticConstraint",36,{},[3,88]],["SpringConstraint",28,{Coils:2,CurrentLength:20,Damping:29,FreeLength:29,LimitsEnabled:29,MaxForce:29,MaxLength:15,MinLength:15,Radius:2,Stiffness:29,Thickness:2},[3,91]],["Torque",28,{RelativeTo:[30,4],Torque:30},[3,82]],["VectorForce",28,{ApplyAtCenterOfMass:31,Force:31,RelativeTo:[31,4]},[3,82]],["SkateboardController",{Steer:32,Throttle:32}],["BlockMesh",{},[3,8]],["CylinderMesh",{},[3,8]],["SpecialMesh",{MeshType:[,5]},[3,8]],["DebuggerManager",{},101],["Dialog",{BehaviorType:[,6],Purpose:[,7],Tone:[,8]},[22,62]],["DialogChoice",{},[22,63]],["Explosion",{ExplosionType:[,9]},[3,36]],["FaceInstance",{Face:[,10]}],["Decal",50,{Color3:2,LocalTransparencyModifier:2,Shiny:2,Specular:2,Texture:2,Transparency:2},[4,7]],["Texture",51,{StudsPerTileU:2,StudsPerTileV:2},[4,10]],["Fire",{},[3,61]],["Folder",{},[1,77]],["ForceField",{},[3,37]],["GuiBase2d",{AutoLocalize:33,Localize:33,RootLocalizationTable:33}],["GuiObject",56,{ClipsDescendants:1,Draggable:1,NextSelectionDown:1,NextSelectionLeft:1,NextSelectionRight:1,NextSelectionUp:1,SelectionImageObject:2,SizeConstraint:[,11]}],["Frame",57,{Style:[,12]},[15,48]],["GuiButton",57,{Style:[,13]},[16,52]],["ImageButton",59,{Image:9,ImageColor3:9,ImageRectOffset:9,ImageRectSize:9,ImageTransparency:9,IsLoaded:9,ScaleType:[9,14],SliceCenter:9,TileSize:9},[16,52]],["TextButton",59,{Font:[34,15],FontSize:[34,16],LineHeight:34,Text:34,TextBounds:34,TextColor:34,TextColor3:34,TextFits:34,TextScaled:34,TextSize:34,TextStrokeColor3:34,TextStrokeTransparency:34,TextTransparency:34,TextTruncate:[34,17],TextWrap:34,TextWrapped:34,TextXAlignment:[34,18],TextYAlignment:[34,19]},[17,51]],["GuiLabel",57],["ImageLabel",57,{Image:9,ImageColor3:9,ImageRectOffset:9,ImageRectSize:9,ImageTransparency:9,IsLoaded:9,ScaleType:[9,14],SliceCenter:9,TileSize:9},[18,49]],["TextLabel",57,{Font:[34,15],FontSize:[34,16],LineHeight:34,Text:34,TextBounds:34,TextColor:34,TextColor3:34,TextFits:34,TextScaled:34,TextSize:34,TextStrokeColor3:34,TextStrokeTransparency:34,TextTransparency:34,TextTruncate:[34,17],TextWrap:34,TextWrapped:34,TextXAlignment:[34,18],TextYAlignment:[34,19]},[19,50]],["Scale9Frame",57],["ScrollingFrame",57,{AbsoluteWindowSize:35,BottomImage:35,CanvasPosition:35,CanvasSize:35,ElasticBehavior:[35,20],HorizontalScrollBarInset:[35,21],MidImage:35,ScrollBarImageColor3:35,ScrollBarImageTransparency:35,ScrollBarThickness:35,ScrollingDirection:[35,22],ScrollingEnabled:35,TopImage:35,VerticalScrollBarInset:[35,21],VerticalScrollBarPosition:[35,23]},[15,48]],["TextBox",57,{Font:[34,15],FontSize:[34,16],LineHeight:34,PlaceholderColor3:34,PlaceholderText:34,Text:34,TextBounds:34,TextColor:34,TextColor3:34,TextFits:34,TextScaled:34,TextSize:34,TextStrokeColor3:34,TextStrokeTransparency:34,TextTransparency:34,TextTruncate:[34,17],TextWrap:34,TextWrapped:34,TextXAlignment:[34,18],TextYAlignment:[34,19]},[17,51]],["LayerCollector",56,{ZIndexBehavior:[,24]}],["BillboardGui",68,{ClipsDescendants:1},[14,64]],["PluginGui",68],["DockWidgetPluginGui",68],["ScreenGui",68,{OnTopOfCoreBlur:1},[14,47]],["GuiMain",72,{},[14,47]],["SurfaceGui",68,{ClipsDescendants:1,Face:[,10],ZOffset:2},[14,64]],["GuiBase3d",{Color:2,Color3:2,Transparency:2}],["FloorWire",75,{Texture:2,TextureSize:2},[3,4]],["PVAdornment",75],["HandleAdornment",75],["BoxHandleAdornment",75],["ConeHandleAdornment",75],["CylinderHandleAdornment",75],["ImageHandleAdornment",75],["LineHandleAdornment",75],["SphereHandleAdornment",75],["ParabolaAdornment",75],["SelectionBox",75,{LineThickness:2,SurfaceColor:2,SurfaceColor3:2,SurfaceTransparency:2},[21,54]],["SelectionSphere",75,{SurfaceColor:2,SurfaceColor3:2,SurfaceTransparency:2},[21,54]],["PartAdornment",75],["HandlesBase",75],["ArcHandles",75,{},[20,56]],["Handles",75,{Style:[2,25]},[19,53]],["SurfaceSelection",75,{TargetSurface:[,10]},[21,55]],["SelectionLasso",75],["SelectionPartLasso",75,{},[22,57]],["SelectionPointLasso",75,{},[22,57]],["Backpack",{},[3,20]],["BackpackItem",{},2],["HopperBin",97,{BinType:[,26]},[24,22]],["Tool",97,{CanBeDropped:1,Enabled:36,Grip:2,GripForward:2,GripPos:2,GripRight:2,GripUp:2,ManualActivationOnly:1,RequiresHandle:1,ToolTip:2},[3,17]],["Flag",99,{},[3,38]],["Humanoid",{AutoJumpEnabled:37,AutoRotate:37,AutomaticScalingEnabled:38,DisplayDistanceType:[,27],FloorMaterial:[37,28],Health:38,HealthDisplayType:[,29],HipHeight:38,Jump:37,JumpPower:38,MaxHealth:38,MaxSlopeAngle:38,MoveDirection:37,NameOcclusion:[,30],PlatformStand:37,RigType:[,31],SeatPart:37,Sit:37,TargetPoint:37,WalkSpeed:38,WalkToPart:37,WalkToPoint:37},[3,9]],["JointInstance",{},[20,34]],["DynamicRotate",102],["RotateP",102],["RotateV",102],["Glue",102],["ManualSurfaceJointInstance",102],["ManualGlue",102],["ManualWeld",102],["Motor",102,{},2],["Motor6D",110],["Rotate",102],["Snap",102],["VelocityMotor",102],["Weld",102,{},[20,34]],["Keyframe",{},[22,60]],["KeyframeSequence",{Priority:[,32]}],["Light",{Brightness:2,Color:2,Enabled:2,Shadows:2},[3,13]],["PointLight",118,{Range:2},[3,13]],["SpotLight",118,{Angle:2,Face:[2,10],Range:2},[3,13]],["SurfaceLight",118,{Angle:2,Face:[2,10],Range:2},[3,13]],["LocalizationTable",{DevelopmentLanguage:33,Root:1,SourceLocaleId:33},[3,97]],["BaseScript",{Disabled:1}],["CoreScript",123],["Script",123,{},[3,6]],["LocalScript",125,{},[4,18]],["ModuleScript",{},[5,76]],["Message",{Text:2},[11,33]],["Hint",128,{},[11,33]],["NetworkReplicator",{},[3,29]],["ClientReplicator",130],["ServerReplicator",130],["BasePart",{Anchored:1,BackParamA:39,BackParamB:39,BackSurface:[40,33],BackSurfaceInput:[39,34],BottomParamA:39,BottomParamB:39,BottomSurface:[40,33],BottomSurfaceInput:[39,34],BrickColor:2,CanCollide:1,CollisionGroupId:1,Color:2,CustomPhysicalProperties:41,Elasticity:41,Friction:41,FrontParamA:39,FrontParamB:39,FrontSurface:[40,33],FrontSurfaceInput:[39,34],LeftParamA:39,LeftParamB:39,LeftSurface:[40,33],LeftSurfaceInput:[39,34],Locked:1,Material:[2,28],ReceiveAge:41,Reflectance:2,ResizeIncrement:1,ResizeableFaces:1,RightParamA:39,RightParamB:39,RightSurface:[40,33],RightSurfaceInput:[39,34],Size:41,TopParamA:39,TopParamB:39,TopSurface:[40,33],TopSurfaceInput:[39,34],Transparency:2},-1],["CornerWedgePart",133,{},[12,1]],["FormFactorPart",133,{FormFactor:[41,35]}],["Part",135,{Shape:[41,36]},[11,1]],["FlagStand",136,{},[3,39]],["Platform",136,{},[3,35]],["Seat",136,{Disabled:37,Occupant:37},[3,35]],["SkateboardPlatform",136,{Controller:37,ControllingHumanoid:37,Steer:37,StickyWheels:37,Throttle:37},[3,35]],["SpawnLocation",136,{AllowTeamChangeOnTouch:42,Duration:43,Enabled:1,Neutral:42,TeamColor:42},[3,25]],["WedgePart",135,{},[12,1]],["MeshPart",133,{CollisionFidelity:[1,37],MeshID:2,MeshId:2,TextureID:2},[2,73]],["PartOperation",133,{CollisionFidelity:[1,37]}],["NegateOperation",144,{},[2,72]],["UnionOperation",144,{},[2,73]],["Terrain",133,{MaterialColors:2,WaterColor:2,WaterReflectance:2,WaterTransparency:2,WaterWaveSize:2,WaterWaveSpeed:2},[0,65]],["TrussPart",133,{Style:[41,38]},[12,1]],["VehicleSeat",133,{AreHingesDetected:37,Disabled:37,HeadsUpDisplay:37,MaxSpeed:37,Occupant:37,Steer:37,SteerFloat:37,Throttle:37,ThrottleFloat:37,Torque:37,TurnSpeed:37},[3,35]],["Model",{},[10,2]],["RootInstance",150],["Status",150,{},[10,2]],["ParticleEmitter",{Acceleration:44,Color:2,Drag:45,EmissionDirection:[46,10],Enabled:46,Lifetime:46,LightEmission:2,LightInfluence:2,LockedToPart:45,Rate:46,RotSpeed:46,Rotation:46,Size:2,Speed:46,SpreadAngle:46,Texture:2,Transparency:2,VelocityInheritance:45,VelocitySpread:46,ZOffset:2},[3,80]],["PlayerScripts",{},[13,78]],["Pose",{EasingDirection:[,39],EasingStyle:[,40]},[22,60]],["PostEffect",{Enabled:36}],["BloomEffect",156,{Intensity:36,Size:36,Threshold:36},[2,83]],["BlurEffect",156,{Size:36},[2,83]],["ColorCorrectionEffect",156,{Brightness:36,Contrast:36,Saturation:36,TintColor:36},[2,83]],["SunRaysEffect",156,{Intensity:36,Spread:36},[2,83]],["RemoteEvent",{},[5,75]],["RemoteFunction",{},[4,74]],["Sky",{CelestialBodiesShown:2,MoonAngularSize:2,MoonTextureId:2,SkyboxBk:2,SkyboxDn:2,SkyboxFt:2,SkyboxLf:2,SkyboxRt:2,SkyboxUp:2,StarCount:2,SunAngularSize:2,SunTextureId:2},[0,28]],["Smoke",{},[3,59]],["Sound",{PlayOnRemove:1,RollOffMode:[,41]},[1,11]],["SoundEffect",{Enabled:36,Priority:36}],["ChorusSoundEffect",166,{Depth:36,Mix:36,Rate:36},[2,84]],["CompressorSoundEffect",166,{Attack:36,GainMakeup:36,Ratio:36,Release:36,SideChain:36,Threshold:36},[2,84]],["DistortionSoundEffect",166,{Level:36},[2,84]],["EchoSoundEffect",166,{Delay:36,DryLevel:36,Feedback:36,WetLevel:36},[2,84]],["EqualizerSoundEffect",166,{HighGain:36,LowGain:36,MidGain:36},[2,84]],["FlangeSoundEffect",166,{Depth:36,Mix:36,Rate:36},[2,84]],["PitchShiftSoundEffect",166,{Octave:36},[2,84]],["ReverbSoundEffect",166,{DecayTime:36,Density:36,Diffusion:36,DryLevel:36,WetLevel:36},[2,84]],["TremoloSoundEffect",166,{Depth:36,Duty:36,Frequency:36},[2,84]],["SoundGroup",{Volume:36},[2,85]],["Sparkles",{},[3,42]],["StarterPlayerScripts",{},[13,78]],["StarterCharacterScripts",178,{},[13,78]],["Team",{},[1,24]],["TerrainRegion",{},[2,65]],["TouchTransmitter",{},[3,37]],["Trail",{Color:2,Enabled:46,FaceCamera:2,Lifetime:46,LightEmission:2,LightInfluence:2,MaxLength:46,MinLength:46,Texture:2,TextureLength:2,TextureMode:[],Transparency:2,WidthScale:46},[3,93]],["Translator",{LocaleId:1}],["TweenBase",{PlaybackState:[1,42]}],["Tween",185],["UIAspectRatioConstraint",{AspectRatio:1,AspectType:[1,43],DominantAxis:[1,44]},[3,26]],["UISizeConstraint",{MaxSize:1,MinSize:1},[3,26]],["UITextSizeConstraint",{MaxTextSize:1,MinTextSize:1},[3,26]],["UIGridStyleLayout",{FillDirection:[1,45],HorizontalAlignment:[1,46],SortOrder:[1,47],VerticalAlignment:[1,48]}],["UIGridLayout",190,{CellPadding:2,CellSize:2,FillDirectionMaxCells:1,StartCorner:[1,49]},[3,26]],["UIListLayout",190,{Padding:2},[3,26]],["UIPageLayout",190,{Animated:2,Circular:2,EasingDirection:[2,50],EasingStyle:[2,51],GamepadInputEnabled:47,Padding:2,ScrollWheelInputEnabled:47,TouchInputEnabled:47,TweenTime:2},[3,26]],["UITableLayout",190,{FillEmptySpaceColumns:2,FillEmptySpaceRows:2,MajorAxis:[1,52],Padding:2},[3,26]],["UIPadding",{PaddingBottom:1,PaddingLeft:1,PaddingRight:1,PaddingTop:1},[3,26]],["UIScale",{Scale:1},[3,26]],["ValueBase",{},[3,4]],["BinaryStringValue",197],["BoolValue",197,{},[3,4]],["BrickColorValue",197,{},[3,4]],["CFrameValue",197,{},[3,4]],["Color3Value",197,{},[3,4]],["DoubleConstrainedValue",197,{},[3,4]],["IntConstrainedValue",197,{},[3,4]],["IntValue",197,{},[3,4]],["NumberValue",197,{},[3,4]],["ObjectValue",197,{},[3,4]],["RayValue",197,{},[3,4]],["StringValue",197,{},[3,4]],["Vector3Value",197,{},[3,4]],["WeldConstraint",{Enabled:1,Part0:48,Part1:48},[3,94]]
		]
	}

	const BrickColors = {
		1:"White",2:"Grey",3:"Lightyellow",5:"Brickyellow",6:"Lightgreen(Mint)",9:"Lightreddishviolet",11:"PastelBlue",12:"Lightorangebrown",18:"Nougat",21:"Brightred",
		22:"Med.reddishviolet",23:"Brightblue",24:"Brightyellow",25:"Earthorange",26:"Black",27:"Darkgrey",28:"Darkgreen",29:"Mediumgreen",36:"Lig.Yellowichorange",
		37:"Brightgreen",38:"Darkorange",39:"Lightbluishviolet",40:"Transparent",41:"Tr.Red",42:"Tr.Lgblue",43:"Tr.Blue",44:"Tr.Yellow",45:"Lightblue",47:"Tr.Flu.Reddishorange",
		48:"Tr.Green",49:"Tr.Flu.Green",50:"Phosph.White",100:"Lightred",101:"Mediumred",102:"Mediumblue",103:"Lightgrey",104:"Brightviolet",105:"Br.yellowishorange",
		106:"Brightorange",107:"Brightbluishgreen",108:"Earthyellow",110:"Brightbluishviolet",111:"Tr.Brown",112:"Mediumbluishviolet",113:"Tr.Medi.reddishviolet",
		115:"Med.yellowishgreen",116:"Med.bluishgreen",118:"Lightbluishgreen",119:"Br.yellowishgreen",120:"Lig.yellowishgreen",121:"Med.yellowishorange",123:"Br.reddishorange",
		124:"Brightreddishviolet",125:"Lightorange",126:"Tr.Brightbluishviolet",127:"Gold",128:"Darknougat",131:"Silver",133:"Neonorange",134:"Neongreen",135:"Sandblue",
		136:"Sandviolet",137:"Mediumorange",138:"Sandyellow",140:"Earthblue",141:"Earthgreen",143:"Tr.Flu.Blue",145:"Sandbluemetallic",146:"Sandvioletmetallic",
		147:"Sandyellowmetallic",148:"Darkgreymetallic",149:"Blackmetallic",150:"Lightgreymetallic",151:"Sandgreen",153:"Sandred",154:"Darkred",157:"Tr.Flu.Yellow",158:"Tr.Flu.Red",
		168:"Gunmetallic",176:"Redflip/flop",178:"Yellowflip/flop",179:"Silverflip/flop",180:"Curry",190:"FireYellow",191:"Flameyellowishorange",192:"Reddishbrown",
		193:"Flamereddishorange",194:"Mediumstonegrey",195:"Royalblue",196:"DarkRoyalblue",198:"Brightreddishlilac",199:"Darkstonegrey",200:"Lemonmetalic",208:"Lightstonegrey",
		209:"DarkCurry",210:"Fadedgreen",211:"Turquoise",212:"LightRoyalblue",213:"MediumRoyalblue",216:"Rust",217:"Brown",218:"Reddishlilac",219:"Lilac",220:"Lightlilac",
		221:"Brightpurple",222:"Lightpurple",223:"Lightpink",224:"Lightbrickyellow",225:"Warmyellowishorange",226:"Coolyellow",232:"Doveblue",268:"Mediumlilac",301:"Slimegreen",
		302:"Smokygrey",303:"Darkblue",304:"Parsleygreen",305:"Steelblue",306:"Stormblue",307:"Lapis",308:"Darkindigo",309:"Seagreen",310:"Shamrock",311:"Fossil",312:"Mulberry",
		313:"Forestgreen",314:"Cadetblue",315:"Electricblue",316:"Eggplant",317:"Moss",318:"Artichoke",319:"Sagegreen",320:"Ghostgrey",321:"Lilac",322:"Plum",323:"Olivine",
		324:"Laurelgreen",325:"Quillgrey",327:"Crimson",328:"Mint",329:"Babyblue",330:"Carnationpink",331:"Persimmon",332:"Maroon",333:"Gold",334:"Daisyorange",335:"Pearl",
		336:"Fog",337:"Salmon",338:"TerraCotta",339:"Cocoa",340:"Wheat",341:"Buttermilk",342:"Mauve",343:"Sunrise",344:"Tawny",345:"Rust",346:"Cashmere",347:"Khaki",348:"Lilywhite",
		349:"Seashell",350:"Burgundy",351:"Cork",352:"Burlap",353:"Beige",354:"Oyster",355:"PineCone",356:"Fawnbrown",357:"Hurricanegrey",358:"Cloudygrey",359:"Linen",360:"Copper",
		361:"Dirtbrown",362:"Bronze",363:"Flint",364:"Darktaupe",365:"BurntSienna",1001:"Institutionalwhite",1002:"Midgray",1003:"Reallyblack",1004:"Reallyred",1005:"Deeporange",
		1006:"Alder",1007:"DustyRose",1008:"Olive",1009:"NewYeller",1010:"Reallyblue",1011:"Navyblue",1012:"Deepblue",1013:"Cyan",1014:"CGAbrown",1015:"Magenta",1016:"Pink",
		1017:"Deeporange",1018:"Teal",1019:"Toothpaste",1020:"Limegreen",1021:"Camo",1022:"Grime",1023:"Lavender",1024:"Pastellightblue",1025:"Pastelorange",1026:"Pastelviolet",
		1027:"Pastelblue-green",1028:"Pastelgreen",1029:"Pastelyellow",1030:"Pastelbrown",1031:"Royalpurple",1032:"Hot pink"
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
		classes.forEach(([className, superClass, members, rmd]) => {
			if(typeof superClass !== "number") {
				rmd = members
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
				Members: members,
				ExplorerOrder: typeof rmd === "number" ? rmd : rmd ? rmd[0] : undefined,
				ExplorerIcon: Array.isArray(rmd) ? rmd[1] : undefined
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
			prepare()
			const data = Data.Classes[className]
			if(data && data.ExplorerIcon !== undefined) { return data.ExplorerIcon }
			return 0
		},
		getExplorerOrder(className) {
			prepare()
			const data = Data.Classes[className]
			if(data && data.ExplorerOrder !== undefined) { return data.ExplorerOrder }
			return -1
		}
	}
})()
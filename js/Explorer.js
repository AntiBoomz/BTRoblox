// BTR-explorer.js
"use strict"

var rmdClassIcons = {
	Keyframe:60,Texture:10,Message:33,Sound:11,RopeConstraint:89,Status:2,ReplicatedStorage:70,ClickDetector:41,Lighting:13,Decal:7,Weld:34,
	BindableEvent:67,TremoloSoundEffect:84,Sparkles:42,SoundGroup:85,StarterCharacterScripts:78,PrismaticConstraint:88,NetworkReplicator:29,
	Vector3Value:4,ReverbSoundEffect:84,ScreenGui:47,SunRaysEffect:83,UIGridLayout:26,CompressorSoundEffect:84,TrussPart:1,FloorWire:4,TextBox:51,
	PyramidPart:1,IntValue:4,ServerStorage:69,Chat:33,CustomEvent:4,Workspace:19,BodyPosition:14,VehicleSeat:35,SelectionBox:54,CornerWedgePart:1,
	ArcHandles:56,Handles:53,Flag:38,RightAngleRampPart:1,UISizeConstraint:26,ColorCorrectionEffect:83,Animation:60,UnionOperation:73,PlayerScripts:78,
	StarterPlayerScripts:78,SurfaceLight:13,NetworkServer:15,Pose:60,LocalScript:18,TouchTransmitter:37,Explosion:36,TextureTrail:4,ModuleScript:76,
	Backpack:20,ParticleEmitter:80,Player:12,ChatService:33,BindableFunction:66,RodConstraint:90,TextLabel:50,PlayerGui:46,ImageLabel:49,Platform:35,
	Seat:35,FlagStand:39,HingeConstraint:87,CylinderMesh:8,SpawnLocation:25,Shirt:43,IntConstrainedValue:4,DistortionSoundEffect:84,BodyVelocity:14,
	UIAspectRatioConstraint:26,ForceField:37,BodyGyro:14,Hat:45,BrickColorValue:4,CharacterMesh:60,StringValue:4,Teams:23,TestService:68,
	UITextSizeConstraint:26,BlurEffect:83,GuiMain:47,Color3Value:4,CoreGui:46,BlockMesh:8,ScrollingFrame:48,SpotLight:13,EchoSoundEffect:84,Fire:61,
	Team:24,RemoteFunction:74,Camera:5,NetworkClient:16,AnimationTrack:60,UIListLayout:26,EqualizerSoundEffect:84,MarketplaceService:46,Players:21,
	ServerScriptService:71,ImageButton:52,BillboardGui:64,MeshPart:73,PartPairLasso:57,ShirtGraphic:40,BodyForce:14,Tool:17,BodyAngularVelocity:14,
	NegateOperation:72,StarterPack:20,NumberValue:4,ReplicatedFirst:70,PrismPart:1,Part:1,SpringConstraint:91,CFrameValue:4,Hint:33,ParallelRampPart:1,
	TerrainRegion:65,SurfaceSelection:55,Dialog:62,RocketPropulsion:14,Folder:77,DoubleConstrainedValue:4,SelectionSphere:54,Configuration:58,Model:2,
	DialogChoice:63,PointLight:13,Accoutrement:32,Smoke:59,CustomEventReceiver:4,SpecialMesh:8,Sky:28,SkateboardPlatform:35,Accessory:32,Pants:44,
	HopperBin:22,BodyThrust:14,Humanoid:9,RayValue:4,SelectionPointLasso:57,TextButton:51,StarterGear:20,SurfaceGui:64,StarterPlayer:79,
	ChorusSoundEffect:84,Terrain:65,SelectionPartLasso:57,Debris:30,WedgePart:1,PitchShiftSoundEffect:84,RemoteEvent:75,ObjectValue:4,JointInstance:34,
	AnimationController:60,Frame:48,SoundService:31,StarterGui:46,BallSocketConstraint:86,FlangeSoundEffect:84,Attachment:81,BoolValue:4,BloomEffect:83,
	GuiButton:52,Script:6
}

var hiddenProperties = [ "PhysicsData", "MeshData", "ChildData", "InitialSize", "formFactorRaw" ]

var propertyGroups = {
	Appearance: { Order: 0, List: [
		"BrickColor", "Material", "Reflectance", "Transparency", "WaterColor", "WaterReflectance", "WaterTransparency", "WaterWaveSize",
		"WaterWaveSpeed",
	] },
	Data: { Order: 1, List: [ ] },
	Camera: { Order: 2, List: [ "CameraSubject", "CameraType" ] },
	Behavior: { Order: 3, List: [
		"AllowThirdPartySales", "Archivable", "FallenPartsDestroyHeight", "FilteringEnabled", "Fravity", "PGSPhysicsSolverEnabled",
		"StreamingEnabled", "CanCollide", "Locked", "Anchored", "LoadStringEnabled"
	] },
	Part: { Order: 4, List: [ "Size", "Shape" ] },
	Fog: { Order: 4, List: [ "FogColor", "FogEnd", "FogStart" ] },
	"Surface Inputs": { Order: 5, List: [ 
		"BackParamA", "BackParamB", "BackSurfaceInput", "BottomParamA", "BottomParamB", "BottomSurfaceInput", "FrontParamA", "FrontParamB", 
		"FrontSurfaceInput", "LeftParamA", "LeftParamB", "LeftSurfaceInput", "RightParamA", "RightParamB", "RightSurfaceInput", "TopParamA", 
		"TopParamB", "TopSurfaceInput"
	] },
	Surface: { Order: 5, List: [ "BackSurface", "BottomSurface", "FrontSurface", "LeftSurface", "RightSurface", "TopSurface" ] },
}

var propertyOrder = []

Object.keys(propertyGroups).forEach((name) => { 
	var group = propertyGroups[name]
	group.List.forEach((propName) => propertyOrder[propName] = group.Order)
})


function Explorer() {
	this.isShown = false
	this.views = []

	var domElement = this.domElement = $(
	"<div class='btr-modelviewer'>" + 
		"<div class='btr-explorer'>" +
			"<div class='btr-explorer-header hidden'></div>" +
		"</div>" +
		"<div class='btr-properties'>" +
			"<div class='btr-properties-header'></div>" +
			"<ul class='btr-properties-list'>" +
			"</ul>" + 
		"</div>" +
	"</div>")

	this.loadingElement = $("<div style='text-align:center;margin-top:12px;'>Loading</div>").appendTo(domElement.find(".btr-explorer"))

	var selection = []

	function setSelection(list) {
		selection.forEach((item) => item.toggleClass("selected", false))
		list.forEach((item) => item.toggleClass("selected", true))
		selection = list

		domElement.find(".btr-properties").css("display", list.length === 0 ? "none" : "")

		var propertyList = domElement.find(".btr-properties-list")
		propertyList.empty()

		if(list.length > 0) {
			var target = list[0].data("rbxinstance")

			domElement.find(".btr-properties-header").text("Properties - {0} \"{1}\"".format(target.ClassName, target.Name))


			target.Properties.sort((a,b) => {
				var ao = propertyOrder[a]
				var bo = propertyOrder[b]

				var diff = (ao ? ao : propertyGroups.Data.Order) - (bo ? bo : propertyGroups.Data.Order)
				return diff === 0 ? (a < b ? -1 : 1) : diff
			}).forEach((name) => {
				if(hiddenProperties.indexOf(name) !== -1)
					return;

				var value = target[name]

				switch(name) {
					case "size":
						name = "Size"
						break;
					case "shape":
						name = "Shape"
						break;
				}

				var item = $(
				"<li class='btr-property-item'>" +
					"<div class='btr-property-name'>{0}</div>".format(name) +
					"<div class='btr-property-value'></div>" +
				"</li>")

				var valuediv = item.find(".btr-property-value")


				function fixNum(v) { return Math.round(v*1e3)/1e3 }
				function fixNums(arr) {
					var copy = arr.slice(0)
					copy.forEach((v,i) => copy[i]=fixNum(v))
					return copy
				}


				switch(typeof(value)) {
					case "number":
						value = fixNum(value).toString()
					case "string":
						value = value.trim()
						if(value.length > 120) {
							var blobUrl = URL.createObjectURL(new Blob([value]))
							value = value.substring(0, 120) + "..."

							$("<a class='more' target='_blank'>...</button>")
								.attr("href", blobUrl)
								.appendTo(valuediv)
						}
						var input = $("<textarea onkeypress='return false;'>")
						input.val(value)
						input.attr("title", value)
						input.appendTo(valuediv)
						break
					case "boolean":
						var input = $("<input type='checkbox' disabled='true'>")
						input[0].checked = value
						input.appendTo(valuediv)
						break;
					case "undefined":
						break;
					case "object":
						if(value === null)
							break;

						if(value instanceof ANTI.RBXInstance) {
							valuediv.text(value.Name)
							break;
						} else if(value instanceof ANTI.RBXEnum) {
							valuediv.text("Enum " + value.Value)
							break;
						} else if(value instanceof ANTI.RBXProperty) {
							switch(value.type) {
								case "CFrame":
								case "Color3":
								case "Vector2":
								case "Vector3":
									valuediv.text(fixNums(value).join(", "))
									break;
								case "UDim2":
									valuediv.text("{" + fixNums(value[0]).join(",") + "}, {" + fixNums(value[1]).join(", ") + "}")
									break;
								default: 
									console.log("prop", name, value.type, value)
							}
							break;
						}
					default:
						console.log(name, typeof(value), value);
				}

				valuediv.attr("title", valuediv.text())
				item.appendTo(propertyList)
			})
		} else {
			domElement.find(".btr-properties-header").text("Properties")
		}
	}

	setSelection([])

	domElement.on("click", ".btr-explorer", (event) => {
		setSelection([])

		event.stopPropagation()
		return false
	}).on("click", ".hasChildren>.btr-explorer-more", (event) => {
		$(event.currentTarget.parentNode).toggleClass("closed")

		event.preventDefault()
		return false
	}).on("click", ".btr-explorer-item", (event) => {
		var item = $(event.currentTarget)

		setSelection([item])

		event.preventDefault()
		return false
	}).on("click", ".btr-properties", (event) => {
		event.stopPropagation()
	}).on("mousewheel", ".btr-explorer, .btr-properties-list", function(event) {
		var deltaY = event.originalEvent.deltaY
		if((deltaY > 0 && this.scrollTop === this.scrollHeight - this.clientHeight) || (deltaY < 0 && this.scrollTop === 0)) {
			return false
		}
	}).on("click", ".btr-explorer-view-btn:not(.selected)", (event) => {
		var id = $(event.currentTarget).attr("data-index")
		if(this.selectedView) {
			this.selectedView.button.removeClass("selected");
			this.selectedView.domElement.addClass("hidden")
		}

		this.selectedView = this.views[id]
		this.selectedView.button.addClass("selected")
		this.selectedView.domElement.removeClass("hidden")
	})
}

Object.assign(Explorer.prototype, {
	addView: function(title, model) {
		//console.log(title, model)

		var view = {}
		this.views.push(view)

		view.title = title
		view.model = model

		var btn = view.button = $("<div class='btr-explorer-view-btn' data-index='{1}'>{0}</div>").elemFormat(view.title, this.views.length-1)
		var domElement = view.domElement = $("<ul class='btr-explorer-list'></ul>")

		if(this.views.length === 1) {
			btn.addClass("selected")
			this.selectedView = view
			this.loadingElement.remove()
		} else {
			domElement.addClass("hidden")
		}

		if(this.views.length === 2) {
			this.domElement.find(".btr-explorer-header").removeClass("hidden")
		}

		function createElements(target, parentElement) {
			var item = $(
			"<li class='btr-explorer-item-container'>" +
				"<div class='btr-explorer-more'></div>" +
				"<div class='btr-explorer-item'>" +
					"<div class='btr-explorer-icon' style='background-position:-{iconOffset}px 0;'></div>" +
					"{name}" +
				"</div>" +
			"</li>").elemFormat({
				name: target.Name,
				iconOffset: (rmdClassIcons[target.ClassName] || 0)*16
			}).appendTo(parentElement)
			
			item.find(".btr-explorer-item").data("rbxinstance", target)

			if(target.Children.length > 0) {
				item.addClass("hasChildren")
				var childList = $("<ul class='btr-explorer-childlist'></ul>").appendTo(item)

				for(var i=0; i<target.Children.length; i++) {
					createElements(target.Children[i], childList)
				}
			}
		}

		for(var i=0; i<model.length; i++) {
			createElements(model[i], domElement)
		}

		btn.appendTo(this.domElement.find(".btr-explorer-header"))
		domElement.appendTo(this.domElement.find(".btr-explorer"))
	}
})
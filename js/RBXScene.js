// BTR-animPreview.js

typeof ANTI=="undefined" && (ANTI={}), ANTI.Animator = (function() {
	function mod(a,b){return((a%b)+b)%b}
	function fix(n){return (mod(n,Math.PI*2)+Math.PI)%(Math.PI*2)-Math.PI}

	return function(joints) {
		var previousUpdate = 0

		Object.assign(this, {
			joints: joints,
			anim: null,
			timePosition: 0,

			play: function(anim) {
				if(anim)
					this.anim = anim;

				this.playing = true
				this.timePosition = 0
				previousUpdate = window.performance.now() / 1000
			},
			pause: function() {
				this.playing = false
			},
			resume: function() {
				this.playing = true
				previousUpdate = window.performance.now() / 1000
			},
			update: function(delta) {
				if(!this.playing || !this.anim)
					return;

				var time = window.performance.now() / 1000
				var delta = time - previousUpdate
				previousUpdate = time
				this.timePosition += delta

				if(this.timePosition > this.anim.Length) {
					if(this.anim.Looped) {
						this.timePosition = this.timePosition % this.anim.Length
					} else {
						this.playing = false
						this.timePosition = 0

						if(this.onstop)
							this.onstop()
						return;
					}
				}

				var currentTime = this.timePosition
				var animData = this.anim.Limbs
				var emptyFrame = [0, [0,0,0], [0,0,0]]

				for(var name in animData) {
					var joint = this.joints[name]
					if(joint) {
						var frames = animData[name]
						for(var i=0, l=frames.length; i<l; i++) {
							var frame = frames[i]
							var frameTime = frame[0]

							if(frameTime >= currentTime) {
								var prev = i > 0 ? frames[i-1] : emptyFrame
								var t = frameTime == currentTime ? 1 : (currentTime-prev[0])/(frameTime-prev[0])

								var pos0 = prev[1]
								var pos1 = frame[1]

								var rot0 = prev[2]
								var rot1 = frame[2]

								joint.pivot.position.set(
									pos0[0] + fix(pos1[0]-pos0[0]) * t,
									pos0[1] + fix(pos1[1]-pos0[1]) * t,
									pos0[2] + fix(pos1[2]-pos0[2]) * t
								)

								joint.pivot.rotation.set(
									rot0[0] + fix(rot1[0]-rot0[0]) * t,
									rot0[1] + fix(rot1[1]-rot0[1]) * t,
									rot0[2] + fix(rot1[2]-rot0[2]) * t
								)

								break;
							}
						}
					}
				}
			}
		})
	}
})();

function CreateControls(instance) {
	var controls = {
		focus: new THREE.Vector3(0, 4, 0),
		rotation: new THREE.Euler(.05, 0, 0, "YXZ"),
		zoom: 10
	}
	var prevDragEvent = null

	with(instance) {
		function mousedown(event) {
			event.preventDefault()

			if(event.button == 0) {
				prevDragEvent = event
				canvas.on("mousemove", mousemove)
				canvas.on("mouseup", mouseup)
			}

			return false
		}

		function mousemove(event) {
			var moveX = event.clientX - prevDragEvent.clientX
			var moveY = event.clientY - prevDragEvent.clientY

			if(controls.ondrag)
				controls.ondrag(moveX, moveY)

			prevDragEvent = event
		}

		function mouseup(event) {
			if(event.type == "mouseleave" || event.button == 0) {
				canvas.off("mousemove", mousemove)
				canvas.off("mouseup", mouseup)
			}
		}

		canvas.on({ 
			mousedown: mousedown, 
			mouseleave: mouseup, 
			contextmenu: (event) => event.preventDefault()
		})

		controls.update = () => {
			var cameraDir = new THREE.Vector3(0, 0, 1).applyEuler(controls.rotation)
			var cameraPos = camera.position.copy(controls.focus).addScaledVector(cameraDir, -controls.zoom)

			var groundDiff = .05 - cameraPos.y
			if(groundDiff > 0 && cameraDir.y > 0) {
				cameraPos.addScaledVector(cameraDir, groundDiff/cameraDir.y)
			}

			camera.lookAt(controls.focus)
		}
	}

	return controls
}

function CreateInstance() {
	var instance = {}
	var renderer = instance.renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true
	})
	var canvas = instance.canvas = $(renderer.domElement)
	renderer.shadowMap.type = THREE.PCFSoftShadowMap
	renderer.shadowMap.enabled = true

	// Init scene
	var scene = instance.scene = new THREE.Scene()
	var camera = instance.camera = new THREE.PerspectiveCamera(60, canvas.width()/canvas.height(), 0.1, 1000)
	var controls = instance.controls = CreateControls(instance)

	var ambientLight = new THREE.AmbientLight(0x909090)

	var sunLight = new THREE.DirectionalLight(0x505050)
	sunLight.position.set(.2, .7, -.5).normalize().multiplyScalar(10)
	sunLight.castShadow = false

	var shadowLight = new THREE.DirectionalLight(0x404040)
	shadowLight.position.set(0, 1, 0).normalize().multiplyScalar(10)
	shadowLight.castShadow = true
	shadowLight.shadow.mapSize.width = 1024
	shadowLight.shadow.mapSize.height = 1024
	
	var ground = new THREE.Mesh(
		//new THREE.PlaneGeometry(500, 500),
		new THREE.CylinderGeometry(2.5, 2.5, .1, 24),
		new THREE.MeshLambertMaterial({ color: 0xb7a760 })
	)

	ground.position.y = -.05
	ground.receiveShadow = true

	var shadowCaster = new THREE.Mesh(
		new THREE.PlaneGeometry(20, 20),
		new THREE.ShadowMaterial()
	)

	shadowCaster.material.opacity = .5
	shadowCaster.rotation.x = -Math.PI/2
	shadowCaster.position.y = -.1
	shadowCaster.receiveShadow = true

	scene.add(ambientLight)
	scene.add(sunLight)
	scene.add(shadowLight)
	scene.add(ground)
	scene.add(shadowCaster)

	var animationFrameId = null
	var res = {width: -1, height: -1}
	function update() {
		var parent = canvas.parent()
		if(parent.length > 0) {
			var width = parent.width()
			var height = parent.height()

			if(width !== res.width || height !== res.height) {
				res.width = width
				res.height = height

				renderer.setSize(width, height)
				camera.aspect = height == 0 ? 0 : width / height
				camera.updateProjectionMatrix()
			}
		}

		controls.update()
		if(instance.onupdate)
			instance.onupdate();

		renderer.render(scene, camera)
		animationFrameId = requestAnimationFrame(update)
	}
	
	function onresize() {
		var width = canvas.width()
		var height = canvas.height()

		renderer.setSize(width, height)

		camera.aspect = width / height
		camera.updateProjectionMatrix()
	}

	instance.remove = () => {
		canvas.remove()
		$(window).off("resize", onresize)
		cancelAnimationFrame(animationFrameId)
	}

	animationFrameId = requestAnimationFrame(update)

	return instance
}

typeof ANTI=="undefined" && (ANTI={}), ANTI.Create3dPreview = (function() {
	var idle_anim = {Length:1,Looped:true,Limbs:{torso:[[0,[0,0,0],[0,0,0]],[0.05,[0,0,-0.00183],[0,0,0]],[0.1,[0,0,-0.003928],[0,0,0]],[0.15,[0,0,-0.009811],[0,0,0]],[0.2,[0,0,-0.013305],[0,0,0]],[0.25,[0,0,-0.020647],[0,0,0]],[0.3,[0,0,-0.027442],[0,0,0]],[0.35,[0,0,-0.030259],[0,0,0]],[0.4,[0,0,-0.034014],[0,0,0]],[0.45,[0,0,-0.034685],[0,0,0]],[0.5,[0,0,-0.033422],[0,0,0]],[0.55,[0,0,-0.031734],[0,0,0]],[0.6,[0,0,-0.026807],[0,0,0]],[0.65,[0,0,-0.023791],[0,0,0]],[0.7,[0,0,-0.017213],[0,0,0]],[0.75,[0,0,-0.010655],[0,0,0]],[0.8,[0,0,-0.007662],[0,0,0]],[0.85,[0,0,-0.002809],[0,0,0]],[0.9,[0,0,-0.001172],[0,0,0]],[0.95,[0,0,0],[0,0,0]]],leftleg:[[0,[0,0,0],[0,0,0]],[0.05,[0,0.001696,0],[0,0,0]],[0.1,[0,0.003639,0],[0,0,0]],[0.15,[0,0.009088,0],[0,0,0]],[0.2,[0,0.012324,0],[0,0,0]],[0.25,[0,0.019125,0],[0,0,0]],[0.3,[0,0.02542,0],[0,0,0]],[0.35,[0,0.028029,0],[0,0,0]],[0.4,[0,0.031508,0],[0,0,0]],[0.45,[0,0.032129,0],[0,0,0]],[0.5,[0,0.030959,0],[0,0,0]],[0.55,[0,0.029396,0],[0,0,0]],[0.6,[0,0.024831,0],[0,0,0]],[0.65,[0,0.022037,0],[0,0,0]],[0.7,[0,0.015944,0],[0,0,0]],[0.75,[0,0.009869,0],[0,0,0]],[0.8,[0,0.007097,0],[0,0,0]],[0.85,[0,0.002602,0],[0,0,0]],[0.9,[0,0.001086,0],[0,0,0]],[0.95,[0,0,0],[0,0,0]]],rightleg:[[0,[0,0,0],[0,0,0]],[0.05,[0,0.001367,0],[0,0,0]],[0.1,[0,0.002934,0],[0,0,0]],[0.15,[0,0.007327,0],[0,0,0]],[0.2,[0,0.009936,0],[0,0,0]],[0.25,[0,0.015419,0],[0,0,0]],[0.3,[0,0.020494,0],[0,0,0]],[0.35,[0,0.022597,0],[0,0,0]],[0.4,[0,0.025401,0],[0,0,0]],[0.45,[0,0.025902,0],[0,0,0]],[0.5,[0,0.024959,0],[0,0,0]],[0.55,[0,0.023699,0],[0,0,0]],[0.6,[0,0.020019,0],[0,0,0]],[0.65,[0,0.017766,0],[0,0,0]],[0.7,[0,0.012855,0],[0,0,0]],[0.75,[0,0.007957,0],[0,0,0]],[0.8,[0,0.005722,0],[0,0,0]],[0.85,[0,0.002097,0],[0,0,0]],[0.9,[0,0.000875,0],[0,0,0]],[0.95,[0,0,0],[0,0,0]]],leftarm:[[0,[-0.000001,-0.003103,0],[-0.000199,-0.007649,-0.000908]],[0.05,[0,0.00769,0],[-0.001103,-0.000957,0.001274]],[0.1,[0,0.011064,0],[-0.002068,0.001321,0.002232]],[0.15,[0,0.015117,0],[-0.00431,0.004083,0.003699]],[0.2,[0,0.015898,0],[-0.005256,0.004599,0.004127]],[0.25,[0,0.014618,0],[-0.006027,0.003762,0.004102]],[0.3,[0,0.008695,0],[-0.005868,0.000014,0.002819]],[0.35,[0,0.00435,0],[-0.005694,-0.002743,0.00185]],[0.4,[0,-0.00587,0],[-0.005197,-0.009231,-0.000459]],[0.45,[0,-0.011255,0],[-0.004888,-0.012652,-0.001685]],[0.5,[0,-0.021244,0],[-0.004187,-0.019002,-0.003977]],[0.55,[0,-0.025369,0],[-0.003806,-0.021627,-0.004932]],[0.6,[0,-0.030602,0],[-0.003018,-0.024961,-0.006173]],[0.65,[0,-0.031388,0],[-0.002623,-0.025469,-0.006383]],[0.7,[0,-0.029852,0],[-0.001865,-0.024679,-0.006152]],[0.75,[0,-0.024959,0],[-0.001189,-0.022101,-0.005304]],[0.8,[0,-0.021607,0],[-0.0009,-0.020258,-0.004705]],[0.85,[0,-0.013892,0],[-0.000449,-0.015628,-0.003242]],[0.9,[0,-0.009855,0],[-0.000302,-0.012893,-0.002412]],[0.95,[0,-0.002432,0],[-0.000199,-0.007078,-0.000751]],[1,[-0.000001,-0.003103,0],[-0.000199,-0.007649,-0.000908]]],rightarm:[[0,[0,0.000026,-0.000001],[-0.001009,-0.00022,-0.000558]],[0.05,[0,0.004133,0],[-0.003891,-0.004205,-0.003895]],[0.1,[0,0.005899,0],[-0.005756,-0.006418,-0.00474]],[0.15,[0,0.008296,-0.000001],[-0.008947,-0.009749,-0.005496]],[0.2,[0,0.008623,0],[-0.009757,-0.010149,-0.005372]],[0.25,[0,0.007025,0],[-0.009412,-0.007973,-0.003713]],[0.3,[0,0.003463,0],[-0.00772,-0.003296,-0.000581]],[0.35,[0,0.001314,0],[-0.006601,-0.000503,0.001243]],[0.4,[0,-0.003068,0],[-0.004185,0.005157,0.004864]],[0.45,[0,-0.005038,0],[-0.003037,0.007683,0.006446]],[0.5,[0,-0.007805,0],[-0.001276,0.011191,0.008569]],[0.55,[0.000001,-0.008416,0],[-0.000765,0.011925,0.008964]],[0.6,[0,-0.008528,0],[-0.000188,0.011818,0.008777]],[0.65,[0,-0.008278,0],[0.000006,0.011286,0.008405]],[0.7,[0,-0.007277,0],[0.00021,0.009478,0.007212]],[0.75,[0,-0.005757,0],[0.000189,0.007007,0.005554]],[0.8,[0,-0.004852,0],[0.000099,0.005647,0.004593]],[0.85,[0,-0.002846,0],[-0.000235,0.002912,0.002481]],[0.9,[0,-0.001786,0],[-0.000477,0.001637,0.001365]],[0.95,[0,0.000207,0],[-0.001071,-0.000312,-0.000752]],[1,[0,0.000026,-0.000001],[-0.001009,-0.00022,-0.000558]]],head:[[0,[0,0,0],[-0.000162,0,0.000257]],[0.05,[0,0,0],[-0.002569,0,-0.000309]],[0.1,[0,0,0],[-0.003776,0,-0.000648]],[0.15,[0,0,-0.000001],[-0.005925,0,-0.001303]],[0.2,[0,0,0],[-0.006761,0,-0.001559]],[0.25,[0,0,0],[-0.00769,0,-0.001782]],[0.3,[0,0,0],[-0.007263,0,-0.001444]],[0.35,[0,0,0],[-0.006526,0,-0.001053]],[0.4,[0,0,0],[-0.004305,0,0.000034]],[0.45,[0,0,0],[-0.002952,0,0.000669]],[0.5,[0,0,0],[-0.000118,0,0.001961]],[0.55,[0,0,0],[0.001236,0,0.00256]],[0.6,[0,0,0],[0.003484,0,0.003511]],[0.65,[0,0,0],[0.004231,0,0.003798]],[0.7,[0,0,0],[0.004815,0,0.003845]],[0.75,[0,0,0],[0.004535,0,0.003217]],[0.8,[0,0,0],[0.004156,0,0.002739]],[0.85,[0,0,0],[0.002939,0,0.001629]],[0.9,[0,0,0],[0.00207,0,0.001074]],[0.95,[0,0,0],[-0.000475,0,0.000216]],[1,[0,0,0],[-0.000162,0,0.000257]]]}}

	function CFrame(x,y,z, r00,r01,r02, r10,r11,r12, r20,r21,r22) {
		return new THREE.Matrix4().set(
			r00, r01, r02, x,
			r10, r11, r12, y,
			r20, r21, r22, z,
			 0,   0,   0,  1
		)
	}

	var R6Joints = {
		leftleg: { c0: CFrame(-1,-1,0,-0,-0,-1,0,1,0,1,0,0), c1: CFrame(-0.5,1,0,-0,-0,-1,0,1,0,1,0,0) },
		leftarm: { c0: CFrame(-1,0.5,0,-0,-0,-1,0,1,0,1,0,0), c1: CFrame(0.5,0.5,0,-0,-0,-1,0,1,0,1,0,0) },
		head: { c0: CFrame(0,1,0,-1,-0,-0,0,0,1,0,1,0), c1: CFrame(0,-0.5,0,-1,-0,-0,0,0,1,0,1,0) },
		rightleg: { c0: CFrame(1,-1,0,0,0,1,0,1,0,-1,-0,-0), c1: CFrame(0.5,1,0,0,0,1,0,1,0,-1,-0,-0) },
		rightarm: { c0: CFrame(1,0.5,0,0,0,1,0,1,0,-1,-0,-0), c1: CFrame(-0.5,0.5,0,0,0,1,0,1,0,-1,-0,-0) },
		torso: { c0: CFrame(0,0,0,-1,-0,-0,0,0,1,0,1,0), c1: CFrame(0,0,0,-1,-0,-0,0,0,1,0,1,0) }
	}

	var R6Attachments = {
		head: { Hair: [0,0.6,0], Hat: [0,0.6,0], FaceFront: [0,0,-0.6], FaceCenter: [0,0,0] },
		torso: { Neck: [0,1,0], BodyFront: [0,0,-0.5], BodyBack: [0,0,0.5], LeftCollar: [-1,1,0], RightCollar: [1,1,0], WaistFront: [0,-1,-0.5], WaistCenter: [0,-1,0], WaistBack: [0,-1,0.5] },
		leftarm: { LeftShoulder: [0,1,0] },
		rightarm: { RightShoulder: [0,1,0] }
	}

	function createTexture(url) {
		var texture = new THREE.Texture()

		var img = texture.image = new Image()
		img.crossOrigin = "Anonymous"
		img.addEventListener("load", () => {
			texture.needsUpdate = true
			return true
		})

		if(url)
			img.src = url;

		return texture
	}

	function remapBody(geom) {
		var uvs = geom.attributes.uv.array
		for(var i=0, l=uvs.length; i<l; i+= 2) {
			uvs[i] = uvs[i] * .75
		}
	}

	function remapHead(geom) {
		var uvs = geom.attributes.uv.array
		for(var i=0, l=uvs.length; i<l; i+= 2) {
			uvs[i] = 0.880859375 + uvs[i]*.109375
			uvs[i+1] = .765625 + uvs[i+1]*.21875
		}
	}

	function createComposite() {
		var composite = {}
		var renderer = new THREE.WebGLRenderer({ alpha: true })
		renderer.setSize(1024, 512)

		var size = 2
		var scene = new THREE.Scene()
		var camera = new THREE.OrthographicCamera(-size/2, size/2, size/4, -size/4, 0.1, 100)
		camera.position.set(size/2, size/4, 10)
		camera.rotation.set(0, 0, 0)

		var ambient = new THREE.AmbientLight(0xFFFFFF)
		scene.add(ambient)

		var shirtmesh = new THREE.Mesh(undefined, new THREE.MeshPhongMaterial())
		var shirt = shirtmesh.material.map = createTexture()
		loadMesh(shirtmesh.geometry, chrome.runtime.getURL("res/meshes/r6/shirtTemplate.mesh"))
		scene.add(shirtmesh)

		var pantsmesh = new THREE.Mesh(undefined, new THREE.MeshPhongMaterial())
		var pants = pantsmesh.material.map = createTexture()
		loadMesh(pantsmesh.geometry, chrome.runtime.getURL("res/meshes/r6/pantsTemplate.mesh"))
		scene.add(pantsmesh)

		var tshirtmesh = new THREE.Mesh(undefined, new THREE.MeshPhongMaterial())
		var tshirt = tshirtmesh.material.map = createTexture()
		loadMesh(tshirtmesh.geometry, chrome.runtime.getURL("res/meshes/r6/tshirtTemplate.mesh"))
		scene.add(tshirtmesh)

		var face = createTexture()

		scene.scale.set(size/1024, size/1024, size/1024)

		shirt.image.addEventListener("load", () => composite._onload())
		pants.image.addEventListener("load", () => composite._onload())
		tshirt.image.addEventListener("load", () => composite._onload())
		face.image.addEventListener("load", () => composite._onload())

		var canvas = document.createElement("canvas")
		var ctx = canvas.getContext("2d")
		canvas.width = 1024
		canvas.height = 512

		function fillBodyColors(bc) {
			ctx.fillStyle = bc.headColorId
			ctx.fillRect(895, 0, 128, 128)

			ctx.fillStyle = bc.torsoColorId
			ctx.fillRect(0, 0, 144, 448)
			ctx.fillRect(145, 322, 204, 76)
			ctx.fillRect(204, 401, 111, 104)

			ctx.fillStyle = bc.rightArmColorId
			ctx.fillRect(150, 0, 144, 320)
			ctx.fillRect(315, 400, 111, 104)
			ctx.fillRect(568, 322, 53, 76)
			ctx.fillRect(673, 322, 57, 76)

			ctx.fillStyle = bc.leftArmColorId
			ctx.fillRect(300, 0, 144, 320)
			ctx.fillRect(426, 400, 111, 104)
			ctx.fillRect(621, 322, 52, 76)
			ctx.fillRect(146, 394, 57, 76)

			ctx.fillStyle = bc.rightLegColorId
			ctx.fillRect(450, 0, 144, 320)
			ctx.fillRect(537, 400, 111, 104)
			ctx.fillRect(349, 322, 57, 76)
			ctx.fillRect(457, 322, 56, 76)

			ctx.fillStyle = bc.leftLegColorId
			ctx.fillRect(600, 0, 144, 320)
			ctx.fillRect(648, 400, 111, 104)
			ctx.fillRect(406, 322, 51, 76)
			ctx.fillRect(513, 322, 55, 76)
		}

		face.image.src = chrome.runtime.getURL("res/meshes/r6/face.png")
		pants.minFilter = THREE.LinearFilter
		shirt.minFilter = THREE.LinearFilter
		tshirt.minFilter = THREE.LinearFilter

		var cachedBodyColors = ctx.createImageData(1024,512)

		return Object.assign(composite, {
			face: face,
			shirt: shirt,
			pants: pants,
			tshirt: tshirt,

			setBodyColors: (bc) => {
				fillBodyColors(bc)
				cachedBodyColors = ctx.getImageData(0,0, 1024,512)
			},
			snapshot: (cb) => {
				shirtmesh.visible = shirt.image.src.length > 0
				pantsmesh.visible = pants.image.src.length > 0
				tshirtmesh.visible = tshirt.image.src.length > 0

				renderer.render(scene, camera)
				var img = new Image()
				img.src = renderer.domElement.toDataURL()
				img.onload = () => {
					ctx.putImageData(cachedBodyColors, 0,0)
					if(face.image.src.length > 0)
						ctx.drawImage(face.image, 902,7, 112,112);
					ctx.drawImage(img, 0,0, 768,512)
					cb(canvas.toDataURL())
				}
			},
			_onload: () => {
				if(composite.onload)
					composite.onload()
			}
		})
	}

	function createRig(playerType) {
		var rig = {}
		var model = rig.model = new THREE.Object3D()
		var bodyTexture = createTexture()
		var composite = createComposite()

		rig.setBodyColors = (bc) => composite.setBodyColors(bc);
		rig.updateTexture = () => {
			composite.snapshot((dataUrl) => bodyTexture.image.src=dataUrl)
		}
		rig.addAsset = (info, data) => {
			if(data.type == "image") {
				composite[info.assetType.name.toLowerCase()].image.src = data.data
			} else if(data.type == "accessory") {
				if(!rig.attachmentPoints || !rig.attachmentPoints[data.target]) {
					console.log("Missing attachment " + data.target, rig.attachmentPoints)
				} else {
					rig.accessories.push(data.data)
					rig.attachmentPoints[data.target].add(data.data)
				}
			} else if(data.type == "bodypart") {
			} else {
				console.log(info, data)
			}
		}

		composite.onload = rig.updateTexture

		if(playerType == "R6") {
			//$(bodyTexture.image).appendTo((".btr-wearing")).css("zoom",".5")
			var material = new THREE.MeshPhongMaterial()
			material.map = bodyTexture
			var parts = rig.parts = {}
			var joints = rig.joints = {}
			var attachmentPoints = rig.attachmentPoints = {}
			var accessories = rig.accessories = []

			var torso = parts.torso = new THREE.Mesh(undefined, material)
			var head = parts.head = new THREE.Mesh(undefined, material)
			var rightarm = parts.rightarm = new THREE.Mesh(undefined, material)
			var leftarm = parts.leftarm = new THREE.Mesh(undefined, material)
			var rightleg = parts.rightleg = new THREE.Mesh(undefined, material)
			var leftleg = parts.leftleg = new THREE.Mesh(undefined, material)

			var baseUrl = chrome.runtime.getURL("res/meshes/r6/")
			$.each(parts, (name, part) => {
				part.castShadow = true
				loadMesh(part.geometry, baseUrl + name + ".mesh").then(name == "head" ? remapHead : remapBody)
			})

			$.each(R6Attachments, (partName, dict) => {
				var part = parts[partName]
				$.each(dict, (name, pos) => {
					var attachment = attachmentPoints[name + "Attachment"] = new THREE.Object3D()
					attachment.position.fromArray(pos)
					part.add(attachment)
				})
			})

			torso.add(head, rightarm, leftarm, rightleg, leftleg)
			model.add(torso)

			$.each(R6Joints, (name, baseJoint) => {
				var joint = joints[name] = {}
				var part = joint.part1 = parts[name]
				var pivot = joint.pivot = new THREE.Object3D()
				var parent = joint.part0 = part.parent

				var c0 = new THREE.Object3D()
				var c1 = new THREE.Object3D()

				var c0Matrix = baseJoint.c0
				var c1Matrix = new THREE.Matrix4().getInverse(baseJoint.c1)

				c0.position.setFromMatrixPosition(c0Matrix)
				c0.rotation.setFromRotationMatrix(c0Matrix)

				c1.position.setFromMatrixPosition(c1Matrix)
				c1.rotation.setFromRotationMatrix(c1Matrix)	

				parent.add(c0)
				c0.add(pivot)
				pivot.add(c1)
				c1.add(part)
			})

			rig.animator = new ANTI.Animator(joints)
		}

		return rig
	}

	var meshRequests = {}
	function loadMesh(geom, url) {
		var request = meshRequests[url]
		if(!request) {
			request = meshRequests[url] = new Promise((resolve) => {
				var xhr = new XMLHttpRequest()
				xhr.open("GET", url, true)
				xhr.responseType = "arraybuffer"
				xhr.onload = () => {
					if(xhr.status === 200 || xhr.status === 0) {
						var meshData = ANTI.ParseMesh(xhr.response)
						meshData.vertices = new THREE.BufferAttribute(meshData.vertices, 3)
						meshData.normals = new THREE.BufferAttribute(meshData.normals, 3)
						meshData.uvs = new THREE.BufferAttribute(meshData.uvs, 2)
						meshData.faces = new THREE.BufferAttribute(meshData.faces, 1)
						resolve(meshData)
					} else {
						console.warn("[loadMesh] Mesh '" + url +"' failed to load")
					}
				}
				xhr.send()
			})
		}

		return request.then((data) => {
			geom.addAttribute("position", data.vertices)
			geom.addAttribute("normal", data.normals)
			geom.addAttribute("uv", data.uvs)
			geom.setIndex(data.faces)
			geom.uvsNeedUpdate = true
			return geom
		})
	}

	var assetRequests = {}
	function loadAsset(assetInfo) {
		var request = assetRequests[assetInfo.id]
		if(!request) {
			request = assetRequests[assetInfo.id] = new Promise((resolve) => {
				downloadAsset("arraybuffer", {id:assetInfo.id}).then((buffer) => {
					var assetData = null
					try {
						assetData = ANTI.ParseRBXM(buffer)
					} catch(ex) {
						console.log("Failed to parse", assetInfo)
						return resolve(null);
					}

					if(assetData.length == 0) {
						console.log("Empty asset", assetInfo)
						return resolve(null)
					}

					var assetType = assetInfo.assetType.name

					function parseContent(text) {
						var match = text.match(/(?:rbxassetid:\/\/|\?id=)(\d+)/)
						if(match)
							return match[1];

						return null
					}

					var images = { Face: "Texture", Shirt: "ShirtTemplate", Pants: "PantsTemplate" }
					if(images[assetType]) {
						var assetId = parseContent(assetData[0][images[assetType]])
						if(assetId) {
							downloadAsset("blob", {id: assetId}).then((blob) => resolve({ type: "image", data: blob }))
							return;
						}
					}

					var accessories = [ 8, 41, 42, 43, 44, 45, 46, 47 ]
					if(accessories.indexOf(assetInfo.assetType.id) !== -1) {
						var mesh = null
						var attachment = null
						assetData.forEach((acc) => {
							if(acc.ClassName != "Accessory")
								return;

							acc.Children.forEach((han) => {
								if(han.Name != "Handle")
									return;

								han.Children.forEach((item) => {
									if(item.ClassName == "SpecialMesh")
										mesh = item;
									else if(item.ClassName == "Attachment")
										attachment = item;
								})
							})
						})

						if(mesh && attachment) {
							var meshId = parseContent(mesh.MeshId)
							var texId = parseContent(mesh.TextureId)
							if(!meshId) {
								console.log("Bad mesh id", mesh.MeshId);
								return;
							}

							Promise.all([
								downloadAsset("blob", {id: meshId}), 
								texId&&downloadAsset("blob", {id: texId})
							]).then((blobs) => {
								var obj = new THREE.Mesh(undefined, new THREE.MeshPhongMaterial())
								loadMesh(obj.geometry, blobs[0])
								if(texId)
									obj.material.map = createTexture(blobs[1]);

								var offset = attachment.CFrame.slice(0)
								offset[0] += mesh.Offset[0]
								offset[1] += mesh.Offset[1]
								offset[2] += mesh.Offset[2]

								var matrix = CFrame.apply(null, offset)
								matrix.getInverse(matrix)
								obj.position.setFromMatrixPosition(matrix)
								obj.rotation.setFromRotationMatrix(matrix)	

								obj.scale.set(mesh.Scale[0]/2, mesh.Scale[1]/2, mesh.Scale[2]/2)
								resolve({type: "accessory", data: obj, target: attachment.Name })
							})
							return;
						} else {
							console.log("Unable to find mesh and attachment for", assetInfo, assetData)
							return;
						}
					}

					console.log("Not implemented", assetInfo, assetData)
					resolve(null)
				})
			})
		}

		return request
	}

	return function(parent, initialAvatarData) {
		var instance = CreateInstance()
		var animator = null
		var character = null

		instance.controls.ondrag = (moveX, moveY) =>{
			if(character)
				character.model.rotation.y += 2 * Math.PI * moveX / instance.canvas.width();

			instance.controls.rotation.x += 2 * Math.PI * moveY / instance.canvas.height()
		}

		instance.onupdate = () => {
			if(character && character.animator) {
				character.animator.update()
			}
		}

		var r6rig = createRig("R6")
		r6rig.animator.play(idle_anim)
		var r15rig = createRig("R15")
		var visibleRig = null

		window.r6rig = r6rig
		window.r15rig = r15rig

		function buildCharacter(data) {
			console.log("build", data)

			if(data.playerAvatarType == "R6") {
				if(visibleRig != r6rig) {
					visibleRig = r6rig
					instance.scene.add(r6rig.model).remove(r15rig.model)
				}

				r6rig.setBodyColors(data.bodyColors)
				r6rig.updateTexture()

				data.assets.forEach((assetInfo) => {
					loadAsset(assetInfo).then((data) => data&&r6rig.addAsset(assetInfo, data))
				})

				r6rig.model.position.set(0,3,0)
				r6rig.model.rotation.set(0,0,0)
				character = r6rig
			} else {
				console.log("R15 naht supahtd")
			}
		}

		function prepareCharacter(object, data) {
			var children = object.children.slice(0)
			var len = children.length
			character = object

			if(len < 16 || children[len-1].name.length == 8) { // R6, R15 bodyparts have 9 length names
				var parts = {
					head: children[len-1],
					torso: children[len-2],
					leftarm: children[len-3],
					rightarm: children[len-4],
					leftleg: children[len-5],
					rightleg: children[len-6]
				}
				var accessories = []

				with(parts) {
					// Accessories
					for(var i=0; i < len-6; i++) {
						var acc = children[i]
						accessories.push(acc)

						if(i == 0) { // Check if gear
							rightarm.geometry.computeBoundingBox()
							var box = rightarm.geometry.boundingBox
							if((box.max.z - box.min.z) > Math.max(1.5, box.max.y - box.min.y)) {
								rightarm.add(accessories[0])
								continue;
							}
						}

						head.add(acc)
					}

					torso.add(head, rightarm, leftarm, rightleg, leftleg)
					object.add(torso)

					// Center the model
					var center = (torso.geometry.computeBoundingSphere(), torso.geometry.boundingSphere.center)
					var heightOffset = Math.round(center.y / 5) * 5 + 0.5
					var depthOffset = center.z
					var offset = new THREE.Matrix4().makeTranslation(0, -heightOffset, -depthOffset)

					children.forEach((mesh) => {
						mesh.geometry.applyMatrix(offset)
						mesh.castShadow = true
						mesh.material.shininess = 10
					})

					// Center the parts
					var partOffsets = {
						head: [0, 1.5, 0,  0, 0, 0],
						rightarm: [1.5, 0, 0,  0, 0, 0],
						leftarm: [-1.5, 0, 0,  0, 0, 0],
						rightleg: [.5, -2, 0,  0, 0, 0],
						leftleg: [-.5, -2, 0,  0, 0, 0],
					}

					$.each(partOffsets, (name, array) => {
						var matrix = new THREE.Matrix4()
						matrix.makeRotationFromEuler(new THREE.Euler(array[3], array[4], array[5]))
						matrix.setPosition(new THREE.Vector3(array[0], array[1], array[2]))
						matrix.getInverse(matrix)

						function applyMatrix(tar) {
							if(tar.geometry) tar.geometry.applyMatrix(matrix);
							tar.children.forEach(applyMatrix)
						}

						applyMatrix(parts[name])
					})
				}

				// Init animator
				var joints = createJoints("R6", parts)
				animator = new ANTI.Animator(joints)
				if(anim) {
					if(!anim.Looped) {
						animator.onstop = function() {
							console.log(1)
							setTimeout(function() {
								animator.play()
								animator.pause()
								setTimeout(() => animator.resume(), 1000)
							}, 1000)
						}
					}

					animator.play(anim)
				}

				window.parts = parts
				window.joints = joints
				window.anim = anim
				window.animator = animator
			} else {
				var r15torso = children[len - 7]

				r15torso.geometry.computeBoundingSphere()
				var center = r15torso.geometry.boundingSphere.center

				var offset = new THREE.Matrix4().makeTranslation(-center.x, -107.9, -center.z+.2)
				children.forEach((mesh) => {
					mesh.geometry.applyMatrix(offset)
					mesh.castShadow = true
					mesh.material.shininess = 10
				})

				object.rotation.y -= .3
			}

			window.children = children
			instance.scene.add(object)
			object.position.set(0, 3, 0)
		}

		parent.append(instance.canvas)
		parent.find("img").hide()
		parent.removeClass("btr-preview-loading")

		if(initialAvatarData)
			buildCharacter(initialAvatarData);

		return {
			remove: () => {
				instance.remove()
			},
			updateCharacter: (data) => {
				buildCharacter(data)
			}
		}
	};
})();
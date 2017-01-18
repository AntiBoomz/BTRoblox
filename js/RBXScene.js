// BTR-RBXScene.js
"use strict"

typeof ANTI=="undefined" && (ANTI={}), ANTI.RBXScene = (function() {
	var isReady = false
	var readyPromise = new Promise((resolve) => {
		var components = [
			"js/scene/AssetCache.js",
			"js/scene/Animator.js",
			"js/scene/Controls.js",
			"js/scene/Avatar.js"
		]

		BackgroundJS.send("execScript", components, () => {
			isReady = true
			resolve(RBXScene)
		})
	})

	function RBXScene() {
		if(!isReady)
			throw new error("RBXScene is not ready yet");

		this._prevRes = { width: -1, height: -1 }
		this._updateListeners = []

		var renderer = this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true
		})
		renderer.shadowMap.type = THREE.PCFSoftShadowMap
		renderer.shadowMap.enabled = true

		var canvas = this.canvas = $(renderer.domElement)
		var scene = this.scene = new THREE.Scene()
		var camera = this.camera = new THREE.PerspectiveCamera(60, canvas.width()/canvas.height(), 0.1, 1000)
		var controls = this.controls = new RBXScene.Controls(this)
		var avatar = this.avatar = new RBXScene.Avatar()

		scene.add(avatar.model)

		var ambientLight = new THREE.AmbientLight(0x909090)
		scene.add(ambientLight)

		var sunLight = new THREE.DirectionalLight(0x505050)
		sunLight.position.set(.2, .7, -.5).normalize().multiplyScalar(10)
		sunLight.castShadow = false
		scene.add(sunLight)

		var shadowLight = new THREE.DirectionalLight(0x404040)
		shadowLight.position.set(0, 1, 0).normalize().multiplyScalar(10)
		shadowLight.castShadow = true
		shadowLight.shadow.mapSize.width = 1024
		shadowLight.shadow.mapSize.height = 1024
		scene.add(shadowLight)
		
		var ground = new THREE.Mesh(
			new THREE.CylinderGeometry(2.5, 2.5, .1, 24),
			new THREE.MeshLambertMaterial({ color: 0xb7a760 })
		)
		scene.add(ground)

		ground.position.y = -.05
		ground.receiveShadow = true

		var shadowCaster = new THREE.Mesh(
			new THREE.PlaneGeometry(20, 20),
			new THREE.ShadowMaterial()
		)
		scene.add(shadowCaster)

		shadowCaster.material.opacity = .5
		shadowCaster.rotation.x = -Math.PI/2
		shadowCaster.position.y = -.1
		shadowCaster.receiveShadow = true

		controls.mousedrag((moveX, moveY) => {
			if(avatar)
				avatar.model.rotation.y += 2 * Math.PI * moveX / canvas.width();

			controls.rotation.x += 2 * Math.PI * moveY / canvas.height()
			if(controls.rotation.x < -1.4)
				controls.rotation.x = -1.4;
			else if(controls.rotation.x > 1.4)
				controls.rotation.x = 1.4;
		})

		var innerUpdate = () => {
			if(avatar)
				avatar.animator.update();

			this.update()
			this._afId = requestAnimationFrame(innerUpdate)
		}
		this._afId = requestAnimationFrame(innerUpdate)

		$(window).on("resize.canvasResize", () => {
			var width = canvas.width()
			var height = canvas.height()

			renderer.setSize(width, height)

			camera.aspect = width / height
			camera.updateProjectionMatrix()
		})
	}

	Object.assign(RBXScene, {
		ready: function(cb) { return readyPromise.then(cb), this }
	})

	Object.assign(RBXScene.prototype, {
		update: function(fn) {
			if(arguments.length > 0) {
				if(typeof(fn) !== "function")
					throw new TypeError("Listener should be a function");

				this._updateListeners.push(fn)
				return;
			}

			var parent = this.canvas.parent()
			if(parent.length > 0) {
				var width = parent.width()
				var height = parent.height()
				var res = this._prevRes

				if(width !== res.width || height !== res.height) {
					res.width = width
					res.height = height

					this.renderer.setSize(width, height)
					this.camera.aspect = height == 0 ? 0 : width / height
					this.camera.updateProjectionMatrix()
				}
			}

			for(var i=0, l=this._updateListeners.length; i<l; i++)
				this._updateListeners[i]();

			this.renderer.render(this.scene, this.camera)
		},
		remove: function() {
			this.canvas.remove()
			$(window).off("resize.canvasResize")
			cancelAnimationFrame(this._afId)
		}
	})

	return RBXScene
})();













/*

typeof ANTI=="undefined" && (ANTI={}), ANTI.Create3dPreview = (function() {
	var idle_anim = {Length:1,Looped:true,Limbs:{torso:[[0,[0,0,0],[0,0,0]],[0.05,[0,0,-0.00183],[0,0,0]],[0.1,[0,0,-0.003928],[0,0,0]],[0.15,[0,0,-0.009811],[0,0,0]],[0.2,[0,0,-0.013305],[0,0,0]],[0.25,[0,0,-0.020647],[0,0,0]],[0.3,[0,0,-0.027442],[0,0,0]],[0.35,[0,0,-0.030259],[0,0,0]],[0.4,[0,0,-0.034014],[0,0,0]],[0.45,[0,0,-0.034685],[0,0,0]],[0.5,[0,0,-0.033422],[0,0,0]],[0.55,[0,0,-0.031734],[0,0,0]],[0.6,[0,0,-0.026807],[0,0,0]],[0.65,[0,0,-0.023791],[0,0,0]],[0.7,[0,0,-0.017213],[0,0,0]],[0.75,[0,0,-0.010655],[0,0,0]],[0.8,[0,0,-0.007662],[0,0,0]],[0.85,[0,0,-0.002809],[0,0,0]],[0.9,[0,0,-0.001172],[0,0,0]],[0.95,[0,0,0],[0,0,0]]],leftleg:[[0,[0,0,0],[0,0,0]],[0.05,[0,0.001696,0],[0,0,0]],[0.1,[0,0.003639,0],[0,0,0]],[0.15,[0,0.009088,0],[0,0,0]],[0.2,[0,0.012324,0],[0,0,0]],[0.25,[0,0.019125,0],[0,0,0]],[0.3,[0,0.02542,0],[0,0,0]],[0.35,[0,0.028029,0],[0,0,0]],[0.4,[0,0.031508,0],[0,0,0]],[0.45,[0,0.032129,0],[0,0,0]],[0.5,[0,0.030959,0],[0,0,0]],[0.55,[0,0.029396,0],[0,0,0]],[0.6,[0,0.024831,0],[0,0,0]],[0.65,[0,0.022037,0],[0,0,0]],[0.7,[0,0.015944,0],[0,0,0]],[0.75,[0,0.009869,0],[0,0,0]],[0.8,[0,0.007097,0],[0,0,0]],[0.85,[0,0.002602,0],[0,0,0]],[0.9,[0,0.001086,0],[0,0,0]],[0.95,[0,0,0],[0,0,0]]],rightleg:[[0,[0,0,0],[0,0,0]],[0.05,[0,0.001367,0],[0,0,0]],[0.1,[0,0.002934,0],[0,0,0]],[0.15,[0,0.007327,0],[0,0,0]],[0.2,[0,0.009936,0],[0,0,0]],[0.25,[0,0.015419,0],[0,0,0]],[0.3,[0,0.020494,0],[0,0,0]],[0.35,[0,0.022597,0],[0,0,0]],[0.4,[0,0.025401,0],[0,0,0]],[0.45,[0,0.025902,0],[0,0,0]],[0.5,[0,0.024959,0],[0,0,0]],[0.55,[0,0.023699,0],[0,0,0]],[0.6,[0,0.020019,0],[0,0,0]],[0.65,[0,0.017766,0],[0,0,0]],[0.7,[0,0.012855,0],[0,0,0]],[0.75,[0,0.007957,0],[0,0,0]],[0.8,[0,0.005722,0],[0,0,0]],[0.85,[0,0.002097,0],[0,0,0]],[0.9,[0,0.000875,0],[0,0,0]],[0.95,[0,0,0],[0,0,0]]],leftarm:[[0,[-0.000001,-0.003103,0],[-0.000199,-0.007649,-0.000908]],[0.05,[0,0.00769,0],[-0.001103,-0.000957,0.001274]],[0.1,[0,0.011064,0],[-0.002068,0.001321,0.002232]],[0.15,[0,0.015117,0],[-0.00431,0.004083,0.003699]],[0.2,[0,0.015898,0],[-0.005256,0.004599,0.004127]],[0.25,[0,0.014618,0],[-0.006027,0.003762,0.004102]],[0.3,[0,0.008695,0],[-0.005868,0.000014,0.002819]],[0.35,[0,0.00435,0],[-0.005694,-0.002743,0.00185]],[0.4,[0,-0.00587,0],[-0.005197,-0.009231,-0.000459]],[0.45,[0,-0.011255,0],[-0.004888,-0.012652,-0.001685]],[0.5,[0,-0.021244,0],[-0.004187,-0.019002,-0.003977]],[0.55,[0,-0.025369,0],[-0.003806,-0.021627,-0.004932]],[0.6,[0,-0.030602,0],[-0.003018,-0.024961,-0.006173]],[0.65,[0,-0.031388,0],[-0.002623,-0.025469,-0.006383]],[0.7,[0,-0.029852,0],[-0.001865,-0.024679,-0.006152]],[0.75,[0,-0.024959,0],[-0.001189,-0.022101,-0.005304]],[0.8,[0,-0.021607,0],[-0.0009,-0.020258,-0.004705]],[0.85,[0,-0.013892,0],[-0.000449,-0.015628,-0.003242]],[0.9,[0,-0.009855,0],[-0.000302,-0.012893,-0.002412]],[0.95,[0,-0.002432,0],[-0.000199,-0.007078,-0.000751]],[1,[-0.000001,-0.003103,0],[-0.000199,-0.007649,-0.000908]]],rightarm:[[0,[0,0.000026,-0.000001],[-0.001009,-0.00022,-0.000558]],[0.05,[0,0.004133,0],[-0.003891,-0.004205,-0.003895]],[0.1,[0,0.005899,0],[-0.005756,-0.006418,-0.00474]],[0.15,[0,0.008296,-0.000001],[-0.008947,-0.009749,-0.005496]],[0.2,[0,0.008623,0],[-0.009757,-0.010149,-0.005372]],[0.25,[0,0.007025,0],[-0.009412,-0.007973,-0.003713]],[0.3,[0,0.003463,0],[-0.00772,-0.003296,-0.000581]],[0.35,[0,0.001314,0],[-0.006601,-0.000503,0.001243]],[0.4,[0,-0.003068,0],[-0.004185,0.005157,0.004864]],[0.45,[0,-0.005038,0],[-0.003037,0.007683,0.006446]],[0.5,[0,-0.007805,0],[-0.001276,0.011191,0.008569]],[0.55,[0.000001,-0.008416,0],[-0.000765,0.011925,0.008964]],[0.6,[0,-0.008528,0],[-0.000188,0.011818,0.008777]],[0.65,[0,-0.008278,0],[0.000006,0.011286,0.008405]],[0.7,[0,-0.007277,0],[0.00021,0.009478,0.007212]],[0.75,[0,-0.005757,0],[0.000189,0.007007,0.005554]],[0.8,[0,-0.004852,0],[0.000099,0.005647,0.004593]],[0.85,[0,-0.002846,0],[-0.000235,0.002912,0.002481]],[0.9,[0,-0.001786,0],[-0.000477,0.001637,0.001365]],[0.95,[0,0.000207,0],[-0.001071,-0.000312,-0.000752]],[1,[0,0.000026,-0.000001],[-0.001009,-0.00022,-0.000558]]],head:[[0,[0,0,0],[-0.000162,0,0.000257]],[0.05,[0,0,0],[-0.002569,0,-0.000309]],[0.1,[0,0,0],[-0.003776,0,-0.000648]],[0.15,[0,0,-0.000001],[-0.005925,0,-0.001303]],[0.2,[0,0,0],[-0.006761,0,-0.001559]],[0.25,[0,0,0],[-0.00769,0,-0.001782]],[0.3,[0,0,0],[-0.007263,0,-0.001444]],[0.35,[0,0,0],[-0.006526,0,-0.001053]],[0.4,[0,0,0],[-0.004305,0,0.000034]],[0.45,[0,0,0],[-0.002952,0,0.000669]],[0.5,[0,0,0],[-0.000118,0,0.001961]],[0.55,[0,0,0],[0.001236,0,0.00256]],[0.6,[0,0,0],[0.003484,0,0.003511]],[0.65,[0,0,0],[0.004231,0,0.003798]],[0.7,[0,0,0],[0.004815,0,0.003845]],[0.75,[0,0,0],[0.004535,0,0.003217]],[0.8,[0,0,0],[0.004156,0,0.002739]],[0.85,[0,0,0],[0.002939,0,0.001629]],[0.9,[0,0,0],[0.00207,0,0.001074]],[0.95,[0,0,0],[-0.000475,0,0.000216]],[1,[0,0,0],[-0.000162,0,0.000257]]]}}


	return function(parent, initialAvatarData) {
		var instance = CreateInstance()
		var animator = null
		var character = null

		instance.controls

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

		parent.append(instance.canvas)
		parent.find("img").hide()
		parent.removeClass("btr-preview-loading")

		if(initialAvatarData)
			buildCharacter(initialAvatarData);

		return {
			remove: () => {
				instance.remove()
			},

			setCharacte: (data) => {
				buildCharacter(data)
			}
		}
	};
})();*/
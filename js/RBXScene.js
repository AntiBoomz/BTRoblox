// BTR-RBXScene.js
"use strict"

typeof ANTI=="undefined" && (ANTI={}), ANTI.RBXScene = (function() {
	var isReady = false
	var readyPromise = new Promise((resolve) => {
		var components = [
			"js/scene/Animator.js",
			"js/scene/Controls.js",
			"js/scene/Avatar.js"
		]

		BackgroundJS.send("execScript", components, () => {
			isReady = true
			resolve(RBXScene)
		})
	})

	function RBXScene(optionsGiven) {
		if(!isReady)
			throw new error("RBXScene is not ready yet");

		var options = {
			solidGround: true
		}

		if(optionsGiven)
			Object.assign(options, optionsGiven);

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

		if(options.solidGround) {
			var base = new THREE.Mesh(
				new THREE.PlaneGeometry(100, 100),
				new THREE.MeshBasicMaterial({ color: 0xffffff })
			)
			scene.add(base)

			base.rotation.x = -Math.PI/2
			base.position.y = -.1005
			base.receiveShadow = true
		}

		var shadowCaster = new THREE.Mesh(
			new THREE.PlaneGeometry(40, 40),
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

		controls.zoom = 10
		var minZoom = 5
		var maxZoom = 15
		controls.mousewheel((deltaX, deltaY) => {
			if(deltaY > 0) {
				controls.zoom = Math.min(maxZoom, controls.zoom + 1)
			} else if(deltaY < 0) {
				controls.zoom = Math.max(minZoom, controls.zoom - 1)
			}
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
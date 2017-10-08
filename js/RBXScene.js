"use strict"

const RBXScene = (() => {
	const components = [
		"js/scene/Controls.js",
		"js/scene/Avatar.js"
	]

	let isReady = false
	const componentsReady = new Promise(resolve => {
		execScripts(components, () => {
			RBXScene.Avatar.ready(() => {
				isReady = true
				resolve(RBXScene)
			})
		})
	})

	class Scene {
		constructor() {
			assert(isReady, "Not ready yet")

			this._prevRes = { width: -1, height: -1 }
			this._updateListeners = []

			const renderer = this.renderer = new THREE.WebGLRenderer({
				antialias: true,
				alpha: true
			})
			renderer.shadowMap.type = THREE.BasicShadowMap
			renderer.shadowMap.enabled = true

			const canvas = this.canvas = renderer.domElement
			const scene = this.scene = new THREE.Scene()
			const camera = this.camera = new THREE.PerspectiveCamera(60, canvas.clientWidth/canvas.clientHeight, 0.1, 1000)
			const controls = this.controls = new RBXScene.Controls(this)
			const avatar = this.avatar = new RBXScene.Avatar()

			this.update(() => avatar.animator && avatar.animator.update())
			scene.add(avatar.model)

			const ambientLight = new THREE.AmbientLight(0x909090)
			scene.add(ambientLight)

			const sunLight = new THREE.DirectionalLight(0x505050)
			sunLight.position.set(.2, .7, -.5).normalize().multiplyScalar(10)
			sunLight.castShadow = false
			scene.add(sunLight)

			const shadowLight = new THREE.DirectionalLight(0x404040)
			shadowLight.position.set(0, 1, 0).normalize().multiplyScalar(10)
			shadowLight.castShadow = true
			shadowLight.shadow.mapSize.width = 512
			shadowLight.shadow.mapSize.height = 512

			shadowLight.shadow.camera.near = 1
			shadowLight.shadow.camera.far = 10.2
			shadowLight.shadow.camera.left = -2.5
			shadowLight.shadow.camera.bottom = -2.5
			shadowLight.shadow.camera.right = 2.5
			shadowLight.shadow.camera.top = 2.5

			scene.add(shadowLight)


			const stand = new THREE.Mesh(
				new THREE.CylinderGeometry(2.5, 2.5, .1, 48),
				new THREE.MeshLambertMaterial({ color: 0xb7a760 })
			)
			stand.position.y = -.05
			stand.receiveShadow = true

			scene.add(stand)

			const ground = new THREE.Mesh(
				new THREE.PlaneGeometry(40, 40),
				new THREE.MeshLambertMaterial({ color: 0xffffff })
			)
			ground.rotation.x = -Math.PI / 2
			ground.position.y = -.1

			scene.add(ground)

			controls.mousedrag((moveX, moveY) => {
				if(avatar) {
					avatar.model.rotation.y += 2 * Math.PI * moveX / canvas.clientWidth
				}

				controls.rotation.x += 2 * Math.PI * moveY / canvas.clientHeight
				if(controls.rotation.x < -1.4) {
					controls.rotation.x = -1.4
				} else if(controls.rotation.x > 1.4) {
					controls.rotation.x = 1.4
				}
			})

			controls.zoom = 10
			const minZoom = 5
			const maxZoom = 15
			controls.mousewheel((deltaX, deltaY) => {
				if(deltaY > 0) {
					controls.zoom = Math.min(maxZoom, controls.zoom + 1)
				} else if(deltaY < 0) {
					controls.zoom = Math.max(minZoom, controls.zoom - 1)
				}
			})

			this.oncanvasresize = () => {
				const width = canvas.clientWidth
				const height = canvas.clientHeight

				renderer.setSize(width, height)

				camera.aspect = width / height
				camera.updateProjectionMatrix()
			}

			window.addEventListener("resize", this.oncanvasresize)
		}


		_update() {
			const parent = this.canvas.parentNode
			if(parent) {
				const width = parent.clientWidth
				const height = parent.clientHeight
				const res = this._prevRes

				if(width !== res.width || height !== res.height) {
					res.width = width
					res.height = height

					this.renderer.setSize(width, height)
					this.camera.aspect = height == 0 ? 0 : width / height
					this.camera.updateProjectionMatrix()
				}
			}

			for(let i = 0, l = this._updateListeners.length; i < l; i++) {
				this._updateListeners[i]()
			}

			this.renderer.render(this.scene, this.camera)
		}

		update(fn) {
			if(arguments.length > 0) {
				assert(typeof fn === "function", "Listener should be a function")
				this._updateListeners.push(fn)
				return;
			}

			console.log("Manual")
			this._update()
		}

		remove() {
			if(this.started) this.stop();
			this.canvas.remove()
			window.removeEventListener("resize", this.oncanvasresize)
		}

		start() {
			assert(!this.started, "Already started")
			this.started = true

			if(!this.avatar.hasInit) this.avatar.init();

			const innerUpdate = () => {
				this._update()
				cancelAnimationFrame(this._afId)
				this._afId = requestAnimationFrame(innerUpdate)
			}

			this._afId = requestAnimationFrame(innerUpdate)
		}

		stop() {
			assert(this.started, "Already stopped")
			this.started = false
			cancelAnimationFrame(this._afId)
			delete this._afId
		}
	}

	return {
		Scene,

		ready(cb) {
			componentsReady.then(cb)
		}
	}
})();
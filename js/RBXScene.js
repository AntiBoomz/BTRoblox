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

			this.cameraMinZoom = 5
			this.cameraMaxZoom = 15
			this.cameraZoom = 10
			this.cameraFocus = new THREE.Vector3(0, 4, 0)
			this.cameraRotation = new THREE.Euler(.05, 0, 0, "YXZ")
			this.prevDragEvent = null
			this.isDragging = false

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
			this.listeners = [
				{
					target: canvas,
					events: {
						mousedown(event) {
							if(event.button === 0) {
								this.prevDragEvent = event
								this.isDragging = true
							}

							event.preventDefault()
						},
						mousewheel(event) {
							const deltaY = event.deltaY

							if(deltaY > 0) {
								this.cameraZoom = Math.min(this.cameraMaxZoom, this.cameraZoom + 1)
							} else if(deltaY < 0) {
								this.cameraZoom = Math.max(this.cameraMinZoom, this.cameraZoom - 1)
							}

							event.preventDefault()
						},
						contextmenu(event) {
							event.preventDefault()
						}
					}
				},
				{
					target: window,
					events: {
						mousemove(event) {
							if(!this.isDragging) return;
							const moveX = event.clientX - this.prevDragEvent.clientX
							const moveY = event.clientY - this.prevDragEvent.clientY
							this.prevDragEvent = event

							const rotX = this.cameraRotation.x + 2 * Math.PI * moveY / this.canvas.clientHeight
							this.cameraRotation.x = Math.max(-1.4, Math.min(1.4, rotX))
							this.cameraRotation.y -= 2 * Math.PI * moveX / this.canvas.clientWidth
						},
						mouseup(event) {
							if(!this.isDragging) return;

							if(event.button === 0) {
								this.isDragging = false
							}
						},
						resize() {
							const width = this.canvas.clientWidth
							const height = this.canvas.clientHeight

							this.renderer.setSize(width, height)

							this.camera.aspect = width / height
							this.camera.updateProjectionMatrix()
						}
					}
				}
			]

			this.listeners.forEach(x => {
				Object.entries(x.events).forEach(([eventName, fn]) => {
					const bound = x.events[eventName] = fn.bind(this)
					x.target.addEventListener(eventName, bound)
				})
			})
		}

		update() {
			const parent = this.canvas.parentNode
			if(parent) {
				const width = parent.clientWidth
				const height = parent.clientHeight
				const res = this._prevRes

				if(width !== res.width || height !== res.height) {
					res.width = width
					res.height = height

					this.renderer.setSize(width, height)
					this.camera.aspect = height === 0 ? 0 : width / height
					this.camera.updateProjectionMatrix()
				}
			}

			if(this.avatar && this.avatar.animator) {
				this.avatar.animator.update()
			}

			{
				const cameraDir = new THREE.Vector3(0, 0, 1).applyEuler(this.cameraRotation)
				this.camera.position.copy(this.cameraFocus).addScaledVector(cameraDir, -this.cameraZoom)

				const groundDiff = .05 - this.camera.position.y
				if(cameraDir.y > 0 && groundDiff > 0) {
					this.camera.position.addScaledVector(cameraDir, groundDiff / cameraDir.y)
				}

				this.camera.lookAt(this.cameraFocus)
			}

			this.renderer.render(this.scene, this.camera)
		}

		remove() {
			if(this.started) this.stop();
			this.canvas.remove()

			this.listeners.forEach(x => {
				Object.entries(x.events).forEach(([eventName, fn]) => {
					x.target.addEventListener(eventName, fn)
				})
			})
		}

		start() {
			assert(!this.started, "Already started")
			this.started = true

			if(!this.avatar.hasInit) this.avatar.init();

			const innerUpdate = () => {
				this.update()
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
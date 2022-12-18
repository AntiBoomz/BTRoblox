"use strict"

const RBXScene = (() => {
	class Scene extends EventEmitter {
		constructor() {
			super()
			this._prevRes = { width: -1, height: -1 }
			this.cameraControlsEnabled = true

			this.cameraMinZoom = 2
			this.cameraMaxZoom = 25
			this.cameraZoom = 10
			this.cameraMinSlide = 0
			this.cameraMaxSlide = 0
			this.cameraSlide = 0
			this.cameraFocus = new THREE.Vector3(0, 4.5, 0)
			this.cameraOffset = new THREE.Vector3(0, 0, 0)
			this.cameraRotation = new THREE.Euler(.05, 0, 0, "YXZ")
			this.cameraDir = new THREE.Vector3(0, 0, 1)
			this.prevDragEvent = null
			this.isDragging = false

			const renderer = this.renderer = new THREE.WebGLRenderer({
				antialias: true,
				alpha: true
			})

			renderer.setClearAlpha(0)
			renderer.shadowMap.enabled = true
			renderer.shadowMap.type = THREE.PCFSoftShadowMap

			const canvas = this.canvas = renderer.domElement
			canvas.style = `
			user-select: none !important;
			-moz-user-select: none !important;
		
			position: absolute !important;
			left: 0 !important;
			right: 0 !important;
			top: 0 !important;
			bottom: 0 !important;
			width: 100% !important;
			height: 100% !important;`

			const scene = this.scene = new THREE.Scene()
			const camera = this.camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100)
			
			const ambientLight = new THREE.AmbientLight(0x7F7F7F)
			scene.add(ambientLight)

			const sunLight = new THREE.DirectionalLight(0xACACAC)
			sunLight.position.set(-0.474891931, 0.822536945, 0.312906593).multiplyScalar(15)
			sunLight.castShadow = true
			sunLight.shadow.mapSize.width = 256
			sunLight.shadow.mapSize.height = 256
			sunLight.shadow.camera.left = -8
			sunLight.shadow.camera.right = 8
			sunLight.shadow.camera.bottom = -8
			sunLight.shadow.camera.top = 8
			sunLight.shadow.camera.near = 1
			sunLight.shadow.camera.far = 22
			scene.add(sunLight)

			const light2 = new THREE.DirectionalLight(0x444444)
			light2.position.copy(sunLight.position).negate()
			light2.castShadow = false
			scene.add(light2)

			this.listeners = [
				{
					target: canvas,
					events: {
						mousedown(event) {
							if(!this.cameraControlsEnabled) { return }

							if(!this.isDragging && (event.button >= 0 && event.button <= 2)) {
								this.prevDragEvent = event
								this.isDragging = true
								this.dragButton = event.button
							}

							if(document.activeElement) {
								document.activeElement.blur()
							}

							event.preventDefault()
						},
						contextmenu(event) {
							if(!this.cameraControlsEnabled) { return }
							event.preventDefault()
						},
						wheel(event) {
							if(!this.cameraControlsEnabled) { return }
							
							const deltaY = event.deltaY

							if(deltaY > 0) {
								this.cameraZoom = Math.min(this.cameraMaxZoom, this.cameraZoom + 1)
							} else if(deltaY < 0) {
								this.cameraZoom = Math.max(this.cameraMinZoom, this.cameraZoom - 1)
							}

							event.preventDefault()
						}
					}
				},
				{
					target: window,
					events: {
						mousemove(event) {
							if(!this.cameraControlsEnabled) { return }
							
							if(!this.isDragging) { return }
							const moveX = event.clientX - this.prevDragEvent.clientX
							const moveY = event.clientY - this.prevDragEvent.clientY
							this.prevDragEvent = event
							
							if(this.dragButton === 1) {
								this.cameraSlide += this.cameraZoom * moveY / this.canvas.clientHeight
								this.cameraSlide = Math.max(this.cameraMinSlide, Math.min(this.cameraMaxSlide, this.cameraSlide))
								
							} else {
								const rotX = this.cameraRotation.x + 2 * Math.PI * moveY / this.canvas.clientHeight
								this.cameraRotation.x = Math.max(-1.4, Math.min(1.4, rotX))
								this.cameraRotation.y -= 2 * Math.PI * moveX / this.canvas.clientWidth
							}
						},
						mouseup(event) {
							if(this.isDragging && event.button === this.dragButton) {
								this.isDragging = false
							}
						},
						contextmenu(event) {
							if(!this.cameraControlsEnabled) { return }
							
							if(event.button === 2 && event.button === this.dragButton) {
								this.dragButton = null
								event.preventDefault()
							}
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

					this.renderer.setSize(width, height, false)
					this.camera.aspect = height === 0 ? 0 : width / height
					this.camera.updateProjectionMatrix()
				}
			}
				
			this.cameraDir.set(0, 0, 1).applyEuler(this.cameraRotation)
			this.camera.position.copy(this.cameraFocus).addScaledVector(this.cameraDir, -this.cameraZoom)
			this.camera.lookAt(this.cameraFocus)
			this.camera.position.add(this.cameraOffset)
			
			this.cameraSlide = Math.max(this.cameraMinSlide, Math.min(this.cameraMaxSlide, this.cameraSlide))
			this.camera.position.y += this.cameraSlide

			const groundDiff = 0.2 - this.camera.position.y
			if(this.cameraDir.y > 0 && groundDiff > 0) {
				this.camera.position.addScaledVector(this.cameraDir, groundDiff / this.cameraDir.y)
			}
		}

		render() {
			this.renderer.render(this.scene, this.camera)
		}

		remove() {
			if(this.started) { this.stop() }
			this.canvas.remove()

			this.listeners.forEach(x => {
				Object.entries(x.events).forEach(([eventName, fn]) => {
					x.target.addEventListener(eventName, fn)
				})
			})
		}

		start() {
			if(this.started) { return }
			this.started = true

			const innerUpdate = () => {
				this.update()
				this.render()
				this._afId = requestAnimationFrame(innerUpdate)
			}

			this._afId = requestAnimationFrame(innerUpdate)
		}

		stop() {
			if(!this.started) { return }
			this.started = false

			cancelAnimationFrame(this._afId)
			delete this._afId
		}
	}

	class AvatarScene extends Scene {
		constructor() {
			super()
			
			const avatar = this.avatar = new RBXAvatar.Avatar()
			this.scene.add(avatar.root)
			
			this.avatarOffset = {
				position: new THREE.Vector3(),
				rotation: new THREE.Euler()
			}
			
			const stand = new THREE.Mesh(
				new THREE.CylinderGeometry(2.5, 2.5, .1, 48),
				new THREE.MeshLambertMaterial({ color: 0xB7A760 })
			)
			stand.frustumCulled = false
			stand.position.y = .05
			stand.receiveShadow = true
			this.scene.add(stand)
			
			const groundMat = new THREE.ShadowMaterial()
			groundMat.opacity = 0.5

			const ground = new THREE.Mesh(
				new THREE.PlaneGeometry(200, 200),
				groundMat
			)
			ground.frustumCulled = false
			ground.rotation.x = -Math.PI / 2
			ground.position.y = .001
			ground.receiveShadow = true
			this.scene.add(ground)
			
			this.renderer.clippingPlanes.push(new THREE.Plane(new THREE.Vector3(0, 1, 0)))
		}

		update() {
			super.update()
			
			this.avatar.offset.set(0, 0.1, 0).add(this.avatarOffset.position)
			this.avatar.offsetRot.copy(this.avatarOffset.rotation)
			
			this.avatar.update()
			this.trigger("update")
		}

		start() {
			super.start()

			if(!this.hasInit) {
				this.hasInit = true
				this.avatar.init()
			}
		}
	}

	return {
		Scene,
		AvatarScene
	}
})()
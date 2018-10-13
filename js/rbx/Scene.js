"use strict"

const RBXScene = (() => {
	const PCSS = `
	#define NUM_SAMPLES 17
	#define NUM_RINGS 11

	vec2 poissonDisk[NUM_SAMPLES];
	void initPoissonSamples( const in vec2 randomSeed ) {
		float ANGLE_STEP = PI2 * float( NUM_RINGS ) / float( NUM_SAMPLES );
		float INV_NUM_SAMPLES = 1.0 / float( NUM_SAMPLES );
		// jsfiddle that shows sample pattern: https://jsfiddle.net/a16ff1p7/
		float angle = rand( randomSeed ) * PI2;
		float radius = INV_NUM_SAMPLES;
		float radiusStep = radius;
		for( int i = 0; i < NUM_SAMPLES; i ++ ) {
			poissonDisk[i] = vec2( cos( angle ), sin( angle ) ) * pow( radius, 0.75 );
			radius += radiusStep;
			angle += ANGLE_STEP;
		}
	}

	float PCSS ( sampler2D shadowMap, vec4 coords ) {
		vec2 uv = coords.xy;
		float zReceiver = coords.z; // Assumed to be eye-space z in this code
		initPoissonSamples( uv );

		float filterRadius = .075 / zReceiver;
		int sum = 0;
		vec2 from;
		vec2 to = poissonDisk[0];
		vec2 diff;
		for(int i = 1; i < NUM_SAMPLES; i++) {
			from = to;
			to = poissonDisk[i];
			for(int j = 0; j < 5; j++) {
				vec2 step = (from + (to-from) * (float(j) / 5.0)) * filterRadius;
				float depth = unpackRGBAToDepth( texture2D( shadowMap, uv + step ) );
				if(zReceiver > depth) sum++;
	
				float depth2 = unpackRGBAToDepth( texture2D( shadowMap, uv + -step.yx ) );
				if(zReceiver > depth2) sum++;
			}
		}

		if(sum == 0) return 1.0;
		return 1.0 - float(sum) / (2.0 * float(NUM_SAMPLES * 5));
	}
	`

	const PCSS_GET = `
			return PCSS( shadowMap, shadowCoord );
			`

	class Scene {
		constructor() {
			this._prevRes = { width: -1, height: -1 }

			this.cameraControlsEnabled = true

			this.cameraMinZoom = 3
			this.cameraMaxZoom = 25
			this.cameraZoom = 10
			this.cameraFocus = new THREE.Vector3(0, 4, 0)
			this.cameraRotation = new THREE.Euler(.05, 0, 0, "YXZ")
			this.prevDragEvent = null
			this.isDragging = false

			this._onUpdate = []

			const renderer = this.renderer = new THREE.WebGLRenderer({
				antialias: true
			})
			renderer.setClearColor(0xFFFFFF)
			renderer.shadowMap.enabled = true

			const canvas = this.canvas = renderer.domElement
			const scene = this.scene = new THREE.Scene()
			this.camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000)

			const ambientLight = new THREE.AmbientLight(0x7F7F7F)
			scene.add(ambientLight)

			const sunLight = new THREE.DirectionalLight(0xACACAC)
			sunLight.position.set(-0.474891931, 0.822536945, 0.312906593).multiplyScalar(15)
			sunLight.castShadow = true
			sunLight.shadow.mapSize.width = 128
			sunLight.shadow.mapSize.height = 128
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

							if(!this.isDragging && (event.button === 0 || event.button === 2)) {
								this.prevDragEvent = event
								this.isDragging = true
								this.dragButton = event.button
							}

							event.preventDefault()
						},
						mousewheel(event) {
							if(!this.cameraControlsEnabled) { return }
							
							const deltaY = event.deltaY

							if(deltaY > 0) {
								this.cameraZoom = Math.min(this.cameraMaxZoom, this.cameraZoom + 1)
							} else if(deltaY < 0) {
								this.cameraZoom = Math.max(this.cameraMinZoom, this.cameraZoom - 1)
							}

							event.preventDefault()
						},
						contextmenu(event) {
							if(!this.cameraControlsEnabled) { return }
							
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

							const rotX = this.cameraRotation.x + 2 * Math.PI * moveY / this.canvas.clientHeight
							this.cameraRotation.x = Math.max(-1.4, Math.min(1.4, rotX))
							this.cameraRotation.y -= 2 * Math.PI * moveX / this.canvas.clientWidth
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
			const cameraDir = new THREE.Vector3(0, 0, 1).applyEuler(this.cameraRotation)
			this.camera.position.copy(this.cameraFocus).addScaledVector(cameraDir, -this.cameraZoom)

			const groundDiff = .05 - this.camera.position.y
			if(cameraDir.y > 0 && groundDiff > 0) {
				this.camera.position.addScaledVector(cameraDir, groundDiff / cameraDir.y)
			}

			this.camera.lookAt(this.cameraFocus)
		}

		render() {
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
			if(this.started) { throw new Error("Scene is already started") }
			this.started = true

			const resolved = Promise.resolve()
			const innerUpdate = () => {
				this.update()
				resolved.then(() => this.render())

				this._afId = requestAnimationFrame(innerUpdate)
			}

			this._afId = requestAnimationFrame(innerUpdate)
		}

		stop() {
			if(!this.started) { throw new Error("Scene is already stopped") }
			this.started = false

			cancelAnimationFrame(this._afId)
			delete this._afId
		}
	}

	class AvatarScene extends Scene {
		constructor() {
			super()
			const avatar = this.avatar = new RBXAvatar.Avatar()
			this.scene.add(avatar.model)

			const stand = new THREE.Mesh(
				new THREE.CylinderGeometry(2.5, 2.5, .1, 48),
				new THREE.MeshLambertMaterial({ color: 0xb7a760 })
			)
			stand.position.y = -.05
			stand.receiveShadow = true

			this.scene.add(stand)

			const ground = new THREE.Mesh(
				new THREE.PlaneGeometry(40, 40),
				new THREE.MeshLambertMaterial({ color: 0xffffff })
			)
			ground.rotation.x = -Math.PI / 2
			ground.position.y = -.1
			ground.receiveShadow = true
			this.scene.add(ground)

			const shader = THREE.ShaderChunk.shadowmap_pars_fragment
			THREE.ShaderChunk.shadowmap_pars_fragment = shader
				.replace("#ifdef USE_SHADOWMAP", `#ifdef USE_SHADOWMAP ${PCSS}`)
				.replace("#if defined( SHADOWMAP_TYPE_PCF )", `#if defined( SHADOWMAP_TYPE_PCF ) ${PCSS_GET}`)
		}

		update() {
			super.update()
			this.avatar.update()
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
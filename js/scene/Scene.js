"use strict"

const RBXScene = (() => {
	let isReady = false
	const componentsReady = new Promise(resolve => {
		execScripts(["js/scene/Avatar.js"], () => {
			RBXScene.Avatar.ready(() => {
				isReady = true
				resolve(RBXScene)
			})
		})
	})

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
			assert(isReady, "Not ready yet")

			this._prevRes = { width: -1, height: -1 }

			this.cameraMinZoom = 5
			this.cameraMaxZoom = 25
			this.cameraZoom = 10
			this.cameraFocus = new THREE.Vector3(0, 4, 0)
			this.cameraRotation = new THREE.Euler(.05, 0, 0, "YXZ")
			this.prevDragEvent = null
			this.isDragging = false

			const renderer = this.renderer = new THREE.WebGLRenderer({
				antialias: true
			})
			renderer.setClearColor(0xFFFFFF)
			renderer.shadowMap.enabled = true

			const canvas = this.canvas = renderer.domElement
			const scene = this.scene = new THREE.Scene()
			const camera = this.camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000)

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
							if(!this.isDragging && (event.button === 0 || event.button === 2)) {
								this.prevDragEvent = event
								this.isDragging = true
								this.dragButton = event.button
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
							if(event.button === this.dragButton) {
								this.isDragging = false
							}
						},
						contextmenu(event) {
							if(event.button === 2 && event.button === this.dragButton) {
								this.dragButton = null
								event.preventDefault()
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

			const cameraDir = new THREE.Vector3(0, 0, 1).applyEuler(this.cameraRotation)
			this.camera.position.copy(this.cameraFocus).addScaledVector(cameraDir, -this.cameraZoom)

			const groundDiff = .05 - this.camera.position.y
			if(cameraDir.y > 0 && groundDiff > 0) {
				this.camera.position.addScaledVector(cameraDir, groundDiff / cameraDir.y)
			}

			this.camera.lookAt(this.cameraFocus)
		}

		render() {
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

			const innerUpdate = () => {
				this.update()
				this.render()
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

	class AvatarScene extends Scene {
		constructor() {
			super()
			const avatar = this.avatar = new RBXScene.Avatar()
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

			if(this.avatar && this.avatar.animator) {
				this.avatar.animator.update()
			}
		}

		start() {
			super.start()

			if(!this.avatar.hasInit) {
				this.avatar.init()
			}
		}
	}

	const BrickColorMap = {
		1: 0xf2f3f3, 2: 0xa1a5a2, 3: 0xf9e999, 5: 0xd7c59a, 6: 0xc2dab8, 9: 0xe8bac8, 11: 0x80bbdb, 12: 0xcb8442, 18: 0xcc8e69, 21: 0xc4281c, 22: 0xc470a0, 23: 0x0d69ac, 24: 0xf5cd30, 25: 0x624732, 26: 0x1b2a35, 27: 0x6d6e6c, 28: 0x287f47, 29: 0xa1c48c, 36: 0xf3cf9b, 37: 0x4b974b, 38: 0xa05f35, 39: 0xc1cade, 40: 0xececec, 41: 0xcd544b, 42: 0xc1dff0, 43: 0x7bb6e8, 44: 0xf7f18d, 45: 0xb4d2e4, 47: 0xd9856c, 48: 0x84b68d, 49: 0xf8f184, 50: 0xece8de, 100: 0xeec4b6, 101: 0xda867a, 102: 0x6e99ca, 103: 0xc7c1b7, 104: 0x6b327c, 105: 0xe29b40, 106: 0xda8541, 107: 0x008f9c, 108: 0x685c43, 110: 0x435493, 111: 0xbfb7b1, 112: 0x6874ac, 
		113: 0xe4adc8, 115: 0xc7d23c, 116: 0x55a5af, 118: 0xb7d7d5, 119: 0xa4bd47, 120: 0xd9e4a7, 121: 0xe7ac58, 123: 0xd36f4c, 124: 0x923978, 125: 0xeab892, 126: 0xa5a5cb, 127: 0xdcbc81, 128: 0xae7a59, 131: 0x9ca3a8, 133: 0xd5733d, 134: 0xd8dd56, 135: 0x74869d, 136: 0x877c90, 137: 0xe09864, 138: 0x958a73, 140: 0x203a56, 141: 0x27462d, 143: 0xcfe2f7, 145: 0x7988a1, 146: 0x958ea3, 147: 0x938767, 148: 0x575857, 149: 0x161d32, 150: 0xabadac, 151: 0x789082, 153: 0x957977, 154: 0x7b2e2f, 157: 0xfff67b, 158: 0xe1a4c2, 168: 0x756c62, 176: 0x97695b, 178: 0xb48455, 179: 0x898788, 180: 0xd7a94b, 190: 0xf9d62e, 191: 0xe8ab2d, 
		192: 0x694028, 193: 0xcf6024, 194: 0xa3a2a5, 195: 0x4667a4, 196: 0x23478b, 198: 0x8e4285, 199: 0x635f62, 200: 0x828a5d, 208: 0xe5e4df, 209: 0xb08e44, 210: 0x709578, 211: 0x79b5b5, 212: 0x9fc3e9, 213: 0x6c81b7, 216: 0x8f4c2a, 217: 0x7c5c46, 218: 0x96709f, 219: 0x6b629b, 220: 0xa7a9ce, 221: 0xcd6298, 222: 0xe4adc8, 223: 0xdc9095, 224: 0xf0d5a0, 225: 0xebb87f, 226: 0xfdea8d, 232: 0x7dbbdd, 268: 0x342b75, 301: 0x506d54, 302: 0x5b5d69, 303: 0x0010b0, 304: 0x2c651d, 305: 0x527cae, 306: 0x335882, 307: 0x102adc, 308: 0x3d1585, 309: 0x348e40, 310: 0x5b9a4c, 311: 0x9fa1ac, 312: 0x592259, 313: 0x1f801d, 314: 0x9fadc0, 
		315: 0x0989cf, 316: 0x7b007b, 317: 0x7c9c6b, 318: 0x8aab85, 319: 0xb9c4b1, 320: 0xcacbd1, 321: 0xa75e9b, 322: 0x7b2f7b, 323: 0x94be81, 324: 0xa8bd99, 325: 0xdfdfde, 327: 0x970000, 328: 0xb1e5a6, 329: 0x98c2db, 330: 0xff98dc, 331: 0xff5959, 332: 0x750000, 333: 0xefb838, 334: 0xf8d96d, 335: 0xe7e7ec, 336: 0xc7d4e4, 337: 0xff9494, 338: 0xbe6862, 339: 0x562424, 340: 0xf1e7c7, 341: 0xfef3bb, 342: 0xe0b2d0, 343: 0xd490bd, 344: 0x965555, 345: 0x744747, 346: 0xd3be96, 347: 0xe2dcbc, 348: 0xedeaea, 349: 0xe9dada, 350: 0x883e3e, 351: 0xbc9b5d, 352: 0xc7ac78, 353: 0xcabfa3, 354: 0xbbb3b2, 355: 0x6c584b, 356: 0xa0844f, 
		357: 0x958988, 358: 0xaba89e, 359: 0xaf9483, 360: 0x966766, 361: 0x564236, 362: 0x7e683f, 363: 0x69665c, 364: 0x5a4c42, 365: 0x6a3909, 1001: 0xf8f8f8, 1002: 0xcdcdcd, 1003: 0x111111, 1004: 0xff0000, 1005: 0xffaf00, 1006: 0xb480ff, 1007: 0xa34b4b, 1008: 0xc1be42, 1009: 0xffff00, 1010: 0x0000ff, 1011: 0x002060, 1012: 0x2154b9, 1013: 0x04afec, 1014: 0xaa5500, 1015: 0xaa00aa, 1016: 0xff66cc, 1017: 0xffaf00, 1018: 0x12eed4, 1019: 0x00ffff, 1020: 0x00ff00, 1021: 0x3a7d15, 1022: 0x7f8e64, 1023: 0x8c5b9f, 1024: 0xafddff, 1025: 0xffc9c9, 1026: 0xb1a7ff, 1027: 0x9ff3e9, 1028: 0xccffcc, 1029: 0xffffcc, 1030: 0xffcc99, 
		1031: 0x6225d1, 1032: 0xff00bf
	}

	class ModelScene extends Scene {
		static GetPartColor(inst) {
			if(inst.Color3uint8) {
				const [r, g, b] = inst.Color3uint8
				return (r << 16) & (g << 8) & b
			} else if(inst.BrickColor) {
				return BrickColorMap[inst.BrickColor]
			}

			return BrickColorMap[194]
		}

		static CFrame(x, y, z, r00, r01, r02, r10, r11, r12, r20, r21, r22) {
			return new THREE.Matrix4().set(
				r00, r01, r02, x,
				r10, r11, r12, y,
				r20, r21, r22, z,
				0, 0, 0, 1
			)
		}

		static SetObjectCFrame(obj, cframe) {
			const matrix = ModelScene.CFrame(...cframe)
			obj.position.setFromMatrixPosition(matrix)
			obj.rotation.setFromRotationMatrix(matrix)
		}

		static ApplyMeshToObject(obj, mesh) {
			const geom = obj.geometry
	
			geom.addAttribute("position", new THREE.BufferAttribute(mesh.vertices, 3))
			geom.addAttribute("normal", new THREE.BufferAttribute(mesh.normals, 3))
			geom.addAttribute("uv", new THREE.BufferAttribute(mesh.uvs, 2))
			geom.setIndex(new THREE.BufferAttribute(mesh.faces, 1))
	
			geom.computeBoundingSphere()
		}

		constructor() {
			super()

			this.model = null
		}

		loadModel(model) {
			this.model = model
			console.log(model)

			const makeMesh = inst => {
				switch(inst.ClassName) {
				case "Seat":
				case "VehicleSeat":
				case "Part": {
					if(inst.Transparency >= 1) return;
					const obj = new THREE.Mesh(
						new THREE.BoxGeometry(...(inst.Size || inst.size)),
						new THREE.MeshLambertMaterial({ color: ModelScene.GetPartColor(inst) })
					)
					ModelScene.SetObjectCFrame(obj, inst.CFrame)

					if(inst.Transparency !== 0) {
						obj.material.transparent = true
						obj.material.opacity = 1 - inst.Transparency
					}
					
					this.scene.add(obj)
					break
				}
				case "UnionOperation": {
					if(inst.Transparency >= 1) return;
					if(!inst.AssetId) return;

					const obj = new THREE.Mesh(
						undefined,
						new THREE.MeshLambertMaterial({ color: ModelScene.GetPartColor(inst) })
					)

					ModelScene.SetObjectCFrame(obj, inst.CFrame)

					if(inst.Transparency !== 0) {
						obj.material.transparent = true
						obj.material.opacity = 1 - inst.Transparency
					}

					this.scene.add(obj)

					const assetId = RBXParser.parseContentUrl(inst.AssetId)
					AssetCache.loadModel(assetId, asset => {
						const meshData = asset[0].MeshData
						console.log(URL.createObjectURL(new Blob([meshData], {type: "application/octet-stream"})))
						/*
						const mesh = new RBXParser.MeshParser().parse("version 2.00\n" + meshData)
						Model.Scene.ApplyMeshToObject(obj, mesh) */
					})
					break
				}
				default: // Nothing :>
				}
			}

			const loadInst = inst => {
				makeMesh(inst)
				inst.Children.forEach(loadInst)
			}

			model.forEach(loadInst)
		}
	}

	return {
		Scene,
		AvatarScene,
		ModelScene,

		ready(cb) {
			componentsReady.then(cb)
		}
	}
})();
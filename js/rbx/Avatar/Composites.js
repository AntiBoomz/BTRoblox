"use strict"

const RBXComposites = (() => {
	const renderers = {}

	class CompositeTexture {
		constructor(hasThree, width, height) {
			this.canvas = document.createElement("canvas")
			this.context = this.canvas.getContext("2d")

			if(hasThree) {
				this.scene = new THREE.Scene()
				this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100)

				const ambient = new THREE.AmbientLight(0xFFFFFF)
				this.scene.add(ambient)
			}

			this.canvas.updateListeners = []
			this.loaders = []

			this.width = width
			this.height = height

			this.canvas.width = this.width
			this.canvas.height = this.height

			if(hasThree) {
				const key = `${this.width}x${this.height}`

				if(!renderers[key]) {
					renderers[key] = new THREE.WebGLRenderer({ alpha: true })
					renderers[key].setSize(this.width, this.height)
				}

				this.compositeRenderer = renderers[key]
				this.camera.updateProjectionMatrix()
			}

			this.needsUpdate = true
		}

		setBodyColors() { }

		beforeComposite() { }
		afterComposite() { }

		update() {
			this.needsUpdate = false
			const ctx = this.context

			if(this.background) {
				ctx.fillStyle = this.background
				ctx.fillRect(0, 0, this.width, this.height)
			}

			this.beforeComposite()

			if(this.scene) {
				this.compositeRenderer.render(this.scene, this.camera)
				ctx.drawImage(this.compositeRenderer.domElement, 0, 0, this.width, this.height, 0, 0, this.width, this.height)
			}

			this.afterComposite()
			this.canvas.updateListeners.forEach(fn => fn())
		}
	}

	class HeadComposite extends CompositeTexture {
		constructor() {
			super(false, 256, 256)
			this.background = "#A3A2A5"
		}

		setBodyColors(bodyColors) {
			this.background = bodyColors.head
			this.update()
		}
	}

	class R6Composite extends CompositeTexture {
		constructor(textures) {
			super(true, 1024, 512)
			this.background = "#7F7F7F"
			this.textures = textures

			const size = 2

			this.camera = new THREE.OrthographicCamera(-size / 2, size / 2, size / 4, -size / 4, 0.1, 100)
			this.scene.scale.set(size / 1024, size / 1024, size / 1024)
			this.camera.position.set(size / 2, size / 4, 10)
			this.camera.rotation.set(0, 0, 0)
	
			const pantsmesh = this.pantsmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
				transparent: true,
				map: this.textures.pants
			}))
			pantsmesh.visible = false
			pantsmesh.renderOrder = 1
			this.scene.add(pantsmesh)
	
			const shirtmesh = this.shirtmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
				transparent: true,
				map: this.textures.shirt
			}))
			shirtmesh.visible = false
			shirtmesh.renderOrder = 2
			this.scene.add(shirtmesh)
	
			const tshirtmesh = this.tshirtmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
				transparent: true,
				map: this.textures.tshirt
			}))
			tshirtmesh.visible = false
			tshirtmesh.renderOrder = 3
			this.scene.add(tshirtmesh)
	
			this.textures.tshirt.image.updateListeners.push(() => this.needsUpdate = true)
			this.textures.shirt.image.updateListeners.push(() => this.needsUpdate = true)
			this.textures.pants.image.updateListeners.push(() => this.needsUpdate = true)
	
			let meshUrl = getURL("res/previewer/compositing/CompositShirtTemplate.mesh")
			this.loaders.push(AssetCache.loadMesh(true, meshUrl, mesh => RBXAvatar.applyMesh(shirtmesh, mesh)))
	
			meshUrl = getURL("res/previewer/compositing/CompositPantsTemplate.mesh")
			this.loaders.push(AssetCache.loadMesh(true, meshUrl, mesh => RBXAvatar.applyMesh(pantsmesh, mesh)))
	
			meshUrl = getURL("res/previewer/compositing/CompositTShirt.mesh")
			this.loaders.push(AssetCache.loadMesh(true, meshUrl, mesh => RBXAvatar.applyMesh(tshirtmesh, mesh)))
	
			this.shouldUpdateBodyColors = true
			this.bodyColors = {
				head: "#A3A2A5",
				torso: "#A3A2A5",
				rightarm: "#A3A2A5",
				leftarm: "#A3A2A5",
				rightleg: "#A3A2A5"
			}
		}

		setBodyColors(bodyColors) {
			this.bodyColors = bodyColors
			this.update()
		}

		beforeComposite() {
			const ctx = this.context

			ctx.fillStyle = this.bodyColors.torso
			ctx.fillRect(0, 0, 192, 448)
			ctx.fillRect(194, 322, 272, 76)
			ctx.fillRect(272, 401, 148, 104)

			ctx.fillStyle = this.bodyColors.rightarm
			ctx.fillRect(200, 0, 192, 320)
			ctx.fillRect(420, 400, 148, 104)
			ctx.fillRect(758, 322, 76, 76)
			ctx.fillRect(898, 322, 76, 76)

			ctx.fillStyle = this.bodyColors.leftarm
			ctx.fillRect(400, 0, 192, 320)
			ctx.fillRect(568, 400, 148, 104)
			ctx.fillRect(828, 322, 76, 76)
			ctx.fillRect(194, 394, 76, 76)

			ctx.fillStyle = this.bodyColors.rightleg
			ctx.fillRect(600, 0, 192, 320)
			ctx.fillRect(716, 400, 148, 104)
			ctx.fillRect(466, 322, 76, 76)
			ctx.fillRect(610, 322, 76, 76)

			ctx.fillStyle = this.bodyColors.leftleg
			ctx.fillRect(800, 0, 192, 320)
			ctx.fillRect(864, 400, 148, 104)
			ctx.fillRect(542, 322, 76, 76)
			ctx.fillRect(684, 322, 76, 76)
		}
	}


	class R15TorsoComposite extends CompositeTexture {
		constructor(textures) {
			super(true, 388, 272)
			this.background = "#A3A2A5"

			this.textures = textures
			
			this.camera = new THREE.OrthographicCamera(-this.width / 2, this.width / 2, this.height / 2, -this.height / 2, 0.1, 100)
			this.camera.position.set(this.width / 2, this.height / 2, 10)
			this.camera.rotation.set(0, 0, 0)
	
			const pantsmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
				transparent: true,
				map: this.textures.pants
			}))
			pantsmesh.visible = false
			pantsmesh.renderOrder = 0
			this.scene.add(pantsmesh)
	
			const shirtmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
				transparent: true,
				map: this.textures.shirt
			}))
			shirtmesh.visible = false
			shirtmesh.renderOrder = 1
			this.scene.add(shirtmesh)
	
			this.textures.tshirt.image.updateListeners.push(() => this.needsUpdate = true)
			this.textures.shirt.image.updateListeners.push(() => this.needsUpdate = true)
			this.textures.pants.image.updateListeners.push(() => this.needsUpdate = true)
	
			const meshUrl = getURL("res/previewer/compositing/R15CompositTorsoBase.mesh")
			this.loaders.push(AssetCache.loadMesh(true, meshUrl, mesh => {
				RBXAvatar.applyMesh(shirtmesh, mesh)
				RBXAvatar.applyMesh(pantsmesh, mesh)
			}))
		}

		setBodyColors(bodyColors) {
			this.background = bodyColors.torso
			this.update()
		}

		afterComposite() {
			this.context.drawImage(this.textures.tshirt.image, 2, 74, 128, 128)
		}
	}


	class R15LimbComposite extends CompositeTexture {
		constructor(texture, meshUrl) {
			super(true, 264, 284)
			this.background = "#A3A2A5"
			
			this.camera = new THREE.OrthographicCamera(-this.width / 2, this.width / 2, this.height / 2, -this.height / 2, 0.1, 100)
			this.camera.position.set(this.width / 2, this.height / 2, 10)
			this.camera.rotation.set(0, 0, 0)

			const obj = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
				transparent: true,
				map: texture
			}))
			obj.visible = false
			this.scene.add(obj)

			texture.image.updateListeners.push(() => this.needsUpdate = true)

			this.loaders.push(
				AssetCache.loadMesh(true, meshUrl, mesh => RBXAvatar.applyMesh(obj, mesh))
			)
		}

		setBodyColors(bodyColors, name) {
			this.background = bodyColors[name]
			this.update()
		}
	}

	class R15LeftArmComposite extends R15LimbComposite {
		constructor(textures) { super(textures.shirt, getURL("res/previewer/compositing/R15CompositLeftArmBase.mesh")) }
		setBodyColors(bodyColors) { super.setBodyColors(bodyColors, "leftarm") }
	}
	class R15RightArmComposite extends R15LimbComposite {
		constructor(textures) { super(textures.shirt, getURL("res/previewer/compositing/R15CompositRightArmBase.mesh")) }
		setBodyColors(bodyColors) { super.setBodyColors(bodyColors, "rightarm") }
	}
	class R15LeftLegComposite extends R15LimbComposite {
		constructor(textures) { super(textures.pants, getURL("res/previewer/compositing/R15CompositLeftArmBase.mesh")) }
		setBodyColors(bodyColors) { super.setBodyColors(bodyColors, "leftleg") }
	}
	class R15RightLegComposite extends R15LimbComposite {
		constructor(textures) { super(textures.pants, getURL("res/previewer/compositing/R15CompositRightArmBase.mesh")) }
		setBodyColors(bodyColors) { super.setBodyColors(bodyColors, "rightleg") }
	}

	return {
		HeadComposite,
		R6Composite,

		R15TorsoComposite,
		R15LeftArmComposite,
		R15RightArmComposite,
		R15LeftLegComposite,
		R15RightLegComposite
	}
})()
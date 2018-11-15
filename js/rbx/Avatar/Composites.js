"use strict"

const RBXComposites = (() => {
	const renderers = {}

	class CompositeTexture {
		constructor(hasThree, constructorFn, ...args) {
			this.canvas = document.createElement("canvas")
			this.context = this.canvas.getContext("2d")

			if(hasThree) {
				this.scene = new THREE.Scene()
				this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100)

				const ambient = new THREE.AmbientLight(0xFFFFFF)
				this.scene.add(ambient)
			}

			this.canvas.updateListeners = []

			this.beforeComposite = []
			this.afterComposite = []
			this.width = 1024
			this.height = 1024

			constructorFn.apply(this, args)

			this.canvas.width = this.width
			this.canvas.height = this.height

			if(hasThree) {
				const key = `${this.width}x${this.height}`
				this.compositeRenderer = renderers[key] = renderers[key] || new THREE.WebGLRenderer({ alpha: true })
				this.compositeRenderer.setSize(this.width, this.height)
				this.camera.updateProjectionMatrix()
			}

			this.needsUpdate = true
		}

		update() {
			this.needsUpdate = false
			const ctx = this.context

			if(this.background) {
				ctx.fillStyle = this.background
				ctx.fillRect(0, 0, this.width, this.height)
			}

			this.beforeComposite.forEach(fn => fn())
			if(this.scene) {
				this.compositeRenderer.render(this.scene, this.camera)
				ctx.drawImage(this.compositeRenderer.domElement, 0, 0, this.width, this.height, 0, 0, this.width, this.height)
			}
			this.afterComposite.forEach(fn => fn())

			this.canvas.updateListeners.forEach(fn => fn())
		}
	}

	function HeadCompositeConstructor() {
		this.background = "#A3A2A5"
		this.width = 256
		this.height = 256
	}

	function R6CompositeConstructor(textures) {
		this.width = 1024
		this.height = 512

		const size = 2

		this.camera = new THREE.OrthographicCamera(-size / 2, size / 2, size / 4, -size / 4, 0.1, 100)
		this.scene.scale.set(size / 1024, size / 1024, size / 1024)
		this.camera.position.set(size / 2, size / 4, 10)
		this.camera.rotation.set(0, 0, 0)

		const pantsmesh = this.pantsmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
			transparent: true,
			map: textures.pants
		}))
		pantsmesh.visible = false
		pantsmesh.renderOrder = 1
		this.scene.add(pantsmesh)

		const shirtmesh = this.shirtmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
			transparent: true,
			map: textures.shirt
		}))
		shirtmesh.visible = false
		shirtmesh.renderOrder = 2
		this.scene.add(shirtmesh)

		const tshirtmesh = this.tshirtmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
			transparent: true,
			map: textures.tshirt
		}))
		tshirtmesh.visible = false
		tshirtmesh.renderOrder = 3
		this.scene.add(tshirtmesh)

		textures.tshirt.image.updateListeners.push(() => this.needsUpdate = true)
		textures.shirt.image.updateListeners.push(() => this.needsUpdate = true)
		textures.pants.image.updateListeners.push(() => this.needsUpdate = true)

		let meshUrl = getURL("res/previewer/compositing/CompositShirtTemplate.mesh")
		AssetCache.loadMesh(true, meshUrl, mesh => RBXAvatar.applyMesh(shirtmesh, mesh))

		meshUrl = getURL("res/previewer/compositing/CompositPantsTemplate.mesh")
		AssetCache.loadMesh(true, meshUrl, mesh => RBXAvatar.applyMesh(pantsmesh, mesh))

		meshUrl = getURL("res/previewer/compositing/CompositTShirt.mesh")
		AssetCache.loadMesh(true, meshUrl, mesh => RBXAvatar.applyMesh(tshirtmesh, mesh))

		this.shouldUpdateBodyColors = true
		this.bodyColors = {
			head: "#A3A2A5",
			torso: "#A3A2A5",
			rightarm: "#A3A2A5",
			leftarm: "#A3A2A5",
			rightleg: "#A3A2A5"
		}

		this.background = "#7F7F7F"

		const ctx = this.context
		this.beforeComposite.push(() => {
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
		})
	}

	function R15TorsoCompositeConstructor(textures) {
		this.background = "#A3A2A5"
		this.width = 388
		this.height = 272

		this.camera = new THREE.OrthographicCamera(-this.width / 2, this.width / 2, this.height / 2, -this.height / 2, 0.1, 100)
		this.camera.position.set(this.width / 2, this.height / 2, 10)
		this.camera.rotation.set(0, 0, 0)

		const pantsmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
			transparent: true,
			map: textures.pants
		}))
		pantsmesh.visible = false
		pantsmesh.renderOrder = 0
		this.scene.add(pantsmesh)

		const shirtmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
			transparent: true,
			map: textures.shirt
		}))
		shirtmesh.visible = false
		shirtmesh.renderOrder = 1
		this.scene.add(shirtmesh)

		textures.tshirt.image.updateListeners.push(() => this.needsUpdate = true)
		textures.shirt.image.updateListeners.push(() => this.needsUpdate = true)
		textures.pants.image.updateListeners.push(() => this.needsUpdate = true)

		const meshUrl = getURL("res/previewer/compositing/R15CompositTorsoBase.mesh")
		AssetCache.loadMesh(true, meshUrl, mesh => {
			RBXAvatar.applyMesh(shirtmesh, mesh)
			RBXAvatar.applyMesh(pantsmesh, mesh)
		})

		this.afterComposite.push(() => {
			this.context.drawImage(textures.tshirt.image, 2, 74, 128, 128)
		})
	}

	function R15LimbCompositeConstructor(texture, meshUrl) {
		this.background = "#A3A2A5"
		this.width = 264
		this.height = 284

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
		AssetCache.loadMesh(true, meshUrl, mesh => RBXAvatar.applyMesh(obj, mesh))
	}

	return {
		Texture: CompositeTexture,

		HeadCompositeConstructor,
		R6CompositeConstructor,
		R15LimbCompositeConstructor,
		R15TorsoCompositeConstructor
	}
})()
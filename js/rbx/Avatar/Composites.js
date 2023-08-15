"use strict"

const RBXComposites = (() => {
	const applySourceToMaterial = (source, material) => {
		material.map = source.toTexture()
		
		source.onUpdate(() => {
			material.map = source.toTexture()
		})
	}
	
	class CompositeTexture {
		constructor(width, height) {
			this.canvas = document.createElement("canvas")
			this.context = this.canvas.getContext("2d")
			
			this.scene = new THREE.Scene()

			this.updateListeners = []
			this.loaders = []

			this.width = width
			this.height = height

			this.canvas.width = this.width
			this.canvas.height = this.height
			
			this.requestUpdate()
		}

		beforeComposite() { }
		afterComposite() { }

		requestUpdate() {
			this.needsUpdate = true
		}

		update(renderer) {
			this.needsUpdate = false
			
			this.context.clearRect(0, 0, this.width, this.height)
			this.beforeComposite()

			renderer.setSize(this.width, this.height, false)
			renderer.render(this.scene, this.camera)
			
			this.context.drawImage(renderer.domElement, 0, 0, this.width, this.height, 0, 0, this.width, this.height)

			this.afterComposite()
			
			for(const fn of this.updateListeners) {
				fn(this)
			}
		}
		
		drawImage(ctx, canvas) {
			ctx.drawImage(this.canvas, 0, 0, this.width, this.height, 0, 0, canvas.width, canvas.height)
		}
		
		onUpdate(fn) {
			this.updateListeners.push(fn)
		}
	}

	class R6Composite extends CompositeTexture {
		constructor(sources) {
			super(1024, 512)
			this.sources = sources

			const size = 2

			this.camera = new THREE.OrthographicCamera(-size / 2, size / 2, size / 4, -size / 4, 0.1, 100)
			this.scene.scale.set(size / 1024, size / 1024, size / 1024)
			this.camera.position.set(size / 2, size / 4, 10)
			this.camera.rotation.set(0, 0, 0)
			this.camera.updateProjectionMatrix()
	
			const pantsmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
				transparent: true
			}))
			pantsmesh.frustumCulled = false
			pantsmesh.renderOrder = 1
			this.scene.add(pantsmesh)
	
			const shirtmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
				transparent: true
			}))
			shirtmesh.frustumCulled = false
			shirtmesh.renderOrder = 2
			this.scene.add(shirtmesh)
	
			const tshirtmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
				transparent: true
			}))
			tshirtmesh.frustumCulled = false
			tshirtmesh.renderOrder = 3
			this.scene.add(tshirtmesh)
	
			applySourceToMaterial(this.sources.pants, pantsmesh.material)
			applySourceToMaterial(this.sources.shirt, shirtmesh.material)
			applySourceToMaterial(this.sources.tshirt, tshirtmesh.material)
			
			this.sources.pants.onUpdate(() => this.requestUpdate())
			this.sources.shirt.onUpdate(() => this.requestUpdate())
			this.sources.tshirt.onUpdate(() => this.requestUpdate())
	
			let meshUrl = RBXAvatar.LocalAssets["res/previewer/compositing/CompositShirtTemplate.mesh"]
			this.loaders.push(AssetCache.loadMesh(true, meshUrl, mesh => RBXAvatar.applyMesh(shirtmesh, mesh)))
	
			meshUrl = RBXAvatar.LocalAssets["res/previewer/compositing/CompositPantsTemplate.mesh"]
			this.loaders.push(AssetCache.loadMesh(true, meshUrl, mesh => RBXAvatar.applyMesh(pantsmesh, mesh)))
	
			meshUrl = RBXAvatar.LocalAssets["res/previewer/compositing/CompositTShirt.mesh"]
			this.loaders.push(AssetCache.loadMesh(true, meshUrl, mesh => RBXAvatar.applyMesh(tshirtmesh, mesh)))
		}
	}


	class R15TorsoComposite extends CompositeTexture {
		constructor(sources) {
			super(388, 272)
			this.sources = sources
			
			this.camera = new THREE.OrthographicCamera(-this.width / 2, this.width / 2, this.height / 2, -this.height / 2, 0.1, 1000)
			this.camera.position.set(this.width / 2, this.height / 2, 10)
			this.camera.rotation.set(0, 0, 0)
			this.camera.updateProjectionMatrix()
	
			const pantsmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
				transparent: true
			}))
			pantsmesh.frustumCulled = false
			pantsmesh.renderOrder = 1
			this.scene.add(pantsmesh)
	
			const shirtmesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
				transparent: true
			}))
			shirtmesh.frustumCulled = false
			shirtmesh.renderOrder = 2
			this.scene.add(shirtmesh)
			
			applySourceToMaterial(this.sources.pants, pantsmesh.material)
			applySourceToMaterial(this.sources.shirt, shirtmesh.material)
			
			this.sources.pants.onUpdate(() => this.requestUpdate())
			this.sources.shirt.onUpdate(() => this.requestUpdate())
			this.sources.tshirt.onUpdate(() => this.requestUpdate())
	
			const meshUrl = RBXAvatar.LocalAssets["res/previewer/compositing/R15CompositTorsoBase.mesh"]
			this.loaders.push(AssetCache.loadMesh(true, meshUrl, mesh => {
				RBXAvatar.applyMesh(shirtmesh, mesh)
				RBXAvatar.applyMesh(pantsmesh, mesh)
			}))
		}

		afterComposite() {
			this.context.drawImage(this.sources.tshirt.getImage(), 2, 74, 128, 128)
		}
	}


	class R15LimbComposite extends CompositeTexture {
		constructor(source, meshUrl) {
			super(264, 284)
			
			this.camera = new THREE.OrthographicCamera(-this.width / 2, this.width / 2, this.height / 2, -this.height / 2, 0.1, 100)
			this.camera.position.set(this.width / 2, this.height / 2, 10)
			this.camera.rotation.set(0, 0, 0)
			this.camera.updateProjectionMatrix()

			const obj = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({
				transparent: true
			}))
			obj.frustumCulled = false
			this.scene.add(obj)
			
			applySourceToMaterial(source, obj.material)
			source.onUpdate(() => this.requestUpdate())

			this.loaders.push(
				AssetCache.loadMesh(true, meshUrl, mesh => RBXAvatar.applyMesh(obj, mesh))
			)
		}
	}

	class R15LeftArmComposite extends R15LimbComposite {
		constructor(sources) { super(sources.shirt, RBXAvatar.LocalAssets["res/previewer/compositing/R15CompositLeftArmBase.mesh"]) }
	}
	class R15RightArmComposite extends R15LimbComposite {
		constructor(sources) { super(sources.shirt, RBXAvatar.LocalAssets["res/previewer/compositing/R15CompositRightArmBase.mesh"]) }
	}
	class R15LeftLegComposite extends R15LimbComposite {
		constructor(sources) { super(sources.pants, RBXAvatar.LocalAssets["res/previewer/compositing/R15CompositLeftArmBase.mesh"]) }
	}
	class R15RightLegComposite extends R15LimbComposite {
		constructor(sources) { super(sources.pants, RBXAvatar.LocalAssets["res/previewer/compositing/R15CompositRightArmBase.mesh"]) }
	}

	return {
		CompositeTexture,
		R6Composite,

		R15TorsoComposite,
		R15LeftArmComposite,
		R15RightArmComposite,
		R15LeftLegComposite,
		R15RightLegComposite
	}
})()
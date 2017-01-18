// BTR-RBXScene-Controls.js
"use strict"

ANTI.RBXScene.Controls = (function() {
	function Controls(scene) {
		this.scene = scene
		this.focus = new THREE.Vector3(0, 4, 0)
		this.rotation = new THREE.Euler(.05, 0, 0, "YXZ")
		this.zoom = 10

		this._mouseDragListeners = []

		var canvas = $(scene.canvas)
		var prevDragEvent = null

		var mousedown = (event) => {
			event.preventDefault()

			if(event.button == 0) {
				prevDragEvent = event
				canvas.on("mousemove", mousemove)
				canvas.on("mouseup", mouseup)
			}

			return false
		}

		var mousemove = (event) => {
			var moveX = event.clientX - prevDragEvent.clientX
			var moveY = event.clientY - prevDragEvent.clientY
			prevDragEvent = event

			this.mousedrag(moveX, moveY)
		}

		var mouseup = (event) => {
			if(event.type == "mouseleave" || event.button == 0) {
				canvas.off("mousemove", mousemove)
				canvas.off("mouseup", mouseup)
			}
		}

		canvas.on({
			mousedown: mousedown, 
			mouseleave: mouseup, 
			contextmenu: (event) => event.preventDefault()
		})

		scene.update(() => this.update())
	}

	Object.assign(Controls.prototype, {
		update: function() {
			var cameraDir = new THREE.Vector3(0, 0, 1).applyEuler(this.rotation)
			var cameraPos = this.scene.camera.position.copy(this.focus).addScaledVector(cameraDir, -this.zoom)

			var groundDiff = .05 - cameraPos.y
			if(groundDiff > 0 && cameraDir.y > 0) {
				cameraPos.addScaledVector(cameraDir, groundDiff/cameraDir.y)
			}

			this.scene.camera.lookAt(this.focus)
		},
		mousedrag: function(moveX, moveY) {
			var listeners = this._mouseDragListeners
			if(typeof(moveX) === "function") {
				listeners.push(moveX)
				return;
			}

			for(var i=0, l=listeners.length; i<l; i++)
				listeners[i](moveX, moveY);
		}
	})

	return Controls
})();
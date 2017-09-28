"use strict"

RBXScene.Animator = (function() {
	function mod(a,b){ return((a%b)+b)%b }
	//function fix(n){ return (mod(n,Math.PI*2)+Math.PI)%(Math.PI*2)-Math.PI }
	function fix(n) {
		var x = n

		if(x > Math.PI) {
			x = -Math.PI*2 + (x % (Math.PI*2))
		} else if(x < -Math.PI) {
			x = Math.PI*2 + (x % (Math.PI*2))
		}

		return x
	}


	function Animator(joints) {
		this.playing = false
		this.anim = null
		this.speed = 1

		this.setJoints(joints)
	}

	var tq = new THREE.Quaternion()

	Object.assign(Animator.prototype, {
		setJoints: function(joints) {
			this.joints = joints
		},
		play: function(anim) {
			if(anim)
				this.anim = anim;

			this.playing = true
			this.timePosition = 0
			this.previousUpdate = window.performance.now() / 1000
		},
		pause: function() {
			this.playing = false
		},
		resume: function() {
			this.playing = true
			this.previousUpdate = window.performance.now() / 1000
		},
		update: function(delta) {
			if(!this.playing || !this.anim || !this.joints)
				return;

			var time = window.performance.now() / 1000
			var delta = time - this.previousUpdate
			this.previousUpdate = time
			this.timePosition += delta * this.speed

			if(this.timePosition > this.anim.length) {
				if(this.anim.loop) {
					this.timePosition = this.timePosition % this.anim.length
				} else {
					this.playing = false
					this.timePosition = 0

					if(this.onstop)
						this.onstop()
					return;
				}
			}

			var currentTime = this.timePosition
			var emptyFrame = {
				time: 0, 
				pos: [0,0,0], 
				rot: [0,0,0]
			}
			var nextQuat = new THREE.Quaternion()

			for(var name in this.anim.keyframes) {
				var joint = this.joints[name]
				if(joint) {
					var keyframes = this.anim.keyframes[name]
					var next = keyframes.find(x => x.time >= currentTime)

					if(!next) {
						var last = keyframes[keyframes.length-1]
						joint.joint.position.fromArray(last.pos)
						joint.joint.quaternion.fromArray(last.rot)
					} else {
						var prev = keyframes[keyframes.indexOf(next)-1] || emptyFrame
						var length = next.time - prev.time
						var alpha = length === 0 ? 1 : (currentTime - prev.time)/length

						joint.joint.position.set(
							prev.pos[0] + (next.pos[0]-prev.pos[0]) * alpha,
							prev.pos[1] + (next.pos[1]-prev.pos[1]) * alpha,
							prev.pos[2] + (next.pos[2]-prev.pos[2]) * alpha,
						)

						joint.joint.quaternion.fromArray(prev.rot).slerp(nextQuat.fromArray(next.rot), alpha)
					}
				}
			}
		}
	})

	return Animator
})();




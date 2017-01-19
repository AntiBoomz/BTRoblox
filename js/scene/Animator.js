// BTR-RBXScene-Animator.js
"use strict"

ANTI.RBXScene.Animator = (function() {
	function mod(a,b){ return((a%b)+b)%b }
	function fix(n){ return (mod(n,Math.PI*2)+Math.PI)%(Math.PI*2)-Math.PI }

	function Animator(joints) {
		this.playing = false
		this.anim = null

		this.setJoints(joints)
	}

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
			this.timePosition += delta

			if(this.timePosition > this.anim.Length) {
				if(this.anim.Looped) {
					this.timePosition = this.timePosition % this.anim.Length
				} else {
					this.playing = false
					this.timePosition = 0

					if(this.onstop)
						this.onstop()
					return;
				}
			}

			var currentTime = this.timePosition
			var animData = this.anim.Limbs
			var emptyFrame = [0, [0,0,0], [0,0,0]]

			for(var name in animData) {
				var joint = this.joints[name]

				if(joint) {
					var frames = animData[name]
					for(var i=0, l=frames.length; i<l; i++) {
						var frame = frames[i]
						var frameTime = frame[0]

						if(frameTime >= currentTime || i === l-1) {
							var prev = i > 0 ? frames[i-1] : emptyFrame
							var t = frameTime <= currentTime || frameTime == prev[0] ? 1 : (currentTime-prev[0])/(frameTime-prev[0])

							var pos0 = prev[1]
							var pos1 = frame[1]

							var rot0 = prev[2]
							var rot1 = frame[2]

							joint.pivot.position.set(
								pos0[0] + fix(pos1[0]-pos0[0]) * t,
								pos0[1] + fix(pos1[1]-pos0[1]) * t,
								pos0[2] + fix(pos1[2]-pos0[2]) * t
							)

							joint.pivot.rotation.set(
								rot0[0] + fix(rot1[0]-rot0[0]) * t,
								rot0[1] + fix(rot1[1]-rot0[1]) * t,
								rot0[2] + fix(rot1[2]-rot0[2]) * t
							)

							break;
						}
					}
				}
			}
		}
	})

	return Animator
})();




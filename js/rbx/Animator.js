"use strict"

const RBXAnimator = (() => {
	const bounce = x => (
		x < 0.36363636 ? 7.5625 * x ** 2
			: x < 0.72727272 ? 7.5625 * (x - 0.54545454) ** 2 + 0.75
				: x < 0.90909090 ? 7.5625 * (x - 0.81818181) ** 2 + 0.9375
					: 7.5625 * (x - 0.95454545) ** 2 + 0.984375
	)

	const EasingStyles = [
		[ // Linear
			x => x, // In
			x => x, // Out
			x => x // InOut
		],
		[ // Constant
			() => 1,
			() => 0,
			x => (x >= .5 ? 1 : 0)
		],
		[ // Elastic
			x => -(2 ** (-10 * (1 - x))) * Math.sin(20.944 * (0.925 - x)),
			x => (2 ** (-10 * x)) * Math.sin(20.944 * (x - 0.075)) + 1,
			x => (x < .5
				? -0.5 * (2 ** (-10 * (1 - 2 * x))) * Math.sin(13.9626 * (0.8875 - 2 * x))
				: 1 + 0.5 * (2 ** (-10 * (2 * x - 1))) * Math.sin(13.9626 * (2 * x - 1.1125)))
		],
		[ // Cubic
			x => 1 - (1 - x) ** 3,
			x => x ** 3,
			x => (x < .5 ? 4 * x ** 3 : 1 - 4 * (1 - x) ** 3)
		],
		[ // Bounce
			x => 1 - bounce(1 - x),
			x => bounce(x),
			x => (x < .5 ? 0.5 - 0.5 * bounce(1 - 2 * x) : 1 - 0.5 * bounce(2 - 2 * x))
		]
	]

	class Animator {
		constructor(joints) {
			this.playing = false
			this.anim = null
			this.speed = 1

			this.setJoints(joints)
		}

		setJoints(joints) {
			this.joints = joints
		}

		play(anim) {
			if(anim) { this.anim = anim }

			this.playing = true
			this.timePosition = 0
			this.previousUpdate = performance.now() / 1000
		}

		pause() {
			this.playing = false
		}

		resume() {
			this.playing = true
			this.previousUpdate = performance.now() / 1000
		}

		update() {
			if(!this.playing || !this.anim || !this.joints) { return }

			const time = performance.now() / 1000
			const delta = time - this.previousUpdate
			this.previousUpdate = time
			this.timePosition += delta * this.speed

			if(this.timePosition > this.anim.length) {
				if(this.anim.loop) {
					this.timePosition = this.timePosition % this.anim.length
				} else {
					this.playing = false
					this.timePosition = 0

					if(this.onstop) { this.onstop() }
					return
				}
			}

			const currentTime = this.timePosition
			const emptyFrame = {
				time: 0,
				pos: [0, 0, 0],
				rot: [0, 0, 0]
			}

			const nextQuat = new THREE.Quaternion()
			Object.entries(this.anim.keyframes).forEach(([name, keyframes]) => {
				if(!this.joints[name]) { return }

				const joint = this.joints[name].joint
				const next = keyframes.find(x => x.time >= currentTime)

				if(!next) {
					const last = keyframes[keyframes.length - 1]
					joint.position.set(...last.pos)
					joint.quaternion.set(...last.rot)
				} else {
					const prev = keyframes[keyframes.indexOf(next) - 1] || emptyFrame
					const length = next.time - prev.time
					const easing = (EasingStyles[prev.easingstyle] || EasingStyles[0])[prev.easingdir || 0]
					const alpha = length === 0 ? 1 : easing((currentTime - prev.time) / length)

					joint.position.set(
						prev.pos[0] + (next.pos[0] - prev.pos[0]) * alpha,
						prev.pos[1] + (next.pos[1] - prev.pos[1]) * alpha,
						prev.pos[2] + (next.pos[2] - prev.pos[2]) * alpha,
					)

					joint.quaternion.set(...prev.rot).slerp(nextQuat.set(...next.rot), alpha)
				}
			})
		}
	}

	return Animator
})()
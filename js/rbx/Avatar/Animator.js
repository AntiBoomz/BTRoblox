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
			x => (x > 0 ? 1 : 0),
			x => (x >= 1 ? 1 : 0),
			x => (x >= 0.5 ? 1 : 0)
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
		],
		[ // CubicV2
			x => x ** 3,
			x => 1 - (1 - x) ** 3,
			x => (x < .5 ? 4 * x ** 3 : 1 - 4 * (1 - x) ** 3)
		],
	]
	
	const eulerToQuat = (x, y, z, order) => {
		// https://github.com/mrdoob/three.js/blob/master/src/math/Quaternion.js
		
		// http://www.mathworks.com/matlabcentral/fileexchange/
		// 	20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
		//	content/SpinCalc.m
		
		const c1 = Math.cos(x / 2)
		const c2 = Math.cos(y / 2)
		const c3 = Math.cos(z / 2)

		const s1 = Math.sin(x / 2)
		const s2 = Math.sin(y / 2)
		const s3 = Math.sin(z / 2)

		switch (order) {
		case "XYZ":
			return [
				s1 * c2 * c3 + c1 * s2 * s3,
				c1 * s2 * c3 - s1 * c2 * s3,
				c1 * c2 * s3 + s1 * s2 * c3,
				c1 * c2 * c3 - s1 * s2 * s3
			]
		case "YXZ":
			return [
				s1 * c2 * c3 + c1 * s2 * s3,
				c1 * s2 * c3 - s1 * c2 * s3,
				c1 * c2 * s3 - s1 * s2 * c3,
				c1 * c2 * c3 + s1 * s2 * s3
			]
		case "ZXY":
			return [
				s1 * c2 * c3 - c1 * s2 * s3,
				c1 * s2 * c3 + s1 * c2 * s3,
				c1 * c2 * s3 + s1 * s2 * c3,
				c1 * c2 * c3 - s1 * s2 * s3
			]
		case "ZYX":
			return [
				s1 * c2 * c3 - c1 * s2 * s3,
				c1 * s2 * c3 + s1 * c2 * s3,
				c1 * c2 * s3 - s1 * s2 * c3,
				c1 * c2 * c3 + s1 * s2 * s3
			]
		case "YZX":
			return [
				s1 * c2 * c3 + c1 * s2 * s3,
				c1 * s2 * c3 + s1 * c2 * s3,
				c1 * c2 * s3 - s1 * s2 * c3,
				c1 * c2 * c3 - s1 * s2 * s3
			]
		case "XZY":
			return [
				s1 * c2 * c3 - c1 * s2 * s3,
				c1 * s2 * c3 - s1 * c2 * s3,
				c1 * c2 * s3 + s1 * s2 * c3,
				c1 * c2 * c3 + s1 * s2 * s3
			]
		}
	}
	
	const tempPos = new THREE.Vector3()
	const tempQuat = new THREE.Quaternion()
	
	const tempPos2 = new THREE.Vector3()
	const tempQuat2 = new THREE.Quaternion()

	class Animator {
		constructor() {
			this.rootScale = 1
			this.animations = []
			this.transforms = new Map()
		}
		
		stop(info, fadeOut) {
			const index = this.animations.indexOf(info)
			if(index === -1) { return }
			
			if(fadeOut && fadeOut > 0) {
				info.fadeOut = {
					duration: fadeOut,
					elapsed: 0
				}
			} else {
				info.removed = true
				this.animations.splice(index, 1)
			}
			
			if(info.playing) {
				info.playing = false
				
				info.onstop?.(info.anim)
				this.onstop?.(info.anim)
			}
		}

		play(anim, params) {
			if(typeof params === "number") {
				params = { fadeIn: params }
			}
			
			const info = {
				playing: true,
				anim: anim,
				
				loop: params?.loop ?? anim.loop,
				priority: params?.priority ?? anim.priority,
				
				weight: params?.weight ?? 1,
				speed: params?.speed ?? 1,
				
				fadeOutDuration: params?.fadeOut ?? 0,
				
				timePosition: 0,
				previousUpdate: performance.now()
			}
			
			if(params?.onstop) { info.onstop = params.onstop }
			if(params?.onloop) { info.onloop = params.onloop }
			
			if(params?.fadeIn && params.fadeIn > 0) {
				info.fadeIn = {
					duration: params?.fadeIn,
					elapsed: 0
				}
			}
			
			const index = this.animations.findIndex(x => x.priority >= info.priority)
			
			if(index !== -1) {
				this.animations.splice(index, 0, info)
			} else {
				this.animations.push(info)
			}
			
			return info
		}
		
		getJointTransform(parentName, name) {
			return this.transforms.get(`${parentName}.${name}`)
		}

		update() {
			const time = performance.now()
			
			// taking a slice of animations so callbacks can modify animations without breaking stuff
			for(const info of this.animations.slice()) {
				if(info.removed) { continue }
				
				const delta = (time - info.previousUpdate) / 1e3
				info.previousUpdate = time
				
				if(!info.playing) {
					if(info.fadeOut) {
						info.fadeOut.elapsed += delta
						
						if(info.fadeOut.elapsed >= info.fadeOut.duration) {
							this.stop(info, 0)
						}
					}
					
					continue
				}
				
				info.timePosition += delta * info.speed
	
				if(info.timePosition > info.anim.length) {
					if(info.loop) {
						info.timePosition %= info.anim.length
						info.onloop?.(info.anim)
						this.onloop?.(info.anim)
					} else {
						this.stop(info, info.fadeOutDuration)
						continue
					}
				}
				
				if(info.fadeIn) {
					info.fadeIn.elapsed += delta
					
					if(info.fadeIn.elapsed >= info.fadeIn.duration) {
						delete info.fadeIn
					}
				}
			}
			
			const transforms = {}
			
			for(const info of this.animations) {
				const weight = Math.max(0, Math.min(1, info.weight))
					* (info.fadeIn ? info.fadeIn.elapsed / info.fadeIn.duration : 1)
					* (info.fadeOut ? 1 - info.fadeOut.elapsed / info.fadeOut.duration : 1)
					
				if(weight === 0) {
					continue
				}
				
				for(const [name, keyframes] of Object.entries(info.anim.keyframes)) {
					let transform = transforms[name]
					
					if(transform && (transform.weight >= 1 || transform.working.weight >= 1 && transform.working.priority !== info.priority)) {
						continue
					}
					
					if(!transform) {
						transform = this.transforms.get(name)
						
						if(transform) {
							transform.position.set(0, 0, 0)
							transform.quaternion.set(0, 0, 0, 1)
							transform.weight = 0
						} else {
							transform = {
								position: new THREE.Vector3(0, 0, 0),
								quaternion: new THREE.Quaternion(0, 0, 0, 1),
								weight: 0,
								
								working: {
									position: new THREE.Vector3(0, 0, 0),
									quaternion: new THREE.Quaternion(0, 0, 0, 1),
									weight: 0,
									priority: -1
								}
							}
						}
						
						transforms[name] = transform
					}
					
					if(transform.working.priority !== info.priority) {
						if(transform.working.weight > 0) {
							const newWeight = 1 - (1 - transform.weight) * (1 - Math.min(1, transform.working.weight))
							const theta = (newWeight - transform.weight) / newWeight
							
							transform.position.lerp(transform.working.position, theta)
							transform.quaternion.slerp(transform.working.quaternion, theta)
							transform.weight = newWeight
							
							transform.working.position.set(0, 0, 0)
							transform.working.quaternion.set(0, 0, 0, 1)
							transform.working.weight = 0
						}
						
						transform.working.priority = info.priority
					}
					
					if(info.anim.isCurveAnimation) {
						const pos = { x: 0, y: 0, z: 0 }
						const rot = { x: 0, y: 0, z: 0 }
						
						const set = (input, output) => {
							for(const [key, keyframes] of Object.entries(input)) {
								const index = keyframes.findIndex(x => x.time > info.timePosition)
								
								if(index === 0 || keyframes.length === 0) {
									continue
								}
								
								const prev = index === -1 ? keyframes[keyframes.length - 1] : keyframes[index - 1]
								const next = index === -1 ? null : keyframes[index]
								
								if(!next || info.timePosition === prev.time || prev.interpolationMode === 0) {
									output[key] = prev.value
								} else {
									const timediff = next.time - prev.time
									const theta =  (info.timePosition - prev.time) / timediff
									
									if(prev.interpolationMode === 2) {
										// cubic hermite spline (interpolationMode = 2)
										const p0 = prev.value
										const m0 = prev.right_tangent * timediff
										
										const p1 = next.value
										const m1 = next.left_tangent * timediff
										
										output[key] =
											(2 * theta**3 - 3 * theta**2 + 1) * p0 +
											(theta**3 - 2 * theta**2 + theta) * m0 +
											(-2 * theta**3 + 3 * theta**2) * p1 +
											(theta**3 - theta**2) * m1
										
									} else {
										// linear (interpolationMode = 1), we also default to this for unknown interpolation modes
										output[key] = prev.value * (1 - theta) + next.value * theta
									}
								}
							}
						}
						
						set(keyframes.position, pos)
						set(keyframes.rotation, rot)
						
						tempPos.set(pos.x, pos.y, pos.z)
						tempQuat.set(...eulerToQuat(rot.x, rot.y, rot.z, keyframes.rotationOrder))
					} else {
						const index = keyframes.findIndex(x => x.time > info.timePosition)
						
						if(index === 0 || keyframes.length === 0) {
							continue
						}
						
						const prev = index === -1 ? keyframes[keyframes.length - 1] : keyframes[index - 1]
						const next = index === -1 ? null : keyframes[index]
						
						if(!next || info.timePosition === prev.time) {
							tempPos.set(...prev.pos)
							tempQuat.set(...prev.rot)
						} else {
							const easing = (EasingStyles[prev.easingstyle] || EasingStyles[0])[prev.easingdir || 0]
							const theta = easing((info.timePosition - prev.time) / (next.time - prev.time))
							
							tempPos.set(...prev.pos).lerp(tempPos2.set(...next.pos), theta)
							tempQuat.set(...prev.rot).slerp(tempQuat2.set(...next.rot), theta)
						}
					}
					
					const newWeight = transform.working.weight + weight
					const theta = (newWeight - transform.working.weight) / newWeight
					
					transform.working.position.lerp(tempPos, theta)
					transform.working.quaternion.slerp(tempQuat, theta)
					transform.working.weight = newWeight
				}
			}
			
			this.transforms.clear()
			
			for(const [name, transform] of Object.entries(transforms)) {
				if(transform.working.weight > 0) {
					const newWeight = 1 - (1 - transform.weight) * (1 - Math.min(1, transform.working.weight))
					const theta = (newWeight - transform.weight) / newWeight
					
					transform.position.lerp(transform.working.position, theta)
					transform.quaternion.slerp(transform.working.quaternion, theta)
					transform.weight = newWeight
					
					transform.working.position.set(0, 0, 0)
					transform.working.quaternion.set(0, 0, 0, 1)
					transform.working.weight = 0
					transform.working.priority = -1
				}
				
				if(transform.weight > 0) {
					transform.position.lerp(tempPos.set(0, 0, 0), 1 - transform.weight)
					transform.quaternion.slerp(tempQuat.set(0, 0, 0, 1), 1 - transform.weight)
					
					this.transforms.set(name, transform)
				}
			}
		}
	}

	return Animator
})()
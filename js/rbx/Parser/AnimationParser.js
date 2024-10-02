"use strict"

/*
MarkerCurve.ValuesAndTimes {
	u32 unknown = 1
	u32 string_count
	c_string strings[string_count] -- null terminated

	u32 unknown = 1
	u32 time_count
	u32 times[time_count] -- actual time seems to be u32 / 2400
}

FloatCurve.ValuesAndtimes {
	u32 unknown = 1
	u32 value_count
	
	values[value_count] {
		u8 interpolation_mode (0 = constant, 1 = linear, 2 = cubic)
		u8 flags (bit 0: left_tangent is set, bit 1: right tangent is set)
			(i dont think the bits being set actually affects playback at all)
		f32 value
		f32 left_tangent
		f32 right_tangent
	}
	
	u32 unknown = 1
	u32 time_count
	u32 times[time_count] -- actual time seems to be u32 / 2400
}
*/

const RBXAnimationParser = {
	CFrameToQuat(cf) {
		const trace = cf[3] + cf[7] + cf[11]
		let qw, qx, qy, qz
		
		if(trace > 0) {
			const S = Math.sqrt(1 + trace) * 2
			qw = S / 4
			qx = (cf[10] - cf[8]) / S
			qy = (cf[5] - cf[9]) / S
			qz = (cf[6] - cf[4]) / S
		} else if ((cf[3] > cf[7]) && (cf[3] > cf[11])) {
			const S = Math.sqrt(1.0 + cf[3] - cf[7] - cf[11]) * 2
			qw = (cf[10] - cf[8]) / S
			qx = S / 4
			qy = (cf[4] + cf[6]) / S
			qz = (cf[5] + cf[9]) / S
		} else if (cf[7] > cf[11]) {
			const S = Math.sqrt(1.0 + cf[7] - cf[3] - cf[11]) * 2
			qw = (cf[5] - cf[9]) / S
			qx = (cf[4] + cf[6]) / S
			qy = S / 4
			qz = (cf[8] + cf[10]) / S
		} else {
			const S = Math.sqrt(1.0 + cf[11] - cf[3] - cf[7]) * 2
			qw = (cf[6] - cf[4]) / S
			qx = (cf[5] + cf[9]) / S
			qy = (cf[8] + cf[10]) / S
			qz = S / 4
		}

		return [qx, qy, qz, qw]
	},

	parse(sequence) {
		if(Array.isArray(sequence)) { sequence = sequence[0] }
		assert(sequence instanceof RBXInstance, "sequence is not an Instance")
		
		const priority = sequence.Priority ?? 1000 // 1000 is Core, the lowest priority
			
		const result = {
			priority: (priority === 1000 ? -1 : priority) + 1,
			loop: !!sequence.Loop,
			length: 0,
			keyframes: {}
		}
		
		if(sequence.ClassName === "KeyframeSequence") {
			result.authoredHipHeight = sequence.AuthoredHipHeight ?? null
			
			for(const keyframe of sequence.Children) {
				if(keyframe.ClassName !== "Keyframe") { continue }
				
				if(keyframe.Time > result.length) {
					result.length = keyframe.Time
				}
				
				for(const rootPose of keyframe.Children) {
					if(rootPose.ClassName === "Pose") {
						this.parsePoses(result, rootPose, keyframe.Time)
					}
				}
			}
			
			for(const keyframes of Object.values(result.keyframes)) {
				keyframes.sort((a, b) => a.time - b.time)
			}
		} else if(sequence.ClassName === "CurveAnimation") {
			result.isCurveAnimation = true
			
			for(const child of sequence.Children) {
				this.parseCurves(result, child)
			}
			
		} else {
			throw new TypeError(`Invalid instance of class '${sequence.ClassName}' passed to parseAnimation`)
		}

		return result
	},
	
	parseCurves(result, target) {
		for(const child of target.Children) {
			if(child.ClassName === "Folder") {
				this.parseCurves(result, child)
				
			} else if(child.ClassName === "Vector3Curve" && child.Name === "Position" || child.ClassName === "EulerRotationCurve" && child.Name === "Rotation") {
				const curveType = child.Name.toLowerCase()
				
				const keyframeName = `${target.Parent.Name}.${target.Name}`
				const keyframes = result.keyframes[keyframeName] = result.keyframes[keyframeName] ?? {}

				if(curveType === "position") {
					keyframes.position = { x: [], y: [], z: [] }
					
				} else if(curveType === "rotation") {
					keyframes.rotationOrder = ["XYZ", "XZY", "YZX", "YXZ", "ZXY", "ZYX"][child.RotationOrder ?? 0]
					keyframes.rotation = { x: [], y: [], z: [] }
				}
				
				for(const component of child.Children) {
					if(component.ClassName !== "FloatCurve" || !component.ValuesAndTimes) { continue }
					
					const curves = keyframes[curveType][component.Name.toLowerCase()]
					if(!curves) { continue }
					
					const reader = new ByteReader(stringToBuffer(component.ValuesAndTimes))
					
					reader.Jump(4)
					const valueCount = reader.UInt32LE()
					
					for(let i = 0; i < valueCount; i++) {
						curves[i] = {
							time: -1,
							interpolationMode: reader.UInt8(),
							flags: reader.UInt8(),
							value: reader.FloatLE(),
							left_tangent: reader.FloatLE(),
							right_tangent: reader.FloatLE()
						}
					}
					
					reader.Jump(4)
					const timeCount = reader.UInt32LE()
					
					assert(timeCount == valueCount, "value and time count do not match")
					
					for(let i = 0; i < timeCount; i++) {
						const time = curves[i].time = reader.UInt32LE() / 2400
						
						if(time > result.length) {
							result.length = time
						}
					}
				}
			}
			
		}
	},

	parsePoses(result, rootPose, time) {
		for(const pose of rootPose.Children) {
			if(pose.ClassName !== "Pose") { continue }
			
			if(pose.Weight > 0) {
				const name = `${rootPose.Name}.${pose.Name}`
				const cf = pose.CFrame
				
				if(!result.keyframes[name]) {
					result.keyframes[name] = []
				}
				
				result.keyframes[name].push({
					time: time,
					pos: [cf[0], cf[1], cf[2]],
					rot: this.CFrameToQuat(cf),
					easingdir: pose.EasingDirection,
					easingstyle: pose.EasingStyle
				})
			}
			
			this.parsePoses(result, pose, time)
		}
	}
}
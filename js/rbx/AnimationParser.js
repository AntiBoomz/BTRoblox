"use strict"

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
		assert(sequence.ClassName === "KeyframeSequence", "sequence is not a KeyframeSequence")
		
		const keyframes = sequence.Children
			.filter(x => x.ClassName === "Keyframe")
			.sort((a, b) => a.Time - b.Time)
		
		const priority = sequence.Priority ?? 1000 // 1000 is Core, the lowest priority
			
		const result = {
			authoredHipHeight: sequence.AuthoredHipHeight ?? null,
			priority: (priority === 1000 ? -1 : priority) + 1,
			length: keyframes[keyframes.length - 1].Time,
			loop: !!sequence.Loop,
			keyframes: {}
		}
		
		for(const keyframe of keyframes) {
			for(const rootPose of keyframe.Children) {
				if(rootPose.ClassName === "Pose") {
					for(const pose of rootPose.Children) {
						this.parsePose(result, pose, keyframe)
					}
				}
			}
		}

		return result
	},

	parsePose(result, pose, keyframe) {
		if(pose.ClassName !== "Pose") { return }
		
		if(pose.Weight > 0) {
			const name = pose.Name
			const cf = pose.CFrame
			
			if(!result.keyframes[name]) {
				result.keyframes[name] = []
			}
			
			result.keyframes[name].push({
				time: keyframe.Time,
				pos: [cf[0], cf[1], cf[2]],
				rot: this.CFrameToQuat(cf),
				easingdir: pose.EasingDirection,
				easingstyle: pose.EasingStyle
			})
		}
		
		for(const child of pose.Children) {
			this.parsePose(result, child, keyframe)
		}
	}
}
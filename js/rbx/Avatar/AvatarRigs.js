"use strict"

const RBXAvatarRigs = (() => {
	const RecurseTree = model => {
		const parts = {}

		const recursePart = part => {
			if(part.Name in parts) { return parts[part.Name] }
			
			const partData = {
				name: part.Name,
				children: [],
				attachments: {},
				origSize: [...(part.size || part.Size)]
			}

			parts[part.Name] = partData
			
			for(const item of part.Children) {
				if(item.ClassName === "Attachment" && !item.Name.endsWith("RigAttachment")) {
					partData.attachments[item.Name] = RBXAvatar.CFrameToMatrix4(...item.CFrame)
				} else if(item.ClassName === "Motor6D") {
					const part0Data = recursePart(item.Part0)
					const part1Data = recursePart(item.Part1)

					part1Data.JointName = item.Name
					part1Data.C0 = RBXAvatar.CFrameToMatrix4(...item.C0)
					part1Data.C1 = RBXAvatar.CFrameToMatrix4(...item.C1)

					part0Data.children.push(part1Data)

					if(item.Name === "Root" || item.Name === "Neck") {
						part0Data.attachments[`${item.Name}RigAttachment`] = RBXAvatar.CFrameToMatrix4(...item.C0)
					} else {
						part1Data.attachments[`${item.Name}RigAttachment`] = RBXAvatar.CFrameToMatrix4(...item.C1)
					}
				}
			}

			if(part.ClassName === "MeshPart") {
				partData.meshId = part.MeshID ?? part.MeshId
			} else if(part.Name === "Head") {
				partData.meshId = getURL(`res/previewer/heads/head.mesh`)
			} else if(RBXAvatar.R6BodyPartNames.indexOf(part.Name) !== -1) {
				const fname = part.Name.toLowerCase().replace(/\s/g, "")
				partData.meshId = getURL(`res/previewer/meshes/${fname}.mesh`)
			}

			return partData
		}
		
		for(const item of model.Children) {
			if(item.ClassName === "Part" || item.ClassName === "MeshPart") {
				recursePart(item)
			}
		}

		return parts.HumanoidRootPart
	}

	return {
		R6Tree: null,
		R15Tree: null,

		loadPromise: null,
		loaded: false,

		load() {
			if(this.loadPromise) {
				return this.loadPromise
			}

			return this.loadPromise = this.loadPromise || new SyncPromise(resolve => {
				const path = getURL("res/previewer/characterModels.rbxm")

				AssetCache.loadModel(true, path, model => {
					this.R6Tree = RecurseTree(model.find(x => x.Name === "R6"))
					this.R15Tree = RecurseTree(model.find(x => x.Name === "R15"))

					this.loaded = true
					resolve()
				})
			})
		}
	}
})()
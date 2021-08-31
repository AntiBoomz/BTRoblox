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

			part.Children.forEach(item => {
				if(item.ClassName === "Attachment" && !item.Name.endsWith("RigAttachment")) {
					partData.attachments[item.Name] = RBXAvatar.CFrame(...item.CFrame)
				} else if(item.ClassName === "Motor6D") {
					const part0Data = recursePart(item.Part0)
					const part1Data = recursePart(item.Part1)

					part1Data.JointName = item.Name
					part1Data.C0 = RBXAvatar.CFrame(...item.C0)
					part1Data.C1 = RBXAvatar.CFrame(...item.C1)

					part0Data.children.push(part1Data)

					if(item.Name === "Root" || item.Name === "Neck") {
						part0Data.attachments[`${item.Name}RigAttachment`] = RBXAvatar.CFrame(...item.C0)
					} else {
						part1Data.attachments[`${item.Name}RigAttachment`] = RBXAvatar.CFrame(...item.C1)
					}
				}
			})

			if(part.ClassName === "MeshPart") {
				partData.meshid = part.MeshID
			} else if(part.Name === "Head") {
				partData.meshid = getURL(`res/previewer/heads/head.mesh`)
			} else if(RBXAvatar.R6BodyPartNames.indexOf(part.Name) !== -1) {
				const fname = part.Name.toLowerCase().replace(/\s/g, "")
				partData.meshid = getURL(`res/previewer/meshes/${fname}.mesh`)
			}

			return partData
		}

		model.Children.forEach(item => {
			if(item.ClassName === "Part" || item.ClassName === "MeshPart") {
				recursePart(item)
			}
		})

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
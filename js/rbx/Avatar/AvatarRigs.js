"use strict"


const RBXAvatarRigs = {
	loaded: false,
	R6Tree: null,
	R15Tree: null,

	load(fn) {
		if(this.hasInit) {
			if(typeof fn === "function") { fn() }
			return
		}
		this.hasInit = true

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
						part1Data.C1 = RBXAvatar.InvertCFrame(...item.C1)

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

		const R6Promise = new SyncPromise(resolveTree => {
			const path = getURL("res/previewer/character.rbxm")
			AssetCache.loadModel(true, path, model => {
				const tree = RecurseTree(model[0])
				resolveTree(tree)
			})
		})

		const R15Promise = new SyncPromise(resolveTree => {
			const path = getURL("res/previewer/characterR15.rbxm")
			AssetCache.loadModel(true, path, model => {
				const tree = RecurseTree(model[0])
				resolveTree(tree)
			})
		})

		
		SyncPromise.all([R6Promise, R15Promise]).then(([R6Tree, R15Tree]) => {
			this.R6Tree = R6Tree
			this.R15Tree = R15Tree
			this.loaded = true

			if(typeof fn === "function") { fn() }
		})
	}
}
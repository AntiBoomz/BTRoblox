// BTR-AssetCache.js

"use strict"

const AssetCache = (() => {
	const fileCache = {}

	const resourcePrefixUrl = getURL("")
	const resourceToAsset = {
		"res/previewer/characterModels.rbxm": "rbxassetid://2957693598&version=3",
		"res/previewer/face.png": "rbxassetid://2957705858",
		
		"res/previewer/meshes/leftarm.mesh": "rbxassetid://2957740508",
		"res/previewer/meshes/leftleg.mesh": "rbxassetid://2957740624",
		"res/previewer/meshes/rightarm.mesh": "rbxassetid://2957740703",
		"res/previewer/meshes/rightleg.mesh": "rbxassetid://2957740776",
		"res/previewer/meshes/torso.mesh": "rbxassetid://2957740857",
		"res/previewer/heads/head.mesh": "rbxassetid://2957715294",
	
		"res/previewer/compositing/CompositPantsTemplate.mesh": "rbxassetid://2957742558",
		"res/previewer/compositing/CompositShirtTemplate.mesh": "rbxassetid://2957742631",
		"res/previewer/compositing/CompositTShirt.mesh": "rbxassetid://2957742706",
		"res/previewer/compositing/R15CompositLeftArmBase.mesh": "rbxassetid://2957742791",
		"res/previewer/compositing/R15CompositRightArmBase.mesh": "rbxassetid://2957742881",
		"res/previewer/compositing/R15CompositTorsoBase.mesh": "rbxassetid://2957742957"
	}

	function resolveAssetUrlParams(url) {
		if(url.startsWith(resourcePrefixUrl)) {
			const resourcePath = url.slice(resourcePrefixUrl.length)
			const mappedAssetUrl = resourceToAsset[resourcePath]

			if(!mappedAssetUrl) {
				return null
			}

			url = mappedAssetUrl
		}
		
		if(url.startsWith("rbxassetid://")) {
			url = `https://assetdelivery.roblox.com/v1/asset/?id=${url.slice(13)}`
		} else if(url.startsWith("rbxhttp://")) {
			url = `https://www.roblox.com/${url.slice(10)}`
		}

		try {
			const urlInfo = new URL(url)
			if(!urlInfo.pathname.match(/\/*asset\/*$/i)) {
				return null
			}

			return urlInfo.searchParams
		} catch(ex) {}

		return null
	}

	function createMethod(constructor) {
		const cache = {}

		return (strict, request, cb) => {
			if(typeof strict !== "boolean") {
				cb = request
				request = strict
				strict = false
			}
			
			if(!(request instanceof Object)) {
				request = { id: request }
			}

			if(!strict && Number.isSafeInteger(+request.id)) {
				request.id = AssetCache.toAssetUrl(request.id)
			}

			const params = resolveAssetUrlParams(request.id)
			
			if(!params) {
				throw new Error("Invalid url passed to AssetCache")
			}
			
			params.sort()
			
			let cacheKey = params.toString()
			
			if(request.format) {
				cacheKey += "@" + request.format
			}
			
			const cachePromise = cache[cacheKey] = cache[cacheKey] || new SyncPromise(cacheResolve => {
				const filePromise = fileCache[cacheKey] = fileCache[cacheKey] || new SyncPromise((fileResolve, fileReject) => {
					RobloxApi.assetdelivery.requestAssetV1(params, { format: request.format }).then(buffer => {
						if(buffer) {
							fileResolve(buffer)
						} else {
							fileReject(new Error(`Failed to download asset "${cacheKey}"`))
						}
					})
				})

				cacheResolve(filePromise.then(buffer => constructor(buffer, request)))
			}).catch(ex => {
				console.error(ex)
				return null
			})

			if(cb) {
				cachePromise.then(cb)
			}

			return cachePromise
		}
	}

	return {
		loadAnimation: createMethod(buffer => {
			const findSequence = array => {
				for(const inst of array) {
					if(inst.ClassName === "KeyframeSequence") {
						return inst
					}
					
					const sequence = findSequence(inst.Children)
					if(sequence) {
						return sequence
					}
				}
				
				return null
			}
			
			return RBXParser.parseAnimation(findSequence(RBXParser.parseModel(buffer)))
		}),
		loadModel: createMethod(buffer => RBXParser.parseModel(buffer)),
		loadMesh: createMethod(buffer => RBXParser.parseMesh(buffer, { excludeLods: true, excludeTangents: true, excludeVertexColors: true })),
		loadImage: createMethod(buffer => new SyncPromise((resolve, reject) => {
			const src = URL.createObjectURL(new Blob([new Uint8Array(buffer)], { type: "image/png" }))
			
			const image = new Image()
			image.onerror = () => reject(new Error("invalid image"))
			image.onload = () => resolve(image)
			image.src = src
			
			if(image.complete) {
				resolve(image)
			}
		})),

		loadBuffer: createMethod(buffer => buffer),
		loadText: createMethod(buffer => bufferToString(buffer)),

		toAssetUrl(id) {
			return `https://assetdelivery.roblox.com/v1/asset/?id=${+id}`
		},
		
		isValidAssetUrl(url) {
			return !!resolveAssetUrlParams(url)
		},

		resolveAssetId(url) {
			return resolveAssetUrlParams(url)?.get("id")
		}
	}
})()
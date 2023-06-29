// BTR-AssetCache.js

"use strict"

const AssetCache = (() => {
	const fileCache = {}

	const resourcePrefixUrl = getURL("")
	const resourceToAsset = {
		"res/previewer/characterModels.rbxm": "rbxassetid://11829118051&version=1",
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

		return (strict, request, params, cb) => {
			if(typeof strict !== "boolean") {
				cb = params
				params = request
				request = strict
				strict = false
			}
			
			if(typeof params === "function") {
				cb = params
				params = null
			}
			
			if(!strict && Number.isSafeInteger(+request)) {
				request = { id: request }
			}
			
			let urlParams
			
			if(typeof request === "string") {
				urlParams = resolveAssetUrlParams(request)
			} else if(request instanceof Object) {
				urlParams = new URLSearchParams(request)
			}
			
			if(!urlParams) {
				throw new TypeError(`Invalid request '${request}'`)
			}
			
			urlParams.sort()
			
			let cacheKey = urlParams.toString()
			let fileCacheKey = urlParams.toString()
			
			if(params?.format) {
				cacheKey += "@" + params.format
				fileCacheKey += "@" + params.format
			}
			
			const cachePromise = cache[cacheKey] = cache[cacheKey] || new Promise(cacheResolve => {
				const filePromise = fileCache[fileCacheKey] = fileCache[fileCacheKey] || new Promise((fileResolve, fileReject) => {
					RobloxApi.assetdelivery.requestAssetV2(urlParams, {
						format: params?.format,
						browserAssetRequest: params?.browserAssetRequest
					}).then(async json => {
						if(!json?.locations?.length) {
							fileReject(new Error(`Failed to download asset "${fileCacheKey}"`))
							return
						}
						
						const res = await fetch(json.locations[0].location)
						
						if(!res.ok) {
							fileReject(new Error(`Failed to download asset "${fileCacheKey}"`))
							return
						}
						
						fileResolve(await res.arrayBuffer())
					})
				})

				cacheResolve(filePromise.then(buffer => constructor(buffer, {request, params})))
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
		loadAnimation: createMethod((buffer, info) => {
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
			
			if(info.params?.async) {
				return RBXParser.parseModel(buffer, { async: true }).asyncPromise.then(model => RBXParser.parseAnimation(findSequence(model)))
			}
			
			return RBXParser.parseAnimation(findSequence(RBXParser.parseModel(buffer).result))
		}),
		loadModel: createMethod((buffer, info) => {
			if(info.params?.async) {
				return RBXParser.parseModel(buffer, { async: true }).asyncPromise
			}
			
			return RBXParser.parseModel(buffer).result
		}),
		loadMesh: createMethod(buffer => RBXParser.parseMesh(buffer)),
		loadImage: createMethod((buffer, info) => new Promise((resolve, reject) => {
			const src = URL.createObjectURL(new Blob([new Uint8Array(buffer)], { type: "image/png" }))
			
			const image = new Image()
			image.onerror = () => reject(new Error(`invalid image ${JSON.stringify(info)}`))
			image.onload = () => resolve(image)
			image.src = src
			
			if(image.complete) {
				resolve(image)
			}
		})),

		loadBuffer: createMethod(buffer => buffer),
		loadText: createMethod(buffer => bufferToString(buffer)),

		getHashUrl(hash) {
			let t = 31
			
			for(let n = 0; n < 32; n++) {
				t ^= hash.charCodeAt(n)
			}
			
			return `https://t${t % 8}.rbxcdn.com/${hash}`
		},
		toAssetUrl(id) {
			return `https://assetdelivery.roblox.com/v1/asset/?id=${+id}`
		},
		isValidAssetUrl(url) {
			return typeof url === "string" ? !!resolveAssetUrlParams(url) : false
		},
		resolveAssetId(url) {
			return typeof url === "string" ? resolveAssetUrlParams(url)?.get("id") : null
		}
	}
})()
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

	function resolveAssetUrl(url) {
		if(url.startsWith(resourcePrefixUrl)) {
			const resourcePath = url.slice(resourcePrefixUrl.length)
			const mappedAssetUrl = resourceToAsset[resourcePath]

			if(!mappedAssetUrl) {
				throw new Error(`Invalid Asset Url: '${url}'`)
			}

			url = mappedAssetUrl
		}

		try { new URL(url) }
		catch(ex) { throw new TypeError(`Invalid URL: '${String(url)}'`) }

		if(url.match(/https?:\/\/..\.rbxcdn\.com/)) {
			return url.replace(/^http:/, "https:")
		}

		const params = resolveAssetUrlParams(url)
		if(!params) {
			throw new Error(`Invalid Asset Url: '${url}'`)
		}

		params.sort() // not sure if sorting will affect functionality, but meh

		const paramString = params.toString()
		return `https://assetdelivery.roblox.com/v1/asset/?${paramString.toString()}`
	}

	function createMethod(constructor) {
		const cache = {}

		return (strict, url, cb) => {
			if(typeof strict !== "boolean") {
				cb = url
				url = strict
				strict = false
			}

			if(!strict && Number.isSafeInteger(+url)) {
				url = AssetCache.toAssetUrl(url)
			}

			const resolvedUrl = resolveAssetUrl(url)
			const cachePromise = cache[resolvedUrl] = cache[resolvedUrl] || new SyncPromise(cacheResolve => {
				const filePromise = fileCache[resolvedUrl] = fileCache[resolvedUrl] || new SyncPromise((fileResolve, fileReject) => {
					$.fetch(resolvedUrl, { credentials: "include" }).then(async resp => {
						if(resp.ok) {
							fileResolve(await resp.arrayBuffer())
						} else {
							fileReject(new Error(`Failed to download asset (${resp.status} ${resp.statusText})`))
						}
					})
				})

				cacheResolve(filePromise.then(constructor))
			}).catch(ex => console.error(ex))

			if(cb) {
				cachePromise.then(cb, () => cb(null))
			}

			return cachePromise
		}
	}

	return {
		loadAnimation: createMethod(buffer => RBXParser.parseAnimation(RBXParser.parseModel(buffer))),
		loadModel: createMethod(buffer => RBXParser.parseModel(buffer)),
		loadMesh: createMethod(buffer => RBXParser.parseMesh(buffer)),
		loadImage: createMethod(buffer => new SyncPromise(resolve => {
			const src = URL.createObjectURL(new Blob([new Uint8Array(buffer)], { type: "image/png" }))

			const image = new Image()
			image.src = src

			if(image.complete) {
				resolve(image)
			} else {
				image.addEventListener("load", () => {
					resolve(image)
				}, { once: true })
			}
		})),

		loadBuffer: createMethod(buffer => buffer),
		loadText: createMethod(buffer => bufferToString(buffer)),

		toAssetUrl(id) {
			return `https://assetdelivery.roblox.com/v1/asset/?id=${+id}`
		},

		resolveAssetId(url) {
			const params = resolveAssetUrlParams(url)

			if(params) {
				return params.get("id")
			}

			return null
		}
	}
})()
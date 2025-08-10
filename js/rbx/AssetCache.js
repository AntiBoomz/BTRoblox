"use strict"

const AssetCache = (() => {
	const resolveCache = {}
	const cdnCache = {}

	function resolveAssetUrlParams(request, strict=false) {
		let url = request.trim()
		
		if(url.startsWith("rbxassetid://")) {
			url = `https://www.roblox.com/asset/?id=${url.slice(13)}`
		} else if(url.startsWith("rbxhttp://")) {
			url = `https://www.roblox.com/${url.slice(10)}`
		}
		
		let urlParams
		let urlInfo
		
		try { urlInfo = new URL(url) }
		catch {}
		
		if(!urlInfo) {
			throw new TypeError(`Invalid request '${request}'`)
		}
		
		if(!/^https?:$/.test(urlInfo.protocol)) {
			throw new TypeError(`Invalid request '${request}'`)
		}
		
		if(urlInfo.hostname.startsWith("assetdelivery.")) {
			if(/^\/+v1\/+asset\/*$/i.test(urlInfo.pathname)) {
				urlParams = urlInfo.searchParams
			}
		} else {
			if(/^\/+asset\/*$/i.test(urlInfo.pathname)) {
				urlParams = urlInfo.searchParams
			}
		}
		
		if(!urlParams) {
			throw new TypeError(`Invalid request '${request}'`)
		}
		
		if(strict && urlParams.get("hash")) {
			throw new TypeError(`Invalid request '${request}': hash does not work in strict mode`)
		}

		return urlParams
	}
	
	function createMethod(constructor) {
		const methodCache = {}

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
			
			let resolvePromise
			
			if(!strict && typeof request === "string" && /^https?:\/\/[^\/]+\.rbxcdn\.com\/*[0-9a-fA-F]{32}/i.test(request)) {
				const assetRequest = {
					strict, request, params,
					cacheKey: request,
					location: request
				}
				
				resolvePromise = Promise.resolve(assetRequest)
				resolvePromise.assetRequest = assetRequest
			} else {
				resolvePromise = AssetCache.resolveAsset(strict, request, params)
			}
			
			const cacheKey = resolvePromise.assetRequest.cacheKey
			let methodPromise = methodCache[cacheKey]
			
			if(!methodPromise) {
				methodPromise = resolvePromise.then(assetRequest =>
					AssetCache.loadDirect(assetRequest.location, params)
						.then(buffer => constructor(buffer, assetRequest)),
				).catch(err => {
					console.error(err)
					return null
				})
				
				if(params?.cache !== false) {
					methodCache[cacheKey] = methodPromise
				}
			}
			
			if(typeof cb === "function") {
				methodPromise.then(cb)
			}
			
			return methodPromise
		}
	}

	return {
		resolveAsset: (strict, request, params) => {
			if(typeof strict !== "boolean") {
				params = request
				request = strict
				strict = false
			}
			
			let urlParams
			
			if(!strict && Number.isSafeInteger(+request)) {
				urlParams = new URLSearchParams({ id: request })
			} else if(!strict && request instanceof Object) {
				urlParams = new URLSearchParams(request)
			} else if(typeof request === "string") {
				urlParams = resolveAssetUrlParams(request, strict)
			}
			
			let cacheKey = urlParams.toString()
			
			if(params?.format) { cacheKey += "@f:" + params.format }
			if(params?.browserAssetRequest) { cacheKey += "@bar" }
			
			let resolvePromise = resolveCache[cacheKey]
				
			if(!resolvePromise) {
				const assetRequest = {
					strict, request, params, cacheKey,
					urlParams: urlParams.toString()
				}
				
				resolvePromise = RobloxApi.assetdelivery.requestAssetV2(urlParams, {
					format: params?.format,
					browserAssetRequest: params?.browserAssetRequest
				}).then(json => {
					if(!json?.locations?.length) {
						throw new Error(`Unable to download asset "${JSON.stringify(assetRequest)}"`)
					}
					
					assetRequest.location = json.locations[0].location
					assetRequest.assetTypeId = json.assetTypeId
					
					return assetRequest
				})
				
				resolvePromise.assetRequest = assetRequest
				
				if(params?.cache !== false) {
					resolveCache[cacheKey] = resolvePromise
				}
			}
			
			return resolvePromise
		},
		loadDirect: (cdnUrl, params) => {
			if(cdnCache[cdnUrl]) { return cdnCache[cdnUrl] }
			
			let cdnPromise = cdnCache[cdnUrl]
			
			if(!cdnPromise) {
				cdnPromise = fetch(cdnUrl).then(res => {
					if(!res.ok) {
						throw new Error(`Failed to download asset '${cdnUrl}'`)
					}
					
					return res.arrayBuffer()
				})
				
				if(params?.cache !== false) {
					cdnCache[cdnUrl] = cdnPromise
				}
			}
			
			return cdnPromise
		},
		
		loadAnimation: createMethod(async (buffer, assetRequest) => {
			await loadOptionalFeature("parser")
			
			const findSequence = array => {
				for(const inst of array) {
					if(inst.ClassName === "KeyframeSequence" || inst.ClassName === "CurveAnimation") {
						return inst
					}
					
					const sequence = findSequence(inst.Children)
					if(sequence) {
						return sequence
					}
				}
				
				return null
			}
			
			if(assetRequest.params?.async) {
				return RBXModelParser.parse(
					buffer, { async: true, onProgress: assetRequest.params?.onProgress }
				).promise.then(parser => RBXAnimationParser.parse(findSequence(parser.result)))
			}
			
			return RBXAnimationParser.parse(findSequence(RBXModelParser.parse(buffer).result))
		}),
		loadModel: createMethod(async (buffer, assetRequest) => {
			await loadOptionalFeature("parser")
			
			if(assetRequest.params?.async) {
				return RBXModelParser.parse(
					buffer, { async: true, onProgress: assetRequest.params?.onProgress }
				).promise.then(parser => parser.result)
			}
			
			return RBXModelParser.parse(buffer).result
		}),
		loadMesh: createMethod(async (buffer, assetRequest) => {
			await loadOptionalFeature("parser")
			return RBXMeshParser.parse(buffer)
		}),
		
		loadImage: createMethod((buffer, assetRequest) => new Promise((resolve, reject) => {
			const src = URL.createObjectURL(new Blob([new Uint8Array(buffer)], { type: "image/png" }))
			
			const image = new Image()
			image.onerror = () => reject(new Error(`invalid image ${JSON.stringify(assetRequest)}`))
			image.onload = () => resolve(image)
			image.src = src
			
			if(image.complete) {
				resolve(image)
			}
		})),
		loadBuffer: createMethod((buffer, assetRequest) => buffer),
		loadText: createMethod((buffer, assetRequest) => $.bufferToString(buffer)),

		getHashUrl(hash, prefix="c") {
			let code = 31
			
			for(let n = 0; n < hash.length; n++) {
				code ^= hash.charCodeAt(n)
			}
			
			return `https://${prefix}${code % 8}.rbxcdn.com/${hash}`
		},
		toAssetUrl(id) {
			return `https://assetdelivery.roblox.com/v1/asset/?id=${+id}`
		},
		isValidAssetUrl(url) {
			try { return resolveAssetUrlParams(url, true), true }
			catch {}
			
			return false
		},
		getAssetIdFromUrl(url) {
			try { return resolveAssetUrlParams(url, true).get("id") ?? null }
			catch {}
			
			return null
		}
	}
})()
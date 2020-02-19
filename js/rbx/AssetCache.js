// BTR-AssetCache.js

"use strict"

const AssetCache = (() => {
	const resolveCache = {}
	const fileCache = {}

	const prefixUrl = getURL("")

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

	function resolveAssetUrl(url, finished) {
		if(url.startsWith(prefixUrl)) {
			finished(url)
			return
		}

		if(url.match(/https?:\/\/..\.rbxcdn\.com/)) {
			finished(url.replace(/^http:/, "https:"))
			return
		}

		const params = resolveAssetUrlParams(url)
		if(!params) {
			throw new Error(`Invalid Asset Url: '${url}'`)
		}

		params.sort() // not sure if sorting will affect functionality, but meh

		const paramString = params.toString()
		const cached = resolveCache[paramString]
		if(cached) {
			if(cached instanceof SyncPromise) {
				cached.then(finished)
				return
			}

			finished(cached)
			return
		}

		finished(resolveCache[paramString] = `https://assetdelivery.roblox.com/v1/asset/?${paramString.toString()}`)
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

			try { new URL(url) }
			catch(ex) { throw new TypeError(`Invalid URL: '${String(url)}'`) }

			let cacheResult = cache[url]
			if(!cacheResult) {
				cacheResult = cache[url] = { finished: false }

				cacheResult.defer = new SyncPromise(cacheResolve => {
					resolveAssetUrl(url, resolvedUrl => {
						if(!resolvedUrl) {
							console.log("Failed to resolve", url)
							return
						}
	
						const resolvedCache = cache[resolvedUrl]
						if(resolvedCache && resolvedCache !== cacheResult) {
							if(resolvedCache.finished) {
								cacheResult.finished = true
								cacheResult.result = resolvedCache.result
								cacheResolve(cacheResult.result)
							} else {
								resolvedCache.then(cacheResolve)
							}

							cacheResult = cache[url] = resolvedCache
							return
						}
	
						let fileResult = fileCache[resolvedUrl]
						if(!fileResult) {
							fileResult = fileCache[resolvedUrl] = { finished: false }
							
							fileResult.defer = fetch(resolvedUrl, { credentials: "include" }).then(async resp => {
								fileResult.result = await resp.arrayBuffer()
								fileResult.finished = true
							})
						}
		
						const onFileDone = () => {
							try {
								const methodResult = constructor(fileResult.result)
			
								if(methodResult instanceof SyncPromise) {
									methodResult.then(result => {
										cacheResult.finished = true
										cacheResult.result = result
										cacheResolve(result)
									}, ex => {
										console.error("MethodResult Error", ex)
										cacheResult.finished = true
										cacheResult.result = null
										cacheResolve(null)
									})
								} else {
									cacheResult.finished = true
									cacheResult.result = methodResult
									cacheResolve(methodResult)
								}
							} catch(ex) {
								console.error(ex)
								console.log("Failed to load", url, "=>", resolvedUrl)
							}
						}
		
						if(fileResult.finished) {
							onFileDone()
						} else {
							fileResult.defer.then(onFileDone, ex => {
								console.error("FileResult Error", ex)
								cacheResult.finished = true
								cacheResult.result = null
								cacheResolve(null)
							})
						}
					})
				})
			}

			if(cb) {
				if(cacheResult.finished) {
					cb(cacheResult.result)
				} else {
					cacheResult.defer.then(cb)
				}
			}

			return cacheResult.defer
		}
	}

	return {
		loadAnimation: createMethod(buffer => new RBXParser.AnimationParser().parse(new RBXParser.ModelParser().parse(buffer))),
		loadModel: createMethod(buffer => new RBXParser.ModelParser().parse(buffer)),
		loadMesh: createMethod(buffer => new RBXParser.MeshParser().parse(buffer)),
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
		loadBlob: createMethod(buffer => new Blob([buffer], { type: "image/jpeg" })),
		loadText: createMethod(buffer => $.bufferToStr(buffer)),

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
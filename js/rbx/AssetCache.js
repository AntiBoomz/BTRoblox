// BTR-AssetCache.js

"use strict"

const AssetCache = (() => {
	const resolveCache = {}
	const fileCache = {}
	const resolveQueue = []
	let resolvePromise
	let xsrfToken

	const prefixUrl = getURL("")

	function resolveAssetUrlParams(url) {
		if(url.startsWith("rbxassetid://")) {
			url = `https://assetgame.roblox.com/asset/?id=${url.slice(13)}`
		} else if(url.startsWith("rbxhttp://")) {
			url = `https://www.roblox.com/${url.slice(10)}`
		}

		try {
			const urlInfo = new URL(url)
			if(!urlInfo.pathname.match(/^\/*asset\/*$/i)) {
				return null
			}

			return urlInfo.searchParams
		} catch(ex) { }

		return null
	}

	function resolveAssetUrl(url) {
		if(resolveCache[url]) {
			return resolveCache[url]
		}

		if(url.startsWith(prefixUrl)) {
			return resolveCache[url] = Promise.resolve(url)
		}

		const params = resolveAssetUrlParams(url)
		if(!params) {
			throw new Error(`Invalid Asset Url: '${url}'`)
		}

		const requestId = `${resolveQueue.length}`

		resolveQueue.push({
			requestId,
			assetId: params.has("id") ? params.get("id") : undefined,
			version: params.has("version") ? params.get("version") : undefined,
			assetVersionId: params.has("assetVersionId") ? params.get("assetVersionId") : undefined,
			hash: params.has("hash") ? params.get("hash") : undefined,
			userAssetId: params.has("userAssetId") ? params.get("userAssetId") : undefined
		})

		if(!resolvePromise) {
			resolvePromise = new Promise((resolve, reject) => {
				setTimeout(() => {
					if(!xsrfToken) {
						xsrfToken = getXsrfToken()
					}

					const resolveApiUrl = `https://assetdelivery.roblox.com/v1/assets/batch`
					const info = {
						method: "POST",
						credentials: "include",
						headers: {
							"Content-Type": "application/json",
							"Roblox-Place-Id": 0,
							"X-CSRF-TOKEN": xsrfToken
						},
						body: JSON.stringify(resolveQueue)
					}

					resolveQueue.splice(0, resolveQueue.length)
					resolvePromise = null

					let didRetry = false
					const tryFetch = () => fetch(resolveApiUrl, info).then(async resp => {
						if(resp.ok) {
							try { resolve(await resp.json()) }
							catch(ex) { console.error(ex) }
						} else {
							if(!didRetry && resp.statusText.includes("Token Validation Failed")) {
								xsrfToken = info.headers["X-CSRF-TOKEN"] = resp.headers.get("X-CSRF-TOKEN")
								didRetry = true
								return tryFetch()
							}

							console.error("resolveAssetUrl", resp.status, resp.statusText)
						}
						
						reject()
					})

					tryFetch()
				}, 0)
			})
		}

		return resolveCache[url] = resolvePromise.then(json => {
			const data = json.find(x => x.requestId === requestId)

			if(data && data.location) {
				return data.location.replace(/^http:/, "https:")
			}

			return Promise.reject()
		})
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

			let methodPromise = cache[url]
			if(!methodPromise) {
				let filePromise = fileCache[url]
				if(!filePromise) {
					filePromise = fileCache[url] = resolveAssetUrl(url).then(async resolvedUrl => {
						const resp = await fetch(resolvedUrl)

						if(IS_EDGE) {
							const blob = await resp.blob()
							const reader = new FileReader()
							reader.readAsBinaryString(blob)
							
							return new Promise(res => reader.addEventListener("load", () => {
								res($.strToBuffer(reader.result))
							}, { once: true }))
						}

						return resp.arrayBuffer()
					})
				}

				methodPromise = cache[url] = filePromise.then(constructor)
				methodPromise.catch(ex => console.error("MethodPromise Error", ex))
			}

			if(cb) { methodPromise.then(cb, () => cb(null)) }

			return methodPromise
		}
	}

	return {
		loadAnimation: createMethod(buffer => new RBXParser.AnimationParser().parse(new RBXParser.ModelParser().parse(buffer))),
		loadModel: createMethod(buffer => new RBXParser.ModelParser().parse(buffer)),
		loadMesh: createMethod(buffer => new RBXParser.MeshParser().parse(buffer)),
		loadImage: createMethod(buffer => URL.createObjectURL(new Blob([new Uint8Array(buffer)], { type: "image/png" }))),

		loadBuffer: createMethod(buffer => buffer),
		loadBlob: createMethod(buffer => new Blob([buffer], { type: "image/jpeg" })),
		loadText: createMethod(buffer => $.bufferToStr(buffer)),

		toAssetUrl(id) {
			return `https://assetgame.roblox.com/asset/?id=${+id}`
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
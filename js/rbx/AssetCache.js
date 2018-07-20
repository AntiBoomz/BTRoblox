// BTR-AssetCache.js

"use strict"

const AssetCache = (() => {
	const resolveCache = {}
	const fileCache = {}

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

			let entries = urlInfo.searchParams.entries()
			if(IS_FIREFOX) { entries = entries.wrappedJSObject }
			return Array.from(entries)
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

		return resolveCache[url] = new Promise(resolve =>
			MESSAGING.send("resolveAssetUrl", params, result => {
				if(result.state !== "SUCCESS") {
					console.error("resolveAssetUrl:", result, url)
					return resolve(null)
				}

				resolve(result.url)
			})
		)
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
		loadImage: createMethod(buffer => URL.createObjectURL(new Blob([new Uint8Array(buffer)]))),

		loadBuffer: createMethod(buffer => buffer),
		loadBlob: createMethod(buffer => new Blob([buffer], { type: "image/jpeg" })),
		loadText: createMethod(buffer => $.bufferToStr(buffer)),

		toAssetUrl(id) {
			return `https://assetgame.roblox.com/asset/?id=${+id}`
		},
		resolveAssetId(url) {
			const params = resolveAssetUrlParams(url)

			if(params) {
				for(let i = 0; i < params.length; i++) {
					const [name, value] = params[i]
					if(name.toLowerCase() === "id") {
						return value
					}
				}
			}

			return null
		}
	}
})()
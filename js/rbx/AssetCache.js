// BTR-AssetCache.js

"use strict"

const AssetCache = (() => {
	const resolveCache = {}
	const fileCache = {}

	const prefixUrl = getURL("")

	function resolveAssetUrl(url) {
		if(url.startsWith(prefixUrl)) {
			return Promise.resolve(url)
		}

		url = RBXParser.resolveAssetUrl(url)
		return new Promise(resolve => MESSAGING.send("resolveAssetUrl", url, result => {
			if(result.state !== "SUCCESS") {
				console.error("resolveAssetUrl:", result)
				return resolve(null)
			}

			const urlInfo = new URL(result.url)

			if(urlInfo.hostname.search(/^[ct]\d\.rbxcdn\.com$/) === -1) {
				throw new Error(`Invalid asset url '${result.url}'`)
			}

			if(urlInfo.protocol === "http:") { urlInfo.protocol = "https:" }
			resolve(urlInfo.href)
		}))
	}

	function createMethod(constructor) {
		const cache = {}

		return (url, cb) => {
			if(Number.isSafeInteger(+url)) {
				url = `https://assetgame.roblox.com/asset/?id=${+url}`
			}

			let methodPromise = cache[url]
			if(!methodPromise) {
				let filePromise = fileCache[url]
				if(!filePromise) {
					let resolvePromise = resolveCache[url]
					if(!resolvePromise) {
						resolvePromise = resolveCache[url] = resolveAssetUrl(url)
					}

					filePromise = fileCache[url] = resolvePromise.then(async resolvedUrl => {
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

			methodPromise.then(cb, () => cb(null))
		}
	}

	return {
		loadAnimation: createMethod(buffer => new RBXParser.AnimationParser().parse(new RBXParser.ModelParser().parse(buffer))),
		loadModel: createMethod(buffer => new RBXParser.ModelParser().parse(buffer)),
		loadMesh: createMethod(buffer => new RBXParser.MeshParser().parse(buffer)),
		loadImage: createMethod(buffer => URL.createObjectURL(new Blob([new Uint8Array(buffer)]))),

		loadBuffer: createMethod(buffer => buffer),
		loadBlob: createMethod(buffer => new Blob([buffer])),
		loadText: createMethod(buffer => $.bufferToStr(buffer))
	}
})()
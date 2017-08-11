// BTR-AssetCache.js

"use strict"

const AssetCache = (() => {
	const resolveCache = {}
	const assetCache = {}
	const fetchParams = { credentials: "include" }

	function resolvePath(path, cb) {
		if(typeof path === "string" && isNaN(path)) {
			return cb(path);
		}

		return AssetCache.resolveAsset(path, cb)
	}

	function createMethod(constructor) {
		const cache = {}

		return (path, cb) => {
			resolvePath(path, url => {
				if(!url) return console.warn("Failed to resolve model " + path);
				let promise = cache[url]

				if(!promise) {
					promise = cache[url] = new Promise(resolve => {
						let filePromise = assetCache[url]
						if(!filePromise) filePromise = assetCache[url] = fetch(url, fetchParams).then(response => response.arrayBuffer());

						filePromise.then(buffer => {
							constructor(buffer).then(resolve).catch(err => {
								resolve(null)
								console.error("[AssetCache]", path, err)
							})
						})
					})
				}

				promise.then(cb)
			})
		}
	}

	return {
		resolveAsset(argId, cb) {
			const assetId = +argId
			if(isNaN(assetId)) throw new TypeError("number expected as assetId");

			let promise = resolveCache[assetId]
			if(!promise) {
				promise = resolveCache[assetId] = new Promise(resolve => {
					BackgroundJS.send("resolveAssetUrl", assetId, url => {
						if(!url) return console.warn("Failed to resolve asset ", assetId);
						resolve(url)
					})
				})
			}

			promise.then(cb)
		},

		loadModel: createMethod(async buffer => ANTI.ParseRBXM(buffer)),
		loadMesh: createMethod(async buffer => ANTI.ParseMesh(buffer)),
		loadImage: createMethod(async buffer => URL.createObjectURL(new Blob([buffer]))),

		loadBuffer: createMethod(async buffer => buffer),
		loadBlob: createMethod(async buffer => new Blob([buffer])),
		loadText: createMethod(async buffer => new TextDecoder().decode(buffer))
	}
})();
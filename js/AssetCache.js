// BTR-AssetCache.js
"use strict"

var AssetCache = (() => {
	var resolveCache = {}
	var modelCache = {}
	var meshCache = {}
	var textCache = {}
	var imgCache = {}

	var request = function(url, responseType, cb) {
		var xhr = new XMLHttpRequest()
		xhr.open("GET", url, true)
		xhr.responseType = responseType

		xhr.addEventListener("load", () => {
			var result = xhr.response
			xhr = null
			cb(result)
		}, { once: true })

		xhr.send(null)
	}

	function resolvePath(path, cb) {
		if(typeof(path) === "string" && isNaN(path)) {
			return cb(path);
		}

		return AssetCache.resolveAsset(path, cb)
	}

	function createMethod(cache, responseType, constructor) {
		return (path, cb) => {
			resolvePath(path, resolved => {
				if(!resolved)
					return console.warn("Failed to resolve model " + path);

				var promise = cache[resolved]
				if(!promise) {
					promise = cache[resolved] = new Promise(resolve => {
						request(resolved, responseType, x => {
							try { constructor(x, resolve) }
							catch(ex) { resolve(null); console.error("[AssetCache]", path, ex) }
						})
					})
				}

				promise.then(cb)
			})
		}
	}

	var AssetCache = {
		resolveAsset: (assetId, cb) => {
			if(typeof(assetId) === "string")
				assetId = +assetId;

			if(typeof(assetId) !== "number" || isNaN(assetId))
				throw new Error("assetId should be a number (it's a " + typeof(assetId) + ")" + assetId);

			var promise = resolveCache[assetId]
			if(!promise) {
				promise = resolveCache[assetId] = new Promise(resolve => {
					BackgroundJS.send("resolveAssetUrl", assetId, url => {
						if(!url)
							return console.warn("Failed to resolve asset " + assetId);
						resolve(url)
					})
				})
			}

			promise.then(cb)
		},

		loadModel: createMethod(modelCache, "arraybuffer", (buffer, cb) => cb(ANTI.ParseRBXM(buffer))),
		loadMesh: createMethod(meshCache, "arraybuffer", (buffer, cb) => cb(ANTI.ParseMesh(buffer))),
		loadText: createMethod(textCache, "text", (text, cb) => cb(text)),
		loadImage: createMethod(imgCache, "blob", (blob, cb) => cb(URL.createObjectURL(blob)))
	}

	return AssetCache
})();
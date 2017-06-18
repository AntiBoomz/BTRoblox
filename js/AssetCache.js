// BTR-AssetCache.js
"use strict"

var AssetCache = (() => {
	var resolveCache = {}
	var assetCache = {}

	function download(url, cb) {
		var xhr = new XMLHttpRequest()
		xhr.open("GET", url, true)
		xhr.responseType = "arraybuffer"
		xhr.onload = () => cb(xhr.response)
		xhr.send(null)
	}

	function resolvePath(path, cb) {
		if(typeof(path) === "string" && isNaN(path)) {
			return cb(path);
		}

		return AssetCache.resolveAsset(path, cb)
	}

	function createMethod(constructor) {
		var cache = {}

		return (path, cb) => {
			resolvePath(path, url => {
				if(!url) return console.warn("Failed to resolve model " + path);

				var promise = cache[url]
				if(!promise) {
					promise = cache[url] = new Promise(resolve => {
						var filePromise = assetCache[url]
						if(!filePromise) filePromise = assetCache[url] = new Promise(resolve => download(url, resolve));

						filePromise.then(buffer => {
							try { constructor(buffer, resolve) }
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
						if(!url) return console.warn("Failed to resolve asset " + assetId);
						resolve(url)
					})
				})
			}

			promise.then(cb)
		},

		loadModel: createMethod((buffer, cb) => cb( ANTI.ParseRBXM(buffer) )),
		loadMesh: createMethod((buffer, cb) => cb( ANTI.ParseMesh(buffer) )),
		loadImage: createMethod((buffer, cb) => cb( URL.createObjectURL( new Blob([buffer]) ) )),

		loadBuffer: createMethod((buffer, cb) => cb( buffer )),
		loadBlob: createMethod((buffer, cb) => cb( new Blob([buffer]) )),
		loadText: createMethod((buffer, cb) => cb( new TextDecoder().decode(buffer) ))
	}

	return AssetCache
})();
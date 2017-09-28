// BTR-AssetCache.js

"use strict"

const AssetCache = (() => {
	const assetCache = {}

	function createMethod(constructor) {
		const cache = {}

		return (url, cb) => {
			if(typeof url !== "string" || !isNaN(url)) url = `https://www.roblox.com/asset/?id=${url}`;

			let promise = cache[url]
			if(!promise) {
				let assetPromise = assetCache[url]
				if(!assetPromise) assetPromise = assetCache[url] = downloadFile(url);

				promise = cache[url] = assetPromise.then(buffer => constructor(buffer))
				promise.catch(ex => console.error("Failed to load asset", url, ex))
			}

			promise.then(cb, () => cb(null))
		}
	}

	return {
		loadModel: createMethod(buffer => new RBXParser.ModelParser().parse(buffer)),
		loadMesh: createMethod(buffer => new RBXParser.MeshParser().parse(buffer)),
		loadImage: createMethod(buffer => URL.createObjectURL(new Blob([buffer]))),

		loadBuffer: createMethod(buffer => buffer),
		loadBlob: createMethod(buffer => new Blob([buffer])),
		loadText: createMethod(buffer => new TextDecoder().decode(buffer))
	}
})();
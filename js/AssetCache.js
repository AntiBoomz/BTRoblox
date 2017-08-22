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
				promise.catch(ex => console.error("[AssetCache]", url, ex))
			}

			promise.then(cb).catch(() => cb(null))
		}
	}

	return {
		loadModel: createMethod(async buffer => ANTI.ParseRBXM(buffer)),
		loadMesh: createMethod(async buffer => ANTI.ParseMesh(buffer)),
		loadImage: createMethod(async buffer => URL.createObjectURL(new Blob([buffer]))),

		loadBuffer: createMethod(async buffer => buffer),
		loadBlob: createMethod(async buffer => new Blob([buffer])),
		loadText: createMethod(async buffer => new TextDecoder().decode(buffer))
	}
})();
// BTR-AssetCache.js
"use strict"

var AssetCache = (() => {
	var resolveCache = {}
	var modelCache = {}
	var meshCache = {}
	var textCache = {}
	var imgCache = {}

	function request(url, responseType, cb) {
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
				if(!promise)
					promise = cache[resolved] = new Promise(resolve => request(resolved, responseType, x => constructor(x, resolve)));

				promise.then(cb)
			})
		}
	}

	var bufferbase64=function(){
		var a="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
		return function(b){
			for(var c=b.length,d=c%3,e=[],f=0,g=c-d;f<g;f+=3){
				var h=(b[f]<<16)+(b[f+1]<<8)+b[f+2];
				e.push(a[h>>18&63],a[h>>12&63],a[h>>6&63],a[63&h])
			}
			if(1===d){
				var h=b[c-1];
				e.push(a[h>>2],a[h<<4&63],"==")
			}else if(2===d){
				var h=(b[c-2]<<8)+b[c-1];
				e.push(a[h>>10],a[h>>4&63],a[h<<2&63],"=")
			}
			return e.join("")
		}
	}();

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

						//console.warn("Resolved " + assetId + " => " + url)
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
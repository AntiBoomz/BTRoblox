// BTR-RBXScene-AssetCache.js
"use strict"

ANTI.RBXScene.AssetCache = (function() {
	function Asset(buffer) {
		this._buffer = buffer
	}

	Object.assign(Asset.prototype, {
		as: function(type) {
			switch(type.toLowerCase()) {
				case "model":
					if(this._model)
						return this._model;

					return this._model = ANTI.ParseRBXM(this._buffer);
				case "mesh":
					if(this._mesh)
						return this._mesh;

					return this._mesh = ANTI.ParseMesh(this._buffer);
				case "bloburl":
					if(this._bloburl)
						return this._bloburl;

					if(!this._blob)
						this._blob = new Blob([this._buffer]);

					return this._bloburl = URL.createObjectURL(this._blob);
				default:
					throw new TypeError("Invalid type '" + type + "'");
			}
		}
	})

	var AssetCache = {
		Asset: Asset,
		_assetCache: {},
		_urlCache: {},
		loadUrl: function(path, cb) {
			if(!this._urlCache[path]) {
				this._urlCache[path] = new Promise(resolve => {
					var xhr = new XMLHttpRequest()
					xhr.open("GET", path, true)
					xhr.responseType = "arraybuffer"
					xhr.onload = () => {
						if(xhr.status === 200 || xhr.status === 0) {
							resolve(new Asset(xhr.response))
						}
					}
					xhr.send()
				})
			}

			this._urlCache[path].then(cb)
		},
		loadAsset: function(assetId, cb) {
			if(typeof(assetId) !== "number")
				throw new TypeError("assetId needs to be a number");

			if(!this._assetCache[assetId]) {
				this._assetCache[assetId] = new Promise(resolve => {
					downloadAsset("arraybuffer", { id: assetId }, (buffer) => resolve(new Asset(buffer)))
				})
			}

			this._assetCache[assetId].then(cb)
		}
	}

	return AssetCache
})();
"use strict"

const optionalLibraries = {
	previewer: {
		promise: null,
		assets: [
			"lib/three.min.js",
			"js/rbx/EventEmitter.js",
			"js/rbx/Avatar/Animator.js",
			"js/rbx/Avatar/AvatarRigs.js",
			"js/rbx/Avatar/Composites.js",
			"js/rbx/Avatar/Avatar.js",
			"js/rbx/Avatar/Appearance.js",
			"js/rbx/Scene.js",
			"js/rbx/Preview.js"
		]
	},
	explorer: {
		promise: null,
		assets: [
			"js/rbx/ApiDump.js",
			"js/rbx/Explorer.js"
		]
	},
	sourceViewer: {
		promise: null,
		assets: [
			"js/feat/sourceViewer.js",
			"css/sourceviewer.css"
		]
	},
	settingsModal: {
		promise: null,
		assets: [
			"js/feat/settingsModal.js",
			"css/settingsmodal.css"
		]
	}
}

function loadOptionalLibrary(name) {
	const lib = optionalLibraries[name]

	if(!lib.promise) {
		const jsAssets = lib.assets.filter(file => file.endsWith(".js"))
		const cssAssets = lib.assets.filter(file => file.endsWith(".css"))
		
		if(IS_DEV_MODE) {
			const index = jsAssets.indexOf("lib/three.min.js")
			if(index !== -1) {
				jsAssets[index] = "dev/three.js"
			}
		}
		
		if(cssAssets.length) {
			injectCSS(...cssAssets)
		}

		if(jsAssets.length) {
			lib.promise = new SyncPromise(resolve => MESSAGING.send("loadOptAssets", jsAssets, resolve))
		} else {
			lib.promise = SyncPromise.resolve()
		}
	}

	return lib.promise
}
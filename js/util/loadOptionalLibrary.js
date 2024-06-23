"use strict"

const optionalLibraries = {
	previewer: {
		assets: [
			"lib/three.min.js",
			"js/rbx/EventEmitter.js",
			"js/rbx/Avatar/Animator.js",
			"js/rbx/Avatar/AvatarRigs.js",
			"js/rbx/Avatar/Composites.js",
			"js/rbx/Avatar/Avatar.js",
			"js/rbx/Scene.js",
			"js/rbx/Preview.js"
		]
	},
	explorer: {
		assets: [
			"js/rbx/ApiDump.js",
			"js/rbx/Explorer.js"
		]
	},
	sourceViewer: {
		assets: [
			"js/feat/sourceViewer.js",
			"css/sourceviewer.css"
		]
	},
	parser: {
		assets: [
			"js/rbx/Parser/ByteReader.js",
			"js/rbx/Parser/ModelParser.js",
			"js/rbx/Parser/MeshParser.js",
			"js/rbx/Parser/AnimationParser.js"
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
			lib.promise = new Promise(resolve => MESSAGING.send("loadScripts", jsAssets, resolve))
		} else {
			lib.promise = Promise.resolve()
		}
	}

	return lib.promise
}
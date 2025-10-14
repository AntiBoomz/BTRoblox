"use strict"

const optionalFeatures = {
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
			"js/feat/sourceviewer.js",
			"css/sourceviewer.css"
		]
	},
	parser: {
		assets: [
			"js/rbx/Parser/ByteReader.js",
			"js/rbx/Parser/ModelParser.js",
			"js/rbx/Parser/DracoBitstream.js",
			"js/rbx/Parser/MeshParser.js",
			"js/rbx/Parser/AnimationParser.js"
		]
	}
}

function loadOptionalFeature(name) {
	const feat = optionalFeatures[name]

	if(!feat.promise) {
		const cssAssets = feat.assets.filter(file => file.endsWith(".css"))
		
		if(cssAssets.length) {
			insertCSS(...cssAssets)
		}

		feat.promise = new Promise(resolve => backgroundScript.send("loadFeature", name, resolve))
	}

	return feat.promise
}

if(IS_BACKGROUND_PAGE) {
	contentScript.listen({
		loadFeature(name, respond, port) {
			const feat = optionalFeatures[name]
			
			const scripts = feat.assets.filter(file => file.endsWith(".js"))
			
			if(IS_DEV_MODE) {
				const index = scripts.indexOf("lib/three.min.js")
				if(index !== -1) {
					scripts[index] = "dev/three.js"
				}
			}
			
			chrome.scripting.executeScript({
				target: { tabId: port.sender.tab.id, frameIds: [port.sender.frameId] },
				files: scripts
			}, () => respond())
		},
	})
}
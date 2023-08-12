"use strict"

const activeStyleSheets = {}
const reloadingStyleSheets = {}

const startReloadingCSS = (path, skipFirst) => {
	if(reloadingStyleSheets[path]) { return }
	
	const styleSheet = activeStyleSheets[path]
	if(!styleSheet) { return }
	
	const key = Date.now()
	reloadingStyleSheets[path] = key
	
	let lastCssText
	
	setInterval(async () => {
		if(reloadingStyleSheets[path] !== key) { return }
		if(document.visibilityState === "hidden") { return }
		if(!chrome.runtime?.id) { return } // Stop if extension context is invalidated
		
		const newUrl = `${getURL(path)}?_=${Date.now()}`
		
		const res = await fetch(newUrl)
		const cssText = await res.text()
		
		if(reloadingStyleSheets[path] !== key) { return }
		
		if(lastCssText !== cssText && (lastCssText || !skipFirst)) {
			styleSheet.href = newUrl
		}
		
		lastCssText = cssText
	}, 2000)
}

const injectCSS = (...paths) => {
	for(const path of paths) {
		if(activeStyleSheets[path]) { continue }
		
		const styleSheet = document.createElement("link")
		styleSheet.href = SETTINGS.get("general.themeHotReload") ? `${getURL(path)}?_=${Date.now()}` : getURL(path)
		styleSheet.rel = "stylesheet"
		
		BTRoblox.element.append(styleSheet)
		
		activeStyleSheets[path] = styleSheet
		
		if(SETTINGS.get("general.themeHotReload")) {
			startReloadingCSS(path, true)
		}
	}
}

const removeCSS = (...paths) => {
	for(const path of paths) {
		const styleSheet = activeStyleSheets[path]
		if(!styleSheet) { continue }
		
		styleSheet.remove()
		delete activeStyleSheets[path]
		delete reloadingStyleSheets[path]
	}
}

SETTINGS.onChange("general.themeHotReload", () => {
	if(SETTINGS.get("general.themeHotReload")) {
		for(const path of Object.keys(activeStyleSheets)) {
			startReloadingCSS(path)
		}
	} else {
		for(const path of Object.keys(activeStyleSheets)) {
			delete reloadingStyleSheets[path]
		}
	}
})
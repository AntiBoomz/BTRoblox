"use strict"

const isValidPage = (() => {
	if(document.contentType !== "text/html" || location.protocol === "blob") {
		return false
	}
	
	if(document.documentElement.dataset.btrLoaded) {
		return false
	}
	
	document.documentElement.dataset.btrLoaded = true
	return true
})()

if(isValidPage) {
	SETTINGS.load(() => {
		const currentPage = BTRoblox.currentPage
		
		InjectJS.inject([
			SETTINGS.serialize(),
			currentPage ? currentPage.name : null,
			currentPage ? currentPage.matches : null,
			IS_DEV_MODE
		], INJECT_SCRIPT)
		
		btrThemes.init()
		
		try { pageInit.common() }
		finally {}
	
		if(currentPage && pageInit[currentPage.name]) {
			try { pageInit[currentPage.name].apply(null, currentPage.matches) }
			catch(ex) { console.error(ex) }
		}
	})
	
	SHARED_DATA.start()
}
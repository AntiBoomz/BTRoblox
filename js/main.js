"use strict"

if(document.contentType === "text/html" && location.protocol !== "blob" && !document.querySelector("btroblox")) {
	document.documentElement.prepend(BTRoblox.element)
	
	SETTINGS.load(() => {
		const currentPage = BTRoblox.currentPage
		
		InjectJS.inject([
			SETTINGS.serialize(),
			currentPage ? { name: currentPage.name, matches: currentPage.matches } : null,
			IS_DEV_MODE
		], INJECT_SCRIPT)
		
		btrThemes.init()
		
		try { pageInit.common() }
		catch(ex) { console.error(ex) }
	
		if(currentPage && pageInit[currentPage.name]) {
			try { pageInit[currentPage.name].apply(null, currentPage.matches) }
			catch(ex) { console.error(ex) }
		}
	})
	
	SHARED_DATA.start()
}
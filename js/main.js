"use strict"

function InitBTRoblox() {
	if(document.contentType !== "text/html" || window.location.protocol === "blob") {
		return
	}
	
	const exclude = EXCLUDED_PAGES.some(patt => new RegExp(patt, "i").test(window.location.pathname))
	if(exclude) {
		return
	}

	if(document.documentElement.dataset.btrLoaded) {
		return
	}

	document.documentElement.dataset.btrLoaded = true

	InjectJS.init()
	btrThemes.init()
	
	if(currentPage && pageInit[`${currentPage.name}_pre`]) {
		try { pageInit[`${currentPage.name}_pre`].apply(currentPage, currentPage.matches) }
		catch(ex) { console.error(ex) }
	}

	SETTINGS.load(() => {
		InjectJS.onSettingsLoaded() // Intentionally done here for order of operations

		try { pageInit.common() }
		catch(ex) { console.error(ex) }
	
		if(currentPage && pageInit[currentPage.name]) {
			try { pageInit[currentPage.name].apply(currentPage, currentPage.matches) }
			catch(ex) { console.error(ex) }
		}
	})
}

InitBTRoblox()
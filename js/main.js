"use strict"

const currentPage = (() => {
	for(const [name, page] of Object.entries(PAGE_INFO)) {
		for(const pattern of page.matches) {
			const matches = location.pathname.match(new RegExp(pattern, "i"))
			if(matches) {
				return { ...page, name, matches: matches.slice(1) }
			}
		}
	}

	return null
})()

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
		InjectJS.inject([
			SETTINGS.serialize(),
			currentPage ? currentPage.name : null,
			currentPage ? currentPage.matches : null,
			IS_DEV_MODE
		], INJECT_SCRIPT)
		
		btrThemes.init()
		
		if(currentPage && pageInit[`${currentPage.name}_pre`]) {
			try { pageInit[`${currentPage.name}_pre`].apply(currentPage, currentPage.matches) }
			catch(ex) { console.error(ex) }
		}
		
		try { pageInit.common() }
		catch(ex) { console.error(ex) }
	
		if(currentPage && pageInit[currentPage.name]) {
			try { pageInit[currentPage.name].apply(currentPage, currentPage.matches) }
			catch(ex) { console.error(ex) }
		}
	})
	
	SHARED_DATA.start()
}
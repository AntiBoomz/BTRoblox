"use strict"

if(isValidPage) {
	InjectJS.init(INJECT_SCRIPT, [
		currentPage ? currentPage.name : null,
		currentPage ? currentPage.matches : null,
		IS_DEV_MODE
	])
	
	btrThemes.init()
	
	if(currentPage && pageInit[`${currentPage.name}_pre`]) {
		try { pageInit[`${currentPage.name}_pre`].apply(currentPage, currentPage.matches) }
		catch(ex) { console.error(ex) }
	}
	
	SETTINGS.load(() => {
		InjectJS.send("init", SETTINGS.serialize())
			
		try { pageInit.common() }
		catch(ex) { console.error(ex) }
	
		if(currentPage && pageInit[currentPage.name]) {
			try { pageInit[currentPage.name].apply(currentPage, currentPage.matches) }
			catch(ex) { console.error(ex) }
		}
	})
}
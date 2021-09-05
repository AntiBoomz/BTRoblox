"use strict"

if(IS_VALID_PAGE) {
	btrThemes.init()
	
	if(currentPage && pageInit[`${currentPage.name}_pre`]) {
		try { pageInit[`${currentPage.name}_pre`].apply(currentPage, currentPage.matches) }
		catch(ex) { console.error(ex) }
	}

	SETTINGS.load(() => {
		InjectJS.send(
			"INIT",
			SETTINGS.serialize(),
			currentPage ? currentPage.name : null,
			currentPage ? currentPage.matches : null,
			IS_DEV_MODE
		)

		try { pageInit.common() }
		catch(ex) { console.error(ex) }
	
		if(currentPage && pageInit[currentPage.name]) {
			try { pageInit[currentPage.name].apply(currentPage, currentPage.matches) }
			catch(ex) { console.error(ex) }
		}
	})
}
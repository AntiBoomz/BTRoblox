"use strict"

areAllContentScriptsLoaded = true

if(currentPage && pageInit[`${currentPage.name}_pre`]) {
	try { pageInit[`${currentPage.name}_pre`].apply(currentPage, currentPage.matches) }
	catch(ex) { console.error(ex) }
}

if(isInitDeferred) {
	Init()
}
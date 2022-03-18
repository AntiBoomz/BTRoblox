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
		InjectJS.init([
			SETTINGS.serialize(),
			currentPage ? currentPage.name : null,
			currentPage ? currentPage.matches : null,
			IS_DEV_MODE
		])
		
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
		
		//
		
		if(IS_CHROME) {
			MESSAGING.send("hasPermissions", hasPermissions => {
				if(!hasPermissions) {
					document.$watch("#header", header => {
						const thing = html`<div style="display:block;position:absolute;left:0;width:100%;height:24px;background:red;color:white;cursor:pointer">BTRoblox is unable to access Roblox APIs. Click to fix</div>`
						header.after(thing)
						
						thing.$on("click", () => {
							MESSAGING.send("requestPermissions", () => {
								location.reload()
							})
						})
					})
				}
			})
		}
	})
	
	SHARED_DATA.start()
}
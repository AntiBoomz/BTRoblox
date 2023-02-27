"use strict"

if(document.contentType === "text/html" && location.protocol !== "blob") {
	if((IS_CHROME || document.readyState === "loading") && !document.querySelector("btroblox")) {
		document.documentElement.prepend(BTRoblox.element)
		
		SETTINGS.load(() => {
			const currentPage = BTRoblox.currentPage
			
			InjectJS.inject([
				SETTINGS.serialize(),
				currentPage ? { name: currentPage.name, matches: currentPage.matches } : null,
				IS_DEV_MODE
			], INJECT_SCRIPT)
			
			btrThemes.init()
			
			if(location.host === "create.roblox.com") {
				try { pageInit.create() }
				catch(ex) { console.error(ex) }
			} else {
				try { pageInit.common() }
				catch(ex) { console.error(ex) }
			}
		
			if(currentPage && pageInit[currentPage.name]) {
				try { pageInit[currentPage.name].apply(null, currentPage.matches) }
				catch(ex) { console.error(ex) }
			}
		})
		
		SHARED_DATA.initContentScript()
	}
	
	MESSAGING.send("checkPermissions", hasPermissions => {
		if(!hasPermissions) {
			const oldBanner = $("#btr-permission-banner")
			if(oldBanner) { oldBanner.remove() }
			
			const alert = html`
			<div id=btr-permission-banner style="position:fixed;width:100%;height:24px;left:0;top:40px;background:red;color:white;cursor:pointer;z-index:100000;text-align:center;user-select:none;">
				BTRoblox needs some permissions to work properly. Click here or click the extension button to fix the issue.
			</div>`
			
			document.$watch(">body").$then(body => body.append(alert))
			
			if(IS_CHROME) {
				alert.$on("click", () => {
					MESSAGING.send("requestPermissions", wasGranted => {
						if(wasGranted) {
							location.pathname = location.pathname
						}
					})
				})
			} else {
				alert.textContent = `BTRoblox needs some permissions to work properly. Click the extension button to fix the issue.`
				alert.style.cursor = ""
			}
		}
	})
}
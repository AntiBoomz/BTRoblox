"use strict"

if(document.contentType === "text/html" && location.protocol !== "blob") {
	if((IS_CHROME || document.readyState === "loading") && !document.querySelector("btroblox")) {
		document.documentElement.prepend(BTRoblox.element)
		
		SETTINGS.load(() => {
			InjectJS.inject(
				INJECT_SCRIPT,
				SETTINGS.serialize(),
				IS_DEV_MODE,
				RobuxToCash.getSelectedOption()
			)
			
			btrThemes.init()
			
			if(location.host === "create.roblox.com") {
				try { pageInit.create() }
				catch(ex) { console.error(ex) }
			} else {
				try { pageInit.common() }
				catch(ex) { console.error(ex) }
			}
			
			const initialized = {}
			
			const updateCurrentPage = initial => {
				const previousPage = BTRoblox.currentPage
				const currentPage = getCurrentPage()
				
				BTRoblox.currentPage = currentPage
				InjectJS.send("setCurrentPage", currentPage ? { name: currentPage.name, matches: currentPage.matches } : null)
				
				if(previousPage?.name !== currentPage?.name || initial) {
					btrThemes.update()
				}
				
				if(previousPage) {
					if(pageReset[previousPage.name]) {
						for(const fn of pageReset[previousPage.name]) {
							try { fn.apply(null, previousPage.matches) }
							catch(ex) { console.error(ex) }
						}
					}
				}
				
				if(currentPage) {
					if(!initialized[currentPage.name]) {
						initialized[currentPage.name] = true
						
						if(pageInit[currentPage.name]) {
							try { pageInit[currentPage.name]() }
							catch(ex) { console.error(ex) }
						}
					}
					
					if(pageLoad[currentPage.name]) {
						for(const fn of pageLoad[currentPage.name]) {
							try { fn.apply(null, currentPage.matches) }
							catch(ex) { console.error(ex) }
						}
					}
				}
				
				return currentPage
			}
			
			updateCurrentPage(true)
			
			if(location.host !== "create.roblox.com") {
				document.$watch("#content", content => {
					const marker = html`<div id=btr-detect-content style=display:none></div>`
					content.append(marker)
					
					new MutationObserver(() => {
						if(!marker.parentNode) {
							content.append(marker)
							updateCurrentPage()
						}
					}).observe(content, { childList: true })
				})
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
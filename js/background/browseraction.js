"use strict"

{
	chrome.browserAction.onClicked.addListener(tab => {
		// Firefox doesn't seem to have any way to check if tab has host access
		// So let's just call executeScript and open new tab if that fails /shrug
		
		chrome.tabs.executeScript(
			tab.id,
			{ code: `(() => { if(typeof toggleSettingsModal === "function") { SETTINGS.load(() => toggleSettingsModal(true)); return true } })()`, runAt: "document_start" },
			result => {
				if(chrome.runtime.lastError || !result || !result[0]) {
					chrome.tabs.create({ url: "https://www.roblox.com/home?btr_settings_open=true" })
				}
			}
		)
	})
}
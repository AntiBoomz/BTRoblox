"use strict"

{
	chrome.runtime.onInstalled.addListener(() => {
		chrome.browserAction.onClicked.addListener(tab => {
			if(tab.url) {
				chrome.tabs.executeScript(
					tab.id,
					{ code: `(() => { if(typeof ToggleSettingsDiv === "function") { ToggleSettingsDiv(true); return true } })()`, runAt: "document_start" },
					([result]) => {
						if(!result) {
							chrome.tabs.create({ url: "https://www.roblox.com/home?btr_settings_open=true" })
						}
					}
				)
			} else {
				chrome.tabs.create({ url: "https://www.roblox.com/home?btr_settings_open=true" })
			}
		})
	})
}
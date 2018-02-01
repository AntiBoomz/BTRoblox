"use strict"

{
	const assetUrlPatterns = [
		"*://www.roblox.com/*-item?id=*",
		"*://www.roblox.com/catalog/*",
		"*://www.roblox.com/library/*"
	]

	function copyToClipboard(text) {
		const onCopy = ev => {
			ev.clipboardData.setData("text/plain", text)
			ev.preventDefault()
		}

		document.addEventListener("copy", onCopy, { once: true })
		document.execCommand("Copy", false, null)
	}

	function onContextMenuClick(info) {
		const menuId = info.menuItemId
		if(menuId === "assetPage" || menuId === "assetLink") {
			const url = (menuId === "assetPage" ? info.pageUrl : info.linkUrl)
			const assetId = url.replace(/^.*(?:[&?]id=|\/(?:catalog|library)\/)(\d+).*$/, "$1")

			copyToClipboard(assetId)
		}
	}

	chrome.contextMenus.onClicked.addListener(onContextMenuClick)
	chrome.runtime.onInstalled.addListener(() => {
		chrome.contextMenus.create({
			id: "assetLink",
			title: "Copy asset id",
			contexts: ["link"],
			targetUrlPatterns: assetUrlPatterns
		})

		chrome.contextMenus.create({
			id: "assetPage",
			title: "Copy page asset id",
			contexts: ["page"],
			documentUrlPatterns: assetUrlPatterns
		})
	})
}
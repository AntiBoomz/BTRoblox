"use strict"

{
	const assetUrlPatterns = [
		"*://*.roblox.com/*-item?*id=*",
		"*://*.roblox.com/catalog/*",
		"*://*.roblox.com/library/*",
		"*://*.roblox.com/badges/*",
		"*://*.roblox.com/game-pass/*"
	]

	const placeUrlPatterns = [
		"*://*.roblox.com/games/*",
		"*://*.roblox.com/refer?*PlaceId=*"
	]

	const userUrlPatterns = [
		"*://*.roblox.com/users/*/profile*"
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
		if(menuId === "assetLink") {
			const assetId = info.linkUrl.replace(/^.*(?:[&?]id=|\/(?:catalog|library|badges|game-pass)\/)(\d+).*$/i, "$1")
			copyToClipboard(assetId)
		} else if(menuId === "placeLink") {
			const placeId = info.linkUrl.replace(/^.*(?:[&?]placeid=|\/games\/)(\d+).*$/i, "$1")
			copyToClipboard(placeId)
		} else if(menuId === "userLink") {
			const userId = info.linkUrl.replace(/^.*(?:\/users\/)(\d+).*$/i, "$1")
			copyToClipboard(userId)
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
			id: "placeLink",
			title: "Copy place id",
			contexts: ["link"],
			targetUrlPatterns: placeUrlPatterns
		})

		chrome.contextMenus.create({
			id: "userLink",
			title: "Copy user id",
			contexts: ["link"],
			targetUrlPatterns: userUrlPatterns
		})
	})
}
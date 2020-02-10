"use strict"

{
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
		if(menuId === "assetLink" || menuId === "bundleLink" || menuId === "badgeLink" || menuId === "gamepassLink" || menuId === "pluginLink") {
			const assetId = info.linkUrl.replace(/^.*(?:[&?]id=|\/(?:catalog|library|bundles|badges|game-pass|plugins)\/)(\d+).*$/i, "$1")
			copyToClipboard(assetId)
		} else if(menuId === "placeLink") {
			const placeId = info.linkUrl.replace(/^.*(?:[&?]placeid=|\/games\/)(\d+).*$/i, "$1")
			copyToClipboard(placeId)
		} else if(menuId === "userLink") {
			const userId = info.linkUrl.replace(/^.*(?:\/users\/)(\d+).*$/i, "$1")
			copyToClipboard(userId)
		} else if(menuId === "groupLink") {
			const groupId = info.linkUrl.replace(/^.*(?:groups?.aspx.*[?&]gid=|\/groups\/)(\d+).*$/i, "$1")
			copyToClipboard(groupId)
		} else if(menuId === "universeLink") {
			const universeId = info.linkUrl.replace(/^.*(?:[&?]id=)(\d+).*$/i, "$1")
			copyToClipboard(universeId)
		}
	}

	const contextMenus = [
		{
			id: "assetLink",
			title: "Copy asset id",
			contexts: ["link"],
			targetUrlPatterns: [
				"*://*.roblox.com/*-item?*id=*",
				"*://*.roblox.com/catalog/*/*",
				"*://*.roblox.com/library/*/*",
				"*://*.roblox.com/My/Item.aspx*ID=*"
			]
		},
		{
			id: "bundleLink",
			title: "Copy bundle id",
			contexts: ["link"],
			targetUrlPatterns: [
				"*://*.roblox.com/bundles/*/*"
			]
		},
		{
			id: "badgeLink",
			title: "Copy badge id",
			contexts: ["link"],
			targetUrlPatterns: [
				"*://*.roblox.com/badges/*/*"
			]
		},
		{
			id: "pluginLink",
			title: "Copy plugin id",
			contexts: ["link"],
			targetUrlPatterns: [
				"*://*.roblox.com/plugins/*/*"
			]
		},
		{
			id: "gamepassLink",
			title: "Copy game pass id",
			contexts: ["link"],
			targetUrlPatterns: [
				"*://*.roblox.com/game-pass/*/*"
			]
		},
		{
			id: "groupLink",
			title: "Copy group id",
			contexts: ["link"],
			targetUrlPatterns: [
				"*://*.roblox.com/*roup.aspx*gid=*",
				"*://*.roblox.com/*roups.aspx*gid=*",
				"*://*.roblox.com/groups/*/*"
			]
		},
		{
			id: "placeLink",
			title: "Copy place id",
			contexts: ["link"],
			targetUrlPatterns: [
				"*://*.roblox.com/games/*/*",
				"*://*.roblox.com/refer?*PlaceId=*",
				"*://*.roblox.com/games/refer?*PlaceId=*"
			]
		},
		{
			id: "universeLink",
			title: "Copy universe id",
			contexts: ["link"],
			targetUrlPatterns: [
				"*://*.roblox.com/universes/*id=*"
			]
		},
		{
			id: "userLink",
			title: "Copy user id",
			contexts: ["link"],
			targetUrlPatterns: [
				"*://*.roblox.com/users/*/*"
			]
		}
	]

	function toggleContextMenus() {
		if(SETTINGS.get("general.enableContextMenus")) {
			contextMenus.forEach(menu => {
				chrome.contextMenus.update(menu.id, { visible: true })
			})
		} else {
			contextMenus.forEach(menu => {
				chrome.contextMenus.update(menu.id, { visible: false })
			})
		}
	}

	chrome.contextMenus.onClicked.addListener(onContextMenuClick)
	chrome.runtime.onInstalled.addListener(() => {
		contextMenus.forEach(menu => {
			menu.visible = false
			chrome.contextMenus.create(menu)
		})

		SETTINGS.load(toggleContextMenus)
	})

	SETTINGS.onChange("general.enableContextMenus", toggleContextMenus)
}
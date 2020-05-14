"use strict"

{
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
		},
		{
			id: "roleParent",
			title: "Copy role...",
			contexts: ["link"],
			targetUrlPatterns: [
				"*://*.roblox.com/btr_context/*btr_roleRank=*"
			]
		},
		{
			id: "roleRank",
			title: "Copy role rank",
			contexts: ["link"],
			parentId: "roleParent",
			targetUrlPatterns: [
				"*://*.roblox.com/btr_context/*btr_roleRank=*"
			]
		},
		{
			id: "roleId",
			title: "Copy role id",
			contexts: ["link"],
			parentId: "roleParent",
			targetUrlPatterns: [
				"*://*.roblox.com/btr_context/*btr_roleId=*"
			]
		}
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

		switch(menuId) {
		case "assetLink": case "bundleLink": case "badgeLink": case "gamepassLink": case "pluginLink": {
			const assetId = info.linkUrl.replace(/^.*(?:[&?]id=|\/(?:catalog|library|bundles|badges|game-pass|plugins)\/)(\d+).*$/i, "$1")
			copyToClipboard(assetId)
			break
		}
		case "placeLink": {
			const placeId = info.linkUrl.replace(/^.*(?:[&?]placeid=|\/games\/)(\d+).*$/i, "$1")
			copyToClipboard(placeId)
			break
		}
		case "userLink": {
			const userId = info.linkUrl.replace(/^.*(?:\/users\/)(\d+).*$/i, "$1")
			copyToClipboard(userId)
			break
		}
		case "groupLink": {
			const groupId = info.linkUrl.replace(/^.*(?:groups?.aspx.*[?&]gid=|\/groups\/)(\d+).*$/i, "$1")
			copyToClipboard(groupId)
			break
		}
		case "universeLink": {
			const universeId = info.linkUrl.replace(/^.*(?:[&?]id=)(\d+).*$/i, "$1")
			copyToClipboard(universeId)
			break
		}
		case "roleId": {
			const roleId = info.linkUrl.replace(/^.*(?:[&?]btr_roleId=)(\d+).*$/i, "$1")
			copyToClipboard(roleId)
			break
		}
		case "roleRank": {
			const rankId = info.linkUrl.replace(/^.*(?:[&?]btr_roleRank=)(\d+).*$/i, "$1")
			copyToClipboard(rankId)
			break
		}
		}
	}

	function updateContextMenus() {
		const enabled = SETTINGS.get("general.enableContextMenus")

		contextMenus.forEach(menu => {
			menu.visible = enabled

			chrome.contextMenus.create(menu, () => {
				if(chrome.runtime.lastError) {
					chrome.contextMenus.update(menu.id, { visible: enabled }, () => {
						const err = chrome.runtime.lastError
						if(err) {
							console.error(`Failed to update contextMenu item ${menu.id}: ${err.message}`)
						}
					})
				}
			})
		})
	}

	chrome.contextMenus.onClicked.addListener(onContextMenuClick)
	chrome.runtime.onInstalled.addListener(() => SETTINGS.load(() => chrome.contextMenus.removeAll(updateContextMenus)))

	SETTINGS.onChange("general.enableContextMenus", updateContextMenus)
	SETTINGS.load(updateContextMenus)
}
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
			const groupId = info.linkUrl.replace(/^.*(?:groups?.aspx.*[?&]gid=(\d+)).*$/i, "$1")
			copyToClipboard(groupId)
		} else if(menuId === "universeLink") {
			const universeId = info.linkUrl.replace(/^.*(?:[&?]id=)(\d+).*$/i, "$1")
			copyToClipboard(universeId)
		}
	}

	chrome.contextMenus.onClicked.addListener(onContextMenuClick)
	chrome.runtime.onInstalled.addListener(() => {
		chrome.contextMenus.create({
			id: "assetLink",
			title: "Copy asset id",
			contexts: ["link"],
			targetUrlPatterns: [
				"*://*.roblox.com/*-item?*id=*",
				"*://*.roblox.com/catalog/*/*",
				"*://*.roblox.com/library/*/*",
				"*://*.roblox.com/My/Item.aspx*ID=*"
			]
		})

		chrome.contextMenus.create({
			id: "bundleLink",
			title: "Copy bundle id",
			contexts: ["link"],
			targetUrlPatterns: [
				"*://*.roblox.com/bundles/*/*"
			]
		})

		chrome.contextMenus.create({
			id: "badgeLink",
			title: "Copy badge id",
			contexts: ["link"],
			targetUrlPatterns: [
				"*://*.roblox.com/badges/*/*"
			]
		})

		chrome.contextMenus.create({
			id: "pluginLink",
			title: "Copy plugin id",
			contexts: ["link"],
			targetUrlPatterns: [
				"*://*.roblox.com/plugins/*/*"
			]
		})

		chrome.contextMenus.create({
			id: "gamepassLink",
			title: "Copy game pass id",
			contexts: ["link"],
			targetUrlPatterns: [
				"*://*.roblox.com/game-pass/*/*"
			]
		})

		chrome.contextMenus.create({
			id: "groupLink",
			title: "Copy group id",
			contexts: ["link"],
			targetUrlPatterns: [
				"*://*.roblox.com/*roup.aspx*gid=*",
				"*://*.roblox.com/*roups.aspx*gid=*"
			]
		})

		chrome.contextMenus.create({
			id: "placeLink",
			title: "Copy place id",
			contexts: ["link"],
			targetUrlPatterns: [
				"*://*.roblox.com/games/*/*",
				"*://*.roblox.com/refer?*PlaceId=*",
				"*://*.roblox.com/games/refer?*PlaceId=*"
			]
		})

		chrome.contextMenus.create({
			id: "universeLink",
			title: "Copy universe id",
			contexts: ["link"],
			targetUrlPatterns: [
				"*://*.roblox.com/universes/*id=*",
			]
		})

		chrome.contextMenus.create({
			id: "userLink",
			title: "Copy user id",
			contexts: ["link"],
			targetUrlPatterns: [
				"*://*.roblox.com/users/*/*"
			]
		})
	})
}
"use strict"

const IS_MANIFEST_V3 = chrome.runtime.getManifest().manifest_version === 3
const IS_FIREFOX = !!chrome.runtime.getManifest().browser_specific_settings?.gecko
const IS_CHROME = !IS_FIREFOX

const IS_BACKGROUND_PAGE = !self.window || chrome.extension?.getBackgroundPage?.() === self.window
const IS_CONTENT_SCRIPT = !IS_BACKGROUND_PAGE
const IS_DEV_MODE = chrome.runtime.getManifest().short_name === "BTRoblox_DEV"

const STORAGE = chrome.storage.local
const getURL = chrome.runtime.getURL

const THROW_DEV_WARNING = errorString => {
	console.warn(errorString)

	if(IS_DEV_MODE) {
		alert(errorString)
	}
}

const PAGE_INFO = {
	avatar: {
		matches: ["^/my/avatar"],
		js: ["pages/avatar.js"],
		css: ["avatar.css"]
	},
	catalog: {
		matches: ["^/catalog/?$"],
		js: ["pages/avatar.js"],
		css: ["catalog.css"]
	},
	develop: {
		matches: ["^/develop"],
		js: ["pages/develop.js"],
		css: ["develop.css"]
	},
	friends: {
		matches: ["^/users/(\\d+)/friends", "^/users/friends"],
		js: ["pages/friends.js"],
		css: []
	},
	gamedetails: {
		matches: ["^/games/(\\d+)/"],
		js: ["pages/gamedetails.js"],
		css: ["gamedetails.css"]
	},
	games: {
		matches: ["^/(games|discover)/?$"],
		js: [],
		css: ["games.css"]
	},
	groups: {
		matches: ["^/groups/(\\d+)/*"],
		js: ["pages/groups.js"],
		css: ["groups.css"]
	},
	groupadmin: {
		matches: ["^/groups/configure$"],
		js: ["pages/groupadmin.js"],
		css: []
	},
	home: {
		matches: ["^/home"],
		js: ["pages/home.js"],
		css: ["home.css"]
	},
	inventory: {
		matches: ["^/users/(\\d+)/inventory"],
		js: ["pages/inventory.js"],
		css: ["inventory.css"]
	},
	itemdetails: {
		matches: ["^/(catalog|library|game-pass|badges|bundles)/(\\d+)/"],
		js: ["pages/itemdetails.js"],
		css: ["itemdetails.css"]
	},
	marketplace: {
		domainMatches: ["create.roblox.com"],
		matches: ["^/marketplace/"],
		js: ["pages/marketplace.js"],
		css: ["marketplace.css"]
	},
	membership: {
		matches: ["^/premium/membership"],
		js: [],
		css: []
	},
	messages: {
		matches: ["^/my/messages"],
		js: ["pages/messages.js"],
		css: ["messages.css"]
	},
	money: {
		matches: ["^/transactions"],
		js: ["pages/money.js"],
		css: ["money.css"]
	},
	placeconfig: {
		matches: ["^/places/(\\d+)/update"],
		js: ["pages/placeconfig.js"],
		css: ["placeconfig.css"]
	},
	profile: {
		matches: ["^/users/(\\d+)/profile"],
		js: ["pages/profile.js"],
		css: ["profile.css"]
	},
	universeconfig: {
		matches: ["^/universes/configure"],
		js: [],
		css: ["universeconfig.css"]
	}
}

if(IS_CONTENT_SCRIPT) {
	const currentPage = (() => {
		for(const [name, page] of Object.entries(PAGE_INFO)) {
			const domainMatches = page.domainMatches ?? ["www.roblox.com", "web.roblox.com"]
			if(!domainMatches.includes(location.hostname)) {
				continue
			}
			
			for(const pattern of page.matches) {
				const matches = location.pathname.match(new RegExp(pattern, "i"))
				if(matches) {
					return { ...page, name, matches: matches.slice(1) }
				}
			}
		}
	
		return null
	})()
	
	const btrElement = document.createElement("btroblox")
	const btrStyle = document.createElement("style")
	btrStyle.type = "text/css"
	btrStyle.textContent = "btroblox {display:none!important;}"
	btrElement.append(btrStyle)
	
	window.BTRoblox = {
		element: btrElement,
		currentPage
	}
}
"use strict"

const PAGE_INFO = {
	avatar: {
		matches: ["^/my/avatar"],
		css: ["avatar.css"]
	},
	catalog: {
		matches: ["^/catalog/$"],
		css: ["catalog.css"]
	},
	configureplace: {
		matches: ["^/places/(\\d+)/update"],
		css: ["placeconfig.css"]
	},
	configureuniverse: {
		matches: ["^/universes/configure"],
		css: ["universeconfig.css"]
	},
	develop: {
		matches: ["^/develop"],
		css: ["develop.css"]
	},
	forum: {
		matches: ["^/forum/"],
		css: ["forum.css"]
	},
	gamedetails: {
		matches: ["^/games/(\\d+)/"],
		css: ["gamedetails.css"]
	},
	games: {
		matches: ["^/games/?$"],
		css: ["games.css"]
	},
	groups: {
		matches: ["^/my/groups\\.aspx", "^/groups/group\\.aspx"],
		css: ["groups.css"]
	},
	groupadmin: {
		matches: ["^/my/groupadmin.aspx"],
		css: []
	},
	groupaudit: {
		matches: ["^/groups/audit\\.aspx"],
		css: []
	},
	home: {
		matches: ["^/home"],
		css: ["home.css"]
	},
	inventory: {
		matches: ["^/users/(\\d+)/inventory"],
		css: ["inventory.css"]
	},
	itemdetails: {
		matches: ["^/catalog/(\\d+)/", "^/library/(\\d+)/"],
		css: ["itemdetails.css"]
	},
	messages: {
		matches: ["^/my/messages"],
		css: ["messages.css"]
	},
	money: {
		matches: ["^/my/money"],
		css: ["money.css"]
	},
	profile: {
		matches: ["^/users/(\\d+)/profile"],
		css: ["profile.css"]
	}
}

const GET_PAGE = function(path) {
	for(const name in PAGE_INFO) {
		const page = PAGE_INFO[name]
		for(let i = 0; i < page.matches.length; i++) {
			const matches = path.match(page.matches[i])
			if(matches) return { name, matches: matches.slice(1) };
		}
	}

	return null
}

const DEFAULT_SETTINGS = {
	general: {
		theme: "default",
		showBlogFeed: true,

		showAds: false,
		noHamburger: true,

		chatEnabled: true
	},
	catalog: {
		enabled: true
	},
	itemdetails: {
		enabled: true,
		animationPreview: true,
		animationPreviewAutoLoad: true,
		explorerButton: true,
		downloadButton: true,
		contentButton: true
	},
	chat: {
		enabled: true
	},
	gamedetails: {
		enabled: true,
		showBadgeOwned: true
	},
	groups: {
		enabled: true,
		shoutAlerts: true
	},
	inventory: {
		enabled: true,
		inventoryTools: true
	},
	profile: {
		enabled: true,
		embedInventoryEnabled: true
	},
	versionhistory: {
		enabled: true
	},
	universeconfig: {
		enabled: false
	}
}
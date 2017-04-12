"use strict"

var settings = {
	general: {
		theme: "default",
		showBlogFeed: true,

		showAds: false,
		noHamburger: true,

		chatEnabled: true,
		draggableAssets: true
	},
	character: {
		enabled: true
	},
	versionhistory: {
		enabled: true
	},
	catalog: {
		animationPreview: true,
		explorerButton: false
	},
	chat: {
		enabled: true,
	},
	groups: {
		enabled: true,
		shoutAlerts: true,
	},
	profile: {
		enabled: true,
		embedInventoryEnabled: true
	},
	inventory: {
		inventoryTools: true
	},
	gamedetails: {
		enabled: true,
		showBadgeOwned: true,
	}
}

var pages = {
	home: {
		matches: ["/home"],
		css: ["home.css"]
	},
	character: {
		matches: ["/my/character\\.aspx"],
		css: ["character.css"]
	},
	groups: {
		matches: ["/my/groups\\.aspx","/groups/group\\.aspx"],
		css: ["groups.css"]
	},
	groupaudit: {
		matches: ["/groups/audit\\.aspx"],
		css: []
	},
	groupadmin: {
		matches: ["/my/groupadmin.aspx"],
		css: []
	},
	forum: {
		matches: ["/forum/"],
		css: ["forum.css"]
	},
	money: {
		matches: ["/my/money"],
		css: ["money.css"]
	},
	profile: {
		matches: ["/users/(\\d+)/profile"],
		css: ["profile.css"]
	},
	inventory: {
		matches: ["/users/(\\d+)/inventory"],
		css: ["inventory.css"]
	},
	games: {
		matches: ["/games/?$"],
		css: ["games.css"]
	},
	gamedetails: {
		matches: ["/games/(\\d+)/"],
		css: ["gamedetails.css"]
	},
	configureplace: {
		matches: ["/places/(\\d+)/update"],
		css: ["placeconfig.css"]
	},
	messages: {
		matches: ["/my/messages"],
		css: ["messages.css"]
	},
	develop: {
		matches: ["/develop"],
		css: ["develop.css"]
	},
	catalog: {
		matches: ["/catalog/$"],
		css: []
	},
	itemdetails: {
		matches: ["/catalog/(\\d+)/","/library/(\\d+)/"],
		css: ["itemdetails.css"]
	}
}


var settingsLoaded = false
var extensionDirectory = null
var extensionDirectoryPromise = new Promise(resolve => {
	chrome.runtime.getPackageDirectoryEntry((rootEntry) => {
		function recurse(dirEntry, parent, callback) {
			dirEntry.createReader().readEntries((array) => {
				var dirCount = 0
				var finished = false
				array.forEach((entry) => {
					if(entry.isDirectory) {
						var dir = parent[entry.name] = {}
						dirCount++
						recurse(entry, dir, callback ? (() => {
							if(--dirCount === 0 && finished) {
								callback(parent)
							}
						}) : null)
					} else if(entry.isFile) {
						parent[entry.name] = true
					}
				})
				finished = true
				if(callback && dirCount === 0) {
					callback(parent)
				}
			})
		}

		recurse(rootEntry, {}, (data) => {
			extensionDirectory = data
			resolve(data)
		})
	})
})
var commands = {}
var clients = []
var settingsLoadedListeners = []
var settingsChangedListeners = []


var ContentJS = {
	broadcast: function(action, data) {
		clients.forEach((port) => {
			port.postMessage({ action: action, data: data })
		})
	}
}


function addSettingsLoadedListener(fn) { settingsLoaded? fn() : settingsLoadedListeners.push(fn) }
function addSettingsChangedListener(fn) { settingsChangedListeners.push(fn) }

function applySettings(data, initialLoad) {
	var changedSomething = false

	function recurse(par, obj) {
		for(var i in obj) {
			var oldVal = par[i]
			var newVal = obj[i]
			if(oldVal != null) {
				if(oldVal instanceof Object) {
					recurse(oldVal, newVal)
				} else if(typeof(oldVal) === typeof(newVal) && oldVal !== newVal) {
					changedSomething = true
					par[i] = newVal
				}
			}
		}
	}

	recurse(settings, data)

	if(initialLoad) {
		settingsLoadedListeners.forEach(fn => fn())
	}

	if(changedSomething) {
		chrome.storage.local.set({ settings: settings })
		settingsChangedListeners.forEach(fn => fn())
	}
}


extensionDirectoryPromise.then((dir) => {
	Object.keys(dir.js.background).forEach((filePath) => {
		var script = document.createElement("script")
		script.src = "js/background/" + filePath
		document.body.appendChild(script)
	})
})

chrome.runtime.onConnect.addListener((port) => {
	if(port.name === "contentScript") {
		clients.push(port)
		port.onDisconnect.addListener(() => clients.splice(clients.indexOf(port), 1))
	}

	port.onMessage.addListener((msg) => {
		var respond = (response) => port.postMessage({ action: "_response_" + msg.uid, data: response });

		if(commands[msg.action])
			commands[msg.action](msg.data, respond, port);
	})
})

chrome.storage.local.get(["settings"], (data) => {
	settingsLoaded = true
	applySettings(data.settings, true)
})
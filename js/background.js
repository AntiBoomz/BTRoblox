"use strict"

const settings = {
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
		animationPreview: true,
		animationPreviewAutoLoad: true,
		explorerButton: false
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
		inventoryTools: true
	},
	profile: {
		enabled: true,
		embedInventoryEnabled: true
	},
	versionhistory: {
		enabled: true
	}
}


const pages = {
	avatar: {
		matches: ["/my/avatar"],
		css: ["avatar.css"]
	},
	catalog: {
		matches: ["/catalog/$"],
		css: ["catalog.css"]
	},
	configureplace: {
		matches: ["/places/(\\d+)/update"],
		css: ["placeconfig.css"]
	},
	develop: {
		matches: ["/develop"],
		css: ["develop.css"]
	},
	forum: {
		matches: ["/forum/"],
		css: ["forum.css"]
	},
	gamedetails: {
		matches: ["/games/(\\d+)/"],
		css: ["gamedetails.css"]
	},
	games: {
		matches: ["/games/?$"],
		css: ["games.css"]
	},
	groups: {
		matches: ["/my/groups\\.aspx", "/groups/group\\.aspx"],
		css: ["groups.css"]
	},
	groupadmin: {
		matches: ["/my/groupadmin.aspx"],
		css: []
	},
	groupaudit: {
		matches: ["/groups/audit\\.aspx"],
		css: []
	},
	home: {
		matches: ["/home"],
		css: ["home.css"]
	},
	inventory: {
		matches: ["/users/(\\d+)/inventory"],
		css: ["inventory.css"]
	},
	itemdetails: {
		matches: ["/catalog/(\\d+)/", "/library/(\\d+)/"],
		css: ["itemdetails.css"]
	},
	messages: {
		matches: ["/my/messages"],
		css: ["messages.css"]
	},
	money: {
		matches: ["/my/money"],
		css: ["money.css"]
	},
	profile: {
		matches: ["/users/(\\d+)/profile"],
		css: ["profile.css"]
	}
}

const skipPages = [
	"^/login/fulfillconstraint.aspx",
	"^/build/upload",
	"^/userads/",
	"^/user-sponsorship/",
	"^/Feeds/GetUserFeed"
]

const commands = {}
const clients = []
const settingsLoadedListeners = []
const settingsChangedListeners = []
let settingsLoaded = false
let extensionDirectory = null


const extensionDirectoryPromise = new Promise(resolve => {
	chrome.runtime.getPackageDirectoryEntry(rootEntry => {
		function recurse(dirEntry, parent, callback) {
			dirEntry.createReader().readEntries(array => {
				let dirCount = 0
				let finished = false

				array.forEach(entry => {
					if(entry.isDirectory) {
						const dir = parent[entry.name] = {}
						dirCount++

						recurse(entry, dir, callback ? (() => {
							if(--dirCount === 0 && finished) callback(parent);
						}) : null)
					} else if(entry.isFile) {
						parent[entry.name] = true
					}
				})
				finished = true
				if(callback && dirCount === 0) callback(parent);
			})
		}

		recurse(rootEntry, {}, data => {
			extensionDirectory = data
			resolve(data)
		})
	})
})

const ContentJS = {
	broadcast(action, data) {
		clients.forEach(port => port.postMessage({ action, data }))
	}
}


function addSettingsLoadedListener(fn) {
	if(settingsLoaded) fn();
	else settingsLoadedListeners.push(fn);
}

function addSettingsChangedListener(fn) {
	settingsChangedListeners.push(fn)
}

function applySettings(data, initialLoad) {
	let changedSomething = false

	function recurse(par, obj) {
		Object.keys(obj).forEach(index => {
			const oldVal = par[index]
			const newVal = obj[index]

			if(oldVal) {
				if(oldVal instanceof Object) {
					recurse(oldVal, newVal)
				} else if(typeof oldVal === typeof newVal && oldVal !== newVal) {
					changedSomething = true
					par[index] = newVal
				}
			}
		})
	}

	if(initialLoad) {
		const mirror = {
			catalog: {
				animationPreview: "itemdetails.animationPreview",
				animationPreviewAutoLoad: "itemdetails.animationPreviewAutoLoad",
				explorerButton: "itemdetails.explorerButton"
			}
		}

		const recurseMirror = (par, tar) => {
			Object.keys(par).forEach(name => {
				if(name in tar) {
					if(tar[name] instanceof Object && par[name] instanceof Object) {
						recurseMirror(par[name], tar[name])
					} else {
						const path = par[name].split(".")
						const prop = path.pop()

						let dest = data
						if(path.every(i => !!(dest = dest[i])) && !(prop in dest)) {
							dest[prop] = tar[name]
							delete tar[name]
						}
					}
				}
			})
		}

		recurseMirror(mirror, data)
	}

	recurse(settings, data)

	if(initialLoad) settingsLoadedListeners.forEach(fn => fn());

	if(changedSomething) {
		chrome.storage.local.set({ settings })
		settingsChangedListeners.forEach(fn => fn())
	}
}

chrome.runtime.onConnect.addListener(port => {
	if(port.name === "contentScript") {
		clients.push(port)
		port.onDisconnect.addListener(() => clients.splice(clients.indexOf(port), 1))
	}

	let isPortAlive = true
	port.onDisconnect.addListener(() => { isPortAlive = false })

	port.onMessage.addListener(msg => {
		const respond = response => {
			if(isPortAlive) {
				port.postMessage({ action: `_response_${msg.uid}`, data: response })
			}
		}

		const command = commands[msg.action]
		if(command) command(msg.data, respond, port);
	})
})

chrome.storage.local.get(["settings"], data => {
	settingsLoaded = true
	applySettings(data.settings, true)
})
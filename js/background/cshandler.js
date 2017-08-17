"use strict"

const SKIP_PAGES = [
	"^/login/fulfillconstraint.aspx",
	"^/build/upload",
	"^/userads/",
	"^/user-sponsorship/",
	"^/Feeds/GetUserFeed"
]

const PAGE_INFO = Object.entries({
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
})

const cssCache = (() => {
	try {
		return JSON.parse(localStorage.cssCache)
	} catch(ex) { return {} }
})();

const ContentJS = (() => {
	const listenersByType = {}
	const ports = {}

	chrome.runtime.onConnect.addListener(port => {
		if(port.name !== "BackgroundJS.connect") return port.disconnect();

		ports[port.sender] = port
		port.onDisconnect.addListener(() => delete ports[port.sender])
	})

	chrome.runtime.onMessage.addListener((msg, sender, respond) => {
		const port = ports[sender]
		const listeners = listenersByType[msg.type]

		console.assert(port)

		if(listeners) {
			for(let i = 0; i < listeners.length; i++) {
				const [callback, once] = listeners[i]
				const result = callback(msg.data, respond, port)
				if(once) listeners.splice(i--, 1);
				if(result === true) return true;
			}
		}
	})

	return {
		send(type, data, callback) {
			if(typeof data === "function") {
				callback = data
				data = null
			}

			console.warn("ContentJS.send is not implemented")
			// chrome.runtime.sendMessage({ type, data }, callback)
		},
		listen(typeList, callback, once) {
			typeList.split(" ").forEach(type => {
				if(!listenersByType[type]) listenersByType[type] = [];
				listenersByType[type].push([callback, once])
			})
		}
	}
})();


Object.entries(
	{
		getSettings(data, respond) {
			Settings.get().then(settings => {
				respond(settings)
			})
			return true
		},
		setSetting(data, respond) {
			Settings.set(data)
			return false
		},
		resolveAssetUrl(data, respond) {
			let url = "http://www.roblox.com/asset/?"

			if(typeof data === "object") url += new URLSearchParams(data).toString();
			else url += "id=" + data;

			const xhr = new XMLHttpRequest()
			xhr.open("GET", url, true)
			xhr.addEventListener("readystatechange", function() {
				if(this.status === 200 && this.responseURL.indexOf("rbxcdn") !== -1) {
					respond(this.responseURL.replace(/^http:/, "https:"))
				} else {
					respond(null)
				}

				this.abort()
			}, { once: true })
			xhr.send(null)

			return true
		},
		getRankName(data, respond) {
			const url = `https://www.roblox.com/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRole&playerid=${data.userId}&groupid=${data.groupId}`
			fetch(url).then(async resp => respond(await resp.text()))
			return true
		},
		_execScripts(list, respond, port) {
			const promises = list.map(path => new Promise(resolve => {
				chrome.tabs.executeScript(port.sender.tab.id, { file: path, runAt: "document_start", frameId: port.sender.frameId }, resolve)
			}))

			Promise.all(promises).then(respond)
			return true
		}
	}
).forEach(([key, value]) => ContentJS.listen(key, value));


function csInit(path, respond, port) {
	if(SKIP_PAGES.find(regex => path.search(regex) !== -1)) return;

	let pageInfo
	let currentPage

	PAGE_INFO.some(([name, info]) => {
		return info.matches.some(regex => {
			const matches = path.match(regex)
			if(matches) {
				pageInfo = info
				currentPage = { name, matches: matches.slice(1) }
				return true
			}
		})
	})

	Settings.get().then(settings => {
		const response = {
			settings,
			currentPage
		}

		if(settings.general.showBlogFeed) {
			response.blogFeedData = Blogfeed.get(updatedFeedData => {
				port.postMessage({ type: "blogfeed", data: updatedFeedData })
			})
		}

		respond(response)

		// Inject CSS
		const cssFiles = ["main.css"]
		const cssGroups = ["css/", `css/${settings.general.theme}/`]
		const cssMerge = []

		if(pageInfo && pageInfo.css) cssFiles.push(...pageInfo.css);

		cssGroups.forEach(group => cssFiles.forEach(filePath => {
			const source = cssCache[group + filePath]
			if(source) cssMerge.push(source);
		}))

		chrome.tabs.insertCSS(port.sender.tab.id, {
			frameId: port.sender.frameId,
			code: cssMerge.join("\n\n"),
			runAt: "document_start"
		}, () => chrome.runtime.lastError)
	})

	return true
}

function updateCSSCache() {
	localStorage.removeItem("cssCache")
	Object.keys(cssCache).forEach(key => delete cssCache[key])

	let updateCacheTimeout

	chrome.runtime.getPackageDirectoryEntry(root => {
		function recurse(dir, dirpath) {
			dir.createReader().readEntries(array => {
				array.forEach(entry => {
					const entrypath = `${dirpath}/${entry.name}`
					if(entry.isDirectory) {
						recurse(entry, entrypath)
					} else if(entry.isFile && entry.name.endsWith(".css")) {
						cssCache[entrypath] = `/* File: ${entrypath}  Loading... */`
						fetch(chrome.runtime.getURL(entrypath)).then(response => {
							response.text().then(source => {
								source = source.replace(/\s*\n\s*|\/\*((?!\*\/).)*\*\//g, "")
								source = `/* File: ${entrypath} */\n${source}`
								cssCache[entrypath] = source

								clearTimeout(updateCacheTimeout)
								updateCacheTimeout = setTimeout(() => {
									localStorage.cssCache = JSON.stringify(cssCache)
								}, 500)
							})
						})
					}
				})
			})
		}

		root.getDirectory("css", null, dir => recurse(dir, dir.name))
	})
}

ContentJS.listen("csInit", csInit)
chrome.runtime.onInstalled.addListener(updateCSSCache)
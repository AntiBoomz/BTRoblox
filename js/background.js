"use strict"

var defaultSettings = {
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
/*	catalog: {
		animationPreview:true
	},*/
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
	"home": {
		"matches": ["^/home"],
		"css": ["home.css"]
	},
	"character": {
		"matches": ["^/my/character\\.aspx"],
		"css": ["character.css"]
	},
	"groups": {
		"matches": ["^/my/groups\\.aspx","^/groups/group\\.aspx"],
		"css": ["groups.css"]
	},
	"groupaudit": {
		"matches": ["^/groups/audit\\.aspx"],
		"css": []
	},
	"groupadmin": {
		"matches": ["^/my/groupadmin.aspx"],
		"css": []
	},
	"forum": {
		"matches": ["^/forum/"],
		"css": ["forum.css"]
	},
	"money": {
		"matches": ["^/my/money"],
		"css": ["money.css"]
	},
	"profile": {
		"matches": ["^/users/(\\d+)/profile"],
		"css": ["profile.css"]
	},
	"inventory": {
		"matches": ["^/users/(\\d+)/inventory"],
		"css": ["inventory.css"]
	},
	"games": {
		"matches": ["^/games/?$"],
		"css": ["games.css"]
	},
	"gamedetails": {
		"matches": ["^/games/(\\d+)/"],
		"css": ["gamedetails.css"]
	},
	"configureplace": {
		"matches": ["^/places/(\\d+)/update"],
		"css": ["placeconfig.css"]
	},
	"messages": {
		"matches": ["^/my/messages"],
		"css": ["messages.css"]
	},
	"develop": {
		"matches": ["^/develop"],
		"css": ["develop.css"]
	},
	"catalog": {
		"matches": ["^/catalog/$"],
		"css": []
	},
	"itemdetails": {
		"matches": ["^/catalog/(\\d+)/","^/library/(\\d+)/"],
		"css": ["itemdetails.css"]
	}
}

var dataVersion = 2
var settings = JSON.parse(JSON.stringify(defaultSettings))
var groupshouts = { version: 3 }

var rankNameUrl = "http://www.roblox.com/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRole&playerid={0}&groupid={1}"
var versionThumbUrl = "http://www.roblox.com/Thumbs/RawAsset.ashx?imageFormat=png&width=75&height=75&assetVersionId={0}"
var groupUrl = "https://m.roblox.com/groups/{0}"
var groupsUrl = "http://api.roblox.com/users/{0}/groups"
var productInfoUrl = "http://api.roblox.com/marketplace/productinfo?assetId={0}"
var blogFeedUrl = "http://blog.roblox.com/feed/"
var blogFeedFormat = "<a class='btr_feed' href='{0}'><div class='btr_feedtitle'>{1}<span class='btr_feeddate'>()</span></div><span class='btr_feedactdate'>{2}</span><div class='btr_feeddesc'>{3}</div><div class='btr_feedcreator'>by {4}</div></a>"

var rankNameCache = {}
var assetTypeCache = {}
var cachedBlogFeedRaw = null
var cachedBlogFeed = null
var domParser = new DOMParser()

var extensionDirectory = null


function saveData(data, callback) {
	chrome.storage.local.set(data, callback)
}

function loadSettings(data) {
	function recurse(par, obj) {
		for(var i in obj) {
			var oldVal = par[i]
			var newVal = obj[i]
			if(oldVal != null) {
				if(oldVal instanceof Object) {
					recurse(oldVal, newVal)
				} else if(typeof(oldVal) === typeof(newVal)) {
					par[i] = newVal
				}
			}
		}
	}

	recurse(settings, data)
}

function loadGroupShouts(data) {
	if(groupshouts.version !== data.version) {
		console.log("Groupshout version mismatch, not loading")
		return;
	}

	for(var name in data) {
		groupshouts[name] = data[name]
	}
}

function getRankName(callback, userId, groupId) {
	if(rankNameCache[groupId] && rankNameCache[groupId][userId])
		callback(rankNameCache[groupId][userId]);

	request.get(rankNameUrl.format(userId,groupId), (rank) => {
		if(!rankNameCache[groupId])
			rankNameCache[groupId] = {};

		rankNameCache[groupId][userId] = rank
		callback(rank)
	}, () => callback(null))
}

function getVersionThumb(callback, versionId) {
	function retry() {
		request.get(versionThumbUrl.format(versionId), (data) => {
			if(data === "PENDING")
				return setTimeout(retry,1000);

			callback(data)
		}, () => callback(null))
	}

	retry()
}

function getProductInfo(callback, assetId) {
	request.getJson(productInfoUrl.format(assetId), callback, () => callback(null))
}

function getAssetTypeId(callback, assetId) {
	if(!assetTypeCache[assetId]) {
		assetTypeCache[assetId] = new Promise((resolve) => {
			getProductInfo((info) => resolve(info && info.AssetTypeId ? info.AssetTypeId : null))
		})
	}
	
	assetTypeCache[assetId].then(callback);
}

function getBlogFeed(callback) {
	if(cachedBlogFeed)
		callback(cachedBlogFeed);

	request.get(blogFeedUrl, (feed) => {
		if(cachedBlogFeedRaw !== feed) {
			cachedBlogFeedRaw = feed

			var responseData = ""
			var doc = domParser.parseFromString(feed, "text/xml")
			var items = doc.querySelectorAll("item")

			for(var i=0; i<3; i++) {
				var item = items[i]
		        var url = item.querySelector("link").textContent
		        var title = item.querySelector("title").textContent
		        var publishDate = item.querySelector("pubDate").textContent
		        var descDoc = domParser.parseFromString(item.querySelector("description").textContent, "text/html")
		        descDoc.querySelector("p:last-child").remove()
		        var desc = descDoc.body.innerText.trim()
		        var creator = item.querySelector("creator").textContent

		        responseData += $(blogFeedFormat).elemFormat(url, title, publishDate, desc, creator)[0].outerHTML
		    }

		    cachedBlogFeed = responseData
		}

		callback(cachedBlogFeed)
	}, () => callback(null))
}


var shoutTimeout = null
function checkForNewShouts() {
	clearTimeout(shoutTimeout)

	if(!settings.groups.enabled || !settings.groups.shoutAlerts)
		return;

	var groupsDone = {}
	var hasPlayedSound = false

	request.get("https://www.roblox.com/Feeds/GetUserFeed", (htmlString) => {
		var doc = domParser.parseFromString(htmlString, "text/html")

		doc.querySelectorAll(".feeds .list-item").forEach((item) => {
			var link = item.querySelector(".list-content a:first-child")
			var url = link.getAttribute("href")
			var groupName = link.innerText

			if(url.indexOf("groups.aspx") === -1)
				return;

			var groupId = url.match(/gid=(\d+)/)
			groupId = groupId ? parseInt(groupId[1]) : null
			if(groupId == null || isNaN(groupId) || groupsDone[groupId])
				return;

			groupsDone[groupId] = true

			var groupEmblem = item.querySelector(".header-thumb").getAttribute("src")
			var posterLink = item.querySelector(".text-name")
			var poster = posterLink.innerText
			var posterId = parseInt(posterLink.getAttribute("href").match(/\/users\/(\d+)/)[1])
			var date = item.querySelector(".text-date-hint").innerText
			var body = item.querySelector(".feedtext").innerText.replace(/^"(.*)"$/, "$1")

			if(isNaN(posterId))
				posterId = -1;

			var lastShout = groupshouts[groupId]
			if(!lastShout || lastShout.posterid != posterId || lastShout.body != body || lastShout.date != date) {
				groupshouts[groupId] = {
					poster: poster,
					posterid: posterId,
					body: body,
					date: date
				}

				saveData({ "groupshouts": groupshouts })

				if(lastShout) {
					Notifs.new({
						title: groupName,
						icon: groupEmblem,
						priority: 2,
						body: body,
						altBody: poster,
						requireInteraction: true,

						link: "http://www.roblox.com/My/Groups.aspx?gid=" + groupId,
						sound: hasPlayedSound ? null : "res/notification.mp3"
					})

					hasPlayedSound = true
				}
			}
		})
	})

	shoutTimeout = setTimeout(checkForNewShouts, 10000)
}

chrome.runtime.onConnect.addListener((port) => {
	port.onMessage.addListener((msg) => {
		var respond = (data) => { 
			port.postMessage({
				action:"return",
				uuid:msg.uuid,
				response:data
			})
		}
		
		switch(msg.action) {
			case "getSettings":
				respond(settings)
				break;

			case "setSetting":
				loadSettings(msg.data)
				saveData({ "settings": settings })
				checkForNewShouts()
				respond(true)
				break;

			case "execScript":
				var array = typeof(msg.data) == "string" ? [msg.data] : msg.data
				var index = 0
				var next = function() {
					if(index >= array.length) {
						respond()
						return;
					}

					var url = array[index++]
					if(url.search(/^\w+:\/\//) === -1) {
						chrome.tabs.executeScript(port.sender.tab.id, { file: url }, next)
					} else {
						$.get(url, (data) => chrome.tabs.executeScript(port.sender.tab.id, { code: data }, next))
					}
				}
				if(typeof(msg.data) == "string")
					msg.data = [msg.data];

				next()
				return true

			case "getBlogFeed":
				getBlogFeed(respond)
				return true;

			case "getVHThumb":
				getVersionThumb(respond,msg.data)
				return true;

			case "getRankName":
				getRankName(respond,msg.data.userId,msg.data.groupId)
				return true;

			case "getProductInfo":
				getProductInfo(respond,msg.data)
				return true;

			case "getAssetTypeId":
				getAssetTypeId(respond,msg.data)
				return true;

			case "getBlob":
				var xhr = new XMLHttpRequest()
				xhr.open("GET",msg.data)
				xhr.responseType = "blob"
				xhr.onload = function() {
					respond(window.URL.createObjectURL(xhr.response))
				}
				xhr.send()
				return true;

			default:
				console.log("Unknown message", msg)
		}
	});
})

chrome.storage.local.get(["settings", "groupshouts"], (data) => {
	loadSettings(data.settings)
	loadGroupShouts(data.groupshouts)

	saveData({ "settings": settings })
	checkForNewShouts()
})


var skipPages = [
	"^/login/fulfillconstraint.aspx",
	"^/build/upload",
	"^/userads/",
	"^/user-sponsorship/",
	"^/Feeds/GetUserFeed"
]

chrome.webRequest.onCompleted.addListener((details) => {
	var headers = details.responseHeaders
	for(var i=0; i<headers.length; i++) {
		var header = headers[i]
		if(header.name.toLowerCase() === "content-type") {
			if(header.value.split(";")[0].trim().toLowerCase() !== "text/html")
				return;

			break;
		}
	}

	var location = document.createElement("a")
	location.href = details.url

	for(var i=0; i<skipPages.length; i++) {
		if(details.url.search(skipPages[i]) !== -1)
			return;
	}

	var fileExists = pathString => {var path = pathString.split("/"),target=extensionDirectory;for(var i=0,l=path.length;i<l;i++){if(!(target=target[path[i]]))return false;}return true;}
	var injectCSS = path => fileExists("css/"+path) && chrome.tabs.insertCSS(details.tabId, { file: "css/" + path, runAt: "document_start", frameId: details.frameId })

	injectCSS("main.css")
	injectCSS(settings.general.theme + "/main.css")

	var pathname = location.pathname.toLowerCase()
	var currentPage = null
	for(var name in pages) {
		var page = pages[name]
		for(var i in page.matches) {
			var matches = pathname.match(page.matches[i]);
			if(matches) {
				currentPage = { name: name, matches: matches.slice(1) }

				if(page.css) {
					for(var i in page.css) {
						var path = page.css[i]
						injectCSS(path)
						injectCSS(settings.general.theme + "/" + path)
					}
				}
				break;
			}
		}
	}

	var initCode = [ 
		"settings="+JSON.stringify(settings),
		"currentPage="+JSON.stringify(currentPage)
	].join(",") + "; if(typeof(CSFinishedLoading) !== 'undefined')Init();"

	chrome.tabs.executeScript(details.tabId, { code: initCode, runAt: "document_start", frameId: details.frameId })
}, {
	urls: ["*://www.roblox.com/*", "*://forum.roblox.com/*"],
	types: ["main_frame", "sub_frame"]
}, ["responseHeaders"])

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
	})
})

function copyToClipboard(text) {
	function onCopy(ev) {
		document.removeEventListener("copy", onCopy)

		ev.clipboardData.setData("text/plain", text)
		ev.preventDefault()
	}

	document.addEventListener("copy", onCopy)
	document.execCommand("Copy", false, null)
}

var itemUrlPatterns = [
	"*://www.roblox.com/*-item?id=*"
]

chrome.contextMenus.create({
	title: "Copy asset id",
	contexts: ["link"],
	targetUrlPatterns: itemUrlPatterns,
	onclick: function(info,tab) {
		copyToClipboard(info.linkUrl.replace(/^.*[&?]id=(\d+).*$/,"$1"));
	}
})

chrome.contextMenus.create({
	title: "Copy asset id",
	contexts: ["page"],
	documentUrlPatterns: itemUrlPatterns,
	onclick: function(info,tab) {
		copyToClipboard(info.pageUrl.replace(/^.*[&?]id=(\d+).*$/,"$1"));
	}
})
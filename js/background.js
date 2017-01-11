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

	/*
	getUserId((id) => {
		if(isNaN(parseInt(id)))
			return;

		request.get(groupsUrl.format(id), (jsonString) => {
			var json = JSON.parse(jsonString)
			json.forEach((group) => request.get(groupUrl.format(group.Id), (htmlString) => {
				var doc = domParser.parseFromString(htmlString, "text/html")
				var shout = doc.body.querySelector("h4+ul .wall-content")
				if(shout) {
					var body = shout.querySelector(".wall-text").innerText.trim()
					if(body.length > 0) {
						var poster = shout.querySelector(".wall-name").innerText.trim()
						var posterId = shout.querySelector(".wall-name").getAttribute("href").match(/\/users\/(\d+)/)
						var date = shout.querySelector(".wall-datetime").innerText.trim()

						posterId = posterId && !isNaN(+posterId[1]) ? +posterId[1] : -1

						var lastShout = groupshouts[group.Id]
						if(!lastShout || lastShout.posterid != posterId || lastShout.body != body || lastShout.date != date) {
							groupshouts[group.Id] = {
								poster: poster,
								posterid: posterId,
								body: body,
								date: date
							}

							saveData({ "groupshouts": groupshouts })

							if(lastShout) {
								Notifs.new({
									title: group.Name,
									icon: group.EmblemUrl,
									priority: 2,
									body: body,
									altBody: poster,
									requireInteraction: true,

									link: "http://www.roblox.com/My/Groups.aspx?gid=" + group.Id,
									sound: "res/notification.mp3"
								})
							}
						}
					}
				}
			}))
		})
	})*/

	shoutTimeout = setTimeout(checkForNewShouts, 20000)
}

chrome.runtime.onConnect.addListener(function(port) {
	port.onMessage.addListener(function(msg) {
		var respond = function(data) { 
			port.postMessage({
				action:"return",
				uuid:msg.uuid,
				response:data
			});
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
						chrome.tabs.executeScript(port.sender.tab.id, { file: "js/" + url }, next)
					} else {
						$.get(url, (data) => {
							chrome.tabs.executeScript(port.sender.tab.id, { code: data }, next)
						})
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
});


chrome.storage.local.get(["settings", "groupshouts"], (data) => {
	loadSettings(data.settings)
	loadGroupShouts(data.groupshouts)

	saveData({ "settings": settings })
	checkForNewShouts()
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
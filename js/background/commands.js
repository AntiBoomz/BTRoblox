"use strict"

var commands = {}

var rankNameCache = {}


commands.setSetting = (data, respond) => applySettings(data);
commands.getSettings = (data, respond) => respond(settings);


commands.getProductInfo = (assetId, respond) => {
	var url = `https://api.roblox.com/marketplace/productinfo?assetId=${assetId}`
	request.getJson(url, json => respond(json))
}

commands.resolveAssetUrl = (assetId, respond) => {
	var params = {}

	if(assetId instanceof Object) {
		Object.assign(params, assetId)
	} else {
		params.id = assetId
	}

	var xhr = new XMLHttpRequest()
	xhr.open("GET", `http://www.roblox.com/asset/?${ request.params(params) }`, true)
	
	xhr.addEventListener("readystatechange", () => {
		if(xhr.status === 200 && xhr.responseURL.indexOf("rbxcdn") !== -1) {
			respond(xhr.responseURL.replace(/^http:/, "https:"))
		} else {
			respond(null)
		}

		xhr.abort()
		xhr = null
	}, { once: true })

	xhr.send(null)
}

commands.execScript = (list, respond, port) => {
	if(typeof(list) === "string")
		list = [list];

	var index = 0

	function next() {
		if(index >= list.length)
			return respond();

		var url = list[index++]

		if(url.search(/^\w+:\/\//) === -1) { // Relative url
			chrome.tabs.executeScript(port.sender.tab.id, { file: url, runAt: "document_start", frameId: port.sender.frameId }, next)
		} else {
			request.get(url, code => {
				chrome.tabs.executeScript(port.sender.tab.id, { code: code, runAt: "document_start", frameId: port.sender.frameId }, next)
			})
		}
	}

	next()
}

commands.getRankName =  (data, respond) => {
	var cached = rankNameCache[data.groupId] && rankNameCache[data.groupId][data.userId]
	if(cached) {
		respond(cached.value)

		if(Date.now() - cached.timestamp < 60e3) // Cache ranknames for a minute
			return;
	}

	request({
		method: "GET",
		url: "https://www.roblox.com/Game/LuaWebService/HandleSocialRequest.ashx",
		data: { method: "GetGroupRole", playerid: data.userId, groupid: data.groupId },
		success: rankName => {
			if(!rankNameCache[data.groupId])
				rankNameCache[data.groupId] = {};

			rankNameCache[data.groupId][data.userId] = {
				timestamp: Date.now(),
				value: rankName
			}

			respond(rankName)
		}
	})
}
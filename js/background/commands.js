"use strict"

var productInfoUrl = "https://api.roblox.com/marketplace/productinfo?assetId={0}"

var rankNameUrl = "https://www.roblox.com/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRole&playerid={0}&groupid={1}"
var rankNameCache = {}

var commands = {}


commands.setSetting = (data, respond) => applySettings(data);

commands.getSettings = (data, respond) => respond(settings);
commands.downloadFile = (url, respond) => request.getBlob(url, (data) => respond(URL.createObjectURL(data)));
commands.getProductInfo = (assetId, respond) => request.getJson(productInfoUrl.format(assetId), data => respond(data));

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
			request.get(url, (code) => {
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

	request.get(rankNameUrl.format(data.userId, data.groupId), (rankName) => {
		if(!rankNameCache[data.groupId])
			rankNameCache[data.groupId] = {};

		rankNameCache[data.groupId][data.userId] = {
			timestamp: Date.now(),
			value: rankName
		}

		respond(rankName)
	})
}
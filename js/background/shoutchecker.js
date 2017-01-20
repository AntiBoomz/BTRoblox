"use strict"

var groupshouts = {
	version: 3
}

var shoutInterval = null
var isCheckingShouts = false
var shoutsLoaded = false


function shouldCheckShouts() {
	if(!settingsLoaded || !shoutsLoaded)
		return false;

	return settings.groups.enabled && settings.groups.shoutAlerts
}

function checkShouts() {
	var groupsDone = {}
	var hasPlayedSound = false

	request.get("https://www.roblox.com/Feeds/GetUserFeed", (htmlString) => {
		var doc = new DOMParser().parseFromString(htmlString, "text/html")

		doc.querySelectorAll(".feeds .list-item").forEach((item) => {
			var link = item.querySelector(".list-content a:first-child")
			var groupUrl = link.getAttribute("href")
			var groupName = link.innerText

			if(groupUrl.indexOf("groups.aspx") === -1)
				return;

			var groupId = groupUrl.match(/gid=(\d+)/)
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

				chrome.storage.local.set({ groupshouts: groupshouts })

				if(lastShout) {
					CreateNotification("groupshout-" + groupId, {
						type: "basic",
						title: groupName,
						iconUrl: groupEmblem,
						message: body,
						contextMessage: poster,

						priority: 2,
						requireInteraction: true,

						success: () => {
							if(hasPlayedSound)
								return;

							hasPlayedSound = true
							var audio = new Audio("res/notification.mp3")
							audio.play()
						},
						click: () => chrome.tabs.create({ url: groupUrl })
					})
				}
			}
		})
	})
}

function startCheckingShouts() {
	if(!shoutsLoaded || isCheckingShouts || !shouldCheckShouts())
		return;

	isCheckingShouts = true
	shoutInterval = setInterval(checkShouts, 10000)
}

function stopCheckingShouts() {
	if(!isCheckingShouts)
		return;

	isCheckingShouts = false
	clearInterval(shoutInterval)
	shoutInterval = null
}

chrome.storage.local.get([ "groupshouts" ], (data) => {
	shoutsLoaded = true

	if(data.groupshouts) {
		if(data.groupshouts.version !== groupshouts.version) {
			console.log("Old version of groupshouts, not loading")
		} else {
			Object.assign(groupshouts, data.groupshouts)
		}
	}

	if(shouldCheckShouts())
		startCheckingShouts();
})

addSettingsLoadedListener(() => {
	if(shouldCheckShouts())
		startCheckingShouts();
})

addSettingsChangedListener(() => {
	if(shouldCheckShouts())
		startCheckingShouts();
	else
		stopCheckingShouts();
})
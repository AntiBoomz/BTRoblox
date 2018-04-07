"use strict"

{
	const groupShoutCache = {}
	const shoutFilterPromise = new Promise(resolve => {
		STORAGE.get("shoutFilters", data => {
			if("shoutFilters" in data) {
				resolve(data.shoutFilters)
			} else {
				resolve({
					mode: "blacklist",
					blacklist: [],
					whitelist: []
				})
			}
		})
	})

	try { Object.assign(groupShoutCache, JSON.parse(localStorage.getItem("groupShoutCache"))) }
	catch(ex) {}

	const executeCheck = async () => {
		let doc
		try {
			const response = await fetch("https://www.roblox.com/Feeds/GetUserFeed", { credentials: "include" })
			const responseText = await response.text()

			doc = new DOMParser().parseFromString(responseText, "text/html")
		} catch(ex) {
			console.error(ex)
			return
		}

		const shoutFilters = await shoutFilterPromise
		const items = doc.documentElement.querySelectorAll(".feeds .list-item")
		const groupsDone = {}
		let hasPlayedSound = false

		items.forEach(item => {
			const link = item.querySelector(".list-content a:first-child")
			const groupName = link.textContent
			const groupId = parseInt(link.href.replace(/^.+\/my\/groups.aspx?.*&?gid=(\d+).*$/i, "$1"), 10)

			if(!Number.isSafeInteger(groupId) || groupsDone[groupId]) { return }
			groupsDone[groupId] = true

			const groupEmblem = item.querySelector(".header-thumb").src
			const posterName = item.querySelector(".text-name").textContent
			const body = item.querySelector(".feedtext").textContent.replace(/^"(.*)"$/, "$1")
			const date = Date.parse(item.querySelector(".text-date-hint").textContent.replace("|", ""))
			if(Number.isNaN(date)) { return console.warn("Failed to parse date") }

			const lastShoutDate = groupShoutCache[groupId]
			if(lastShoutDate !== date) {
				groupShoutCache[groupId] = date
				localStorage.setItem("groupShoutCache", JSON.stringify(groupShoutCache))

				const skipNotif = shoutFilters.mode === "blacklist" && shoutFilters.blacklist.indexOf(groupId) !== -1
					|| shoutFilters.mode === "whitelist" && shoutFilters.whitelist.indexOf(groupId) === -1
					
				if(lastShoutDate && !skipNotif) {
					chrome.notifications.create(`groupshout-${groupId}`, {
						type: "basic",
						title: groupName,
						iconUrl: groupEmblem,
						message: body,
						contextMessage: posterName,
	
						priority: 2,
						requireInteraction: true,
						isClickable: true
					}, () => {
						if(hasPlayedSound) return;
						hasPlayedSound = true
	
						const audio = new Audio("res/notification.mp3")
						audio.play()
					})
				}
			}
		})
	}

	chrome.notifications.onClicked.addListener(notifId => {
		if(notifId.startsWith("groupshout-")) {
			const groupId = notifId.slice(11)
			chrome.tabs.create({ url: `https://www.roblox.com/my/groups.aspx?gid=${groupId}` })
		}
	})

	chrome.alarms.onAlarm.addListener(alarm => {
		if(alarm.name === "GroupShouts") executeCheck();
	})


	let previousCheck = 0

	const onUpdate = () => {
		Settings.get(settings => {
			if(settings.groups.enabled && settings.groups.shoutAlerts) {
				chrome.alarms.get("GroupShouts", alarm => {
					if(!alarm) {
						chrome.alarms.create("GroupShouts", {
							delayInMinutes: 1,
							periodInMinutes: 1
						})
					}
				})

				if(Date.now() - previousCheck > 1000) { // Stop check flooding on change
					previousCheck = Date.now()
					executeCheck()
				}
			} else {
				chrome.alarms.clear("GroupShouts")
			}
		})
	}

	MESSAGING.listen({
		getShoutFilters(data, respond) {
			shoutFilterPromise.then(shoutFilters => {
				respond(shoutFilters)
			})
		},
		setShoutFilterMode(mode, respond) {
			if(mode !== "blacklist" && mode !== "whitelist") { return respond(false) }

			shoutFilterPromise.then(shoutFilters => {
				shoutFilters.mode = mode
				STORAGE.set({ shoutFilters })
			})

			respond(true)
		},
		shoutFilterBlacklist(data, respond) {
			const id = data.id
			const state = !!data.state

			if(!Number.isSafeInteger(id)) { return respond(false) }

			shoutFilterPromise.then(shoutFilters => {
				const index = shoutFilters.blacklist.indexOf(id)
				if(state && index === -1) {
					shoutFilters.blacklist.push(id)
					STORAGE.set({ shoutFilters })
				} else if(!state && index !== -1) {
					shoutFilters.blacklist.splice(index, 1)
					STORAGE.set({ shoutFilters })
				}
			})

			respond(true)
		},
		shoutFilterWhitelist(data, respond) {
			const id = data.id
			const state = !!data.state

			if(!Number.isSafeInteger(id)) { return respond(false) }

			shoutFilterPromise.then(shoutFilters => {
				const index = shoutFilters.whitelist.indexOf(id)
				if(state && index === -1) {
					shoutFilters.whitelist.push(id)
					STORAGE.set({ shoutFilters })
				} else if(!state && index !== -1) {
					shoutFilters.whitelist.splice(index, 1)
					STORAGE.set({ shoutFilters })
				}
			})
			
			respond(true)
		}
	})

	Settings.onChange(onUpdate)
	chrome.runtime.onInstalled.addListener(onUpdate)
}
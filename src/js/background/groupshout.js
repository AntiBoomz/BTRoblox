"use strict"

{
	let shoutFilterPromise = null
	let shoutCachePromise = null
	let savingShoutCache = false
	let savingShoutFilters = false

	const getShoutCache = () => {
		if(shoutCachePromise) { return shoutCachePromise }

		return shoutCachePromise = new SyncPromise(resolve => {
			const cache = { version: 5 }

			STORAGE.get("shoutCache", data => {
				const saved = data.shoutCache

				if(saved && saved.version === cache.version) {
					Object.assign(cache, saved)
				}

				resolve(cache)
			})
		})
	}

	const saveShoutCache = () => {
		if(savingShoutCache) {
			return
		}

		savingShoutCache = true
		setTimeout(async () => {
			const cache = await getShoutCache()
			STORAGE.set({ shoutCache: cache })

			savingShoutCache = false
		}, 100)
	}
	
	const getShoutFilters = () => {
		if(shoutFilterPromise) { return shoutFilterPromise }

		return shoutFilterPromise = new SyncPromise(resolve => {
			STORAGE.get("shoutFilters", data => {
				if("shoutFilters" in data) {
					resolve(data.shoutFilters)
					return
				}

				resolve({
					mode: "blacklist",
					blacklist: [],
					whitelist: []
				})
			})
		})
	}
	
	const saveShoutFilters = () => {
		if(savingShoutFilters) {
			return
		}

		savingShoutFilters = true
		setTimeout(async () => {
			const shoutFilters = await getShoutFilters()
			STORAGE.set({ shoutFilters })

			savingShoutFilters = false
		}, 100)
	}
	
	//
	
	const notifQueue = []
	const shoutQueue = []
	let numAvailableShoutCheckers = 5
	let pushingNotifs = false
	let checkInterval = null
	let previousCheck = 0
	
	const fetchMyGroups = async () => {
		const userId = await fetch("https://users.roblox.com/v1/users/authenticated", { credentials: "include" }).then(resp => (resp.ok ? resp.json() : null)).then(json => json && json.id)
		if(!Number.isSafeInteger(userId)) { return }

		const json = await fetch(`https://groups.roblox.com/v1/users/${userId}/groups/roles`).then(resp => (resp.ok ? resp.json() : null))
		if(!json) { return }

		return json.data.map(x => x.group)
	}
	
	const pushNotif = notif => {
		notifQueue.push(notif)
		if(pushingNotifs) { return }
		
		pushingNotifs = true
		
		setTimeout(() => {
			const notifs = notifQueue.splice(0, notifQueue.length)
			const thumbsToGet = notifs.filter(notif => !notif.thumbUrl)
			
			pushingNotifs = false
			
			if(!thumbsToGet.length) {
				execNotifs()
				return
			}
			
			let didExecNotifs = false
			
			const execNotifs = async () => {
				if(didExecNotifs) { return }
				didExecNotifs = true

				notifs.forEach(notif => {
					const params = {
						type: "basic",
						title: notif.title,
						iconUrl: notif.thumbUrl || getURL("res/icon_128.png"),
						message: notif.body,
						contextMessage: notif.poster,

						priority: 2,
						requireInteraction: true,
						eventTime: notif.timeStamp
					}

					if(IS_FIREFOX) { delete params.requireInteraction }
					chrome.notifications.create(`groupshout-${notif.groupId}`, params)
				})
			}
			
			const url = `https://thumbnails.roblox.com/v1/groups/icons?groupIds=${thumbsToGet.map(x => x.groupId).join(",")}&size=150x150&format=png`

			fetch(url).then(async resp => {
				const json = await resp.json()

				json.data.forEach(item => {
					if(item.state === "Completed" && item.imageUrl) {
						const notif = notifs.find(x => +x.groupId === +item.targetId)
	
						if(notif) {
							notif.thumbUrl = item.imageUrl
						}
					}
				})
			}).finally(execNotifs)

			setTimeout(execNotifs, 5e3)
		}, 1000)
	}
	
	const checkNextShout = async () => {
		if(shoutQueue.length === 0 || numAvailableShoutCheckers <= 0) {
			return
		}
		
		numAvailableShoutCheckers--
		
		const shoutCache = await getShoutCache()
		const groupId = shoutQueue.shift()
		
		fetch(`https://groups.roblox.com/v1/groups/${groupId}/`).then(async resp => {
			if(!resp.ok) {
				console.log("Bad response (not ok)", resp.status, resp.statusText, await resp.text())
				return
			}
			
			const json = await resp.json()
			if(!json) {
				console.log("Bad response (not json)", resp.status, resp.statusText, await resp.text())
				return
			}
			
			const { shout, name: groupName } = json
			const validShout = shout && shout.body && shout.poster
			
			const lastNotif = shoutCache[groupId]
			const newNotif = {
				groupId: groupId,

				title: groupName,
				poster: validShout ? shout.poster.username : null,
				body: validShout ? shout.body : null,

				timeStamp: validShout ? Date.parse(shout.updated) : 0,
				lastChecked: Date.now()
			}
			
			shoutCache[newNotif.groupId] = newNotif
			saveShoutCache()
			
			// Notify if there's a shout, is not the first cached shout, matches white-/blacklist and the shout is different
			// Checking for time difference of > 100 because the updated timestamp seems to fluctuate slightly randomly
			if(validShout && lastNotif && (newNotif.body !== lastNotif.body || Math.abs(newNotif.timeStamp - lastNotif.timeStamp) > 100)) {
				pushNotif(newNotif)
			}
		}).finally(() => {
			numAvailableShoutCheckers++
			checkNextShout()
		})
	}

	const executeCheck = async () => {
		if(Date.now() - previousCheck < 10e3) { return }

		const checkTime = Date.now()
		previousCheck = checkTime
		
		const myGroups = await fetchMyGroups()
		if(!myGroups || previousCheck !== checkTime) { return }

		const shoutCache = await getShoutCache()
		const shoutFilters = await getShoutFilters()
		
		for(const { id: groupId } of myGroups) {
			const blacklist = shoutFilters.mode === "blacklist"
			const includes = shoutFilters[shoutFilters.mode].includes(+groupId)
			
			if((blacklist && includes) || (!blacklist && !includes)) {
				if(groupId in shoutCache) {
					delete shoutCache[groupId]
					saveShoutCache()
				}
				continue
			}
			
			if(!shoutQueue.includes(groupId)) {
				shoutQueue.push(groupId)
				checkNextShout()
			}
		}
		
		// Only keep 200 groups saved, I guess?
		const notifs = Object.values(shoutCache)
		if(notifs.length > 200) {
			notifs.sort((a, b) => b.lastChecked - a.lastChecked)
			
			for(let i = 200; i < notifs.length; i++) {
				delete shoutCache[notifs[i].groupId]
				saveShoutCache()
			}
		}
	}

	const onUpdate = () => {
		const shouldCheck = !!SETTINGS.get("groups.shoutAlerts")

		if(shouldCheck) {
			if(IS_CHROME) {
				chrome.alarms.create("ShoutCheck", { periodInMinutes: 1 })
			}

			clearInterval(checkInterval)
			checkInterval = setInterval(executeCheck, 20e3)

			executeCheck()
		} else {
			if(IS_CHROME) {
				chrome.alarms.clearAll()
			}

			clearInterval(checkInterval)
		}
	}

	if(IS_CHROME) {
		chrome.alarms.onAlarm.addListener(() => {})
		chrome.runtime.onInstalled.addListener(() => chrome.alarms.clearAll())
	}
	
	chrome.notifications.onClicked.addListener(notifId => {
		if(notifId.startsWith("groupshout-")) {
			const groupId = +notifId.slice(11)

			chrome.tabs.create({ url: `https://www.roblox.com/groups/${groupId}/Group` })
			chrome.notifications.clear(notifId)
		}
	})

	SETTINGS.load(onUpdate)
	SETTINGS.onChange("groups.shoutAlerts", onUpdate)

	MESSAGING.listen({
		getShoutFilters(data, respond) {
			getShoutFilters().then(shoutFilters => {
				respond(shoutFilters)
			})
		},

		setShoutFilterMode(mode, respond) {
			if(mode !== "blacklist" && mode !== "whitelist") { return respond(false) }

			getShoutFilters().then(shoutFilters => {
				shoutFilters.mode = mode
				saveShoutFilters()
			})

			respond(true)
		},

		setShoutFilter(data, respond) {
			const id = data.id
			const state = !!data.state
			const mode = data.mode
			
			if(!Number.isSafeInteger(id)) {
				return respond(false)
			}

			if(mode !== "blacklist" && mode !== "whitelist") {
				return respond(false)
			}

			getShoutFilters().then(shoutFilters => {
				const list = shoutFilters[data.mode]
				const index = list.indexOf(id)

				if(state && index === -1) {
					list.push(id)
					saveShoutFilters()
				} else if(!state && index !== -1) {
					list.splice(index, 1)
					saveShoutFilters()
				}
			})

			respond(true)
		}
	})
}
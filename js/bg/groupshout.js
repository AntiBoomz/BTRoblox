"use strict"

{
	const shoutCheckerQueue = []
	let numAvailableShoutCheckers = 3
	let checkingForGroupShouts = false
	let lastCheckedForGroups = 0
	
	const getShoutCache = $.onceFn(() => new SyncPromise(resolve => {
		const result = { version: 9, groups: {} }

		STORAGE.get("shoutCache", data => {
			const saved = data.shoutCache

			if(saved && saved.version === result.version) {
				Object.assign(result, saved)
			}

			resolve(result)
		})
	}))
	
	let savingShoutCache = false
	const saveShoutCache = () => {
		if(savingShoutCache) { return }

		savingShoutCache = true
		setTimeout(async () => {
			const shoutCache = await getShoutCache()
			STORAGE.set({ shoutCache: shoutCache })

			savingShoutCache = false
		}, 1000)
	}
	
	const getShoutFilters = $.onceFn(() => new SyncPromise(resolve => {
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
	}))
	
	let savingShoutFilters
	const saveShoutFilters = () => {
		if(savingShoutFilters) { return }

		savingShoutFilters = true
		setTimeout(async () => {
			const shoutFilters = await getShoutFilters()
			STORAGE.set({ shoutFilters })

			savingShoutFilters = false
		}, 100)
	}
	
	let getAllNotifsPromise
	let gettingNotifs = false
	const isNotifVisible = async notifId => {
		if(!gettingNotifs) {
			gettingNotifs = true
			getAllNotifsPromise = new Promise(resolve => {
				chrome.notifications.getAll(notifs => {
					gettingNotifs = false
					resolve(notifs)
				})
			})
		}
		
		const notifs = await getAllNotifsPromise
		return notifId in notifs
	}
	
	let gettingGroupThumbs = false
	let groupThumbQueue = {}
	const getGroupThumbUrl = groupId => {
		const result = groupThumbQueue[groupId] = groupThumbQueue[groupId] ?? new SyncPromise()
		
		if(!gettingGroupThumbs) {
			gettingGroupThumbs = true
			
			setTimeout(() => {
				const queue = groupThumbQueue
				
				groupThumbQueue = {}
				gettingGroupThumbs = false
				
				const url = `https://thumbnails.roblox.com/v1/groups/icons?groupIds=${Object.keys(queue).join(",")}&size=150x150&format=png`
				
				const finish = json => {
					if(json) {
						for(const item of json.data) {
							if(item.state === "Completed" && item.imageUrl) {
								queue[item.targetId]?.resolve(item.imageUrl)
							}
						}
					}
					
					for(const promise of Object.values(queue)) {
						promise.resolve(null)
					}
				}

				fetch(url).then(async resp => finish(await resp.json())).finally(() => finish())
				setTimeout(finish, 5e3)
			}, 500)
		}
		
		return result
	}
	
	const checkNextShout = () => {
		if(!numAvailableShoutCheckers || !shoutCheckerQueue.length) {
			return
		}
		
		const groupId = shoutCheckerQueue.shift()
		numAvailableShoutCheckers--
		
		fetch(`https://groups.roblox.com/v1/groups/${groupId}/`).then(async resp => {
			if(!resp.ok) {
				console.log("Bad response (not ok)", resp.status, resp.statusText, await resp.text())
				return
			}
			
			const data = await resp.json()
			if(!data) {
				console.log("Bad response (not json)", resp.status, resp.statusText, await resp.text())
				return
			}
			
			const shoutCache = await getShoutCache()
			let shoutEntry = shoutCache.groups[groupId]
			
			const hasShout = data.shout && data.shout.body && data.shout.poster?.username
			const hadShout = shoutEntry
			let hash
			let ts = -1
			
			if(hasShout) {
				hash = $.hashString(`${data.shout.poster.username}-${data.shout.body}`)
				ts = Date.parse(data.shout.updated)
			}
			
			// Checking for time difference of > 100 because the updated timestamp seems to fluctuate slightly randomly
			if(!hadShout || shoutEntry.hash !== hash || Math.abs((shoutEntry.ts ?? -1) - ts) > 100) {
				let canShowNotif = true
				
				if(!shoutEntry) {
					shoutEntry = shoutCache.groups[groupId] = {}
					canShowNotif = false // do not show a notification the first time we get a shout
				}
				
				if(hasShout) {
					shoutEntry.hash = hash
					shoutEntry.ts = ts
				} else {
					delete shoutEntry.hash
					delete shoutEntry.ts
				}
				
				if(hasShout && canShowNotif) {
					shoutEntry.visible = true
				} else {
					delete shoutEntry.visible
				}
				
				saveShoutCache()
			}
			
			if(shoutEntry.visible) {
				const notifId = `groupshout-${groupId}-${shoutEntry.hash}`
				
				isNotifVisible(notifId).then(async isVisible => {
					if(isVisible) {
						if(IS_CHROME) { chrome.notifications.update(notifId, {}) } // Re-push on chrome if broken
						return
					}
					
					const thumbUrl = await getGroupThumbUrl(groupId)
					if(await isNotifVisible(notifId)) { return }
					
					const params = {
						type: "basic",
						title: data.name,
						iconUrl: thumbUrl || getURL("res/icon_128.png"),
						message: data.shout.body,
						contextMessage: data.shout.poster.username,

						priority: 2,
						requireInteraction: true,
						eventTime: shoutEntry.ts
					}

					if(IS_FIREFOX) { delete params.requireInteraction }
					chrome.notifications.create(notifId, params)
				})
			}
		}).finally(() => {
			numAvailableShoutCheckers++
			checkNextShout()
		})
	}
	
	const getCurrentGroups = async () => {
		const userId = await fetch("https://users.roblox.com/v1/users/authenticated", { credentials: "include" }).then(resp => (resp.ok ? resp.json() : null)).then(json => json && json.id)
		if(!Number.isSafeInteger(userId)) { return [] }
		
		const json = await fetch(`https://groups.roblox.com/v1/users/${userId}/groups/roles`).then(resp => (resp.ok ? resp.json() : null))
		if(!json) { return [] }
		
		return json.data.map(x => +x.group.id)
	}
	
	const checkForGroupShouts = async () => {
		if(checkingForGroupShouts || Date.now() < lastCheckedForGroups + 10e3) { return }
		checkingForGroupShouts = true
		
		return Promise.resolve().then(async () => {
			const shoutFilters = await getShoutFilters()
			const currentGroups = await getCurrentGroups()
			
			for(const groupId of currentGroups) {
				if(shoutCheckerQueue.includes(groupId)) { continue }
				
				const blacklist = shoutFilters.mode === "blacklist"
				const includes = shoutFilters[shoutFilters.mode].includes(groupId)
				if((blacklist && includes) || (!blacklist && !includes)) { continue }
				
				shoutCheckerQueue.push(groupId)
				checkNextShout()
			}
		}).finally(() => {
			checkingForGroupShouts = false
			lastCheckedForGroups = Date.now()
		})
	}
	
	let checkInterval
	const onUpdate = () => {
		const shouldCheck = !!SETTINGS.get("groups.shoutAlerts")

		if(shouldCheck) {
			if(IS_CHROME) {
				chrome.alarms.create("ShoutCheck", { periodInMinutes: 1 })
			}

			clearInterval(checkInterval)
			checkInterval = setInterval(checkForGroupShouts, 30e3)

			checkForGroupShouts()
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
	
	chrome.notifications.onClosed.addListener(async (notifId, byUser) => {
		if(notifId.startsWith("groupshout-") && (byUser || IS_FIREFOX)) {
			const [, id, hash] = notifId.split("-")
			
			const shoutCache = await getShoutCache()
			const shoutEntry = shoutCache.groups[+id]
			
			if(shoutEntry && shoutEntry.hash === hash && shoutEntry.visible) {
				delete shoutEntry.visible
				saveShoutCache()
			}
		}
	})
	
	chrome.notifications.onClicked.addListener(async notifId => {
		if(notifId.startsWith("groupshout-")) {
			const [, id, hash] = notifId.split("-")
			
			chrome.tabs.create({ url: `https://www.roblox.com/groups/${id}/group` })
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
"use strict"

{
	let shoutFilterPromise
	let shoutCachePromise
	let savingShoutCache = false
	let previousCheck = 0
	let checkInterval
	let isSuspending = false
	let wasEnabled

	const loadShoutCache = () => {
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
			const cache = await loadShoutCache()
			STORAGE.set({ shoutCache: cache })

			savingShoutCache = false
		}, 100)
	}

	const loadShoutFilters = () => {
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

	const loadMyShouts = async () => {
		const userId = await fetch("https://www.roblox.com/game/GetCurrentUser.ashx", { credentials: "include" }).then(resp => (resp.ok ? resp.text() : null))
		if(!Number.isSafeInteger(+userId)) { return }

		const json = await fetch(`https://groups.roblox.com/v1/users/${userId}/groups/roles`).then(resp => (resp.ok ? resp.json() : null))
		if(!json) { return }

		return json.data.map(x => x.group)
	}

	const executeCheck = async () => {
		if(isSuspending || Date.now() - previousCheck < 5000) { return }
		const checkTime = Date.now()
		previousCheck = checkTime

		const shoutCache = await loadShoutCache()
		const shoutFilters = await loadShoutFilters()
		const myGroups = await loadMyShouts()
		const notifs = []

		if(previousCheck !== checkTime || !shoutCache || !shoutFilters || !myGroups) { return }

		myGroups.forEach(({ id: groupId, name: groupName, shout }) => {
			const lastNotif = shoutCache[groupId]

			const timeStamp = (!shout || !shout.body) ? 0 : Date.parse(shout.updated)
			const isDifferent = !lastNotif || lastNotif.timeStamp !== timeStamp

			if(!isDifferent) {
				return
			}

			let notif = lastNotif

			if(isDifferent) {
				notif = shoutCache[groupId] = {
					id: `groupshout-${groupId}`,
					title: groupName,
					body: shout ? shout.body : null,
					poster: shout ? shout.poster.username : null,
					timeStamp,
					groupId
				}
				
				saveShoutCache()
			}

			const blacklist = shoutFilters.mode === "blacklist"
			const includes = shoutFilters[shoutFilters.mode].includes(+groupId)
			const excluded = blacklist === includes

			if(excluded || !shout || !lastNotif) {
				return
			}

			notifs.push(notif)
		})

		if(!notifs.length) { return }
		
		const thumbsToGet = notifs.filter(notif => !notif.thumbUrl)
		let hasExecutedNotifs = false

		const execNotifs = async () => {
			if(hasExecutedNotifs || previousCheck !== checkTime) { return }
			hasExecutedNotifs = true

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
				
				chrome.notifications.create(notif.id, params)
			})
		}

		if(!thumbsToGet.length) {
			execNotifs()
		} else {
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

				saveShoutCache()
			}).finally(execNotifs)

			setTimeout(execNotifs, 5e3)
		}
	}

	chrome.notifications.onClicked.addListener(notifId => {
		if(notifId.startsWith("groupshout-")) {
			const groupId = +notifId.slice(11)

			chrome.tabs.create({ url: `https://www.roblox.com/groups/${groupId}/Redirect` })
			chrome.notifications.clear(notifId)
		}
	})

	if("onSuspend" in chrome.runtime) {
		chrome.runtime.onSuspend.addListener(() => {
			isSuspending = true
		})
	
		chrome.runtime.onSuspendCanceled.addListener(() => {
			isSuspending = false
		})
	}

	const updateCheck = () => {
		clearInterval(checkInterval)
		checkInterval = setInterval(executeCheck, 10.1e3)
		executeCheck()
	}

	if(IS_CHROME) {
		chrome.alarms.onAlarm.addListener(updateCheck)
	} else if(window.chrome && window.chrome.alarms) {
		chrome.alarms.clearAll()
	}

	const onUpdate = () => {
		const isEnabled = SETTINGS.get("groups.shoutAlerts")
		
		if(wasEnabled !== isEnabled) {
			wasEnabled = isEnabled

			if(isEnabled) {
				if(IS_CHROME) {
					chrome.alarms.clearAll(() => {
						for(let i = 0; i < 3; i++) {
							chrome.alarms.create(`ShoutCheck${i}`, { periodInMinutes: 1, when: Date.now() + i * 20e3 })
						}
					})
				}
				
				updateCheck()
			} else {
				if(IS_CHROME) {
					chrome.alarms.clearAll()
				}
				
				clearInterval(checkInterval)
			}
		}
	}

	chrome.runtime.onInstalled.addListener(() => SETTINGS.load(onUpdate))
	SETTINGS.onChange("groups.shoutAlerts", onUpdate)

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
}
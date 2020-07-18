"use strict"

{
	let shoutFilterPromise
	let shoutCachePromise
	let savingShoutCache = false
	let previousCheck = 0
	let checkInterval

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
		if(Date.now() - previousCheck < 5e3) { return }
		const checkTime = Date.now()
		previousCheck = checkTime

		const shoutCache = await loadShoutCache()
		const shoutFilters = await loadShoutFilters()
		const myGroups = await loadMyShouts()

		if(previousCheck !== checkTime || !shoutCache || !shoutFilters || !myGroups) { return }

		const notifs = []

		myGroups.forEach(({ id: groupId, name: groupName, shout }) => {
			const validShout = shout && shout.body && shout.poster

			const lastNotif = shoutCache[groupId]
			const newNotif = {
				groupId,

				title: groupName,
				poster: validShout ? shout.poster.username : null,
				body: validShout ? shout.body : null,

				timeStamp: validShout ? Date.parse(shout.updated) : 0,
				lastChecked: checkTime
			}

			shoutCache[groupId] = newNotif
			saveShoutCache()

			const blacklist = shoutFilters.mode === "blacklist"
			const includes = shoutFilters[shoutFilters.mode].includes(+groupId)

			// Notify if there's a shout, is not the first cached shout, matches white-/blacklist and the shout is different
			// Checking for time difference of > 100 because the updated timestamp seems to fluctuate slightly randomly
			if(validShout && lastNotif && blacklist === !includes && (newNotif.body !== lastNotif.body || Math.abs(newNotif.timeStamp - lastNotif.timeStamp) > 100)) {
				notifs.push(newNotif)
			}
		})
		
		// Delete shout entries that haven't been checked in a week
		// Just adding without ever removing makes me uncomfortable
		Object.values(shoutCache).forEach(notif => {
			if(notif instanceof Object && checkTime - (notif.lastChecked || 0) > 6048e5) {
				delete shoutCache[notif.groupId]
				saveShoutCache()
			}
		})

		if(!notifs.length) { return }
		
		const thumbsToGet = notifs.filter(notif => !notif.thumbUrl)
		let hasExecutedNotifs = false

		const execNotifs = async () => {
			if(hasExecutedNotifs) { return }
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
				chrome.notifications.create(`groupshout-${notif.groupId}`, params)
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
			}).finally(execNotifs)

			setTimeout(execNotifs, 5e3)
		}
	}

	chrome.notifications.onClicked.addListener(notifId => {
		if(notifId.startsWith("groupshout-")) {
			const groupId = +notifId.slice(11)

			chrome.tabs.create({ url: `https://www.roblox.com/groups/${groupId}/Group` })
			chrome.notifications.clear(notifId)
		}
	})

	const onUpdate = () => {
		clearInterval(checkInterval)

		if(SETTINGS.get("groups.shoutAlerts")) {
			checkInterval = setInterval(executeCheck, 10e3)
			executeCheck()
		}
	}

	SETTINGS.load(onUpdate)
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
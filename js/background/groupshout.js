"use strict"

{
	let shoutFilterPromise
	let shoutCachePromise
	let previousCheck = 0
	let checkInterval
	let isSuspending = false
	let wasEnabled

	const loadShoutCache = () => {
		if(shoutCachePromise) { return shoutCachePromise }
		return shoutCachePromise = new Promise(resolve => {
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

	const saveShoutCache = () => new Promise(async resolve => {
		const cache = await loadShoutCache()
		STORAGE.set({ shoutCache: cache }, resolve)
	})

	const loadShoutFilters = () => {
		if(shoutFilterPromise) { return shoutFilterPromise }
		return shoutFilterPromise = new Promise(resolve => {
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
	}

	const createNotif = (notif, fn) => {
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

		chrome.notifications.create(notif.id, params, fn)
	}

	const executeCheck = async () => {
		if(isSuspending || Date.now() - previousCheck < 5000) { return }
		const checkTime = Date.now()
		previousCheck = checkTime

		const userId = await fetch("https://www.roblox.com/game/GetCurrentUser.ashx", { credentials: "include" }).then(resp => (resp.ok ? resp.text() : null))
		if(!Number.isSafeInteger(+userId)) { return }

		const json = await fetch(`https://groups.roblox.com/v1/users/${userId}/groups/roles`).then(resp => (resp.ok ? resp.json() : null))
		if(!json) { return }

		const shoutCache = await loadShoutCache()
		const shoutFilters = await loadShoutFilters()
		const notifs = []
		let didChange = false

		json.data.forEach(({ group }) => {
			const shout = group.shout
			const cached = shoutCache[group.id]

			const timeStamp = (!shout || !shout.body) ? 0 : Date.parse(shout.updated)
			const isDifferent = !cached || cached.timeStamp !== timeStamp

			if(isDifferent || !cached.finished) {
				let notif = cached
				if(isDifferent) {
					if(notif) {
						notif.finished = true
					}

					notif = shoutCache[group.id] = {
						groupId: group.id,
						id: `groupshout-${group.id}`,
						title: group.name,
						body: shout ? shout.body : null,
						poster: shout ? shout.poster.username : null,
						timeStamp
					}

					didChange = true
				}

				if(!cached || timeStamp === 0) {
					notif.finished = true
					return
				}

				const blacklist = shoutFilters.mode === "blacklist"
				const includes = shoutFilters[shoutFilters.mode].includes(+group.id)
				const skip = blacklist === includes

				if(skip) {
					notif.finished = true
					didChange = true
					return
				}

				if(!notif.wasCreated) {
					notifs.push(notif)
				}
			}
		})

		if(didChange) { saveShoutCache() }
		if(!notifs.length || previousCheck !== checkTime) { return }
		
		let hasExecutedNotifs = false
		let hasPlayedSound = false

		const execNotifs = async () => {
			if(hasExecutedNotifs || previousCheck !== checkTime) { return }
			hasExecutedNotifs = true

			notifs.forEach(notif => createNotif(notif, () => {
				notif.wasCreated = true
				saveShoutCache()
	
				if(!hasPlayedSound) {
					hasPlayedSound = true
					new Audio("res/notification.mp3").play()
				}
			}))
		}

		const urlInfo = new URL("https://thumbnails.roblox.com/v1/groups/icons?size=150x150&format=png")
		notifs.forEach(x => urlInfo.searchParams.append("groupIds", x.groupId))

		fetch(urlInfo).then(async resp => {
			if(resp.ok) {
				try {
					const data = (await resp.json()).data

					data.forEach(item => {
						if(item.state === "Completed") {
							const notif = notifs.find(x => +x.groupId === +item.targetId)
							if(notif) {
								notif.thumbUrl = item.imageUrl || notif.thumbUrl
							}
						}
					})
				} catch(ex) {
					console.error(ex)
				}
			}
		}).then(execNotifs, execNotifs)
		setTimeout(execNotifs, 5e3)
	}


	chrome.notifications.onClicked.addListener(notifId => {
		if(!notifId.startsWith("groupshout-")) { return }
		const groupId = +notifId.slice(11)

		chrome.tabs.create({ url: `https://www.roblox.com/My/Groups.aspx?gid=${groupId}` })
		chrome.notifications.clear(notifId)
		
		loadShoutCache().then(shoutCache => {
			const notif = shoutCache[groupId]
			if(notif && !notif.finished) {
				notif.finished = true
				saveShoutCache()
			}
		})
	})

	chrome.notifications.onClosed.addListener(notifId => {
		if(!notifId.startsWith("groupshout-")) { return }
		const groupId = +notifId.slice(11)

		loadShoutCache().then(shoutCache => {
			const notif = shoutCache[groupId]
			if(notif && !notif.finished) {
				notif.finished = true
				saveShoutCache()
			}
		})
	})

	chrome.runtime.onSuspend.addListener(() => {
		isSuspending = true
	})

	chrome.runtime.onSuspendCanceled.addListener(() => {
		isSuspending = false
	})

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
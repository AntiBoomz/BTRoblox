"use strict"

{
	const groupShoutCache = { version: 4 }
	let shoutFilterPromise
	let cacheLoaded = false
	let previousCheck = 0
	let checkInterval
	let wasEnabled

	const loadGroupShoutCache = () => {
		if(!cacheLoaded) {
			cacheLoaded = true
			
			try {
				const saved = JSON.parse(localStorage.getItem("groupShoutCache"))
				if(saved && saved.version === groupShoutCache.version) {
					Object.assign(groupShoutCache, saved)
				}
			} catch(ex) {}
		}
	}

	const executeCheck = async () => {
		loadGroupShoutCache()

		if(!shoutFilterPromise) {
			shoutFilterPromise = new Promise(resolve => {
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

		const userId = await fetch("https://www.roblox.com/game/GetCurrentUser.ashx", { credentials: "include" })
			.then(resp => resp.text())
		
		if(!Number.isSafeInteger(+userId)) { return }

		const json = await fetch(`https://groups.roblox.com/v1/users/${userId}/groups/roles`)
			.then(resp => resp.json())

		const shoutFilters = await shoutFilterPromise
		const notifs = []
		let didChange = false

		json.data.forEach(({ group }) => {
			const shout = group.shout
			const cached = groupShoutCache[group.id]

			const timeStamp = (!shout || !shout.body) ? 0 : Date.parse(shout.updated)
			const isDifferent = !cached || cached.timeStamp !== timeStamp

			if(isDifferent || !cached.finished) {
				let notif = cached
				if(isDifferent) {
					if(notif) {
						notif.finished = true
					}

					notif = groupShoutCache[group.id] = {
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

				notifs.push(notif)
			}
		})

		if(didChange) {
			localStorage.setItem("groupShoutCache", JSON.stringify(groupShoutCache))
		}

		if(notifs.length) {
			let hasExecutedNotifs = false
			let hasPlayedSound = false

			const execNotifs = async () => {
				if(hasExecutedNotifs) { return }
				hasExecutedNotifs = true

				const existing = await new Promise(res => chrome.notifications.getAll(res))

				notifs.forEach(notif => {
					if(existing[notif.id] && notif.wasCreated) { return }

					const params = {
						type: "basic",
						title: notif.title,
						iconUrl: notif.thumbUrl || getURL("res/icon_128.png"),
						message: notif.body,
						contextMessage: notif.poster,
	
						priority: 0,
						requireInteraction: true,
						isClickable: true,
						eventTime: notif.timeStamp
					}

					if(IS_FIREFOX) { delete params.requireInteraction }

					chrome.notifications.create(notif.id, params, () => {
						if(notif.wasCreated) { return }
		
						notif.wasCreated = true
						localStorage.setItem("groupShoutCache", JSON.stringify(groupShoutCache))

						if(!hasPlayedSound) {
							hasPlayedSound = true
							new Audio("res/notification.mp3").play()
						}
					})
				})
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
		}
	}

	chrome.notifications.onClicked.addListener(notifId => {
		if(!notifId.startsWith("groupshout-")) { return }
		const groupId = +notifId.slice(11)
		chrome.tabs.create({ url: `https://www.roblox.com/My/Groups.aspx?gid=${groupId}` })
	})

	chrome.notifications.onClosed.addListener((notifId, byUser) => {
		if(!notifId.startsWith("groupshout-") || !byUser) { return }
		const groupId = +notifId.slice(11)

		loadGroupShoutCache()
		const notif = groupShoutCache[groupId]
		if(notif) {
			notif.finished = true
			localStorage.setItem("groupShoutCache", JSON.stringify(groupShoutCache))
		}
	})

	chrome.alarms.onAlarm.addListener(() => {})
	
	const onUpdate = () => {
		Settings.get(settings => {
			const isEnabled = settings.groups.enabled && settings.groups.shoutAlerts
			if(wasEnabled !== isEnabled) {
				wasEnabled = isEnabled

				if(isEnabled) {
					chrome.alarms.get("ShoutCheck", alarm => {
						if(alarm) { return }
						chrome.alarms.create("ShoutCheck", { periodInMinutes: 1 })
					})
					checkInterval = setInterval(executeCheck, 15e3)

					if(Date.now() - previousCheck > 2000) { // Floodcheck
						previousCheck = Date.now()
						executeCheck()
					}
				} else {
					chrome.alarms.clear("ShoutCheck")
					clearInterval(checkInterval)
				}
			}
		})
	}

	Settings.onChange(onUpdate)
	onUpdate()

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
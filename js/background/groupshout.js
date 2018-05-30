"use strict"

{
	const groupShoutCache = { version: 2 }
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

	try {
		const saved = JSON.parse(localStorage.getItem("groupShoutCache"))
		if(saved && saved.version === groupShoutCache.version) {
			Object.assign(groupShoutCache, saved)
		}
	} catch(ex) {}

	const doHash = s => {
		let hash = 0
		for(let i = s.length; i--;) {
			hash = (((hash << 5) - hash) + s.charCodeAt(i)) | 0
		}
		return hash
	}

	const executeCheck = async () => {
		if(KeepAlive.shouldRestart && MESSAGING.ports.length === 0) { return } // Allow background scripts to restart

		const userId = await fetch("https://www.roblox.com/game/GetCurrentUser.ashx", { credentials: "include" })
			.then(resp => resp.text())
		
		if(!Number.isSafeInteger(+userId)) { return }

		const json = await fetch(`https://groups.roblox.com/v1/users/${userId}/groups/roles`)
			.then(resp => resp.json())

		const shoutFilters = await shoutFilterPromise
		const notifications = []
		let changed = false

		json.data.forEach(({ group }) => {
			const shout = group.shout

			const hash = (!shout || !shout.body) ? 0 : doHash(shout.body + shout.poster.userId)
			const lastHash = groupShoutCache[group.id]
			if(lastHash !== hash) {
				groupShoutCache[group.id] = hash
				changed = true

				if(typeof lastHash !== "number" || hash === 0) { return }

				const blacklist = shoutFilters.mode === "blacklist"
				const includes = shoutFilters[shoutFilters.mode].includes(+group.id)
				const skip = blacklist === includes

				if(skip) { return }

				notifications.push({
					id: group.id,
					title: group.name,
					body: shout.body,
					poster: shout.poster.username
				})
			}
		})

		if(notifications.length) {
			let hasPlayedSound = false

			const playSound = () => {
				if(hasPlayedSound) { return }
				hasPlayedSound = true

				const audio = new Audio("res/notification.mp3")
				audio.play()
			}

			const tryGetThumbnails = (list, didRetry) => {
				const params = `%5B${list.map(x => `%7BgroupId:${x.id}%7D`).join("%2C")}%5D`
				const url = `https://www.roblox.com/group-thumbnails?params=${params}`

				fetch(url).then(async resp => {
					const thumbs = await resp.json()
					const retryList = []

					list.forEach(notif => {
						const thumb = thumbs.find(x => +x.id === +notif.id)

						if(!didRetry && !thumb.thumbnailFinal) {
							retryList.push(notif)
							return
						}

						const thumbUrl = String(thumb.thumbnailUrl)
						const params = {
							type: "basic",
							title: notif.title,
							iconUrl: thumbUrl,
							message: notif.body,
							contextMessage: notif.poster,
		
							priority: 2,
							requireInteraction: true,
							isClickable: true
						}

						if(IS_FIREFOX) {
							delete params.requireInteraction
						}

						chrome.notifications.create(`groupshout-${notif.id}`, params, playSound)
					})

					if(retryList.length) {
						setTimeout(tryGetThumbnails, 500, retryList, true)
					}
				})
			}

			tryGetThumbnails(notifications, false)
		}

		if(changed) {
			localStorage.setItem("groupShoutCache", JSON.stringify(groupShoutCache))
		}
	}

	chrome.notifications.onClicked.addListener(notifId => {
		if(notifId.startsWith("groupshout-")) {
			const groupId = notifId.slice(11)
			chrome.tabs.create({ url: `https://www.roblox.com/My/Groups.aspx?gid=${groupId}` })
		}
	})

	let checkInterval
	let previousCheck = 0
	let wasEnabled = null

	const onUpdate = () => {
		Settings.get(settings => {
			const isEnabled = settings.groups.enabled && settings.groups.shoutAlerts
			if(wasEnabled !== isEnabled) {
				wasEnabled = isEnabled

				if(isEnabled) {
					clearInterval(checkInterval)
					checkInterval = setInterval(executeCheck, 15e3)

					if(Date.now() - previousCheck > 1000) { // Floodcheck
						previousCheck = Date.now()
						executeCheck()
					}
				} else {
					clearInterval(checkInterval)
				}
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
	onUpdate()
}
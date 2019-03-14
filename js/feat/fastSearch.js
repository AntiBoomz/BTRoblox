"use strict"

const initFastSearch = () => {
	const requestCache = {}
	const usernameRegex = /^\w+(?:[ _]?\w+)?$/
	const promiseCache = {}
	const fsResults = []
	const friendsList = []
	let fsUpdateCounter = 0
	let friendsLoaded = false
	let friendsPromise
	let exactTimeout

	try {
		const data = JSON.parse(localStorage.getItem("btr-fastsearch-cache"))
		Object.entries(data.friends).forEach(([name, id]) => {
			requestCache[name.toLowerCase()] = {
				Username: name,
				UserId: id,
				IsFriend: true
			}
		})
	} catch(ex) {}

	const updateCache = () => {
		if(!friendsLoaded) { return }
		const cache = { friends: {} }

		Object.values(friendsList).forEach(friend => {
			cache.friends[friend.Username] = friend.UserId
		})

		localStorage.setItem("btr-fastsearch-cache", JSON.stringify(cache))
	}


	const makeItem = (json, hlFrom, hlTo) => {
		if(hlFrom == null || json.Alias) {
			hlFrom = 0
			hlTo = json.Username.length
		}

		const item = html`
		<li class="rbx-navbar-search-option rbx-clickable-li btr-fastsearch" data-searchurl=/User.aspx?userId=${json.UserId}&searchTerm=>
			<a class=btr-fastsearch-anchor href=/users/${json.UserId}/profile>
				<div class=btr-fastsearch-avatar>
					<img class=btr-fastsearch-thumbnail src=https://www.roblox.com/headshot-thumbnail/image?userId=${json.UserId}&width=48&height=48&format=png>
					<div class=btr-fastsearch-status>
					</div>
				</div>
				<div class=btr-fastsearch-text>
					<div class=btr-fastsearch-name>
						${json.Username.slice(0, hlFrom)}
						<b>${json.Username.slice(hlFrom, hlTo)}</b>
						${json.Username.slice(hlTo)}
					</div>
					<div class="text-label">
						${json.Alias ? `Formerly '${json.Alias}'` : json.IsFriend ? "You are friends" : ""}
					</div>
				</div>
			</a>
		</li>`

		// Presence

		const updatePresence = presence => {
			const status = item.$find(".btr-fastsearch-status")
			status.classList.remove("game", "studio", "online")

			const oldFollowBtn = item.$find(".btr-fastsearch-follow")
			if(oldFollowBtn) {
				oldFollowBtn.remove()
			}

			switch(presence.UserPresenceType) {
			case 0: break
			case 2: {
				status.classList.add("game")

				const followBtn = html`<button class="btr-fastsearch-follow btn-primary-xs">Join Game</button>`

				if(presence.PlaceId) {
					followBtn.setAttribute("onclick", `return Roblox.GameLauncher.followPlayerIntoGame(${json.UserId}), false`)
				} else {
					followBtn.classList.add("disabled")
				}

				item.$find(".btr-fastsearch-anchor").append(followBtn)
				break
			}
			case 3:
				status.classList.add("studio")
				break
			default:
				status.classList.add("online")
			}
		}

		if(!json.presence) {
			const url = `https://www.roblox.com/presence/user?userId=${json.UserId}`
			json.presence = $.fetch(url, { credentials: "include" })
				.then(resp => resp.json())
		}

		if(json.dirtyPresence) {
			json.dirtyPresence.then(updatePresence)
		}
		
		json.presence.then(updatePresence)

		return item
	}

	
	const clearResults = list => {
		fsResults.splice(0, fsResults.length).forEach(x => x.remove())
		const sel = list.$find(">.selected")
		if(!sel) {
			list.children[0].classList.add("selected")
		}
	}

	const updateResults = (search, list) => {
		clearTimeout(exactTimeout)
		clearResults(list)

		if(!usernameRegex.test(search)) { return }

		const thisUpdate = ++fsUpdateCounter

		const update = () => {
			if(fsUpdateCounter !== thisUpdate) { return }
			clearResults(list)

			const matches = Object.entries(requestCache)
				.filter(x => x[1] && (x[0] === search || (x[1].IsFriend && !x[1].Alias) && (x.index = x[0].indexOf(search)) !== -1))
			if(!matches.length) { return }

			const sel = list.$find(">.selected")
			if(sel) { sel.classList.remove("selected") }

			matches.forEach(x => x.sort = x[0] === search ? 0 : Math.abs(x[0].length - search.length) / 3 + x.index + (!x[1].IsFriend ? 100 : 0))
			matches.sort((a, b) => a.sort - b.sort)
			const len = Math.min(4, matches.length)

			// Show friends before exact match (if not friend)
			const first = matches[0]
			if(first[0] === search && !first[1].IsFriend) {
				for(let i = 1; i < len; i++) {
					const self = matches[i]
					if(self[1].IsFriend) {
						matches[i] = first
						matches[i - 1] = self
					} else {
						break
					}
				}
			}

			for(let i = 0; i < len; i++) {
				const x = matches[i]

				const json = x[1]
				const item = makeItem(json, x.index, x.index + search.length)

				if(fsResults.length) {
					fsResults[fsResults.length - 1].after(item)
				} else {
					list.prepend(item)
				}

				fsResults.push(item)

				if(i === 0) {
					item.classList.add("selected")
				}
			}
		}
		
		update()

		if(!friendsLoaded) {
			if(!friendsPromise) {
				friendsPromise = new SyncPromise(resolve => {
					loggedInUserPromise.then(userId => {
						const url = `https://www.roblox.com/users/friends/list-json?pageSize=200&userId=${userId}`
						$.fetch(url, { credentials: "include" }).then(async resp => {
							const json = await resp.json()

							json.Friends.forEach(friend => {
								const key = friend.Username.toLowerCase()
								const oldItem = requestCache[key]

								const item = {
									IsFriend: true,
									UserId: friend.UserId,
									Username: friend.Username,

									presence: oldItem && oldItem.presence,
									dirtyPresence: SyncPromise.resolve({
										UserPresenceType: friend.InStudio ? 3 : friend.InGame ? 2 : friend.IsOnline ? 1 : 0,
										LastLocation: friend.LastLocation,
										PlaceId: friend.PlaceId
									})
								}

								requestCache[key] = item
								friendsList[friend.UserId] = item
							})

							Object.entries(requestCache).forEach(([key, item]) => {
								if(item.IsFriend && !friendsList[item.UserId]) {
									delete requestCache[key]
								}
							})

							friendsLoaded = true
							updateCache()
							resolve(friendsList)
						})
					})
				})
			}

			friendsPromise.then(update)
		}

		if(search.length < 3) { return }

		exactTimeout = setTimeout(() => {
			if(!(search in requestCache)) {
				let cached = promiseCache[search]
				if(!cached) {
					cached = promiseCache[search] = $.fetch(`https://api.roblox.com/users/get-by-username?username=${search}`)
						.then(async resp => {
							const json = await resp.json()

							if("Id" in json) {
								if(friendsLoaded) {
									const friendItem = friendsList[json.Id]
									if(friendItem) {
										return Object.assign({ Alias: search }, friendItem)
									}
								}

								return { UserId: json.Id, Username: json.Username }
							}
							return false
						})
				}

				cached.then(json => {
					if(!(search in requestCache)) {
						requestCache[search] = json
					}

					if(json) { update() }
				})
			}
		}, 250)
	}

	document.$watch("#navbar-universal-search", async search => {
		const input = await search.$watch("#navbar-search-input").$promise()
		const list = await search.$watch(">ul").$promise()

		list.$on("mouseover", ".rbx-navbar-search-option", ev => {
			const last = list.$find(">.selected")
			if(last) { last.classList.remove("selected") }
			ev.currentTarget.classList.add("selected")
		})
		
		let lastValue
		input.$on("keyup", () => {
			if(input.value === lastValue) { return }
			lastValue = input.value
			updateResults(input.value.toLowerCase(), list)
		})

		list.prepend(fsResults)
	})
}
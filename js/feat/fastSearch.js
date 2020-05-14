"use strict"

const initFastSearch = () => {
	const usernameRegex = /^\w+(?:[ _]?\w+)?$/
	const exactSearching = {}
	const userCache = {}
	const searchResults = []
	let friendsLoaded = false
	let currentSearch = null
	let exactTimeout = null
	
	const thumbnailsToRequest = []
	const thumbnailCache = {}
	let thumbnailPromise = null

	const presencesToRequest = []
	const presenceCache = {}
	let lastPresenceRequest = 0
	let presencePromise = null
	
	try {
		const data = JSON.parse(localStorage.getItem("btr-fastsearch-cache"))

		Object.entries(data.friends).forEach(([name, id]) => {
			userCache[name.toLowerCase()] = {
				Username: name,
				UserId: id,
				IsFriend: true
			}
		})
	} catch(ex) {}

	//
	
	const requestThumbnail = userId => {
		if(thumbnailCache[userId]) {
			return thumbnailCache[userId]
		}

		thumbnailsToRequest.push(userId)

		if(!thumbnailPromise) {
			thumbnailPromise = new SyncPromise(resolve => {
				setTimeout(() => {
					const userIds = thumbnailsToRequest.splice(0, thumbnailsToRequest.length)
					thumbnailPromise = null

					const url = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userIds.join(",")}&size=48x48&format=Png`
					$.fetch(url).then(async resp => {
						const json = resp.ok && await resp.json()
						const result = {}

						if(json && json.data) {
							json.data.forEach(info => {
								if(info.imageUrl) {
									result[info.targetId] = info.imageUrl
								}
							})
						}

						resolve(result)
					})
				}, 100)
			})
		}

		return thumbnailCache[userId] = thumbnailPromise.then(thumbs => {
			if(!thumbs[userId]) {
				return new SyncPromise(resolve => {
					setTimeout(() => resolve(requestThumbnail(userId)), 500)
				})
			}

			return thumbs[userId]
		})
	}

	const requestPresence = userId => {
		if(presenceCache[userId]) {
			return presenceCache[userId]
		}

		presencesToRequest.push(userId)

		if(!presencePromise) {
			presencePromise = new SyncPromise(resolve => {
				setTimeout(() => {
					const userIds = presencesToRequest.splice(0, presencesToRequest.length)
					presencePromise = null

					lastPresenceRequest = Date.now()

					const url = `https://presence.roblox.com/v1/presence/users`
					$.fetch(url, {
						method: "POST",
						credentials: "include",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ userIds })
					}).then(async resp => {
						const json = resp.ok && await resp.json()
						const result = {}

						if(json && json.userPresences) {
							json.userPresences.forEach(info => {
								result[info.userId] = info
							})
						}

						resolve(result)
					})
				}, Math.max(200, 1000 - (Date.now() - lastPresenceRequest)))
			})
		}

		return presenceCache[userId] = presencePromise.then(presences => presences[userId])
	}

	//

	const clearResults = list => {
		searchResults.splice(0, searchResults.length).forEach(x => x.remove())

		const sel = list.$find(">.selected")
		if(!sel) {
			list.children[0].classList.add("selected")
		}
	}

	const updateSearch = (search, list) => {
		clearResults(list)

		clearTimeout(exactTimeout)
		exactTimeout = null

		currentSearch = Date.now()

		if(!usernameRegex.test(search)) { return }

		const reloadSearchResults = () => {
			const now = Date.now()
			currentSearch = now

			$.setImmediate(() => {
				if(currentSearch !== now) {
					return
				}
				
				clearResults(list)

				const allMatches = Object.entries(userCache)
					.map(([name, user]) => ({ name, user }))
					.filter(x => x.user && (x.name === search || (x.user.IsFriend && !x.user.Alias) && (x.index = x.name.indexOf(search)) !== -1))

				if(!allMatches.length) { return }

				allMatches.forEach(x => x.sort = x.name === search ? 0 : Math.abs(x.name.length - search.length) / 3 + x.index + (!x.user.IsFriend ? 1000 : 0))
				const matches = allMatches.sort((a, b) => a.sort - b.sort).slice(0, 4)

				// Move non-friend exacts to be last of the visible ones
				if(matches[0].name === search && !matches[0].user.IsFriend) {
					matches.push(matches.shift())
				}

				const first = list.firstElementChild
				for(let i = 0; i < matches.length; i++) {
					const { name, user, index } = matches[i]

					const highlightStart = name === search ? 0 : index
					const highlightEnd = name === search ? search.length : highlightStart + search.length

					const item = html`
					<li class="rbx-navbar-search-option rbx-clickable-li btr-fastsearch" data-searchurl=/User.aspx?userId=${user.UserId}&searchTerm=>
						<a class=btr-fastsearch-anchor href=/users/${user.UserId}/profile>
							<div class=btr-fastsearch-avatar>
								<img class=btr-fastsearch-thumbnail src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==">
								<div class=btr-fastsearch-status></div>
							</div>
							<div class=btr-fastsearch-text>
								<div class=btr-fastsearch-name>
									${user.Username.slice(0, highlightStart)}
									<b>${user.Username.slice(highlightStart, highlightEnd)}</b>
									${user.Username.slice(highlightEnd)}
								</div>
								<div class="text-label">
									${user.Alias ? `Formerly '${name}'` : user.IsFriend ? "You are friends" : ""}
								</div>
							</div>
						</a>
					</li>`

					first.before(item)
					searchResults.push(item)

					requestThumbnail(user.UserId).then(url => {
						if(currentSearch !== now) {
							return
						}

						item.$find(".btr-fastsearch-thumbnail").src = url
					})

					requestPresence(user.UserId).then(info => {
						if(currentSearch !== now) {
							return
						}
						
						const status = item.$find(".btr-fastsearch-status")
						status.classList.remove("game", "studio", "online")
				
						item.$findAll(".btr-fastsearch-placename, .btr-fastsearch-follow").forEach(x => x.remove())
				
						switch(info.userPresenceType) {
						case 0: break
						case 2: {
							status.classList.add("game")
							
							const placeName = html`<div class=btr-fastsearch-placename style="font-size:80%;color:rgb(2,143,47);padding-right:8px">${info.lastLocation || ""}</div>`
							const followBtn = html`<button class="btr-fastsearch-follow btn-primary-xs">Join Game</button>`
				
							if(info.placeId) {
								followBtn.setAttribute("onclick", `return Roblox.GameLauncher.followPlayerIntoGame(${user.UserId}), false`)
							} else {
								followBtn.classList.add("disabled")
							}
				
							item.$find(".btr-fastsearch-anchor").append(placeName, followBtn)
							if(user.IsFriend) {
								list.prepend(item) // Move to first if friend is ingame
							}

							break
						}
						case 3:
							status.classList.add("studio")
							break
						default:
							status.classList.add("online")
						}
					})
				}

				const sel = list.$find(">.selected")
				if(sel) { sel.classList.remove("selected") }

				searchResults[0].classList.add("selected")
			})
		}

		if(search.length >= 3) {
			exactTimeout = setTimeout(() => {
				if(search in userCache || search in exactSearching) {
					return
				}

				exactSearching[search] = true
				$.fetch(`https://api.roblox.com/users/get-by-username?username=${search}`).then(async resp => {
					delete exactSearching[search]

					if(search in userCache) {
						return
					}

					const json = resp.ok && await resp.json()
					if(!json || !json.Username) {
						userCache[search] = false
						return
					}

					const user = userCache[search] = {
						Username: json.Username,
						UserId: json.Id
					}

					const name = json.Username.toLowerCase()
					if(search !== name) {
						user.Alias = true

						if(userCache[name] && userCache[name].IsFriend) {
							user.IsFriend = true
						}

						userCache[name] = {
							Username: json.Username,
							UserId: json.Id,
							IsFriend: user.IsFriend
						}
					}

					reloadSearchResults()
				})
			}, 250)
		}

		if(!friendsLoaded) {
			friendsLoaded = true

			loggedInUserPromise.then(userId => {
				$.fetch(`https://friends.roblox.com/v1/users/${userId}/friends`, { credentials: "include" }).then(async resp => {
					const json = resp.ok && await resp.json()
					if(!json || !json.data) {
						return
					}

					Object.entries(userCache).filter(x => x[1].IsFriend).forEach(([name]) => {
						delete userCache[name]
					})

					const friends = {}
					
					json.data.forEach(friend => {
						friends[friend.name] = friend.id

						userCache[friend.name.toLowerCase()] = {
							Username: friend.name,
							UserId: friend.id,
							IsFriend: true
						}

						requestPresence(friend.id)
					})

					localStorage.setItem("btr-fastsearch-cache", JSON.stringify({ friends }))

					reloadSearchResults()
				})
			})
		}

		reloadSearchResults()
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
			updateSearch(input.value.toLowerCase(), list)
		})
	})
}
"use strict"

const btrFastSearch = {
	init() {
		const usernameRegex = /^\w+(?:[ _]?\w+)?$/
		const userCache = {}
		const searchResults = []
		let currentSearchStarted = 0
		let currentSearchText = ""
		let lastResultsLoaded = 0
		let friendsLoaded = false
		let container
		let list
		
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

		const clearResults = () => {
			searchResults.splice(0, searchResults.length).forEach(x => x.remove())

			const sel = list.$find(">.selected")
			if(!sel) {
				const target = list.$find(">li")
				target.classList.add("selected")
			}
		}

		const getMatches = search => {
			const allMatches = Object.entries(userCache)
				.map(([name, user]) => ({ name, user }))
				.filter(x => x.user && (x.name === search || (x.user.IsFriend && !x.user.Alias) && (x.index = x.name.indexOf(search)) !== -1))

			allMatches.forEach(x => x.sort = x.name === search ? 0 : Math.abs(x.name.length - search.length) / 3 + x.index + (!x.user.IsFriend ? 1000 : 0))

			const matches = allMatches.sort((a, b) => a.sort - b.sort).slice(0, 4)

			// Move non-friend exacts to be last of the visible ones
			if(matches.length && matches[0].name === search && !matches[0].user.IsFriend) {
				matches.push(matches.shift())
			}

			return matches
		}

		const reloadSearchResults = () => {
			const search = currentSearchText
			const now = Date.now()

			lastResultsLoaded = now

			$.setImmediate(() => {
				if(lastResultsLoaded !== now) {
					return
				}

				const lastSelected = list.$find(">.selected")
				const selectFirst = !lastSelected || !searchResults.length && lastSelected === list.$find(">li") || searchResults.includes(lastSelected)

				clearResults()

				const matches = getMatches(search)
				for(let i = 0; i < matches.length; i++) {
					const { name, user, index } = matches[i]
					const highlightStart = name === search ? 0 : index
					const highlightEnd = name === search ? search.length : highlightStart + search.length

					let item

					if(user.Temporary) {
						item = html`
						<li class="navbar-search-option rbx-clickable-li btr-fastsearch" data-searchurl=/User.aspx?username=>
							<a class=btr-fastsearch-anchor>
								<div class=btr-fastsearch-avatar>
									<img class=btr-fastsearch-thumbnail src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" style="visibility: hidden">
									<div class=btr-fastsearch-status></div>
								</div>
								<div class=btr-fastsearch-text>
									<div class=btr-fastsearch-name>
										${user.Username.slice(0, highlightStart)}
										<b>${user.Username.slice(highlightStart, highlightEnd)}</b>
										${user.Username.slice(highlightEnd)}
									</div>
									<div class="text-label">
										${user.NotFound ? "User not found" : "Loading..."}
									</div>
								</div>
							</a>
						</li>`
					} else {
						let label = user.IsFriend ? "You are friends" : ""
						if(user.Alias) {
							label += (label ? ". " : "") + `Formerly '${name}'`
						}

						item = html`
						<li class="navbar-search-option rbx-clickable-li btr-fastsearch" data-searchurl=/User.aspx?userId=${user.UserId}&searchTerm=>
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
										${label}
									</div>
								</div>
							</a>
						</li>`
					}

					if(searchResults.length) {
						searchResults[searchResults.length - 1].after(item)
					} else {
						container.prepend(item)
					}

					searchResults.push(item)

					if(!user.Temporary) {
						requestThumbnail(user.UserId).then(url => {
							if(lastResultsLoaded !== now) {
								return
							}

							item.$find(".btr-fastsearch-thumbnail").src = url
						})

						requestPresence(user.UserId).then(info => {
							if(lastResultsLoaded !== now) {
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

								if(user.IsFriend) { // Move to first if friend is ingame
									searchResults.splice(searchResults.indexOf(item), 1)
									container.prepend(item)
									searchResults.unshift(item)
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
				}

				if(selectFirst && searchResults.length) {
					const prev = list.$find(">.selected")
					if(prev) {
						prev.classList.remove("selected")
					}

					searchResults[0].classList.add("selected")
				}
			})
		}

		const updateSearch = search => {
			const searchStarted = Date.now()

			currentSearchText = search
			currentSearchStarted = searchStarted
			lastResultsLoaded = -1

			if(search.length >= 3 && usernameRegex.test(search)) {
				if(!userCache[search]) {
					const temp = {
						Temporary: true,
						Username: search
					}

					userCache[search] = temp

					$.fetch(`https://api.roblox.com/users/get-by-username?username=${search}`).then(async resp => {
						if(userCache[search] !== temp) {
							return
						}

						const json = resp.ok && await resp.json()
						if(!json || !json.Username) {
							temp.NotFound = true
							reloadSearchResults()
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

						if(currentSearchStarted === searchStarted) {
							reloadSearchResults()
						}
					})
				}
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

						if(currentSearchStarted === searchStarted) {
							reloadSearchResults()
						}
					})
				})
			}

			reloadSearchResults()
		}

		document.$watch("#header", header => {
			document.$watch("#btr-fastsearch-container", _cont => {
				container = _cont
		
				const search = container.closest("#navbar-universal-search")
				const input = search.$find("#navbar-search-input")
				list = search.$find(">ul")
		
				input.$on("keydown", ev => {
					if(ev.keyCode === 38 || ev.keyCode === 40 || ev.keyCode === 9) {
						const selected = list.$find(".selected")
						if(!selected || !searchResults.length) {
							return
						}
		
						const index = searchResults.indexOf(selected)
						let prevent = true
						let next
		
						if(index !== -1) {
							if(ev.keyCode === 38) {
								if(index === 0) {
									next = list.lastElementChild
									prevent = false
								} else {
									next = searchResults[index - 1]
								}
							} else {
								if(index < searchResults.length - 1) {
									next = searchResults[index + 1]
								} else {
									next = container.nextElementSibling
								}
							}
						} else {
							if(ev.keyCode === 38) {
								if(selected.previousElementSibling === container) {
									next = searchResults[searchResults.length - 1]
								}
							} else {
								if(!selected.nextElementSibling) {
									next = searchResults[0]
									prevent = false
								}
							}
						}
		
						if(next) {
							selected.classList.remove("selected")
							next.classList.add("selected")
		
							requestAnimationFrame(() => {
								const newSel = list.$findAll(".selected")
								newSel.forEach(x => x !== next && x.classList.remove("selected"))
							})
		
							if(prevent) {
								ev.stopImmediatePropagation()
								ev.stopPropagation()
								ev.preventDefault()
							}
						}
					}
				})
		
				input.$on("keyup", ev => {
					if(ev.keyCode === 13) {
						const selected = list.$find(".selected")
						if(!selected || !searchResults.includes(selected)) {
							return
						}
		
						window.location = selected.$find("a").href
		
						ev.stopImmediatePropagation()
						ev.stopPropagation()
						ev.preventDefault()
					}
				}, { capture: true })
		
				let lastValue
				input.$on("input", () => {
					if(input.value === lastValue) { return }
					lastValue = input.value
					updateSearch(input.value.toLowerCase())
				})
			})
		})
	}
}
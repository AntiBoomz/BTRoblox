"use strict"

const btrFastSearch = {
	init() {
		const usernameRegex = /^[a-zA-Z0-9]+(?:[ _.]?[a-zA-Z0-9]+)?$/
		const userCache = {}
		
		let currentSearchText = ""
		let lastResultsLoaded = 0
		let friendsLoaded = false
		
		const thumbnailsToRequest = []
		const thumbnailCache = {}
		let thumbnailPromise = null

		const presencesToRequest = []
		const presenceCache = {}
		let lastPresenceRequest = 0
		let presencePromise = null
		
		try {
			const data = JSON.parse(localStorage.getItem("btr-fastsearch-cache"))

			Object.entries(data.friends).forEach(([key, id]) => {
				const pieces = key.split("|")
				
				userCache[pieces[0].toLowerCase()] = {
					Username: pieces[0],
					DisplayName: pieces[1] || pieces[0],
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
			
			const request = userId => {
				thumbnailsToRequest.push(userId)
	
				if(!thumbnailPromise) {
					thumbnailPromise = new SyncPromise(resolve => {
						setTimeout(() => {
							const userIds = thumbnailsToRequest.splice(0, thumbnailsToRequest.length)
							thumbnailPromise = null
							
							RobloxApi.thumbnails.getAvatarHeadshots(userIds).then(thumbs => {
								const result = {}
								
								for(const thumb of thumbs) {
									if(thumb.imageUrl) {
										result[thumb.targetId] = thumb.imageUrl
									}
								}
								
								resolve(result)
							})
						}, 100)
					})
				}
				
				return thumbnailPromise
			}
			
			let numRetries = 0
			const checkForThumb = thumbs => {
				if(!thumbs[userId]) {
					if(numRetries++ >= 1) {
						delete thumbnailCache[userId]
						return null
					}
					
					return new SyncPromise(resolve => setTimeout(resolve, 500))
						.then(() => request(userId).then(checkForThumb))
				}

				return thumbs[userId]
			}
			
			return thumbnailCache[userId] = request(userId).then(checkForThumb)
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
		
		const getMatches = search => {
			const matches = Object.entries(userCache)
				.map(([name, user]) => {
					const x = {
						name, user, isAlias: name !== user.Username.toLowerCase()
					}
					
					if(name === search) {
						x.display = user.Username
						x.index = 0
						x.sort = 0
					} else if(!x.user.Hidden && x.user.IsFriend && !x.isAlias) {
						const display = user.DisplayName.toLowerCase()
						
						const nameIndex = name.indexOf(search)
						const displayIndex = display.indexOf(search)
						
						if(nameIndex !== -1 && (displayIndex === -1 || nameIndex < displayIndex)) {
							x.display = user.Username
							x.index = nameIndex
							x.sort = nameIndex + x.display.length / 200
						} else if(displayIndex !== -1) {
							x.display = user.DisplayName
							x.index = displayIndex
							x.sort = displayIndex + x.display.length / 200
						}
					}
					
					if(x.display && !x.user.IsFriend) {
						x.sort += 1000
					}
					
					return x
				})
				.filter(x => x.display)
				.sort((a, b) => a.sort - b.sort).slice(0, 4)

			// Move non-friend exacts to be last of the visible ones
			if(matches.length && matches[0].name === search && !matches[0].user.IsFriend) {
				matches.push(matches.shift())
			}

			return matches
		}

		const getInfo = () => {
			const search = $("#navbar-universal-search, .navbar-search")
			if(!search) { return {} }
			
			const input = search.$find("input")
			if(!input) { return {} }
			
			const container = search.$find("#btr-fastsearch-container")
			if(!container) { return {} }
			
			const list = container.parentNode
			
			return {
				search, input, container, list,
				selectedClass: list.classList.contains("new-dropdown-menu") ? "new-selected" : "selected"
			}
		}

		const clearResults = () => {
			const { list, container, selectedClass } = getInfo()
			if(!list) { return }
			
			container.$findAll(`>li`).forEach(x => x.remove())
			
			if(!list.$find(`>.${selectedClass}`)) {
				list.$find(">li")?.classList.add(selectedClass)
			}
		}

		const reloadSearchResults = preserveSelection => {
			const { container, list, selectedClass } = getInfo()
			if(!container) { return }
			
			const now = Date.now()
			lastResultsLoaded = now
			
			if(currentSearchText.length === 0) {
				return clearResults()
			}
			
			const searchResults = Array.from(container.$findAll(">li"))
			const preservedIndex = searchResults.findIndex(x => x.classList.contains(selectedClass))
			const results = []

			clearResults()

			const matches = getMatches(currentSearchText)
			for(let i = 0; i < matches.length; i++) {
				const { name, user, display, index, isAlias } = matches[i]
				const highlightStart = isAlias ? display.length : index
				const highlightEnd = isAlias ? display.length : highlightStart + currentSearchText.length

				const item = html`
				<li class="navbar-search-option rbx-clickable-li btr-fastsearch">
					<a class=btr-fastsearch-anchor>
						<div class=btr-fastsearch-avatar>
							<span class=btr-fastsearch-thumbnail-container>
								<img class=btr-fastsearch-thumbnail src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==">
							</span>
							<div class=btr-fastsearch-status></div>
						</div>
						<div class=btr-fastsearch-text>
							<div class=btr-fastsearch-name>
								${display.slice(0, highlightStart)}
								<b>${display.slice(highlightStart, highlightEnd)}</b>
								${display.slice(highlightEnd)}
							</div>
							<div class="text-label"></div>
						</div>
					</a>
				</li>`
				
				const label = item.$find(".text-label")

				if(user.Temporary) {
					item.dataset.searchurl = `/User.aspx?username=`
					label.append(`${user.NotFound ? "User not found" : "Loading..."}`)
					
					if(user.NotFound) {
						item.$find(".btr-fastsearch-thumbnail").style.visibility = "hidden"
					}
				} else {
					item.dataset.searchurl = `/User.aspx?userId=${user.UserId}&searchTerm=`
					item.$find("a").href = `/users/${user.UserId}/profile`
					
					if(user.IsFriend) {
						label.append(`You are friends`)
					}
					
					if(isAlias) {
						if(user.IsFriend) {
							label.append(`. `)
						}
						
						label.append(`Formerly '`, html`<b>${name}</b>`, `'`)
					}
				}
				
				if(results.length) {
					results[results.length - 1].after(item)
				} else {
					container.prepend(item)
				}
				
				results.push(item)
				
				if(!user.Temporary) {
					item.$find(".btr-fastsearch-thumbnail").classList.add("shimmer", "loading")
					
					requestThumbnail(user.UserId).then(url => {
						if(lastResultsLoaded !== now) { return }
						
						const thumb = item.$find(".btr-fastsearch-thumbnail")
						
						if(url) {
							thumb.src = url
						} else {
							thumb.src = `data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHg9IjAiIHk9IjAiIHdpZHRoPSI5MCIgaGVpZ2h0PSI5MCIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PHN0eWxlPi5zdDJ7ZmlsbDpub25lO3N0cm9rZTojMDAwO3N0cm9rZS13aWR0aDoyO3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDoxMH08L3N0eWxlPjxnIGlkPSJ1bmFwcHJvdmVkXzFfIj48cGF0aCBpZD0iYmdfMl8iIGZpbGw9IiNmZmYiIGQ9Ik0wIDBoOTB2OTBIMHoiLz48ZyBpZD0idW5hcHByb3ZlZCIgb3BhY2l0eT0iLjEiPjxjaXJjbGUgY2xhc3M9InN0MiIgY3g9IjQ1IiBjeT0iNDguOCIgcj0iMTAiLz48cGF0aCBjbGFzcz0ic3QyIiBkPSJNMzggNDEuN2wxNCAxNC4xTTMyLjUgMjMuNWgtNHY0TTI4LjUgNjIuNXY0aDRNMjguNSAzMS44djZNMjguNSA0MnY2TTI4LjUgNTIuMnY2TTU3LjUgNjYuNWg0di00TTYxLjUgNTguMnYtNk02MS41IDQ4di02TTYxLjUgMzcuOHYtNE0zNi44IDY2LjVoNk00Ny4yIDY2LjVoNk0zNi44IDIzLjVoNk00Ny4yIDIzLjVoNE01MS40IDIzLjZsMy41IDMuNU01Ny45IDMwLjFsMy41IDMuNU01MS4yIDIzLjh2M001OC41IDMzLjhoM001MS4yIDMwLjJ2My42aDMuNiIvPjwvZz48L2c+PC9zdmc+`
						}
						
						const onload = () => {
							thumb.classList.remove("shimmer", "loading")
						}
						
						if(thumb.loaded) {
							onload()
						} else {
							thumb.$once("load", onload)
						}
					})

					requestPresence(user.UserId).then(info => {
						if(lastResultsLoaded !== now) { return }
						
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
			
			const lastSelection = list.$find(`.${selectedClass}`)
			
			if(preserveSelection && preservedIndex === -1 && lastSelection) {
				// If we want to preserve selection and we had a default option
				// selected, then do nothing
			} else {
				const newSelection = (preserveSelection && results[preservedIndex]) || results[0] || container.nextElementSibling
				
				lastSelection?.classList.remove(selectedClass)
				newSelection?.classList.add(selectedClass)
			}
		}

		const updateSearch = search => {
			if(currentSearchText === search) { return }
			
			currentSearchText = search
			lastResultsLoaded = -1

			if(search.length >= 3 && usernameRegex.test(search)) {
				if(!userCache[search]) {
					const temp = {
						Temporary: true,
						Hidden: search.length > 20 || search.includes(" "), // Uncommon parts of a name
						Username: search
					}

					userCache[search] = temp
					
					const url = `https://users.roblox.com/v1/usernames/users`
					$.fetch(url, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ usernames: [search], excludeBannedUsers: false })
					}).then(async resp => {
						if(userCache[search] !== temp) {
							return
						}

						const result = resp.ok && await resp.json()
						const json = result?.data?.[0]
						
						if(!json?.name) {
							temp.NotFound = true
							reloadSearchResults(true)
							return
						}

						const user = userCache[search] = {
							Username: json.name,
							DisplayName: json.displayName,
							UserId: json.id
						}

						const name = user.Username.toLowerCase()
						if(search !== name) {
							if(userCache[name]) {
								userCache[search] = userCache[name]
							} else {
								userCache[name] = user
							}
						}

						reloadSearchResults(true)
					})
				}
			}

			if(!friendsLoaded) {
				friendsLoaded = true

				loggedInUserPromise.then(userId => {
					RobloxApi.friends.getFriends(userId).then(friendsArray => {
						Object.entries(userCache).filter(x => x[1].IsFriend).forEach(([name]) => {
							delete userCache[name]
						})

						const friendsDict = {}
						
						for(const friend of friendsArray) {
							friendsDict[friend.displayName !== friend.name ? `${friend.name}|${friend.displayName}` : friend.name] = friend.id

							userCache[friend.name.toLowerCase()] = {
								Username: friend.name,
								DisplayName: friend.displayName,
								UserId: friend.id,
								IsFriend: true
							}

							requestPresence(friend.id)
						}

						localStorage.setItem("btr-fastsearch-cache", JSON.stringify({ friendsDict }))
						reloadSearchResults(true)
					})
				})
			}

			reloadSearchResults(false)
		}
		
		const keyDown = ev => {
			if(ev.keyCode === 38 || ev.keyCode === 40 || ev.keyCode === 9) {
				const { list, container, selectedClass } = getInfo()
				if(!list) { return }
				
				const selected = list.$find(`.${selectedClass}`)
				if(!selected) {
					return
				}
				
				const searchResults = Array.from(container.$findAll(">li"))
				const searchIndex = searchResults.indexOf(selected)
				
				let prevent = true
				let next
				
				if(searchIndex !== -1) {
					if(ev.keyCode === 38) {
						if(searchIndex > 0) {
							next = searchResults[searchIndex - 1]
						} else {
							next = list.lastElementChild
							prevent = false
						}
					} else {
						if(searchIndex < searchResults.length - 1) {
							next = searchResults[searchIndex + 1]
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
					selected.classList.remove(selectedClass)
					next.classList.add(selectedClass)

					if(prevent) {
						ev.stopImmediatePropagation()
						ev.stopPropagation()
						ev.preventDefault()
					}
				}
			}
		}
		
		const keyUp = ev => {
			if(ev.keyCode === 13) {
				const { container, selectedClass } = getInfo()
				if(!container) { return }
				
				const selected = container.$find(`.${selectedClass}`)
				if(!selected) { return }
				
				const url = selected.$find("a")?.href
				if(url) {
					window.location = url
				}

				ev.stopImmediatePropagation()
				ev.stopPropagation()
				ev.preventDefault()
			}
		}
		
		const update = () => {
			const { input } = getInfo()
			if(!input) { return }
			
			updateSearch(input.value.toLowerCase())
		}
		
		let requesting = false
		const requestClassUpdate = () => {
			if(requesting) { return }
			requesting = true
			
			setTimeout(() => {
				requesting = false
				
				const { list, container, selectedClass } = getInfo()
				if(!list) { return }
				
				const selectedResult = container.$find(`>.${selectedClass}`)
				const selectedDefault = list.$find(`>.${selectedClass}`)
				
				if(selectedResult && selectedDefault) {
					if(selectedDefault === container.nextElementSibling) {
						selectedDefault.classList.remove(selectedClass)
					} else {
						selectedResult.classList.remove(selectedClass)
					}
				}
			}, 0)
		}
		
		document.$watch("#header").$then().$watch("#navbar-universal-search, .navbar-search, #navbar-search-input", search => {
			search.$on("keydown", "input", keyDown)
			search.$on("keyup", "input", keyUp, { capture: true })
			search.$on("input", "input", update)
			update()
			
			new MutationObserver(requestClassUpdate).observe(search, { subtree: true, attributes: true, attributeFilter: ["class"] })
		}, { continuous: true })
		
		reactInject({
			selector: "#navbar-universal-search ul, .navbar-search ul",
			index: 0,
			html: `<div id="btr-fastsearch-container"><div style=display:none></div></div>`
		})
	}
}
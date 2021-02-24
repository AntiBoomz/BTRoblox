"use strict"

pageInit.profile = function(userId) {
	if(!SETTINGS.get("profile.enabled")) { return }

	const newCont = html`
	<div class=btr-profile-container>
		<div class=btr-profile-left>
			<div class="btr-profile-about profile-about">
				<div class=container-header><h3>About</h3></div>
				<div class=section-content>
					<div class=placeholder-status style=display:none></div>
					<div class=placeholder-avatar style=display:none></div>
					<div class=placeholder-desc style=display:none></div>
					<div class=placeholder-aliases style=display:none></div>
					<div class=placeholder-stats style=display:none></div>
					<div class=placeholder-footer style=display:none></div>
				</div>
			</div>
			<div class=placeholder-robloxbadges>
				<div class=container-header><h3>Roblox Badges</h3></div>
				<div class=section-content>
					<div class="section-content-off btr-section-content-off">This user has no Roblox Badges</div>
				</div>
			</div>
			<div class=btr-profile-playerbadges>
				<div class=container-header><h3>Player Badges</h3></div>
				<div class=section-content>
					<ul class=hlist>
					</ul>
				</div>
			</div>
			<div class=btr-profile-groups>
				<div class=container-header><h3>Groups</h3></div>
				<div class=section-content>
					<ul class=hlist>
						<div class="section-content-off btr-section-content-off">This user is not in any Groups</div>
					</ul>
				</div>
			</div>
		</div>

		<div class=btr-profile-right>
			<div class=placeholder-games>
				<div class=container-header><h3>Games</h3></div>
				<div class=section-content>
					<div class="section-content-off btr-section-content-off">This user has no active Games</div>
				</div>
			</div>
			<div class=placeholder-friends>
				<div class=container-header><h3>Friends</h3></div>
				<div class=section-content>
					<div class="section-content-off btr-section-content-off">This user has no Friends</div>
				</div>
			</div>
			<div class=btr-profile-favorites>
				<div class=container-header>
					<h3>Favorites</h3>
					<a href=./favorites class="btn-secondary-xs btn-fixed-width btn-more see-all-link-icon">See All</a>
				</div>
				<div class=section-content>
					<ul class="hlist game-cards">
						<div class="section-content-off btr-section-content-off">This user has no favorite Places</div>
					</ul>
				</div>
			</div>
		</div>

		<div class=btr-profile-bottom>
			<div class=placeholder-collections style=display:none></div>
			<div class=placeholder-inventory style=display:none></div>
		</div>
	</div>`

	const onlineStatus = SETTINGS.get("profile.lastOnline") && $.fetch(`https://api.roblox.com/users/${userId}/onlinestatus/`)
	const bodyWatcher = document.$watch("body", body => body.classList.add("btr-profile")).$then()

	bodyWatcher.$watch(".profile-container").$then()
		.$watch(".rbx-tabs-horizontal", cont => {
			cont.before(newCont)
			cont.setAttribute("ng-if", "false") // Let's make angular clean it up :)

			cont.$watch(".profile-about", about => {
				newCont.$find(".profile-about").setAttribute("ng-controller", about.getAttribute("ng-controller"))
	
				about
					.$watch("profile-description,.profile-about-content", desc => {
						if(desc.classList.contains("profile-about-content") && desc.closest("profile-description")) {
							// in case it selected profile-about-content in the new profile-description
							desc = desc.closest("profile-description")
						}

						newCont.$find(".placeholder-desc").replaceWith(desc)

						if(desc.matches("profile-description")) {
							newCont.$find(".btr-profile-about > .container-header").style.visibility = "hidden"
						}
					})
					.$watch("#aliases-container", aliases => {
						newCont.$find(".placeholder-aliases").replaceWith(aliases)
					})
					.$watch(".profile-about-footer", footer => {
						newCont.$find(".placeholder-footer").replaceWith(footer)
			
						const tooltip = footer.$find(".tooltip-pastnames")
						if(tooltip) { tooltip.setAttribute("data-container", "body") } // Display tooltip over side panel
					})
					.$watch(".profile-social-networks", social => {
						newCont.$find(".btr-profile-about .container-header").append(social)
					})
			})
		})
		.$watch(".profile-header-top .header-caption", () => { // Wait for the first element after status
			const status = $(".profile-avatar-status")
			const statusDiv = html`<div class="btr-header-status-parent"></div>`
			newCont.$find(".placeholder-status").replaceWith(statusDiv)
			const statusText = html`<span class="btr-header-status-text"></span>`
			statusDiv.append(statusText)
			const statusLabel = html`<span></span>`
			statusText.append(statusLabel)

			if(!status) {
				statusText.classList.add("btr-status-offline")
				statusLabel.textContent = "Offline"
			} else {
				const statusTitle = status.getAttribute("title")

				if(status.classList.contains("icon-game")) {
					statusText.classList.add("btr-status-ingame")
					statusLabel.textContent = statusTitle || "In Game"
					
					const link = status.parentElement
					if(link.href && link.href.includes("PlaceId=")) {
						const anchor = html`<a href="${link.href}" title="${status.title}"></a>`
						statusText.before(anchor)
						anchor.prepend(statusText)
						anchor.after(html`<a class="btr-header-status-follow-button" title="Follow" onclick="Roblox.GameLauncher.followPlayerIntoGame(${userId})">\uD83D\uDEAA</a>`)
					}
				} else if(status.classList.contains("icon-studio")) {
					statusText.classList.add("btr-status-studio")
					statusLabel.textContent = statusTitle || "In Studio"

					$(".profile-container").$watch("#profile-header-more").$then().$watch(">script", script => {
						if(script.textContent.includes("play_placeId=")) {
							const id = +script.textContent.match(/play_placeId=(\d+)/)[1]
							if(Number.isSafeInteger(id) && id !== 0) {
								const anchor = html`<a href="/games/${id}/" title="${statusTitle}"></a>`
								statusText.before(anchor)
								anchor.prepend(statusText)
							}
						}
					})
				} else {
					statusText.classList.add("btr-status-online")
					statusLabel.textContent = statusTitle || "Online"
				}
			}
		})
		.$watch(".profile-avatar", avatar => {
			newCont.$find(".placeholder-avatar").replaceWith(avatar)
			avatar.$find(".container-header").remove()

			const avatarLeft = avatar.$find(".profile-avatar-left")
			const avatarRight = avatar.$find(".profile-avatar-right")

			avatar.classList.remove("section")
			avatarLeft.classList.remove("col-sm-6", "section-content")
			avatarRight.classList.remove("col-sm-6", "section-content")

			avatarRight.style.transition = "none" // stop transition on page load
			setTimeout(() => avatarRight.style.transition = "", 1e3)

			const toggleItems = html`<span class="btr-toggle-items btn-control btn-control-sm">Show Items</span>`
			avatar.$find("#UserAvatar").append(toggleItems)

			let visible = false

			function toggleVisible() {
				visible = !visible
				avatarRight.classList.toggle("visible", visible)

				toggleItems.textContent = visible ? "Hide Items" : "Show Items"
			}

			toggleItems.$on("click", ev => {
				toggleVisible()
				ev.stopPropagation()
			})

			avatarRight.$on("click", ev => ev.stopPropagation())
			document.$on("click", () => visible && toggleVisible())
		})
		.$watch(".profile-statistics", outerStats => {
			newCont.$find(".placeholder-stats").replaceWith(outerStats)
			outerStats.classList.add("btr-profileStats")

			if(SETTINGS.get("profile.lastOnline")) {
				outerStats.$watch(".profile-stats-container", stats => {
					stats.classList.add("btr-lastOnline")

					const label = html`
					<li class=profile-stat>
						<p class=text-label>Last Online</p>
						<p class=text-lead>Loading</p>
					</li>`

					if(stats.firstElementChild) {
						stats.firstElementChild.after(label)
					} else {
						stats.prepend(label)
					}

					
					onlineStatus.then(async resp => {
						if(!resp.ok) {
							label.$find(".text-lead").textContent = "Failed"
							return
						}

						const presence = await resp.json()
						const lastOnline = new Date(presence.LastOnline)

						if(presence.PresenceType === 0) {
							label.$find(".text-lead").textContent = `${lastOnline.$since()}`
						} else {
							label.$find(".text-lead").textContent = "Now"
						}

						label.$find(".text-lead").title = lastOnline.$format("MMM D, YYYY | hh:mm A (T)")
					})
				})
			}
		})
		.$watch("#roblox-badges-container", badges => {
			newCont.$find(".placeholder-robloxbadges").replaceWith(badges)

			badges.$watch(">.section-content", content => {
				content.classList.remove("remove-panel")
			})
		})
		.$watch("#games-switcher", switcher => {
			const games = switcher.parentNode
			newCont.$find(".placeholder-games").replaceWith(games)

			games.classList.add("section")

			const grid = games.$find(".game-grid")
			grid.setAttribute("ng-cloak", "")

			const cont = html`<div id="games-switcher" class="section-content" ng-hide="isGridOn"></div>`
			switcher.setAttribute("ng-if", "false") // Let's make angular clean it up :)
			switcher.style.display = "none"
			switcher.after(cont)


			const hlist = html`<ul class="hlist btr-games-list" ng-non-bindable></ul>`
			cont.append(hlist)

			const pageSize = 10
			const pager = createPager(false, true)
			hlist.after(pager)

			const gameItems = []
			let lastRequest
			let selected

			pager.onsetpage = page => {
				pager.setPage(page)
				gameItems.forEach(item => item.updateVisibility())
			}

			class GameDetailsRequest {
				constructor() {
					this.placeIdList = []
					this.executed = false
				}
				canJoin() {
					return !this.executed && this.placeIdList.length < 50
				}
				append(placeId) {
					this.placeIdList.push(placeId)

					if(!this.promise) {
						this.promise = new SyncPromise(resolve =>
							$.setImmediate(() => this.execute(resolve))
						)
					}
				}
				execute(resolve) {
					this.executed = true

					const places = this.placeIdList.join("&placeIds=")
					const fetchUrl = `https://games.roblox.com/v1/games/multiget-place-details?placeIds=${places}`

					$.fetch(fetchUrl, { credentials: "include" }).then(resp => {
						if(!resp.ok) {
							console.warn("[BTRoblox]: Failed to load place details")
							return
						}

						resolve(resp.json())
					})
				}
			}

			class GameItem {
				constructor(slide) {
					this.init(slide)
				}

				async init(slide) {
					const slideImage = await slide.$watch(".slide-item-image").$promise()
					const slideName = await slide.$watch(".slide-item-name").$promise()
					const slideDesc = await slide.$watch(".slide-item-description").$promise()
					const slideEmblemLink = await slide.$watch(".slide-item-emblem-container > a").$promise()
					const slideStats = await slide.$watch(".slide-item-stats > .hlist").$promise()
					
					const index = this.index = +slide.dataset.index
					const pageIndex = this.pageIndex = Math.floor(index / pageSize)
					const placeId = this.placeId = slideImage.dataset.emblemId

					const title = slideName.textContent
					const desc = slideDesc.textContent
					const url = slideEmblemLink.href
					const iconThumb = slideImage.dataset.src
					this.iconRetryUrl = slideImage.dataset.retry

					const item = this.item = html`
					<li class="btr-game">
						<div class="btr-game-button">
							<span class="btr-game-title">${title}</span>
						</div>
						<div class="btr-game-content">
							<div class="btr-game-thumb-container">
								<a href="${url}">
									<img class="btr-game-thumb">
									<img class="btr-game-icon" src="${iconThumb}">
								</a>
							</div>
							<div class="btr-game-desc">
								<span class="btr-game-desc-content">${desc}</span>
							</div>
							<div class="btr-game-info">
								<div class="btr-game-playbutton-container">
									<div class="btr-game-playbutton btn-primary-lg VisitButtonPlay VisitButtonPlayGLI" placeid="${placeId}"  data-action=play data-is-membership-level-ok=true>
										Play
									</div>
								</div>
								<div class="btr-game-stats"></div>
							</div>
						</div>
					</li>`

					item.$find(".btr-game-stats").append(slideStats)
					item.$find(".btr-game-button").$on("click", () => this.toggle())

					hlist.append(item)
					pager.setMaxPage(pageIndex + 1)
					gameItems.push(this)

					this.updateVisibility()
				}

				updateVisibility() {
					const visible = this.pageIndex === (pager.curPage - 1)
					this.item.classList.toggle("visible", visible)

					if(visible && this.index === (pager.curPage - 1) * pageSize) {
						this.select(true)
					}
					
					if(visible && !this.firstVisible) {
						this.firstVisible = true
						
						this.item.$find(".btr-game-thumb").src = `https://www.roblox.com/asset-thumbnail/image?assetId=${this.placeId}&width=768&height=432`

						lastRequest = (lastRequest && lastRequest.canJoin()) ? lastRequest : new GameDetailsRequest()
						lastRequest.append(this.placeId)

						const gamePromise = lastRequest.promise.then(data => data.find(x => +x.placeId === +this.placeId))

						loggedInUserPromise.then(loggedInUser => {
							if(+userId !== +loggedInUser) { return }

							const dropdown = html`
							<div class="btr-game-dropdown">
								<a class="rbx-menu-item" data-toggle="popover" data-container="body" data-bind="btr-placedrop-${this.placeId}">
									<span class="icon-more"></span>
								</a>
								<div data-toggle="btr-placedrop-${this.placeId}" style="display:none">
									<ul class="dropdown-menu" role="menu">
										<li><a onclick=Roblox.GameLauncher.editGameInStudio(${this.placeId})><div>Edit</div></a></li>
										<li><a href="/places/${this.placeId}/stats"><div>Developer Stats</div></a></li>
										<li><a href="/places/${this.placeId}/update"><div>Configure this Place</div></a></li>
										<li><a class=btr-btn-toggle-profile data-placeid="${this.placeId}"><div>Remove from Profile</div></a></li>
										<li><a class=btr-btn-shutdown-all data-placeid="${this.placeId}"><div>Shut Down All Servers</div></a></li> 
									</ul>
								</div>
							</div>`

							this.item.$find(".btr-game-button").before(dropdown)

							gamePromise.then(data => {
								if(!data) { return }

								dropdown.$find(".dropdown-menu").children[2].after(
									html`<li><a href=/universes/configure?id=${data.universeId}><div>Configure this Game</div></a></li>`,
									html`<li><a href=/localization/games/${data.universeId}/configure><div>Configure Localization</div></a></li>`,
								)
							})
						})

						const descElem = this.item.$find(".btr-game-desc")
						const descContent = this.item.$find(".btr-game-desc-content")
						const descToggle = html`<span class="btr-toggle-description">Read More</span>`

						descToggle.$on("click", () => {
							const expanded = !descElem.classList.contains("expanded")
							descElem.classList.toggle("expanded", expanded)

							descToggle.textContent = expanded ? "Show Less" : "Read More"
						})

						const updateDesc = () => {
							if(descContent.offsetHeight > 156) {
								descElem.append(descToggle)
							} else {
								descToggle.remove()
							}

							if(!descContent.textContent.trim()) {
								descContent.classList.toggle("text-label", true)
								descContent.textContent = "This game has no description"
							} else {
								descContent.classList.toggle("text-label", false)
							}
						}

						updateDesc()

						gamePromise.then(data => {
							if(data) {
								descContent.textContent = data.description

								if(!data.isPlayable) {
									const btnCont = this.item.$find(".btr-game-playbutton-container")
									btnCont.classList.add("btr-place-prohibited")
									btnCont.textContent = ProhibitedReasons[data.reasonProhibited] || data.reasonProhibited
								}
							}

							robloxLinkify(descContent)
							updateDesc()
						})
					}
				}

				deselect(instant) {
					if(this !== selected) { return }
					selected = null

					this.item.classList.remove("selected")
	
					const content = this.item.$find(".btr-game-content")
					const height = content.scrollHeight
					const duration = instant ? 0 : .25

					content.style.maxHeight = `${height}px`
					content.style.transition = `max-height ${duration}s`

					window.requestAnimationFrame(() => content.style.maxHeight = "0px")
					clearTimeout(this.animTimeout)
				}

				select(instant) {
					if(this === selected) { return }

					if(selected) { selected.deselect() }
					selected = this

					this.item.classList.add("selected")

					const content = this.item.$find(".btr-game-content")
					const height = content.scrollHeight
					const duration = instant ? 0 : .25

					content.style.maxHeight = `${height}px`
					content.style.transition = `max-height ${duration}s`

					this.animTimeout = setTimeout(() => content.style.maxHeight = "none", duration * 1e3)
				}

				toggle(instant) {
					if(this !== selected) {
						this.select(instant)
					} else {
						this.deselect(instant)
					}
				}
			}
			
			document.body
				.$on("click", ".btr-btn-toggle-profile", ev => {
					const placeId = ev.currentTarget.dataset.placeid
					$.fetch("https://www.roblox.com/game/toggle-profile", {
						method: "POST",
						credentials: "include",
						body: new URLSearchParams({ placeId, addToProfile: false }),
						xsrf: true
					})
				})
				.$on("click", ".btr-btn-shutdown-all", ev => {
					const placeId = ev.currentTarget.dataset.placeid
					$.fetch("https://www.roblox.com/Games/shutdown-all-instances", {
						method: "POST",
						credentials: "include",
						body: new URLSearchParams({ placeId }),
						xsrf: true
					})
				})

			switcher.$watch(">.hlist").$then().$watchAll(".slide-item-container", slide => {
				gameItems.push(new GameItem(slide))
			})
		})
		.$watch("#people-list-container", friends => {
			newCont.$find(".placeholder-friends").replaceWith(friends)
		})
		.$watch(".favorite-games-container", favorites => favorites.remove())
		.$watch(".profile-collections", collections => {
			collections.classList.remove("layer", "gray-layer-on")
			newCont.$find(".placeholder-collections").replaceWith(collections)
		})
	
	function initPlayerBadges() {
		const badgesElem = newCont.$find(".btr-profile-playerbadges")
		const hlist = badgesElem.$find(".hlist")
		const pager = createPager(true)

		const thumbClasses = {
			Error: "icon-broken",
			InReview: "icon-in-review",
			Blocked: "icon-blocked",
			Pending: "icon-pending"
		}

		const playerBadges = []
		const pageSize = 10

		let currentPage = 1
		let isLoading = false
		let hasMorePages = true
		let nextPageCursor

		const openPage = async page => {
			const pageStart = (page - 1) * pageSize
			const badges = playerBadges.slice(pageStart, pageStart + pageSize)

			currentPage = page
			pager.setPage(currentPage)
			pager.togglePrev(currentPage > 1)
			pager.toggleNext(hasMorePages)
			hlist.$empty()

			if(!badges.length) {
				hlist.append(html`<div class="section-content-off btr-section-content-off">This user has no Player Badges</div>`)
			} else {
				if(!pager.parentNode && (currentPage > 1 || hasMorePages)) {
					hlist.after(pager)
				}

				badges.forEach(data => {
					const badgeUrl = `/badges/${data.id}/${formatUrlName(data.name)}`
					const thumbUrl = data.thumb && data.thumb.imageUrl || "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
					const thumbClass = data.thumb && thumbClasses[data.thumb.state] || ""

					hlist.append(html`
					<li class="list-item badge-item asset-item" ng-non-bindable>
						<a href="${badgeUrl}" class="badge-link" title="${data.name}">
							<span class=asset-thumb-container>
								<img class="${thumbClass}" src="${thumbUrl}" data-badgeId="${data.id}">
							</span>
							<span class="font-header-2 text-overflow item-name">${data.name}</span>
						</a>
					</li>`)
				})
			}
			
			const needsThumbs = badges.filter(x => !x.thumbUrl && !x.gettingThumb)
			if(needsThumbs.length) {
				const thumbsUrl = `https://thumbnails.roblox.com/v1/badges/icons?badgeIds=${needsThumbs.map(x => x.id).join(",")}&size=150x150&format=Png`
				needsThumbs.forEach(x => x.gettingThumb = true)

				$.fetch(thumbsUrl).then(async resp => {
					const thumbData = await resp.json()

					thumbData.data.forEach(thumb => {
						const badge = badges.find(x => x.id === thumb.targetId)
						badge.thumb = thumb

						const img = hlist.$find(`img[data-badgeId="${badge.id}"`)
						if(img) {
							const thumbUrl = badge.thumb.imageUrl || "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
							const thumbClass = thumbClasses[badge.thumb.state] || ""

							img.src = thumbUrl
							if(thumbClass) {
								img.classList.add(thumbClass)
							}
						}
					})
				})
			}
		}

		const loadPage = async page => {
			if(isLoading) {
				return
			}

			isLoading = true
			page = Math.max(1, page)

			const lastIndex = page * pageSize
			while(playerBadges.length < lastIndex && hasMorePages) {
				const url = `https://badges.roblox.com/v1/users/${userId}/badges?sortOrder=Desc&limit=10&cursor=${nextPageCursor || ""}`
				const badges = await $.fetch(url).then(resp => resp.json())

				nextPageCursor = badges.nextPageCursor
				hasMorePages = !!nextPageCursor

				playerBadges.push(...badges.data)
			}

			page = Math.min(Math.ceil(playerBadges.length / pageSize), page)

			await openPage(page)
			isLoading = false
		}

		pager.onprevpage = () => loadPage(currentPage - 1)
		pager.onnextpage = () => loadPage(currentPage + 1)
		loadPage(1)
	}

	function initGroups() {
		const groups = newCont.$find(".btr-profile-groups")
		const hlist = groups.$find(".hlist")
		hlist.setAttribute("ng-non-bindable", "")
		const pageSize = 8

		const pager = createPager(false, true)
		hlist.after(pager)

		function loadPage(page) {
			pager.setPage(page)

			$.each(hlist.children, (obj, index) => {
				obj.classList.toggle("visible", Math.floor(index / pageSize) + 1 === page)
			})
		}

		pager.onsetpage = loadPage

		$.ready(() => {
			const url = `https://groups.roblox.com/v1/users/${userId}/groups/roles`
			$.fetch(url).then(async response => {
				const json = await response.json()
				const numGroups = json.data.length

				pager.setMaxPage(Math.floor((numGroups - 1) / pageSize) + 1)
				if(numGroups === 0) { return }
				hlist.$empty()

				const thumbs = {}

				json.data.forEach(({ group, role }, index) => {
					const parent = html`
					<li class="list-item game-card ${index < pageSize ? "visible" : ""}">
						<div class="card-item game-card-container">
							<a href="/groups/${group.id}/${formatUrlName(group.name)}" title="${group.name}">
								<div class=game-card-thumb-container>
									<img class="game-card-thumb card-thumb unloaded">
								</div>
								<div class="text-overflow game-card-name">${group.name}</div>
							</a>
							<div class="text-overflow game-card-name-secondary text-secondary small">
								${formatNumber(group.memberCount)} ${group.memberCount === 1 ? "Member" : "Members"}
							</div>
							<div class="text-overflow game-card-name-secondary text-secondary small">${role.name}</div>
						</div>
					</li>`

					const thumb = parent.$find(".card-thumb")
					thumbs[group.id] = thumb

					thumb.$once("load", () => thumb.classList.remove("unloaded"))

					hlist.append(parent)
				})

				hlist.style["min-height"] = `${hlist.scrollHeight + 1}px`

				const thumbUrl = `https://thumbnails.roblox.com/v1/groups/icons?format=png&groupIds=${Object.keys(thumbs).join(",")}&size=150x150`
				const thumbData = await $.fetch(thumbUrl).then(resp => resp.json())

				thumbData.data.forEach(thumbInfo => {
					thumbs[thumbInfo.targetId].src = thumbInfo.imageUrl
				})
			})
		})
	}

	function initFavorites() { // Favorites
		const favorites = newCont.$find(".btr-profile-favorites")
		const hlist = favorites.$find(".hlist")
		hlist.setAttribute("ng-non-bindable", "")

		const pageSize = 6
		const pager = createPager(false, true)
		hlist.after(pager)

		let isLoading = false
		let lastCategory = null

		const dropdown = html`
		<div class=input-group-btn>
			<button type=button class=input-dropdown-btn data-toggle=dropdown aria-expanded=false>
				<span class=rbx-selection-label data-bind=label>Places</span>
				<span class=icon-down-16x16></span>
			</button>
			<ul data-toggle=dropdown-menu class=dropdown-menu role=menu>
				<li data-value=8><a href=#>Accessories</a></li>
				<li data-value=24><a href=#>Animations</a></li>
				<li data-value=3><a href=#>Audio</a></li>
				<li data-value=21><a href=#>Badges</a></li>
				<li data-value=13><a href=#>Decals</a></li>
				<li data-value=18><a href=#>Faces</a></li>
				<li data-value=19><a href=#>Gear</a></li>
				<li data-value=17><a href=#>Heads</a></li>
				<li data-value=40><a href=#>Meshes</a></li>
				<li data-value=10><a href=#>Models</a></li>
				<li data-value=12><a href=#>Pants</a></li>
				<li data-value=9><a href=#>Places</a></li>
				<li data-value=38><a href=#>Plugins</a></li>
				<li data-value=11><a href=#>Shirts</a></li>
				<li data-value=2><a href=#>T-Shirts</a></li>
			</ul>
		</div>`

		const dropdownLabel = dropdown.$find(".rbx-selection-label")
		favorites.$find(".container-header .btn-more").after(dropdown)

		function loadPage(category, page) {
			if(isLoading) { return }
			isLoading = true

			lastCategory = category

			const params = new URLSearchParams({
				userId,
				thumbWidth: 150,
				thumbHeight: 150,
				itemsPerPage: pageSize,
				assetTypeId: category,
				pageNumber: page
			}).toString()

			const url = `https://www.roblox.com/users/favorites/list-json?${params}`
			$.fetch(url).then(async response => {
				const json = await response.json()
				isLoading = false

				if(json && json.IsValid) {
					pager.setPage(page)
					pager.setMaxPage(Math.floor((json.Data.TotalItems - 1) / pageSize) + 1)
					hlist.$empty()

					const categoryName = dropdownLabel.textContent

					const items = json.Data.Items
					if(!items.length) {
						hlist.append(html`<div class='section-content-off btr-section-content-off'>This user has no favorite ${categoryName}</div>`)
					} else {
						items.forEach(data => {
							const item = html`
							<li class="list-item game-card">
								<div class="card-item game-card-container">
									<a href="${data.Item.AbsoluteUrl}" title="${data.Item.Name}">
										<div class="game-card-thumb-container">
											<img class="game-card-thumb card-thumb unloaded" alt="${data.Item.Name}" src="${data.Thumbnail.Url}">
										</div>
										<div class="text-overflow game-card-name" title="${data.Item.Name}" ng-non-bindable>${data.Item.Name}</div>
									</a>
									<div class="game-card-name-secondary btr-creator-link-container">
										<span class="text-secondary">By </span>
										<a class="text-link text-overflow btr-creator-link" title="${data.Creator.Name}" href="${data.Creator.CreatorProfileLink}">
											${data.Creator.Name}
										</a>
									</div>
								</div>
							</li>`

							hlist.append(item)
							item.$find(".unloaded").$once("load", e => e.currentTarget.classList.remove("unloaded"))
						})
					}
				}
			})
		}

		const onclick = ev => {
			const cat = +ev.currentTarget.getAttribute("data-value")
			if(Number.isSafeInteger(cat)) {
				loadPage(cat, 1)
			}
		}

		dropdown.$findAll(".dropdown-menu li").forEach(btn => btn.$on("click", onclick))

		pager.onsetpage = page => loadPage(lastCategory, page)
		$.ready(() => loadPage(9, 1))
	}

	initGroups()
	initFavorites()

	if(+userId !== 1) {
		initPlayerBadges()
	} else {
		newCont.$find(".btr-profile-playerbadges").remove()
		const friends = newCont.$find(".placeholder-friends")
		if(friends) { friends.remove() }
	}

	$.ready(() => {
		const oldContainer = $(".profile-container > .rbx-tabs-horizontal")
		if(oldContainer) {
			oldContainer.remove()
		}

		if(SETTINGS.get("profile.embedInventoryEnabled") && +userId !== 1) {
			const cont = html`<div></div>`
			const iframe = html`<iframe id="btr-injected-inventory" src="/users/${userId}/inventory" scrolling="no">`

			cont.append(iframe)
			newCont.$find(".placeholder-inventory").replaceWith(cont)
		} else {
			newCont.$find(".placeholder-inventory").remove()
		}
	})
}
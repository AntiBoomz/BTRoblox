"use strict"

pageInit.profile = () => {
	if(!SETTINGS.get("profile.enabled")) { return }
	
	InjectJS.inject(() => {
		const { angularHook } = window.BTRoblox
		
		angularHook.hijackModule("peopleList", {
			layoutService(target, thisArg, args, argsMap) {
				const result = target.apply(thisArg, args)
				result.maxNumberOfFriendsDisplayed = 10
				return result
			}
		})
	})
	
	onPageReset(() => {
		document.body?.classList.remove("btr-profile")
	})
	
	onPageLoad(userIdString => {
		const userId = Number.parseInt(userIdString, 10)
		
		document.$watch("body", body => body.classList.add("btr-profile"))
		
		document.$watch(".profile-platform-container", profileContainer => {
			const newCont = html`
			<div class=btr-profile-container>
				<div class=btr-profile-left>
					<div class=btr-profile-about>
						<div class=container-header><h2>About</h2></div>
						<div class=section-content>
							<div class=placeholder-status style=display:none></div>
							<div class=placeholder-avatar style=display:none></div>
							<div class=placeholder-desc>
								<div class=profile-about-content>
									<pre id=profile-about-text class=profile-about-text>
										<span class="profile-about-content-text text-label">
											This user has no description
										</span>
									</pre>
								</div>
							</div>
							<div class=placeholder-aliases style=display:none></div>
							<div class=placeholder-stats style=display:none></div>
							<div class=placeholder-footer style=display:none></div>
						</div>
					</div>
					<div class=placeholder-robloxbadges style=display:none>
						<div class=container-header><h2>Roblox Badges</h2></div>
						<div class=section-content>
							<div class="section-content-off btr-section-content-off">This user has no Roblox Badges</div>
						</div>
					</div>
					<div class=btr-profile-playerbadges style=display:none>
						<div class=container-header><h2>Player Badges</h2></div>
						<div class=section-content>
							<ul class=hlist>
							</ul>
						</div>
					</div>
					<div class=btr-profile-groups>
						<div class=container-header><h2>Groups</h2></div>
						<div class=section-content>
							<ul class=hlist>
								<div class="section-content-off btr-section-content-off">This user is not in any Groups</div>
							</ul>
						</div>
					</div>
				</div>

				<div class=btr-profile-right>
					<div class=placeholder-games style=display:none>
						<div class=container-header><h2>Experiences</h2></div>
						<div class=section-content>
							<div class="section-content-off btr-section-content-off">This user has no active Games</div>
						</div>
					</div>
					<div class=placeholder-friends>
						<div class=container-header><h2>Connections</h2></div>
						<div class="spinner spinner-default">
						</div>
					</div>
					<div class=btr-profile-favorites>
						<div class=container-header>
							<h2>Favorites</h2>
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
					<div class=placeholder-posts style=display:none></div>
					<div class=placeholder-collections style=display:none></div>
					<div class=placeholder-inventory style=display:none></div>
				</div>
			</div>`
			
			const presencePromise = new Promise(resolve => resolve(RobloxApi.presence.getPresence([userId]).then(json => json?.userPresences?.[0])))
			
			profileContainer
				.$watch(".profile-tabs", tabs => {
					tabs.parentNode.before(newCont)
					tabs.parentNode.style.display = "none"
				})
				.$watch(".profile-header-top .avatar-status", statusContainer => {
					const statusDiv = html`<div class="btr-header-status-parent"></div>`
					newCont.$find(".placeholder-status").replaceWith(statusDiv)
					
					presencePromise.then(presence => {
						if(presence?.userPresenceType === 3) { // studio
							statusDiv.replaceChildren(html`<span class="btr-header-status-text btr-status-studio">In Studio</span>`)
							
						} else if(presence?.userPresenceType === 2 && presence.placeId) {
							statusDiv.replaceChildren(
								html`<a href="/games/${presence.placeId}/" title="${presence.lastLocation}"><span class="btr-header-status-text btr-status-ingame">${presence.lastLocation}</span></a>`,
								html`<a class="btr-header-status-follow-button" title="Follow" onclick="Roblox.GameLauncher.followPlayerIntoGame(${userId})">\uD83D\uDEAA</a>`
							)
							
						} else if(presence?.userPresenceType === 2) {
							statusDiv.replaceChildren(
								html`<span class="btr-header-status-text btr-status-ingame">In Game</span>`
							)
							
						} else if(presence?.userPresenceType) { // online
							statusDiv.replaceChildren(html`<span class="btr-header-status-text btr-status-online">Online</span>`)
							
						} else {
							statusDiv.replaceChildren(html`<span class="btr-header-status-text btr-status-offline">Offline</span>`)
						}
					})
				})
				.$watch(".profile-about", about => {
					const newAbout = newCont.$find(".btr-profile-about")
					
					newAbout.setAttribute("ng-controller", about.getAttribute("ng-controller"))
					newAbout.classList.add("profile-about")
					
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
						.$watch("social-link-icon-list", social => {
							newCont.$find(".btr-profile-about").prepend(social)
						})
				})
				.$watch(".profile-avatar", async avatar => {
					newCont.$find(".placeholder-avatar").replaceWith(avatar)
					
					await avatar.$watch(">.container-header").$promise()
					
					avatar.$find(".container-header").remove()

					const avatarLeft = avatar.$find(".profile-avatar-left")
					const avatarRight = avatar.$find(".profile-avatar-right")

					avatar.classList.remove("section")
					avatarLeft.classList.remove("col-sm-6", "section-content")
					avatarRight.classList.remove("col-sm-6")

					avatarRight.style.transition = "none" // stop transition on page load
					setTimeout(() => avatarRight.style.transition = "", 1e3)

					const toggleItems = html`<span class="btr-toggle-items btn-control btn-control-sm">Show Items</span>`
					avatarLeft.$find(".thumbnail-holder").append(toggleItems)
					
					//
					
					let visible = false
					
					const setVisible = bool => {
						visible = bool
						avatarRight.classList.toggle("visible", visible)
						toggleItems.textContent = visible ? "Hide Items" : "Show Items"
					}
					
					toggleItems.$on("click", ev => {
						setVisible(!visible)
						ev.stopPropagation()
						ev.stopImmediatePropagation()
						ev.preventDefault()
					})
					
					document.$on("click", ev => {
						if(visible && !avatarRight.contains(ev.target)) {
							setVisible(false)
						}
					})
				})
				.$watch(".profile-posts", posts => {
					newCont.$find(".placeholder-posts").replaceWith(posts)
				})
				.$watch("#friends-carousel-container", friends => {
					newCont.$find(".placeholder-friends").after(friends)
					
					friends.$watch(".friends-carousel-container", () => {
						newCont.$find(".placeholder-friends").remove()
					})
				})
				.$watch(".profile-statistics", outerStats => {
					newCont.$find(".placeholder-stats").replaceWith(outerStats)
					outerStats.classList.add("btr-profileStats")
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
					let selected

					pager.onsetpage = page => {
						pager.setPage(page)
						
						for(const item of gameItems) {
							item.updateVisibility()
						}
					}
					
					let thumbnailRequest
					const requestThumbnail = placeId => {
						if(!thumbnailRequest || thumbnailRequest.placeIds.length >= 50) {
							const request = thumbnailRequest = {
								placeIds: []
							}
							
							request.promise = new Promise(resolve => {
								setTimeout(() => {
									if(thumbnailRequest === request) {
										thumbnailRequest = null
									}
									
									RobloxApi.thumbnails.getAssetThumbnails(request.placeIds, "768x432").then(resolve)
								}, 0)
							})
						}
						
						thumbnailRequest.placeIds.push(placeId)
						
						return thumbnailRequest.promise.then(json => json.data.find(x => +x.targetId === +placeId))
					}
					
					let detailsRequest
					const requestDetails = placeId => {
						if(!detailsRequest || detailsRequest.placeIds.length >= 50) {
							const request = detailsRequest = {
								placeIds: []
							}
							
							request.promise = new Promise(resolve => {
								setTimeout(() => {
									if(detailsRequest === request) {
										detailsRequest = null
									}
									
									RobloxApi.games.getPlaceDetails(request.placeIds, "768x432").then(resolve)
								}, 0)
							})
						}
						
						detailsRequest.placeIds.push(placeId)
						
						return detailsRequest.promise.then(json => json.find(x => +x.placeId === +placeId))
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
							<li class=btr-game>
								<div class=btr-game-button>
									<span class=btr-game-title>${title}</span>
								</div>
								<div class=btr-game-content>
									<a class=btr-game-thumb-container href="${url}">
										<img class=btr-game-thumb>
										<img class=btr-game-icon src="${iconThumb}">
									</a>
									<div class=btr-game-desc>
										<span class=btr-game-desc-content>${desc}</span>
									</div>
									<div class=btr-game-info>
										<div class=btr-game-playbutton-container>
											<div class="btr-game-playbutton btn-primary-lg VisitButtonPlay VisitButtonPlayGLI" placeid="${placeId}"  data-action=play data-is-membership-level-ok=true>
												Play
											</div>
										</div>
										<div class=btr-game-stats></div>
									</div>
								</div>
							</li>`

							item.$find(".btr-game-stats").append(slideStats)
							item.$find(".btr-game-button").$on("click", () => this.toggle())

							hlist.append(item)
							pager.setMaxPage(pageIndex + 1)
							gameItems.push(this)
							
							requestThumbnail(this.placeId).then(thumb => {
								this.thumbnailSrc = thumb.imageUrl
								
								if(this.firstVisible) {
									this.item.$find(".btr-game-thumb").src = this.thumbnailSrc
								}
							})
							
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
								
								if(this.thumbnailSrc) {
									this.item.$find(".btr-game-thumb").src = this.thumbnailSrc
								}
								
								const gamePromise = requestDetails(this.placeId)

								loggedInUserPromise.then(loggedInUser => {
									if(userId !== loggedInUser) { return }

									const dropdown = html`
									<div class="btr-game-dropdown">
										<a class="rbx-menu-item" data-toggle="popover" data-container="body" data-bind="btr-placedrop-${this.placeId}">
											<span class="icon-more"></span>
										</a>
										<div data-toggle="btr-placedrop-${this.placeId}" style="display:none">
											<ul class="dropdown-menu" role="menu">
												<li><a class=btr-btn-toggle-profile data-placeid="${this.placeId}"><div>Remove from Profile</div></a></li>
											</ul>
										</div>
									</div>`

									this.item.$find(".btr-game-button").before(dropdown)

									gamePromise.then(data => {
										if(!data) { return }
										
										dropdown.$find(".dropdown-menu").prepend(
											html`<li><a onclick="Roblox.GameLauncher.editGameInStudio(${this.placeId}, ${data.universeId})"><div>Edit</div></a></li>`,
											html`<li><a href="https://create.roblox.com/dashboard/creations/experiences/${data.universeId}/overview"><div>View Analytics</div></a></li>`,
											html`<li><a href=/sponsored/experiences/${data.universeId}/create><div>Sponsor this Experience</div></a></li>`,
											html`<li><a href="https://create.roblox.com/dashboard/creations/experiences/${data.universeId}/places/${this.placeId}/configure"><div>Configure this Place</div></a></li>`,
											html`<li><a href="https://create.roblox.com/dashboard/creations/experiences/${data.universeId}/configure"><div>Configure this Experience</div></a></li>`,
											html`<li><a href="https://create.roblox.com/dashboard/creations/experiences/${data.universeId}/localization"><div>Configure Localization</div></a></li>`,
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
											const prohibitedReasons = {
												UniverseDoesNotHaveARootPlace: "This game has no root place.",
												UniverseRootPlaceIsNotActive: "This game is not active",
												InsufficientPermissionFriendsOnly: "This game is friends only.",
												InsufficientPermissionGroupOnly: "Group members only.",
												UnderReview: "This game is under moderation review."
											}
											
											const btnCont = this.item.$find(".btr-game-playbutton-container")
											btnCont.classList.add("btr-place-prohibited")
											btnCont.textContent = prohibitedReasons[data.reasonProhibited] || data.reasonProhibited
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
							RobloxApi.inventory.toggleInCollection("asset", placeId, false)
						})

					switcher.$watch(">.hlist").$then().$watchAll(".slide-item-container", slide => {
						gameItems.push(new GameItem(slide))
					})
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
					pager.toggleNext(hasMorePages || pageStart < playerBadges.length - pageSize)
					hlist.replaceChildren()

					if(!badges.length) {
						hlist.append(html`<div class="section-content-off btr-section-content-off">This user has no Player Badges</div>`)
					} else {
						badgesElem.style.display = ""
						hlist.after(pager)
						
						for(const data of badges) {
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
						}
					}
					
					const needsThumbs = badges.filter(x => !x.thumbUrl && !x.gettingThumb)
					if(needsThumbs.length) {
						for(const thumb of needsThumbs) {
							thumb.gettingThumb = true
						}
						
						RobloxApi.thumbnails.getBadgeIcons(needsThumbs.map(x => x.id)).then(json => {
							for(const thumb of json.data) {
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
							}
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
						const badges = await RobloxApi.badges.getBadges(userId, "Desc", 100, nextPageCursor || "")

						nextPageCursor = badges.nextPageCursor
						hasMorePages = !!nextPageCursor

						playerBadges.push(...badges.data)
					}

					page = Math.max(1, Math.min(Math.ceil(playerBadges.length / pageSize), page))

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
						
						hlist.replaceChildren()

						const thumbs = {}
						const groups = json.data.sort((a, b) => (a.isPrimaryGroup ? -1 : b.isPrimaryGroup ? 1 : 0))
						
						for(const [index, { group, role }] of Object.entries(groups)) {
							const parent = html`
							<li class="list-item game-card ${index < pageSize ? "visible" : ""}">
								<div class="card-item game-card-container">
									<a href="/communities/${group.id}/${formatUrlName(group.name)}" title="${group.name}">
										<div class=game-card-thumb-container>
											<img class="game-card-thumb card-thumb" src="">
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

							hlist.append(parent)
						}

						hlist.style["min-height"] = `${hlist.scrollHeight + 1}px`

						const thumbUrl = `https://thumbnails.roblox.com/v1/groups/icons?format=png&groupIds=${Object.keys(thumbs).join(",")}&size=150x150`
						const thumbData = await $.fetch(thumbUrl).then(resp => resp.json())
						
						for(const thumbInfo of thumbData.data) {
							if(thumbInfo.imageUrl) {
								thumbs[thumbInfo.targetId].src = thumbInfo.imageUrl
							} else {
								thumbs[thumbInfo.targetId].parentNode.classList.add("icon-blocked")
							}
						}
					})
				})
			}

			function initFavorites() {
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
				
				const favoriteData = {}
				
				const loadPage = async (category, page) => {
					if(isLoading) { return }
					lastCategory = category
					
					let data = favoriteData[category]
					
					if(!data) {
						data = {
							items: [],
							nextPage: 1,
							nextPageCursor: "",
							hasMore: true
						}
						
						favoriteData[category] = data
					}
					
					const pageStart = (page - 1) * pageSize
					const pageEnd = pageStart + pageSize
					
					while(data.hasMore && pageEnd > data.items.length) {
						isLoading = true
						
						const CreatorStoreAssetTypes = [
							AssetType.Audio, AssetType.Model, AssetType.Decal, AssetType.Animation,
							AssetType.Plugin, AssetType.MeshPart, AssetType.Video
						]
						
						let json
						
						if(category === AssetType.Place) {
							json = await RobloxApi.games.getFavorites(userId, 100, data.nextPageCursor)
								.then(json => {
									json.data = json.data.map(x => ({
										url: `/games/${x.rootPlace?.id}/`,
										id: x.rootPlace?.id,
										gameId: x.id,
										assetTypeId: category,
										name: x.name,
										creator: {
											id: x.creator.id,
											type: x.creator.type,
											name: x.creator.name,
											verified: false
										}
									}))
									
									return json
								})
						} else if(CreatorStoreAssetTypes.includes(category)) {
							json = await RobloxApi.toolboxService.getFavorites(userId, category, 100, data.nextPageCursor)
								.then(json => {
									json.data = json.data.map(x => ({
										url: `https://create.roblox.com/store/asset/${x.asset.id}/`,
										id: x.asset.id,
										assetTypeId: x.asset.assetTypeId,
										name: x.asset.name,
										creator: {
											id: x.creator.creator.match(/\/(\d+)/)?.[1],
											type: x.creator.creator.includes("user/") ? "User" : "Group",
											name: x.creator.name,
											verified: x.creator.verified
										}
									}))
									
									return json
								})
						} else {
							json = await RobloxApi.catalog.getFavorites(userId, category, 100, data.nextPageCursor)
								.then(json => {
									json.data = json.data.map(x => ({
										url: `/catalog/${x.id}/`,
										id: x.id,
										assetTypeId: x.assetType,
										name: x.name,
										creator: {
											id: x.creatorTargetId,
											type: x.creatorType, 
											name: x.creatorName,
											verified: x.creatorHasVerifiedBadge
										}
									}))
									
									return json
								})
						}
						
						isLoading = false
						
						if(!json?.data) {
							return
						}
						
						data.items.push(...json.data)
						
						data.nextPage += 1
						data.nextPageCursor = json.nextPageCursor
						
						data.hasMore = !!data.nextPageCursor
						data.totalItems = data.hasMore ? data.items.length + 1 : data.items.length
					}
					
					pager.setPage(page)
					pager.setMaxPage(Math.floor((data.totalItems - 1) / pageSize) + 1)
					hlist.replaceChildren()
					
					if(pageStart >= data.items.length) {
						const categoryName = dropdownLabel.textContent
						hlist.append(html`<div class='section-content-off btr-section-content-off'>This user has no favorite ${categoryName}</div>`)
						return
					}
					
					const requests = []
					const cards = []
					
					for(let i = pageStart; i < pageEnd; i++) {
						const item = data.items[i]
						if(!item) { break }
						
						const card = html`
						<li class="list-item game-card">
							<div class="card-item game-card-container">
								<a href="${item.url}" title="${item.name}">
									<div class="game-card-thumb-container">
										<img class="game-card-thumb card-thumb" src="">
									</div>
									<div class="text-overflow game-card-name" title="${item.name}" ng-non-bindable>${item.name}</div>
								</a>
								<div class="game-card-name-secondary btr-creator-link-container">
									<span class="text-secondary">By </span>
									<a class="text-link text-overflow btr-creator-link" title="${item.creator.name}" href="${item.creator.type === "User" ? `/users/${item.creator.id}/profile` : `/communities/${item.creator.id}/community`}">
										${item.creator.name}
									</a>
								</div>
							</div>
						</li>`
						
						requests.push({
							format: "webp",
							requestId: `${i}`,
							size: "150x150",
							targetId: category === AssetType.Place ? item.gameId : item.id,
							type: category === AssetType.Place ? "GameIcon" : "Asset"
						})
						cards.push(card)
						
						hlist.append(card)
					}
					
					if(requests.length) {
						RobloxApi.thumbnails.batch(requests).then(json => {
							for(const thumb of json.data) {
								const index = requests.findIndex(x => x.targetId === thumb.targetId)
								cards[index].$find(".game-card-thumb").src = thumb.imageUrl ?? ""
							}
						})
					}
				}

				const onclick = ev => {
					const cat = +ev.currentTarget.getAttribute("data-value")
					if(Number.isSafeInteger(cat)) {
						loadPage(cat, 1)
					}
				}
				
				for(const btn of dropdown.$findAll(".dropdown-menu li")) {
					btn.$on("click", onclick)
				}

				pager.onsetpage = page => loadPage(lastCategory, page)
				$.ready(() => loadPage(9, 1))
			}

			initGroups()
			initFavorites()

			if(userId !== 1) {
				initPlayerBadges()
			} else {
				newCont.$find(".btr-profile-playerbadges").remove()
				const friends = newCont.$find(".placeholder-friends")
				if(friends) { friends.remove() }
			}
			
			$.ready(() => {
				if(SETTINGS.get("profile.embedInventoryEnabled") && userId !== 1) {
					const cont = html`<div></div>`
					const iframe = html`<iframe id="btr-injected-inventory" src="/users/${userId}/inventory" scrolling="no">`

					cont.append(iframe)
					newCont.$find(".placeholder-inventory").replaceWith(cont)
				} else {
					newCont.$find(".placeholder-inventory").remove()
				}
				
				if(!$("#friends-carousel-container")) {
					newCont.$find(".placeholder-friends")?.remove()
				}
			})
		})
	})
}
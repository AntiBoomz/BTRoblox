"use strict"

pageInit.profile = function(userId) {
	if(!settings.profile.enabled) { return }

	const left = html`
	<div class=btr-profile-left>
		<div class="btr-profile-about profile-about">
			<div class=container-header><h3>About</h3></div>
			<div class=section-content>
				<div class=placeholder-status style=display:none></div>
				<div class=placeholder-avatar style=display:none></div>
				<div class=placeholder-desc style=display:none></div>
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
					<div class="section-content-off btr-section-content-off">This user has no Player Badges</div>
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
	</div>`

	const right = html`
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
				<h3>Favorite Places</h3>
				<a href=./favorites class="btn-secondary-xs btn-fixed-width btn-more">Favorites</a>
			</div>
			<div class=section-content>
				<ul class="hlist game-cards">
					<div class="section-content-off btr-section-content-off">This user has no favorite Places</div>
				</ul>
			</div>
		</div>
	</div>`

	const bottom = html`
	<div class=btr-profile-bottom>
		<div class=placeholder-collections style=display:none></div>
		<div class=placeholder-inventory style=display:none></div>
	</div>`
	
	document.$watch("body", body => body.classList.add("btr-profile")).$watch(".profile-container").$then()
		.$watch(".rbx-tabs-horizontal", cont => {
			cont.before(left, right, bottom)
			cont.parentNode.classList.add("btr-profile-container")
			cont.setAttribute("ng-if", "false") // Let's make angular clean it up :)
		})
		.$watch(".profile-about-content", desc => {
			left.$find(".placeholder-desc").replaceWith(desc)

			desc.$find(".profile-about-content-text").classList.add("linkify")
		})
		.$watch(".profile-about-footer", footer => {
			left.$find(".placeholder-footer").replaceWith(footer)

			const tooltip = footer.$find(".tooltip-pastnames")
			if(tooltip) { tooltip.setAttribute("data-container", "body") } // Display tooltip over side panel
		})
		.$watch(".profile-about .profile-social-networks", social => {
			left.$find(".btr-profile-about .container-header").append(social)
		})
		.$watch(".profile-header-top .header-caption", () => { // Wait for the first element after status
			const status = $(".profile-avatar-status")
			const statusDiv = html`<div class="btr-header-status-parent"></div>`
			left.$find(".placeholder-status").replaceWith(statusDiv)
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
					statusLabel.textContent = statusTitle
					
					const link = status.parentElement
					if(link.href.includes("PlaceId=")) {
						const anchor = html`<a href="${link.href}" title="${status.title}"></a>`
						statusText.before(anchor)
						anchor.prepend(statusText)
						anchor.after(html`<a class="btr-header-status-follow-button" title="Follow" onclick="Roblox.GameLauncher.followPlayerIntoGame(${userId})">\uD83D\uDEAA</a>`)
					}
				} else if(status.classList.contains("icon-studio")) {
					statusText.classList.add("btr-status-studio")
					statusLabel.textContent = statusTitle
				} else {
					statusText.classList.add("btr-status-online")
					statusLabel.textContent = statusTitle
				}
			}
		})
		.$watch(".profile-avatar", avatar => {
			left.$find(".placeholder-avatar").replaceWith(avatar)
			avatar.$find(".container-header").remove()

			const avatarLeft = avatar.$find(".profile-avatar-left")
			const avatarRight = avatar.$find(".profile-avatar-right")

			avatar.classList.remove("section")
			avatarLeft.classList.remove("col-sm-6", "section-content")
			avatarRight.classList.remove("col-sm-6", "section-content")

			const toggleItems = html`<span class="btr-toggle-items btn-control btn-control-sm">Show Items</span>`
			avatar.$find("#UserAvatar").append(toggleItems)

			function toggleVisible(ev) {
				const visible = !avatarRight.classList.contains("visible")
				avatarRight.classList.toggle("visible", visible)

				toggleItems.textContent = visible ? "Hide Items" : "Show Items"
				ev.stopImmediatePropagation()
			}

			toggleItems.$on("click", toggleVisible)
			document.body.$on("click", ev => {
				if(!avatarRight.contains(ev.target) && avatarRight.classList.contains("visible")) { toggleVisible(ev) }
			})
		})
		.$watch(".profile-stats-container", stats => {
			stats.closest(".profile-statistics").remove()
			left.$find(".placeholder-stats").replaceWith(stats)
		})
		.$watch(".see-more-roblox-badges-button", btn => {
			const badges = btn.parentElement.parentElement
			left.$find(".placeholder-robloxbadges").replaceWith(badges)

			badges.classList.add("btr-profile-robloxbadges")
			badges.$find(".btn-more").setAttribute("ng-show", badges.$find(".badge-list").children.length > 10)
		})
		.$watch("#games-switcher", switcher => {
			const games = switcher.parentNode
			right.$find(".placeholder-games").replaceWith(games)

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

			let selected

			function select(item, instant) {
				if(item.$getThumbnail) {
					item.$getThumbnail()
					delete item.$getThumbnail
				}

				const duration = instant ? 0 : .25

				if(selected) {
					selected.classList.remove("selected")

					const content = selected.$find(".btr-game-content")
					const height = content.scrollHeight

					content.style.maxHeight = `${height}px`
					content.style.transition = `max-height ${duration}s`

					window.requestAnimationFrame(() => content.style.maxHeight = "0px")
					clearTimeout(selected.$animTimeout)
				}

				if(selected !== item) {
					selected = item
					item.classList.add("selected")

					const content = item.$find(".btr-game-content")
					const height = content.scrollHeight

					content.style.maxHeight = `${height}px`
					content.style.transition = `max-height ${duration}s`

					item.$animTimeout = setTimeout(() => content.style.maxHeight = "none", duration * 1e3)
				} else {
					selected = null
				}
			}

			function loadPage(page) {
				pager.setPage(page)

				$.each(hlist.children, (obj, index) => {
					obj.classList.toggle("visible", Math.floor(index / pageSize) + 1 === page)
				})

				select(hlist.children[(page - 1) * pageSize], true)
			}

			hlist
				.$on("click", ".btr-toggle-description", e => {
					const btn = e.currentTarget
					const desc = btn.parentNode
					const expanded = !desc.classList.contains("expanded")

					desc.classList.toggle("expanded", expanded)
					btn.textContent = expanded ? "Show Less" : "Read More"
				})
				.$on("click", ".btr-btn-toggle-profile", () => {
					const placeId = e.currentTarget.getAttribute("data-placeid")
					xsrfFetch("https://www.roblox.com/game/toggle-profile", {
						method: "POST",
						credentials: "include",
						body: new URLSearchParams({ placeId, addToProfile: false })
					})
				})
				.$on("click", ".btr-btn-shutdown-all", () => {
					xsrfFetch("https://www.roblox.com/Games/shutdown-all-instances", {
						method: "POST",
						credentials: "include",
						body: new URLSearchParams({ placeId })
					})
				})

			pager.onsetpage = loadPage
			
			const placeIdList = []
			let lastGamePromise

			switcher.$watch(">.hlist").$then().$watchAll(".slide-item-container", async slide => {
				const slideImage = await slide.$watch(".slide-item-image").$promise()
				const slideName = await slide.$watch(".slide-item-name").$promise()
				const slideDesc = await slide.$watch(".slide-item-description").$promise()
				const slideEmblemLink = await slide.$watch(".slide-item-emblem-container > a").$promise()
				const slideStats = await slide.$watch(".slide-item-stats > .hlist").$promise()
				
				const index = +slide.dataset.index
				const placeId = slideImage.dataset.emblemId

				const title = slideName.textContent
				const desc = slideDesc.textContent
				const url = slideEmblemLink.href
				const iconThumb = slideImage.dataset.src

				placeIdList.push(placeId)
				if(!lastGamePromise) {
					lastGamePromise = new SyncPromise(resolve => {
						$.setImmediate(() => {
							lastGamePromise = null
							const list = placeIdList.splice(0, placeIdList.length).join("&placeIds=")
							const fetchUrl = `https://games.roblox.com/v1/games/multiget-place-details?placeIds=${list}`

							fetch(fetchUrl, { credentials: "include" }).then(resp => {
								if(!resp.ok) {
									console.warn("[BTRoblox]: Failed to load place details")
									return
								}

								resolve(resp.json())
							})
						})
					})
				}

				const gamePromise = lastGamePromise.then(a => a.find(b => +b.placeId === +placeId))

				const item = html`
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

				item.classList.toggle("visible", (index / pageSize) < 1)
				item.$find(".btr-game-stats").append(slideStats)

				item.$find(".btr-game-button").$on("click", () => {
					select(item)
				})

				loggedInUserPromise.then(loggedInUser => {
					if(+userId !== +loggedInUser) { return }

					const dropdown = html`
					<div class="btr-game-dropdown">
						<a class="rbx-menu-item" data-toggle="popover" data-container="body" data-bind="btr-placedrop-${placeId}">
							<span class="icon-more"></span>
						</a>
						<div data-toggle="btr-placedrop-${placeId}" style="display:none">
							<ul class="dropdown-menu" role="menu">
								<li><a onclick=Roblox.GameLauncher.editGameInStudio(${placeId})><div>Edit</div></a></li>
								<li><a href="/places/${placeId}/stats"><div>Developer Stats</div></a></li>
								<li><a href="/places/${placeId}/update"><div>Configure this Place</div></a></li>
								<li><a class="btr-btn-toggle-profile" data-placeid="${placeId}"><div>Remove from Profile</div></a></li>
							</ul>
						</div>
					</div>`

					item.$find(".btr-game-button").before(dropdown)

					gamePromise.then(data => {
						if(!data) { return }

						dropdown.$find(".dropdown-menu").children[2].after(
							html`<li><a href=/universes/configure?id=${data.universeId}><div>Configure this Game</div></a></li>`
						)
					})
				})

				hlist.append(item)
				pager.setMaxPage(Math.floor((hlist.children.length - 1) / pageSize) + 1)

				const iconRetryUrl = slideImage.dataset.retry

				function getThumbnail() {
					function retryUntilFinal(thumbUrl, cb) {
						fetch(thumbUrl).then(async response => {
							const json = await response.json()

							if(json && json.Final) { cb(json) }
							else { setTimeout(retryUntilFinal, 500, thumbUrl, cb) }
						})
					}

					if(iconRetryUrl) {
						retryUntilFinal(iconRetryUrl, json => {
							item.$find(".btr-game-icon").src = json.Url
						})
					}

					if(Number.isSafeInteger(+placeId)) {
						const thumbUrl = `https://www.roblox.com/asset-thumbnail/json?assetId=${placeId}&width=768&height=432&format=jpeg`
						retryUntilFinal(thumbUrl, json => {
							item.$find(".btr-game-thumb").src = json.Url
						})
					}
				}

				item.$getThumbnail = getThumbnail

				if(index === 0) { select(item, true) }

				const descElem = item.$find(".btr-game-desc")
				const descContent = item.$find(".btr-game-desc-content")
				const descToggle = html`<span class="btr-toggle-description">Read More</span>`

				const updateDesc = () => {
					if(descContent.offsetHeight > 170) {
						descElem.append(descToggle)
					} else {
						descToggle.remove()
					}

					descContent.classList.toggle("btr-no-description", descContent.textContent.trim() === "")
				}

				updateDesc()
				gamePromise.then(data => {
					if(data) {
						descContent.textContent = data.description

						if(!data.isPlayable) {
							const btn = item.$find(".btr-game-playbutton")
							btn.classList.remove("VisitPlayButton")
							btn.setAttribute("disabled", "")
							btn.title = ProhibitedReasons[data.reasonProhibited] || data.reasonProhibited
						}
					}

					Linkify(descContent)
					updateDesc()
				})
			})
		})
		.$watch(".home-friends", friends => {
			right.$find(".placeholder-friends").replaceWith(friends)
			const hlist = friends.$find(".hlist")

			if(hlist.children.length === 9) {
				fetch(`https://api.roblox.com/users/${userId}/friends`).then(async response => {
					const list = await response.json()
					if(list.length < 10) { return }
					const friend = list[9]

					hlist.append(html`
					<li class="list-item friend">
						<div class="avatar-container">
							<a href="/users/${friend.Id}/profile" class="avatar avatar-card-fullbody friend-link" title="${friend.Username}">
								<span class="avatar-card-link friend-avatar">
									<img alt="${friend.Username}" class="avatar-card-image" src="/avatar-thumbnail/image?userId=${friend.Id}&width=100&height=100&format=png">
								</span>
								<span class="text-overflow friend-name">${friend.Username}</span>
							</a>
						</div>
					</li>`)
				})
			}
		})
		.$watch(".favorite-games-container", favorites => favorites.remove())
		.$watch(".profile-collections", collections => bottom.$find(".placeholder-collections").replaceWith(collections))

	function initPlayerBadges() {
		const badges = left.$find(".btr-profile-playerbadges")
		const hlist = badges.$find(".hlist")
		const pager = createPager(true)
		hlist.after(pager)

		let currentPage = 1
		let isLoading = false
		let prevData = null

		function loadPage(page, cursor) {
			isLoading = true

			const url = `https://badges.roblox.com/v1/users/${userId}/badges?sortOrder=Desc&limit=10&cursor=${cursor}`
			fetch(url).then(async response => {
				const json = await response.json()
				isLoading = false
				prevData = json

				if(json) {
					currentPage = page
					pager.setPage(currentPage)
					pager.togglePrev(json.previousPageCursor != null)
					pager.toggleNext(json.nextPageCursor != null)
					hlist.$empty()

					if(!json.data.length) {
						const text = `${+userId === +loggedInUser ? "You have" : "This user has"} no badges`
						hlist.append(html`<div class="section-content-off btr-section-content-off">${text}</div>`)
					} else {
						json.data.forEach(data => {
							hlist.append(html`
							<li class="list-item badge-item asset-item" ng-non-bindable>
								<a href="/badges/${data.id}/" class="badge-link" title="${data.name}">
									<img src="/asset-thumbnail/image?assetId=${data.iconImageId}&width=150&height=150" alt="${data.name}">
									<span class="item-name text-overflow">${data.name}</span>
								</a>
							</li>`)
						})
					}
				}
			})
		}

		pager.onprevpage = () => {
			if(!isLoading && prevData && prevData.previousPageCursor) {
				loadPage(currentPage - 1, prevData.previousPageCursor)
			}
		}

		pager.onnextpage = () => {
			if(!isLoading && prevData && prevData.nextPageCursor) {
				loadPage(currentPage + 1, prevData.nextPageCursor)
			}
		}

		onDocumentReady(() => loadPage(1, ""))
	}

	function initGroups() {
		const groups = left.$find(".btr-profile-groups")
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

		onDocumentReady(() => {
			const url = `https://www.roblox.com/users/profile/playergroups-json?userId=${userId}`
			fetch(url).then(async response => {
				const json = await response.json()

				pager.setMaxPage(Math.floor((json.NumberOfGroups - 1) / pageSize) + 1)
				if(json.NumberOfGroups === 0) { return }
				hlist.$empty()

				json.Groups.forEach((item, index) => {
					const parent = html`
					<li class="list-item game-card ${index < pageSize ? "visible" : ""}">
						<div class="card-item game-card-container">
							<a href="${item.GroupUrl}" title="${item.Name}">
								<div class=game-card-thumb-container>
									<img class="game-card-thumb card-thumb unloaded" src="${item.Emblem.Url}">
								</div>
								<div class="text-overflow game-card-name">${item.Name}</div>
							</a>
							<div class="text-overflow game-card-name-secondary">
								${item.Members} ${item.Members === 1 ? "Member" : "Members"}
							</div>
							<div class="text-overflow game-card-name-secondary">${item.Rank}</div>
						</div>
					</li>`

					const thumb = parent.$find(".card-thumb")
					thumb.$once("load", () => thumb.classList.remove("unloaded"))

					hlist.append(parent)
				})

				hlist.style["min-height"] = `${hlist.scrollHeight}px`
			})
		})
	}

	function initFavorites() { // Favorites
		const favorites = right.$find(".btr-profile-favorites")
		const hlist = favorites.$find(".hlist")
		hlist.setAttribute("ng-non-bindable", "")

		const header = favorites.$find(".container-header h3")
		header.textContent = "Favorite Places"

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
			fetch(url).then(async response => {
				const json = await response.json()
				isLoading = false

				if(json && json.IsValid) {
					pager.setPage(page)
					pager.setMaxPage(Math.floor((json.Data.TotalItems - 1) / pageSize) + 1)
					hlist.$empty()

					const categoryName = dropdownLabel.textContent
					header.textContent = `Favorite ${categoryName}`

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
										<span class="text-label xsmall">By </span>
										<a class="text-link xsmall text-overflow btr-creator-link" title="${data.Creator.Name}" href="${data.Creator.CreatorProfileLink}">
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
		onDocumentReady(() => loadPage(9, 1))
	}

	initGroups()
	initFavorites()

	if(+userId !== 1) {
		initPlayerBadges()
	} else {
		left.$find(".btr-profile-playerbadges").remove()
		const friends = right.$find(".placeholder-friends")
		if(friends) { friends.remove() }
	}

	onDocumentReady(() => {
		const oldContainer = $(".profile-container > .rbx-tabs-horizontal")
		if(oldContainer) {
			oldContainer.remove()
		}

		if(settings.profile.embedInventoryEnabled && +userId !== 1) {
			const cont = html`
			<div>
				<iframe id="btr-injected-inventory" src="/users/${userId}/inventory" scrolling="no" sandbox="allow-same-origin allow-scripts allow-top-navigation-by-user-activation">
			</div>`
			bottom.$find(".placeholder-inventory").replaceWith(cont)
		} else {
			bottom.$find(".placeholder-inventory").remove()
		}
	})
}
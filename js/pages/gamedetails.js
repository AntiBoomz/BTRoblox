"use strict"

pageInit.gamedetails = placeId => {
	if(!SETTINGS.get("gamedetails.enabled")) { return }
	
	InjectJS.inject(() => {
		const { settings, reactHook } = window.BTRoblox
		const placeId = BTRoblox.currentPage.matches[0]
		
		const btrPager = { currentPage: 1, targetPage: 1, loading: false }
		const cursors = []
		
		const findMaxPage = async largePageIndex => {
			if(largePageIndex * 10 >= Math.max(btrPager.targetPage, btrPager.currentPage, btrPager.startingMaxPage ?? 1) + 200) {
				btrPager.updatingMaxPage = false
				btrPagerState.update()
				return null
			}
			
			const cursor = cursors[largePageIndex - 2] ?? ""
			const url = `https://games.roblox.com/v1/games/${placeId}/servers/Public?sortOrder=Desc&limit=100&cursor=${cursor}`
			
			await new Promise(resolve => setTimeout(resolve, 100))
			
			return fetch(url, { credentials: "include" }).then(async res => {
				if(!res.ok) {
					return Promise.reject()
				}
				
				const json = await res.json()
				const numSmallPages = Math.floor((json.data.length - 1) / 10) + 1
				
				if(numSmallPages === 0 && largePageIndex > 1) {
					cursors.splice(largePageIndex - 2, cursors.length)
					return findMaxPage(largePageIndex - 1)
				}
				
				if(json.nextPageCursor) {
					cursors[largePageIndex - 1] = json.nextPageCursor
					
					btrPager.maxPage = largePageIndex * 10 + 1
					btrPagerState.update()
					
					return findMaxPage(largePageIndex + 1)
				}
				
				btrPager.maxPage = (largePageIndex - 1) * 10 + Math.max(1, numSmallPages)
				btrPager.updatingMaxPage = false
				btrPager.foundMaxPage = true
				btrPagerState.update()
			}).catch(async () => {
				await new Promise(resolve => setTimeout(resolve, 400))
				return findMaxPage(cursors.length + 1)
			})
		}
		
		const btrPagerState = reactHook.createGlobalState(btrPager)
		
		const btrGetPublicGameInstances = () => {
			let updatedMaxPage = false
			
			btrPager.targetPage = Math.max(1, btrPager.targetPage)
			btrPager.loading = true
			
			const loadServers = targetPage => {
				let largePageIndex = Math.floor((targetPage - 1) / 10) + 1
				let smallPageIndex = (targetPage - 1) % 10 + 1
				
				let cursor
				let limit
				
				if(targetPage <= 1 && btrPager.maxPage == null) {
					cursor = ""
					limit = 10
				} else {
					if(largePageIndex - 2 >= cursors.length) {
						largePageIndex = cursors.length + 1
						smallPageIndex = 10
					}
					
					cursor = cursors[largePageIndex - 2] ?? ""
					limit = 100
				}
				
				const url = `https://games.roblox.com/v1/games/${placeId}/servers/Public?sortOrder=Desc&limit=${limit}&cursor=${cursor}`
				
				return fetch(url, { credentials: "include" }).then(async res => {
					if(!res.ok) {
						return Promise.reject()
					}
					
					const json = await res.json()
					const numSmallPages = Math.floor((json.data.length - 1) / 10) + 1
						
					if(numSmallPages === 0 && largePageIndex > 1) {
						cursors.splice(largePageIndex - 2, cursors.length)
						return loadServers((largePageIndex - 1) * 10)
					} else {
						const largestKnownPage = (largePageIndex - 1) * 10 + Math.max(1, numSmallPages)
						
						if(json.nextPageCursor) {
							if((btrPager.maxPage ?? -1) < largestKnownPage + 1) {
								btrPager.maxPage = largestKnownPage + 1
								btrPagerState.update()
							}
						} else {
							btrPager.maxPage = largestKnownPage
							btrPager.foundMaxPage = true
							btrPagerState.update()
							updatedMaxPage = true
						}
					}
					
					if(limit === 100) {
						if(json.nextPageCursor) {
							cursors[largePageIndex - 1] = json.nextPageCursor
							
							if(targetPage > largePageIndex * 10) {
								return loadServers(targetPage)
							}
						}
						
						if(smallPageIndex > numSmallPages) {
							smallPageIndex = Math.max(1, numSmallPages)
						}
						
						json.nextPageCursor = (json.nextPageCursor || smallPageIndex < numSmallPages) ? "idk" : ""
						json.data = json.data.slice((smallPageIndex - 1) * 10, smallPageIndex * 10)
						
						if(!updatedMaxPage && !btrPager.updatingMaxPage) {
							btrPager.updatingMaxPage = true
							btrPagerState.update()
							
							findMaxPage(cursors.length + 1)
						}
					}
					
					btrPager.currentPage = (largePageIndex - 1) * 10 + smallPageIndex
					btrPager.loading = false
					
					return { data: json }
				}).catch(() => {
					btrPager.loading = false
					return null
				})
			}
			
			return loadServers(btrPager.targetPage)
		}
		
		const btrPagerConstructor = ({ refreshGameInstances }) => {
			const btrPager = reactHook.useGlobalState(btrPagerState)
			
			const canPrev = !btrPager.loading && btrPager.currentPage > 1
			const canNext = !btrPager.loading && btrPager.currentPage < (btrPager.maxPage ?? 2)
			
			const inputRef = React.useRef()
			
			const updateInputWidth = () => {
				inputRef.current.style.width = "0px"
				inputRef.current.style.width = `${Math.max(32, Math.min(100, inputRef.current.scrollWidth + 12))}px`
			}
			
			React.useEffect(updateInputWidth, [])
			
			return React.createElement(
				"div", { className: "btr-pager-holder btr-server-pager" },
				React.createElement(
					"ul", { className: "btr-pager" },
					
					React.createElement(
						"li", { className: `btr-pager-first` },
						React.createElement(
							"button", {
								className: "btn-generic-first-page-sm",
								disabled: !canPrev,
								onClick() {
									if(!canPrev) { return }
									btrPager.targetPage = 1
									refreshGameInstances()
								}
							},
							React.createElement(
								"span", { className: "icon-first-page" }
							)
						)
					),
					
					React.createElement(
						"li", { className: `btr-pager-prev` },
						React.createElement(
							"button", {
								className: "btn-generic-left-sm",
								disabled: !canPrev,
								onClick() {
									if(!canPrev) { return }
									btrPager.targetPage = btrPager.currentPage - 1
									refreshGameInstances()
								}
							},
							React.createElement(
								"span", { className: "icon-left" }
							)
						)
					),
					
					React.createElement(
						"li", { className: `btr-pager-mid` },
						React.createElement(
							"span", {},
							"Page",
						),
						React.createElement(
							"input", {
								className: "btr-pager-cur",
								type: "text",
								defaultValue: btrPager.currentPage,
								ref: inputRef,
								
								onChange() {
									updateInputWidth()
								},
								
								onKeyDown(e) {
									if(e.which === 13) {
										e.target.blur()
									}
								},
								
								onBlur(e) {
									const num = parseInt(e.target.value, 10)
	
									if(!Number.isNaN(num)) {
										btrPager.targetPage = num
										refreshGameInstances()
									} else {
										e.target.value = btrPager.currentPage
									}
								}
							}
						),
						React.createElement(
							"span", {},
							` of `,
							
							React.createElement(
								"span", {
									className: "btr-pager-total",
									title: (!btrPager.foundMaxPage && !btrPager.updatingMaxPage) ? "Click to load more" : null,
									style: {
										opacity: (!btrPager.foundMaxPage && !btrPager.updatingMaxPage) ? "0.7" : null,
										cursor: (!btrPager.foundMaxPage && !btrPager.updatingMaxPage) ? "pointer" : null
									},
									
									onClick() {
										if(!btrPager.updatingMaxPage && !btrPager.foundMaxPage) {
											btrPager.updatingMaxPage = true
											btrPager.startingMaxPage = btrPager.maxPage ?? 1
											findMaxPage(cursors.length + 1)
										}
									}
								},
								btrPager.foundMaxPage ? `${btrPager.maxPage}` : btrPager.maxPage ? `${btrPager.maxPage - 1}+` : "1"
							)
						)
					),
					
					React.createElement(
						"li", { className: `btr-pager-next` },
						React.createElement(
							"button", {
								className: "btn-generic-right-sm",
								disabled: !canNext,
								onClick() {
									if(!canNext) { return }
									btrPager.targetPage = btrPager.currentPage + 1
									refreshGameInstances()
								}
							},
							React.createElement(
								"span", { className: "icon-right" }
							)
						)
					),
					
					React.createElement(
						"li", { className: `btr-pager-last` },
						React.createElement(
							"button", {
								className: "btn-generic-last-page-sm",
								disabled: !canNext,
								onClick() {
									if(!canNext) { return }
									btrPager.targetPage = Math.max(btrPager.maxPage ?? 1, btrPager.currentPage + 50)
									refreshGameInstances()
								}
							},
							React.createElement(
								"span", { className: "icon-last-page" }
							)
						)
					)
				)
			)
		}
		
		reactHook.hijackConstructor( // RunningGameServers
			args => args[1]?.getGameServers,
			(target, thisArg, args) => {
				const [props] = args
				
				if(settings.gamedetails.addServerPager && (props.getGameServers?.name === "getPublicGameInstances" || props.getGameServers === btrGetPublicGameInstances)) {
					props.getGameServers = btrGetPublicGameInstances
					
					const result = target.apply(thisArg, args)
					
					try {
						const serverList = reactHook.queryElement(result, x => x.props.gameInstances)
						
						if(serverList) {
							serverList.props.btrPagerEnabled = true
						}
						
					} catch(ex) {
						console.error(ex)
					}
					
					return result
				}
				
				return target.apply(thisArg, args)
			}
		)
		
		reactHook.hijackConstructor( // GameSection
			args => args[1]?.loadMoreGameInstances,
			(target, thisArg, args) => {
				if(args[0].btrPagerEnabled) {
					args[0].showLoadMoreButton = false
				}
				
				const result = target.apply(thisArg, args)
				
				try {
					const list = reactHook.queryElement(result, x => x.props.id?.includes("running-games"))
					
					if(args[0].btrPagerEnabled) {
						list.props.children.push(
							React.createElement(btrPagerConstructor, {
								refreshGameInstances: args[0].refreshGameInstances
							})
						)
					}
					
					if(settings.gamedetails.showServerPing) {
						const ul = reactHook.queryElement(list, x => x.type === "ul", 5)
						
						let servers = ul?.props?.children
						if(servers) {
							if(!Array.isArray(servers)) { servers = [servers] }
							
							for(const server of servers) {
								const serverInfo = args[0]?.gameInstances?.find(x => x.id === server.props.id)
	
								if(serverInfo) {
									server.props.gameServerStatus += `\nPing: ${serverInfo.ping ?? 0}ms`
								}
							}
						}
					}
				} catch(ex) {
					console.error(ex)
				}
				
				return result
			}
		)
		
		reactHook.hijackConstructor( // GameInstance
			args => args[1]?.gameServerStatus,
			(target, thisArg, args) => {
				const result = target.apply(thisArg, args)
				
				try {
					const list = reactHook.queryElement(result, x => x.props?.className?.includes("game-server-players"))
					let entries = list?.props?.children
					
					if(entries) {
						if(!Array.isArray(entries)) { entries = [entries] }
						
						for(const entry of entries) {
							const thumb = reactHook.queryElement(entry, x => x.props?.type === "AvatarHeadshot")
							
							if(thumb && thumb.props.token?.startsWith("btr/")) {
								const token = thumb.props.token
								thumb.type = "span"
								
								for(const key of Object.keys(thumb.props)) {
									delete thumb.props[key]
								}
								
								thumb.props.className = "thumbnail-2d-container avatar-card-image"
								thumb.props.children = React.createElement(
									"img", { src: token.slice(4) }
								)
							}
						}
					}
				} catch(ex) {
					console.error(ex)
				}
				
				return result
			}
		)
		
		reactHook.hijackConstructor( // App (serverList)
			args => args[0].toString().includes("getPublicGameInstances"),
			(target, thisArg, args) => {
				reactHook.hijackUseState({ // shouldRender
					index: 0,
					expectedValue: false,
					
					transform(value) {
						return true
					}
				})
				
				reactHook.hijackUseState({ // currentTab
					filter(value) {
						return ["tab-about", "tab-game-instances", "tab-store"].includes(value)
					},
					
					transform(value) {
						if(value === "tab-about" && window.location.hash !== "#!/about") {
							return "tab-game-instances"
						}
						
						return value
					}
				})
				
				return target.apply(thisArg, args)
			}
		)
	})

	const newContainer = html`
	<div class="col-xs-12 btr-game-main-container section-content">
		<div class=placeholder-main></div>
	</div>`

	const midContainer = html`
	<div class="col-xs-12 btr-mid-container"></div>`

	if(RobuxToCash.isEnabled()) {
		document.$watch("#rbx-passes-container").$then()
			.$watchAll(".list-item", item => {
				const label = item.$find(".text-robux")
				if(!label) { return }

				const cash = RobuxToCash.convert(+label.textContent.replace(/,/g, ""))
				label.after(html`<span class=btr-robuxToCash-tile>&nbsp;(${cash})</span>`)
				label.parentNode.setAttribute("title", `R$ ${label.parentNode.textContent.trim()}`)
			})
		
		document.$watch("#rbx-gear-container").$then()
			.$watchAll(".list-item", item => {
				const label = item.$find(".text-robux")
				if(!label) { return }

				const cash = RobuxToCash.convert(+label.textContent.replace(/,/g, ""))
				label.after(html`<span class=btr-robuxToCash-tile>&nbsp;(${cash})</span>`)
				label.parentNode.setAttribute("title", `R$ ${label.parentNode.textContent.trim()}`)
			})
	}

	const watcher = document.$watch("body", body => body.classList.add("btr-gamedetails")).$then()
		.$watch("#horizontal-tabs").$then()
			.$watch(["#tab-about", "#tab-game-instances"], (aboutTab, gameTab) => {
				aboutTab.$find(".text-lead").textContent = "Recommended"

				aboutTab.classList.remove("active")
				gameTab.classList.add("active")

				const parent = aboutTab.parentNode
				parent.append(aboutTab)
				parent.prepend(gameTab)
			})
		.$back()
		.$watch("#about", about => {
			about.classList.remove("active")

			about.append(
				html`
				<div class="section btr-compat-rtrack">
					<div class=container-header><h3></h3></div>
					<div class="section-content remove-panel"><pre class="text game-description"></pre></div>
				</div>`,
				html`<div class="ng-scope btr-compat-rtrack"></div>`
			)
			
			about.$watchAll("*", x => {
				if(!x.matches("#rbx-private-servers, #private-server-container-about-tab, #my-recommended-games, #recommended-games-container, .btr-compat-rtrack")) {
					midContainer.append(x)
				}
			})
		})
		.$watch("#game-instances", games => {
			games.classList.add("active")
		})
		.$watch(".game-main-content", mainCont => {
			mainCont.classList.remove("section-content")
			mainCont.before(newContainer)
			newContainer.after(midContainer)
			newContainer.$find(".placeholder-main").replaceWith(mainCont)
		})
		.$watch(".game-about-container", async aboutCont => {
			const descCont = await aboutCont.$watch(">.section-content").$promise()

			descCont.classList.remove("section-content")
			descCont.classList.add("btr-description")
			newContainer.append(descCont)

			aboutCont.remove()
		})
		.$watch(".tab-content", cont => {
			cont.classList.add("section")
			cont.$watchAll(".tab-pane", pane => {
				if(pane.id !== "about") {
					pane.classList.add("section-content")
				}
			})
		})
		.$watch(".badge-container", badges => {
			badges.classList.add("btr-badges-container")

			const badgeQueue = []
			let ownedTimeout

			const updateOwned = async () => {
				const userId = await loggedInUserPromise
				const badgeList = badgeQueue.splice(0, badgeQueue.length)
				const url = `https://badges.roblox.com/v1/users/${userId}/badges/awarded-dates?badgeIds=${badgeList.map(x => x.badgeId).join(",")}`

				$.fetch(url, { credentials: "include" }).then(async response => {
					if(!response.ok) {
						console.warn("[BTR] Failed to get badge data")
						return
					}

					const ownedBadges = (await response.json()).data.map(x => +x.badgeId)

					badgeList.forEach(({ row, badgeId }) => {
						row.classList.toggle("btr-notowned", ownedBadges.indexOf(badgeId) === -1)
						row.title = row.classList.contains("btr-notowned") ? "You do not own this badge" : ""
					})
				})
			}

			badges.$watch(">.stack-list").$then().$watchAll(".badge-row", row => {
				const url = row.$find(".badge-image>a").href
				const label = row.$find(".badge-name")
				const link = html`<a href="${url}">${label.textContent}</a>`
				
				label.$empty()
				label.append(link)

				row.$find("p.para-overflow").classList.remove("para-overflow")

				if(SETTINGS.get("gamedetails.showBadgeOwned")) {
					const match = url.match(/(?:catalog|badges)\/(\d+)\//)
					if(!match) { return }

					const badgeId = +match[1]
					badgeQueue.push({ row, badgeId })

					clearTimeout(ownedTimeout)
					ownedTimeout = setTimeout(updateOwned, 10)

					row.classList.add("btr-notowned")
					row.title = row.classList.contains("btr-notowned") ? "You do not own this badge" : ""
				}
			})
		})
		.$watch("#carousel-game-details", details => details.setAttribute("data-is-video-autoplayed-on-ready", "false"))
		.$watch(".game-play-button-container", cont => {
			const makeBox = (rootPlaceId, rootPlaceName) => {
				if(+rootPlaceId === +placeId) { return }

				const box = html`
				<div class="btr-universe-box">
					This place is part of 
					<a class="btr-universe-name text-link" href="/games/${rootPlaceId}/${formatUrlName(rootPlaceName)}">${rootPlaceName || "..."}</a>
					<div class="VisitButton VisitButtonPlayGLI btr-universe-visit-button" placeid="${rootPlaceId}" data-action=play data-is-membership-level-ok=true>
						<a class="btn-secondary-md">Play</a>
					</div>
				</div>`

				newContainer.prepend(box)

				if(!rootPlaceName) {
					const anchor = box.$find(".btr-universe-name")
					RobloxApi.api.getProductInfo(rootPlaceId).then(data => {
						anchor.textContent = data.Name
						anchor.href = `/games/${rootPlaceId}/${formatUrlName(data.Name)}`
					})
				}
			}

			const playButton = cont.$find("#MultiplayerVisitButton")
			if(playButton) {
				makeBox(playButton.getAttribute("placeid"))
				return
			}

			const buyButton = cont.$find(".PurchaseButton")
			if(buyButton) {
				makeBox(buyButton.dataset.itemId, buyButton.dataset.itemName)
				return
			}

			const url = `https://api.roblox.com/universes/get-universe-places?placeId=${placeId}`
			$.fetch(url).then(async resp => {
				const json = await resp.json()
				const rootPlaceId = json.RootPlace
				if(rootPlaceId === placeId) { return }

				const rootPlace = json.Places.find(x => x.PlaceId === rootPlaceId)
				makeBox(rootPlaceId, rootPlace ? rootPlace.Name : "")
			})
		})
	
	RobloxApi.api.getProductInfo(placeId).then(data => {
		watcher.$watch(".game-stats-container").$then()
			.$watch(
				".game-stat .text-lead",
				x => x.previousElementSibling.textContent === "Created",
				label => {
					label.title = new Date(data.Created).$format("M/D/YYYY h:mm:ss A (T)")
				}
			)
			.$watch(
				".game-stat .text-lead",
				x => x.previousElementSibling.textContent === "Updated",
				label => {
					label.classList.remove("date-time-i18n") // Otherwise roblox rewrites the label
					
					label.title = new Date(data.Updated).$format("M/D/YYYY h:mm:ss A (T)")
					label.textContent = `${$.dateSince(data.Updated)}`
				}
			)
	})

	$.ready(() => {
		const placeEdit = $("#game-context-menu .dropdown-menu .VisitButtonEditGLI")
		if(placeEdit) {
			placeEdit.parentNode.parentNode.append(
				html`<li><a class=btr-download-place><div>Download</div></a></li>`
			)

			document.$on("click", ".btr-download-place", () => {
				AssetCache.loadBuffer(placeId, ab => {
					const blobUrl = URL.createObjectURL(new Blob([ab]))

					const splitPath = window.location.pathname.split("/")
					const type = getAssetFileType(9, ab)

					startDownload(blobUrl, `${splitPath[splitPath.length - 1]}.${type}`)
					URL.revokeObjectURL(blobUrl)
				})
			})
		}
	})
}
"use strict"

pageInit.gamedetails = placeId => {
	if(!SETTINGS.get("gamedetails.enabled")) { return }
	
	InjectJS.inject(() => {
		const { settings, reactHook } = window.BTRoblox
		const placeId = BTRoblox.currentPage.matches[0]
		
		const largePageSize = 100
		const pageSize = 12
		
		const btrPager = { currentPage: 1, targetPage: 1, maxPage: 1, loading: false }
		const promises = {}
		const cursors = []
		
		const btrPagerState = reactHook.createGlobalState(btrPager)
		const serverParams = { sortOrder: "Desc", excludeFullGames: false }
		
		const loadLargePage = async largePageIndex => {
			if(largePageIndex >= cursors.length + 2) {
				throw new Error("Tried to load page with no cursor")
			}
			
			const cursor = cursors[largePageIndex - 2] ?? ""
			
			const url = `https://games.roblox.com/v1/games/${placeId}/servers/Public?sortOrder=${serverParams.sortOrder}&excludeFullGames=${serverParams.excludeFullGames}&limit=${largePageSize}&cursor=${cursor}`
			let promise = promises[url]
			
			if(!promise) {
				promise = promises[url] = fetch(url, { credentials: "include" }).then(res => (res.ok ? res.json() : null)).catch(() => null).finally(() => delete promises[url])
			}
			
			const json = await promise
			
			if(!json) {
				throw new Error("Failed to load")
			}
			
			const maxServer = (largePageIndex - 1) * largePageSize + json.data.length
			const maxPage = Math.max(1, Math.floor((maxServer - 1) / pageSize) + 1)
			
			if(json.nextPageCursor) {
				cursors[largePageIndex - 1] = json.nextPageCursor
				
				if(btrPager.maxPage <= maxPage) {
					btrPager.maxPage = maxPage
					btrPager.foundMaxPage = false
					btrPagerState.update()
				}
			} else {
				btrPager.maxPage = maxPage
				btrPager.foundMaxPage = json.data.length > 0 || largePageIndex === 1
				btrPagerState.update()
			}
			
			return json
		}
		
		const updateMaxPage = async () => {
			const attemptFindMaxPage = () => {
				const largePageIndex = Math.floor((btrPager.maxPage * pageSize) / largePageSize) + 1
				return loadLargePage(largePageIndex).then(() => !btrPager.foundMaxPage && attemptFindMaxPage())
			}
			
			btrPager.updatingMaxPage = true
			btrPagerState.update()
			
			return attemptFindMaxPage().finally(() => {
				btrPager.updatingMaxPage = false
				btrPagerState.update()
			})
		}
		
		const loadServers = async () => {
			const servers = {}
			
			outer:
			while(true) {
				const targetPage = btrPager.targetPage
				
				const serversFrom = (targetPage - 1) * pageSize + 1
				const serversTo = serversFrom + pageSize - 1
				
				const largeFrom = Math.min(cursors.length + 1, Math.floor((serversFrom - 1) / largePageSize) + 1)
				let largeTo = Math.floor((serversTo - 1) / largePageSize) + 1
				
				for(let pageIndex = largeFrom; pageIndex <= largeTo; pageIndex++) {
					const json = servers[pageIndex]
					
					if(!json) {
						servers[pageIndex] = await loadLargePage(pageIndex)
						continue outer
					}
					
					if(!json.nextPageCursor) {
						const maxServer = (pageIndex - 1) * largePageSize + json.data.length
						const maxPage = Math.max(1, Math.floor((maxServer - 1) / pageSize) + 1)
						
						if(maxPage < targetPage) {
							btrPager.targetPage = maxPage
							btrPagerState.update()
							continue outer
						}
						
						largeTo = pageIndex
						break
					}
				}
				
				btrPager.currentPage = targetPage
				btrPagerState.update()
				
				const result = []
				
				for(let pageIndex = largeFrom; pageIndex <= largeTo; pageIndex++) {
					const json = servers[pageIndex]
					const startIndex = (pageIndex - 1) * largePageSize
					
					result.push(...json.data.slice(Math.max(0, (serversFrom - 1) - startIndex), Math.max(0, serversTo - startIndex)))
				}
				
				if(btrPager.foundMaxPage && !btrPager.updatingMaxPage) {
					const maxLargePage = Math.floor((btrPager.maxPage * pageSize - 1) / largePageSize) + 1 // index of last item on maxPage
					
					if(!servers[maxLargePage]) { // we dont want to update max page twice
						updateMaxPage()
					}
				}
				
				return result
			}
		}
		
		let getGameInstancesPromise
		const btrGetPublicGameInstances = (placeId, cursor, params) => {
			if(!params?.btrRefresh) {
				const sortOrder = params?.sortOrder === "Asc" ? "Asc" : "Desc"
				const excludeFullGames = params?.excludeFullGames ? true : false
				
				if(serverParams.sortOrder !== sortOrder || serverParams.excludeFullGames !== excludeFullGames) {
					getGameInstancesPromise = null
					
					serverParams.sortOrder = sortOrder
					serverParams.excludeFullGames = excludeFullGames
					
					btrPager.targetPage = 1
				}
			}
			
			if(!getGameInstancesPromise) {
				btrPager.loading = true
				btrPagerState.update()
				
				const thisPromise = getGameInstancesPromise = loadServers().then(
					servers => ({
						data: {
							nextPageCursor: btrPager.currentPage < btrPager.maxPage ? "idk" : null,
							data: servers
						}
					}),
					() => null
				).finally(() => {
					if(getGameInstancesPromise === thisPromise) {
						btrPager.loading = false
						btrPagerState.update()
						
						getGameInstancesPromise = null
					}
				})
			}
			
			return getGameInstancesPromise
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
			
			React.useEffect(() => {
				inputRef.current.value = btrPager.currentPage
			}, [btrPager.currentPage])
			
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
									refreshGameInstances({ btrRefresh: true })
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
									btrPager.targetPage = Math.max(1, btrPager.currentPage - 1)
									refreshGameInstances({ btrRefresh: true })
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
	
									if(Number.isSafeInteger(num)) {
										btrPager.targetPage = Math.max(1, num)
										refreshGameInstances({ btrRefresh: true })
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
									className: "btr-pager-total"
								},
								btrPager.foundMaxPage ? `${btrPager.maxPage}` : btrPager.maxPage > 1 ? `${btrPager.maxPage}+` : "1"
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
									refreshGameInstances({ btrRefresh: true })
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
									refreshGameInstances({ btrRefresh: true })
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
		
		reactHook.hijackConstructor( // GameInstanceCard
			args => args[1]?.gameServerStatus,
			(target, thisArg, args) => {
				const result = target.apply(thisArg, args)
				
				const joinBtn = reactHook.queryElement(result, x => x.props.className?.includes("game-server-join-btn"))
				if(joinBtn) {
					joinBtn.props["data-btr-instance-id"] = args[0].id
				}
				
				return result
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

			about.$watchAll("*", x => {
				if(!x.matches("#rbx-private-servers, #private-server-container-about-tab, #my-recommended-games, #recommended-games-container")) {
					midContainer.append(x)
				}
			})
		})
		.$watch("#game-instances", games => {
			games.classList.add("active")
			
			games.$on("contextmenu", ".game-server-join-btn", ev => {
				const instanceId = ev.target.dataset.btrInstanceId
				if(!instanceId) { return }
				
				const link = html`<a style="display:contents">`
				link.href = `/btr_context/?btr_instanceId=${instanceId}`
				
				ev.target.before(link)
				link.append(ev.target)
				
				requestAnimationFrame(() => {
					link.before(ev.target)
					link.remove()
				})
			})
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
		.$watch("#game-detail-meta-data", dataCont => {
			if(dataCont.dataset.placeId !== dataCont.dataset.rootPlaceId) {
				const rootPlaceId = dataCont.dataset.rootPlaceId
				const rootPlaceName = dataCont.dataset.placeName
				
				const box = html`
				<div class="btr-universe-box">
					This place is part of 
					<a class="btr-universe-name text-link" href="/games/${rootPlaceId}/${formatUrlName(rootPlaceName)}">${rootPlaceName || "..."}</a>
					<div class="VisitButton VisitButtonPlayGLI btr-universe-visit-button" placeid="${rootPlaceId}" data-action=play data-is-membership-level-ok=true>
						<a class="btn-secondary-md">Play</a>
					</div>
				</div>`

				newContainer.prepend(box)
			}
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
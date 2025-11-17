"use strict"

pageInit.gamedetails = () => {
	onPageLoad(placeIdString => {
		const placeId = Number.parseInt(placeIdString, 10)
		
		if(RobuxToCash.isEnabled()) {
			document.$watch("#rbx-passes-container").$then()
				.$watch(".text-robux", label => {
					const robux = parseInt(label.textContent.replace(/\D/g, ""), 10)
					
					if(Number.isSafeInteger(robux)) {
						const cash = RobuxToCash.convert(robux)
						label.after(html`<span class=btr-robuxToCash-tile>&nbsp;(${cash})</span>`)
					}
				}, { continuous: true })
		}
		
		document.$watch("#content").$then().$watch(">#game-detail-page").$then()
			.$watch("#game-context-menu .dropdown-menu .VisitButtonEditGLI", placeEdit => {
				placeEdit.parentNode.parentNode.append(
					html`<li><a class=btr-download-place><div>Download</div></a></li>`
				)
				
				const target = $("#game-context-menu")
				
				target.$on("click", ".btr-download-place", () => {
					AssetCache.loadBuffer(placeId, ab => {
						const blobUrl = URL.createObjectURL(new Blob([ab]))

						const splitPath = window.location.pathname.split("/")
						const type = getAssetFileType(9, ab)

						startDownload(blobUrl, `${splitPath[splitPath.length - 1]}.${type}`)
						URL.revokeObjectURL(blobUrl)
					})
				})
				
				initExplorer(placeId, AssetType.Place).then(btnCont => {
					if(!btnCont) { return }
					
					btnCont.$find(".btr-explorer-button").style.display = "none"
					btnCont.style.position = "absolute"
					btnCont.style.width = `${target.clientWidth}px`
					btnCont.style.height = `${0}px`
					btnCont.style.left = `${target.offsetLeft}px`
					btnCont.style.top = `${target.offsetTop + target.clientHeight}px`
					
					target.after(btnCont)
					
					placeEdit.parentNode.parentNode.append(
						html`<li><a class=btr-open-in-explorer><div>Open in Explorer</div></a></li>`
					)
					
					target.$on("click", ".btr-open-in-explorer", () => {
						btnCont.$find(".btr-explorer-button").click()
					})
				})
			})
	})
	
	if(!SETTINGS.get("gamedetails.enabled")) { return }
	
	injectScript.call("pagedServers", () => {
		const largePageSize = 100
		const pageSize = 12
		
		const btrPager = { currentPage: 1, targetPage: 1, maxPage: 1, loading: false }
		const promises = {}
		const cursors = []
		
		const btrPagerState = reactHook.createGlobalState(btrPager)
		const serverParams = { sortOrder: "Desc", excludeFullGames: false }
		
		const loadLargePage = async (placeId, largePageIndex) => {
			if(largePageIndex >= cursors.length + 2) {
				throw new Error("Tried to load page with no cursor")
			}
			
			const cursor = cursors[largePageIndex - 2] ?? ""
			
			const url = `https://games.roblox.com/v1/games/${placeId}/servers/Public?sortOrder=${serverParams.sortOrder}&excludeFullGames=${serverParams.excludeFullGames}&limit=${largePageSize}&cursor=${cursor}`
			let promise = promises[url]
			
			if(!promise) {
				let numRetries = 0
				
				const tryRetry = async res => {
					if(res.status === 429 && numRetries < 2) {
						numRetries += 1
						await new Promise(resolve => setTimeout(resolve, 3e3))
						return fetch(url, { credentials: "include" })
					}
					
					return res
				}
				
				promise = promises[url] = fetch(url, { credentials: "include" }).then(tryRetry).then(res => (res.ok ? res.json() : null)).catch(() => null).finally(() => delete promises[url])
			}
			
			const json = await promise
			
			if(!json) {
				throw new Error("Failed to load")
			}
			
			const maxServer = (largePageIndex - 1) * largePageSize + json.data.length
			const maxPage = Math.max(1, Math.floor((maxServer - 1) / pageSize) + 1)
			
			if(json.nextPageCursor) {
				cursors[largePageIndex - 1] = json.nextPageCursor
				
				if(maxPage >= btrPager.maxPage) {
					btrPager.maxPage = maxPage
					btrPager.foundMaxPage = false
					btrPager.hasMore = true
					btrPagerState.update()
				}
			} else {
				const isMaxPage = json.data.length > 0 || largePageIndex === 1
				
				if(isMaxPage || maxPage <= btrPager.maxPage) {
					btrPager.maxPage = maxPage
					btrPager.foundMaxPage = json.data.length > 0 || largePageIndex === 1
					btrPager.hasMore = false
					btrPagerState.update()
				}
			}
			
			return json
		}
		
		const updateMaxPage = async (placeId, skipPageIndex) => {
			const largePageIndex = Math.min(
				Math.floor((btrPager.maxPage * pageSize - 1) / largePageSize) + 1,
				cursors.length + (btrPager.foundMaxPage ? 1 : 0)
			)
			
			if(largePageIndex === skipPageIndex) {
				return
			}
			
			const attemptFindMaxPage = async () => {
				for(let i = largePageIndex; i >= 1; i--) {
					await loadLargePage(placeId, i)
					
					if(btrPager.foundMaxPage || btrPager.hasMore) {
						break
					}
				}
			}
			
			btrPager.updatingMaxPage = true
			btrPagerState.update()
			
			return attemptFindMaxPage().finally(() => {
				btrPager.updatingMaxPage = false
				btrPagerState.update()
			})
		}
		
		const loadServers = async placeId => {
			const largePages = {}
			
			outer:
			while(true) {
				const targetPage = btrPager.targetPage
				
				const serversFrom = (targetPage - 1) * pageSize + 1
				const serversTo = serversFrom + pageSize - 1
				
				const largeFrom = Math.min(cursors.length + 1, Math.floor((serversFrom - 1) / largePageSize) + 1)
				let largeTo = Math.floor((serversTo - 1) / largePageSize) + 1
				
				for(let largePageIndex = largeFrom; largePageIndex <= largeTo; largePageIndex++) {
					const json = largePages[largePageIndex]
					
					if(!json) {
						largePages[largePageIndex] = await loadLargePage(placeId, largePageIndex)
						continue outer
					}
					
					if(!json.nextPageCursor) {
						const maxServer = (largePageIndex - 1) * largePageSize + json.data.length
						const maxPage = Math.max(1, Math.floor((maxServer - 1) / pageSize) + 1)
						
						if(maxPage < targetPage) {
							btrPager.targetPage = maxPage
							btrPagerState.update()
							continue outer
						}
						
						largeTo = largePageIndex
						break
					}
				}
				
				btrPager.currentPage = targetPage
				btrPagerState.update()
				
				const result = []
				
				for(let largePageIndex = largeFrom; largePageIndex <= largeTo; largePageIndex++) {
					const json = largePages[largePageIndex]
					const startIndex = (largePageIndex - 1) * largePageSize
					
					result.push(...json.data.slice(Math.max(0, (serversFrom - 1) - startIndex), Math.max(0, serversTo - startIndex)))
				}
				
				if(!btrPager.updatingMaxPage) {
					updateMaxPage(placeId, largeTo)
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
				
				const thisPromise = getGameInstancesPromise = loadServers(placeId).then(
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
			const canNext = !btrPager.loading && (!btrPager.foundMaxPage || btrPager.currentPage < (btrPager.maxPage ?? 2))
			
			const inputRef = React.useRef()
			
			const updateInputWidth = () => {
				inputRef.current.style.width = "0px"
				inputRef.current.style.width = `${Math.max(32, Math.min(100, inputRef.current.scrollWidth + 12))}px`
			}
			
			React.useEffect(updateInputWidth, [])
			
			React.useEffect(() => {
				inputRef.current.value = btrPager.currentPage
			}, [btrPager.currentPage])
			
			const submit = pressedEnter => {
				const num = parseInt(inputRef.current.value, 10)
	
				if(Number.isSafeInteger(num) && (pressedEnter || btrPager.targetPage !== num)) {
					btrPager.targetPage = Math.max(1, num)
					refreshGameInstances({ btrRefresh: true })
				} else {
					inputRef.current.value = btrPager.currentPage
				}
			}
			
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
										submit(true)
										e.target.blur()
									}
								},
								
								onBlur(e) {
									submit(false)
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
		
		const useSyncExternalStore = (subscribe, getSnapshot) => {
			const [counter, setCounter] = React.useState(0)
			const snapshot = getSnapshot()
			
			const refresh = () => {
				if(!Object.is(snapshot, getSnapshot())) {
					setCounter(counter + 1)
				}
			}
			
			React.useEffect(() => (refresh(), subscribe(refresh)))
			
			return snapshot
		}
		
		const globalServerRegions = {}
		const onRegionsChanged = new Set()
		
		if(settings.gamedetails.showServerRegion) {
			contentScript.listen("setServerRegion", (jobId, details) => {
				if(JSON.stringify(details) !== JSON.stringify(globalServerRegions[jobId])) {
					globalServerRegions[jobId] = details
					
					for(const fn of onRegionsChanged) {
						fn()
					}
				}
			})
		}
		
		reactHook.hijackConstructor(
			props => props.getGameServers,
			(target, thisArg, args) => {
				const props = args[0]
				
				if(settings.gamedetails.addServerPager && (props.getGameServers?.name === "getPublicGameInstances" || props.getGameServers === btrGetPublicGameInstances)) {
					props.getGameServers = btrGetPublicGameInstances
				}
				
				return target.apply(thisArg, args)
			}
		)
		
		reactHook.hijackConstructor(
			props => props.loadMoreGameInstances && "headerTitle" in props,
			(target, thisArg, args) => {
				const props = args[0]
				
				if(props.type === "public" && settings.gamedetails.addServerPager) {
					props.btrPagerEnabled = true
					props.showLoadMoreButton = false
				}
				
				const result = target.apply(thisArg, args)
				
				try {
					const list = reactHook.queryElement(result, x => x.props.id?.includes("running-games"))
					
					if(props.btrPagerEnabled) {
						list.props.children.push(
							React.createElement(btrPagerConstructor, {
								refreshGameInstances: props.refreshGameInstances
							})
						)
					}
					
					const ul = reactHook.queryElement(list, x => x.type === "ul", 5)
					const servers = ul?.props?.children
					
					if(servers) {
						for(const server of [servers].flat()) {
							server.props.btrGameInstance = props?.gameInstances?.find(x => x.id === server.props.id)
						}
					}
				} catch(ex) {
					console.error(ex)
				}
				
				return result
			}
		)
		
		reactHook.hijackConstructor( // GameInstanceCard
			props => props.gameServerStatus,
			(target, thisArg, args) => {
				const result = target.apply(thisArg, args)
				const placeId = args[0].placeId
				const jobId = args[0].id
				
				if(jobId) {
					const joinBtn = reactHook.queryElement(result, x => x.props.className?.includes("game-server-join-btn"))
					if(joinBtn) {
						joinBtn.props["data-btr-instance-id"] = jobId
					}
					
					let serverDetails
					
					const regionSetting = settings.gamedetails.showServerRegion
					const showPing = ["ping", "both", "combined"].includes(regionSetting)
					const showRegion = ["region", "both", "combined"].includes(regionSetting)
					
					if(showRegion) {
						serverDetails = useSyncExternalStore(callback => {
							onRegionsChanged.add(callback)
							return () => onRegionsChanged.delete(callback)
						}, () => globalServerRegions[jobId])
						
						React.useEffect(() => {
							contentScript.send("getServerRegion", placeId, jobId)
						}, [jobId])
					}
					
					const gameInstance = args[0].btrGameInstance
					if(gameInstance) {
						const status = reactHook.queryElement(result, x => x.props.className?.includes("rbx-game-status"))
						
						if(status) {
							if(showRegion && regionSetting !== "combined") {
								status.props.children += `\nRegion: ${
									!serverDetails ? "Loading"
									: !serverDetails.location ? serverDetails.statusText
									: `${serverDetails.location.city}, ${serverDetails.location.country.name === "United States" ? serverDetails.location.region.code : serverDetails.location.country.code}`
								}`
									
								// Okay, this is hacky, BUT...
								// United Kingdom wraps over by 1 character, so let's increase size for it lmao
								// not needed anymore
								
								// if(serverDetails?.location?.country.name === "United Kingdom") {
								// 	if(!status.props.style) { status.props.style = {} }
								// 	status.props.style.width = "105%"
								// }
							}
							
							if(showPing) {
								status.props.children += `\nPing: ${gameInstance.ping ?? 0}ms`
								
								if(showRegion && regionSetting === "combined") {
									status.props.children += ` (${
										!serverDetails ? "Loading" :
										serverDetails.location ? serverDetails.location.country.code :
										serverDetails.statusText
									})`
								}
							}
							
							if(showRegion) {
								status.props.title = 
									!serverDetails ? "Loading"
									: !serverDetails.location ? serverDetails.statusTextLong
									: (
										serverDetails.location.country.name === "United States" ? `${serverDetails.location.city}, ${serverDetails.location.region.name}, ${serverDetails.location.country.name}`
										: `${serverDetails.location.city}, ${serverDetails.location.country.name}` 
									)
								
								if(serverDetails?.address) {
									status.props.title += ` (${serverDetails?.address})`
								}
							}
						}
					}
				}
				
				return result
			}
		)
		
		reactHook.hijackUseStateGlobal(
			(value, index) => ["tab-about", "tab-game-instances", "tab-store"].includes(value),
			(value, initial) => {
				if(value === "tab-about" && window.location.hash !== "#!/about") {
					return "tab-game-instances"
				}
				
				return value
			}
		)
	})
	
	injectScript.call("gamedetails", () => {
		reactHook.inject(".game-description-container", elem => {
			elem.replaceWith(reactHook.createElement("div", { style: { display: "contents" } },
				reactHook.createElement("div", { id: "btr-description-wrapper", style: { display: "contents" } }, elem[0])
			))
		})
		
		reactHook.inject(".container-list.games-detail", elem => {
			elem.replaceWith(reactHook.createElement("div", { style: { display: "contents" } },
				reactHook.createElement("div", { id: "btr-recommendations-wrapper", style: { display: "contents" } }, elem[0])
			))
		})
		
		reactHook.inject(".game-social-links .btn-secondary-lg", elem => {
			const socials = reactHook.renderTarget?.state[0]?.[0]
			const entry = socials?.find(x => x.id === +elem[0].key)
			
			if(entry) {
				elem[0].props.href = entry.url
				
				hijackFunction(elem[0].props, "onClick", (target, thisArg, args) => {
					const event = args[0]
					event.preventDefault()
					
					const result = target.apply(thisArg, args)
					return result
				})
			}
		})
	})
	
	if(SETTINGS.get("gamedetails.showServerRegion")) {
		const requesting = {}
		
		injectScript.listen("getServerRegion", (placeId, jobId) => {
			if(typeof jobId !== "string" || requesting[jobId]) { return }
			requesting[jobId] = true
			
			getServerDetails(placeId, jobId, details => {
				delete requesting[jobId]
				injectScript.send("setServerRegion", jobId, details)
			})
		})
	}
	
	onPageReset(() => {
		document.body?.classList.remove("btr-gamedetails")
	})
	
	onPageLoad(placeIdString => {
		const placeId = Number.parseInt(placeIdString, 10)
		
		document.$watch("body", body => body.classList.add("btr-gamedetails"))
		
		document.$watch("#content").$then().$watch(">#game-detail-page", container => {
			const newContainer = html`
			<div class="col-xs-12 btr-game-main-container section-content">
				<div class=placeholder-main></div>
			</div>`

			const midContainer = html`
			<div class="col-xs-12 btr-mid-container"></div>`

			container
				.$watch(["#tab-about", "#tab-game-instances"], (aboutTab, gameTab) => {
					aboutTab.$find(".text-lead").textContent = "Recommended"
					
					aboutTab.classList.remove("active")
					gameTab.classList.add("active")

					const parent = aboutTab.parentNode
					parent.append(aboutTab)
					parent.prepend(gameTab)
				})
				.$watch("#game-instances", games => {
					games.classList.add("active")
					
					onMouseEnter(games, ".game-server-join-btn", btn => {
						const instanceId = btn.dataset.btrInstanceId
						
						if(instanceId) {
							ContextMenu.setCustomContextMenu(btn, {
								instanceId: instanceId
							})
						}
					})
				})
				.$watch(".game-main-content", mainCont => {
					mainCont.classList.remove("section-content")
					mainCont.before(newContainer)
					newContainer.after(midContainer)
					newContainer.$find(".placeholder-main").replaceWith(mainCont)
				})
				.$watch("#about", about => {
					about.classList.remove("active")
				})
				.$watch(".game-about-container,#game-details-about-tab-container", cont => {
					if(cont.id === "game-details-about-tab-container") {
						// react about tab
						container.$watch("#game-details-about-tab-container", parent => {
							midContainer.append(parent)
							
							parent.$watch("#btr-description-wrapper", descCont => {
								newContainer.append(descCont)
								redirectEvents(descCont, parent)
							})
							
							parent.$watch("#btr-recommendations-wrapper", recCont => {
								$("#about").append(recCont)
								redirectEvents(recCont, parent)
							})
						})
					} else {
						// legacy about tab
						newContainer.append(cont)
						
						container.$watch("#about").$then().$watchAll("*", child => {
							if(child.id === "private-server-container-about-tab") {
								child.style.display = "none"
							} else if(child.id !== "recommended-games-container") {
								midContainer.append(child)
							}
						})
					}
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
					
					if(SETTINGS.get("gamedetails.compactBadgeStats")) {
						badges.classList.add("btr-compact-stats")
					}

					const badgeQueue = []
					let ownedTimeout

					const updateOwned = async () => {
						const userId = await loggedInUserPromise
						const badgeList = badgeQueue.splice(0, badgeQueue.length)
						
						return RobloxApi.badges.getAwardedDates(userId, badgeList.map(x => x.badgeId)).then(json => {
							if(!json?.data) { return }
							
							for(const { row, badgeId } of badgeList) {
								const entry = json.data.find(x => x.badgeId === badgeId)
								
								row.classList.toggle("btr-notowned", !entry)
								row.$find(".btr-unlock-date")?.remove()
								
								if(entry) {
									const awardedDate = new Date(entry.awardedDate)
									row.$find(".badge-data-container").append(html`
									<span class=btr-unlock-date title="${awardedDate.$since()}">
										Unlocked ${awardedDate.$format("MMM D, YYYY, h:mm A")}
									</span>`)
								}
							}
						})
					}

					badges.$watch(">.stack-list").$then().$watchAll(".badge-row", row => {
						const url = row.$find(".badge-image>a").href
						const label = row.$find(".badge-name")
						const link = html`<a href="${url}">${label.textContent}</a>`
						
						label.replaceChildren(link)
						
						if(SETTINGS.get("gamedetails.compactBadgeStats")) {
							for(const valueLabel of row.$findAll(".badge-stats-container .badge-stats-info")) {
								const rarity = valueLabel.textContent.match(/^\s*(\d+\.\d+%)\s*\((.*)\)\s*$/)
								if(rarity) {
									valueLabel.textContent = rarity[1]
									valueLabel.title = rarity[2]
								}
								
								const count = valueLabel.textContent.match(/^\d+$/)
								if(count) {
									valueLabel.textContent = Intl.NumberFormat().format(+count)
								}
							}
						}

						const desc = row.$find("p.para-overflow")
						desc.classList.add("btr-desc-content")
						desc.classList.remove("para-overflow")
						
						if(desc.scrollHeight > desc.clientHeight + 10) {
							const moreBtn = html`<span class="btr-badge-more text-link cursor-pointer">See More</span>`
							desc.after(moreBtn)
							
							moreBtn.$on("click", () => {
								const open = !desc.classList.contains("btr-desc-open")
								desc.classList.toggle("btr-desc-open", open)
								moreBtn.textContent = open ? `See Less` : `See More`
							})
						}

						if(SETTINGS.get("gamedetails.showBadgeOwned")) {
							const match = url.match(/(?:catalog|badges)\/(\d+)\//)
							if(!match) { return }

							const badgeId = +match[1]
							badgeQueue.push({ row, badgeId })

							clearTimeout(ownedTimeout)
							ownedTimeout = setTimeout(updateOwned, 10)

							row.classList.add("btr-notowned")
						}
					})
					
					if(SETTINGS.get("gamedetails.showBadgeOwned")) {
						badges.$watch(".container-header h2", header => {
							const refresh = html`<button type="button" class="btn-more rbx-refresh refresh-link-icon btn-control-xs btn-min-width">Refresh</button>`
							header.after(refresh)
							
							refresh.$on("click", () => {
								if(refresh.getAttribute("disabled")) { return }
								
								badgeQueue.splice(0, badgeQueue.length)
								
								for(const row of badges.$findAll(".badge-row")) {
									const url = row.$find(".badge-image>a").href
									
									const match = url.match(/(?:catalog|badges)\/(\d+)\//)
									if(!match) { continue }

									const badgeId = +match[1]
									badgeQueue.push({ row, badgeId })
								}
								
								if(!badgeQueue.length) { return }
								
								refresh.setAttribute("disabled", "")
								
								updateOwned().finally(() => {
									refresh.removeAttribute("disabled")
								})
							})
						})
					}
				})
				.$watch("#carousel-game-details", details => {
					details.setAttribute("data-is-video-autoplayed-on-ready", "false")
				})
				.$watch("#game-detail-meta-data", dataCont => {
					ContextMenu.setCustomContextMenu(document.documentElement, {
						copyParent: true,
						placeLink: dataCont.dataset.placeId,
						universeLink: dataCont.dataset.universeId
					})
					
					if(dataCont.dataset.placeId !== dataCont.dataset.rootPlaceId) {
						const rootPlaceId = dataCont.dataset.rootPlaceId
						const rootPlaceName = dataCont.dataset.placeName
						
						const box = html`
						<div class="section-content btr-universe-box">
							This place is part of 
							<a class="btr-universe-name text-link" href="/games/${rootPlaceId}/${formatUrlName(rootPlaceName)}">${rootPlaceName || "..."}</a>
							<div class="VisitButton VisitButtonPlayGLI btr-universe-visit-button" placeid="${rootPlaceId}" data-action=play data-is-membership-level-ok=true>
								<a class="btn-secondary-md">Play</a>
							</div>
						</div>`

						newContainer.before(box)
					}
				})
			
			RobloxApi.economy.getAssetDetails(placeId).then(data => {
				if(!data.Updated) { return }
				
				container.$watch(".game-stat-container,.game-stats-container").$then()
					.$watch(
						".game-stat .text-lead",
						x => x.previousElementSibling?.textContent === "Created",
						label => {
							label.title = new Date(data.Created).$format("M/D/YYYY h:mm:ss A (T)")
						}
					)
					.$watch(
						".game-stat .text-lead",
						x => x.previousElementSibling?.textContent === "Updated",
						label => {
							label.classList.remove("date-time-i18n") // Otherwise roblox rewrites the label
							
							label.title = new Date(data.Updated).$format("M/D/YYYY h:mm:ss A (T)")
							label.textContent = `${$.dateSince(data.Updated)}`
						}
					)
			})
		})
	})
}
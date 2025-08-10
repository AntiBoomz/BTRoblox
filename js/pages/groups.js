"use strict"

pageInit.groups = () => {
	if(SETTINGS.get("general.hoverPreview")) {
		loadOptionalFeature("previewer").then(() => {
			HoverPreview.register(".item-card", ".item-card-thumb-container")
		})
	}

	if(!SETTINGS.get("groups.enabled")) { return }

	if(SETTINGS.get("groups.modifyLayout")) {
		injectScript.call("groupsModifyLayout", () => {
			angularHook.hijackModule("group", {
				groupController(target, thisArg, args, argsMap) {
					const result = target.apply(thisArg, args)
					
					try {
						const { $scope, groupDetailsConstants } = argsMap
						
						groupDetailsConstants.tabs.about.translationKey = "Heading.Members"
						
						groupDetailsConstants.tabs.games = {
							state: "about",
							btrCustomTab: "games",
							translationKey: "Heading.Games"
						}
						
						groupDetailsConstants.tabs.payouts = {
							state: "about",
							btrCustomTab: "payouts",
							translationKey: "Heading.Payouts"
						}
						
						$scope.btrCustomTab = {
							name: null
						}
						
						hijackFunction($scope, "groupDetailsTabs", (target, thisArg, args) => {
							let result = target.apply(thisArg, args)
							
							const entries = Object.entries(result)
							
							if($scope.library?.currentGroup?.areGroupGamesVisible) {
								entries.splice(1, 0, ["games", groupDetailsConstants.tabs.games])
							}
							
							if($scope.isAuthenticatedUser && $scope.layout?.btrPayoutsEnabled) {
								entries.push(["payouts", groupDetailsConstants.tabs.payouts])
							}
							
							result = Object.fromEntries(entries)
							
							return result
						})
						
						// this doesnt get called unless we start on group shout page
						// doing it here since we always show shouts
						$scope.initVerifiedBadgesForGroupShout()
					} catch(ex) {
						console.error(ex)
					}
					
					return result
				},
				groupTab(target, thisArg, args) {
					const result = target.apply(thisArg, args)
					
					try {
						result.scope.btrCustomTab = "="
					} catch(ex) {
						console.error(ex)
					}
					
					return result
				}
			})
			
			angularHook.hijackModule("groupPayouts", {
				groupPayouts(component) {
					component.bindings.layout = "="
				},
				groupPayoutsController(target, thisArg, args, argsMap) {
					const result = target.apply(thisArg, args)
					
					try {
						const { groupPayoutsService } = argsMap
						const controller = thisArg
						
						hijackFunction(groupPayoutsService, "getGroupPayoutRecipients", (target, thisArg, args) => {
							const result = target.apply(thisArg, args)
							
							try {
								result.then(
									recipients => controller.layout.btrPayoutsEnabled = recipients.length > 0,
									() => controller.layout.btrPayoutsEnabled = false
								)
							} catch(ex) {
								console.error(ex)
							}
							
							return result
						})
					} catch(ex) {
						console.error(ex)
					}
	
					return result
				}
			})
		})
		
		modifyAngularTemplate(["group-base", "group-about"], (baseTemplate, aboutTemplate) => {
			const tabs = baseTemplate.$find(".rbx-tabs-horizontal")
			
			// move most things out of about and into the main container
			const hoist = [
				aboutTemplate.$find("group-events"),
				aboutTemplate.$find("#group-announcements"),
				aboutTemplate.$find(".group-shout"),
				aboutTemplate.$find("social-links-container")
			]
			
			for(const element of hoist) {
				if(!element) { continue }
				
				element.removeAttribute("ng-switch-when")
				tabs.before(element)
			}
			
			// toggle members/games/payouts based on custom tab
			const members = aboutTemplate.$find("group-members-list")
			if(members) {
				members.setAttribute("ng-show", `!btrCustomTab.name`)
			}
						
			const games = aboutTemplate.$find("group-games")
			if(games) {
				games.setAttribute("ng-show", `btrCustomTab.name === "games"`)
			}
			
			const payouts = aboutTemplate.$find("group-payouts")
			if(payouts) {
				payouts.setAttribute("layout", "layout")
				payouts.setAttribute("ng-show", `btrCustomTab.name === "payouts"`)
			}
			
			// move discovery and group wall below the main container so it's visible in most views
			const discovery = aboutTemplate.$find("group-forums-discovery")
			if(discovery) {
				discovery.removeAttribute("ng-switch-when")
				discovery.setAttribute("ng-show", "layout.activeTab !== groupDetailsConstants.tabs.forums")
				tabs.parentNode.append(discovery)
			}
			
			const wall = aboutTemplate.$find("group-wall")
			if(wall) {
				wall.removeAttribute("ng-switch-when")
				wall.setAttribute("ng-show", "layout.activeTab !== groupDetailsConstants.tabs.forums")
				tabs.parentNode.append(wall)
			}
		})
		
		modifyAngularTemplate("group-tab", template => {
			const tab = template.$find(".rbx-tab")
			
			tab.setAttribute("btr-custom-tab", "btrCustomTab")
			tab.setAttribute("ng-class", tab.getAttribute("ng-class").replace(/activeTab === tab/, "activeTab.state === tab.state && btrCustomTab.name == tab.btrCustomTab"))
			tab.setAttribute("ng-click", "btrCustomTab.name = tab.btrCustomTab")
			
			// it only supports up to 5 tabs by default, so just hardcode width
			tab.setAttribute("style", "width: calc(100% / {{numTabs}});")
		})

		modifyAngularTemplate("group-members-list", template => {
			template.$find(".dropdown-menu li a").title = `{{ role.name }}`
			template.$find(".dropdown-menu li a .role-member-count").title = `{{ role.memberCount | number }}`
		})
	}

	if(SETTINGS.get("groups.selectedRoleCount")) {
		modifyAngularTemplate("group-members-list", template => {
			const label = template.$find(".group-dropdown > button .rbx-selection-label")
			label.after(html`<span class=btr-role-member-count title="{{ $ctrl.data.currentRoleMemberCount | number }}" ng-if="$ctrl.data.currentRoleMemberCount>0">({{ $ctrl.data.currentRoleMemberCount | abbreviate }})</span>`)
		})
	}

	if(SETTINGS.get("general.enableContextMenus")) {
		modifyAngularTemplate("group-members-list", template => {
			template.$find(".dropdown-menu li").dataset.btrRank = `{{ role.rank }}`
		})

		document.$watch("group-members-list .group-dropdown", dropdown => {
			onMouseEnter(dropdown, ".input-dropdown-btn", btn => {
				const roleName = btn.$find(".rbx-selection-label").textContent.trim()
				const target = dropdown.$find(`.dropdown-menu li>a[title="${roleName}"]`)

				if(target) {
					const elem = target.parentNode

					const roleId = elem.id.replace(/^role-/, "")
					const roleRank = elem.dataset.btrRank
					
					ContextMenu.setCustomContextMenu(btn, {
						roleParent: true,
						roleId: roleId,
						roleRank: roleRank
					})
				}
			})
			
			onMouseEnter(dropdown, ".dropdown-menu > li", elem => {
				const roleId = elem.id.replace(/^role-/, "")
				const roleRank = elem.dataset.btrRank
				
				ContextMenu.setCustomContextMenu(elem, {
					roleParent: true,
					roleId: roleId,
					roleRank: roleRank
				})
			})
		})
	}

	if(SETTINGS.get("groups.pagedGroupWall")) {
		modifyAngularTemplate("group-wall", template => {
			template.firstElementChild.setAttribute("infinite-scroll-disabled", "true")

			template.$find(".group-wall").parentNode.append(html`
			<div class="btr-pager-holder btr-comment-pager" ng-show="!hideWallPost">
				<ul class=btr-pager>
					<li class=btr-pager-first><button class=btn-generic-first-page-sm ng-disabled="!btrPagerStatus.prev" ng-click=btrPagerStatus.prev&&btrLoadWallPosts("first")><span class=icon-first-page></span></button></li>
					<li class=btr-pager-prev><button class=btn-generic-left-sm ng-disabled="!btrPagerStatus.prev" ng-click=btrPagerStatus.prev&&btrLoadWallPosts("prev")><span class=icon-left></span></button></li>
					<li class=btr-pager-mid>
						<span>Page </span><form ng-submit=btrPagerStatus.input&&btrLoadWallPosts("input") style=display:contents><input class=btr-pager-cur ng-init="btrAttachInput()" ng-disabled="!btrPagerStatus.input" ng-value="btrPagerStatus.pageNum" type=text value=-1></form>
					</li>
					<li class=btr-pager-next><button class=btn-generic-right-sm ng-disabled="!btrPagerStatus.next" ng-click=btrPagerStatus.next&&btrLoadWallPosts("next")><span class=icon-right></span></button></li>
					<li class=btr-pager-last><button class=btn-generic-last-page-sm ng-disabled="!btrPagerStatus.next" ng-click=btrPagerStatus.next&&btrLoadWallPosts("last")><span class=icon-last-page></span></button></li>
				</ul>
			</div>`)
		})
		
		injectScript.call("pagedGroupWall", () => {
			const createCustomPager = (ctrl, { $scope }) => {
				const wallPosts = []
				const pageSize = 10
				let loadMorePromise = null
				let nextPageCursor = ""
				let requestCounter = 0
				let lastPageNum = 0
				let isLoadingPosts = false
				let activeLoadMore = 0
	
				const btrPagerStatus = {
					prev: false,
					next: false,
					input: false,
					pageNum: 1
				}
	
				const setPageNumber = page => {
					btrPagerStatus.prev = page > 0
					btrPagerStatus.next = !!nextPageCursor || wallPosts.length > ((page + 1) * pageSize)
					btrPagerStatus.input = true
					btrPagerStatus.pageNum = page + 1
	
					lastPageNum = page
	
					const startIndex = page * pageSize
					const endIndex = startIndex + pageSize
	
					$scope.groupWall.posts = wallPosts.slice(startIndex, endIndex).map($scope.convertResultToPostObject)
					$scope.$applyAsync()
				}
	
				const loadMorePosts = () => {
					if(loadMorePromise) {
						return loadMorePromise
					}
					
					const currentLoadMore = activeLoadMore += 1
					
					return loadMorePromise = Promise.resolve().then(async () => {
						const groupId = ctrl.groupId || $scope.library.currentGroup.id
						const url = `https://groups.roblox.com/v2/groups/${groupId}/wall/posts?sortOrder=Desc&limit=100&cursor=${nextPageCursor}`
						
						let res
						
						while(true) {
							res = await fetch(url, { credentials: "include" })
							if(activeLoadMore !== currentLoadMore) { return }
							
							if(!res.ok) {
								await new Promise(resolve => setTimeout(resolve, 1e3))
								if(activeLoadMore !== currentLoadMore) { return }
								continue
							}
							
							break
						}
						
						const json = await res.json()
						if(activeLoadMore !== currentLoadMore) { return }
						
						nextPageCursor = json.nextPageCursor || null
						wallPosts.push(...json.data.filter(x => x.poster))
	
						loadMorePromise = null
					})
				}
	
				const requestWallPosts = page => {
					if(!Number.isSafeInteger(page)) { return }
					const myCounter = ++requestCounter
	
					btrPagerStatus.prev = false
					btrPagerStatus.next = false
					btrPagerStatus.input = false
	
					page = Math.max(0, Math.floor(page))
					isLoadingPosts = true
	
					const startIndex = page * pageSize
					const endIndex = startIndex + pageSize
					
					const tryAgain = () => {
						if(requestCounter !== myCounter) { return }
	
						if(wallPosts.length < endIndex && nextPageCursor !== null) {
							loadMorePosts().then(tryAgain)
							return
						}
	
						const maxPage = Math.max(0, Math.floor((wallPosts.length - 1) / pageSize))
						setPageNumber(Math.min(maxPage, page))
	
						isLoadingPosts = false
					}
	
					tryAgain()
				}
	
				$scope.groupWall.pager.isBusy = () => isLoadingPosts
				$scope.groupWall.pager.loadNextPage = () => {}
				$scope.groupWall.pager.loadFirstPage = () => {
					wallPosts.splice(0, wallPosts.length)
					nextPageCursor = ""
					loadMorePromise = null
					activeLoadMore += 1
					requestWallPosts(0)
				}
				
				$scope.btrAttachInput = () => {
					const input = document.querySelector(".btr-comment-pager input")
		
					const updateInputWidth = () => {
						input.style.width = "0px"
						input.style.width = `${Math.max(32, Math.min(100, input.scrollWidth + 12))}px`
					}
					
					input.addEventListener("input", updateInputWidth)
					input.addEventListener("change", updateInputWidth)
					
					const descriptor = {
						configurable: true,
						
						get() {
							delete this.value
							const result = this.value
							Object.defineProperty(input, "value", descriptor)
							return result
						},
						set(x) {
							delete this.value
							this.value = x
							Object.defineProperty(input, "value", descriptor)
							updateInputWidth()
						}
					}
					
					Object.defineProperty(input, "value", descriptor)
				}
	
				$scope.btrPagerStatus = btrPagerStatus
				$scope.btrLoadWallPosts = cursor => {
					let pageNum = lastPageNum
	
					if(cursor === "prev") {
						pageNum = lastPageNum - 1
					} else if(cursor === "next") {
						pageNum = lastPageNum + 1
					} else if(cursor === "input") {
						const input = document.querySelector(".btr-comment-pager input")
						const value = parseInt(input.value, 10)
	
						if(Number.isSafeInteger(value)) {
							pageNum = Math.max(0, value - 1)
						}
					} else if(cursor === "first") {
						pageNum = lastPageNum - 50
					} else if(cursor === "last") {
						pageNum = lastPageNum + 50
					}
	
					requestWallPosts(pageNum)
				}
			}
	
			angularHook.hijackModule("group", {
				groupWallController(target, thisArg, args, argsMap) {
					const result = target.apply(thisArg, args)
	
					try {
						createCustomPager(thisArg, argsMap)
					} catch(ex) {
						console.error(ex)
						if(IS_DEV_MODE) { alert("hijackAngular Error") }
					}
	
					return result
				}
			})
		})
	}
	
	onPageReset(() => {
		document.body?.classList.remove("btr-redesign")
	})
	
	onPageLoad(() => {
		document.$watch("body", body => {
			document.body.classList.toggle("btr-redesign", SETTINGS.get("groups.modifyLayout"))
		})
	})
}
"use strict"

function enableRedesign() {
	document.$watch("body", body => {
		body.classList.toggle("btr-redesign", SETTINGS.get("groups.modifyLayout"))
		body.classList.toggle("btr-hideBigSocial", SETTINGS.get("groups.hideBigSocial"))
	})

	if(SETTINGS.get("groups.modifySmallSocialLinksTitle")) {
		angularHook.modifyTemplate(["social-link-icon-list", "social-link-icon"], (listTemplate, iconTemplate) => {
			iconTemplate.$find("a").title = `{{ $ctrl.title || $ctrl.type }}`
			listTemplate.$find("social-link-icon").title = "socialLink.title"
		})
		
		InjectJS.inject(() => {
			const { angularHook } = window.BTRoblox
			
			angularHook.hijackModule("socialLinksJumbotron", {
				socialLinkIcon(component) {
					component.bindings.title = "<"
				}
			})
		})
	}

	if(SETTINGS.get("groups.modifyLayout")) {
		document.$watch(["#about", "#btr-games"], (about, games) => {
			about.after(games)
		})
		
		document.$watch("group-payouts", payouts => {
			const update = () => {
				payouts.closest(".btr-group-container")?.classList.toggle("btr-hasPayouts", !!payouts.$find(">div"))
			}
			
			new MutationObserver(update).observe(payouts, { childList: true })
			update()
		})
		
		angularHook.modifyTemplate(["group-base", "group-games", "group-about", "group-tab"], (baseTemplate, gamesTemplate, aboutTemplate, tabTemplate) => {
			const groupHeader = baseTemplate.$find(".group-header")
			const groupAbout = groupHeader.parentNode
			const groupContainer = groupAbout.parentNode
			groupContainer.classList.add("btr-group-container")
			groupAbout.classList.add("btr-group-about")

			const desc = aboutTemplate.$find("group-description")
			groupHeader.after(desc)
			
			const socialLinks = aboutTemplate.$find("social-links-container")
			groupAbout.after(socialLinks)
			
			const shout = aboutTemplate.$find(".group-shout")
			if(shout) {
				shout.classList.add("btr-shout-container")
				groupAbout.after(shout)
			}
			
			const announcement = aboutTemplate.$find("#group-announcements")
			if(announcement) {
				groupAbout.after(announcement)
			}
			
			// Show group wall on all tabs
			
			groupContainer.append(aboutTemplate.$find("group-wall,[group-wall]"))
			
			// Give games and payouts their own tabs
			
			groupContainer.setAttribute("ng-class", "{'btr-hasGames': library.currentGroup.areGroupGamesVisible, 'btr-showPayouts': groupDetailsConstants.tabs.about.btrCustomTab === 'payouts'}")
			
			const list = baseTemplate.$find("#horizontal-tabs")
			const games = html`<li id="btr-games" ng-class="{'active': layout.activeTab.state === 'about' && layout.activeTab.btrCustomTab === 'games'}" ng-click="groupDetailsConstants.tabs.about.btrCustomTab='games'" class="rbx-tab group-tab" ui-sref="about"><a class=rbx-tab-heading><span class=text-lead ng-bind="'Heading.Games' | translate"></span></a>`
			const payouts = html`<li id="btr-payouts" ng-class="{'active': layout.activeTab.state === 'about' && layout.activeTab.btrCustomTab === 'payouts'}" ng-click="groupDetailsConstants.tabs.about.btrCustomTab='payouts'" class="rbx-tab group-tab" ui-sref="about"><a class=rbx-tab-heading><span class=text-lead ng-bind="'Heading.Payouts' | translate"></span></a>`
			list.append(games, payouts)
			
			const tab = tabTemplate.$find(".rbx-tab")
			tab.setAttribute("ng-class", tab.getAttribute("ng-class").replace(/activeTab === tab/, "activeTab === tab && !tab.btrCustomTab"))
			tab.setAttribute("ng-click", "tab.btrCustomTab=null")
			
			const binding = tab.$find(".text-lead")
			if(binding?.getAttribute("ng-bind")) {
				binding.setAttribute("ng-bind", binding.getAttribute("ng-bind").replace(/^\s*(.*)?(\s*\|\s*translate\s*)$/i, "($1 === 'Heading.About' ? 'Heading.Members' : $1)$2"))
			}
			
			aboutTemplate.$find("group-games,[group-games]")?.setAttribute("ng-show", "groupDetailsConstants.tabs.about.btrCustomTab === 'games'")
			aboutTemplate.$find("group-members-list")?.setAttribute("ng-show", "!groupDetailsConstants.tabs.about.btrCustomTab")
		})

		angularHook.modifyTemplate("group-members-list", template => {
			template.$find(".dropdown-menu li a").title = `{{ role.name }}`
			template.$find(".dropdown-menu li a .role-member-count").title = `{{ role.memberCount | number }}`
		})
	}

	if(SETTINGS.get("groups.selectedRoleCount")) {
		angularHook.modifyTemplate("group-members-list", template => {
			const label = template.$find(".group-dropdown > button .rbx-selection-label")
			label.after(html`<span class=btr-role-member-count title="{{ $ctrl.data.currentRoleMemberCount | number }}" ng-if="$ctrl.data.currentRoleMemberCount>0">({{ $ctrl.data.currentRoleMemberCount | abbreviate }})</span>`)
		})
	}

	if(SETTINGS.get("general.enableContextMenus")) {
		angularHook.modifyTemplate("group-members-list", template => {
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
		angularHook.modifyTemplate("group-wall", template => {
			template.firstElementChild.setAttribute("infinite-scroll-disabled", "true")

			template.$find(".group-wall").parentNode.append(html`
			<div class="btr-pager-holder btr-comment-pager">
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
		
		InjectJS.inject(() => {
			const { angularHook, IS_DEV_MODE } = window.BTRoblox
			
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
				groupWallController(func, args, argMap) {
					const result = func.apply(this, args)
	
					try {
						createCustomPager(this, argMap)
					} catch(ex) {
						console.error(ex)
						if(IS_DEV_MODE) { alert("hijackAngular Error") }
					}
	
					return result
				}
			})
		})
	}
}

pageInit.groups = () => {
	if(SETTINGS.get("general.hoverPreview")) {
		loadOptionalLibrary("previewer").then(() => {
			HoverPreview.register(".item-card", ".item-card-thumb-container")
		})
	}

	if(SETTINGS.get("groups.redesign")) {
		enableRedesign()
	}
}
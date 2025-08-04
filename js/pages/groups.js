"use strict"

pageInit.groups = () => {
	if(SETTINGS.get("general.hoverPreview")) {
		loadOptionalLibrary("previewer").then(() => {
			HoverPreview.register(".item-card", ".item-card-thumb-container")
		})
	}

	if(!SETTINGS.get("groups.redesign")) { return }
	
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
		
		InjectJS.inject(() => {
			const { angularHook, hijackFunction } = window.BTRoblox
			
			angularHook.hijackModule("group", {
				groupController(target, thisArg, args, argsMap) {
					const result = target.apply(thisArg, args)
					
					try {
						const { $scope } = argsMap
						
						// this doesnt get called unless we start on group shout page
						// doing it here since we always show shouts
						$scope.initVerifiedBadgesForGroupShout()
					} catch(ex) {
						console.error(ex)
					}
					
					return result
				}
			})
			
			angularHook.hijackModule("groupPayouts", {
				groupPayouts(component) {
					component.bindings.btrlayout = "="
				},
				groupPayoutsController(target, thisArg, args, argsMap) {
					const result = target.apply(thisArg, args)
					
					try {
						thisArg.$doCheck = () => {
							if(thisArg.btrlayout) {
								thisArg.btrlayout.btrPayoutsEnabled = (thisArg.recipients?.length ?? 0) > 0
							}
						}
					} catch(ex) {
						console.error(ex)
					}
	
					return result
				}
			})
		})
		
		angularHook.modifyTemplate(["group-base", "group-about"], (baseTemplate, aboutTemplate) => {
			const groupHeader = baseTemplate.$find(".group-header")
			const groupAbout = groupHeader.parentNode
			const groupContainer = groupAbout.parentNode
			groupContainer.classList.add("btr-group-container")
			groupAbout.classList.add("btr-group-about")

			const desc = aboutTemplate.$find("group-description")
			if(desc) {
				desc.removeAttribute("ng-switch-when")
				groupHeader.after(desc)
			}
			
			const forumsDiscovery = aboutTemplate.$find("group-forums-discovery")
			if(forumsDiscovery) {
				forumsDiscovery.removeAttribute("ng-switch-when")
				groupAbout.after(forumsDiscovery)
			}
			
			const socialLinks = aboutTemplate.$find("social-links-container")
			if(socialLinks) {
				socialLinks.removeAttribute("ng-switch-when")
				groupAbout.after(socialLinks)
			}
			
			const shout = aboutTemplate.$find(".group-shout")
			if(shout) {
				shout.removeAttribute("ng-switch-when")
				shout.classList.add("btr-shout-container")
				groupAbout.after(shout)
			}
			
			const announcement = aboutTemplate.$find("#group-announcements")
			if(announcement) {
				announcement.removeAttribute("ng-switch-when")
				groupAbout.after(announcement)
			}
			
			const events = aboutTemplate.$find("group-events")
			if(events) {
				events.removeAttribute("ng-switch-when")
				groupAbout.after(events)
			}
			
			// Give games and payouts their own tabs
			
			const list = baseTemplate.$find("#horizontal-tabs")

			list.append(
				html`
				<li
					id="btr-games"
					ng-class="{'active': layout.activeTab.state === 'about' && layout.activeTab.btrCustomTab === 'games'}"
					ng-if="library.currentGroup.areGroupGamesVisible" ng-click="groupDetailsConstants.tabs.about.btrCustomTab='games'"
					class="rbx-tab group-tab"
					ui-sref="about"
				><a class=rbx-tab-heading><span class=text-lead ng-bind="'Heading.Games' | translate"></span></a></li>`,
				html`
				<li
					id="btr-payouts"
					ng-class="{'active': layout.activeTab.state === 'about' && layout.activeTab.btrCustomTab === 'payouts'}"
					ng-if="isAuthenticatedUser && layout.btrPayoutsEnabled"
					ng-click="groupDetailsConstants.tabs.about.btrCustomTab='payouts'"
					class="rbx-tab group-tab"
					ui-sref="about"
				><a class=rbx-tab-heading><span class=text-lead ng-bind="'Heading.Payouts' | translate"></span></a></li>`
			)
			
			baseTemplate.$find("group-about,[group-about]")?.setAttribute("ng-show", `!(layout.activeTab && layout.activeTab.btrCustomTab)`)
			
			const payouts = aboutTemplate.$find("group-payouts,[group-payouts]")
			if(payouts) {
				payouts.removeAttribute("ng-switch-when")
				payouts.setAttribute("btrlayout", "layout")
				payouts.setAttribute("ng-show", `layout.activeTab.btrCustomTab === "payouts"`)
				groupContainer.parentNode.append(payouts)
			}
			
			const games = aboutTemplate.$find("group-games,[group-games]")
			if(games) {
				games.removeAttribute("ng-switch-when")
				games.setAttribute("ng-show", `layout.activeTab.btrCustomTab === "games"`)
				groupContainer.parentNode.append(games)
			}
			
			const wall = aboutTemplate.$find("group-wall,[group-wall]")
			if(wall) {
				wall.removeAttribute("ng-switch-when")
				wall.setAttribute("ng-show", "layout.activeTab !== groupDetailsConstants.tabs.forums")
				groupContainer.parentNode.append(wall)
			}
		})
		
		angularHook.modifyTemplate("group-tab", template => {
			const tab = template.$find(".rbx-tab")
			
			tab.setAttribute("ng-class", tab.getAttribute("ng-class").replace(/activeTab === tab/, "activeTab === tab && !tab.btrCustomTab"))
			tab.setAttribute("ng-click", "tab.btrCustomTab = null")
			
			// rename About to Members
			
			const binding = tab.$find(".text-lead")
			
			if(binding?.getAttribute("ng-bind")) {
				binding.setAttribute("ng-bind", binding.getAttribute("ng-bind").replace(/^\s*(.*)?(\s*\|\s*translate\s*)$/i, "($1 === 'Heading.About' ? 'Heading.Members' : $1)$2"))
			}
		})
		
		angularHook.modifyTemplate("group-description", template => {
			template.$find(".container-header")?.setAttribute("ng-if", "$ctrl.canViewDescription()")
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

	document.$watch(".groups-list-sidebar", sidebar => {
		// fix sidebar being covered by menu
		sidebar.style.left = "174px";
		sidebar.style.padding = "24px 20px 20px 20px";

		// fix footer container being overlayed by groups list
		const footerContainer = document.getElementById("footer-container");
		if (footerContainer) {
			footerContainer.style.left = "527px";
		}

		const toggleButton = document.createElement("button");
		toggleButton.textContent = "<";
		toggleButton.style.position = "fixed";
		toggleButton.style.top = "46px";
		toggleButton.style.left = "468px";
		toggleButton.style.zIndex = "1000";
		toggleButton.style.padding = "6px -10px";
		toggleButton.style.cursor = "pointer";
		toggleButton.style.fontSize = "14px";
		toggleButton.style.border = "0px solid #ccc";
		toggleButton.style.background = "#34353b";
		toggleButton.style.borderRadius = "24%";
		toggleButton.style.width = "24px";
		toggleButton.style.height = "24px";

		let isVisible = true;
		toggleButton.onclick = () => {
			isVisible = !isVisible;
			sidebar.style.visibility = isVisible ? "" : "hidden";
			toggleButton.textContent = isVisible ? "<" : ">";
			toggleButton.style.left = isVisible ? "468px" : "182px";
			// move content to left when sidebar not visible
			const content = document.getElementById("content");
			if (content) {
				content.style.marginLeft = isVisible ? "327px" : "12px";
			}
			// fix footer container being overlayed by groups list when visible
			const footerContainer = document.getElementById("footer-container");
			if (footerContainer) {
				footerContainer.style.left = isVisible ? "527px" : "327px";
			}
		};

		document.body.appendChild(toggleButton);
	});
	
	onPageReset(() => {
		document.body?.classList.remove("btr-redesign")
		document.body?.classList.remove("btr-hideBigSocial")
	})
	
	onPageLoad(() => {
		document.$watch("body", body => {
			document.body.classList.toggle("btr-redesign", SETTINGS.get("groups.modifyLayout"))
			document.body.classList.toggle("btr-hideBigSocial", SETTINGS.get("groups.hideBigSocial"))
		})
		
		// document.$watch("#content").$then().$watch(">#group-container", container => {
		// }, { continuous: true })
	})
}
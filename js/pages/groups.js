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
							
							if($scope.isAuthenticatedUser && $scope.layout?.btrPayoutsEnabled) {
								entries.push(["payouts", groupDetailsConstants.tabs.payouts])
							}
							
							result = Object.fromEntries(entries)
							
							return result
						})
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
			
			// move announcements above tabs
			const announcements = aboutTemplate.$find("group-announcements")
			if(announcements) {
				announcements.removeAttribute("ng-switch-when")
				announcements.style.display = "block"
				announcements.style.clear = "both"
				tabs.before(announcements)
			}
			
			// custom tab logic
			const games = aboutTemplate.$find("group-games")
			if(games) {
				games.setAttribute("ng-show", `!btrCustomTab.name`)
			}
			
			const payouts = aboutTemplate.$find("group-payouts")
			if(payouts) {
				payouts.setAttribute("layout", "layout")
				payouts.setAttribute("ng-show", `btrCustomTab.name === "payouts"`)
			}
			
			// move discovery below tabs
			const discovery = aboutTemplate.$find("group-forums-discovery")
			if(discovery) {
				discovery.removeAttribute("ng-switch-when")
				discovery.setAttribute("ng-show", "layout.activeTab !== groupDetailsConstants.tabs.forums")
				discovery.style.display = "block"
				discovery.style.clear = "both"
				tabs.parentNode.append(discovery)
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
	}
	
	onPageReset(() => {
		document.body?.classList.remove("btr-redesign")
	})
	
	onPageLoad(() => {
		document.$watch("body", body => {
			document.body.classList.toggle("btr-redesign", SETTINGS.get("groups.modifyLayout"))
		})
		
		document.$watch([".profile-insights-container", ".description-more-btn"], (container, moreBtn) => {
			const btn = html`<button type="button" class="flex items-center bg-surface-300 radius-circle text-caption-medium padding-x-medium padding-y-xsmall cursor-pointer profile-insight-pill-button" style="border: medium;">More</button>`
			container.append(btn)
			
			moreBtn.style.display = "none"
			
			injectScript.call("hookGroupMoreButton", (btn, moreBtn) => {
				// doing the listener in injectScript makes it work even if the extension reloads
				
				btn.addEventListener("click", event => {
					event.stopPropagation()
					event.preventDefault()
					
					moreBtn.click()
				})
			}, btn, moreBtn)
		})
	})
}
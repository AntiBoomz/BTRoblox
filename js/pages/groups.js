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
			
			// toggle games/payouts based on custom tab
			const games = aboutTemplate.$find("group-games")
			if(games) {
				games.setAttribute("ng-show", `!btrCustomTab.name`)
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
	})
	
	onPageLoad(() => {
		document.$watch("body", body => {
			document.body.classList.toggle("btr-redesign", SETTINGS.get("groups.modifyLayout"))
		})
	})
}
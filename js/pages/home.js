"use strict"

pageInit.home = () => {
	if(SETTINGS.get("home.friendsShowUsername")) {
		angularHook.modifyTemplate("people", card => {
			const container = card.$find(".friend-parent-container")
			
			if(container) {
				document.body.classList.add("btr-home-showUsername")
				container.after(html`<div class="text-overflow xsmall text-label btr-people-username" title="@{{friend.name}}">@{{friend.name}}</div>`)
			}
		})
	}
	
	if(SETTINGS.get("home.friendsSecondRow")) {
		angularHook.modifyTemplate("people-list-container", template => {
			template.$find(".people-list-container").setAttribute("ng-class", `{"btr-home-secondRow": btrShowSecondRow}`)
		})
		
		angularHook.modifyTemplate("people-list", template => {
			template.$find(".hlist").setAttribute("style", "--btr-width: {{btrWidth * 128}}px;")
		})
		
		InjectJS.inject(() => {
			const { angularHook } = window.BTRoblox
			
			angularHook.hijackModule("peopleList", {
				peopleListContainerController(handler, args, argsMap) {
					const result = handler.apply(this, args)
					
					try {
						const { $scope } = argsMap
						
						$scope.btrShowSecondRow = false
						
						try { $scope.btrShowSecondRow = !!localStorage.getItem("BTRoblox:homeShowSecondRow") }
						catch(ex) { console.error(ex) }
						
						$scope.$watch("library.numOfFriends", numOfFriends => {
							if(numOfFriends == null) { return }
							
							$scope.btrShowSecondRow = numOfFriends > ($scope.layout.maxNumberOfFriendsDisplayed / 2)
							$scope.btrWidth = Math.ceil(Math.min($scope.layout.maxNumberOfFriendsDisplayed, numOfFriends) / 2)
							
							if($scope.btrShowSecondRow) {
								localStorage.setItem("BTRoblox:homeShowSecondRow", "true")
							} else {
								localStorage.removeItem("BTRoblox:homeShowSecondRow")
							}
						})
					} catch(ex) {
						console.error(ex)
					}
					
					return result
				},
				layoutService(handler, args) {
					const result = handler.apply(this, args)
					result.maxNumberOfFriendsDisplayed *= 2
					return result
				}
			})
		})
	}
	
	if(SETTINGS.get("home.friendPresenceLinks")) {
		angularHook.modifyTemplate("people-info-card", template => {
			for(const elem of template.$findAll(`[ng-click^="goToGameDetails"]`)) {
				const anchor = document.createElement("a")
				anchor.href = `{{friend.presence.placeUrl}}`
				anchor.append(...elem.childNodes)
				for(const attr of elem.attributes) {
					anchor.setAttribute(attr.name, attr.value)
				}
				elem.replaceWith(anchor)
			}
		})
	}
}
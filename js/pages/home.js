"use strict"

pageInit.home = () => {
	if(SETTINGS.get("home.friendsShowUsername")) {
		document.$watch(">body", body => body.classList.add("btr-home-showUsername", "btr-home-friends"))
		
		// react friends
		
		InjectJS.inject(() => {
			const { reactHook, contentScript } = BTRoblox
			
			const friendsState = reactHook.createGlobalState({})
			
			contentScript.listen("updateFriends", friends => {
				friendsState.set(friends)
			})
			
			reactHook.hijackConstructor( // FriendTileContent
				(type, props) => props.displayName && props.userProfileUrl,
				(target, thisArg, args) => {
					const result = target.apply(thisArg, args)
					
					try {
						const userId = args[0].id
						
						const labels = reactHook.queryElement(result, x => x.props.className?.includes("friends-carousel-tile-labels"))
						if(labels && Array.isArray(labels.props.children)) {
							const friends = reactHook.useGlobalState(friendsState)
							const friend = friends[userId]
							
							if(friend) {
								labels.props.children.splice(1, 0, 
									reactHook.createElement("div", {
										className: "friends-carousel-tile-sublabel btr-friends-carousel-username-label",
										children: reactHook.createElement("span", {
											className: "btr-friends-carousel-username",
											children: `@${friend.name}`
										})
									})
								)
							}
						}
					} catch(ex) {
						console.error(ex)
					}
					
					return result
				}
			)
		})
		
		InjectJS.send("updateFriends", btrFriends.getFriends())
		btrFriends.loadFriends(friends => InjectJS.send("updateFriends", friend))
		
		// legacy angular friends
		
		angularHook.modifyTemplate("people", card => {
			const container = card.$find(".friend-parent-container")
			
			if(container) {
				document.body.classList.add("btr-home-showUsername")
				container.after(html`<div class="text-overflow xsmall text-label btr-people-username" title="@{{friend.name}}">@{{friend.name}}</div>`)
			}
		})
	}
	
	if(SETTINGS.get("home.friendsSecondRow")) {
		document.$watch(">body", body => body.classList.add("btr-home-secondRow", "btr-home-friends"))
		
		// react friends
		
		InjectJS.inject(() => {
			const { reactHook } = BTRoblox
		
			reactHook.hijackConstructor(
				(type, props) => props.friendsList, 
				(target, thisArg, args) => {
					const friendsList = args[0].friendsList
					
					reactHook.hijackUseState( // visibleFriendsList
						(value, index) => value === friendsList,
						(value, initial) => (friendsList || [])
					)
					
					const result = target.apply(thisArg, args)
					
					return result
				}
			)
		})
		
		// legacy angular friends
		
		// angularHook.modifyTemplate("people-list-container", template => {
		// 	template.$find(".people-list-container").setAttribute("ng-class", `{"btr-home-secondRow": btrShowSecondRow}`)
		// })
		
		// angularHook.modifyTemplate("people-list", template => {
		// 	template.$find(".hlist").setAttribute("style", "--btr-width: {{btrWidth * 128}}px;")
		// })
		
		InjectJS.inject(() => {
			const { angularHook } = window.BTRoblox
			
			angularHook.hijackModule("peopleList", {
				// peopleListContainerController(handler, args, argsMap) {
				// 	const result = handler.apply(this, args)
					
				// 	try {
				// 		const { $scope } = argsMap
						
				// 		$scope.btrShowSecondRow = false
						
				// 		try { $scope.btrShowSecondRow = !!localStorage.getItem("BTRoblox:homeShowSecondRow") }
				// 		catch(ex) { console.error(ex) }
						
				// 		$scope.$watch("library.numOfFriends", numOfFriends => {
				// 			if(numOfFriends == null) { return }
							
				// 			$scope.btrShowSecondRow = numOfFriends > ($scope.layout.maxNumberOfFriendsDisplayed / 2)
				// 			$scope.btrWidth = Math.ceil(Math.min($scope.layout.maxNumberOfFriendsDisplayed, numOfFriends) / 2)
							
				// 			if($scope.btrShowSecondRow) {
				// 				localStorage.setItem("BTRoblox:homeShowSecondRow", "true")
				// 			} else {
				// 				localStorage.removeItem("BTRoblox:homeShowSecondRow")
				// 			}
				// 		})
				// 	} catch(ex) {
				// 		console.error(ex)
				// 	}
					
				// 	return result
				// },
				layoutService(handler, args) {
					const result = handler.apply(this, args)
					result.maxNumberOfFriendsDisplayed *= 2
					return result
				}
			})
		})
	}
	
	if(SETTINGS.get("home.friendPresenceLinks")) {
		// react friends
		
		InjectJS.inject(() => {
			const { reactHook } = BTRoblox
		
			reactHook.hijackConstructor(
				(type, props) => props.friend && props.gameUrl,
				(target, thisArg, args) => {
					const result = target.apply(thisArg, args)
					
					try {
						const card = result.props.children?.[0]
						
						if(card?.props.className?.includes("in-game-friend-card")) {
							result.props.children[0] = reactHook.createElement("a", {
								href: args[0].gameUrl,
								style: { display: "contents" },
								onClick: event => event.preventDefault(),
								children: card
							})
						}
					} catch(ex) {
						console.error(ex)
					}
					
					return result
				}
			)
		})
		
		// legacy angular friends
		
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
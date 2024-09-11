"use strict"

pageInit.home = () => {
	if(SETTINGS.get("home.friendsShowUsername")) {
		document.$watch(">body", body => body.classList.add("btr-home-showUsername"))
		
		InjectJS.inject(() => {
			const { reactHook, contentScript } = BTRoblox
			
			const friendsState = reactHook.createGlobalState({})
			
			contentScript.listen("updateFriends", friends => {
				friendsState.set(friends)
			})
			
			reactHook.hijackConstructor(
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
								labels.props.children.splice(1, 0, reactHook.createElement("span", {
									className: "btr-friends-carousel-real-username",
									children: `@${friend.name}`
								}))
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
	}
	
	if(SETTINGS.get("home.friendsSecondRow")) {
		document.$watch(">body", body => body.classList.add("btr-home-secondRow"))
	}
	
	if(SETTINGS.get("home.friendPresenceLinks")) {
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
	}
}
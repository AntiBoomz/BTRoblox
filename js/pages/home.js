"use strict"

const initReactFriends = forceSecondRow => { // TODO: Move elsewhere
	InjectJS.inject(forceSecondRow => {
		const { reactHook, hijackXHR, settings } = BTRoblox
		const showSecondRow = forceSecondRow || settings.home.friendsSecondRow
	
		reactHook.hijackConstructor( // FriendsList
			(type, props) => "friendsList" in props, 
			(target, thisArg, args) => {
				if(showSecondRow) {
					const friendsList = args[0].friendsList
					
					reactHook.hijackUseState( // visibleFriendsList
						(value, index) => value === friendsList,
						(value, initial) => (value && friendsList) ? friendsList.slice(0, value.length * 2) : value
					)
				}
				
				const result = target.apply(thisArg, args)
				
				try { result.props.className = `${result.props.className ?? ""} btr-friends-list` }
				catch(ex) { console.error(ex) }
				
				if(showSecondRow) {
					try { result.props.className = `${result.props.className ?? ""} btr-friends-secondRow` }
					catch(ex) { console.error(ex) }
				}
				
				return result
			}
		)
		
		if(settings.home.friendsShowUsername) {
			const friendsState = reactHook.createGlobalState({})
			
			hijackXHR(request => {
				if(request.method === "POST" && request.url === "https://apis.roblox.com/user-profile-api/v1/user/profiles/get-profiles") {
					request.onRequest.push(request => {
						const json = JSON.parse(request.body)
						
						if(!json.fields.includes("names.username")) {
							json.fields.push("names.username")
						}
						
						request.body = JSON.stringify(json)
					})
					
					request.onResponse.push(json => {
						for(const user of json.profileDetails) {
							friendsState.value[user.userId] = user
						}
						
						friendsState.update()
					})
				}
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
											children: `@${friend.names.username}`
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
		}
		
		if(settings.home.friendPresenceLinks) {
			reactHook.hijackConstructor( // FriendTileDropdown
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
		}
	}, forceSecondRow)
}

pageInit.home = () => {
	initReactFriends()
	
	// legacy angular friends stuff (just in case react stuff gets disabled?)
	
	if(SETTINGS.get("home.friendsShowUsername")) {
		document.$watch(">body", body => body.classList.add("btr-home-friends"))
		
		angularHook.modifyTemplate("people", card => {
			const container = card.$find(".friend-parent-container")
			
			if(container) {
				container.after(html`<div class="text-overflow xsmall text-label btr-people-username" title="@{{friend.name}}">@{{friend.name}}</div>`)
			}
		})
	}
	
	if(SETTINGS.get("home.friendsSecondRow")) {
		document.$watch(">body", body => body.classList.add("btr-home-friends"))

		InjectJS.inject(() => {
			const { angularHook } = window.BTRoblox
			
			angularHook.hijackModule("peopleList", {
				layoutService(target, thisArg, args, argsMap) {
					const result = target.apply(thisArg, args)
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
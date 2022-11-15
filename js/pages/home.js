"use strict"

pageInit.home = () => {
	if(SETTINGS.get("home.friendsShowUsername")) {
		modifyTemplate("people", card => {
			const container = card.$find(".friend-parent-container")
			
			if(container) {
				document.body.classList.add("btr-home-showUsername")
				container.after(html`<div class="text-overflow xsmall text-label btr-people-username" title="@{{friend.name}}">@{{friend.name}}</div>`)
			}
		})
	}
	
	if(SETTINGS.get("home.favoritesAtTop")) {
		InjectJS.inject(() => {
			const { hijackFunction } = window.BTRoblox
			
			hijackFunction(XMLHttpRequest.prototype, "open", (target, xhr, args) => {
				const url = args[1]
				
				if(typeof url === "string") {
					let replaceText
					
					if(url === "https://apis.roblox.com/discovery-api/omni-recommendation") {
						replaceText = text => {
							try {
								const json = JSON.parse(text)
								const favs = json.sorts.find(x => x.topic === "Favorites")
								
								if(favs) {
									const index = json.sorts.indexOf(favs)
									
									if(index > 1) {
										json.sorts.splice(index, 1)
										json.sorts.splice(1, 0, favs)
									}
								}
								
								text = JSON.stringify(json)
							} catch(ex) {}
							
							return text
						}
					}
					
					if(replaceText) {
						const responseText = {
							configurable: true,
							
							get() {
								delete xhr.responseText
								const value = replaceText(xhr.responseText)
								Object.defineProperty(xhr, "responseText", responseText)
								return value
							}
						}
						
						Object.defineProperty(xhr, "responseText", responseText)
					}
				}
				
				return target.apply(xhr, args)
			})
		})
	}
	
	if(SETTINGS.get("home.friendsSecondRow")) {
		InjectJS.inject(() => {
			const { hijackAngular } = window.BTRoblox
			
			hijackAngular("peopleList", {
				peopleListContainer(handler, args) {
					const directive = handler.apply(this, args)
					
					directive.link = ($scope, iElem) => {
						const elem = iElem[0]
						
						let showSecondRow = true
						
						try { showSecondRow = !!localStorage.getItem("btr-showSecondRow") }
						catch(ex) { console.error(ex) }
						
						elem.classList.toggle("btr-home-secondRow", showSecondRow)
						
						$scope.$watch("library.numOfFriends", numOfFriends => {
							if(numOfFriends == null) { return }
							
							showSecondRow = numOfFriends > 9
							elem.classList.toggle("btr-home-secondRow", showSecondRow)
							
							if(showSecondRow) {
								localStorage.setItem("btr-showSecondRow", "1")
							} else {
								localStorage.removeItem("btr-showSecondRow")
							}
						})
					}
					
					return directive
				},
				layoutService(handler, args) {
					const result = handler.apply(this, args)
					result.maxNumberOfFriendsDisplayed = 18
					return result
				}
			})
		})
	}
	
	if(SETTINGS.get("home.friendPresenceLinks")) {
		modifyTemplate("people-info-card", template => {
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
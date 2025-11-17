"use strict"

pageInit.home = () => {
	if(SETTINGS.get("home.favoritesAtTop")) {
		injectScript.call("favoritesAtTop", () => {
			hijackXHR(request => {
				if(request.method === "POST" && request.url.match(/^https:\/\/apis\.roblox\.com\/discovery-api\/omni-recommendation(-metadata)?$/i)) {
					request.onResponse.push(json => {
						if(settings.home.favoritesAtTop && json?.sorts) {
							const favoritesSort = json.sorts.find(x => x.topicId === 100000001)
							const continueSort = json.sorts.find(x => x.topicId === 100000003)
							
							if(favoritesSort) {
								json.sorts.splice(json.sorts.indexOf(favoritesSort), 1)
								json.sorts.splice(1, 0, favoritesSort)
							}
							
							if(continueSort) {
								json.sorts.splice(json.sorts.indexOf(continueSort), 1)
								json.sorts.splice(1, 0, continueSort)
							}
						}
					})
				}
			})
		})
	}
	
	if(SETTINGS.get("home.showRecommendationPlayerCount")) {
		injectScript.call("showRecommendationPlayerCount", () => {
			reactHook.hijackConstructor(
				props => "wideTileType" in props && "gameData" in props && "playerCountStyle" in props,
				(target, thisArg, args) => {
					const props = args[0]
					props.playerCountStyle = "Footer"
					return target.apply(thisArg, args)
				}
			)
		})
	}
	
	if(SETTINGS.get("home.instantGameHoverAction")) {
		injectScript.call("instantGameHoverAction", () => {
			reactHook.inject(".hover-game-tile.old-hover", elem => {
				const props = elem[0].props
				
				const [isFocused, setIsFocused] = reactHook.React.useState(false)
				
				props.className = (props.className ?? "").replace(/\bfocused\b/, "")
				props.className += " btr-game-hover-fix"
				
				if(isFocused) {
					props.className += " focused"
				}
				
				props.onMouseOver = new Proxy(props.onMouseOver ?? (() => {}), {
					apply(target, thisArg, args) {
						setIsFocused(true)
						return target.apply(thisArg, args)
					}
				})
				
				props.onMouseLeave = new Proxy(props.onMouseLeave ?? (() => {}), {
					apply(target, thisArg, args) {
						setIsFocused(false)
						return target.apply(thisArg, args)
					}
				})
			})
		})
	}
}
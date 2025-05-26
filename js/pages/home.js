"use strict"

pageInit.home = () => {
	if(SETTINGS.get("home.favoritesAtTop")) {
		InjectJS.inject(() => {
			const { hijackXHR, settings } = window.BTRoblox
			
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
}
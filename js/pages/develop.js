"use strict"

pageInit.develop = function() {
	if(SETTINGS.get("develop.addListedButtons")) {
		loggedInUserPromise.then(async loggedInUser => {
			if(loggedInUser === -1) { return }
			
			const inShowcaseSet = new Set()
			
			const setInShowcase = (placeId, inShowcase) => {
				if(inShowcase) {
					inShowcaseSet.add(placeId)
				} else {
					inShowcaseSet.delete(placeId)
				}
				
				for(const status of $.all(`.btr-listed-status[data-placeid="${placeId}"]`)) {
					status.classList.toggle("unlisted", !inShowcaseSet.has(placeId))
				}
			}
			
			fetch(`/users/profile/playergames-json?userId=${loggedInUser}`).then(async res => {
				const json = await res.json()
				
				for(const game of json.Games) {
					setInShowcase(+game.PlaceID, true)
				}
			})
			
			document.$watch("#build-page").$then().$watch(".items-container").$then()
				.$watchAll(".item-table", table => {
					if(table.dataset.type !== "universes") { return }
					
					const placeId = parseInt(table.dataset.rootplaceId, 10)
					if(Number.isNaN(placeId)) { return }
					
					const parent = table.$find(".details-table>tbody")
					if(!parent) { return }

					const btn = html`<tr><td><a class=btr-listed-status data-placeid=${placeId}></a></td></tr>`
					
					const status = btn.$find(".btr-listed-status")
					status.classList.toggle("unlisted", !inShowcaseSet.has(placeId))
					
					parent.append(btn)

					btn.$on("click", () => {
						RobloxApi.inventory.toggleInCollection("asset", placeId, !inShowcaseSet.has(placeId)).then(result => {
							if(result) {
								setInShowcase(placeId, result.inCollection)
							}
						})
					})
				})
		})
	}
}

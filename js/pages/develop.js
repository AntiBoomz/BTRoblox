"use strict"

pageInit.develop = function() {
	document.$watch("#build-page").$then().$watch(".items-container").$then()
		.$watchAll(".item-table", table => {
			if(table.dataset.type !== "universes" || !table.dataset.rootplaceId) { return }
			
			const parent = table.$find(".details-table>tbody")
			if(!parent) { return }

			const btn = html`<tr><td><a class='btr-listed-status'/></td></tr>`
			parent.append(btn)

			btn.$on("click", () => {
				const placeId = parseInt(table.dataset.rootplaceId, 10)
				const isVisible = table.dataset.inShowcase.toLowerCase() === "true"

				if(Number.isNaN(placeId)) { return }
				
				RobloxApi.inventory.toggleInCollection("asset", placeId, !isVisible).then(result => {
					if(result) {
						table.setAttribute("data-in-showcase", result.inCollection)
					}
				})
			})
		})
}

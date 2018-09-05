"use strict"

pageInit.develop = function() {
	document.$watch("#build-page").$then().$watch(".items-container").$then()
		.$watchAll(".item-table", table => {
			if(table.dataset.type !== "universes") { return }
			
			const parent = table.$find(".details-table>tbody")
			if(!parent) { return }

			const btn = html`<tr><td><a class='btr-listed-status'/></td></tr>`
			parent.append(btn)

			btn.$on("click", () => {
				const placeId = parseInt(table.dataset.rootplaceId, 10)
				const isVisible = table.dataset.inShowcase.toLowerCase() === "true"

				if(Number.isNaN(placeId)) { return }

				csrfFetch("https://www.roblox.com/game/toggle-profile", {
					method: "POST",
					credentials: "include",
					body: new URLSearchParams({ placeId, addToProfile: !isVisible })
				}).then(async response => {
					const json = await response.json()
					if(json.isValid) {
						table.setAttribute("data-in-showcase", json.data.inShowcase)
					}
				})
			})
		})
}

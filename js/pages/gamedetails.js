"use strict"

pageInit.gamedetails = function(placeId) {
	if(!settings.gamedetails.enabled) { return }

	const newContainer = html`
	<div class="col-xs-12 btr-game-main-container section-content">
		<div class=placeholder-main></div>
	</div>`

	const midContainer = html`
	<div class="col-xs-12 btr-mid-container"></div>`

	if(settings.general.robuxToUSD) {
		document.$watch("#rbx-passes-container").$then()
			.$watchAll(".list-item", item => {
				const label = item.$find(".text-robux")
				if(!label) { return }
				const usd = RobuxToUSD(label.textContent.replace(/,/g, ""))
				label.after(html`<span class=text-robux style="float:right;flex:0 1 auto;overflow:hidden;text-overflow:ellipsis">&nbsp;($${usd})</span>`)

				label.parentNode.style.display = "flex"
				label.previousElementSibling.style.flex = "0 0 auto"
				label.parentNode.setAttribute("title", `R$ ${label.parentNode.textContent.trim()}`)
			})
		
		document.$watch("#rbx-gear-container").$then()
			.$watchAll(".list-item", item => {
				const label = item.$find(".text-robux")
				if(!label) { return }
				const usd = RobuxToUSD(label.textContent.replace(/,/g, ""))
				label.after(html`<span class=text-robux style="float:right;flex:0 1 auto;overflow:hidden;text-overflow:ellipsis">&nbsp;($${usd})</span>`)

				label.parentNode.style.display = "flex"
				label.previousElementSibling.style.flex = "0 0 auto"
				label.parentNode.setAttribute("title", `R$ ${label.parentNode.textContent.trim()}`)
			})
	}

	const watcher = document.$watch("body", body => body.classList.add("btr-gamedetails")).$then()
		.$watch(["#tab-about", "#tab-game-instances"], (aboutTab, gameTab) => {
			aboutTab.$find(".text-lead").textContent = "Recommended"

			aboutTab.classList.remove("active")
			gameTab.classList.add("active")

			const parent = aboutTab.parentNode
			parent.append(aboutTab)
			parent.prepend(gameTab)
		})
		.$watch(["#about", "#game-instances"], (about, games) => {
			about.classList.remove("active")
			games.classList.add("active")

			midContainer.append(...Array.from(about.children).filter(x => !x.matches("#rbx-vip-servers, #my-recommended-games")))
		})
		.$watch(".game-main-content", mainCont => {
			mainCont.classList.remove("section-content")
			mainCont.before(newContainer)
			newContainer.after(midContainer)
			newContainer.$find(".placeholder-main").replaceWith(mainCont)
		})
		.$watch(".game-about-container", aboutCont => {
			const descCont = aboutCont.$find(">.section-content")

			descCont.classList.remove("section-content")
			descCont.classList.add("btr-description")
			newContainer.append(descCont)

			aboutCont.remove()
		})
		.$watch(".tab-content", cont => {
			cont.classList.add("section")
			cont.$watchAll(".tab-pane", pane => {
				if(pane.id !== "about") {
					pane.classList.add("section-content")
				}
			})
		})
		.$watch(".badge-container", badges => {
			badges.classList.add("btr-badges-container")

			const badgeQueue = []
			let ownedTimeout

			const updateOwned = async () => {
				const userId = await loggedInUserPromise
				const badgeList = badgeQueue.splice(0, badgeQueue.length)
				const url = `https://badges.roblox.com/v1/users/${userId}/badges/awarded-dates?badgeIds=${badgeList.map(x => x.badgeId).join(",")}`

				$.fetch(url, { credentials: "include" }).then(async response => {
					if(!response.ok) {
						console.warn("[BTR] Failed to get badge data")
						return
					}

					const json = await response.json()

					json.data.forEach(data => {
						const index = badgeList.findIndex(x => +x.badgeId === +data.badgeId)
						badgeList.splice(index, 1)
					})

					badgeList.forEach(data => {
						data.row.classList.toggle("btr-notowned", true)
					})
				})
			}

			badges.$watch(">.stack-list").$then().$watchAll(".badge-row", row => {
				const url = row.$find(".badge-image>a").href
				const label = row.$find(".badge-name")
				label.innerHTML = htmlstring`<a href="${url}">${label.textContent}</a>`
				row.$find("p.para-overflow").classList.remove("para-overflow")

				if(settings.gamedetails.showBadgeOwned) {
					const match = url.match(/(?:catalog|badges)\/(\d+)\//)
					if(!match) { return }

					const badgeId = +match[1]
					badgeQueue.push({ row, badgeId })

					clearTimeout(ownedTimeout)
					ownedTimeout = setTimeout(updateOwned, 10)
				}
			})
		})
		.$watch("#carousel-game-details", details => details.setAttribute("data-is-video-autoplayed-on-ready", "false"))
		.$watch(".game-play-button-container", cont => {
			const makeBox = (rootPlaceId, rootPlaceName) => {
				if(+rootPlaceId === +placeId) { return }

				const box = html`
				<div class='btr-universe-box'>
					This place is part of 
					<a class='btr-universe-name text-link' href='//www.roblox.com/games/${rootPlaceId}/'>${rootPlaceName || "..."}</a>
					<div class='VisitButton VisitButtonPlayGLI btr-universe-visit-button' placeid='${rootPlaceId}' data-action=play data-is-membership-level-ok=true>
						<a class='btn-secondary-md'>Play</a>
					</div>
				</div>`

				newContainer.prepend(box)

				if(!rootPlaceName) {
					const anchor = box.$find(".btr-universe-name")
					getProductInfo(rootPlaceId).then(data => {
						anchor.textContent = data.Name
						anchor.href += data.Name.replace(/\W+/g, " ").trim().replace(/ +/g, "-")
					})
				}
			}

			const playButton = cont.$find("#MultiplayerVisitButton")
			if(playButton) {
				makeBox(playButton.getAttribute("placeid"))
				return
			}

			const buyButton = cont.$find(".PurchaseButton")
			if(buyButton) {
				makeBox(buyButton.dataset.itemId, buyButton.dataset.itemName)
				return
			}

			const url = `https://api.roblox.com/universes/get-universe-places?placeId=${placeId}`
			$.fetch(url).then(async resp => {
				const json = await resp.json()
				const rootPlaceId = json.RootPlace
				if(rootPlaceId === placeId) { return }

				const rootPlace = json.Places.find(x => x.PlaceId === rootPlaceId)
				makeBox(rootPlaceId, rootPlace ? rootPlace.Name : "")
			})
		})
	
	getProductInfo(placeId).then(data => {
		watcher.$watch(".game-stats-container").$then()
			.$watch(
				".game-stat .text-lead",
				x => x.previousElementSibling.textContent === "Created",
				label => {
					label.title = new Date(data.Created).$format("M/D/YYYY h:mm:ss A (T)")
				}
			)
			.$watch(
				".game-stat .text-lead",
				x => x.previousElementSibling.textContent === "Updated",
				label => {
					label.classList.remove("date-time-i18n") // Otherwise roblox rewrites the label
					
					label.title = new Date(data.Updated).$format("M/D/YYYY h:mm:ss A (T)")
					label.textContent = `${$.dateSince(data.Updated, new Date())} ago`
				}
			)
	})

	$.ready(() => {
		const placeEdit = $("#game-context-menu .dropdown-menu .VisitButtonEditGLI")
		if(placeEdit) {
			placeEdit.parentNode.parentNode.append(
				html`<li><a class=btr-download-place><div>Download</div></a></li>`
			)

			document.$on("click", ".btr-download-place", () => {
				AssetCache.loadBuffer(placeId, ab => {
					const blobUrl = URL.createObjectURL(new Blob([ab]))

					const splitPath = window.location.pathname.split("/")
					const type = GetAssetFileType(9, ab)

					startDownload(blobUrl, `${splitPath[splitPath.length - 1]}.${type}`)
					URL.revokeObjectURL(blobUrl)
				})
			})
		}
	})
}
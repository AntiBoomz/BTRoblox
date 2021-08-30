"use strict"

pageInit.catalog = function() {
	if(SETTINGS.get("general.robuxToUSD")) {
		modifyTemplate("item-card", template => {
			template.$findAll(".item-card-price .text-robux-tile").forEach(label => {
				const cashText = ` (${RobuxToCash.convertAngular("(item.lowestPrice||item.price)")})`
				label.after(html`<span class=btr-robuxToCash-tile ng-if="${label.getAttribute("ng-if")}">${cashText}</span>`)
				label.parentNode.setAttribute("title", `R$ {{::getDisplayPrice() || item.lowestPrice | number}}${cashText}`)
			})
		})
	}

	if(SETTINGS.get("general.hoverPreview")) {
		loadOptionalLibrary("previewer").then(() => {
			HoverPreview.register(".item-card", ".item-card-thumb-container")
		})
	}

	if(!SETTINGS.get("catalog.enabled")) { return }
	document.$watch("body", body => body.classList.add("btr-catalog"))

	modifyTemplate("item-card", template => {
		template.$findAll(".item-card-container").forEach(cont => {
			cont.classList.add("btr-item-card-container")
	
			const hover = html`<div class="btr-item-card-more" ng-show="item.itemType==='Asset'||item.purchaseCount!==undefined">
				<div class="text-overflow item-card-label" ng-show="item.itemType==='Asset'">Updated: <span class=btr-updated-label>Loading...</span></div>
				<div class="text-overflow item-card-label" ng-show="item.purchaseCount!==undefined">Sales: {{item.purchaseCount | number:0}}</div>
			</div>`
	
			cont.$find(".item-card-caption").append(hover)
		})
	})

	document.$on("mouseover", ".btr-item-card-container", ev => {
		const self = ev.currentTarget

		if(self.dataset.hoverStats) { return }
		self.dataset.hoverStats = true

		const anchor = self.closest("a")
		const update = () => {
			const matches = anchor.href.match(/\/(catalog|bundles)\/(\d+)\//, "$1")
			if(!matches) { return }
	
			const assetType = matches[1]
			const assetId = matches[2]
			if(!Number.isSafeInteger(+assetId)) { return }
	
			if(assetType !== "bundles") {
				RobloxApi.api.getProductInfo(assetId).then(data => {
					const ulabel = self.$find(".btr-updated-label")
					ulabel.textContent = `${$.dateSince(data.Updated)}`
					ulabel.parentNode.title = ulabel.parentNode.textContent
				})
			}

			return true
		}

		if(!update()) {
			const observer = new MutationObserver(() => {
				if(update()) {
					observer.disconnect()
				}
			})

			observer.observe(anchor, { attributes: true, attributeFilter: ["href"] })
		}
	})

	if(SETTINGS.get("catalog.showOwnedAssets")) {
		const updateOwnedAssets = ownedAssets => {
			Object.entries(ownedAssets).forEach(([key, isOwned]) => {
				const elems = document.$findAll(`.item-card-thumb-container[data-btr-owned-id="${key}"]`)

				elems.forEach(thumb => {
					const ownedLabel = thumb.$find(".btr-item-owned")

					if(isOwned) {
						if(!ownedLabel) {
							thumb.append(html`<span class=btr-item-owned><span class=icon-checkmark-white-bold title="You own this item" style="bottom:auto;left:auto;"></span></span>`)
						}
					} else {
						if(ownedLabel) {
							ownedLabel.remove()
						}
					}
				})
			})
		}

		let currentRequest
		const checkItem = (anchor, thumb) => {
			const match = anchor.href && anchor.href.match(/\/(catalog|library|bundles)\/(\d+)/)

			if(!match) {
				delete thumb.dataset.btrOwnedId
				return
			}

			const id = match[1] === "bundles" ? "b" + match[2] : match[2]

			if(!currentRequest) {
				currentRequest = []

				$.setImmediate(() => {
					MESSAGING.send("filterOwnedAssets", currentRequest, updateOwnedAssets)
					currentRequest = null
				})
			}

			currentRequest.push(id)
			thumb.dataset.btrOwnedId = id
		}

		document.$watch("#results").$then()
			.$watchAll(".hlist", hlist => {
				hlist.$watchAll(".list-item", item => {
					item.$watch([".item-card-container", ".item-card-thumb-container"], (anchor, thumb) => {
						checkItem(anchor, thumb)
						
						new MutationObserver(() => {
							checkItem(anchor, thumb)
						}).observe(anchor, {
							attributes: true,
							attributeFilter: ["href"]
						})
					})
				})
			})
	}
}
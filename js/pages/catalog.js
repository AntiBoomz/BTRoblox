"use strict"

pageInit.catalog = function() {
	if(settings.general.robuxToUSD) {
		modifyTemplate("item-card", template => {
			template.$findAll(".item-card-price").forEach(label => {
				label.style.display = "flex"
	
				const div = html`<div style="flex:1 0 auto"></div>`
				while(label.firstChild) { div.append(label.firstChild) }
	
				label.append(div)
				const text = `($\{{::(((item.lowestPrice||item.price)*${GetRobuxRatio()[0]})/${GetRobuxRatio()[1]})|number:2}})`
				label.title = `{{::item.IsFree && "Free " || "R$ "}}{{::(item.lowestPrice||item.price)|number:0}} ${text}`
				label.append(html`
				<div style="flex:0 1 auto;padding-left:4px;overflow:hidden;text-overflow:ellipsis;" ng-if=item.lowestPrice||item.price class=text-robux ng-cloak> ${text}</div>
				`)
			})
		})
	}

	if(settings.general.hoverPreview) {
		HoverPreview.register(".item-card", ".item-card-thumb-container")
	}

	if(!settings.catalog.enabled) { return }
	const bodyWatcher = document.$watch("body", body => body.classList.add("btr-catalog")).$then()

	bodyWatcher.$watch("#catalog-content", cat => {
		cat.classList.add("section-content")
	})

	modifyTemplate("item-card", template => {
		template.$findAll(".item-card-container").forEach(cont => {
			cont.classList.add("btr-item-card-container")
			cont.setAttribute("btr-item-type", "{{item.itemType}}")
	
			const hover = html`<div class="btr-item-card-more">
				<div class=text-secondary>
					<div class="text-overflow item-card-label" ng-show="item.itemType==='Asset'">Updated: <span class=btr-updated-label>Loading...</span></div>
					<div class="text-overflow item-card-label">Sales: {{item.purchaseCount | number:0}}</div>
				</div>
			</div>`
	
			cont.$find(".item-card-caption").append(hover)
		})
	})

	document.$on("mouseover", ".btr-item-card-container", ev => {
		const self = ev.currentTarget
		if(self.dataset.hoverStats) { return }
		self.dataset.hoverStats = true

		const matches = self.closest("a").href.match(/\/(catalog|bundles)\/(\d+)\//, "$1")
		if(!matches) { return }

		const assetType = matches[1]
		const assetId = matches[2]
		if(!Number.isSafeInteger(+assetId)) { return }

		if(assetType !== "bundles") {
			getProductInfo(assetId).then(data => {
				const ulabel = self.$find(".btr-updated-label")
				ulabel.textContent = `${$.dateSince(data.Updated, startDate)} ago`
				ulabel.parentNode.title = ulabel.parentNode.textContent
			})
		}
	})

	if(settings.catalog.showOwnedAssets) {
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
			const match = anchor.href.match(/\/(catalog|library|bundles)\/(\d+)/)

			if(!match) {
				delete thumb.dataset.btrOwnedId
				return
			}

			const id = match[1] === "bundles" ? "bundle_" + match[2] : match[2]

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

		document.$watch("#main-view > div[items-container]").$then()
			.$watchAll(".catalog-results", results => {
				results.$watch(".hlist").$then()
					.$watchAll(".list-item", item => {
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
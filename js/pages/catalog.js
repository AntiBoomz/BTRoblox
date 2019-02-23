"use strict"

pageInit.catalog = function() {
	if(settings.general.robuxToUSD) {
		modifyTemplate("catalog-item-card", template => {
			const label = template.$find(".item-card-price")
			if(!label) { return }
			label.style.display = "flex"

			const div = html`<div style="flex:1 0 auto"></div>`
			while(label.firstChild) { div.append(label.firstChild) }

			label.append(div)
			const text = `($\{{::(((item.BestPrice||item.Price)*${GetRobuxRatio()[0]})/${GetRobuxRatio()[1]})|number:2}})`
			label.title = `{{::item.IsFree && "Free " || "R$ "}}{{::(item.BestPrice||item.Price)|number:0}} ${text}`
			label.append(html`
			<div style="flex:0 1 auto;padding-left:4px;overflow:hidden;text-overflow:ellipsis;" ng-if=item.BestPrice||item.Price class=text-robux ng-cloak> ${text}</div>
			`)
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

	modifyTemplate("catalog-item-card", template => {
		const cont = template.$find(".item-card-container")
		cont.classList.add("btr-item-card-container")
		cont.setAttribute("btr-item-info", "{{item.ItemType===1}}")

		const hover = html`<div class="btr-item-card-more">
			<div class=text-secondary>
				<div class="text-overflow item-card-label" ng-if="item.ItemType===1">Updated: <span class=btr-updated-label>Loading...</span></div>
				<div class="text-overflow item-card-label" ng-if="item.ItemType===1">Sales: <span class=btr-sales-label>Loading...</span></div>
				<div class="text-overflow item-card-label" ng-if="!item.Creator">By <span class="text-link creator-name" ng-click="creatorClick($event, 'https://www.roblox.com/users/1/profile')">ROBLOX</span></div>
			</div>
		</div>`
		hover.append(template.$find(".creator-name").parentNode)
		template.$find(".item-card-caption").append(hover)
	})

	document.$on("mouseover", ".btr-item-card-container", ev => {
		const self = ev.currentTarget

		const assetId = self.closest("a").href.replace(/^.+\/catalog\/(\d+)\/.+$/, "$1")
		if(!Number.isSafeInteger(+assetId)) { return }

		getProductInfo(assetId).then(data => {
			const ulabel = self.$find(".btr-updated-label")
			ulabel.textContent = `${$.dateSince(data.Updated, startDate)} ago`
			ulabel.parentNode.title = ulabel.parentNode.textContent

			const slabel = self.$find(".btr-sales-label")
			slabel.textContent = FormatNumber(data.Sales)
			slabel.parentNode.title = slabel.parentNode.textContent
		})
	})
}
"use strict"


pageInit.inventory = function() {
	if(settings.profile.embedInventoryEnabled && window.top !== window) {
		document.$watch("head", head => head.append(html`<base target="_top"></base>`))
			.$watch("body", body => {
				body.classList.add("btr-embed")

				const iframe = window.parent.document.getElementById("btr-injected-inventory")
				let requested = false
				let lastHeight

				const updateHeight = () => {
					if(!requested) {
						requested = true

						$.setImmediate(() => {
							const height = `${body.clientHeight}px`
							if(lastHeight !== height) {
								lastHeight = iframe.style.height = height
							}

							requested = false
						})
					}
				}

				onDocumentReady(() => {
					updateHeight()
					new MutationObserver(updateHeight).observe(body, { childList: true, subtree: true })
				})
			}).$then()
			.$watch("#chat-container", chat => chat.remove())
			.$watchAll("script", script => {
				if(script.innerHTML.includes("Roblox.DeveloperConsoleWarning.showWarning()")) {
					script.remove()
				}
			})
			.$watch(".container-main").$then().$watchAll("script", script => {
				if(script.innerHTML.includes("top.location=self.location")) {
					script.remove()
				}
			})
	}

	if(settings.general.robuxToUSD) {
		modifyTemplate("assets-explorer", template => {
			const label = template.$find(".item-card-price")
			if(!label) { return }
			label.style.display = "flex"

			const div = html`<div style="flex:1 0 auto"></div>`
			while(label.firstChild) { div.append(label.firstChild) }

			label.append(div)
			const text = `($\{{::(((item.Product.PriceInRobux)*${GetRobuxRatio()[0]})/${GetRobuxRatio()[1]})|number:2}})`
			label.title = `{{::item.Product.IsFree && "Free " || "R$ "}}{{::(item.Product.PriceInRobux)|number:0}} ${text}`
			label.append(html`
			<div style="flex:0 1 auto;padding-left:4px;overflow:hidden;text-overflow:ellipsis;" ng-if=item.HasPrice class=text-robux ng-cloak> ${text}</div>
			`)
		})
	}

	if(settings.general.hoverPreview) {
		OptionalLoader.loadPreviewer().then(() => {
			HoverPreview.register(".item-card", ".item-card-thumb-container")
		})
	}

	if(!settings.inventory.enabled) { return }

	if(settings.inventory.inventoryTools) {
		const validAssetTypes = [
			10, 13, 40, 3, 24,
			2, 11, 12
		]

		modifyTemplate("assets-explorer", template => {
			const visibility = `$ctrl.staticData.isOwnPage && (${
				validAssetTypes
					.map(x => `$ctrl.currentData.AssetTypeId === ${x}`)
					.join(" || ")
			})`

			template.$findAll(".assets-explorer-title").forEach(title => {
				title.after(html`
				<div class="header-content" ng-show="${visibility}">
					<a class="btn btn-secondary-sm btr-it-btn btr-it-remove disabled" style="float:right;margin:4px 10px;">Remove</a>
					<div id="btr-inventory-refresh-btn" ng-click="cursorPaging.loadFirstPage()" style="display:none"></div>
				</div>`)
			})

			template.$findAll("#assetsItems .item-card-container").forEach(cont => {
				cont.append(html`
				<span class="checkbox btr-it-checkbox" ng-show="${visibility}">
					<input type="checkbox" id="btr-it-box{{$index}}" class="btr-it-box" data-index="{{$index}}">
					<label for="btr-it-box{{$index}}" style="position:absolute;left:6px;top:6px;width:auto;"></label>
				</span>`)
			})
		})

		let isRemoving = false
		let shiftPressed = false
		let lastPressed = null

		const updateButtons = function() {
			$(".btr-it-btn").classList.toggle("disabled", !$(".btr-it-box:checked"))
		}

		InjectJS.listen("inventoryUpdateEnd", updateButtons)

		document
			.$on("keyup keydown", e => { shiftPressed = e.shiftKey })
			.$on("change", ".btr-it-box", e => {
				const id = +e.currentTarget.dataset.index

				if(shiftPressed && lastPressed != null && id !== lastPressed) {
					const from = Math.min(id, lastPressed)
					const to = Math.max(id, lastPressed)
					const value = e.currentTarget.checked

					for(let i = from; i <= to; i++) {
						$(`#btr-it-box${i}`).checked = value
					}
				}

				lastPressed = id
				updateButtons()
			})
			.$on("click", ".item-card-link", () => {
				if($(".btr-it-box:checked") != null) { return false }
			})
			.$on("click", ".btr-it-remove", () => {
				if(isRemoving) { return }

				const checked = $.all(".btr-it-box:checked")
				if(!checked.length) { return }

				isRemoving = true
				const items = []
				for(let i = 0; i < checked.length; i++) {
					const self = checked[i].closest(".item-card")
					const matches = self.$find(".item-card-link").href.match(/(?:\/(?:catalog|library|game-pass|badges)\/|[?&]id=)(\d+)/)

					if(matches && Number.isSafeInteger(+matches[1])) {
						items.push({
							obj: self,
							assetId: matches[1]
						})
					}
				}

				let itemsLeft = items.length

				function removeItem(index) {
					const item = items[index]
					if(!item) { return }

					const url = `https://api.roblox.com/Marketplace/ProductInfo?assetId=${item.assetId}`
					$.fetch(url).then(async response => {
						const data = await response.json()
						if(validAssetTypes.indexOf(data.AssetTypeId) === -1) { return console.log("Bad assetType", data) }

						$.fetch("https://www.roblox.com/asset/delete-from-inventory", {
							method: "POST",
							credentials: "include",
							body: new URLSearchParams({ assetId: item.assetId }),
							xsrf: true
						}).then(() => {
							item.obj.remove()
							if(--itemsLeft === 0) {
								isRemoving = false
								$("#btr-inventory-refresh-btn").click()
								// InjectJS.send("refreshInventory")
							}
						})
					})

					setTimeout(removeItem, 250, index + 1)
				}

				removeItem(0)
			})
	}
}
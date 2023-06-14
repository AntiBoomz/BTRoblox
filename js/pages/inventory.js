"use strict"

pageInit.inventory = () => {
	if(window.parent !== window) {
		const iframe = window.top.document.querySelector("#btr-injected-inventory")

		if(iframe.contentWindow === window) {
			document
				.$watch("head", head => head.append(html`<base target="_top"></base>`))
				.$watch("body", body => {
					body.classList.add("btr-embed")

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

					$.ready(() => {
						updateHeight()
						$.onDomChanged(updateHeight)
					})
				}).$then()
					.$watch("#chat-container", chat => chat.remove())
			
			//
			
			const scripts = document.getElementsByTagName("script")
			const checked = new WeakSet()
			
			const checkForScripts = () => {
				for(let i = scripts.length; i--;) {
					const script = scripts[i]
					
					if(!checked.has(script)) {
						checked.add(script)
						
						if(script.src) {
							continue
						}
						
						const content = script.innerHTML
						
						if(
							content.includes("Roblox.DeveloperConsoleWarning.showWarning()") ||
							content.match(/top.location\s*=\s*self.location/)
						) {
							script.innerHTML = ""
							script.remove()
						}
					}
				}
			}
			
			const listener = $.onDomChanged(checkForScripts)
			checkForScripts()
			
			$.ready(() => {
				listener.disconnect()
				checkForScripts()
			})
		}
	}
	
	if(RobuxToCash.isEnabled()) {
		modifyTemplate("assets-explorer", template => {
			const label = template.$find(".item-card-price .text-robux-tile")
			if(!label) { return }

			const cashText = ` (${RobuxToCash.convertAngular("item.Product.PriceInRobux")})`
			label.after(html`<span class=btr-robuxToCash-tile ng-show="${label.getAttribute("ng-show")}">${cashText}</span>`)
			label.parentNode.setAttribute("title", `{{::${label.getAttribute("ng-bind")}}}${cashText}`)
		})
	}

	if(SETTINGS.get("general.hoverPreview")) {
		loadOptionalLibrary("previewer").then(() => {
			HoverPreview.register(".item-card", ".item-card-thumb-container")
		})
	}
	
	if(SETTINGS.get("general.useNativeAudioPlayer")) {
		document.$watch("#assetsItems").$then()
			.$watchAll(".list-item", item => {
				const mediaPlayer = item.$find(".MediaPlayerIcon[data-mediathumb-url]")
				
				if(mediaPlayer) {
					useNativeAudioPlayer(mediaPlayer)
				}
			})
	}

	if(!SETTINGS.get("inventory.enabled")) { return }

	if(SETTINGS.get("inventory.inventoryTools")) {
		const validAssetTypes = [
			10, 13, 40, 3, 24,
			2, 11, 12, 21
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
					<a class="btn btn-secondary-sm btr-it-btn btr-it-remove disabled" style="float:right;margin-left:10px;">Remove</a>
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
			$(".btr-it-btn")?.classList.toggle("disabled", !$(".btr-it-box:checked"))
		}

		InjectJS.listen("inventoryUpdateEnd", updateButtons)
		
		InjectJS.inject(() => {
			const { hijackAngular, contentScript, IS_DEV_MODE } = window.BTRoblox
			
			hijackAngular("inventory", {
				inventoryContentController(handler, args, argsMap) {
					const result = handler.apply(this, args)
					
					try {
						const { $scope } = argsMap
						
						$scope.$watch("$ctrl.assets", () => {
							setTimeout(() => contentScript.send("inventoryUpdateEnd"), 0)
						})
						
					} catch(ex) {
						console.error(ex)
						if(IS_DEV_MODE) { alert("hijackAngular Error") }
					}
					
					return result
				}
			})
		})

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
					const matches = self.$find(".item-card-link").href.match(/(?:\/(catalog|library|game-pass|badges)\/|[?&]id=)(\d+)/)

					if(matches && Number.isSafeInteger(+matches[2])) {
						items.push({
							obj: self,
							assetType: matches[1].toLowerCase(),
							assetId: matches[2]
						})
					}
				}

				let itemsLeft = items.length

				function removeItem(index) {
					const item = items[index]
					if(!item) { return }
					
					const done = () => {
						item.obj.remove()
						
						if(--itemsLeft === 0) {
							isRemoving = false
							
							InjectJS.inject(() => {
								const scope = angular.element(document.querySelector("assets-explorer")).scope()
								const ctrl = scope?.$parent?.$ctrl
								
								if(ctrl) {
									const real1 = ctrl.cursorPager.loadPreviousPage
									const real2 = ctrl.assetsPager.canLoadPreviousPage
									
									ctrl.cursorPager.loadPreviousPage = ctrl.cursorPager.reloadCurrentPage
									ctrl.assetsPager.canLoadPreviousPage = () => true
									
									try { ctrl.assetsPager.loadPreviousPage() }
									catch(ex) {}
									
									ctrl.cursorPager.loadPreviousPage = real1
									ctrl.assetsPager.canLoadPreviousPage = real2
								}
							})
						}
					}
					
					if(item.assetType === "badges") {
						RobloxApi.badges.deleteBadge(item.assetId).then(done)
					} else {
						RobloxApi.economy.getAssetDetails(item.assetId).then(data => {
							if(validAssetTypes.indexOf(data.AssetTypeId) === -1) {
								return console.log("Bad assetType", data)
							}
							
							RobloxApi.www.deleteAssetFromInventory(item.assetId).then(done)
						})
					}

					setTimeout(removeItem, 250, index + 1)
				}

				removeItem(0)
			})
	}
}
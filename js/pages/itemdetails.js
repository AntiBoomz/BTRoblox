"use strict"

pageInit.itemdetails = () => {
	if(RobuxToCash.isEnabled()) {
		modifyAngularTemplate("asset-resale-data-pane", template => {
			for(const elem of template.$findAll(`.text-robux`)) {
				const cashText = ` (${RobuxToCash.convertAngular(elem.getAttribute("ng-bind").replace(/\|.*$/, "").replace(/^.*formatNumber\((.*)\)[^)]*$/, "$1"))})`
				elem.after(html`<span class=btr-robuxToCash>${cashText}</span>`)
			}
		})
		
		modifyAngularTemplate("resellers-list", template => {
			for(const elem of template.$findAll(`.text-robux`)) {
				const cashText = ` (${RobuxToCash.convertAngular(elem.getAttribute("ng-bind").replace(/\|.*$/, "").replace(/^.*formatNumber\((.*)\)[^)]*$/, "$1"))})`
				elem.after(html`<span class=btr-robuxToCash>${cashText}</span>`)
			}
		})
	}

	if(SETTINGS.get("general.hoverPreview")) {
		loadOptionalFeature("previewer").then(() => {
			HoverPreview.register(".item-card", ".item-card-thumb-container")
		})
	}

	if(!SETTINGS.get("itemdetails.enabled")) { return }
	
	injectScript.call("itemdetails", () => {
		reactHook.hijackConstructor(
			(type, props) => "itemDetails" in props,
			(target, thisArg, args) => {
				const result = target.apply(thisArg, args)
				
				try {
					const props = args[0]
					
					if(result?.props?.className?.includes("item-details-info-header")) {
						const { itemDetails } = props
						
						result.props.children.splice(1, 0, reactHook.createElement("div", {
							className: "btr-buttons",
							dangerouslySetInnerHTML: { __html: "" },
							
							"data-btr-asset-id": itemDetails.id,
							"data-btr-asset-type-id": itemDetails.assetType,
							"data-btr-item-type": itemDetails.itemType,
						}))
					}
				} catch(ex) {
					console.error(ex)
				}
				
				return result
			}
		)
	})
	
	onPageReset(() => {
	})
	
	onPageLoad((category, assetIdString) => {
		const assetId = Number.parseInt(assetIdString, 10)
		
		document.$watch("#content").$then().$watch(">#item-details-container, >#item-container", container => {
			const isReactItemDetails = container.id === "item-details-container"
			
			// if(SETTINGS.get("itemdetails.addOwnersList")) {
			// 	let wasOwnersListSetup = false
				
			// 	const setupOwnersList = (parent, name, ownerAssetId, initData) => {
			// 		if(wasOwnersListSetup) { return }
			// 		wasOwnersListSetup = true

			// 		const owners = html`
			// 		<div class=btr-owners-container style=display:none>
			// 			<div class=container-header>
			// 				<h2>Owners</h2>
			// 			</div>
			// 			<div class=section-content>
			// 			</div>
			// 			<button class="btn-control-sm btr-see-more-owners">See More</button>
			// 		</div>`

			// 		const ownersList = owners.$find(".section-content")
			// 		parent.before(owners)

			// 		//

			// 		let firstLoaded = false
			// 		let isLoading = false
			// 		let cursor = ""

			// 		const btns = html`<div style="position: relative; float: right; height: 28px; margin-bottom: -28px; margin-top: 5px;"></div>`
			// 		const parBtn = html`<button class="btn-secondary-xs active" style=float:right;margin:2px;>${name}</button>`
			// 		const ownBtn = html`<button class=btn-control-xs style=float:right;margin:2px;>Owners</button>`

			// 		btns.append(parBtn, ownBtn)
			// 		owners.before(btns)

			// 		ownBtn.$on("click", () => {
			// 			parBtn.classList.replace("btn-secondary-xs", "btn-control-xs")
			// 			ownBtn.classList.replace("btn-control-xs", "btn-secondary-xs")

			// 			parBtn.classList.remove("active")
			// 			ownBtn.classList.add("active")

			// 			parent.style.display = "none"
			// 			owners.style.display = ""

			// 			if(!firstLoaded && !initData) {
			// 				loadOwners()
			// 			}
			// 		})

			// 		parBtn.$on("click", () => {
			// 			ownBtn.classList.replace("btn-secondary-xs", "btn-control-xs")
			// 			parBtn.classList.replace("btn-control-xs", "btn-secondary-xs")

			// 			ownBtn.classList.remove("active")
			// 			parBtn.classList.add("active")

			// 			owners.style.display = "none"
			// 			parent.style.display = ""
			// 		})

			// 		//
					
			// 		const seeMore = owners.$find(".btr-see-more-owners")

			// 		const createElement = ({ userId, userName, item }) => {
			// 			const url = userId ? `/users/${userId}/profile` : ""

			// 			const elem = html`
			// 			<div class=btr-owner-item>
			// 				<a href="${url}" title="${userName}" class="avatar avatar-headshot-md list-header">
			// 					<img class=avatar-card-image 
			// 						src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
			// 						alt="${userName}"
			// 					>
			// 				</a>
			// 				<div class=btr-owner-cont>
			// 					<a class="text-name username" title="${userName}" href="${url}">${userName}</a>
			// 					<div class=btr-owner-date>Since ${new Date(item.updated).$format("M/D/YYYY hh:mm:ss")}</div>
			// 				</div>
			// 				<div class=btr-serial>${item.serialNumber ? `#${item.serialNumber}` : `N/A`}</div>
			// 			</div>`

			// 			if(userId) {
			// 				RobloxApi.thumbnails.getAvatarHeadshots([userId]).then(json => {
			// 					elem.$find(".avatar-card-image").src = json.data[0].imageUrl
			// 				})
			// 			} else {
			// 				for(const anchor of elem.$findAll("a")) {
			// 					anchor.removeAttribute("href")
			// 				}
			// 			}

			// 			return elem
			// 		}

			// 		const getNames = request => {
			// 			const userIds = Object.keys(request)
			// 			if(!userIds.length) { return Promise.resolve() }

			// 			return RobloxApi.users.getUserDetails(userIds).then(json => {
			// 				for(const user of json.data) {
			// 					const list = request[user.id]
								
			// 					if(list) {
			// 						for(const entry of list) {
			// 							entry.userName = user.name
			// 						}
			// 					}
			// 				}
			// 			})
			// 		}

			// 		const createElements = (data, isInitial) => {
			// 			const request = {}
			// 			const elems = []
						
			// 			for(const item of data) {
			// 				if(item.owner && (item.owner.type !== "User" || item.owner.id === 1)) { continue }
			// 				if(!item.owner && !item.serialNumber) { continue }

			// 				if(item.owner) {
			// 					const userId = item.owner.id

			// 					const self = {
			// 						item,
			// 						userId,
			// 						userName: `User#${userId}`
			// 					}

			// 					const list = request[userId] = request[userId] || []
			// 					list.push(self)
			// 					elems.push(self)
			// 				} else {
			// 					const self = {
			// 						item,
			// 						userId: 0,
			// 						userName: `Hidden User`
			// 					}

			// 					elems.push(self)
			// 				}
			// 			}

			// 			getNames(request).finally(() => {
			// 				isLoading = false
			// 				seeMore.textContent = "See More"
			// 				seeMore.removeAttribute("disabled")
							
			// 				if(!firstLoaded && !isInitial) {
			// 					firstLoaded = true
			// 					ownersList.replaceChildren()
			// 				}
							
			// 				for(const elem of elems) {
			// 					ownersList.append(createElement(elem))
			// 				}
			// 			})
			// 		}

			// 		const loadOwners = () => {
			// 			if(isLoading) { return }
			// 			isLoading = true

			// 			seeMore.textContent = "Loading..."
			// 			seeMore.setAttribute("disabled", "")

			// 			const maxRetries = 10
			// 			let retriesLeft = maxRetries

			// 			const request = () => {
			// 				RobloxApi.inventory.getAssetOwners(ownerAssetId, 100, cursor).then(json => {
			// 					if(!json?.data) {
			// 						if(retriesLeft > 0) {
			// 							retriesLeft--
			// 							seeMore.textContent = `Loading... (${maxRetries - retriesLeft})`
			// 							setTimeout(request, 2e3)
			// 						} else {
			// 							isLoading = false
			
			// 							const failText = seeMore.textContent = "Failed to load owners, try again later"
			// 							setTimeout(() => (seeMore.textContent === failText ? seeMore.textContent = "See More" : null), 2e3)
			
			// 							seeMore.removeAttribute("disabled")
			// 						}
			// 						return
			// 					}
			
			// 					if(json.nextPageCursor) {
			// 						cursor = json.nextPageCursor
			// 					} else {
			// 						seeMore.remove()
			// 					}
			
			// 					createElements(json.data)
			// 				})
			// 			}
						
			// 			request()
			// 		}

			// 		if(initData) {
			// 			createElements(initData.data, true)

			// 			if(!initData.nextPageCursor) {
			// 				seeMore.remove()
			// 			}
			// 		}

			// 		seeMore.$on("click", loadOwners)
			// 	}

			// 	const itemIdPromise = new Promise(resolve => {
			// 		if(category === "bundles") {
			// 			document.$watch(
			// 				".bundle-items .item-card-link[href], #item-list-container-included-items .item-card-link[href]",
			// 				x => !x.textContent.trim().startsWith("Rthro"),
			// 				firstItem => {
			// 					const itemId = firstItem.href.replace(/^.*roblox\.com\/[^/]+\/(\d+).*$/, "$1")
			// 					resolve(itemId)
			// 				}
			// 			)
			// 		} else {
			// 			resolve(assetId)
			// 		}
			// 	})
				
			// 	itemIdPromise.then(itemId => {
			// 		RobloxApi.inventory.getAssetOwners(itemId, 10).then(json => {
			// 			if(!json?.data) {
			// 				return
			// 			}
						
			// 			document.$watch("asset-resale-pane, #recommendations-container, .bundle-items, #item-list-container-recommendations, #item-list-container-included-items", parent => {
			// 				const title = (parent.id === "recommendations-container" || parent.id === "item-list-container-recommendations") ? "Recommended"
			// 					: (parent.classList.contains("bundle-items") || parent.id === "item-list-container-included-items") ? "Included Items"
			// 					: "Resellers"
							
			// 				setupOwnersList(parent, title, itemId, json)
			// 			})
			// 		})
			// 	})
			// }
			
			container.$watch("#type-content, .item-type-field-container .field-content", typeField => {
				const isNewStyle = !typeField.classList.contains("field-content")
				
				const createRow = (label, content) => {
					return isReactItemDetails ? html`
					<div class="clearfix item-info-row-container" style=display:none>
						<div class="font-header-1 text-subheader text-label text-overflow row-label">${label}</div>
						<span class="btr-row-value font-body text">${content}</span>
					</div>` : isNewStyle ? html`
					<div class="clearfix item-field-container" style=display:none>
						<div class="font-header-1 text-subheader text-label text-overflow field-label">${label}</div>
						<span class="btr-row-value font-body text">${content}</span>
					</div>` : html`
					<div class="clearfix item-field-container" style=display:none>
						<div class="text-label text-overflow field-label">${label}</div>
						<span class="btr-row-value field-content">${content}</span>
					</div>`
				}
				
				if(SETTINGS.get("itemdetails.showSales") && category !== "bundles") {
					const salesContainer = createRow("Sales", "")
					
					typeField.parentNode.after(salesContainer)
					
					const show = sales => {
						if(typeof sales === "number") { salesContainer.$find(".btr-row-value").textContent = formatNumber(sales) }
						salesContainer.style.display = ""
					}
					
					const hide = () => {
						salesContainer.style.display = "none"
					}
					
					let canConfigure = false
					
					document.$watch("#configure-item", () => {
						canConfigure = true
						show()
					})

					if(category === "game-pass") {
						RobloxApi.gamepasses.getGamepassProductInfo(assetId).then(data => {
							const sales = data?.Sales
							
							if(Number.isSafeInteger(sales) && (canConfigure || sales > 0)) {
								show(sales)
							} else {
								hide()
							}
						})
					} else if(category === "badges") {
						salesContainer.$find(".text-label").textContent = "Awarded"
						show()
						
						RobloxApi.badges.getBadgeDetails(assetId).then(data => {
							const numAwarded = data?.statistics?.awardedCount
							
							if(Number.isSafeInteger(numAwarded)) {
								show(numAwarded)
							} else {
								hide()
							}
						})
					} else {
						RobloxApi.economy.getAssetDetails(assetId).then(data => {
							const sales = data?.Sales
							
							if(Number.isSafeInteger(sales) && (canConfigure || sales > 0)) {
								show(sales)
							} else {
								hide()
							}
						})
					}
				}
				
				if(SETTINGS.get("itemdetails.showCreatedAndUpdated") && category !== "bundles") {
					// remove old created/updated label
					if(isReactItemDetails) {
						const oldLabel = Array.from($.all("#item-details .wait-for-i18n-format-render")).find(x => !isNaN(Date.parse(x.textContent)))
						
						if(oldLabel) {
							oldLabel.parentNode.remove()
						}
					} else {
						const oldLabel = $("#item-details .date-time-i18n")
						
						if(oldLabel) {
							oldLabel.closest(".field-content")?.parentNode.remove()
						}
					}
					
					const createdContainer = createRow("Created", "")
					const updatedContainer = createRow("Updated", "")
					
					typeField.parentNode.after(createdContainer, updatedContainer)
					
					const show = (created, updated) => {
						if(created) { createdContainer.$find(".btr-row-value").textContent = new Date(created).$format("MMM DD, YYYY h:mm:ss A") }
						if(updated) { updatedContainer.$find(".btr-row-value").textContent = new Date(updated).$format("MMM DD, YYYY h:mm:ss A") }
						createdContainer.style.display = ""
						updatedContainer.style.display = ""
					}
					
					const hide = () => {
						createdContainer.style.display = "none"
						updatedContainer.style.display = "none"
					}
					
					show()

					if(category === "game-pass") {
						RobloxApi.gamepasses.getGamepassProductInfo(assetId).then(data => {
							show(data.Created, data.Updated)
						})
					} else if(category === "badges") {
						RobloxApi.badges.getBadgeDetails(assetId).then(data => {
							show(data.created, data.updated)
						})
					} else {
						RobloxApi.economy.getAssetDetails(assetId).then(data => {
							show(data.Created, data.Updated)
						})
					}
				}
			})
			
			if(isReactItemDetails) {
				// modern item details page
				
				container.$watch(".btr-buttons", buttons => {
					const assetId = +buttons.dataset.btrAssetId
					const itemType = buttons.dataset.btrItemType
					
					const isBundle = itemType === "Bundle"
					const assetTypeId = isBundle ? null : +buttons.dataset.btrAssetTypeId
					
					initPreview(assetId, assetTypeId, isBundle).then(preview => {
						if(!preview) { return } // preview didnt load
						if(!document.contains(buttons)) { return } // already changed page
						
						const parent = document.querySelector(".item-thumbnail-container, #item-thumbnail-container-frontend").parentNode
						preview.setParent(parent)
					})
					
					initExplorer(assetId, assetTypeId, isBundle).then(btnCont => {
						if(!btnCont) { return }
						buttons.append(btnCont)
					})
					
					initDownloadButton(assetId, assetTypeId, isBundle).then(btnCont => {
						if(!btnCont) { return }
						buttons.append(btnCont)
					})
					
					initContentButton(assetId, assetTypeId, isBundle).then(btnCont => {
						if(!btnCont) { return }
						buttons.append(btnCont)
					})
				})
			} else {
				// legacy item details page (used for badges/gamepasses)
				
				container.$watch(".text-robux-lg", elem => {
					const originalText = elem.textContent
					const robux = parseInt(originalText.replace(/\D/g, ""), 10)
					
					if(Number.isSafeInteger(robux)) {
						const cash = RobuxToCash.convert(robux)
						
						elem.append(html`<span class=btr-robuxToCash-big> (${cash})</span>`)
					}
				})
			}
		})
	})
}
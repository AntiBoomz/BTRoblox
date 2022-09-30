"use strict"

const OwnerAssetCache = {
	assetTypes: ["bundles", "assets"],
	requestedAssetTypes: [
		// had to split these into two batches because we were hitting max url length
		// with how big the cursor was
		[
			"Hat", "Shirt", "Pants", "Head", "Face", "Gear", "HairAccessory",
			"FaceAccessory", "NeckAccessory", "ShoulderAccessory", "FrontAccessory",
			"BackAccessory",
		],
		[
			"WaistAccessory", "EmoteAnimation", "TShirtAccessory", "ShirtAccessory",
			"PantsAccessory", "JacketAccessory", "SweaterAccessory", "ShortsAccessory",
			"LeftShoeAccessory", "RightShoeAccessory", "DressSkirtAccessory",
		]
	],
	assetMap: {},
	data: null,

	initialized: false,

	resetData() {
		this.data = {
			lastUserId: null,
			types: {},
		}

		for(const assetType of this.assetTypes) {
			const typeData = this.data.types[assetType] = {
				list: new Set(),
				lastPopulate: 0
			}

			Object.defineProperties(typeData, {
				type: { configurable: true, value: assetType },
				lastUpdate: { configurable: true, value: 0, writable: true },
				currentOperation: { configurable: true, value: null, writable: true }
			})
		}

		this.assetMap = {}
	},
	
	markAsset(next, id, owned, copyTo) {
		if(next.type === "bundles") {
			id = "b" + id
		}

		if(owned) {
			this.assetMap[id] = true
		} else {
			delete this.assetMap[id]
		}

		if(copyTo) {
			copyTo[id] = !!owned
		}
	},

	markDirty() {
		if(!this.markedDirty) {
			this.markedDirty = true

			setTimeout(() => {
				this.markedDirty = false
				localStorage.setItem("btr-ownerAssetCache", JSON.stringify(this.data, (k, v) => (v instanceof Set ? Array.from(v) : v)))
			}, 1e3)
		}
	},

	async request(next, populate = false, cursor) {
		let nextPageCursor
		let newItems
		
		if(next.type === "bundles") {
			const json = await RobloxApi.catalog.getUserBundles(this.data.lastUserId, {
				sortOrder: "Desc", limit: populate ? 100 : 10, cursor: populate ? cursor || "" : ""
			})
			
			newItems = json.data.map(x => x.id)
			nextPageCursor = json.nextPageCursor
		} else {
			newItems = []
			nextPageCursor = []
			
			for(const [index, assetTypes] of Object.entries(this.requestedAssetTypes)) {
				if(cursor && !cursor[index]) { continue }
				
				const json = await RobloxApi.inventory.getUserInventory(this.data.lastUserId, {
					assetTypes: assetTypes.join(","), sortOrder: "Desc", limit: populate ? 100 : 10, cursor: populate ? cursor[index] || "" : ""
				})
				
				newItems.push(...json.data.map(x => x.assetId))
				
				if(json.nextPageCursor) {
					nextPageCursor[index] = json.nextPageCursor
				}
			}
			
			if(nextPageCursor.length === 0) {
				nextPageCursor = null
			}
		}
		
		return [newItems, nextPageCursor]
	},

	async update(onchange) {
		if(loggedInUser === -1) { return }
		
		if(this.data.lastUserId && this.data.lastUserId !== loggedInUser) {
			this.resetData()
		}
		
		this.data.lastUserId = loggedInUser

		const list = Object.values(this.data.types)
		const promises = []
		
		for(const next of list) {
			let operation = next.currentOperation

			if(!operation) {
				const timeUntilPopulate = 300e3 - (Date.now() - next.lastPopulate)
				const timeUntilUpdate = 5e3 - (Date.now() - next.lastUpdate)

				if(timeUntilPopulate > 0 && timeUntilUpdate > 0) { continue }

				operation = next.currentOperation = {
					onchange: [],
					promise: null
				}

				let changes = {}

				const pushChanges = () => {
					if(Object.keys(changes).length) {
						operation.onchange.forEach(fn => fn(changes))
						changes = {}
					}
				}
				
				if(timeUntilPopulate <= 0) {
					operation.promise = new SyncPromise(async resolve => {
						const removedSet = new Set(next.list)
						let cursor = ""
			
						while(true) {
							let newItems, newCursor
							
							for(let i = 0; i < 3; i++) {
								try {
									[newItems, newCursor] = await this.request(next, true, cursor)
									break
								} catch(ex) {
									console.error(ex)
									await new Promise(resolve => setTimeout(resolve, 2e3))
								}
							}
							
							if(!newItems) {
								next.currentOperation = null
								resolve(false)
								break
							}
							
							for(const id of newItems) {
								removedSet.delete(id)
		
								next.list.add(id)
								this.markAsset(next, id, true, changes)
							}
		
							if(!newCursor) { break }
							cursor = newCursor
							pushChanges()
						}
						
						for(const id of removedSet) {
							this.markAsset(next, id, false, changes)
						}

						next.currentOperation = null
						next.lastPopulate = Date.now()
						next.lastUpdate = Date.now() // Populate also works as an update
						this.markDirty()

						pushChanges()
						resolve(true)
					})
				} else {
					operation.promise = new SyncPromise(async resolve => {
						try {
							const [newItems] = await this.request(next, false)
							
							for(const id of newItems) {
								next.list.add(id)
								this.markAsset(next, id, true, changes)
							}
						} catch(ex) {
							console.error(ex)
							next.currentOperation = null
							resolve(false)
							return
						}
		
						next.currentOperation = null
						next.lastUpdate = Date.now()
						this.markDirty()
		
						pushChanges()
						resolve(true)
					})
				}
			}

			if(onchange) { operation.onchange.push(onchange) }
			promises.push(operation.promise)
		}

		return SyncPromise.all(promises)
	},

	init() {
		if(this.initialized) {
			return
		}
		
		this.initialized = true
		this.resetData()

		const savedCache = localStorage.getItem("btr-ownerAssetCache")
		if(savedCache) {
			const parsed = JSON.parse(savedCache)

			if(parsed.types) {
				for(const [type, next] of Object.entries(this.data.types)) {
					const savedNext = parsed.types[type]
					if(!savedNext) { continue }

					Object.assign(next, savedNext)

					if(Array.isArray(next.list)) {
						next.list = new Set(next.list)
					}
					
					for(const id of next.list) {
						this.markAsset(next, id, true)
					}
				}

				delete parsed.types
			}

			Object.assign(this.data, parsed)
		}

		return this
	}
}

pageInit.catalog = () => {
	if(RobuxToCash.isEnabled()) {
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
			for(const [assetId, isOwned] of Object.entries(ownedAssets)) {
				const elems = document.$findAll(`.item-card-thumb-container[data-btr-owned-id="${assetId}"]`)
				
				for(const thumb of elems) {
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
				}
			}
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
					// MESSAGING.send("filterOwnedAssets", currentRequest, updateOwnedAssets)
					
					const assetIds = currentRequest
					currentRequest = null
					
					OwnerAssetCache.init()
					
					const initData = {}
					
					for(const assetId of assetIds) {
						if(OwnerAssetCache.assetMap[assetId]) {
							initData[assetId] = true
						}
					}
					
					updateOwnedAssets(initData)
					OwnerAssetCache.update(changes => updateOwnedAssets(changes))
					
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
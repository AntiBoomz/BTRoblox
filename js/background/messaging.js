"use strict"

const invalidXsrfTokens = {}
let cachedXsrfToken

const OwnerAssetCache = {
	assetTypes: ["bundles", "assets"],
	requestedAssetTypes: [
		"Hat", "Shirt", "Pants", "Head", "Face", "Gear",
		"HairAccessory", "FaceAccessory", "NeckAccessory", "ShoulderAccessory", "FrontAccessory", "BackAccessory",
		"WaistAccessory", "EmoteAnimation"
	],
	assetMap: {},
	data: null,

	initialized: false,

	resetData() {
		this.data = {
			types: {},

			lastUserId: null,
			lastCheckedUserId: 0
		}

		this.assetTypes.forEach(assetType => {
			const typeData = this.data.types[assetType] = {
				list: new Set(),
				lastPopulate: 0
			}

			Object.defineProperties(typeData, {
				type: { configurable: true, value: assetType },
				lastUpdate: { configurable: true, value: 0, writable: true },
				currentOperation: { configurable: true, value: null, writable: true }
			})
		})

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
				localStorage.setItem("OwnerAssetCache", JSON.stringify(this.data, (k, v) => (v instanceof Set ? Array.from(v) : v)))
			}, 10e3)
		}
	},

	async getLoggedInUser() {
		if(this.data.lastUserId && Date.now() - this.data.lastCheckedUserId < 30e3) {
			return true
		}

		try {
			const resp = await fetch(`https://users.roblox.com/v1/users/authenticated`, { credentials: "include" })
			const userId = (await resp.json()).id

			if(!Number.isSafeInteger(userId)) {
				return false
			}
	
			if(this.data.lastUserId && this.data.lastUserId !== userId) {
				this.resetData()
			}

			this.data.lastUserId = userId
			this.data.lastCheckedUserId = Date.now()
			this.markDirty()

			return true
		} catch(ex) {
			console.error(ex)
		}

		return false
	},


	async request(next, populate = false, cursor = "") {
		const cursorParam = populate ? `&cursor=${cursor}` : ""
		const url = next.type === "bundles"
			? `https://catalog.roblox.com/v1/users/${this.data.lastUserId}/bundles?sortOrder=Desc&limit=${populate ? 100 : 10}${cursorParam}`
			: `https://inventory.roblox.com/v2/users/${this.data.lastUserId}/inventory?assetTypes=${this.requestedAssetTypes.join(",")}&sortOrder=Desc&limit=${populate ? 100 : 10}${cursorParam}`

		const resp = await fetch(url)
		if(!resp.ok) { throw new Error("Response not ok") }

		const json = await resp.json()
		const newItems = next.type === "bundles"
			? json.data.map(x => x.id)
			: json.data.map(x => x.assetId)

		return [newItems, json.nextPageCursor]
	},

	async update(onchange) {
		const loggedIn = await this.getLoggedInUser()
		if(!loggedIn) { return }

		const list = Object.values(this.data.types)
		const promises = []
		
		list.forEach(async next => {
			let operation = next.currentOperation

			if(!operation) {
				const timeUntilPopulate = 300e3 - (Date.now() - next.lastPopulate)
				const timeUntilUpdate = 5e3 - (Date.now() - next.lastUpdate)

				if(timeUntilPopulate > 0 && timeUntilUpdate > 0) { return }

				operation = {
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
							try {
								// eslint-disable-next-line no-await-in-loop
								const [newItems, newCursor] = await this.request(next, true, cursor)

								newItems.forEach(id => {
									removedSet.delete(id)
			
									next.list.add(id)
									this.markAsset(next, id, true, changes)
								})
			
								if(!newCursor) { break }
								cursor = newCursor
								pushChanges()
							} catch(ex) {
								console.error(ex)
								resolve(false)
								return
							}
						}
						
						removedSet.forEach(id => {
							this.markAsset(next, id, false, changes)
						})

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
			
							newItems.forEach(id => {
								next.list.add(id)
								this.markAsset(next, id, true, changes)
							})
						} catch(ex) {
							console.error(ex)
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

				next.currentOperation = operation
			}

			if(onchange) { operation.onchange.push(onchange) }
			promises.push(operation.promise)
		})

		return SyncPromise.all(promises)
	},

	init() {
		if(this.initialized) {
			return
		}
		
		this.initialized = true
		this.resetData()

		const savedCache = localStorage.getItem("OwnerAssetCache")
		if(savedCache) {
			const parsed = JSON.parse(savedCache)

			if(parsed.types) {
				Object.entries(this.data.types).forEach(([type, next]) => {
					const savedNext = parsed.types[type]
					if(!savedNext) { return }

					Object.assign(next, savedNext)

					if(Array.isArray(next.list)) {
						next.list = new Set(next.list)
					}

					next.list.forEach(id => {
						this.markAsset(next, id, true)
					})
				})

				delete parsed.types
			}

			Object.assign(this.data, parsed)
		}

		return this
	}
}

// Legacy source viewer thing
for (let i = localStorage.length; i--;) {
	const key = localStorage.key(i)

	if(key.startsWith("sourceViewerData_")) {
		localStorage.removeItem(key)
	}
}

MESSAGING.listen({
	filterOwnedAssets(assetIds, respond) {
		OwnerAssetCache.init()

		const map = {}

		assetIds.forEach(x => {
			const isOwned = OwnerAssetCache.assetMap[x]
			if(isOwned) {
				map[x] = isOwned
			}
		})

		respond(map, true)

		OwnerAssetCache
			.update(changes => respond(changes, true))
			.then(() => respond({}))
	},

	loadOptAssets(assets, respond, port) {
		const scripts = assets.filter(file => file.endsWith(".js"))

		const next = () => {
			if(scripts.length === 0) {
				return respond()
			}

			const file = scripts.shift()
			chrome.tabs.executeScript(
				port.sender.tab.id,
				{ frameId: port.sender.frameId, file, runAt: "document_start" },
				next
			)
		}

		next()
	},
	
	async fetch([url, init], respond) {
		try {
			if(init._body) {
				const body = init._body
				
				switch(body.type) {
				case "URLSearchParams":
					init.body = new URLSearchParams(body.data)
					break
				}
	
				delete init._body
			}
	
			let xsrf = init.xsrf
			if(xsrf) {
				if(!init.headers) {
					init.headers = {}
				}

				if((typeof xsrf !== "string" || invalidXsrfTokens[xsrf]) && cachedXsrfToken) {
					xsrf = cachedXsrfToken
				}
	
				if(typeof xsrf === "string") {
					init.headers["X-CSRF-TOKEN"] = xsrf
	
					if(!cachedXsrfToken) {
						cachedXsrfToken = xsrf
					}
				}
	
				delete init.xsrf
			}

			let resp = await fetch(url, init)

			if(xsrf) {
				if(!resp.ok && resp.status === 403 && resp.headers.has("X-CSRF-TOKEN")) {
					if(typeof xsrf === "string") {
						invalidXsrfTokens[xsrf] = true
					}
					
					xsrf = init.headers["X-CSRF-TOKEN"] = resp.headers.get("X-CSRF-TOKEN")

					if(!cachedXsrfToken || invalidXsrfTokens[cachedXsrfToken]) {
						cachedXsrfToken = xsrf
					}

					resp = await fetch(url, init)
				}
			}


			const blob = await resp.blob()
			const dataUrl = URL.createObjectURL(blob)
			
			setTimeout(() => URL.revokeObjectURL(dataUrl), 10e3)
			
			respond({
				success: true,
				dataUrl,
				ok: resp.ok,
				status: resp.status,
				statusText: resp.statusText,
				headers: Array.from(resp.headers.entries()),
				redirected: resp.redirected,
				type: resp.type,
				url: resp.url
			})
		} catch(ex) {
			console.error(ex)

			respond({
				success: false,
				error: ex.toString()
			})
		}
	}
})
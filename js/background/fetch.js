"use strict"

const invalidXsrfTokens = {}
let cachedXsrfToken

const OwnerAssetCache = {
	assetTypes: [ "17", "18", "19", "41", "42", "43", "44", "45", "46", "47", "11", "12", "bundles", "8"],
	assetMap: {},
	data: null,

	listeners: new Map(),
	assetMapChanges: {},
	replicatingChanges: false,

	resetData() {
		this.data = {
			types: {},

			lastUserId: null,
			lastCheckedUserId: 0
		}

		this.assetTypes.forEach(assetType => {
			const typeData = this.data.types[assetType] = {
				list: [],
				lastPopulate: 0
			}

			Object.defineProperties(typeData, {
				type: { configurable: true, value: assetType },
				lastUpdate: { configurable: true, value: 0, writable: true },
				populateCursor: { configurable: true, value: null, writable: true }
			})
		})
		
		this.assetMap = {}
		this.markDirty()
	},

	async getLoggedInUser() {
		if(this.data.lastUserId && Date.now() - this.data.lastCheckedUserId < 30e3) {
			return true
		}

		try {
			const resp = await fetch(`https://www.roblox.com/game/GetCurrentUser.ashx`, { credentials: "include" })
			const userId = await resp.text()

			if(!userId) {
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


	async request(next, populate = false) {
		const cursor = populate ? `&cursor=${next.populateCursor || ""}` : ""
		const url = next.type === "bundles"
			? `https://catalog.roblox.com/v1/users/${this.data.lastUserId}/bundles?sortOrder=Desc&limit=100${cursor}`
			: `https://inventory.roblox.com/v2/users/${this.data.lastUserId}/inventory/${next.type}?sortOrder=Desc&limit=100${cursor}`
		
		let newItems
		let newCursor

		try {
			const resp = await fetch(url)

			if(!resp.ok) {
				throw new Error(`Bad response from ${url}`)
			}

			const json = await resp.json()

			newItems = next.type === "bundles"
				? json.data.map(x => "bundle_" + x.id)
				: json.data.map(x => x.assetId)

			newCursor = json.nextPageCursor

			if(!newItems.length) {
				throw new Error(`Empty newItems from ${url}`)
			}
		} catch(ex) {
			console.error(ex)
		}

		if(!populate) {
			next.lastUpdate = Date.now()
			this.markDirty()
		}

		if(!newItems) {
			if(populate) {
				next.populateCursor = null
				next.lastPopulate = Date.now()
				this.markDirty()
			}

			return false
		}

		newItems.forEach(id => {
			if(!next.list.includes(id)) {
				next.list.push(id)
				this.markAsset(id, true)
			}
		})

		if(populate) {
			if(newCursor) {
				next.populateCursor = newCursor
				await new SyncPromise(res => setTimeout(res, 500))
				return this.request(next, true)
			}

			next.populateCursor = null
			next.lastPopulate = Date.now()
			this.markDirty()
		} else {
			if(newCursor) {
				next.populateCursor = newCursor
			}
		}

		return true
	},

	async populateNext() {
		if(!this.listeners.size) {
			return setTimeout(() => this.populateNext(), 5e3)
		}

		const loggedIn = await this.getLoggedInUser()
		if(!loggedIn) {
			return setTimeout(() => this.populateNext(), 10e3)
		}

		const next = Object.values(this.data.types).reduce((a, b) => (a.lastPopulate < b.lastPopulate ? a : b))
		const delay = Math.max(500, 120e3 - (Date.now() - next.lastPopulate))

		setTimeout(
			async () => {
				next.list.forEach(id => this.markAsset(id, false, false))
				next.list = []

				try {
					await this.request(next, true)
				} catch(ex) {
					console.error(ex)
				}

				this.populateNext()
			},
			delay
		)
	},

	async next() {
		if(!this.listeners.size) {
			return setTimeout(() => this.next(), 5e3)
		}

		const loggedIn = await this.getLoggedInUser()
		if(!loggedIn) {
			return setTimeout(() => this.next(), 10e3)
		}

		const list = Object.values(this.data.types)
		
		if(!list.length) {
			return setTimeout(() => this.next(), 10e3)
		}
		
		const next = list.reduce((a, b) => (a.lastUpdate < b.lastUpdate ? a : b))
		const delay = Math.max(1e3, 20e3 - (Date.now() - next.lastUpdate))

		setTimeout(
			async () => {
				try {
					await this.request(next, false)
				} catch(ex) {
					console.error(ex)
				}

				this.next()
			},
			delay
		)
	},

	markAsset(id, owned, replicate = true) {
		const isMarked = !!this.assetMap[id]
		if(isMarked === !!owned) { return }

		if(owned) {
			this.assetMap[id] = true
		} else {
			delete this.assetMap[id]
		}

		if(replicate && this.listeners.size) {
			if(this.assetMapChanges[id]) {
				delete this.assetMapChanges[id]
			} else {
				this.assetMapChanges[id] = !!owned
			}

			if(!this.replicatingChanges) {
				this.replicatingChanges = true

				setTimeout(() => {
					this.replicatingChanges = false
					const changes = this.assetMapChanges
	
					if(!Object.entries(changes).length) {
						return
					}

					this.assetMapChanges = {}
					this.listeners.forEach(fn => fn(changes))
				}, 100)
			}
		}
	},

	markDirty() {
		if(!this.markedDirty) {
			this.markedDirty = true

			setTimeout(() => {
				this.markedDirty = false
				localStorage.setItem("OwnerAssetCache", JSON.stringify(this.data))
			}, 1e3)
		}
	},

	init() {
		this.resetData()

		const savedCache = localStorage.getItem("OwnerAssetCache")
		if(savedCache) {
			Object.entries(JSON.parse(savedCache)).forEach(([key, value]) => {
				if(key === "types") {
					Object.entries(value).forEach(([type, data]) => {
						if(this.assetTypes.includes(type)) {
							Object.assign(this.data.types[type], data)
							data.list.forEach(id => this.markAsset(id, true))
						}
					})
				} else {
					this.data[key] = value
				}
			})
		}

		this.populateNext()
		this.next()
		return this
	}
}.init()

MESSAGING.onconnect({
	filterOwnedAssets(assetIds, respond, port) {
		const map = {}

		assetIds.forEach(x => {
			const isOwned = OwnerAssetCache.assetMap[x]
			if(isOwned) {
				map[x] = isOwned
			}
		})

		if(Object.entries(map).length) {
			respond(map)
		}

		if(!OwnerAssetCache.listeners.has(port)) {
			OwnerAssetCache.listeners.set(port, respond)

			port.onDisconnect.addListener(() => {
				OwnerAssetCache.listeners.delete(port)
			})
		}
	}
})

MESSAGING.listen({
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
			const fileReader = new FileReader()

			fileReader.readAsDataURL(blob)
			await new Promise(resolve => fileReader.onload = resolve)

			let dataUrl = fileReader.result

			if(dataUrl === "data:") { // Why does filereader return an unreadable data url...?
				dataUrl = `data:${blob.type};base64,`
			}
			
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
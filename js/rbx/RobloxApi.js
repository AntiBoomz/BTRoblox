"use strict"

const invalidXsrfTokens = {}
let cachedXsrfToken = null

let backgroundCallCounter = 0

const cacheResult = callback => {
	const cache = {}
	return (...args) => (cache[args[0]] = cache[args[0]] || [callback(...args)])[0]
}

const cacheBackgroundResult = callback => cacheResult(backgroundCall(callback))

const backgroundCall = callback => {
	const messageId = `RobloxApi.${backgroundCallCounter}`
	backgroundCallCounter++
	
	if(IS_BACKGROUND_PAGE) {
		MESSAGING.listen({
			[messageId]({ args, xsrf }, respond) {
				if(xsrf && (!cachedXsrfToken || invalidXsrfTokens[cachedXsrfToken]) && !invalidXsrfTokens[xsrf]) {
					cachedXsrfToken = xsrf
				}
				
				SyncPromise.resolve()
					.then(() => callback(...args))
					.then(
						result => respond({ success: true, result: result }),
						err => respond({ success: false, error: err })
					)
			}
		})
		
		return callback
	}
	
	return (...args) => new SyncPromise((resolve, reject) => {
		MESSAGING.send(messageId, { args: args, xsrf: getXsrfToken() }, result => {
			if(result.success) {
				resolve(result.result)
			} else {
				reject(result.error)
			}
		})
	})
}

const btrFetch = (url, init = {}) => {
	init = { ...init }
	
	const usingXsrf = init.xsrf
	
	if(usingXsrf) {
		delete init.xsrf
		
		if(!init.headers) {
			init.headers = {}
		}
		
		init.headers["X-CSRF-TOKEN"] = cachedXsrfToken
	}
	
	return fetch(url, init).then(res => {
		if(usingXsrf && !res.ok && res.status === 403 && res.headers.get("X-CSRF-TOKEN")) {
			if(init.headers["X-CSRF-TOKEN"]) {
				invalidXsrfTokens[init.headers["X-CSRF-TOKEN"]] = true
			}
			
			cachedXsrfToken = init.headers["X-CSRF-TOKEN"] = res.headers.get("X-CSRF-TOKEN")
			
			return fetch(url, init)
		}
		
		return res
	})
}

const RobloxApi = {
	api: {
		getUncachedProductInfo: backgroundCall(assetId =>
			btrFetch(`https://api.roblox.com/marketplace/productinfo?assetId=${assetId}`)
				.then(res => res.json())
		),
		getProductInfo: cacheResult(assetId => RobloxApi.api.getUncachedProductInfo(assetId))
	},
	catalog: {
		getItemDetails: cacheBackgroundResult(items =>
			btrFetch(`https://catalog.roblox.com/v1/catalog/items/details`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ items }),
				xsrf: true
			}).then(res => res.json())
		),
		getBundleDetails: cacheBackgroundResult(bundleId =>
			btrFetch(`https://catalog.roblox.com/v1/bundles/${bundleId}/details`)
				.then(res => res.json())
		)
	},
	thumbnails: {
		getAvatarHeadshots: backgroundCall(userIds => {
			const url = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userIds.join(",")}&size=48x48&format=Png`
			return btrFetch(url).then(async res => (await res.json()).data)
		})
	},
	friends: {
		getFriends: backgroundCall(userId =>
			btrFetch(`https://friends.roblox.com/v1/users/${userId}/friends`)
				.then(async res => (await res.json()).data)
		)
	},
	inventory: {
		toggleInCollection: backgroundCall((assetType, assetId, addToCollection = true) =>
			btrFetch(`https://inventory.roblox.com/v1/collections/items/${assetType}/${assetId}`, {
				method: addToCollection ? "POST" : "DELETE",
				credentials: "include",
				xsrf: true
			}).then(
				async res => {
					const result = await res.json()
					const errorCode = result.errors?.[0]?.code
					
					if(res.ok || errorCode === 7 || errorCode === 8) {
						// adding returns 7 if already in collection, delte returns 8 if not in collection
						return { inCollection: addToCollection }
					}
					
					return null // return null if error
				},
				() => null // return null if error
			)
		)
	}
}
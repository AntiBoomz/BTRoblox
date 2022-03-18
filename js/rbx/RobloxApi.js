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

const xsrfFetch = (url, init = {}) => {
	const usingXsrf = init.xsrf
	
	if(usingXsrf) {
		delete init.xsrf
		
		if(cachedXsrfToken && !invalidXsrfTokens[cachedXsrfToken]) {
			if(!init.headers) {
				init.headers = {}
			}
			
			init.headers["X-CSRF-TOKEN"] = cachedXsrfToken
		}
	}
	
	return fetch(url, init).then(async res => {
		if(usingXsrf && !res.ok && res.status === 403 && res.headers.get("X-CSRF-TOKEN")) {
			if(init.headers["X-CSRF-TOKEN"]) {
				invalidXsrfTokens[init.headers["X-CSRF-TOKEN"]] = true
			}
			
			cachedXsrfToken = init.headers["X-CSRF-TOKEN"] = res.headers.get("X-CSRF-TOKEN")
			res = await fetch(url, init)
		}
		
		return res
	})
}

const RobloxApi = {
	api: {
		getUncachedProductInfo: backgroundCall(assetId =>
			xsrfFetch(`https://api.roblox.com/marketplace/productinfo?assetId=${assetId}`)
				.then(res => res.json())
		),
		getProductInfo: cacheResult(assetId => RobloxApi.api.getUncachedProductInfo(assetId))
	},
	catalog: {
		getItemDetails: cacheBackgroundResult(items =>
			xsrfFetch(`https://catalog.roblox.com/v1/catalog/items/details`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ items }),
				xsrf: true
			}).then(res => res.json())
		),
		getBundleDetails: cacheBackgroundResult(bundleId =>
			xsrfFetch(`https://catalog.roblox.com/v1/bundles/${bundleId}/details`)
				.then(res => res.json())
		)
	},
	thumbnails: {
		getAvatarHeadshots: backgroundCall(userIds => {
			const url = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userIds.join(",")}&size=48x48&format=Png`
			return xsrfFetch(url).then(async res => (await res.json()).data)
		})
	},
	friends: {
		getFriends: backgroundCall(userId =>
			xsrfFetch(`https://friends.roblox.com/v1/users/${userId}/friends`)
				.then(async res => (await res.json()).data)
		)
	}
}
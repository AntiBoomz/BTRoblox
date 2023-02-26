"use strict"

const invalidXsrfTokens = {}
let cachedXsrfToken = null

let backgroundCallCounter = 0

const cacheResult = callback => {
	const cache = {}
	return (...args) => (cache[args[0]] = cache[args[0]] || [callback(...args)])[0]
}

const cacheBackgroundCall = callback => cacheResult(backgroundCall(callback))

const wrapArgs = async args => {
	if(IS_CHROME) {
		const didCheck = new Set()
		
		const wrapValue = async value => {
			if(Array.isArray(value) || value?.constructor === Object) {
				if(didCheck.has(value)) { return null }
				didCheck.add(value)
				
				let didModify = false
				
				for(const [key, oldValue] of Object.entries(value)) {
					const newValue = await wrapValue(oldValue)
					
					if(oldValue !== newValue) {
						if(!didModify) {
							didModify = true
							value = Array.isArray(value) ? [...value] : { ...value }
						}
						
						value[key] = newValue
					}
				}
			} else if(value instanceof Blob) {
				value = {
					__btrType: "Blob",
					body: Array.from(new Uint8Array(await value.arrayBuffer()))
				}
			} else if(value instanceof ArrayBuffer) {
				value = {
					__btrType: "ArrayBuffer",
					body: Array.from(new Uint8Array(value))
				}
			} else if(value instanceof URLSearchParams) {
				value = {
					__btrType: "URLSearchParams",
					body: value.toString()
				}
			}
			
			return value
		}
		
		args = await wrapValue(args)
	}
	
	return args
}

const unwrapArgs = async args => {
	if(IS_CHROME) {
		const didCheck = new Set()
		
		const unwrapValue = async value => {
			const valueType = value?.__btrType
			
			if(valueType === "Blob") {
				value = new Blob([new Uint8Array(value.body)], { type: value.type })
			} else if(valueType === "ArrayBuffer") {
				value = new Uint8Array(value.body).buffer
			} else if(valueType === "URLSearchParams") {
				value = new URLSearchParams(value.body)
				
			} else if(Array.isArray(value) || value?.constructor === Object) {
				if(didCheck.has(value)) { return }
				didCheck.add(value)
				
				for(const [key, oldValue] of Object.entries(value)) {
					const newValue = await unwrapValue(oldValue)
					
					if(oldValue !== newValue) {
						value[key] = newValue
					}
				}
			}
			
			return value
		}
		
		args = await unwrapValue(args)
	}
	
	return args
}


const backgroundCall = callback => {
	const messageId = `RobloxApi.${backgroundCallCounter}`
	backgroundCallCounter++
	
	if(IS_BACKGROUND_PAGE) {
		MESSAGING.listen({
			[messageId]({ args, xsrf }, respond) {
				if(xsrf && (!cachedXsrfToken || invalidXsrfTokens[cachedXsrfToken]) && !invalidXsrfTokens[xsrf]) {
					cachedXsrfToken = xsrf
				}
				
				Promise.resolve()
					.then(async () => callback(...(await unwrapArgs(args))))
					.then(
						async result => respond({ success: true, result: await wrapArgs(result) }),
						err => respond({ success: false, result: err.message })
					)
			}
		})
		
		return callback
	}
	
	return (...args) => new Promise(async (resolve, reject) => {
		if(!cachedXsrfToken) {
			cachedXsrfToken = document.querySelector("meta[name='csrf-token']")?.dataset.token ?? (document.readyState === "loading" ? null : false)
		}

		MESSAGING.send(messageId, { args: await wrapArgs(args), xsrf: cachedXsrfToken }, async result => {
			if(result.success) {
				resolve(await unwrapArgs(result.result))
			} else {
				reject(result.result)
			}
		})
	})
}

const backgroundFetch = !IS_BACKGROUND_PAGE ? null : (url, init = {}) => {
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
	assetdelivery: {
		requestAssetV1: backgroundCall((urlParams, params) => {
			if(typeof urlParams === "string" || typeof urlParams === "number") { urlParams = { id: urlParams } }
			if(!(urlParams instanceof URLSearchParams)) { urlParams = new URLSearchParams(urlParams) }
			
			const headers = {}
			if(params?.format) { headers["Roblox-AssetFormat"] = params.format }
			if(params?.browserAssetRequest !== false) { headers["Roblox-Browser-Asset-Request"] = "true" }
			
			return backgroundFetch(`https://assetdelivery.roblox.com/v1/asset/?${urlParams.toString()}`, {
				credentials: "include",
				headers: headers
			}).then(res => (res.ok ? res.arrayBuffer() : null))
		}),
		
		requestAssetV2: backgroundCall((urlParams, params) => {
			if(typeof urlParams === "string" || typeof urlParams === "number") { urlParams = { id: urlParams } }
			if(!(urlParams instanceof URLSearchParams)) { urlParams = new URLSearchParams(urlParams) }
			
			const headers = {}
			if(params?.format) { headers["Roblox-AssetFormat"] = params.format }
			if(params?.browserAssetRequest !== false) { headers["Roblox-Browser-Asset-Request"] = "true" }
			
			return backgroundFetch(`https://assetdelivery.roblox.com/v2/asset/?${urlParams.toString()}`, {
				credentials: "include",
				headers: headers
			}).then(res => res.json())
		}),
	},
	avatar: {
		getAvatarRules: backgroundCall(() =>
			backgroundFetch(`https://avatar.roblox.com/v1/avatar-rules`)
				.then(res => res.json())
		),
		getOutfitDetails: backgroundCall(outfitId =>
			backgroundFetch(`https://avatar.roblox.com/v1/outfits/${outfitId}/details`)
				.then(res => res.json())
		),
		getUserAvatar: backgroundCall(userId =>
			backgroundFetch(`https://avatar.roblox.com/v1/users/${userId}/avatar`)
				.then(res => res.json())
		),
		getCurrentAvatar: backgroundCall(() =>
			backgroundFetch(`https://avatar.roblox.com/v1/avatar`)
				.then(res => res.json())
		),
		
		renderAvatar: backgroundCall(request =>
			backgroundFetch(`https://avatar.roblox.com/v1/avatar/render`, {
				method: "POST",
				credentials: "include",
				body: JSON.stringify(request),
				xsrf: true
			}).then(res => res.json())
		)
	},
	badges: {
		getBadgeDetails: backgroundCall(badgeId =>
			backgroundFetch(`https://badges.roblox.com/v1/badges/${badgeId}`)
				.then(res => res.json())
		),
		getAwardedDates: backgroundCall((userId, badgeIds) =>
			backgroundFetch(`https://badges.roblox.com/v1/users/${userId}/badges/awarded-dates?badgeIds=${badgeIds.join(",")}`)
				.then(res => res.json())
		),
		deleteBadge: backgroundCall(badgeId =>
			backgroundFetch(`https://badges.roblox.com/v1/user/badges/${badgeId}`, {
				method: "DELETE",
				credentials: "include",
				xsrf: true
			}).then(res => res.json())
		)
	},
	catalog: {
		getItemDetails: backgroundCall(items =>
			backgroundFetch(`https://catalog.roblox.com/v1/catalog/items/details`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ items }),
				xsrf: true
			}).then(res => res.json())
		),
		getBundleDetails: cacheBackgroundCall(bundleId =>
			backgroundFetch(`https://catalog.roblox.com/v1/bundles/${bundleId}/details`)
				.then(res => res.json())
		),
		getUserBundles: backgroundCall((userId, urlParams) =>
			backgroundFetch(`https://catalog.roblox.com/v1/users/${userId}/bundles?${new URLSearchParams(urlParams).toString()}`, {
				credentials: "include"
			}).then(res => assert(res.ok, "Request failed") && res.json())
		)
	},
	develop: {
		userCanManage: backgroundCall((userId, assetId) =>
			backgroundFetch(`https://develop.roblox.com/v1/user/${userId}/canmanage/${assetId}`)
				.then(res => res.json())
		)
	},
	economy: {
		getUncachedAssetDetails: backgroundCall(assetId =>
			backgroundFetch(`https://economy.roblox.com/v2/assets/${assetId}/details`)
				.then(res => res.json())
		),
		getAssetDetails: cacheResult(assetId => RobloxApi.economy.getUncachedAssetDetails(assetId))
	},
	friends: {
		getFriends: backgroundCall(userId =>
			backgroundFetch(`https://friends.roblox.com/v1/users/${userId}/friends`)
				.then(async res => (await res.json()).data)
		)
	},
	gamepasses: {
		getGamepassDetails: backgroundCall(gamepassId =>
			backgroundFetch(`https://apis.roblox.com/game-passes/v1/game-passes/${gamepassId}/product-info `)
				.then(res => res.json())
		)
	},
	games: {
		getPlaceDetails: backgroundCall(placeIds =>
			backgroundFetch(`https://games.roblox.com/v1/games/multiget-place-details?placeIds=${placeIds.join("&placeIds=")}`)
				.then(res => res.json())
		)
	},
	inventory: {
		getUserInventory: backgroundCall((userId, urlParams) =>
			backgroundFetch(`https://inventory.roblox.com/v2/users/${userId}/inventory?${new URLSearchParams(urlParams).toString()}`, {
				credentials: "include"
			}).then(res => assert(res.ok, "Request failed") && res.json())
		),
		getAssetOwners: backgroundCall((assetId, limit, cursor) =>
			backgroundFetch(`https://inventory.roblox.com/v2/assets/${assetId}/owners?limit=${limit}&cursor=${cursor || ""}`, {
				credentials: "include"
			}).then(res => res.json())
		),
		toggleInCollection: backgroundCall((assetType, assetId, addToCollection = true) =>
			backgroundFetch(`https://inventory.roblox.com/v1/collections/items/${assetType}/${assetId}`, {
				method: addToCollection ? "POST" : "DELETE",
				credentials: "include",
				xsrf: true
			}).then(
				async res => {
					const result = await res.json()
					const errorCode = result?.errors?.[0]?.code
					
					if(res.ok || errorCode === 7 || errorCode === 8) {
						// adding returns 7 if already in collection, delte returns 8 if not in collection
						return { inCollection: addToCollection }
					}
					
					return null // return null if error
				},
				() => null // return null if error
			)
		)
	},
	presence: {
		getPresence: backgroundCall(userIds =>
			backgroundFetch(`https://presence.roblox.com/v1/presence/users`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ userIds })
			}).then(async res => (await res.json()).userPresences)
		),
		getLastOnline: backgroundCall(userIds =>
			backgroundFetch(`https://presence.roblox.com/v1/presence/last-online`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ userIds })
			}).then(async res => (await res.json()).lastOnlineTimestamps)
		)
	},
	thumbnails: {
		getAvatarHeadshots: backgroundCall((userIds, size = "150x150") =>
			backgroundFetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userIds.join(",")}&size=${size}&format=Png`)
				.then(async res => (await res.json()).data)
		),
		getAvatarThumbnails: backgroundCall((userIds, size = "150x150") =>
			backgroundFetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userIds.join(",")}&size=${size}&format=Png`)
				.then(async res => (await res.json()).data)
		),
		getAssetThumbnails: backgroundCall((assetIds, size) =>
			backgroundFetch(`https://thumbnails.roblox.com/v1/assets?assetIds=${assetIds.join(",")}&size=${size}&format=Png`)
				.then(async res => (await res.json()).data)
		),
		getGroupIcons: backgroundCall((groupIds, size = "150x150", isCircular = false) =>
			backgroundFetch(`https://thumbnails.roblox.com/v1/groups/icons?groupIds=${groupIds.join(",")}&size=${size}&format=Png&isCircular=${isCircular}`)
				.then(async res => (await res.json()).data)
		)
	},
	users: {
		getUserDetails: backgroundCall(userIds =>
			backgroundFetch(`https://users.roblox.com/v1/users`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					userIds: userIds
				})
			}).then(res => res.json())
		),
		getUsersByUsernames: backgroundCall((usernames, excludeBannedUsers=true) =>
			backgroundFetch(`https://users.roblox.com/v1/usernames/users`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ usernames, excludeBannedUsers })
			}).then(res => res.json())
		),
	},
	www: {
		getFavorites: backgroundCall((userId, assetTypeId, itemsPerPage, pageNumber, thumbWidth=150, thumbHeight=150) =>
			backgroundFetch(`https://www.roblox.com/users/favorites/list-json?userId=${userId}&assetTypeId=${assetTypeId}&itemsPerPage=${itemsPerPage}&pageNumber=${pageNumber}&thumbWidth=${thumbWidth}&thumbHeight=${thumbHeight}`)
				.then(res => res.json())
		),
		getProfilePlayerGames: backgroundCall(userId =>
			backgroundFetch(`https://www.roblox.com/users/profile/playergames-json?userId=${userId}`)
				.then(res => res.json())
		),
		deleteAssetFromInventory: backgroundCall(assetId =>
			backgroundFetch(`https://www.roblox.com/asset/delete-from-inventory`, {
				method: "POST",
				credentials: "include",
				body: new URLSearchParams({ assetId }),
				xsrf: true
			}).then(res => res.json())
		)
	}
}
"use strict"

const invalidXsrfTokens = {}
let cachedXsrfToken = null

let backgroundCallCounter = 0

const wrapArgs = async args => {
	// Chrome can only send json-able data, so we need to strip out
	// everything else, I guess?
	const valuePromises = new Map()
	
	const wrapValue = async value => {
		if(typeof value === "object" && value !== null) {
			if(value instanceof URLSearchParams) {
				return {
					__btrType: "URLSearchParams",
					body: value.toString()
				}
			}
			
			if(Array.isArray(value) || value.constructor === Object) {
				if(valuePromises.has(value)) { return valuePromises.get(value) }
				
				const valuePromise = Promise.resolve().then(async () => {
					const promises = []
					let newObject
					
					for(const [key, oldValue] of Object.entries(value)) {
						promises.push(wrapValue(oldValue).then(newValue => {
							if(newValue !== oldValue) {
								if(!newObject) {
									newObject = Array.isArray(value) ? [...value] : { ...value }
								}
								
								newObject[key] = newValue
							}
						}))
					}
					
					await Promise.all(promises)
					return newObject ?? value
				})
				
				valuePromises.set(value, valuePromise)
				return valuePromise
			}
		} else if(typeof value === "boolean" || typeof value === "number" || typeof value === "string" || value === null || value === undefined) {
			return value
		}
		
		console.log(value)
		throw new TypeError("Invalid value passed to wrapArgs")
	}
	
	return await wrapValue(args)
}

const unwrapArgs = async args => {
	const didCheck = new Set()
	
	const unwrapValue = async value => {
		if(typeof value === "object" && value !== null) {
			if(value.__btrType === "URLSearchParams") {
				return new URLSearchParams(value.body)
			}
			
			if(!didCheck.has(value)) {
				didCheck.add(value)
				
				for(const [key, oldValue] of Object.entries(value)) {
					const newValue = await unwrapValue(oldValue)
					
					if(oldValue !== newValue) {
						value[key] = newValue
					}
				}
			}
		}
		
		return value
	}
	
	return await unwrapValue(args)
}


const cacheResult = (duration, fn) => {
	if(typeof duration === "function") {
		fn = duration
		duration = Infinity
	}
	
	const cache = {}
	
	const cachedFn = (...args) => {
		let cached = cache[args[0]]
		if(cached && Date.now() < cached.expires) { return cached.result }
		
		cached = cache[args[0]] = {
			expires: Date.now() + duration,
			result: fn(...args)
		}
		
		return cached.result
	}
	
	cachedFn.uncached = fn
	
	return cachedFn
}

const backgroundCall = callback => {
	const messageId = `RobloxApi.${backgroundCallCounter}`
	backgroundCallCounter++
	
	if(IS_BACKGROUND_PAGE) {
		contentScript.listen({
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
			cachedXsrfToken = document.querySelector("meta[name='csrf-token']")?.dataset.token ?? null
		}

		backgroundScript.send(messageId, { args: await wrapArgs(args), xsrf: cachedXsrfToken }, async result => {
			if(result.success) {
				resolve(await unwrapArgs(result.result))
			} else {
				reject(result.result)
			}
		})
	})
}

const xsrfFetch = (url, init = {}) => {
	init = { ...init }
	
	const usingXsrf = init.xsrf
	
	if(usingXsrf) {
		delete init.xsrf
		
		if(!init.headers) {
			init.headers = {}
		}
		
		if(!cachedXsrfToken) {
			cachedXsrfToken = document.querySelector("meta[name='csrf-token']")?.dataset.token ?? null
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
	accountinformation: {
		getRobloxBadges: userId => 
			xsrfFetch(`https://accountinformation.roblox.com/v1/users/${userId}/roblox-badges`, {
				credentials: "include"
			}).then(res => res.json()),
	},
	assetdelivery: {
		requestAssetV2: (urlParams, params) => {
			if(!IS_BACKGROUND_PAGE && params?.browserAssetRequest) {
				return RobloxApi.assetdelivery.requestAssetV2_bg(urlParams, params)
			}
			
			if(typeof urlParams === "string" || typeof urlParams === "number") { urlParams = { id: urlParams } }
			if(!(urlParams instanceof URLSearchParams)) { urlParams = new URLSearchParams(urlParams) }
			
			const headers = {}
			if(params?.format) { headers["Roblox-AssetFormat"] = params.format }
			if(params?.browserAssetRequest) { headers["Roblox-Browser-Asset-Request"] = "true" }
			
			return xsrfFetch(`https://assetdelivery.roblox.com/v2/asset/?${urlParams.toString()}`, {
				credentials: "include",
				headers: headers
			}).then(res => res.json())
		},
		
		requestAssetV2_bg: backgroundCall((...args) => RobloxApi.assetdelivery.requestAssetV2(...args))
	},
	avatar: {
		getAvatarRules: () =>
			xsrfFetch(`https://avatar.roblox.com/v1/avatar-rules`, {
				credentials: "include"
			}).then(res => res.json()),
		
		// hits rate limits when requested from page, so doing backgroundCall
		getOutfitDetails: outfitId =>
			xsrfFetch(`https://avatar.roblox.com/v3/outfits/${outfitId}/details`, {
				credentials: "include"
			}).then(res => res.json()),
		
		getUserAvatar: userId =>
			xsrfFetch(`https://avatar.roblox.com/v2/avatar/users/${userId}/avatar`, {
				credentials: "include"
			}).then(res => res.json()),
		
		getCurrentAvatar: () =>
			xsrfFetch(`https://avatar.roblox.com/v2/avatar/avatar`, {
				credentials: "include"
			}).then(res => res.json()),
			
		setBodyColors: bodyColor3s =>
			xsrfFetch(`https://avatar.roblox.com/v2/avatar/set-body-colors`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(bodyColor3s),
				xsrf: true
			}).then(res => res.json()),
		
		renderAvatar: request =>
			xsrfFetch(`https://avatar.roblox.com/v1/avatar/render`, {
				method: "POST",
				credentials: "include",
				body: JSON.stringify(request),
				xsrf: true
			}).then(res => res.json()),
	},
	badges: {
		getBadges: (userId, sortOrder, limit, cursor) =>
			xsrfFetch(`https://badges.roblox.com/v1/users/${userId}/badges?sortOrder=${sortOrder}&limit=${limit}&cursor=${cursor || ""}`, {
				credentials: "include"
			}).then(res => res.json()),
				
		getBadgeDetails: cacheResult(10e3, badgeId =>
			xsrfFetch(`https://badges.roblox.com/v1/badges/${badgeId}`, {
				credentials: "include"
			}).then(res => res.json())
		),
		
		getAwardedDates: (userId, badgeIds) =>
			xsrfFetch(`https://badges.roblox.com/v1/users/${userId}/badges/awarded-dates?badgeIds=${badgeIds.join(",")}`, {
				credentials: "include"
			}).then(res => res.json()),
				
		deleteBadge: badgeId =>
			xsrfFetch(`https://badges.roblox.com/v1/user/badges/${badgeId}`, {
				method: "DELETE",
				credentials: "include",
				xsrf: true
			}).then(res => res.json()),
	},
	catalog: {
		getItemDetails: items =>
			xsrfFetch(`https://catalog.roblox.com/v1/catalog/items/details`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ items }),
				xsrf: true
			}).then(res => res.json()),
			
		getBundleDetails: cacheResult(10e3, bundleId =>
			xsrfFetch(`https://catalog.roblox.com/v1/bundles/${bundleId}/details`, {
				credentials: "include"
			}).then(res => res.json())
		),
		
		getUserBundles: (userId, urlParams) =>
			xsrfFetch(`https://catalog.roblox.com/v1/users/${userId}/bundles?${new URLSearchParams(urlParams).toString()}`, {
				credentials: "include"
			}).then(res => res.json()),
			
		getFavorites: (userId, assetType, limit=10, cursor="") =>
			xsrfFetch(`https://catalog.roblox.com/v1/favorites/users/${userId}/favorites/${assetType}/assets?limit=${limit}&cursor=${cursor}`, {
				credentials: "include"
			}).then(res => res.json()),
	},
	chat: {
		getUserConversations: (pageNumber=1, pageSize=10) =>
			xsrfFetch(`https://chat.roblox.com/v2/get-user-conversations?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
				credentials: "include",
				xsrf: true
			}).then(res => res.json()),
		
		markAsRead: conversationId =>
			xsrfFetch(`https://chat.roblox.com/v2/mark-as-read`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ conversationId: conversationId }),
				xsrf: true
			}).then(res => res.json()),
	},
	develop: {
	},
	economy: {
		getAssetDetails: cacheResult(10e3, assetId =>
			xsrfFetch(`https://economy.roblox.com/v2/assets/${assetId}/details`, {
				credentials: "include"
			}).then(res => res.json())
		),
	},
	friends: {
		getFriends: userId =>
			xsrfFetch(`https://friends.roblox.com/v1/users/${userId}/friends`, {
				credentials: "include"
			}).then(res => res.json())
	},
	gamepasses: {
		getGamepassDetails: cacheResult(10e3, backgroundCall(gamepassId =>
			xsrfFetch(`https://apis.roblox.com/game-passes/v1/game-passes/${gamepassId}/details`, {
				credentials: "include"
			}).then(res => res.json())
		)),
		getGamepassProductInfo: cacheResult(10e3, backgroundCall(gamepassId =>
			xsrfFetch(`https://apis.roblox.com/game-passes/v1/game-passes/${gamepassId}/product-info`, {
				credentials: "include"
			}).then(res => res.json())
		))
	},
	games: {
		getPlaceDetails: placeIds =>
			xsrfFetch(`https://games.roblox.com/v1/games/multiget-place-details?placeIds=${placeIds.join("&placeIds=")}`, {
				credentials: "include"
			}).then(res => res.json()),
			
		getFavorites: (userId, limit=10, cursor="") =>
			xsrfFetch(`https://games.roblox.com/v2/users/${userId}/favorite/games?limit=${limit}&cursor=${cursor}`, {
				credentials: "include"
			}).then(res => res.json()),
	},
	groups: {
		getUserGroupRoles: userId =>
			xsrfFetch(`https://groups.roblox.com/v1/users/${userId}/groups/roles`, {
				credentials: "include"
			}).then(res => res.json()),
	},
	inventory: {
		getUserInventory: (userId, urlParams) =>
			xsrfFetch(`https://inventory.roblox.com/v2/users/${userId}/inventory?${new URLSearchParams(urlParams).toString()}`, {
				credentials: "include"
			}).then(res => res.json()),
			
		getAssetOwners: (assetId, limit, cursor) =>
			xsrfFetch(`https://inventory.roblox.com/v2/assets/${assetId}/owners?limit=${limit}&cursor=${cursor || ""}`, {
				credentials: "include"
			}).then(res => res.json()),
			
		toggleInCollection: (assetType, assetId, addToCollection = true) =>
			xsrfFetch(`https://inventory.roblox.com/v1/collections/items/${assetType}/${assetId}`, {
				method: addToCollection ? "POST" : "DELETE",
				credentials: "include",
				xsrf: true
			}).then(
				async res => {
					const result = await res.json()
					const errorCode = result?.errors?.[0]?.code
					
					if(res.ok || errorCode === 7 || errorCode === 8) {
						// adding returns 7 if already in collection, delete returns 8 if not in collection
						return { inCollection: addToCollection }
					}
					
					return null // return null if error
				},
				() => null // return null if error
			)
	},
	presence: {
		getPresence: userIds =>
			xsrfFetch(`https://presence.roblox.com/v1/presence/users`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userIds })
			}).then(res => res.json()),
	},
	privatemessages: {
		getMessages: (pageNumber=1, pageSize=20, messageTab="Inbox") =>
			xsrfFetch(`https://privatemessages.roblox.com/v1/messages?pageSize=${pageSize}&messageTab=${messageTab}&pageNumber=${pageNumber}`, {
				credentials: "include",
				cache: "no-store"
			}).then(res => res.json()),
			
		getUnreadCount: () =>
			xsrfFetch(`https://privatemessages.roblox.com/v1/messages/unread/count`, {
				credentials: "include",
				cache: "no-store"
			}).then(res => res.json()),
			
		markAsRead: messageIds =>
			xsrfFetch(`https://privatemessages.roblox.com/v1/messages/mark-read`, {
				method: "POST",
				credentials: "include",
				cache: "no-store",
				headers: { "Content-Type": "application/json" },
				xsrf: true,
				body: JSON.stringify({ messageIds })
			}).then(res => res.json()),
	},
	thumbnails: {
		getAvatarHeadshots: (userIds, size = "150x150") =>
			xsrfFetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userIds.join(",")}&size=${size}&format=Png`, {
				credentials: "include"
			}).then(res => res.json()),
		
		getAvatarThumbnails: (userIds, size = "150x150") =>
			xsrfFetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userIds.join(",")}&size=${size}&format=Png`, {
				credentials: "include"
			}).then(res => res.json()),
		
		getAssetThumbnails: (assetIds, size) =>
			xsrfFetch(`https://thumbnails.roblox.com/v1/assets?assetIds=${assetIds.join(",")}&size=${size}&format=Png`, {
				credentials: "include"
			}).then(res => res.json()),
		
		getGroupIcons: (groupIds, size = "150x150", isCircular = false) =>
			xsrfFetch(`https://thumbnails.roblox.com/v1/groups/icons?groupIds=${groupIds.join(",")}&size=${size}&format=Png&isCircular=${isCircular}`, {
				credentials: "include"
			}).then(res => res.json()),
		
		getBadgeIcons: (badgeIds, size = "150x150") =>
			xsrfFetch(`https://thumbnails.roblox.com/v1/badges/icons?badgeIds=${badgeIds.join(",")}&size=${size}&format=Png`, {
				credentials: "include"
			}).then(res => res.json()),
			
		getGameIcons: (gameIds, size = "150x150") =>
			xsrfFetch(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${gameIds.join(",")}&size=${size}&format=Png`, {
				credentials: "include"
			}).then(res => res.json()),
			
		batch: requests =>
			xsrfFetch(`https://thumbnails.roblox.com/v1/batch`, {
				credentials: "include",
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requests)
			}).then(res => res.json()),
	},
	users: {
		getUserDetails: userIds =>
			xsrfFetch(`https://users.roblox.com/v1/users`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userIds: userIds })
			}).then(res => res.json()),
			
		getUsersByUsernames: (usernames, excludeBannedUsers=true) =>
			xsrfFetch(`https://users.roblox.com/v1/usernames/users`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ usernames, excludeBannedUsers })
			}).then(res => res.json())
	},
	userProfiles: {
		getProfiles: (userIds, fields) => 
			xsrfFetch(`https://apis.roblox.com/user-profile-api/v1/user/profiles/get-profiles`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userIds, fields })
			}).then(res => res.json())
	},
	toolboxService: {
		getFavorites: (userId, assetTypeId, limit=10, cursor="") =>
			xsrfFetch(`https://apis.roblox.com/toolbox-service/v1/favorites/user/${userId}/${assetTypeId}?limit=${limit}&cursor=${cursor}`, {
				credentials: "include"
			}).then(res => res.json()),
	},
	www: {
		deleteAssetFromInventory: assetId =>
			xsrfFetch(`https://www.roblox.com/asset/delete-from-inventory`, {
				method: "POST",
				credentials: "include",
				body: new URLSearchParams({ assetId }),
				xsrf: true
			}).then(res => res.json()),
		
		revertPlaceToVersion: versionId =>
			xsrfFetch(`https://www.roblox.com/places/revert`, {
				method: "POST",
				credentials: "include",
				body: new URLSearchParams({ assetVersionID: versionId }),
				xsrf: true
			}).then(res => !!res.ok),
		
		shutdownAllInstances: (placeId, replaceInstances) =>
			xsrfFetch(`https://www.roblox.com/games/shutdown-all-instances`, {
				method: "POST",
				credentials: "include",
				body: new URLSearchParams({ placeId, replaceInstances: !!replaceInstances }),
				xsrf: true
			}).then(res => !!res.ok),
		
	}
}
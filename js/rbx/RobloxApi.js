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
			cachedXsrfToken = document.querySelector("meta[name='csrf-token']")?.dataset.token ?? null
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
		getOutfitDetails: cacheResult(30e3, backgroundCall(outfitId =>
			xsrfFetch(`https://avatar.roblox.com/v1/outfits/${outfitId}/details`, {
				credentials: "include"
			}).then(res => res.ok ? res.json() : null)
		)),
		
		getUserAvatar: userId =>
			xsrfFetch(`https://avatar.roblox.com/v1/users/${userId}/avatar`, {
				credentials: "include"
			}).then(res => res.json()),
		
		getCurrentAvatar: () =>
			xsrfFetch(`https://avatar.roblox.com/v1/avatar`, {
				credentials: "include"
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
	},
	develop: {
		userCanManage: (userId, assetId) =>
			xsrfFetch(`https://develop.roblox.com/v1/user/${userId}/canmanage/${assetId}`, {
				credentials: "include"
			}).then(res => res.json()),
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
			xsrfFetch(`https://apis.roblox.com/game-passes/v1/game-passes/${gamepassId}/product-info`, {
				credentials: "include"
			}).then(res => res.json())
		))
	},
	games: {
		getPlaceDetails: placeIds =>
			xsrfFetch(`https://games.roblox.com/v1/games/multiget-place-details?placeIds=${placeIds.join("&placeIds=")}`, {
				credentials: "include"
			}).then(res => res.json())
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
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ userIds })
			}).then(res => res.json()),
		
		getLastOnline: userIds =>
			xsrfFetch(`https://presence.roblox.com/v1/presence/last-online`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ userIds })
			}).then(res => res.json())
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
		
	},
	users: {
		getUserDetails: userIds =>
			xsrfFetch(`https://users.roblox.com/v1/users`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					userIds: userIds
				})
			}).then(res => res.json()),
			
		getUsersByUsernames: (usernames, excludeBannedUsers=true) =>
			xsrfFetch(`https://users.roblox.com/v1/usernames/users`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ usernames, excludeBannedUsers })
			}).then(res => res.json())
	},
	www: {
		getFavorites: (userId, assetTypeId, itemsPerPage, pageNumber, thumbWidth=150, thumbHeight=150) =>
			xsrfFetch(`https://www.roblox.com/users/favorites/list-json?userId=${userId}&assetTypeId=${assetTypeId}&itemsPerPage=${itemsPerPage}&pageNumber=${pageNumber}&thumbWidth=${thumbWidth}&thumbHeight=${thumbHeight}`, {
				credentials: "include"
			}).then(res => res.json()),
		
		getProfilePlayerGames: userId =>
			xsrfFetch(`https://www.roblox.com/users/profile/playergames-json?userId=${userId}`, {
				credentials: "include"
			}).then(res => res.json()),
		
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
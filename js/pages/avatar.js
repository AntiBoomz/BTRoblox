"use strict"

pageInit.avatar = () => {
	if(!SETTINGS.get("avatar.enabled")) {
		return
	}
	
	modifyTemplate("avatar-base", template => {
		template.$find(".redraw-avatar .text-link").after(html`<a class="text-link" ng-click="openAdvancedAccessories()" style="margin-right:10px">Advanced</a>`)
	})
	
	if(SETTINGS.get("avatar.removeAccessoryLimits")) {
		InjectJS.inject(() => {
			const { hijackFunction, onSet, settings } = window.BTRoblox
			
			const accessoryAssetTypeIds = [8, 41, 42, 43, 44, 45, 46, 47, 57, 58]
			const layeredAssetTypeIds = [64, 65, 66, 67, 68, 69, 70, 71, 72]
			
			onSet(window, "Roblox", Roblox => {
				onSet(Roblox, "AvatarAccoutrementService", AvatarAccoutrementService => {
					hijackFunction(AvatarAccoutrementService, "getAdvancedAccessoryLimit", (target, thisArg, args) => {
						if(accessoryAssetTypeIds.includes(+args[0]) || layeredAssetTypeIds.includes(+args[0])) {
							return
						}
						
						return target.apply(thisArg, args)
					})
					
					hijackFunction(AvatarAccoutrementService, "addAssetToAvatar", (target, thisArg, args) => {
						const result = target.apply(thisArg, args)
						const assets = [args[0], ...args[1]]
						
						let accessoriesLeft = 10
						let layeredLeft = 10 // AvatarAccoutrementService.maxNumberOfLayeredClothingItems ?? 5
						
						for(let i = 0; i < assets.length; i++) {
							const asset = assets[i]
							const assetTypeId = asset?.assetType?.id
							
							const isAccessory = accessoryAssetTypeIds.includes(assetTypeId)
							const isLayered = layeredAssetTypeIds.includes(assetTypeId) || assetTypeId === 41
							
							let valid = true
							
							if(isAccessory || isLayered && settings.avatar.removeLayeredLimits) {
								if(isAccessory && accessoriesLeft <= 0) {
									valid = false
								}
								
								if(isLayered && layeredLeft <= 0) {
									valid = false
								}
							} else {
								valid = result.includes(asset)
							}
							
							if(valid) {
								if(isAccessory) { accessoriesLeft-- }
								if(isLayered && settings.avatar.removeLayeredLimits) { layeredLeft-- }
							} else {
								assets.splice(i--, 1)
							}
						}
						
						return assets
					})
				})
			})
		})
	}
	
}
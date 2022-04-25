"use strict"

pageInit.avatar = () => {
	if(!SETTINGS.get("avatar.enabled")) {
		return
	}
	
	modifyTemplate("avatar-base", template => {
		template.$find(".redraw-avatar .text-link").after(html`<a class="text-link" ng-click="openAdvancedAccessories()" style="margin-right:10px">Advanced</a>`)
	})
	
	InjectJS.inject(() => {
		const { hijackAngular, hijackFunction } = window.BTRoblox
		const accessoryAssetTypeIds = [8, 41, 42, 43, 44, 45, 46, 47]

		hijackAngular("avatar", {
			avatarController(handler, args, argsMap) {
				const result = handler.apply(this, args)

				try {
					const { $scope, avatarTypeService } = argsMap

					const setMaxNumbers = () => {
						try {
							Object.values(avatarTypeService.assetTypeNameLookup).forEach(assetType => {
								if(accessoryAssetTypeIds.includes(assetType.id)) {
									assetType.maxNumber = 10
								}
							})
						} catch(ex) { console.error(ex) }
					}

					setMaxNumbers()
					
					hijackFunction($scope, "validateAdvancedAccessories", (target, thisArg, args) => {
						return true
					})
					
					hijackFunction(avatarTypeService, "setAssetTypeLookups", (target, thisArg, args) => {
						const result = target.apply(thisArg, args)
						setMaxNumbers()
						return result
					})

					hijackFunction($scope, "onItemClicked", (target, thisArg, args) => {
						const item = args[0]

						if(item instanceof Object && item.type === "Asset" && !item.selected && accessoryAssetTypeIds.includes(item.assetType.id)) {
							const origName = item.assetType.name
							item.assetType.name = "Accessory"

							const result = target.apply(thisArg, args)
							item.assetType.name = origName

							return result
						}

						return target.apply(thisArg, args)
					})
				} catch(ex) { console.error(ex) }

				return result
			}
		})
	})
}
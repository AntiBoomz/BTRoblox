"use strict"

pageInit.avatar = () => {
	if(!SETTINGS.get("avatar.enabled")) {
		return
	}
	
	angularHook.modifyTemplate("avatar-base", template => {
		template.$find(".redraw-avatar .text-link").after(html`<a class="text-link" ng-click="openAdvancedAccessories();" style="clear:both;">Advanced</a>`)
	})
	
	if(SETTINGS.get("avatar.removeAccessoryLimits")) {
		InjectJS.inject(() => {
			const { angularHook, hijackFunction, onSet, settings } = window.BTRoblox
			
			const accessoryAssetTypeIds = [8, 41, 42, 43, 44, 45, 46, 47, 57, 58]
			const layeredAssetTypeIds = [64, 65, 66, 67, 68, 69, 70, 71, 72]
			
			onSet(window, "Roblox", Roblox => {
				onSet(Roblox, "AvatarAccoutrementService", AvatarAccoutrementService => {
					angularHook.hijackModule("avatar", {
						avatarController(handler, args, argsMap) {
							const result = handler.apply(this, args)
							
							try {
								const { $scope } = argsMap
								
								hijackFunction($scope, "validateAdvancedAccessories", (target, thisArg, args) => {
									if(settings.avatar.removeLayeredLimits) {
										return true
									}
									
									// filter out all hairs so they dont throw errors
									args[0] = args[0].filter(x => x.assetType !== 41)
									
									return target.apply(thisArg, args)
								})
							} catch(ex) {
								console.error(ex)
								if(IS_DEV_MODE) { alert("hijackAngular Error") }
							}
							
							return result
						}
					})
					
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
						let layeredLeft = 10
						
						for(let i = 0; i < assets.length; i++) {
							const asset = assets[i]
							const assetTypeId = asset?.assetType?.id
							
							const isAccessory = accessoryAssetTypeIds.includes(assetTypeId)
							const isLayered = layeredAssetTypeIds.includes(assetTypeId) || assetTypeId === 41
							
							let valid = true
							
							if(isAccessory || isLayered) {
								if(isAccessory && accessoriesLeft <= 0) {
									valid = false
								}
								
								if(isLayered && layeredLeft <= 0) {
									valid = false
								}
								
								if(!settings.avatar.removeLayeredLimits && layeredAssetTypeIds.includes(assetTypeId)) {
									if(!result.includes(asset)) {
										valid = false
									}
								}
							} else {
								valid = result.includes(asset)
							}
							
							if(valid) {
								if(isAccessory) { accessoriesLeft-- }
								if(isLayered) { layeredLeft-- }
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
	
	if(SETTINGS.get("avatar.fullRangeBodyColors")) {
		angularHook.modifyTemplate("avatar-tab-content", template => {
			const bodyColors = template.$find("#bodyColors")
			bodyColors.classList.add("btr-bodyColors")
		})
		
		InjectJS.inject(() => {
			const { angularHook, contentScript } = window.BTRoblox
			
			angularHook.hijackModule("avatar", {
				avatarController(handler, args, argsMap) {
					const result = handler.apply(this, args)
					
					try {
						const { $scope, $rootScope, avatarConstantService } = argsMap
						
						contentScript.listen("skinColorUpdated", () => {
							$scope.refreshThumbnail()
							$scope.$digest()
						})
						
						contentScript.listen("skinColorError", () => {
							$scope.systemFeedback.error(avatarConstantService.bodyColors.failedToUpdate)
							$scope.$digest()
						})
						
						$scope.$on(avatarConstantService.events.avatarDetailsLoaded, (event, avatarDetails) => {
							contentScript.send("updateSkinColors")
						})

						$rootScope.$on(avatarConstantService.events.bodyColorsChanged, (event, bodyColors) => {
							contentScript.send("updateSkinColors")
						})
						
					} catch(ex) {
						console.error(ex)
						if(IS_DEV_MODE) { alert("hijackAngular Error") }
					}
					
					return result
				}
			})
		})
		
		document.$watch(".btr-bodyColors", async cont => {
			const bodyColor3s = (await RobloxApi.avatar.getCurrentAvatar()).bodyColor3s
			
			const selector = html`
			<div class=btr-color-selector>
				<input type=color class=btr-color-head></input>
				<input type=color class=btr-color-torso></input>
				<input type=color class=btr-color-leftArm></input>
				<input type=color class=btr-color-rightArm></input>
				<input type=color class=btr-color-leftLeg></input>
				<input type=color class=btr-color-rightLeg></input>
			</div>`
			
			const inputs = {}
			
			const updateColors = async () => {
				const json = await RobloxApi.avatar.setBodyColors(bodyColor3s)
				
				if(json && !json.errors) {
					InjectJS.send("skinColorUpdated")
				} else {
					InjectJS.send("skinColorError")
				}
			}
			
			for(const input of selector.children) {
				const name = input.className.slice(10)
				
				input.value = `#${bodyColor3s[`${name}Color3`]}`
				inputs[name] = input
				
				input.$on("change", () => {
					const color = input.value.slice(1)
					
					if(bodyColor3s[`${name}Color3`].toLowerCase() !== color.toLowerCase()) {
						bodyColor3s[`${name}Color3`] = color
						updateColors()
					}
				})
			}
			
			let debounce = 0
			
			InjectJS.listen("updateSkinColors", async () => {
				const deb = ++debounce
				const newColor3s = (await RobloxApi.avatar.getCurrentAvatar()).bodyColor3s
				
				if(debounce === deb) {
					for(const [name, oldColor] of Object.entries(bodyColor3s)) {
						const newColor = newColor3s[name]
						
						if(newColor.toLowerCase() !== oldColor.toLowerCase()) {
							bodyColor3s[name] = newColor
							inputs[name.slice(0, -6)].value = `#${newColor}`
						}
					}
				}
			})
			
			cont.$find(".section-content").prepend(selector, html`<hr style=margin-top:40px;margin-bottom:30px;>`)
		})
	}
}
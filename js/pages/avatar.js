"use strict"

pageInit.avatar = () => {
	if(!SETTINGS.get("avatar.enabled")) {
		return
	}
	
	angularHook.modifyTemplate("avatar-base", template => {
		const redraw = template.$find(".redraw-avatar .text-link")
		
		if(redraw) {
			redraw.classList.add("btr-redraw-button")
			redraw.after(html`<a class="text-link btr-advanced-button" ng-click="openAdvancedAccessories();">Advanced</a>`)
		}
	})
	
	if(SETTINGS.get("avatar.assetRefinement")) {
		document.$watch("body", body => body.classList.add("btr-avatar-refinement"))
		
		angularHook.modifyTemplate("avatar-base", template => {
			template.$find(".redraw-avatar").after(
				html`
				<div class=btr-avatar-refinement-container>
					<div ng-repeat="item in btrWearingAssets" ng-if="item.meta.position" ng-init="item.btrScale=item.meta.scale.X">
						<div class="scale-container">
							<div class="text-label font-subheader-1" style="width:100%" title="{{item.name}} ({{item.id}})">{{item.name}} ({{item.id}})</div>
							
							<div class="text-label font-subheader-1">Position</div>
							<div class="scale-label font-body">({{item.meta.position.X}}, {{item.meta.position.Y}}, {{item.meta.position.Z}})</div>
							<div style="width:100%;clear:both">
								<input type="range" class="pr0" step="0.01"
									style="width:32%;--btr-input-perc:{{(item.meta.position.X-btrAvatarRules.accessoryRefinementLowerBounds[item.assetType.name].position.xPosition)/(btrAvatarRules.accessoryRefinementUpperBounds[item.assetType.name].position.xPosition-btrAvatarRules.accessoryRefinementLowerBounds[item.assetType.name].position.xPosition)*100}}%;"
									min="{{btrAvatarRules.accessoryRefinementLowerBounds[item.assetType.name].position.xPosition}}"
									max="{{btrAvatarRules.accessoryRefinementUpperBounds[item.assetType.name].position.xPosition}}"
									ng-model="item.meta.position.X"
									on-input-finished="btrUpdateItem(item)">
								<input type="range" class="pr0" step="0.01"
									style="width:32%;margin-left:2%;margin-right:2%;--btr-input-perc:{{(item.meta.position.Y-btrAvatarRules.accessoryRefinementLowerBounds[item.assetType.name].position.yPosition)/(btrAvatarRules.accessoryRefinementUpperBounds[item.assetType.name].position.yPosition-btrAvatarRules.accessoryRefinementLowerBounds[item.assetType.name].position.yPosition)*100}}%;"
									min="{{btrAvatarRules.accessoryRefinementLowerBounds[item.assetType.name].position.yPosition}}"
									max="{{btrAvatarRules.accessoryRefinementUpperBounds[item.assetType.name].position.yPosition}}"
									ng-model="item.meta.position.Y"
									on-input-finished="btrUpdateItem(item)">
								<input type="range" class="pr0" step="0.01"
									style="width:32%;--btr-input-perc:{{(item.meta.position.Z-btrAvatarRules.accessoryRefinementLowerBounds[item.assetType.name].position.zPosition)/(btrAvatarRules.accessoryRefinementUpperBounds[item.assetType.name].position.zPosition-btrAvatarRules.accessoryRefinementLowerBounds[item.assetType.name].position.zPosition)*100}}%;"
									min="{{btrAvatarRules.accessoryRefinementLowerBounds[item.assetType.name].position.zPosition}}"
									max="{{btrAvatarRules.accessoryRefinementUpperBounds[item.assetType.name].position.zPosition}}"
									ng-model="item.meta.position.Z"
									on-input-finished="btrUpdateItem(item)">
							</div>
							
							<div class="text-label font-subheader-1">Rotation</div>
							<div class="scale-label font-body">({{item.meta.rotation.X}}, {{item.meta.rotation.Y}}, {{item.meta.rotation.Z}})</div>
							<div style="width:100%;clear:both">
								<input type="range" class="pr0" step="1"
									style="width:32%;--btr-input-perc:{{(item.meta.rotation.X-btrAvatarRules.accessoryRefinementLowerBounds[item.assetType.name].rotation.xRotation)/(btrAvatarRules.accessoryRefinementUpperBounds[item.assetType.name].rotation.xRotation-btrAvatarRules.accessoryRefinementLowerBounds[item.assetType.name].rotation.xRotation)*100}}%;"
									min="{{btrAvatarRules.accessoryRefinementLowerBounds[item.assetType.name].rotation.xRotation}}"
									max="{{btrAvatarRules.accessoryRefinementUpperBounds[item.assetType.name].rotation.xRotation}}"
									ng-model="item.meta.rotation.X"
									on-input-finished="btrUpdateItem(item)">
								<input type="range" class="pr0" step="1"
									style="width:32%;margin-left:2%;margin-right:2%;--btr-input-perc:{{(item.meta.rotation.Y-btrAvatarRules.accessoryRefinementLowerBounds[item.assetType.name].rotation.yRotation)/(btrAvatarRules.accessoryRefinementUpperBounds[item.assetType.name].rotation.yRotation-btrAvatarRules.accessoryRefinementLowerBounds[item.assetType.name].rotation.yRotation)*100}}%;"
									min="{{btrAvatarRules.accessoryRefinementLowerBounds[item.assetType.name].rotation.yRotation}}"
									max="{{btrAvatarRules.accessoryRefinementUpperBounds[item.assetType.name].rotation.yRotation}}"
									ng-model="item.meta.rotation.Y"
									on-input-finished="btrUpdateItem(item)">
								<input type="range" class="pr0" step="1"
									style="width:32%;--btr-input-perc:{{(item.meta.rotation.Z-btrAvatarRules.accessoryRefinementLowerBounds[item.assetType.name].rotation.zRotation)/(btrAvatarRules.accessoryRefinementUpperBounds[item.assetType.name].rotation.zRotation-btrAvatarRules.accessoryRefinementLowerBounds[item.assetType.name].rotation.zRotation)*100}}%;"
									min="{{btrAvatarRules.accessoryRefinementLowerBounds[item.assetType.name].rotation.zRotation}}"
									max="{{btrAvatarRules.accessoryRefinementUpperBounds[item.assetType.name].rotation.zRotation}}"
									ng-model="item.meta.rotation.Z"
									on-input-finished="btrUpdateItem(item)">
							</div>
							
							<div class="text-label font-subheader-1">Scale</div>
							<div class="scale-label font-body">{{item.btrScale}}</div>
							<input type="range" class="pr0" step="0.01"
								style="--btr-input-perc:{{(item.btrScale-btrAvatarRules.accessoryRefinementLowerBounds[item.assetType.name].scale.xScale)/(btrAvatarRules.accessoryRefinementUpperBounds[item.assetType.name].scale.xScale-btrAvatarRules.accessoryRefinementLowerBounds[item.assetType.name].scale.xScale)*100}}%;"
								min="{{btrAvatarRules.accessoryRefinementLowerBounds[item.assetType.name].scale.xScale}}"
								max="{{btrAvatarRules.accessoryRefinementUpperBounds[item.assetType.name].scale.xScale}}"
								ng-model="item.btrScale"
								on-input-finished="btrUpdateItem(item)">
						</div>
					</div>
				</div>`
			)
		})
		
		InjectJS.inject(() => {
			const { angularHook, hijackFunction, onSet, IS_DEV_MODE } = window.BTRoblox
			
			onSet(window, "Roblox", Roblox => {
				onSet(Roblox, "AvatarAccoutrementService", AvatarAccoutrementService => {
					let wearingAssets
					let avatarRules
					
					hijackFunction(AvatarAccoutrementService, "removeAssetFromAvatar", (target, thisArg, args) => {
						if(args[0] === "btrGetWearingAssets") {
							wearingAssets = args[1]
							throw "BTRoblox: abort (this should never be visible)"
						}
						
						return target.apply(thisArg, args)
					})
					
					angularHook.hijackModule("avatar", {
						avatarController(target, thisArg, args, argsMap) {
							const result = target.apply(thisArg, args)
							
							try {
								const { $scope, avatarConstantService } = argsMap
								
								const updateWearingAssets = () => {
									if(!wearingAssets || !avatarRules) { return }
									
									for(const item of wearingAssets) {
										if(avatarRules.accessoryRefinementTypes.includes(item.assetType.id)) {
											if(!item.meta) { item.meta = { version: 1 } }
											if(!item.meta.position) { item.meta.position = { X: 0, Y: 0, Z: 0 } }
											if(!item.meta.rotation) { item.meta.rotation = { X: 0, Y: 0, Z: 0 } }
											if(!item.meta.scale) { item.meta.scale = { X: 1, Y: 1, Z: 1 } }
										}
									}
								}
								
								$scope.btrUpdateSlider = $event => {
									console.log($event)
								}
								
								$scope.btrUpdateItem = item => {
									if(item.meta?.scale && item.btrScale) {
										item.meta.scale.X = item.btrScale
										item.meta.scale.Y = item.btrScale
										item.meta.scale.Z = item.btrScale
									}
									
									$scope.onHatSlotClicked({ id: -1, assetType: { id: 8, name: "Hat" } })
								}
								
								$scope.btrRefreshWearingAssets = () => {
									try { $scope.onHatSlotClicked("btrGetWearingAssets") }
									catch(ex) {}
									
									$scope.btrWearingAssets = wearingAssets || []
									updateWearingAssets()
								}
								
								$scope.btrRefreshWearingAssets()
								
								$scope.$on(avatarConstantService.events.wornAssetsChanged, (event, assetIds) => {
									$scope.btrRefreshWearingAssets()
								})
								
								$scope.$on(avatarConstantService.events.avatarRulesLoaded, (event, rules) => {
									$scope.btrAvatarRules = avatarRules = rules
									
									const min = $scope.btrAvatarRules.accessoryRefinementLowerBounds.Hat
									const max = avatarRules.accessoryRefinementUpperBounds.Hat
									
									$scope.btrBounds = {}
									
									for(const [key,val] of Object.entries(min)) {
										const parent = $scope.btrBounds[key] = {}
										
										for(const [key2,val2] of Object.entries(val)) {
											parent[key2.slice(0, 1).toUpperCase()] = {
												min: val2,
												max: max[key][key2]
											}
										}
									}
									
									updateWearingAssets()
								})
								
							} catch(ex) {
								console.error(ex)
								if(IS_DEV_MODE) { alert("hijackAngular Error") }
							}
							
							return result
						}
					})
				})
			})
		})
	}
	
	if(SETTINGS.get("avatar.removeAccessoryLimits")) {
		InjectJS.inject(() => {
			const { angularHook, hijackFunction, onSet, settings, IS_DEV_MODE } = window.BTRoblox
			
			const accessoryAssetTypeIds = [8, 41, 42, 43, 44, 45, 46, 47, 57, 58]
			const layeredAssetTypeIds = [64, 65, 66, 67, 68, 69, 70, 71, 72]
			
			onSet(window, "Roblox", Roblox => {
				onSet(Roblox, "AvatarAccoutrementService", AvatarAccoutrementService => {
					angularHook.hijackModule("avatar", {
						avatarController(target, thisArg, args, argsMap) {
							const result = target.apply(thisArg, args)
							
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
				avatarController(target, thisArg, args, argsMap) {
					const result = target.apply(thisArg, args)
					
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
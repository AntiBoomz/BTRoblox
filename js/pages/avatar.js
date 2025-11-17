"use strict"

pageInit.avatar = () => {
	if(!SETTINGS.get("avatar.enabled")) { return }
	
	injectScript.call("avatar", () => {
		let openAdvancedAccessories
		
		reactHook.hijackConstructor(
			props => !openAdvancedAccessories && "openAdvancedAccessories" in props,
			(target, thisArg, args) => {
				openAdvancedAccessories = args[0].openAdvancedAccessories
				return target.apply(thisArg, args)
			}
		)
		
		reactHook.inject(".redraw-avatar", redraw => {
			redraw.classList.add("btr-redraw-avatar")
			
			redraw.append(
				reactHook.createElement("a", {
					className: "text-link btr-advanced-button",
					onClick: () => openAdvancedAccessories(),
				}, "Advanced")
			)
		})
	})
	
	if(SETTINGS.get("avatar.assetRefinement")) {
		onPageReset(() => {
			document.body?.classList.remove("btr-avatar-refinement")
		})
		
		onPageLoad(() => {
			document.$watch("body", body => body.classList.add("btr-avatar-refinement"))
		})
		
		modifyAngularTemplate("avatar-base", template => {
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
									style="width:32%;--btr-input-perc:{{(item.meta.position.X-btrBounds[item.assetType.id].position.X.min)/(btrBounds[item.assetType.id].position.X.max-btrBounds[item.assetType.id].position.X.min)*100}}%;"
									min="{{btrBounds[item.assetType.id].position.X.min}}"
									max="{{btrBounds[item.assetType.id].position.X.max}}"
									ng-model="item.meta.position.X"
									on-input-finished="btrUpdateItem(item)">
								<input type="range" class="pr0" step="0.01"
									style="width:32%;margin-left:2%;margin-right:2%;--btr-input-perc:{{(item.meta.position.Y-btrBounds[item.assetType.id].position.Y.min)/(btrBounds[item.assetType.id].position.Y.max-btrBounds[item.assetType.id].position.Y.min)*100}}%;"
									min="{{btrBounds[item.assetType.id].position.Y.min}}"
									max="{{btrBounds[item.assetType.id].position.Y.max}}"
									ng-model="item.meta.position.Y"
									on-input-finished="btrUpdateItem(item)">
								<input type="range" class="pr0" step="0.01"
									style="width:32%;--btr-input-perc:{{(item.meta.position.Z-btrBounds[item.assetType.id].position.Z.min)/(btrBounds[item.assetType.id].position.Z.max-btrBounds[item.assetType.id].position.Z.min)*100}}%;"
									min="{{btrBounds[item.assetType.id].position.Z.min}}"
									max="{{btrBounds[item.assetType.id].position.Z.max}}"
									ng-model="item.meta.position.Z"
									on-input-finished="btrUpdateItem(item)">
							</div>
							
							<div class="text-label font-subheader-1">Rotation</div>
							<div class="scale-label font-body">({{item.meta.rotation.X}}, {{item.meta.rotation.Y}}, {{item.meta.rotation.Z}})</div>
							<div style="width:100%;clear:both">
								<input type="range" class="pr0" step="1"
									style="width:32%;--btr-input-perc:{{(item.meta.rotation.X-btrBounds[item.assetType.id].rotation.X.min)/(btrBounds[item.assetType.id].rotation.X.max-btrBounds[item.assetType.id].rotation.X.min)*100}}%;"
									min="{{btrBounds[item.assetType.id].rotation.X.min}}"
									max="{{btrBounds[item.assetType.id].rotation.X.max}}"
									ng-model="item.meta.rotation.X"
									on-input-finished="btrUpdateItem(item)">
								<input type="range" class="pr0" step="1"
									style="width:32%;margin-left:2%;margin-right:2%;--btr-input-perc:{{(item.meta.rotation.Y-btrBounds[item.assetType.id].rotation.Y.min)/(btrBounds[item.assetType.id].rotation.Y.max-btrBounds[item.assetType.id].rotation.Y.min)*100}}%;"
									min="{{btrBounds[item.assetType.id].rotation.Y.min}}"
									max="{{btrBounds[item.assetType.id].rotation.Y.max}}"
									ng-model="item.meta.rotation.Y"
									on-input-finished="btrUpdateItem(item)">
								<input type="range" class="pr0" step="1"
									style="width:32%;--btr-input-perc:{{(item.meta.rotation.Z-btrBounds[item.assetType.id].rotation.Z.min)/(btrBounds[item.assetType.id].rotation.Z.max-btrBounds[item.assetType.id].rotation.Z.min)*100}}%;"
									min="{{btrBounds[item.assetType.id].rotation.Z.min}}"
									max="{{btrBounds[item.assetType.id].rotation.Z.max}}"
									ng-model="item.meta.rotation.Z"
									on-input-finished="btrUpdateItem(item)">
							</div>
							
							<div class="text-label font-subheader-1">Scale</div>
							<div class="scale-label font-body">{{item.btrScale}}</div>
							<input type="range" class="pr0" step="0.01"
								style="--btr-input-perc:{{(item.btrScale-btrBounds[item.assetType.id].scale.X.min)/(btrBounds[item.assetType.id].scale.X.max-btrBounds[item.assetType.id].scale.X.min)*100}}%;"
								min="{{btrBounds[item.assetType.id].scale.X.min}}"
								max="{{btrBounds[item.assetType.id].scale.X.max}}"
								ng-model="item.btrScale"
								on-input-finished="btrUpdateItem(item)">
						</div>
					</div>
				</div>`
			)
		})
		
		injectScript.call("assetRefinement", () => {
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
									$scope.btrBounds = {}
									
									for(const [assetTypeName, lowerBounds] of Object.entries(avatarRules.accessoryRefinementLowerBounds)) {
										const upperBounds = avatarRules.accessoryRefinementUpperBounds[assetTypeName]
										
										const wearableAssetType = avatarRules.wearableAssetTypes.find(x => x.name.replace(/\s/, "") === assetTypeName)
										const assetBounds = $scope.btrBounds[wearableAssetType?.id] = {}
										
										for(const [category, values] of Object.entries(lowerBounds)) {
											const bounds = assetBounds[category] = {}
											
											for(const [key, value] of Object.entries(values)) {
												bounds[key.slice(0, 1).toUpperCase()] = {
													min: value,
													max: upperBounds[category][key]
												}
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
	
	if(SETTINGS.get("avatar.fullRangeBodyColors")) {
		injectScript.call("fullRangeBodyColors", () => {
			let forceRefreshThumbnail
			
			reactHook.hijackConstructor(
				props => !forceRefreshThumbnail && "forceRefreshThumbnail" in props,
				(target, thisArg, args) => {
					forceRefreshThumbnail = args[0].forceRefreshThumbnail
					return target.apply(thisArg, args)
				}
			)
			
			contentScript.listen("forceRefreshThumbnail", () => {
				forceRefreshThumbnail?.()
			})
			
			contentScript.listen("skinColorError", () => {
				Roblox.BootstrapWidgets.ToggleSystemMessage($(".alert-warning"), 100, 2000, "Failed to update skin tone.")
			})
			
			hijackXHR(request => {
				if(request.url.endsWith("/set-body-colors")) {
					request.onResponse.push(() => {
						contentScript.send("updateBodyColors")
					})
				}
			})
		})
		
		document.$watch("#bodyColors", async cont => {
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
			let debounce = 0
			
			const updateBodyColors = async () => {
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
				
			}
			const setBodyColors = async () => {
				const json = await RobloxApi.avatar.setBodyColors(bodyColor3s)
				
				if(json && !json.errors) {
					injectScript.send("forceRefreshThumbnail")
				} else {
					injectScript.send("skinColorError")
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
						setBodyColors()
					}
				})
			}
			
			injectScript.listen("updateBodyColors", updateBodyColors)
			
			cont.$find(".section-content").prepend(selector, html`<hr style=margin-top:40px;margin-bottom:30px;>`)
		})
	}
}
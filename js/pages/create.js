"use strict"

pageInit.create = () => {
	// Init global features
	
	Navigation.init()
	SettingsModal.enable()
	
	//
	
	fetch(`https://users.roblox.com/v1/users/authenticated`, { credentials: "include" }).then(async res => {
		const json = await res.json()
		const userId = json?.id ?? -1
		
		loggedInUser = Number.isSafeInteger(userId) ? userId : -1
		loggedInUserPromise.$resolve(loggedInUser)
	})
	
	//
	
	if(!SETTINGS.get("create.enabled")) {
		return
	}
	
	InjectJS.inject(() => {
		const { hijackFunction, reactHook } = BTRoblox
		
		const webpackHook = {
			processedModules: new WeakSet(),
			propertyHandlers: new Map(),
			moduleHandlers: [],
			objects: {},
			
			onModule(fn) {
				this.moduleHandlers.push(fn)
			},
			
			onProperty(keys, fn) {
				if(!Array.isArray(keys)) { keys = [keys] }
				
				const callback = keys.length >= 2 ? obj => {
					for(const key of keys) {
						if(!Object.hasOwn(obj, key)) {
							return
						}
					}
					
					fn(obj)
				} : fn
				
				for(const key of keys) {
					let list = this.propertyHandlers.get(key)
					
					if(!list) {
						list = []
						
						Object.defineProperty(Object.prototype, key, {
							configurable: true,
							set(value) {
								Object.defineProperty(this, key, {
									configurable: true,
									enumerable: true,
									writable: true,
									value: value
								})
								
								for(const fn of list) {
									try { fn(args[0]) }
									catch(ex) { console.error(ex) }
								}
							}
						})
						
						if(!this.propertyHandlers.size) {
							const propertyHandlers = this.propertyHandlers
							
							Object.defineProperty = new Proxy(Object.defineProperty, {
								apply(target, thisArg, args) {
									const result = target.apply(thisArg, args)
									
									const list = propertyHandlers.get(args[1])
									if(list) {
										for(const fn of list) {
											try { fn(args[0]) }
											catch(ex) { console.error(ex) }
										}
									}
									
									return result
								}
							})
						}
						
						this.propertyHandlers.set(key, list)
					}
					
					list.push(callback)
				}
			},
			
			init() {
				BTRoblox.onSet(window, "webpackChunk_N_E", chunks => {
					const addChunk = chunk => {
						for(const id of Object.keys(chunk)) {
							hijackFunction(chunk, id, (target, thisArg, args) => {
								const result = target.apply(thisArg, args)
								
								try {
									const module = args[0].exports
									if(typeof module === "object" && !this.processedModules.has(module)) {
										this.processedModules.add(module)
										
										for(const fn of this.moduleHandlers) {
											try { fn(module, target) }
											catch(ex) { console.error(ex) }
										}
									}
								} catch(ex) {
									console.error(ex)
								}
								
								return result
							})
						}
					}
					
					const override = pushfn => new Proxy(pushfn, {
						apply: (target, thisArg, args) => {
							for(const chunk of args) {
								try { addChunk(chunk[1]) }
								catch(ex) { console.error(ex) }
							}
							
							return target.apply(thisArg, args)
						}
					})
					
					let pushoverride = override(chunks.push)
					
					Object.defineProperty(chunks, "push", {
						enumerable: false,
						configurable: true,
						set(fn) { pushoverride = override(fn) },
						get() { return pushoverride }
					})
					
					for(const chunk of chunks) {
						try { addChunk(chunk[1]) }
						catch(ex) { console.error(ex) }
					}
				})
			}
		}
		
		const { objects } = webpackHook
		
		objects.Mui = {}
		
		webpackHook.onModule((module, target) => {
			if("jsx" in module && "jsxs" in module) {
				hijackFunction(module, "jsx", reactHook.onCreateElement.bind(reactHook))
				hijackFunction(module, "jsxs", reactHook.onCreateElement.bind(reactHook))
				objects.jsx = module.jsx
				
			} else if("useState" in module && "useCallback" in module) {
				reactHook.onReact(module)
				objects.React = module
				
			} else if("useRouter" in module) {
				objects.NextRouter = module
			}
			
			const moduleCode = target.toString()
			
			if(moduleCode.includes(`name:"MenuItem"`)) {
				objects.Mui.MenuItem = Object.values(module)[0]
			} else if(moduleCode.includes(`name:"Button"`)) {
				objects.Mui.Button = Object.values(module)[0]
			} else if(moduleCode.includes(`name:"Divider"`)) {
				objects.Mui.Divider = Object.values(module)[0]
			}
		})
		
		BTRoblox.webpackHook = webpackHook
		
		webpackHook.init()
	})
	
	// Add settings
	InjectJS.inject(() => {
		const { reactHook, webpackHook } = BTRoblox
		const { objects } = webpackHook
		
		reactHook.hijackConstructor(
			(type, props) => props.settingsHref,
			(target, thisArg, args) => {
				const result = target.apply(thisArg, args)
				
				try {
					const list = reactHook.queryElement(result, x => x.props.id === "top-navigation-authentication-status-menu")
					
					if(list) {
						list.props.children.unshift(
							objects.jsx(objects.Mui.MenuItem, {
								children: "BTR Settings",
								className: "btr-settings-toggle"
							})
						)
					}
				} catch(ex) {
					console.error(ex)
				}
				
				return result
			}
		)
	})
	
	// Adjust options menu items
	if(SETTINGS.get("create.assetOptions")) {
		InjectJS.inject(() => {
			const { reactHook, webpackHook } = BTRoblox
			const { objects } = webpackHook
			
			const Link = (url, entry) => objects.jsx("a", {
				href: url,
				style: { all: "unset", display: "contents" },
				className: "btr-next-anchor",
				children: entry,
				key: entry.key
			})
			
			document.addEventListener("click", ev => {
				const anchor = ev.target.nodeName === "A" ? ev.target : ev.target.closest("a")
				
				if(anchor?.classList.contains("btr-next-anchor")) {
					if(!ev.shiftKey && !ev.ctrlKey && objects.NextRouter) {
						ev.preventDefault()
						objects.NextRouter.router.push(anchor.href)
					}
				}
			})
			
			reactHook.hijackConstructor(
				(type, props) => props.itemType && props.updateItem,
				(target, thisArg, args) => {
					const result = target.apply(thisArg, args)
					
					try {
						if(result?.props["data-testid"] === "experience-options-menu") {
							const children = [result.props.children].flat(10).filter(x => x)
							result.props.children = children
							
							if(args[0].itemType === "Game") {
								let index = children.findIndex(x => x?.key === "Action.OpenInNewTab")
								if(index !== -1) { children.splice(index, 1) }
								
								index = children.findIndex(x => x?.key === "Action.CopyURL")
								if(index !== -1) { children.splice(index, 1) }
								
								index = children.findIndex(x => x?.key === "Action.CopyUniverseID")
								if(index !== -1) { children.splice(index, 1) }
								
								index = children.findIndex(x => x?.props.itemKey === "Action.CopyStartPlaceID")
								if(index !== -1) { children[index].props.style = { display: "none" } } // HACK: Keep in dom for styling purposes
								
								index = children.findIndex(x => x?.key === "Action.OpenExperienceDetails")
								if(index !== -1) {
									const entry = children[index]
									delete entry.props.onClick
									
									children[index] = Link(`https://www.roblox.com/games/${args[0].creation.assetId}/`, entry)
								}
								
								index = children.findIndex(x => x?.key === "Action.ConfigureLocalization")
								if(index !== -1) {
									const entry = children[index]
									delete entry.props.onClick
									
									children[index] = Link(`/dashboard/creations/experiences/${args[0].creation.universeId}/localization`, entry)
								}
								
								index = children.findIndex(x => x?.key === "Action.ViewRealTimeStats")
								if(index !== -1) {
									const entry = children[index]
									delete entry.props.onClick
									
									children[index] = Link(`/dashboard/creations/experiences/${args[0].creation.universeId}/analytics/performance`, entry)
									
									// HACK: Make a copy for styling purposes
									children.splice(index + 1, 0, { ...entry, key: undefined, props: { ...entry.props, children: null, style: { display: "none" } }})
								}
								
								index = children.findIndex(x => x?.key === "Action.CreateBadge")
								if(index !== -1) {
									const entry = children[index]
									delete entry.props.onClick
									
									children[index] = Link(`/dashboard/creations/experiences/${args[0].creation.universeId}/badges/create`, entry)
								}
								
								index = children.findIndex(x => x?.key === "Action.OpenExperienceDetails")
								children.splice(
									index + 1, 0,
									Link(
										`/dashboard/creations/experiences/${args[0].creation.universeId}/overview`,
										objects.jsx(objects.Mui.MenuItem, { children: "Configure Experience" }),
									),
									Link(
										`/dashboard/creations/experiences/${args[0].creation.universeId}/places/${args[0].creation.assetId}/configure`,
										objects.jsx(objects.Mui.MenuItem, { children: "Configure Start Place" })
									)
								)
							} else if(args[0].itemType === "CatalogAsset") {
								let index = children.findIndex(x => x?.key === "Action.OpenInNewTab")
								if(index !== -1) { children.splice(index, 1) }
								
								children.splice(
									0, 0,
									Link(
										`https://www.roblox.com/catalog/${args[0].creation.assetId}/`,
										objects.jsx(objects.Mui.MenuItem, { children: "View on Roblox" })
									),
									Link(
										`/dashboard/creations/catalog/${args[0].creation.assetId}/configure`,
										objects.jsx(objects.Mui.MenuItem, { children: "Configure Asset" })
									)
								)
								
								index = children.findIndex(x => x?.props?.itemKey === "Action.Analytics")
								if(index !== -1) {
									const entry = children[index]
									delete entry.props.onClick
									
									children[index] = Link(`/dashboard/creations/catalog/${args[0].creation.assetId}/analytics`, entry)
								}
								
								index = children.findIndex(x => x?.key === "Action.CopyURL")
								if(index !== -1) { children.splice(index, 1) }
								
								index = children.findIndex(x => x?.props.children === "Copy Asset ID")
								if(index !== -1) { children.splice(index, 1) }
								
								index = children.findIndex(x => x?.props.children === "Copy Asset URI")
								if(index !== -1) { children.splice(index, 1) }
							}
						}
					} catch(ex) {
						console.error(ex)
					}
					
					return result
				}
			)
			
			reactHook.hijackConstructor(
				(type, props) => props.menuItems && props.setMenuOpen,
				(target, thisArg, args) => {
					const result = target.apply(thisArg, args)
					
					try {
						const parent = result?.props.children?.[1]
						if(parent?.props) {
							const children = [parent.props.children].flat(10).filter(x => x)
							parent.props.children = children
							
							const assetDetail = children.find(x => x?.key === "open-asset-detail")
							if(assetDetail) {
								const assetId = assetDetail.props.assetId
								
								// let index = children.indexOf(assetDetail)
								// if(index !== -1) { children.splice(index, 1) }
								
								let index = children.findIndex(x => x?.key === "copy-asset-id")
								if(index !== -1) { children.splice(index, 1) }
								
								children.splice(
									children.indexOf(assetDetail) + 1,
									0,
									// objects.jsx(objects.Mui.Divider, {}),
									Link(
										`/dashboard/creations/store/${assetId}/configure`,
										objects.jsx(objects.Mui.MenuItem, { children: "Configure Asset" })
									)
								)
							}
						}
					} catch(ex) {
						console.error(ex)
					}
					
					return result
				}
			)
		})
	}
	
	// Add download option to version history
	if(SETTINGS.get("create.downloadVersion")) {
		InjectJS.inject(() => {
			const { reactHook, webpackHook } = BTRoblox
			const { objects } = webpackHook 
			
			reactHook.hijackConstructor(
				(type, props) => "version" in props,
				(target, thisArg, args) => {
					const result = target.apply(thisArg, args)
					
					try {
						if(result?.props["data-testid"]?.startsWith("version-history")) {
							const version = args[0].version
							const right = result.props.children[3]
							
							if(!Array.isArray(right.props.children)) {
								right.props.children = [right.props.children]
							}
							
							right.props.children.unshift(
								objects.jsx(objects.Mui.Button, {
									className: "btr-download-version",
									btrVersion: version.assetVersionNumber,
									btrAssetId: version.assetId,
									size: "small",
									color: "secondary",
									style: {
										"margin-right": right.props.children[0] ? "5px" : "",
									},
									children: [
										objects.jsx("span", {
											className: "btr-mui-circular-progress-root",
											style: {
												width: "20px",
												height: "20px",
												position: "absolute",
												left: "7px",
												display: "none"
											},
											children: objects.jsx("svg", {
												className: "btr-mui-circular-progress-svg",
												focusable: false,
												viewBox: "22 22 44 44",
												children: objects.jsx("circle", {
													className: "btr-mui-circular-progress",
													"stroke-width": 3.6,
													fill: "none",
													cx: 44,
													cy: 44,
													r: 20.2
												})
											})
										}),
										objects.jsx("svg", {
											className: "MuiSvgIcon-root btr-download-icon",
											focusable: false,
											viewBox: "0 0 24 24",
											style: {
												height: "19px",
												"margin-right": "5px",
												fill: "currentcolor"
											},
											children: objects.jsx("path", {
												d: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"
											})
										}),
										" ", "Download",,
									]
								})
							)
						}
					} catch(ex) {
						console.error(ex)
					}
					
					return result
				}
			)
		})
		
		let isDownloading = false
		
		document.$on("click", ".btr-download-version", ev => {
			const button = ev.currentTarget
			
			const assetId = parseInt(button.getAttribute("btrAssetId"), 10)
			const assetVersionNumber = parseInt(button.getAttribute("btrVersion"), 10)
			
			if(!Number.isSafeInteger(assetId) || !Number.isSafeInteger(assetVersionNumber)) {
				return
			}
			
			if(isDownloading) { return }
			isDownloading = true
			
			button.$find(".btr-mui-circular-progress-root").style.display = ""
			button.$find(".btr-download-icon").style.opacity = "0"
			
			const placeNameRaw = document.title.match(/^(.*) \/ Version History$/)?.[1] ?? "place"
			const placeName = placeNameRaw.replace(/\W+/g, "-").replace(/^-+|-+$/g, "")
			
			const fileExt = document.location.href.includes("/creations/experiences/") ? "rbxl" : "rbxm"
			const fileName = `${placeName}-${assetVersionNumber}.${fileExt}`
			
			AssetCache.loadBuffer({ id: assetId, version: assetVersionNumber }, buffer => {
				const blobUrl = URL.createObjectURL(new Blob([buffer], { type: "application/octet-stream" }))
				startDownload(blobUrl, fileName)
				URL.revokeObjectURL(blobUrl)
				
				isDownloading = false
				button.$find(".btr-mui-circular-progress-root").style.display = "none"
				button.$find(".btr-download-icon").style.opacity = ""
			})
		})
	}
}
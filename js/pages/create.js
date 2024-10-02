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
			moduleHandlers: [],
			objects: {},
			
			hijackModule(handler) {
				this.moduleHandlers.push(handler)
			},
			
			addChunk(chunk) {
				for(const id of Object.keys(chunk)) {
					hijackFunction(chunk, id, (target, thisArg, args) => {
						const result = target.apply(thisArg, args)
						
						let module = args[0].exports
						if(typeof module === "object" && !this.processedModules.has(module)) {
							this.processedModules.add(module)
							
							for(const handler of this.moduleHandlers) {
								try { module = handler(module, target, objects) }
								catch(ex) { console.error(ex) }
							}
							
							args[0].exports = module
						}
						
						return result
					})
				}
			},
			
			init() {
				BTRoblox.onSet(window, "webpackChunk_N_E", chunks => {
					const override = pushfn => new Proxy(pushfn, {
						apply: (target, thisArg, args) => {
							for(const chunk of args) {
								try { this.addChunk(chunk[1]) }
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
						try { this.addChunk(chunk[1]) }
						catch(ex) { console.error(ex) }
					}
				})
			}
		}
		
		BTRoblox.webpackHook = webpackHook
		
		//
		
		const objects = {}
		webpackHook.objects = objects
		
		let hijackedProperties
		const hijackProperty = (key, fn) => {
			if(Array.isArray(key)) {
				for(const subkey of key) {
					hijackProperty(subkey, obj => {
						for(const subkey of key) {
							if(!Object.hasOwn(obj, subkey)) {
								return
							}
						}
						
						fn(obj)
					})
				}
				
				return
			}
			
			Object.defineProperty(Object.prototype, key, {
				configurable: true,
				set(value) {
					Object.defineProperty(this, key, {
						configurable: true,
						enumerable: true,
						writable: true,
						value: value
					})
					
					fn(this, value)
				}
			})
			
			if(!hijackedProperties) {
				hijackedProperties = new Map()
				
				Object.defineProperty = new Proxy(Object.defineProperty, {
					apply(target, thisArg, args) {
						const result = target.apply(thisArg, args)
						
						const handlers = hijackedProperties.get(args[1])
						if(handlers) {
							for(const handler of handlers) {
								try { handler(args[0], args[1]) }
								catch(ex) { console.error(ex) }
							}
						}
						
						return result
					}
				})
			}
			
			if(!hijackedProperties.has(key)) { hijackedProperties.set(key, []) }
			hijackedProperties.get(key).push(fn)
		}
		
		webpackHook.hijackModule(module => {
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
			
			return module
		})
		
		hijackProperty("MenuItem", obj => {
			if(!objects.Mui) {
				objects.Mui = obj
			}
		})
		
		document.addEventListener("click", ev => {
			const anchor = ev.target.nodeName === "A" ? ev.target : ev.target.closest("a")
			
			if(anchor?.classList.contains("btr-next-anchor")) {
				if(!ev.shiftKey && !ev.ctrlKey) {
					ev.preventDefault()
					objects.NextRouter.router.push(anchor.href)
				}
			}
		})
		
		webpackHook.init()
	})
	
	// Add settings
	InjectJS.inject(() => {
		const { reactHook, webpackHook } = BTRoblox
		const { objects } = webpackHook
		
		reactHook.hijackConstructor(
			(type, props) => props.MenuListProps && !props.variant,
			(target, thisArg, args) => {
				const result = target.apply(thisArg, args)
				
				if(Array.isArray(result.props.children) && reactHook.queryElement(result, x => x.props.content === "Action.LogOut", 5)) {
					result.props.children.unshift(
						objects.React.createElement(objects.Mui.MenuItem, {
							children: "BTR Settings",
							className: "btr-settings-toggle"
						})
					)
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
			
			reactHook.hijackConstructor(
				(type, props) => props.itemType && props.updateItem,
				(target, thisArg, args) => {
					const result = target.apply(thisArg, args)
					
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
							
							index = children.findIndex(x => x?.props.children === "Copy Start Place ID")
							if(index !== -1) { children[index].props.style = { display: "none" } } // HACK: Keep in dom for styling purposes
							
							index = children.findIndex(x => x?.key === "Action.OpenExperienceDetails")
							if(index !== -1) {
								const entry = children[index]
								delete entry.props.onClick
								
								children[index] = Link(`https://www.roblox.com/games/${args[0].creation.assetId}/`, entry)
							}
							
							index = children.findIndex(x => x?.key === "Configure Localization")
							if(index !== -1) {
								const entry = children[index]
								delete entry.props.onClick
								
								children[index] = Link(`/dashboard/creations/experiences/${args[0].creation.universeId}/localization`, entry)
							}
							
							index = children.findIndex(x => x?.key === "View Real Time Stats")
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
							
							index = children.findIndex(x => x?.key === "Configure Localization")
							children.splice(
								index, 0,
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
							
							index = children.findIndex(x => x?.key === "Action.CopyURL")
							if(index !== -1) { children.splice(index, 1) }
							
							index = children.findIndex(x => x?.props.children === "Copy Asset ID")
							if(index !== -1) { children.splice(index, 1) }
							
							index = children.findIndex(x => x?.props.children === "Copy Asset URI")
							if(index !== -1) { children.splice(index, 1) }
						}
					}
					
					return result
				}
			)
			
			reactHook.hijackConstructor(
				(type, props) => props.menuItems && props.setMenuOpen,
				(target, thisArg, args) => {
					const result = target.apply(thisArg, args)
					
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
				(type, props) => "version" in props && "openDialog" in props,
				(target, thisArg, args) => {
					const result = target.apply(thisArg, args)
					
					if(result?.props["data-testid"]?.startsWith("version-history")) {
						const version = args[0].version
						const right = result.props.children[3]
						
						if(!Array.isArray(right.props.children)) {
							right.props.children = [right.props.children]
						}
						
						right.props.children.unshift(
							objects.React.createElement(objects.Mui.Button, {
								className: "btr-download-version",
								btrVersion: version.assetVersionNumber,
								btrAssetId: version.assetId,
								size: "small",
								color: "secondary",
								children: [
									objects.React.createElement("span", {
										className: "btr-mui-circular-progress-root",
										style: {
											width: "20px",
											height: "20px",
											position: "absolute",
											left: "7px",
											display: "none"
										},
										children: objects.React.createElement("svg", {
											className: "btr-mui-circular-progress-svg",
											focusable: false,
											viewBox: "22 22 44 44",
											children: objects.React.createElement("circle", {
												className: "btr-mui-circular-progress",
												"stroke-width": 3.6,
												fill: "none",
												cx: 44,
												cy: 44,
												r: 20.2
											})
										})
									}),
									objects.React.createElement("svg", {
										className: "MuiSvgIcon-root btr-download-icon",
										focusable: false,
										viewBox: "0 0 24 24",
										style: {
											height: "19px",
											"margin-right": "5px",
											fill: "currentcolor"
										},
										children: objects.React.createElement("path", {
											d: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"
										})
									}),
									" ", "Download",,
								]
							})
						)
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
			const fileName = `${placeName}-${assetVersionNumber}.rbxl`
			
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
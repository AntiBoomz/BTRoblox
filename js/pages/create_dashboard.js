"use strict"

pageInit.create_dashboard = () => {
	if(!SETTINGS.get("create.enabled")) {
		return
	}
	
	// Adjust options menu items
	if(SETTINGS.get("create.assetOptions")) {
		injectScript.call("createAssetOptions", () => {
			const { webpackHook } = BTRoblox
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
								let index = children.findIndex(x => x?.props?.onClick && reactHook.queryElement(x, x => x?.props?.itemKey === "Action.CopyURL"))
								if(index !== -1) { children.splice(index, 1) }
								
								index = children.findIndex(x => x?.key === "Action.OpenInNewTab")
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
		injectScript.call("createDownloadVersion", () => {
			const { webpackHook } = BTRoblox
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
"use strict"

let ContextMenu

if(IS_BACKGROUND_PAGE) {
	ContextMenu = {
		items: [
			{
				id: "copyParent",
				title: "Copy...",
				contexts: ["link"],
				disabledByDefault: true,
				isParent: true
			},
			{
				id: "assetLink",
				title: "Copy asset id",
				contexts: ["link"],
				targetUrlPatterns: [
					"*://*.roblox.com/*-item?*id=*",
					"*://*.roblox.com/catalog/*",
					"*://*.roblox.com/library/*",
					"*://*.roblox.com/My/Item.aspx*ID=*",
					"*://create.roblox.com/dashboard/creations/catalog/*",
					"*://create.roblox.com/dashboard/creations/marketplace/*",
					"*://create.roblox.com/dashboard/creations/store/*",
					"*://create.roblox.com/marketplace/asset/*",
					"*://create.roblox.com/store/asset/*",
				]
			},
			{
				id: "bundleLink",
				title: "Copy bundle id",
				contexts: ["link"],
				targetUrlPatterns: [
					"*://*.roblox.com/bundles/*/*"
				]
			},
			{
				id: "badgeLink",
				title: "Copy badge id",
				contexts: ["link"],
				targetUrlPatterns: [
					"*://*.roblox.com/badges/*/*"
				]
			},
			{
				id: "pluginLink",
				title: "Copy plugin id",
				contexts: ["link"],
				targetUrlPatterns: [
					"*://*.roblox.com/plugins/*/*"
				]
			},
			{
				id: "gamepassLink",
				title: "Copy game pass id",
				contexts: ["link"],
				targetUrlPatterns: [
					"*://*.roblox.com/game-pass/*/*"
				]
			},
			{
				id: "groupLink",
				title: "Copy group id",
				contexts: ["link"],
				targetUrlPatterns: [
					"*://*.roblox.com/*roup.aspx*gid=*",
					"*://*.roblox.com/*roups.aspx*gid=*",
					"*://*.roblox.com/groups/*/*",
					"*://*.roblox.com/communities/*/*"
				]
			},
			{
				id: "placeLink",
				title: "Copy place id",
				contexts: ["link"],
				targetUrlPatterns: [
					"*://*.roblox.com/games/*/*",
					"*://*.roblox.com/refer?*PlaceId=*",
					"*://*.roblox.com/games/refer?*PlaceId=*",
					"*://create.roblox.com/dashboard/creations/experiences/*/places/*"
				]
			},
			{
				id: "universeLink",
				title: "Copy game id",
				contexts: ["link"],
				targetUrlPatterns: [
					"*://*.roblox.com/universes/*id=*",
					"*://create.roblox.com/dashboard/creations/experiences/*/overview"
				]
			},
			{
				id: "userLink",
				title: "Copy user id",
				contexts: ["link"],
				targetUrlPatterns: [
					"*://*.roblox.com/users/*/*"
				]
			},
			
			{
				id: "instanceId",
				title: "Copy instance id",
				contexts: ["link"],
				disabledByDefault: true
			},
			
			{
				id: "roleParent",
				title: "Copy role...",
				contexts: ["link"],
				disabledByDefault: true,
				isParent: true
			},
			{
				id: "roleRank",
				title: "Copy role rank",
				contexts: ["link"],
				disabledByDefault: true
			},
			{
				id: "roleId",
				title: "Copy role id",
				contexts: ["link"],
				disabledByDefault: true
			}
		],
		
		onClick(info, tab) {
			const copyToClipboard = async text => {
				if(navigator.clipboard?.writeText) {
					navigator.clipboard.writeText(text)
				} else {
					chrome.scripting.executeScript({
						target: { tabId: tab.id, frameIds: [info.frameId] },
						func: text => navigator.clipboard.writeText(text),
						args: [text]
					})
				}
			}
			
			const linkUrl = info.linkUrl ?? info.pageUrl
			
			let menuId = info.menuItemId
			let data = null
			
			if(info.menuItemId.startsWith("custom!")) {
				const [_, _menuId, _data] = info.menuItemId.match(/^custom!([^!]+)!(.*)$/)
				menuId = _menuId
				data = JSON.parse(_data)
			}
			
			switch(menuId.replace(/_page$/, "")) {
				case "assetLink": case "bundleLink": case "badgeLink": case "gamepassLink": case "pluginLink": {
					const assetId = data ?? linkUrl.replace(/^.*(?:[&?]id=|\/(?:catalog|library|bundles|badges|game-pass|plugins|places|marketplace(?:\/asset)?|store(?:\/asset)?)\/(?:refer\/)?)(\d+).*$/i, "$1")
					copyToClipboard(assetId)
					break
				}
				case "placeLink": {
					const placeId = data ?? linkUrl.replace(/^.*(?:[&?]placeid=|\/games\/|\/places\/)(\d+).*$/i, "$1")
					copyToClipboard(placeId)
					break
				}
				case "userLink": {
					const userId = data ?? linkUrl.replace(/^.*(?:\/users\/)(\d+).*$/i, "$1")
					copyToClipboard(userId)
					break
				}
				case "groupLink": {
					const groupId = data ?? linkUrl.replace(/^.*(?:groups?.aspx.*[?&]gid=|\/groups\/|\/communities\/)(\d+).*$/i, "$1")
					copyToClipboard(groupId)
					break
				}
				case "universeLink": {
					const universeId = data ?? linkUrl.replace(/^.*(?:[&?]id=|\/experiences\/)(\d+).*$/i, "$1")
					copyToClipboard(universeId)
					break
				}
				case "roleId": case "roleRank": case "instanceId": {
					copyToClipboard(data)
					break
				}
			}
		},
		
		apply() {
			if(!this.applying) {
				this.applying = true
				
				chrome.contextMenus.removeAll(() => {
					this.applying = false
					
					if(this._lastEnabledItems) {
						for(const params of this._lastEnabledItems) {
							chrome.contextMenus.create(params)
						}
					}
				})
			}
		},
		
		update() {
			if(this.updating) { return }
			this.updating = true
			
			setTimeout(() => {
				SETTINGS.load(() => {
					this.updating = false
					
					if(!SETTINGS.get("general.enableContextMenus")) {
						delete this._lastEnabledItems
						this.apply()
						return
					}
					
					// Figure out which entries to enable
					
					const enabledItemsById = {}
					const enabledItems = []
					
					for(const menu of this.items) {
						const params = { ...menu, menu: menu }
						
						delete params.disabledByDefault
						delete params.isParent
						
						let enabled = !menu.disabledByDefault
						
						if(this.customContextMenuItems) {
							const value = this.customContextMenuItems.items[menu.id]
							
							if(value !== null && value !== undefined && value !== false) {
								if(!menu.isParent) {
									params.id = `custom!${menu.id}!${JSON.stringify(value)}`
								}
								
								delete params.documentUrlPatterns
								delete params.targetUrlPatterns
								
								enabled = true
							} else {
								enabled = enabled && value !== false && !this.customContextMenuItems.types.includes(menu.contexts[0])
							}
						}
						
						if(!params.documentUrlPatterns) {
							if(!(params.contexts[0] === "link" && navigator.clipboard?.writeText)) {
								// We want to only show context menu stuff on roblox domains UNLESS we can use
								// navigator.clipboard.writeText to set clipboard from the background script.
								params.documentUrlPatterns = ["*://*.roblox.com/*", "*://*.rbxcdn.com/*"]
							}
						}
						
						if(enabled) {
							enabledItemsById[menu.id] = params
							enabledItems.push(params)
						}
					}
					
					for(const params of enabledItems) {
						const suffix = params.contexts[0] === "page" ? "_page" : ""
						const parent = (!params.menu.isParent && params.menu.id.startsWith("role"))
							? enabledItemsById["roleParent" + suffix]
							: enabledItemsById["copyParent" + suffix]
						
						params.parentId = (parent && parent !== params) ? parent.id : null
						delete params.menu
					}
					
					// Do not update if nothing changed
					
					const lastEnabledItems = this._lastEnabledItems
					let identical = lastEnabledItems && lastEnabledItems.length === enabledItems.length
					
					if(identical) {
						outer:
						for(let i = enabledItems.length; i--;) {
							const item = enabledItems[i]
							const lastItem = lastEnabledItems[i]
							
							for(const [key, value] of Object.entries(item)) {
								const lastValue = lastItem[key]
								
								if(Array.isArray(value) && Array.isArray(lastValue) && value.length === lastValue.length) {
									for(const [index, value2] of Object.entries(value)) {
										if(lastValue[index] !== value2) {
											identical = false
											break outer
										}
									}
								} else if(value !== lastValue) {
									identical = false
									break outer
								}
							}
						}
					}
					
					if(identical) {
						return
					}
					
					// Actually update context menus
					
					this._lastEnabledItems = enabledItems
					this.apply()
				})
			}, 0)
		}
	}

	// Add support for locale urls
	
	for(const entry of ContextMenu.items) {
		if(entry.targetUrlPatterns) {
			for(let i = entry.targetUrlPatterns.length; i--;) {
				const pattern = entry.targetUrlPatterns[i]
				const index = pattern.indexOf(".roblox.com/") + 11
				
				if(index !== -1) {
					entry.targetUrlPatterns.push(`${pattern.slice(0, index)}/*${pattern.slice(index)}`)
				}
			}
		}
	}
	
	// Add page versions for every item

	for(let i = 0, len = ContextMenu.items.length; i < len; i++) {
		const entry = ContextMenu.items[i]
		const pageEntry = { ...entry }
		
		pageEntry.documentUrlPatterns = pageEntry.targetUrlPatterns
		pageEntry.contexts = ["page"]
		pageEntry.id = pageEntry.id + "_page"
		
		delete pageEntry.targetUrlPatterns
		ContextMenu.items.push(pageEntry)
	}
	
	//

	chrome.contextMenus.onClicked.addListener((...args) => ContextMenu.onClick(...args))
	SETTINGS.onChange("general.enableContextMenus", () => ContextMenu.update())

	if(IS_CHROME) {
		chrome.runtime.onInstalled.addListener(() => ContextMenu.update())
		chrome.runtime.onStartup.addListener(() => ContextMenu.update())
	} else {
		ContextMenu.update()
	}

	MESSAGING.listen({
		setCustomContextMenuItems(items, respond, port) {
			ContextMenu.customContextMenuItems = items
			ContextMenu.update()
		}
	})
} else {
	ContextMenu = {
		customContextMenus: new WeakMap(),
		activeContextMenus: new Set(),
		
		needsUpdate: false,
		hasFocus: false,
		
		update() {
			this.needsUpdate = false
			let menuItems = null
			
			if(this.activeContextMenus.size > 0) {
				const targets = {}
				
				for(const entry of this.activeContextMenus) {
					const lastEntry = targets[entry.type]
					
					if(lastEntry && entry.element.contains(lastEntry.element)) {
						continue
					}
					
					targets[entry.type] = entry
				}
				
				menuItems = {
					types: [],
					items: {}
				}
				
				for(const entry of Object.values(targets)) {
					menuItems.types.push(entry.type)
					
					const suffix = entry.type === "page" ? "_page" : ""
					
					for(const [key, value] of Object.entries(entry.items)) {
						menuItems.items[key + suffix] = value
					}
				}
			}
			
			MESSAGING.send("setCustomContextMenuItems", menuItems)
		},
		
		onFocus() {
			if(!this.hasFocus) {
				this.hasFocus = true
				
				if(!this.needsUpdate) {
					this.needsUpdate = true
					$.setImmediate(() => this.update())
				}
			}
		},
		
		onFocusLost() {
			if(this.hasFocus) {
				this.hasFocus = false
				this.update()
			}
		},
		
		getCustomContextMenu(element) {
			return this.customContextMenus.get(element)
		},
		
		setCustomContextMenu(element, items) {
			const lastEntry = this.customContextMenus.get(element)
			const type = element.nodeName === "A" ? "link" : "page"
			
			if(lastEntry) {
				const itemsArray = Array.from(Object.entries(items))
				const lastItemsArray = Array.from(Object.entries(lastEntry.items))
				
				let identical = lastEntry.type === type && itemsArray.length === lastItemsArray.length
				
				if(identical) {
					for(let i = itemsArray.length; i--;) {
						const [lastKey, lastValue] = lastItemsArray[i]
						const [key, value] = itemsArray[i]
						
						if(lastKey !== key || lastValue !== value) {
							identical = false
							break
						}
					}
				}
				
				if(identical) {
					return
				}
				
				lastEntry.kill()
			}
			
			const entry = {
				type: type,
				element: element,
				items: items,
				
				hoverState: false,
				alive: true,
				
				onHover: () => {
					if(!entry.alive || entry.hoverState) { return }
					entry.hoverState = true
					
					ContextMenu.onFocus()
					this.activeContextMenus.add(entry)
					
					if(!this.needsUpdate) {
						this.needsUpdate = true
						$.setImmediate(() => this.update())
					}
				},
				
				onHoverEnd: () => {
					if(!entry.hoverState) { return } // intentionally not checking entry.alive
					entry.hoverState = false
					
					this.activeContextMenus.delete(entry)
					
					if(!this.needsUpdate) {
						this.needsUpdate = true
						$.setImmediate(() => this.update())
					}
				},
				
				onContextMenu: event => {
					event.stopImmediatePropagation()
				},
				
				kill: () => {
					if(entry.alive && this.customContextMenus.get(element) === entry) {
						this.customContextMenus.delete(element)
						entry.alive = false
						
						element.$off("mouseenter", entry.onHover)
						element.$off("mouseleave", entry.onHoverEnd)
						element.$off("contextmenu", entry.onContextMenu)
						
						if(entry.hoverState) {
							entry.onHoverEnd()
						}
					}
				}
			}
			
			element.$on("mouseenter", entry.onHover)
			element.$on("mouseleave", entry.onHoverEnd)
			element.$on("contextmenu", entry.onContextMenu)
			
			this.customContextMenus.set(element, entry)
			
			if(element.matches(":hover")) {
				entry.onHover()
			}
		}
	}
	
	document.documentElement.$on("mouseenter", () => ContextMenu.onFocus())
	document.documentElement.$on("mouseleave", () => ContextMenu.onFocusLost())
	
	if(document.documentElement.matches(":hover")) {
		ContextMenu.onFocus()
	}
	
	$.onDomChanged(() => {
		for(const entry of ContextMenu.activeContextMenus) {
			if(!document.documentElement.contains(entry.element)) {
				entry.kill()
			}
		}
	})
}
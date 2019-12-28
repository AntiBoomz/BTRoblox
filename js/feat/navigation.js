"use strict"

const Navigation = (() => {
	const customElements = {
		btr_Home: `<li class=cursor-pointer><a class="font-header-2 nav-menu-title text-header" href=/home>Home</a></li>`,

		btr_Friends: `
		<li id="btr-navbar-friends" class="navbar-icon-item">
			<a class="rbx-menu-item" href="/Friends.aspx">
				<span class="icon-nav-friend-btr"></span>
				<span class="btr-nav-notif rbx-text-navbar-right" style="display:none;"></span>
			</a>
		</li>`,
		btr_Messages: `
		<li id="btr-navbar-messages" class="navbar-icon-item">
			<a class="rbx-menu-item" href="/My/Messages#!/inbox">
				<span class="icon-nav-message-btr"></span>
				<span class="btr-nav-notif rbx-text-navbar-right" style="display:none;"></span>
			</a>
		</li>`,

		btr_Money: `
		<li>
			<a href="https://www.roblox.com/my/money.aspx" class="dynamic-overflow-container text-nav">
				<div><span class="icon-nav-trade"></span></div>
				<span class="font-header-2 dynamic-ellipsis-item">Money</span>
			</a>
		</li>`,
		btr_Premium: `
		<li>
			<a href=/premium/membership id=nav-premium class="dynamic-overflow-container text-nav">
				<div><span class=icon-nav-premium-btr></span></div>
				<span class="font-header-2 dynamic-ellipsis-item">Premium</span>
			</a>
		</li>`,
		btr_BlogFeed: `<li id=btr-blogfeed></li>`
	}

	const navElements = {
		topleft: [],
		topright_outer: [],
		topright: [],
		sidebar: []
	}

	const savedItems = {}
	let lastSavedItems
	let editablesLocked = true

	const navsToUpdate = new Set()
	let navUpdateTimeout

	const loadSavedItems = () => {
		const saveDataString = SETTINGS.get("navigation.itemsV2")

		if(lastSavedItems === saveDataString) {
			return
		}
		
		Object.keys(savedItems).forEach(key => delete savedItems[key])

		const saveData = saveDataString ? JSON.parse(saveDataString) : null
		if(saveData) {
			Object.entries(saveData).forEach(([key, value]) => {
				savedItems[key] = value
			})
		}

		Object.values(navElements).forEach(list => list.forEach(cont => requestNavUpdate(cont)))
	}

	const saveSavedItems = () => {
		lastSavedItems = JSON.stringify(savedItems)
		SETTINGS.set("navigation.itemsV2", lastSavedItems)
	}

	const sortContItems = cont => {
		const savedCont = savedItems[cont.type]

		cont.items.forEach(x => {
			const savedItem = savedCont ? savedCont[x.name] : null
			x.index2 = x.index + (savedItem && "offset" in savedItem ? savedItem.offset : 0)
		})

		cont.items.sort((a, b) => a.index2 - b.index2)
	}

	const requestNavUpdate = tarCont => {
		console.assert(tarCont)
		navsToUpdate.add(tarCont)

		if(navUpdateTimeout) {
			return
		}

		navUpdateTimeout = $.setImmediate(() => {
			navUpdateTimeout = null

			const navs = Array.from(navsToUpdate)
			navsToUpdate.clear()

			navs.forEach(cont => {
				const savedCont = savedItems[cont.type]
				sortContItems(cont)

				const children = cont.elem.children
				const indices = cont.items.map(x => Array.prototype.indexOf.call(children, x.elem)).sort((a, b) => a - b)

				cont.items.forEach((x, i) => {
					const target = children[indices[i]]

					if(target !== x.elem) {
						const prevSib = x.elem.previousElementSibling
						target.before(x.elem)
						
						if(prevSib) {
							prevSib.after(target)
						} else {
							target.parentNode.prepend(target)
						}
					}

					const savedItem = savedCont ? savedCont[x.name] : null
					const isVisible = savedItem && "visible" in savedItem ? savedItem.visible : !x.defaultDisabled

					if(x.visible !== isVisible) {
						x.visible = isVisible

						x.elem.classList.toggle("btr-nav-disabled", !x.visible)
				
						if(x.children) {
							x.children.forEach(child => child.classList.toggle("btr-nav-disabled", !x.visible))
						}
					}
				})

				cont.items.forEach(x => {
					let prev = x.elem

					x.children.forEach(child => {
						prev.after(child)
						prev = child
					})
				})
			})
		})
	}
	
	const addEditable = (elem, type) => {
		const cont = {
			elem,
			type,
			items: []
		}

		const set = new WeakSet()
		navElements[type].push(cont)

		let numRbxItems = 0
		let numCustoms = 0

		const addChild = child => {
			if(set.has(child) || child.matches(".btr-naveditor-item")) {
				return
			}

			set.add(child)

			if(child.classList.contains("rbx-nav-sponsor")) {
				let parent
				
				for(let i = cont.items.length; i--;) {
					const prev = cont.items[i]
					if(prev.builtin) {
						parent = prev
						break
					}
				}

				if(parent) {
					parent.children.push(child)
					
					const prev = parent.children[parent.children.length - 1] || parent.elem
					prev.after(child)

					if(!parent.visible) {
						child.classList.toggle("btr-nav-disabled", !parent.visible)
					}
				}

				return
			}

			const index = numRbxItems++

			const item = {
				elem: child,
				children: [],

				name: "rbx_" + index,
				index,

				builtin: true
			}

			cont.items.push(item)

			if(!editablesLocked) {
				unlockItem(item, cont)
			}

			requestNavUpdate(cont)
		}

		const addCustom = (name, after) => {
			const btn = html(customElements[name])
			set.add(btn)

			const afterItem = after ? cont.items.find(x => x.elem === after) : null

			const item = {
				elem: btn,
				children: [],

				name,
				index: (afterItem ? afterItem.index : -1) + (++numCustoms) * 0.01,

				visible: true
			}


			cont.items.push(item)
			elem.append(btn)

			if(!editablesLocked) {
				unlockItem(item, cont)
			}

			requestNavUpdate(cont)
		}

		const hideNavItem = target => {
			const item = cont.items.find(x => x.elem === target)
			if(item) {
				item.defaultDisabled = true
				requestNavUpdate(cont)
			}
		}

		elem.$watchAll("*", child => addChild(child))

		if(type === "topleft") {
			addCustom("btr_Home", null)

			elem.$watch(".buy-robux", target => hideNavItem(target.parentNode))

		} else if(type === "topright") {
			elem.$watch("#navbar-robux", robux => {
				addCustom("btr_Friends", robux)
				addCustom("btr_Messages", robux)
			})

		} else if(type === "topright_outer") {
			elem.$watch(".age-bracket-label", target => hideNavItem(target))

		} else if(type === "sidebar") {
			elem.$watch("#nav-blog", link => {
				const blog = link.parentNode
				addCustom("btr_Premium", blog.previousElementSibling)
				addCustom("btr_BlogFeed", blog)
			})
				.$watch("#nav-trade", trade => {
					hideNavItem(trade.parentNode)
					addCustom("btr_Money", trade.parentNode)
				})
				.$watch(".rbx-upgrade-now", target => hideNavItem(target))
				.$watch("#nav-message", target => hideNavItem(target.parentNode))
				.$watch("#nav-friends", target => hideNavItem(target.parentNode))
		}
	}

	const unlockItem = (item, cont) => {
		const tar = item.elem

		if(tar.classList.contains("navbar-right")) {
			// Not draggable
		} else {
			tar.classList.add("btr-naveditor-item-parent")

			const btn = html`<div class=btr-naveditor-item draggable=true></div>`
			tar.append(btn)
			
			let lastClick
			btn.$on("click", ev => {
				ev.preventDefault()
				ev.stopPropagation()

				if(lastClick && (Date.now() - lastClick) < 500) {
					lastClick = null

					const savedCont = savedItems[cont.type] = savedItems[cont.type] || {}
					const savedItem = savedCont[item.name] = savedCont[item.name] || {}
					savedItem.visible = !item.visible

					if(savedItem.visible === !item.defaultDisabled) {
						delete savedItem.visible
					}

					requestNavUpdate(cont)
					saveSavedItems()
				} else {
					lastClick = Date.now()
				}
			}).$on("dragstart", ev => {
				ev.dataTransfer.dropEffect = "move"
				cont.dragging = item
			}).$on("dragend", () => {
				cont.dragging = null
			})
		}
	}

	const lockItem = item => {
		const tar = item.elem

		tar.classList.remove("btr-naveditor-item-parent")
		const btn = tar.$find(".btr-naveditor-item")
		if(btn) {
			btn.remove()
		}
	}

	const checkBounds = (cont, i0, i1, mx, my) => {
		const item0 = cont.items[i0]
		const item1 = cont.items[i1]
		
		if(!item0 || !item1) {
			return false
		}

		const mrect = item0.elem.getBoundingClientRect()
		const crect = item1.elem.getBoundingClientRect()

		return (crect.right <= mrect.left && mx <= crect.left + Math.min(crect.width, mrect.width))
			|| (crect.left >= mrect.right && mx >= crect.right - Math.min(crect.width, mrect.width))
			|| (crect.bottom <= mrect.top && my <= crect.top + Math.min(crect.height, mrect.height))
			|| (crect.top >= mrect.bottom && my >= crect.bottom - Math.min(crect.height, mrect.height))
	}

	const unlockEditables = () => {
		editablesLocked = false

		document.documentElement.classList.add("btr-naveditor-open")

		Object.values(navElements).forEach(list => {
			list.forEach(cont => {
				cont.elem.classList.add("btr-naveditor-cont")

				cont.elem
					.$on("dragover.btr-naveditor", ev => {
						const target = cont.dragging

						if(!target) {
							return
						}

						ev.preventDefault()
						ev.dataTransfer.dropEffect = "move"

						const savedCont = savedItems[cont.type] || {}
						const savedItem = savedCont[target.name] || { offset: 0 }

						sortContItems(cont)
						const myIndex = cont.items.indexOf(target)
						let targetIndex = myIndex

						while(checkBounds(cont, myIndex, targetIndex - 1, ev.clientX, ev.clientY)) {
							targetIndex--

							savedItem.offset = (savedItem.offset || 0) - 1
						}

						while(checkBounds(cont, myIndex, targetIndex + 1, ev.clientX, ev.clientY)) {
							targetIndex++

							savedItem.offset = (savedItem.offset || 0) + 1
						}

						if(targetIndex !== myIndex) {
							savedItems[cont.type] = savedCont
							savedCont[target.name] = savedItem

							if(savedItem.offset === 0) {
								delete savedItem.offset
							}

							requestNavUpdate(cont)
							saveSavedItems()
						}
					})
					.$on("drop.btr-naveditor", ev => {
						ev.preventDefault()
					})
				
				cont.items.forEach(y => unlockItem(y, cont))
			})
		})

		initBlogFeed()
	}

	const lockEditables = () => {
		editablesLocked = true

		document.documentElement.classList.remove("btr-naveditor-open")

		Object.values(navElements).forEach(list => {
			list.forEach(cont => {
				cont.elem.classList.remove("btr-naveditor-cont")

				cont.elem.$off("dragover.btr-naveditor").$off("drop.btr-naveditor")
				cont.items.forEach(y => lockItem(y, cont))
			})
		})
	}

	let isBlogFeedInitialized = false
	const initBlogFeed = () => {
		if(isBlogFeedInitialized) { return }

		const blogfeed = $("#btr-blogfeed")
		if(!blogfeed || (blogfeed.classList.contains("btr-nav-disabled") && editablesLocked)) {
			return
		}

		isBlogFeedInitialized = true

		const update = data => {
			blogfeed.$findAll(">.btr-feed").forEach(x => x.remove())

			data.forEach(item => {
				blogfeed.append(html`
				<a class="btr-feed" href="${item.url}">
					<div class="btr-feedtitle">
						${item.title.trim() + " "}
						<span class="btr-feeddate">(${$.dateSince(item.date)} ago)</span>
					</div>
					<div class="btr-feeddesc">${item.desc}</div>
				</a>`)
			})
		}

		MESSAGING.send("requestBlogFeed", update)
		STORAGE.get(["cachedBlogFeedV2"], data => {
			if(data.cachedBlogFeedV2) {
				update(data.cachedBlogFeedV2)
			}
		})
	}

	const initNavigation = () => {
		const headerWatcher = document.$watch("#header").$then().$watch(">div").$then()
		
		headerWatcher.$watch("#navbar-setting").$then()
			.$watch(".rbx-popover-content > ul", list => {
				list.prepend(html`<li><a class="rbx-menu-item btr-settings-toggle">BTR Settings</a></li>`)
			})

		if(settings.general.robuxToUSD) {
			headerWatcher.$watch("#nav-robux-balance", bal => {
				const btn = html`
				<li><a href=/develop/developer-exchange class=rbx-menu-item></a></li>`
	
				const update = () => {
					const matches = bal.textContent.trim().match(/^([\d,]+)\sRobux$/)
					if(!matches) { return }
					const amt = parseInt(matches[0].replace(/,/g, ""), 10)
	
					if(!Number.isSafeInteger(amt)) { return }
					btn.firstChild.textContent = `$${RobuxToUSD(amt)} USD`
					bal.parentNode.after(btn)
				}
	
				const observer = new MutationObserver(update)
				observer.observe(bal, { childList: true })
				update()
			})
		}

		if(!settings.navigation.enabled) {
			return
		}

		loadSavedItems()
		SETTINGS.onChange("navigation.itemsV2", loadSavedItems)

		document
			.$watch("#nav-home", x => addEditable(x.closest("ul"), "sidebar"))
			.$watch("#btr-blogfeed", () => initBlogFeed())
			.$watch(["#nav-friends", "#nav-message", "#btr-navbar-friends", "#btr-navbar-messages"], (navFriends, navMessages, btrFriends, btrMessages) => {
				const updateFriends = () => {
					const notif = btrFriends.$find(".btr-nav-notif")
					const count = navFriends.dataset.count
	
					btrFriends.$find("a").href = navFriends.href
					notif.textContent = count
					notif.style.display = count > 0 ? "" : "none"
				}
	
				const updateMessages = () => {
					const notif = btrMessages.$find(".btr-nav-notif")
					const count = navMessages.dataset.count
	
					btrMessages.$find("a").href = navMessages.href
					notif.textContent = count
					notif.style.display = count > 0 ? "" : "none"
				}
	
				new MutationObserver(updateFriends).observe(navFriends, { attributes: true, attributeFilter: ["href", "data-count"] })
				new MutationObserver(updateMessages).observe(navMessages, { attributes: true, attributeFilter: ["href", "data-count"] })
	
				updateFriends()
				updateMessages()
			})

		headerWatcher
			.$watchAll(".rbx-navbar", x => addEditable(x, "topleft"))
			.$watch(".rbx-navbar-right", x => addEditable(x, "topright_outer")).$then()
				.$watch(".navbar-right", x => addEditable(x, "topright"))
	}
	
	return {
		init: initNavigation,

		unlock: unlockEditables,
		lock: lockEditables
	}
})()
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

		let saveData
		try { saveData = saveDataString ? JSON.parse(saveDataString) : null }
		catch(ex) { }
		
		if(saveData) {
			Object.entries(saveData).forEach(([key, savedCont]) => {
				if(!(savedCont instanceof Object) || !navElements[key]) {
					return
				}

				const loadedCont = savedItems[key] = {}

				Object.entries(savedCont).forEach(([name, savedItem]) => {
					if(!(savedItem instanceof Object)) {
						return
					}
					
					loadedCont[name] = savedItem
				})
			})
		}

		Object.values(navElements).forEach(list => list.forEach(cont => requestNavUpdate(cont)))
	}

	const saveSavedItems = () => {
		const saveData = JSON.stringify(savedItems)

		if(lastSavedItems === saveData) {
			return
		}

		SETTINGS.set("navigation.itemsV2", saveData)
		lastSavedItems = saveData
	}

	const sortContItems = cont => {
		const savedCont = savedItems[cont.type]

		cont.items.forEach((x, i) => {
			const savedItem = savedCont ? savedCont[x.name] : null

			x.index = i
			x.index2 = i + (savedItem && "offset" in savedItem ? savedItem.offset : 0)
		})

		return cont.items.slice().sort((a, b) => a.index2 - b.index2)
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
				const sortedItems = sortContItems(cont)

				const children = cont.elem.children
				const indices = sortedItems.map(x => Array.prototype.indexOf.call(children, x.elem)).sort((a, b) => a - b)

				const useOrder = cont.type === "topleft"

				sortedItems.forEach((x, i) => {
					if(useOrder) {
						x.elem.style.order = i
					} else {
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
					}

					const savedItem = savedCont ? savedCont[x.name] : null
					const isVisible = savedItem && "visible" in savedItem ? savedItem.visible : !x.defaultDisabled

					x.visible = isVisible
					x.elem.classList.toggle("btr-nav-disabled", !x.visible)
			
					if(x.children) {
						x.children.forEach(child => child.classList.toggle("btr-nav-disabled", !x.visible))
					}
				})

				sortedItems.forEach(x => {
					if(useOrder) {
						x.children.forEach((child, i) => {
							child.style.order = (+x.elem.style.order) + (i + 1) / 100
						})
					} else {
						let prev = x.elem

						x.children.forEach(child => {
							prev.after(child)
							prev = child
						})
					}
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

		const origItems = []

		const addChild = child => {
			if(set.has(child) || child.matches(".btr-naveditor-item,.btr-ignore")) {
				return
			}

			set.add(child)

			if(child.classList.contains("rbx-nav-sponsor")) {
				const parent = origItems[origItems.length - 1]

				if(parent) {
					parent.children.push(child)
					requestNavUpdate(cont)
				}

				return
			}

			const item = {
				elem: child,
				children: []
			}

			let customName

			if(type === "topright") {
				if(child.id === "navbar-rplus") {
					customName = "RPlus"
				}
			} else if(type === "sidebar") {
				if(child.$find(".rplus-icon")) {
					customName = "RPlus_ControlPanel"
				}
			}

			if(customName) {
				let target = child.previousElementSibling
				let index = -1

				while(target && index === -1) {
					index = cont.items.findIndex(x => x.elem === target)
					target = target.previousElementSibling
				}

				child.name = customName
				cont.items.splice(index + 1, 0, item)
			} else {
				item.name = `rbx_${origItems.length}`
				cont.items.push(item)

				origItems.push(item)
			}

			if(!editablesLocked) {
				unlockItem(item, cont)
			}

			requestNavUpdate(cont)
		}

		const addCustom = (name, after, defaultDisabled) => {
			const btn = html(customElements[name])
			set.add(btn)

			const item = {
				elem: btn,
				children: [],
				defaultDisabled: defaultDisabled === true,

				name
			}

			const index = after ? cont.items.findIndex(x => x.elem === after) : -1
			if(index === -1) {
				cont.items.unshift(item)
			} else {
				cont.items.splice(index + 1, 0, item)
			}

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
					// hideNavItem(trade.parentNode)
					addCustom("btr_Money", trade.parentNode, true)
				})
				.$watch(".rbx-upgrade-now", target => hideNavItem(target))
				.$watch("#nav-home", target => hideNavItem(target.parentNode))
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
			}).$on("dragenter", ev => {
				ev.preventDefault()
				ev.stopPropagation()
			}).$on("dragstart", ev => {
				ev.dataTransfer.dropEffect = "move"
				cont.dragging = item

				ev.stopPropagation()
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

	const checkBounds = (item0, item1, mx, my) => {
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

						const sortedItems = sortContItems(cont)
						const myIndex = sortedItems.indexOf(target)
						let targetIndex = myIndex

						while(checkBounds(target, sortedItems[targetIndex - 1], ev.clientX, ev.clientY)) {
							targetIndex--
						}

						while(checkBounds(target, sortedItems[targetIndex + 1], ev.clientX, ev.clientY)) {
							targetIndex++
						}

						if(targetIndex !== myIndex) {
							const savedCont = savedItems[cont.type] = savedItems[cont.type] || {}
							savedCont[target.name] = savedCont[target.name] || { offset: 0 }

							const other = sortedItems[targetIndex]

							const wantedIndex = other.index2 + (targetIndex > myIndex ? 1e-5 : -1e-5)
							const btnIndex = Math.floor(wantedIndex)
							const btns = sortedItems.filter(x => x !== target && x.index2 !== x.index && Math.floor(x.index2) === btnIndex)

							const otherIndex = btns.indexOf(other)
							if(otherIndex === -1) {
								btns.push(target)
							} else {
								btns.splice(wantedIndex > other.index2 ? otherIndex + 1 : otherIndex, 0, target)
							}

							btns.forEach((x, i) => {
								if(i === 0 && btnIndex === x.index) {
									delete savedCont[x.name]
								} else {
									const finalIndex = btnIndex + (i + 1) / (btns.length + 1)
									savedCont[x.name].offset = finalIndex - x.index
								}
							})

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

		//

		const wrapper = html`<div class=btr-header-flex></div>`

		headerWatcher
			.$then(header => {
				header.classList.add("btr-custom-header")
				header.prepend(wrapper)
			})
			.$watchAll("*", child => {
				if(child === wrapper || child.matches(`.rbx-navbar.hidden-md`)) {
					return
				}

				wrapper.append(child)
			})
		
		//

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
			.$watch("#navbar-rplus", () => {
				$.all(".rbx-navbar").forEach(bar => {
					for(let i = 5; i--;) {
						bar.prepend(html`<li class=btr-ignore style=display:none><a></a></li>`)
					}
				})
			})

		headerWatcher
			.$watch(".rbx-navbar.hidden-sm", x => addEditable(x, "topleft"))
			.$watch(".rbx-navbar.hidden-md", x => addEditable(x, "topleft"))
			.$watch(".rbx-navbar-right", x => addEditable(x, "topright_outer")).$then()
				.$watch(".navbar-right", x => addEditable(x, "topright"))
	}
	
	return {
		init: initNavigation,

		unlock: unlockEditables,
		lock: lockEditables
	}
})()
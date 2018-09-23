"use strict"

const Navigation = (() => {
	const defaultItems = {
		topleft: ["bi_Home", "Games", "Catalog", "Create", "-Robux"],
		topright: ["Settings", "Robux", "bi_Friends", "bi_Messages", "Stream"]
	}

	const buttonElements = {
		topleft: {
			bi_Home: htmlstring`<li><a class=nav-menu-title href=/home>Home</a></li>`
		},
		topright: {
			bi_Friends: html`
			<li id="btr-navbar-friends" class="navbar-icon-item">
				<a class="rbx-menu-item" href="/Friends.aspx">
					<span class="icon-nav-friend-btr"></span>
					<span class="btr-nav-notif rbx-text-navbar-right" style="display:none;"></span>
				</a>
			</li>`,
			bi_Messages: html`
			<li id="btr-navbar-messages" class="navbar-icon-item">
				<a class="rbx-menu-item" href="/My/Messages#!/inbox">
					<span class="icon-nav-message-btr"></span>
					<span class="btr-nav-notif rbx-text-navbar-right" style="display:none;"></span>
				</a>
			</li>`
		}
	}

	const topLeftBars = []
	let rplusCompatMode = false
	let isEnabled = false
	let topRightBar
	let savedItems

	const saveSavedItems = () => {
		MESSAGING.send("setSetting", {
			path: "navigation.items",
			value: JSON.stringify(savedItems)
		})
	}

	const updateTopLeft = () => {
		topLeftBars.forEach(self => {
			let count = 0
			let prev

			savedItems.topleft.forEach(x => {
				const rem = x[0] === "-"
				const item = self.items[rem ? x.slice(1) : x]
	
				if(item) {
					if(rem) {
						if(item.parentNode === self.elem) {
							item.remove()
						}
					} else {
						if(prev) {
							prev.after(item)
						} else {
							self.elem.prepend(item)
						}
	
						prev = item
						count++
					}
				}
			})
			
			if(rplusCompatMode) {
				self.elem.querySelectorAll(".btr-fake-btn").forEach(x => x.remove())
				const btn = self.elem.children[3]
				if(btn) {
					for(let i = 0; i < 5; i++) {
						btn.before(html`<li class=btr-fake-btn style=display:none><a class=nav-menu-title href=/asd>asd</a></li>`)
					}
				}
			}

			let after = prev ? prev.nextElementSibling : self.elem.children[0]
			while(after) {
				const elem = after
				const name = self.registered.get(elem)

				after = elem.nextElementSibling

				if(name && !elem.classList.contains(".btr-fake-btn")) {
					if(!self.defaults[name]) {
						elem.remove()
					} else {
						count++
					}
				}
			}

			const itemWidthClass = `btr-navbar-${Math.max(1, count)}`
			if(self.lastWidthClass !== itemWidthClass) {
				if(self.lastWidthClass) {
					self.elem.classList.remove(self.lastWidthClass)
				}

				self.lastWidthClass = itemWidthClass
				self.elem.classList.add(itemWidthClass)
			}
		})
	}

	let topleftUpdateImmediate
	const requestTopLeftUpdate = () => {
		if(!isEnabled) { return }
		$.clearImmediate(topleftUpdateImmediate)
		topleftUpdateImmediate = $.setImmediate(updateTopLeft)
	}

	const updateTopRight = () => {
		const self = topRightBar

		savedItems.topright.forEach(x => {
			const rem = x[0] === "-"
			const item = self.items[rem ? x.slice(1) : x]

			if(item) {
				if(rem) {
					if(item.parentNode === self.elem) {
						item.remove()
					}
				} else {
					self.elem.append(item)
				}
			}
		})

		Object.entries(self.items).forEach(([name, item]) => {
			if(item.parentNode === self.elem && !self.defaults[name] && !savedItems.topright.includes(name)) {
				item.remove()
			}
		})
	}

	let toprightUpdateImmediate
	const requestTopRightUpdate = () => {
		if(!isEnabled) { return }

		$.clearImmediate(toprightUpdateImmediate)
		toprightUpdateImmediate = $.setImmediate(updateTopRight)
	}

	const initNavigation = () => {
		isEnabled = settings.navigation.enabled
		savedItems = settings.navigation.items && JSON.parse(settings.navigation.items) || {}

		if(!savedItems.topleft) { savedItems.topleft = defaultItems.topleft }
		if(!savedItems.topleftCustom) { savedItems.topleftCustom = {} }
		if(!savedItems.topright) { savedItems.topright = defaultItems.topright }


		const headerWatcher = document.$watch("#header > .container-fluid").$then()

		headerWatcher.$watchAll(".rbx-navbar", bar => {
			const self = { elem: bar }
			const registered = self.registered = new Map()
			const items = self.items = {}
			const defaults = self.defaults = {}

			topLeftBars.push(self)

			Object.entries(buttonElements.topleft).forEach(([name, data]) => {
				const elem = items[name] = html(data)
				registered.set(elem, name)
			})

			Object.entries(savedItems.topleftCustom).forEach(([text, url]) => {
				const name = `cu_${text}`
				const elem = items[name] = html`
				<li><a class=nav-menu-title href="${url}">${text}</a></li>`
				registered.set(elem, name)
			})

			bar.$watchAll("li", async li => {
				if(registered.get(li) || li.classList.contains("btr-fake-btn")) { return }
				const anchor = await li.$watch("a").$promise()
				const text = anchor.textContent.trim()

				registered.set(li, text)
				items[text] = li
				defaults[text] = true

				requestTopLeftUpdate()
			})
		})

		headerWatcher.$watch("ul.navbar-right", bar => {
			const self = topRightBar = { elem: bar }
			const items = self.items = {}
			const defaults = self.defaults = {}
			const registered = self.registered = new WeakMap()

			Object.entries(buttonElements.topright).forEach(([name, data]) => {
				items[name] = data
				registered.set(data, name)
			})

			bar.$watchAll("li", li => {
				if(registered.get(li)) { return }
				let name

				if(li.id === "navbar-setting") { name = "Settings" }
				else if(li.id === "navbar-robux") { name = "Robux" }
				else if(li.id === "navbar-rplus") { name = "RPlus" }
				else if(li.classList.contains("navbar-stream")) { name = "Stream" }
				else { return }

				items[name] = li
				defaults[name] = li
				registered.set(li, name)

				requestTopRightUpdate()
			})
		})


		headerWatcher.$watch("#navbar-setting").$then().$watch(".rbx-popover-content > ul", list => {
			list.prepend(html`<li><a class="rbx-menu-item btr-settings-toggle">BTR Settings</a></li>`)
		})

		if(settings.general.robuxToDollars) {
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


		if(!isEnabled) { return }

			
		// Roblox+ compatibility
		headerWatcher.$watch("#navbar-rplus", () => {
			rplusCompatMode = true
			requestTopLeftUpdate()
		})

		
		const navWatcher = document.$watch("#navigation").$then()

		
		const showBlogFeed = true
		const blogfeed = html`<div id=btr-blogfeed>Blog feed enabled</div>`
		if(showBlogFeed) {
			const updateBlogFeed = data => {
				blogfeed.$empty()

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

				blogfeed.style.display = ""
			}

			MESSAGING.send("requestBlogFeed", updateBlogFeed)

			if(blogFeedData) {
				try { updateBlogFeed(blogFeedData) }
				catch(ex) { console.error(ex) }
			}
		}
		
		navWatcher
			.$watch("#nav-home", home => home.parentNode.remove())
			.$watch(".rbx-upgrade-now", upgradeNow => upgradeNow.remove())
			.$watch("#nav-blog", blog => {
				blog.parentNode.before(html`
				<li>
					<a href=/premium/membership id=nav-bc class=font-gray-1>
						<span class=icon-nav-bc-btr></span>
						<span>Builders Club</span>
					</a>
				</li>`)
	
				if(showBlogFeed) { blog.after(blogfeed) }
			})
			.$watch("#nav-trade", trade => {
				trade.href = "/my/money.aspx"
				const label = trade.$find("span:not([class^='icon-nav'])")
				if(label) { label.textContent = "Money" }
			})
			.$watch(["#nav-friends", "#nav-message"], (navFriends, navMessages) => {
				navMessages.style.display = "none"

				const friends = buttonElements.topright.bi_Friends
				const messages = buttonElements.topright.bi_Messages
	
				const updateFriends = () => {
					const notif = friends.$find(".btr-nav-notif")
					const count = navFriends.dataset.count
	
					friends.$find("a").href = navFriends.href
					notif.textContent = count
					notif.style.display = count > 0 ? "" : "none"
				}
	
				const updateMessages = () => {
					const notif = messages.$find(".btr-nav-notif")
					const count = navMessages.dataset.count
	
					messages.$find("a").href = navMessages.href
					notif.textContent = count
					notif.style.display = count > 0 ? "" : "none"
				}
	
				new MutationObserver(updateFriends).observe(navFriends, { attributes: true, attributeFilter: ["href", "data-count"] })
				new MutationObserver(updateMessages).observe(navMessages, { attributes: true, attributeFilter: ["href", "data-count"] })
	
				updateFriends()
				updateMessages()
			})
	}
	
	return {
		init: initNavigation,
		topleft: {
			getAll() {
				return Object.keys(topLeftBars[0].items)
			},
			getCurrent() {
				const self = topLeftBars[0]
				const curr = []

				Array.from(self.elem.children).forEach(x => {
					const name = self.registered.get(x)
					if(name) {
						curr.push(name)
					}
				})

				return curr
			},
			setCurrent(list) {
				list = list.slice()
				const self = topLeftBars[0]

				Object.keys(self.defaults).forEach(name => {
					if(!list.includes(name)) {
						list.push(`-${name}`)
					}
				})

				savedItems.topleft = list
				saveSavedItems()
				requestTopLeftUpdate()
			}
		},
		topright: {
			getAll() {
				return Object.keys(topRightBar.items)
			},
			getCurrent() {
				const self = topRightBar
				const curr = []

				Array.from(self.elem.children).forEach(x => {
					const name = self.registered.get(x)
					if(name) {
						curr.push(name)
					}
				})

				return curr
			},
			setCurrent(list) {
				list = list.slice()
				const self = topRightBar

				Object.keys(self.defaults).forEach(name => {
					if(!list.includes(name)) {
						list.push(`-${name}`)
					}
				})

				savedItems.topright = list
				saveSavedItems()
				requestTopRightUpdate()
			}
		}
	}
})()
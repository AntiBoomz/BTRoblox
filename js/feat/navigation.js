
"use strict"

const Navigation = {
	elements: {},

	getElementStates() {
		const data = SETTINGS.get("navigation.elements")
		let elements = {}
		
		try { elements = JSON.parse(data || "[]") }
		catch(ex) { console.error(ex) }
		
		return Array.isArray(elements) ? {} : elements
	},
	
	register(name, elementInfo) {
		const enabledByDefault = elementInfo.enabled !== false
		
		const element = this.elements[name] = {
			nodeSelector: `.btr-nav-node-${name}`,
			class: name,
			
			update(node) {
				node.style.display = this.enabled ? "" : "none"
			},
			
			...elementInfo,
			settings: {},
			name: name,
			
			enabledByDefault: enabledByDefault,
			enabled: enabledByDefault,
			isDefault: true,
			
			saveState() {
				const states = Navigation.getElementStates()
				const prevState = states[this.name]
				let state
				
				if(!this.isDefault) {
					if(!state) { state = {} }
					state.enabled = this.enabled
				}
				
				if(JSON.stringify(prevState) !== JSON.stringify(state)) {
					states[this.name] = state
					SETTINGS.set("navigation.elements", JSON.stringify(states))
				}
			},
			
			setEnabled(enabled) {
				if(typeof enabled === "boolean") {
					this.enabled = enabled
					this.isDefault = false
				} else {
					this.enabled = this.enabledByDefault
					this.isDefault = true
				}
				
				this.saveState()
				this.updateAll()
			},
			
			updateAll() {
				for(const node of document.querySelectorAll(this.nodeSelector)) {
					this.updateNode(node)
					this.update?.(node)
				}
			},
			
			updateNode(node) {
				let className = this.class
				let enabled = this.enabled
				
				if(className[0] === "!") {
					className = className.slice(1)
					enabled = !enabled
				}
				
				node.classList.toggle(`btr-nav-${className}`, enabled)
			},
			
			addNode(node) {
				node.classList.add(this.nodeSelector.slice(1))
				
				this.updateNode(node)
				this.nodeAdded?.(node)
				this.update?.(node)
				
				for(const setting of Object.values(this.settings)) {
					if(setting.nodeSelector === this.nodeSelector) {
						setting.addNode?.(node)
					}
				}
			}
		}
		
		if(element.parent) {
			let settingName = element.name
			
			if(settingName.startsWith(`${element.parent.name}_`)) {
				settingName = settingName.slice(element.parent.name.length + 1)
			}
			
			element.parent.settings[settingName] = element
		}
		
		if(elementInfo.settings) {
			for(const [name, setting] of Object.entries(elementInfo.settings)) {
				setting.nodeSelector = element.nodeSelector
				setting.parent = element
				setting.class ??= name
				setting.update ??= null
				Navigation.register(`${element.name}_${name}`, setting)
			}
		}
		
		let state = this.getElementStates()[element.name]
		if(typeof state === "boolean") { state = { enabled: state } }
		
		if(typeof state?.enabled === "boolean") {
			element.enabled = state.enabled
			element.isDefault = false
		}
		
		if(SETTINGS.get("navigation.enabled") && location.host !== "create.roblox.com") {
			const attach = async () => {
				if(name !== "header_home" && name !== "header_robux") {
					await loggedInUserPromise
					if(loggedInUser === -1) { return }
				}
				
				if(element.selector) {
					const add = node => {
						if(element.html) {
							const newNode = element.html.cloneNode(true)
							node.replaceWith(newNode)
							node = newNode
						}
						
						element.addNode(node)
					}
					
					document.$watch(element.selector, root => {
						if(element.selector2) {
							new MutationObserver(records => {
								for(const record of records) {
									for(const node of record.addedNodes) {
										if(node.matches(element.selector2)) {
											add(node)
										}
									}
								}
							}).observe(root, { childList: true })
							
							for(const node of root.children) {
								if(node.matches(element.selector2)) {
									add(node)
								}
							}
						} else {
							add(root)
						}
					})
				}
				
				try { element.init?.() }
				catch(ex) { console.error(ex) }
			}
			
			attach()
		}
		
		return element
	},
	
	init() {
		// Always on (even when logged out)
		
		Navigation.register("header_home", {
			label: "Show Home",
			
			init() {
				document.$watch("#header").$then().$watch("ul.rbx-navbar", navbar => {
					const button = html`<li class=cursor-pointer style="order:-1"><a class="font-header-2 nav-menu-title text-header" href=/home>Home</a></li>`
					navbar.append(button)
					this.addNode(button)
				}, { continuous: true })
			}
		})
		
		/*
		Navigation.register("header_charts_rename", {
			label: "Rename Charts to Discover",
			enabled: false,
			
			update(node) {
				if(node.nodeName === "TITLE") {
					if(location.pathname.toLowerCase().startsWith("/charts")) {
						if(this.enabled) {
							if(document.title.includes("Charts")) {
								this.replacedTitle = true
								document.title = document.title.replace(/Charts/, "Discover")
							}
						} else {
							if(this.replacedTitle && document.title.includes("Discover")) {
								document.title = document.title.replace(/Discover/, "Charts")
							}
						}
					}
				} else {
					if(this.enabled) {
						if(node.textContent === "Charts") {
							node.classList.add("btr-charts-rename")
							node.textContent = "Discover"
						}
					} else {
						if(node.classList.contains("btr-charts-rename") && node.textContent === "Discover") {
							node.textContent = "Charts"
						}
					}
				}
			},
			
			init() {
				document.$watch("#header").$then().$watch("ul.rbx-navbar", navbar => {
					const chartsButton = navbar.$find(`.rbx-navbar a[href^="/charts"]`)
					
					if(chartsButton) {
						this.addNode(chartsButton)
					}
				}, { continuous: true })
				
				document.$watch("title", title => this.addNode(title))
			}
		})
		*/
		
		Navigation.register("header_charts", {
			label: "Show Charts",
			enabled: true,
			
			init() {
				document.$watch("#header").$then().$watch("ul.rbx-navbar", navbar => {
					const btn = navbar.$find(`#nav-charts-md-link, #nav-charts-sm-link`)?.parentNode
					
					if(btn) {
						this.addNode(btn)
					}
				}, { continuous: true })
			}
		})
		
		Navigation.register("header_marketplace", {
			label: "Show Marketplace",
			enabled: true,
			
			init() {
				document.$watch("#header").$then().$watch("ul.rbx-navbar", navbar => {
					const btn = navbar.$find(`#nav-marketplace-md-link, #nav-marketplace-sm-link`)?.parentNode
					
					if(btn) {
						this.addNode(btn)
					}
				}, { continuous: true })
			}
		})
		
		Navigation.register("header_create", {
			label: "Show Create",
			enabled: true,
			
			init() {
				document.$watch("#header").$then().$watch("ul.rbx-navbar", navbar => {
					const btn = navbar.$find(`#header-develop-md-link, #header-develop-sm-link`)?.parentNode
					
					if(btn) {
						this.addNode(btn)
					}
				}, { continuous: true })
			}
		})
		
		Navigation.register("header_robux", {
			label: "Show Robux",
			enabled: false,
			
			init() {
				document.$watch("#header").$then().$watch("ul.rbx-navbar", navbar => {
					const btn = navbar.$find(`.rbx-navbar a[href^="/robux"], .rbx-navbar a[href^="/upgrades/robux"]`)?.parentNode || navbar.$find(`#navigation-robux-container, #navigation-robux-mobile-container`)
					
					if(btn) {
						this.addNode(btn)
					}
				}, { continuous: true })
			}
		})
		
		// Header
		
		Navigation.register("header_agebracket", {
			label: "Show Age Bracket",
			selector: ".age-bracket-label",
			enabled: false
		})
		
		Navigation.register("header_notifications", {
			label: "Show Notifications",
			
			settings: {
				reduce_margins: { label: "Reduce Margin", enabled: true }
			},
			
			selector: "#navbar-stream",
			enabled: true
		})
		
		Navigation.register("header_friends", {
			label: "Show Friends",
			
			settings: {
				show_notifs: { label: "Show Requests", enabled: true, class: "!hide_notifs" }
			},
			
			selector: "#btr-placeholder-friends",
			html: html`
				<li id="btr-navbar-friends" class="navbar-icon-item">
					<a class="rbx-menu-item" href="/users/friends">
						<span class="icon-nav-friend-btr"></span>
						<span class=btr-nav-notif style="display:none;"></span>
					</a>
				</li>`,
			
			update(node) {
				node.style.display = this.enabled ? "" : "none"
				if(!this.enabled) { return }
				
				const sidebar = $(".btr-nav-sidebar_friends > a")
				const sidebarNotif = sidebar?.$find("span .text-label-small")
				
				const notif = node.$find(".btr-nav-notif")
				const link = node.$find("a")
				
				link.href = sidebar?.href ?? link.href
				notif.textContent = sidebarNotif ? sidebarNotif.textContent.trim() : ""
				notif.style.display = sidebarNotif ? "" : "none"
			}
		})
		
		Navigation.register("header_messages", {
			label: "Show Messages",
			
			settings: {
				show_notifs: { label: "Show Unread", enabled: true, class: "!hide_notifs" }
			},
			
			selector: "#btr-placeholder-messages",
			html: html`
				<li id="btr-navbar-messages" class="navbar-icon-item">
					<a class="rbx-menu-item" href="/my/messages">
						<span class="icon-nav-message-btr"></span>
						<span class=btr-nav-notif style="display:none;"></span>
					</a>
				</li>`,
			
			update(node) {
				node.style.display = this.enabled ? "" : "none"
				if(!this.enabled) { return }
				
				const sidebar = $(".btr-nav-sidebar_messages > a")
				const sidebarNotif = sidebar?.$find("span .text-label-small")
				
				const notif = node.$find(".btr-nav-notif")
				const link = node.$find("a")
				
				link.href = sidebar?.href ?? link.href
				notif.textContent = sidebarNotif ? sidebarNotif.textContent.trim() : ""
				notif.style.display = sidebarNotif ? "" : "none"
			}
		})
		
		// Sidebar
		
		Navigation.register("sidebar_home", {
			label: "Show Home",
			
			selector: ".left-nav ul",
			selector2: "li:has(a[href*='roblox.com/home'])",
			
			enabled: false,
			
			update(node) {
				node.style.display = this.enabled ? "" : "none"
			}
		})
		
		Navigation.register("sidebar_profile", {
			label: "Show Profile",
			
			selector: ".left-nav ul",
			selector2: "li:has(a[href*='roblox.com/users/profile'])",
			
			enabled: true,
			
			update(node) {
				node.style.display = this.enabled ? "" : "none"
			}
		})
		
		Navigation.register("sidebar_plus", {
			label: "Show Roblox Plus",
			
			selector: ".left-nav ul",
			selector2: "li:not(.padding-top-xsmall):has(a[href*='roblox.com/plus'])",
			
			enabled: true,
			
			update(node) {
				node.style.display = this.enabled ? "" : "none"
			}
		})
		
		Navigation.register("sidebar_messages", {
			label: "Show Messages",
			
			settings: {
				show_notifs: { label: "Show Unread", enabled: true, class: "!hide_notifs" }
			},
			
			selector: ".left-nav ul",
			selector2: "li:has(a[href*='roblox.com/my/messages'])",
			
			enabled: true,
			
			update(node) {
				node.style.display = this.enabled ? "" : "none"
			},
			
			nodeAdded(node) {
				const update = () => Navigation.elements.header_messages.updateAll()
				
				new MutationObserver(update).observe(node, {
					childList: true,
					subtree: true,
					characterData: true,
					attributeFilter: ["href"]
				})
				
				update()
			}
		})
		
		Navigation.register("sidebar_friends", {
			label: "Show Friends",
			
			settings: {
				show_notifs: { label: "Show Requests", enabled: true, class: "!hide_notifs" }
			},
			
			selector: ".left-nav ul",
			selector2: "li:has(a[href*='roblox.com/users/friends'])",
			
			enabled: true,
			
			update(node) {
				node.style.display = this.enabled ? "" : "none"
			},
			
			nodeAdded(node) {
				const update = () => Navigation.elements.header_friends.updateAll()
				
				new MutationObserver(update).observe(node, {
					childList: true,
					subtree: true,
					characterData: true,
					attributeFilter: ["href"]
				})
				
				update()
			}
		})
		
		Navigation.register("sidebar_avatar", {
			label: "Show Avatar",
			
			selector: ".left-nav ul",
			selector2: "li:has(a[href*='roblox.com/my/avatar'])",
			
			enabled: true,
			
			update(node) {
				node.style.display = this.enabled ? "" : "none"
			}
		})
		
		Navigation.register("sidebar_inventory", {
			label: "Show Inventory",
			
			selector: ".left-nav ul",
			selector2: "li:has(a[href*='roblox.com/users/inventory'])",
			
			enabled: true,
			
			update(node) {
				node.style.display = this.enabled ? "" : "none"
			}
		})
		
		Navigation.register("sidebar_trade", {
			label: "Show Trade",
			
			selector: ".left-nav ul",
			selector2: "li:has(a[href*='roblox.com/trades'])",
			
			enabled: true,
			
			update(node) {
				node.style.display = this.enabled ? "" : "none"
			}
		})
		
		Navigation.register("sidebar_money", {
			label: "Show Transactions",
			enabled: false,
			
			selector: "#btr-placeholder-money",
			html: html`
				<li id=btr-nav-money>
					<a href="/transactions" id=nav-money class="content-emphasis text-title-large flex items-center gap-small padding-left-xsmall padding-right-xxsmall radius-medium relative clip group/interactable focus-visible:outline-focus disabled:outline-none ${location.pathname.startsWith("/transactions") ? "bg-surface-300" : ""}">
						<div role="presentation" class="absolute inset-[0] transition-colors group-hover/interactable:bg-[var(--color-state-hover)] group-active/interactable:bg-[var(--color-state-press)] group-disabled/interactable:bg-none"></div>
						<span class="size-1000 grow-0 shrink-0 basis-auto flex justify-center items-center">
							<span role="presentation" class="grow-0 shrink-0 basis-auto icon icon-regular-hand-two-arrows-horizontal size-[var(--icon-size-large)]"></span>
						</span>
						<span class="min-width-0 text-truncate-end text-no-wrap">Transactions</span>
					</a>
				</li>`,
		})
		
		Navigation.register("sidebar_blog", {
			label: "Show Blog",
			
			selector: ".left-nav ul",
			selector2: "li:has(a[href*='blog.roblox.com'])",
			
			enabled: true,
			
			update(node) {
				node.style.display = this.enabled ? "" : "none"
			}
		})
		
		Navigation.register("sidebar_blogfeed", {
			label: "Show Blog Feed",
			
			selector: "#btr-placeholder-blogfeed",
			html: html`<div id=btr-blogfeed-container><li id=btr-blogfeed></li></div>`,
			
			update(node) {
				node.style.display = this.enabled ? "" : "none"
				
				if(this.enabled && !this.loadedFeed) {
					this.loadedFeed = true
					
					const blogfeed = node.$find("#btr-blogfeed")
					const parser = new DOMParser()
					
					const updateBlogFeed = blogFeedData => {
						blogfeed.replaceChildren()
						
						for(const item of blogFeedData) {
							blogfeed.append(html`
							<a class="btr-feed group/interactable radius-medium text-title-small" href="${item.url}">
								<div role="presentation" class="absolute inset-[0] transition-colors group-hover/interactable:bg-[var(--color-state-hover)] group-active/interactable:bg-[var(--color-state-press)] group-disabled/interactable:bg-none"></div>
								<div class="btr-feedtitle content-emphasis">
									${item.title.trim() + " "}
									<span class="btr-feeddate content-default">(${$.dateSince(item.date)})</span>
								</div>
								<div class="btr-feeddesc content-muted">${
									parser.parseFromString(item.desc, "text/html").documentElement.textContent.replace(/\s+/g, " ").trim().slice(0, 300)
								}</div>
							</a>`)
						}
					}
					
					backgroundScript.send("requestBlogFeed", data => updateBlogFeed(data))
					
					if(SHARED_DATA.get("blogfeed")) {
						updateBlogFeed(SHARED_DATA.get("blogfeed"))
					}
				}
			},
		})
		
		Navigation.register("sidebar_shop", {
			label: "Show Official Store",
			
			selector: ".left-nav ul",
			selector2: "li:has(.icon-regular-building-store)",
			
			enabled: true,
			
			update(node) {
				node.style.display = this.enabled ? "" : "none"
			}
		})
		
		Navigation.register("sidebar_giftcards", {
			label: "Show Buy Gift Cards",
			
			selector: ".left-nav ul",
			selector2: "li:has(a[href*='roblox.com/giftcards'])",
			
			enabled: true,
			
			update(node) {
				node.style.display = this.enabled ? "" : "none"
			}
		})
		
		Navigation.register("sidebar_plus_card", {
			label: "Show Roblox Plus Card",
			
			selector: ".left-nav ul",
			selector2: "li.padding-top-xsmall:has(a[href*='/plus'])",
			
			enabled: true,
			
			update(node) {
				node.style.display = this.enabled ? "" : "none"
			}
		})
		
		// Navigation.register("sidebar_events", {
		// 	label: "Show Events",
			
		// 	selector: ".left-col-list > .rbx-platform-event-container",
		// 	enabled: true
		// })
		
		if(SETTINGS.get("navigation.enabled") && location.host !== "create.roblox.com") {
			injectScript.call("navigation", () => {
				reactHook.inject("ul.navbar-right", elem => {
					const robux = elem.find(x => "robuxAmount" in x.props)
					
					if(robux) {
						robux.before(
							reactHook.createElement("div", {
								id: "btr-placeholder-friends",
								style: { display: "none" },
								dangerouslySetInnerHTML: { __html: "" }
							}),
							reactHook.createElement("div", {
								id: "btr-placeholder-messages",
								style: { display: "none" },
								dangerouslySetInnerHTML: { __html: "" }
							}),
						)
					}
				})
				
				reactHook.inject("ul.flex-col", elem => {
					const trade = elem.find(x => x.props.path?.startsWith("/trades"))
					if(trade) {
						trade.after(
							reactHook.createElement("div", {
								id: "btr-placeholder-money",
								style: { display: "none" },
								dangerouslySetInnerHTML: { __html: "" }
							}),
						)
					}
					
					if(!trade) { return } // matched some other element?
					
					const blog = elem.find(x => x.props.path?.toString().includes("blog.roblox.com"))
					if(blog) {
						blog.after(
							reactHook.createElement("div", {
								id: "btr-placeholder-blogfeed",
								style: { display: "none" },
								dangerouslySetInnerHTML: { __html: "" }
							}),
						)
					}
				})
			})
		}
	}
}

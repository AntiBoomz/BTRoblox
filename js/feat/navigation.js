
"use strict"

const btrNavigation = {
	elements: {},

	getElementStates() {
		const data = SETTINGS.get("navigation.elements")
		let elements = {}
		
		try { elements = JSON.parse(data || "[]") }
		catch(ex) { console.error(ex) }
		
		return Array.isArray(elements) ? {} : elements
	},
	
	register(name, elementInfo) {
		const selector = `[btr-name="${name}"]`
		const enabledByDefault = elementInfo.enabled !== false
		
		elementInfo = this.elements[name] = {
			...elementInfo,
			
			enabledByDefault: enabledByDefault,
			enabled: enabledByDefault,
			isDefault: true,
			
			_update(node) {
				node.style.display = this.enabled ? "" : "none"
				this.update?.(node)
			},
			
			saveState() {
				const states = btrNavigation.getElementStates()
				if(this.isDefault) {
					if(name in states) {
						delete states[name]
						SETTINGS.set("navigation.elements", JSON.stringify(states))
					}
				} else {
					if(states[name] !== this.enabled) {
						states[name] = this.enabled
						SETTINGS.set("navigation.elements", JSON.stringify(states))
					}
				}
			},
			
			setEnabled(enabled) {
				if(this.enabled === !!enabled) { return }
				this.enabled = !!enabled
				this.isDefault = false
				this.saveState()
				this.updateAll()
			},
			
			resetEnabled() {
				if(this.isDefault) { return }
				this.enabled = this.enabledByDefault
				this.isDefault = true
				this.saveState()
				this.updateAll()
			},
			
			updateAll() {
				for(const node of document.body?.querySelectorAll(selector)) {
					this._update(node)
				}
			},
			
			addNode(node) {
				node.setAttribute("btr-name", name)
				this.nodeAdded?.(node)
				this._update(node)
			}
		}
		
		const state = this.getElementStates()[name]
		if(typeof state === "boolean") {
			elementInfo.enabled = state
			elementInfo.isDefault = false
		}
		
		// TODO: Load enabled from settings
		
		if(elementInfo.selector) {
			document.$watch(elementInfo.selector, node => {
				elementInfo.addNode(node)
			})
		}
		
		if(elementInfo.reactInject) {
			reactInject({
				...elementInfo.reactInject,
				callback(node) {
					elementInfo.addNode(node)
				}
			})
		}
		
		try { elementInfo.init?.() }
		catch(ex) { console.error(ex) }
	},
	
	async init() {
		// btrNavigation.register("header_home", {
		// 	reactInject: {
		// 		selector: ".rbx-navbar",
		// 		index: 0,
		// 		html: `<li class=cursor-pointer style="order:-1"><a class="font-header-2 nav-menu-title text-header" href=/home>Home</a></li>`
		// 	}
		// })
		
		// Left header buttons are not react, apparently?
		btrNavigation.register("header_home", {
			name: "Show Home",
			init() {
				document.$watch("#header").$then().$watch("ul.rbx-navbar", navbar => {
					const button = html`<li class=cursor-pointer style="order:-1"><a class="font-header-2 nav-menu-title text-header" href=/home>Home</a></li>`
					navbar.prepend(button)
					this.addNode(button)
				}, { continuous: true })
			}
		})
		
		btrNavigation.register("header_robux", {
			name: "Show Robux",
			selector: `.rbx-navbar a[href^="/robux"]`,
			enabled: false,
			
			update(node) {
				node.parentNode.style.display = this.enabled ? "" : "none"
			}
		})
		
		await loggedInUserPromise
		if(!isLoggedIn) { return }
		
		// Header
		
		btrNavigation.register("header_messages", {
			name: "Show Messages",
			
			update(node) {
				node.style.display = this.enabled ? "" : "none"
				if(!this.enabled) { return }
				
				const orig = $("#nav-message")
				const origNotif = orig?.$find(".notification")
				
				if(origNotif) {
					const notif = node.$find(".btr-nav-notif")
					const link = node.$find("a")
					
					link.href = orig.href
					notif.textContent = origNotif ? origNotif.textContent.trim() : ""
					notif.style.display = origNotif ? "" : "none"
				}
			},
			
			reactInject: {
				selector: "ul.navbar-right",
				index: { selector: { hasProps: ["robuxAmount"] }, offset: -1 },
				html: `
				<li id="btr-navbar-messages" class="navbar-icon-item">
					<a class="rbx-menu-item" href="/My/Messages#!/inbox">
						<span class="icon-nav-message-btr"></span>
						<span class="btr-nav-notif rbx-text-navbar-right" style="display:none;"></span>
					</a>
				</li>`
			}
		})
		
		btrNavigation.register("header_friends", {
			name: "Show Friends",
			
			update(node) {
				node.style.display = this.enabled ? "" : "none"
				if(!this.enabled) { return }
				
				const orig = $("#nav-friends")
				const origNotif = orig?.$find(".notification")
				
				if(origNotif) {
					const notif = node.$find(".btr-nav-notif")
					const link = node.$find("a")
					
					link.href = orig.href
					notif.textContent = origNotif ? origNotif.textContent.trim() : ""
					notif.style.display = origNotif ? "" : "none"
				}
			},
			
			reactInject: {
				selector: "ul.navbar-right",
				index: { selector: { hasProps: ["robuxAmount"] }, offset: -1 },
				html: `
				<li id="btr-navbar-friends" class="navbar-icon-item">
					<a class="rbx-menu-item" href="/Friends.aspx">
						<span class="icon-nav-friend-btr"></span>
						<span class="btr-nav-notif rbx-text-navbar-right" style="display:none;"></span>
					</a>
				</li>`
			}
		})
		
		btrNavigation.register("header_agebracket", {
			name: "Show Age Bracket",
			selector: ".age-bracket-label",
			enabled: false
		})
		
		// Sidebar
		
		btrNavigation.register("sidebar_home", {
			name: "Show Home",
			
			selector: "#nav-home",
			enabled: false,
			
			update(node) {
				node.parentNode.style.display = this.enabled ? "" : "none"
			}
		})
		
		btrNavigation.register("sidebar_messages", {
			name: "Show Messages",
			
			selector: "#nav-message",
			enabled: false,
			
			update(node) {
				node.parentNode.style.display = this.enabled ? "" : "none"
			},
			
			nodeAdded(node) {
				const update = () => btrNavigation.elements.header_messages.updateAll()
				new MutationObserver(update).observe(node, { childList: true, subtree: true, attributeFilter: ["href"] })
				update()
			}
		})
		
		btrNavigation.register("sidebar_friends", {
			name: "Show Friends",
			
			selector: "#nav-friends",
			enabled: false,
			
			update(node) {
				node.parentNode.style.display = this.enabled ? "" : "none"
			},
			
			nodeAdded(node) {
				const update = () => btrNavigation.elements.header_friends.updateAll()
				new MutationObserver(update).observe(node, { childList: true, subtree: true, attributeFilter: ["href"] })
				update()
			}
		})
		
		btrNavigation.register("sidebar_trade", {
			name: "Show Trade",
			
			selector: "#nav-trade",
			enabled: false,
			
			update(node) {
				node.parentNode.style.display = this.enabled ? "" : "none"
			}
		})
		
		btrNavigation.register("sidebar_money", {
			name: "Show Money",
			
			reactInject: {
				selector: ".left-col-list",
				index: { selector: { key: "trade" } },
				html: `
				<li>
					<a href="/transactions" id=nav-money class="dynamic-overflow-container text-nav">
						<div><span class="icon-nav-trade"></span></div>
						<span class="font-header-2 dynamic-ellipsis-item">Money</span>
					</a>
				</li>`,
			}
		})
		
		btrNavigation.register("sidebar_blogfeed", {
			name: "Show Blog Feed",
			
			update(node) {
				node.style.display = this.enabled ? "" : "none"
				
				if(this.enabled && !this.loadedFeed) {
					this.loadedFeed = true
					
					const blogfeed = node.$find("#btr-blogfeed")
					let blogFeedData
					
					const updateBlogFeed = () => {
						blogfeed.$empty()
		
						blogFeedData.forEach(item => {
							blogfeed.append(html`
							<a class="btr-feed" href="${item.url}">
								<div class="btr-feedtitle">
									${item.title.trim() + " "}
									<span class="btr-feeddate">(${$.dateSince(item.date)})</span>
								</div>
								<div class="btr-feeddesc">${item.desc}</div>
							</a>`)
						})
					}
					
					MESSAGING.send("requestBlogFeed", data => {
						blogFeedData = data
						updateBlogFeed()
					})

					STORAGE.get(["cachedBlogFeedV2"], data => {
						if(!blogFeedData && data.cachedBlogFeedV2) {
							blogFeedData = data.cachedBlogFeedV2
							updateBlogFeed()
						}
					})
				}
			},
			
			reactInject: {
				selector: ".left-col-list",
				index: { selector: { key: "blog" } },
				html: `<div id=btr-blogfeed-container><li id=btr-blogfeed></li></div>`,
			}
		})
		
		btrNavigation.register("sidebar_premium", {
			name: "Show Premium",
			
			reactInject: {
				selector: ".left-col-list",
				index: { selector: { key: "blog" }, offset: -1 },
				html: `
				<li>
					<a href=/premium/membership id=nav-premium class="dynamic-overflow-container text-nav">
						<div><span class=icon-nav-premium-btr></span></div>
						<span class="font-header-2 dynamic-ellipsis-item">Premium</span>
					</a>
				</li>`
			}
		})
		
		btrNavigation.register("sidebar_premium_2", {
			name: "Show Premium Button",
			
			selector: ".left-col-list > .rbx-upgrade-now",
			enabled: false
		})
	}
}

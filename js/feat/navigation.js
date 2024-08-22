
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
		const selector = `.btr-nav-${name}`
		const enabledByDefault = elementInfo.enabled !== false
		
		const element = this.elements[name] = {
			settings: [],
			
			update(node) {
				node.style.display = this.enabled ? "" : "none"
			},
			
			...elementInfo,
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
				
				for(const setting of this.settings) {
					if(!setting.isDefault) {
						if(!state) { state = {} }
						if(!state.settings) { state.settings = {} }
						state.settings[setting.name] = setting.enabled
					}
				}
				
				if(JSON.stringify(prevState) !== JSON.stringify(state)) {
					states[this.name] = state
					SETTINGS.set("navigation.elements", JSON.stringify(states))
				}
			},
			
			getSetting(name) {
				return this.settings.find(x => x.name === name)
			},
			
			setSettingEnabled(name, enabled) {
				const setting = assert(this.getSetting(name), "invalid setting")
				
				if(typeof enabled === "boolean") {
					setting.enabled = enabled
					setting.isDefault = false
				} else {
					setting.enabled = setting.enabledByDefault
					setting.isDefault = true
				}
				
				this.saveState()
				
				for(const node of document.querySelectorAll(selector)) {
					this.updateNodeSetting(node, setting)
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
				for(const node of document.querySelectorAll(selector)) {
					this.update(node)
				}
			},
			
			updateNodeSetting(node, setting) {
				let className = setting.class || setting.name
				let enabled = setting.enabled
				
				if(className[0] === "!") {
					className = className.slice(1)
					enabled = !enabled
				}
				
				node.classList.toggle(`btr-nav-${className}`, enabled)
			},
			
			addNode(node) {
				node.classList.add(`btr-nav-${this.name}`)
				
				for(const setting of this.settings) {
					this.updateNodeSetting(node, setting)
				}
				
				this.nodeAdded?.(node)
				this.update(node)
			}
		}
		
		for(const setting of element.settings) {
			const enabledByDefault = setting.enabled === true
			
			setting.enabledByDefault = enabledByDefault
			setting.enabled = enabledByDefault
			setting.isDefault = true
		}
		
		let state = this.getElementStates()[element.name]
		if(typeof state === "boolean") { state = { enabled: state } }
		
		if(typeof state?.enabled === "boolean") {
			element.enabled = state.enabled
			element.isDefault = false
		}
		
		if(state?.settings) {
			for(const [name, enabled] of Object.entries(state.settings)) {
				const setting = element.getSetting(name)
				
				if(setting) {
					setting.enabled = enabled
					setting.isDefault = false
				}
			}
		}
		
		if(SETTINGS.get("navigation.enabled") && location.host !== "create.roblox.com") {
			const attach = async () => {
				if(name !== "header_home" && name !== "header_robux") {
					await loggedInUserPromise
					if(loggedInUser === -1) { return }
				}
				
				if(element.selector) {
					document.$watch(element.selector, node => {
						element.addNode(node)
					})
				}
				
				if(element.reactInject) {
					reactHook.inject({
						...element.reactInject,
						callback(node) {
							element.addNode(node)
						}
					})
				}
				
				try { element.init?.() }
				catch(ex) { console.error(ex) }
			}
			
			attach()
		}
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
		
		Navigation.register("header_robux", {
			label: "Show Robux",
			enabled: false,
			
			init() {
				document.$watch("#header").$then().$watch("ul.rbx-navbar", navbar => {
					const robuxBtn = navbar.$find(`.rbx-navbar a[href^="/robux"], .rbx-navbar a[href^="/upgrades/robux"]`)?.parentNode || navbar.$find(`#navigation-robux-container, #navigation-robux-mobile-container`)
					
					if(robuxBtn) {
						this.addNode(robuxBtn)
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
			
			settings: [
				{ name: "reduce_margins", label: "Reduce Margin", enabled: true }
			],
			
			selector: "#navbar-stream",
			enabled: true
		})
		
		Navigation.register("header_friends", {
			label: "Show Friends",
			
			settings: [
				{ name: "show_notifs", label: "Show Requests", enabled: true, class: "!hide_notifs" }
			],
			
			update(node) {
				node.style.display = this.enabled ? "" : "none"
				if(!this.enabled) { return }
				
				const orig = $("#nav-friends")
				const origNotif = orig?.$find(".notification")
				
				const notif = node.$find(".btr-nav-notif")
				const link = node.$find("a")
				
				link.href = orig.href
				notif.textContent = origNotif ? origNotif.textContent.trim() : ""
				notif.style.display = origNotif ? "" : "none"
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
		
		Navigation.register("header_messages", {
			label: "Show Messages",
			
			settings: [
				{ name: "show_notifs", label: "Show Unread", enabled: true, class: "!hide_notifs" }
			],
			
			update(node) {
				node.style.display = this.enabled ? "" : "none"
				if(!this.enabled) { return }
				
				const orig = $("#nav-message")
				const origNotif = orig?.$find(".notification")
				
				const notif = node.$find(".btr-nav-notif")
				const link = node.$find("a")
				
				link.href = orig.href
				notif.textContent = origNotif ? origNotif.textContent.trim() : ""
				notif.style.display = origNotif ? "" : "none"
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
		
		// Sidebar
		
		Navigation.register("sidebar_home", {
			label: "Show Home",
			
			selector: "#nav-home",
			enabled: false,
			
			update(node) {
				node.parentNode.style.display = this.enabled ? "" : "none"
			}
		})
		
		Navigation.register("sidebar_messages", {
			label: "Show Messages",
			
			settings: [
				{ name: "show_notifs", label: "Show Unread", enabled: true, class: "!hide_notifs" }
			],
			
			selector: "#nav-message",
			enabled: false,
			
			update(node) {
				node.parentNode.style.display = this.enabled ? "" : "none"
			},
			
			nodeAdded(node) {
				const update = () => Navigation.elements.header_messages.updateAll()
				new MutationObserver(update).observe(node, { childList: true, subtree: true, attributeFilter: ["href"] })
				update()
			}
		})
		
		Navigation.register("sidebar_friends", {
			label: "Show Friends",
			
			settings: [
				{ name: "show_notifs", label: "Show Requests", enabled: true, class: "!hide_notifs" }
			],
			
			selector: "#nav-friends",
			enabled: false,
			
			update(node) {
				node.parentNode.style.display = this.enabled ? "" : "none"
			},
			
			nodeAdded(node) {
				const update = () => Navigation.elements.header_friends.updateAll()
				new MutationObserver(update).observe(node, { childList: true, subtree: true, attributeFilter: ["href"] })
				update()
			}
		})
		
		Navigation.register("sidebar_trade", {
			label: "Show Trade",
			
			selector: "#nav-trade",
			enabled: true,
			
			update(node) {
				node.parentNode.style.display = this.enabled ? "" : "none"
			}
		})
		
		Navigation.register("sidebar_money", {
			label: "Show Money",
			enabled: false,
			
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
		
		Navigation.register("sidebar_blogfeed", {
			label: "Show Blog Feed",
			
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
							<a class="btr-feed" href="${item.url}">
								<div class="btr-feedtitle">
									${item.title.trim() + " "}
									<span class="btr-feeddate">(${$.dateSince(item.date)})</span>
								</div>
								<div class="btr-feeddesc">${
									parser.parseFromString(item.desc, "text/html").documentElement.textContent.replace(/\s+/g, " ").trim().slice(0, 220)
								}</div>
							</a>`)
						}
					}
					
					MESSAGING.send("requestBlogFeed", data => updateBlogFeed(data))
					
					if(SHARED_DATA.get("blogfeed")) {
						updateBlogFeed(SHARED_DATA.get("blogfeed"))
					}
				}
			},
			
			reactInject: {
				selector: ".left-col-list",
				index: { selector: { key: "blog" } },
				html: `<div id=btr-blogfeed-container><li id=btr-blogfeed></li></div>`,
			}
		})
		
		Navigation.register("sidebar_premium", {
			label: "Show Premium",
			
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
		
		Navigation.register("sidebar_premium_2", {
			label: "Show Premium Button",
			
			selector: ".left-col-list > .rbx-upgrade-now",
			enabled: false
		})
	}
}

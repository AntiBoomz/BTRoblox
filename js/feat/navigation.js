"use strict"

const btrNavigation = {
	customElements: {
		btr_Home: `<li class=cursor-pointer style="order:-1"><a class="font-header-2 nav-menu-title text-header" href=/home>Home</a></li>`,

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
			<a href="https://www.roblox.com/my/money.aspx" id=nav-money class="dynamic-overflow-container text-nav">
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
	},

	blogFeedCallbacks: [],
	blogFeedStartedLoading: false,
	blogFeedData: null,

	loadBlogFeed(cb) {
		if(this.blogFeedData) {
			return cb(this.blogFeedData)
		}
		
		this.blogFeedCallbacks.push(cb)
		
		if(!this.blogFeedStartedLoading) {
			this.blogFeedStartedLoading = true
			
			MESSAGING.send("requestBlogFeed", data => {
				this.blogFeedData = data
				this.blogFeedCallbacks.splice(0, this.blogFeedCallbacks.length).forEach(fn => fn(this.blogFeedData))
			})

			STORAGE.get(["cachedBlogFeedV2"], data => {
				if(data.cachedBlogFeedV2 && !this.blogFeedData) {
					this.blogFeedCallbacks.forEach(fn => fn(data.cachedBlogFeedV2))
				}
			})
		}
	},

	initBlogFeed() {
		const blogfeed = $("#btr-blogfeed")

		if(!blogfeed || blogfeed.dataset.btrFeedLoaded) {
			return
		}

		blogfeed.dataset.btrFeedLoaded = true

		this.loadBlogFeed(data => {
			if(!document.contains(blogfeed)) {
				return
			}

			blogfeed.$empty()

			data.forEach(item => {
				blogfeed.append(html`
				<a class="btr-feed" href="${item.url}">
					<div class="btr-feedtitle">
						${item.title.trim() + " "}
						<span class="btr-feeddate">(${$.dateSince(item.date)})</span>
					</div>
					<div class="btr-feeddesc">${item.desc}</div>
				</a>`)
			})
		})
	},

	replaceContainer(cont, elem) {
		Object.values(cont.attributes).forEach(attr => cont.removeAttribute(attr.name))
		Object.values(elem.attributes).forEach(attr => cont.setAttribute(attr.name, attr.value))
		cont.append(...elem.childNodes)
	},

	async init() {
		await document.$watch(">body").$promise()

		document.body.classList.add("btr-react-nav")

		if(!SETTINGS.get("navigation.enabled")) {
			return
		}

		document.body.classList.add("btr-react-nav-enabled")

		const navContWatcher = document.$watch("#navigation-container").$then()

		const updateFriends = () => {
			const btrFriends = $("#btr-navbar-friends")
			const navFriends = $("#nav-friends")

			if(!btrFriends || !navFriends) {
				return
			}

			const btrNotif = btrFriends.$find(".btr-nav-notif")
			const origNotif = navFriends.$find(".notification")

			btrFriends.$find("a").href = navFriends.href
			btrNotif.textContent = origNotif ? origNotif.textContent.trim() : ""
			btrNotif.style.display = origNotif ? "" : "none"
		}

		const updateMessages = () => {
			const btrMessages = $("#btr-navbar-messages")
			const navMessages = $("#nav-message")

			if(!btrMessages || !navMessages) {
				return
			}

			const btrNotif = btrMessages.$find(".btr-nav-notif")
			const origNotif = navMessages.$find(".notification")

			btrMessages.$find("a").href = navMessages.href
			btrNotif.textContent = origNotif ? origNotif.textContent.trim() : ""
			btrNotif.style.display = origNotif ? "" : "none"
		}

		navContWatcher
			.$watch("#nav-friends", navFriends => {
				if(!SETTINGS.get("navigation.moveFriendsToTop")) {
					return
				}
				new MutationObserver(updateFriends).observe(navFriends, { childList: true, subtree: true, attributeFilter: ["href"] })
				updateFriends()

				navFriends.parentNode.style.display = "none"
			}, { continuous: true })
			.$watch("#nav-message", navMessages => {
				if(!SETTINGS.get("navigation.moveMessagesToTop")) {
					return
				}
				new MutationObserver(updateMessages).observe(navMessages, { childList: true, subtree: true, attributeFilter: ["href"] })
				updateMessages()

				navMessages.parentNode.style.display = "none"
			}, { continuous: true })
			.$watch("#nav-home", x => {
				if(!SETTINGS.get("navigation.moveHomeToTop")) {
					return
				}
				x.parentNode.style.display = "none"
			}, { continuous: true })
			.$watch("#nav-trade", trade => {
				if(SETTINGS.get("navigation.switchTradeForMoney")) {
					trade.parentNode.after(html(this.customElements.btr_Money))
					trade.parentNode.style.display = "none"
				}
			}, { continuous: true })
			.$watch("#nav-blog", blog => {
				if(SETTINGS.get("navigation.showPremium")) {
					blog.parentNode.before(html(this.customElements.btr_Premium))
				}

				if(SETTINGS.get("navigation.showBlogFeed")) {
					blog.parentNode.after(html`<div id=btr-blogfeed-container><li id=btr-blogfeed></li></div>`)
					this.initBlogFeed()
				}
			}, { continuous: true })
			.$watch("#navigation .rbx-upgrade-now", x => x.style.display = "none", { continuous: true })

		navContWatcher.$watch("#header").$then().$watch(">div").$then()
			.$watch("#btr-messages-container", cont => {
				if(SETTINGS.get("navigation.moveMessagesToTop")) {
					this.replaceContainer(cont, html(this.customElements.btr_Messages))
					updateMessages()
				}
			})
			.$watch("#btr-friends-container", cont => {
				if(SETTINGS.get("navigation.moveMessagesToTop")) {
					this.replaceContainer(cont, html(this.customElements.btr_Friends))
					updateFriends()
				}
			})
			.$watch(".age-bracket-label", x => x.style.display = "none")
			.$watchAll(".rbx-navbar", nav => {
				if(SETTINGS.get("navigation.moveHomeToTop")) {
					nav.append(html(this.customElements.btr_Home))
				}

				nav.$watch("#header .rbx-navbar a[href^=\"/robux\"]", x => x.parentNode.style.display = "none")
			})
		
			
		if(SETTINGS.get("general.robuxToUSD")) {
			document.body.$watchAll("#buy-robux-popover", popover => {
				const bal = popover.$find("#nav-robux-balance")
				if(!bal) {
					return
				}

				const span = html`<span style="display:block;opacity:0.75;font-size:small;font-weight:500;"></span>`
	
				const update = () => {
					const matches = bal.textContent.trim().match(/^([\d,]+)\sRobux$/)
					if(!matches) { return }

					const amt = parseInt(matches[0].replace(/,/g, ""), 10)
					if(!Number.isSafeInteger(amt)) { return }

					span.textContent = RobuxToCash.convert(amt)
					bal.append(span)
				}
	
				const observer = new MutationObserver(update)
				observer.observe(bal, { childList: true })
				update()
			})
		}
	}
}
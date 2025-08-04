"use strict"

const pageInit = {}

const pageReset = {}
const pageLoad = {}

const onPageLoad = fn => {
	const pageName = BTRoblox.currentPage?.name
	assert(pageName)
	
	pageLoad[pageName] ??= []
	pageLoad[pageName].push(fn)
}

const onPageReset = fn => {
	const pageName = BTRoblox.currentPage?.name
	assert(pageName)
	
	pageReset[pageName] ??= []
	pageReset[pageName].push(fn)
}

let loggedInUserPromise = new Promise(() => {})
let loggedInUser = -1

const InvalidExplorableAssetTypeIds = [1, 3, 4, 5, 6, 7, 16, 21, 22, 32, 33, 34, 35, 37, 63]
const InvalidDownloadableAssetTypeIds = [21, 32, 34]

const ContainerAssetTypeIds = {
	[AssetType.EmoteAnimation]: x => x.findFirstChildOfClass("Animation")?.getProperty("AnimationId"),
	[AssetType.MeshPart]: x => x.findFirstChildOfClass("MeshPart")?.getProperty("MeshID", true),
	[AssetType.TShirt]: x => x.findFirstChildOfClass("ShirtGraphic")?.getProperty("Graphic"),
	[AssetType.Shirt]: x => x.findFirstChildOfClass("Shirt")?.getProperty("ShirtTemplate"),
	[AssetType.Pants]: x => x.findFirstChildOfClass("Pants")?.getProperty("PantsTemplate"),
	[AssetType.Decal]: x => x.findFirstChildOfClass("Decal")?.getProperty("Texture"),
	[AssetType.Face]: x => x.findFirstChildOfClass("Decal")?.getProperty("Texture"),
}

const WearableAssetTypeIds = [
	2, 8, 11, 12, 17, 18, 27, 28, 29, 30, 31, 41, 42, 43, 44, 45, 46, 47, 64, 65,
	66, 67, 68, 69, 70, 71, 72, 76, 77, 79
]
const AnimationPreviewAssetTypeIds = [24, 48, 49, 50, 51, 52, 53, 54, 55, 56, 61]
const AccessoryAssetTypeIds = [8, 41, 42, 43, 44, 45, 46, 47, 57, 58, 64, 65, 66, 67, 68, 69, 70, 71, 72]

//

const formatNumber = num => String(num).replace(/(\d\d*?)(?=(?:\d{3})+(?:\.|$))/yg, "$1,")
const formatUrlName = (name, def = "Name") => encodeURIComponent(name.replace(/[']/g, "").replace(/\W+/g, "-").replace(/^-+|-+$/g, "") || def)

let linkifyCounter = 0
const robloxLinkify = target => {
	const className = `btr-linkify-${linkifyCounter++}`
	target.classList.add("linkify", className)
	
	InjectJS.inject(className => $?.(`.${className}`).linkify?.(), className)
	target.classList.remove(className)
}

//

function onMouseEnter(element, selector, callback) {
	if(typeof selector === "function") {
		element.$on("mouseenter", () => selector(element))
		return
	}
	
	let hovering = false
	
	element.$on("mouseover", selector, event => {
		if(!hovering) {
			hovering = true
			
			const currentTarget = event.currentTarget
			currentTarget.$on("mouseleave", () => { hovering = false }, { once: true })
			
			callback(currentTarget)
		}
	})
}

//

function startDownload(blob, fileName) {
	const link = document.createElement("a")
	link.setAttribute("download", fileName || "file")
	link.setAttribute("href", blob)
	document.body.append(link)
	link.click()
	link.remove()
}

function getAssetFileType(assetTypeId, buffer) {
	if(buffer instanceof ArrayBuffer) { buffer = new Uint8Array(buffer) }

	switch(assetTypeId) {
	case 1:
		if(buffer) {
			switch(buffer[0]) {
			case 0xFF: return "jpg"
			case 0x89: default: return "png"
			case 0x4D: return "tif"
			case 0x49: return "tif"
			case 0x47: return "gif"
			case 0x42: return "bmp"
			}
		}

		return "png"
	case 3:
		if(buffer) {
			const header = bufferToString(buffer.subarray(0, 4))
			switch(header) {
			case "RIFF": return "wav"
			case "OggS": return "ogg"
			default: return "mp3"
			}
		}
		
		return "mp3"
	case 4: return "mesh"
	case 63: return "xml"
	case 9: return (buffer && buffer[7] !== 0x21) && "rbxlx" || "rbxl"
	default: return (buffer && buffer[7] !== 0x21) && "rbxmx" || "rbxm"
	}
}

//

function createPager(noSelect, hideWhenEmpty) {
	const pager = html`
	<div class=btr-pager-holder>
		<ul class=btr-pager>
			<li class=btr-pager-prev>
				<button class=btn-generic-left-sm>
					<span class=icon-left></span>
				</button>
			</li>
			<li class=btr-pager-mid>
				<span>Page </span><span class=btr-pager-cur></span>
			</li>
			<li class=btr-pager-next>
				<button class=btn-generic-right-sm>
					<span class=icon-right></span>
				</button>
			</li>
		</ul>
	</div>`

	if(!noSelect) {
		pager.$find(".btr-pager-mid").replaceWith(html`
		<li class=btr-pager-mid>
			<span>Page</span><input class=btr-pager-cur type=text value=1><span>of <span class=btr-pager-total></span></span>
		</li>`)
	}

	const prev = pager.$find(".btr-pager-prev")
	const next = pager.$find(".btr-pager-next")
	const cur = pager.$find(".btr-pager-cur")

	Object.assign(pager, {
		curPage: 1,

		setPage(page) {
			this.curPage = page
			if(noSelect) {
				cur.textContent = page
				this.togglePrev(page > 1)
			} else {
				cur.value = page
				this.togglePrev(page > 1)
				this.toggleNext(page < this.maxPage)
			}
		},

		togglePrev(bool) { prev.$find("button").disabled = !bool },
		toggleNext(bool) { next.$find("button").disabled = !bool }
	})

	pager.setPage(1)

	prev.$find("button").$on("click", ev => {
		pager.onprevpage?.()
		ev.preventDefault()
	})
	
	next.$find("button").$on("click", ev => {
		pager.onnextpage?.()
		ev.preventDefault()
	})

	if(!noSelect) {
		const tot = pager.$find(".btr-pager-total")
		pager.maxPage = 1

		Object.assign(pager, {
			onprevpage() { if(this.curPage > 1 && this.onsetpage) { this.onsetpage(this.curPage - 1) } },
			onnextpage() { if(this.curPage < this.maxPage && this.onsetpage) { this.onsetpage(this.curPage + 1) } },

			setMaxPage(maxPage) {
				this.maxPage = maxPage
				tot.textContent = maxPage

				if(hideWhenEmpty) {
					pager.style.display = maxPage < 2 ? "none" : ""
				}

				this.toggleNext(this.curPage < maxPage)
			}
		})

		pager.setMaxPage(1)
		
		{
			const input = cur
			
			const updateInputWidth = () => {
				input.style.width = "0px"
				input.style.width = `${Math.max(32, Math.min(100, input.scrollWidth + 12))}px`
			}
			
			input.addEventListener("input", updateInputWidth)
			input.addEventListener("change", updateInputWidth)
			
			const descriptor = {
				configurable: true,
				
				get() {
					delete this.value
					const result = this.value
					Object.defineProperty(input, "value", descriptor)
					return result
				},
				set(x) {
					delete this.value
					this.value = x
					Object.defineProperty(input, "value", descriptor)
					updateInputWidth()
				}
			}
			
			Object.defineProperty(input, "value", descriptor)
		}

		cur.$on("keydown", e => e.keyCode === 13 && cur.blur())
		cur.$on("blur", () => {
			let page = parseInt(cur.value, 10)
			
			if(!Number.isNaN(page) && pager.onsetpage) {
				page = Math.max(1, Math.min(pager.maxPage, page))

				if(pager.curPage !== page) {
					pager.onsetpage(page)
				} else {
					pager.setPage(page)
				}
			} else {
				cur.value = pager.curPage
			}
		})
	}

	return pager
}

//

let redirectIndexCounter = 0
const redirectEvents = (from, to) => {
	const redirectIndex = redirectIndexCounter
	redirectIndexCounter += 2
	
	from.dataset.redirectEvents = redirectIndex
	to.dataset.redirectEvents = redirectIndex + 1
	
	InjectJS.inject((fromSelector, toSelector) => {
		const from = document.querySelector(fromSelector)
		const to = document.querySelector(toSelector)
		
		if(!from || !to) {
			console.log("redirectEvents fail", fromSelector, toSelector, from, to)
			return
		}
		
		const events = [
			"cancel", "click", "close", "contextmenu", "copy", "cut", "auxclick", "dblclick",
			"dragend", "dragstart", "drop", "focusin", "focusout", "input", "invalid",
			"keydown", "keypress", "keyup", "mousedown", "mouseup", "paste", "pause", "play",
			"pointercancel", "pointerdown", "pointerup", "ratechange", "reset", "seeked",
			"submit", "touchcancel", "touchend", "touchstart", "volumechange", "drag", "dragenter",
			"dragexit", "dragleave", "dragover", "mousemove", "mouseout", "mouseover", "pointermove",
			"pointerout", "pointerover", "scroll", "toggle", "touchmove", "wheel", "abort",
			"animationend", "animationiteration", "animationstart", "canplay", "canplaythrough",
			"durationchange", "emptied", "encrypted", "ended", "error", "gotpointercapture", "load",
			"loadeddata", "loadedmetadata", "loadstart", "lostpointercapture", "playing", "progress",
			"seeking", "stalled", "suspend", "timeupdate", "transitionend", "waiting", "change",
			"compositionend", "textInput", "compositionstart", "compositionupdate"
		]
		
		const methods = [
			"stopImmediatePropagation", "stopPropagation", "preventDefault",
			"getModifierState", "composedPath",
		]
		
		const callback = event => {
			const clone = new event.constructor(event.type, new Proxy(event, {
				get(target, prop) {
					return prop === "bubbles" ? false : target[prop]
				}
			}))
			
			Object.defineProperties(clone, {
				target: { value: event.target },
				bubbles: { value: event.bubbles },
			})
			
			for(const method of methods) {
				if(typeof clone[method] === "function") {
					clone[method] = new Proxy(clone[method], {
						apply(target, thisArg, args) {
							if(thisArg === clone) {
								target.apply(thisArg, args)
								return event[method].apply(event, args)
							}
							
							return target.apply(thisArg, args)
						}
					})
				}
			}
			
			if(!to.dispatchEvent(clone)) {
				event.preventDefault()
			}
		}
		
		for(const event of events) {
			from.addEventListener(event, callback, { capture: true })
		}
	}, `[data-redirect-events="${redirectIndex}"]`, `[data-redirect-events="${redirectIndex + 1}"]`)
}

//

const initReactFriends = () => {
	InjectJS.inject(() => {
		const { reactHook, hijackXHR, settings } = BTRoblox
		
		reactHook.hijackConstructor( // FriendsCarouselContainer
			(type, props) => "profileUserId" in props && "carouselName" in props, 
			(target, thisArg, args) => {
				const props = args[0]
				const carouselName = props.carouselName
				
				// disable MustHideConnections so that friends load in faster
				reactHook.hijackUseState(
					(value, index) => value === false && index == 4,
					(value, initial) => initial ? true : value
				)
				
				const result = target.apply(thisArg, args)
				
				// if MustHideConnect is enabled, communicate that to profile code somehow
				if(reactHook.renderTarget?.state?.[4]?.[0] === false) {
					const noFriendsLabel = reactHook.querySelector(result, ".friends-carousel-0-friends")
					console.log("C:", noFriendsLabel)
					if(noFriendsLabel) {
						noFriendsLabel.props.className += " btr-friends-carousel-disabled"
					}
				}
				
				return result
			}
		)
		
		reactHook.hijackConstructor( // FriendsList
			(type, props) => "friendsList" in props, 
			(target, thisArg, args) => {
				const props = args[0]
				const friendsList = props.friendsList
				const carouselName = props.carouselName
				
				let showSecondRow = false
				
				if(carouselName === "WebHomeFriendsCarousel") {
					showSecondRow = settings.home.friendsSecondRow
				} else if(carouselName === "WebProfileFriendsCarousel") {
					showSecondRow = settings.home.friendsSecondRow
					
					// Fixes an issue where profile friends list shows one too few friends
					props.isAddFriendsTileEnabled = false
				}
				
				if(showSecondRow) {
					reactHook.hijackUseState( // visibleFriendsList
						(value, index) => value === friendsList,
						(value, initial) => {
							if(value && friendsList && !initial) {
								let count = value.length * 2
								
								if(carouselName === "WebHomeFriendsCarousel") {
									const isTwoLines = value.length < friendsList.length
									localStorage.setItem("BTRoblox:homeFriendsIsTwoLines", isTwoLines ? "true" : "false")
									
									// account for Add Friends button
									count += 1
								}
								
								return friendsList.slice(0, count)
							}
							
							return value
						}
					)
				}
				
				const result = target.apply(thisArg, args)
				
				try { result.props.className = `${result.props.className ?? ""} btr-friends-list` }
				catch(ex) { console.error(ex) }
				
				if(showSecondRow) {
					try { result.props.className = `${result.props.className ?? ""} btr-friends-secondRow` }
					catch(ex) { console.error(ex) }
					
					if(carouselName === "WebHomeFriendsCarousel") {
						if(!friendsList && localStorage.getItem("BTRoblox:homeFriendsIsTwoLines") === "true") {
							try { result.props.className = `${result.props.className ?? ""} btr-friends-loading-two-lines` }
							catch(ex) { console.error(ex) }
						}
					}
				}
				
				return result
			}
		)
		
		if(settings.home.friendsShowUsername) {
			const friendsState = reactHook.createGlobalState({})
			
			hijackXHR(request => {
				if(request.method === "POST" && request.url === "https://apis.roblox.com/user-profile-api/v1/user/profiles/get-profiles") {
					request.onRequest.push(request => {
						const json = JSON.parse(request.body)
						
						if(!json.fields.includes("names.username")) {
							json.fields.push("names.username")
						}
						
						request.body = JSON.stringify(json)
					})
					
					request.onResponse.push(json => {
						for(const user of json.profileDetails) {
							friendsState.value[user.userId] = user
						}
						
						friendsState.update()
					})
				}
			})
			
			reactHook.hijackConstructor( // FriendTileContent
				(type, props) => props.displayName && props.userProfileUrl,
				(target, thisArg, args) => {
					const result = target.apply(thisArg, args)
					
					try {
						const userId = args[0].id
						
						const labels = reactHook.queryElement(result, x => x.props.className?.includes("friends-carousel-tile-labels"))
						if(labels && Array.isArray(labels.props.children)) {
							const friends = reactHook.useGlobalState(friendsState)
							const friend = friends[userId]
							
							if(friend) {
								labels.props.children.splice(1, 0, 
									reactHook.createElement("div", {
										className: "friends-carousel-tile-sublabel btr-friends-carousel-username-label",
										children: reactHook.createElement("span", {
											className: "btr-friends-carousel-username",
											children: `@${friend.names.username}`
										})
									})
								)
							}
						}
					} catch(ex) {
						console.error(ex)
					}
					
					return result
				}
			)
		}
		
		if(settings.home.friendPresenceLinks) {
			reactHook.hijackConstructor( // FriendTileDropdown
				(type, props) => props.friend && props.gameUrl,
				(target, thisArg, args) => {
					const result = target.apply(thisArg, args)
					
					try {
						const card = result.props.children?.[0]
						
						if(card?.props.className?.includes("in-game-friend-card")) {
							result.props.children[0] = reactHook.createElement("a", {
								href: args[0].gameUrl,
								style: { display: "contents" },
								onClick: event => event.preventDefault(),
								children: card
							})
						}
					} catch(ex) {
						console.error(ex)
					}
					
					return result
				}
			)
		}
	})
}

const initReactRobuxToCash = () => {
	if(!RobuxToCash.isEnabled()) { return }
	
	InjectJS.inject(() => {
		const { reactHook, RobuxToCash } = window.BTRoblox
		
		reactHook.inject(".text-robux-lg", elem => {
			const originalText = elem[0].props.children
			if(typeof originalText !== "string") { return }
			
			const robux = parseInt(originalText.replace(/\D/g, ""), 10)
			
			if(Number.isSafeInteger(robux)) {
				const cash = RobuxToCash.convert(robux)
				
				elem.append(reactHook.createElement("span", {
					className: "btr-robuxToCash-big",
					children: ` (${cash})`
				}))
			}
		})
		
		reactHook.inject(".text-robux-tile", elem => {
			const originalText = elem[0].props.children
			if(typeof originalText !== "string") { return }
			
			const robux = parseInt(originalText.replace(/\D/g, ""), 10)
			
			if(Number.isSafeInteger(robux)) {
				const cash = RobuxToCash.convert(robux)
				
				elem.append(reactHook.createElement("span", {
					className: "btr-robuxToCash-tile",
					children: ` (${cash})`
				}))
			}
		})
		
		reactHook.inject(".text-robux", elem => {
			const originalText = elem[0].props.children
			if(typeof originalText !== "string") { return }
			
			const robux = parseInt(originalText.replace(/\D/g, ""), 10)
			
			if(Number.isSafeInteger(robux)) {
				const cash = RobuxToCash.convert(robux)
				
				elem.append(reactHook.createElement("span", {
					className: "btr-robuxToCash",
					children: ` (${cash})`
				}))
			}
		})
		
		reactHook.inject(".icon-robux-container", elem => {
			const child = elem.find(x => "amount" in x.props)
			
			if(child) {
				const cash = RobuxToCash.convert(child[0].props.amount ?? 0)
				
				child.after(reactHook.createElement("span", {
					className: "btr-robuxToCash",
					children: ` (${cash})`
				}))
				
				return
			}
		})
	})
}

//

pageInit.common = () => {
	// Init global features
	
	Navigation.init()
	SettingsModal.enable()
	
	// Init common react
	
	initReactFriends()
	initReactRobuxToCash()
	
	//
	
	const headWatcher = document.$watch(">head").$then()
	const bodyWatcher = document.$watch(">body", body => {
		body.classList.toggle("btr-no-hamburger", SETTINGS.get("navigation.noHamburger"))
		body.classList.toggle("btr-hide-ads", SETTINGS.get("general.hideAds"))
	}).$then()

	headWatcher.$watch(`meta[name="user-data"]`, meta => {
		const userId = +meta.dataset.userid
		
		loggedInUser = Number.isSafeInteger(userId) ? userId : -1
		loggedInUserPromise.$resolve(loggedInUser)
	})
	
	$.ready(() => loggedInUserPromise.$resolve(-1))
	
	//
	
	InjectJS.inject(() => {
		const { reactHook } = BTRoblox
		
		reactHook.inject("#settings-popover-menu", elem => {
			elem.prepend(reactHook.createElement("li", {
				dangerouslySetInnerHTML: { __html: `<a class="rbx-menu-item btr-settings-toggle">BTR Settings</a>`}
			}))
		})
	})
	
	bodyWatcher.$watch("#roblox-linkify", linkify => {
		const index = linkify.dataset.regex.search(/\|[^|]*shoproblox\\.com/)
		
		if(index !== -1) {
			linkify.dataset.regex = linkify.dataset.regex.slice(0, index) + /|twitter\.com|youtube\.com|youtu\.be|twitch\.tv/.source + linkify.dataset.regex.slice(index)
			
			// Empty asHttpRegex matches everything, so every link will be unsecured, so fix that
			if(!linkify.dataset.asHttpRegex) { linkify.dataset.asHttpRegex = "^$" }
		} else {
			THROW_DEV_WARNING("linkify regex is not compatible")
		}
	})
	
	bodyWatcher.$watch("#navbar-robux").$then()
		.$watchAll("#buy-robux-popover", popover => {
			const bal = popover.$find("#nav-robux-balance")
			if(!bal) { return }

			const span = html`<span style="display:block;opacity:0.75;font-size:small;font-weight:500;"></span>`
			let lastText
			
			const update = () => {
				if(!RobuxToCash.isEnabled()) {
					span.remove()
					return
				}
				
				const text = bal.firstChild?.textContent
				if(lastText === text) { return }
				
				lastText = text

				const amt = parseInt(text.replace(/\D/g, ""), 10)
				if(!Number.isSafeInteger(amt)) { return }

				span.textContent = RobuxToCash.convert(amt)
				bal.append(span)
				bal.style.flexDirection = "column"
			}

			new MutationObserver(update).observe(bal, { childList: true })
			update()
			
			SETTINGS.onChange("general.robuxToUSDRate", update)
		})
	
	// Init optional features
	
	if(SETTINGS.get("general.fastSearch")) {
		try { btrFastSearch.init() }
		catch(ex) { console.error(ex) }
	}
	
	if(SETTINGS.get("general.hideAds")) {
		try { btrAdblock.init() }
		catch(ex) { console.error(ex) }
	}
	
	if(SETTINGS.get("general.fixFirefoxLocalStorageIssue")) {
		InjectJS.inject(() => {
			const { onSet, hijackFunction } = window.BTRoblox
			
			onSet(window, "CoreRobloxUtilities", CoreRobloxUtilities => {
				if(!CoreRobloxUtilities?.localStorageService?.saveDataByTimeStamp) { return }
				
				const lss = CoreRobloxUtilities.localStorageService
				const localCache = {}
				
				hijackFunction(lss, "storage", () => true)
				
				hijackFunction(lss, "removeLocalStorage", (fn, thisArg, args) => {
					delete localCache[args[0]]
					return fn.apply(thisArg, args)
				})
				
				hijackFunction(lss, "getLocalStorage", (fn, thisArg, args) => {
					if(args[0] in localCache) {
						return JSON.parse(localCache[args[0]])
					}
					
					return fn.apply(thisArg, args)
				})
				
				hijackFunction(lss, "setLocalStorage", (fn, thisArg, args) => {
					try {
						delete localCache[args[0]]
						return fn.apply(thisArg, args)
					} catch(ex) {
						localCache[args[0]] = JSON.stringify(args[1])
						console.error(ex)
					}
				})
			})
		})
	}
	
	if(SETTINGS.get("general.cacheRobuxAmount")) {
		InjectJS.inject(() => {
			const { reactHook } = window.BTRoblox
			
			reactHook.hijackConstructor(
				(type, props) => "isGetCurrencyCallDone" in props && "isExperimentCallDone" in props && "robuxAmount" in props,
				(target, thisArg, args) => {
					try {
						const props = args[0]
						
						if(props.isGetCurrencyCallDone && props.isExperimentCallDone) {
							if(Number.isSafeInteger(props.robuxAmount)) {
								localStorage.setItem("BTRoblox:cachedRobux", props.robuxAmount)
							}
						} else {
							const cachedRobux = localStorage.getItem("BTRoblox:cachedRobux")
							
							if(cachedRobux) {
								props.isExperimentCallDone = true
								props.isGetCurrencyCallDone = true
								props.robuxAmount = +cachedRobux
							}
						}
					} catch {}
					
					return target.apply(thisArg, args)
				}
			)
		})
	}
	
	if(SETTINGS.get("general.higherRobuxPrecision")) {
		InjectJS.inject(() => {
			const { reactHook, hijackFunction, onSet } = window.BTRoblox
			let hijackTruncValue = false

			onSet(window, "CoreUtilities", CoreUtilities => {
				hijackFunction(CoreUtilities.abbreviateNumber, "getTruncValue", (target, thisArg, args) => {
					if(hijackTruncValue && args.length === 1) {
						try {
							return target.apply(thisArg, [args[0], 100_000, null, 2])
						} catch(ex) {
							console.error(ex)
						}
					}

					return target.apply(thisArg, args)
				})
			})

			reactHook.hijackConstructor(
				(type, props) => "robuxAmount" in props && type.toString().includes("nav-robux-amount"),
				(target, thisArg, args) => {
					hijackTruncValue = true
					const result = target.apply(thisArg, args)
					hijackTruncValue = false
					return result
				}
			)
		})
	}
	
	if(SETTINGS.get("groups.shoutAlerts") && SETTINGS.get("groups.shoutAlertsInNotifStream")) {
		const streamItems = document.getElementsByClassName("notification-stream-item")
		const groupShoutInfo = {}
		
		const groupIconRequest = []
		let groupIconRequestPromise
		
		const requestGroupIcon = groupId => {
			if(!groupIconRequest.includes(groupId)) {
				groupIconRequest.push(groupId)
			}
			
			if(!groupIconRequestPromise) {
				groupIconRequestPromise = new Promise(resolve => {
					setTimeout(() => {
						RobloxApi.thumbnails.getGroupIcons(groupIconRequest.splice(0, groupIconRequest.length))
							.then(resolve)
					}, 0)
				})
			}
			
			return groupIconRequestPromise.then(json => json.data.find(x => x.targetId === groupId))
		}
		
		$.onDomChanged(() => {
			for(const streamItem of streamItems) {
				const groupId = parseInt(streamItem.id.match(/btr-groupshout-(\d+)/)?.[1], 10)
				if(!Number.isSafeInteger(groupId)) { continue }
				
				const shout = groupShoutInfo[groupId]
				if(shout && !streamItem.dataset.btrPopulated) {
					streamItem.dataset.btrPopulated = true
					streamItem.style.padding = "0"
					
					const url = `/communities/${shout.groupId}/${formatUrlName(shout.groupName)}`
					
					streamItem.append(html`
					<div class=legacy-notif-base>
						<div class="notif-content-container">
							<a href="${url}" style=display:contents>
								<span class="thumbnail-2d-container game-icon-container shimmer">
									<img class="loading" src="" alt="" title="">
								</span>
							</a>
							<div class="small text text-content">
								<span>
									<a href="${url}" style=display:contents>
										<b style=display:block><span class=btr-notif-title>${shout.groupName}</span></b>
									</a>
									<span class=btr-notif-desc>${shout.body}</span>
								</span>
								<span class=btr-notif-date>${new Date(shout.updated).$format("MMM D, YYYY | hh:mm A")}</span>
							</div>
						</div>
					</div>`)
					
					robloxLinkify(streamItem.$find(".btr-notif-desc"))
					
					requestGroupIcon(shout.groupId).then(icon => {
						const thumbnail = streamItem.$find(".thumbnail-2d-container")
						const img = thumbnail.$find("img")
						
						img.src = icon.imageUrl
						thumbnail.classList.remove("shimmer")
						img.classList.remove("loading")
					})
				}
			}
		})
		
		InjectJS.listen("getRecentShouts", () => {
			MESSAGING.send("getRecentShouts", shouts => {
				for(const shout of shouts) {
					groupShoutInfo[shout.groupId] = shout
				}
				
				InjectJS.send("setRecentShouts", shouts)
			})
		})
		
		InjectJS.listen("markShoutsAsInteracted", () => {
			MESSAGING.send("markShoutsAsInteracted")
		})
		
		InjectJS.inject(() => {
			const { angularHook, hijackFunction, onSet, IS_DEV_MODE, contentScript } = window.BTRoblox
			const shoutNotifications = []
			const shoutListeners = []
			
			contentScript.listen("setRecentShouts", notifs => {
				shoutNotifications.splice(0, shoutNotifications.length, ...notifs)
				
				for(const fn of shoutListeners.splice(0, shoutListeners.length)) {
					fn(shoutNotifications)
				}
			})
			
			angularHook.hijackModule("notificationStream", {
				notificationStreamController(target, thisArg, args, argsMap) {
					try {
						const { $scope, notificationStreamService } = argsMap
						let addShoutsToNotifs = false
						
						onSet($scope, "getRecentNotifications", () => {
							hijackFunction($scope, "getRecentNotifications", (target, thisArg, args) => {
								addShoutsToNotifs = true
								const result = target.apply(thisArg, args)
								addShoutsToNotifs = false
								
								return result
							})
						})
						
						hijackFunction(notificationStreamService, "getRecentNotifications", (target, thisArg, args) => {
							const result = target.apply(thisArg, args)
							
							if(addShoutsToNotifs) {
								const promise = new Promise(resolve => shoutListeners.push(resolve))
								contentScript.send("getRecentShouts")
								
								return result.then(async data => {
									const shouts = await promise
									
									try {
										for(const shout of shouts) {
											const entry = {
												id: `btr-groupshout-${shout.groupId}`,
												notificationSourceType: "BTRobloxGroupShout",
												eventDate: shout.updated,
												isInteracted: shout.interacted,
												metadataCollection: [],
												eventCount: 1,
												content: null
											}
											
											$scope.notifications[entry.id] = entry
											
											if($scope.notificationIds.indexOf(entry.id) === -1) {
												$scope.notificationIds.push(entry.id)
											}
										}
									} catch(ex) {}
									
									return data
								})
							}
							
							return result
						})
						
					} catch(ex) {
						console.error(ex)
						if(IS_DEV_MODE) { alert("hijackAngular Error") }
					}
					
					const result = target.apply(thisArg, args)
					return result
				},
				
				notificationStreamService(target, thisArg, args, argsMap) {
					const result = target.apply(thisArg, args)
					
					try {
						hijackFunction(result, "unreadCount", (target, thisArg, args) => {
							const result = target.apply(thisArg, args)
							const promise = new Promise(resolve => shoutListeners.push(resolve))
							
							contentScript.send("getRecentShouts")
							
							return result.then(async data => {
								const shouts = await promise
								
								for(const shout of shouts) {
									if(!shout.interacted) {
										data.unreadNotifications += 1
									}
								}
								
								return data
							})
						})
						
						hijackFunction(result, "clearUnread", (target, thisArg, args) => {
							contentScript.send("markShoutsAsInteracted")
							return target.apply(thisArg, args)
						})
					} catch(ex) {
						console.error(ex)
						if(IS_DEV_MODE) { alert("hijackAngular Error") }
					}
					
					return result
				}
			})
		})
	}
	
	if(SETTINGS.get("home.hideFriendActivity")) {
		InjectJS.inject(() => {
			const { hijackXHR, settings } = window.BTRoblox
			
			hijackXHR(request => {
				if(request.method === "POST" && request.url.match(/^https:\/\/apis\.roblox\.com\/discovery-api\/omni-recommendation(-metadata)?$/i)) {
					request.onResponse.push(json => {
						if(json?.contentMetadata?.Game) {
							for(const gameData of Object.values(json.contentMetadata.Game)) {
								delete gameData.friendActivityTitle
							}
						}
					})
				}
			})
		})
	}
	
	// Chat
	
	if(SETTINGS.get("general.hideChat")) {
		bodyWatcher.$watch("#chat-container", cont => cont.remove())
	} else {
		if(SETTINGS.get("general.smallChatButton")) {
			bodyWatcher.$watch("#chat-container", cont => cont.classList.add("btr-small-chat-button"))
			
			InjectJS.inject(() => {
				const { angularHook, IS_DEV_MODE } = window.BTRoblox
				
				angularHook.hijackModule("chat", {
					chatController(target, thisArg, args, argsMap) {
						const result = target.apply(thisArg, args)

						try {
							const { $scope, chatUtility } = argsMap

							const library = $scope.chatLibrary
							const width = library.chatLayout.widthOfChat

							$scope.$watch(() => library.chatLayout.collapsed, value => {
								library.chatLayout.widthOfChat = value ? 54 + 6 : width
								chatUtility.updateDialogsPosition(library)
							})
						} catch(ex) {
							console.error(ex)
							if(IS_DEV_MODE) { alert("hijackAngular Error") }
						}

						return result
					}
				})
			})
		}
	}
}
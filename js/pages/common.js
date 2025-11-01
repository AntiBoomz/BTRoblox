"use strict"

const pageInit = {}

const pageReset = {}
const pageLoad = {}

const onPageLoad = fn => {
	const pageName = currentPage?.name
	$.assert(pageName)
	
	pageLoad[pageName] ??= []
	pageLoad[pageName].push(fn)
}

const onPageReset = fn => {
	const pageName = currentPage?.name
	$.assert(pageName)
	
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
			const header = $.bufferToString(buffer.subarray(0, 4))
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
	
	injectScript.call("redirectEvents", (fromSelector, toSelector) => {
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
	injectScript.call("initReactFriends", () => {
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
	
	injectScript.call("initReactRobuxToCash", () => {
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

const angularTemplateCache = {}

const modifyAngularTemplate = (keyArray, callback) => {
	if(typeof keyArray === "string") {
		keyArray = [keyArray]
	}
	
	const listener = {
		finished: false,
		
		update() {
			for(const key of keyArray) {
				if(!angularTemplateCache[key].body) {
					return
				}
			}
			
			if(this.finished) { return }
			this.finished = true
			
			const args = []
			
			for(const key of keyArray) {
				const cacheEntry = angularTemplateCache[key]
				cacheEntry.listeners.delete(listener)
				args.push(cacheEntry.body)
			}
			
			try { callback(...args) }
			catch(ex) { console.error(ex) }
			
			for(const key of keyArray) {
				const cacheEntry = angularTemplateCache[key]
				injectScript.send("updateTemplate", key, cacheEntry.body.innerHTML)
			}
		}
	}
	
	for(const key of keyArray) {
		const cacheEntry = angularTemplateCache[key] = angularTemplateCache[key] || { listeners: new Set(), listening: false }
		cacheEntry.listeners.add(listener)
		
		if(!cacheEntry.listening) {
			cacheEntry.listening = true
			injectScript.send("listenForTemplate", key)
		}
	}
	
	if(IS_DEV_MODE) {
		$.ready(() => setTimeout(() => {
			if(!listener.finished) {
				console.warn(`Missing templates in modifyTemplate ${JSON.stringify(keyArray)}`)
			}
		}, 5e3))
	}
}

const initAngularTemplates = () => {
	injectScript.listen("initTemplate", (key, html) => {
		// self closing tag support
		html = html.replace(/<([\w-:]+)([^>]*)\/>/gi, "<$1$2></$1>")
		
		const cacheEntry = angularTemplateCache[key]
		cacheEntry.body = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html").body
		
		for(const listener of cacheEntry.listeners.values()) {
			listener.update()
		}
	})
}

//

const initPreview = async (assetId, assetTypeId, isBundle) => {
	if(!SETTINGS.get("itemdetails.itemPreviewer")) { return }
	
	const isPreviewable = AnimationPreviewAssetTypeIds.includes(assetTypeId) || WearableAssetTypeIds.includes(assetTypeId)
	if(!isBundle && !isPreviewable) { return }
	
	const previewerMode = SETTINGS.get("itemdetails.itemPreviewerMode")
	let autoLoading = false
	
	const assetPromises = []
	let currentOutfitId
	let playedAnimation
	let bundleType
	let preview
	
	let previewPromise = new Promise(resolve => {})
	
	const setOutfit = outfitId => {
		if(!preview) {
			currentOutfitId = outfitId
			return
		}
		
		preview.setBundleOutfit(outfitId)
		
		if(bundleType !== "AvatarAnimations") {
			preview.selectOutfit("bundle")
		}
	}
	
	const loadPreview = $.onceFn(async () => {
		await loadOptionalFeature("previewer")
		preview = new ItemPreviewer()
		
		if(currentOutfitId) {
			setOutfit(currentOutfitId)
		}
		
		// Add default animations
		const disabledTypes = [
			AssetType.ClimbAnimation, AssetType.FallAnimation, AssetType.IdleAnimation,
			AssetType.JumpAnimation, AssetType.RunAnimation, AssetType.SwimAnimation,
			AssetType.WalkAnimation, AssetType.Animation, AssetType.EmoteAnimation
		]
		
		if(!disabledTypes.includes(assetTypeId) && bundleType !== "AvatarAnimations") {
			const defaultAnimsR15 = {
				run: [913376220],
				walk: [913402848],
				swim: [913384386],
				swimidle: [913389285],
				jump: [507765000],
				idle: [507766388, 507766666],
				fall: [507767968],
				climb: [507765644]
			}
			
			const defaultAnimsR6 = {
				run: [180426354],
				walk: [],
				swim: [],
				swimidle: [],
				jump: [125750702],
				idle: [180435571, 180435792],
				fall: [180436148],
				climb: [180436334]
			}
			
			const applyAnimation = () => {
				const anims = preview.playerType === "R6" ? defaultAnimsR6 : defaultAnimsR15
				
				for(const [category, assetIds] of Object.entries(anims)) {
					preview.removeBundleAnimations(category)
					
					for(const assetId of assetIds) {
						preview.addBundleAnimation(assetId, category, "")
					}
				}
				
				preview.playAnimation(anims.idle[0])
			}
			
			preview.on("playerTypeChanged", applyAnimation)
			applyAnimation()
		}
		
		previewPromise.$resolve(preview)
	})
		
	const addAsset = async (assetId, assetTypeId, assetName, meta) => {
		if(AnimationPreviewAssetTypeIds.includes(assetTypeId)) {
			await loadPreview()
			preview.setVisible(true)
			
			if(!autoLoading && (previewerMode === "always" || previewerMode === "animations")) {
				autoLoading = true
				$.ready(() => preview.setEnabled(true))
			}
			
			if(assetTypeId === 24) {
				// Animation asset, no need to process
				preview.addAnimation(assetId, assetName)
				
				if(!playedAnimation) {
					playedAnimation = true
					preview.initPlayerTypeFromPlayingAnimation = true
					preview.playAnimation(assetId)
				}
				
			} else if(assetTypeId === 61) {
				// Emote asset, contains an Animation
				const model = await AssetCache.loadModel(assetId)
				const animation = model.find(x => x.ClassName === "Animation")
				const animationId = AssetCache.getAssetIdFromUrl(animation.AnimationId)
				
				preview.addAnimation(animationId, assetName)
				
				if(!playedAnimation) {
					playedAnimation = true
					preview.initPlayerTypeFromPlayingAnimation = true
					preview.playAnimation(animationId)
				}
				
			} else {
				// Avatar animation
				const model = await AssetCache.loadModel(assetId)
				const folder = model.find(x => x.Name === "R15Anim")
				
				for(const value of folder.Children) {
					if(value.ClassName !== "StringValue") { continue }
					
					preview.removeBundleAnimations(value.Name)
					
					for(const animation of value.Children) {
						if(animation.ClassName !== "Animation") { continue }
						
						const animationId = AssetCache.getAssetIdFromUrl(animation.AnimationId)
						
						preview.addBundleAnimation(animationId, value.Name, assetName)

						if(!playedAnimation && (!isBundle || value.Name === "idle")) {
							playedAnimation = true
							preview.initPlayerTypeFromPlayingAnimation = true
							preview.playAnimation(animationId)
						}
					}
				}
			}
			
		} else if(WearableAssetTypeIds.includes(assetTypeId)) {
			await loadPreview()
			
			const asset = preview.addAssetPreview(assetId, assetTypeId, meta)
			if(!asset) { return }
			
			preview.setVisible(true)
			
			if(!autoLoading && previewerMode === "always") {
				autoLoading = true
				$.ready(() => preview.setEnabled(true))
			}
		}
	}
	
	if(document.visibilityState === "hidden") {
		await new Promise(resolve => document.$on("visibilitychange", () => resolve(), { once: true }))
	}
	
	if(isBundle) {
		assetPromises.push(
			RobloxApi.catalog.getBundleDetails(assetId).then(async details => {
				bundleType = details.bundleType
				
				const outfitPromise = new Promise(resolve => {
					const promises = []
					
					for(const item of details.items) {
						if(item.type === "UserOutfit") {
							promises.push(RobloxApi.avatar.getOutfitDetails(item.id).then(details => {
								if(details?.outfitType === "Avatar") {
									resolve(details)
								}
							}))
						}
					}
					
					Promise.all(promises).then(() => resolve(null))
				})
				
				const bundlePromises = []
				
				bundlePromises.push(
					outfitPromise.then(outfit => {
						if(outfit) {
							setOutfit(outfit.id)
						}
					})
				)
				
				for(const item of details.items) {
					if(item.type === "Asset") {
						bundlePromises.push(
							AssetCache.resolveAsset(item.id).then(async assetRequest => {
								const outfit = await outfitPromise
								return addAsset(item.id, assetRequest.assetTypeId, item.name, outfit?.assets.find(x => x.id === item.id)?.meta)
							})
						)
					}
				}
				
				return Promise.all(bundlePromises)
			})
		)
	} else {
		assetPromises.push(
			addAsset(assetId, assetTypeId, $("#item-container")?.dataset.itemName || "Asset")
		)
	}
	
	Promise.all(assetPromises).then(async () => {
		if(!preview) { return null }
		
		await preview.waitForAppearance()
		
		let gotAnything = false
		
		for(const asset of preview.previewAssets.values()) {
			if(!asset.isEmpty()) {
				gotAnything = true
				break
			}
		}
		
		if(!gotAnything && !currentOutfitId && !playedAnimation) {
			console.log("We've got nothing, let's just remove previewer")
			preview.setEnabled(false)
			preview.setVisible(false)
		}
	}).finally(() => {
		if(!preview) {
			previewPromise.$resolve(null)
		}
	})
	
	return previewPromise
}

const canDownloadAssetCache = {}
const canDownloadAsset = (assetId, assetTypeId) => canDownloadAssetCache[assetId] = canDownloadAssetCache[assetId] || (async () => {
	// NOTE: This assumes you have the marketplace/itemdetails page for the item open at the moment
	// Marketplace pages for models you don't have access to are hidden, so we dont need to check those
	
	if(/*assetTypeId === AssetType.Model ||*/ assetTypeId === AssetType.Plugin || assetTypeId === AssetType.Audio) {
		const json = await RobloxApi.assetdelivery.requestAssetV2(assetId, { browserAssetRequest: true })
		
		if(!json?.locations) {
			return false
		}
	}
	
	return true
})()

const initExplorer = async (assetId, assetTypeId, isBundle) => {
	if(!SETTINGS.get("itemdetails.explorerButton") || !isBundle && InvalidExplorableAssetTypeIds.includes(assetTypeId)) {
		return
	}
	
	if(!isBundle) {
		const canDownload = await canDownloadAsset(assetId, assetTypeId)
		if(!canDownload) { return }
	}
	
	const btnCont = html`
	<div class="btr-explorer-button-container btr-temp-fixed">
		<a class=btr-explorer-button>
			<span class=btr-icon-explorer></span>
		</a>
		<div class=btr-explorer-popover>
			<div class=btr-explorer-parent></div>
		</div>
	</div>`

	loadOptionalFeature("explorer").then(() => {
		const explorer = new Explorer()
		let explorerInitialized = false
		
		const popover = btnCont.$find(".btr-explorer-popover")
		popover.$find(".btr-explorer-parent").replaceWith(explorer.element)
		
		btnCont.$on("click", ".btr-explorer-button", () => {
			if(popover.classList.contains("visible")) {
				popover.classList.remove("visible")
				explorer.setActive(false)
				return
			}
			
			popover.classList.add("visible")
			popover.style.left = `calc(50% - ${popover.clientWidth / 2}px)`
			
			if(!explorerInitialized) {
				explorerInitialized = true
				
				const updateLoadingText = perc => explorer.setLoadingText(`Loading... ${Math.floor(perc * 100 + 0.5)}%`)
				explorer.setLoadingText(`Downloading...`)
				
				if(isBundle) {
					let first = true
					RobloxApi.catalog.getBundleDetails(assetId).then(async details => {
						for(const item of details.items) {
							if(item.type === "Asset") {
								AssetCache.loadModel(item.id, { async: true, onProgress: first && updateLoadingText }, model => explorer.addModel(item.name, model))
								first = false
							}
						}
					})
				
				} else if(assetTypeId === AssetType.Head || assetTypeId === AssetType.DynamicHead) {
					AssetCache.loadModel(assetId, { async: true, onProgress: updateLoadingText, format: "avatar_meshpart_head" }, model => {
						AssetCache.loadModel(assetId, { async: true }, model => explorer.addModel("SpecialMesh", model))
						explorer.addModel("MeshPart", model)
					})
					
				} else if(AccessoryAssetTypeIds.includes(assetTypeId)) {
					AssetCache.loadModel(assetId, { async: true, onProgress: updateLoadingText, format: "avatar_meshpart_accessory" }, model => {
						if(assetTypeId <= AssetType.WaistAccessory) { // is not layered clothing
							AssetCache.loadModel(assetId, { async: true }, model => explorer.addModel("SpecialMesh", model))
						}
						explorer.addModel("MeshPart", model)
					})
					
				} else {
					AssetCache.loadModel(assetId, { async: true, onProgress: updateLoadingText }, model => explorer.addModel("Default", model, { open: assetTypeId !== AssetType.Place }))
				}
			}
			
			explorer.select([])
			explorer.setActive(true)

			const popLeft = explorer.element.getBoundingClientRect().right + 276 >= document.documentElement.clientWidth
			explorer.element.$find(".btr-properties").classList.toggle("left", popLeft)
		})
		
		document.body.$on("mousedown", ev => {
			if(popover.classList.contains("visible") && !btnCont.contains(ev.target) && !explorer.getRootElement().contains(ev.target)) {
				popover.classList.remove("visible")
				explorer.setActive(false)
			}
		})
	})
	
	return btnCont
}

const initDownloadButton = async (assetId, assetTypeId, isBundle) => {
	if(isBundle) {
		return
	}
	
	if(!SETTINGS.get("itemdetails.downloadButton") || InvalidDownloadableAssetTypeIds.includes(assetTypeId)) {
		return
	}

	const canDownload = await canDownloadAsset(assetId, assetTypeId)
	if(!canDownload) { return }
	
	const btnCont = html`
	<div class=btr-download-button-container>
		<a class=btr-download-button>
			<span class=btr-icon-download></span>
		</a>
	</div>`
	
	const downloadButton = btnCont.$find("a")

	const download = (data, fileType) => {
		const title = $("#item-container .item-name-container h2")
		const fileName = `${title && formatUrlName(title.textContent, "") || assetId.toString()}.${fileType || getAssetFileType(assetTypeId, data)}`

		const blobUrl = URL.createObjectURL(new Blob([data], { type: "binary/octet-stream" }))
		startDownload(blobUrl, fileName)
		URL.revokeObjectURL(blobUrl)
	}

	const doNamedDownload = event => {
		const target = event.currentTarget
		event.preventDefault()
		
		if(downloadButton.classList.contains("disabled")) {
			return
		}
		
		downloadButton.classList.add("disabled")
		downloadButton.classList.add("loading")

		const format = target.getAttribute("format") ?? undefined
		
		if(format === "obj") {
			AssetCache.loadMesh(assetId, mesh => {
				downloadButton.classList.remove("disabled")
				downloadButton.classList.remove("loading")
				
				const lines = []

				lines.push("o Mesh")

				for(let i = 0, len = mesh.vertices.length; i < len; i += 3) {
					lines.push(`v ${mesh.vertices[i]} ${mesh.vertices[i + 1]} ${mesh.vertices[i + 2]}`)
				}

				lines.push("")

				for(let i = 0, len = mesh.normals.length; i < len; i += 3) {
					lines.push(`vn ${mesh.normals[i]} ${mesh.normals[i + 1]} ${mesh.normals[i + 2]}`)
				}

				lines.push("")

				for(let i = 0, len = mesh.uvs.length; i < len; i += 2) {
					lines.push(`vt ${mesh.uvs[i]} ${mesh.uvs[i + 1]}`)
				}

				lines.push("")
				
				// only use the first lod
				const faces = mesh.faces.subarray(mesh.lods[0] * 3, mesh.lods[1] * 3)
				
				for(let i = 0, len = faces.length; i < len; i += 3) {
					const a = faces[i] + 1
					const b = faces[i + 1] + 1
					const c = faces[i + 2] + 1
					lines.push(`f ${a}/${a}/${a} ${b}/${b}/${b} ${c}/${c}/${c}`)
				}

				download(lines.join("\n"), "obj")
			})
		} else {
			AssetCache.loadBuffer(assetId, { browserAssetRequest: assetTypeId === AssetType.Audio, format: format }, buffer => {
				downloadButton.classList.remove("disabled")
				downloadButton.classList.remove("loading")
				
				if(!buffer) {
					alert("Failed to download")
					return
				}

				download(buffer)
			})
		}
	}
	
	const assetUrl = AssetCache.toAssetUrl(assetId)
	
	if(assetTypeId === AssetType.Mesh) {
		const popoverTemplate = html`
		<div class=btr-download-popover>
			<ul>
				<li>
					<a class=btr-download href="${assetUrl}">Download as .mesh</a>
				</li>
				<li>
					<a class=btr-download format=obj>Download as .obj</a>
				</li>
			</ul>
		</div>`
		
		if(IS_DEV_MODE) {
			popoverTemplate.$find("ul").append(html`
			<li>
				<a class=btr-log-mesh>Print to console</a>
			</li>`)
			
			btnCont.$on("click", ".btr-log-mesh", () => {
				AssetCache.loadMesh(assetId, mesh => {
					console.log(mesh)
				})
			})
		}
		
		downloadButton.$on("click", event => {
			event.preventDefault()
			event.stopPropagation()
			popoverTemplate.classList.toggle("visible")
		})
		
		document.$on("click", event => {
			if(popoverTemplate.classList.contains("visible")) {
				popoverTemplate.classList.toggle("visible")
			}
		})
		
		downloadButton.after(popoverTemplate)
		btnCont.$on("click", ".btr-download", doNamedDownload)
		
	} else if(assetTypeId === AssetType.Head || assetTypeId === AssetType.DynamicHead) {
		downloadButton.dataset.toggle = "popover"
		downloadButton.dataset.bind = "popover-btr-download"
		
		const popoverTemplate = html`
		<div class=rbx-popover-content data-toggle=popover-btr-download>
			<ul class=dropdown-menu role=menu>
				<li>
					<a class=btr-download format=avatar_meshpart_head href="${assetUrl}">Download MeshPart</a>
				</li>
				<li>
					<a class=btr-download>Download SpecialMesh</a>
				</li>
			</ul>
		</div>`
		
		downloadButton.after(popoverTemplate)
		btnCont.$on("click", ".btr-download", doNamedDownload)
		
	} else if(AccessoryAssetTypeIds.includes(assetTypeId)) {
		if(assetTypeId <= AssetType.WaistAccessory) {
			downloadButton.dataset.toggle = "popover"
			downloadButton.dataset.bind = "popover-btr-download"
			
			const popoverTemplate = html`
			<div class=rbx-popover-content data-toggle=popover-btr-download>
				<ul class=dropdown-menu role=menu>
					<li>
						<a class=btr-download format=avatar_meshpart_accessory href="${assetUrl}">Download MeshPart</a>
					</li>
					<li>
						<a class=btr-download>Download SpecialMesh</a>
					</li>
				</ul>
			</div>`
			
			downloadButton.after(popoverTemplate)
			btnCont.$on("click", ".btr-download", doNamedDownload)
		} else {
			downloadButton.href = assetUrl
			downloadButton.setAttribute("format", "avatar_meshpart_accessory")
			downloadButton.$on("click", doNamedDownload)
		}
	} else {
		downloadButton.href = assetUrl
		downloadButton.$on("click", doNamedDownload)
	}
	
	if(downloadButton.dataset.toggle) {
		setTimeout(() => { // a bit ugly, but eh
			injectScript.call("setupPopovers", () => {
				Roblox?.BootstrapWidgets?.SetupPopover(null, null, "[data-bind^='popover-btr-']")
			})
		}, 0)
	}
	
	return btnCont
}

const initContentButton = async (assetId, assetTypeId) => {
	if(!SETTINGS.get("itemdetails.contentButton")) {
		return
	}
	
	const getAssetUrl = ContainerAssetTypeIds[assetTypeId]
	if(!getAssetUrl) {
		return
	}

	const canDownload = await canDownloadAsset(assetId, assetTypeId)
	if(!canDownload) { return }
	
	const btnCont = html`
	<div class=btr-content-button-container>
		<a class="btr-content-button disabled" href="#">
			<span class=btr-icon-content></span>
		</a>
	</div>`

	AssetCache.loadModel(assetId, model => {
		const contentUrl = getAssetUrl(model)
		const contentId = AssetCache.getAssetIdFromUrl(contentUrl)
		
		if(contentId) {
			btnCont.$find(">a").href = `https://www.roblox.com/library/${contentId}/` // marketplace needs full domain
			btnCont.$find(">a").classList.remove("disabled")
		}
	})
	
	return btnCont
}

//

const robloxExperiments = {}

pageInit.www = () => {
	// Init global features
	
	Navigation.init()
	SettingsModal.enable()
	
	// Init common react
	
	initReactFriends()
	initReactRobuxToCash()
	
	// Init common angular
	
	initAngularTemplates()
	
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
	
	injectScript.call("addBTRSettings", () => {
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
		injectScript.call("fixFirefoxLocalStorageIssue", () => {
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
		injectScript.call("cacheRobuxAmount", () => {
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
		injectScript.call("higherRobuxPrecision", () => {
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
					
					injectScript.call("linkify", target => $(target).linkify(), streamItem.$find(".btr-notif-desc"))
					
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
		
		injectScript.listen("getRecentShouts", () => {
			backgroundScript.send("getRecentShouts", shouts => {
				for(const shout of shouts) {
					groupShoutInfo[shout.groupId] = shout
				}
				
				injectScript.send("setRecentShouts", shouts)
			})
		})
		
		injectScript.listen("markShoutsAsInteracted", () => {
			backgroundScript.send("markShoutsAsInteracted")
		})
		
		injectScript.call("shoutAlerts", () => {
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
		injectScript.call("hideFriendActivity", () => {
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
			
			injectScript.call("smallChatButton", () => {
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
	
	// Experiments
	
	injectScript.listen("populateExperiment", (experiment, key, value) => {
		robloxExperiments[experiment] ??= {}
		robloxExperiments[experiment][key] = value
		
		if(typeof SettingsModal !== "undefined") {
			SettingsModal.robloxExperimentsChanged()
		}
	})
	
	injectScript.call("experiments", () => {
		const modified = {}
		const initial = {}
		const layers = {}
		
		const modify = (experiment, key, value) => {
			modified[experiment] ??= {}
			
			if(typeof value === "string") {
				try { modified[experiment][key] = JSON.parse(value) }
				catch(ex) { delete modified[experiment][key] }
			} else {
				delete modified[experiment][key]
			}
			
			if(layers[experiment]) {
				const modifiedValue = key in modified[experiment] ? modified[experiment][key] : value
				
				for(const layer of layers[experiment]) {
					layer[key] = modifiedValue
				}
			}
		}
		
		contentScript.listen("updateExperiment", modify)
		
		try {
			const saved = JSON.parse(settings.general.experiments || "{}")
			
			if(saved) {
				for(const [experiment, values] of Object.entries(saved)) {
					for(const [key, value] of Object.entries(values)) {
						modify(experiment, key, value)
					}
				}
			}
		} catch(ex) {
			console.error(ex)
		}
		
		const populate = (experiment, key, value) => {
			if(key === "then" || key === "toJSON") { return }
			
			initial[experiment] ??= {}
			if(key in initial[experiment]) { return }
			
			initial[experiment][key] = value
			contentScript.send("populateExperiment", experiment, key, value)
		}
		
		onSet(window, "Roblox", Roblox => {
			onSet(Roblox, "ExperimentationService", ExperimentationService => {
				hijackFunction(ExperimentationService, "getAllValuesForLayer", (target, thisArg, args) => {
					let result = target.apply(thisArg, args)
					
					if(result instanceof Promise) {
						const experiment = args[0]
						
						result = result.then(layer => {
							try {
								for(const [key, value] of Object.entries(layer)) {
									populate(experiment, key, value)
								}
								
								layers[experiment] ??= []
								layers[experiment].push(layer)
								
								if(modified[experiment]) {
									for(const [key, modifiedValue] of Object.entries(modified[experiment])) {
										layer[key] = modifiedValue
									}
								}
								
								return new Proxy(layer, {
									get(target, key) {
										populate(experiment, key, undefined)
										return target[key]
									}
								})
							} catch(ex) {
								if(IS_DEV_MODE) {
									console.error(ex)
								}
							}
							
							return layer
						})
					}
					
					return result
				})
			})
		})
	})
}
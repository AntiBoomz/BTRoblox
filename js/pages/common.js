"use strict"

const pageInit = {}

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

let currentNativeAudioPlayer
const useNativeAudioPlayer = (mediaPlayer, bigPlayer) => {
	mediaPlayer.$on("click", ev => {
		ev.preventDefault()
		ev.stopPropagation()
		ev.stopImmediatePropagation()
		
		if(currentNativeAudioPlayer?.element === mediaPlayer) {
			currentNativeAudioPlayer.close()
			return
		}
		
		currentNativeAudioPlayer?.close()
		
		const mediaUrl = mediaPlayer.dataset.mediathumbUrl
		
		const audio = html`<audio id="btr-native-player" controls autoplay>`
		audio.src = mediaUrl
		audio.volume = SETTINGS.get("general.fixAudioVolume") ? 0.5 : 1
		
		if(bigPlayer) {
			audio.style.cssText = `position:absolute;left:10px;bottom:11px;width:calc(100% - 50px - 20px);height:38px;border-radius:100px;box-shadow:0 0px 3px 1px rgba(0,0,0,0.15);`
			mediaPlayer.parentNode.after(audio)
		} else {
			const parent = document.documentElement
			const target = mediaPlayer
			
			const rect0 = parent.getBoundingClientRect()
			const rect1 = target.getBoundingClientRect()
			
			audio.style.cssText = `position:absolute;transform:translateX(-50%);width:360px;height:38px;border-radius:100px;box-shadow:0 0px 3px 1px rgba(0,0,0,0.15);z-index:1000`
			audio.style.left = `${rect1.x + rect1.width / 2 - rect0.x}px`
			audio.style.top = `${rect1.y + rect1.height + 4 - rect0.y}px`
			
			parent.append(audio)
		}
		
		mediaPlayer.classList.add("icon-pause")
		mediaPlayer.classList.remove("icon-play")
		
		const audioPlayer = currentNativeAudioPlayer = {
			element: mediaPlayer,
			interval: setInterval(() => {
				if(mediaPlayer.offsetWidth === 0) {
					audioPlayer.close()
				}
			}, 100),
			
			close() {
				if(currentNativeAudioPlayer === this) {
					currentNativeAudioPlayer = null
				}
				
				clearInterval(this.interval)
				
				mediaPlayer.classList.remove("icon-pause")
				mediaPlayer.classList.add("icon-play")
				audio.remove()
			}
		}
		
		audio.$on("error", () => {
			fetch(mediaUrl).then(async res => {
				const toDataURL = blob => new Promise((resolve, reject) => {
					const fileReader = new FileReader()
					fileReader.onload = ev => resolve(ev.target.result)
					fileReader.onerror = err => reject(err)
					fileReader.readAsDataURL(blob)
				})
				
				toDataURL(await res.blob()).then(
					src => audio.src = src,
					() => audioPlayer.close()
				)
			})
		}, { once: true })
	})
}



pageInit.common = () => {
	// Init global features
	
	Navigation.init()
	SettingsModal.enable()
	
	//
	
	const headWatcher = document.$watch(">head").$then()
	const bodyWatcher = document.$watch(">body", body => {
		body.classList.toggle("btr-no-hamburger", SETTINGS.get("navigation.noHamburger"))
		body.classList.toggle("btr-hide-ads", SETTINGS.get("general.hideAds"))

		if(BTRoblox.currentPage) {
			body.dataset.btrPage = BTRoblox.currentPage.name
		}
	}).$then()

	headWatcher.$watch(`meta[name="user-data"]`, meta => {
		const userId = +meta.dataset.userid
		
		loggedInUser = Number.isSafeInteger(userId) ? userId : -1
		loggedInUserPromise.$resolve(loggedInUser)
	})
	
	$.ready(() => loggedInUserPromise.$resolve(-1))
	
	//
	
	reactHook.inject({
		selector: "#settings-popover-menu",
		index: 0,
		html: `<li><a class="rbx-menu-item btr-settings-toggle">BTR Settings</a></li>`
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
				
				const matches = text.trim().match(/([\d,]+)/)
				if(!matches) { return }

				const amt = parseInt(matches[0].replace(/\D/g, ""), 10)
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
						const result = target.apply(thisArg, args)

						if(result.endsWith("+") && result.length < 5) {
							try {
								return target.apply(thisArg, [args[0], null, null, result.length - 1])
							} catch(ex) {
								console.error(ex)
							}
						}

						return result
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
	
	if(SETTINGS.get("general.fixAudioVolume")) {
		InjectJS.inject(() => {
			const { hijackFunction, onReady } = window.BTRoblox
			
			onReady(() => {
				const audioService = window.Roblox?.Audio?.AudioService
				
				if(audioService) {
					hijackFunction(audioService, "getAudioPlayer", (target, thisArg, args) => {
						const origAudio = window.Audio
		
						const audioProxy = new Proxy(origAudio, {
							construct(target, args) {
								const audio = new target(...args)
								audio.volume = 0.3
								return audio
							}
						})
		
						window.Audio = audioProxy
						const result = target.apply(thisArg, args)
						window.Audio = origAudio
						return result
					})
				}
			})
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
	
	if(SETTINGS.get("home.favoritesAtTop")) {
		InjectJS.inject(() => {
			const { hijackXHR, settings } = window.BTRoblox
			
			hijackXHR(request => {
				if(request.method === "POST" && request.url.match(/^https:\/\/apis\.roblox\.com\/discovery-api\/omni-recommendation(-metadata)?$/i)) {
					request.onResponse.push(json => {
						if(settings.home.favoritesAtTop && json?.sorts) {
							const favs = json.sorts.find(x => x.topic === "Favorites" || x.topicId === 100000001) // topic gets localized so use topicId as backup
							
							if(favs) {
								const index = json.sorts.indexOf(favs)
								const continueIndex = json.sorts.findIndex(x => x.topic === "Continue" || x.topicId === 100000003) // topic gets localized so use topicId as backup
								
								if(index > 1) {
									json.sorts.splice(index, 1)
									json.sorts.splice(continueIndex !== -1 ? continueIndex + 1 : 1, 0, favs)
								}
							}
						}
					})
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
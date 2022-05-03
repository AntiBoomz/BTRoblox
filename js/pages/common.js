"use strict"

const pageInit = {}
const startDate = new Date()

let loggedInUserPromise = null
let loggedInUser = -1
let isLoggedIn = false

const InvalidExplorableAssetTypeIds = [1, 3, 4, 5, 6, 7, 16, 21, 22, 32, 33, 34, 35, 37, 63]
const InvalidDownloadableAssetTypeIds = [21, 32, 34]

const ContainerAssetTypeIds = {
	2: { filter: x => x.ClassName === "ShirtGraphic", prop: "Graphic" },
	11: { filter: x => x.ClassName === "Shirt", prop: "ShirtTemplate" },
	12: { filter: x => x.ClassName === "Pants", prop: "PantsTemplate" },
	13: { filter: x => x.ClassName === "Decal", prop: "Texture" },
	18: { filter: x => x.ClassName === "Decal", prop: "Texture" },
	40: { filter: x => x.ClassName === "MeshPart", prop: "MeshID" },
	61: { filter: x => x.ClassName === "Animation", prop: "AnimationId" }
}

const WearableAssetTypeIds = [2, 8, 11, 12, 17, 18, 27, 28, 29, 30, 31, 41, 42, 43, 44, 45, 46, 47]
const AnimationPreviewAssetTypeIds = [24, 48, 49, 50, 51, 52, 53, 54, 55, 56, 61]

const ProhibitedReasons = {
	UniverseDoesNotHaveARootPlace: "This game has no root place.",
	UniverseRootPlaceIsNotActive: "This game is not active",
	InsufficientPermissionFriendsOnly: "This game is friends only.",
	InsufficientPermissionGroupOnly: "Group members only.",
	UnderReview: "This game is under moderation review."
}

function getRobloxTimeZoneString() {
	const month = startDate.getUTCMonth() + 1
	const date = startDate.getUTCDate()
	const weekday = startDate.getUTCDay()
	const hour = startDate.getUTCHours()

	// DST starts on the second Sunday in March at 02:00 CST, which is 08:00 UTC
	// DST ends on the first Sunday in November at 01:00 CST, which is 07:00 UTC

	const someSunday = date + 7 - weekday
	const firstSunday = someSunday - Math.floor(someSunday / 7) * 7
	const secondSunday = firstSunday + 7

	if(
		(month > 3 && month < 11) || // Within daytime months
		(month === 3 && ( // Or march and DST has begun
			date > secondSunday ||
			(date === secondSunday && hour >= 8)
		)) ||
		(month === 11 && ( // Or november and DST has not ended
			date < firstSunday ||
			(date === firstSunday && hour < 7)
		))
	) {
		return "CDT"
	}

	return "CST"
}

function robloxTimeToDate(dateString) {
	return Date.parse(dateString) ? new Date(`${dateString} ${getRobloxTimeZoneString()}`) : false
}

//

const formatNumber = num => String(num).replace(/(\d\d*?)(?=(?:\d{3})+(?:\.|$))/yg, "$1,")
const formatUrlName = (name, def = "Name") => encodeURIComponent(name.replace(/[']/g, "").replace(/\W+/g, "-").replace(/^-+|-+$/g, "") || def)

let linkifyCounter = 0
const robloxLinkify = target => {
	const className = `btr-linkify-${linkifyCounter++}`
	target.classList.add("linkify", className)
	
	InjectJS.inject([className], className => $?.(`.${className}`).linkify?.())
	target.classList.remove(className)
}

//

let cachedPageXsrfToken = null

const getXsrfToken = () => {
	if(cachedPageXsrfToken === null) {
		const matches = document.documentElement.innerHTML.match(/XsrfToken\.setToken\('([^']+)'\)/)
		cachedPageXsrfToken = matches?.[1] ?? false
	}
	
	return cachedPageXsrfToken || null
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
				<span>Page </span><span class=btr-pager-cur type=text value></span>
			</li>
			<li class=btr-pager-next>
				<button class=btn-generic-right-sm>
					<span class=icon-right></span>
				</button>
			</li>
		</ul>
	</div>`

	if(!noSelect) {
		const mid = pager.$find(".btr-pager-mid")
		mid.innerHTML = htmlstring`<span>Page</span><input class=btr-pager-cur type=text value=1><span>of <span class=btr-pager-total></span></span>`
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

const toggleSettingsModal = async force => {
	await loadOptionalLibrary("settingsModal")

	if(!document.body) { // Stuff breaks if body is not loaded
		await document.$watch(">body").$promise()
	}

	btrSettingsModal.toggle(force)
}

let reactListenerIndex = 0

const parseReactStringSelector = selector => {
	assert(!/[[>+~]/.exec(selector), "complex selectors not supported")
	const result = []
	
	for(const option of selector.split(/,/)) {
		let previous
		
		for(let piece of option.split(/\s+/)) {
			piece = piece.trim()
			if(!piece.length) { continue }
			
			const attributes = piece.split(/(?=[#.])/)
			const obj = {}
			
			for(const attr of attributes) {
				if(attr[0] === ".") {
					obj.classList = obj.classList ?? []
					obj.classList.push(attr.slice(1))
				} else if(attr[0] === "#") {
					obj.props = obj.props ?? {}
					obj.props.id = attr.slice(1)
				} else {
					if(attr !== "*") { // unset obj.type acts as universal selector
						obj.type = attr.toLowerCase()
					}
				}
			}
			
			if(previous) {
				previous.next = obj
			} else {
				result.push(obj) // Add first selector to result
			}
			
			previous = obj
		}
	}
	
	return result
}

const parseReactSelector = selectors => {
	selectors = Array.isArray(selectors) ? selectors : [selectors]
	const result = []
	
	for(let i = 0, len = selectors.length; i < len; i++) {
		const selector = selectors[i]
		
		if(typeof selector === "string") {
			result.push(...parseReactStringSelector(selector))
			continue
		}
		
		if(selector.selector) {
			assert(!selector.next)
			const selectors = parseReactStringSelector(selector)
			
			const fillMissingData = targets => {
				for(const target of targets) {
					if(target.next) {
						fillMissingData(target.next)
						continue
					}
					
					for(const key of selector) {
						if(key === "selector") { continue }
						const value = selector[key]
						
						if(Array.isArray(value)) {
							target[key] = target[key] ?? []
							target[key].push(...value)
						} else if(typeof value === "object") {
							target[key] = target[key] ?? {}
							for(const i in value) { target[key][i] = value[i] }
						} else {
							target[key] = value
						}
					}
				}
			}
			
			fillMissingData(selectors)
			result.push(...selectors)
			continue
		}
		
		result.push(selector)
	}
	
	return result
}

const reactInject = data => {
	data = { ...data }
	data.selector = parseReactSelector(data.selector)
	
	if(typeof data.index === "object") {
		data.index = { ...data.index }
		data.index.selector = parseReactSelector(data.index.selector)
	}
	
	const callback = data.callback
	const resultHtml = data.html
	
	delete data.callback
	delete data.html
	
	data.elemType = html(resultHtml).nodeName.toLowerCase()
	data.elemId = `btr-react-${reactListenerIndex++}`
	
	document.$watch(`#${data.elemId}`, node => {
		const replace = html(resultHtml)
		node.replaceWith(replace)
		callback?.(replace)
	}, { continuous: true })
	
	InjectJS.send("reactInject", data)
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
				const toDataURL = blob => new SyncPromise((resolve, reject) => {
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
	// Initialize settings
	
	reactInject({
		selector: "#settings-popover-menu",
		index: 0,
		html: `<li><a class="rbx-menu-item btr-settings-toggle">BTR Settings</a></li>`
	})

	try {
		const url = new URL(window.location.href)

		if(url.searchParams.get("btr_settings_open")) {
			sessionStorage.setItem("btr-settings-open", true)

			url.searchParams.delete("btr_settings_open")
			window.history.replaceState(null, null, url.toString())
		}
	} catch(ex) {}

	if(sessionStorage.getItem("btr-settings-open")) {
		try { toggleSettingsModal() }
		catch(ex) { console.error(ex) }
	}
	
	document.$on("click", ".btr-settings-toggle", toggleSettingsModal)

	//

	const headWatcher = document.$watch(">head").$then()
	const bodyWatcher = document.$watch(">body", body => {
		body.classList.toggle("btr-no-hamburger", SETTINGS.get("navigation.noHamburger"))
		body.classList.toggle("btr-hide-ads", SETTINGS.get("general.hideAds"))

		if(BTRoblox.currentPage) {
			body.dataset.btrPage = BTRoblox.currentPage.name
		}
	}).$then()

	loggedInUserPromise = new SyncPromise(resolve => {
		headWatcher.$watch(`meta[name="user-data"]`, meta => {
			const userId = +meta.dataset.userid
			loggedInUser = Number.isSafeInteger(userId) ? userId : -1
			isLoggedIn = userId !== -1
			resolve(loggedInUser)
		})
		
		$.ready(() => resolve(-1))
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

			const update = () => {
				if(!RobuxToCash.isEnabled()) {
					span.remove()
					return
				}
				
				const matches = bal.textContent.trim().match(/^([\d,]+)\sRobux$/)
				if(!matches) { return }

				const amt = parseInt(matches[0].replace(/,/g, ""), 10)
				if(!Number.isSafeInteger(amt)) { return }

				span.textContent = RobuxToCash.convert(amt)
				bal.append(span)
				bal.style.flexDirection = "column"
			}

			const observer = new MutationObserver(update)
			observer.observe(bal, { childList: true })
			update()
			
			SETTINGS.onChange("general.robuxToUSDRate", update)
		})
	
	// Init features
	
	if(SETTINGS.get("navigation.enabled")) {
		try { btrNavigation.init() }
		catch(ex) { console.error(ex) }
	}
	
	if(SETTINGS.get("general.fastSearch")) {
		try { btrFastSearch.init() }
		catch(ex) { console.error(ex) }
	}
	
	if(SETTINGS.get("general.hideAds")) {
		try { btrAdblock.init() }
		catch(ex) { console.error(ex) }
	}
	
	//
	
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
				([fn, props]) => "robuxAmount" in props && fn.toString().includes("nav-robux-amount"),
				(target, thisArg, args) => {
					const result = target.apply(thisArg, args)
					
					try {
						const amountLabel = reactHook.queryElement(result, x => x.props?.id === "nav-robux-amount")
						
						if(amountLabel) {
							if(amountLabel.props.children) {
								if(typeof amountLabel.props.children === "string") {
									localStorage.setItem("btr-cached-robux", amountLabel.props.children)
								}
							} else {
								const cached = localStorage.getItem("btr-cached-robux")
								
								if(cached) {
									amountLabel.props.children = cached
								}
							}
						}
					} catch(ex) {}
					
					return result
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
				([fn, props]) => "robuxAmount" in props && fn.toString().includes("nav-robux-amount"),
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
	
	// Chat
	
	if(SETTINGS.get("general.hideChat")) {
		bodyWatcher.$watch("#chat-container", cont => cont.remove())
	} else {
		if(SETTINGS.get("general.smallChatButton")) {
			bodyWatcher.$watch("#chat-container", cont => cont.classList.add("btr-small-chat-button"))
			
			InjectJS.inject(() => {
				const { hijackAngular, IS_DEV_MODE } = window.BTRoblox
				
				hijackAngular("chat", {
					chatController(func, args, argMap) {
						const result = func.apply(this, args)

						try {
							const { $scope, chatUtility } = argMap

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
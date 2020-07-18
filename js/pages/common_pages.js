"use strict"

const startDate = new Date()

let loggedInUser = -1
let loggedInUserPromise = null

const AssetTypeIds = [
	null,
	"Image", "TShirt", "Audio", "Mesh", "Lua", "HTML", "Text", "Hat", "Place", "Model", // 10
	"Shirt", "Pants", "Decal", "null", "null", "Avatar", "Head", "Face", "Gear", "null", // 20
	"Badge", "Group Emblem", "null", "Animation", "Arms", "Legs", "Torso", "RightArm", "LeftArm", "LeftLeg", // 30
	"RightLeg", "Package", "YouTubeVideo", "Game Pass", "App", "null", "Code", "Plugin", "SolidModel", "MeshPart", // 40
	"HairAccessory", "FaceAccessory", "NeckAccessory", "ShoulderAccessory", "FrontAccessory", "BackAccessory", "WaistAccessory", // 47
	"ClimbAnimation", "DeathAnimation", "FallAnimation", "IdleAnimation", "JumpAnimation", "RunAnimation", "SwimAnimation", "WalkAnimation", "PoseAnimation", // 56
	"EarAccessory", "EyeAccessory", "null", "null", // 60
	"EmoteAnimation"
]

const InvalidExplorableAssetTypeIds = [1, 3, 4, 5, 6, 7, 16, 21, 22, 32, 33, 34, 35, 37]
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

async function getUncachedProductInfo(assetId) {
	const response = await $.fetch(`https://api.roblox.com/marketplace/productinfo?assetId=${assetId}`)
	return response.json()
}

const productCache = {}
function getProductInfo(assetId) {
	return productCache[assetId] = productCache[assetId] || getUncachedProductInfo(assetId)
}

function startDownload(blob, fileName) {
	const link = document.createElement("a")
	link.setAttribute("download", fileName || "file")
	link.setAttribute("href", blob)
	document.body.append(link)
	link.click()
	link.remove()
}

function GetRobloxTimeZone() {
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

function RobloxTime(dateString) {
	return Date.parse(dateString) ? new Date(`${dateString} ${GetRobloxTimeZone()}`) : false
}

function GetAssetFileType(assetTypeId, buffer) {
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
			const header = $.bufferToStr(buffer.subarray(0, 4))
			switch(header) {
			case "RIFF": return "wav"
			case "OggS": return "ogg"
			default: return "mp3"
			}
		}
		
		return "mp3"
	case 4: return "mesh"
	case 9: return (buffer && buffer[7] !== 0x21) && "rbxlx" || "rbxl"
	default: return (buffer && buffer[7] !== 0x21) && "rbxmx" || "rbxm"
	}
}

const ToggleSettingsDiv = async force => {
	await OptionalLoader.loadSettings()

	if(!document.body) { // Stuff breaks if body is not loaded
		await document.$watch(">body").$promise()
	}

	SettingsDiv.toggle(force)
}

function createPager(noSelect, hideWhenEmpty) {
	const pager = html`
	<div class=btr-pager-holder>
		<ul class=pager>
			<li class=pager-prev><a><span class=icon-left></span></a></li>
			<li class=pager-mid>
				Page <span class=pager-cur type=text value></span>
			</li>
			<li class=pager-next><a><span class=icon-right></span></a></li>
		</ul>
	</div>`

	if(!noSelect) {
		const mid = pager.$find(".pager-mid")
		mid.innerHTML = htmlstring`Page <input class=pager-cur type=text value> of <span class=pager-total></span>`
	}

	const prev = pager.$find(".pager-prev")
	const next = pager.$find(".pager-next")
	const cur = pager.$find(".pager-cur")

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

		togglePrev(bool) { prev.classList.toggle("disabled", !bool) },
		toggleNext(bool) { next.classList.toggle("disabled", !bool) }
	})

	pager.setPage(1)

	prev.$find("a").$on("click", () => pager.onprevpage && pager.onprevpage())
	next.$find("a").$on("click", () => pager.onnextpage && pager.onnextpage())

	if(!noSelect) {
		const tot = pager.$find(".pager-total")
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

		cur.$on("keydown", e => {
			if(e.keyCode === 13 && pager.onsetpage) {
				let page = parseInt(cur.value, 10)
				if(Number.isNaN(page)) { return }

				page = Math.max(1, Math.min(pager.maxPage, page))

				if(pager.curPage !== page) {
					pager.onsetpage(page)
				} else {
					pager.setPage(page)
				}
			}
		})
	}

	return pager
}

let linkifyCounter = 0
function Linkify(elem) {
	const className = `btr-linkify-pls-${linkifyCounter++}`
	elem.classList.add(className)
	InjectJS.send("linkify", className)
}

const FormatNumber = num => String(num).replace(/(\d\d*?)(?=(?:\d{3})+(?:\.|$))/yg, "$1,")
const GetRobuxRatio = () => DOLLARS_TO_ROBUX_RATIOS[SETTINGS.get("general.robuxToUSDRate")]
const RobuxToUSD = amt => FormatNumber((Math.ceil((amt * GetRobuxRatio()[0]) / GetRobuxRatio()[1] * 100) / 100).toFixed(2))

const FormatUrlName = (name, def = "Name") => encodeURIComponent(name.replace(/[']/g, "").replace(/\W+/g, "-").replace(/^-+|-+$/g, "") || def)

const initAdBlock = () => {
	const iframeSelector = `.ads-container iframe,.abp iframe,.abp-spacer iframe,.abp-container iframe,.top-abp-container iframe,
	#AdvertisingLeaderboard iframe,#AdvertisementRight iframe,#MessagesAdSkyscraper iframe,.Ads_WideSkyscraper iframe,
	.profile-ads-container iframe, #ad iframe, iframe[src*="roblox.com/user-sponsorship/"]`

	const iframes = document.getElementsByTagName("iframe")
	const scripts = document.getElementsByTagName("script")
	
	const doneMap = new WeakMap()

	new MutationObserver(() => {
		for(let i = iframes.length; i--;) {
			const iframe = iframes[i]

			if(!doneMap.get(iframe)) {
				if(iframe.matches(iframeSelector)) {
					iframe.remove()
				} else {
					doneMap.set(iframe, true)
				}
			}
		}

		for(let i = scripts.length; i--;) {
			const script = scripts[i]

			if(doneMap.get(script)) {
				break
			}

			doneMap.set(script, true)

			if(script.src) {
				if(
					script.src.includes("imasdk.googleapis.com") ||
					script.src.includes("googletagmanager.com") ||
					script.src.includes("radar.cedexis.com") ||
					script.src.includes("ns1p.net")
				) {
					script.src = ""
					script.remove()
				}
			} else {
				const cont = script.textContent
				if(
					!cont.includes("ContentJS") && // is not inject.js
					(
						cont.includes("scorecardresearch.com") ||
						cont.includes("cedexis.com") ||
						cont.includes("pingdom.net") ||
						cont.includes("ns1p.net") ||
						cont.includes("Roblox.Hashcash") ||
						cont.includes("Roblox.VideoPreRollDFP") ||
						cont.includes("Roblox.AdsHelper=") ||
						cont.includes("googletag.enableServices()") ||
						cont.includes("gtag('config'")
					)
				) {
					script.textContent = ""
					script.remove()
				} else if(cont.includes("Roblox.EventStream.Init")) { // Stops e.png logging
					script.textContent = cont.replace(/"[^"]*"/g, `""`)
				}
			}
		}
	}).observe(document.documentElement, { childList: true, subtree: true })
}

pageInit.common = () => {
	document.$on("click", ".btr-settings-toggle", ToggleSettingsDiv)

	try {
		const url = new URL(window.location.href)

		if(url.searchParams.get("btr_settings_open")) {
			sessionStorage.setItem("btr-settings-open", true)

			url.searchParams.delete("btr_settings_open")
			window.history.replaceState(null, null, url.toString())
		}
	} catch(ex) {}

	if(sessionStorage.getItem("btr-settings-open")) {
		try { ToggleSettingsDiv() }
		catch(ex) { console.error(ex) }
	}

	//

	const headWatcher = document.$watch(">head").$then()
	const bodyWatcher = document.$watch(">body", body => {
		body.classList.toggle("btr-no-hamburger", SETTINGS.get("navigation.noHamburger"))
		body.classList.toggle("btr-hide-ads", SETTINGS.get("general.hideAds"))
		body.classList.toggle("btr-small-chat-button", !SETTINGS.get("general.hideChat") && SETTINGS.get("general.smallChatButton"))

		if(currentPage) {
			body.dataset.btrPage = currentPage.name
		}
	}).$then()

	bodyWatcher.$watch("#roblox-linkify", linkify => {
		linkify.dataset.regex = /(https?:\/\/)?([a-z0-9-]+\.)*(twitter\.com|youtube\.com|youtu\.be|twitch\.tv|roblox\.com|robloxlabs\.com|shoproblox\.com)(?!\/[A-Za-z0-9-+&@#/=~_|!:,.;]*%)((\/[A-Za-z0-9-+&@#/%?=~_|!:,.;]*)|(?=\s|\b))/.source

		// Empty asHttpRegex matches everything, so every link will be unsecured, so fix that
		if(!linkify.dataset.asHttpRegex) { linkify.dataset.asHttpRegex = "^$" }
	})

	loggedInUserPromise = new SyncPromise(resolve => {
		headWatcher.$watch(`meta[name="user-data"]`, meta => {
			const userId = +meta.dataset.userid
			loggedInUser = Number.isSafeInteger(userId) ? userId : -1
			resolve(loggedInUser)
		})
		
		$.ready(() => resolve(-1))
	})

	loggedInUserPromise.then(userId => {
		if(userId !== -1) {
			Navigation.init()
		}
	})

	if(SETTINGS.get("general.fastSearch")) {
		try { initFastSearch() }
		catch(ex) { console.error(ex) }
	}
	
	if(SETTINGS.get("general.hideAds")) {
		try { initAdBlock() }
		catch(ex) { console.error(ex) }
	}

	{
		const switchClasses = (from, to) => {
			const list = document.getElementsByClassName(from)
			for(let i = list.length; i--;) {
				const elem = list[i]
				elem.classList.remove(from, "btr-compat-light-theme", "btr-compat-dark-theme")
				elem.classList.add(to)
			}
		}

		const updateThemes = () => {
			if(SETTINGS.get("general.disableRobloxThemes")) {
				switchClasses("light-theme", "btr-compat-light-theme")
				switchClasses("dark-theme", "btr-compat-dark-theme")

				if(!observing) {
					observing = true
					observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"], subtree: true })
				}
			} else {
				switchClasses("btr-compat-light-theme", "light-theme")
				switchClasses("btr-compat-dark-theme", "dark-theme")

				if(observing) {
					observing = false
					observer.disconnect()
				}
			}
		}

		const observer = new MutationObserver(updateThemes)
		let observing = false

		updateThemes()
		SETTINGS.onChange("general.disableRobloxThemes", updateThemes)
	}

	if(SETTINGS.get("general.hideChat")) {
		bodyWatcher.$watch("#chat-container", cont => cont.remove())
	}

	if(SETTINGS.get("general.fixAudioPreview")) {
		InjectJS.listen("fixAudioPreview", async url => {
			if(!url.match(/^https?:\/\/c\d\.rbxcdn\.com\/[0-9a-f]{32}$/)) {
				console.log("bad url")
				return
			}
			
			const resp = await $.fetch(url)
			InjectJS.send("fixAudioPreview", url, URL.createObjectURL(await resp.blob()))
		})
	}
}
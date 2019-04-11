"use strict"

let settings
let currentPage

let loggedInUser = -1
let loggedInUserPromise = null

const InjectJS = {
	queue: [],

	send(action, ...detail) {
		if(IS_FIREFOX) { detail = cloneInto(detail, window.wrappedJSObject) }
		document.dispatchEvent(new CustomEvent(`inject.${action}`, { detail }))
	},

	listen(actions, callback, props) {
		const actionList = actions.split(" ")
		const once = props && props.once

		const cb = ev => {
			if(once) {
				actionList.forEach(action => {
					document.removeEventListener(`content.${action}`, cb)
				})
			}

			return callback(...ev.detail)
		}

		actionList.forEach(action => {
			document.addEventListener(`content.${action}`, cb)
		})
	}
}

const templatePromises = {}
const domParser = new DOMParser()

function modifyTemplate(idList, callback) {
	if(typeof idList === "string") {
		idList = [idList]
	}

	const templates = new Array(idList.length)
	let templatesLeft = idList.length

	const finish = () => {
		try { callback(...templates) }
		catch(ex) {
			console.error(ex)

			if(IS_DEV_MODE) {
				alert("Hey, modifyTemplate errored!")
			}
		}

		idList.forEach((id, i) => {
			InjectJS.send(`TEMPLATE_${id}`, templates[i].innerHTML)
		})
	}

	idList.forEach((id, index) => {
		if(!templatePromises[id]) {
			templatePromises[id] = new SyncPromise(resolve => InjectJS.listen(
				`TEMPLATE_${id}`,
				html => resolve(domParser.parseFromString(`<body>${html}</body>`, "text/html").body),
				{ once: true }
			))

			InjectJS.send("TEMPLATE_INIT", id)
		}
		
		templatePromises[id].then(template => {
			templates[index] = template

			if(--templatesLeft === 0) {
				finish()
			}
		})
	})
}

function onDocumentReady(cb) {
	if(document.readyState !== "loading") {
		cb()
	} else {
		document.addEventListener("DOMContentLoaded", cb, { once: true })
	}
}

const FormatNumber = num => String(num).replace(/(\d\d*?)(?=(?:\d{3})+(?:\.|$))/yg, "$1,")
const GetRobuxRatio = () => DOLLARS_TO_ROBUX_RATIOS[settings.general.robuxToUSDRate]
const RobuxToUSD = amt => FormatNumber((Math.ceil((amt * GetRobuxRatio()[0]) / GetRobuxRatio()[1] * 100) / 100).toFixed(2))

const injectCSS = path => {
	const link = document.createElement("link")
	link.rel = "stylesheet"
	link.href = getURL("css/" + path)
	
	const parent = document.head || document.documentElement
	parent.prepend(link)

	return link
}

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
			if(iframe.matches(iframeSelector)) {
				iframe.remove()
			} else if(doneMap.get(iframe)) {
				break
			} else {
				doneMap.set(iframe, true)
			}
		}

		for(let i = scripts.length; i--;) {
			const script = scripts[i]
			if(doneMap.get(script)) {
				break
			} else {
				doneMap.set(script, true)

				if(script.src) {
					if(
						script.src.includes("imasdk.googleapis.com") ||
						script.src.includes("radar.cedexis.com")
					) {
						script.remove()
					}
				} else {
					const cont = script.textContent
					if(
						cont.includes("google-analytics.com") ||
						cont.includes("scorecardresearch.com") ||
						cont.includes("cedexis.com") ||
						cont.includes("pingdom.net") ||
						cont.includes("ns1p.net") ||
						cont.includes("Roblox.Hashcash") ||
						cont.includes("Roblox.VideoPreRollDFP") ||
						cont.includes("googletag.enableServices()")
					) {
						script.remove()
					} else if(cont.includes("Roblox.EventStream.Init")) { // Stops e.png logging
						script.textContent = cont.replace(/"[^"]*"/g, `""`)
					}
				}
			}
		}
	}).observe(document.documentElement, { childList: true, subtree: true })
}

function Init() {
	const headWatcher = document.$watch(">head").$then()
	const bodyWatcher = document.$watch(">body", body => {
		body.classList.toggle("btr-no-hamburger", settings.navigation.noHamburger)
		body.classList.toggle("btr-hide-ads", settings.general.hideAds)
		body.classList.toggle("btr-small-chat-button", settings.general.chatEnabled && settings.general.smallChatButton)

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
		
		onDocumentReady(() => resolve(-1))
	})

	loggedInUserPromise.then(userId => {
		if(userId !== -1) {
			Navigation.init()
			document.$on("click", ".btr-settings-toggle", SettingsDiv.toggle)
		}
	})

	if(settings.general.fastSearch) { initFastSearch() }
	if(settings.general.hideAds) { initAdBlock() }

	if(!settings.general.chatEnabled) {
		bodyWatcher.$watch("#chat-container", cont => cont.remove())
	}

	if(settings.general.fixAudioPreview) {
		InjectJS.listen("fixAudioPreview", async url => {
			if(!url.match(/^https?:\/\/c\d\.rbxcdn\.com\/[0-9a-f]{32}$/)) {
				console.log("bad url")
				return
			}
			
			const resp = await fetch(url)
			InjectJS.send("fixAudioPreview", url, URL.createObjectURL(await resp.blob()))
		})
	}

	if(currentPage && pageInit[currentPage.name]) {
		try { pageInit[currentPage.name].apply(currentPage, currentPage.matches) }
		catch(ex) { console.error(ex) }
	}
}


function PreInit() {
	if(document.contentType !== "text/html") { return }
	if(IS_FIREFOX && document.readyState === "complete") { return } // Stop reloading extension

	const pathname = window.location.pathname
	const exclude = EXCLUDED_PAGES.some(patt => new RegExp(patt, "i").test(pathname))
	if(exclude) { return }

	{ // Inject Script
		const script = document.createElement("script")
		script.setAttribute("name", "BTRoblox/inject.js")
		script.textContent = `"use strict";\n(${String(INJECT_SCRIPT)})();`
		
		const parent = document.head || document.documentElement
		parent.prepend(script)
	}
	
	currentPage = GET_PAGE(pathname)
	SETTINGS.load(_settings => {
		settings = JSON.parse(JSON.stringify(_settings))

		// Change settings to be name: value
		Object.values(settings).forEach(group => {
			Object.entries(group).forEach(([name, setting]) => {
				group[name] = setting.value
			})
		})

		{ // Inject CSS
			const themeStyles = []

			const cssFiles = ["main.css"]
			if(currentPage) { cssFiles.push(...currentPage.css) }

			{ // Initial load
				const theme = settings.general.theme
				cssFiles.forEach(file => {
					if(theme !== "default") { themeStyles.push(injectCSS(`${theme}/${file}`)) }
					injectCSS(file)
				})
			}

			const updateTheme = theme => {
				const oldStyles = themeStyles.splice(0, themeStyles.length)

				if(theme === "default") {
					oldStyles.forEach(x => x.remove())
				} else {
					cssFiles.forEach(file => themeStyles.push(injectCSS(`${theme}/${file}`)))

					themeStyles[0].addEventListener("load", () => {
						oldStyles.forEach(x => x.remove())
					}, { once: true })
				}
			}

			SETTINGS.onChange("general.theme", updateTheme)
		}
		
		InjectJS.send(
			"INIT",
			settings,
			currentPage ? currentPage.name : null,
			currentPage ? currentPage.matches : null,
			IS_DEV_MODE
		)

		Init()
	})
}

PreInit()
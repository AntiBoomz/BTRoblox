"use strict"

const pageInit = {}
const cssFiles = ["main.css"]
const themeStyles = []

let areAllContentScriptsLoaded = false
let isInitDeferred = false

let settings
let currentPage

let mainStyleSheet
const injectCSS = (...paths) => {
	if(!paths.length) { return [] }

	if(!mainStyleSheet) {
		const style = document.createElement("style")
		style.setAttribute("name", "BTRoblox/inject.css")
		style.type = "text/css"

		const parent = document.head || document.documentElement
		parent.append(style)

		mainStyleSheet = document.styleSheets[document.styleSheets.length - 1]
	}

	return paths.map(file => {
		const index = mainStyleSheet.insertRule(`@import url("${getURL("css/" + file)}")`)
		return mainStyleSheet.rules[index].cssText
	})
}

const removeCSS = rules => {
	if(!mainStyleSheet) { return }

	rules.forEach(cssText => {
		const index = Array.prototype.findIndex.call(mainStyleSheet.rules, x => x.cssText === cssText)

		console.log(cssText, index)

		if(index !== -1) {
			mainStyleSheet.deleteRule(index)
		}
	})
}

const updateTheme = () => {
	const theme = settings.general.theme
	const oldStyles = themeStyles.splice(0, themeStyles.length)
	removeCSS(oldStyles)

	if(theme !== "default") {
		themeStyles.push(...injectCSS(...cssFiles.map(file => `${theme}/${file}`)))
	}
}

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

			if(!ev.detail) {
				console.warn("[BTRoblox] Didn't get event detail from InjectJS", actions)
				return
			}

			return callback(...ev.detail)
		}

		actionList.forEach(action => {
			document.addEventListener(`content.${action}`, cb)
		})
	}
}

const OptionalLoader = {
	libraries: {
		previewer: {
			promise: null,
			assets: [
				"lib/three.min.js",
				"js/rbx/Avatar/Animator.js",
				"js/rbx/Avatar/AvatarRigs.js",
				"js/rbx/Avatar/Composites.js",
				"js/rbx/Avatar/Avatar.js",
				"js/rbx/Avatar/Appearance.js",
				"js/rbx/Scene.js",
				"js/rbx/Preview.js"
			]
		},
		explorer: {
			promise: null,
			assets: [
				"js/rbx/ApiDump.js",
				"js/rbx/Explorer.js"
			]
		},
		settings: {
			promise: null,
			assets: [
				"js/feat/btr-settings.js",
				"btr-settings.css"
			]
		}
	},

	_loadLib(name) {
		const lib = this.libraries[name]

		if(!lib.promise) {
			const jsAssets = lib.assets.filter(file => file.endsWith(".js"))
			const cssAssets = lib.assets.filter(file => file.endsWith(".css"))
			
			if(cssAssets.length) {
				injectCSS(...cssAssets)
			}

			if(jsAssets.length) {
				lib.promise = new SyncPromise(resolve => MESSAGING.send("loadOptAssets", jsAssets, resolve))
			} else {
				lib.promise = SyncPromise.resolve()
			}
		}

		return lib.promise
	},

	loadPreviewer() { return this._loadLib("previewer") },
	loadExplorer() { return this._loadLib("explorer") },
	loadSettings() { return this._loadLib("settings") }
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


function Init() {
	// Inject theme
	updateTheme()
	SETTINGS.onChange("general.theme", updateTheme)

	//

	try { pageInit.common() }
	catch(ex) { console.error(ex) }

	if(currentPage && pageInit[currentPage.name]) {
		try { pageInit[currentPage.name].apply(currentPage, currentPage.matches) }
		catch(ex) { console.error(ex) }
	}
}


function PreInit() {
	if(document.contentType !== "text/html") { return }
	if(window.location.protocol.search(/^https?:$/) === -1) { return }
	
	if(IS_FIREFOX && document.readyState === "complete") { return } // Stop reloading extension

	const pathname = window.location.pathname
	const exclude = EXCLUDED_PAGES.some(patt => new RegExp(patt, "i").test(pathname))
	if(exclude) { return }

	currentPage = GET_PAGE(pathname)

	//

	if(currentPage) { cssFiles.push(...currentPage.css) }
	injectCSS(...cssFiles)

	const script = document.createElement("script")
	script.setAttribute("name", "BTRoblox/inject.js")
	script.textContent = `"use strict";\n(${String(INJECT_SCRIPT)})();`
	
	const scriptParent = document.head || document.documentElement
	scriptParent.prepend(script)
	
	//

	SETTINGS.load(_settings => {
		settings = JSON.parse(JSON.stringify(_settings))

		// Change settings to be name: value
		Object.values(settings).forEach(group => {
			Object.entries(group).forEach(([name, setting]) => {
				group[name] = setting.value
			})
		})

		InjectJS.send(
			"INIT",
			settings,
			currentPage ? currentPage.name : null,
			currentPage ? currentPage.matches : null,
			IS_DEV_MODE
		)
		
		if(areAllContentScriptsLoaded) {
			Init()
		} else {
			isInitDeferred = true
		}
	})

	//

	PERMISSIONS.hasHostAccess().then(hasAccess => {
		if(hasAccess) {
			return
		}

		document.$watch("#header", header => {
			const btn = html`<div class=btr-rha>Some permissions required for BTRoblox to function have been disabled. Click here to fix the issue.</div>`
			let busy = false

			btn.$on("click", () => {
				if(btn.classList.contains("finished")) {
					return window.location.reload()
				}

				if(busy) {
					return
				}

				busy = true
				PERMISSIONS.requestHostAccess().then(granted => {
					if(!granted) {
						busy = false
						return
					}
					
					btn.classList.add("finished")
					
					setTimeout(() => window.location.reload(), 500)
				})
			})

			header.after(btn)
		})
	})
}

PreInit()
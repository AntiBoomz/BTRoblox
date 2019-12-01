"use strict"

const pageInit = {}

let areAllContentScriptsLoaded = false
let isInitDeferred = false

let settings
let currentPage

const injectCSS = path => {
	const link = document.createElement("link")
	link.rel = "stylesheet"
	link.href = getURL(path)
	
	const parent = document.head || document.documentElement
	parent.prepend(link)

	return link
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
				"css/btr-settings.css"
			]
		}
	},

	_loadLib(name) {
		const lib = this.libraries[name]

		if(!lib.promise) {
			const jsAssets = []

			lib.assets.forEach(file => {
				if(file.endsWith(".js")) {
					jsAssets.push(file)
				} else if(file.endsWith(".css")) {
					injectCSS(file)
				}
			})

			if(jsAssets.length > 0) {
				lib.promise = new SyncPromise(resolve => {
					MESSAGING.send("loadOptAssets", jsAssets, resolve)
				})
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
	try { pageInit.common() }
	catch(ex) { console.error(ex) }

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

	currentPage = GET_PAGE(pathname)

	//

	const script = document.createElement("script")
	script.setAttribute("name", "BTRoblox/inject.js")
	script.textContent = `"use strict";\n(${String(INJECT_SCRIPT)})();`
	
	const scriptParent = document.head || document.documentElement
	scriptParent.prepend(script)

	//

	const cssFiles = ["css/main.css"]
	const themeStyles = []

	const updateTheme = theme => {
		const oldStyles = themeStyles.splice(0, themeStyles.length)

		if(theme === "default") {
			oldStyles.forEach(x => x.remove())
		} else {
			cssFiles.forEach(file => themeStyles.push(injectCSS(`css/${theme}/${file}`)))

			themeStyles[0].addEventListener("load", () => {
				oldStyles.forEach(x => x.remove())
			}, { once: true })
		}
	}

	if(currentPage) { cssFiles.push(...currentPage.css.map(x => `css/${x}`)) }
	cssFiles.forEach(injectCSS)

	SETTINGS.onChange("general.theme", updateTheme)
	SETTINGS.load(_settings => {
		settings = JSON.parse(JSON.stringify(_settings))

		// Change settings to be name: value
		Object.values(settings).forEach(group => {
			Object.entries(group).forEach(([name, setting]) => {
				group[name] = setting.value
			})
		})

		// Inject theme
		updateTheme(settings.general.theme)

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
}

PreInit()
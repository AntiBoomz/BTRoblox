"use strict"

const pageInit = {}
let currentPage

//

const cssFiles = ["main.css"]
const themeStyles = []
const liveReloadCSS = {}
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
		const url = getURL("css/" + file)
		const rule = `@import url("${url}")`

		const index = mainStyleSheet.insertRule(rule)
		const cssText = mainStyleSheet.rules[index].cssText

		const doLiveReload = false
		if(doLiveReload) {
			// live reload

			const now = Date.now()
			let requesting = false
			let oldData

			liveReloadCSS[cssText] = now

			const interval = setInterval(() => {
				if(liveReloadCSS[cssText] !== now) {
					clearInterval(interval)
					return
				}

				if(requesting) {
					return
				}

				requesting = true
				fetch(url).then(async resp => {
					const newData = await resp.text()

					if(liveReloadCSS[cssText] !== now) {
						return
					}

					requesting = false

					if(newData !== oldData) {
						if(oldData) {
							console.log("Reloaded", url)

							removeCSS([cssText])
							liveReloadCSS[cssText] = now

							mainStyleSheet.insertRule(rule)
						}

						oldData = newData
					}
				})
			}, 1e3)
		}

		return cssText
	})
}

const removeCSS = rules => {
	if(!mainStyleSheet) {
		return
	}

	rules.forEach(cssText => {
		const index = Array.prototype.findIndex.call(mainStyleSheet.rules, x => x.cssText === cssText)
		if(index !== -1) {
			mainStyleSheet.deleteRule(index)

			if(liveReloadCSS[cssText]) {
				delete liveReloadCSS[cssText]
			}
		}
	})
}

const updateTheme = theme => {
	const oldStyles = themeStyles.splice(0, themeStyles.length)
	removeCSS(oldStyles)

	if(theme !== "default") {
		themeStyles.push(...injectCSS(...cssFiles.map(file => `${theme}/${file}`)))
	}
}

//

const InjectJS = {
	queue: [],

	send(action, ...detail) {
		try {
			if(IS_FIREFOX) { detail = cloneInto(detail, window.wrappedJSObject) }
			document.dispatchEvent(new CustomEvent(`inject.${action}`, { detail }))
		} catch(ex) {
			console.error(ex)
		}
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

//

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

//

function Init() {
	InjectJS.send(
		"INIT",
		SETTINGS.serialize(),
		currentPage ? currentPage.name : null,
		currentPage ? currentPage.matches : null,
		IS_DEV_MODE
	)
	
	//
	
	updateTheme(SETTINGS.get("general.theme"))
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
	if(document.contentType !== "text/html" || window.location.protocol === "blob") {
		return
	}

	const exclude = EXCLUDED_PAGES.some(patt => new RegExp(patt, "i").test(window.location.pathname))
	if(exclude) {
		return
	}

	if(document.documentElement.dataset.btrLoaded) {
		return
	}

	document.documentElement.dataset.btrLoaded = true

	//

	currentPage = GET_PAGE(window.location.pathname)

	if(currentPage) { cssFiles.push(...currentPage.css) }
	injectCSS(...cssFiles)

	const script = document.createElement("script")
	script.setAttribute("name", "BTRoblox/inject.js")
	script.textContent = `"use strict";\n(${String(INJECT_SCRIPT)})();`
	
	const scriptParent = document.head || document.documentElement
	scriptParent.prepend(script)
	
	if(currentPage && pageInit[`${currentPage.name}_pre`]) {
		try { pageInit[`${currentPage.name}_pre`].apply(currentPage, currentPage.matches) }
		catch(ex) { console.error(ex) }
	}

	SETTINGS.load(Init)
}
"use strict"

const pageInject = {
	mainStyleSheet: null,
	activeStyleSheets: [],

	injectCSS(...paths) {
		if(!this.mainStyleSheet) {
			const style = document.createElement("style")
			style.setAttribute("name", "BTRoblox/inject.css")
			style.type = "text/css"
	
			const parent = document.head || document.documentElement
			parent.append(style)
	
			this.mainStyleSheet = document.styleSheets[document.styleSheets.length - 1]
		}

		paths.forEach(path => {
			const url = getURL(path)
			const cssRule = this.intAddCSS(url)

			const styleSheet = { path, cssRule }
			this.activeStyleSheets.push(styleSheet)

			if(IS_DEV_MODE) {
				let lastCSSText = null

				const tryReload = async () => {
					if(!this.activeStyleSheets.includes(styleSheet)) {
						return
					}

					const newUrl = `${url}?_=${Date.now()}`

					const resp = await fetch(newUrl)
					const cssText = await resp.text()

					if(cssText !== lastCSSText) {
						if(lastCSSText !== null) {
							this.intClearStyleSheet(styleSheet)
							styleSheet.cssRule = this.intAddCSS(newUrl)
						}

						lastCSSText = cssText
					}
					
					setTimeout(tryReload, 1.5e3)
				}

				setTimeout(tryReload, 1.5e3)
			}
		})
	},

	removeCSS(...paths) {
		paths.forEach(path => {
			const styleSheet = this.activeStyleSheets.find(x => x.path === path)

			if(styleSheet) {
				const index = this.activeStyleSheets.indexOf(styleSheet)
				this.activeStyleSheets.splice(index, 1)

				this.intClearStyleSheet(styleSheet)
			}
		})
	},

	injectFunction(args, fn) {
		if(typeof args === "function") {
			fn = args
			args = []
		}
		
		const script = document.createElement("script")
		script.async = true
		script.type = "text/javascript"
		script.textContent = `"use strict";\n(${fn.toString()})(${args.map(x => JSON.stringify(x)).join(",")});`

		document.documentElement.prepend(script)
	},

	// Internals

	intAddCSS(url) {
		const cssRule = `@import url("${url}")`
		const ruleIndex = this.mainStyleSheet.insertRule(cssRule)

		return this.mainStyleSheet.cssRules[ruleIndex]
	},

	intClearStyleSheet(styleSheet) {
		if(styleSheet.cssRule) {
			const ruleIndex = Array.prototype.indexOf.call(this.mainStyleSheet.cssRules, styleSheet.cssRule)

			if(ruleIndex !== -1) {
				this.mainStyleSheet.deleteRule(ruleIndex)
				styleSheet.cssRule = null
			}
		}
	}
}
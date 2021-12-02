"use strict"

const activeStyleSheets = []
let mainStyleSheet = null

const addStyleSheet = url => {
	const cssRule = `@import url("${url}")`
	const ruleIndex = mainStyleSheet.insertRule(cssRule, mainStyleSheet.cssRules.length)
	
	return mainStyleSheet.cssRules[ruleIndex]
}

const clearStyleSheet = styleSheet => {
	if(styleSheet.cssRule) {
		const ruleIndex = Array.prototype.indexOf.call(mainStyleSheet.cssRules, styleSheet.cssRule)

		if(ruleIndex !== -1) {
			mainStyleSheet.deleteRule(ruleIndex)
			styleSheet.cssRule = null
		}
	}
}

const injectCSS = (...paths) => {
	if(!mainStyleSheet) {
		const style = document.createElement("style")
		style.type = "text/css"

		const parent = document.head || document.documentElement
		parent.append(style)

		mainStyleSheet = style.sheet
	}
	
	const shouldHotReload = IS_DEV_MODE
	
	for(const path of paths) {
		const url = getURL(path)
		const cssRule = addStyleSheet(shouldHotReload ? `${url}?_=${Date.now()}` : url)

		const styleSheet = { path, cssRule }
		activeStyleSheets.push(styleSheet)

		if(shouldHotReload) {
			let lastCSSText = null

			const tryReload = async () => {
				if(!activeStyleSheets.includes(styleSheet)) {
					return
				}

				const newUrl = `${url}?_=${Date.now()}`

				const resp = await fetch(newUrl)
				const cssText = await resp.text()

				if(cssText !== lastCSSText) {
					if(lastCSSText !== null) {
						clearStyleSheet(styleSheet)
						styleSheet.cssRule = addStyleSheet(newUrl)
					}

					lastCSSText = cssText
				}
				
				setTimeout(tryReload, 1.5e3)
			}

			setTimeout(tryReload, 1.5e3)
		}
	}
}

const removeCSS = (...paths) => {
	paths.forEach(path => {
		const styleSheet = activeStyleSheets.find(x => x.path === path)

		if(styleSheet) {
			const index = activeStyleSheets.indexOf(styleSheet)
			activeStyleSheets.splice(index, 1)

			clearStyleSheet(styleSheet)
		}
	})
}
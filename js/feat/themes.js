"use strict"

const btrThemes = {
	cssFiles: ["main.css", "settingsmodal.css"],
	themeStyles: [],

	setTheme(theme) {
		removeCSS(...this.themeStyles.splice(0, this.themeStyles.length))

		if(theme !== "default") {
			this.themeStyles.push(
				...this.cssFiles.map(path => `css/${theme}/${path}`)
			)
		}

		injectCSS(...this.themeStyles)
	},
	
	init() {
		if(location.host === "create.roblox.com") {
			this.cssFiles.push("create.css")
		}
		
		if(BTRoblox.currentPage?.css) {
			this.cssFiles.push(...BTRoblox.currentPage.css)
		}

		injectCSS(...this.cssFiles.map(subPath => `css/${subPath}`))

		this.setTheme("default")
		SETTINGS.load(() => this.setTheme(SETTINGS.get("general.theme")))
		SETTINGS.onChange("general.theme", () => this.setTheme(SETTINGS.get("general.theme")))
	}
}
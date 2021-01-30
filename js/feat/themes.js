"use strict"

const btrThemes = {
	cssFiles: ["main.css"],
	themeStyles: [],

	setTheme(theme) {
		pageInject.removeCSS(...this.themeStyles.splice(0, this.themeStyles.length))

		if(theme !== "default") {
			this.themeStyles.push(
				...this.cssFiles.map(path => `css/${theme}/${path}`)
			)
		}

		pageInject.injectCSS(...this.themeStyles)
	},
	
	init() {
		if(currentPage && currentPage.css) {
			this.cssFiles.push(...currentPage.css)
		}

		pageInject.injectCSS(...this.cssFiles.map(subPath => `css/${subPath}`))

		//

		this.setTheme("default")
		SETTINGS.load(() => this.setTheme(SETTINGS.get("general.theme")))
		SETTINGS.onChange("general.theme", () => this.setTheme(SETTINGS.get("general.theme")))
	}
}
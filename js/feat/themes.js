"use strict"

const btrThemes = {
	cssFiles: ["main.css", "settingsmodal.css"],
	pageFiles: [],
	themeFiles: [],
	
	theme: "default",

	setTheme(theme) {
		removeCSS(...this.themeFiles.splice(0, this.themeFiles.length))

		this.theme = theme
		
		if(theme !== "default") {
			this.themeFiles.push(
				...this.cssFiles.map(path => `css/${theme}/${path}`),
				...this.pageFiles.map(path => `css/${theme}/${path}`)
			)
		}

		injectCSS(...this.themeFiles)
	},
	
	update() {
		removeCSS(...this.pageFiles.splice(0, this.pageFiles.length))
		
		this.pageFiles.push(
			...(BTRoblox.currentPage?.css ?? []).map(subPath => `css/${subPath}`)
		)
		
		injectCSS(...this.pageFiles)
		
		this.setTheme(this.theme)
	},
	
	init() {
		if(location.host === "create.roblox.com") {
			this.cssFiles.push("create.css")
		}
		
		injectCSS(...this.cssFiles.map(subPath => `css/${subPath}`))

		this.setTheme("default")
		SETTINGS.load(() => this.setTheme(SETTINGS.get("general.theme")))
		SETTINGS.onChange("general.theme", () => this.setTheme(SETTINGS.get("general.theme")))
	}
}
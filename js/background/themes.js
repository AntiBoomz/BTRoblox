(() => {
	const defaultThemes = ["dark", "red", "simblk", "sky"]
	const themes = {}

	STORAGE.get(["themes"], data => {
		if(data.themes) Object.assign(themes, data.themes);

		chrome.runtime.getPackageDirectoryEntry(root => {
			root.getDirectory("css", null, cssDir => {
				let counter = defaultThemes.length

				defaultThemes.forEach(theme => {
					const themeData = themes[theme] = {}

					cssDir.getDirectory(theme, null, dir => {
						dir.createReader().readEntries(files => {
							files.forEach(entry => {
								if(entry.isFile) {
									themeData[entry.name] = true
								}
							})

							if(--counter === 0) {
								STORAGE.set({ themes })
							}
						})
					})
				})
			})
		})
	})
})();
"use strict"

const DirectoryEntry = (() => {
	const directoryEntry = []

	const recurse = (dir, dirpath, callback) => {
		dir.createReader().readEntries(array => {
			let dirsLeft = 0
			let finished = false

			array.forEach(entry => {
				const entrypath = `${dirpath}/${entry.name}`
				if(entry.isDirectory) {
					dirsLeft++
					recurse(entry, entrypath, () => !--dirsLeft && finished && callback())
				} else if(entry.isFile) {
					directoryEntry.push(entrypath)
				}
			})

			finished = true
			if(!dirsLeft) callback();
		})
	}

	chrome.runtime.getPackageDirectoryEntry(root => {
		root.getDirectory("css", null, dir => {
			recurse(dir, dir.name, () => {
				STORAGE.set({ directoryEntry })
			})
		})
	})

	return directoryEntry
})();
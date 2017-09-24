"use strict"

const ContentJS = (() => {
	const listenersByType = {}
	const ports = {}

	chrome.runtime.onConnect.addListener(port => {
		if(port.name !== "BackgroundJS.connect") return port.disconnect();

		ports[port.sender] = port
		port.onDisconnect.addListener(() => delete ports[port.sender])
	})

	chrome.runtime.onMessage.addListener((msg, sender, respond) => {
		const port = ports[sender]
		const listeners = listenersByType[msg.type]

		console.assert(port)

		if(listeners) {
			for(let i = 0; i < listeners.length; i++) {
				const [callback, once] = listeners[i]
				const result = callback(msg.data, respond, port)
				if(once) listeners.splice(i--, 1);
				if(result === true) return true;
			}
		}
	})

	return {
		send(type, data, callback) {
			if(typeof data === "function") {
				callback = data
				data = null
			}

			console.warn("ContentJS.send is not implemented")
			// chrome.runtime.sendMessage({ type, data }, callback)
		},
		listen(typeList, callback, once) {
			typeList.split(" ").forEach(type => {
				if(!listenersByType[type]) listenersByType[type] = [];
				listenersByType[type].push([callback, once])
			})
		}
	}
})();


Object.entries(
	{
		getSettings(data, respond) {
			Settings.get().then(settings => {
				respond(settings)
			})
			return true
		},
		setSetting(data, respond) {
			Settings.set(data)
			return false
		},
		getRankName(data, respond) {
			const url = `https://www.roblox.com/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRole&playerid=${data.userId}&groupid=${data.groupId}`
			fetch(url).then(async resp => respond(await resp.text()))
			return true
		},
		downloadFile(url, respond) {
			fetch(url, { credentials: "include" })
				.then(async response => {
					const blob = await response.blob()
					respond(URL.createObjectURL(blob))
				})
				.catch(ex => {
					console.error("[cshandler] downloadFile error", ex)
					respond(null)
				})

			return true
		},
		requestBlogFeed(_, respond, port) {
			Settings.get().then(settings => {
				if(settings.general.showBlogFeed) {
					Blogfeed.get(updatedFeedData => {
						port.postMessage({ type: "blogfeed", data: updatedFeedData })
					})
				}
			})
		},
		_execScripts(list, respond, port) {
			const promises = list.map(path => new Promise(resolve => {
				chrome.tabs.executeScript(port.sender.tab.id, { file: path, runAt: "document_start", frameId: port.sender.frameId }, resolve)
			}))

			Promise.all(promises).then(respond)
			return true
		}
	}
).forEach(([key, value]) => ContentJS.listen(key, value));


// Directory entry
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
				chrome.storage.local.set({ directoryEntry })
			})
		})
	})

	return directoryEntry
})();


// Legacy cleanup
localStorage.removeItem("cssCache")
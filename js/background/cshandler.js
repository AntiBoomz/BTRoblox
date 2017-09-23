"use strict"

const cssCache = (() => {
	try {
		return JSON.parse(localStorage.cssCache)
	} catch(ex) { return {} }
})();

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
		applyPage(name, respond, port) {
			const pageInfo = typeof name === "string" ? PAGE_INFO[name] : null

			Settings.get().then(settings => {
				if(settings.general.showBlogFeed) {
					Blogfeed.get(updatedFeedData => {
						port.postMessage({ type: "blogfeed", data: updatedFeedData })
					})
				}

				const cssFiles = ["main.css"]
				const cssGroups = ["css/", `css/${settings.general.theme}/`]
				const cssMerge = []

				if(pageInfo && pageInfo.css) cssFiles.push(...pageInfo.css);

				cssGroups.forEach(group => cssFiles.forEach(filePath => {
					const source = cssCache[group + filePath]
					if(source) cssMerge.push(source);
				}))

				chrome.tabs.insertCSS(port.sender.tab.id, {
					frameId: port.sender.frameId,
					code: cssMerge.join("\n\n"),
					runAt: "document_start"
				}, () => chrome.runtime.lastError)
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

function updateCSSCache() {
	localStorage.removeItem("cssCache")
	Object.keys(cssCache).forEach(key => delete cssCache[key])

	let updateCacheTimeout

	chrome.runtime.getPackageDirectoryEntry(root => {
		function recurse(dir, dirpath) {
			dir.createReader().readEntries(array => {
				array.forEach(entry => {
					const entrypath = `${dirpath}/${entry.name}`
					if(entry.isDirectory) {
						recurse(entry, entrypath)
					} else if(entry.isFile && entry.name.endsWith(".css")) {
						cssCache[entrypath] = `/* File: ${entrypath}  Loading... */`
						fetch(chrome.runtime.getURL(entrypath)).then(response => {
							response.text().then(source => {
								source = source.replace(/\s*\n\s*|\/\*((?!\*\/).)*\*\//g, "")
								source = `/* File: ${entrypath} */\n${source}`
								cssCache[entrypath] = source

								clearTimeout(updateCacheTimeout)
								updateCacheTimeout = setTimeout(() => {
									localStorage.cssCache = JSON.stringify(cssCache)
								}, 500)
							})
						})
					}
				})
			})
		}

		root.getDirectory("css", null, dir => recurse(dir, dir.name))
	})
}

chrome.runtime.onInstalled.addListener(updateCSSCache)
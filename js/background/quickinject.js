"use strict"

function parseLocation(url) {
	var loc = document.createElement("a")
	loc.href = url

	return { 
		hash: loc.hash, host: loc.host, hostname: loc.hostname, href: loc.href, origin: loc.origin, 
		pathname: loc.pathname, port: loc.port, protocol: loc.protocol, search: loc.search
	}
}

function fileExists(pathString) {
	var path = pathString.split("/")
	var target = extensionDirectory

	for(var i=0, l=path.length; i<l; i++) {
		target = target[path[i]]
		if(!target)
			return false;
	}

	return true
}

const themeCSS = {}

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
	switch(msg.name) {
		case "getdata":
			var pathname = parseLocation(msg.url).pathname.toLowerCase()

			if(skipPages.find(url => pathname.search(url) !== -1))
				return respond(null);

			var currentPage

			var cssDir = `css/`
			var themeDir = `css/${settings.general.theme}/`
			var cssFiles = [ cssDir + "main.css", themeDir + "main.css" ]

			for(var name in pages) {
				var page = pages[name]
				for(var i in page.matches) {
					var matches = pathname.match("^" + page.matches[i])
					if(matches) {
						currentPage = { name, matches: matches.slice(1)}
						if(page.css) page.css.forEach(path => cssFiles.push(cssDir + path, themeDir + path));
						break
					}
				}
			}

			var cssParts = []
			cssFiles.forEach(path => path in cssSources && cssParts.push(cssSources[path]))
			var mergedCSS = cssParts.join("\n\n")

			respond({
				settings,
				currentPage,
				blogFeedData: fetchBlogFeed()
			})

			chrome.tabs.insertCSS(sender.tab.id, {
				frameId: sender.frameId,
				code: mergedCSS,
				runAt: "document_start"
			}, () => chrome.runtime.lastError)
		break;
	}
})




const cssSources = {}
extensionDirectoryPromise.then(() => {
	function recurse(dict, path) {
		Object.keys(dict).forEach(name => {
			var value = dict[name]
			var filePath = path + "/" + name

			if(value === true) {
				request.get(chrome.runtime.getURL(filePath), data => {
					data = data.replace(/\s*\n\s*|\/\*((?!\*\/).)*\*\//g, "")
					cssSources[filePath] = `/* File: ${filePath} */\n${data}`
				})
			} else {
				recurse(value, filePath)
			}
		})
	}

 	recurse(extensionDirectory.css, "css")
 })
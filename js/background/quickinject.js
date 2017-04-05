"use strict"

var skipPages = [
	"^/login/fulfillconstraint.aspx",
	"^/build/upload",
	"^/userads/",
	"^/user-sponsorship/",
	"^/Feeds/GetUserFeed"
]

function parseHeaders(array) {
	var headers = {}

	array.forEach((header) => {
		headers[header.name.toLowerCase()] = header.value.trim().split(";")
	})

	return headers
}

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


chrome.webRequest.onResponseStarted.addListener((details) => {
	var headers = parseHeaders(details.responseHeaders)

	if(headers["content-type"] && headers["content-type"][0].trim().toLowerCase() !== "text/html")
		return;

	var pathname = parseLocation(details.url).pathname.toLowerCase()

	for(var i=0; i<skipPages.length; i++) {
		if(pathname.search(skipPages[i]) !== -1)
			return;
	}

	var cssFiles = []

	cssFiles.push("main.css")
	cssFiles.push(settings.general.theme + "/main.css")

	var currentPage = null
	for(var name in pages) {
		var page = pages[name]
		for(var i in page.matches) {
			var matches = pathname.match(page.matches[i]);
			if(matches) {
				currentPage = { name: name, matches: matches.slice(1) }

				if(page.css) {
					for(var i in page.css) {
						var path = page.css[i]
						cssFiles.push(path)
						cssFiles.push(settings.general.theme + "/" + path)
					}
				}

				break;
			}
		}
	}

	var initCode = [ 
		"settings="+JSON.stringify(settings),
		"currentPage="+JSON.stringify(currentPage)
	]

	var blogfeed = fetchBlogFeed()
	if(blogfeed) {
		initCode.push("blogFeedData=" + blogfeed)
	}

	initCode = initCode.join(",") + "; if(typeof(CSFinishedLoading) !== 'undefined')Init();"

	var tryCount = 0
	function tryInject() {
		tryCount++

		chrome.tabs.executeScript(details.tabId, { code: initCode, runAt: "document_start", frameId: details.frameId }, () => {
			if(chrome.runtime.lastError) {
				console.log(chrome.runtime.lastError)
				if(tryCount < 50) {
					setTimeout(tryInject, 0);
				} else {
					console.log("Hit tryCount limit :<")
				}
				return;
			}

			//console.log("Injected in " + tryCount + " tries", details)

			cssFiles.forEach((path) => {
				if(fileExists("css/" + path)) {
					chrome.tabs.insertCSS(details.tabId, { file: "css/" + path, runAt: "document_start", frameId: details.frameId })
				}
			})
		})
	}

	tryInject()
}, {
	urls: ["*://www.roblox.com/*", "*://forum.roblox.com/*"],
	types: ["main_frame", "sub_frame"]
}, ["responseHeaders"])

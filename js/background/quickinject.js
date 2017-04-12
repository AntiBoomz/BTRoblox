"use strict"

const skipPages = [
	"^/login/fulfillconstraint.aspx",
	"^/build/upload",
	"^/userads/",
	"^/user-sponsorship/",
	"^/Feeds/GetUserFeed"
]

const mainParams = {
	urls: ["*://www.roblox.com/*", "*://forum.roblox.com/*"],
	types: ["main_frame", "sub_frame"]
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


chrome.webRequest.onResponseStarted.addListener(details => {
	var timeStarted = Date.now()
	var headers = details.responseHeaders
	var location = parseLocation(details.url)
	var pathname = location.pathname.toLowerCase()

	for(var i=0; i<skipPages.length; i++) {
		if(pathname.search(skipPages[i]) !== -1)
			return;
	}

	var contentType = headers.find(h => h.name.toLowerCase() === "content-type")
	if(!contentType || contentType.value.indexOf("text/html") === -1)
		return;

	var currentPage = null
	var cssFiles = []

	var themeDir = "css/" + settings.general.theme + "/"
	cssFiles.push("css/main.css", themeDir + "main.css")

	for(var name in pages) {
		var page = pages[name]
		for(var i in page.matches) {
			var matches = pathname.match("^" + page.matches[i]);
			if(matches) {
				currentPage = { name: name, matches: matches.slice(1) }

				if(page.css) {
					page.css.forEach(path => cssFiles.push("css/" + path, themeDir + path))
				}
				break;
			}
		}
	}

	var initData = [
		"settings=" + JSON.stringify(settings),
		"currentPage=" + JSON.stringify(currentPage)
	]

	var blogfeed = fetchBlogFeed()
	if(blogfeed) {
		initData.push("blogFeedData=" + JSON.stringify(blogfeed))
	}

	var initData = "if(typeof(hasBeenInit) === \"undefined\") { var hasBeenInit=true," + initData.join(",") + "; if(typeof(hasCsLoaded) !== \"undefined\") Init(); }"
	var initialized = false

	function injectScript() {
		chrome.tabs.executeScript(details.tabId, { code: initData, runAt: "document_start", frameId: details.frameId }, () => {
			if(chrome.runtime.lastError || initialized)
				return;

			initialized = true
			cssFiles.forEach(path => {
				if(!fileExists(path))
					return;
				
				chrome.tabs.insertCSS(
					details.tabId, 
					{ file: path, runAt: "document_start", frameId: details.frameId }, 
					() => chrome.runtime.lastError
				)
			})
		})
	}

	injectScript()

	for(var i=1; i<5; ++i) {
		setTimeout(injectScript, i*5)
	}
}, mainParams, ["responseHeaders"])
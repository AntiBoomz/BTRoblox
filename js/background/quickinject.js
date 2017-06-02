"use strict"

const skipPages = [
	"^/login/fulfillconstraint.aspx",
	"^/build/upload",
	"^/userads/",
	"^/user-sponsorship/",
	"^/Feeds/GetUserFeed"
]

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

function shouldSkip(pathname) {
	for(var i=0; i<skipPages.length; i++) {
		if(pathname.search(skipPages[i]) !== -1)
			return true;
	}

	return false
}

function quickInject(data) {
	//console.log(data)
	var location = parseLocation(data.url)
	var pathname = location.pathname.toLowerCase()

	var headers = data.responseHeaders
	var initData = {}

	if(headers.find(x => x.name.toLowerCase() === "content-type").value.indexOf("text/html") === -1 || shouldSkip(pathname)) {
		initData.invalid = true
	} else {
		var currentPage = null

		for(var name in pages) {
			var page = pages[name]
			for(var i in page.matches) {
				var matches = pathname.match("^" + page.matches[i]);
				if(matches) {
					currentPage = { name: name, matches: matches.slice(1) }
					break;
				}
			}
		}

		initData.settings = settings
		initData.currentPage = currentPage
		initData.serverDate = Date.parse(headers.find(x => x.name.toLowerCase() === "date").value)

		var blogfeed = fetchBlogFeed()
		if(blogfeed)
			initData.blogFeedData = blogfeed;
	}

	headers.push({
		name: "Set-Cookie",
		value: `BTR-Data=${encodeURIComponent(JSON.stringify(initData))}; Domain=${location.host}; Path=${location.pathname}; Max-Age=10`
	})

	return { responseHeaders: headers }
}

var cssSources = {}
var cachedMerges = {}

function mergeCSS(data) {
	var location = parseLocation(parseLocation(data.url).search.substring(1))
	var pathname = location.pathname.toLowerCase()
	var cssFiles = []

	var themeDir = "css/" + settings.general.theme + "/"
	cssFiles.push("css/main.css", themeDir + "main.css")

	for(var name in pages) {
		var page = pages[name]
		for(var i in page.matches) {
			var matches = pathname.match("^" + page.matches[i]);
			if(matches) {
				if(page.css) {
					page.css.forEach(path => cssFiles.push("css/" + path, themeDir + path))
				}
				break;
			}
		}
	}

	var result = [ "data:text/css," ]
	cssFiles.forEach(path => {
		var src = cssSources[path]
		if(src)
			result.push(src);
	})

	var url = cachedMerges[pathname] = result.join("")

	return { redirectUrl: url }
}

extensionDirectoryPromise.then(() => {
	function recurse(dict, path) {
		Object.keys(dict).forEach(name => {
			var value = dict[name]
			var filePath = path + "/" + name

			if(value === true) {
				request.get(chrome.runtime.getURL(filePath), data => {
					cssSources[filePath] = data.replace(/\s*\n\s*|\/\*((?!\*\/).)*\*\//g, "")
				})
			} else {
				recurse(value, filePath)
			}
		})
	}

	recurse(extensionDirectory.css, "css")
})

const params = {
	urls: ["*://www.roblox.com/*", "*://forum.roblox.com/*"],
	types: ["main_frame", "sub_frame"]
}

chrome.webRequest.onHeadersReceived.addListener(quickInject, params, [ "blocking", "responseHeaders" ])
chrome.webRequest.onBeforeRequest.addListener(mergeCSS, { urls: [ chrome.runtime.getURL("css/_merged.css") + "*" ] }, [ "blocking" ])
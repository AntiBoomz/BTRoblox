"use strict"

var blogFeedUrl = "https://blog.roblox.com/feed/"
var cachedBlogFeedRaw = null
var cachedBlogFeed = null

function fetchBlogFeed() {
	if(!settings.general.showBlogFeed)
		return null;

	request.get(blogFeedUrl, (feed) => {
		if(cachedBlogFeedRaw !== feed) {
			cachedBlogFeedRaw = feed

			var responseData = []
			var doc = new DOMParser().parseFromString(feed, "text/xml")
			var items = doc.querySelectorAll("item")

			for(var i=0; i<3; i++) {
				var item = items[i]
				var url = item.querySelector("link").textContent
				var title = item.querySelector("title").textContent
				var published = Date.parse(item.querySelector("pubDate").textContent)
				var descDoc = new DOMParser().parseFromString(item.querySelector("description").textContent, "text/html")
				descDoc.querySelector("p:last-child").remove()
				var desc = descDoc.body.innerText.trim()
				var creator = item.querySelector("creator").textContent

				responseData.push({ url, title, published, desc, creator })
			}

			cachedBlogFeed = responseData
			ContentJS.broadcast("blogfeed", cachedBlogFeed)
		}
	})

	return cachedBlogFeed
}

addSettingsLoadedListener(fetchBlogFeed)

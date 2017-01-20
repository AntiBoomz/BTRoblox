"use strict"

var blogFeedUrl = "https://blog.roblox.com/feed/"
var blogFeedFormat = "<a class='btr_feed' href='{0}'><div class='btr_feedtitle'>{1}<span class='btr_feeddate'>()</span></div><span class='btr_feedactdate'>{2}</span><div class='btr_feeddesc'>{3}</div><div class='btr_feedcreator'>by {4}</div></a>"
var cachedBlogFeedRaw = null
var cachedBlogFeed = null

function fetchBlogFeed() {
	if(!settings.general.showBlogFeed)
		return null;

	request.get(blogFeedUrl, (feed) => {
		if(cachedBlogFeedRaw !== feed) {
			cachedBlogFeedRaw = feed

			var responseData = ""
			var doc = new DOMParser().parseFromString(feed, "text/xml")
			var items = doc.querySelectorAll("item")

			for(var i=0; i<3; i++) {
				var item = items[i]
				var url = item.querySelector("link").textContent
				var title = item.querySelector("title").textContent
				var publishDate = item.querySelector("pubDate").textContent
				var descDoc = new DOMParser().parseFromString(item.querySelector("description").textContent, "text/html")
				descDoc.querySelector("p:last-child").remove()
				var desc = descDoc.body.innerText.trim()
				var creator = item.querySelector("creator").textContent

				responseData += $(blogFeedFormat).elemFormat(url, title, publishDate, desc, creator)[0].outerHTML
			}

			cachedBlogFeed = responseData
			ContentJS.broadcast("blogfeed", cachedBlogFeed)
		}
	})

	return cachedBlogFeed
}

addSettingsLoadedListener(fetchBlogFeed)

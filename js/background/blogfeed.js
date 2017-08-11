"use strict"

const Blogfeed = (() => {
	const feedUrl = "https://blog.roblox.com/feed/"
	let cachedFeedRaw
	let cachedFeed


	return {
		get(cb) {
			fetch(feedUrl).then(response => {
				response.text().then(feed => {
					if(feed === cachedFeedRaw) return;
					cachedFeedRaw = feed

					const responseData = []
					const doc = new DOMParser().parseFromString(feed, "text/xml")
					const items = doc.querySelectorAll("item")

					for(let i = 0; i < 3; i++) {
						const item = items[i]
						const url = item.querySelector("link").textContent
						const title = item.querySelector("title").textContent
						const published = Date.parse(item.querySelector("pubDate").textContent)
						const descDoc = new DOMParser().parseFromString(item.querySelector("description").textContent, "text/html")
						descDoc.querySelector("p:last-child").remove()
						const desc = descDoc.body.textContent.trim()
						const creator = item.querySelector("creator").textContent

						responseData.push({ url, title, published, desc, creator })
					}

					cachedFeed = responseData
					if(typeof cb === "function") cb(cachedFeed);
				})
			})

			return cachedFeed
		}
	}
})();
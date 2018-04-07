"use strict"

const Blogfeed = (() => {
	// "https://blog.roblox.com/feed/"
	const feedUrl = "https://blog.roblox.com/wp-json/wp/v2/posts?per_page=3&context=embed"
	let cachedFeed
	let lastRequest = 0

	const htmlStripper = document.createElement("template")
	const striphtml = html => {
		htmlStripper.innerHTML = html
		return htmlStripper.textContent
	}

	return {
		get(cb) {
			if(Date.now() - lastRequest > 3000) {
				lastRequest = Date.now()
				fetch(feedUrl).then(response => {
					response.json().then(json => {
						cachedFeed = json.map(post => ({
							url: post.link,
							date: post.date,
							title: striphtml(post.title.rendered).trim(),
							desc: striphtml(post.excerpt.rendered).trim()
						}))


						STORAGE.set({ cachedBlogFeedV2: cachedFeed })
						if(typeof cb === "function") cb(cachedFeed);
					})
				})
			}

			return cachedFeed
		}
	}
})();
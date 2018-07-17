"use strict"

{
	// "https://blog.roblox.com/feed/"
	const feedUrl = "https://blog.roblox.com/wp-json/wp/v2/posts?per_page=3&context=embed"
	let cachedFeed
	let lastRequest = 0

	MESSAGING.listen({
		requestBlogFeed(_, respond) {
			if(cachedFeed) {
				respond(cachedFeed, true)
			}

			if(Date.now() - lastRequest > 3000) {
				lastRequest = Date.now()

				fetch(feedUrl).then(async response => {
					if(!response.ok) {
						return respond.cancel()
					}

					const json = await response.json()
					cachedFeed = json.map(post => ({
						url: post.link,
						date: post.date,
						title: html`<div>${post.title.rendered}</div>`.textContent.trim(),
						desc: html`<div>${post.excerpt.rendered}</div>`.textContent.trim()
					}))


					STORAGE.set({ cachedBlogFeedV2: cachedFeed })
					respond(cachedFeed)
				})
			} else {
				respond.cancel()
			}
		}
	})
}


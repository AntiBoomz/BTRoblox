"use strict"

{
	// "https://blog.roblox.com/feed/"
	const feedUrl = `https://blog.roblox.com/wp-json/wp/v2/posts?per_page=3&context=embed`
	let cachedFeed
	
	let lastRequest = 0
	let fetching

	const striphtml = html => html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ")

	MESSAGING.listen({
		requestBlogFeed(_, respond) {
			if(!fetching && Date.now() - lastRequest > 3000) {
				lastRequest = Date.now()

				fetching = fetch(feedUrl).then(async response => {
					if(!response.ok) {
						return
					}

					const json = await response.json()
					cachedFeed = json.map(post => ({
						url: post.link,
						date: post.date,
						title: striphtml(post.title.rendered).trim(),
						desc: striphtml(post.excerpt.rendered).trim()
					}))


					STORAGE.set({ cachedBlogFeedV2: cachedFeed })
					fetching = null
				})
			}
			
			if(cachedFeed) {
				respond(cachedFeed, true)
			}
			
			if(fetching) {
				fetching.then(() => respond(cachedFeed))
			} else {
				respond.cancel()
			}
		}
	})
}


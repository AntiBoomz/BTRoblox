"use strict"

const BlogFeed = {
	lastRequest: 0,
	
	fetching: null,
	cached: null,
	
	canRequest() {
		return Date.now() > this.lastRequest + 15e3
	},
	
	request() {
		if(!this.fetching && this.canRequest()) {
			this.lastRequest = Date.now()
			
			const striphtml = html => html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ")
			const feedUrl = `https://blog.roblox.com/wp-json/wp/v2/posts?per_page=3&context=embed`

			this.fetching = fetch(feedUrl).then(async response => {
				if(!response.ok) {
					return Promise.reject()
				}

				const json = await response.json()
				
				this.cached = json.map(post => ({
					url: post.link,
					date: post.date,
					title: striphtml(post.title.rendered).trim(),
					desc: striphtml(post.excerpt.rendered).trim()
				}))

				STORAGE.set({ cachedBlogFeedV2: this.cached })
				SHARED_DATA.set("blogfeed", this.cached)
				
				return this.cached
			})
			
			this.fetching.finally(() => {
				this.fetching = null
			})
		}
		
		return this.fetching || Promise.reject()
	}
}

STORAGE.get(["cachedBlogFeedV2"], data => {
	if(data.cachedBlogFeedV2 && BlogFeed.cached) {
		BlogFeed.cached = data.cachedBlogFeedV2
		SHARED_DATA.set("blogfeed", BlogFeed.cached)
	}
})

MESSAGING.listen({
	requestBlogFeed(_, respond) {
		if(BlogFeed.cached) {
			respond(BlogFeed.cached, true)
		}
		
		BlogFeed.request().then(
			data => respond(data),
			() => respond.cancel()
		)
	}
})
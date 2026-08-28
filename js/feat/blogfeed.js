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

			this.fetching = fetch(`https://about.roblox.com/search-index/en.json`).then(async res => {
				const json = await res.json()
				const posts = []
				
				for(const entry of json) {
					if(entry.page_type !== "newsroom") { continue }
					
					posts.push({
						url: entry.url,
						date: entry.publishDate,
						title: entry.title,
						desc: entry.description
					})
					
					if(posts.length >= 3) { break }
				}
				
				this.cached = posts

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
	if(data.cachedBlogFeedV2 && !BlogFeed.cached) {
		BlogFeed.cached = data.cachedBlogFeedV2
		SHARED_DATA.set("blogfeed", BlogFeed.cached)
	}
})

contentScript.listen({
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
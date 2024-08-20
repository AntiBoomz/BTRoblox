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

			const feedUrl = `https://api.buttercms.com/v2/pages/long_form_page/?locale=en&preview=0&page=1&page_size=3&fields.page_type.slug=newsroom&fields.unlist_page=false&order=-displayed_publish_date&auth_token=137ac5a15935fab769262b6167858b427157ee3d`

			this.fetching = fetch(feedUrl).then(async res => {
				const json = await res.json()
				const posts = []
				
				for(let i = 0; i < 3; i++) {
					const post = json.data[i]
					if(!post) { break }
					
					const published = new Date(post.fields.displayed_publish_date)
					
					posts.push({
						url: `https://corp.roblox.com/newsroom/${published.getUTCFullYear()}/${("0" + (published.getUTCMonth() + 1)).slice(-2)}/${post.slug}`,
						date: post.fields.displayed_publish_date,
						title: post.fields.title,
						desc: post.fields.long_form_content?.find(x => x.type === "long-form-text")?.fields.body ?? ""
					})
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
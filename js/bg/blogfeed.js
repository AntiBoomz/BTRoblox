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
			
			const escape = { amp: "&", gt: ">", lt: "<", apos: "'", quot: "\"" }
			
			const content = (data, trimlen=null) => {
				data = data
					.replace(/<!\[CDATA\[([^]*?)\]\]>/g, "$1") // strip cdata
					.replace(/<(style)[^>]*>.*?<\/\1[^>]*>/gis, "") // strip out style elements
					.replace(/<[^>]*>/g, "") // strip out all other tags
					.replace(/&(?:(amp|gt|lt|apos|quot)|(?:#x([a-fA-F0-9]+))|(?:#([0-9]+)));/g, (_, name, hex, dec) => // unescape characters
						(name ? escape[name] : hex ? String.fromCodePoint(parseInt(hex, 16)) : String.fromCodePoint(parseInt(dec, 10)))
					)
				
				if(trimlen && trimlen < data.length) {
					let index = 0
					
					while(index <= trimlen) {
						index = data.indexOf("\n", index + 1)
						
						if(index === -1) {
							index = data.length
							break
						}
					}
					
					data = data.slice(0, index)
				}
				
				return data
					.replace(/(?<=\w)\s*$/gm, ".") // add dots to end of sentences that dont have them
					.replace(/\s+/g, " ") // collapse all whitespace
					.trim()
			}
			
			const feedUrl = `https://api.buttercms.com/v2/pages/long_form_page/?locale=en&preview=0&page=1&page_size=3&fields.page_type.slug=newsroom&order=-displayed_publish_date&auth_token=137ac5a15935fab769262b6167858b427157ee3d`

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
						desc: content(post.fields.long_form_content?.find(x => x.type === "long-form-text")?.fields.body, 200)
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
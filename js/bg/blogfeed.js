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
			
			const unescape = data => {
				return data
					.replace(/<!\[CDATA\[([^]*?)\]\]>/g, "$1") // strip cdata
					.replace(/&(?:(amp|gt|lt|apos|quot)|(?:#x([a-fA-F0-9]+))|(?:#([0-9]+)));/g, (_, name, hex, dec) => // unescape characters
						(name ? escape[name] : hex ? String.fromCodePoint(parseInt(hex, 16)) : String.fromCodePoint(parseInt(dec, 10)))
					)
					.trim()
			}
			
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
			
			const feedUrl = `https://blog.roblox.com/feed/`

			this.fetching = fetch(feedUrl).then(async response => {
				if(!response.ok) {
					return Promise.reject()
				}
				
				const text = await response.text()
				const regex = /<item>[^]*?<\/item>/g
				
				const posts = []
				
				for(let i = 0; i < 3; i++) {
					const match = regex.exec(text)
					if(!match) { break }
					
					const [, title, link, date, desc] = match[0].match(/<title>([^]*?)<\/title>[^]*?<link>([^]*?)<\/link>[^]*?<pubDate>([^]*?)<\/pubDate>[^]*?<content:encoded>([^]*?)<\/content:encoded>/) || []
					if(!link) { continue }
					
					posts.push({
						url: unescape(link),
						date: unescape(date),
						title: unescape(title),
						desc: content(desc, 200)
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
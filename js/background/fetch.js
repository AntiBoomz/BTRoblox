"use strict"


MESSAGING.listen({
	async fetch([url, init = {}], respond) {
		const resp = await fetch(url, init)
		const blob = await resp.blob()
		const blobUrl = URL.createObjectURL(blob)
		
		respond({
			blobUrl,
			status: resp.status,
			statusText: resp.statusText,
			headers: Array.from(resp.headers.entries()),
			redirected: resp.redirected,
			type: resp.type,
			url: resp.url
		})

		setTimeout(() => URL.revokeObjectURL(blobUrl), 1e3)
	}
})
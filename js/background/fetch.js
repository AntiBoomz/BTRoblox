"use strict"


MESSAGING.listen({
	async fetch([url, init = {}], respond) {
		const resp = await fetch(url, init)
		const blob = await resp.blob()

		const fileReader = new FileReader()
		fileReader.readAsDataURL(blob)

		await new Promise(resolve => fileReader.onload = resolve)
		
		respond({
			dataUrl: fileReader.result,
			ok: resp.ok,
			status: resp.status,
			statusText: resp.statusText,
			headers: Array.from(resp.headers.entries()),
			redirected: resp.redirected,
			type: resp.type,
			url: resp.url
		})
	}
})
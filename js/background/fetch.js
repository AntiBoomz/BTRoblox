"use strict"


MESSAGING.listen({
	async fetch([url, init = {}], respond) {
		if(init._body) {
			const body = init._body
			
			switch(body.type) {
			case "URLSearchParams":
				init.body = new URLSearchParams(body.data)
				break
			}

			delete init._body
		}

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
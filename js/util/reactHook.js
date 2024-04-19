"use strict"

const reactHook = {
	inject(data) {
		data = { ...data }
		data.selector = parseReactSelector(data.selector)
		
		if(typeof data.index === "object") {
			data.index = { ...data.index }
			data.index.selector = parseReactSelector(data.index.selector)
		}
		
		const callback = data.callback
		const resultHtml = data.html
		
		delete data.callback
		delete data.html
		
		data.elemType = html(resultHtml).nodeName.toLowerCase()
		data.elemId = `btr-react-${reactListenerIndex++}`
		
		document.$watch(`#${data.elemId}`, node => {
			const replace = html(resultHtml)
			node.replaceWith(replace)
			callback?.(replace)
		}, { continuous: true })
		
		InjectJS.send("reactInject", data)
	},
	
	init() {
	}
}

reactHook.init()
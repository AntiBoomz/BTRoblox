"use strict"

const reactHook = {
	listenerIndex: 0,

	parseReactStringSelector(selector) {
		assert(!/[[>+~]/.exec(selector), "complex selectors not supported")
		const result = []
		
		for(const option of selector.split(/,/)) {
			let previous
			
			for(let piece of option.split(/\s+/)) {
				piece = piece.trim()
				if(!piece.length) { continue }
				
				const attributes = piece.split(/(?=[#.])/)
				const obj = {}
				
				for(const attr of attributes) {
					if(attr[0] === ".") {
						obj.classList = obj.classList ?? []
						obj.classList.push(attr.slice(1))
					} else if(attr[0] === "#") {
						obj.props = obj.props ?? {}
						obj.props.id = attr.slice(1)
					} else {
						if(attr !== "*") { // unset obj.type acts as universal selector
							obj.type = attr.toLowerCase()
						}
					}
				}
				
				if(previous) {
					previous.next = obj
				} else {
					result.push(obj) // Add first selector to result
				}
				
				previous = obj
			}
		}
		
		return result
	},

	parseReactSelector(selectors) {
		selectors = Array.isArray(selectors) ? selectors : [selectors]
		const result = []
		
		for(let i = 0, len = selectors.length; i < len; i++) {
			const selector = selectors[i]
			
			if(typeof selector === "string") {
				result.push(...reactHook.parseReactStringSelector(selector))
				continue
			}
			
			if(selector.selector) {
				assert(!selector.next)
				const selectors = reactHook.parseReactStringSelector(selector)
				
				const fillMissingData = targets => {
					for(const target of targets) {
						if(target.next) {
							fillMissingData(target.next)
							continue
						}
						
						for(const key of selector) {
							if(key === "selector") { continue }
							const value = selector[key]
							
							if(Array.isArray(value)) {
								target[key] = target[key] ?? []
								target[key].push(...value)
								
							} else if(typeof value === "object" && value !== null) {
								target[key] = target[key] ?? {}
								Object.assign(target[key], value)
								
							} else {
								target[key] = value
							}
						}
					}
				}
				
				fillMissingData(selectors)
				result.push(...selectors)
				continue
			}
			
			result.push(selector)
		}
		
		return result
	},
	
	inject(data) {
		data = { ...data }
		data.selector = reactHook.parseReactSelector(data.selector)
		
		if(typeof data.index === "object") {
			data.index = { ...data.index }
			data.index.selector = reactHook.parseReactSelector(data.index.selector)
		}
		
		const callback = data.callback
		const resultHtml = data.html
		
		delete data.callback
		delete data.html
		
		data.elemType = html(resultHtml).nodeName.toLowerCase()
		data.elemId = `btr-react-${reactHook.listenerIndex++}`
		
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
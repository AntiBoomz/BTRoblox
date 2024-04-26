"use strict"

const reactHook = {
	listenerIndex: 0,
	
	inject(data) {
		data = { ...data }
		
		const callback = data.callback
		const resultHtml = data.html
		
		delete data.callback
		delete data.html
		
		data.action = "append"
		
		data.elemType = html(resultHtml).nodeName.toLowerCase()
		data.elemId = `btr-react-${reactHook.listenerIndex++}`
		
		document.$watch(`#${data.elemId}`, node => {
			const replace = html(resultHtml)
			node.replaceWith(replace)
			callback?.(replace)
		}, { continuous: true })
		
		InjectJS.send("reactInject", data)
	},
	
	redirectIndex: 0,
	
	redirectEvents(from, to) {
		const redirectIndex = this.redirectIndex
		this.redirectIndex += 2
		
		from.dataset.redirectEvents = redirectIndex
		to.dataset.redirectEvents = redirectIndex + 1
		
		InjectJS.inject((fromSelector, toSelector) => {
			const from = document.querySelector(fromSelector)
			const to = document.querySelector(toSelector)
			
			if(!from || !to) {
				console.log("redirectEvents fail", fromSelector, toSelector, from, to)
				return
			}
			
			const events = [
				"cancel", "click", "close", "contextmenu", "copy", "cut", "auxclick", "dblclick",
				"dragend", "dragstart", "drop", "focusin", "focusout", "input", "invalid",
				"keydown", "keypress", "keyup", "mousedown", "mouseup", "paste", "pause", "play",
				"pointercancel", "pointerdown", "pointerup", "ratechange", "reset", "seeked",
				"submit", "touchcancel", "touchend", "touchstart", "volumechange", "drag", "dragenter",
				"dragexit", "dragleave", "dragover", "mousemove", "mouseout", "mouseover", "pointermove",
				"pointerout", "pointerover", "scroll", "toggle", "touchmove", "wheel", "abort",
				"animationend", "animationiteration", "animationstart", "canplay", "canplaythrough",
				"durationchange", "emptied", "encrypted", "ended", "error", "gotpointercapture", "load",
				"loadeddata", "loadedmetadata", "loadstart", "lostpointercapture", "playing", "progress",
				"seeking", "stalled", "suspend", "timeupdate", "transitionend", "waiting", "change",
				"compositionend", "textInput", "compositionstart", "compositionupdate"
			]
			
			const methods = [
				"stopImmediatePropagation", "stopPropagation", "preventDefault",
				"getModifierState", "composedPath",
			]
			
			const callback = event => {
				const clone = new event.constructor(event.type, new Proxy(event, {
					get(target, prop) {
						return prop === "bubbles" ? false : target[prop]
					}
				}))
				
				Object.defineProperties(clone, {
					target: { value: event.target },
					bubbles: { value: event.bubbles },
				})
				
				for(const method of methods) {
					if(typeof clone[method] === "function") {
						clone[method] = new Proxy(clone[method], {
							apply(target, thisArg, args) {
								if(thisArg === clone) {
									target.apply(thisArg, args)
									return event[method].apply(event, args)
								}
								
								return target.apply(thisArg, args)
							}
						})
					}
				}
				
				if(!to.dispatchEvent(clone)) {
					event.preventDefault()
				}
			}
			
			for(const event of events) {
				from.addEventListener(event, callback, { capture: true })
			}
		}, `[data-redirect-events="${redirectIndex}"]`, `[data-redirect-events="${redirectIndex + 1}"]`)
	},
	
	init() {
	}
}

reactHook.init()
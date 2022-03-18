"use strict"

const InjectJS = {
	loaded: false,
	queue: [],
	
	init(args) {
		InjectJS.listen("init", () => {
			this.loaded = true
			
			for(const args of this.queue) {
				this.send.call(this, ...args)
			}
			
			delete this.queue
		})
		
		if(IS_MANIFEST_V3) {
			const script = document.createElement("script")
			script.type = "text/javascript"
			script.id = "btrInjectScript"
			script.src = getURL("js/inject.js")
			script.dataset.args = JSON.stringify(args)
			document.documentElement.append(script)
		} else {
			const script = document.createElement("script")
			script.type = "text/javascript"
			script.id = "btrInjectScript"
			script.textContent = `(${INJECT_SCRIPT})(${JSON.stringify(args).slice(1, -1)})`
			document.documentElement.append(script)
		}
	},

	send(action, ...detail) {
		if(!this.loaded) {
			this.queue.push([action, ...detail])
			return
		}
		
		try {
			if(IS_FIREFOX) { detail = cloneInto(detail, window.wrappedJSObject) }
			document.dispatchEvent(new CustomEvent(`inject.${action}`, { detail }))
		} catch(ex) {
			console.error(ex)
		}
	},

	listen(actions, callback, props) {
		const actionList = actions.split(" ")
		const once = props && props.once

		const cb = ev => {
			if(once) {
				actionList.forEach(action => {
					document.removeEventListener(`content.${action}`, cb)
				})
			}

			if(!ev.detail) {
				console.warn("[BTRoblox] Didn't get event detail from InjectJS", actions)
				return
			}

			return callback(...ev.detail)
		}

		actionList.forEach(action => {
			document.addEventListener(`content.${action}`, cb)
		})
	}
}
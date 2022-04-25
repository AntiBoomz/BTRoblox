"use strict"

const InjectJS = {
	inject(args, fn) {
		if(typeof args === "function") {
			fn = args
			args = []
		}
		
		if(typeof fn !== "function") {
			throw new TypeError("fn is not a function")
		}
		
		if(!Array.isArray(args)) {
			args = [args]
		}
		
		const injector = document.createElement("div")
		injector.setAttribute("onclick", `(${fn})(${JSON.stringify(args).slice(1, -1)})`)
		
		document.documentElement.append(injector)
		injector.click()
		injector.remove()
	},

	send(action, ...detail) {
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
"use strict"

const InjectJS = {
	inject(fn, args) {
		if(!(fn instanceof Function)) {
			throw new TypeError("You can only pass functions to inject")
		}
		
		const injector = document.createElement("div")
		injector.setAttribute("onclick", `(${fn})(${JSON.stringify(Array.isArray(args) ? args : [args]).slice(1, -1)})`)
		
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
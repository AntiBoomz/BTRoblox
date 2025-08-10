"use strict"

pageInit.money = () => {
	if(RobuxToCash.isEnabled()) {
		injectScript.call("money", () => {
			reactHook.inject(".balance-label.icon-robux-container", elem => {
				const list = elem[0].props.children[0]?.props.children
				
				if(Array.isArray(list)) {
					const robux = parseInt(list.at(-1).replace(/\D/g, ""), 10)
					
					if(Number.isSafeInteger(robux)) {
						const cash = RobuxToCash.convert(robux)
						
						list.push(reactHook.createElement("span", {
							className: "btr-robuxToCash",
							children: ` (${cash})`
						}))
					}
				}
			})
		})
	}
}
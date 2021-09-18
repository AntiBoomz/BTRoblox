"use strict"

pageInit.money = function() {
	if(RobuxToCash.isEnabled()) {
		const attached = new WeakSet()
		
		const attach = elem => {
			if(attached.has(elem)) { return }
			attached.add(elem)
			
			const span = elem.lastElementChild
			const amt = parseInt(span?.textContent.replace(/,/g, ""), 10)
			
			if(Number.isSafeInteger(amt)) {
				const cash = RobuxToCash.convert(amt)
				span.after(html`<span style=color:#060;font-size:12px;>&nbsp;(${cash})</span>`)
			}
		}
		
		const observe = () => {
			setTimeout(() => {
				const list = document.$findAll("#transactions-page-container .amount.icon-robux-container")
				
				for(const elem of list) {
					attach(elem)
				}
			}, 0)
		}
		
		document.$watch("#transactions-page-container", cont => {
			new MutationObserver(observe).observe(cont, { childList: true, subtree: true })
			observe()
		})
	}
}
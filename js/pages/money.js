"use strict"

pageInit.money = function() {
	if(RobuxToCash.isEnabled()) {
		const update = span => {
			const amt = parseInt(span.textContent.replace(/,/g, ""), 10)
			
			if(Number.isSafeInteger(amt)) {
				const cash = RobuxToCash.convert(amt)
				let cashLabel = span.nextElementSibling
				
				if(!cashLabel || !cashLabel.matches("cashlabel")) {
					cashLabel = html`<cashlabel style=color:#060;font-size:12px;></cashlabel>`
					span.after(cashLabel)
				}
				
				cashLabel.textContent = ` (${cash})`
			}
		}
		
		const observe = () => {
			const list = document.$findAll("#transactions-page-container .amount.icon-robux-container > span:not([btr-cash]):last-of-type")
			
			for(const span of list) {
				span.setAttribute("btr-cash", true)
				new MutationObserver(() => update(span)).observe(span, { characterData: true, subtree: true })
				update(span)
			}
		}
		
		document.$watch("#transactions-page-container", cont => {
			new MutationObserver(observe).observe(cont, { childList: true, subtree: true })
			observe()
		})
	}
}
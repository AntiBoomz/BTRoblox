"use strict"

pageInit.groupadmin = () => {
	const groupId = +new URLSearchParams(window.location.search).get("id")
	
	if(RobuxToCash.isEnabled()) {
		modifyTemplate("configure-group-page", template => {
			const robuxLabel = template.$find(`.text-robux[ng-bind="$ctrl.groupFunds | number:0"]`)
			if(!robuxLabel) {
				return THROW_DEV_WARNING("Missing robuxLabel")
			}
			
			const cashText = ` (${RobuxToCash.convertAngular("$ctrl.groupFunds")})`
			robuxLabel.after(html`<span class=btr-robuxToCash>${cashText}</span>`)
		})
		
		modifyTemplate("revenue-summary", template => {
			template.$findAll(`.icon-robux-container > span[ng-bind*="$ctrl"]`).forEach(elem => {
				const cashText = ` (${RobuxToCash.convertAngular(elem.getAttribute("ng-bind").replace(/\|.*$/, ""))})`
				elem.after(html`<span class=btr-robuxToCash>${cashText}</span>`)
			})
		})

		modifyTemplate("transactions", template => {
			template.$findAll(`.icon-robux-container > span[ng-bind*="transaction"]`).forEach(elem => {
				const cashText = ` (${RobuxToCash.convertAngular(elem.getAttribute("ng-bind").replace(/\|.*$/, ""))})`
				elem.after(html`<span class=btr-robuxToCash title="${cashText.replace(/{{/g, "")}">${cashText}</span>`)
			})
		})
	}
}
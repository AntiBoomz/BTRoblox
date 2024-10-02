"use strict"

pageInit.groupadmin = () => {
	const groupId = +new URLSearchParams(window.location.search).get("id")
	
	if(RobuxToCash.isEnabled()) {
		angularHook.modifyTemplate("configure-group-page", template => {
			const robuxLabel = template.$find(`.text-robux[ng-bind="$ctrl.groupFunds | number:0"]`)
			if(!robuxLabel) {
				return THROW_DEV_WARNING("Missing robuxLabel")
			}
			
			const cashText = ` (${RobuxToCash.convertAngular("$ctrl.groupFunds")})`
			robuxLabel.after(html`<span class=btr-robuxToCash>${cashText}</span>`)
		})
		
		angularHook.modifyTemplate("revenue-summary", template => {
			for(const elem of template.$findAll(`.icon-robux-container > span[ng-bind*="$ctrl"]`)) {
				const cashText = ` (${RobuxToCash.convertAngular(elem.getAttribute("ng-bind").replace(/\|.*$/, ""))})`
				elem.after(html`<span class=btr-robuxToCash>${cashText}</span>`)
			}
		})

		angularHook.modifyTemplate("transactions", template => {
			for(const elem of template.$findAll(`.icon-robux-container > span[ng-bind*="transaction"]`)) {
				const cashText = ` (${RobuxToCash.convertAngular(elem.getAttribute("ng-bind").replace(/\|.*$/, ""))})`
				elem.after(html`<span class=btr-robuxToCash title="${cashText.replace(/{{/g, "")}">${cashText}</span>`)
			}
		})
	}
}
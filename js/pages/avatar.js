"use strict"

pageInit.avatar = () => {
	if(!SETTINGS.get("avatar.enabled")) {
		return
	}
	
	modifyTemplate("avatar-base", template => {
		template.$find(".redraw-avatar .text-link").after(html`<a class="text-link" ng-click="openAdvancedAccessories()" style="margin-right:6px">Advanced</a>`)
	})
}
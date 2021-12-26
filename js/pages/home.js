"use strict"

pageInit.home = function() {
	if(SETTINGS.get("home.friendsShowUsername")) {
		modifyTemplate("people", card => {
			const nameLabel = card.$find(".friend-name")
			const parent = nameLabel?.closest("a")
			
			if(nameLabel && parent && nameLabel.getAttribute("ng-bind") === "friend.nameToDisplay") {
				document.body.classList.add("btr-home-showUsername")
				nameLabel.after(html`<div class="text-overflow xsmall text-label btr-people-username" title="@{{friend.name}}">@{{friend.name}}</div>`)
			}
		})
	}
	
	if(SETTINGS.get("home.friendPresenceLinks")) {
		modifyTemplate("people-info-card", template => {
			for(const elem of template.$findAll(`[ng-click^="goToGameDetails"]`)) {
				const anchor = document.createElement("a")
				anchor.href = `{{friend.presence.placeUrl}}`
				anchor.append(...elem.childNodes)
				for(const attr of elem.attributes) {
					anchor.setAttribute(attr.name, attr.value)
				}
				elem.replaceWith(anchor)
			}
		})
	}
}
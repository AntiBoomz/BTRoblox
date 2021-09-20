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
}
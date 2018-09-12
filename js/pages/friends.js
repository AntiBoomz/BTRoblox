"use strict"

const myFriends = () => {
	if(settings.friends.alwaysShowUnfriend) {
		modifyTemplate("friends-page-base", template => {
			const menu = template.$find(".avatar-card-menu")
			if(!menu) { return }

			const prev = menu.getAttribute("ng-if")
			menu.setAttribute("ng-if", `(${prev})||currentData.activeTab=="friends"`)
		})

		modifyTemplate("friend-card-menu", template => {
			const unfriend = template.$find(".friend-unfriend")
			if(!unfriend) { return }

			unfriend.parentNode.removeAttribute("ng-show")
		})
	}
}

pageInit.friends = userId => { // userId
	if(!userId) {
		myFriends()
	} else {
		loggedInUserPromise.then(loggedIn => {
			if(+loggedIn === +userId) {
				myFriends()
			}
		})
	}
}

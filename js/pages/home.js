"use strict"

const infoCardTemplate = `<div ng-controller="peopleInfoCardController" ng-class="{'card-with-game': friend.presence.placeUrl}"> <div class="border-bottom place-container" ng-show="friend.presence.placeUrl"> <img ng-src="{{library.placesDict[friend.presence.rootPlaceId].gameIconUrl}}" class="cursor-pointer place-icon" ng-class="{'placeholder-game-icon': !library.placesDict[friend.presence.rootPlaceId].gameIconUrl}" ng-click="goToGameDetails('icon')"> <div class="place-info-container"> <div class="place-info"> <span class="text-subject cursor-pointer place-title" ng-bind="library.placesDict[friend.presence.rootPlaceId].name" ng-click="goToGameDetails('link')"></span> <div class="icon-text-wrapper" ng-show="library.placesDict[friend.presence.rootPlaceId].requiredPurchase"> <span class="icon-robux"></span> <span class="text-robux" ng-bind="library.placesDict[friend.presence.rootPlaceId].price"></span> </div> </div> <div class="place-btn-container"> <button class="place-btn {{library.placesDict[friend.presence.rootPlaceId].buttonLayout.className}}" ng-click="clickBtn('btn')"> {{library.placesDict[friend.presence.rootPlaceId].buttonLayout.text}} </button> </div> </div> </div> <ul class="dropdown-menu interaction-container"> <li class="interaction-item" ng-click="goToChat()"> <span class="icon icon-chat-gray"></span> <span class="text-overflow border-bottom label" ng-bind="layout.interactionLabels.chat(friend.name)"></span> </li> <li class="interaction-item" ng-click="goToProfilePage()"> <span class="icon icon-viewdetails"></span> <span class="label" ng-bind="layout.interactionLabels.viewProfile"></span> </li> </ul> </div>`

pageInit.home = function() {
	modifyTemplate("people-info-card", template => {
		if(template.innerHTML !== infoCardTemplate) {
			if(IS_DEV_MODE) {
				alert("people-info-card changed")
				console.log(template.innerHTML)
			}
		}

		const icon = template.$find(".place-icon")
		if(icon) {
			icon.$wrapWith(html`<a href="{{friend && friend.presence && friend.presence.placeUrl || ''}}" style=display:contents></a>`)
		}

		const title = template.$find(".place-info .place-title")
		if(title) {
			title.$wrapWith(html`<a href="{{friend && friend.presence && friend.presence.placeUrl || ''}}" style=display:contents></a>`)
		}
	})
}
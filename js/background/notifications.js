"use strict"

var notifications = {}

function CreateNotification(id, options) {
	chrome.notifications.create(id, options, (notifId) => {
		notifications[notifId] = options

		if(options.success)
			options.success();
	})
}

chrome.notifications.onClicked.addListener((id) => {
	if(!notifications[id])
		return;

	var notif = notifications[id]

	if(notif.click)
		notif.click();
})

chrome.notifications.onClosed.addListener((id) => {
	delete notifications[id]
})
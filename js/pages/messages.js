"use strict"

pageInit.messages = function() {
	document.$watch(".roblox-messages-container").$then()
		.$watchAll(".rbx-tab-content", container => {
			const inbox = container.$find("#MessagesInbox")
			if(inbox) {
				inbox.$watchAll(".roblox-message-row", row => {
					const span = row.$find(".message-summary-date")
					if(!span) { return }
					const fixedDate = RobloxTime(span.textContent.replace("|", ""))
					if(fixedDate) {
						span.setAttribute("btr-timestamp", "")
						span.textContent = fixedDate.$format("MMM D, YYYY | hh:mm A (T)")
					}
				})
			}

			const content = container.$find(".tab-content")
			if(content) {
				content.$watch(">.roblox-message-body", body => {
					const span = body.$find(".message-detail .date")
					if(!span) { return }
					const fixedDate = RobloxTime(span.textContent.replace("|", ""))
					if(fixedDate) {
						span.setAttribute("btr-timestamp", "")
						span.textContent = fixedDate.$format("MMM D, YYYY | hh:mm A (T)")
					}
				})
			}
		})

	modifyTemplate("messages-nav", template => {
		const curPage = template.$find(".CurrentPage")
		curPage.classList.add("btr-CurrentPage")
		curPage.setAttribute("contentEditable", true)
		curPage.setAttribute("ng-keydown", "keyDown($event)")

		template.$find(".roblox-markAsUnreadInbox").append(html`
		<button class="btr-markAllAsReadInbox btn-control-sm" ng-click="markAllAsRead()">
			Mark All As Read
		</button>`)
	})
}
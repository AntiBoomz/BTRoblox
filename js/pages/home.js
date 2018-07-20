"use strict"

pageInit.home = function() {
	document.$watch("#feed-container").$then().$watch(".feeds").$then()
		.$watchAll(".list-item", item => {
			const span = item.$find(".text-date-hint")
			if(!span) { return } // Feed can have other kind of items too

			const fixedDate = RobloxTime(span.textContent.replace("|", ""))
			if(fixedDate) {
				span.setAttribute("btr-timestamp", "")
				span.textContent = fixedDate.$format("MMM D, YYYY | hh:mm A (T)")
			}
		})
}
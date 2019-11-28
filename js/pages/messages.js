"use strict"

class MarkAllAsReadAction {
	constructor() {
		this.getUnreadCountUrl = `https://notifications.roblox.com/v1/messages/unread/count`
		this.getMessagesUrl = `https://notifications.roblox.com/v1/messages?pageSize=20&messageTab=Inbox&pageNumber=`
		this.markAsReadUrl = `https://notifications.roblox.com/v1/messages/mark-read`

		this.reqParams = { credentials: "include", cache: "no-store" }
		this.threadCount = 5

		this.state = "IDLE"
		this.pagesToCheck = []
		this.unreadMessageIds = []
		this.unreadMessagesLeft = 0
	}

	hasUnreadMessagesLeft() {
		return this.unreadMessagesLeft > 0
	}

	isFinished() {
		return this.state === "FINISHED"
	}

	execute() {
		if(this.state !== "IDLE") { return }
		this.state = "EXECUTE"

		this.getUnreadMessagesLeft()
	}

	finish() {
		if(this.state === "FINISHED") { return }
		this.state = "FINISHED"

		console.log("Done!")
		window.location.reload(true)
	}

	async getUnreadMessagesLeft() {
		const unreadCount = (await $.fetch(this.getUnreadCountUrl, this.reqParams).then(resp => resp.json())).count
		if(unreadCount === 0) {
			return this.finish()
		}

		this.unreadMessagesLeft = unreadCount
		this.loadFirstPage()
	}

	processPageData(pageData) {
		pageData.collection.forEach(msg => {
			if(!msg.isRead) {
				this.unreadMessageIds.push(msg.id)
				this.unreadMessagesLeft--
			}
		})
	}

	async markAllAsRead() {
		if(this.state !== "EXECUTE") { return }
		this.state = "MARK"

		if(!this.unreadMessageIds.length) {
			return this.finish()
		}

		const postParams = {
			method: "POST",
			credentials: "include",
			cache: "no-store",
			headers: { "Content-Type": "application/json" },
			xsrf: true,
			body: JSON.stringify({
				messageIds: this.unreadMessageIds
			})
		}

		$.fetch(this.markAsReadUrl, postParams).then(() => this.finish())
	}

	async loadPage(pageNum) {
		const pageData = await $.fetch(this.getMessagesUrl + pageNum, this.reqParams).then(resp => resp.json())
		return pageData
	}

	async loadNextPage() {
		if(!this.pagesToCheck.length) { return }

		const pageN = this.pagesToCheck.pop()
		const pageData = await this.loadPage(pageN)

		if(this.state !== "EXECUTE") {
			return
		}

		this.processPageData(pageData)

		if(!this.hasUnreadMessagesLeft()) {
			return this.markAllAsRead()
		}

		setTimeout(() => this.loadNextPage(), 500)
	}

	async loadFirstPage() {
		const pageData = await this.loadPage(0)
		this.processPageData(pageData)

		const maxPage = pageData.totalPages

		if(!this.hasUnreadMessagesLeft() || maxPage === 1) {
			return this.finish()
		}

		for(let i = maxPage; i-- > 1;) {
			this.pagesToCheck.push(i)
		}

		// Shuffle
		// for(let i = 0; i < this.pagesToCheck.length; i++) {
		// 	const j = Math.floor(Math.random() * (this.pagesToCheck.length + 1))
		// 	const v = this.pagesToCheck[i]

		// 	this.pagesToCheck[i] = this.pagesToCheck[j]
		// 	this.pagesToCheck[j] = v
		// }

		for(let i = 0; i < this.threadCount; i++) {
			this.loadNextPage()
		}
	}
}

pageInit.messages = function() {
	document.$watch(">body", body => body.classList.add("btr-messages")).$then()
		.$watch(".roblox-messages-container").$then()
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

		if(curPage) {
			curPage.classList.add("btr-currentPage")
			
			const bindAttr = curPage.getAttribute("ng-bind")
			curPage.removeAttribute("ng-bind")
			curPage.textContent = ""

			const pageInput = html`<input type=number ng-keydown="btr_setPage($event)">`
			pageInput.setAttribute("ng-value", bindAttr)
			curPage.append(pageInput)
		} else {
			if(IS_DEV_MODE) {
				alert("Missing CurrentPage")
			}
		}

		const markAsUnread = template.$find(".roblox-markAsUnreadInbox")
		if(markAsUnread) {
			markAsUnread.after(
				" ",
				html`<button class="btn-control-sm btr-markAllAsReadInbox">Mark All As Read</button>`
			)
		} else {
			if(IS_DEV_MODE) {
				alert("Missing markAsUnread")
			}
		}
	})
	
	let markAllAsRead

	document.$on("click", ".btr-markAllAsReadInbox", () => {
		if(markAllAsRead && !markAllAsRead.isFinished()) {
			return
		}

		markAllAsRead = new MarkAllAsReadAction()
		markAllAsRead.execute()
	})
}
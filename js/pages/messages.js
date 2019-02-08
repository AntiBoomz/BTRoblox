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

		template.$find(".roblox-markAsUnreadInbox").append(
			html`<button class="btn-control-sm btr-markAllAsReadInbox">Mark All As Read</button>`
		)
	})

	
	function getMessages(page, callback) {
		$.get(`/messages/api/get-messages?messageTab=0&pageNumber=${page}&pageSize=20`, callback)
	}

	function getMessageCount(callback) {
		$.get("/messages/api/get-my-unread-messages-count", callback)
	}

	function markMessagesAsRead(list, callback) {
		$.post("/messages/api/mark-messages-read", { messageIds: list }, callback)
	}

	let isWorking = false
	async function markAllAsRead() {
		if(isWorking) { return }
		isWorking = true

		const progress = html`<progress value=0 max=0 style=width:100%>`
		document.$find(".roblox-messages-btns").after(progress)

		const unreadUrl = "/messages/api/get-my-unread-messages-count"
		const unread = await fetch(unreadUrl, { credentials: "include", cache: "no-store" }).then(resp => resp.json())

		const messages = []
		let messagesLeft = unread.count
		let markingAsRead = false
		let maxPage = 1
		let page = 0

		progress.max = messagesLeft

		const finish = () => {
			console.log("Done")
			window.location.reload(true)
		}

		const headers = { "Content-Type": "application/json" }
		const markAsRead = () => {
			clearTimeout(markingAsRead)
			const list = messages.splice(0, messages.length)
			markingAsRead = false

			const url = `/messages/api/mark-messages-read`
			const body = JSON.stringify({ messageIds: list })

			return fetch(url, { credentials: "include", method: "POST", body, headers }).then(resp => {
				if(resp.status === 403 && resp.headers.has("X-CSRF-TOKEN")) {
					headers["X-CSRF-TOKEN"] = resp.headers.get("X-CSRF-TOKEN")
					messages.push(...list)
					markAsRead()
					return
				}

				if(messagesLeft <= 0 && !messages.length) {
					finish()
				}
			})
		}

		const nextPage = async () => {
			const curPage = page++
			if(curPage >= maxPage || messagesLeft <= 0) { return }

			const pageUrl = `/messages/api/get-messages?messageTab=0&pageSize=20&pageNumber=${curPage}`
			return fetch(pageUrl, { credentials: "include", cache: "no-store" }).then(async resp => {
				const json = await resp.json()
				maxPage = json.TotalPages

				json.Collection.forEach(msg => {
					if(!msg.IsRead) {
						messages.push(msg.Id)
						progress.value++
						messagesLeft--
					}
				})

				if(messages.length > 0) {
					if(messagesLeft <= 0) {
						markAsRead()
					} else if(markingAsRead === false) {
						markingAsRead = setTimeout(() => {
							markingAsRead = false
							markAsRead()
						}, 2000)
					}
				}

				nextPage()
			})
		}

		if(messagesLeft > 0) {
			await nextPage()
			for(let i = 0; i < 4; i++) { nextPage() }
		} else {
			finish()
		}
	}

	document.$on("click", ".btr-markAllAsReadInbox", markAllAsRead)
}
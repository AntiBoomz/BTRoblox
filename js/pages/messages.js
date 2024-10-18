"use strict"

class MarkAllAsReadAction {
	constructor() {
		this.getUnreadCountUrl = `https://privatemessages.roblox.com/v1/messages/unread/count`
		this.getMessagesUrl = `https://privatemessages.roblox.com/v1/messages?pageSize=20&messageTab=Inbox&pageNumber=`
		this.markAsReadUrl = `https://privatemessages.roblox.com/v1/messages/mark-read`

		this.reqParams = { credentials: "include", cache: "no-store" }
		
		this.messagesPerReadRequest = 20 // more than this errors
		this.threadCount = 5
		
		this.unreadMessagesTotal = 0
		this.unreadMessagesLeft = 0
		this.unreadMessageIds = []
		this.pagesToCheck = []
		this.totalPages = 0
		this.running = false
	}
	
	setButtonText(text) {
		const elem = $(".btr-markAllAsReadInbox")
		
		if(elem) {
			elem.textContent = text
		}
	}

	async markAsRead(messageIds) {
		if(!messageIds.length) { return }
		
		const postParams = {
			method: "POST",
			credentials: "include",
			cache: "no-store",
			headers: { "Content-Type": "application/json" },
			xsrf: true,
			body: JSON.stringify({ messageIds })
		}
		
		const tryFetch = () => $.fetch(this.markAsReadUrl, postParams).catch(tryFetch)
		return tryFetch()
	}

	async loadPage(pageNum) {
		const tryFetch = () => $.fetch(this.getMessagesUrl + pageNum, this.reqParams).catch(tryFetch)
		
		return tryFetch().then(async resp => {
			const json = await resp.json()
			
			for(const msg of json.collection) {
				if(!msg.isRead) {
					this.unreadMessageIds.push(msg.id)
					this.unreadMessagesLeft--
				}
			}
			
			this.setButtonText(`${this.totalPages - this.pagesToCheck.length}/${this.totalPages} (${this.unreadMessagesTotal - this.unreadMessagesLeft}/${this.unreadMessagesTotal})`)
			
			return json
		})
	}

	async initThread() {
		while(this.unreadMessagesLeft > 0 && this.pagesToCheck.length) {
			const pageN = this.pagesToCheck.shift()
			await this.loadPage(pageN)
			
			if(this.unreadMessageIds.length >= this.messagesPerReadRequest) {
				await this.markAsRead(this.unreadMessageIds.splice(0, this.messagesPerReadRequest))
			}
			
			await new Promise(resolve => setTimeout(resolve, 500))
		}
	}
	
	async execute() {
		if(this.running) { return }
		this.running = true
		
		this.setButtonText("Processing...")
		
		const tryFetch = () => $.fetch(this.getUnreadCountUrl, this.reqParams).catch(tryFetch)
		
		this.unreadMessagesTotal = await tryFetch().then(async resp => (await resp.json()).count)
		this.unreadMessagesLeft = this.unreadMessagesTotal
		
		const threads = []
		
		if(this.unreadMessagesLeft > 0) {
			const pageData = await this.loadPage(0)
			this.totalPages = pageData.totalPages
			
			if(this.unreadMessagesLeft > 0) {
				for(let i = 1; i <= this.totalPages; i++) {
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
					threads.push(this.initThread())
				}
			}
		}
		
		await Promise.all(threads)
		
		while(this.unreadMessageIds.length) {
			await this.markAsRead(this.unreadMessageIds.splice(0, this.messagesPerReadRequest))
		}
		
		this.running = false
		this.setButtonText("Mark All As Read")
	}
}

pageInit.messages = function() {
	if(!SETTINGS.get("messages.enabled")) { return }
	
	document.$watch(">body", body => body.classList.add("btr-messages"))

	angularHook.modifyTemplate("messages-nav", template => {
		const curPage = template.$find(".CurrentPage")

		if(curPage) {
			curPage.classList.add("btr-currentPage")
			
			const bindAttr = curPage.getAttribute("ng-bind")
			curPage.removeAttribute("ng-bind")
			curPage.textContent = ""

			const pageInput = html`<input type=text ng-keydown="$event.which===13&&$event.target.blur()" ng-blur="btr_setPage($event)">`
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
		if(markAllAsRead?.running) {
			return
		}

		markAllAsRead = new MarkAllAsReadAction()
		markAllAsRead.execute().then(() => {
			markAllAsRead = null
			
			InjectJS.inject(() => {
				const scope = angular.element(document.querySelector(`div[ng-controller="messagesController"]`))?.scope()
				
				if(scope) {
					scope.getMessages(scope.currentStatus.activeTab, scope.currentStatus.currentPage)
					scope.$digest()
				}
			})
		})
	})
	
	InjectJS.inject(() => {
		const { angularHook, hijackFunction, IS_DEV_MODE } = window.BTRoblox
		
		angularHook.hijackModule("messages", {
			messagesNav(handler, args, argMap) {
				const result = handler.apply(this, args)

				try {
					const { $location } = argMap
					
					hijackFunction(result, "link", (target, thisArg, args) => {
						try {
							const [$state] = args
							
							$state.btr_setPage = $event => {
								const value = +$event.target.value

								if(!Number.isNaN(value)) {
									$location.search({ page: value })
									$event.target.value = value
								} else {
									$event.target.value = $state.currentStatus.currentPage
								}
							}
						} catch(ex) {
							console.error(ex)
							if(IS_DEV_MODE) { alert("hijackAngular Error") }
						}

						return target.apply(thisArg, args)
					})
				} catch(ex) {
					console.error(ex)
					if(IS_DEV_MODE) { alert("hijackAngular Error") }
				}

				return result
			}
		})
	})
}
"use strict"

pageInit.groups_old = function() {
	if(settings.general.robuxToUSD) {
		document.$watch("#ctl00_cphRoblox_rbxGroupFundsPane_GroupFunds").$then().$watch(".robux", label => {
			label.style.display = "inline-block" // To fix whitespace
			const usd = RobuxToUSD(label.textContent.replace(/,/g, ""))
			label.after(html`<span style=color:#060;font-size:12px;font-weight:bold;>&nbsp;($${usd})</span>`)
		})
	}

	if(!settings.groups.enabled) { return }
	const notInGroup = window.location.pathname.search(/^\/groups\/group.aspx/i) !== -1
	const rankNameCache = {}

	document.$watch("body", body => body.classList.add("btr-groups")).$then()
		.$watch(["#GroupDescP pre", "#GroupDesc_Full"], (desc, fullDesc) => {
			desc.textContent = fullDesc.value
			fullDesc.remove()
		})
		.$watch("#ctl00_cphRoblox_GroupStatusPane_StatusDate", span => {
			const fixedDate = RobloxTime(span.textContent)
			if(fixedDate) {
				span.setAttribute("btr-timestamp", "")
				span.textContent = `${$.dateSince(fixedDate, startDate)} ago`
				span.title = fixedDate.$format("M/D/YYYY h:mm:ss A (T)")
			}
		})
		.$watch("#ctl00_cphRoblox_GroupWallPane_GroupWallUpdatePanel", wall => {
			const script = Array.from($.all("script")).find(x => x.innerHTML.indexOf("Roblox.ExileModal.InitializeGlobalVars") !== -1)
			const groupId = script ? parseInt(script.innerHTML.replace(/^.*InitializeGlobalVars\(\d+, (\d+).*$/m, "$1"), 10) : NaN

			wall.$watchAll("div", async post => {
				if(!post.matches(".AlternatingItemTemplateOdd, .AlternatingItemTemplateEven")) { return }
				post.classList.add("btr-comment")

				const content = await post.$watch(".RepeaterText").$promise()
				const postDate = await post.$watch(".GroupWall_PostDate").$promise()
				const postBtns = await post.$watch(".GroupWall_PostBtns").$promise()
				const userLink = await post.$watch(".UserLink").$promise()
				const dateSpan = postDate.firstElementChild

				const defBtns = Array.from(postBtns.children)
				const deleteButton = defBtns.find(x => x.textContent.indexOf("Delete") !== -1)
				const exileButton = defBtns.find(x => x.textContent.indexOf("Exile User") !== -1)

				content.prepend(userLink)
				content.append(postBtns)

				const firstBtn = postBtns.firstChild
				while(postDate.firstElementChild) { firstBtn.before(postDate.firstElementChild) }

				postDate.parentNode.remove()

				if(deleteButton) {
					deleteButton.textContent = "Delete"
					deleteButton.classList.add("btn-control", "btn-control-medium")
					deleteButton.style = ""

					deleteButton.setAttribute("onclick", `
					const self = this;
					return Roblox.GenericConfirmation.open({
						titleText: "Delete This Comment?",
						bodyContent: "Are you sure you wish to delete this comment?",
						acceptText: "Delete",
						declineText: "Cancel",
						escClose: true,
						acceptColor: Roblox.GenericConfirmation.green,
						imageUrl: "/images/Icons/img-alert.png",
						onAccept() { self.removeAttribute("onclick"); self.click(); }
					}), false`)
				} else if(!notInGroup) {
					const btn = html`<a class="btn-control btn-control-medium disabled">Delete</a>`
					if(exileButton) { exileButton.before(btn) }
					else { postBtns.append(btn) }
				}

				if(exileButton) {
					exileButton.textContent = "Exile User"
					exileButton.classList.add("btn-control", "btn-control-medium")
					exileButton.style = ""
				} else if(!notInGroup) {
					const btn = html`<a class="btn-control btn-control-medium disabled">Exile User</a>`
					postBtns.append(btn)
				}

				dateSpan.classList.add("btr-groupwallpostdate")
				const fixedDate = RobloxTime(dateSpan.textContent)
				if(fixedDate) {
					dateSpan.setAttribute("btr-timestamp", "")
					dateSpan.textContent = `${$.dateSince(fixedDate)} ago`
					dateSpan.title = fixedDate.$format("M/D/YYYY h:mm:ss A (T)")
				}

				const anchor = userLink.$find("a")
				const userId = anchor ? parseInt(anchor.href.replace(/^.*\/users\/(\d+)\/.*$/, "$1"), 10) : NaN
				
				if(Number.isSafeInteger(groupId) && Number.isSafeInteger(userId)) {
					const span = html`<span class="btr-grouprank"></span>`
					userLink.append(span)
					
					let promise = rankNameCache[userId]
					if(!promise) {
						const url = `https://www.roblox.com/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRole&playerid=${userId}&groupid=${groupId}`
						promise = rankNameCache[userId] = $.fetch(url).then(resp => resp.text())
					}
					
					promise.then(rankname => {
						userLink.append(html`<span class="btr-grouprank">(${rankname})</span>`)
					})
				}
			})
		})
	
	if(settings.groups.expandGroupList) {
		document.$watch("body").$then()
			.$watchAll("script", (x, stop) => {
				if(!x.textContent.includes(`'windowDisplay': 8,`)) { return }
				x.textContent = x.textContent.replace(/'windowDisplay': 8/, "'windowDisplay': 16")

				stop()

				setTimeout(() => {
					const outer = $(".CarouselPager .content-outer")
					const inner = outer.$find(".content-inner")
					outer.style.maxHeight = outer.style.height
					outer.style.height = "auto"
					inner.style.position = "relative"
				}, 0)
			})
	}

	// TODO: Group audit timestamps (separate)
}

pageInit.groupadmin = function() {
	if(settings.general.robuxToUSD) {
		document.$watch("#GroupTitle").$then().$watch(".robux", label => {
			const usd = RobuxToUSD(label.textContent.replace(/,/g, ""))
			label.after(html`<span style=color:#060;font-size:12px;font-weight:bold;>&nbsp;($${usd})</span>`)
		})
		
		document.$watch("#revenue").$then()
			.$watch(".summary .summary-container").$then(x =>
				x.$watchAll(".columns-container", cont => {
					cont.$findAll(".robux").forEach(label => {
						const usd = RobuxToUSD(label.textContent.replace(/,/g, "").replace(/^\s*\((.*)\)\s*$/, "$1"))
						label.after(html`<span style=color:#060;font-size:12px;font-weight:bold;>&nbsp;($${usd})</span>`)
					})

					cont.$findAll("td.credit").forEach(label => {
						if(!label.textContent) { return }
						const usd = RobuxToUSD(label.textContent.replace(/,/g, "").replace(/^\s*\((.*)\)\s*$/, "$1"))
						label.append(html`<span style=color:#060;font-size:12px;font-weight:bold;>&nbsp;($${usd})</span>`)
					})
				})
			)
			.$watch(".line-item tbody").$then(x =>
				x.$watchAll("tr", row => {
					const label = row.$find(".robux")
					if(!label) { return }
					const usd = RobuxToUSD(label.textContent.replace(/,/g, "").replace(/^\s*\((.*)\)\s*$/, "$1"))
					label.after(html`<span style=color:#060;font-size:12px;font-weight:bold;>&nbsp;($${usd})</span>`)
				})
			)
	}

	document.$watch("#JoinRequests").$then()
		.$watchAll("#JoinRequestsList", list => {
			list.$findAll("tbody > tr > td:nth-child(3)").forEach(label => {
				const fixedDate = RobloxTime(label.textContent)
				if(!fixedDate) { return }
				label.setAttribute("btr-timestamp", "")
				label.textContent = `${$.dateSince(fixedDate, new Date())} ago`
				label.title = fixedDate.$format("M/D/YYYY h:mm:ss A (T)")
			})
		})
}
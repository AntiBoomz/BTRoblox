"use strict"

{
	function enableRedesign() {
		const groupWatcher = document.$watch("body", body => {
			body.classList.toggle("btr-redesign", settings.groups.modifyLayout)
			body.classList.toggle("btr-hidePayout", settings.groups.hidePayout)
			body.classList.toggle("btr-hideBigSocial", settings.groups.hideBigSocial)
		}).$then().$watch("#group-container").$then()

		if(settings.groups.modifySmallSocialLinksTitle) {
			groupWatcher.$watch(".social-links .section-content", links => {
				links.$watchAll("social-link-card", card => {
					card.$watch("a", a => {
						try {
							const small = $(`social-link-icon-list a[href="${a.href}"]`)
							if(!small) {
								console.log("no small")
							}
							small.title = a.title
						} catch(ex) {}
					})
				})
			})
		}

		if(settings.groups.modifyLayout) {
			groupWatcher
				.$watch(".group-header", head => {
					head.parentNode.parentNode.classList.add("btr-group-container")
				})
				.$watch(".group-description", desc => {
					const parent = desc.parentNode.parentNode

					$(".group-header").after(
						parent.$find("social-link-icon-list"),
						...desc.parentNode.childNodes
					)

					parent.remove()
				})
				.$watch(".shout-container", shout => {
					shout.parentNode.classList.add("col-xs-12", "btr-shout-container")
					$(".group-header").parentNode.after(shout.parentNode)
				})
		}

		if(settings.groups.selectedRoleCount) {
			modifyTemplate("group-members-list", template => {
				const label = template.$find(".group-dropdown > button")
				label.append(html`<span style="float:right;font-size:16px;line-height:26px;font-weight:300;" ng-if="data.currentRoleMemberCount>0">({{data.currentRoleMemberCount}})</span>`)
			})
		}

		if(settings.groups.pagedGroupWall) {
			modifyTemplate("group-wall", template => {
				template.firstElementChild.setAttribute("infinite-scroll-disabled", "true")

				template.$find(".group-wall").parentNode.append(html`
				<div class="btr-pager-holder btr-comment-pager">
					<ul class=pager>
						<li class="first disabled"><a ng-click=btrPagerStatus.prev&&loadWallPosts("first")><span class=icon-first-page></span></a></li>
						<li class="pager-prev disabled"><a ng-click=btrPagerStatus.prev&&loadWallPosts("prev")><span class=icon-left></span></a></li>
						<li class=pager-mid>
							Page <form ng-submit=btrPagerStatus.input&&loadWallPosts("input") style=display:contents><input class=pager-cur type=text value=-1></form>
						</li>
						<li class="pager-next disabled"><a ng-click=btrPagerStatus.next&&loadWallPosts("next")><span class=icon-right></span></a></li>
						<li class="last disabled"><a ng-click=btrPagerStatus.next&&loadWallPosts("last")><span class=icon-last-page></span></a></li>
					</ul>
				</div>`)
			})
		}

		if(settings.groups.groupWallRanks) {
			modifyTemplate("group-comments", template => {
				template.$find(".wall-comment-name").append(html`<span class="btr-grouprank">({{post.poster.role.name}})</span>`)
			})
		}
	}

	pageInit.groups = function() {
		if(!settings.groups.enabled) { return }

		if(settings.groups.redesign) {
			enableRedesign()
		}
			
		if(settings.general.hoverPreview) {
			HoverPreview.register(".item-card", ".item-card-thumb-container")
		}
	}
}
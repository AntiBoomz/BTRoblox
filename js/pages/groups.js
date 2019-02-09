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
			modifyTemplate("group-base", template => {
				const list = template.$find("#horizontal-tabs")
				
				const about = list.$find("#about")
				about.setAttribute("ng-click", "Data.btrGamesTabSelected=false")
				about.setAttribute("ng-class", about.getAttribute("ng-class").replace(/Data.activeTab == /, "!Data.btrGamesTabSelected && Data.activeTab == "))
				about.after(html`<li class=rbx-tab ng-class="{'active': Data.activeTab == 'about' && Data.btrGamesTabSelected }" ng-if="library.currentGroup.areGroupGamesVisible" ng-style="{ 'width': getTabWidth() }" ng-click="Data.btrGamesTabSelected=true" ui-sref=about><a class=rbx-tab-heading><span class=text-lead>Games</span></a>`)
			})

			modifyTemplate("group-about", template => {
				template.$find("div[group-members-list]").setAttribute("ng-class", "{'ng-hide': Data.btrGamesTabSelected}")
				template.$find("div[group-games]").setAttribute("ng-class", "{'ng-hide': !Data.btrGamesTabSelected}")
			})

			groupWatcher
				.$watch(".group-header", head => {
					head.parentNode.parentNode.classList.add("btr-group-container")
					head.parentNode.classList.add("btr-group-about")
				})
				.$watch(".group-description", desc => {
					const parent = desc.parentNode.parentNode

					$(".group-header").after(
						parent.$find("social-link-icon-list"),
						html`<div class="text-label btr-description-label">Description</div>`,
						...desc.parentNode.childNodes
					)

					parent.remove()
				})
				.$watch(".shout-container", shout => {
					shout.parentNode.classList.add("col-xs-12", "btr-shout-container")
					$(".group-header").parentNode.after(shout.parentNode)
				})
				.$watch("social-links-container", social => {
					social.classList.add("col-xs-12")
					$(".group-header").parentNode.after(social)
				})
		}

		if(settings.groups.selectedRoleCount) {
			modifyTemplate("group-members-list", template => {
				const label = template.$find(".group-dropdown > button")
				label.append(html`<span style="float:right;font-size:16px;line-height:26px;font-weight:300;padding-right:2px;" ng-if="data.currentRoleMemberCount>0">({{data.currentRoleMemberCount}})</span>`)
			})
		}

		if(settings.groups.pagedGroupWall) {
			modifyTemplate("group-wall", template => {
				template.firstElementChild.setAttribute("infinite-scroll-disabled", "true")

				template.$find(".group-wall").parentNode.append(html`
				<div class="btr-pager-holder btr-comment-pager">
					<ul class=pager>
						<li class=first ng-class="{disabled:!btrPagerStatus.prev}"><a ng-click=btrPagerStatus.prev&&btrLoadWallPosts("first")><span class=icon-first-page></span></a></li>
						<li class=pager-prev ng-class="{disabled:!btrPagerStatus.prev}"><a ng-click=btrPagerStatus.prev&&btrLoadWallPosts("prev")><span class=icon-left></span></a></li>
						<li class=pager-mid>
							Page <form ng-submit=btrPagerStatus.input&&btrLoadWallPosts("input") style=display:contents><input class=pager-cur ng-disabled="!btrPagerStatus.input" ng-value="btrPagerStatus.pageNum" type=text value=-1></form>
						</li>
						<li class=pager-next ng-class="{disabled:!btrPagerStatus.next}"><a ng-click=btrPagerStatus.next&&btrLoadWallPosts("next")><span class=icon-right></span></a></li>
						<li class=last ng-class="{disabled:!btrPagerStatus.next}"><a ng-click=btrPagerStatus.next&&btrLoadWallPosts("last")><span class=icon-last-page></span></a></li>
					</ul>
				</div>`)
			})
		}

		if(settings.groups.groupWallRanks) {
			modifyTemplate("group-comments", template => {
				template.$find(".wall-comment-name").append(html`<span class="btr-grouprank text-label">({{post.poster.role.name}})</span>`)
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
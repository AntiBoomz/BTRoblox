"use strict"

{
	function enableRedesign() {
		document.$watch("body", body => {
			body.classList.toggle("btr-redesign", settings.groups.modifyLayout)
			body.classList.toggle("btr-hidePayout", settings.groups.hidePayout)
			body.classList.toggle("btr-hideBigSocial", settings.groups.hideBigSocial)
		})

		if(settings.groups.modifySmallSocialLinksTitle) {
			modifyTemplate(["social-link-icon-list", "social-link-icon"], (listTemplate, iconTemplate) => {
				iconTemplate.$find("a").title = `{{ $ctrl.title || $ctrl.type }}`
				listTemplate.$find("social-link-icon").title = "socialLink.title"
			})
		}

		if(settings.groups.modifyLayout) {
			modifyTemplate(["group-base", "group-games", "group-about"], (baseTemplate, gamesTemplate, aboutTemplate) => {
				const list = baseTemplate.$find("#horizontal-tabs")

				list.setAttribute("ng-class", `{'btr-four-wide': library.currentGroup.areGroupGamesVisible}`)
				
				const about = list.$find("#about")
				about.setAttribute("ng-click", "Data.btrGamesTabSelected=false")
				about.setAttribute("ng-class", about.getAttribute("ng-class").replace(/Data.activeTab === /, "!Data.btrGamesTabSelected && Data.activeTab === "))
				about.after(html`<li class="rbx-tab group-tab" ng-class="{'active': Data.btrGamesTabSelected && Data.activeTab === groupConstants.currentTab[1] }" ng-if="library.currentGroup.areGroupGamesVisible" ng-click="Data.btrGamesTabSelected=true" ui-sref=about><a class=rbx-tab-heading><span class=text-lead>Games</span></a>`)
			
				gamesTemplate.$find(">*").setAttribute("ng-class", "{'ng-hide': library.currentGroup.areGroupGamesVisible && !Data.btrGamesTabSelected}")
				aboutTemplate.$find("group-members-list").setAttribute("ng-class", "{'ng-hide': library.currentGroup.areGroupGamesVisible && Data.btrGamesTabSelected}")
				
				const groupHeader = baseTemplate.$find(".group-header")
				const groupAbout = groupHeader.parentNode
				groupAbout.parentNode.classList.add("btr-group-container")
				groupAbout.classList.add("btr-group-about")

				const socialLinks = aboutTemplate.$find("social-links-container")
				socialLinks.classList.add("col-xs-12")
				groupAbout.after(socialLinks)
				
				const shout = aboutTemplate.$find(".shout-container").parentNode
				shout.classList.add("col-xs-12", "btr-shout-container")
				groupAbout.after(shout)

				const descContent = aboutTemplate.$find(".group-description").parentNode
				const origDesc = descContent.parentNode

				groupHeader.after(
					origDesc.$find("social-link-icon-list"), // Small social links
					html`<div class="text-label btr-description-label">Description</div>`,
					...descContent.childNodes
				)

				origDesc.remove()
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
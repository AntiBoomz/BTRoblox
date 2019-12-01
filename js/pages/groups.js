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

				const games = html`<li class="rbx-tab group-tab" ng-if="library.currentGroup.areGroupGamesVisible" ng-click="Data.btrGamesTabSelected=true" ui-sref=about><a class=rbx-tab-heading><span class=text-lead>Games</span></a>`
				games.setAttribute("ng-class", about.getAttribute("ng-class").replace(/!(?=Data.btrGamesTabSelected)/, ""))
				about.after(games)

				gamesTemplate.$find(">*").setAttribute("ng-class", "{'ng-hide': library.currentGroup.areGroupGamesVisible && !Data.btrGamesTabSelected}")
				aboutTemplate.$find("group-members-list").setAttribute("ng-class", "{'ng-hide': library.currentGroup.areGroupGamesVisible && Data.btrGamesTabSelected}")
				
				const groupHeader = baseTemplate.$find(".group-header")
				const groupAbout = groupHeader.parentNode
				groupAbout.parentNode.classList.add("btr-group-container")
				groupAbout.classList.add("btr-group-about")

				const socialLinks = aboutTemplate.$find("social-links-container")
				groupAbout.after(socialLinks)
				
				const shout = aboutTemplate.$find(".shout-container").parentNode
				shout.classList.add("btr-shout-container")
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

			modifyTemplate("group-members-list", template => {
				template.$find(".dropdown-menu li a").title = `{{ role.name }}`
				template.$find(".dropdown-menu li a .role-member-count").title = `{{ role.memberCount | number }}`
			})
		}

		if(settings.groups.selectedRoleCount) {
			modifyTemplate("group-members-list", template => {
				const label = template.$find(".group-dropdown > button .rbx-selection-label")
				label.after(html`<span class=btr-role-member-count title="{{ $ctrl.data.currentRoleMemberCount | number }}" ng-if="$ctrl.data.currentRoleMemberCount>0">({{ $ctrl.data.currentRoleMemberCount | abbreviate }})</span>`)
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
				template.$find(".list-body > .text-name").after(html`<span class="btr-grouprank text-label">({{post.poster.role.name}})</span>`)
			})
		}
	}

	pageInit.groups = function() {
		if(settings.general.hoverPreview) {
			OptionalLoader.loadPreviewer().then(() => {
				HoverPreview.register(".item-card", ".item-card-thumb-container")
			})
		}

		if(settings.groups.redesign) {
			enableRedesign()
		}
	}
}
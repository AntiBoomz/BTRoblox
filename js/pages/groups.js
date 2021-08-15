"use strict"

function enableRedesign() {
	document.$watch("body", body => {
		body.classList.toggle("btr-redesign", SETTINGS.get("groups.modifyLayout"))
		body.classList.toggle("btr-hidePayout", SETTINGS.get("groups.hidePayout"))
		body.classList.toggle("btr-hideBigSocial", SETTINGS.get("groups.hideBigSocial"))
	})

	if(SETTINGS.get("groups.modifySmallSocialLinksTitle")) {
		modifyTemplate(["social-link-icon-list", "social-link-icon"], (listTemplate, iconTemplate) => {
			iconTemplate.$find("a").title = `{{ $ctrl.title || $ctrl.type }}`
			listTemplate.$find("social-link-icon").title = "socialLink.title"
		})
	}

	if(SETTINGS.get("groups.modifyLayout")) {
		document.$watch(["#about", "#btr-games"], (about, games) => {
			about.after(games)
		})
		
		modifyTemplate(["group-base", "group-games", "group-about", "group-tab"], (baseTemplate, gamesTemplate, aboutTemplate, tabTemplate) => {
			const groupHeader = baseTemplate.$find(".group-header")
			const groupAbout = groupHeader.parentNode
			groupAbout.parentNode.classList.add("btr-group-container")
			groupAbout.classList.add("btr-group-about")

			const desc = aboutTemplate.$find("group-description")
			groupHeader.after(desc)
			
			const socialLinks = aboutTemplate.$find("social-links-container")
			groupAbout.after(socialLinks)
			
			const shout = aboutTemplate.$find(".group-shout")
			shout.classList.add("btr-shout-container")
			groupAbout.after(shout)
			
			// Show group wall on all tabs
			
			groupAbout.parentNode.append(aboutTemplate.$find("[group-wall]"))
			
			// Separate experiences into it's own tab
			
			const list = baseTemplate.$find("#horizontal-tabs")
			list.setAttribute("ng-class", `{'btr-four-wide': library.currentGroup.areGroupGamesVisible}`)
			
			const games = html`<li id="btr-games" ng-class="{'active': layout.activeTab.state === 'about' && layout.activeTab.btrShowGames}" class="rbx-tab group-tab" ng-show="library.currentGroup.areGroupGamesVisible" ng-click="groupDetailsConstants.tabs.about.btrShowGames=true" ui-sref="about"><a class=rbx-tab-heading><span class=text-lead ng-bind="'Heading.Games' | translate"></span></a>`
			list.append(games)
			
			const tab = tabTemplate.$find(".rbx-tab")
			tab.setAttribute("ng-class", tab.getAttribute("ng-class").replace(/activeTab === tab/, "activeTab === tab && !tab.btrShowGames"))
			tab.setAttribute("ng-click", "tab.btrShowGames=false")
			
			const binding = tab.$find(".text-lead")
			if(binding?.getAttribute("ng-bind")) {
				binding.setAttribute("ng-bind", binding.getAttribute("ng-bind").replace(/^\s*(.*)?(\s*\|\s*translate\s*)$/i, "($1 === 'Heading.About' ? 'Heading.Members' : $1)$2"))
			}
			
			aboutTemplate.$find("[group-games]")?.setAttribute("ng-show", "groupDetailsConstants.tabs.about.btrShowGames")
			aboutTemplate.$find("group-members-list")?.setAttribute("ng-show", "!groupDetailsConstants.tabs.about.btrShowGames")
		})

		modifyTemplate("group-members-list", template => {
			template.$find(".dropdown-menu li a").title = `{{ role.name }}`
			template.$find(".dropdown-menu li a .role-member-count").title = `{{ role.memberCount | number }}`
		})
	}

	if(SETTINGS.get("groups.selectedRoleCount")) {
		modifyTemplate("group-members-list", template => {
			const label = template.$find(".group-dropdown > button .rbx-selection-label")
			label.after(html`<span class=btr-role-member-count title="{{ $ctrl.data.currentRoleMemberCount | number }}" ng-if="$ctrl.data.currentRoleMemberCount>0">({{ $ctrl.data.currentRoleMemberCount | abbreviate }})</span>`)
		})
	}

	if(SETTINGS.get("general.enableContextMenus")) {
		modifyTemplate("group-members-list", template => {
			template.$find(".dropdown-menu li").dataset.btrRank = `{{ role.rank }}`
		})

		document.$watch("group-members-list .group-dropdown", dropdown => {
			dropdown
				.$watch(".input-dropdown-btn", btn => {
					const link = html`<a style="position: absolute; opacity: 0; left: 0; top: 0; width: 100%; height: 100%;" onclick="return false">`
					btn.append(link)

					link.$on("contextmenu", () => {
						const roleName = btn.$find(".rbx-selection-label").textContent.trim()
						const target = dropdown.$find(`.dropdown-menu li>a[title="${roleName}"]`)

						if(target) {
							const elem = target.parentNode

							const id = elem.id.replace(/^role-/, "")
							const url = `/btr_context/?btr_roleId=${id}&btr_roleRank=${elem.dataset.btrRank}`

							link.href = url
							setTimeout(() => link.removeAttribute("href"), 100)
						}
					})
				})
				.$watch(".dropdown-menu", menu =>
					menu.$watchAll("li", elem => {
						const id = elem.id.replace(/^role-/, "")
						const url = `/btr_context/?btr_roleId=${id}&btr_roleRank=${elem.dataset.btrRank}`

						const link = elem.$find("a")
	
						link.$on("click", ev => ev.preventDefault())
						link.$on("contextmenu", () => {
							link.href = url
							setTimeout(() => link.removeAttribute("href"), 100)
						})
					})
				)
		})
	}

	if(SETTINGS.get("groups.pagedGroupWall")) {
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
}

pageInit.groups = function() {
	if(SETTINGS.get("general.hoverPreview")) {
		loadOptionalLibrary("previewer").then(() => {
			HoverPreview.register(".item-card", ".item-card-thumb-container")
		})
	}

	if(SETTINGS.get("groups.redesign")) {
		enableRedesign()
	}
}
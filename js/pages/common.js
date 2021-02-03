"use strict"

let loggedInUser = -1
let loggedInUserPromise = null

const toggleSettingsModal = async force => {
	await loadOptionalLibrary("settingsModal")

	if(!document.body) { // Stuff breaks if body is not loaded
		await document.$watch(">body").$promise()
	}

	btrSettingsModal.toggle(force)
}

pageInit.common = () => {
	document.$on("click", ".btr-settings-toggle", toggleSettingsModal)

	try {
		const url = new URL(window.location.href)

		if(url.searchParams.get("btr_settings_open")) {
			sessionStorage.setItem("btr-settings-open", true)

			url.searchParams.delete("btr_settings_open")
			window.history.replaceState(null, null, url.toString())
		}
	} catch(ex) {}

	if(sessionStorage.getItem("btr-settings-open")) {
		try { toggleSettingsModal() }
		catch(ex) { console.error(ex) }
	}

	//

	const headWatcher = document.$watch(">head").$then()
	const bodyWatcher = document.$watch(">body", body => {
		body.classList.toggle("btr-no-hamburger", SETTINGS.get("navigation.noHamburger"))
		body.classList.toggle("btr-hide-ads", SETTINGS.get("general.hideAds"))
		body.classList.toggle("btr-small-chat-button", !SETTINGS.get("general.hideChat") && SETTINGS.get("general.smallChatButton"))

		if(currentPage) {
			body.dataset.btrPage = currentPage.name
		}
	}).$then()

	bodyWatcher.$watch("#roblox-linkify", linkify => {
		linkify.dataset.regex = /(https?:\/\/)?([a-z0-9-]+\.)*(twitter\.com|youtube\.com|youtu\.be|twitch\.tv|roblox\.com|robloxlabs\.com|shoproblox\.com)(?!\/[A-Za-z0-9-+&@#/=~_|!:,.;]*%)((\/[A-Za-z0-9-+&@#/%?=~_|!:,.;]*)|(?=\s|\b))/.source

		// Empty asHttpRegex matches everything, so every link will be unsecured, so fix that
		if(!linkify.dataset.asHttpRegex) { linkify.dataset.asHttpRegex = "^$" }
	})

	loggedInUserPromise = new SyncPromise(resolve => {
		headWatcher.$watch(`meta[name="user-data"]`, meta => {
			const userId = +meta.dataset.userid
			loggedInUser = Number.isSafeInteger(userId) ? userId : -1
			resolve(loggedInUser)
		})
		
		$.ready(() => resolve(-1))
	})

	loggedInUserPromise.then(userId => {
		if(userId !== -1) {
			btrNavigation.init()
		}
	})

	if(SETTINGS.get("general.fastSearch")) {
		try { btrFastSearch.init() }
		catch(ex) { console.error(ex) }
	}
	
	if(SETTINGS.get("general.hideAds")) {
		try { btrAdblock.init() }
		catch(ex) { console.error(ex) }
	}

	{
		const switchClasses = (from, to) => {
			const list = document.getElementsByClassName(from)
			for(let i = list.length; i--;) {
				const elem = list[i]
				elem.classList.remove(from, "btr-compat-light-theme", "btr-compat-dark-theme")
				elem.classList.add(to)
			}
		}

		const updateThemes = () => {
			if(SETTINGS.get("general.disableRobloxThemes")) {
				switchClasses("light-theme", "btr-compat-light-theme")
				switchClasses("dark-theme", "btr-compat-dark-theme")

				if(!observing) {
					observing = true
					observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"], subtree: true })
				}
			} else {
				switchClasses("btr-compat-light-theme", "light-theme")
				switchClasses("btr-compat-dark-theme", "dark-theme")

				if(observing) {
					observing = false
					observer.disconnect()
				}
			}
		}

		const observer = new MutationObserver(updateThemes)
		let observing = false

		updateThemes()
		SETTINGS.onChange("general.disableRobloxThemes", updateThemes)
	}

	if(SETTINGS.get("general.hideChat")) {
		bodyWatcher.$watch("#chat-container", cont => cont.remove())
	}
}
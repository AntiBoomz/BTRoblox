"use strict"

const btrAdblock = {
	init() {
		const iframeSelector = `.ads-container iframe,.abp iframe,.abp-spacer iframe,.abp-container iframe,.top-abp-container iframe,
		#AdvertisingLeaderboard iframe,#AdvertisementRight iframe,#MessagesAdSkyscraper iframe,.Ads_WideSkyscraper iframe,
		.profile-ads-container iframe, #ad iframe, iframe[src*="roblox.com/user-sponsorship/"]`

		const iframes = document.getElementsByTagName("iframe")
		const scripts = document.getElementsByTagName("script")
		
		const doneMap = new WeakMap()

		new MutationObserver(() => {
			for(let i = iframes.length; i--;) {
				const iframe = iframes[i]

				if(!doneMap.get(iframe)) {
					if(iframe.matches(iframeSelector)) {
						iframe.remove()
					} else {
						doneMap.set(iframe, true)
					}
				}
			}

			for(let i = scripts.length; i--;) {
				const script = scripts[i]

				if(doneMap.get(script)) {
					break
				}

				doneMap.set(script, true)

				if(script.src) {
					if(
						script.src.includes("imasdk.googleapis.com") ||
						script.src.includes("googletagmanager.com") ||
						script.src.includes("radar.cedexis.com") ||
						script.src.includes("ns1p.net")
					) {
						script.src = ""
						script.remove()
					}
				} else {
					const cont = script.textContent
					if(
						!cont.includes("ContentJS") && // is not inject.js
						(
							cont.includes("scorecardresearch.com") ||
							cont.includes("cedexis.com") ||
							cont.includes("pingdom.net") ||
							cont.includes("ns1p.net") ||
							cont.includes("Roblox.Hashcash") ||
							cont.includes("Roblox.VideoPreRollDFP") ||
							cont.includes("Roblox.AdsHelper=") ||
							cont.includes("googletag.enableServices()") ||
							cont.includes("gtag('config'")
						)
					) {
						script.textContent = ""
						script.remove()
					} else if(cont.includes("Roblox.EventStream.Init")) { // Stops e.png logging
						script.textContent = cont.replace(/"[^"]*"/g, `""`)
					}
				}
			}
		}).observe(document.documentElement, { childList: true, subtree: true })
	}
}
"use strict"

pageInit.money = function() {
	if(SETTINGS.get("general.robuxToUSD")) {
		document.$watch("#MyTransactions_tab").$then().$watch("table > tbody").$then()
			.$watchAll(".datarow", item => {
				item.$watch(".Amount span:last-child", label => {
					const amt = label.textContent.replace(/,/g, "").replace(/^\((.+)\)$/, "$1").trim()

					if(amt !== "0") {
						const usd = RobuxToUSD(amt)
						label.append(html`<span style=color:#060;font-size:12px;font-weight:bold;>&nbsp;($${usd})</span>`)
					}
				})
			})
		
		document.$watch("#Summary_tab").$then().$watch("table > tbody").$then()
			.$watchAll("tr", row => {
				if(!row.className) {
					row.$watch(".Credit", label => {
						const update = () => {
							if(label.$find("span")) { return }
							const text = label.textContent.replace(/,/g, "").replace(/^\((.+)\)$/, "$1").trim()
							if(!text) { return }
							const usd = RobuxToUSD(text)
							label.append(html`<span style=color:#060;font-size:12px;font-weight:bold;>&nbsp;($${usd})</span>`)
						}

						new MutationObserver(update).observe(label, { childList: true })
						update()
					})
				} else if(row.className === "total") {
					row.$watch(".robux", label => {
						const usdLabel = html`<span style=color:#060;font-size:12px;font-weight:bold;></span>`
						label.after(usdLabel)
	
						const update = () => {
							const usd = RobuxToUSD(label.textContent.replace(/,/g, "").replace(/^\((.+)\)$/, "$1").trim())
							usdLabel.textContent = ` ($${usd})`
						}
	
						new MutationObserver(update).observe(label, { childList: true })
						update()
					})
				}
			})
	}
}
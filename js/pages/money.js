"use strict"

pageInit.money = function() {
	if(SETTINGS.get("general.robuxToUSD")) {
		document.$watch("#MyTransactions_tab").$then().$watch("table > tbody").$then()
			.$watchAll(".datarow", item => {
				item.$watch(".Amount span:last-child", label => {
					const amt = label.textContent.replace(/,/g, "").replace(/^\((.+)\)$/, "$1").trim()

					if(amt !== "0") {
						const cash = RobuxToCash.convert(+amt)
						label.append(html`<span style=color:#060;font-size:12px;font-weight:bold;>&nbsp;(${cash})</span>`)
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

							const cash = RobuxToCash.convert(+text)
							label.append(html`<span style=color:#060;font-size:12px;font-weight:bold;>&nbsp;(${cash})</span>`)
						}

						new MutationObserver(update).observe(label, { childList: true })
						update()
					})
				} else if(row.className === "total") {
					row.$watch(".robux", label => {
						const usdLabel = html`<span style=color:#060;font-size:12px;font-weight:bold;></span>`
						label.after(usdLabel)
	
						const update = () => {
							const cash = RobuxToCash.convert(+label.textContent.replace(/,/g, "").replace(/^\((.+)\)$/, "$1").trim())
							usdLabel.textContent = ` (${cash})`
						}
	
						new MutationObserver(update).observe(label, { childList: true })
						update()
					})
				}
			})
	}
}
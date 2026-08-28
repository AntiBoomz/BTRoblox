"use strict"

const RobuxToCash = {
	Options: [
		{ name: "DevEx", symbol: "$", cash: "380.00", robux: "100000" },
		{ name: "USD", symbol: "$", cash: "4.99", robux: "500" },
		{ name: "EUR", symbol: "€", cash: "5.99", robux: "500" },
		{ name: "AUD", symbol: "$", cash: "8.49", robux: "500" },
		{ name: "GBP", symbol: "£", cash: "4.99", robux: "500" },
		{ name: "NZD", symbol: "$", cash: "9.99", robux: "500" },
		{ name: "CAD", symbol: "CA$", cash: "6.99", robux: "500" },
		{ name: "SEK", symbol: "kr", cash: "65.00", robux: "500" },
		{ name: "NOK", symbol: "kr", cash: "70.00", robux: "500" },
		{ name: "DKK", symbol: "kr.", cash: "45.00", robux: "500" },
		{ name: "PLN", symbol: "zł", cash: "29.99", robux: "500" },
		{ name: "CZK", symbol: "Kč", cash: "150.00", robux: "500" },
		{ name: "RON", symbol: "RON", cash: "29.99", robux: "500" },
		{ name: "HUF", symbol: "Ft", cash: "2490", robux: "500" },
		{ name: "CHF", symbol: "CHF", cash: "5.00", robux: "500" },
		{ name: "RUB", symbol: "₽", cash: "539.00", robux: "500" },
		{ name: "MXN", symbol: "$", cash: "129.00", robux: "500" },
		{ name: "CLP", symbol: "$", cash: "5500", robux: "500" },
		{ name: "BRL", symbol: "R$", cash: "29.90", robux: "500" },
		{ name: "COP", symbol: "$", cash: "29900", robux: "500" },
		{ name: "PEN", symbol: "S/", cash: "17.90", robux: "500" },
		{ name: "INR", symbol: "₹", cash: "500.00", robux: "500" },
		{ name: "THB", symbol: "฿", cash: "200.00", robux: "500" },
		{ name: "SGD", symbol: "$", cash: "6.98", robux: "500" },
		{ name: "JPY", symbol: "￥", cash: "800", robux: "500" },
		{ name: "KRW", symbol: "₩", cash: "7500", robux: "500" },
		{ name: "IDR", symbol: "Rp", cash: "90000", robux: "500" },
		{ name: "PHP", symbol: "₱", cash: "350", robux: "500" },
		{ name: "MYR", symbol: "RM", cash: "23.90", robux: "500" },
		{ name: "VND", symbol: "₫", cash: "129000", robux: "500" },
		{ name: "HKD", symbol: "HK$", cash: "38.00", robux: "500" },
		{ name: "TWD", symbol: "$", cash: "170", robux: "500" },
		{ name: "SAR", symbol: "ر.س.‏", cash: "24.99", robux: "500" },
		{ name: "AED", symbol: "د.إ.‏", cash: "17.99", robux: "500" },
		{ name: "ZAR", symbol: "R", cash: "99.99", robux: "500" },
	],
	
	isEnabled() {
		return this.getSelectedOption().name !== "None"
	},
	
	getSelectedOption() {
		const savedValue = SETTINGS.loaded ? SETTINGS.get("general.robuxToUSDRate") : null
		let option
		
		if(savedValue?.startsWith("Custom,")) {
			const [_, savedSymbolCash, savedRobux] = savedValue.split(",")
			
			const symbolCash = (savedSymbolCash ?? "").replace(/\\./g, x => x === "\\\\" ? "\\" : x === "\\c" ? "," : "")
			const robux = (savedRobux ?? "").replace(/\\./g, x => x === "\\\\" ? "\\" : x === "\\c" ? "," : "")
			
			const match = symbolCash.match(/^(.*?)(\d+(?:\.\d+)?)$/)
	
			const symbol = match ? match[1] : ""
			const cash = match ? match[2] : symbolCash
			
			option = { name: "Custom", symbol: symbol, cash: cash, robux: robux }
			
		} else if(savedValue && savedValue !== "None") {
			option = this.Options.find(x => x.name === savedValue)
		}
		
		return option ?? { name: "None", symbol: "", cash: "1.00", robux: "1" }
	},

	convertAngular(expr) {
		const option = this.getSelectedOption()
		const numFractions = option.cash.includes(".") ? option.cash.length - option.cash.indexOf(".") - 1 : 0

		return `${option.symbol}{{(${expr} * ${option.cash}) / ${option.robux} + ${0.49999 / 10**numFractions} | number: ${numFractions}}}`
	},

	convert(robux) {
		const option = this.getSelectedOption()
		const numFractions = option.cash.includes(".") ? option.cash.length - option.cash.indexOf(".") - 1 : 0

		const cash = (robux * +option.cash) / +option.robux + 0.49999 / 10**numFractions
		const cashString = formatNumber(cash.toFixed(numFractions))

		return `${option.symbol}${cashString}`
	}
}
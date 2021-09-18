"use strict"

const RobuxToCash = {
	// cash is in cents

	RegularPurchaseAmounts: [400, 800, 1700, 4500, 10000],
	PremiumPurchaseAmounts: [440, 880, 1870, 4950, 11000],
	
	UpdateDate: "September 16, 2021",
	
	Currencies: {
		None: { symbol: "", rates: [] },
		
		USD: { symbol: "$", rates: [499, 999, 1999, 4999, 9999] },
		EUR: { symbol: "€", rates: [499, 999, 2099, 4999, 9999] },
		GBP: { symbol: "£", rates: [459, 899, 1849, 4649, 9299] },
		CAD: { symbol: "CAD", rates: [649, 1299, 2599, 6499, 12999] },
		AUD: { symbol: "AU$", rates: [699, 1399, 2899, 7199, 14499] },
		NZD: { symbol: "NZ$", rates: [799, 1599, 3199, 8999, 16999] },
		MXN: { symbol: "MX$", rates: [8900, 18500, 36500, 91900, 184900] },
		HKD: { symbol: "HK$", rates: [3800, 7800, 15800, 38900, 77900] },
		TWD: { symbol: "NT$", rates: [15000, 30000, 59000, 161000, 321000] },
		CLP: { symbol: "CLP", rates: [330000, 650000, 1290000, 3330000, 6700000] },
		COP: { symbol: "COP", rates: [1490000, 2990000, 5790000, 15500000, 30900000] },
		
		// Currency has a fixed usd exchange rate
		
		AED: { symbol: "", usdRate: 3.6725, fixed: true },
		ANG: { symbol: "", usdRate: 1.79, fixed: true },
		AWG: { symbol: "", usdRate: 1.79, fixed: true },
		BBD: { symbol: "$", usdRate: 2, fixed: true },
		BHD: { symbol: "", usdRate: 0.376, fixed: true },
		BMD: { symbol: "$", usdRate: 1, fixed: true },
		BSD: { symbol: "$", usdRate: 1, fixed: true },
		BZD: { symbol: "$", usdRate: 2, fixed: true },
		CUC: { symbol: "", usdRate: 1, fixed: true },
		DJF: { symbol: "", usdRate: 177.7721, fixed: true },
		ERN: { symbol: "Nfk ", usdRate: 15, fixed: true },
		JOD: { symbol: "", usdRate: 0.709, fixed: true },
		KYD: { symbol: "$", usdRate: 1 / 1.20, fixed: true },
		LBP: { symbol: "", usdRate: 1507.5, fixed: true },
		OMR: { symbol: "", usdRate: 0.3845, fixed: true },
		PAB: { symbol: "", usdRate: 1, fixed: true },
		QAR: { symbol: "", usdRate: 3.64, fixed: true },
		SAR: { symbol: "", usdRate: 3.75, fixed: true },
		SVC: { symbol: "", usdRate: 8.75, fixed: true },
		XCD: { symbol: "EC$", usdRate: 2.70, fixed: true },
		
		// Fluctuating exchange rates
		
		AFN: { symbol: "", usdRate: 79.9304389755 },
		ALL: { symbol: "", usdRate: 102.8435939422 },
		AMD: { symbol: "", usdRate: 485.041134855 },
		AOA: { symbol: "", usdRate: 624.4706586101 },
		ARS: { symbol: "", usdRate: 98.3253625413 },
		AZN: { symbol: "", usdRate: 1.6989505907 },
		BAM: { symbol: "", usdRate: 1.6626456225 },
		BDT: { symbol: "", usdRate: 85.1705046647 },
		BGN: { symbol: "", usdRate: 1.6626456225 },
		BIF: { symbol: "FBu ", usdRate: 1993.1629313369 },
		BND: { symbol: "", usdRate: 1.3455106037 },
		BOB: { symbol: "", usdRate: 6.8964463625 },
		BRL: { symbol: "R$", usdRate: 5.2545609956 },
		BTN: { symbol: "", usdRate: 73.574993455 },
		BWP: { symbol: "P ", usdRate: 10.9540328254 },
		BYN: { symbol: "", usdRate: 2.4854545422 },
		CDF: { symbol: "", usdRate: 1977.6556271715 },
		CHF: { symbol: "", usdRate: 0.9251754902 },
		CLF: { symbol: "", usdRate: 0.0282698769 },
		CNY: { symbol: "CN¥", usdRate: 6.4571748457 },
		CRC: { symbol: "", usdRate: 624.4350432789 },
		CUP: { symbol: "", usdRate: 24.0456053766 },
		CVE: { symbol: "", usdRate: 93.7402191376 },
		CZK: { symbol: "", usdRate: 21.5308014781 },
		DKK: { symbol: "", usdRate: 6.3213682825 },
		DOP: { symbol: "", usdRate: 56.6901402255 },
		DZD: { symbol: "", usdRate: 135.8502850463 },
		EGP: { symbol: "", usdRate: 15.7099399726 },
		ETB: { symbol: "", usdRate: 45.7989095048 },
		FJD: { symbol: "$", usdRate: 2.0892719852 },
		FKP: { symbol: "£", usdRate: 0.7256146056 },
		GEL: { symbol: "", usdRate: 3.1097717832 },
		GHS: { symbol: "GH₵", usdRate: 6.034194353 },
		GIP: { symbol: "£", usdRate: 0.7256146056 },
		GMD: { symbol: "D ", usdRate: 51.6679575766 },
		GNF: { symbol: "", usdRate: 9784.7683971499 },
		GTQ: { symbol: "", usdRate: 7.7308078456 },
		GYD: { symbol: "$", usdRate: 208.7789286293 },
		HNL: { symbol: "", usdRate: 24.19325631 },
		HRK: { symbol: "", usdRate: 6.3786749612 },
		HTG: { symbol: "", usdRate: 97.7303729418 },
		HUF: { symbol: "", usdRate: 298.4849827796 },
		IDR: { symbol: "", usdRate: 14253.0507808582 },
		ILS: { symbol: "₪", usdRate: 3.2117125891 },
		INR: { symbol: "₹", usdRate: 73.574993455 },
		IQD: { symbol: "", usdRate: 1459.9287380657 },
		IRR: { symbol: "", usdRate: 42024.6256074794 },
		ISK: { symbol: "", usdRate: 128.3948818724 },
		JMD: { symbol: "$", usdRate: 149.5454397031 },
		JPY: { symbol: "¥", usdRate: 109.6783705879 },
		KES: { symbol: "Ksh", usdRate: 110.0655870829 },
		KGS: { symbol: "", usdRate: 84.7981004531 },
		KHR: { symbol: "", usdRate: 4089.2449720939 },
		KMF: { symbol: "", usdRate: 418.2204107519 },
		KPW: { symbol: "", usdRate: 899.9877104678 },
		KRW: { symbol: "₩", usdRate: 1175.8189356384 },
		KWD: { symbol: "", usdRate: 0.3009042226 },
		KZT: { symbol: "", usdRate: 425.6181461184 },
		LAK: { symbol: "", usdRate: 9580.4426758824 },
		LKR: { symbol: "", usdRate: 199.4744359398 },
		LRD: { symbol: "$", usdRate: 171.3876866848 },
		LSL: { symbol: "", usdRate: 14.5875359811 },
		LYD: { symbol: "", usdRate: 4.5097399604 },
		MAD: { symbol: "", usdRate: 8.9731602783 },
		MDL: { symbol: "", usdRate: 17.6271470473 },
		MGA: { symbol: "Ar ", usdRate: 3924.20061073 },
		MKD: { symbol: "", usdRate: 52.1345468232 },
		MMK: { symbol: "", usdRate: 1782.2601880083 },
		MNT: { symbol: "", usdRate: 2851.6448635935 },
		MOP: { symbol: "MOP$", usdRate: 8.0167306495 },
		MUR: { symbol: "Rs ", usdRate: 43.0185609746 },
		MVR: { symbol: "", usdRate: 15.3900285923 },
		MWK: { symbol: "MK ", usdRate: 812.7676389578 },
		MXV: { symbol: "", usdRate: 2.9718584343 },
		MYR: { symbol: "RM ", usdRate: 4.1583079037 },
		MZN: { symbol: "", usdRate: 63.7933412058 },
		NAD: { symbol: "$", usdRate: 14.5875359811 },
		NGN: { symbol: "₦", usdRate: 411.6923253821 },
		NIO: { symbol: "", usdRate: 35.1371999162 },
		NOK: { symbol: "", usdRate: 8.6414380116 },
		NPR: { symbol: "", usdRate: 118.2718019789 },
		PEN: { symbol: "", usdRate: 4.1131124126 },
		PGK: { symbol: "K ", usdRate: 3.5087550342 },
		PHP: { symbol: "₱", usdRate: 49.9601543389 },
		PKR: { symbol: "Rs ", usdRate: 167.8141696345 },
		PLN: { symbol: "", usdRate: 3.8918901516 },
		PYG: { symbol: "", usdRate: 6896.9252925876 },
		RON: { symbol: "", usdRate: 4.2064702373 },
		RSD: { symbol: "", usdRate: 99.9409740489 },
		RUB: { symbol: "", usdRate: 72.5366460933 },
		RWF: { symbol: "RF ", usdRate: 1014.9448546972 },
		SBD: { symbol: "$", usdRate: 8.0549785992 },
		SCR: { symbol: "Rs ", usdRate: 12.9035831702 },
		SDG: { symbol: "", usdRate: 439.2516633111 },
		SEK: { symbol: "", usdRate: 8.6304079162 },
		SGD: { symbol: "$", usdRate: 1.3455106037 },
		SHP: { symbol: "£", usdRate: 0.7256146056 },
		SLL: { symbol: "Le ", usdRate: 10446.6287815902 },
		SOS: { symbol: "", usdRate: 577.7674910831 },
		SRD: { symbol: "", usdRate: 21.4150352241 },
		SYP: { symbol: "", usdRate: 1257.8616353378 },
		SZL: { symbol: "E ", usdRate: 14.5875359811 },
		THB: { symbol: "", usdRate: 33.1570429896 },
		TJS: { symbol: "", usdRate: 11.3381870528 },
		TMT: { symbol: "", usdRate: 3.5035074998 },
		TND: { symbol: "", usdRate: 2.7943192507 },
		TOP: { symbol: "T$", usdRate: 2.2267222816 },
		TRY: { symbol: "", usdRate: 8.5139536101 },
		TTD: { symbol: "$", usdRate: 6.7868825051 },
		TZS: { symbol: "TSh ", usdRate: 2321.9328480973 },
		UAH: { symbol: "", usdRate: 26.6947376026 },
		UGX: { symbol: "USh ", usdRate: 3530.4032132494 },
		UYU: { symbol: "", usdRate: 42.6759653011 },
		UZS: { symbol: "", usdRate: 10678.7645361056 },
		VES: { symbol: "", usdRate: 4011288.6345023075 },
		VND: { symbol: "₫", usdRate: 22752.2946957554 },
		VUV: { symbol: "VT ", usdRate: 111.5251965024 },
		WST: { symbol: "WS$", usdRate: 2.5608672582 },
		XAF: { symbol: "FCFA ", usdRate: 557.6272143359 },
		YER: { symbol: "", usdRate: 250.7909937249 },
		ZAR: { symbol: "R ", usdRate: 14.5875359811 },
		ZMW: { symbol: "K ", usdRate: 16.3620012648 },
	},
	
	OptionLists: {
		None: [
			{ name: "none", cash: 1, robux: 1 }
		],
		USD: [
			{ name: "devex", cash: 350, robux: 1000 }
		]
	},

	Options: {},
	
	isEnabled() {
		return this.getSelectedOption() !== this.Options.none
	},
	
	getSelectedOption() {
		if(!SETTINGS.loaded) {
			return this.Options.none
		}

		return this.Options[SETTINGS.get("general.robuxToUSDRate")] || this.Options.none
	},

	convertAngular(expr) {
		const option = this.getSelectedOption()

		return `${option.currency.symbol}{{((${expr})*${option.cash}/${option.robux} + 0.4999)/100 | number: 2}}`
	},

	convert(robux) {
		const option = this.getSelectedOption()

		const cash = Math.round((robux * option.cash) / option.robux + 0.4999) / 100
		const cashString = formatNumber(cash.toFixed(2))

		return `${option.currency.symbol}${cashString}`
	}
}


Object.entries(RobuxToCash.Currencies).forEach(([name, currency]) => {
	currency.name = name
	
	if(!currency.symbol || (currency.usdRate && (currency.symbol === "$" || currency.symbol === "£"))) {
		currency.symbol = `${name} `
	}
	
	if(currency.usdRate) {
		currency.rates = RobuxToCash.Currencies.USD.rates.map(x => x * currency.usdRate)
	}

	const list = RobuxToCash.OptionLists[name] = RobuxToCash.OptionLists[name] || []
	currency.rates.forEach((cash, index) => {
		const regular = { name: `${name.toLowerCase()}Regular${index}`, cash: cash, robux: RobuxToCash.RegularPurchaseAmounts[index] }
		const premium = { name: `${name.toLowerCase()}Premium${index}`, cash: cash, robux: RobuxToCash.PremiumPurchaseAmounts[index] }
		
		if(currency.usdRate) {
			regular.usdCash = premium.usdCash = RobuxToCash.Currencies.USD.rates[index]
		}
		
		list.push(regular, premium)
	})
})

Object.entries(RobuxToCash.OptionLists).forEach(([name, list]) => {
	const currency = RobuxToCash.Currencies[name]

	list.forEach(option => {
		option.currency = currency
		RobuxToCash.Options[option.name] = option
	})
})
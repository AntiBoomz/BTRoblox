"use strict"

const RobuxToCash = {
	// cash is in cents

	RegularPurchaseAmounts: [400, 800, 1700, 4500, 10000],
	PremiumPurchaseAmounts: [440, 880, 1870, 4950, 11000],
	
	UpdateDate: "December 21, 2021",
	
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
		
		AFN: { symbol: "", usdRate: 102.1905205668 },
		ALL: { symbol: "", usdRate: 107.0779848863 },
		AMD: { symbol: "", usdRate: 480.6100913607 },
		AOA: { symbol: "", usdRate: 571.2207477125 },
		ARS: { symbol: "", usdRate: 102.1335412843 },
		AZN: { symbol: "", usdRate: 1.6990866057 },
		BAM: { symbol: "", usdRate: 1.7313313664 },
		BDT: { symbol: "", usdRate: 85.6994538466 },
		BGN: { symbol: "", usdRate: 1.7313313664 },
		BIF: { symbol: "FBu ", usdRate: 1992.5241596401 },
		BND: { symbol: "", usdRate: 1.3643651614 },
		BOB: { symbol: "", usdRate: 6.8938243995 },
		BRL: { symbol: "R$", usdRate: 5.7431266863 },
		BTN: { symbol: "", usdRate: 75.5742145759 },
		BWP: { symbol: "P ", usdRate: 11.7543875549 },
		BYN: { symbol: "", usdRate: 2.5231795407 },
		CDF: { symbol: "", usdRate: 1992.4132229994 },
		CHF: { symbol: "", usdRate: 0.9207032445 },
		CLF: { symbol: "", usdRate: 0.0315791121 },
		CNY: { symbol: "CN¥", usdRate: 6.370046438 },
		CRC: { symbol: "", usdRate: 637.4452461233 },
		CUP: { symbol: "", usdRate: 24.1244357736 },
		CVE: { symbol: "", usdRate: 97.6127320734 },
		CZK: { symbol: "", usdRate: 22.319682418 },
		DKK: { symbol: "", usdRate: 6.5828176163 },
		DOP: { symbol: "", usdRate: 56.9744370343 },
		DZD: { symbol: "", usdRate: 139.2286714939 },
		EGP: { symbol: "", usdRate: 15.7086408906 },
		ETB: { symbol: "", usdRate: 48.7672546201 },
		FJD: { symbol: "$", usdRate: 2.1383622933 },
		FKP: { symbol: "£", usdRate: 0.7543193133 },
		GEL: { symbol: "", usdRate: 3.0945263039 },
		GHS: { symbol: "GH₵", usdRate: 6.0826931846 },
		GIP: { symbol: "£", usdRate: 0.7543193133 },
		GMD: { symbol: "D ", usdRate: 52.6417556213 },
		GNF: { symbol: "", usdRate: 9317.8610440387 },
		GTQ: { symbol: "", usdRate: 7.721367515 },
		GYD: { symbol: "$", usdRate: 208.9378979992 },
		HNL: { symbol: "", usdRate: 24.4471123774 },
		HRK: { symbol: "", usdRate: 6.659122052 },
		HTG: { symbol: "", usdRate: 101.013214831 },
		HUF: { symbol: "", usdRate: 325.477365692 },
		IDR: { symbol: "", usdRate: 14301.1493765732 },
		ILS: { symbol: "₪", usdRate: 3.163062542 },
		INR: { symbol: "₹", usdRate: 75.5742145759 },
		IQD: { symbol: "", usdRate: 1458.181867037 },
		IRR: { symbol: "", usdRate: 42102.2596695096 },
		ISK: { symbol: "", usdRate: 130.6035852734 },
		JMD: { symbol: "$", usdRate: 153.9570285598 },
		JPY: { symbol: "¥", usdRate: 113.6923371183 },
		KES: { symbol: "Ksh", usdRate: 113.1210856733 },
		KGS: { symbol: "", usdRate: 84.7975655615 },
		KHR: { symbol: "", usdRate: 4079.1094023 },
		KMF: { symbol: "", usdRate: 435.4975620704 },
		KPW: { symbol: "", usdRate: 900.046301041 },
		KRW: { symbol: "₩", usdRate: 1192.7921174298 },
		KWD: { symbol: "", usdRate: 0.3028643883 },
		KZT: { symbol: "", usdRate: 437.4047267702 },
		LAK: { symbol: "", usdRate: 11106.5853110701 },
		LKR: { symbol: "", usdRate: 202.4964762578 },
		LRD: { symbol: "$", usdRate: 142.36112356 },
		LSL: { symbol: "", usdRate: 15.8204706871 },
		LYD: { symbol: "", usdRate: 4.603717727 },
		MAD: { symbol: "", usdRate: 9.2688663997 },
		MDL: { symbol: "", usdRate: 17.7625190326 },
		MGA: { symbol: "Ar ", usdRate: 3966.3047043826 },
		MKD: { symbol: "", usdRate: 54.5445947266 },
		MMK: { symbol: "", usdRate: 1775.0866764865 },
		MNT: { symbol: "", usdRate: 2857.0610047802 },
		MOP: { symbol: "MOP$", usdRate: 8.0350798408 },
		MUR: { symbol: "Rs ", usdRate: 43.8145060484 },
		MVR: { symbol: "", usdRate: 15.4455769386 },
		MWK: { symbol: "MK ", usdRate: 816.1765202481 },
		MXV: { symbol: "", usdRate: 3.056874037 },
		MYR: { symbol: "RM ", usdRate: 4.208500618 },
		MZN: { symbol: "", usdRate: 63.8002306755 },
		NAD: { symbol: "$", usdRate: 15.8204706871 },
		NGN: { symbol: "₦", usdRate: 410.2938562563 },
		NIO: { symbol: "", usdRate: 35.3765751245 },
		NOK: { symbol: "", usdRate: 8.9983657597 },
		NPR: { symbol: "", usdRate: 120.9754239824 },
		PEN: { symbol: "", usdRate: 4.0505803547 },
		PGK: { symbol: "K ", usdRate: 3.5087743758 },
		PHP: { symbol: "₱", usdRate: 49.9103523957 },
		PKR: { symbol: "Rs ", usdRate: 177.9753936474 },
		PLN: { symbol: "", usdRate: 4.0951763735 },
		PYG: { symbol: "", usdRate: 6831.4345868052 },
		RON: { symbol: "", usdRate: 4.3815062137 },
		RSD: { symbol: "", usdRate: 104.1208436045 },
		RUB: { symbol: "", usdRate: 73.9261118545 },
		RWF: { symbol: "RF ", usdRate: 1007.0696889747 },
		SBD: { symbol: "$", usdRate: 8.0628330602 },
		SCR: { symbol: "Rs ", usdRate: 13.5541237522 },
		SDG: { symbol: "", usdRate: 437.311228578 },
		SEK: { symbol: "", usdRate: 9.132094974 },
		SGD: { symbol: "$", usdRate: 1.3643651614 },
		SHP: { symbol: "£", usdRate: 0.7543193133 },
		SLL: { symbol: "Le ", usdRate: 11259.3824581124 },
		SOS: { symbol: "", usdRate: 576.45954364 },
		SRD: { symbol: "", usdRate: 21.527127966 },
		SYP: { symbol: "", usdRate: 2512.5313948728 },
		SZL: { symbol: "E ", usdRate: 15.8204706871 },
		THB: { symbol: "", usdRate: 33.6947921974 },
		TJS: { symbol: "", usdRate: 11.2824344684 },
		TMT: { symbol: "", usdRate: 3.495624432 },
		TND: { symbol: "", usdRate: 2.8791447632 },
		TOP: { symbol: "T$", usdRate: 2.2841852239 },
		TRY: { symbol: "", usdRate: 12.7146010499 },
		TTD: { symbol: "$", usdRate: 6.7919903957 },
		TZS: { symbol: "TSh ", usdRate: 2306.2446031398 },
		UAH: { symbol: "", usdRate: 27.2629251714 },
		UGX: { symbol: "USh ", usdRate: 3544.956611027 },
		UYU: { symbol: "", usdRate: 44.4346068582 },
		UZS: { symbol: "", usdRate: 10827.3536889908 },
		VES: { symbol: "", usdRate: 4.6029314494 },
		VND: { symbol: "₫", usdRate: 22883.2168693888 },
		VUV: { symbol: "VT ", usdRate: 114.1508007736 },
		WST: { symbol: "WS$", usdRate: 2.6205361255 },
		XAF: { symbol: "FCFA ", usdRate: 580.6634160939 },
		YER: { symbol: "", usdRate: 250.1962489544 },
		ZAR: { symbol: "R ", usdRate: 15.8204706871 },
		ZMW: { symbol: "K ", usdRate: 16.512979103 },
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
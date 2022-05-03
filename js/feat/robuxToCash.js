"use strict"

const RobuxToCash = {
	// cash is in cents

	RegularPurchaseAmounts: [400, 800, 1700, 4500, 10000],
	PremiumPurchaseAmounts: [440, 880, 1870, 4950, 11000],
	
	UpdateDate: "May 3, 2022",
	
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
		
		AFN: { symbol: "", usdRate: 85.9503313983 },
		ALL: { symbol: "", usdRate: 114.7483287104 },
		AMD: { symbol: "", usdRate: 447.9191764552 },
		AOA: { symbol: "", usdRate: 407.7229054924 },
		ARS: { symbol: "", usdRate: 115.7346803991 },
		AZN: { symbol: "", usdRate: 1.6989784809 },
		BAM: { symbol: "", usdRate: 1.8600378383 },
		BDT: { symbol: "", usdRate: 86.62555997 },
		BGN: { symbol: "", usdRate: 1.8600378383 },
		BIF: { symbol: "FBu ", usdRate: 2051.9927240223 },
		BND: { symbol: "", usdRate: 1.3851522682 },
		BOB: { symbol: "", usdRate: 6.8762233831 },
		BRL: { symbol: "R$", usdRate: 5.0853583132 },
		BTN: { symbol: "", usdRate: 76.5740114672 },
		BWP: { symbol: "P ", usdRate: 12.1165701023 },
		BYN: { symbol: "", usdRate: 3.3830755073 },
		CDF: { symbol: "", usdRate: 2012.5010606298 },
		CHF: { symbol: "", usdRate: 0.9785991216 },
		CLF: { symbol: "", usdRate: 0.0312133285 },
		CNY: { symbol: "CN¥", usdRate: 6.6084396898 },
		CRC: { symbol: "", usdRate: 662.0335224942 },
		CUP: { symbol: "", usdRate: 24.0564702431 },
		CVE: { symbol: "", usdRate: 104.869223004 },
		CZK: { symbol: "", usdRate: 23.498494552 },
		DKK: { symbol: "", usdRate: 7.0747677307 },
		DOP: { symbol: "", usdRate: 55.1104610824 },
		DZD: { symbol: "", usdRate: 144.7531757978 },
		EGP: { symbol: "", usdRate: 18.4814277889 },
		ETB: { symbol: "", usdRate: 51.8593686387 },
		FJD: { symbol: "$", usdRate: 2.1664247881 },
		FKP: { symbol: "£", usdRate: 0.7975586363 },
		GEL: { symbol: "", usdRate: 3.0171880791 },
		GHS: { symbol: "GH₵", usdRate: 7.524558588 },
		GIP: { symbol: "£", usdRate: 0.7975586363 },
		GMD: { symbol: "D ", usdRate: 54.0508752896 },
		GNF: { symbol: "", usdRate: 8858.1400303502 },
		GTQ: { symbol: "", usdRate: 7.6635208864 },
		GYD: { symbol: "$", usdRate: 208.9582093889 },
		HNL: { symbol: "", usdRate: 24.5385412017 },
		HRK: { symbol: "", usdRate: 7.1868478967 },
		HTG: { symbol: "", usdRate: 106.8952204426 },
		HUF: { symbol: "", usdRate: 363.7035424287 },
		IDR: { symbol: "", usdRate: 14489.2453281591 },
		ILS: { symbol: "₪", usdRate: 3.3672317365 },
		INR: { symbol: "₹", usdRate: 76.5740114672 },
		IQD: { symbol: "", usdRate: 1459.059920563 },
		IRR: { symbol: "", usdRate: 42395.0583643123 },
		ISK: { symbol: "", usdRate: 130.2949744426 },
		JMD: { symbol: "$", usdRate: 154.5453694608 },
		JPY: { symbol: "¥", usdRate: 130.170451485 },
		KES: { symbol: "Ksh", usdRate: 115.7950912463 },
		KGS: { symbol: "", usdRate: 81.9983560242 },
		KHR: { symbol: "", usdRate: 4058.0779435351 },
		KMF: { symbol: "", usdRate: 467.8722742862 },
		KPW: { symbol: "", usdRate: 899.9930870458 },
		KRW: { symbol: "₩", usdRate: 1266.5568239679 },
		KWD: { symbol: "", usdRate: 0.3066837828 },
		KZT: { symbol: "", usdRate: 440.6090736732 },
		LAK: { symbol: "", usdRate: 12400.8384849241 },
		LKR: { symbol: "", usdRate: 354.2857553351 },
		LRD: { symbol: "$", usdRate: 151.3245206556 },
		LSL: { symbol: "", usdRate: 16.0231779571 },
		LYD: { symbol: "", usdRate: 4.7910077006 },
		MAD: { symbol: "", usdRate: 10.0043963075 },
		MDL: { symbol: "", usdRate: 18.4856004391 },
		MGA: { symbol: "Ar ", usdRate: 4006.5762997749 },
		MKD: { symbol: "", usdRate: 58.5413480413 },
		MMK: { symbol: "", usdRate: 1852.7545323244 },
		MNT: { symbol: "", usdRate: 3106.0402491799 },
		MOP: { symbol: "MOP$", usdRate: 8.0833602213 },
		MUR: { symbol: "Rs ", usdRate: 42.6651471015 },
		MVR: { symbol: "", usdRate: 15.3428808999 },
		MWK: { symbol: "MK ", usdRate: 813.8583862155 },
		MXV: { symbol: "", usdRate: 2.952395916 },
		MYR: { symbol: "RM ", usdRate: 4.3533224348 },
		MZN: { symbol: "", usdRate: 63.81993486 },
		NAD: { symbol: "$", usdRate: 16.0231779571 },
		NGN: { symbol: "₦", usdRate: 415.1807908446 },
		NIO: { symbol: "", usdRate: 35.8183079102 },
		NOK: { symbol: "", usdRate: 9.4264342449 },
		NPR: { symbol: "", usdRate: 122.5758488562 },
		PEN: { symbol: "", usdRate: 3.8512752917 },
		PGK: { symbol: "K ", usdRate: 3.5210162213 },
		PHP: { symbol: "₱", usdRate: 52.5457084101 },
		PKR: { symbol: "Rs ", usdRate: 185.6434411467 },
		PLN: { symbol: "", usdRate: 4.4680061026 },
		PYG: { symbol: "", usdRate: 6821.6006471368 },
		RON: { symbol: "", usdRate: 4.7044459176 },
		RSD: { symbol: "", usdRate: 111.5869737317 },
		RUB: { symbol: "", usdRate: 70.3929695872 },
		RWF: { symbol: "RF ", usdRate: 1020.4425674279 },
		SBD: { symbol: "$", usdRate: 8.0694218732 },
		SCR: { symbol: "Rs ", usdRate: 13.1527867232 },
		SDG: { symbol: "", usdRate: 447.4462650318 },
		SEK: { symbol: "", usdRate: 9.8774678281 },
		SGD: { symbol: "$", usdRate: 1.3851522682 },
		SHP: { symbol: "£", usdRate: 0.7975586363 },
		SLL: { symbol: "Le ", usdRate: 12676.2536957155 },
		SOS: { symbol: "", usdRate: 578.2035981996 },
		SRD: { symbol: "", usdRate: 20.8441196767 },
		SYP: { symbol: "", usdRate: 2512.0313944897 },
		SZL: { symbol: "E ", usdRate: 16.0231779571 },
		THB: { symbol: "", usdRate: 34.4773232952 },
		TJS: { symbol: "", usdRate: 12.4761104676 },
		TMT: { symbol: "", usdRate: 3.494056772 },
		TND: { symbol: "", usdRate: 3.0635317399 },
		TOP: { symbol: "T$", usdRate: 2.3105727339 },
		TRY: { symbol: "", usdRate: 14.8771564064 },
		TTD: { symbol: "$", usdRate: 6.7949865366 },
		TZS: { symbol: "TSh ", usdRate: 2325.1262671552 },
		UAH: { symbol: "", usdRate: 29.4027989543 },
		UGX: { symbol: "USh ", usdRate: 3541.1694138969 },
		UYU: { symbol: "", usdRate: 41.3460764966 },
		UZS: { symbol: "", usdRate: 11180.9856027401 },
		VES: { symbol: "", usdRate: 4.5011973067 },
		VND: { symbol: "₫", usdRate: 22916.5918650105 },
		VUV: { symbol: "VT ", usdRate: 116.1768150486 },
		WST: { symbol: "WS$", usdRate: 2.6520867837 },
		XAF: { symbol: "FCFA ", usdRate: 623.8296990483 },
		YER: { symbol: "", usdRate: 250.2961073 },
		ZAR: { symbol: "R ", usdRate: 16.0231779571 },
		ZMW: { symbol: "K ", usdRate: 17.0283597529 },
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
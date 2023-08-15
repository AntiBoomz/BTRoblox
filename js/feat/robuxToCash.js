"use strict"

const RobuxToCash = {
	// cash is in cents
	
	UpdateDate: "August 15, 2023",
	
	Currencies: {
		None: { symbol: "" },
		
		USD: {
			symbol: "$",
			robuxRates: [[499, 400], [999, 800], [1999, 1700], [4999, 4500], [9999, 10000], [19999, 22500]],
			robuxRatesPremium: [[499, 440], [999, 880], [1999, 1870], [4999, 4950], [9999, 11000], [19999, 25000]],
			subscriptionRates: [[499, 450], [999, 1000], [1999, 2200]]
		},
		CAD: {
			symbol: "CAD",
			robuxRates: [[699, 440], [1399, 880], [2799, 1870], [6999, 4950], [13999, 11000], [27999, 24750]],
			robuxRatesPremium: [[699, 480], [1399, 970], [2799, 2050], [6999, 5450], [13999, 12100], [27999, 25000]],
			subscriptionRates: [[699, 450], [1399, 1000], [2799, 2200]]
		},
		GBP: {
			symbol: "£",
			robuxRates: [[449, 400], [899, 800], [1799, 1700], [4499, 4500], [8999, 10000]],
			robuxRatesPremium: [[449, 440], [899, 880], [1799, 1870], [4499, 4950], [8999, 11000]],
			subscriptionRates: [[449, 450], [899, 1000], [1799, 2200]]
		},
		EUR: {
			symbol: "€",
			robuxRates: [[599, 400], [1199, 800], [2399, 1700], [5999, 4500], [11999, 10000], [23999, 22500]],
			robuxRatesPremium: [[599, 440], [1199, 880], [2399, 1870], [5999, 4950], [11999, 11000], [23999, 25000]],
			subscriptionRates: [[599, 450], [1199, 1000], [2399, 2200]]
		},
		AUD: {
			symbol: "AU$",
			robuxRates: [[799, 400], [1499, 800], [3099, 1700], [7999, 4500], [15999, 10000], [31999, 22500]],
			robuxRatesPremium: [[799, 440], [1499, 880], [3099, 1870], [7999, 4950], [15999, 11000], [31999, 25000]],
			subscriptionRates: [[799, 450], [1499, 1000], [3099, 2200]]
		},
		BRL: {
			symbol: "R$",
			robuxRates: [[2790, 400], [5490, 800], [10990, 1700], [27990, 4500], [54990, 10000]],
			robuxRatesPremium: [[2790, 440], [5490, 880], [10990, 1870], [27990, 4950], [54990, 11000]],
			subscriptionRates: [[2790, 450], [5490, 1000], [10990, 2200]]
		},
		CLP: {
			symbol: "CLP",
			robuxRates: [[550000, 400], [1090000, 800], [2190000, 1700], [5490000, 4500], [10990000, 10000], [21990000, 22500]],
			robuxRatesPremium: [[550000, 440], [1090000, 880], [2190000, 1870], [5490000, 4950], [10990000, 11000], [21990000, 25000]],
			subscriptionRates: [[550000, 450], [1090000, 1000], [2190000, 2200]]
		},
		HKD: {
			symbol: "HK$",
			robuxRates: [[3800, 400], [7800, 800], [15800, 1700], [39800, 4500], [78800, 10000], [158800, 22500]],
			robuxRatesPremium: [[3800, 440], [7800, 880], [15800, 1870], [39800, 4950], [78800, 11000], [158800, 25000]],
			subscriptionRates: [[3800, 450], [7800, 1000], [15800, 2200]]
		},
		JPY: {
			symbol: "JP¥",
			robuxRates: [[80000, 400], [160000, 800], [320000, 1700], [800000, 4500], [1580000, 10000], [3180000, 22500]],
			robuxRatesPremium: [[80000, 440], [160000, 880], [320000, 1870], [800000, 4950], [1580000, 11000], [3180000, 25000]],
			subscriptionRates: [[80000, 450], [160000, 1000], [320000, 2200]]
		},
		MXN: {
			symbol: "MX$",
			robuxRates: [[12900, 400], [24900, 800], [49900, 1700], [129900, 4500], [249900, 10000], [499900, 22500]],
			robuxRatesPremium: [[12900, 440], [24900, 880], [49900, 1870], [129900, 4950], [249900, 11000], [499900, 25000]],
			subscriptionRates: [[12900, 450], [24900, 1000], [49900, 2200]]
		},
		NZD: {
			symbol: "NZ$",
			robuxRates: [[899, 400], [1699, 800], [3499, 1700], [8999, 4500], [16999, 10000], [34999, 22500]],
			robuxRatesPremium: [[899, 440], [1699, 880], [3499, 1870], [8999, 4950], [16999, 11000], [34999, 25000]],
			subscriptionRates: [[899, 450], [1699, 1000], [3499, 2200]]
		},
		KRW: {
			symbol: "₩",
			robuxRates: [[750000, 400], [1500000, 800], [3000000, 1700], [7900000, 4500], [14900000, 10000], [29900000, 22500]],
			robuxRatesPremium: [[750000, 440], [1500000, 880], [3000000, 1870], [7900000, 4950], [14900000, 11000], [29900000, 25000]],
			subscriptionRates: [[750000, 450], [1500000, 1000], [3000000, 2200]]
		},
		TWD: {
			symbol: "NT$",
			robuxRates: [[17000, 400], [33000, 800], [67000, 1700], [169000, 4500], [329000, 10000], [659000, 22500]],
			robuxRatesPremium: [[17000, 440], [33000, 880], [67000, 1870], [169000, 4950], [329000, 11000], [659000, 25000]],
			subscriptionRates: [[17000, 450], [33000, 1000], [67000, 2200]]
		},
		
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
		
		AFN: { symbol: "", usdRate: 84.1574150537 },
		ALL: { symbol: "", usdRate: 95.2632483507 },
		AMD: { symbol: "", usdRate: 385.819302633 },
		AOA: { symbol: "", usdRate: 832.942528461 },
		ARS: { symbol: "", usdRate: 349.9023057308 },
		AZN: { symbol: "", usdRate: 1.7016615172 },
		BAM: { symbol: "", usdRate: 1.7935044386 },
		BDT: { symbol: "", usdRate: 109.4866615162 },
		BGN: { symbol: "", usdRate: 1.7935044386 },
		BIF: { symbol: "FBu ", usdRate: 2836.8245674327 },
		BND: { symbol: "", usdRate: 1.3559917986 },
		BOB: { symbol: "", usdRate: 6.9246597703 },
		BTN: { symbol: "", usdRate: 83.2483654651 },
		BWP: { symbol: "P ", usdRate: 13.5428691484 },
		BYN: { symbol: "", usdRate: 2.5053346533 },
		CDF: { symbol: "", usdRate: 2456.8317478377 },
		CHF: { symbol: "", usdRate: 0.8783397042 },
		CLF: { symbol: "", usdRate: 0.0236806239 },
		CNY: { symbol: "CN¥", usdRate: 7.258443091 },
		COP: { symbol: "COP", usdRate: 4044.3867198871 },
		CRC: { symbol: "", usdRate: 536.904766314 },
		CUP: { symbol: "", usdRate: 24.0343841588 },
		CVE: { symbol: "", usdRate: 101.1180595667 },
		CZK: { symbol: "", usdRate: 22.0630984387 },
		DKK: { symbol: "", usdRate: 6.8332515041 },
		DOP: { symbol: "", usdRate: 56.6725083538 },
		DZD: { symbol: "", usdRate: 135.9714725322 },
		EGP: { symbol: "", usdRate: 30.9009095028 },
		ETB: { symbol: "", usdRate: 55.0702680403 },
		FJD: { symbol: "$", usdRate: 2.2506338204 },
		FKP: { symbol: "£", usdRate: 0.7884821928 },
		GEL: { symbol: "", usdRate: 2.6127201748 },
		GHS: { symbol: "GH₵", usdRate: 11.1548677749 },
		GIP: { symbol: "£", usdRate: 0.7884821928 },
		GMD: { symbol: "D ", usdRate: 61.043844001 },
		GNF: { symbol: "", usdRate: 8620.8191180399 },
		GTQ: { symbol: "", usdRate: 7.8720549674 },
		GYD: { symbol: "$", usdRate: 209.2650892531 },
		HNL: { symbol: "", usdRate: 24.6113785102 },
		HRK: { symbol: "", usdRate: 6.9091685844 },
		HTG: { symbol: "", usdRate: 137.0285940761 },
		HUF: { symbol: "", usdRate: 352.7860979761 },
		IDR: { symbol: "", usdRate: 15330.0028944181 },
		ILS: { symbol: "₪", usdRate: 3.7495688478 },
		INR: { symbol: "₹", usdRate: 83.2483654651 },
		IQD: { symbol: "", usdRate: 1309.9828473795 },
		IRR: { symbol: "", usdRate: 42096.1284135529 },
		ISK: { symbol: "", usdRate: 132.1371183257 },
		JMD: { symbol: "$", usdRate: 154.684317659 },
		KES: { symbol: "Ksh", usdRate: 143.8173701362 },
		KGS: { symbol: "", usdRate: 88.269358875 },
		KHR: { symbol: "", usdRate: 4133.8688885091 },
		KMF: { symbol: "", usdRate: 451.136521714 },
		KPW: { symbol: "", usdRate: 899.9880461963 },
		KWD: { symbol: "", usdRate: 0.3077875821 },
		KZT: { symbol: "", usdRate: 449.8574328516 },
		LAK: { symbol: "", usdRate: 19339.1486290958 },
		LKR: { symbol: "", usdRate: 321.6721516841 },
		LRD: { symbol: "$", usdRate: 187.0085760035 },
		LSL: { symbol: "", usdRate: 19.0772291915 },
		LYD: { symbol: "", usdRate: 4.8094150099 },
		MAD: { symbol: "", usdRate: 9.8672456067 },
		MDL: { symbol: "", usdRate: 17.6409539723 },
		MGA: { symbol: "Ar ", usdRate: 4504.7485095281 },
		MKD: { symbol: "", usdRate: 56.356025967 },
		MMK: { symbol: "", usdRate: 2101.7982401972 },
		MNT: { symbol: "", usdRate: 3461.9211079937 },
		MOP: { symbol: "MOP$", usdRate: 8.0540438496 },
		MUR: { symbol: "Rs ", usdRate: 45.2807168131 },
		MVR: { symbol: "", usdRate: 15.421832451 },
		MWK: { symbol: "MK ", usdRate: 1084.2095038754 },
		MXV: { symbol: "", usdRate: 2.1870736107 },
		MYR: { symbol: "RM ", usdRate: 4.6167770297 },
		MZN: { symbol: "", usdRate: 63.8328977354 },
		NAD: { symbol: "$", usdRate: 19.0772291915 },
		NGN: { symbol: "₦", usdRate: 766.3635549095 },
		NIO: { symbol: "", usdRate: 36.5472501952 },
		NOK: { symbol: "", usdRate: 10.48695039 },
		NPR: { symbol: "", usdRate: 133.2598210182 },
		PEN: { symbol: "", usdRate: 3.7034213937 },
		PGK: { symbol: "K ", usdRate: 3.5735393362 },
		PHP: { symbol: "₱", usdRate: 56.6773413324 },
		PKR: { symbol: "Rs ", usdRate: 288.0808540755 },
		PLN: { symbol: "", usdRate: 4.0798274425 },
		PYG: { symbol: "", usdRate: 7278.1538859048 },
		RON: { symbol: "", usdRate: 4.5307987186 },
		RSD: { symbol: "", usdRate: 107.4497709593 },
		RUB: { symbol: "", usdRate: 96.9255099645 },
		RWF: { symbol: "RF ", usdRate: 1183.4599843128 },
		SBD: { symbol: "$", usdRate: 8.3931260913 },
		SCR: { symbol: "Rs ", usdRate: 13.7188994347 },
		SDG: { symbol: "", usdRate: 601.034701348 },
		SEK: { symbol: "", usdRate: 10.802607612 },
		SGD: { symbol: "$", usdRate: 1.3559917986 },
		SHP: { symbol: "£", usdRate: 0.7884821928 },
		SLL: { symbol: "Le ", usdRate: 21812.8601938423 },
		SOS: { symbol: "", usdRate: 568.6145207196 },
		SRD: { symbol: "", usdRate: 38.3196299455 },
		SYP: { symbol: "", usdRate: 13100.0004638243 },
		SZL: { symbol: "E ", usdRate: 19.0772291915 },
		THB: { symbol: "", usdRate: 35.2633919636 },
		TJS: { symbol: "", usdRate: 10.9752121057 },
		TMT: { symbol: "", usdRate: 3.504615657 },
		TND: { symbol: "", usdRate: 3.0936587207 },
		TOP: { symbol: "T$", usdRate: 2.3709305726 },
		TRY: { symbol: "", usdRate: 27.0633848301 },
		TTD: { symbol: "$", usdRate: 6.7738193545 },
		TZS: { symbol: "TSh ", usdRate: 2489.3440687822 },
		UAH: { symbol: "", usdRate: 36.8419321555 },
		UGX: { symbol: "USh ", usdRate: 3723.855931906 },
		UYU: { symbol: "", usdRate: 37.9115784056 },
		UZS: { symbol: "", usdRate: 12055.2199302378 },
		VES: { symbol: "", usdRate: 30.9180119347 },
		VND: { symbol: "₫", usdRate: 23813.4114181202 },
		VUV: { symbol: "VT ", usdRate: 120.5920706457 },
		WST: { symbol: "WS$", usdRate: 2.7628451764 },
		XAF: { symbol: "FCFA ", usdRate: 601.5153622853 },
		YER: { symbol: "", usdRate: 250.3208950299 },
		ZAR: { symbol: "R ", usdRate: 19.0772291915 },
		ZMW: { symbol: "K ", usdRate: 19.2931684634 },
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

		return `${option.currency.symbol}{{((${expr})*${option.cash}/${option.robux} + 0.4999)/100 | number: ${option.currency.numFractions}}}`
	},

	convert(robux) {
		const option = this.getSelectedOption()

		const cash = Math.round((robux * option.cash) / option.robux + 0.4999) / 100
		const cashString = formatNumber(cash.toFixed(option.currency.numFractions))

		return `${option.currency.symbol}${cashString}`
	}
}


for(const [name, currency] of Object.entries(RobuxToCash.Currencies)) {
	currency.name = name
	currency.numFractions = 2
	
	if(!currency.symbol || (currency.usdRate && (currency.symbol === "$" || currency.symbol === "£"))) {
		currency.symbol = `${name} `
	}
	
	if(name === "None") { continue }
	
	try { currency.numFractions = new Intl.NumberFormat("en-US", { style: "currency", currency: name }).resolvedOptions().maximumFractionDigits }
	catch(ex) {}

	const options = RobuxToCash.OptionLists[name] = RobuxToCash.OptionLists[name] || []
	const refCurrency = currency.usdRate ? RobuxToCash.Currencies.USD : currency
	
	for(const [index, rate] of Object.entries(refCurrency.robuxRates)) {
		const option = { name: `${name.toLowerCase()}Regular${index}`, cash: rate[0], robux: rate[1] }
		
		if(currency.usdRate) {
			option.usdCash = option.cash
			option.cash *= currency.usdRate
		}
		
		options.push(option)
	}
	
	for(const [index, rate] of Object.entries(refCurrency.robuxRatesPremium)) {
		const option = { name: `${name.toLowerCase()}Premium${index}`, cash: rate[0], robux: rate[1] }
		
		if(currency.usdRate) {
			option.usdCash = option.cash
			option.cash *= currency.usdRate
		}
		
		options.push(option)
	}
	
	for(const [index, rate] of Object.entries(refCurrency.subscriptionRates)) {
		const option = { name: `${name.toLowerCase()}Subscription${index}`, cash: rate[0], robux: rate[1] }
		
		if(currency.usdRate) {
			option.usdCash = option.cash
			option.cash *= currency.usdRate
		}
		
		options.push(option)
	}
}

for(const [name, options] of Object.entries(RobuxToCash.OptionLists)) {
	const currency = RobuxToCash.Currencies[name]
	
	for(const option of options) {
		option.currency = currency
		RobuxToCash.Options[option.name] = option
	}
}
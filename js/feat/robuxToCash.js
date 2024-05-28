"use strict"

const RobuxToCash = {
	// cash is in cents
	
	UpdateDate: "May 28, 2024",
	
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
		
		AFN: { symbol: "", usdRate: 71.7500088664 },
		ALL: { symbol: "", usdRate: 92.6570776483 },
		AMD: { symbol: "", usdRate: 385.4537845729 },
		AOA: { symbol: "", usdRate: 860.4483196505 },
		ARS: { symbol: "", usdRate: 893.5736765995 },
		AZN: { symbol: "", usdRate: 1.6999062132 },
		BAM: { symbol: "", usdRate: 1.8006299783 },
		BDT: { symbol: "", usdRate: 117.2944426814 },
		BGN: { symbol: "", usdRate: 1.8006299783 },
		BIF: { symbol: "FBu ", usdRate: 2868.2913638056 },
		BND: { symbol: "", usdRate: 1.3483988714 },
		BOB: { symbol: "", usdRate: 6.8994514978 },
		BTN: { symbol: "", usdRate: 83.2190739382 },
		BWP: { symbol: "P ", usdRate: 13.5670230277 },
		BYN: { symbol: "", usdRate: 3.2699953781 },
		CDF: { symbol: "", usdRate: 2822.5857053324 },
		CHF: { symbol: "", usdRate: 0.9119484939 },
		CLF: { symbol: "", usdRate: 0.0239977899 },
		CNY: { symbol: "CN¥", usdRate: 7.2447999476 },
		COP: { symbol: "COP", usdRate: 3843.7319914546 },
		CRC: { symbol: "", usdRate: 518.5399005986 },
		CUP: { symbol: "", usdRate: 23.9748262086 },
		CVE: { symbol: "", usdRate: 101.5197986066 },
		CZK: { symbol: "", usdRate: 22.7049559586 },
		DKK: { symbol: "", usdRate: 6.8694075947 },
		DOP: { symbol: "", usdRate: 58.8704635581 },
		DZD: { symbol: "", usdRate: 134.5565647706 },
		EGP: { symbol: "", usdRate: 47.5968554783 },
		ETB: { symbol: "", usdRate: 57.2147897169 },
		FJD: { symbol: "$", usdRate: 2.2483966152 },
		FKP: { symbol: "£", usdRate: 0.7834465395 },
		GEL: { symbol: "", usdRate: 2.7848211325 },
		GHS: { symbol: "GH₵", usdRate: 14.6507458014 },
		GIP: { symbol: "£", usdRate: 0.7834465395 },
		GMD: { symbol: "D ", usdRate: 67.8294787321 },
		GNF: { symbol: "", usdRate: 8600.1039587796 },
		GTQ: { symbol: "", usdRate: 7.758499327 },
		GYD: { symbol: "$", usdRate: 208.7523585845 },
		HNL: { symbol: "", usdRate: 24.6825059525 },
		HRK: { symbol: "", usdRate: 6.9366185055 },
		HTG: { symbol: "", usdRate: 132.4816702901 },
		HUF: { symbol: "", usdRate: 353.9149346407 },
		IDR: { symbol: "", usdRate: 16108.6720735732 },
		ILS: { symbol: "₪", usdRate: 3.6829822409 },
		INR: { symbol: "₹", usdRate: 83.2190739382 },
		IQD: { symbol: "", usdRate: 1308.4809031016 },
		IRR: { symbol: "", usdRate: 41823.2291125909 },
		ISK: { symbol: "", usdRate: 137.27804025 },
		JMD: { symbol: "$", usdRate: 155.2946711376 },
		KES: { symbol: "Ksh", usdRate: 132.4914847756 },
		KGS: { symbol: "", usdRate: 87.8998010421 },
		KHR: { symbol: "", usdRate: 4080.9126815658 },
		KMF: { symbol: "", usdRate: 452.9288736825 },
		KPW: { symbol: "", usdRate: 900.0218070501 },
		KWD: { symbol: "", usdRate: 0.3067312194 },
		KZT: { symbol: "", usdRate: 442.4052946473 },
		LAK: { symbol: "", usdRate: 21468.7958313887 },
		LKR: { symbol: "", usdRate: 301.7195853666 },
		LRD: { symbol: "$", usdRate: 193.5252673764 },
		LSL: { symbol: "", usdRate: 18.2779611386 },
		LYD: { symbol: "", usdRate: 4.8411025849 },
		MAD: { symbol: "", usdRate: 9.9310903796 },
		MDL: { symbol: "", usdRate: 17.6906481632 },
		MGA: { symbol: "Ar ", usdRate: 4447.3272753541 },
		MKD: { symbol: "", usdRate: 56.6338433936 },
		MMK: { symbol: "", usdRate: 2098.7377860084 },
		MNT: { symbol: "", usdRate: 3396.4764281737 },
		MOP: { symbol: "MOP$", usdRate: 8.0460561441 },
		MUR: { symbol: "Rs ", usdRate: 45.9865553451 },
		MVR: { symbol: "", usdRate: 15.4038196436 },
		MWK: { symbol: "MK ", usdRate: 1732.5629057639 },
		MXV: { symbol: "", usdRate: 2.0426372572 },
		MYR: { symbol: "RM ", usdRate: 4.6939107532 },
		MZN: { symbol: "", usdRate: 63.5969627937 },
		NAD: { symbol: "$", usdRate: 18.2779611386 },
		NGN: { symbol: "₦", usdRate: 1391.6328684356 },
		NIO: { symbol: "", usdRate: 36.7956863641 },
		NOK: { symbol: "", usdRate: 10.5025157101 },
		NPR: { symbol: "", usdRate: 133.2129326066 },
		PEN: { symbol: "", usdRate: 3.7474271984 },
		PGK: { symbol: "K ", usdRate: 3.8813110836 },
		PHP: { symbol: "₱", usdRate: 58.0297667423 },
		PKR: { symbol: "Rs ", usdRate: 278.3754790352 },
		PLN: { symbol: "", usdRate: 3.914732913 },
		PYG: { symbol: "", usdRate: 7535.3831724427 },
		RON: { symbol: "", usdRate: 4.5806045182 },
		RSD: { symbol: "", usdRate: 107.8231150762 },
		RUB: { symbol: "", usdRate: 90.2004330641 },
		RWF: { symbol: "RF ", usdRate: 1313.4463794137 },
		SBD: { symbol: "$", usdRate: 8.3122818856 },
		SCR: { symbol: "Rs ", usdRate: 13.6210914936 },
		SDG: { symbol: "", usdRate: 600.9604023697 },
		SEK: { symbol: "", usdRate: 10.5723307312 },
		SGD: { symbol: "$", usdRate: 1.3483988714 },
		SHP: { symbol: "£", usdRate: 0.7834465395 },
		SLL: { symbol: "Le ", usdRate: 22499.7971393972 },
		SOS: { symbol: "", usdRate: 570.3525838195 },
		SRD: { symbol: "", usdRate: 32.4886026482 },
		SYP: { symbol: "", usdRate: 13001.8317357287 },
		SZL: { symbol: "E ", usdRate: 18.2779611386 },
		THB: { symbol: "", usdRate: 36.5807175596 },
		TJS: { symbol: "", usdRate: 10.7888855801 },
		TMT: { symbol: "", usdRate: 3.5035045038 },
		TND: { symbol: "", usdRate: 3.1101514486 },
		TOP: { symbol: "T$", usdRate: 2.362756232 },
		TRY: { symbol: "", usdRate: 32.2281477174 },
		TTD: { symbol: "$", usdRate: 6.7791952019 },
		TZS: { symbol: "TSh ", usdRate: 2600.0331821443 },
		UAH: { symbol: "", usdRate: 40.3999998964 },
		UGX: { symbol: "USh ", usdRate: 3813.319713181 },
		UYU: { symbol: "", usdRate: 38.5683398506 },
		UZS: { symbol: "", usdRate: 12643.342150621 },
		VES: { symbol: "", usdRate: 36.4652947701 },
		VND: { symbol: "₫", usdRate: 25480.6639823712 },
		VUV: { symbol: "VT ", usdRate: 119.3997948345 },
		WST: { symbol: "WS$", usdRate: 2.7440246826 },
		XAF: { symbol: "FCFA ", usdRate: 603.9051649099 },
		YER: { symbol: "", usdRate: 250.3522778966 },
		ZAR: { symbol: "R ", usdRate: 18.2779611386 },
		ZMW: { symbol: "K ", usdRate: 26.9433008802 },
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
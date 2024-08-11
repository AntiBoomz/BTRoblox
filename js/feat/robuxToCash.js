"use strict"

const RobuxToCash = {
	// cash is in cents
	
	UpdateDate: "August 12, 2024",
	
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
		
		AFN: { symbol: "", usdRate: 70.8258582626 },
		ALL: { symbol: "", usdRate: 91.6338557452 },
		AMD: { symbol: "", usdRate: 386.729883009 },
		AOA: { symbol: "", usdRate: 886.6103425872 },
		ARS: { symbol: "", usdRate: 936.4301164082 },
		AZN: { symbol: "", usdRate: 1.7009888065 },
		BAM: { symbol: "", usdRate: 1.7919503313 },
		BDT: { symbol: "", usdRate: 117.5498009247 },
		BGN: { symbol: "", usdRate: 1.7919503313 },
		BIF: { symbol: "FBu ", usdRate: 2881.3372836777 },
		BND: { symbol: "", usdRate: 1.3240194834 },
		BOB: { symbol: "", usdRate: 6.9098243704 },
		BTN: { symbol: "", usdRate: 83.9341845608 },
		BWP: { symbol: "P ", usdRate: 13.5553899086 },
		BYN: { symbol: "", usdRate: 3.270164442 },
		CDF: { symbol: "", usdRate: 2843.638500346 },
		CHF: { symbol: "", usdRate: 0.8656794626 },
		CLF: { symbol: "", usdRate: 0.0248022092 },
		CNY: { symbol: "CN¥", usdRate: 7.1659383354 },
		COP: { symbol: "COP", usdRate: 4068.0212503291 },
		CRC: { symbol: "", usdRate: 529.5005952753 },
		CUP: { symbol: "", usdRate: 23.9934675388 },
		CVE: { symbol: "", usdRate: 101.0304387541 },
		CZK: { symbol: "", usdRate: 23.1302947246 },
		DKK: { symbol: "", usdRate: 6.8378553801 },
		DOP: { symbol: "", usdRate: 59.6881686238 },
		DZD: { symbol: "", usdRate: 134.4154121083 },
		EGP: { symbol: "", usdRate: 49.2594145924 },
		ETB: { symbol: "", usdRate: 106.6391457503 },
		FJD: { symbol: "$", usdRate: 2.263317603 },
		FKP: { symbol: "£", usdRate: 0.7841758262 },
		GEL: { symbol: "", usdRate: 2.6930259251 },
		GHS: { symbol: "GH₵", usdRate: 15.6087165448 },
		GIP: { symbol: "£", usdRate: 0.7841758262 },
		GMD: { symbol: "D ", usdRate: 69.490851721 },
		GNF: { symbol: "", usdRate: 8620.7354897901 },
		GTQ: { symbol: "", usdRate: 7.7492050491 },
		GYD: { symbol: "$", usdRate: 208.9506823049 },
		HNL: { symbol: "", usdRate: 24.7450248241 },
		HRK: { symbol: "", usdRate: 6.9031816522 },
		HTG: { symbol: "", usdRate: 131.8791060199 },
		HUF: { symbol: "", usdRate: 361.7462978944 },
		IDR: { symbol: "", usdRate: 15953.8024509444 },
		ILS: { symbol: "₪", usdRate: 3.7459028575 },
		INR: { symbol: "₹", usdRate: 83.9341845608 },
		IQD: { symbol: "", usdRate: 1310.5355285395 },
		IRR: { symbol: "", usdRate: 41887.5538367599 },
		ISK: { symbol: "", usdRate: 138.4347087286 },
		JMD: { symbol: "$", usdRate: 156.9268354327 },
		KES: { symbol: "Ksh", usdRate: 128.9832646983 },
		KGS: { symbol: "", usdRate: 85.3984179142 },
		KHR: { symbol: "", usdRate: 4094.9293426734 },
		KMF: { symbol: "", usdRate: 450.7456029323 },
		KPW: { symbol: "", usdRate: 899.9704807417 },
		KWD: { symbol: "", usdRate: 0.3061997672 },
		KZT: { symbol: "", usdRate: 478.6605194041 },
		LAK: { symbol: "", usdRate: 22203.0202313097 },
		LKR: { symbol: "", usdRate: 300.0371074357 },
		LRD: { symbol: "$", usdRate: 195.3663932804 },
		LSL: { symbol: "", usdRate: 18.3171281856 },
		LYD: { symbol: "", usdRate: 4.8020392209 },
		MAD: { symbol: "", usdRate: 9.8255432951 },
		MDL: { symbol: "", usdRate: 17.638494921 },
		MGA: { symbol: "Ar ", usdRate: 4564.4634854108 },
		MKD: { symbol: "", usdRate: 56.3317511349 },
		MMK: { symbol: "", usdRate: 2099.0420341251 },
		MNT: { symbol: "", usdRate: 3400.2640582254 },
		MOP: { symbol: "MOP$", usdRate: 8.0313469481 },
		MUR: { symbol: "Rs ", usdRate: 46.3759830188 },
		MVR: { symbol: "", usdRate: 15.3542635348 },
		MWK: { symbol: "MK ", usdRate: 1732.3779375561 },
		MXV: { symbol: "", usdRate: 2.2921539376 },
		MYR: { symbol: "RM ", usdRate: 4.4178191497 },
		MZN: { symbol: "", usdRate: 63.585281616 },
		NAD: { symbol: "$", usdRate: 18.3171281856 },
		NGN: { symbol: "₦", usdRate: 1596.235266207 },
		NIO: { symbol: "", usdRate: 36.7767909076 },
		NOK: { symbol: "", usdRate: 10.8178133214 },
		NPR: { symbol: "", usdRate: 134.3576459357 },
		PEN: { symbol: "", usdRate: 3.729566841 },
		PGK: { symbol: "K ", usdRate: 3.8789743201 },
		PHP: { symbol: "₱", usdRate: 57.2346566964 },
		PKR: { symbol: "Rs ", usdRate: 278.8782060114 },
		PLN: { symbol: "", usdRate: 3.9597797707 },
		PYG: { symbol: "", usdRate: 7566.630217452 },
		RON: { symbol: "", usdRate: 4.5600387855 },
		RSD: { symbol: "", usdRate: 107.1374653961 },
		RUB: { symbol: "", usdRate: 88.5276485999 },
		RWF: { symbol: "RF ", usdRate: 1322.1481748524 },
		SBD: { symbol: "$", usdRate: 8.3541992126 },
		SCR: { symbol: "Rs ", usdRate: 13.7586503474 },
		SDG: { symbol: "", usdRate: 601.4079565811 },
		SEK: { symbol: "", usdRate: 10.5165127078 },
		SGD: { symbol: "$", usdRate: 1.3240194834 },
		SHP: { symbol: "£", usdRate: 0.7841758262 },
		SLL: { symbol: "Le ", usdRate: 22590.8402355954 },
		SOS: { symbol: "", usdRate: 570.3346640432 },
		SRD: { symbol: "", usdRate: 28.7914297743 },
		SYP: { symbol: "", usdRate: 13027.72442943 },
		SZL: { symbol: "E ", usdRate: 18.3171281856 },
		THB: { symbol: "", usdRate: 35.2413485338 },
		TJS: { symbol: "", usdRate: 10.5447589255 },
		TMT: { symbol: "", usdRate: 3.5035744318 },
		TND: { symbol: "", usdRate: 3.091026448 },
		TOP: { symbol: "T$", usdRate: 2.3720981573 },
		TRY: { symbol: "", usdRate: 33.5336847793 },
		TTD: { symbol: "$", usdRate: 6.7881407814 },
		TZS: { symbol: "TSh ", usdRate: 2694.3580506236 },
		UAH: { symbol: "", usdRate: 41.1474288564 },
		UGX: { symbol: "USh ", usdRate: 3729.326261987 },
		UYU: { symbol: "", usdRate: 40.3156883941 },
		UZS: { symbol: "", usdRate: 12697.6018579261 },
		VES: { symbol: "", usdRate: 36.6197583173 },
		VND: { symbol: "₫", usdRate: 25249.1839018553 },
		VUV: { symbol: "VT ", usdRate: 119.9126875386 },
		WST: { symbol: "WS$", usdRate: 2.7523845906 },
		XAF: { symbol: "FCFA ", usdRate: 600.9941372431 },
		YER: { symbol: "", usdRate: 250.2087375501 },
		ZAR: { symbol: "R ", usdRate: 18.3171281856 },
		ZMW: { symbol: "K ", usdRate: 26.2448260684 },
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
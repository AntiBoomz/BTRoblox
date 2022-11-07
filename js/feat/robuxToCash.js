"use strict"

const RobuxToCash = {
	// cash is in cents
	
	UpdateDate: "November 7, 2022",
	
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
		
		AFN: { symbol: "", usdRate: 88.2831752417 },
		ALL: { symbol: "", usdRate: 117.1700522208 },
		AMD: { symbol: "", usdRate: 387.0675255264 },
		AOA: { symbol: "", usdRate: 484.9956580759 },
		ARS: { symbol: "", usdRate: 159.3304068133 },
		AZN: { symbol: "", usdRate: 1.6997331879 },
		BAM: { symbol: "", usdRate: 1.9586984214 },
		BDT: { symbol: "", usdRate: 101.0848876923 },
		BGN: { symbol: "", usdRate: 1.9586984214 },
		BIF: { symbol: "FBu ", usdRate: 2038.833023355 },
		BND: { symbol: "", usdRate: 1.4036899994 },
		BOB: { symbol: "", usdRate: 6.8218650967 },
		BTN: { symbol: "", usdRate: 81.9010703782 },
		BWP: { symbol: "P ", usdRate: 13.2285546878 },
		BYN: { symbol: "", usdRate: 2.5332718132 },
		CDF: { symbol: "", usdRate: 2040.7694026857 },
		CHF: { symbol: "", usdRate: 0.9905635898 },
		CLF: { symbol: "", usdRate: 0.0380809882 },
		CNY: { symbol: "CN¥", usdRate: 7.2232204082 },
		COP: { symbol: "COP", usdRate: 5101.7729699622 },
		CRC: { symbol: "", usdRate: 613.6262646929 },
		CUP: { symbol: "", usdRate: 23.6316033455 },
		CVE: { symbol: "", usdRate: 110.4317220435 },
		CZK: { symbol: "", usdRate: 24.3263104819 },
		DKK: { symbol: "", usdRate: 7.4504240763 },
		DOP: { symbol: "", usdRate: 53.4175314391 },
		DZD: { symbol: "", usdRate: 140.2759172869 },
		EGP: { symbol: "", usdRate: 24.3528045574 },
		ETB: { symbol: "", usdRate: 52.5767533418 },
		FJD: { symbol: "$", usdRate: 2.2758576026 },
		FKP: { symbol: "£", usdRate: 0.8731768082 },
		GEL: { symbol: "", usdRate: 2.7246651385 },
		GHS: { symbol: "GH₵", usdRate: 13.8826148023 },
		GIP: { symbol: "£", usdRate: 0.8731768082 },
		GMD: { symbol: "D ", usdRate: 60.9733594387 },
		GNF: { symbol: "", usdRate: 8500.8999980865 },
		GTQ: { symbol: "", usdRate: 7.7164246711 },
		GYD: { symbol: "$", usdRate: 206.0827619175 },
		HNL: { symbol: "", usdRate: 24.3813584708 },
		HRK: { symbol: "", usdRate: 7.5491478197 },
		HTG: { symbol: "", usdRate: 129.2968785081 },
		HUF: { symbol: "", usdRate: 400.8315251394 },
		IDR: { symbol: "", usdRate: 15665.5613729283 },
		ILS: { symbol: "₪", usdRate: 3.5453410547 },
		INR: { symbol: "₹", usdRate: 81.9010703782 },
		IQD: { symbol: "", usdRate: 1459.0173656137 },
		IRR: { symbol: "", usdRate: 42235.1807012038 },
		ISK: { symbol: "", usdRate: 146.1466276992 },
		JMD: { symbol: "$", usdRate: 151.6809391056 },
		KES: { symbol: "Ksh", usdRate: 121.6501418615 },
		KGS: { symbol: "", usdRate: 83.9972264941 },
		KHR: { symbol: "", usdRate: 4091.361518441 },
		KMF: { symbol: "", usdRate: 492.6892701765 },
		KPW: { symbol: "", usdRate: 900.0176971494 },
		KWD: { symbol: "", usdRate: 0.3096816765 },
		KZT: { symbol: "", usdRate: 463.965185022 },
		LAK: { symbol: "", usdRate: 17132.0651770446 },
		LKR: { symbol: "", usdRate: 364.5021609158 },
		LRD: { symbol: "$", usdRate: 153.7384753871 },
		LSL: { symbol: "", usdRate: 17.7357854792 },
		LYD: { symbol: "", usdRate: 4.9537129968 },
		MAD: { symbol: "", usdRate: 10.9246645342 },
		MDL: { symbol: "", usdRate: 19.0881684488 },
		MGA: { symbol: "Ar ", usdRate: 4220.8645465253 },
		MKD: { symbol: "", usdRate: 61.7874039775 },
		MMK: { symbol: "", usdRate: 2073.5931522928 },
		MNT: { symbol: "", usdRate: 3413.2891832361 },
		MOP: { symbol: "MOP$", usdRate: 8.0853644865 },
		MUR: { symbol: "Rs ", usdRate: 44.8226618093 },
		MVR: { symbol: "", usdRate: 15.4155080611 },
		MWK: { symbol: "MK ", usdRate: 1013.2536409734 },
		MXV: { symbol: "", usdRate: 2.7667184549 },
		MYR: { symbol: "RM ", usdRate: 4.7402140043 },
		MZN: { symbol: "", usdRate: 63.8511396677 },
		NAD: { symbol: "$", usdRate: 17.7357854792 },
		NGN: { symbol: "₦", usdRate: 439.7073592406 },
		NIO: { symbol: "", usdRate: 35.4504293595 },
		NOK: { symbol: "", usdRate: 10.2951443618 },
		NPR: { symbol: "", usdRate: 131.1031384079 },
		PEN: { symbol: "", usdRate: 3.9491005125 },
		PGK: { symbol: "K ", usdRate: 3.520469894 },
		PHP: { symbol: "₱", usdRate: 58.4043169211 },
		PKR: { symbol: "Rs ", usdRate: 221.6351219554 },
		PLN: { symbol: "", usdRate: 4.6925825652 },
		PYG: { symbol: "", usdRate: 7157.4274198532 },
		RON: { symbol: "", usdRate: 4.8946290225 },
		RSD: { symbol: "", usdRate: 117.4819803553 },
		RUB: { symbol: "", usdRate: 61.1682456144 },
		RWF: { symbol: "RF ", usdRate: 1051.4970299369 },
		SBD: { symbol: "$", usdRate: 8.2101733391 },
		SCR: { symbol: "Rs ", usdRate: 13.0721144009 },
		SDG: { symbol: "", usdRate: 567.8894905767 },
		SEK: { symbol: "", usdRate: 10.8682651543 },
		SGD: { symbol: "$", usdRate: 1.4036899994 },
		SHP: { symbol: "£", usdRate: 0.8731768082 },
		SLL: { symbol: "Le ", usdRate: 17665.4394805682 },
		SOS: { symbol: "", usdRate: 557.5357155704 },
		SRD: { symbol: "", usdRate: 29.7561502237 },
		SYP: { symbol: "", usdRate: 2512.5613761808 },
		SZL: { symbol: "E ", usdRate: 17.7357854792 },
		THB: { symbol: "", usdRate: 37.3457306253 },
		TJS: { symbol: "", usdRate: 10.0503610503 },
		TMT: { symbol: "", usdRate: 3.4935454039 },
		TND: { symbol: "", usdRate: 3.2104687524 },
		TOP: { symbol: "T$", usdRate: 2.4195251461 },
		TRY: { symbol: "", usdRate: 18.5788356064 },
		TTD: { symbol: "$", usdRate: 6.6918969615 },
		TZS: { symbol: "TSh ", usdRate: 2331.0978739691 },
		UAH: { symbol: "", usdRate: 36.9426860896 },
		UGX: { symbol: "USh ", usdRate: 3779.4487228987 },
		UYU: { symbol: "", usdRate: 39.8917717802 },
		UZS: { symbol: "", usdRate: 11141.9378742963 },
		VES: { symbol: "", usdRate: 8.7587775149 },
		VND: { symbol: "₫", usdRate: 24931.7025375076 },
		VUV: { symbol: "VT ", usdRate: 122.815344762 },
		WST: { symbol: "WS$", usdRate: 2.7951935336 },
		XAF: { symbol: "FCFA ", usdRate: 656.9190269019 },
		YER: { symbol: "", usdRate: 250.2008648725 },
		ZAR: { symbol: "R ", usdRate: 17.7357854792 },
		ZMW: { symbol: "K ", usdRate: 16.3148833563 },
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
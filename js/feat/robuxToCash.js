"use strict"

const RobuxToCash = {
	// cash is in cents
	
	UpdateDate: "January 28, 2023",
	
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
		
		AFN: { symbol: "", usdRate: 89.1012423358 },
		ALL: { symbol: "", usdRate: 107.3319386573 },
		AMD: { symbol: "", usdRate: 394.1894265415 },
		AOA: { symbol: "", usdRate: 504.3704344231 },
		ARS: { symbol: "", usdRate: 185.4276896151 },
		AZN: { symbol: "", usdRate: 1.7006396607 },
		BAM: { symbol: "", usdRate: 1.7994420191 },
		BDT: { symbol: "", usdRate: 105.7905329101 },
		BGN: { symbol: "", usdRate: 1.7994420191 },
		BIF: { symbol: "FBu ", usdRate: 2074.8953227977 },
		BND: { symbol: "", usdRate: 1.3127346759 },
		BOB: { symbol: "", usdRate: 6.9060835955 },
		BTN: { symbol: "", usdRate: 81.4984998403 },
		BWP: { symbol: "P ", usdRate: 12.766806465 },
		BYN: { symbol: "", usdRate: 2.5247964095 },
		CDF: { symbol: "", usdRate: 2001.6213946798 },
		CHF: { symbol: "", usdRate: 0.9210391341 },
		CLF: { symbol: "", usdRate: 0.0380809882 },
		CNY: { symbol: "CN¥", usdRate: 6.7830913254 },
		COP: { symbol: "COP", usdRate: 4534.2272865184 },
		CRC: { symbol: "", usdRate: 562.4379552853 },
		CUP: { symbol: "", usdRate: 23.9823184525 },
		CVE: { symbol: "", usdRate: 101.4528212837 },
		CZK: { symbol: "", usdRate: 21.9116265605 },
		DKK: { symbol: "", usdRate: 6.843411751 },
		DOP: { symbol: "", usdRate: 56.7867621734 },
		DZD: { symbol: "", usdRate: 135.7114325601 },
		EGP: { symbol: "", usdRate: 29.8759488474 },
		ETB: { symbol: "", usdRate: 53.6610292436 },
		FJD: { symbol: "$", usdRate: 2.1556158782 },
		FKP: { symbol: "£", usdRate: 0.8069846273 },
		GEL: { symbol: "", usdRate: 2.6394846978 },
		GHS: { symbol: "GH₵", usdRate: 12.3238743982 },
		GIP: { symbol: "£", usdRate: 0.8069846273 },
		GMD: { symbol: "D ", usdRate: 61.7891316346 },
		GNF: { symbol: "", usdRate: 8607.0654824079 },
		GTQ: { symbol: "", usdRate: 7.8465111378 },
		GYD: { symbol: "$", usdRate: 210.4106009389 },
		HNL: { symbol: "", usdRate: 24.6578442625 },
		HRK: { symbol: "", usdRate: 6.9320420963 },
		HTG: { symbol: "", usdRate: 149.1154248531 },
		HUF: { symbol: "", usdRate: 359.2998951171 },
		IDR: { symbol: "", usdRate: 14968.0157429751 },
		ILS: { symbol: "₪", usdRate: 3.4407878147 },
		INR: { symbol: "₹", usdRate: 81.4984998403 },
		IQD: { symbol: "", usdRate: 1459.6048552609 },
		IRR: { symbol: "", usdRate: 42165.4138352027 },
		ISK: { symbol: "", usdRate: 142.7091621326 },
		JMD: { symbol: "$", usdRate: 153.6272213362 },
		KES: { symbol: "Ksh", usdRate: 124.4520352383 },
		KGS: { symbol: "", usdRate: 86.1499463145 },
		KHR: { symbol: "", usdRate: 4102.7136915831 },
		KMF: { symbol: "", usdRate: 452.630055483 },
		KPW: { symbol: "", usdRate: 899.9987604049 },
		KWD: { symbol: "", usdRate: 0.3054250652 },
		KZT: { symbol: "", usdRate: 460.7028246024 },
		LAK: { symbol: "", usdRate: 16852.4618599872 },
		LKR: { symbol: "", usdRate: 363.9860888357 },
		LRD: { symbol: "$", usdRate: 156.7262724674 },
		LSL: { symbol: "", usdRate: 17.2034890351 },
		LYD: { symbol: "", usdRate: 4.7541816349 },
		MAD: { symbol: "", usdRate: 10.177995534 },
		MDL: { symbol: "", usdRate: 18.782890409 },
		MGA: { symbol: "Ar ", usdRate: 4264.6898103242 },
		MKD: { symbol: "", usdRate: 56.6375806665 },
		MMK: { symbol: "", usdRate: 2099.5568167545 },
		MNT: { symbol: "", usdRate: 3488.0638318468 },
		MOP: { symbol: "MOP$", usdRate: 8.0640320828 },
		MUR: { symbol: "Rs ", usdRate: 45.1976393086 },
		MVR: { symbol: "", usdRate: 15.3907230059 },
		MWK: { symbol: "MK ", usdRate: 1026.2136915164 },
		MXV: { symbol: "", usdRate: 2.7586860657 },
		MYR: { symbol: "RM ", usdRate: 4.244286967 },
		MZN: { symbol: "", usdRate: 63.7303231237 },
		NAD: { symbol: "$", usdRate: 17.2034890351 },
		NGN: { symbol: "₦", usdRate: 460.2740562319 },
		NIO: { symbol: "", usdRate: 36.5274190694 },
		NOK: { symbol: "", usdRate: 9.8283891398 },
		NPR: { symbol: "", usdRate: 130.4587236194 },
		PEN: { symbol: "", usdRate: 3.8338808388 },
		PGK: { symbol: "K ", usdRate: 3.5201262106 },
		PHP: { symbol: "₱", usdRate: 54.4542827103 },
		PKR: { symbol: "Rs ", usdRate: 262.8409725666 },
		PLN: { symbol: "", usdRate: 4.3303453443 },
		PYG: { symbol: "", usdRate: 7382.4077424883 },
		RON: { symbol: "", usdRate: 4.5068098111 },
		RSD: { symbol: "", usdRate: 107.9611140862 },
		RUB: { symbol: "", usdRate: 70.7108776426 },
		RWF: { symbol: "RF ", usdRate: 1080.2516921949 },
		SBD: { symbol: "$", usdRate: 8.2135881702 },
		SCR: { symbol: "Rs ", usdRate: 14.1176226857 },
		SDG: { symbol: "", usdRate: 577.6642711291 },
		SEK: { symbol: "", usdRate: 10.3076261434 },
		SGD: { symbol: "$", usdRate: 1.3127346759 },
		SHP: { symbol: "£", usdRate: 0.8069846273 },
		SLL: { symbol: "Le ", usdRate: 19405.1464054516 },
		SOS: { symbol: "", usdRate: 568.6284475774 },
		SRD: { symbol: "", usdRate: 31.9899175622 },
		SYP: { symbol: "", usdRate: 2512.5272920105 },
		SZL: { symbol: "E ", usdRate: 17.2034890351 },
		THB: { symbol: "", usdRate: 32.8043116895 },
		TJS: { symbol: "", usdRate: 10.2763056112 },
		TMT: { symbol: "", usdRate: 3.4956688353 },
		TND: { symbol: "", usdRate: 3.0508198173 },
		TOP: { symbol: "T$", usdRate: 2.3094849559 },
		TRY: { symbol: "", usdRate: 18.8104934901 },
		TTD: { symbol: "$", usdRate: 6.7884512168 },
		TZS: { symbol: "TSh ", usdRate: 2339.1470618179 },
		UAH: { symbol: "", usdRate: 36.7580735306 },
		UGX: { symbol: "USh ", usdRate: 3682.0934995269 },
		UYU: { symbol: "", usdRate: 39.1031214697 },
		UZS: { symbol: "", usdRate: 11340.0033977789 },
		VES: { symbol: "", usdRate: 21.8061199296 },
		VND: { symbol: "₫", usdRate: 23461.5454214743 },
		VUV: { symbol: "VT ", usdRate: 114.2829702307 },
		WST: { symbol: "WS$", usdRate: 2.6205265672 },
		XAF: { symbol: "FCFA ", usdRate: 603.5067406439 },
		YER: { symbol: "", usdRate: 250.3772690437 },
		ZAR: { symbol: "R ", usdRate: 17.2034890351 },
		ZMW: { symbol: "K ", usdRate: 18.7824321422 },
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
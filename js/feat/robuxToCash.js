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
		
		AFN: { symbol: "", usdRate: 88.2902329791 },
		ALL: { symbol: "", usdRate: 117.181461065 },
		AMD: { symbol: "", usdRate: 387.5115257053 },
		AOA: { symbol: "", usdRate: 486.9799165247 },
		ARS: { symbol: "", usdRate: 158.4555281281 },
		AZN: { symbol: "", usdRate: 1.7024397498 },
		BAM: { symbol: "", usdRate: 1.9682385433 },
		BDT: { symbol: "", usdRate: 100.726097512 },
		BGN: { symbol: "", usdRate: 1.9682385433 },
		BIF: { symbol: "FBu ", usdRate: 2038.7473635524 },
		BND: { symbol: "", usdRate: 1.4082914082 },
		BOB: { symbol: "", usdRate: 6.8224669364 },
		BTN: { symbol: "", usdRate: 82.0785264497 },
		BWP: { symbol: "P ", usdRate: 13.1694769682 },
		BYN: { symbol: "", usdRate: 2.5323115708 },
		CDF: { symbol: "", usdRate: 2036.5339321871 },
		CHF: { symbol: "", usdRate: 0.9961241057 },
		CLF: { symbol: "", usdRate: 0.0380809882 },
		CNY: { symbol: "CN¥", usdRate: 7.1916944851 },
		COP: { symbol: "COP", usdRate: 5088.1910365486 },
		CRC: { symbol: "", usdRate: 614.0835243086 },
		CUP: { symbol: "", usdRate: 23.6048829234 },
		CVE: { symbol: "", usdRate: 110.9695956011 },
		CZK: { symbol: "", usdRate: 24.5463121996 },
		DKK: { symbol: "", usdRate: 7.4884338092 },
		DOP: { symbol: "", usdRate: 53.2458277088 },
		DZD: { symbol: "", usdRate: 139.6267861499 },
		EGP: { symbol: "", usdRate: 24.2084399939 },
		ETB: { symbol: "", usdRate: 52.3806619645 },
		FJD: { symbol: "$", usdRate: 2.2762579438 },
		FKP: { symbol: "£", usdRate: 0.8822023293 },
		GEL: { symbol: "", usdRate: 2.7346672734 },
		GHS: { symbol: "GH₵", usdRate: 13.7159159005 },
		GIP: { symbol: "£", usdRate: 0.8822023293 },
		GMD: { symbol: "D ", usdRate: 60.97333005 },
		GNF: { symbol: "", usdRate: 8521.3240108311 },
		GTQ: { symbol: "", usdRate: 7.7184032423 },
		GYD: { symbol: "$", usdRate: 206.0939313718 },
		HNL: { symbol: "", usdRate: 24.3181756428 },
		HRK: { symbol: "", usdRate: 7.577345576 },
		HTG: { symbol: "", usdRate: 129.3472129284 },
		HUF: { symbol: "", usdRate: 405.2896416337 },
		IDR: { symbol: "", usdRate: 15631.019620521 },
		ILS: { symbol: "₪", usdRate: 3.5403609084 },
		INR: { symbol: "₹", usdRate: 82.0785264497 },
		IQD: { symbol: "", usdRate: 1459.6640994762 },
		IRR: { symbol: "", usdRate: 42251.433651365 },
		ISK: { symbol: "", usdRate: 146.1106561535 },
		JMD: { symbol: "$", usdRate: 151.6914098375 },
		KES: { symbol: "Ksh", usdRate: 119.6021172276 },
		KGS: { symbol: "", usdRate: 83.9975510813 },
		KHR: { symbol: "", usdRate: 4094.6405567709 },
		KMF: { symbol: "", usdRate: 495.0889840056 },
		KPW: { symbol: "", usdRate: 899.9754074825 },
		KWD: { symbol: "", usdRate: 0.3100014121 },
		KZT: { symbol: "", usdRate: 465.1027124227 },
		LAK: { symbol: "", usdRate: 16936.1852517289 },
		LKR: { symbol: "", usdRate: 364.4999970571 },
		LRD: { symbol: "$", usdRate: 153.7239267397 },
		LSL: { symbol: "", usdRate: 18.0078516901 },
		LYD: { symbol: "", usdRate: 4.9470813959 },
		MAD: { symbol: "", usdRate: 10.9313066804 },
		MDL: { symbol: "", usdRate: 19.0237584922 },
		MGA: { symbol: "Ar ", usdRate: 4222.1614964648 },
		MKD: { symbol: "", usdRate: 61.9927719185 },
		MMK: { symbol: "", usdRate: 2076.3898369404 },
		MNT: { symbol: "", usdRate: 3404.7968185606 },
		MOP: { symbol: "MOP$", usdRate: 8.0855511388 },
		MUR: { symbol: "Rs ", usdRate: 44.2589244893 },
		MVR: { symbol: "", usdRate: 15.4743608833 },
		MWK: { symbol: "MK ", usdRate: 1009.7666478186 },
		MXV: { symbol: "", usdRate: 2.7761424548 },
		MYR: { symbol: "RM ", usdRate: 4.7480926619 },
		MZN: { symbol: "", usdRate: 63.8043371735 },
		NAD: { symbol: "$", usdRate: 18.0078516901 },
		NGN: { symbol: "₦", usdRate: 439.1782041038 },
		NIO: { symbol: "", usdRate: 35.319186337 },
		NOK: { symbol: "", usdRate: 10.2637217158 },
		NPR: { symbol: "", usdRate: 131.3872012143 },
		PEN: { symbol: "", usdRate: 3.9452478468 },
		PGK: { symbol: "K ", usdRate: 3.508751486 },
		PHP: { symbol: "₱", usdRate: 58.4375791891 },
		PKR: { symbol: "Rs ", usdRate: 221.6400748241 },
		PLN: { symbol: "", usdRate: 4.7201570292 },
		PYG: { symbol: "", usdRate: 7167.3073039751 },
		RON: { symbol: "", usdRate: 4.9081249837 },
		RSD: { symbol: "", usdRate: 117.8100741976 },
		RUB: { symbol: "", usdRate: 61.7638162037 },
		RWF: { symbol: "RF ", usdRate: 1048.2151415554 },
		SBD: { symbol: "$", usdRate: 8.2304401023 },
		SCR: { symbol: "Rs ", usdRate: 14.5211772601 },
		SDG: { symbol: "", usdRate: 567.8318275749 },
		SEK: { symbol: "", usdRate: 10.9296511959 },
		SGD: { symbol: "$", usdRate: 1.4082914082 },
		SHP: { symbol: "£", usdRate: 0.8822023293 },
		SLL: { symbol: "Le ", usdRate: 17664.6526044822 },
		SOS: { symbol: "", usdRate: 557.6053965302 },
		SRD: { symbol: "", usdRate: 29.7168543737 },
		SYP: { symbol: "", usdRate: 2511.8692497425 },
		SZL: { symbol: "E ", usdRate: 18.0078516901 },
		THB: { symbol: "", usdRate: 37.4392882542 },
		TJS: { symbol: "", usdRate: 10.1160001482 },
		TMT: { symbol: "", usdRate: 3.4935526937 },
		TND: { symbol: "", usdRate: 3.2422431982 },
		TOP: { symbol: "T$", usdRate: 2.4279586093 },
		TRY: { symbol: "", usdRate: 18.6112918378 },
		TTD: { symbol: "$", usdRate: 6.6758674848 },
		TZS: { symbol: "TSh ", usdRate: 2330.6877623932 },
		UAH: { symbol: "", usdRate: 36.9563054453 },
		UGX: { symbol: "USh ", usdRate: 3788.7129639091 },
		UYU: { symbol: "", usdRate: 40.0449271566 },
		UZS: { symbol: "", usdRate: 11109.4541485779 },
		VES: { symbol: "", usdRate: 8.7433017765 },
		VND: { symbol: "₫", usdRate: 24955.8494268561 },
		VUV: { symbol: "VT ", usdRate: 124.1478598473 },
		WST: { symbol: "WS$", usdRate: 2.8065908608 },
		XAF: { symbol: "FCFA ", usdRate: 660.1186453408 },
		YER: { symbol: "", usdRate: 250.1924597448 },
		ZAR: { symbol: "R ", usdRate: 18.0078516901 },
		ZMW: { symbol: "K ", usdRate: 16.2787522148 },
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
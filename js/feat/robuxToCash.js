"use strict"

const RobuxToCash = {
	// cash is in cents
	
	UpdateDate: "March 21, 2024",
	
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
		
		AFN: { symbol: "", usdRate: 71.1856396672 },
		ALL: { symbol: "", usdRate: 94.7241244643 },
		AMD: { symbol: "", usdRate: 397.8310819326 },
		AOA: { symbol: "", usdRate: 851.3917462739 },
		ARS: { symbol: "", usdRate: 854.1894113174 },
		AZN: { symbol: "", usdRate: 1.7006299935 },
		BAM: { symbol: "", usdRate: 1.8009290381 },
		BDT: { symbol: "", usdRate: 109.7436342119 },
		BGN: { symbol: "", usdRate: 1.8009290381 },
		BIF: { symbol: "FBu ", usdRate: 2859.7432450697 },
		BND: { symbol: "", usdRate: 1.3439633599 },
		BOB: { symbol: "", usdRate: 6.9032509445 },
		BTN: { symbol: "", usdRate: 83.226398485 },
		BWP: { symbol: "P ", usdRate: 13.6474955544 },
		BYN: { symbol: "", usdRate: 3.2649413568 },
		CDF: { symbol: "", usdRate: 2773.7718159275 },
		CHF: { symbol: "", usdRate: 0.8975544846 },
		CLF: { symbol: "", usdRate: 0.0262099586 },
		CNY: { symbol: "CN¥", usdRate: 7.1993373797 },
		COP: { symbol: "COP", usdRate: 3903.3024663096 },
		CRC: { symbol: "", usdRate: 503.5689846029 },
		CUP: { symbol: "", usdRate: 23.971226008 },
		CVE: { symbol: "", usdRate: 101.536659645 },
		CZK: { symbol: "", usdRate: 23.3196578192 },
		DKK: { symbol: "", usdRate: 6.8675448988 },
		DOP: { symbol: "", usdRate: 58.6005035481 },
		DZD: { symbol: "", usdRate: 134.649676555 },
		EGP: { symbol: "", usdRate: 46.6485834303 },
		ETB: { symbol: "", usdRate: 56.3864287258 },
		FJD: { symbol: "$", usdRate: 2.2706787799 },
		FKP: { symbol: "£", usdRate: 0.7900311434 },
		GEL: { symbol: "", usdRate: 2.6999345081 },
		GHS: { symbol: "GH₵", usdRate: 12.9918617163 },
		GIP: { symbol: "£", usdRate: 0.7900311434 },
		GMD: { symbol: "D ", usdRate: 67.9249269308 },
		GNF: { symbol: "", usdRate: 8580.5624054325 },
		GTQ: { symbol: "", usdRate: 7.7821162045 },
		GYD: { symbol: "$", usdRate: 208.9190783255 },
		HNL: { symbol: "", usdRate: 24.6473467902 },
		HRK: { symbol: "", usdRate: 6.9377705822 },
		HTG: { symbol: "", usdRate: 132.434109555 },
		HUF: { symbol: "", usdRate: 363.5677439403 },
		IDR: { symbol: "", usdRate: 15711.7746152974 },
		ILS: { symbol: "₪", usdRate: 3.6094433724 },
		INR: { symbol: "₹", usdRate: 83.226398485 },
		IQD: { symbol: "", usdRate: 1309.4493361082 },
		IRR: { symbol: "", usdRate: 42239.598371003 },
		ISK: { symbol: "", usdRate: 136.7450078241 },
		JMD: { symbol: "$", usdRate: 153.5625401055 },
		KES: { symbol: "Ksh", usdRate: 132.7905614905 },
		KGS: { symbol: "", usdRate: 89.5094624952 },
		KHR: { symbol: "", usdRate: 4014.9760936132 },
		KMF: { symbol: "", usdRate: 453.0040989215 },
		KPW: { symbol: "", usdRate: 899.9968940894 },
		KWD: { symbol: "", usdRate: 0.3075824976 },
		KZT: { symbol: "", usdRate: 450.4335580823 },
		LAK: { symbol: "", usdRate: 21093.5671336614 },
		LKR: { symbol: "", usdRate: 303.9381937676 },
		LRD: { symbol: "$", usdRate: 192.9440672407 },
		LSL: { symbol: "", usdRate: 18.8227191982 },
		LYD: { symbol: "", usdRate: 4.7846939583 },
		MAD: { symbol: "", usdRate: 10.0504611072 },
		MDL: { symbol: "", usdRate: 17.6959798487 },
		MGA: { symbol: "Ar ", usdRate: 4448.1576101378 },
		MKD: { symbol: "", usdRate: 56.5404053352 },
		MMK: { symbol: "", usdRate: 2097.7609577096 },
		MNT: { symbol: "", usdRate: 3399.5064288331 },
		MOP: { symbol: "MOP$", usdRate: 8.0561842715 },
		MUR: { symbol: "Rs ", usdRate: 45.9884167544 },
		MVR: { symbol: "", usdRate: 15.3927087349 },
		MWK: { symbol: "MK ", usdRate: 1682.6996712549 },
		MXV: { symbol: "", usdRate: 2.0671475328 },
		MYR: { symbol: "RM ", usdRate: 4.7134203616 },
		MZN: { symbol: "", usdRate: 63.8794352339 },
		NAD: { symbol: "$", usdRate: 18.8227191982 },
		NGN: { symbol: "₦", usdRate: 1409.3036027873 },
		NIO: { symbol: "", usdRate: 36.5401790841 },
		NOK: { symbol: "", usdRate: 10.666846583 },
		NPR: { symbol: "", usdRate: 133.2246573749 },
		PEN: { symbol: "", usdRate: 3.6898112727 },
		PGK: { symbol: "K ", usdRate: 3.7707331038 },
		PHP: { symbol: "₱", usdRate: 56.0127082366 },
		PKR: { symbol: "Rs ", usdRate: 278.5196367207 },
		PLN: { symbol: "", usdRate: 3.9664993665 },
		PYG: { symbol: "", usdRate: 7301.9819393286 },
		RON: { symbol: "", usdRate: 4.579065294 },
		RSD: { symbol: "", usdRate: 107.9365486874 },
		RUB: { symbol: "", usdRate: 91.70280133 },
		RWF: { symbol: "RF ", usdRate: 1275.202090624 },
		SBD: { symbol: "$", usdRate: 8.2303858996 },
		SCR: { symbol: "Rs ", usdRate: 13.6717726069 },
		SDG: { symbol: "", usdRate: 585.4937672212 },
		SEK: { symbol: "", usdRate: 10.4672561002 },
		SGD: { symbol: "$", usdRate: 1.3439633599 },
		SHP: { symbol: "£", usdRate: 0.7900311434 },
		SLL: { symbol: "Le ", usdRate: 22647.2083978615 },
		SOS: { symbol: "", usdRate: 566.0348144227 },
		SRD: { symbol: "", usdRate: 35.1689830152 },
		SYP: { symbol: "", usdRate: 13001.8508862832 },
		SZL: { symbol: "E ", usdRate: 18.8227191982 },
		THB: { symbol: "", usdRate: 36.3092047378 },
		TJS: { symbol: "", usdRate: 10.9567640125 },
		TMT: { symbol: "", usdRate: 3.4937006464 },
		TND: { symbol: "", usdRate: 3.1087084344 },
		TOP: { symbol: "T$", usdRate: 2.3730150671 },
		TRY: { symbol: "", usdRate: 31.9863235197 },
		TTD: { symbol: "$", usdRate: 6.7846257975 },
		TZS: { symbol: "TSh ", usdRate: 2535.5915466962 },
		UAH: { symbol: "", usdRate: 38.9009467135 },
		UGX: { symbol: "USh ", usdRate: 3886.8704954153 },
		UYU: { symbol: "", usdRate: 38.4591805391 },
		UZS: { symbol: "", usdRate: 12597.5142378983 },
		VES: { symbol: "", usdRate: 36.2488637276 },
		VND: { symbol: "₫", usdRate: 24936.9001497234 },
		VUV: { symbol: "VT ", usdRate: 120.0406845735 },
		WST: { symbol: "WS$", usdRate: 2.7517416427 },
		XAF: { symbol: "FCFA ", usdRate: 604.0054652287 },
		YER: { symbol: "", usdRate: 250.2438516111 },
		ZAR: { symbol: "R ", usdRate: 18.8227191982 },
		ZMW: { symbol: "K ", usdRate: 26.2654789567 },
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
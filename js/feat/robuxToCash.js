"use strict"

const RobuxToCash = {
	// cash is in cents
	
	UpdateDate: "March 6, 2023",
	
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
		
		AFN: { symbol: "", usdRate: 88.8574862299 },
		ALL: { symbol: "", usdRate: 107.4325332366 },
		AMD: { symbol: "", usdRate: 386.546211552 },
		AOA: { symbol: "", usdRate: 506.6449743857 },
		ARS: { symbol: "", usdRate: 199.3466230683 },
		AZN: { symbol: "", usdRate: 1.7019140186 },
		BAM: { symbol: "", usdRate: 1.8325087869 },
		BDT: { symbol: "", usdRate: 105.0271292042 },
		BGN: { symbol: "", usdRate: 1.8325087869 },
		BIF: { symbol: "FBu ", usdRate: 2074.4829971974 },
		BND: { symbol: "", usdRate: 1.345787182 },
		BOB: { symbol: "", usdRate: 6.9113525856 },
		BTN: { symbol: "", usdRate: 81.7987244894 },
		BWP: { symbol: "P ", usdRate: 13.2492139899 },
		BYN: { symbol: "", usdRate: 2.5206943982 },
		CDF: { symbol: "", usdRate: 2048.4564436022 },
		CHF: { symbol: "", usdRate: 0.9322648755 },
		CLF: { symbol: "", usdRate: 0.0224482559 },
		CNY: { symbol: "CN¥", usdRate: 6.9301379821 },
		COP: { symbol: "COP", usdRate: 4706.2129787945 },
		CRC: { symbol: "", usdRate: 555.9970093439 },
		CUP: { symbol: "", usdRate: 23.9891139733 },
		CVE: { symbol: "", usdRate: 103.3171307967 },
		CZK: { symbol: "", usdRate: 22.0716876541 },
		DKK: { symbol: "", usdRate: 6.972998569 },
		DOP: { symbol: "", usdRate: 55.21967671 },
		DZD: { symbol: "", usdRate: 136.3797496085 },
		EGP: { symbol: "", usdRate: 30.8456444131 },
		ETB: { symbol: "", usdRate: 53.721776428 },
		FJD: { symbol: "$", usdRate: 2.2167010012 },
		FKP: { symbol: "£", usdRate: 0.8319874631 },
		GEL: { symbol: "", usdRate: 2.6007473341 },
		GHS: { symbol: "GH₵", usdRate: 12.5789562339 },
		GIP: { symbol: "£", usdRate: 0.8319874631 },
		GMD: { symbol: "D ", usdRate: 61.553732396 },
		GNF: { symbol: "", usdRate: 8709.7681350251 },
		GTQ: { symbol: "", usdRate: 7.8093987417 },
		GYD: { symbol: "$", usdRate: 210.5072940182 },
		HNL: { symbol: "", usdRate: 24.6393388167 },
		HRK: { symbol: "", usdRate: 7.0594261539 },
		HTG: { symbol: "", usdRate: 151.3183135701 },
		HUF: { symbol: "", usdRate: 353.2731136256 },
		IDR: { symbol: "", usdRate: 15327.7726658672 },
		ILS: { symbol: "₪", usdRate: 3.5932127679 },
		INR: { symbol: "₹", usdRate: 81.7987244894 },
		IQD: { symbol: "", usdRate: 1458.6700155338 },
		IRR: { symbol: "", usdRate: 42224.3551318755 },
		ISK: { symbol: "", usdRate: 140.3050839893 },
		JMD: { symbol: "$", usdRate: 153.45739949 },
		KES: { symbol: "Ksh", usdRate: 128.7057824533 },
		KGS: { symbol: "", usdRate: 87.4199709944 },
		KHR: { symbol: "", usdRate: 4050.2681798284 },
		KMF: { symbol: "", usdRate: 460.9476410133 },
		KPW: { symbol: "", usdRate: 899.9994282306 },
		KWD: { symbol: "", usdRate: 0.3068678596 },
		KZT: { symbol: "", usdRate: 436.2912325665 },
		LAK: { symbol: "", usdRate: 16945.7792340511 },
		LKR: { symbol: "", usdRate: 335.3502232362 },
		LRD: { symbol: "$", usdRate: 159.8041534773 },
		LSL: { symbol: "", usdRate: 18.2382351346 },
		LYD: { symbol: "", usdRate: 4.8209704502 },
		MAD: { symbol: "", usdRate: 10.3653580967 },
		MDL: { symbol: "", usdRate: 18.8226503486 },
		MGA: { symbol: "Ar ", usdRate: 4326.57483968 },
		MKD: { symbol: "", usdRate: 57.8352080952 },
		MMK: { symbol: "", usdRate: 2099.7546172948 },
		MNT: { symbol: "", usdRate: 3532.553975375 },
		MOP: { symbol: "MOP$", usdRate: 8.0848229693 },
		MUR: { symbol: "Rs ", usdRate: 46.3249567624 },
		MVR: { symbol: "", usdRate: 15.4140243628 },
		MWK: { symbol: "MK ", usdRate: 1017.6406269605 },
		MXV: { symbol: "", usdRate: 2.3208487231 },
		MYR: { symbol: "RM ", usdRate: 4.4766111262 },
		MZN: { symbol: "", usdRate: 63.7964919133 },
		NAD: { symbol: "$", usdRate: 18.2382351346 },
		NGN: { symbol: "₦", usdRate: 460.4200401214 },
		NIO: { symbol: "", usdRate: 36.4192897472 },
		NOK: { symbol: "", usdRate: 10.4369052364 },
		NPR: { symbol: "", usdRate: 130.9393082264 },
		PEN: { symbol: "", usdRate: 3.7839230934 },
		PGK: { symbol: "K ", usdRate: 3.5177292809 },
		PHP: { symbol: "₱", usdRate: 55.2569768094 },
		PKR: { symbol: "Rs ", usdRate: 275.6284556657 },
		PLN: { symbol: "", usdRate: 4.3925923319 },
		PYG: { symbol: "", usdRate: 7262.3002393841 },
		RON: { symbol: "", usdRate: 4.6102836619 },
		RSD: { symbol: "", usdRate: 109.9081140027 },
		RUB: { symbol: "", usdRate: 75.5667778721 },
		RWF: { symbol: "RF ", usdRate: 1091.1172729153 },
		SBD: { symbol: "$", usdRate: 8.2633988 },
		SCR: { symbol: "Rs ", usdRate: 13.9709670573 },
		SDG: { symbol: "", usdRate: 588.893450186 },
		SEK: { symbol: "", usdRate: 10.4650624042 },
		SGD: { symbol: "$", usdRate: 1.345787182 },
		SHP: { symbol: "£", usdRate: 0.8319874631 },
		SLL: { symbol: "Le ", usdRate: 20784.0933632156 },
		SOS: { symbol: "", usdRate: 568.7546653489 },
		SRD: { symbol: "", usdRate: 33.9659627867 },
		SYP: { symbol: "", usdRate: 2512.548596162 },
		SZL: { symbol: "E ", usdRate: 18.2382351346 },
		THB: { symbol: "", usdRate: 34.4846466331 },
		TJS: { symbol: "", usdRate: 10.9211576212 },
		TMT: { symbol: "", usdRate: 3.4965192475 },
		TND: { symbol: "", usdRate: 3.1253960979 },
		TOP: { symbol: "T$", usdRate: 2.3619664485 },
		TRY: { symbol: "", usdRate: 18.8976553718 },
		TTD: { symbol: "$", usdRate: 6.7527748197 },
		TZS: { symbol: "TSh ", usdRate: 2340.0669825392 },
		UAH: { symbol: "", usdRate: 36.8616821595 },
		UGX: { symbol: "USh ", usdRate: 3703.5557074197 },
		UYU: { symbol: "", usdRate: 39.4534290828 },
		UZS: { symbol: "", usdRate: 11336.3977249496 },
		VES: { symbol: "", usdRate: 24.2618709823 },
		VND: { symbol: "₫", usdRate: 23639.2864963909 },
		VUV: { symbol: "VT ", usdRate: 118.4298524321 },
		WST: { symbol: "WS$", usdRate: 2.7080696483 },
		XAF: { symbol: "FCFA ", usdRate: 614.5968546844 },
		YER: { symbol: "", usdRate: 250.3259442938 },
		ZAR: { symbol: "R ", usdRate: 18.2382351346 },
		ZMW: { symbol: "K ", usdRate: 20.1108218824 },
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
"use strict"

const RobuxToCash = {
	// cash is in cents
	
	UpdateDate: "December 12, 2022",
	
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
		
		AFN: { symbol: "", usdRate: 87.370655785 },
		ALL: { symbol: "", usdRate: 109.5145817378 },
		AMD: { symbol: "", usdRate: 393.914684652 },
		AOA: { symbol: "", usdRate: 510.3614153035 },
		ARS: { symbol: "", usdRate: 171.4511474696 },
		AZN: { symbol: "", usdRate: 1.6992292832 },
		BAM: { symbol: "", usdRate: 1.8503714386 },
		BDT: { symbol: "", usdRate: 102.9845090535 },
		BGN: { symbol: "", usdRate: 1.8503714386 },
		BIF: { symbol: "FBu ", usdRate: 2070.2034052093 },
		BND: { symbol: "", usdRate: 1.3523608724 },
		BOB: { symbol: "", usdRate: 6.9036533571 },
		BTN: { symbol: "", usdRate: 82.5725770751 },
		BWP: { symbol: "P ", usdRate: 12.9176633653 },
		BYN: { symbol: "", usdRate: 2.5099881629 },
		CDF: { symbol: "", usdRate: 2034.8675813775 },
		CHF: { symbol: "", usdRate: 0.9325488132 },
		CLF: { symbol: "", usdRate: 0.0380809882 },
		CNY: { symbol: "CN¥", usdRate: 6.9766356667 },
		COP: { symbol: "COP", usdRate: 4809.1636918222 },
		CRC: { symbol: "", usdRate: 587.6786458486 },
		CUP: { symbol: "", usdRate: 23.9793952773 },
		CVE: { symbol: "", usdRate: 104.3242298868 },
		CZK: { symbol: "", usdRate: 23.0022590868 },
		DKK: { symbol: "", usdRate: 7.0373290142 },
		DOP: { symbol: "", usdRate: 55.1155600027 },
		DZD: { symbol: "", usdRate: 137.9280418193 },
		EGP: { symbol: "", usdRate: 24.6379611911 },
		ETB: { symbol: "", usdRate: 53.5079662125 },
		FJD: { symbol: "$", usdRate: 2.1986947332 },
		FKP: { symbol: "£", usdRate: 0.8133506081 },
		GEL: { symbol: "", usdRate: 2.674661093 },
		GHS: { symbol: "GH₵", usdRate: 13.0225169941 },
		GIP: { symbol: "£", usdRate: 0.8133506081 },
		GMD: { symbol: "D ", usdRate: 62.3557746732 },
		GNF: { symbol: "", usdRate: 8619.9961689479 },
		GTQ: { symbol: "", usdRate: 7.8883121223 },
		GYD: { symbol: "$", usdRate: 208.7716687827 },
		HNL: { symbol: "", usdRate: 24.6845984975 },
		HRK: { symbol: "", usdRate: 7.1482665613 },
		HTG: { symbol: "", usdRate: 145.9125727997 },
		HUF: { symbol: "", usdRate: 394.2275049503 },
		IDR: { symbol: "", usdRate: 15645.7964969574 },
		ILS: { symbol: "₪", usdRate: 3.4278214489 },
		INR: { symbol: "₹", usdRate: 82.5725770751 },
		IQD: { symbol: "", usdRate: 1458.356402563 },
		IRR: { symbol: "", usdRate: 41387.3469746946 },
		ISK: { symbol: "", usdRate: 142.6036737254 },
		JMD: { symbol: "$", usdRate: 153.7766835944 },
		KES: { symbol: "Ksh", usdRate: 122.7355520845 },
		KGS: { symbol: "", usdRate: 84.955603737 },
		KHR: { symbol: "", usdRate: 4128.9114046778 },
		KMF: { symbol: "", usdRate: 465.4407966616 },
		KPW: { symbol: "", usdRate: 900.0725662631 },
		KWD: { symbol: "", usdRate: 0.3068684585 },
		KZT: { symbol: "", usdRate: 469.7235788679 },
		LAK: { symbol: "", usdRate: 17270.1118049496 },
		LKR: { symbol: "", usdRate: 367.5298557983 },
		LRD: { symbol: "$", usdRate: 153.9915682792 },
		LSL: { symbol: "", usdRate: 17.5012198893 },
		LYD: { symbol: "", usdRate: 4.8445382764 },
		MAD: { symbol: "", usdRate: 10.5260104967 },
		MDL: { symbol: "", usdRate: 19.363740873 },
		MGA: { symbol: "Ar ", usdRate: 4421.847942143 },
		MKD: { symbol: "", usdRate: 58.5429506501 },
		MMK: { symbol: "", usdRate: 2098.4182411342 },
		MNT: { symbol: "", usdRate: 3428.9679315792 },
		MOP: { symbol: "MOP$", usdRate: 8.0081836517 },
		MUR: { symbol: "Rs ", usdRate: 43.6111610242 },
		MVR: { symbol: "", usdRate: 15.3502594969 },
		MWK: { symbol: "MK ", usdRate: 1027.0659513551 },
		MXV: { symbol: "", usdRate: 2.7991871639 },
		MYR: { symbol: "RM ", usdRate: 4.417047411 },
		MZN: { symbol: "", usdRate: 64.0351540349 },
		NAD: { symbol: "$", usdRate: 17.5012198893 },
		NGN: { symbol: "₦", usdRate: 443.5074910974 },
		NIO: { symbol: "", usdRate: 36.4926492652 },
		NOK: { symbol: "", usdRate: 9.9735712221 },
		NPR: { symbol: "", usdRate: 132.178052753 },
		PEN: { symbol: "", usdRate: 3.8533542768 },
		PGK: { symbol: "K ", usdRate: 3.5204616144 },
		PHP: { symbol: "₱", usdRate: 55.6499969486 },
		PKR: { symbol: "Rs ", usdRate: 224.8930982514 },
		PLN: { symbol: "", usdRate: 4.4437035699 },
		PYG: { symbol: "", usdRate: 7163.0513070707 },
		RON: { symbol: "", usdRate: 4.6662637844 },
		RSD: { symbol: "", usdRate: 110.9854217109 },
		RUB: { symbol: "", usdRate: 63.0192546191 },
		RWF: { symbol: "RF ", usdRate: 1071.6393566113 },
		SBD: { symbol: "$", usdRate: 8.2651657074 },
		SCR: { symbol: "Rs ", usdRate: 12.9501310312 },
		SDG: { symbol: "", usdRate: 571.4462337268 },
		SEK: { symbol: "", usdRate: 10.3047946023 },
		SGD: { symbol: "$", usdRate: 1.3523608724 },
		SHP: { symbol: "£", usdRate: 0.8133506081 },
		SLL: { symbol: "Le ", usdRate: 18540.0749255233 },
		SOS: { symbol: "", usdRate: 568.7094326923 },
		SRD: { symbol: "", usdRate: 31.8264190182 },
		SYP: { symbol: "", usdRate: 2512.0313951268 },
		SZL: { symbol: "E ", usdRate: 17.5012198893 },
		THB: { symbol: "", usdRate: 34.7757163562 },
		TJS: { symbol: "", usdRate: 10.0691161268 },
		TMT: { symbol: "", usdRate: 3.4935304904 },
		TND: { symbol: "", usdRate: 3.2260488848 },
		TOP: { symbol: "T$", usdRate: 2.3366794241 },
		TRY: { symbol: "", usdRate: 18.6459470693 },
		TTD: { symbol: "$", usdRate: 6.7795840699 },
		TZS: { symbol: "TSh ", usdRate: 2334.2480234453 },
		UAH: { symbol: "", usdRate: 36.934095609 },
		UGX: { symbol: "USh ", usdRate: 3694.4148494478 },
		UYU: { symbol: "", usdRate: 39.0200382361 },
		UZS: { symbol: "", usdRate: 11249.3332097691 },
		VES: { symbol: "", usdRate: 14.0950495601 },
		VND: { symbol: "₫", usdRate: 23757.1907900715 },
		VUV: { symbol: "VT ", usdRate: 118.1226438044 },
		WST: { symbol: "WS$", usdRate: 2.6948606266 },
		XAF: { symbol: "FCFA ", usdRate: 620.5877288821 },
		YER: { symbol: "", usdRate: 250.1051092198 },
		ZAR: { symbol: "R ", usdRate: 17.5012198893 },
		ZMW: { symbol: "K ", usdRate: 17.4350647279 },
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
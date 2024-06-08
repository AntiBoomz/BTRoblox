"use strict"

const RobuxToCash = {
	// cash is in cents
	
	UpdateDate: "June 9, 2024",
	
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
		
		AFN: { symbol: "", usdRate: 70.3173978788 },
		ALL: { symbol: "", usdRate: 92.1208093678 },
		AMD: { symbol: "", usdRate: 386.1246430723 },
		AOA: { symbol: "", usdRate: 852.4903323022 },
		ARS: { symbol: "", usdRate: 899.0128517505 },
		AZN: { symbol: "", usdRate: 1.7000573975 },
		BAM: { symbol: "", usdRate: 1.8058792168 },
		BDT: { symbol: "", usdRate: 117.5764399889 },
		BGN: { symbol: "", usdRate: 1.8058792168 },
		BIF: { symbol: "FBu ", usdRate: 2873.370015094 },
		BND: { symbol: "", usdRate: 1.3515748526 },
		BOB: { symbol: "", usdRate: 6.925103959 },
		BTN: { symbol: "", usdRate: 83.5251127959 },
		BWP: { symbol: "P ", usdRate: 13.7121346583 },
		BYN: { symbol: "", usdRate: 3.2750003266 },
		CDF: { symbol: "", usdRate: 2812.7199707082 },
		CHF: { symbol: "", usdRate: 0.8962759794 },
		CLF: { symbol: "", usdRate: 0.024530001 },
		CNY: { symbol: "CN¥", usdRate: 7.2474638131 },
		COP: { symbol: "COP", usdRate: 3941.5206060477 },
		CRC: { symbol: "", usdRate: 517.8737179708 },
		CUP: { symbol: "", usdRate: 23.8941847648 },
		CVE: { symbol: "", usdRate: 101.8157514902 },
		CZK: { symbol: "", usdRate: 22.8021006935 },
		DKK: { symbol: "", usdRate: 6.9061974989 },
		DOP: { symbol: "", usdRate: 59.3400532332 },
		DZD: { symbol: "", usdRate: 135.1904703822 },
		EGP: { symbol: "", usdRate: 47.5292579244 },
		ETB: { symbol: "", usdRate: 57.3983036126 },
		FJD: { symbol: "$", usdRate: 2.2549236993 },
		FKP: { symbol: "£", usdRate: 0.7851089909 },
		GEL: { symbol: "", usdRate: 2.8246998785 },
		GHS: { symbol: "GH₵", usdRate: 14.8427156165 },
		GIP: { symbol: "£", usdRate: 0.7851089909 },
		GMD: { symbol: "D ", usdRate: 67.7590720277 },
		GNF: { symbol: "", usdRate: 8481.2880269185 },
		GTQ: { symbol: "", usdRate: 7.7672769405 },
		GYD: { symbol: "$", usdRate: 209.197258086 },
		HNL: { symbol: "", usdRate: 24.7085447869 },
		HRK: { symbol: "", usdRate: 6.9568402975 },
		HTG: { symbol: "", usdRate: 134.7845234876 },
		HUF: { symbol: "", usdRate: 360.824853703 },
		IDR: { symbol: "", usdRate: 16213.6688554569 },
		ILS: { symbol: "₪", usdRate: 3.7556620903 },
		INR: { symbol: "₹", usdRate: 83.5251127959 },
		IQD: { symbol: "", usdRate: 1308.9660693539 },
		IRR: { symbol: "", usdRate: 42002.596111642 },
		ISK: { symbol: "", usdRate: 137.5513320367 },
		JMD: { symbol: "$", usdRate: 154.8769316547 },
		KES: { symbol: "Ksh", usdRate: 129.6322173429 },
		KGS: { symbol: "", usdRate: 87.2351989882 },
		KHR: { symbol: "", usdRate: 4112.1132641969 },
		KMF: { symbol: "", usdRate: 454.249262494 },
		KPW: { symbol: "", usdRate: 900.0000000063 },
		KWD: { symbol: "", usdRate: 0.3070989803 },
		KZT: { symbol: "", usdRate: 447.4061491775 },
		LAK: { symbol: "", usdRate: 21649.8147202951 },
		LKR: { symbol: "", usdRate: 302.3794340794 },
		LRD: { symbol: "$", usdRate: 194.2104223341 },
		LSL: { symbol: "", usdRate: 18.8684863785 },
		LYD: { symbol: "", usdRate: 4.8339003175 },
		MAD: { symbol: "", usdRate: 9.9197973747 },
		MDL: { symbol: "", usdRate: 17.5300026878 },
		MGA: { symbol: "Ar ", usdRate: 4473.6701455572 },
		MKD: { symbol: "", usdRate: 56.8900017572 },
		MMK: { symbol: "", usdRate: 2095.8080062671 },
		MNT: { symbol: "", usdRate: 3386.2026522902 },
		MOP: { symbol: "MOP$", usdRate: 8.0462198411 },
		MUR: { symbol: "Rs ", usdRate: 45.7703876736 },
		MVR: { symbol: "", usdRate: 15.4599979605 },
		MWK: { symbol: "MK ", usdRate: 1733.7859645009 },
		MXV: { symbol: "", usdRate: 2.2152650356 },
		MYR: { symbol: "RM ", usdRate: 4.6908060529 },
		MZN: { symbol: "", usdRate: 63.6385819813 },
		NAD: { symbol: "$", usdRate: 18.8684863785 },
		NGN: { symbol: "₦", usdRate: 1480.2957503085 },
		NIO: { symbol: "", usdRate: 36.6244035708 },
		NOK: { symbol: "", usdRate: 10.710946568 },
		NPR: { symbol: "", usdRate: 133.7028243081 },
		PEN: { symbol: "", usdRate: 3.7554219375 },
		PGK: { symbol: "K ", usdRate: 3.8146050491 },
		PHP: { symbol: "₱", usdRate: 58.6927225917 },
		PKR: { symbol: "Rs ", usdRate: 278.1620550978 },
		PLN: { symbol: "", usdRate: 3.9927547006 },
		PYG: { symbol: "", usdRate: 7562.4879586073 },
		RON: { symbol: "", usdRate: 4.5779361481 },
		RSD: { symbol: "", usdRate: 107.9709877059 },
		RUB: { symbol: "", usdRate: 88.9821378783 },
		RWF: { symbol: "RF ", usdRate: 1300.6953117963 },
		SBD: { symbol: "$", usdRate: 8.230456937 },
		SCR: { symbol: "Rs ", usdRate: 14.6190060395 },
		SDG: { symbol: "", usdRate: 598.9120514529 },
		SEK: { symbol: "", usdRate: 10.5676837533 },
		SGD: { symbol: "$", usdRate: 1.3515748526 },
		SHP: { symbol: "£", usdRate: 0.7851089909 },
		SLL: { symbol: "Le ", usdRate: 22500.1119411102 },
		SOS: { symbol: "", usdRate: 570.3484639327 },
		SRD: { symbol: "", usdRate: 31.6000201384 },
		SYP: { symbol: "", usdRate: 12996.0013690909 },
		SZL: { symbol: "E ", usdRate: 18.8684863785 },
		THB: { symbol: "", usdRate: 36.789294649 },
		TJS: { symbol: "", usdRate: 10.732196734 },
		TMT: { symbol: "", usdRate: 3.5035598272 },
		TND: { symbol: "", usdRate: 3.1029960557 },
		TOP: { symbol: "T$", usdRate: 2.3255904376 },
		TRY: { symbol: "", usdRate: 32.3631641017 },
		TTD: { symbol: "$", usdRate: 6.730365483 },
		TZS: { symbol: "TSh ", usdRate: 2617.6142474513 },
		UAH: { symbol: "", usdRate: 40.2498362981 },
		UGX: { symbol: "USh ", usdRate: 3793.3704592332 },
		UYU: { symbol: "", usdRate: 38.8923312992 },
		UZS: { symbol: "", usdRate: 12646.8701129246 },
		VES: { symbol: "", usdRate: 36.432618092 },
		VND: { symbol: "₫", usdRate: 25405.0725117952 },
		VUV: { symbol: "VT ", usdRate: 118.1896157381 },
		WST: { symbol: "WS$", usdRate: 2.7196044117 },
		XAF: { symbol: "FCFA ", usdRate: 605.6656833253 },
		YER: { symbol: "", usdRate: 250.2358721354 },
		ZAR: { symbol: "R ", usdRate: 18.8684863785 },
		ZMW: { symbol: "K ", usdRate: 26.4693852686 },
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
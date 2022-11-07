"use strict"

const RobuxToCash = {
	// cash is in cents
	
	UpdateDate: "October 4, 2022",
	
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
		
		AFN: { symbol: "", usdRate: 87.7893180806 },
		ALL: { symbol: "", usdRate: 118.8688071928 },
		AMD: { symbol: "", usdRate: 400.5664658442 },
		AOA: { symbol: "", usdRate: 429.4370666379 },
		ARS: { symbol: "", usdRate: 148.2328199311 },
		AZN: { symbol: "", usdRate: 1.6999404355 },
		BAM: { symbol: "", usdRate: 1.9755882893 },
		BDT: { symbol: "", usdRate: 101.3348121292 },
		BGN: { symbol: "", usdRate: 1.9755882893 },
		BIF: { symbol: "FBu ", usdRate: 2054.0198110904 },
		BND: { symbol: "", usdRate: 1.4297064644 },
		BOB: { symbol: "", usdRate: 6.8891036988 },
		BTN: { symbol: "", usdRate: 81.5653448716 },
		BWP: { symbol: "P ", usdRate: 13.2590543994 },
		BYN: { symbol: "", usdRate: 2.5263986919 },
		CDF: { symbol: "", usdRate: 2036.7337802338 },
		CHF: { symbol: "", usdRate: 0.9871555558 },
		CLF: { symbol: "", usdRate: 0.0380809882 },
		CNY: { symbol: "CN¥", usdRate: 7.1159422008 },
		COP: { symbol: "COP", usdRate: 1.1234567 },
		CRC: { symbol: "", usdRate: 624.2382680412 },
		CUP: { symbol: "", usdRate: 23.9002332384 },
		CVE: { symbol: "", usdRate: 111.3839754268 },
		CZK: { symbol: "", usdRate: 24.787604806 },
		DKK: { symbol: "", usdRate: 7.5121284248 },
		DOP: { symbol: "", usdRate: 53.1695162388 },
		DZD: { symbol: "", usdRate: 140.4742368986 },
		EGP: { symbol: "", usdRate: 19.6593270982 },
		ETB: { symbol: "", usdRate: 52.5928872423 },
		FJD: { symbol: "$", usdRate: 2.2894170447 },
		FKP: { symbol: "£", usdRate: 0.8813871702 },
		GEL: { symbol: "", usdRate: 2.8116124483 },
		GHS: { symbol: "GH₵", usdRate: 10.3786069621 },
		GIP: { symbol: "£", usdRate: 0.8813871702 },
		GMD: { symbol: "D ", usdRate: 55.5550156895 },
		GNF: { symbol: "", usdRate: 8615.975073105 },
		GTQ: { symbol: "", usdRate: 7.8609517135 },
		GYD: { symbol: "$", usdRate: 208.3310012274 },
		HNL: { symbol: "", usdRate: 24.5826173425 },
		HRK: { symbol: "", usdRate: 7.6018351925 },
		HTG: { symbol: "", usdRate: 120.0372940314 },
		HUF: { symbol: "", usdRate: 421.1327245372 },
		IDR: { symbol: "", usdRate: 15243.8179637544 },
		ILS: { symbol: "₪", usdRate: 3.5086501595 },
		INR: { symbol: "₹", usdRate: 81.5653448716 },
		IQD: { symbol: "", usdRate: 1448.3213406526 },
		IRR: { symbol: "", usdRate: 42393.7208251129 },
		ISK: { symbol: "", usdRate: 143.6398019064 },
		JMD: { symbol: "$", usdRate: 150.9619219155 },
		KES: { symbol: "Ksh", usdRate: 120.8296846207 },
		KGS: { symbol: "", usdRate: 80.1880602821 },
		KHR: { symbol: "", usdRate: 4095.620482441 },
		KMF: { symbol: "", usdRate: 496.9377326268 },
		KPW: { symbol: "", usdRate: 900.030138651 },
		KWD: { symbol: "", usdRate: 0.3099593203 },
		KZT: { symbol: "", usdRate: 472.1466304352 },
		LAK: { symbol: "", usdRate: 16474.7134407864 },
		LKR: { symbol: "", usdRate: 363.8645800584 },
		LRD: { symbol: "$", usdRate: 153.766676657 },
		LSL: { symbol: "", usdRate: 17.7614864932 },
		LYD: { symbol: "", usdRate: 4.9910004028 },
		MAD: { symbol: "", usdRate: 10.9227975832 },
		MDL: { symbol: "", usdRate: 19.4223871228 },
		MGA: { symbol: "Ar ", usdRate: 4222.105310794 },
		MKD: { symbol: "", usdRate: 62.2233460629 },
		MMK: { symbol: "", usdRate: 2092.8180224268 },
		MNT: { symbol: "", usdRate: 3330.7580404086 },
		MOP: { symbol: "MOP$", usdRate: 8.0855797703 },
		MUR: { symbol: "Rs ", usdRate: 45.9248058226 },
		MVR: { symbol: "", usdRate: 15.4313300516 },
		MWK: { symbol: "MK ", usdRate: 1022.0240597561 },
		MXV: { symbol: "", usdRate: 2.8600311279 },
		MYR: { symbol: "RM ", usdRate: 4.6447836858 },
		MZN: { symbol: "", usdRate: 63.8540602481 },
		NAD: { symbol: "$", usdRate: 17.7614864932 },
		NGN: { symbol: "₦", usdRate: 435.4875394349 },
		NIO: { symbol: "", usdRate: 35.7933199189 },
		NOK: { symbol: "", usdRate: 10.5746276002 },
		NPR: { symbol: "", usdRate: 130.5657258032 },
		PEN: { symbol: "", usdRate: 3.9578333304 },
		PGK: { symbol: "K ", usdRate: 3.5210851182 },
		PHP: { symbol: "₱", usdRate: 58.7295410214 },
		PKR: { symbol: "Rs ", usdRate: 225.2467660947 },
		PLN: { symbol: "", usdRate: 4.8515286869 },
		PYG: { symbol: "", usdRate: 7062.7013224497 },
		RON: { symbol: "", usdRate: 4.9917336101 },
		RSD: { symbol: "", usdRate: 118.6203670236 },
		RUB: { symbol: "", usdRate: 58.9388132725 },
		RWF: { symbol: "RF ", usdRate: 1050.8172147758 },
		SBD: { symbol: "$", usdRate: 8.2067882239 },
		SCR: { symbol: "Rs ", usdRate: 13.174824779 },
		SDG: { symbol: "", usdRate: 576.3242260185 },
		SEK: { symbol: "", usdRate: 10.9111651969 },
		SGD: { symbol: "$", usdRate: 1.4297064644 },
		SHP: { symbol: "£", usdRate: 0.8813871702 },
		SLL: { symbol: "Le ", usdRate: 15875.0145851687 },
		SOS: { symbol: "", usdRate: 565.2396612134 },
		SRD: { symbol: "", usdRate: 28.7731511859 },
		SYP: { symbol: "", usdRate: 2512.5286379393 },
		SZL: { symbol: "E ", usdRate: 17.7614864932 },
		THB: { symbol: "", usdRate: 37.5178880579 },
		TJS: { symbol: "", usdRate: 9.8689323252 },
		TMT: { symbol: "", usdRate: 3.4946016999 },
		TND: { symbol: "", usdRate: 3.2320453455 },
		TOP: { symbol: "T$", usdRate: 2.4154569113 },
		TRY: { symbol: "", usdRate: 18.5841194873 },
		TTD: { symbol: "$", usdRate: 6.751084284 },
		TZS: { symbol: "TSh ", usdRate: 2331.5346861185 },
		UAH: { symbol: "", usdRate: 36.73553487 },
		UGX: { symbol: "USh ", usdRate: 3835.4441003872 },
		UYU: { symbol: "", usdRate: 41.4892374545 },
		UZS: { symbol: "", usdRate: 10979.6993165444 },
		VES: { symbol: "", usdRate: 8.1883496286 },
		VND: { symbol: "₫", usdRate: 23971.0222416978 },
		VUV: { symbol: "VT ", usdRate: 122.7370177993 },
		WST: { symbol: "WS$", usdRate: 2.8040385623 },
		XAF: { symbol: "FCFA ", usdRate: 662.5836435024 },
		YER: { symbol: "", usdRate: 250.2024711695 },
		ZAR: { symbol: "R ", usdRate: 17.7614864932 },
		ZMW: { symbol: "K ", usdRate: 15.7897772696 },
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
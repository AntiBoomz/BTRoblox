"use strict"

const RobuxToCash = {
	// cash is in cents
	
	UpdateDate: "October 7, 2024",
	
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
		
		AFN: { symbol: "", usdRate: 68.4419906352 },
		ALL: { symbol: "", usdRate: 90.0454444724 },
		AMD: { symbol: "", usdRate: 385.1181027537 },
		AOA: { symbol: "", usdRate: 914.3187285624 },
		ARS: { symbol: "", usdRate: 974.7912337276 },
		AZN: { symbol: "", usdRate: 1.6999543609 },
		BAM: { symbol: "", usdRate: 1.7826878124 },
		BDT: { symbol: "", usdRate: 119.687381264 },
		BGN: { symbol: "", usdRate: 1.7826878124 },
		BIF: { symbol: "FBu ", usdRate: 2898.0309639811 },
		BND: { symbol: "", usdRate: 1.3040980297 },
		BOB: { symbol: "", usdRate: 6.9279384205 },
		BTN: { symbol: "", usdRate: 83.9975512699 },
		BWP: { symbol: "P ", usdRate: 13.2064538667 },
		BYN: { symbol: "", usdRate: 3.2701252334 },
		CDF: { symbol: "", usdRate: 2862.8648143945 },
		CHF: { symbol: "", usdRate: 0.8542097887 },
		CLF: { symbol: "", usdRate: 0.0243801497 },
		CNY: { symbol: "CN¥", usdRate: 7.0176076589 },
		COP: { symbol: "COP", usdRate: 4215.8908067682 },
		CRC: { symbol: "", usdRate: 520.3539923961 },
		CUP: { symbol: "", usdRate: 24.0208606242 },
		CVE: { symbol: "", usdRate: 100.5082164977 },
		CZK: { symbol: "", usdRate: 23.1317234651 },
		DKK: { symbol: "", usdRate: 6.7958942093 },
		DOP: { symbol: "", usdRate: 60.2953566149 },
		DZD: { symbol: "", usdRate: 133.1583711833 },
		EGP: { symbol: "", usdRate: 48.3938318341 },
		ETB: { symbol: "", usdRate: 120.2909724655 },
		FJD: { symbol: "$", usdRate: 2.2173722116 },
		FKP: { symbol: "£", usdRate: 0.764393395 },
		GEL: { symbol: "", usdRate: 2.7479223058 },
		GHS: { symbol: "GH₵", usdRate: 15.8813665791 },
		GIP: { symbol: "£", usdRate: 0.764393395 },
		GMD: { symbol: "D ", usdRate: 69.0947672296 },
		GNF: { symbol: "", usdRate: 8631.942965869 },
		GTQ: { symbol: "", usdRate: 7.7521867721 },
		GYD: { symbol: "$", usdRate: 209.1741880884 },
		HNL: { symbol: "", usdRate: 24.9853069499 },
		HRK: { symbol: "", usdRate: 6.8674993852 },
		HTG: { symbol: "", usdRate: 132.2854248949 },
		HUF: { symbol: "", usdRate: 366.6990444775 },
		IDR: { symbol: "", usdRate: 15720.5511541003 },
		ILS: { symbol: "₪", usdRate: 3.7953549938 },
		INR: { symbol: "₹", usdRate: 83.9975512699 },
		IQD: { symbol: "", usdRate: 1311.9411333343 },
		IRR: { symbol: "", usdRate: 42148.7383012444 },
		ISK: { symbol: "", usdRate: 135.3609051687 },
		JMD: { symbol: "$", usdRate: 158.0724747795 },
		KES: { symbol: "Ksh", usdRate: 128.9955064724 },
		KGS: { symbol: "", usdRate: 84.7003858197 },
		KHR: { symbol: "", usdRate: 4065.9949649674 },
		KMF: { symbol: "", usdRate: 448.4157171205 },
		KPW: { symbol: "", usdRate: 900.0115038808 },
		KWD: { symbol: "", usdRate: 0.3064011663 },
		KZT: { symbol: "", usdRate: 484.6712373224 },
		LAK: { symbol: "", usdRate: 22127.9348518772 },
		LKR: { symbol: "", usdRate: 294.0235254914 },
		LRD: { symbol: "$", usdRate: 193.3804956538 },
		LSL: { symbol: "", usdRate: 17.3871648143 },
		LYD: { symbol: "", usdRate: 4.7701083851 },
		MAD: { symbol: "", usdRate: 9.8176718814 },
		MDL: { symbol: "", usdRate: 17.5640024455 },
		MGA: { symbol: "Ar ", usdRate: 4574.9888976758 },
		MKD: { symbol: "", usdRate: 56.0906725594 },
		MMK: { symbol: "", usdRate: 2098.7868067853 },
		MNT: { symbol: "", usdRate: 3382.9980826337 },
		MOP: { symbol: "MOP$", usdRate: 7.9990022172 },
		MUR: { symbol: "Rs ", usdRate: 46.5922877501 },
		MVR: { symbol: "", usdRate: 15.431594359 },
		MWK: { symbol: "MK ", usdRate: 1741.1624498908 },
		MXV: { symbol: "", usdRate: 2.3526510014 },
		MYR: { symbol: "RM ", usdRate: 4.2831737481 },
		MZN: { symbol: "", usdRate: 63.9066012878 },
		NAD: { symbol: "$", usdRate: 17.3871648143 },
		NGN: { symbol: "₦", usdRate: 1619.8696736996 },
		NIO: { symbol: "", usdRate: 36.797131907 },
		NOK: { symbol: "", usdRate: 10.6439287436 },
		NPR: { symbol: "", usdRate: 134.4590801953 },
		PEN: { symbol: "", usdRate: 3.7314043049 },
		PGK: { symbol: "K ", usdRate: 3.9629770989 },
		PHP: { symbol: "₱", usdRate: 56.8272896566 },
		PKR: { symbol: "Rs ", usdRate: 277.986686849 },
		PLN: { symbol: "", usdRate: 3.9411363523 },
		PYG: { symbol: "", usdRate: 7811.9500851234 },
		RON: { symbol: "", usdRate: 4.5372796933 },
		RSD: { symbol: "", usdRate: 106.6785758297 },
		RUB: { symbol: "", usdRate: 96.1991061385 },
		RWF: { symbol: "RF ", usdRate: 1360.4549073668 },
		SBD: { symbol: "$", usdRate: 8.3717382079 },
		SCR: { symbol: "Rs ", usdRate: 14.1196620586 },
		SDG: { symbol: "", usdRate: 601.374927706 },
		SEK: { symbol: "", usdRate: 10.3599579251 },
		SGD: { symbol: "$", usdRate: 1.3040980297 },
		SHP: { symbol: "£", usdRate: 0.764393395 },
		SLL: { symbol: "Le ", usdRate: 22622.9055181248 },
		SOS: { symbol: "", usdRate: 573.5975859584 },
		SRD: { symbol: "", usdRate: 31.7279146599 },
		SYP: { symbol: "", usdRate: 13002.6178457198 },
		SZL: { symbol: "E ", usdRate: 17.3871648143 },
		THB: { symbol: "", usdRate: 33.4982290263 },
		TJS: { symbol: "", usdRate: 10.6345576849 },
		TMT: { symbol: "", usdRate: 3.5088252397 },
		TND: { symbol: "", usdRate: 3.0699847977 },
		TOP: { symbol: "T$", usdRate: 2.3490131591 },
		TRY: { symbol: "", usdRate: 34.2530288376 },
		TTD: { symbol: "$", usdRate: 6.7965780184 },
		TZS: { symbol: "TSh ", usdRate: 2722.8570241524 },
		UAH: { symbol: "", usdRate: 41.2453202925 },
		UGX: { symbol: "USh ", usdRate: 3676.1766081591 },
		UYU: { symbol: "", usdRate: 41.2832826472 },
		UZS: { symbol: "", usdRate: 12788.0161127587 },
		VES: { symbol: "", usdRate: 36.9882638197 },
		VND: { symbol: "₫", usdRate: 24865.0275624407 },
		VUV: { symbol: "VT ", usdRate: 118.6791834905 },
		WST: { symbol: "WS$", usdRate: 2.7067722951 },
		XAF: { symbol: "FCFA ", usdRate: 597.8876228273 },
		YER: { symbol: "", usdRate: 250.2198779835 },
		ZAR: { symbol: "R ", usdRate: 17.3871648143 },
		ZMW: { symbol: "K ", usdRate: 26.523184798 },
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
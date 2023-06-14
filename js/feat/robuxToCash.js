"use strict"

const RobuxToCash = {
	// cash is in cents
	
	UpdateDate: "June 14, 2023",
	
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
		
		AFN: { symbol: "", usdRate: 86.0758649459 },
		ALL: { symbol: "", usdRate: 99.0063615003 },
		AMD: { symbol: "", usdRate: 384.7443760792 },
		AOA: { symbol: "", usdRate: 694.2672517017 },
		ARS: { symbol: "", usdRate: 247.7715286386 },
		AZN: { symbol: "", usdRate: 1.6994048439 },
		BAM: { symbol: "", usdRate: 1.8008315228 },
		BDT: { symbol: "", usdRate: 109.3050496773 },
		BGN: { symbol: "", usdRate: 1.8008315228 },
		BIF: { symbol: "FBu ", usdRate: 2824.8911694205 },
		BND: { symbol: "", usdRate: 1.3382990268 },
		BOB: { symbol: "", usdRate: 6.9137778683 },
		BTN: { symbol: "", usdRate: 81.9376345288 },
		BWP: { symbol: "P ", usdRate: 13.4354644794 },
		BYN: { symbol: "", usdRate: 2.504910703 },
		CDF: { symbol: "", usdRate: 2357.185906663 },
		CHF: { symbol: "", usdRate: 0.8969831946 },
		CLF: { symbol: "", usdRate: 0.022184541 },
		CNY: { symbol: "CN¥", usdRate: 7.1473579273 },
		COP: { symbol: "COP", usdRate: 4182.9674264198 },
		CRC: { symbol: "", usdRate: 544.2417893182 },
		CUP: { symbol: "", usdRate: 23.9994418903 },
		CVE: { symbol: "", usdRate: 101.5311617179 },
		CZK: { symbol: "", usdRate: 21.8812906733 },
		DKK: { symbol: "", usdRate: 6.8612864027 },
		DOP: { symbol: "", usdRate: 54.6085788892 },
		DZD: { symbol: "", usdRate: 136.0030809438 },
		EGP: { symbol: "", usdRate: 30.902446345 },
		ETB: { symbol: "", usdRate: 54.922122669 },
		FJD: { symbol: "$", usdRate: 2.2027134555 },
		FKP: { symbol: "£", usdRate: 0.7878837235 },
		GEL: { symbol: "", usdRate: 2.6113016608 },
		GHS: { symbol: "GH₵", usdRate: 11.3377656423 },
		GIP: { symbol: "£", usdRate: 0.7878837235 },
		GMD: { symbol: "D ", usdRate: 59.316907582 },
		GNF: { symbol: "", usdRate: 8604.1797779208 },
		GTQ: { symbol: "", usdRate: 7.8315413097 },
		GYD: { symbol: "$", usdRate: 211.2249852067 },
		HNL: { symbol: "", usdRate: 24.7354351299 },
		HRK: { symbol: "", usdRate: 6.9373949212 },
		HTG: { symbol: "", usdRate: 139.580180685 },
		HUF: { symbol: "", usdRate: 342.4670485176 },
		IDR: { symbol: "", usdRate: 14875.1375621471 },
		ILS: { symbol: "₪", usdRate: 3.577363991 },
		INR: { symbol: "₹", usdRate: 81.9376345288 },
		IQD: { symbol: "", usdRate: 1309.5826869753 },
		IRR: { symbol: "", usdRate: 42329.6055186427 },
		ISK: { symbol: "", usdRate: 137.2879383314 },
		JMD: { symbol: "$", usdRate: 154.543922159 },
		KES: { symbol: "Ksh", usdRate: 139.6868768718 },
		KGS: { symbol: "", usdRate: 87.5916312998 },
		KHR: { symbol: "", usdRate: 4116.8515090769 },
		KMF: { symbol: "", usdRate: 452.979570012 },
		KPW: { symbol: "", usdRate: 899.9939809761 },
		KWD: { symbol: "", usdRate: 0.307098039 },
		KZT: { symbol: "", usdRate: 449.8959912603 },
		LAK: { symbol: "", usdRate: 18298.1288586238 },
		LKR: { symbol: "", usdRate: 319.5545155595 },
		LRD: { symbol: "$", usdRate: 175.0062245707 },
		LSL: { symbol: "", usdRate: 18.3068765024 },
		LYD: { symbol: "", usdRate: 4.8171033461 },
		MAD: { symbol: "", usdRate: 10.0552122334 },
		MDL: { symbol: "", usdRate: 17.8116791237 },
		MGA: { symbol: "Ar ", usdRate: 4510.5808878021 },
		MKD: { symbol: "", usdRate: 56.95965568 },
		MMK: { symbol: "", usdRate: 2099.152341349 },
		MNT: { symbol: "", usdRate: 3469.5249896425 },
		MOP: { symbol: "MOP$", usdRate: 8.0657147368 },
		MUR: { symbol: "Rs ", usdRate: 45.5647131275 },
		MVR: { symbol: "", usdRate: 15.4069949763 },
		MWK: { symbol: "MK ", usdRate: 1018.3408118991 },
		MXV: { symbol: "", usdRate: 2.2102406094 },
		MYR: { symbol: "RM ", usdRate: 4.6198167978 },
		MZN: { symbol: "", usdRate: 64.0637141686 },
		NAD: { symbol: "$", usdRate: 18.3068765024 },
		NGN: { symbol: "₦", usdRate: 465.4396155309 },
		NIO: { symbol: "", usdRate: 36.562833958 },
		NOK: { symbol: "", usdRate: 10.5591321572 },
		NPR: { symbol: "", usdRate: 131.161668472 },
		PEN: { symbol: "", usdRate: 3.6484452144 },
		PGK: { symbol: "K ", usdRate: 3.5458757618 },
		PHP: { symbol: "₱", usdRate: 55.8891203589 },
		PKR: { symbol: "Rs ", usdRate: 287.121870967 },
		PLN: { symbol: "", usdRate: 4.0957463634 },
		PYG: { symbol: "", usdRate: 7243.8473018749 },
		RON: { symbol: "", usdRate: 4.5623318948 },
		RSD: { symbol: "", usdRate: 107.9541373352 },
		RUB: { symbol: "", usdRate: 83.9280550853 },
		RWF: { symbol: "RF ", usdRate: 1138.4720656207 },
		SBD: { symbol: "$", usdRate: 8.438513858 },
		SCR: { symbol: "Rs ", usdRate: 14.0717943646 },
		SDG: { symbol: "", usdRate: 600.87807178 },
		SEK: { symbol: "", usdRate: 10.655443782 },
		SGD: { symbol: "$", usdRate: 1.3382990268 },
		SHP: { symbol: "£", usdRate: 0.7878837235 },
		SLL: { symbol: "Le ", usdRate: 22529.5039614949 },
		SOS: { symbol: "", usdRate: 568.49354951 },
		SRD: { symbol: "", usdRate: 37.5904863469 },
		SYP: { symbol: "", usdRate: 2512.4716122163 },
		SZL: { symbol: "E ", usdRate: 18.3068765024 },
		THB: { symbol: "", usdRate: 34.6145053312 },
		TJS: { symbol: "", usdRate: 10.910543648 },
		TMT: { symbol: "", usdRate: 3.493815819 },
		TND: { symbol: "", usdRate: 3.0798962121 },
		TOP: { symbol: "T$", usdRate: 2.348891792 },
		TRY: { symbol: "", usdRate: 23.5741775117 },
		TTD: { symbol: "$", usdRate: 6.778209748 },
		TZS: { symbol: "TSh ", usdRate: 2386.0864652815 },
		UAH: { symbol: "", usdRate: 36.9081420159 },
		UGX: { symbol: "USh ", usdRate: 3709.5253085314 },
		UYU: { symbol: "", usdRate: 38.4446776561 },
		UZS: { symbol: "", usdRate: 11496.3217659198 },
		VES: { symbol: "", usdRate: 26.9815731527 },
		VND: { symbol: "₫", usdRate: 23547.5671018768 },
		VUV: { symbol: "VT ", usdRate: 118.5628400539 },
		WST: { symbol: "WS$", usdRate: 2.7061212323 },
		XAF: { symbol: "FCFA ", usdRate: 603.972760016 },
		YER: { symbol: "", usdRate: 250.149739748 },
		ZAR: { symbol: "R ", usdRate: 18.3068765024 },
		ZMW: { symbol: "K ", usdRate: 19.0825028795 },
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
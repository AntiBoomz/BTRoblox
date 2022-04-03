"use strict"

const RobuxToCash = {
	// cash is in cents

	RegularPurchaseAmounts: [400, 800, 1700, 4500, 10000],
	PremiumPurchaseAmounts: [440, 880, 1870, 4950, 11000],
	
	UpdateDate: "April 4, 2022",
	
	Currencies: {
		None: { symbol: "", rates: [] },
		
		USD: { symbol: "$", rates: [499, 999, 1999, 4999, 9999] },
		EUR: { symbol: "€", rates: [499, 999, 2099, 4999, 9999] },
		GBP: { symbol: "£", rates: [459, 899, 1849, 4649, 9299] },
		CAD: { symbol: "CAD", rates: [649, 1299, 2599, 6499, 12999] },
		AUD: { symbol: "AU$", rates: [699, 1399, 2899, 7199, 14499] },
		NZD: { symbol: "NZ$", rates: [799, 1599, 3199, 8999, 16999] },
		MXN: { symbol: "MX$", rates: [8900, 18500, 36500, 91900, 184900] },
		HKD: { symbol: "HK$", rates: [3800, 7800, 15800, 38900, 77900] },
		TWD: { symbol: "NT$", rates: [15000, 30000, 59000, 161000, 321000] },
		CLP: { symbol: "CLP", rates: [330000, 650000, 1290000, 3330000, 6700000] },
		COP: { symbol: "COP", rates: [1490000, 2990000, 5790000, 15500000, 30900000] },
		
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
		
		AFN: { symbol: "", usdRate: 88.627814323 },
		ALL: { symbol: "", usdRate: 110.0539482752 },
		AMD: { symbol: "", usdRate: 483.215389516 },
		AOA: { symbol: "", usdRate: 444.5778816634 },
		ARS: { symbol: "", usdRate: 111.2988927574 },
		AZN: { symbol: "", usdRate: 1.6998905859 },
		BAM: { symbol: "", usdRate: 1.7724820386 },
		BDT: { symbol: "", usdRate: 85.8495671667 },
		BGN: { symbol: "", usdRate: 1.7724820386 },
		BIF: { symbol: "FBu ", usdRate: 2012.46422195 },
		BND: { symbol: "", usdRate: 1.3572092876 },
		BOB: { symbol: "", usdRate: 6.8783652769 },
		BRL: { symbol: "R$", usdRate: 4.6592376428 },
		BTN: { symbol: "", usdRate: 75.9916388483 },
		BWP: { symbol: "P ", usdRate: 11.4711265753 },
		BYN: { symbol: "", usdRate: 3.2550007663 },
		CDF: { symbol: "", usdRate: 2000.1400077916 },
		CHF: { symbol: "", usdRate: 0.9263839278 },
		CLF: { symbol: "", usdRate: 0.0285229337 },
		CNY: { symbol: "CN¥", usdRate: 6.3624666378 },
		CRC: { symbol: "", usdRate: 659.2125981332 },
		CUP: { symbol: "", usdRate: 24.4910356577 },
		CVE: { symbol: "", usdRate: 99.9328133837 },
		CZK: { symbol: "", usdRate: 22.0734130392 },
		DKK: { symbol: "", usdRate: 6.7396255973 },
		DOP: { symbol: "", usdRate: 55.0982782471 },
		DZD: { symbol: "", usdRate: 143.2346962244 },
		EGP: { symbol: "", usdRate: 18.2943319893 },
		ETB: { symbol: "", usdRate: 51.4716323012 },
		FJD: { symbol: "$", usdRate: 2.0907209946 },
		FKP: { symbol: "£", usdRate: 0.7635284326 },
		GEL: { symbol: "", usdRate: 3.0896016668 },
		GHS: { symbol: "GH₵", usdRate: 7.440780848 },
		GIP: { symbol: "£", usdRate: 0.7635284326 },
		GMD: { symbol: "D ", usdRate: 53.8288397092 },
		GNF: { symbol: "", usdRate: 8925.6940333549 },
		GTQ: { symbol: "", usdRate: 7.6844877292 },
		GYD: { symbol: "$", usdRate: 209.2602617113 },
		HNL: { symbol: "", usdRate: 24.5185435223 },
		HRK: { symbol: "", usdRate: 6.846006859 },
		HTG: { symbol: "", usdRate: 106.4612961297 },
		HUF: { symbol: "", usdRate: 332.6342818284 },
		IDR: { symbol: "", usdRate: 14366.3164686581 },
		ILS: { symbol: "₪", usdRate: 3.204386202 },
		INR: { symbol: "₹", usdRate: 75.9916388483 },
		IQD: { symbol: "", usdRate: 1459.7170977747 },
		IRR: { symbol: "", usdRate: 42151.1923243142 },
		ISK: { symbol: "", usdRate: 128.4488904317 },
		JMD: { symbol: "$", usdRate: 153.2767792449 },
		JPY: { symbol: "¥", usdRate: 122.6391542933 },
		KES: { symbol: "Ksh", usdRate: 115.2239198674 },
		KGS: { symbol: "", usdRate: 81.5205002028 },
		KHR: { symbol: "", usdRate: 4056.0029015905 },
		KMF: { symbol: "", usdRate: 445.8485658071 },
		KPW: { symbol: "", usdRate: 899.9369556181 },
		KRW: { symbol: "₩", usdRate: 1219.6878016836 },
		KWD: { symbol: "", usdRate: 0.3044421626 },
		KZT: { symbol: "", usdRate: 475.4657797527 },
		LAK: { symbol: "", usdRate: 11782.8021417873 },
		LKR: { symbol: "", usdRate: 293.938841895 },
		LRD: { symbol: "$", usdRate: 152.5957972933 },
		LSL: { symbol: "", usdRate: 14.6761909265 },
		LYD: { symbol: "", usdRate: 4.6482621176 },
		MAD: { symbol: "", usdRate: 9.7235996985 },
		MDL: { symbol: "", usdRate: 18.3145307245 },
		MGA: { symbol: "Ar ", usdRate: 4031.8146655556 },
		MKD: { symbol: "", usdRate: 55.6874698158 },
		MMK: { symbol: "", usdRate: 1777.5587777587 },
		MNT: { symbol: "", usdRate: 2975.544030617 },
		MOP: { symbol: "MOP$", usdRate: 8.0676576928 },
		MUR: { symbol: "Rs ", usdRate: 44.8500076381 },
		MVR: { symbol: "", usdRate: 15.4547341736 },
		MWK: { symbol: "MK ", usdRate: 817.4371372061 },
		MXV: { symbol: "", usdRate: 2.8807263884 },
		MYR: { symbol: "RM ", usdRate: 4.2092832259 },
		MZN: { symbol: "", usdRate: 63.6901369713 },
		NAD: { symbol: "$", usdRate: 14.6761909265 },
		NGN: { symbol: "₦", usdRate: 415.7247377794 },
		NIO: { symbol: "", usdRate: 35.8509664482 },
		NOK: { symbol: "", usdRate: 8.7587108105 },
		NPR: { symbol: "", usdRate: 121.6436158864 },
		PEN: { symbol: "", usdRate: 3.6983048587 },
		PGK: { symbol: "K ", usdRate: 3.5329222753 },
		PHP: { symbol: "₱", usdRate: 51.5322705423 },
		PKR: { symbol: "Rs ", usdRate: 184.3671588285 },
		PLN: { symbol: "", usdRate: 4.2068218373 },
		PYG: { symbol: "", usdRate: 6943.3129913749 },
		RON: { symbol: "", usdRate: 4.4801468183 },
		RSD: { symbol: "", usdRate: 106.6400327388 },
		RUB: { symbol: "", usdRate: 85.2439276281 },
		RWF: { symbol: "RF ", usdRate: 1018.2625263155 },
		SBD: { symbol: "$", usdRate: 8.0938594469 },
		SCR: { symbol: "Rs ", usdRate: 14.3913060413 },
		SDG: { symbol: "", usdRate: 447.1462323361 },
		SEK: { symbol: "", usdRate: 9.3741957376 },
		SGD: { symbol: "$", usdRate: 1.3572092876 },
		SHP: { symbol: "£", usdRate: 0.7635284326 },
		SLL: { symbol: "Le ", usdRate: 11784.6951104315 },
		SOS: { symbol: "", usdRate: 578.4695199387 },
		SRD: { symbol: "", usdRate: 20.74921688 },
		SYP: { symbol: "", usdRate: 2512.5404050996 },
		SZL: { symbol: "E ", usdRate: 14.6761909265 },
		THB: { symbol: "", usdRate: 33.5681645286 },
		TJS: { symbol: "", usdRate: 12.9804411128 },
		TMT: { symbol: "", usdRate: 3.4934138964 },
		TND: { symbol: "", usdRate: 2.9393022186 },
		TOP: { symbol: "T$", usdRate: 2.2374391934 },
		TRY: { symbol: "", usdRate: 14.6881296598 },
		TTD: { symbol: "$", usdRate: 6.7922856836 },
		TZS: { symbol: "TSh ", usdRate: 2322.9785098268 },
		UAH: { symbol: "", usdRate: 29.5252071809 },
		UGX: { symbol: "USh ", usdRate: 3584.0238360219 },
		UYU: { symbol: "", usdRate: 41.3194413246 },
		UZS: { symbol: "", usdRate: 11395.1402313861 },
		VES: { symbol: "", usdRate: 4.3847221184 },
		VND: { symbol: "₫", usdRate: 22789.0623392346 },
		VUV: { symbol: "VT ", usdRate: 110.5703564407 },
		WST: { symbol: "WS$", usdRate: 2.551398711 },
		XAF: { symbol: "FCFA ", usdRate: 594.4647544095 },
		YER: { symbol: "", usdRate: 250.1936727653 },
		ZAR: { symbol: "R ", usdRate: 14.6761909265 },
		ZMW: { symbol: "K ", usdRate: 17.9282256783 },
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

		return `${option.currency.symbol}{{((${expr})*${option.cash}/${option.robux} + 0.4999)/100 | number: 2}}`
	},

	convert(robux) {
		const option = this.getSelectedOption()

		const cash = Math.round((robux * option.cash) / option.robux + 0.4999) / 100
		const cashString = formatNumber(cash.toFixed(2))

		return `${option.currency.symbol}${cashString}`
	}
}


Object.entries(RobuxToCash.Currencies).forEach(([name, currency]) => {
	currency.name = name
	
	if(!currency.symbol || (currency.usdRate && (currency.symbol === "$" || currency.symbol === "£"))) {
		currency.symbol = `${name} `
	}
	
	if(currency.usdRate) {
		currency.rates = RobuxToCash.Currencies.USD.rates.map(x => x * currency.usdRate)
	}

	const list = RobuxToCash.OptionLists[name] = RobuxToCash.OptionLists[name] || []
	currency.rates.forEach((cash, index) => {
		const regular = { name: `${name.toLowerCase()}Regular${index}`, cash: cash, robux: RobuxToCash.RegularPurchaseAmounts[index] }
		const premium = { name: `${name.toLowerCase()}Premium${index}`, cash: cash, robux: RobuxToCash.PremiumPurchaseAmounts[index] }
		
		if(currency.usdRate) {
			regular.usdCash = premium.usdCash = RobuxToCash.Currencies.USD.rates[index]
		}
		
		list.push(regular, premium)
	})
})

Object.entries(RobuxToCash.OptionLists).forEach(([name, list]) => {
	const currency = RobuxToCash.Currencies[name]

	list.forEach(option => {
		option.currency = currency
		RobuxToCash.Options[option.name] = option
	})
})
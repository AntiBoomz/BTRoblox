"use strict"

const RobuxToCash = {
	// cash is in cents

	RegularPurchaseAmounts: [400, 800, 1700, 4500, 10000],
	PremiumPurchaseAmounts: [440, 880, 1870, 4950, 11000],
	
	UpdateDate: "September 18, 2021",
	
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
		
		AFN: { symbol: "", usdRate: 79.9307202352 },
		ALL: { symbol: "", usdRate: 103.451275992 },
		AMD: { symbol: "", usdRate: 484.9146463844 },
		AOA: { symbol: "", usdRate: 620.7021510943 },
		ARS: { symbol: "", usdRate: 98.2044362774 },
		AZN: { symbol: "", usdRate: 1.6999713039 },
		BAM: { symbol: "", usdRate: 1.6680533286 },
		BDT: { symbol: "", usdRate: 84.8710112854 },
		BGN: { symbol: "", usdRate: 1.6680533286 },
		BIF: { symbol: "FBu ", usdRate: 1984.7808687294 },
		BND: { symbol: "", usdRate: 1.3485038526 },
		BOB: { symbol: "", usdRate: 6.9064074985 },
		BRL: { symbol: "R$", usdRate: 5.2860946144 },
		BTN: { symbol: "", usdRate: 73.6989951574 },
		BWP: { symbol: "P ", usdRate: 11.0836669646 },
		BYN: { symbol: "", usdRate: 2.4800235661 },
		CDF: { symbol: "", usdRate: 1986.076903224 },
		CHF: { symbol: "", usdRate: 0.9321132682 },
		CLF: { symbol: "", usdRate: 0.0284314268 },
		CNY: { symbol: "CN¥", usdRate: 6.46620863 },
		CRC: { symbol: "", usdRate: 625.654006542 },
		CUP: { symbol: "", usdRate: 24.9999161525 },
		CVE: { symbol: "", usdRate: 94.0451064466 },
		CZK: { symbol: "", usdRate: 21.6467105455 },
		DKK: { symbol: "", usdRate: 6.3416669197 },
		DOP: { symbol: "", usdRate: 56.5507270026 },
		DZD: { symbol: "", usdRate: 137.2817930199 },
		EGP: { symbol: "", usdRate: 15.6954651769 },
		ETB: { symbol: "", usdRate: 46.799419095 },
		FJD: { symbol: "$", usdRate: 2.0899253933 },
		FKP: { symbol: "£", usdRate: 0.7279011332 },
		GEL: { symbol: "", usdRate: 3.1123180271 },
		GHS: { symbol: "GH₵", usdRate: 5.9735467783 },
		GIP: { symbol: "£", usdRate: 0.7279011332 },
		GMD: { symbol: "D ", usdRate: 51.5394885099 },
		GNF: { symbol: "", usdRate: 9787.5967563414 },
		GTQ: { symbol: "", usdRate: 7.7335690597 },
		GYD: { symbol: "$", usdRate: 209.7780662602 },
		HNL: { symbol: "", usdRate: 24.1197360618 },
		HRK: { symbol: "", usdRate: 6.4050453972 },
		HTG: { symbol: "", usdRate: 97.5201798634 },
		HUF: { symbol: "", usdRate: 300.8827294222 },
		IDR: { symbol: "", usdRate: 14242.3142572987 },
		ILS: { symbol: "₪", usdRate: 3.2096705362 },
		INR: { symbol: "₹", usdRate: 73.6989951574 },
		IQD: { symbol: "", usdRate: 1459.9331881692 },
		IRR: { symbol: "", usdRate: 42025.2924110437 },
		ISK: { symbol: "", usdRate: 129.1921600654 },
		JMD: { symbol: "$", usdRate: 147.8278892626 },
		JPY: { symbol: "¥", usdRate: 109.9736468223 },
		KES: { symbol: "Ksh", usdRate: 109.9318728559 },
		KGS: { symbol: "", usdRate: 84.7771894852 },
		KHR: { symbol: "", usdRate: 4068.8891249119 },
		KMF: { symbol: "", usdRate: 419.5806603521 },
		KPW: { symbol: "", usdRate: 899.9996520859 },
		KRW: { symbol: "₩", usdRate: 1182.0176025465 },
		KWD: { symbol: "", usdRate: 0.3014923251 },
		KZT: { symbol: "", usdRate: 425.2332383586 },
		LAK: { symbol: "", usdRate: 9553.0474992441 },
		LKR: { symbol: "", usdRate: 199.4045894228 },
		LRD: { symbol: "$", usdRate: 171.1719516735 },
		LSL: { symbol: "", usdRate: 14.7184919855 },
		LYD: { symbol: "", usdRate: 4.5110365969 },
		MAD: { symbol: "", usdRate: 8.9918514739 },
		MDL: { symbol: "", usdRate: 17.6122892614 },
		MGA: { symbol: "Ar ", usdRate: 3932.1717911718 },
		MKD: { symbol: "", usdRate: 52.3153155112 },
		MMK: { symbol: "", usdRate: 1731.0998631926 },
		MNT: { symbol: "", usdRate: 2850.6895569079 },
		MOP: { symbol: "MOP$", usdRate: 8.0154830154 },
		MUR: { symbol: "Rs ", usdRate: 43.0096497772 },
		MVR: { symbol: "", usdRate: 15.578449727 },
		MWK: { symbol: "MK ", usdRate: 813.0635629005 },
		MXV: { symbol: "", usdRate: 2.9742684989 },
		MYR: { symbol: "RM ", usdRate: 4.1721940332 },
		MZN: { symbol: "", usdRate: 63.6901008748 },
		NAD: { symbol: "$", usdRate: 14.7184919855 },
		NGN: { symbol: "₦", usdRate: 411.533012853 },
		NIO: { symbol: "", usdRate: 35.1997118663 },
		NOK: { symbol: "", usdRate: 8.7099778928 },
		NPR: { symbol: "", usdRate: 118.4711347155 },
		PEN: { symbol: "", usdRate: 4.1028473291 },
		PGK: { symbol: "K ", usdRate: 3.5291327104 },
		PHP: { symbol: "₱", usdRate: 50.0679520408 },
		PKR: { symbol: "Rs ", usdRate: 168.00335245 },
		PLN: { symbol: "", usdRate: 3.9155081246 },
		PYG: { symbol: "", usdRate: 6929.8647809008 },
		RON: { symbol: "", usdRate: 4.2223620322 },
		RSD: { symbol: "", usdRate: 99.7741569759 },
		RUB: { symbol: "", usdRate: 72.8532861261 },
		RWF: { symbol: "RF ", usdRate: 994.4658976026 },
		SBD: { symbol: "$", usdRate: 8.0515137244 },
		SCR: { symbol: "Rs ", usdRate: 14.034753718 },
		SDG: { symbol: "", usdRate: 439.2716450864 },
		SEK: { symbol: "", usdRate: 8.6835914841 },
		SGD: { symbol: "$", usdRate: 1.3485038526 },
		SHP: { symbol: "£", usdRate: 0.7279011332 },
		SLL: { symbol: "Le ", usdRate: 10422.5354968557 },
		SOS: { symbol: "", usdRate: 584.3379655694 },
		SRD: { symbol: "", usdRate: 21.4304447179 },
		SYP: { symbol: "", usdRate: 1257.8616353378 },
		SZL: { symbol: "E ", usdRate: 14.7184919855 },
		THB: { symbol: "", usdRate: 33.2946805887 },
		TJS: { symbol: "", usdRate: 11.319172117 },
		TMT: { symbol: "", usdRate: 3.4999694818 },
		TND: { symbol: "", usdRate: 2.7948476187 },
		TOP: { symbol: "T$", usdRate: 2.2316210313 },
		TRY: { symbol: "", usdRate: 8.6374910689 },
		TTD: { symbol: "$", usdRate: 6.7793890309 },
		TZS: { symbol: "TSh ", usdRate: 2317.7390281914 },
		UAH: { symbol: "", usdRate: 26.7666413866 },
		UGX: { symbol: "USh ", usdRate: 3529.6458095804 },
		UYU: { symbol: "", usdRate: 42.6643267155 },
		UZS: { symbol: "", usdRate: 10680.8707794347 },
		VES: { symbol: "", usdRate: 4035481.971941981 },
		VND: { symbol: "₫", usdRate: 22809.5705367589 },
		VUV: { symbol: "VT ", usdRate: 110.9504397469 },
		WST: { symbol: "WS$", usdRate: 2.5458125717 },
		XAF: { symbol: "FCFA ", usdRate: 559.4408804695 },
		YER: { symbol: "", usdRate: 250.4396209096 },
		ZAR: { symbol: "R ", usdRate: 14.7184919855 },
		ZMW: { symbol: "K ", usdRate: 16.4705978018 },
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
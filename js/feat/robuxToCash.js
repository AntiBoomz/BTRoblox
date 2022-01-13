"use strict"

const RobuxToCash = {
	// cash is in cents

	RegularPurchaseAmounts: [400, 800, 1700, 4500, 10000],
	PremiumPurchaseAmounts: [440, 880, 1870, 4950, 11000],
	
	UpdateDate: "January 13, 2022",
	
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
		
		AFN: { symbol: "", usdRate: 104.6140467899 },
		ALL: { symbol: "", usdRate: 106.7822024995 },
		AMD: { symbol: "", usdRate: 479.3864347634 },
		AOA: { symbol: "", usdRate: 548.2383525998 },
		ARS: { symbol: "", usdRate: 103.7598966286 },
		AZN: { symbol: "", usdRate: 1.698990816 },
		BAM: { symbol: "", usdRate: 1.7076640615 },
		BDT: { symbol: "", usdRate: 85.749267484 },
		BGN: { symbol: "", usdRate: 1.7076640615 },
		BIF: { symbol: "FBu ", usdRate: 2006.9455518144 },
		BND: { symbol: "", usdRate: 1.3465180406 },
		BOB: { symbol: "", usdRate: 6.8773875391 },
		BRL: { symbol: "R$", usdRate: 5.533809727 },
		BTN: { symbol: "", usdRate: 73.965675223 },
		BWP: { symbol: "P ", usdRate: 11.6044331318 },
		BYN: { symbol: "", usdRate: 2.5692902291 },
		CDF: { symbol: "", usdRate: 1989.3310784754 },
		CHF: { symbol: "", usdRate: 0.9112277207 },
		CLF: { symbol: "", usdRate: 0.0295924455 },
		CNY: { symbol: "CN¥", usdRate: 6.3604835015 },
		CRC: { symbol: "", usdRate: 638.9536905815 },
		CUP: { symbol: "", usdRate: 24.2770229817 },
		CVE: { symbol: "", usdRate: 96.2783657384 },
		CZK: { symbol: "", usdRate: 21.4289346517 },
		DKK: { symbol: "", usdRate: 6.4973351858 },
		DOP: { symbol: "", usdRate: 57.7879724884 },
		DZD: { symbol: "", usdRate: 139.8483021346 },
		EGP: { symbol: "", usdRate: 15.6902987965 },
		ETB: { symbol: "", usdRate: 49.4978534577 },
		FJD: { symbol: "$", usdRate: 2.1115187686 },
		FKP: { symbol: "£", usdRate: 0.7295685168 },
		GEL: { symbol: "", usdRate: 3.0750270523 },
		GHS: { symbol: "GH₵", usdRate: 6.1755979001 },
		GIP: { symbol: "£", usdRate: 0.7295685168 },
		GMD: { symbol: "D ", usdRate: 52.8932932439 },
		GNF: { symbol: "", usdRate: 9084.0037000091 },
		GTQ: { symbol: "", usdRate: 7.6932863035 },
		GYD: { symbol: "$", usdRate: 208.4217833822 },
		HNL: { symbol: "", usdRate: 24.5467104788 },
		HRK: { symbol: "", usdRate: 6.5651087684 },
		HTG: { symbol: "", usdRate: 101.4722328971 },
		HUF: { symbol: "", usdRate: 309.6975467214 },
		IDR: { symbol: "", usdRate: 14293.3948012248 },
		ILS: { symbol: "₪", usdRate: 3.1148755347 },
		INR: { symbol: "₹", usdRate: 73.965675223 },
		IQD: { symbol: "", usdRate: 1459.4868951827 },
		IRR: { symbol: "", usdRate: 42295.50280276 },
		ISK: { symbol: "", usdRate: 128.5181902751 },
		JMD: { symbol: "$", usdRate: 154.1387358867 },
		JPY: { symbol: "¥", usdRate: 114.1279494047 },
		KES: { symbol: "Ksh", usdRate: 113.393668313 },
		KGS: { symbol: "", usdRate: 84.7990840556 },
		KHR: { symbol: "", usdRate: 4072.2438685338 },
		KMF: { symbol: "", usdRate: 429.544309114 },
		KPW: { symbol: "", usdRate: 899.9721735626 },
		KRW: { symbol: "₩", usdRate: 1187.3443710112 },
		KWD: { symbol: "", usdRate: 0.3021384775 },
		KZT: { symbol: "", usdRate: 435.0963880892 },
		LAK: { symbol: "", usdRate: 11264.1677109578 },
		LKR: { symbol: "", usdRate: 202.9607502731 },
		LRD: { symbol: "$", usdRate: 148.8085435158 },
		LSL: { symbol: "", usdRate: 15.4048877014 },
		LYD: { symbol: "", usdRate: 4.5892003678 },
		MAD: { symbol: "", usdRate: 9.2070680623 },
		MDL: { symbol: "", usdRate: 17.9572978906 },
		MGA: { symbol: "Ar ", usdRate: 3968.628550815 },
		MKD: { symbol: "", usdRate: 53.932630004 },
		MMK: { symbol: "", usdRate: 1774.3894552182 },
		MNT: { symbol: "", usdRate: 2858.143327544 },
		MOP: { symbol: "MOP$", usdRate: 8.021746585 },
		MUR: { symbol: "Rs ", usdRate: 43.7766881781 },
		MVR: { symbol: "", usdRate: 15.3315091952 },
		MWK: { symbol: "MK ", usdRate: 816.7521082268 },
		MXV: { symbol: "", usdRate: 2.9989843637 },
		MYR: { symbol: "RM ", usdRate: 4.1765905062 },
		MZN: { symbol: "", usdRate: 63.8399258478 },
		NAD: { symbol: "$", usdRate: 15.4048877014 },
		NGN: { symbol: "₦", usdRate: 414.1001807105 },
		NIO: { symbol: "", usdRate: 35.3973067505 },
		NOK: { symbol: "", usdRate: 8.7155846589 },
		NPR: { symbol: "", usdRate: 118.4005546132 },
		PEN: { symbol: "", usdRate: 3.8928094037 },
		PGK: { symbol: "K ", usdRate: 3.5089782376 },
		PHP: { symbol: "₱", usdRate: 51.1711627748 },
		PKR: { symbol: "Rs ", usdRate: 176.4139610289 },
		PLN: { symbol: "", usdRate: 3.962995756 },
		PYG: { symbol: "", usdRate: 6929.436661451 },
		RON: { symbol: "", usdRate: 4.316366847 },
		RSD: { symbol: "", usdRate: 102.6679415505 },
		RUB: { symbol: "", usdRate: 76.4120478834 },
		RWF: { symbol: "RF ", usdRate: 1017.566845496 },
		SBD: { symbol: "$", usdRate: 8.0964224618 },
		SCR: { symbol: "Rs ", usdRate: 13.0725961343 },
		SDG: { symbol: "", usdRate: 437.4755996779 },
		SEK: { symbol: "", usdRate: 8.9378727289 },
		SGD: { symbol: "$", usdRate: 1.3465180406 },
		SHP: { symbol: "£", usdRate: 0.7295685168 },
		SLL: { symbol: "Le ", usdRate: 11364.1131055544 },
		SOS: { symbol: "", usdRate: 584.1183377968 },
		SRD: { symbol: "", usdRate: 21.2123834494 },
		SYP: { symbol: "", usdRate: 2512.017640148 },
		SZL: { symbol: "E ", usdRate: 15.4048877014 },
		THB: { symbol: "", usdRate: 33.2378914876 },
		TJS: { symbol: "", usdRate: 11.2685838023 },
		TMT: { symbol: "", usdRate: 3.5033688488 },
		TND: { symbol: "", usdRate: 2.8578494227 },
		TOP: { symbol: "T$", usdRate: 2.2714830574 },
		TRY: { symbol: "", usdRate: 13.5873630261 },
		TTD: { symbol: "$", usdRate: 6.7916919796 },
		TZS: { symbol: "TSh ", usdRate: 2306.8441226883 },
		UAH: { symbol: "", usdRate: 27.8965140098 },
		UGX: { symbol: "USh ", usdRate: 3526.3943722194 },
		UYU: { symbol: "", usdRate: 44.557015209 },
		UZS: { symbol: "", usdRate: 10877.3134151276 },
		VES: { symbol: "", usdRate: 4.6310627812 },
		VND: { symbol: "₫", usdRate: 22781.6397651358 },
		VUV: { symbol: "VT ", usdRate: 112.6663632489 },
		WST: { symbol: "WS$", usdRate: 2.5977951551 },
		XAF: { symbol: "FCFA ", usdRate: 572.7257454853 },
		YER: { symbol: "", usdRate: 250.2940363106 },
		ZAR: { symbol: "R ", usdRate: 15.4048877014 },
		ZMW: { symbol: "K ", usdRate: 17.0738256836 },
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
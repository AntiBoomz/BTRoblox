"use strict"

const RobuxToCash = {
	// cash is in cents

	RegularPurchaseAmounts: [400, 800, 1700, 4500, 10000],
	PremiumPurchaseAmounts: [440, 880, 1870, 4950, 11000],
	
	UpdateDate: "September 5, 2021",
	
	Currencies: {
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
		
		AFN: { symbol: "", usdRate: 79.9307218021 },
		ALL: { symbol: "", usdRate: 102.4535997887 },
		AMD: { symbol: "", usdRate: 493.6499337922 },
		AOA: { symbol: "", usdRate: 632.9795695879 },
		ARS: { symbol: "", usdRate: 97.8559960652 },
		AZN: { symbol: "", usdRate: 1.6999755522 },
		BAM: { symbol: "", usdRate: 1.6461534682 },
		BDT: { symbol: "", usdRate: 84.8456405649 },
		BGN: { symbol: "", usdRate: 1.6461534682 },
		BIF: { symbol: "FBu ", usdRate: 1980.5102339582 },
		BND: { symbol: "", usdRate: 1.3413217294 },
		BOB: { symbol: "", usdRate: 6.8950563191 },
		BRL: { symbol: "R$", usdRate: 5.1917409685 },
		BTN: { symbol: "", usdRate: 73.0070930218 },
		BWP: { symbol: "P ", usdRate: 10.9767645432 },
		BYN: { symbol: "", usdRate: 2.5000001558 },
		CDF: { symbol: "", usdRate: 1986.0301521983 },
		CHF: { symbol: "", usdRate: 0.9138410832 },
		CLF: { symbol: "", usdRate: 0.0277986591 },
		CNY: { symbol: "CN¥", usdRate: 6.4532861475 },
		CRC: { symbol: "", usdRate: 624.1531830501 },
		CUP: { symbol: "", usdRate: 25.0000003734 },
		CVE: { symbol: "", usdRate: 92.8103889089 },
		CZK: { symbol: "", usdRate: 21.3484483654 },
		DKK: { symbol: "", usdRate: 6.260750324 },
		DOP: { symbol: "", usdRate: 56.94050032 },
		DZD: { symbol: "", usdRate: 136.2592635038 },
		EGP: { symbol: "", usdRate: 15.7029518787 },
		ETB: { symbol: "", usdRate: 45.622973657 },
		FJD: { symbol: "$", usdRate: 2.0818495597 },
		FKP: { symbol: "£", usdRate: 0.7213940574 },
		GEL: { symbol: "", usdRate: 3.1148694582 },
		GHS: { symbol: "GH₵", usdRate: 5.9921929593 },
		GIP: { symbol: "£", usdRate: 0.7213940574 },
		GMD: { symbol: "D ", usdRate: 51.1337908438 },
		GNF: { symbol: "", usdRate: 9795.4608422973 },
		GTQ: { symbol: "", usdRate: 7.7334266266 },
		GYD: { symbol: "$", usdRate: 209.9878993129 },
		HNL: { symbol: "", usdRate: 23.9642755651 },
		HRK: { symbol: "", usdRate: 6.3047997319 },
		HTG: { symbol: "", usdRate: 98.0886468613 },
		HUF: { symbol: "", usdRate: 292.5101997469 },
		IDR: { symbol: "", usdRate: 14262.5324918725 },
		ILS: { symbol: "₪", usdRate: 3.2042511432 },
		INR: { symbol: "₹", usdRate: 73.0070930218 },
		IQD: { symbol: "", usdRate: 1459.4270373335 },
		IRR: { symbol: "", usdRate: 42025.3186189662 },
		ISK: { symbol: "", usdRate: 126.8388411672 },
		JMD: { symbol: "$", usdRate: 150.394282336 },
		JPY: { symbol: "¥", usdRate: 109.6903629995 },
		KES: { symbol: "Ksh", usdRate: 110.0707758101 },
		KGS: { symbol: "", usdRate: 84.7499733971 },
		KHR: { symbol: "", usdRate: 4079.3163641796 },
		KMF: { symbol: "", usdRate: 414.0719888289 },
		KPW: { symbol: "", usdRate: 900.0000588389 },
		KRW: { symbol: "₩", usdRate: 1154.6870304066 },
		KWD: { symbol: "", usdRate: 0.3012977905 },
		KZT: { symbol: "", usdRate: 425.142532608 },
		LAK: { symbol: "", usdRate: 9601.4427265902 },
		LKR: { symbol: "", usdRate: 199.3503585184 },
		LRD: { symbol: "$", usdRate: 171.7561393492 },
		LSL: { symbol: "", usdRate: 14.3115337288 },
		LYD: { symbol: "", usdRate: 4.5064062466 },
		MAD: { symbol: "", usdRate: 8.9244939114 },
		MDL: { symbol: "", usdRate: 17.6000392592 },
		MGA: { symbol: "Ar ", usdRate: 3918.9614303894 },
		MKD: { symbol: "", usdRate: 51.930048092 },
		MMK: { symbol: "", usdRate: 1645.3684412831 },
		MNT: { symbol: "", usdRate: 2850.6063833164 },
		MOP: { symbol: "MOP$", usdRate: 8.0043652123 },
		MUR: { symbol: "Rs ", usdRate: 42.850204557 },
		MVR: { symbol: "", usdRate: 15.6698557229 },
		MWK: { symbol: "MK ", usdRate: 814.4411020515 },
		MXV: { symbol: "", usdRate: 2.970020056 },
		MYR: { symbol: "RM ", usdRate: 4.1462185397 },
		MZN: { symbol: "", usdRate: 63.6498402785 },
		NAD: { symbol: "$", usdRate: 14.3115337288 },
		NGN: { symbol: "₦", usdRate: 411.5213211312 },
		NIO: { symbol: "", usdRate: 35.0898137095 },
		NOK: { symbol: "", usdRate: 8.6700571796 },
		NPR: { symbol: "", usdRate: 117.3589020325 },
		PEN: { symbol: "", usdRate: 4.0841664516 },
		PGK: { symbol: "K ", usdRate: 3.5087860019 },
		PHP: { symbol: "₱", usdRate: 49.8975961314 },
		PKR: { symbol: "Rs ", usdRate: 166.7839429552 },
		PLN: { symbol: "", usdRate: 3.7924572057 },
		PYG: { symbol: "", usdRate: 6948.9322854347 },
		RON: { symbol: "", usdRate: 4.1603015953 },
		RSD: { symbol: "", usdRate: 98.1430584546 },
		RUB: { symbol: "", usdRate: 72.8212872558 },
		RWF: { symbol: "RF ", usdRate: 992.8193620668 },
		SBD: { symbol: "$", usdRate: 8.0515053274 },
		SCR: { symbol: "Rs ", usdRate: 13.6269748761 },
		SDG: { symbol: "", usdRate: 440.0857207468 },
		SEK: { symbol: "", usdRate: 8.5460870981 },
		SGD: { symbol: "$", usdRate: 1.3413217294 },
		SHP: { symbol: "£", usdRate: 0.7213940574 },
		SLL: { symbol: "Le ", usdRate: 10329.7389214787 },
		SOS: { symbol: "", usdRate: 575.8713612102 },
		SRD: { symbol: "", usdRate: 21.4549277648 },
		SYP: { symbol: "", usdRate: 1257.8616353378 },
		SZL: { symbol: "E ", usdRate: 14.3115337288 },
		THB: { symbol: "", usdRate: 32.4172341434 },
		TJS: { symbol: "", usdRate: 11.3207342468 },
		TMT: { symbol: "", usdRate: 3.5035180505 },
		TND: { symbol: "", usdRate: 2.7714825784 },
		TOP: { symbol: "T$", usdRate: 2.2431790816 },
		TRY: { symbol: "", usdRate: 8.314121069 },
		TTD: { symbol: "$", usdRate: 6.7764973684 },
		TZS: { symbol: "TSh ", usdRate: 2317.4985646575 },
		UAH: { symbol: "", usdRate: 27.134916356 },
		UGX: { symbol: "USh ", usdRate: 3527.3184337608 },
		UYU: { symbol: "", usdRate: 42.6315986785 },
		UZS: { symbol: "", usdRate: 10670.6132559472 },
		VES: { symbol: "", usdRate: 4078013.2006997336 },
		VND: { symbol: "₫", usdRate: 22805.0088816274 },
		VUV: { symbol: "VT ", usdRate: 110.0818369269 },
		WST: { symbol: "WS$", usdRate: 2.5471109111 },
		XAF: { symbol: "FCFA ", usdRate: 552.0959851051 },
		YER: { symbol: "", usdRate: 250.2703394191 },
		ZAR: { symbol: "R ", usdRate: 14.3115337288 },
		ZMW: { symbol: "K ", usdRate: 16.180615116 },
	},
	
	OptionLists: {
		USD: [
			{ name: "devex", cash: 350, robux: 1000 }
		]
	},

	Options: {},

	getSelectedOption() {
		if(!SETTINGS.loaded) {
			return this.Options.devex
		}

		return this.Options[SETTINGS.get("general.robuxToUSDRate")] || this.Options.devex
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
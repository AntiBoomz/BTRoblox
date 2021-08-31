"use strict"

const RobuxToCash = {
	// cash is in cents

	RegularPurchaseAmounts: [400, 800, 1700, 4500, 10000],
	PremiumPurchaseAmounts: [440, 880, 1870, 4950, 11000],

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
		
		AFN: { symbol: "", usdRate: 79.9522702183 },
		ALL: { symbol: "", usdRate: 102.9804709102 },
		AMD: { symbol: "", usdRate: 486.2065889488 },
		AOA: { symbol: "", usdRate: 647.1718000836 },
		ARS: { symbol: "", usdRate: 96.8118922797 },
		AZN: { symbol: "", usdRate: 1.6989786713 },
		BAM: { symbol: "", usdRate: 1.6490605955 },
		BDT: { symbol: "", usdRate: 84.8245541371 },
		BGN: { symbol: "", usdRate: 1.6490605955 },
		BIF: { symbol: "FBu ", usdRate: 1982.025276205 },
		BND: { symbol: "", usdRate: 1.3519072296 },
		BOB: { symbol: "", usdRate: 6.9013928527 },
		BRL: { symbol: "R$", usdRate: 5.2383268456 },
		BTN: { symbol: "", usdRate: 74.2606438149 },
		BWP: { symbol: "P ", usdRate: 11.0199212241 },
		BYN: { symbol: "", usdRate: 2.5101905674 },
		CDF: { symbol: "", usdRate: 1972.7214502493 },
		CHF: { symbol: "", usdRate: 0.9045367944 },
		CLF: { symbol: "", usdRate: 0.0279365417 },
		CNY: { symbol: "CN¥", usdRate: 6.4706141441 },
		CRC: { symbol: "", usdRate: 619.7684619732 },
		CUP: { symbol: "", usdRate: 24.0000583415 },
		CVE: { symbol: "", usdRate: 92.974293197 },
		CZK: { symbol: "", usdRate: 21.4731592042 },
		DKK: { symbol: "", usdRate: 6.2710418635 },
		DOP: { symbol: "", usdRate: 57.071079954 },
		DZD: { symbol: "", usdRate: 134.714633971 },
		EGP: { symbol: "", usdRate: 15.6995149529 },
		ETB: { symbol: "", usdRate: 44.2892835628 },
		FJD: { symbol: "$", usdRate: 2.0886503052 },
		FKP: { symbol: "£", usdRate: 0.7192444396 },
		GEL: { symbol: "", usdRate: 3.1078722934 },
		GHS: { symbol: "GH₵", usdRate: 6.0006170095 },
		GIP: { symbol: "£", usdRate: 0.7192444396 },
		GMD: { symbol: "D ", usdRate: 51.1529942043 },
		GNF: { symbol: "", usdRate: 9754.424831996 },
		GTQ: { symbol: "", usdRate: 7.7451950229 },
		GYD: { symbol: "$", usdRate: 208.7581603022 },
		HNL: { symbol: "", usdRate: 23.7248973449 },
		HRK: { symbol: "", usdRate: 6.3238442738 },
		HTG: { symbol: "", usdRate: 95.9843358639 },
		HUF: { symbol: "", usdRate: 299.9657113196 },
		IDR: { symbol: "", usdRate: 14338.0568082289 },
		ILS: { symbol: "₪", usdRate: 3.2128935432 },
		INR: { symbol: "₹", usdRate: 74.2606438149 },
		IQD: { symbol: "", usdRate: 1459.3717883796 },
		IRR: { symbol: "", usdRate: 42025.5127377942 },
		ISK: { symbol: "", usdRate: 123.9507611753 },
		JMD: { symbol: "$", usdRate: 154.6648649007 },
		JPY: { symbol: "¥", usdRate: 109.0703100934 },
		KES: { symbol: "Ksh", usdRate: 108.6427346028 },
		KGS: { symbol: "", usdRate: 84.7051500147 },
		KHR: { symbol: "", usdRate: 4078.3704680215 },
		KMF: { symbol: "", usdRate: 414.8032450526 },
		KPW: { symbol: "", usdRate: 899.9414925814 },
		KRW: { symbol: "₩", usdRate: 1150.1654605031 },
		KWD: { symbol: "", usdRate: 0.3002901805 },
		KZT: { symbol: "", usdRate: 424.5017193505 },
		LAK: { symbol: "", usdRate: 9552.4081728706 },
		LKR: { symbol: "", usdRate: 199.4675825221 },
		LRD: { symbol: "$", usdRate: 171.6457302267 },
		LSL: { symbol: "", usdRate: 14.3169161372 },
		LYD: { symbol: "", usdRate: 4.5096353816 },
		MAD: { symbol: "", usdRate: 8.9262895255 },
		MDL: { symbol: "", usdRate: 17.8843224812 },
		MGA: { symbol: "Ar ", usdRate: 3799.0070029966 },
		MKD: { symbol: "", usdRate: 51.8451492686 },
		MMK: { symbol: "", usdRate: 1645.451344769 },
		MNT: { symbol: "", usdRate: 2849.715411619 },
		MOP: { symbol: "MOP$", usdRate: 8.0114578695 },
		MUR: { symbol: "Rs ", usdRate: 42.5129080838 },
		MVR: { symbol: "", usdRate: 15.4097168847 },
		MWK: { symbol: "MK ", usdRate: 799.7180362276 },
		MXV: { symbol: "", usdRate: 2.9716347767 },
		MYR: { symbol: "RM ", usdRate: 4.2225177533 },
		MZN: { symbol: "", usdRate: 63.6535551371 },
		NAD: { symbol: "$", usdRate: 14.3169161372 },
		NGN: { symbol: "₦", usdRate: 411.4912642478 },
		NIO: { symbol: "", usdRate: 35.1126738927 },
		NOK: { symbol: "", usdRate: 8.8167922504 },
		NPR: { symbol: "", usdRate: 119.3739849325 },
		PEN: { symbol: "", usdRate: 4.0810383217 },
		PGK: { symbol: "K ", usdRate: 3.5088004452 },
		PHP: { symbol: "₱", usdRate: 49.7398907032 },
		PKR: { symbol: "Rs ", usdRate: 163.051494419 },
		PLN: { symbol: "", usdRate: 3.8400667613 },
		PYG: { symbol: "", usdRate: 6910.596955435 },
		RON: { symbol: "", usdRate: 4.147112287 },
		RSD: { symbol: "", usdRate: 99.0913627834 },
		RUB: { symbol: "", usdRate: 73.028740859 },
		RWF: { symbol: "RF ", usdRate: 994.7385088417 },
		SBD: { symbol: "$", usdRate: 7.9681744213 },
		SCR: { symbol: "Rs ", usdRate: 14.9437534546 },
		SDG: { symbol: "", usdRate: 443.9690331049 },
		SEK: { symbol: "", usdRate: 8.6046273831 },
		SGD: { symbol: "$", usdRate: 1.3519072296 },
		SHP: { symbol: "£", usdRate: 0.7192444396 },
		SLL: { symbol: "Le ", usdRate: 10255.6626082783 },
		SOS: { symbol: "", usdRate: 584.0274362883 },
		SRD: { symbol: "", usdRate: 21.4283516328 },
		SYP: { symbol: "", usdRate: 1257.8616353378 },
		SZL: { symbol: "E ", usdRate: 14.3169161372 },
		THB: { symbol: "", usdRate: 33.0237355524 },
		TJS: { symbol: "", usdRate: 11.4046168926 },
		TMT: { symbol: "", usdRate: 3.4934118528 },
		TND: { symbol: "", usdRate: 2.7568728667 },
		TOP: { symbol: "T$", usdRate: 2.2527708027 },
		TRY: { symbol: "", usdRate: 8.4200800009 },
		TTD: { symbol: "$", usdRate: 6.7849435593 },
		TZS: { symbol: "TSh ", usdRate: 2319.0103697248 },
		UAH: { symbol: "", usdRate: 26.8870124467 },
		UGX: { symbol: "USh ", usdRate: 3551.8635697043 },
		UYU: { symbol: "", usdRate: 43.5826452697 },
		UZS: { symbol: "", usdRate: 10645.6030631652 },
		VES: { symbol: "", usdRate: 3966726.735688612 },
		VND: { symbol: "₫", usdRate: 22917.8687153359 },
		VUV: { symbol: "VT ", usdRate: 111.5628500329 },
		WST: { symbol: "WS$", usdRate: 2.5720014274 },
		XAF: { symbol: "FCFA ", usdRate: 553.0709934034 },
		YER: { symbol: "", usdRate: 250.0860214599 },
		ZAR: { symbol: "R ", usdRate: 14.3169161372 },
		ZMW: { symbol: "K ", usdRate: 19.2100023389 },
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
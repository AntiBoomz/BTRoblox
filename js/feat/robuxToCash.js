"use strict"

const RobuxToCash = {
	// cash is in cents

	RegularPurchaseAmounts: [400, 800, 1700, 4500, 10000],
	PremiumPurchaseAmounts: [440, 880, 1870, 4950, 11000],
	
	UpdateDate: "October 4, 2022",
	
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
		BRL: { symbol: "R$", usdRate: 5.1652739086 },
		BTN: { symbol: "", usdRate: 81.5653448716 },
		BWP: { symbol: "P ", usdRate: 13.2590543994 },
		BYN: { symbol: "", usdRate: 2.5263986919 },
		CDF: { symbol: "", usdRate: 2036.7337802338 },
		CHF: { symbol: "", usdRate: 0.9871555558 },
		CLF: { symbol: "", usdRate: 0.0380809882 },
		CNY: { symbol: "CN¥", usdRate: 7.1159422008 },
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
		JPY: { symbol: "¥", usdRate: 144.7101732399 },
		KES: { symbol: "Ksh", usdRate: 120.8296846207 },
		KGS: { symbol: "", usdRate: 80.1880602821 },
		KHR: { symbol: "", usdRate: 4095.620482441 },
		KMF: { symbol: "", usdRate: 496.9377326268 },
		KPW: { symbol: "", usdRate: 900.030138651 },
		KRW: { symbol: "₩", usdRate: 1427.1697409913 },
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
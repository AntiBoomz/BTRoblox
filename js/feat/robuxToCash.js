"use strict"

const RobuxToCash = {
	// cash is in cents

	RegularPurchaseAmounts: [400, 800, 1700, 4500, 10000],
	PremiumPurchaseAmounts: [440, 880, 1870, 4950, 11000],
	
	UpdateDate: "August 9, 2022",
	
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
		
		AFN: { symbol: "", usdRate: 90.4960250437 },
		ALL: { symbol: "", usdRate: 114.2737618968 },
		AMD: { symbol: "", usdRate: 404.4918051001 },
		AOA: { symbol: "", usdRate: 425.8271227531 },
		ARS: { symbol: "", usdRate: 133.5614846061 },
		AZN: { symbol: "", usdRate: 1.6982206134 },
		BAM: { symbol: "", usdRate: 1.9130836282 },
		BDT: { symbol: "", usdRate: 94.8437288238 },
		BGN: { symbol: "", usdRate: 1.9130836282 },
		BIF: { symbol: "FBu ", usdRate: 2061.696404742 },
		BND: { symbol: "", usdRate: 1.3783808061 },
		BOB: { symbol: "", usdRate: 6.8812111368 },
		BRL: { symbol: "R$", usdRate: 5.1115772252 },
		BTN: { symbol: "", usdRate: 79.5602451502 },
		BWP: { symbol: "P ", usdRate: 12.5952950572 },
		BYN: { symbol: "", usdRate: 2.5249071319 },
		CDF: { symbol: "", usdRate: 2000.8820191437 },
		CHF: { symbol: "", usdRate: 0.953777268 },
		CLF: { symbol: "", usdRate: 0.0380809882 },
		CNY: { symbol: "CN¥", usdRate: 6.7527539199 },
		CRC: { symbol: "", usdRate: 668.967816356 },
		CUP: { symbol: "", usdRate: 24.0917825499 },
		CVE: { symbol: "", usdRate: 107.8599528989 },
		CZK: { symbol: "", usdRate: 23.9780554157 },
		DKK: { symbol: "", usdRate: 7.2780343807 },
		DOP: { symbol: "", usdRate: 54.3784975195 },
		DZD: { symbol: "", usdRate: 144.1864005945 },
		EGP: { symbol: "", usdRate: 19.1504846165 },
		ETB: { symbol: "", usdRate: 52.6562616475 },
		FJD: { symbol: "$", usdRate: 2.1904228733 },
		FKP: { symbol: "£", usdRate: 0.8262989387 },
		GEL: { symbol: "", usdRate: 2.7098485445 },
		GHS: { symbol: "GH₵", usdRate: 8.7708870577 },
		GIP: { symbol: "£", usdRate: 0.8262989387 },
		GMD: { symbol: "D ", usdRate: 54.39146595 },
		GNF: { symbol: "", usdRate: 8633.3279538207 },
		GTQ: { symbol: "", usdRate: 7.7436372656 },
		GYD: { symbol: "$", usdRate: 209.1339899652 },
		HNL: { symbol: "", usdRate: 24.592915515 },
		HRK: { symbol: "", usdRate: 7.348696116 },
		HTG: { symbol: "", usdRate: 122.6791703016 },
		HUF: { symbol: "", usdRate: 387.505984784 },
		IDR: { symbol: "", usdRate: 14849.6898680191 },
		ILS: { symbol: "₪", usdRate: 3.3105840359 },
		INR: { symbol: "₹", usdRate: 79.5602451502 },
		IQD: { symbol: "", usdRate: 1458.9068675141 },
		IRR: { symbol: "", usdRate: 42332.0873025321 },
		ISK: { symbol: "", usdRate: 137.2476880121 },
		JMD: { symbol: "$", usdRate: 152.765179114 },
		JPY: { symbol: "¥", usdRate: 134.9480598037 },
		KES: { symbol: "Ksh", usdRate: 119.1768157675 },
		KGS: { symbol: "", usdRate: 82.8295611352 },
		KHR: { symbol: "", usdRate: 4105.684931605 },
		KMF: { symbol: "", usdRate: 481.2153654009 },
		KPW: { symbol: "", usdRate: 900.0002263535 },
		KRW: { symbol: "₩", usdRate: 1306.6756126907 },
		KWD: { symbol: "", usdRate: 0.3066722823 },
		KZT: { symbol: "", usdRate: 479.384222585 },
		LAK: { symbol: "", usdRate: 15148.746408905 },
		LKR: { symbol: "", usdRate: 358.9974785969 },
		LRD: { symbol: "$", usdRate: 153.5512666459 },
		LSL: { symbol: "", usdRate: 16.6457448872 },
		LYD: { symbol: "", usdRate: 4.8768321769 },
		MAD: { symbol: "", usdRate: 10.2617895537 },
		MDL: { symbol: "", usdRate: 19.3191112892 },
		MGA: { symbol: "Ar ", usdRate: 4209.4722446891 },
		MKD: { symbol: "", usdRate: 60.4217706307 },
		MMK: { symbol: "", usdRate: 1862.2018267419 },
		MNT: { symbol: "", usdRate: 3173.0778743151 },
		MOP: { symbol: "MOP$", usdRate: 8.0852302093 },
		MUR: { symbol: "Rs ", usdRate: 44.4664964885 },
		MVR: { symbol: "", usdRate: 15.4103987641 },
		MWK: { symbol: "MK ", usdRate: 1020.8171282745 },
		MXV: { symbol: "", usdRate: 2.9141099453 },
		MYR: { symbol: "RM ", usdRate: 4.455122882 },
		MZN: { symbol: "", usdRate: 63.8782401011 },
		NAD: { symbol: "$", usdRate: 16.6457448872 },
		NGN: { symbol: "₦", usdRate: 417.9851162051 },
		NIO: { symbol: "", usdRate: 35.8961385452 },
		NOK: { symbol: "", usdRate: 9.7184360941 },
		NPR: { symbol: "", usdRate: 127.3560624241 },
		PEN: { symbol: "", usdRate: 3.9254190648 },
		PGK: { symbol: "K ", usdRate: 3.5210769036 },
		PHP: { symbol: "₱", usdRate: 55.6481668992 },
		PKR: { symbol: "Rs ", usdRate: 224.3120133626 },
		PLN: { symbol: "", usdRate: 4.5993272891 },
		PYG: { symbol: "", usdRate: 6866.247963798 },
		RON: { symbol: "", usdRate: 4.7952089165 },
		RSD: { symbol: "", usdRate: 114.7840920248 },
		RUB: { symbol: "", usdRate: 60.3754986522 },
		RWF: { symbol: "RF ", usdRate: 1040.8025716707 },
		SBD: { symbol: "$", usdRate: 8.1308191847 },
		SCR: { symbol: "Rs ", usdRate: 13.0168459287 },
		SDG: { symbol: "", usdRate: 569.9096423415 },
		SEK: { symbol: "", usdRate: 10.1626204822 },
		SGD: { symbol: "$", usdRate: 1.3783808061 },
		SHP: { symbol: "£", usdRate: 0.8262989387 },
		SLL: { symbol: "Le ", usdRate: 13891.6068099134 },
		SOS: { symbol: "", usdRate: 568.3461137233 },
		SRD: { symbol: "", usdRate: 24.0309562579 },
		SYP: { symbol: "", usdRate: 2512.5313950574 },
		SZL: { symbol: "E ", usdRate: 16.6457448872 },
		THB: { symbol: "", usdRate: 35.4526626661 },
		TJS: { symbol: "", usdRate: 10.2091084019 },
		TMT: { symbol: "", usdRate: 3.4935977016 },
		TND: { symbol: "", usdRate: 3.1480608693 },
		TOP: { symbol: "T$", usdRate: 2.3362816023 },
		TRY: { symbol: "", usdRate: 17.9495547767 },
		TTD: { symbol: "$", usdRate: 6.8021352091 },
		TZS: { symbol: "TSh ", usdRate: 2332.027341585 },
		UAH: { symbol: "", usdRate: 36.9292878104 },
		UGX: { symbol: "USh ", usdRate: 3878.1702675834 },
		UYU: { symbol: "", usdRate: 40.6189260072 },
		UZS: { symbol: "", usdRate: 10859.0205955527 },
		VES: { symbol: "", usdRate: 5.851595842 },
		VND: { symbol: "₫", usdRate: 23273.3250363917 },
		VUV: { symbol: "VT ", usdRate: 117.3709875013 },
		WST: { symbol: "WS$", usdRate: 2.6951949536 },
		XAF: { symbol: "FCFA ", usdRate: 641.6204872012 },
		YER: { symbol: "", usdRate: 250.24895942 },
		ZAR: { symbol: "R ", usdRate: 16.6457448872 },
		ZMW: { symbol: "K ", usdRate: 16.0841005476 },
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
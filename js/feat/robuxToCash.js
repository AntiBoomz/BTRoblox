"use strict"

const RobuxToCash = {
	// cash is in cents

	RegularPurchaseAmounts: [400, 800, 1700, 4500, 10000],
	PremiumPurchaseAmounts: [440, 880, 1870, 4950, 11000],
	
	UpdateDate: "August 3, 2022",
	
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
		
		AFN: { symbol: "", usdRate: 89.6382941704 },
		ALL: { symbol: "", usdRate: 114.0272844023 },
		AMD: { symbol: "", usdRate: 403.5723713993 },
		AOA: { symbol: "", usdRate: 429.9568293068 },
		ARS: { symbol: "", usdRate: 132.131337866 },
		AZN: { symbol: "", usdRate: 1.6999404965 },
		BAM: { symbol: "", usdRate: 1.925746713 },
		BDT: { symbol: "", usdRate: 94.6345939792 },
		BGN: { symbol: "", usdRate: 1.925746713 },
		BIF: { symbol: "FBu ", usdRate: 2040.9127832 },
		BND: { symbol: "", usdRate: 1.3840203909 },
		BOB: { symbol: "", usdRate: 6.8614694542 },
		BRL: { symbol: "R$", usdRate: 5.2789290836 },
		BTN: { symbol: "", usdRate: 78.6273939768 },
		BWP: { symbol: "P ", usdRate: 12.5102786455 },
		BYN: { symbol: "", usdRate: 2.5198907559 },
		CDF: { symbol: "", usdRate: 2000.8274065612 },
		CHF: { symbol: "", usdRate: 0.9585925797 },
		CLF: { symbol: "", usdRate: 0.0380809882 },
		CNY: { symbol: "CN¥", usdRate: 6.7600867301 },
		CRC: { symbol: "", usdRate: 667.7510390106 },
		CUP: { symbol: "", usdRate: 24.1728825146 },
		CVE: { symbol: "", usdRate: 108.5738995963 },
		CZK: { symbol: "", usdRate: 24.2694759508 },
		DKK: { symbol: "", usdRate: 7.32938808 },
		DOP: { symbol: "", usdRate: 54.489243917 },
		DZD: { symbol: "", usdRate: 145.8722257949 },
		EGP: { symbol: "", usdRate: 19.0440946325 },
		ETB: { symbol: "", usdRate: 52.2193037993 },
		FJD: { symbol: "$", usdRate: 2.2111251514 },
		FKP: { symbol: "£", usdRate: 0.8230064046 },
		GEL: { symbol: "", usdRate: 2.7247678245 },
		GHS: { symbol: "GH₵", usdRate: 8.5596325978 },
		GIP: { symbol: "£", usdRate: 0.8230064046 },
		GMD: { symbol: "D ", usdRate: 54.5234635171 },
		GNF: { symbol: "", usdRate: 8776.4370620046 },
		GTQ: { symbol: "", usdRate: 7.7267002563 },
		GYD: { symbol: "$", usdRate: 208.7746736336 },
		HNL: { symbol: "", usdRate: 24.5592659283 },
		HRK: { symbol: "", usdRate: 7.4022924035 },
		HTG: { symbol: "", usdRate: 118.4710662487 },
		HUF: { symbol: "", usdRate: 392.4474977282 },
		IDR: { symbol: "", usdRate: 14897.1179919147 },
		ILS: { symbol: "₪", usdRate: 3.3706704964 },
		INR: { symbol: "₹", usdRate: 78.6273939768 },
		IQD: { symbol: "", usdRate: 1457.9844024242 },
		IRR: { symbol: "", usdRate: 42450.3463094816 },
		ISK: { symbol: "", usdRate: 137.1719112589 },
		JMD: { symbol: "$", usdRate: 152.9761253359 },
		JPY: { symbol: "¥", usdRate: 133.4218630493 },
		KES: { symbol: "Ksh", usdRate: 119.0187586788 },
		KGS: { symbol: "", usdRate: 83.1393987619 },
		KHR: { symbol: "", usdRate: 4111.4822008039 },
		KMF: { symbol: "", usdRate: 484.4006265812 },
		KPW: { symbol: "", usdRate: 899.9737205303 },
		KRW: { symbol: "₩", usdRate: 1315.0259705023 },
		KWD: { symbol: "", usdRate: 0.3065040041 },
		KZT: { symbol: "", usdRate: 474.3633617956 },
		LAK: { symbol: "", usdRate: 15033.3914316447 },
		LKR: { symbol: "", usdRate: 359.6129295861 },
		LRD: { symbol: "$", usdRate: 153.9491496268 },
		LSL: { symbol: "", usdRate: 16.8354329091 },
		LYD: { symbol: "", usdRate: 4.8592202128 },
		MAD: { symbol: "", usdRate: 10.3224366551 },
		MDL: { symbol: "", usdRate: 19.2887969318 },
		MGA: { symbol: "Ar ", usdRate: 4196.0691883029 },
		MKD: { symbol: "", usdRate: 60.4055195672 },
		MMK: { symbol: "", usdRate: 1850.6978450118 },
		MNT: { symbol: "", usdRate: 3190.142649267 },
		MOP: { symbol: "MOP$", usdRate: 8.0852647336 },
		MUR: { symbol: "Rs ", usdRate: 46.021324113 },
		MVR: { symbol: "", usdRate: 15.422498643 },
		MWK: { symbol: "MK ", usdRate: 1020.7835893244 },
		MXV: { symbol: "", usdRate: 2.9385764108 },
		MYR: { symbol: "RM ", usdRate: 4.4541046809 },
		MZN: { symbol: "", usdRate: 63.8910899123 },
		NAD: { symbol: "$", usdRate: 16.8354329091 },
		NGN: { symbol: "₦", usdRate: 416.4152631601 },
		NIO: { symbol: "", usdRate: 35.8750480043 },
		NOK: { symbol: "", usdRate: 9.7869864926 },
		NPR: { symbol: "", usdRate: 125.8628009084 },
		PEN: { symbol: "", usdRate: 3.9297277707 },
		PGK: { symbol: "K ", usdRate: 3.5211523364 },
		PHP: { symbol: "₱", usdRate: 55.5568749524 },
		PKR: { symbol: "Rs ", usdRate: 238.446692239 },
		PLN: { symbol: "", usdRate: 4.6516215491 },
		PYG: { symbol: "", usdRate: 6863.4815052294 },
		RON: { symbol: "", usdRate: 4.8486445082 },
		RSD: { symbol: "", usdRate: 115.5721486924 },
		RUB: { symbol: "", usdRate: 61.9587388287 },
		RWF: { symbol: "RF ", usdRate: 1028.6380125531 },
		SBD: { symbol: "$", usdRate: 8.1648090365 },
		SCR: { symbol: "Rs ", usdRate: 13.7188025214 },
		SDG: { symbol: "", usdRate: 568.41625283 },
		SEK: { symbol: "", usdRate: 10.2594306954 },
		SGD: { symbol: "$", usdRate: 1.3840203909 },
		SHP: { symbol: "£", usdRate: 0.8230064046 },
		SLL: { symbol: "Le ", usdRate: 13880.8569913835 },
		SOS: { symbol: "", usdRate: 582.6893466566 },
		SRD: { symbol: "", usdRate: 24.378292842 },
		SYP: { symbol: "", usdRate: 2512.5314407154 },
		SZL: { symbol: "E ", usdRate: 16.8354329091 },
		THB: { symbol: "", usdRate: 36.2286536291 },
		TJS: { symbol: "", usdRate: 10.2076048853 },
		TMT: { symbol: "", usdRate: 3.5037826859 },
		TND: { symbol: "", usdRate: 3.1338277716 },
		TOP: { symbol: "T$", usdRate: 2.3229369534 },
		TRY: { symbol: "", usdRate: 17.9472023977 },
		TTD: { symbol: "$", usdRate: 6.7796964316 },
		TZS: { symbol: "TSh ", usdRate: 2332.165970431 },
		UAH: { symbol: "", usdRate: 36.9136941317 },
		UGX: { symbol: "USh ", usdRate: 3877.6381941048 },
		UYU: { symbol: "", usdRate: 40.6788359026 },
		UZS: { symbol: "", usdRate: 10980.2096296663 },
		VES: { symbol: "", usdRate: 5.789975052 },
		VND: { symbol: "₫", usdRate: 23374.5162478606 },
		VUV: { symbol: "VT ", usdRate: 117.8876594673 },
		WST: { symbol: "WS$", usdRate: 2.6967246611 },
		XAF: { symbol: "FCFA ", usdRate: 645.8675021082 },
		YER: { symbol: "", usdRate: 250.3032932663 },
		ZAR: { symbol: "R ", usdRate: 16.8354329091 },
		ZMW: { symbol: "K ", usdRate: 16.1078293948 },
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
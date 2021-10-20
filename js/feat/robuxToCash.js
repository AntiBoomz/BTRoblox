"use strict"

const RobuxToCash = {
	// cash is in cents

	RegularPurchaseAmounts: [400, 800, 1700, 4500, 10000],
	PremiumPurchaseAmounts: [440, 880, 1870, 4950, 11000],
	
	UpdateDate: "October 20, 2021",
	
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
		
		AFN: { symbol: "", usdRate: 79.9294160982 },
		ALL: { symbol: "", usdRate: 104.6712094933 },
		AMD: { symbol: "", usdRate: 475.9188225646 },
		AOA: { symbol: "", usdRate: 602.921559271 },
		ARS: { symbol: "", usdRate: 99.3034106182 },
		AZN: { symbol: "", usdRate: 1.69898511 },
		BAM: { symbol: "", usdRate: 1.679528915 },
		BDT: { symbol: "", usdRate: 85.6840324795 },
		BGN: { symbol: "", usdRate: 1.679528915 },
		BIF: { symbol: "FBu ", usdRate: 1993.3084793509 },
		BND: { symbol: "", usdRate: 1.3438562229 },
		BOB: { symbol: "", usdRate: 6.9110873629 },
		BRL: { symbol: "R$", usdRate: 5.5867801716 },
		BTN: { symbol: "", usdRate: 75.0949287391 },
		BWP: { symbol: "P ", usdRate: 11.1940027854 },
		BYN: { symbol: "", usdRate: 2.4305392451 },
		CDF: { symbol: "", usdRate: 1974.9523579158 },
		CHF: { symbol: "", usdRate: 0.923416549 },
		CLF: { symbol: "", usdRate: 0.0293750134 },
		CNY: { symbol: "CN¥", usdRate: 6.381301294 },
		CRC: { symbol: "", usdRate: 628.4589190095 },
		CUP: { symbol: "", usdRate: 24.1382896602 },
		CVE: { symbol: "", usdRate: 94.6921017966 },
		CZK: { symbol: "", usdRate: 21.908235905 },
		DKK: { symbol: "", usdRate: 6.3897796195 },
		DOP: { symbol: "", usdRate: 56.4646122306 },
		DZD: { symbol: "", usdRate: 137.158947246 },
		EGP: { symbol: "", usdRate: 15.7185829922 },
		ETB: { symbol: "", usdRate: 46.8384809508 },
		FJD: { symbol: "$", usdRate: 2.0732463445 },
		FKP: { symbol: "£", usdRate: 0.7240937922 },
		GEL: { symbol: "", usdRate: 3.1298651475 },
		GHS: { symbol: "GH₵", usdRate: 6.0645586214 },
		GIP: { symbol: "£", usdRate: 0.7240937922 },
		GMD: { symbol: "D ", usdRate: 51.9929949242 },
		GNF: { symbol: "", usdRate: 9712.5026246203 },
		GTQ: { symbol: "", usdRate: 7.7423950173 },
		GYD: { symbol: "$", usdRate: 209.0061945073 },
		HNL: { symbol: "", usdRate: 24.1556743433 },
		HRK: { symbol: "", usdRate: 6.4466366464 },
		HTG: { symbol: "", usdRate: 99.6573338676 },
		HUF: { symbol: "", usdRate: 311.1906832502 },
		IDR: { symbol: "", usdRate: 14101.0445185704 },
		ILS: { symbol: "₪", usdRate: 3.2130738342 },
		INR: { symbol: "₹", usdRate: 75.0949287391 },
		IQD: { symbol: "", usdRate: 1459.927033872 },
		IRR: { symbol: "", usdRate: 42025.3187103326 },
		ISK: { symbol: "", usdRate: 128.8132304795 },
		JMD: { symbol: "$", usdRate: 150.6029731152 },
		JPY: { symbol: "¥", usdRate: 114.4874705072 },
		KES: { symbol: "Ksh", usdRate: 111.1836009534 },
		KGS: { symbol: "", usdRate: 84.793542303 },
		KHR: { symbol: "", usdRate: 4077.7906854393 },
		KMF: { symbol: "", usdRate: 422.4672192225 },
		KPW: { symbol: "", usdRate: 899.9857257825 },
		KRW: { symbol: "₩", usdRate: 1177.0196996861 },
		KWD: { symbol: "", usdRate: 0.3016356925 },
		KZT: { symbol: "", usdRate: 426.9678616747 },
		LAK: { symbol: "", usdRate: 10147.9099138249 },
		LKR: { symbol: "", usdRate: 199.9003906059 },
		LRD: { symbol: "$", usdRate: 165.4791992503 },
		LSL: { symbol: "", usdRate: 14.5162664073 },
		LYD: { symbol: "", usdRate: 4.5693915088 },
		MAD: { symbol: "", usdRate: 9.0350547859 },
		MDL: { symbol: "", usdRate: 17.3117930298 },
		MGA: { symbol: "Ar ", usdRate: 3968.368345565 },
		MKD: { symbol: "", usdRate: 52.962363289 },
		MMK: { symbol: "", usdRate: 1907.1947184858 },
		MNT: { symbol: "", usdRate: 2853.7572149091 },
		MOP: { symbol: "MOP$", usdRate: 8.0099882928 },
		MUR: { symbol: "Rs ", usdRate: 42.8678631211 },
		MVR: { symbol: "", usdRate: 15.4114280759 },
		MWK: { symbol: "MK ", usdRate: 817.735491146 },
		MXV: { symbol: "", usdRate: 3.024245117 },
		MYR: { symbol: "RM ", usdRate: 4.1524181012 },
		MZN: { symbol: "", usdRate: 63.8411466299 },
		NAD: { symbol: "$", usdRate: 14.5162664073 },
		NGN: { symbol: "₦", usdRate: 411.0028772611 },
		NIO: { symbol: "", usdRate: 35.2777494101 },
		NOK: { symbol: "", usdRate: 8.3429083621 },
		NPR: { symbol: "", usdRate: 120.715097948 },
		PEN: { symbol: "", usdRate: 3.9492562327 },
		PGK: { symbol: "K ", usdRate: 3.508950791 },
		PHP: { symbol: "₱", usdRate: 50.7637317069 },
		PKR: { symbol: "Rs ", usdRate: 172.6247276213 },
		PLN: { symbol: "", usdRate: 3.9390393979 },
		PYG: { symbol: "", usdRate: 6919.0467168083 },
		RON: { symbol: "", usdRate: 4.2496752199 },
		RSD: { symbol: "", usdRate: 100.9829881321 },
		RUB: { symbol: "", usdRate: 70.8716054938 },
		RWF: { symbol: "RF ", usdRate: 999.6659796959 },
		SBD: { symbol: "$", usdRate: 8.0547159525 },
		SCR: { symbol: "Rs ", usdRate: 12.8729250357 },
		SDG: { symbol: "", usdRate: 439.076338463 },
		SEK: { symbol: "", usdRate: 8.6215816108 },
		SGD: { symbol: "$", usdRate: 1.3438562229 },
		SHP: { symbol: "£", usdRate: 0.7240937922 },
		SLL: { symbol: "Le ", usdRate: 10610.6199742938 },
		SOS: { symbol: "", usdRate: 584.0612423355 },
		SRD: { symbol: "", usdRate: 21.395889342 },
		SYP: { symbol: "", usdRate: 1257.8616353378 },
		SZL: { symbol: "E ", usdRate: 14.5162664073 },
		THB: { symbol: "", usdRate: 33.4057934255 },
		TJS: { symbol: "", usdRate: 11.3205857736 },
		TMT: { symbol: "", usdRate: 3.5217701589 },
		TND: { symbol: "", usdRate: 2.819208318 },
		TOP: { symbol: "T$", usdRate: 2.2400244071 },
		TRY: { symbol: "", usdRate: 9.3097263773 },
		TTD: { symbol: "$", usdRate: 6.7986825674 },
		TZS: { symbol: "TSh ", usdRate: 2300.1040363842 },
		UAH: { symbol: "", usdRate: 26.252374947 },
		UGX: { symbol: "USh ", usdRate: 3636.6549640155 },
		UYU: { symbol: "", usdRate: 43.9977536379 },
		UZS: { symbol: "", usdRate: 10734.9223674981 },
		VES: { symbol: "", usdRate: 4.1491542237 },
		VND: { symbol: "₫", usdRate: 22612.4943931729 },
		VUV: { symbol: "VT ", usdRate: 110.6603653245 },
		WST: { symbol: "WS$", usdRate: 2.5476726696 },
		XAF: { symbol: "FCFA ", usdRate: 563.28962563 },
		YER: { symbol: "", usdRate: 250.3986176289 },
		ZAR: { symbol: "R ", usdRate: 14.5162664073 },
		ZMW: { symbol: "K ", usdRate: 17.0623720698 },
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
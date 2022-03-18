"use strict"

const RobuxToCash = {
	// cash is in cents

	RegularPurchaseAmounts: [400, 800, 1700, 4500, 10000],
	PremiumPurchaseAmounts: [440, 880, 1870, 4950, 11000],
	
	UpdateDate: "March 18, 2022",
	
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
		
		AFN: { symbol: "", usdRate: 87.8989519298 },
		ALL: { symbol: "", usdRate: 111.771703637 },
		AMD: { symbol: "", usdRate: 513.3863729299 },
		AOA: { symbol: "", usdRate: 455.4610089939 },
		ARS: { symbol: "", usdRate: 109.5134141701 },
		AZN: { symbol: "", usdRate: 1.6990328432 },
		BAM: { symbol: "", usdRate: 1.7647428917 },
		BDT: { symbol: "", usdRate: 85.7889698849 },
		BGN: { symbol: "", usdRate: 1.7647428917 },
		BIF: { symbol: "FBu ", usdRate: 2011.2597298615 },
		BND: { symbol: "", usdRate: 1.3551647934 },
		BOB: { symbol: "", usdRate: 6.8557792185 },
		BRL: { symbol: "R$", usdRate: 5.040456296 },
		BTN: { symbol: "", usdRate: 76.0707077151 },
		BWP: { symbol: "P ", usdRate: 11.5276737798 },
		BYN: { symbol: "", usdRate: 3.279897398 },
		CDF: { symbol: "", usdRate: 1996.6801670656 },
		CHF: { symbol: "", usdRate: 0.9362220133 },
		CLF: { symbol: "", usdRate: 0.0289774956 },
		CNY: { symbol: "CN¥", usdRate: 6.3571442743 },
		CRC: { symbol: "", usdRate: 645.7849614369 },
		CUP: { symbol: "", usdRate: 24.0519824513 },
		CVE: { symbol: "", usdRate: 99.4964790737 },
		CZK: { symbol: "", usdRate: 22.3310313327 },
		DKK: { symbol: "", usdRate: 6.7168752198 },
		DOP: { symbol: "", usdRate: 54.7135749547 },
		DZD: { symbol: "", usdRate: 142.5504923502 },
		EGP: { symbol: "", usdRate: 15.7199639527 },
		ETB: { symbol: "", usdRate: 51.1496399988 },
		FJD: { symbol: "$", usdRate: 2.1033690891 },
		FKP: { symbol: "£", usdRate: 0.7598406955 },
		GEL: { symbol: "", usdRate: 3.2097479531 },
		GHS: { symbol: "GH₵", usdRate: 7.2857547293 },
		GIP: { symbol: "£", usdRate: 0.7598406955 },
		GMD: { symbol: "D ", usdRate: 53.2996316528 },
		GNF: { symbol: "", usdRate: 8883.3158102165 },
		GTQ: { symbol: "", usdRate: 7.6843541961 },
		GYD: { symbol: "$", usdRate: 208.4028841862 },
		HNL: { symbol: "", usdRate: 24.4552355808 },
		HRK: { symbol: "", usdRate: 6.832630156 },
		HTG: { symbol: "", usdRate: 105.3943277481 },
		HUF: { symbol: "", usdRate: 335.4490258682 },
		IDR: { symbol: "", usdRate: 14340.4468651867 },
		ILS: { symbol: "₪", usdRate: 3.2367799864 },
		INR: { symbol: "₹", usdRate: 76.0707077151 },
		IQD: { symbol: "", usdRate: 1454.3116685894 },
		IRR: { symbol: "", usdRate: 42340.1418478462 },
		ISK: { symbol: "", usdRate: 128.9603437637 },
		JMD: { symbol: "$", usdRate: 152.5427983279 },
		JPY: { symbol: "¥", usdRate: 118.7554465315 },
		KES: { symbol: "Ksh", usdRate: 114.3310119354 },
		KGS: { symbol: "", usdRate: 104.4274427594 },
		KHR: { symbol: "", usdRate: 4044.5214440126 },
		KMF: { symbol: "", usdRate: 443.9018676231 },
		KPW: { symbol: "", usdRate: 899.9679154312 },
		KRW: { symbol: "₩", usdRate: 1212.946793417 },
		KWD: { symbol: "", usdRate: 0.3038094084 },
		KZT: { symbol: "", usdRate: 507.347043234 },
		LAK: { symbol: "", usdRate: 11476.4389320535 },
		LKR: { symbol: "", usdRate: 265.036625586 },
		LRD: { symbol: "$", usdRate: 153.49120592 },
		LSL: { symbol: "", usdRate: 14.940513724 },
		LYD: { symbol: "", usdRate: 4.6361209664 },
		MAD: { symbol: "", usdRate: 9.775256123 },
		MDL: { symbol: "", usdRate: 18.3368416371 },
		MGA: { symbol: "Ar ", usdRate: 4030.7008206586 },
		MKD: { symbol: "", usdRate: 55.9118065349 },
		MMK: { symbol: "", usdRate: 1773.498154361 },
		MNT: { symbol: "", usdRate: 2918.4189766176 },
		MOP: { symbol: "MOP$", usdRate: 8.0541292233 },
		MUR: { symbol: "Rs ", usdRate: 43.682033003 },
		MVR: { symbol: "", usdRate: 15.401616143 },
		MWK: { symbol: "MK ", usdRate: 805.0290749331 },
		MXV: { symbol: "", usdRate: 3.0126881622 },
		MYR: { symbol: "RM ", usdRate: 4.2027148248 },
		MZN: { symbol: "", usdRate: 63.8206248456 },
		NAD: { symbol: "$", usdRate: 14.940513724 },
		NGN: { symbol: "₦", usdRate: 414.649380132 },
		NIO: { symbol: "", usdRate: 35.643380958 },
		NOK: { symbol: "", usdRate: 8.7932345679 },
		NPR: { symbol: "", usdRate: 121.770185375 },
		PEN: { symbol: "", usdRate: 3.7410800944 },
		PGK: { symbol: "K ", usdRate: 3.5209592878 },
		PHP: { symbol: "₱", usdRate: 52.3559987812 },
		PKR: { symbol: "Rs ", usdRate: 180.376485886 },
		PLN: { symbol: "", usdRate: 4.230931419 },
		PYG: { symbol: "", usdRate: 6938.7648551892 },
		RON: { symbol: "", usdRate: 4.464308733 },
		RSD: { symbol: "", usdRate: 106.1400345538 },
		RUB: { symbol: "", usdRate: 103.013433337 },
		RWF: { symbol: "RF ", usdRate: 1020.7990284426 },
		SBD: { symbol: "$", usdRate: 8.0936965838 },
		SCR: { symbol: "Rs ", usdRate: 14.3801460003 },
		SDG: { symbol: "", usdRate: 446.9626761291 },
		SEK: { symbol: "", usdRate: 9.4182529076 },
		SGD: { symbol: "$", usdRate: 1.3551647934 },
		SHP: { symbol: "£", usdRate: 0.7598406955 },
		SLL: { symbol: "Le ", usdRate: 11637.4002321546 },
		SOS: { symbol: "", usdRate: 575.4107612951 },
		SRD: { symbol: "", usdRate: 20.6546964174 },
		SYP: { symbol: "", usdRate: 2512.02906984 },
		SZL: { symbol: "E ", usdRate: 14.940513724 },
		THB: { symbol: "", usdRate: 33.2635225362 },
		TJS: { symbol: "", usdRate: 12.995086527 },
		TMT: { symbol: "", usdRate: 3.5036362085 },
		TND: { symbol: "", usdRate: 2.9276291417 },
		TOP: { symbol: "T$", usdRate: 2.2601093396 },
		TRY: { symbol: "", usdRate: 14.7343704053 },
		TTD: { symbol: "$", usdRate: 6.768492306 },
		TZS: { symbol: "TSh ", usdRate: 2315.650636387 },
		UAH: { symbol: "", usdRate: 29.6100057561 },
		UGX: { symbol: "USh ", usdRate: 3575.7715864337 },
		UYU: { symbol: "", usdRate: 42.5262563949 },
		UZS: { symbol: "", usdRate: 11567.3156593131 },
		VES: { symbol: "", usdRate: 4.2849362814 },
		VND: { symbol: "₫", usdRate: 22950.3880839076 },
		VUV: { symbol: "VT ", usdRate: 112.4073229601 },
		WST: { symbol: "WS$", usdRate: 2.5874898615 },
		XAF: { symbol: "FCFA ", usdRate: 591.8691568308 },
		YER: { symbol: "", usdRate: 250.1910777319 },
		ZAR: { symbol: "R ", usdRate: 14.940513724 },
		ZMW: { symbol: "K ", usdRate: 17.6922450434 },
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
"use strict"

const RobuxToCash = {
	// cash is in cents
	
	UpdateDate: "February 16, 2025",
	
	Currencies: {
		None: { symbol: "" },
		
		USD: {
			symbol: "$",
			robuxRates: [[499, 400], [999, 800], [1999, 1700], [4999, 4500], [9999, 10000], [19999, 22500]],
			robuxRatesPremium: [[499, 440], [999, 880], [1999, 1870], [4999, 4950], [9999, 11000], [19999, 25000]],
			subscriptionRates: [[499, 450], [999, 1000], [1999, 2200]]
		},
		EUR: {
			symbol: "€",
			robuxRates: [[599, 400], [1199, 800], [2399, 1700], [5999, 4500], [11999, 10000], [23999, 22500]],
			robuxRatesPremium: [[599, 440], [1199, 880], [2399, 1870], [5999, 4950], [11999, 11000], [23999, 25000]],
			subscriptionRates: [[599, 450], [1199, 1000], [2399, 2200]]
		},
		AUD: {
			symbol: "$",
			robuxRates: [[849, 400], [1699, 800], [3499, 1700], [9099, 4500], [18499, 10000], [36999, 22500]],
			robuxRatesPremium: [[849, 440], [1699, 880], [3499, 1870], [9099, 4950], [18499, 11000], [36999, 25000]],
			subscriptionRates: [[849, 450], [1699, 1000], [3499, 2200]]
		},
		GBP: {
			symbol: "£",
			robuxRates: [[499, 400], [999, 800], [1999, 1700], [4999, 4500], [9999, 10000], [19999, 22500]],
			robuxRatesPremium: [[499, 440], [999, 880], [1999, 1870], [4999, 4950], [9999, 11000], [19999, 25000]],
			subscriptionRates: [[499, 450], [999, 1000], [1999, 2200]]
		},
		NZD: {
			symbol: "$",
			robuxRates: [[999, 400], [1899, 800], [3899, 1700], [9999, 4500], [19999, 10000], [39999, 22500]],
			robuxRatesPremium: [[999, 440], [1899, 880], [3899, 1870], [9999, 4950], [19999, 11000], [39999, 25000]],
			subscriptionRates: [[999, 450], [1899, 1000], [3899, 2200]]
		},
		CAD: {
			symbol: "CA$",
			robuxRates: [[699, 400], [1399, 800], [2799, 1700], [6999, 4500], [13999, 10000], [27999, 22500]],
			robuxRatesPremium: [[699, 440], [1399, 880], [2799, 1870], [6999, 4950], [13999, 11000], [27999, 25000]],
			subscriptionRates: [[699, 450], [1399, 1000], [2799, 2200]]
		},
		SEK: {
			symbol: "kr",
			robuxRates: [[6500, 400], [12900, 800], [26900, 1700], [69500, 4500], [139500, 10000], [259500, 22500]],
			robuxRatesPremium: [[6500, 440], [12900, 880], [26900, 1870], [69500, 4950], [139500, 11000], [259500, 25000]],
			subscriptionRates: [[6500, 450], [12900, 1000], [26900, 2200]]
		},
		NOK: {
			symbol: "kr",
			robuxRates: [[7000, 400], [14000, 800], [28000, 1700], [70000, 4500], [140000, 10000], [280000, 22500]],
			robuxRatesPremium: [[7000, 440], [14000, 880], [28000, 1870], [70000, 4950], [140000, 11000], [280000, 25000]],
			subscriptionRates: [[7000, 450], [14000, 1000], [28000, 2200]]
		},
		DKK: {
			symbol: "kr.",
			robuxRates: [[4500, 400], [8900, 800], [16900, 1700], [44900, 4500], [89900, 10000], [169900, 22500]],
			robuxRatesPremium: [[4500, 440], [8900, 880], [16900, 1870], [44900, 4950], [89900, 11000], [169900, 25000]],
			subscriptionRates: [[4500, 450], [8900, 1000], [16900, 2200]]
		},
		PLN: {
			symbol: "zł",
			robuxRates: [[2999, 400], [5999, 800], [11999, 1700], [29999, 4500], [59999, 10000], [114999, 22500]],
			robuxRatesPremium: [[2999, 440], [5999, 880], [11999, 1870], [29999, 4950], [59999, 11000], [114999, 25000]],
			subscriptionRates: [[2999, 450], [5999, 1000], [11999, 2200]]
		},
		CZK: {
			symbol: "Kč",
			robuxRates: [[15000, 400], [30000, 800], [60000, 1700], [150000, 4500], [300000, 10000], [600000, 22500]],
			robuxRatesPremium: [[15000, 440], [30000, 880], [60000, 1870], [150000, 4950], [300000, 11000], [600000, 25000]],
			subscriptionRates: [[15000, 450], [30000, 1000], [60000, 2200]]
		},
		RON: {
			symbol: "RON",
			robuxRates: [[2499, 400], [4999, 800], [9999, 1700], [24999, 4500], [49999, 10000], [99999, 22500]],
			robuxRatesPremium: [[2499, 440], [4999, 880], [9999, 1870], [24999, 4950], [49999, 11000], [99999, 25000]],
			subscriptionRates: [[2499, 450], [4999, 1000], [9999, 2200]]
		},
		HUF: {
			symbol: "Ft",
			robuxRates: [[249000, 400], [449000, 800], [949000, 1700], [2399000, 4500], [4799000, 10000], [9499000, 22500]],
			robuxRatesPremium: [[249000, 440], [449000, 880], [949000, 1870], [2399000, 4950], [4799000, 11000], [9499000, 25000]],
			subscriptionRates: [[249000, 450], [449000, 1000], [949000, 2200]]
		},
		BGN: {
			symbol: "лв.",
			robuxRates: [[1099, 400], [2199, 800], [4299, 1700], [10999, 4500], [21999, 10000], [42999, 22500]],
			robuxRatesPremium: [[1099, 440], [2199, 880], [4299, 1870], [10999, 4950], [21999, 11000], [42999, 25000]],
			subscriptionRates: [[1099, 450], [2199, 1000], [4299, 2200]]
		},
		CHF: {
			symbol: "CHF",
			robuxRates: [[500, 400], [1000, 800], [2000, 1700], [4800, 4500], [10000, 10000], [20000, 22500]],
			robuxRatesPremium: [[500, 440], [1000, 880], [2000, 1870], [4800, 4950], [10000, 11000], [20000, 25000]],
			subscriptionRates: [[500, 450], [1000, 1000], [2000, 2200]]
		},
		RUB: {
			symbol: "₽",
			robuxRates: [[53900, 400], [108000, 800], [215000, 1700], [560000, 4500], [1139000, 10000], [2299000, 22500]],
			robuxRatesPremium: [[53900, 440], [108000, 880], [215000, 1870], [560000, 4950], [1139000, 11000], [2299000, 25000]],
			subscriptionRates: [[53900, 450], [108000, 1000], [215000, 2200]]
		},
		MXN: {
			symbol: "$",
			robuxRates: [[12900, 400], [24900, 800], [49900, 1700], [129900, 4500], [249900, 10000], [499900, 22500]],
			robuxRatesPremium: [[12900, 440], [24900, 880], [49900, 1870], [129900, 4950], [249900, 11000], [499900, 25000]],
			subscriptionRates: [[12900, 450], [24900, 1000], [49900, 2200]]
		},
		CLP: {
			symbol: "$",
			robuxRates: [[550000, 400], [1090000, 800], [2190000, 1700], [5490000, 4500], [10990000, 10000], [21990000, 22500]],
			robuxRatesPremium: [[550000, 440], [1090000, 880], [2190000, 1870], [5490000, 4950], [10990000, 11000], [21990000, 25000]],
			subscriptionRates: [[550000, 450], [1090000, 1000], [2190000, 2200]]
		},
		BRL: {
			symbol: "R$",
			robuxRates: [[2990, 400], [5900, 800], [11790, 1700], [29490, 4500], [58990, 10000], [117990, 22500]],
			robuxRatesPremium: [[2990, 440], [5900, 880], [11790, 1870], [29490, 4950], [58990, 11000], [117990, 25000]],
			subscriptionRates: [[2990, 450], [5900, 1000], [11790, 2200]]
		},
		COP: {
			symbol: "$",
			robuxRates: [[2990000, 400], [5990000, 800], [11490000, 1700], [29990000, 4500], [59990000, 10000], [114990000, 22500]],
			robuxRatesPremium: [[2990000, 440], [5990000, 880], [11490000, 1870], [29990000, 4950], [59990000, 11000], [114990000, 25000]],
			subscriptionRates: [[2990000, 450], [5990000, 1000], [11490000, 2200]]
		},
		PEN: {
			symbol: "S/",
			robuxRates: [[1790, 400], [3790, 800], [7490, 1700], [18990, 4500], [37990, 10000], [74990, 22500]],
			robuxRatesPremium: [[1790, 440], [3790, 880], [7490, 1870], [18990, 4950], [37990, 11000], [74990, 25000]],
			subscriptionRates: [[1790, 450], [3790, 1000], [7490, 2200]]
		},
		INR: {
			symbol: "₹",
			robuxRates: [[50000, 400], [100000, 800], [200000, 1700], [500000, 4500], [1000000, 10000], [2000000, 22500]],
			robuxRatesPremium: [[50000, 440], [100000, 880], [200000, 1870], [500000, 4950], [1000000, 11000], [2000000, 25000]],
			subscriptionRates: [[50000, 450], [100000, 1000], [200000, 2200]]
		},
		THB: {
			symbol: "฿",
			robuxRates: [[20000, 400], [40000, 800], [80000, 1700], [200000, 4500], [400000, 10000], [800000, 22500]],
			robuxRatesPremium: [[20000, 440], [40000, 880], [80000, 1870], [200000, 4950], [400000, 11000], [800000, 25000]],
			subscriptionRates: [[20000, 450], [40000, 1000], [80000, 2200]]
		},
		SGD: {
			symbol: "$",
			robuxRates: [[698, 400], [1498, 800], [2898, 1700], [6898, 4500], [14898, 10000], [28898, 22500]],
			robuxRatesPremium: [[698, 440], [1498, 880], [2898, 1870], [6898, 4950], [14898, 11000], [28898, 25000]],
			subscriptionRates: [[698, 450], [1498, 1000], [2898, 2200]]
		},
		JPY: {
			symbol: "￥",
			robuxRates: [[80000, 400], [160000, 800], [320000, 1700], [800000, 4500], [1580000, 10000], [3180000, 22500]],
			robuxRatesPremium: [[80000, 440], [160000, 880], [320000, 1870], [800000, 4950], [1580000, 11000], [3180000, 25000]],
			subscriptionRates: [[80000, 450], [160000, 1000], [320000, 2200]]
		},
		KRW: {
			symbol: "₩",
			robuxRates: [[750000, 400], [1500000, 800], [3000000, 1700], [7900000, 4500], [14900000, 10000], [29900000, 22500]],
			robuxRatesPremium: [[750000, 440], [1500000, 880], [3000000, 1870], [7900000, 4950], [14900000, 11000], [29900000, 25000]],
			subscriptionRates: [[750000, 450], [1500000, 1000], [3000000, 2200]]
		},
		IDR: {
			symbol: "Rp",
			robuxRates: [[9000000, 400], [18000000, 800], [36000000, 1700], [90000000, 4500], [179900000, 10000], [359900000, 22500]],
			robuxRatesPremium: [[9000000, 440], [18000000, 880], [36000000, 1870], [90000000, 4950], [179900000, 11000], [359900000, 25000]],
			subscriptionRates: [[9000000, 450], [18000000, 1000], [36000000, 2200]]
		},
		PHP: {
			symbol: "₱",
			robuxRates: [[26900, 400], [56900, 800], [115000, 1700], [289000, 4500], [570000, 10000], [1149000, 22500]],
			robuxRatesPremium: [[26900, 440], [56900, 880], [115000, 1870], [289000, 4950], [570000, 11000], [1149000, 25000]],
			subscriptionRates: [[26900, 450], [56900, 1000], [115000, 2200]]
		},
		MYR: {
			symbol: "RM",
			robuxRates: [[2390, 400], [4490, 800], [9490, 1700], [23990, 4500], [47990, 10000], [94990, 22500]],
			robuxRatesPremium: [[2390, 440], [4490, 880], [9490, 1870], [23990, 4950], [47990, 11000], [94990, 25000]],
			subscriptionRates: [[2390, 450], [4490, 1000], [9490, 2200]]
		},
		VND: {
			symbol: "₫",
			robuxRates: [[12900000, 400], [24900000, 800], [49900000, 1700], [129900000, 4500], [249900000, 10000], [529900000, 22500]],
			robuxRatesPremium: [[12900000, 440], [24900000, 880], [49900000, 1870], [129900000, 4950], [249900000, 11000], [529900000, 25000]],
			subscriptionRates: [[12900000, 450], [24900000, 1000], [49900000, 2200]]
		},
		HKD: {
			symbol: "HK$",
			robuxRates: [[3800, 400], [7800, 800], [15800, 1700], [39800, 4500], [78800, 10000], [158800, 22500]],
			robuxRatesPremium: [[3800, 440], [7800, 880], [15800, 1870], [39800, 4950], [78800, 11000], [158800, 25000]],
			subscriptionRates: [[3800, 450], [7800, 1000], [15800, 2200]]
		},
		TWD: {
			symbol: "$",
			robuxRates: [[17000, 400], [33000, 800], [67000, 1700], [169000, 4500], [329000, 10000], [659000, 22500]],
			robuxRatesPremium: [[17000, 440], [33000, 880], [67000, 1870], [169000, 4950], [329000, 11000], [659000, 25000]],
			subscriptionRates: [[17000, 450], [33000, 1000], [67000, 2200]]
		},
		SAR: {
			symbol: "ر.س.‏",
			robuxRates: [[2499, 400], [4999, 800], [9999, 1700], [24999, 4500], [49999, 10000], [99900, 22500]],
			robuxRatesPremium: [[2499, 440], [4999, 880], [9999, 1870], [24999, 4950], [49999, 11000], [99900, 25000]],
			subscriptionRates: [[2499, 450], [4999, 1000], [9999, 2200]]
		},
		AED: {
			symbol: "د.إ.‏",
			robuxRates: [[1799, 400], [3699, 800], [7499, 1700], [18499, 4500], [36999, 10000], [74999, 22500]],
			robuxRatesPremium: [[1799, 440], [3699, 880], [7499, 1870], [18499, 4950], [36999, 11000], [74999, 25000]],
			subscriptionRates: [[1799, 450], [3699, 1000], [7499, 2200]]
		},
		ZAR: {
			symbol: "R",
			robuxRates: [[9999, 400], [19999, 800], [39999, 1700], [99999, 4500], [199999, 10000], [399999, 22500]],
			robuxRatesPremium: [[9999, 440], [19999, 880], [39999, 1870], [99999, 4950], [199999, 11000], [399999, 25000]],
			subscriptionRates: [[9999, 450], [19999, 1000], [39999, 2200]]
		},
		
		// Currency has a fixed usd exchange rate
		
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
		SVC: { symbol: "", usdRate: 8.75, fixed: true },
		XCD: { symbol: "EC$", usdRate: 2.70, fixed: true },
		
		// Fluctuating exchange rates
		
		AFN: { symbol: "", usdRate: 73.3819440733 },
		ALL: { symbol: "", usdRate: 94.9939687624 },
		AMD: { symbol: "", usdRate: 396.5172027834 },
		AOA: { symbol: "", usdRate: 912.0978674941 },
		ARS: { symbol: "", usdRate: 1056.0015633324 },
		AZN: { symbol: "", usdRate: 1.7000000466 },
		BAM: { symbol: "", usdRate: 1.8633273195 },
		BDT: { symbol: "", usdRate: 121.6170538014 },
		BIF: { symbol: "FBu ", usdRate: 2914.6508821774 },
		BND: { symbol: "", usdRate: 1.3393383394 },
		BOB: { symbol: "", usdRate: 6.9259666137 },
		BTN: { symbol: "", usdRate: 86.6170058788 },
		BWP: { symbol: "P ", usdRate: 13.8312852447 },
		BYN: { symbol: "", usdRate: 3.2741267401 },
		CDF: { symbol: "", usdRate: 2850.0300294661 },
		CLF: { symbol: "", usdRate: 0.0245433906 },
		CNY: { symbol: "CN¥", usdRate: 7.2631886281 },
		CRC: { symbol: "", usdRate: 506.8073439437 },
		CUP: { symbol: "", usdRate: 23.9153449931 },
		CVE: { symbol: "", usdRate: 105.0546844645 },
		DOP: { symbol: "", usdRate: 62.1588407539 },
		DZD: { symbol: "", usdRate: 136.0546500874 },
		EGP: { symbol: "", usdRate: 50.6316134407 },
		ETB: { symbol: "", usdRate: 126.1995079086 },
		FJD: { symbol: "$", usdRate: 2.3309941518 },
		FKP: { symbol: "£", usdRate: 0.7945960768 },
		GEL: { symbol: "", usdRate: 2.8361999988 },
		GHS: { symbol: "GH₵", usdRate: 15.3827123388 },
		GIP: { symbol: "£", usdRate: 0.7945960768 },
		GMD: { symbol: "D ", usdRate: 71.9995627167 },
		GNF: { symbol: "", usdRate: 8634.1382887407 },
		GTQ: { symbol: "", usdRate: 7.7108504309 },
		GYD: { symbol: "$", usdRate: 208.9835653994 },
		HNL: { symbol: "", usdRate: 25.5729064244 },
		HRK: { symbol: "", usdRate: 7.1781492709 },
		HTG: { symbol: "", usdRate: 132.483189393 },
		ILS: { symbol: "₪", usdRate: 3.5550933206 },
		IQD: { symbol: "", usdRate: 1310.3422268011 },
		IRR: { symbol: "", usdRate: 42002.6067976644 },
		ISK: { symbol: "", usdRate: 140.0535294256 },
		JMD: { symbol: "$", usdRate: 157.5344109992 },
		KES: { symbol: "Ksh", usdRate: 129.4339368246 },
		KGS: { symbol: "", usdRate: 87.450038415 },
		KHR: { symbol: "", usdRate: 4000.0001231889 },
		KMF: { symbol: "", usdRate: 468.6997074722 },
		KPW: { symbol: "", usdRate: 900 },
		KWD: { symbol: "", usdRate: 0.3082052279 },
		KZT: { symbol: "", usdRate: 495.7557010454 },
		LAK: { symbol: "", usdRate: 21688.40553143 },
		LKR: { symbol: "", usdRate: 295.2591862108 },
		LRD: { symbol: "$", usdRate: 197.7875070462 },
		LSL: { symbol: "", usdRate: 18.3774448534 },
		LYD: { symbol: "", usdRate: 4.9050007638 },
		MAD: { symbol: "", usdRate: 9.9503861519 },
		MDL: { symbol: "", usdRate: 18.6300537817 },
		MGA: { symbol: "Ar ", usdRate: 4715.9597589269 },
		MKD: { symbol: "", usdRate: 58.460035663 },
		MMK: { symbol: "", usdRate: 2099.8801179961 },
		MNT: { symbol: "", usdRate: 3459.4894979395 },
		MOP: { symbol: "MOP$", usdRate: 8.0180204712 },
		MUR: { symbol: "Rs ", usdRate: 46.4552486726 },
		MVR: { symbol: "", usdRate: 15.4599934146 },
		MWK: { symbol: "MK ", usdRate: 1733.3559569856 },
		MXV: { symbol: "", usdRate: 2.4235276876 },
		MZN: { symbol: "", usdRate: 63.8342218764 },
		NAD: { symbol: "$", usdRate: 18.3774448534 },
		NGN: { symbol: "₦", usdRate: 1510.1138154674 },
		NIO: { symbol: "", usdRate: 36.6242985938 },
		NPR: { symbol: "", usdRate: 138.6521721605 },
		PGK: { symbol: "K ", usdRate: 4.00640421 },
		PKR: { symbol: "Rs ", usdRate: 279.1882092959 },
		PYG: { symbol: "", usdRate: 7932.3128041585 },
		RSD: { symbol: "", usdRate: 112.0325871375 },
		RWF: { symbol: "RF ", usdRate: 1394.5200980021 },
		SBD: { symbol: "$", usdRate: 8.4317007097 },
		SCR: { symbol: "Rs ", usdRate: 14.9191425659 },
		SDG: { symbol: "", usdRate: 598.9630405781 },
		SHP: { symbol: "£", usdRate: 0.7945960768 },
		SLL: { symbol: "Le ", usdRate: 22750.0135388825 },
		SOS: { symbol: "", usdRate: 571.4570857524 },
		SRD: { symbol: "", usdRate: 34.9600487703 },
		SYP: { symbol: "", usdRate: 13001.9829815211 },
		SZL: { symbol: "E ", usdRate: 18.3774448534 },
		TJS: { symbol: "", usdRate: 10.9361753739 },
		TMT: { symbol: "", usdRate: 3.5000181787 },
		TND: { symbol: "", usdRate: 3.1745013661 },
		TOP: { symbol: "T$", usdRate: 2.3969101766 },
		TRY: { symbol: "", usdRate: 36.2217093523 },
		TTD: { symbol: "$", usdRate: 6.7654761577 },
		TZS: { symbol: "TSh ", usdRate: 2565.9884009254 },
		UAH: { symbol: "", usdRate: 41.8256102929 },
		UGX: { symbol: "USh ", usdRate: 3679.0274787758 },
		UYU: { symbol: "", usdRate: 43.2733473288 },
		UZS: { symbol: "", usdRate: 13008.0326843644 },
		VES: { symbol: "", usdRate: 61.9769539402 },
		VUV: { symbol: "VT ", usdRate: 123.1852760123 },
		WST: { symbol: "WS$", usdRate: 2.8240875601 },
		XAF: { symbol: "FCFA ", usdRate: 624.9329432963 },
		YER: { symbol: "", usdRate: 249.8179171098 },
		ZMW: { symbol: "K ", usdRate: 28.2487615707 },
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

		return `${option.currency.symbol}{{((${expr})*${option.cash}/${option.robux} + 0.4999)/100 | number: ${option.currency.numFractions}}}`
	},

	convert(robux) {
		const option = this.getSelectedOption()

		const cash = Math.round((robux * option.cash) / option.robux + 0.4999) / 100
		const cashString = formatNumber(cash.toFixed(option.currency.numFractions))

		return `${option.currency.symbol}${cashString}`
	}
}


for(const [name, currency] of Object.entries(RobuxToCash.Currencies)) {
	currency.name = name
	currency.numFractions = 2
	
	if(!currency.symbol || (currency.usdRate && (currency.symbol === "$" || currency.symbol === "£"))) {
		currency.symbol = `${name} `
	}
	
	if(name === "None") { continue }
	
	try { currency.numFractions = new Intl.NumberFormat("en-US", { style: "currency", currency: name }).resolvedOptions().maximumFractionDigits }
	catch(ex) {}

	const options = RobuxToCash.OptionLists[name] = RobuxToCash.OptionLists[name] || []
	const refCurrency = currency.usdRate ? RobuxToCash.Currencies.USD : currency
	
	for(const [index, rate] of Object.entries(refCurrency.robuxRates)) {
		const option = { name: `${name.toLowerCase()}Regular${index}`, cash: rate[0], robux: rate[1] }
		
		if(currency.usdRate) {
			option.usdCash = option.cash
			option.cash *= currency.usdRate
		}
		
		options.push(option)
	}
	
	for(const [index, rate] of Object.entries(refCurrency.robuxRatesPremium)) {
		const option = { name: `${name.toLowerCase()}Premium${index}`, cash: rate[0], robux: rate[1] }
		
		if(currency.usdRate) {
			option.usdCash = option.cash
			option.cash *= currency.usdRate
		}
		
		options.push(option)
	}
	
	for(const [index, rate] of Object.entries(refCurrency.subscriptionRates)) {
		const option = { name: `${name.toLowerCase()}Subscription${index}`, cash: rate[0], robux: rate[1] }
		
		if(currency.usdRate) {
			option.usdCash = option.cash
			option.cash *= currency.usdRate
		}
		
		options.push(option)
	}
}

for(const [name, options] of Object.entries(RobuxToCash.OptionLists)) {
	const currency = RobuxToCash.Currencies[name]
	
	for(const option of options) {
		option.currency = currency
		RobuxToCash.Options[option.name] = option
	}
}
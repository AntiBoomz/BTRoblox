"use strict"

const serverRegions = {
	Amsterdam: { city: "Amsterdam", country: { name: "Netherlands", code: "NL" }, region: { name: "North Holland", code: "NH" } },
	Ashburn: { city: "Ashburn", country: { name: "United States", code: "US" }, region: { name: "Virginia", code: "VA" } },
	Atlanta: { city: "Atlanta", country: { name: "United States", code: "US" }, region: { name: "Georgia", code: "GA" } },
	Chicago: { city: "Chicago", country: { name: "United States", code: "US" }, region: { name: "Illinois", code: "IL" } },
	Dallas: { city: "Dallas", country: { name: "United States", code: "US" }, region: { name: "Texas", code: "TX" } },
	Frankfurt: { city: "Frankfurt", country: { name: "Germany", code: "DE" }, region: { name: "Hesse", code: "HE" } },
	London: { city: "London", country: { name: "United Kingdom", code: "GB" }, region: { name: "England", code: "ENG" } },
	LosAngeles: { city: "Los Angeles", country: { name: "United States", code: "US" }, region: { name: "California", code: "CA" } },
	Miami: { city: "Miami", country: { name: "United States", code: "US" }, region: { name: "Florida", code: "FL" } },
	Mumbai: { city: "Mumbai", country: { name: "India", code: "IN" }, region: { name: "Maharashtra", code: "MH" } },
	NewYork: { city: "New York", country: { name: "United States", code: "US" }, region: { name: "New York", code: "NY" } },
	Paris: { city: "Paris", country: { name: "France", code: "FR" }, region: { name: "Ile-de-France", code: "IDF" } },
	SanJose: { city: "San Jose", country: { name: "United States", code: "US" }, region: { name: "California", code: "CA" } },
	SanMateo: { city: "San Mateo", country: { name: "United States", code: "US" }, region: { name: "California", code: "CA" } },
	SantaClara: { city: "Santa Clara", country: { name: "United States", code: "US" }, region: { name: "California", code: "CA" } },
	SaoPaulo: { city: "Sao Paulo", country: { name: "Brazil", code: "BR" }, region: { name: "Sao Paulo", code: "SP" } },
	Seattle: { city: "Seattle", country: { name: "United States", code: "US" }, region: { name: "Washington", code: "WA" } },
	Singapore: { city: "Singapore", country: { name: "Singapore", code: "SG" } },
	Sydney: { city: "Sydney", country: { name: "Australia", code: "AU" }, region: { name: "New South Wales", code: "NSW" } },
	Tokyo: { city: "Tokyo", country: { name: "Japan", code: "JP" }, region: { name: "Tokyo", code: "13" } },
	
	AWS_Boardman: { city: "Boardman", country: { name: "United States (AWS)", code: "US" }, region: { name: "Oregon", code: "OR" } },
	AWS_Ashburn: { city: "Ashburn", country: { name: "United States (AWS)", code: "US" }, region: { name: "Virginia", code: "VA" } },
	AWS_Dublin: { city: "Dublin", country: { name: "Ireland (AWS)", code: "IE" }, region: { name: "Dublin", code: "D" } },
	AWS_Columbus: { city: "Columbus", country: { name: "United States (AWS)", code: "US" }, region: { name: "Ohio", code: "OH" } },
	AWS_Frankfurt: { city: "Frankfurt", country: { name: "Germany (AWS)", code: "DE" }, region: { name: "Hesse", code: "HE" } },
	AWS_Sydney: { city: "Sydney", country: { name: "Australia (AWS)", code: "AU" }, region: { name: "New South Wales", code: "NSW" } },
	AWS_Tokyo: { city: "Tokyo", country: { name: "Japan (AWS)", code: "JP" }, region: { name: "Tokyo", code: "13" } },
	AWS_Mumbai: { city: "Mumbai", country: { name: "India (AWS)", code: "IN" }, region: { name: "Maharashtra", code: "MH" } },
	AWS_Singapore: { city: "Singapore", country: { name: "Singapore (AWS)", code: "SG" } },
	AWS_Houston: { city: "Houston", country: { name: "United States (AWS)", code: "US" }, region: { name: "Texas", code: "TX" } },
	AWS_Miami: { city: "Miami", country: { name: "United States (AWS)", code: "US" }, region: { name: "Florida", code: "FL" } },
	AWS_Boston: { city: "Boston", country: { name: "United States (AWS)", code: "US" }, region: { name: "Massachusetts", code: "MA" } },
	AWS_Auckland: { city: "Auckland", country: { name: "New Zealand (AWS)", code: "NZ" }, region: { name: "Auckland", code: "AUK" } },
	AWS_Stockholm: { city: "Stockholm", country: { name: "Sweden (AWS)", code: "SE" }, region: { name: "Stockholm County", code: "AB" } },
	AWS_Bahrain: { city: "Al Qarah", country: { name: "Bahrain (AWS)", code: "BH" }, region: { name: "Southern Governorate", code: "14" } },
	AWS_Paris: { city: "Paris", country: { name: "France (AWS)", code: "FR" }, region: { name: "Ile-de-France", code: "IDF" } },
	AWS_Jakarta: { city: "Jakarta", country: { name: "Indonesia (AWS)", code: "ID" }, region: { name: "JABODETABEK", code: "JB" } },
	AWS_SouthBend: { city: "South Bend", country: { name: "United States (AWS)", code: "US" }, region: { name: "Indiana", code: "IN" } },
	AWS_Jackson: { city: "Jackson", country: { name: "United States (AWS)", code: "US" }, region: { name: "Mississippi", code: "MS" } },
	AWS_CapeTown: { city: "Cape Town", country: { name: "South Africa (AWS)", code: "ZA" }, region: { name: "Western Cape", code: "WC" } },
	AWS_Dubai: { city: "Dubai", country: { name: "United Arab Emirates (AWS)", code: "AE" }, region: { name: "Dubai", code: "DU" } },
	AWS_SaoPaulo: { city: "São Paulo", country: { name: "Brazil (AWS)", code: "BR" }, region: { name: "State of São Paulo", code: "SP" } },
	AWS_HongKong: { city: "Hong Kong", country: { name: "Hong Kong (AWS)", code: "HK" }, region: { name: "Hong Kong SAR", code: "" } },
	AWS_Hyderabad: { city: "Hyderabad", country: { name: "India (AWS)", code: "IN" }, region: { name: "Telangana", code: "TS" } },
	AWS_Dallas: { city: "Dallas", country: { name: "United States (AWS)", code: "US" }, region: { name: "Texas", code: "TX" } },
	AWS_Chicago: { city: "Chicago", country: { name: "United States (AWS)", code: "US" }, region: { name: "Illinois", code: "IL" } },
	AWS_Atlanta: { city: "Atlanta", country: { name: "United States (AWS)", code: "US" }, region: { name: "Georgia", code: "GA" } },
	AWS_Piscataway: { city: "Piscataway", country: { name: "United States (AWS)", code: "US" }, region: { name: "New Jersey", code: "NJ" } },
	AWS_Incheon: { city: "Incheon", country: { name: "South Korea (AWS)", code: "KR" }, region: { name: "Incheon", code: "28" } },
	AWS_Osaka: { city: "Osaka", country: { name: "Japan (AWS)", code: "JP" }, region: { name: "Osaka Prefecture", code: "27" } },
	AWS_KualaLumpur: { city: "Kuala Lumpur", country: { name: "Malaysia (AWS)", code: "MY" }, region: { name: "Wilayah Persekutuan Kuala Lumpur", code: "14" } },
	AWS_London: { city: "London", country: { name: "United Kingdom (AWS)", code: "GB" }, region: { name: "England", code: "ENG" } },
	AWS_Melbourne: { city: "Melbourne", country: { name: "Australia (AWS)", code: "AU" }, region: { name: "Victoria", code: "VIC" } },
	AWS_Milan: { city: "Milan", country: { name: "Italy (AWS)", code: "IT" }, region: { name: "Lombardy", code: "25" } },
	AWS_Phoenix: { city: "Phoenix", country: { name: "United States (AWS)", code: "US" }, region: { name: "Arizona", code: "AZ" } },
	AWS_LosAngeles: { city: "Los Angeles", country: { name: "United States (AWS)", code: "US" }, region: { name: "California", code: "CA" } },
	AWS_Seattle: { city: "Seattle", country: { name: "United States (AWS)", code: "US" }, region: { name: "Washington", code: "WA" } },
	AWS_SanJose: { city: "San Jose", country: { name: "United States (AWS)", code: "US" }, region: { name: "California", code: "CA" } },
	AWS_TelAviv: { city: "Tel Aviv", country: { name: "Israel (AWS)", code: "IL" }, region: { name: "Tel Aviv District", code: "TA" } },
	AWS_Montreal: { city: "Montreal", country: { name: "Canada (AWS)", code: "CA" }, region: { name: "Quebec", code: "QC" } },
	AWS_Calgary: { city: "Calgary", country: { name: "Canada (AWS)", code: "CA" }, region: { name: "Alberta", code: "AB" } },
	AWS_Zaragoza: { city: "Zaragoza", country: { name: "Spain (AWS)", code: "ES" }, region: { name: "Aragon", code: "AR" } },
	AWS_Zurich: { city: "Zürich", country: { name: "Switzerland (AWS)", code: "CH" }, region: { name: "Zurich", code: "ZH" } },
	AWS_Bangkok: { city: "Bangkok", country: { name: "Thailand (AWS)", code: "TH" }, region: { name: "Bangkok", code: "10" } },
	AWS_Querétaro: { city: "Querétaro", country: { name: "Mexico (AWS)", code: "MX" }, region: { name: "Querétaro", code: "QUE" } },
	AWS_Taipei: { city: "Taipei City", country: { name: "Taiwan (AWS)", code: "TW" }, region: { name: "Taipei", code: "TPE" } },
	AWS_KansasCity: { city: "Kansas City", country: { name: "United States (AWS)", code: "US" }, region: { name: "Missouri", code: "MO" } },
	AWS_LasVegas: { city: "Las Vegas", country: { name: "United States (AWS)", code: "US" }, region: { name: "Nevada", code: "NV" } },
	AWS_Portland: { city: "Portland", country: { name: "United States (AWS)", code: "US" }, region: { name: "Oregon", code: "OR" } },
	AWS_Honolulu: { city: "Honolulu", country: { name: "United States (AWS)", code: "US" }, region: { name: "Hawaii", code: "HI" } },
	AWS_Denver: { city: "Denver", country: { name: "United States (AWS)", code: "US" }, region: { name: "Colorado", code: "CO" } },
	AWS_Berlin: { city: "Berlin", country: { name: "Germany (AWS)", code: "DE" }, region: { name: "Berlin", code: "BE" } },
	AWS_Riyadh: { city: "Riyadh", country: { name: "Saudi Arabia (AWS)", code: "SA" }, region: { name: "Riyadh Province", code: "01" } },
	AWS_Ningxia: { city: "Yinchuan", country: { name: "China (AWS)", code: "CN" }, region: { name: "Ningxia", code: "NX" } },
	AWS_Philadelphia: { city: "Philadelphia", country: { name: "United States (AWS)", code: "US" }, region: { name: "Pennsylvania", code: "PA" } },
	AWS_Santiago: { city: "Santiago", country: { name: "Chile (AWS)", code: "CL" } },
	AWS_BuenosAires: { city: "Buenos Aires", country: { name: "Argentina (AWS)", code: "AR" } },
	AWS_Lima: { city: "Lima", country: { name: "Peru (AWS)", code: "PE" }, region: { name: "Lima", code: "LIM" } },
	AWS_NewYorkCity: { city: "New York", country: { name: "United States (AWS)", code: "US" }, region: { name: "New York", code: "NY" } },
	AWS_Minneapolis: { city: "Minneapolis", country: { name: "United States (AWS)", code: "US" }, region: { name: "Minnesota", code: "MN" } },
	AWS_Manila: { city: "Manila", country: { name: "Philippines (AWS)", code: "PH" }, region: { name: "National Capital Region", code: "00" } },
	AWS_Perth: { city: "Perth", country: { name: "Australia (AWS)", code: "AU" }, region: { name: "Western Australia", code: "WA" } },
	AWS_Muscat: { city: "Muscat", country: { name: "Oman (AWS)", code: "OM" }, region: { name: "Muscat Governorate", code: "MA" } },
	AWS_Helsinki: { city: "Helsinki", country: { name: "Finland (AWS)", code: "FI" }, region: { name: "South Finland", code: "ES" } },
	AWS_Copenhagen: { city: "Copenhagen", country: { name: "Denmark (AWS)", code: "DK" }, region: { name: "Capital", code: "84" } },
	AWS_Hamburg: { city: "Hamburg", country: { name: "Germany (AWS)", code: "DE" }, region: { name: "Hamburg", code: "HH" } },
	AWS_Warsaw: { city: "Warsaw", country: { name: "Poland (AWS)", code: "PL" }, region: { name: "Woj. Mazowieckie", code: "MZ" } },
	AWS_Kolkata: { city: "Kolkata", country: { name: "India (AWS)", code: "IN" }, region: { name: "West Bengal", code: "WB" } },
	AWS_Delhi: { city: "Delhi", country: { name: "India (AWS)", code: "IN" }, region: { name: "Delhi", code: "DL" } },
	AWS_Lagos: { city: "Lagos", country: { name: "Nigeria (AWS)", code: "NG" }, region: { name: "Lagos", code: "LA" } },
	AWS_Dortmund: { city: "Dortmund", country: { name: "Germany (AWS)", code: "DE" }, region: { name: "North-Rhine-Westphalia", code: "NW" } },
	AWS_Munich: { city: "Munich", country: { name: "Germany (AWS)", code: "DE" }, region: { name: "Bavaria", code: "BY" } },
	AWS_Manchester: { city: "Manchester", country: { name: "United Kingdom (AWS)", code: "GB" }, region: { name: "England", code: "ENG" } },
	AWS_Beijing: { city: "Beijing", country: { name: "China (AWS)", code: "CN" }, region: { name: "Beijing", code: "BJ" } },
	AWS_Milwaukee: { city: "Milwaukee", country: { name: "United States (AWS)", code: "US" }, region: { name: "Wisconsin", code: "WI" } },
	AWS_Tampa: { city: "Tampa", country: { name: "United States (AWS)", code: "US" }, region: { name: "Florida", code: "FL" } },
	AWS_Charlotte: { city: "Charlotte", country: { name: "United States (AWS)", code: "US" }, region: { name: "North Carolina", code: "NC" } },
	AWS_Nashville: { city: "Nashville", country: { name: "United States (AWS)", code: "US" }, region: { name: "Tennessee", code: "TN" } },
	AWS_Detroit: { city: "Detroit", country: { name: "United States (AWS)", code: "US" }, region: { name: "Michigan", code: "MI" } },
	AWS_Baltimore: { city: "Baltimore", country: { name: "United States (AWS)", code: "US" }, region: { name: "Maryland", code: "MD" } },
	AWS_Westborough: { city: "Westborough", country: { name: "United States (AWS)", code: "US" }, region: { name: "Massachusetts", code: "MA" } },
	AWS_Sacramento: { city: "Sacramento", country: { name: "United States (AWS)", code: "US" }, region: { name: "California", code: "CA" } },
	AWS_Trenton: { city: "Trenton", country: { name: "United States (AWS)", code: "US" }, region: { name: "New Jersey", code: "NJ" } },
	AWS_Lenexa: { city: "Lenexa", country: { name: "United States (AWS)", code: "US" }, region: { name: "Kansas", code: "KS" } },
}

const serverRegionsByIp = {
	"128.116.0.0": serverRegions.Ashburn,
	"128.116.1.0": serverRegions.LosAngeles,
	"128.116.5.0": serverRegions.Frankfurt,
	"128.116.11.0": serverRegions.Ashburn,
	"128.116.13.0": serverRegions.Paris,
	"128.116.21.0": serverRegions.Amsterdam,
	"128.116.22.0": serverRegions.Atlanta,
	"128.116.32.0": serverRegions.NewYork,
	"128.116.33.0": serverRegions.London,
	"128.116.44.0": serverRegions.Frankfurt,
	"128.116.45.0": serverRegions.Miami,
	"128.116.48.0": serverRegions.Chicago,
	"128.116.50.0": serverRegions.Singapore,
	"128.116.51.0": serverRegions.Sydney,
	"128.116.53.0": serverRegions.Ashburn,
	"128.116.54.0": serverRegions.Singapore,
	"128.116.55.0": serverRegions.Tokyo,
	"128.116.56.0": serverRegions.Ashburn,
	"128.116.57.0": serverRegions.SanJose,
	"128.116.63.0": serverRegions.LosAngeles,
	"128.116.64.0": serverRegions.NewYork,
	"128.116.67.0": serverRegions.SanJose,
	"128.116.74.0": serverRegions.Ashburn,
	"128.116.79.0": serverRegions.Singapore,
	"128.116.80.0": serverRegions.Ashburn,
	"128.116.81.0": serverRegions.SanJose,
	"128.116.84.0": serverRegions.Chicago,
	"128.116.86.0": serverRegions.SaoPaulo,
	"128.116.87.0": serverRegions.Ashburn,
	"128.116.88.0": serverRegions.Chicago,
	"128.116.95.0": serverRegions.Dallas,
	"128.116.97.0": serverRegions.Singapore,
	"128.116.99.0": serverRegions.Atlanta,
	"128.116.102.0": serverRegions.Ashburn,
	"128.116.104.0": serverRegions.Mumbai,
	"128.116.105.0": serverRegions.SanJose,
	"128.116.115.0": serverRegions.Seattle,
	"128.116.116.0": serverRegions.LosAngeles,
	"128.116.117.0": serverRegions.SanJose,
	"128.116.119.0": serverRegions.London,
	"128.116.120.0": serverRegions.Tokyo,
	"128.116.123.0": serverRegions.Frankfurt,
	"128.116.127.0": serverRegions.Miami,
}

const awsRegions = {
	values: [
		"Incheon", "Santiago", "Paris", "TelAviv", "Riyadh", "HongKong", "Mumbai", "Houston", "Frankfurt", "Ashburn", "Bangkok", "Dublin", 
		"Auckland", "Beijing", "SaoPaulo", "Boston", "London", "Milan", "KualaLumpur", "Phoenix", "Sydney", "Miami", "Delhi", "Querétaro", 
		"SanJose", "Dallas", "Lagos", "Calgary", "Tokyo", "Bahrain", "LasVegas", "Zaragoza", "Boardman", "Osaka", "Taipei", "Singapore", 
		"KansasCity", "Atlanta", "Zurich", "Ningxia", "BuenosAires", "Seattle", "CapeTown", "Dubai", "Minneapolis", "Jakarta", 
		"Copenhagen", "Melbourne", "NewYorkCity", "Columbus", "Chicago", "Milwaukee", "Hyderabad", "Berlin", "LosAngeles", "Lima", 
		"Montreal", "Tampa", "Helsinki", "Stockholm", "Munich", "Muscat", "Warsaw", "Kolkata", "Philadelphia", "Piscataway", "Westborough", 
		"Portland", "SouthBend", "Perth", "Hamburg", "Baltimore", "Manila", "Nashville", "Detroit", "Charlotte", "Dortmund", "Denver", 
		"Honolulu", "Trenton", "Manchester", "Jackson", "Lenexa", "Sacramento"
	],
	ranges: {
		11:{44:{192:9,224:32}},12:{3:{64:8,80:9,208:9,224:9},34:{192:9,208:32,224:9},35:{80:32},100:{48:9}},13:{3:{136:49,144:49,248:11},
		13:{216:9},18:{208:9},34:{240:11,248:11},35:{72:28,160:32,168:9},52:{200:9,208:11},54:{80:9,160:9,184:32},98:{80:9,88:9},
		100:{24:9},108:{128:11}},14:{3:{8:16,16:49,20:49,24:20,36:0,104:20,108:6,112:28,120:8,124:8,132:49},13:{36:2,40:16,112:28,204:6,
		232:6,236:20},18:{116:49,132:16,156:8,168:16,204:9,216:49,220:49,224:49,232:9},23:{20:9},35:{156:8},43:{200:0},47:{128:35},52:{4:9,
		20:9,24:32,32:32,36:32,40:32,48:11,196:28},54:{68:32,88:9,144:9,156:9},57:{180:28},63:{32:11,176:8,180:8},65:{0:6},100:{20:32},
		107:{20:9}},15:{3:{0:35,6:6,14:49,28:43,34:0,96:56,98:56,102:12,128:49},13:{48:59,54:20,58:49,60:59,62:59,126:6,134:16,158:28,
		200:6,202:6,210:20,212:35,214:35,228:35,230:28,244:42,250:35},15:{156:56,164:0,206:6,222:56,228:14,236:2},16:{50:47,54:56,62:38,
		156:35,162:5,168:59,170:59},18:{60:52,100:31,138:35,140:35,142:35,144:24,166:5,176:28,180:28,184:8,192:8,194:8,196:8,198:8,202:11,
		236:32},35:{44:31,176:16,178:16,182:56},40:{176:27},43:{198:5,204:6,206:28,208:10,210:10,212:34,216:18},50:{16:9},51:{16:3,48:31,
		94:31,168:4,224:53},52:{0:9,2:9,10:32,12:32,16:11,18:11,30:11,44:9,52:24,54:9,58:8,62:20,68:28,70:9,72:9,86:9,88:32,90:9,192:28,
		194:28,220:35},54:{64:28,72:11,74:11,76:11,116:0,148:32,170:11,172:9,174:9,176:24,180:0,194:11,196:9,200:32,202:32,204:9,208:9,
		210:9,212:32,216:11,224:9,226:9,234:9,236:9,242:9,248:28},78:{12:23,14:23},83:{160:1},95:{40:5},99:{80:11},107:{176:13},
		108:{136:45},158:{252:43}},16:{3:{12:49,13:49,101:24,130:49,131:49},5:{174:30},13:{50:59,51:59,52:24,53:59,56:24,57:24,124:0,125:0,
		128:64,130:40,144:10,146:69,152:61,154:58,160:70,162:63,192:28,208:33,209:0,246:42,247:42},15:{103:26,128:34,134:20,152:33,160:17,
		161:17,168:33,184:29,185:29,188:2,216:31,217:31,232:45,240:42,253:54,254:54},16:{16:59,24:29,26:47,28:42,52:56,78:45,79:45,112:52,
		144:32,145:32,176:20,208:33,209:33},18:{102:17,130:16,136:35,153:8,162:5,163:5,175:16,178:28,179:28,182:28,183:28,188:49,189:49,
		190:49,191:49,200:11,201:11,228:14,229:14,230:14,231:14,246:32},35:{152:17,153:9,154:6,155:32,180:2,181:2},40:{172:43},43:{192:39,
		196:13,218:45,220:20},50:{18:24,19:9,112:32},51:{20:59,21:59,24:16,34:38,44:2,45:2,84:3,85:3,92:31,96:38,112:43,118:17},52:{8:24,
		9:24,14:49,15:49,28:8,29:8,47:2,56:16,57:8,60:56,65:20,66:6,67:14,74:35,75:32,77:35,78:0,79:0,80:13,81:13,83:39},54:{54:34,66:20,
		67:24,78:11,79:20,93:8,94:14,95:28,150:28,152:9,154:11,155:11,168:28,169:35,178:28,179:35,183:24,193:24,198:9,199:28,206:20,207:14,
		214:32,215:24,218:32,219:24,220:11,221:9,223:13,228:11,229:11,232:14,238:28,241:24,244:32,245:32,246:11,247:11,250:28,251:35,
		252:20,253:20,254:35,255:35},56:{10:35,69:18,70:18,112:27,125:14,126:14,127:14,228:59},98:{130:52},99:{79:56},140:{179:13},
		157:{175:29,241:29},161:{189:39},174:{129:9},184:{73:9}},17:{3:{40:{0:8,128:11},41:{0:16,128:9},42:{0:24,128:32}},5:{60:{128:28}},
		40:{192:{0:52}},46:{137:{0:11}},52:{64:{0:20,128:20},76:{0:35,128:35},82:{0:39}},54:{46:{0:5},92:{0:28,128:9},151:{0:24,128:35},
		153:{0:24,128:20},222:{128:13},233:{128:14}},56:{68:{0:18},124:{0:14},155:{0:33,128:33}},75:{101:{128:9}},79:{125:{0:11}},
		176:{34:{128:11}},177:{71:{128:14}},184:{72:{128:9},169:{128:24}}},18:{3:{43:{0:0,64:49,128:42,192:29},44:{0:35,64:20,128:28,
		192:14},45:{0:5}},16:{15:{192:9},56:{0:37,64:9,128:50,192:9},57:{0:35},71:{0:32,64:32},184:{0:0}},18:{88:{0:25,64:25,128:19},
		89:{0:8,128:7},97:{0:9,128:49,192:11},98:{0:32}},43:{193:{0:39}},45:{57:{128:35}},46:{51:{128:11},137:{128:11}},54:{112:{0:65},
		233:{0:14,64:14}},67:{202:{0:9}},68:{79:{0:39}},69:{230:{192:39},231:{128:39},234:{192:39},235:{128:39}},70:{224:{192:54}},
		71:{131:{192:13},132:{0:13},136:{64:13},137:{0:13}},75:{2:{128:9},3:{0:81,128:68},45:{128:8}},83:{119:{64:16,128:8}},
		122:{248:{192:35}},161:{178:{0:50,128:65},193:{0:21,128:56}},175:{41:{128:35,192:28}},176:{34:{64:11}},184:{72:{0:24,64:9}},
		204:{236:{128:24,192:9}}},19:{3:{5:{0:9}},5:{60:{64:9,96:8}},15:{181:{192:25}},18:{34:{0:9},96:{32:8,64:14,96:43,128:24,160:3,
		192:31,224:6},98:{64:2,96:45,128:0,160:16,192:20,224:38},99:{0:56,32:35,64:28}},46:{51:{224:28},137:{192:35,224:35}},
		72:{44:{32:9}},176:{32:{64:28},34:{0:28,32:28}}},20:{5:{60:{0:34,32:12},179:{96:9}},15:{181:{0:41,16:77,48:44,64:30,80:37,96:36,
		128:19,144:64,160:48,176:50},220:{0:67,16:30,64:62,80:34}},16:{15:{176:9}},18:{34:{48:32},96:{16:33},97:{64:18,80:10,96:23,112:34},
		99:{96:59,128:27,144:42,160:52,176:5,192:47,208:17,224:29}},35:{96:{64:2,80:16,96:8,112:17,128:20,144:9}},43:{194:{0:39},
		195:{0:13}},46:{51:{192:11}},64:{187:{128:21}},68:{66:{112:15}},72:{41:{0:7}},96:{0:{160:78}},155:{146:{0:66,16:83,32:71,48:37,
		64:79,80:21,96:25,112:30,128:41,144:77,160:19,176:51,192:57,208:75,224:44,240:7}},161:{188:{0:73,16:74,32:54,48:82,64:9,80:9}},
		208:{110:{48:9}},216:{244:{48:28}}},21:{3:{5:{64:11,80:32,152:28,184:0}},15:{181:{32:50,40:48,120:37,224:25,232:7},220:{32:19,
		48:62,56:34,112:14,120:40,128:22,136:22,152:70,160:61,168:58,176:23,184:23,240:10}},16:{15:{0:24}},18:{34:{72:49,232:9}},
		23:{254:{0:34,8:12,16:4,120:1}},35:{54:{32:9}},46:{51:{216:35}},51:{0:{80:43,88:43,96:2,128:53}},66:{7:{0:32}},96:{0:{0:69,16:55,
		24:46,40:26,48:1,64:63,72:12,112:35,120:35,136:35,144:72,152:1}},99:{150:{0:49,8:9,16:8,24:0,32:20,40:16,48:28,56:32,64:59,72:2,
		80:17,88:5,96:33,104:42,112:52,120:43},151:{64:31,72:47,80:38,88:11,104:35,112:14,120:24,128:56,136:6,144:0,152:3,160:18,168:27}},
		103:{4:{8:28}},136:{18:{144:10,152:23}},159:{248:{200:0,216:0,224:45}},216:{39:{136:16,152:16,160:28},182:{224:9},244:{16:8,24:5,
		40:25}}},22:{3:{5:{32:31,36:45,40:47,44:52,48:43,52:38,56:3,60:10,76:32,128:49,136:8,140:0,148:35,160:24,164:20,172:27,180:18,
		192:23,196:34,204:2,208:6,216:59,220:29,224:2,228:42,232:14,236:5,240:33,244:16,248:17,252:56}},15:{145:{8:76,12:60,16:53,20:80},
		181:{112:15,116:19},193:{128:9,132:24,136:32,140:11,144:16,148:31,152:8,156:28,160:35,164:20,168:52,172:14,176:0},220:{40:77,
		148:58,192:10,196:21,216:22,228:63,236:36,252:30}},16:{15:{8:12,12:31,16:4,20:8}},18:{34:{244:32,252:49}},31:{220:{220:9}},
		35:{54:{40:32},71:{64:32,68:9,72:11}},46:{51:{208:9}},52:{46:{180:32,184:8},82:{164:39,176:39,180:39},94:{116:32},129:{224:32}},
		54:{222:{32:13,36:13,52:13,100:13}},70:{232:{92:9,124:11}},83:{118:{240:53}},96:{0:{8:69,12:55,32:46,36:26,56:1,60:63,80:12,84:44,
		88:50,96:25,104:64,132:35,176:35,180:35,184:69}},161:{188:{112:82,116:9,120:9}},162:{222:{148:54}},173:{83:{192:49,200:9}},
		185:{48:{120:11}},202:{174:{132:49}},216:{182:{232:9},244:{32:5}}},23:{3:{3:{32:9},5:{72:11,132:49,134:8,144:0,146:35,168:20,
		202:42,212:6,214:5}},15:{145:{0:76,2:60,4:53,24:80},177:{64:9,66:49,68:8,70:14},220:{144:70,146:61,200:30,202:67,220:21,222:36,
		224:67,234:21,248:64,250:44}},23:{254:{24:32}},35:{54:{44:11,46:8,48:28},96:{16:32,18:8,20:8,22:56,24:16,26:49,28:9,30:24}},
		51:{0:{136:53,138:53,140:53,142:53}},52:{82:{184:39},94:{144:24}},96:{0:{92:50,94:35,100:21,102:15,110:78,128:35}},99:{151:{184:9,
		186:19,188:8,190:7}},110:{238:{2:49}},136:{18:{50:9,128:50,130:9,132:21,134:56,136:37,138:50,140:35,142:8,160:9,254:65}},
		139:{56:{16:19,18:51,20:57,22:75,24:44,26:7,28:73,30:74,32:54}},162:{213:{234:11},250:{238:9}},173:{83:{196:8,204:32,206:16}},
		208:{78:{128:24,130:28,132:16},86:{88:9,90:11}},216:{182:{236:24,238:9},244:{12:49,14:8,36:28}}},24:{1:{178:{1:32,4:9,5:9,6:9,7:11,
		8:49,9:32,10:8,11:20,64:28,65:32,88:6,89:35}},3:{2:{0:7,2:21,3:15,64:9,65:9,66:28,67:49,68:32,69:6,70:8,71:59,72:16,73:43,74:9,
		75:0,76:35,77:20,78:56,79:11,80:14,81:5,82:33,83:31,84:2,85:29,86:24,87:42,88:10,89:2,90:52,91:18,92:47,93:17,94:23,95:3,96:27,
		97:38,98:45},3:{2:9,5:9},4:{0:9,1:9,2:9,3:32,4:32,6:32,9:9,10:9}},15:{177:{72:59,73:6,74:2,75:11,76:0,77:33,78:16,79:28,80:32,
		81:24,82:35,83:20,84:56,85:5,86:5,87:29,88:14,89:11,90:17,91:42,92:45,93:43,94:52,95:18,96:47,97:31,98:38,99:3,100:27,102:23,
		103:10,104:34,105:12,106:4},181:{240:25,241:25,242:64,243:64,244:64,245:77,246:36,247:37,248:30,249:44,250:77,251:77,252:41,253:41,
		254:21},193:{0:6,1:28,2:35,3:20,4:8,5:16,6:9,7:32,8:56,9:0,10:42,11:33},220:{204:77,205:77,206:41,207:41,226:30,227:22,232:63,
		233:37}},18:{96:{0:9,1:9,2:9,3:9}},23:{228:{192:27,193:9,194:9}},31:{220:{236:9}},35:{50:{128:32,129:32,130:32,131:32,132:32,
		133:32,134:32,135:32,142:49,143:49,144:49,176:14,177:14,178:14,192:8,193:8,194:8,195:11,196:11,197:11,208:29,210:29,211:29,212:29,
		213:29,214:29,224:28,226:28,227:28,228:33,229:33,230:33,231:6,232:6,233:6,234:35,235:35,236:35,237:0,238:0,239:0},54:{50:35,51:5,
		52:17,53:56,54:43,55:0,56:52,57:27,58:6,59:47,60:3,61:38,62:32},55:{1:28,2:28,3:28,4:0,5:0,6:0,7:35,8:35,9:35,10:20,11:20,12:20,
		13:6,14:6,15:6,16:8,17:8,18:8,19:11,20:11,21:11,22:2,23:2,24:2,25:14,26:14,27:14,29:9,30:9,32:9,33:49,34:49,35:49,36:32,37:32,
		38:32,39:32,40:59,41:59,42:59,126:32,127:32},71:{93:12,94:53,96:45,97:20,98:59,99:29,100:6,101:2,102:49,103:42,104:43,105:8,106:14,
		107:5,108:52,109:0,110:33,111:16,112:47,113:17,114:28,117:24,118:35,119:56,120:31,121:38,122:3,123:27,124:18,125:23,126:10,127:34},
		96:{0:32,1:32,2:32,3:32,4:32,5:32,6:32,7:32,8:32,9:32,10:32,11:32,12:8,14:32,15:32,32:9,33:24,34:11,35:2,36:17,37:31,38:28,39:20,
		40:42,41:38,42:6,43:14,44:27,45:32,46:32,47:8,48:8,49:8,50:8,51:8,52:8,240:20,241:32,242:8,243:11,244:32,245:32,246:49,248:16,
		249:32,250:2,251:27,252:56,253:9,254:49,255:24}},43:{193:{64:39},194:{16:39}},51:{0:{31:53,252:53}},52:{82:{168:39,170:39},
		94:{146:8},95:{224:17,225:33,226:5,227:59,228:29,229:42,230:54,235:45,239:16,240:14,241:20,242:35,243:28,244:11,245:9,246:24,
		247:32,248:8,249:6,250:56,251:49,252:0,253:16,254:2},119:{205:35}},54:{25:{14:9,15:9,20:9,82:9},26:{166:9},222:{64:13,65:13,
		88:13}},63:{246:{112:59,113:11,119:9}},64:{252:{64:9,65:32,66:9,67:9,68:9,69:9,70:32,71:32,72:32,73:32,74:49,75:49,76:49,77:49,
		78:14,79:14,80:14,81:14,82:16,83:16,84:16,85:16,86:8,87:8,88:8,89:8,97:43,98:6,99:6,100:6,101:6,102:35,103:35,104:35,105:35,106:20,
		107:20,108:20,109:20,110:28,111:28,112:28,113:28,114:11,115:11,116:11,117:11,118:24,119:24,120:24,121:24,122:24,123:24,124:56,
		125:9,126:2}},96:{0:{108:35,130:35,131:1}},99:{77:{128:9,129:9,130:32,131:49,132:24,133:11,134:16,135:2,136:8,137:59,138:17,139:28,
		140:33,141:0,142:5,143:35,144:20,145:6,147:29,148:42,149:14,150:56,151:9,152:32,153:49,154:24,155:11,156:16,157:2,158:8,159:17,
		160:28,161:35,162:49,163:3,186:32,187:9,191:9,232:32,233:56,234:14,235:42,236:29,237:45,238:6,239:20,240:35,241:5,242:0,243:33,
		244:28,245:17,246:59,247:8,248:2,249:16,250:11,251:24,252:49,253:32,254:9}},139:{56:{34:71}},142:{4:{177:6,178:9,179:6,180:6}},
		151:{148:{32:49,33:32,34:11,35:8,36:9,37:28,38:35,39:20,40:0,41:16}},161:{188:{127:71}},162:{213:{232:11,233:11},250:{236:9,
		237:9}},168:{185:{4:24,5:9,6:49,7:32}},173:{83:{198:0,208:17,209:24,210:28,211:6,212:20,213:14,214:11,216:2,217:56,218:33,219:35,
		220:59}},192:{31:{212:24,213:33},43:{175:9,184:49},157:{36:9},189:{197:49}},195:{17:{0:11}},198:{41:{96:9,97:37,98:50,99:25,100:7,
		101:21,102:65,103:49,104:24,105:32,106:54,107:19},99:{2:49}},204:{87:{185:9}},206:{72:{209:9}},208:{78:{134:24,135:16}},
		216:{198:{192:28,193:9},244:{0:32,1:18,2:54,3:6,4:0,5:54,6:5,7:9,8:49,9:8,10:8}}},26:{15:{220:{208:{128:30}}},52:{94:{201:{0:9}}},
		54:{239:{103:{128:9}}}},28:{51:{0:{29:{128:53}}},52:{82:{169:{0:39}},94:{248:{0:9,16:11,32:35,48:14,64:20,80:28,96:32,112:8,128:24,
		144:6,160:49,176:0,192:16,208:56},249:{32:2,48:17,64:32,80:24,96:33,128:59,144:5,160:29,176:42,192:45,208:52,224:43,240:31},
		250:{0:38,16:47,32:3,48:27,80:18,96:23,112:10,128:34,144:12,160:4,176:1}},95:{255:{0:14,16:20,32:35,48:28,64:11,80:9,96:24,112:32,
		128:8}}},54:{222:{58:{32:13}}}},32:{70:{232:{86:{124:47,125:47,126:47}}},99:{77:{55:{0:31,1:31,2:31,3:31,12:31,13:31,14:31,15:31,
		24:31,25:31,26:31,27:31,32:31,33:31,34:31,35:31,36:31,37:31,38:31,39:31,40:31,41:31,42:31,43:31,44:31,45:31,46:31,47:31,49:31,
		50:31,51:31,52:31,53:31,54:31,55:31,56:31,253:31,254:31,255:31}},78:{238:{251:45,253:45,255:45}}}}
	}
}

const resolveIp = (ip, data) => {
	const match = ip.trim().match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
	if(!match) { return null }
	
	const [a, b, c, d] = match.slice(1).map(x => +x)
	const ip_number = a * 256**3 + b * 256**2 + c * 256 + d
	
	const get_first = (list, ...args) => {
		let result = list
		for(const arg of args) {
			result = result[arg]
			if(typeof result !== "object") break
		}
		return result
	}
	
	for(let mask = 32; mask >= 11; mask--) {
		const masked = ip_number & (-1 << (32 - mask))
		
		let [a, b, c, d] = [masked >>> 24, masked >>> 16 & 255, masked >>> 8 & 255, masked & 255]
		let valueIndex = get_first(data.ranges, mask, a, b, c, d)
		
		if(valueIndex != null) {
			return data.values[valueIndex]
		}
	}
	
	return null
}

if(IS_BACKGROUND_PAGE) {
	let userAgentSwitcherEnabled = false
	let userAgentSwitcherTimeout
	
	if(IS_CHROME) {
		chrome.declarativeNetRequest.updateSessionRules({
			removeRuleIds: [9010]
		})
	}
	
	contentScript.listen({
		async getServerAddress(info, respond) {
			if(IS_CHROME) {
				if(!userAgentSwitcherEnabled) {
					userAgentSwitcherEnabled = true
					
					chrome.declarativeNetRequest.updateSessionRules({
						removeRuleIds: [9010],
						addRules: [{
							action: {
								type: "modifyHeaders",
								requestHeaders: [{
									header: "User-Agent",
									operation: "set",
									value: "Roblox/WinInet"
								}]
							},
							condition: {
								requestMethods: ["post"],
								urlFilter: "https://gamejoin.roblox.com/v1/join-game-instance",
								domains: [chrome.runtime.id]
							},
							id: 9010
						}]
					})
				}
				
				clearTimeout(userAgentSwitcherTimeout)
				
				userAgentSwitcherTimeout = setTimeout(() => {
					userAgentSwitcherEnabled = false
					
					chrome.declarativeNetRequest.updateSessionRules({
						removeRuleIds: [9010]
					})
				}, 5e3)
			}
			
			const res = await fetch(`https://gamejoin.roblox.com/v1/join-game-instance`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
					"User-Agent": "Roblox/WinInet"
				},
				body: JSON.stringify({ placeId: info.placeId, gameId: info.jobId })
			})
			
			const json = await res.json()
			const address = json?.joinScript?.UdmuxEndpoints?.[0]?.Address ?? json?.joinScript?.MachineAddress
			
			if(address) {
				respond({
					success: true,
					address: address
				})
			} else {
				respond({
					success: false,
					status: json.status
				})
			}
		}
	})
}

const gettingServerDetails = {}

const resolveServerDetails = details => {
	if(!details.success) {
		switch(details.status) {
		case 22:
			return {
				success: false,
				status: details.status,
				statusText: "Full",
				statusTextLong: "Unable to fetch server location: Server is full"
			}
		case 12:
			return {
				success: false,
				status: details.status,
				statusText: "Unknown",
				statusTextLong: "Unable to fetch server location: You do not have access to this place"
			}
		default:
			return {
				success: false,
				status: details.status,
				statusText: "Unknown",
				statusTextLong: `Unable to fetch server location: Unknown status ${details.status}`
			}
		}
		
		return
	}
	
	const address = details.address
	let location
	
	if(address.startsWith("128.116")) {
		location = serverRegionsByIp[address.replace(/^(128\.116\.\d+)\.\d+$/, "$1.0")]
	} else {
		const awsRegionName = resolveIp(address, awsRegions)
		
		if(awsRegionName) {
			location = serverRegions[`AWS_${awsRegionName}`]
			if(!location) console.log("Couldn't find region for AWS", awsRegionName)
		}
	}
	
	if(!location) {
		console.log("Unknown", address)
		
		return {
			success: false,
			address: address,
			statusText: "Unknown",
			statusTextLong: `Unknown server address ${address}`
		}
	}
	
	return {
		success: true,
		address: address,
		location: location
	}
}

const getServerDetails = (placeId, jobId, callback) => {
	const cached = btrLocalStorage.getItem(`serverDetailsV2-${jobId}`)
	
	if(cached) {
		callback(resolveServerDetails(cached))
		return
	}
	
	let promise = gettingServerDetails[jobId]
	
	if(!promise) {
		promise = gettingServerDetails[jobId] = new Promise(resolve => {
			backgroundScript.send("getServerAddress", { placeId: placeId, jobId: jobId }, details => {
				delete gettingServerDetails[jobId]
				
				btrLocalStorage.setItem(`serverDetailsV2-${jobId}`, details, { expires: Date.now() + (details.success ? 60 * 60e3 : 15e3) })
				
				resolve(resolveServerDetails(details))
			})
		})
	}
	
	promise.then(callback)
}
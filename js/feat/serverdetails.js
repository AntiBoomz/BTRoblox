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
	SaoPaulo: { city: "São Paulo", country: { name: "Brazil", code: "BR" }, region: { name: "State of São Paulo", code: "SP" } },
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
	"128.116.35.0": serverRegions.London,
	"128.116.44.0": serverRegions.Frankfurt,
	"128.116.45.0": serverRegions.Miami,
	"128.116.46.0": serverRegions.Singapore,
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
	"128.116.80.0": serverRegions.Ashburn,
	"128.116.81.0": serverRegions.Chicago,
	"128.116.84.0": serverRegions.Chicago,
	"128.116.86.0": serverRegions.SaoPaulo,
	"128.116.87.0": serverRegions.Ashburn,
	"128.116.88.0": serverRegions.Chicago,
	"128.116.95.0": serverRegions.Dallas,
	"128.116.102.0": serverRegions.Ashburn,
	"128.116.104.0": serverRegions.Mumbai,
	"128.116.105.0": serverRegions.Chicago,
	"128.116.115.0": serverRegions.Seattle,
	"128.116.116.0": serverRegions.LosAngeles,
	"128.116.117.0": serverRegions.SanJose,
	"128.116.119.0": serverRegions.London,
	"128.116.120.0": serverRegions.Tokyo,
	"128.116.123.0": serverRegions.Frankfurt,
	"128.116.127.0": serverRegions.Miami,
}

const awsRegions = {
	regions: [
		"Incheon", "Santiago", "Paris", "TelAviv", "Boardman", "Riyadh", "HongKong", "Mumbai", "Houston", "Frankfurt", "Ashburn", 
		"Bangkok", "Dublin", "Auckland", "Beijing", "SaoPaulo", "Boston", "London", "Milan", "KualaLumpur", "Phoenix", "Sydney", "Miami", 
		"Delhi", "Querétaro", "SanJose", "Dallas", "Lagos", "Calgary", "Tokyo", "Bahrain", "LasVegas", "Zaragoza", "Osaka", "Columbus", 
		"Taipei", "Singapore", "KansasCity", "Atlanta", "Zurich", "Ningxia", "BuenosAires", "Seattle", "CapeTown", "Dubai", "Minneapolis", 
		"Jakarta", "Copenhagen", "Melbourne", "NewYorkCity", "Chicago", "Milwaukee", "Hyderabad", "Berlin", "LosAngeles", "Lima", 
		"Montreal", "Tampa", "Helsinki", "Stockholm", "Munich", "Muscat", "Warsaw", "Kolkata", "Philadelphia", "Piscataway", "Westborough", 
		"Portland", "SouthBend", "Perth", "Hamburg", "Baltimore", "Manila", "Nashville", "Detroit", "Charlotte", "Dortmund", "Denver", 
		"Honolulu", "Trenton", "Manchester", "Jackson", "Lenexa", "Sacramento"
	],
	ranges: {
		11:{44:{192:10,224:4}},12:{3:{64:9,80:10,208:10,224:10},34:{192:10,208:4,224:10},35:{80:4},100:{48:10}},13:{3:{136:34,144:34,
		248:12},13:{216:10},18:{208:10},34:{240:12,248:12},35:{72:29,160:4,168:10},52:{200:10,208:12},54:{80:10,160:10,184:4},98:{80:10,
		88:10},100:{24:10},108:{128:12}},14:{3:{8:17,16:34,20:34,24:21,36:0,104:21,108:7,112:29,120:9,124:9,132:34},13:{36:2,40:17,112:29,
		204:7,232:7,236:21},18:{116:34,132:17,156:9,168:17,204:10,216:34,220:34,224:34,232:10},23:{20:10},35:{156:9},43:{200:0},
		47:{128:36},52:{4:10,20:10,24:4,32:4,36:4,40:4,48:12,196:29},54:{68:4,88:10,144:10,156:10},57:{180:29},63:{32:12,176:9,180:9},
		65:{0:7},100:{20:4},107:{20:10},184:{32:4,36:4}},15:{3:{0:36,6:7,14:34,28:44,34:0,96:56,98:56,102:13,128:34},13:{48:59,54:21,58:34,
		60:59,62:59,126:7,134:17,158:29,200:7,202:7,210:21,212:36,214:36,228:36,230:29,244:43,250:36},15:{156:56,164:0,206:7,222:56,228:15,
		236:2},16:{50:48,54:56,62:39,156:36,162:6,168:59,170:59},18:{60:52,100:32,138:36,140:36,142:36,144:25,166:6,176:29,180:29,184:9,
		192:9,194:9,196:9,198:9,202:12,236:4},35:{44:32,176:17,178:17,182:56},40:{176:28},43:{198:6,204:7,206:29,208:11,210:11,212:35,
		216:19},46:{168:13},50:{16:10},51:{16:3,48:32,94:32,168:5,224:53},52:{0:10,2:10,10:4,12:4,16:12,18:12,30:12,44:10,52:25,54:10,58:9,
		62:21,68:29,70:10,72:10,86:10,88:4,90:10,192:29,194:29,220:36},54:{64:29,72:12,74:12,76:12,116:0,148:4,170:12,172:10,174:10,176:25,
		180:0,194:12,196:10,200:4,202:4,204:10,208:10,210:10,212:4,216:12,224:10,226:10,234:10,236:10,242:10,248:29},78:{12:24,14:24},
		83:{160:1},95:{40:6},99:{80:12},107:{176:14},108:{136:46},158:{252:44}},16:{3:{12:34,13:34,101:25,130:34,131:34},5:{174:31},
		13:{50:59,51:59,52:25,53:59,56:25,57:25,124:0,125:0,128:64,130:41,144:11,146:69,152:61,154:58,160:70,162:63,192:29,208:33,209:0,
		246:43,247:43},15:{103:27,128:35,134:21,152:33,160:18,161:18,168:33,184:30,185:30,188:2,216:32,217:32,232:46,240:43,253:54,254:54},
		16:{16:59,24:30,26:48,27:48,28:43,52:56,78:46,79:46,112:52,144:4,145:4,146:4,176:21,208:33,209:33},18:{102:18,130:17,136:36,153:9,
		162:6,163:6,175:17,178:29,179:29,182:29,183:29,188:34,189:34,190:34,191:34,200:12,201:12,228:15,229:15,230:15,231:15,246:4},
		35:{152:18,153:10,154:7,155:4,180:2,181:2},40:{172:44},43:{192:40,196:14,218:46,220:21},50:{18:25,19:10,112:4},51:{20:59,21:59,
		24:17,34:39,44:2,45:2,84:3,85:3,92:32,96:39,112:44,118:18},52:{8:25,9:25,14:34,15:34,28:9,29:9,47:2,56:17,57:9,60:56,65:21,66:7,
		67:15,74:36,75:4,77:36,78:0,79:0,80:14,81:14,83:40},54:{54:35,66:21,67:25,78:12,79:21,93:9,94:15,95:29,150:29,152:10,154:12,155:12,
		168:29,169:36,178:29,179:36,183:25,193:25,198:10,199:29,206:21,207:15,214:4,215:25,218:4,219:25,220:12,221:10,223:14,228:12,229:12,
		232:15,238:29,241:25,244:4,245:4,246:12,247:12,250:29,251:36,252:21,253:21,254:36,255:36},56:{10:36,69:19,70:19,112:28,125:15,
		126:15,127:15,228:59},98:{130:52},99:{79:56},140:{179:14},157:{175:30,241:30},161:{189:40},174:{129:10},184:{73:10}},
		17:{3:{40:{0:9,128:12},41:{0:17,128:10},42:{0:25,128:4}},5:{60:{128:29}},40:{192:{0:52}},46:{137:{0:12}},52:{64:{0:21,128:21},
		76:{0:36,128:36},82:{0:40}},54:{46:{0:6},92:{0:29,128:10},151:{0:25,128:36},153:{0:25,128:21},222:{128:14},233:{128:15}},
		56:{68:{0:19},124:{0:15},155:{0:33,128:33}},75:{101:{128:10}},79:{125:{0:12}},176:{34:{128:12}},177:{71:{128:15}},184:{72:{128:10},
		169:{128:25}}},18:{3:{43:{0:0,64:34,128:43,192:30},44:{0:36,64:21,128:29,192:15},45:{0:6}},16:{15:{192:10},56:{0:38,64:10,128:50,
		192:10},57:{0:36},71:{0:4,64:4},184:{0:0}},18:{88:{0:26,64:26,128:20},89:{0:9,128:8},97:{0:10,128:34,192:12},98:{0:4}},
		43:{193:{0:40}},45:{57:{128:36}},46:{51:{128:12},137:{128:12}},54:{112:{0:65},233:{0:15,64:15}},67:{202:{0:10}},68:{79:{0:40}},
		69:{230:{192:40},231:{128:40},234:{192:40},235:{128:40}},70:{224:{192:54}},71:{131:{192:14},132:{0:14},136:{64:14},137:{0:14}},
		75:{2:{128:10},3:{0:81,128:68},22:{192:38},45:{128:9},47:{0:26}},83:{119:{64:17,128:9}},122:{248:{192:36}},161:{178:{0:50,128:65},
		193:{0:22,128:56}},175:{41:{128:36,192:29}},176:{34:{64:12}},184:{72:{0:25,64:10}},204:{236:{128:25,192:10}}},19:{3:{5:{0:10}},
		5:{60:{64:10,96:9}},15:{181:{192:26}},18:{34:{0:10},96:{32:9,64:15,96:44,128:25,160:3,192:32,224:7},98:{64:2,96:46,128:0,160:17,
		192:21,224:39},99:{0:56,32:36,64:29}},23:{228:{224:10}},46:{51:{224:29},137:{192:36,224:36}},72:{44:{32:10}},176:{32:{64:29},
		34:{0:29,32:29}}},20:{5:{60:{0:35,32:13},179:{96:10}},15:{181:{0:42,16:77,48:45,64:31,80:38,96:37,128:20,144:64,160:49,176:50},
		220:{0:67,16:31,64:62,80:35}},16:{15:{176:10}},18:{34:{48:4},96:{16:33},97:{64:19,80:11,96:24,112:35},99:{96:59,128:28,144:43,
		160:52,176:6,192:48,208:18,224:30}},35:{96:{64:2,80:17,96:9,112:18,128:21,144:10}},43:{194:{0:40},195:{0:14}},46:{51:{192:12}},
		51:{74:{0:53}},64:{187:{128:22}},68:{66:{112:16}},72:{41:{0:8}},96:{0:{160:78}},155:{146:{0:66,16:83,32:71,48:38,64:79,80:22,96:26,
		112:31,128:42,144:77,160:20,176:51,192:57,208:75,224:45,240:8}},161:{188:{0:73,16:74,32:54,48:82,64:10,80:10}},208:{110:{48:10}},
		216:{244:{48:29}}},21:{3:{5:{64:12,80:4,152:29,184:0}},15:{181:{32:50,40:49,120:38,224:26,232:8},220:{32:20,48:62,56:35,112:15,
		120:41,128:23,136:23,152:70,160:61,168:58,176:24,184:24,240:11}},16:{15:{0:25}},18:{34:{72:34,232:10}},23:{254:{0:35,8:13,16:5,
		120:1}},35:{54:{32:10},96:{48:9}},46:{51:{216:36}},51:{0:{80:44,88:44,96:2,128:53}},66:{7:{0:4}},96:{0:{0:69,16:55,24:47,40:27,
		48:1,64:63,72:13,112:36,120:36,136:36,144:72,152:1}},99:{150:{0:34,8:10,16:9,24:0,32:21,40:17,48:29,56:4,64:59,72:2,80:18,88:6,
		96:33,104:43,112:52,120:44},151:{64:32,72:48,80:39,88:12,104:36,112:15,120:25,128:56,136:7,144:0,152:3,160:19,168:28}},
		103:{4:{8:29}},136:{18:{144:11,152:24}},159:{248:{200:0,216:0,224:46}},216:{39:{136:17,152:17,160:29},182:{224:10},244:{16:9,24:6,
		40:26}}},22:{3:{5:{32:32,36:46,40:48,44:52,48:44,52:39,56:3,60:11,76:4,88:34,128:34,136:9,140:0,148:36,160:25,164:21,172:28,180:19,
		192:24,196:35,204:2,208:7,216:59,220:30,224:2,228:43,232:15,236:6,240:33,244:17,248:18,252:56}},15:{145:{8:76,12:60,16:53,20:80},
		181:{112:16,116:20},193:{128:10,132:25,136:4,140:12,144:17,148:32,152:9,156:29,160:36,164:21,168:52,172:15,176:0},220:{40:77,
		148:58,192:11,196:22,216:23,228:63,236:37,252:31}},16:{15:{8:13,12:32,16:5,20:9}},18:{34:{244:4,252:34}},31:{220:{220:10}},
		35:{54:{40:4},71:{64:4,68:10,72:12}},46:{51:{208:10}},52:{46:{180:4,184:9},82:{164:40,176:40,180:40},94:{116:4},129:{224:4}},
		54:{222:{32:14,36:14,52:14,100:14}},70:{232:{92:10,124:12}},83:{118:{240:53}},96:{0:{8:69,12:55,32:47,36:27,56:1,60:63,80:13,84:45,
		88:50,96:26,104:64,132:36,176:36,180:36,184:69}},161:{188:{112:82,116:10,120:10}},162:{222:{148:54}},173:{83:{192:34,200:10}},
		185:{48:{120:12}},202:{174:{132:34}},216:{182:{232:10},244:{32:6}}},23:{3:{3:{32:10},5:{72:12,74:12,92:34,126:32,132:34,134:9,
		144:0,146:36,168:21,202:43,212:7,214:6}},15:{145:{0:76,2:60,4:53,24:80},177:{64:10,66:34,68:9,70:15},220:{144:70,146:61,200:31,
		202:67,220:22,222:37,224:67,234:22,248:64,250:45}},23:{254:{24:4}},35:{54:{44:12,46:9,48:29},96:{16:4,22:56,24:17,26:34,28:10,
		30:25}},43:{226:{24:4}},51:{0:{136:53,138:53,140:53,142:53}},52:{82:{184:40},94:{144:25}},96:{0:{92:50,94:36,100:22,102:16,110:78,
		128:36}},99:{151:{184:10,186:20,188:9,190:8}},110:{238:{2:34}},136:{18:{50:10,128:50,130:10,132:22,134:56,136:38,138:50,140:36,
		142:9,160:10,254:65}},139:{56:{16:20,18:51,20:57,22:75,24:45,26:8,28:73,30:74,32:54}},162:{213:{234:12},250:{238:10}},
		173:{83:{196:9,204:4,206:17}},208:{78:{128:25,130:29,132:17},86:{88:10,90:12}},216:{182:{236:25,238:10},244:{12:34,14:9,36:29}}},
		24:{1:{178:{1:4,4:10,5:10,6:10,7:12,8:34,9:4,10:9,11:21,64:29,65:4,88:7,89:36,90:2,91:0,92:56,93:59,94:17}},3:{2:{0:8,2:22,3:16,
		64:10,65:10,66:29,67:34,68:4,69:7,70:9,71:59,72:17,73:44,74:10,75:0,76:36,77:21,78:56,79:12,80:15,81:6,82:33,83:32,84:2,85:30,
		86:25,87:43,88:11,89:2,90:52,91:19,92:48,93:18,94:24,95:3,96:28,97:39,98:46,99:14,100:40},3:{2:10,5:10},4:{0:10,1:10,2:10,3:4,4:4,
		6:4,9:10,10:10}},15:{177:{72:59,73:7,74:2,75:12,76:0,77:33,78:17,79:29,80:4,81:25,82:36,83:21,84:56,85:6,86:6,87:30,88:15,89:12,
		90:18,91:43,92:46,93:44,94:52,95:19,96:48,97:32,98:39,99:3,100:28,102:24,103:11,104:35,105:13,106:5},181:{240:26,241:26,242:64,
		243:64,244:64,245:77,246:37,247:38,248:31,249:45,250:77,251:77,252:42,253:42,254:22},193:{0:7,1:29,2:36,3:21,4:9,5:17,6:10,7:4,
		8:56,9:0,10:43,11:33},220:{204:77,205:77,206:42,207:42,226:31,227:23,232:63,233:38}},18:{96:{0:10,1:10,2:10,3:10}},23:{228:{192:28,
		193:10,194:10}},31:{220:{236:10}},35:{50:{128:4,129:4,130:4,131:4,132:4,133:4,134:4,135:4,137:10,139:10,141:10,142:34,143:34,
		144:34,176:15,177:15,178:15,192:9,193:9,194:9,195:12,196:12,197:12,208:30,210:30,211:30,212:30,213:30,214:30,224:29,226:29,227:29,
		228:33,229:33,230:33,231:7,232:7,233:7,234:36,235:36,236:36,237:0,238:0,239:0},54:{50:36,51:6,52:18,53:56,54:44,55:0,56:52,57:28,
		58:7,59:48,60:3,61:39,62:4},55:{1:29,2:29,3:29,4:0,5:0,6:0,7:36,8:36,9:36,10:21,11:21,12:21,13:7,14:7,15:7,16:9,17:9,18:9,19:12,
		20:12,21:12,22:2,23:2,24:2,25:15,26:15,27:15,29:10,30:10,32:10,33:34,34:34,35:34,36:4,37:4,38:4,39:4,40:59,41:59,42:59,126:4,
		127:4},71:{93:13,94:53,96:46,97:21,98:59,99:30,100:7,101:2,102:34,103:43,104:44,105:9,106:15,107:6,108:52,109:0,110:33,111:17,
		112:48,113:18,114:29,117:25,118:36,119:56,120:32,121:39,122:3,123:28,124:19,125:24,126:11,127:35},96:{0:4,1:4,2:4,3:4,4:4,5:4,6:4,
		7:4,8:4,9:4,10:4,11:4,12:9,14:4,15:4,32:10,33:25,34:12,35:2,36:18,37:32,38:29,39:21,40:43,41:39,42:7,43:15,44:28,45:4,46:4,47:9,
		240:21,241:4,242:9,243:12,244:4,245:4,246:34,248:17,249:4,250:2,251:28,252:56,253:10,254:34,255:25},111:{254:4,255:10}},
		43:{193:{64:40},194:{16:40},226:{26:4}},51:{0:{31:53,252:53}},52:{82:{168:40,170:40},94:{146:9},95:{224:18,225:33,226:6,227:59,
		228:30,229:43,230:54,235:46,239:17,240:15,241:21,242:36,243:29,244:12,245:10,246:25,247:4,248:9,249:7,250:56,251:34,252:0,253:17,
		254:2},119:{205:36}},54:{25:{14:10,15:10,20:10,82:10},26:{166:10},222:{64:14,65:14,88:14}},63:{246:{112:59,113:12,119:10}},
		64:{252:{64:10,65:4,66:10,67:10,68:10,69:10,70:4,71:4,72:4,73:4,74:34,75:34,76:34,77:34,78:15,79:15,80:15,81:15,82:17,83:17,84:17,
		85:17,86:9,87:9,88:9,89:9,97:44,98:7,99:7,100:7,101:7,102:36,103:36,104:36,105:36,106:21,107:21,108:21,109:21,110:29,111:29,112:29,
		113:29,114:12,115:12,116:12,117:12,118:25,119:25,120:25,121:25,122:25,123:25,124:56,125:10,126:2}},96:{0:{108:36,130:36,131:1}},
		99:{77:{128:10,129:10,130:4,131:34,132:25,133:12,134:17,135:2,136:9,137:59,138:18,139:29,140:33,141:0,142:6,143:36,144:21,145:7,
		147:30,148:43,149:15,150:56,151:10,152:4,153:34,154:25,155:12,156:17,157:2,158:9,159:18,160:29,161:36,162:34,163:3,186:4,187:10,
		191:10,232:4,233:56,234:15,235:43,236:30,237:46,238:7,239:21,240:36,241:6,242:0,243:33,244:29,245:18,246:59,247:9,248:2,249:17,
		250:12,251:25,252:34,253:4,254:10}},139:{56:{34:71}},142:{4:{177:7,178:10,179:7,180:7}},151:{148:{32:34,33:4,34:12,35:9,36:10,
		37:29,38:36,39:21,40:0,41:17}},161:{188:{127:71}},162:{213:{232:12,233:12},250:{236:10,237:10}},168:{185:{4:25,5:10,6:34,7:4}},
		173:{83:{198:0,208:18,209:25,210:29,211:7,212:21,213:15,214:12,216:2,217:56,218:33,219:36,220:59}},192:{31:{212:25,213:33},
		43:{175:10,184:34},157:{36:10},189:{197:34}},195:{17:{0:12}},198:{41:{96:10,97:38,98:50,99:26,100:8,101:22,102:65,103:34,104:25,
		105:4,106:54,107:20},99:{2:34}},204:{87:{185:10}},206:{72:{209:10}},208:{78:{134:25,135:17}},216:{198:{192:29,193:10},244:{0:4,
		1:19,2:54,3:7,4:0,5:54,6:6,7:10,8:34,9:9,10:9}}},26:{15:{220:{208:{128:31}}},52:{94:{201:{0:10}}},54:{239:{103:{128:10}}}},
		28:{51:{0:{29:{128:53}}},52:{82:{169:{0:40}},94:{248:{0:10,16:12,32:36,48:15,64:21,80:29,96:4,112:9,128:25,144:7,160:34,176:0,
		192:17,208:56},249:{32:2,48:18,64:4,80:25,96:33,128:59,144:6,160:30,176:43,192:46,208:52,224:44,240:32},250:{0:39,16:48,32:3,48:28,
		80:19,96:24,112:11,128:35,144:13,160:5,176:1}},95:{255:{0:15,16:21,32:36,48:29,64:12,80:10,96:25,112:4,128:9}}},
		54:{222:{58:{32:14}}}},32:{70:{232:{86:{124:48,125:48,126:48}}},99:{77:{55:{0:32,1:32,2:32,3:32,12:32,13:32,14:32,15:32,24:32,
		25:32,26:32,27:32,32:32,33:32,34:32,35:32,36:32,37:32,38:32,39:32,40:32,41:32,42:32,43:32,44:32,45:32,46:32,47:32,49:32,50:32,
		51:32,52:32,53:32,54:32,55:32,56:32,253:32,254:32,255:32}},78:{238:{251:46,253:46,255:46}}}}
	},
	
	resolve(ip) {
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
			
			let regionIndex = get_first(this.ranges, mask, masked >>> 24, masked >>> 16 & 255, masked >>> 8 & 255, masked & 255)
			
			if(regionIndex != null) {
				return this.regions[regionIndex]
			}
		}
		
		return null
	}
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
		const awsRegionName = awsRegions.resolve(address)
		
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
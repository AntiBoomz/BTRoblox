"use strict"

const serverRegionsByIp = {
	"128.116.0.0": { long: "Sterling, United States", medium: "United States", short: "US" },
	"128.116.1.0": { long: "Los Angeles, United States", medium: "United States", short: "US" },
	"128.116.2.0": { long: "Warsaw, Poland", medium: "Poland", short: "PL" },
	"128.116.3.0": { long: "Warsaw, Poland", medium: "Poland", short: "PL" },
	"128.116.4.0": { long: "Paris, France", medium: "France", short: "FR" },
	"128.116.5.0": { long: "Frankfurt, Germany", medium: "Germany", short: "DE" },
	"128.116.6.0": { long: "Chiyoda, Japan", medium: "Japan", short: "JP" },
	"128.116.11.0": { long: "Sterling, United States", medium: "United States", short: "US" },
	"128.116.13.0": { long: "Amsterdam, Netherlands", medium: "", short: "NL" },
	"128.116.18.0": { long: "Miami, United States", medium: "United States", short: "US" },
	"128.116.19.0": { long: "Paris, France", medium: "France", short: "FR" },
	"128.116.20.0": { long: "Paris, France", medium: "France", short: "FR" },
	"128.116.22.0": { long: "Reston, United States", medium: "United States", short: "US" },
	"128.116.24.0": { long: "Atlanta, United States", medium: "United States", short: "US" },
	"128.116.25.0": { long: "Atlanta, United States", medium: "United States", short: "US" },
	"128.116.26.0": { long: "Paris, France", medium: "France", short: "FR" },
	"128.116.27.0": { long: "Chicago, United States", medium: "United States", short: "US" },
	"128.116.28.0": { long: "San Mateo, United States", medium: "United States", short: "US" },
	"128.116.29.0": { long: "Chicago, United States", medium: "United States", short: "US" },
	"128.116.30.0": { long: "Chicago, United States", medium: "United States", short: "US" },
	"128.116.31.0": { long: "Warsaw, Poland", medium: "Poland", short: "PL" },
	"128.116.33.0": { long: "London, United Kingdom", medium: "United Kingdom", short: "UK" },
	"128.116.34.0": { long: "San Mateo, United States", medium: "United States", short: "US" },
	"128.116.35.0": { long: "London, United Kingdom", medium: "United Kingdom", short: "UK" },
	"128.116.36.0": { long: "London, United Kingdom", medium: "United Kingdom", short: "UK" },
	"128.116.37.0": { long: "Miami, United States", medium: "United States", short: "US" },
	"128.116.38.0": { long: "Miami, United States", medium: "United States", short: "US" },
	"128.116.39.0": { long: "Frankfurt, Germany", medium: "Germany", short: "DE" },
	"128.116.40.0": { long: "Frankfurt, Germany", medium: "Germany", short: "DE" },
	"128.116.41.0": { long: "Frankfurt, Germany", medium: "Germany", short: "DE" },
	"128.116.42.0": { long: "Frankfurt, Germany", medium: "Germany", short: "DE" },
	"128.116.44.0": { long: "Frankfurt, Germany", medium: "Germany", short: "DE" },
	"128.116.45.0": { long: "Miami, United States", medium: "United States", short: "US" },
	"128.116.46.0": { long: "Chicago, United States", medium: "United States", short: "US" },
	"128.116.48.0": { long: "Chicago, United States", medium: "United States", short: "US" },
	"128.116.49.0": { long: "Los Angeles, United States", medium: "United States", short: "US" },
	"128.116.50.0": { long: "Los Angeles, United States", medium: "United States", short: "US" },
	"128.116.51.0": { long: "Sydney, Australia", medium: "Australia", short: "AU" },
	"128.116.53.0": { long: "Sterling, United States", medium: "United States", short: "US" },
	"128.116.54.0": { long: "San Mateo, United States", medium: "United States", short: "US" },
	"128.116.58.0": { long: "Chiyoda, Japan", medium: "Japan", short: "JP" },
	"128.116.59.0": { long: "Toyohashi, Japan", medium: "Japan", short: "JP" },
	"128.116.60.0": { long: "Chiyoda, Japan", medium: "Japan", short: "JP" },
	"128.116.62.0": { long: "Chicago, United States", medium: "United States", short: "US" },
	"128.116.65.0": { long: "San Mateo, United States", medium: "United States", short: "US" },
	"128.116.66.0": { long: "San Mateo, United States", medium: "United States", short: "US" },
	"128.116.67.0": { long: "San Jose, United States", medium: "United States", short: "US" },
	"128.116.69.0": { long: "Chicago, United States", medium: "United States", short: "US" },
	"128.116.70.0": { long: "Reston, United States", medium: "United States", short: "US" },
	"128.116.71.0": { long: "Ashburn, United States", medium: "United States", short: "US" },
	"128.116.72.0": { long: "London, United Kingdom", medium: "United Kingdom", short: "UK" },
	"128.116.73.0": { long: "London, United Kingdom", medium: "United Kingdom", short: "UK" },
	"128.116.74.0": { long: "Sterling, United States", medium: "United States", short: "US" },
	"128.116.75.0": { long: "Sterling, United States", medium: "United States", short: "US" },
	"128.116.80.0": { long: "Sterling, United States", medium: "United States", short: "US" },
	"128.116.81.0": { long: "Chicago, United States", medium: "United States", short: "US" },
	"128.116.82.0": { long: "Chiyoda, Japan", medium: "Japan", short: "JP" },
	"128.116.83.0": { long: "Chiyoda, Japan", medium: "Japan", short: "JP" },
	"128.116.84.0": { long: "Chicago, United States", medium: "United States", short: "US" },
	"128.116.85.0": { long: "Miami, United States", medium: "United States", short: "US" },
	"128.116.87.0": { long: "Sterling, United States", medium: "United States", short: "US" },
	"128.116.88.0": { long: "San Mateo, United States", medium: "United States", short: "US" },
	"128.116.89.0": { long: "London, United Kingdom", medium: "United Kingdom", short: "UK" },
	"128.116.95.0": { long: "Dallas, United States", medium: "United States", short: "US" },
	"128.116.97.0": { long: "Singapore", medium: "Singapore", short: "SG" },
	"128.116.99.0": { long: "Atlanta, United States", medium: "United States", short: "US" },
	"128.116.101.0": { long: "Chicago, United States", medium: "United States", short: "US" },
	"128.116.102.0": { long: "Sterling, United States", medium: "United States", short: "US" },
	"128.116.104.0": { long: "Newark, United States", medium: "United States", short: "US" },
	"128.116.105.0": { long: "Chicago, United States", medium: "United States", short: "US" },
	"128.116.112.0": { long: "Chicago, United States", medium: "United States", short: "US" },
	"128.116.114.0": { long: "Sterling, United States", medium: "United States", short: "US" },
	"128.116.115.0": { long: "Portland, United States", medium: "United States", short: "US" },
	"128.116.116.0": { long: "Los Angeles, United States", medium: "United States", short: "US" },
	"128.116.117.0": { long: "Chicago, United States", medium: "United States", short: "US" },
	"128.116.118.0": { long: "Hong Kong", medium: "Hong Kong", short: "HK" },
	"128.116.119.0": { long: "London, United Kingdom", medium: "United Kingdom", short: "UK" },
	"128.116.120.0": { long: "Chiyoda, Japan", medium: "Japan", short: "JP" },
	"128.116.121.0": { long: "San Mateo, United States", medium: "United States", short: "US" },
	"128.116.122.0": { long: "Paris, France", medium: "France", short: "FR" },
	"128.116.123.0": { long: "Frankfurt, Germany", medium: "Germany", short: "DE" },
	"128.116.124.0": { long: "Warsaw, Poland", medium: "Poland", short: "PL" },
	"128.116.126.0": { long: "San Mateo, United States", medium: "United States", short: "US" },
	"128.116.127.0": { long: "Miami, United States", medium: "United States", short: "US" }
}

if(IS_BACKGROUND_PAGE) {
	let userAgentSwitcherEnabled = false
	let userAgentSwitcherTimeout
	
	if(IS_CHROME) {
		chrome.declarativeNetRequest.updateSessionRules({
			removeRuleIds: [9010]
		})
	}
	
	MESSAGING.listen({
		async getServerDetails(info, respond) {
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
			
			if(!address) {
				respond({
					success: false,
					location: {
						short: json.status === 22 ? "Full" : "Failed",
						medium: json.status === 22 ? "Full" : "Failed",
						long: json.status === 22 ? "Unable to fetch server location: Server is full" : "Unable to fetch server location: " + json.status,
					}
				})
				return
			}
			
			respond({
				success: true,
				ip: address,
				location: serverRegionsByIp[address.replace(/^(128\.116\.\d+)\.\d+$/, "$1.0")] ?? null
			})
		}
	})
}

const gettingServerDetails = {}

const getServerDetails = !IS_BACKGROUND_PAGE && function(placeId, jobId, callback) {
	const cached = btrLocalStorage.getItem(`serverDetails-${jobId}`)
	
	if(cached) {
		callback(cached)
		return
	}
	
	let promise = gettingServerDetails[jobId]
	
	if(!promise) {
		promise = gettingServerDetails[jobId] = new Promise(resolve => {
			MESSAGING.send("getServerDetails", { placeId: placeId, jobId: jobId}, details => {
				delete gettingServerDetails[jobId]
				btrLocalStorage.setItem(`serverDetails-${jobId}`, details, { expires: Date.now() + (details.success ? 5 * 60e3 : 15e3) })
				resolve(details)
			})
		})
	}
	
	promise.then(callback)
}
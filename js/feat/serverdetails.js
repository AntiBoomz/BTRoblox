"use strict"

const serverRegionsByIp = {
	Non118: { city: "Ashburn", country: { name: "United States", code: "US" }, region: { name: "Virginia", code: "VA" } },
	"128.116.0.0": { city: "Ashburn", country: { name: "United States", code: "US" }, region: { name: "Virginia", code: "VA" } },
	"128.116.1.0": { city: "Los Angeles", country: { name: "United States", code: "US" }, region: { name: "California", code: "CA" } },
	"128.116.5.0": { city: "Frankfurt", country: { name: "Germany", code: "DE" }, region: { name: "Hesse", code: "HE" } },
	"128.116.11.0": { city: "Ashburn", country: { name: "United States", code: "US" }, region: { name: "Virginia", code: "VA" } },
	"128.116.13.0": { city: "Paris", country: { name: "France", code: "FR" }, region: { name: "Ile-de-France", code: "IDF" } },
	"128.116.21.0": { city: "Amsterdam", country: { name: "Netherlands", code: "NL" }, region: { name: "North Holland", code: "NH" } },
	"128.116.22.0": { city: "Atlanta", country: { name: "United States", code: "US" }, region: { name: "Georgia", code: "GA" } },
	"128.116.32.0": { city: "New York", country: { name: "United States", code: "US" }, region: { name: "New York", code: "NY" } },
	"128.116.33.0": { city: "London", country: { name: "United Kingdom", code: "UK" }, region: { name: "England", code: "ENG" } },
	"128.116.44.0": { city: "Frankfurt", country: { name: "Germany", code: "DE" }, region: { name: "Hesse", code: "HE" } },
	"128.116.45.0": { city: "Miami", country: { name: "United States", code: "US" }, region: { name: "Florida", code: "FL" } },
	"128.116.48.0": { city: "Chicago", country: { name: "United States", code: "US" }, region: { name: "Illinois", code: "IL" } },
	"128.116.50.0": { city: "Singapore", country: { name: "Singapore", code: "SG" } },
	"128.116.51.0": { city: "Sydney", country: { name: "Australia", code: "AU" }, region: { name: "New South Wales", code: "NSW" } },
	"128.116.53.0": { city: "Ashburn", country: { name: "United States", code: "US" }, region: { name: "Virginia", code: "VA" } },
	"128.116.54.0": { city: "Singapore", country: { name: "Singapore", code: "SG" } },
	"128.116.55.0": { city: "Tokyo", country: { name: "Japan", code: "JP" }, region: { name: "Tokyo", code: "13" } },
	"128.116.56.0": { city: "Ashburn", country: { name: "United States", code: "US" }, region: { name: "Virginia", code: "VA" } },
	"128.116.57.0": { city: "San Jose", country: { name: "United States", code: "US" }, region: { name: "California", code: "CA" } },
	"128.116.63.0": { city: "Los Angeles", country: { name: "United States", code: "US" }, region: { name: "California", code: "CA" } },
	"128.116.67.0": { city: "San Jose", country: { name: "United States", code: "US" }, region: { name: "California", code: "CA" } },
	"128.116.74.0": { city: "Ashburn", country: { name: "United States", code: "US" }, region: { name: "Virginia", code: "VA" } },
	"128.116.80.0": { city: "Ashburn", country: { name: "United States", code: "US" }, region: { name: "Virginia", code: "VA" } },
	"128.116.81.0": { city: "San Jose", country: { name: "United States", code: "US" }, region: { name: "California", code: "CA" } },
	"128.116.84.0": { city: "Chicago", country: { name: "United States", code: "US" }, region: { name: "Illinois", code: "IL" } },
	"128.116.86.0": { city: "São Paulo", country: { name: "Brazil", code: "BR" }, region: { name: "São Paulo", code: "SP" } },
	"128.116.87.0": { city: "Ashburn", country: { name: "United States", code: "US" }, region: { name: "Virginia", code: "VA" } },
	"128.116.88.0": { city: "Chicago", country: { name: "United States", code: "US" }, region: { name: "Illinois", code: "IL" } },
	"128.116.95.0": { city: "Dallas", country: { name: "United States", code: "US" }, region: { name: "Texas", code: "TX" } },
	"128.116.97.0": { city: "Singapore", country: { name: "Singapore", code: "SG" } },
	"128.116.99.0": { city: "Atlanta", country: { name: "United States", code: "US" }, region: { name: "Georgia", code: "GA" } },
	"128.116.102.0": { city: "Ashburn", country: { name: "United States", code: "US" }, region: { name: "Virginia", code: "VA" } },
	"128.116.104.0": { city: "Mumbai", country: { name: "India", code: "IN" }, region: { name: "Maharashtra", code: "MH" } },
	"128.116.105.0": { city: "San Jose", country: { name: "United States", code: "US" }, region: { name: "California", code: "CA" } },
	"128.116.115.0": { city: "Seattle", country: { name: "United States", code: "US" }, region: { name: "Washington", code: "WA" } },
	"128.116.116.0": { city: "Los Angeles", country: { name: "United States", code: "US" }, region: { name: "California", code: "CA" } },
	"128.116.117.0": { city: "San Jose", country: { name: "United States", code: "US" }, region: { name: "California", code: "CA" } },
	"128.116.119.0": { city: "London", country: { name: "United Kingdom", code: "UK" }, region: { name: "England", code: "ENG" } },
	"128.116.120.0": { city: "Tokyo", country: { name: "Japan", code: "JP" }, region: { name: "Tokyo", code: "13" } },
	"128.116.123.0": { city: "Frankfurt", country: { name: "Germany", code: "DE" }, region: { name: "Hesse", code: "HE" } },
	"128.116.127.0": { city: "Miami", country: { name: "United States", code: "US" }, region: { name: "Florida", code: "FL" } },
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
	const location = address.startsWith("128.116") ? serverRegionsByIp[address.replace(/^(128\.116\.\d+)\.\d+$/, "$1.0")] : serverRegionsByIp.Non118
				
	if(!location) {
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

"use strict"

const KeepAlive = {
	shouldRestart: false
}

{
	// Use alarms to not allow extension to fall asleep for more than 1 minute
	chrome.runtime.onInstalled.addListener(() => {
		chrome.alarms.clearAll(() => {
			chrome.alarms.create("KeepAlive", { periodInMinutes: 1 })
		})
		chrome.alarms.onAlarm.addListener(() => {})
	})

	// Calling sendMessage stops suspending
	const startupTime = Date.now()
	const keepAliveInterval = setInterval(() => {
		if(Date.now() - startupTime > 60 * 60e3) {
			KeepAlive.shouldRestart = true
			clearInterval(keepAliveInterval)
			return
		}

		chrome.runtime.sendMessage("keepalive", () => chrome.runtime.lastError)
	}, 10e3)
}
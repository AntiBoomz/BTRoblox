"use strict"

function copyToClipboard(text) {
	function onCopy(ev) {
		document.removeEventListener("copy", onCopy)

		ev.clipboardData.setData("text/plain", text)
		ev.preventDefault()
	}

	document.addEventListener("copy", onCopy)
	document.execCommand("Copy", false, null)
}

var itemUrlPatterns = [
	"*://www.roblox.com/*-item?id=*",
	"*://www.roblox.com/catalog/*"
	"*://www.roblox.com/library/*"
]

chrome.contextMenus.create({
	title: "Copy asset id",
	contexts: ["link"],
	targetUrlPatterns: itemUrlPatterns,
	onclick: (info, tab) => copyToClipboard(info.linkUrl.replace(/^.*(?:[&?]id=|\/(?:catalog|library)\/)(\d+).*$/, "$1"))
})

chrome.contextMenus.create({
	title: "Copy asset id",
	contexts: ["page"],
	documentUrlPatterns: itemUrlPatterns,
	onclick: (info, tab) => copyToClipboard(info.pageUrl.replace(/^.*(?:[&?]id=|\/(?:catalog|library)\/)(\d+).*$/, "$1"))
})
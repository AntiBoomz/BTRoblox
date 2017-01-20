"use strict"

function request(options) {
	if(typeof(this) !== "undefined")
		throw new Error("request is not a constructor");

	if(arguments.length === 4 && typeof(onfailure) !== "function")
		responseType = onfailure, onfailure = null; 

	if(arguments.length === 3 && typeof(onsuccess) !== "function")
		responseType = onsuccess, onsuccess = null;

	var xhr = new XMLHttpRequest()

	xhr.open(options.method, options.url, true)
	xhr.onload = () => options.success && options.success(xhr.response, xhr.status, xhr.statusText)
	xhr.onerror = () => options.error && options.error()
	xhr.responseType = options.responseType || "text"

	xhr.send(options.data)
}

Object.assign(request, {
	get: function(url, success, failure, responseType) {
		this({
			method: "GET",
			url: url,
			success: success,
			failure: failure,
			responseType: responseType
		})
	},
	getBlob: function(url, success, failure) {
		this.get(url, success, failure, "blob")
	},
	getJson: function(url, success, failure) {
		this.get(url, success, failure, "json")
	},
	post: function(url, data, success, failure, responseType) {
		this({
			method: "POST",
			url: url,
			data: data,
			success: success,
			failure: failure,
			responseType: responseType
		})
	}
})
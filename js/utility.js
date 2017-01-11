String.prototype.format = function(dict) {
	if(dict instanceof Object && !(dict instanceof Array)) {
		return this.replace(/{([\w.]+)}/g, function(match, index) {
			return index in dict ? dict[index] : match
		})
	}

	var args = arguments

	return this.replace(/{(\d+)}/g, function(match, number) {
		return typeof args[number] != "undefined" ? args[number] : match
	})
};

$.fn.elemFormat = function() {
	var args = arguments

	this.find("*").addBack().contents().addBack().each(function(i,obj) {
		if(obj.nodeType == 3) { // Text nodes
			obj.nodeValue = obj.nodeValue.format.apply(obj.nodeValue,args)
		} else if(obj.nodeType == 1) { // Elements
			$.each(obj.attributes,function(i,attr) {
				attr.value = attr.value.format.apply(attr.value,args)
			});
		}
	})

	return this
}

Date.prototype.relativeFormat = function(format) {
	var myTime = Date.now()
	var timeDiff = (myTime-this)/1000

	var s = Math.floor(timeDiff)
	var m = Math.floor(timeDiff/60)
	var h = Math.floor(timeDiff/3600)
	var d = Math.floor(timeDiff/3600/24)
	var w = Math.floor(timeDiff/3600/24/7)
	var M = Math.floor(timeDiff/3600/24/31)
	var y = Math.floor(timeDiff/3600/24/365)

	var get = function(a,b,c) {
		return a+(c==1?b.substring(0,1):" "+b+(a!=1?"s":""))
	}

	var replaceFunc = function(str) {
		var c = str.charAt(0),
			z = str.match("zz?([012])"),
			l = z?str.length-1:str.length,
			z = z&&parseInt(z[1])||0,
			res = c == 's' 
				? get(s,"second",l)
				: c == 'm'
				? get(m,"minute",l)
				: c == "h"
				? get(h,"hour",l)
				: c == "w"
				? get(w,"week",l)
				: c == "M"
				? get(M,"month",l)
				: c == "y"
				? get(y,"year",l)
				: c == "z"
				? 	( y > 0
					? z==0&&get(y,"year",l)||z==1&&get(M%12,"month",l)||z==2&&get(d%31,"day",l)
					: M > 0
					? z==0&&get(M%12,"month",l)||z==1&&get(d%31,"day",l)||z==2&&get(d%24,"hour",l)
					: d > 0
					? z==0&&get(d%31,"day",l)||z==1&&get(h%24,"hour",l)||z==2&&get(m%60,"minute",l)
					: h > 0
					? z==0&&get(h%24,"hour",l)||z==1&&get(m%60,"minute",l)||z==2&&get(s%60,"second",l)
					: m > 0
					? z==0&&get(m%60,"minute",l)||z==1&&get(s%60,"second",l)||''
					: get(s%60,"second",l) 
					)
				: "'scuse me?"

		return res
	}

	return format.replace(/([smhdwMy]{1,2}|z{1,2}[012]?)((?=(?:[^'\\]*(?:\\.|'(?:[^'\\]*\\.)*[^'\\]*'))*[^']*$))/g,replaceFunc).replace(/'([^']*)'/g,"$1")
};

/*
	Date.format cheatsheet

	Mask ||	Desc
	a 		Lowercase time marker, am or pm
	A 		Uppercase time marker, AM or PM
	Z 		Timezone of date, +0300
	S 		Milliseconds
	s 		Seconds, no leading zero
	ss 		Seconds, leading zero
	m 		Minutes, no leading zero
	mm 		Minutes, leading zero
	h 		Hours, no leading zero, 12 hour clock
	hh 		Hours, leading zero, 12 hour clock
	H 		Hours, no leading zero, 24 hour clock
	HH 		Hours, leading zero, 24 hour clock
	D 		Date as digits, no leading zero
	DD 		Date as digits, leading zero
	DDD 	Day of the week, three letters
	DDDD 	Day of the week, full name
	M 		Month as digits, no leading zero
	MM 		Month as digits, leading zero
	MMM 	Month, three letters
	MMMM 	Month, full name
	YY 		Year, latter two numbers
	YYYY 	Full year
	'asd'	Literal string, quoters are removed
*/

var D = "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday".split(","),
	M = "January,February,March,April,May,June,July,August,September,October,November,December".split(",");

Date.prototype.format = function(format) {
	var me = this;
	return format.replace(/a|A|Z|S(SS)?|ss?|mm?|HH?|hh?|D{1,4}|M{1,4}|YY(YY)?|'([^']|'')*'/g, function(str) {
		var c1 = str.charAt(0),
				ret = str.charAt(0) == "'"
				? (c1=0) || str.slice(1, -1).replace(/''/g, "'")
				: str == "a"
					? (me.getHours() < 12 ? "am" : "pm")
					: str == "A"
						? (me.getHours() < 12 ? "AM" : "PM")
						: str == "Z"
							? (("+" + -me.getTimezoneOffset() / 60).replace(/^\D?(\D)/, "$1").replace(/^(.)(.)$/, "$10$2") + "00")
							: c1 == "S"
								? me.getMilliseconds()
								: c1 == "s"
									? me.getSeconds()
									: c1 == "H"
										? me.getHours()
										: c1 == "h"
											? (me.getHours() % 12) || 12
											: (c1 == "D" && str.length > 2)
												? D[me.getDay()].slice(0, str.length > 3 ? 9 : 3)
												: c1 == "D"
													? me.getDate()
													: (c1 == "M" && str.length > 2)
														? M[me.getMonth()].slice(0, str.length > 3 ? 9 : 3)
														: c1 == "m"
															? me.getMinutes()
															: c1 == "M"
																? me.getMonth() + 1
																: ("" + me.getFullYear()).slice(-str.length);
		return c1 && str.length < 4 && ("" + ret).length < str.length
			? ("00" + ret).slice(-str.length)
			: ret;
	});
};


var request = {
	_poolCount: 0,
	_pool: [],
	_queue: [],
	_getXhr: function(callback) {
		var xhr = null

		if(this._pool.length == 0) {
			if(this._poolCount >= 3) {
				this._queue.push(callback)
				return;
			}

			this._poolCount++
			xhr = new XMLHttpRequest()
		} else {
			xhr = this._pool.pop()
		}

		var released = false
		callback(xhr, () => {
			if(released)
				return;

			released = true
			xhr.abort()
			xhr.onload = null
			xhr.onerror = null

			this._pool.push(xhr)
			if(this._queue.length > 0) {
				this._getXhr(this._queue.splice(0,1)[0])
			}
		})
	},
	getJson: function(url, success, failure) {
		return this.get(url, success, failure, "json")
	},
	get: function(url, success, failure, responseType) {
		if(typeof failure === "string")
			responseType = failure, failure = null;
		else if(typeof success === "string")
			responseType = success, success = null;

		this._getXhr((xhr, release) => {
			xhr.onload = () => {
				var response = xhr.response
				release()
				if(success) {
					success(response)
				}
				response = null
			}
			xhr.onerror = () => {
				release()
				if(failure) {
					failure()
				}
			}

			xhr.responseType = responseType || "text"

			xhr.open("GET", url, true)
			xhr.send()
		})
	}
}


if(typeof(chrome) != "undefined" && chrome.notifications) {
	var Notifs = {
		notifData: {},
		new: function(data, callback) {
			if(typeof(data) != "object" || data.constructor != Object)
				data = {};

			var obj = {
				close: function() {
					chrome.notifications.clear(this.notifId)
				}
			}

			chrome.notifications.create(null,{
				type: data.type || "basic",
				title: data.title || "Default Title",
				iconUrl: data.icon || "",
				message: data.body || "Default Body",
				contextMessage: data.altBody,
				items: data.items,
				imageUrl: data.imageUrl,
				progress: data.progress,
				priority: data.priority || 2,
				isClickable: data.link != null,
			}, (id) => {
				this.notifData[id] = data
				obj.notifId = id

				if(data.sound) {
					var notifSound = new Audio(data.sound)
					notifSound.play()
				}
				
				if(callback)
					callback(obj)
			})

			return obj
		}
	}

	chrome.notifications.onClicked.addListener(function(notifId) {
		var notifData = Notifs.notifData[notifId];
		if(notifData) {
			if(notifData.link) {
				chrome.tabs.create({"url":notifData.link})
			}
			//chrome.notifications.clear(notifId)
		}
	});

	chrome.notifications.onClosed.addListener(function(notifId) {
		Notifs.notifData[notifId] = null
	});

}

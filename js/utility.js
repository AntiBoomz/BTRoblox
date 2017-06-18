"use strict"

const $ = (() => {
	var $ = document.querySelector.bind(document)
	$.all = document.querySelectorAll.bind(document)

	function HandleEvent(e) {
		var events = this.$events
		if(!events) return;

		var listeners = events[e.type]
		if(!listeners) return;

		var selectiveListeners = []
		var selfListeners = []

		listeners.forEach(listener => {
			if(!listener.selector) {
				selfListeners.push(listener)
			} else {
				selectiveListeners.push(listener)
			}
		})

		var shouldPropagate = true
		var shouldImmediatePropagate = true

		function stopPropagation() {
			shouldPropagate = false
			return e.__proto__.stopPropagation.apply(e, arguments)
		}

		function stopImmediatePropagation() {
			shouldImmediatePropagate = false
			shouldPropagate = false
			return e.__proto__.stopImmediatePropagation.apply(e, arguments)
		}

		e.stopPropagation = stopPropagation
		e.stopImmediatePropagation = stopImmediatePropagation

		if(selectiveListeners.length) {
			for(let i=0, len=e.path.indexOf(this); i < len; i++) {
				var node = e.path[i]

				for(let i=0, len=selectiveListeners.length; i < len; i++) {
					var listener = selectiveListeners[i]
					var query = this.querySelectorAll(listener.selector)
					if(!query || Array.prototype.indexOf.call(query, node) === -1) continue;

					Object.defineProperty(e, "currentTarget", { value: node, enumerable: true, configurable: true })
					if(listener.callback.call(node, e) === false) {
						e.preventDefault()
					}
					delete e.currentTarget

					if(!shouldImmediatePropagate) break;
				}

				if(!shouldPropagate) break;
			}
		}

		if(selfListeners.length && shouldPropagate && shouldImmediatePropagate) {
			for(var i=0, len=selfListeners.length; i < len; i++) {
				var listener = selfListeners[i]

				if(listener.callback.call(this, e) === false) {
					e.preventDefault()
				}

				if(!shouldImmediatePropagate) break;
			}
		}

		delete e.stopPropagation
		delete e.stopImmediatePropagation
	}

	Object.defineProperties(EventTarget.prototype, Object.getOwnPropertyDescriptors({
		$on() {
			var eventNames = arguments[0]
			var callback = arguments[1]
			var once = arguments[2]
			var selector = null

			if(typeof(callback) === "string") {
				selector = arguments[1]
				callback = arguments[2]
				once = arguments[3]
			}

			eventNames.split(" ").forEach(eventType => {
				if(!eventType.length)
					return;

				if(!this.$events)
					Object.defineProperty(this, "$events", { value: {} });

				var listeners = this.$events[eventType]

				if(!listeners)
					listeners = this.$events[eventType] = [];

				var listener = {
					selector: selector,
					callback: callback,
					once: once,
				}

				listeners.push(listener)

				if(!this.$isListening)
					Object.defineProperty(this, "$isListening", { value: {} });

				if(!this.$isListening[eventType]) {
					this.$isListening[eventType] = true
					this.addEventListener(eventType, HandleEvent, true)
				}
			})

			return this
		},
		$once() {
			var onceIndex = typeof(arguments[1]) === "string" ? 3 : 2
			arguments[onceIndex] = true
			return this.$on.apply(this, arguments)
		},
		$off(eventNames, selector, callback) {
			if(!this.$events) return this;

			if(typeof(selector) !== "string")
				callback = selector, selector = null;

			eventNames.split(" ").forEach(eventType => {
				if(!eventType.length)
					return;

				var listeners = this.$events[eventType]
				if(!listeners) return;

				if(selector == null && callback == null)
					delete this.$events[eventType];
				else {
					for(var i=0; i < listeners.length; i++) {
						var listener = listeners[i]
						if((selector && listener.selector === selector) || (callback && listener.callback === callback)) {
							listeners.splice(i--, 1)
						}
					}
				}
			})

			return this
		},
		$trigger(type, init) { return this.dispatchEvent(new Event(type, init)), this },
	}))

	Object.defineProperties(Element.prototype, Object.getOwnPropertyDescriptors({
		$class(name, value) { return value === undefined ? this.classList.contains(name) : (this.classList.toggle(name, value), this) }
	}))

	Object.defineProperties(HTMLElement.prototype, Object.getOwnPropertyDescriptors({
		$style(name, value) { return value === undefined ? getComputedStyle(this)[name] : (this.style[name] = value, this) },
	}))

	function qs(fn) {
		return function(selector) {
			selector = selector.replace(/(^|,)\s*(?=>)/g, "$&:scope")
			return fn.call(this, selector)
		}
	}

	Element.prototype.$find = qs(Element.prototype.querySelector)
	Element.prototype.$findAll = qs(Element.prototype.querySelectorAll)

	Document.prototype.$find = qs(Document.prototype.querySelector)
	Document.prototype.$findAll = qs(Document.prototype.querySelectorAll)

	return $
})();

function forEach(target, fn) {
	var arr = Object.entries(target)

	if(arr.length) {
		arr.forEach(([key, value]) => fn(value, key))
	} else {
		Array.from(target).forEach(fn)
	}
}

const request = function(options) {
	if(this instanceof request)
		throw new Error("request is not a constructor");

	var xhr = new XMLHttpRequest()

	xhr.responseType = options.dataType || "text"
	xhr.onload = () => options.success && options.success(xhr.response, xhr)
	xhr.onerror = err => options.failure && options.failure(xhr, err)

	var method = options.method || "GET"
	var url = options.url
	var data = null
	var headers = {}

	if(options.params)
		url += (url.indexOf("?") === -1 ? "?" : "&") + request.params(options.params);

	if(method === "GET") {
		if(options.data) {
			url += (url.indexOf("?") === -1 ? "?" : "&") + request.params(options.data)
		}
	} else {
		if(options.data) {
			if(options.data instanceof Object) {
				headers["content-type"] = "application/x-www-form-urlencoded"
				data = request.params(options.data)
			} else {
				data = options.data.toString()
			}
		} else if(options.json) {
			headers["content-type"] = "application/json"
			data = JSON.stringify(options.json)
		}
	}

	if(options.contentType)
		headers["content-type"] = options.contentType;

	if(options.headers) 
		for(var name in options.headers) headers[name.toLowerCase()] = options.headers[name];


	xhr.open(method, url, true)

	for(var name in headers) {
		xhr.setRequestHeader(name, headers[name])
	}

	xhr.send(data)
}

Object.assign(request, {
	params(params) {
		var p = []
		for(var name in params) {
			var value = params[name]
			p.push(encodeURIComponent(name) + "=" + encodeURIComponent(value == null ? "" : value))
		}

		return p.join("&").replace(/%20/g, "+")
	},

	get(url, success, failure) { return this({ method: "GET", url, success, failure }) },
	getBlob(url, success, failure) { return this({ method: "GET", url, success, failure, dataType: "blob" }) },
	getJson(url, success, failure) { return this({ method: "GET", url, success, failure, dataType: "json" }) },
	post(url, data, success, failure) { return this({ method: "POST", url, data, success, failure }) }
})

const htmlstring = function(pieces) {
	const escapeMap = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;",
		"/": "&#x2F;"
	}

	var escapePiece = s => s.replace(/[^\S ]+/g, "").replace(/ {2,}/g, " ");
	var escapeArg = s => s.toString().replace(/[&<>"'\/]/g, x => escapeMap[x])

	var result = escapePiece(pieces[0])

	for(var i=1, len=arguments.length; i<len; i++) {
		var escaped = arguments[i]
		result += escapeArg(arguments[i]) + escapePiece(pieces[i])
	}

	return result
}

const html = function() {
	var result = htmlstring.apply(this, arguments)
	var template = document.createElement("template")
	template.innerHTML = result

	return template.content.firstElementChild || template.content.firstChild
}


Date.prototype.relativeFormat = function(format, relativeTo) {
	if(relativeTo == null)
		relativeTo = Date.now();
	else if(relativeTo instanceof Date)
		relativeTo = relativeTo.getTime();

	var timeDiff = (relativeTo - this) / 1000

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

	return format.replace(/([smhdwMy]{1,2}|z{1,2}[012]?)((?=(?:[^'\\]*(?:\\.|'(?:[^'\\]*\\.)*[^'\\]*'))*[^']*$))/g, replaceFunc).replace(/'([^']*)'/g, "$1")
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
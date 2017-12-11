"use strict"

const $ = (() => {
	const $ = document.querySelector.bind(document)
	$.all = document.querySelectorAll.bind(document)

	Object.defineProperties(EventTarget.prototype, Object.getOwnPropertyDescriptors({
		$on(eventNames, selector, callback, once) {
			if(typeof selector === "function") [selector, callback, once] = [null, selector, callback];

			eventNames.split(" ").forEach(eventType => {
				if(!eventType.length) return;
				if(!this.$events) Object.defineProperty(this, "$events", { value: {} });

				let listeners = this.$events[eventType]
				if(!listeners) listeners = this.$events[eventType] = [];

				const listener = {
					selector,
					callback,
					once,
					handler(...args) {
						const event = args[0]
						if(!selector) return callback.apply(this, args);

						const query = this.$findAll(selector)
						const final = event.path.indexOf(this)

						const sP = event.stopPropagation
						let hasStoppedPropagation = false
						event.stopPropagation = function(...args) {
							hasStoppedPropagation = true
							return sP.apply(this, args)
						}

						for(let i = 0; i < final; i++) {
							const node = event.path[i]
							const index = Array.prototype.indexOf.call(query, node)
							if(index === -1) continue;

							Object.defineProperty(event, "currentTarget", { value: node, configurable: true })
							callback.apply(this, args)
							delete event.currentTarget

							if(hasStoppedPropagation) break;
						}
					}
				}

				listeners.push(listener)
				this.addEventListener(eventType, listener.handler, true)
			})

			return this
		},
		$once(...args) {
			return this.$on(...args, true)
		},
		$off(eventNames, selector, callback) {
			if(!this.$events) return this;
			if(typeof selector !== "string") [selector, callback] = [null, selector];

			eventNames.split(" ").forEach(eventType => {
				if(!eventType.length) return;
				if(!this.$events) return;

				const listeners = this.$events[eventType]
				if(!listeners) return;

				const removeAll = selector == null && callback == null
				for(let i = 0; i < listeners.length; i++) {
					const listener = listeners[i]
					if(removeAll || (selector && listener.selector === selector) || (callback && listener.callback === callback)) {
						listeners.splice(i--, 1)
						this.removeEventListener(eventType, listener.handler)
					}
				}
			})

			return this
		},
		$trigger(type, init) { return this.dispatchEvent(new Event(type, init)), this },
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

	DocumentFragment.prototype.$find = qs(DocumentFragment.prototype.querySelector)
	DocumentFragment.prototype.$findAll = qs(DocumentFragment.prototype.querySelectorAll)

	HTMLCollection.prototype.$forEach = Array.prototype.forEach

	return $
})();

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


function CreateObserver(target, params) {
	const options = Object.assign({ childList: true, subtree: true }, params || {})
	const isPermanent = !!options.permanent
	let observeList = []
	let connected = false


	const arrayFind = Array.prototype.find
	const arrayIndexOf = Array.prototype.indexOf

	
	const observer = new MutationObserver(mutations => {
		for(let index = 0; index < observeList.length; index++) {
			const item = observeList[index]

			if(!item.persistent) {
				let elem
				if(item.filter) {
					elem = arrayFind.call(target.querySelectorAll(item.selector), x => item.filter(x))
				} else {
					elem = target.querySelector(item.selector)
				}

				if(elem) {
					observeList.splice(index--, 1)
					item.whole.result[item.index] = elem

					if(--item.whole.resultsLeft === 0) {
						try { item.whole.callback.apply(null, item.whole.result) }
						catch(ex) { console.error("[MutationObserver]", ex) }
					}
				}
			} else {
				const elems = target.querySelectorAll(item.selector)

				mutations.forEach(mut => {
					mut.addedNodes.forEach(node => {
						if(arrayIndexOf.call(elems, node) !== -1) {
							if(item.filter && !item.filter(node)) return;

							try { item.callback(node) }
							catch(ex) { console.error("[MutationObserver]", ex) }
						}
					})
				})
			}
		}

		if(connected && observeList.length === 0) {
			connected = false
			observer.disconnect()
		}
	})

	return {
		one(selectors, filter, callback) {
			if(!callback) {
				callback = filter
				filter = null
			}

			if(!Array.isArray(selectors)) {
				selectors = [selectors]
			}

			const whole = {
				callback,
				result: [],
				resultsLeft: selectors.length
			}

			selectors.forEach((selector, index) => {
				const item = {
					whole, filter, selector, index,
					persistent: false
				}

				let elem
				if(item.filter) {
					elem = arrayFind.call(target.querySelectorAll(item.selector), x => item.filter(x))
				} else {
					elem = target.querySelector(item.selector)
				}

				if(elem) {
					item.whole.result[item.index] = elem

					if(--item.whole.resultsLeft === 0) {
						try { item.whole.callback.apply(null, item.whole.result) }
						catch(ex) { console.error("[MutationObserver]", ex) }
					}
				} else {
					if(!isPermanent && document.readyState !== "loading") {
						console.warn("observer.one called when not loading and not permanent, not listening")
						return
					}
					observeList.push(item)
				}
			})
			
			if(!connected && observeList.length > 0) {
				connected = true
				observer.observe(target, options)
			}

			return this
		},
		all(selector, filter, callback) {
			if(!callback) {
				callback = filter
				filter = null
			}
			
			const item = {
				selector, filter, callback,
				persistent: true
			}

			const elems = target.querySelectorAll(item.selector)
			elems.forEach(elem => {
				if(item.filter && !item.filter(elem)) return;
				try { item.callback(elem) }
				catch(ex) { console.error("[MutationObserver]", ex) }
			})

			if(!isPermanent && document.readyState !== "loading") {
				console.warn("observer.all called when not loading and not permanent, not listening")
				return
			} else {
				observeList.push(item)
				if(!connected) {
					connected = true
					observer.observe(target, options)
				}
			}

			return this
		}
	}
}
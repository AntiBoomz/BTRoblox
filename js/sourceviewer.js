
"use strict"

const NumberRegex = /^-?(?:\d*\.?\d+|0x[0-9a-fA-F]+)(?:[eE]-?\d+)?$/
const ParseRegex = new RegExp(
	[
		/-?(?:\d*\.?\d+|0x[0-9a-fA-F]+)(?:[eE]-?\d+)?/.source, // number
		/[+\-*/^%~=><]=/.source, // multi-char ops
		/\[=*\[/.source, // groups
		/--(?:\[=*\[)?/.source, // comments
		/\w+/.source, // words
		/[^\n\S]+/.source, // whitespace
		/[^]/.source // any character
	].join("|"),
	"yg"
)

const Keywords = new Set([
	"function", "true", "false", "local", "end", "if", "elseif", "else", "then", "repeat", "until", "while", "do",
	"for", "not", "and", "or", "break", "in", "nil", "return", "continue"
])

const Globals = new Set([
	"Axes", "BrickColor", "CellId", "CFrame", "Color3", "ColorSequence", "ColorSequenceKeypoint", "DateTime",
	"DockWidgetPluginGuiInfo", "Faces", "Instance", "NumberRange", "NumberSequence", "NumberSequenceKeypoint",
	"PathWaypoint", "PhysicalProperties", "PluginDrag", "Random", "Ray", "RaycastParams", "Rect", "Region3",
	"Region3int16", "TweenInfo", "UDim", "UDim2", "Vector2", "Vector2int16", "Vector3", "Vector3int16",

	"assert", "collectgarbage", "error", "gcinfo", "getfenv", "getmetatable", "ipairs", "loadstring", "newproxy",
	"next", "pairs", "pcall", "print", "rawequal", "rawget", "rawset", "select", "setfenv", "setmetatable",
	"tonumber", "tostring", "type", "unpack", "xpcall", "_G", "_VERSION",

	"delay", "elapsedTime", "require", "settings", "spawn", "tick", "time", "typeof", "UserSettings", "wait", "warn",
	"ypcall",

	"Enum", "game", "plugin", "shared", "script", "workspace"
])

const Tables = {
	bit32: new Set(["band", "extract", "bor", "bnot", "arshift", "rshift", "rrotate", "replace", "lshift", "lrotate", "btest", "bxor"]),
	coroutine: new Set(["resume", "yield", "running", "status", "wrap", "create", "isyieldable"]),
	debug: new Set(["traceback", "profileend", "profilebegin"]),
	math: new Set([
		"abs", "acos", "asin", "atan", "atan2", "ceil", "clamp", "cos", "cosh", "deg", "exp", "floor", "fmod",
		"frexp", "huge", "ldexp", "log", "log10", "max", "min", "modf", "noise", "pi", "pow", "rad", "random",
		"randomseed", "sign", "sin", "sinh", "sqrt", "tan", "tanh"
	]),
	os: new Set(["difftime", "time", "date", "clock"]),
	string: new Set(["sub", "split", "upper", "len", "find", "match", "char", "rep", "gmatch", "reverse", "byte", "format", "gsub", "lower"]),
	table: new Set(["pack", "move", "insert", "getn", "foreachi", "foreach", "concat", "unpack", "find", "create", "sort", "remove"]),
	utf8: new Set(["offset", "codepoint", "nfdnormalize", "char", "codes", "len", "graphemes", "nfcnormalize", "charpattern"])
}

const Operators = new Set([
	"+", "-", "*", "/", "%", ">", "<", "=",
	"+=", "-=", "*=", "/=", "%=", ">=", "<=", "==", "~=",
	":", "{", "}", "(", ")", "[", "]", "#"
])

const ScopeIn = new Set(["then", "do", "repeat", "function", "(", "{", "["])
const ScopeOut = new Set(["end", "elseif", "until", ")", "}", "]"])
const ScopeInOut = new Set(["else"])

function parseSource(source) {
	const lines = []
	let tableSelector = null
	let tableSelectorState = false
	let lineN = 0
	let depth = 0
	let current
	let text

	const content = html`
	<div class=content>
	</div>`

	const createLine = () => {
		const elem = html`
		<div class=line-container>
			<div class=linenumber>${++lineN}</div>
			<div class=line><span class=scope></span><span class=linetext></span></div>
		</div>`

		content.append(elem)

		const line = {
			elem,
			list: elem.$find(".linetext"),
			scope: elem.$find(".scope"),
			depth
		}

		lines.push(line)
		return line
	}

	// Add an empty line to the beginning
	content.append(html`<div class=line-container><div class=linenumber></div><div class=line style=height:5px;><span class=scope></span><span class=linetext></span></div></div>`)

	const appendUntil = final => {
		const len = final - ParseRegex.lastIndex

		if(len > 0) {
			text += source.slice(ParseRegex.lastIndex, ParseRegex.lastIndex + len)
			ParseRegex.lastIndex += len
		}
	}

	const appendGroup = groupDepth => {
		const searchString = `]${"=".repeat(groupDepth)}]`
		const groupEndIndex = source.indexOf(searchString)

		if(groupEndIndex === -1) {
			appendUntil(source.length)
		} else {
			appendUntil(groupEndIndex + searchString.length)
		}
	}

	const genericAppend = stringChar => {
		let newLine = source.indexOf("\n", ParseRegex.lastIndex)
		if(newLine === -1) { newLine = source.length }
		
		if(stringChar) {
			let nextIndex = ParseRegex.lastIndex

			while(true) {
				nextIndex = source.indexOf(stringChar, nextIndex)

				if(nextIndex === -1 || nextIndex > newLine) {
					appendUntil(newLine)
					return
				}

				let pointer = nextIndex
				while(source[--pointer] === "\\") {
					// do nothing
				}

				if((nextIndex - pointer) % 2 === 1) {
					appendUntil(nextIndex + 1)
					return
				}
			}
		} else {
			appendUntil(newLine)
		}
	}

	current = createLine()
	ParseRegex.lastIndex = 0
	
	while(true) {
		const match = ParseRegex.exec(source)
		if(!match) {
			break
		}

		text = match[0]
		if(text === "\n") {
			current = createLine()
			continue
		}

		let textType = "text"

		if(text[0] === "-" && text[1] === "-") {
			textType = "comment"

			if(text.length > 2) {
				appendGroup(text.length - 4)
			} else {
				genericAppend()
			}
		} else if(text.length > 1 && text[0] === "[") {
			textType = "string"
			appendGroup(text.length - 2)
		} else if(text === "\"" || text === "'") {
			textType = "string"
			genericAppend(text)
		} else if(Keywords.has(text)) {
			textType = "keyword"
		} else if(Globals.has(text)) {
			textType = "global"
		} else if(Operators.has(text)) {
			textType = "operator"
		} else if(NumberRegex.test(text)) {
			textType = "number"
		}

		if(ScopeIn.has(text)) {
			depth++
		} else if(ScopeOut.has(text)) {
			if(depth === current.depth) {
				current.depth--
			}

			depth--
		} else if(ScopeInOut.has(text)) {
			if(depth === current.depth) {
				current.depth--
			}
		}
		
		if(text in Tables) {
			textType = "global"
			
			tableSelector = Tables[text]
			tableSelectorState = false
		} else if(tableSelector) {
			if(tableSelectorState) {
				if(tableSelector.has(text)) {
					textType = "global"
				}

				tableSelector = null
			} else {
				if(text === ".") {
					textType = "global"
					tableSelectorState = true
				} else {
					tableSelector = null
				}
			}
		}

		const textLines = text.split("\n")
		const multiline = (textType === "comment" || textType === "string") && textLines.length > 1

		textLines.forEach((line, index) => {
			if(index > 0) {
				current = createLine()
			}

			if(multiline) {
				if(index === 0) {
					depth++
				} else if(index === textLines.length - 1) {
					current.depth--
					depth--
				}
			}

			const span = html`<span></span>`
			span.className = textType
			span.textContent = line

			current.list.append(span)
		})
	}

	let lastLine
	lines.forEach(line => {
		line.elem.dataset.depth = line.depth

		if(lastLine && line.depth > lastLine.depth) {
			lastLine.elem.classList.add("open")
		}

		lastLine = line
	})

	// Add an empty line to the beginning
	content.append(html`<div class=line-container><div class=linenumber></div><div class=line style=height:5px;><span class=scope></span><span class=linetext></span></div></div>`)

	return content
}

const Init = source => {
	const content = parseSource(source)
	document.body.append(content)

	$.all(".line-container.open,.line-container.closed").forEach(elem => {
		elem.$find(".scope").$on("click", () => {
			if(elem.classList.contains("open")) {
				elem.classList.remove("open")
				elem.classList.add("closed")
	
				const myDepth = +elem.dataset.depth
				let target = elem
	
				while(target.nextElementSibling) {
					target = target.nextElementSibling
	
					if(!target.dataset.depth || +target.dataset.depth <= myDepth) {
						break
					}
	
					target.style.display = "none"
				}
			} else {
				elem.classList.remove("closed")
				elem.classList.add("open")
	
				const myDepth = +elem.dataset.depth
				let subDepth = null
				let target = elem
	
				while(target.nextElementSibling) {
					target = target.nextElementSibling
	
					if(!target.dataset.depth || +target.dataset.depth <= myDepth) {
						break
					}
	
					if(subDepth !== null && +target.dataset.depth > subDepth) {
						// Keep hidden
					} else {
						subDepth = null
	
						target.style.display = ""
	
						if(target.classList.contains("closed")) {
							subDepth = +target.dataset.depth
						}
					}
				}
			}
		})
	})
}

$.ready(() => {
	const id = new URLSearchParams(window.location.search).get("id")

	if(id) {
		const key = `sourceViewerData_${id}`
		const source = localStorage.getItem(key)
		localStorage.removeItem(key)
		
		if(!source) {
			Init("-- Failed to load source viewer")
			return
		}

		window.location.replace(window.location.pathname)
		sessionStorage.setItem("source", source)

		Init(source)
	} else {
		const savedSource = sessionStorage.getItem("source")
		if(typeof savedSource !== "string") {
			Init("-- Failed to load source viewer")
			return
		}
	
		Init(savedSource)
	}
})
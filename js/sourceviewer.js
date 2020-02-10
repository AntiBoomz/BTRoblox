
"use strict"

const ParseRegex = /\w+|[^\n\S]+|(?:--(?:\[\[([^\]]*|(?!\]\])\])*\]\]|\[=\[([^\]]*|(?!\]=\])\])*\]=\]|\[==\[([^\]]*|(?!\]==\])\])*\]==\]|[^\n]*))|(?:\[\[([^\]]*|(?!\]\])\])*\]\]|\[=\[([^\]]*|(?!\]=\])\])*\]=\]|\[==\[([^\]]*|(?!\]==\])\])*\]==\]|"(?:[^"\\]*|\\.)*"|'(?:[^'\\]*|\\.)*')|(?:(?:-?(?:\d*\.?\d+|0x[0-9a-fA-F]+)(?:[eE]-?\d+)?)|\W)|./yg
const StringRegex = /^(?:"|'|\[=*\[)/
const NumberRegex = /^-?(?:\d*\.?\d+|0x[0-9a-fA-F]+)(?:[eE]-?\d+)?$/

const Keywords = new Set([
	"function", "true", "false", "local", "end", "if", "elseif", "else", "then", "repeat", "until", "while", "do",
	"for", "not", "and", "or", "break", "in", "nil", "return", "continue"
])

const Globals = new Set([
	"Axes", "BrickColor", "CellId", "CFrame", "Color3", "ColorSequence", "ColorSequenceKeypoint", "DateTime",
	"DockWidgetPluginGuiInfo", "Faces", "Instance", "NumberRange", "NumberSequence", "NumberSequenceKeypoint",
	"PathWaypoint", "PhysicalProperties", "PluginDrag", "Random", "Ray", "Rect", "Region3", "Region3int16",
	"TweenInfo", "UDim", "UDim2", "Vector2", "Vector2int16", "Vector3", "Vector3int16",

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
		"log", "ldexp", "rad", "cosh", "random", "frexp", "tanh", "floor", "max", "sqrt", "modf", "huge", "pow", "atan", "tan", "cos", "sign",
		"clamp", "log10", "noise", "acos", "abs", "pi", "sinh", "asin", "min", "deg", "fmod", "randomseed", "atan2", "ceil", "sin", "exp"
	]),
	os: new Set(["difftime", "time", "date"]),
	string: new Set(["sub", "split", "upper", "len", "find", "match", "char", "rep", "gmatch", "reverse", "byte", "format", "gsub", "lower"]),
	table: new Set(["pack", "move", "insert", "getn", "foreachi", "foreach", "concat", "unpack", "find", "create", "sort", "remove"]),
	utf8: new Set(["offset", "codepoint", "nfdnormalize", "char", "codes", "len", "graphemes", "nfcnormalize", "charpattern"])
}

const Operators = new Set(["+", "-", "*", "/", "%", "=", "==", "~=", ">", ">=", "<", "<=", ":", "{", "}", "(", ")", "[", "]", "#"])

function parseSource(source) {
	const lines = []
	let tableSelector = null
	let tableSelectorState = false
	let lineN = 0
	let depth = 0
	let current

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
	content.append(html`<div class=line-container><div class=linenumber></div><div class=line style=height:6px;><span class=scope></span><span class=linetext></span></div></div>`)

	current = createLine()
	while(true) {
		const match = ParseRegex.exec(source)
		if(!match) {
			break
		}

		const text = match[0]

		if(text === "\n") {
			current = createLine()
			continue
		}

		const textLines = text.split("\n")

		let textType = text.startsWith("--") ? "comment" :
			Keywords.has(text) ? "keyword" :
				Globals.has(text) ? "global" :
					Operators.has(text) ? "operator" :
						NumberRegex.test(text) ? "number" :
							text.length > 1 && StringRegex.test(text) ? "string" :
								"text"

		if(text === "then" || text === "do" || text === "repeat" || text === "function" || text === "(" || text === "{" || text === "[") {
			depth++
		} else if(text === "end" || text === "elseif" || text === "until" || text === ")" || text === "}" || text === "]") {
			if(depth === current.depth) {
				current.depth--
			}

			depth--
		} else if(text === "else") {
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
	content.append(html`<div class=line-container><div class=linenumber></div><div class=line style=height:18px;><span class=scope></span><span class=linetext></span></div></div>`)

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
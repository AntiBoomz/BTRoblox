"use strict"

const SourceViewer = (() => {
	const NumberRegex = /^(?:0_*x_*[0-9a-f][0-9a-f_]*|0_*b_*[01][01_]*|(?:\.?\d[\d_]*|\d[\d_]*\._*\d[\d_]*)(?:e[+-]?_*\d[\d_]*)?)$/i
	const WhitespaceRegex = /^[^\n\S]+$/
	const WordRegex = /^\w+$/
	
	const _ParseRegex = new RegExp(
		[
			WhitespaceRegex.source.slice(1, -1), // whitespace
			NumberRegex.source.slice(1, -1), // number
			WordRegex.source.slice(1, -1), // word
			/[+\-*/^%~=><]=|\.\.[.=]?|::|->|\/\//.source, // multi-char ops
			/--(?:\[=*\[)?/.source, // comments
			/@(?:\[|\w+)?/.source, // attributes
			/\[=*\[/.source, // multiline strings
			/[^]/.source // any character
		].join("|"),
		"ygi"
	)

	const Keywords = new Set([
		"function", "local", "end", "if", "elseif", "else", "then", "repeat", "until", "while", "do", "for",
		"not", "and", "or", "break", "in", "return", "continue", "export", "type"
	])

	const Globals = {
		math: new Set([
			"log", "ldexp", "deg", "cosh", "round", "random", "frexp", "tanh", "floor", "max", "sqrt", "modf",
			"huge", "pow", "acos", "tan", "cos", "pi", "atan", "map", "sign", "ceil", "clamp", "noise",
			"abs", "exp", "sinh", "asin", "min", "randomseed", "fmod", "rad", "atan2", "log10", "sin", "lerp"
		]),
		buffer: new Set([
			"readf64", "readu32", "tostring", "readi8", "readu16", "copy", "readu8", "writebits", "writei16",
			"writeu16", "fromstring", "writef32", "readi32", "fill", "writeu32", "writeu8", "create", "writestring",
			"writei8", "readbits", "readi16", "writef64", "len", "writei32", "readstring", "readf32"
		]),
		debug: new Set([
			"dumpheap", "getmemorycategory", "resetmemorycategory", "setmemorycategory", "dumpcodesize", "profilebegin",
			"loadmodule", "profileend", "info", "dumprefs", "traceback"
		]),
		table: new Set([
			"getn", "foreachi", "foreach", "sort", "unpack", "freeze", "clear", "pack", "move", "insert", "create",
			"maxn", "isfrozen", "concat", "clone", "find", "remove"
		]),
		string: new Set([
			"split", "match", "gmatch", "upper", "gsub", "format", "lower", "sub", "pack", "find", "char",
			"packsize", "reverse", "byte", "unpack", "rep", "len"
		]),
		vector: new Set([
			"clamp", "ceil", "floor", "one", "abs", "zero", "create", "normalize", "min", "max", "magnitude",
			"cross", "sign", "angle", "dot", "lerp"
		]),
		bit32: new Set([
			"band", "extract", "byteswap", "bor", "bnot", "countrz", "bxor", "arshift", "rshift", "rrotate",
			"replace", "lshift", "lrotate", "btest", "countlz"
		]),
		CFrame: new Set([
			"identity", "Angles", "fromEulerAnglesYXZ", "fromRotationBetweenVectors", "lookAlong", "fromOrientation", "fromMatrix",
			"fromEulerAnglesXYZ", "fromEulerAngles", "lookAt", "fromAxisAngle", "new"
		]),
		Vector3: new Set([
			"fromNormalId", "xAxis", "zero", "max", "min", "fromAxis", "zAxis", "FromAxis", "one", "FromNormalId",
			"yAxis", "new"
		]),
		BrickColor: new Set([
			"Blue", "White", "Yellow", "Red", "Gray", "palette", "New", "Black", "Green", "Random", "DarkGray",
			"random", "new"
		]),
		utf8: new Set(["offset", "codepoint", "nfdnormalize", "char", "codes", "len", "graphemes", "nfcnormalize", "charpattern"]),
		DateTime: new Set(["fromUnixTimestamp", "now", "fromIsoDate", "fromUnixTimestampMillis", "fromLocalTime", "fromUniversalTime"]),
		SharedTable: new Set(["cloneAndFreeze", "clear", "clone", "isFrozen", "size", "increment", "update", "new"]),
		coroutine: new Set(["resume", "running", "yield", "close", "status", "wrap", "create", "isyieldable"]),
		task: new Set(["defer", "cancel", "wait", "desynchronize", "synchronize", "delay", "spawn"]),
		Vector2: new Set(["min", "xAxis", "zero", "max", "one", "yAxis", "new"]),
		Content: new Set(["fromAssetId", "fromObject", "fromUri", "none"]),
		Color3: new Set(["fromHex", "fromHSV", "toHSV", "fromRGB", "new"]),
		Font: new Set(["fromEnum", "fromId", "fromName", "new"]),
		SecurityCapabilities: new Set(["fromCurrent", "new"]),
		os: new Set(["clock", "difftime", "time", "date"]),
		UDim2: new Set(["fromOffset", "fromScale", "new"]),
		Instance: new Set(["fromExisting", "new"]),
		DockWidgetPluginGuiInfo: new Set(["new"]),
		NumberSequenceKeypoint: new Set(["new"]),
		ColorSequenceKeypoint: new Set(["new"]),
		CatalogSearchParams: new Set(["new"]),
		Path2DControlPoint: new Set(["new"]),
		PhysicalProperties: new Set(["new"]),
		RotationCurveKey: new Set(["new"]),
		NumberSequence: new Set(["new"]),
		RaycastParams: new Set(["new"]),
		ColorSequence: new Set(["new"]),
		ValueCurveKey: new Set(["new"]),
		OverlapParams: new Set(["new"]),
		FloatCurveKey: new Set(["new"]),
		PathWaypoint: new Set(["new"]),
		Vector2int16: new Set(["new"]),
		Vector3int16: new Set(["new"]),
		Region3int16: new Set(["new"]),
		NumberRange: new Set(["new"]),
		PluginDrag: new Set(["new"]),
		TweenInfo: new Set(["new"]),
		Region3: new Set(["new"]),
		CellId: new Set(["new"]),
		Random: new Set(["new"]),
		Faces: new Set(["new"]),
		UDim: new Set(["new"]),
		Rect: new Set(["new"]),
		Axes: new Set(["new"]),
		Ray: new Set(["new"]),
		Enum: {}, // filled programmatically
		
		_G: true, _VERSION: true, assert: true, collectgarbage: true, DebuggerManager: true, delay: true, Delay: true, elapsedTime: true, ElapsedTime: true,
		error: true, Game: true, game: true, gcinfo: true, getfenv: true, getmetatable: true, ipairs: true, loadstring: true, newproxy: true, next: true,
		pairs: true, pcall: true, plugin: true, PluginManager: true, print: true, printidentity: true, rawequal: true, rawget: true, rawlen: true, rawset: true,
		require: true, script: true, select: true, setfenv: true, setmetatable: true, settings: true, shared: true, spawn: true, Spawn: true, Stats: true,
		stats: true, tick: true, time: true, tonumber: true, tostring: true, type: true, typeof: true, unpack: true, UserSettings: true, Version: true,
		version: true, wait: true, Wait: true, warn: true, workspace: true, Workspace: true, xpcall: true, ypcall: true, 
	}
	
	for(const [name, enumItems] of Object.entries(ApiDump.getEnums())) {
		const set = Globals.Enum[name] = new Set()
		
		for(const name of Object.values(enumItems)) {
			set.add(name)
		}
	}
	
	const Operators = new Set([
		"+", "-", "*", "/", "%", "^", ">", "<", "=",
		"+=", "-=", "*=", "/=", "%=", "^=", ">=", "<=", "==", "~=",
		":", "{", "}", "(", ")", "[", "]", "#", ".", "..", "..=",
		"::", "->", "//"
	])

	const ScopeIn = new Set(["then", "do", "repeat", "function", "else"])
	const ScopeOut = new Set(["end", "elseif", "until", "else"])

	async function parseSource(source, parent) {
		const ParseRegex = new RegExp(_ParseRegex)
		const allLines = source.split("\n")
		
		const lineObjects = []
		let lineNumber = 0
		let current

		const content = html`
		<div class=btr-sourceviewer-source-container>
			<div class=btr-sourceviewer-linenumbers><div class=btr-linenumber style="visibility:hidden;">${allLines.length}</div></div>
			<div class=btr-sourceviewer-scopes></div>
			<div class=btr-sourceviewer-lines contentEditable="plaintext-only" spellcheck=false></div>
		</div>`
		
		const linesParent = content.$find(".btr-sourceviewer-lines")

		linesParent.$on("beforeinput", ev => {
			ev.stopImmediatePropagation()
			ev.preventDefault()
		})
		
		const toggleScope = startLine => {
			let endLineNumber = startLine.lineNumber
			
			while(true) {
				endLineNumber += 1
				
				const endLine = lineObjects[endLineNumber]
				if(!endLine || endLine === current) { return }
				
				if(endLine.depth <= startLine.depth) {
					break
				}
			}
			
			if(startLine.scopeOpen) {
				startLine.scopeOpen = false
				
				startLine.elem.classList.remove("open")
				startLine.elem.classList.add("closed")
				
				for(let i = startLine.lineNumber + 1; i < endLineNumber; i++) {
					lineObjects[i].elem.classList.add("btr-collapsed")
				}
				
			} else {
				startLine.scopeOpen = true
				
				startLine.elem.classList.add("open")
				startLine.elem.classList.remove("closed")
				
				let closedDepth = null
				
				for(let i = startLine.lineNumber + 1; i < endLineNumber; i++) {
					const line = lineObjects[i]
					
					if(closedDepth !== null) {
						if(line.depth > closedDepth) {
							continue
						}
						
						closedDepth = null
					}
					
					if(line.scopeOpen === false) {
						closedDepth = line.depth
					}
					
					line.elem.classList.remove("btr-collapsed")
				}
			}
		}
		
		//
		
		const matchUntil = (...matches) => {
			const startIndex = ParseRegex.lastIndex
			let lastIndex = startIndex

			while(true) {
				let index = -1
				
				for(const match of matches) {
					const index2 = source.indexOf(match, lastIndex)
					
					if(index2 !== -1 && (index === -1 || index2 < index)) {
						index = index2
					}
				}
				
				if(index === -1) {
					lastIndex = source.length
					break
				} else if(source[index] === "\n") {
					lastIndex = index
					break
				}
				
				lastIndex = index + 1
				
				let escaped = false
				let search = index
				
				while(source[--search] === "\\") {
					escaped = !escaped
				}
				
				if(!escaped) {
					break
				}
			}
			
			ParseRegex.lastIndex = lastIndex
			return source.slice(startIndex, lastIndex)
		}
		
		const nextToken = () => {
			let text = ParseRegex.exec(source)?.[0]
			if(!text) { return [null, null] }
			
			let textType = "text"

			if(text[0] === "-" && text[1] === "-") {
				textType = "comment"

				if(text.length > 2) {
					text += matchUntil(`]${"=".repeat(text.length - 4)}]`)
				} else {
					text += matchUntil("\n")
				}
				
			} else if(text.length > 1 && text[0] === "[") {
				textType = "string"
				text += matchUntil(`]${"=".repeat(text.length - 2)}]`)
				
			} else if(text === "\"" || text === "'") {
				textType = "string"
				text += matchUntil("\n", text)
				
			} else if(text === "`") {
				textType = "string"
				text += matchUntil("`", "{")
				
			} else if(text[0] === "@") {
				textType = "attribute"
				
			} else if(Operators.has(text)) {
				textType = "operator"
				
			} else if(NumberRegex.test(text)) {
				textType = "number"
				
			} else if(WhitespaceRegex.test(text)) {
				textType = "whitespace"
			}
			
			return [text, textType]
		}
		
		//
		
		const finishLine = () => {
			if(!current) { return }

			current.list.append("\n")
			
			current.templist.replaceWith(current.list)
			delete current.templist
			
			const last = lineObjects[lineNumber - 1]
			
			if(last && current.depth > last.depth) {
				const scopeButton = document.createElement("div")
				scopeButton.classList.add("btr-scope")
				scopeButton.contentEditable = false
				
				last.elem.classList.add("open")
				last.elem.append(scopeButton)
				
				last.scopeOpen = true
				scopeButton.$on("click", () => toggleScope(last))
			}
			
			current = null
		}

		const nextLine = (depth = 0) => {
			finishLine()
			lineNumber += 1
			
			current = lineObjects[lineNumber]
			current.depth = depth
		}
		
		for(const lineText of allLines) {
			lineNumber += 1

			const elem = document.createElement("div")
			elem.classList.add("btr-line-container")
			
			const ln = document.createElement("div")
			ln.classList.add("btr-linenumber")
			ln.contentEditable = false
			ln.textContent = lineNumber
			
			const list = document.createElement("span")
			list.classList.add("btr-linetext")
			
			const templist = list.cloneNode(true)
			templist.textContent = lineText + "\n"
			
			elem.append(ln, templist)
			
			const line = lineObjects[lineNumber] = {
				lineNumber: lineNumber,
				templist: templist,
				list: list,
				elem: elem,
				depth: 0
			}
			
			linesParent.append(elem)
		}
		
		lineNumber = 0
		
		//
		
		const indexState = []
		const stack = []
		
		let nextYield = performance.now() + 10
		let parented = false
		let depth = 0
		
		nextLine(0)
		
		while(true) {
			if(performance.now() >= nextYield) {
				if(!parented) {
					parented = true
					parent.append(content)
				}
				
				await new Promise(resolve => requestAnimationFrame(resolve))
				nextYield = performance.now() + 5
			}
			
			let [text, textType] = nextToken()
			if(text === null) { break }
			
			if(text === "\n") {
				nextLine(depth)
				continue
			}
			
			let scopeOut = ScopeOut.has(text)
			let scopeIn = ScopeIn.has(text)
			
			// stacking
			if(text === "(" || text === "[" || text === "{" || text === "@[") {
				stack.push(text)
				scopeIn = true
				
			} else if(text[0] === "`" && text[text.length - 1] === "{") {
				stack.push("`")
				scopeIn = true
				
			} else if(text === ")" || text === "]" || text === "}") {
				const closing = stack.pop()
				scopeOut = true
				
				if(closing === "@[") {
					textType = "attribute"
					
				} else if(closing === "`") {
					textType = "string"
					text += matchUntil("`", "{")
					
					if(text[text.length - 1] === "{") {
						stack.push("`")
						scopeIn = true
					}
				}
			}
			
			// scopes
			if(scopeOut) {
				if(depth === current.depth) {
					current.depth--
				}

				depth--
			}
			
			if(scopeIn) {
				depth++
			}
			
			// indexing
			if(text === "." || text === ":") {
				if(indexState.length % 2 === 0) {
					indexState.splice(0, indexState.length, null)
				}
				
				indexState.push(text)
				
			} else if(textType === "text") {
				if(indexState.length % 2 === 1) {
					indexState.splice(0, indexState.length)
				}
				
				indexState.push(text)
				
				let global = Globals
				
				for(let i = 0; i < indexState.length; i += 2) {
					global = global instanceof Set ? global.has(indexState[i]) : global?.[indexState[i]]
				}
				
				if(indexState.length === 1) {
					if(Keywords.has(text) || text === "self") {
						textType = "keyword"
					} else if(text === "true" || text === "false" || text === "nil") {
						textType = "nilbool"
					} else if(global) {
						textType = "global"
					} else if(stack[stack.length - 1] === "@[") {
						textType = "attribute"
					}
					
				} else {
					if(global) {
						textType = "global"
					} else {
						textType = "property"
					}
				}
				
				if(textType === "text" || textType === "property") {
					const lastIndex = ParseRegex.lastIndex
					
					let peek, peekType
					do {
						[peek, peekType] = nextToken()
					} while(peekType === "whitespace" || peekType === "comment")
					
					ParseRegex.lastIndex = lastIndex
					
					if(peek && (peek === "(" || peek[0] === "\"" || peek[0] === "'" || peek === "{")) {
						textType = "method"
					}
				}
				
			} else if(textType !== "whitespace" && textType !== "comment") {
				indexState.splice(0, indexState.length)
			}
			
			const textLines = text.split(/\n/)
			
			for(const [index, line] of Object.entries(textLines)) {
				if(index > 0) {
					nextLine(depth)
				}

				if(textLines.length > 1) {
					if(index === 0) {
						depth++
					} else if(index === textLines.length - 1) {
						current.depth--
						depth--
					}
				}

				if(textType === "text") {
					current.list.append(text)
					
				} else if(textType === "whitespace") {
					for(let i = 0; i < line.length; i++) {
						if(line[i] === "\t") {
							const span = document.createElement("span")
							span.className = "btr-sourceviewer-tab"
							span.textContent = line[i]
			
							current.list.append(span)
						} else {
							const span = document.createElement("span")
							span.className = "btr-sourceviewer-space"
							span.textContent = line[i]
			
							current.list.append(span)
						}
					}
					
				} else {
					const span = document.createElement("span")
					span.className = "btr-sourceviewer-" + textType
					span.textContent = line
	
					current.list.append(span)
				}
			}
		}

		finishLine()
		
		if(!parented) {
			parented = true
			parent.append(content)
		}
		
		return content
	}

	return {
		init(parent, source) {
			return parseSource(source, parent)
		}
	}
})()
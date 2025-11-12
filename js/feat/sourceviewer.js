"use strict"

const SourceViewer = (() => {
	const NumberRegex = /^-?(?:0_*(?:x_*[0-9a-f][0-9a-f_]*|[bB]_*[01][01_]*)|(\d[\d_]*)?\.?\d[\d_]*(?:e[+-]?_*\d[\d_]*)?)$/i

	const _ParseRegex = new RegExp(
		[
			/0_*x_*[0-9a-f][0-9a-f_]*|0_*b_*[01][01_]*|(\d[\d_]*)?\.?\d[\d_]*(?:e[+-]?_*\d[\d_]*)?/.source, // number
			/[+\-*/^%~=><]=|\.\.[.=]?|::|->|\/\//.source, // multi-char ops
			/\[=*\[/.source, // groups
			/--(?:\[=*\[)?/.source, // comments
			/\w+/.source, // words
			/[^\n\S]+/.source, // whitespace
			/[^]/.source // any character
		].join("|"),
		"ygi"
	)

	const Keywords = new Set([
		"function", "local", "end", "if", "elseif", "else", "then", "repeat", "until", "while", "do", "for",
		"not", "and", "or", "break", "in", "return", "continue", "export", "type"
	])

	const Globals = new Set([
		"Axes", "BrickColor", "CellId", "CFrame", "Color3", "ColorSequence", "ColorSequenceKeypoint", "DateTime",
		"DockWidgetPluginGuiInfo", "Faces", "Instance", "NumberRange", "NumberSequence", "NumberSequenceKeypoint",
		"PathWaypoint", "PhysicalProperties", "PluginDrag", "Random", "Ray", "RaycastParams", "Rect", "Region3",
		"Region3int16", "TweenInfo", "UDim", "UDim2", "Vector2", "Vector2int16", "Vector3", "Vector3int16",
		"SharedTable"

		"assert", "collectgarbage", "error", "gcinfo", "getfenv", "getmetatable", "ipairs", "loadstring", "newproxy",
		"next", "pairs", "pcall", "print", "rawequal", "rawget", "rawset", "select", "setfenv", "setmetatable",
		"tonumber", "tostring", "type", "unpack", "xpcall", "_G", "_VERSION",

		"delay", "elapsedTime", "require", "settings", "spawn", "tick", "time", "typeof", "UserSettings", "wait", "warn",
		"ypcall",

		"Enum", "game", "plugin", "shared", "script", "workspace"
	])

	const Tables = {
		math: new Set([
			"log", "ldexp", "deg", "cosh", "round", "random", "frexp", "tanh", "floor", "max", "sqrt", "modf", "huge", "pow", "acos",
			"tan", "cos", "pi", "atan", "map", "sign", "ceil", "clamp", "noise", "abs", "exp", "sinh", "asin", "min", "randomseed",
			"fmod", "rad", "atan2", "log10", "sin", "lerp"
		]),
		buffer: new Set([
			"readf64", "readu32", "tostring", "readi8", "readu16", "copy", "readu8", "writebits", "writei16", "writeu16", "fromstring",
			"writef32", "readi32", "fill", "writeu32", "writeu8", "create", "writestring", "writei8", "readbits", "readi16", "writef64",
			"len", "writei32", "readstring", "readf32"
		]),
		debug: new Set([
			"dumpheap", "getmemorycategory", "resetmemorycategory", "setmemorycategory", "dumpcodesize", "profilebegin", "loadmodule",
			"profileend", "info", "dumprefs", "traceback"
		]),
		table: new Set([
			"getn", "foreachi", "foreach", "sort", "unpack", "freeze", "clear", "pack", "move", "insert", "create", "maxn", "isfrozen",
			"concat", "clone", "find", "remove"
		]),
		string: new Set([
			"split", "match", "gmatch", "upper", "gsub", "format", "lower", "sub", "pack", "find", "char", "packsize", "reverse",
			"byte", "unpack", "rep", "len"
		]),
		vector: new Set([
			"clamp", "ceil", "floor", "one", "abs", "zero", "create", "normalize", "min", "max", "magnitude", "cross", "sign", "angle",
			"dot", "lerp"
		]),
		bit32: new Set([
			"band", "extract", "byteswap", "bor", "bnot", "countrz", "bxor", "arshift", "rshift", "rrotate", "replace", "lshift",
			"lrotate", "btest", "countlz"
		]),
		utf8: new Set(["offset", "codepoint", "nfdnormalize", "char", "codes", "len", "graphemes", "nfcnormalize", "charpattern"]),
		coroutine: new Set(["resume", "running", "yield", "close", "status", "wrap", "create", "isyieldable"]),
		task: new Set(["defer", "cancel", "wait", "desynchronize", "synchronize", "delay", "spawn"]),
		os: new Set(["clock", "difftime", "time", "date"]),
	}
	
	const Operators = new Set([
		"+", "-", "*", "/", "%", "^", ">", "<", "=",
		"+=", "-=", "*=", "/=", "%=", "^=", ">=", "<=", "==", "~=",
		":", "{", "}", "(", ")", "[", "]", "#", "..", "..=",
		"::", "->", "//"
	])

	const ScopeIn = new Set(["then", "do", "repeat", "function", "(", "{", "["])
	const ScopeOut = new Set(["end", "elseif", "until", ")", "}", "]"])
	const ScopeInOut = new Set(["else"])

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
			
			const line = lineObjects[lineNumber]
			line.depth = depth
			
			current = line
		}
		
		//
		
		let text
		
		const appendUntil = final => {
			const len = final - ParseRegex.lastIndex

			if(len > 0) {
				text += source.slice(ParseRegex.lastIndex, ParseRegex.lastIndex + len)
				ParseRegex.lastIndex += len
			}
		}

		const appendGroup = groupDepth => {
			const searchString = `]${"=".repeat(groupDepth)}]`
			const groupEndIndex = source.indexOf(searchString, ParseRegex.lastIndex)

			if(groupEndIndex === -1) {
				appendUntil(source.length)
			} else {
				appendUntil(groupEndIndex + searchString.length)
			}
		}

		const genericAppend = (char1, char2) => {
			let newLine = source.indexOf("\n", ParseRegex.lastIndex)
			if(newLine === -1) { newLine = source.length }
			
			if(char1) {
				let index = ParseRegex.lastIndex - 1
				let startIndex = index + 1

				while(true) {
					const index1 = source.indexOf(char1, index + 1)
					const index2 = char2 ? source.indexOf(char2, index + 1) : -1
					
					index = index1 === -1 ? index2 : index2 === -1 ? index1 : Math.min(index1, index2)

					if(index === -1 || index > newLine) {
						appendUntil(newLine)
						return
					}

					let pointer = index
					while(source[--pointer] === "\\") {
						// do nothing
					}

					if((index - pointer) % 2 === 1) {
						appendUntil(index + 1)
						return
					}
				}
			} else {
				appendUntil(newLine)
			}
		}
		
		// Load all lines as pure text first
		
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
		
		const indexState = { depth: 0, parent: "root", state: false }
		const interpState = []
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
			
			const match = ParseRegex.exec(source)
			if(!match) { break }
			
			text = match[0]
			
			if(text === "\n") {
				nextLine(depth)
				continue
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
			} else if(text === "`") {
				textType = "string"
				genericAppend("`", "{")
				
				if(text.slice(-1) === "{") {
					interpState.push(1)
				}
				
			} else if(Operators.has(text)) {
				textType = "operator"
				
				if(interpState.length > 0) {
					if(text === "{") {
						interpState[interpState.length - 1] += 1
					} else if(text === "}") {
						if(interpState[interpState.length - 1] > 1) {
							interpState[interpState.length - 1] -= 1
						} else {
							interpState.pop()
							
							textType = "string"
							genericAppend("`", "{")
							
							if(text.slice(-1) === "{") {
								interpState.push(1)
							}
						}
					}
				}
				
			} else if(NumberRegex.test(text)) {
				textType = "number"
			} else if(/[^\n\S]+/.test(text)) {
				textType = "whitespace"
			}
			
			if(textType !== "whitespace" && textType !== "comment") {
				if(indexState.state && (text === "." || text === ":")) {
					indexState.depth += 1
					indexState.state = false
					
				} else if(textType === "text") {
					if(indexState.state) {
						indexState.depth = 0
						indexState.state = false
					}
					
					if(indexState.depth === 0) {
						if(Keywords.has(text) || text === "self") {
							textType = "keyword"
						} else if(Globals.has(text) || text in Tables) {
							textType = "global"
						} else if(text === "true" || text === "false" || text === "nil") {
							textType = "nilbool"
						}
					} else {
						textType = "property"
						
						if(indexState.depth === 1 && Tables[indexState.parent]?.has(text)) {
							textType = "global"
						}
					}
					
					if(textType === "text" || textType === "property") {
						const lastIndex = ParseRegex.lastIndex
						const peek = ParseRegex.exec(source)?.[0]
						ParseRegex.lastIndex = lastIndex
						
						if(peek === "(" || peek === "\"" || peek === "'" || peek === "{") {
							textType = "method"
						}
					}
					
					indexState.parent = text
					indexState.state = true
					
				} else {
					indexState.depth = 0
					indexState.state = false
				}
			}
			
			const textLines = text.split(/\n/)
			const multiline = (textType === "comment" || textType === "string") && textLines.length > 1
			
			for(const [index, line] of Object.entries(textLines)) {
				if(index > 0) {
					nextLine(depth)
				}

				if(multiline) {
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
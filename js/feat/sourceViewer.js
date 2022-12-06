"use strict"

const btrSourceViewer = (() => {
	const NumberRegex = /^-?(?:0_*(?:x_*[0-9a-f][0-9a-f_]*|[bB]_*[01][01_]*)|(\d[\d_]*)?\.?\d[\d_]*(?:e[+-]?_*\d[\d_]*)?)$/i

	const ParseRegex = new RegExp(
		[
			/-?(?:0_*(?:x_*[0-9a-f][0-9a-f_]*|[bB]_*[01][01_]*)|(\d[\d_]*)?\.?\d[\d_]*(?:e[+-]?_*\d[\d_]*)?)/.source, // number
			/[+\-*/^%~=><]=|\.\.[.=]?/.source, // multi-char ops
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
		"not", "and", "or", "break", "in", "return", "continue"
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
		bit32: new Set(["band", "extract", "bor", "bnot", "countrz", "bxor", "arshift", "rshift", "rrotate", "replace", "lshift", "lrotate", "btest", "countlz"]),
		coroutine: new Set(["resume", "running", "yield", "close", "status", "wrap", "create", "isyieldable"]),
		debug: new Set(["loadmodule", "traceback", "info", "dumpheap", "resetmemorycategory", "setmemorycategory", "profileend", "profilebegin"]),
		math: new Set([
			"log", "ldexp", "rad", "cosh", "round", "random", "frexp", "tanh", "floor", "max", "sqrt", "modf", "huge", "pow", "atan", "tan", "cos", "pi",
			"noise", "log10", "sign", "acos", "abs", "clamp", "sinh", "asin", "min", "deg", "fmod", "randomseed", "atan2", "ceil", "sin", "exp"
		]),
		os: new Set(["clock", "difftime", "time", "date"]),
		string: new Set(["split", "match", "gmatch", "upper", "gsub", "format", "lower", "sub", "pack", "find", "char", "packsize", "reverse", "byte", "unpack", "rep", "len"]),
		table: new Set(["getn", "foreachi", "foreach", "sort", "unpack", "freeze", "clear", "pack", "move", "insert", "create", "maxn", "isfrozen", "concat", "clone", "find", "remove"]),
		utf8: new Set(["offset", "codepoint", "nfdnormalize", "char", "codes", "len", "graphemes", "nfcnormalize", "charpattern"]),
		task: new Set(["defer", "cancel", "wait", "desynchronize", "synchronize", "delay", "spawn"]),
	}
	
	const Operators = new Set([
		"+", "-", "*", "/", "%", "^", ">", "<", "=",
		"+=", "-=", "*=", "/=", "%=", "^=", ">=", "<=", "==", "~=",
		":", "{", "}", "(", ")", "[", "]", "#", "..", "..="
	])

	const ScopeIn = new Set(["then", "do", "repeat", "function", "(", "{", "["])
	const ScopeOut = new Set(["end", "elseif", "until", ")", "}", "]"])
	const ScopeInOut = new Set(["else"])

	async function parseSource(source, parent) {
		const indexState = { depth: 0, parent: "root", state: false }
		let textBuffer = ""
		let lineN = 0
		let depth = 0
		let text

		const allLines = source.split("\n")

		const content = html`
		<div class=btr-sourceviewer-source-container>
			<div class=btr-sourceviewer-linenumbers>
				<div class=btr-linenumber style="visibility:hidden;">${allLines.length}</div>
			</div>
			<div class=btr-sourceviewer-scopes>
			</div>
			<div class=btr-sourceviewer-lines>
			</div>
		</div>`


		const linesParent = content.$find(".btr-sourceviewer-lines")
		let loadingLinesParent

		let lastLine
		let current

		const finishLine = () => {
			if(!current) {
				return
			}
			
			flushText()

			current.elem.dataset.depth = current.depth
			
			if(lastLine && current.depth > lastLine.depth) {
				lastLine.elem.classList.add("open")
				lastLine.elem.$find(".btr-linenumber").after(html`<div class=btr-scope contenteditable=false>`)
			}

			lastLine = current
			current = null
		}

		const createLine = () => {
			const elem = html`
			<div class=btr-line-container>
				<div class=btr-linenumber contenteditable=false>${++lineN}</div>
				<span class=btr-linetext></span>
			</div>`

			linesParent.append(elem)

			const line = {
				elem, depth,
				list: elem.$find(".btr-linetext")
			}

			if(lineN === 1) { // small hack to fix selection for first line
				elem.prepend(line.list)
			}

			finishLine()
			current = line
		}

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

		const genericAppend = stringChar => {
			let newLine = source.indexOf("\n", ParseRegex.lastIndex)
			if(newLine === -1) { newLine = source.length }
			
			if(stringChar) {
				let nextIndex = ParseRegex.lastIndex

				while(true) {
					const index = source.indexOf(stringChar, nextIndex)
					nextIndex = index + 1

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
		
		const flushText = () => {
			if(textBuffer.length) {
				current.list.append(textBuffer)
				textBuffer = ""
			}
		}

		const appendText = textInput => {
			textBuffer += textInput
		}

		createLine()
		ParseRegex.lastIndex = 0

		let nextYield = performance.now() + 10
		
		if(!loadingLinesParent) {
			loadingLinesParent = linesParent.cloneNode()
			linesParent.after(loadingLinesParent)
			linesParent.style.display = "none"

			parent.append(content)

			let loadingLineN = 0
			
			for(const lineText of allLines) {
				loadingLinesParent.append(html`
				<div class=btr-line-container>
					<div class=btr-linenumber contenteditable=false>${++loadingLineN}</div>
					<span class=btr-linetext>${lineText + "\n"}</span>
				</div>`)
			}
		}

		while(true) {
			if(performance.now() >= nextYield) {
				await new SyncPromise(resolve => requestAnimationFrame(resolve))
				nextYield = performance.now() + 10
			}

			const match = ParseRegex.exec(source)
			if(!match) {
				break
			}

			text = match[0]
			if(text === "\n") {
				appendText("\n")
				createLine()
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
			} else if(Operators.has(text)) {
				textType = "operator"
			} else if(NumberRegex.test(text)) {
				textType = "number"
			} else if(/[^\n\S]+/.test(text)) {
				textType = "whitespace"
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
					appendText("\n")
					createLine()
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
					appendText(text)
					
				} else if(textType === "whitespace") {
					flushText()
					
					for(let i = 0; i < line.length; i++) {
						if(line[i] === "\t") {
							const span = html`<span></span>`
							span.className = "btr-sourceviewer-tab"
							span.textContent = line[i]
			
							current.list.append(span)
						} else {
							const span = html`<span></span>`
							span.className = "btr-sourceviewer-space"
							span.textContent = line[i]
			
							current.list.append(span)
						}
					}
					
				} else {
					flushText()
					
					const span = html`<span></span>`
					span.className = "btr-sourceviewer-" + textType
					span.textContent = line
	
					current.list.append(span)
				}
			}
		}

		finishLine()

		if(loadingLinesParent) {
			loadingLinesParent.remove()
			linesParent.style.display = ""
		} else {
			parent.append(content)
		}
		
		//

		linesParent.contentEditable = true
		linesParent.spellcheck = false

		let savedContent = linesParent.innerHTML
		let savedSelection

		linesParent.$on("input", () => {
			if(linesParent.innerHTML !== savedContent) {
				const savedScroll = parent.scrollTop

				linesParent.innerHTML = savedContent

				if(savedSelection) {
					const { anchor, focus } = savedSelection

					const sel = document.getSelection()
					const anchorElem = linesParent.children[anchor.lineIndex].$find(".btr-linetext").childNodes[anchor.childIndex]
					const focusElem = linesParent.children[focus.lineIndex].$find(".btr-linetext").childNodes[focus.childIndex]

					sel.setBaseAndExtent(
						anchorElem.nodeType !== 3 ? anchorElem.childNodes[0] : anchorElem,
						anchor.offset,
						focusElem.nodeType !== 3 ? focusElem.childNodes[0] : focusElem,
						focus.offset
					)
				}

				parent.scrollTop = savedScroll
				requestAnimationFrame(() => parent.scrollTop = savedScroll)
			}
		})

		const getElemPath = (node, offset) => {
			if(!node.parentNode.classList.contains("btr-linetext")) {
				node = node.parentNode
			}

			if(node.parentNode.classList.contains("btr-linetext")) {
				const lineIndex = Array.prototype.indexOf.call(linesParent.children, node.parentNode.parentNode)
				const childIndex = Array.prototype.indexOf.call(node.parentNode.childNodes, node)

				if(lineIndex !== -1 && childIndex !== -1) {
					return { lineIndex, childIndex, offset }
				}
			}
		}

		const onSelectChange = () => {
			if(!document.contains(linesParent)) {
				document.$off("selectionchange", onSelectChange)
				return
			}

			savedSelection = null

			const sel = document.getSelection()

			if(linesParent.contains(sel.anchorNode)) {
				const anchor = getElemPath(sel.anchorNode, sel.anchorOffset)
				const focus = getElemPath(sel.focusNode, sel.focusOffset)

				if(anchor && focus) {
					savedSelection = { anchor, focus }
				}
			}
		}

		document.$on("selectionchange", onSelectChange)
		
		//

		content.$on("click", ".btr-scope", ev => {
			ev.preventDefault()
			ev.stopPropagation()
			ev.stopImmediatePropagation()

			const scope = ev.currentTarget
			const elem = scope.closest(".btr-line-container")

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
	
					target.classList.add("btr-collapsed")
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
	
						target.classList.remove("btr-collapsed")
	
						if(target.classList.contains("closed")) {
							subDepth = +target.dataset.depth
						}
					}
				}
			}

			savedContent = linesParent.innerHTML
		})

		return content
	}

	return {
		init(parent, source) {
			return parseSource(source, parent)
		}
	}
})()
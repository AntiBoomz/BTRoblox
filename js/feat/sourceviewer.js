
"use strict"

const SourceViewer = (() => {
	const NumberRegex = /^-?(?:0_*(?:x_*[0-9a-f][0-9a-f_]*|[bB]_*[01][01_]*)|(\d[\d_]*)?\.?\d[\d_]*(?:e[+-]?_*\d[\d_]*)?)$/i

	const ParseRegex = new RegExp(
		[
			/-?(?:0_*(?:x_*[0-9a-f][0-9a-f_]*|[bB]_*[01][01_]*)|(\d[\d_]*)?\.?\d[\d_]*(?:e[+-]?_*\d[\d_]*)?)/.source, // number
			/[+\-*/^%~=><]=|\.\.=?/.source, // multi-char ops
			/\[=*\[/.source, // groups
			/--(?:\[=*\[)?/.source, // comments
			/\w+/.source, // words
			/[^\n\S]+/.source, // whitespace
			/[^]/.source // any character
		].join("|"),
		"ygi"
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
		"+", "-", "*", "/", "%", "^", ">", "<", "=",
		"+=", "-=", "*=", "/=", "%=", "^=", ">=", "<=", "==", "~=",
		":", "{", "}", "(", ")", "[", "]", "#", "..", "..="
	])

	const ScopeIn = new Set(["then", "do", "repeat", "function", "(", "{", "["])
	const ScopeOut = new Set(["end", "elseif", "until", ")", "}", "]"])
	const ScopeInOut = new Set(["else"])

	async function parseSource(source, parent) {
		let tableSelector = null
		let tableSelectorState = false
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

		const appendText = textInput => {
			if(textInput === true) {
				if(textBuffer.length) {
					current.list.append(textBuffer)
					textBuffer = ""
				}

				return
			}

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

			allLines.forEach(lineText => {
				loadingLinesParent.append(html`
				<div class=btr-line-container>
					<div class=btr-linenumber contenteditable=false>${++loadingLineN}</div>
					<span class=btr-linetext>${lineText + "\n"}</span>
				</div>`)
			})
		}

		while(true) {
			if(performance.now() >= nextYield) {
				await new Promise(resolve => requestAnimationFrame(resolve))
				nextYield = performance.now() + 10
			}

			const match = ParseRegex.exec(source)
			if(!match) {
				break
			}

			text = match[0]
			if(text === "\n") {
				appendText("\n")
				appendText(true)
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
					appendText("\n")
					appendText(true)
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
					appendText(line)
				} else {
					appendText(true)

					const span = html`<span></span>`
					span.className = "btr-sourceviewer-" + textType
					span.textContent = line
	
					current.list.append(span)
				}
			})
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
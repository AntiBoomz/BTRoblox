"use strict"

const https = require("https")
const fs = require("fs")

// https://raw.githubusercontent.com/CloneTrooper1019/Roblox-Client-Watch/master/API_Dump.json
// https://raw.githubusercontent.com/CloneTrooper1019/Roblox-Client-Watch/master/ReflectionMetadata.xml

const toDict = (...args) => { const obj = {}; args.forEach(key => obj[key] = true); return obj }
const invalidClasses = toDict(
	"Player", "DebuggerBreakpoint", "DebuggerWatch", "FunctionalTest",
	"ButtonBindingWidget", "InputObject", "Mouse", "Pages", "Plugin", "PluginAction",
	"PluginManager", "GenericSettings", "StatsItem", "Toolbar", "ScriptDebugger",
	"GlobalDataStore", "NetworkMarker", "Path", "RenderingTest", "AnimationTrack",
	"PlayerGui",

	// Deprecated stuff I don't really care about
	"CustomEvent", "CustomEventReceiver", "ReflectionMetadata", "ReflectionMetadataClasses",
	"ReflectionMetadataEnums", "ReflectionMetadataEvents", "ReflectionMetadataFunctions",
	"ReflectionMetadataItem", "ReflectionMetadataClass", "ReflectionMetadataEnum", "ReflectionMetadataEnumItem",
	"ReflectionMetadataMember", "ReflectionMetadataProperties", "ReflectionMetadataYieldFunctions",
	"StarterGear", "Feature",

	// Service level stuff
	"ServiceProvider", "NetworkPeer"
)
const invalidProps = toDict(
	"formFactor", "className", "archivable", "angularvelocity", "maxTorque", "force", "cframe", "maxForce",
	"position", "location", "velocity", "maxHealth", "brickColor", "size"
)

function doStuff(data, rmd) {
	const classes = {}
	const enumDict = {}
	const validClasses = []
	const validEnums = []
	const validEnumIndexDict = {}
	const validCats = ["Data"]

	const regex = /class="ReflectionMetadataClass">\s+<Properties>((?:(?!<\/Properties>)[^])+)/g
	const rmdData = {}

	while(true) {
		const arr = regex.exec(rmd)
		if(!arr) { break }
		const props = arr[1]
		const name = props.match(/name="Name">([^<]+)/)[1]
		const order = props.match(/name="ExplorerOrder">([^<]+)/)
		const icon = props.match(/name="ExplorerImageIndex">([^<]+)/)

		if(order || icon) {
			const x = rmdData[name] = {}
			if(order) { x.order = +order[1] }
			if(icon) { x.icon = +icon[1] }
		}
	}

	data.Enums.forEach(x => enumDict[x.Name] = x)

	data.Classes.forEach(x => {
		classes[x.Name] = x

		const superclass = x.Superclass = classes[x.Superclass]
		if((superclass && superclass.Invalid) || invalidClasses[x.Name] || (x.Tags && x.Tags.includes("Service"))) {
			x.Invalid = true
			return
		}

		const validMembers = x.ValidMembers = []

		if(!x.Invalid) {
			x.Members.forEach(y => {
				if(y.MemberType !== "Property") { return }
				if(invalidProps[y.Name]) { return }

				let catId = validCats.indexOf(y.Category)
				if(catId === -1) { catId = validCats.push(y.Category) - 1 }

				const enumInfo = enumDict[y.ValueType.Name]
				if(enumInfo) {
					let enumId = validEnumIndexDict[y.ValueType.Name]
					if(typeof enumId !== "number") {
						enumId = validEnumIndexDict[y.ValueType.Name] = validEnums.push(enumInfo) - 1
					}

					enumInfo.uses = enumInfo.uses || []
					enumInfo.uses.push(`${x.Name}.${y.Name}`)

					validMembers.push({
						Name: y.Name,
						Cat: catId,
						Enum: enumId
					})
				} else {
					if(catId > 0) {
						validMembers.push({
							Name: y.Name,
							Cat: catId
						})
					}
				}
			})
		}

		x.rmd = rmdData[x.Name]

		let anc = superclass
		while(anc && (anc.Empty || anc.Invalid)) { anc = anc.Superclass }
		x.SubIndex = anc ? anc.Index : undefined
		x.Empty = !x.rmd && validMembers.length === 0

		if(!x.Empty || anc && !anc.Empty && anc.Index !== 0) {
			x.Index = validClasses.push(x) - 1
		}
	})

	/*
	Object.values(enumDict).forEach(x => {
		if(x.uses) {
			console.log(`${x.Name}: ${x.uses.join(", ")}`)
		}
	})
	*/

	const finalClasses = validClasses.map(x => `["${x.Name}"${x.SubIndex ? `,${x.SubIndex}` : ""}${x.Empty ? "" : `,{${x.ValidMembers.map(y => `${y.Name}:${"Enum" in y ? `[${y.Enum ? `${y.Cat || ""},${y.Enum}` : ""}]` : `${y.Cat}`}`).join(",")}}${!x.rmd ? "" : `,${"icon" in x.rmd ? `[${"order" in x.rmd ? x.rmd.order : ""},${x.rmd.icon}]` : x.rmd.order}`}`}]`).join(",")
	const finalEnums = validEnums.map(x => `["${x.Name}",${x.Items.sort((a, b) => a.Value - b.Value)[x.Items.length - 1].Value < x.Items.length * 4 ? `[${x.Items.map((y, yi) => `"${y.Name}"${",".repeat((x.Items[yi + 1] || y).Value - y.Value)}`).join("")}]` : `{${x.Items.map(y => `${y.Value}:"${y.Name}"`).join(",")}}`}]`).join(",")
	const finalCats = `["${validCats.join(`","`)}"]`

	fs.writeFileSync("output.js", `const Data = {\n\tCategories: ${finalCats},\n\tEnums: [\n\t\t${finalEnums}\n\t],\n\tClasses: [\n\t\t${finalClasses}\n\t]\n}`)
	console.log("Done")
}

Promise.all([
	new Promise(resolve => {
		https.get("https://raw.githubusercontent.com/CloneTrooper1019/Roblox-Client-Watch/master/API_Dump.json", res => {
			const chunks = []
			res.on("data", chunk => chunks.push(chunk))
			res.on("end", () => {
				const data = JSON.parse(Buffer.concat(chunks).toString())
				resolve(data)
			})
		})
	}),
	new Promise(resolve => {
		https.get("https://raw.githubusercontent.com/CloneTrooper1019/Roblox-Client-Watch/master/ReflectionMetadata.xml", res => {
			const chunks = []
			res.on("data", chunk => chunks.push(chunk))
			res.on("end", () => {
				const data = Buffer.concat(chunks).toString()
				resolve(data)
			})
		})
	})
]).then(([data, rmd]) => doStuff(data, rmd))
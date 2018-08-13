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
	"PlayerGui", "NetworkPeer", "DebuggerManager", "PluginGui", "DockWidgetPluginGui",
	"GuiRoot", "NetworkReplicator", "ReflectionMetadata", "ReflectionMetadataClasses",
	"ReflectionMetadataEnums", "ReflectionMetadataEvents", "ReflectionMetadataFunctions",
	"ReflectionMetadataItem", "ReflectionMetadataClass", "ReflectionMetadataEnum", "ReflectionMetadataEnumItem",
	"ReflectionMetadataMember", "ReflectionMetadataProperties", "ReflectionMetadataYieldFunctions",
	"ReflectionMetadataCallbacks", "TextFilterResult", "Translator", "TweenBase", "Theme", "PartOperationAsset",
	"Controller",

	// Settings
	"GameSettings", "LuaSettings", "DebugSettings", "PhysicsSettings", "Studio", "NetworkSettings", "RenderSettings",
	"TaskScheduler", "Selection"
)

function doStuff(data, rmd) {
	const classes = {}
	const enumDict = {}
	const validClasses = []
	const validEnums = []
	const validEnumIndexDict = {}
	const validCats = [{ name: "Appearance", count: 0, id: 0 }]
	const catMap = { [validCats[0].name]: validCats[0] }

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

		x.Members.forEach(y => {
			if(y.MemberType !== "Property" || !y.Serialization.CanLoad || y.Tags && y.Tags.includes("Hidden")) { return }

			if(!catMap[y.Category]) {
				const cat = { name: y.Category, count: 0 }
				validCats.push(cat)
				catMap[cat.name] = cat
			}

			const cat = catMap[y.Category]
			cat.count++

			const enumInfo = enumDict[y.ValueType.Name]
			if(enumInfo) {
				let enumId = validEnumIndexDict[y.ValueType.Name]
				if(typeof enumId !== "number") {
					enumId = validEnumIndexDict[y.ValueType.Name] = validEnums.push(enumInfo) - 1
				}

				validMembers.push({
					Name: y.Name,
					Cat: cat,
					Enum: enumId
				})
			} else {
				validMembers.push({
					Name: y.Name,
					Cat: cat
				})
			}
		})

		x.rmd = rmdData[x.Name]

		let anc = superclass
		while(anc && (anc.Empty || anc.Invalid)) { anc = anc.Superclass }
		x.SubIndex = anc ? anc.Index : undefined
		x.Empty = !x.rmd && validMembers.length === 0

		if(!x.Empty || anc && !anc.Empty && anc.Index !== 0) {
			x.Index = validClasses.push(x) - 1
		}
	})

	classes.Instance.ValidMembers.push(
		{ Name: "ClassName", Cat: catMap.Data },
		{ Name: "Archivable", Cat: catMap.Behavior }
	)

	const usedCats = validCats.filter(x => x.count > 0)
	usedCats.forEach((x, i) => x.id = i)

	const finalClasses = validClasses.map(x => `["${x.Name}"${x.SubIndex ? `,${x.SubIndex}` : ""}${x.Empty ? "" : `,${x.ValidMembers.length === 0 ? "" : `{${x.ValidMembers.map(y => `${y.Name}:${"Enum" in y ? `[${y.Enum ? `${y.Cat.id || ""},${y.Enum}` : ""}]` : `${y.Cat.id}`}`).join(",")}}`}${!x.rmd ? "" : `,${"icon" in x.rmd ? `[${"order" in x.rmd ? x.rmd.order : ""},${x.rmd.icon}]` : x.rmd.order}`}`}]`).join(",")
	const finalEnums = validEnums.map(x => `["${x.Name}",${x.Items.sort((a, b) => a.Value - b.Value)[x.Items.length - 1].Value < x.Items.length * 4 ? `[${x.Items.map((y, yi) => `"${y.Name}"${",".repeat((x.Items[yi + 1] || y).Value - y.Value)}`).join("")}]` : `{${x.Items.map(y => `${y.Value}:"${y.Name}"`).join(",")}}`}]`).join(",")
	const finalCats = `"${usedCats.map(x => x.name).join(`","`)}"`

	fs.writeFileSync("output.js", `/* eslint-disable */\n"use strict";\n\nconst Data = {\n\tCategories: [\n\t\t${finalCats}\n\t],\n\tEnums: [\n\t\t${finalEnums}\n\t],\n\tClasses: [\n\t\t${finalClasses}\n\t]\n}`)
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
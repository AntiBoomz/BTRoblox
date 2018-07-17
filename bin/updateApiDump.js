"use strict"

// https://raw.githubusercontent.com/CloneTrooper1019/Roblox-Client-Watch/master/API_Dump.json


window.data = JSON.parse(document.body.textContent)
window.toDict = (...args) => { const obj = {}; args.forEach(key => obj[key] = true); return obj }
window.invalidClasses = toDict(
	"Player", "DebuggerBreakpoint", "DebuggerWatch", "FunctionalTest",
	"ButtonBindingWidget", "InputObject", "Mouse", "Pages", "Plugin", "PluginAction",
	"PluginManager", "GenericSettings", "StatsItem", "Toolbar", "ScriptDebugger",
	"GlobalDataStore", "NetworkMarker",

	// Deprecated stuff I don't really care about
	"CustomEvent", "CustomEventReceiver", "ReflectionMetadata", "ReflectionMetadataClasses",
	"ReflectionMetadataEnums", "ReflectionMetadataEvents", "ReflectionMetadataFunctions",
	"ReflectionMetadataItem", "ReflectionMetadataClass", "ReflectionMetadataEnum", "ReflectionMetadataEnumItem",
	"ReflectionMetadataMember", "ReflectionMetadataProperties", "ReflectionMetadataYieldFunctions",
	"StarterGear", "Feature",

	// Service level stuff
	"ServiceProvider", "NetworkPeer"
)
window.invalidProps = toDict(
	"formFactor", "className", "archivable", "angularvelocity", "maxTorque", "force", "cframe", "maxForce", 
	"position", "location", "velocity", "maxHealth", "brickColor", "size"
)
window.classes = {}
window.enumDict = {}
window.validClasses = []
window.validEnums = []
window.validEnumIndexDict = {}
window.validCats = ["Data"]

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
		if(y.MemberType !== "Property") { return }
		if(invalidProps[y.Name]) { return }

		let catId = validCats.indexOf(y.Category)
		if(catId === -1) { catId = validCats.push(y.Category) - 1 }

		const enumInfo = enumDict[y.ValueType]
		if(enumInfo) {
			let enumId = validEnumIndexDict[y.ValueType]
			if(typeof enumId !== "number") {
				enumId = validEnumIndexDict[y.ValueType] = validEnums.push(enumInfo) - 1
			}

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

	let anc = superclass
	while(anc && (anc.Invalid || anc.Empty)) { anc = anc.Superclass }
	x.SubIndex = anc ? anc.Index : undefined
	x.Empty = validMembers.length === 0

	if(!x.Empty || anc && !anc.Empty && anc.Index !== 0) {
		x.Index = validClasses.push(x) - 1
	}
})

window.finalClasses = validClasses.map(x => `["${x.Name}"${x.SubIndex ? `,${x.SubIndex}` : ""}${x.Empty ? "" : `,{${x.ValidMembers.map(y => `${y.Name}:${"Enum" in y ? `[${y.Enum ? `${y.Cat || ""},${y.Enum}` : ""}]` : `${y.Cat}`}`).join(",")}}`}]`).join(",\n")
window.finalEnums = validEnums.map(x => `["${x.Name}",${x.Items.sort((a, b) => a.Value - b.Value)[x.Items.length - 1].Value < x.Items.length * 4 ? `[${x.Items.map((y, yi) => `"${y.Name}"${",".repeat((x.Items[yi + 1] || y).Value - y.Value)}`).join("")}]` : `{${x.Items.map(y => `${y.Value}:"${y.Name}"`).join(",")}}`}]`).join(",\n")
window.finalCats = `["${validCats.join(`","`)}"]`

console.log(`const Data = {\n\tCategories: ${finalCats},\n\tEnums: [\n${finalEnums.replace(/(^|\n)/g, "$1\t\t")}\n\t],\n\tClasses: [\n${finalClasses.replace(/(^|\n)/g, "$1\t\t")}\n\t]\n}`)
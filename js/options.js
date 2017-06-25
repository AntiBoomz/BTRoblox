"use strict"

var BackgroundJS = {
	_listeners: {},
	_reqCounter: 0,
	_started: false,
	_start: function() {
		if(this._started) return;
		this._started = true
		this._port = chrome.runtime.connect({ name: "optionsScript" })

		this._port.onMessage.addListener((msg) => {
			if(!(msg instanceof Object) || typeof(msg.action) !== "string")
				return;

			var list = this._listeners[msg.action]
			if(list) {
				for(var i=0; i < list.length; i++) {
					var listener = list[i]
					if(listener.once)
						list.splice(i--, 1);

					listener.callback(msg.data)
				}
			}
		})
	},

	send: function(action, data, callback) {
		if(typeof(data) == "function")
			callback = data, data = null;

		var uid = this._reqCounter++

		if(callback)
			this.listen("_response_" + uid, callback);

		this._port.postMessage({
			uid: uid,
			action: action,
			data: data
		})
	},

	listen: function(actionList, callback, once) {
		actionList.split(" ").forEach((action) => {
			if(!this._listeners[action])
				this._listeners[action] = [];

			this._listeners[action].push({
				callback: callback,
				once: once
			})
		})
	}
}; BackgroundJS._start();


var dict = {
	general: "General",
	general_theme: {
		label: "Select Your Theme",
		type: "dropdown",
		values: [
			{value:"default",label:"Default"},
			//{value:"dark",label:"Dark"},
			{value:"simblk",label:"Simply Black"},
			{value:"sky",label:"Sky"},
			{value:"red",label:"Red"}
		]
	},
	general_showBlogFeed: "Add Blog Feed to Sidebar",
	general_showAds: "Show Ads",
	general_noHamburger: "Keep Sidebar Open",
	general_chatEnabled: "Show Chat",

	chat: "Chat Changes",
	chat_enabled: "Enabled",

	profile: "Profile Changes",
	profile_enabled: "Enabled",
	profile_embedInventoryEnabled: "Embed Inventory",

	inventory: "Inventory Changes",
	inventory_inventoryTools: "Inventory Tools",

	versionhistory: "Version History Changes",
	versionhistory_enabled: "Enabled",

	groups: "Groups Changes",
	groups_enabled: "Enabled",
	groups_shoutAlerts: "Group Shout Notifications",

	gamedetails: "Game Details Page Changes",
	gamedetails_enabled: "Enabled",
	gamedetails_showBadgeOwned: "Highlight Owned Badges",

	catalog: "Catalog Changes",
	catalog_enabled: "Enabled",
	
	itemdetails: "Item Details Changes",
	itemdetails_animationPreview: "Animation Previewer",
	itemdetails_animationPreviewAutoLoad: "Auto-Load Animation Previewer"
}

var ul = html`<ul></ul>`
$("#btr-content-basic").append(ul)

BackgroundJS.send("getSettings", settings => {
	forEach(settings, (group, groupName) => {
		var header = html`<li><h2>${dict[groupName]||groupName}</h2></li>`
		var list = html`<ul></ul>`

		ul.append(header)
		ul.append(list)

		forEach(group, (value, index) => {
			var id = groupName + "_" + index

			var data = dict[id]
			
			var item = html`<li></li>`
			var label = html`<label for="${id}">${data ? (data instanceof Object ? data.label : data) : id}</label>`

			list.append(item)
			item.append(label)

			var type = data instanceof Object && data.type || typeof(value)

			if(type === "boolean") {
				var input = html`<input type="checkbox" class="btr-option btr-option-checkbox" id="${id}">`
				input.checked = value
				input.$on("change", e => {
					console.log(e)
					group[index] = e.target.checked
					BackgroundJS.send("setSetting", settings)
				})

				item.prepend(input)
			} else if(type === "dropdown") {
				var select = html`<select class='btr-option btr-option-select' id="${id}"></select>`

				data.values.forEach((v,i) => {
					select.append(html`<option value="${v.value}">${v.label}</option>`)
				})

				select.value = value
				select.$on("change", e => {
					group[index] = e.target.value
					BackgroundJS.send("setSetting", settings)
				})
				
				item.prepend(select)
			}
		})
	})
})

$("#btr-content").$on("mousewheel", e => {
	var deltaY = e.deltaY
	var target = e.currentTarget

	if((deltaY > 0 && target.scrollTop === target.scrollHeight - target.clientHeight) || (deltaY < 0 && target.scrollTop === 0)) {
		return false
	}
})


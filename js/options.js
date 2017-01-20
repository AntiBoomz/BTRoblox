var BackgroundJS = {
	_listeners: {},

	send: function(action, data, callback) {
		if(typeof(data) == "function")
			callback = data, data = null;

		chrome.runtime.sendMessage({
			action: action,
			data: data
		}, callback)
	},

	listen: function(actionList, callback) {
		if(!this._listenerAdded) {
			this._listenerAdded = true

			chrome.runtime.onMessage.addListener((msg, sender, respond) => {
				if(this._listeners[msg.action]) {
					this._listeners[msg.action].forEach((fn) => fn(msg.data, respond));
				}
			})
		}

		actionList.split(" ").forEach((action) => {
			if(!this._listeners[action])
				this._listeners[action] = [];

			this._listeners[action].push(callback)
		})
	}
}


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
	general_draggableAssets: "Draggable Studio Assets",

	chat: "Chat Changes",
	chat_enabled: "Enabled",

	character: "Wardrobe Changes",
	character_enabled: "Enabled",

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
	catalog_audioPlayButton: "Playable Audio On Search Page",
	catalog_animationPreview: "Animation Previewer"
}

var ul = $("<ul/>").appendTo("#btr-content-basic")

BackgroundJS.send("getSettings",function(settings) {
	for(var sett in settings) {
		var header = $("<li><h2>{0}</h2></li>").elemFormat(dict[sett]||sett).appendTo(ul);
		var list = $("<ul/>").appendTo(ul);
		var t = settings[sett];

		$.each(t,function(x,v) {
			var name = sett;
			var v = t[x];
			var id = name+"_"+x;
			var li = $("<li/>").appendTo(list);
			var data = dict[id];
			var la = $("<label for='{0}'>{1}</label>").elemFormat(id,typeof(data)=="string"?data:typeof(data)=="object"&&data.label||id).appendTo(li);
			var type = typeof(data)=="object"&&data.type||typeof(v)

			if(type=="boolean") {
				$("<input type='checkbox' class='btr-option btr-option-checkbox' id='{0}'>")
					.elemFormat(id)
					.prop("checked",v)
					.prependTo(li)
					.on("change",function() {
						settings[name][x] = this.checked;
						BackgroundJS.send("setSetting",settings);
					});
			} else if(type=="dropdown") {
				var select = $("<select class='btr-option btr-option-select' id='{0}'/>")
					.val(v)
					.elemFormat(id)
					.prependTo(li)
					.on("change",function() {
						settings[name][x] = select.val();
						BackgroundJS.send("setSetting",settings);
					});

				for(var i=0;i<data.values.length;i++) {
					$("<option/>").attr("value",data.values[i].value).text(data.values[i].label).appendTo(select);
				}

				select.val(v);
			}
		});
	}
})




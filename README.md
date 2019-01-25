BTROBLOX
========

BTRoblox, or Better Roblox, is an extension that aims to enhance Roblox website's look and functionality by adding a plethora of new features and modifying the layout of some existing pages.

Installation
------------
<a href="https://chrome.google.com/webstore/detail/btroblox/hbkpclpemjeibhioopcebchdmohaieln" title="Available in the Chrome Web Store"><img src="/img/ChromeWebStore_BadgeWBorder_v2_206x58.png"></a>&nbsp;&nbsp;&nbsp;<a href="https://addons.mozilla.org/en-US/firefox/addon/btroblox/" title="Get the add-on from the Firefox Add-ons store"><img src="/img/AMO-button_1.png"></a>

Other stuff
-----------

* [Roblox Mesh Format (wiki)](http://wiki.roblox.com/index.php?title=Roblox_Mesh_Format) <!--Backup: https://pastebin.com/yCknWRaj-->
* [Roblox Web Apis by Seranok](https://github.com/matthewdean/roblox-web-apis)
* [API Docs](#api-docs)
* [Undocumented APIs](#undocumented-apis)
    * [Friend APIs](#friend-apis)
    * [User APIs](#user-apis)
    * [Group APIs](#group-apis)
    * [Asset APIs](#asset-apis)
    * [Place APIs](#place-apis)
    * [Universe APIs](#universe-apis)


API Docs
========

* https://abtesting.roblox.com/docs (empty)
* https://abuse.roblox.com/docs (offline)
* https://accountsettings.roblox.com/docs
* https://ads.roblox.com/docs (broken)
* https://api.roblox.com/docs
* https://assetdelivery.roblox.com/docs
* https://auth.roblox.com/docs
* https://avatar.roblox.com/docs
* https://badges.roblox.com/docs
* https://billing.roblox.com/docs
* https://captcha.roblox.com/docs (empty)
* https://catalog.roblox.com/docs
* https://chat.roblox.com/docs
* https://clientsettings.roblox.com/docs (empty)
* https://develop.roblox.com/docs
* https://followings.roblox.com/docs
* https://friends.roblox.com/docs
* https://gameinternationalization.roblox.com/docs
* https://gamejoin.roblox.com/docs (empty)
* https://games.roblox.com/docs
* https://gamepersistence.roblox.com/docs (empty)
* https://groups.roblox.com/docs
* https://inventory.roblox.com/docs
* https://locale.roblox.com/docs
* https://notifications.roblox.com/docs
* https://points.roblox.com/docs
* https://presence.roblox.com/docs
* https://publish.roblox.com/docs
* https://textfilter.roblox.com/docs (empty)
* https://thumbnails.roblox.com/docs
* https://translations.roblox.com/docs (offline)

<!--
#### Roblox Subdomains
* https://roblox.com/
* https://abuse.roblox.com/
* https://affiliates.roblox.com/
* https://api.roblox.com/
    * https://clientsettings.api.roblox.com/
    * https://ephemeralcounters.api.roblox.com/
* https://assetgame.roblox.com/
* https://auth.roblox.com/
* https://avatar.roblox.com/
* https://blog.roblox.com/
* https://bloxcon.roblox.com/
* https://careers.roblox.com/
* https://chat.roblox.com/
* https://community.roblox.com/
* https://confluence.roblox.com/
* https://corp.roblox.com/
* https://data.roblox.com/
* http://de.roblox.com/
* https://develop.roblox.com/
* http://developer.roblox.com/
* https://ecsv2.roblox.com/
* https://en.help.roblox.com/
* http://es.roblox.com/
* https://forum.roblox.com/
* http://fr.roblox.com/
* https://gamepersistence.roblox.com/
* http://help.roblox.com/
* https://inventory.roblox.com/
* https://jira.roblox.com/
* https://job.roblox.com/
* https://jobs.roblox.com/
* http://js.roblox.com/
* https://m.roblox.com/
* http://mail.roblox.com/
* https://misc.roblox.com/
* https://news.roblox.com/
* https://nl.roblox.com/
* https://notifications.roblox.com/
* https://partners.roblox.com/
* http://polls.roblox.com/
* http://pt.roblox.com/
* https://publish.roblox.com/
* https://realtime.roblox.com/
* https://sales.roblox.com/
* https://search.roblox.com/
* http://setup.roblox.com/
* http://shop.roblox.com/
* http://social.roblox.com/
* https://static.roblox.com/
* http://uk.roblox.com/
* https://web.roblox.com/
* http://wiki.roblox.com/
* https://www.roblox.com/

#### Robloxlabs Subdomains
* https://www.gametest1.robloxlabs.com/
* https://www.gametest2.robloxlabs.com/
* https://www.gametest3.robloxlabs.com/
* https://www.gametest4.robloxlabs.com/
* https://www.gametest5.robloxlabs.com/
* https://www.sitetest1.robloxlabs.com/
* https://www.sitetest2.robloxlabs.com/
* https://www.sitetest3.robloxlabs.com/
-->

Undocumented APIs
=================


Friend APIs
-----------
#### Get status of online friends
* https://api.roblox.com/my/friendsonline
    ```json
    [
        {
            "VisitorId": 261,
            "GameId": null,
            "IsOnline": true,
            "LastOnline": "2017-04-05T13:30:22.7503794-05:00",
            "LastLocation": "Mobile Website",
            "LocationType": 0,
            "PlaceId": null,
            "UserName": "Shedletsky"
        },
        {
            "VisitorId": 262,
            "GameId": null,
            "IsOnline": true,
            "LastOnline": "2017-04-05T13:17:56.6780147-05:00",
            "LastLocation": "Online",
            "LocationType": 2,
            "PlaceId": null,
            "UserName": "pescatello"
        },
        {
            "VisitorId": 263,
            "GameId": null,
            "IsOnline": true,
            "LastOnline": "2017-04-05T13:29:21.7378218-05:00",
            "LastLocation": "Creating Crossroads",
            "LocationType": 3,
            "PlaceId": null,
            "UserName": "tklbckekskl"
        },
        {
            "VisitorId": 264,
            "GameId": "f35b6d10-1864-4b3a-a77c-fa7f0661c9ce",
            "IsOnline": true,
            "LastOnline": "2017-04-05T13:29:23.0887607-05:00",
            "LastLocation": "Playing Crossroads",
            "LocationType": 4,
            "PlaceId": 1818,
            "UserName": "wex"
        }
    ]
    ```


Home APIs
---------
* https://www.roblox.com/home/recently-visited-places
* https://www.roblox.com/user/favorites/places

#### Friend Activity
* https://www.roblox.com/games?SortFilter=17&TimeFilter=0



User APIs
---------
#### Get currently logged in user
* https://www.roblox.com/game/GetCurrentUser.ashx
    ```json
    4719353
    ```

#### Get presence of an user
* https://www.roblox.com/presence/user?userId=261
    ```json
    {
        "UserPresenceType": 0,
        "LastLocation": "Website",
        "AbsolutePlaceUrl": null,
        "PlaceId": null,
        "GameId": null,
        "IsGamePlayableOnCurrentDevice": false,
        "UserId": 261,
        "EndpointType": "Presence"
    }
    ```

#### Get presence of multiple users
* https://www.roblox.com/presence/users?userIds=261&userIds=4719353&userIds=13645&userIds=5736873
    ```json
    [
        {
            "UserPresenceType": 0,
            "LastLocation": "Offline",
            "AbsolutePlaceUrl": null,
            "PlaceId": null,
            "GameId": null,
            "IsGamePlayableOnCurrentDevice": false,
            "UserId": 261,
            "EndpointType": "Presence"
        },
        {
            "UserPresenceType": 1,
            "LastLocation": "Online",
            "AbsolutePlaceUrl": null,
            "PlaceId": null,
            "GameId": null,
            "IsGamePlayableOnCurrentDevice": false,
            "UserId": 4719353,
            "EndpointType": "Presence"
        },
        {
            "UserPresenceType": 2,
            "LastLocation": "Playing Jailbreak",
            "AbsolutePlaceUrl": null,
            "PlaceId": 606849621,
            "GameId": "b44569db-8c5f-4a4c-b6ee-e3f8aa4486ce",
            "IsGamePlayableOnCurrentDevice": true,
            "UserId": 13645,
            "EndpointType": "Presence"
        },
        {
            "UserPresenceType": 3,
            "LastLocation": "Creating Welcome to ROBLOX Building",
            "AbsolutePlaceUrl": null,
            "PlaceId": 41324860,
            "GameId": null,
            "IsGamePlayableOnCurrentDevice": true,
            "UserId": 1,
            "EndpointType": "Presence"
        }
    ]
    ```

#### Get groups of an user
* https://www.roblox.com/users/profile/playergroups-json?userId=4719353
    ```json
    {
        "NumberOfGroups": 11,
        "Groups": [
            {
                "Id": 1012168,
                "AgentId": 53447039,
                "Name": "Studio Aurora",
                "EmblemId": 233176697,
                "Description": "We make games.\r\n\r\nWant to see other great studios? Take a look in our allies tab.\r\n\r\nBranch Groups:\r\nAurora Australis: https://www.roblox.com/My/Groups.aspx?gid=2664663\r\n\r\nOur Games:\r\nHeroes\u0027 Legacy: https://www.roblox.com/My/Groups.aspx?gid=1173357\r\nYggdrasil: https://www.roblox.com/games/361122402/Yggdrasil\r\nTales from the Valley: https://www.roblox.com/games/503506257/Tales-from-the-Valley",
                "GroupUrl": "https://www.roblox.com/groups/group.aspx?gid=1012168",
                "Rank": "Developer",
                "Members": 190,
                "IsPrimary": true,
                "GroupThumbnailWidth": 150,
                "GroupThumbnailHeight": 150,
                "Emblem": {
                    "Final": true,
                    "Url": "https://t4.rbxcdn.com/97833c42fc66b82229ba52cace239ceb",
                    "RetryUrl": "",
                    "IsApproved": false
                }
            },
            ...
        ],
        "ProfileLangResources": {
            "ActionAccept": "Accept",
            "ActionAddFriend": "Add Friend",
            "ActionBlockUser": "Block User",
            ...
        }
    }
    ```

### Get collections of an user
* https://www.roblox.com/users/profile/robloxcollections-json?userId=4719353
    ```json
    {
        "CollectionsItems": [
            {
                "AssetSeoUrl": "https://www.roblox.com/catalog/20721282/Pwnda",
                "Thumbnail": {
                    "Final": true,
                    "Url": "https://t6.rbxcdn.com/eccdbdd489e9307deb03371e07d30f90",
                    "RetryUrl": null,
                    "UserId": 0,
                    "EndpointType": "Avatar"
                },
                "Name": "Pwnda",
                "FormatName": null,
                "Description": "You think you\u0027re tough? He eats Punji sticks for breakfast.",
                "AssetRestrictionIcon": {
                    "TooltipText": "Serialized limited release, resellable.",
                    "CssTag": "limited-unique",
                    "LoadAssetRestrictionIconCss": false,
                    "HasTooltip": false
                }
            }
        ]
    }
    ```

### Get player badges of an user
* https://www.roblox.com/users/profile/playerassets-json?assetTypeId=21&userId=4719353
    * Was made to be used in profiles, so only shows first 6 badges
    ```json
    {
        "Title": "Player Badges",
        "Label": "badges",
        "ModalAssetViewType": 1,
        "MaxNumberOfVisibleAssets": 6,
        "Assets": [
            {
                "AssetSeoUrl": "https://www.roblox.com/library/1622555285/1-Million-Money",
                "Thumbnail": {
                    "Final": true,
                    "Url": "https://t4.rbxcdn.com/ae0f12952957dde734e84bb858928629",
                    "RetryUrl": null,
                    "UserId": 0,
                    "EndpointType": "Avatar"
                },
                "Name": "1 Million Money",
                "FormatName": null,
                "Description": "You have made 💰1,000,000 in Metal Detecting Simulator! Congrats! 🤑",
                "AssetRestrictionIcon": null
            },
            ...
        ],
        "UserId": 4719353,
        "IsSeeAllHeaderButtonVisible": true,
        "AssetTypeInventoryUrl": "https://www.roblox.com/users/4719353/inventory/#!/badges",
        "ProfileLangResources": {
            "ActionAccept": "Accept",
            "ActionAddFriend": "Add Friend",
            "ActionBlockUser": "Block User",
            ...
        }
    }
    ```

### Get games on an user's profile
* https://www.roblox.com/users/profile/playergames-json?userId=4719353
    ```json
    {
        "Title": "Games",
        "Games": [
            {
                "CreatorID": 0,
                "CreatorName": "AntiBoomz0r",
                "CreatorAbsoluteUrl": "https://www.roblox.com/users/4719353/profile",
                "Plays": 70806,
                "Price": 0,
                "ProductID": 0,
                "IsOwned": false,
                "IsVotingEnabled": true,
                "TotalUpVotes": 1102,
                "TotalDownVotes": 93,
                "TotalBought": 0,
                "UniverseID": 71178001,
                "HasErrorOcurred": false,
                "Favorites": 3119,
                "Description": "A very much Work In Progress (WIP) project that I work on whenever I happen to have a small sliver of motivation.\r\n\r\nNew stuff:\r\nTesting a map made out of triangles - Leave your experiences in the comment section (Was it laggy, did it make A!R nicer to play et cetera)\r\n\r\nNew controls\r\nBarrel rolling! Press A or D\r\n\r\n\r\nControls:\r\nW - Increase throttle\r\nS - Decrease throttle\r\nA/D - Barrel roll\r\nM - Mute/Unmute music\r\nMouse - Movement\r\n\r\nThis game not your style? Check out Score Squadron by GollyGreg!\r\nhttp://www.roblox.com/Score-Squadron-place?id=154544998",
                "GameDetailReferralUrl": "https://www.roblox.com/games/refer?PlaceId=150810024\u0026Position=1\u0026PageType=Profile",
                "Thumbnail": {
                    "Final": true,
                    "Url": "https://t0.rbxcdn.com/47d0bf07cca42d1a31d5947c273c0935",
                    "RetryUrl": null,
                    "UserId": 0,
                    "EndpointType": "Avatar"
                },
                "UseDataSrc": false,
                "IsAsyncThumbnailEnabled": false,
                "GamePageResources": null,
                "Name": "A!R - Fly \u0026 Fight [WIP]",
                "PlaceID": 150810024,
                "PlayerCount": 0,
                "ImageId": 0,
                "IsSecure": false,
                "ShowExperimentalMode": false
            },
            ...
        ],
        "ModalAssetViewType": 4,
        "ProfileLangResources": {
            "ActionAccept": "Accept",
            "ActionAddFriend": "Add Friend",
            "ActionBlockUser": "Block User",
            ...
        },
        "GamePageResources": {
            "abelFilterDefault": "Default",
            "ActionDisableExperimentalMode": "Disable",
            "ActionSeeAll": "See All",
            ...
        }
    }
    ```

Group APIs
-------------
#### Get role name of an user
* https://www.roblox.com/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRole&playerid=4719353&groupid=1012168
    ```
    Developer
    ```

#### Get thumbnails of groups
* https://www.roblox.com/group-thumbnails?params=[{groupId:1},{groupId:2}]
    ```json
    [
        {
            "id": 1,
            "name": "RobloHunks",
            "url": "https://www.roblox.com/groups/group.aspx?gid=1",
            "thumbnailFinal": true,
            "thumbnailUrl": "https://t1.rbxcdn.com/35db675b35e9d79e4730d71dab543e2e"
        },
        {
            "id": 2,
            "name": "LOL",
            "url": "https://www.roblox.com/groups/group.aspx?gid=2",
            "thumbnailFinal": true,
            "thumbnailUrl": "https://t0.rbxcdn.com/36a1764ae8afc4ee40a4582f2c6a069b"
        }
    ]
    ```


Asset APIs
-------------
#### Get source of a linkedscript
* https://www.roblox.com/asset/?universeId=265920480&assetName=Scripts/Init


Place APIs
-------------
#### Get place details
* https://www.roblox.com/places/api-get-details?assetId=606849621
    ```json
    {
        "AssetId": 606849621,
        "Name": "🚂 BETTER TRAINS! Jailbreak ",
        "Description": "Last week we added a sewer escape and more! THIS WEEK we\u0027ve got a surprise, BETTER TRAINS! \r\n- No/Less sliding! 😃\r\n- Better performance! ⚡️\r\n- Longer trains! 🚂🚃🚃🚃\r\n- No flinging! 🚀\r\n- No more drifting trains! Stays on track! 🛤\r\n\r\n💰 This summer, expect a new place to rob in Jailbreak! Coming soon! \r\n\r\nWelcome to Jailbreak! Live the life of a Police Officer or a Criminal. Stop crimes or cause them. Uphold the law or break the law. In this world, the choice is yours. \r\n\r\nFollow us on Twitter for EARLY update information! \r\n@asimo3089\r\n@badccvoid \r\n@badimo \r\n\r\nJoin our group to know right when we upload future updates and events! https://www.roblox.com/My/Groups.aspx?gid=3059674 \r\n\r\nThumbnails by @ID0ntHaveAUse \r\nIcon/Thumbnails by @RBLXcrackop",
        "Created": "1/9/2017",
        "Updated": "5/26/2018",
        "FavoritedCount": 5933844,
        "Url": "https://www.roblox.com/games/606849621/BETTER-TRAINS-Jailbreak",
        "ReportAbuseAbsoluteUrl": "https://www.roblox.com/abusereport/asset?id=606849621\u0026RedirectUrl=%2fgames%2f606849621%2fBETTER-TRAINS-Jailbreak",
        "IsFavoritedByUser": true,
        "IsFavoritesUnavailable": false,
        "UserCanManagePlace": false,
        "VisitedCount": 1374993708,
        "MaxPlayers": 26,
        "Builder": "Badimo",
        "BuilderId": 210085248,
        "BuilderAbsoluteUrl": "https://www.roblox.com/groups/group.aspx?gid=3059674",
        "IsPlayable": true,
        "ReasonProhibited": "None",
        "ReasonProhibitedMessage": "None",
        "IsBuildersClubOnly": false,
        "IsCopyingAllowed": false,
        "BuildersClubOverlay": "None",
        "PlayButtonType": "FancyButtons",
        "AssetGenre": "Town and City",
        "AssetGenreViewModel": {
            "DisplayName": "Town and City",
            "Id": 7
        },
        "OnlineCount": 48219,
        "UniverseId": 245662005,
        "UniverseRootPlaceId": 606849621,
        "TotalUpVotes": 1799706,
        "TotalDownVotes": 209951,
        "UserVote": true,
        "OverridesDefaultAvatar": false,
        "UsePortraitMode": false,
        "IsExperimental": false,
        "Price": 0
    }
    ```


Universe APIs
-------------
#### Get info about an universe
* https://api.roblox.com/universes/get-info?universeId=13058
    * Also accepts `placeId`

    ```json
    {
        "Name": "Crossroads",
        "Description": "The classic ROBLOX level is back!",
        "RootPlace": 1818,
        "StudioAccessToApisAllowed": false,
        "CurrentUserHasEditPermissions": false,
        "UniverseAvatarType": "MorphToR6"
    }
    ```

#### Get assets in an universe
* https://api.roblox.com/universes/get-aliases?universeId=265920480&page=1
    * Requires studio access to the universe

    ```json
    {
        "FinalPage": true,
        "Aliases": [{
            "Name": "Scripts/Init",
            "Type": 1,
            "TargetId": 718028943,
            "Asset": {
                "Id": 718028943,
                "TypeId": 5,
                "Name": "Script",
                "Description": "Script",
                "CreatorType": 1,
                "CreatorTargetId": 4719353,
                "Created": "2017-03-31T12:16:46.547",
                "Updated": "2017-08-29T08:50:09.317"
            },
            "Version": null
        }],
        "PageSize": 50
    }
    ```

#### Get places in an universe
* https://api.roblox.com/universes/get-universe-places?universeId=13058&page=1
    * Also accepts `placeId`

    ```json
    {
        "FinalPage": true,
        "RootPlace": 1818,
        "Places": [
            {
                "PlaceId": 1818,
                "Name": "Classic: Crossroads"
            }
        ],
        "PageSize": 50
    }
    ```

#### Get universe containing place
* https://api.roblox.com/universes/get-universe-containing-place?placeid=1818

    ```json
    {
        "UniverseId": 13058
    }
    ```


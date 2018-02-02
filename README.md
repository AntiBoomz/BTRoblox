BTROBLOX
========

* [Roblox Mesh Format (wiki)](http://wiki.roblox.com/index.php?title=Roblox_Mesh_Format)
<!--Backup: https://pastebin.com/yCknWRaj-->
* [API Docs](#api-docs)
* [Undocumented APIs](#undocumented-apis)
    * [Friend APIs](#friend-apis)
    * [User APIs](#user-apis)
    * [Asset APIs](#asset-apis)
    * [Universe APIs](#universe-apis)


API Docs
========

* https://accountsettings.roblox.com/docs
* https://api.roblox.com/docs
* https://auth.roblox.com/docs
* https://avatar.roblox.com/docs
* https://billing.roblox.com/docs
* https://chat.roblox.com/docs
* https://develop.roblox.com/docs
* https://games.roblox.com/docs/
* https://groups.roblox.com/docs
* https://inventory.roblox.com/docs
* https://notifications.roblox.com/docs

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
            "PlaceId": null
        },
        {
            "VisitorId": 262,
            "GameId": null,
            "IsOnline": true,
            "LastOnline": "2017-04-05T13:17:56.6780147-05:00",
            "LastLocation": "Website",
            "LocationType": 2,
            "PlaceId": null
        },
        {
            "VisitorId": 263,
            "GameId": null,
            "IsOnline": true,
            "LastOnline": "2017-04-05T13:29:21.7378218-05:00",
            "LastLocation": "Studio - Crossroads",
            "LocationType": 3,
            "PlaceId": null
        },
        {
            "VisitorId": 264,
            "GameId": "f35b6d10-1864-4b3a-a77c-fa7f0661c9ce",
            "IsOnline": true,
            "LastOnline": "2017-04-05T13:29:23.0887607-05:00",
            "LastLocation": "Crossroads",
            "LocationType": 4,
            "PlaceId": 1818
        }
    ]
    ```


User APIs
---------
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

#### Profile Stuff
* https://www.roblox.com/users/profile/playergroups-json?userId=4719353
* https://www.roblox.com/users/profile/robloxcollections-json?userId=4719353
* https://www.roblox.com/users/profile/playerassets-json?assetTypeId=21&userId=4719353


Asset APIs
-------------
#### Get source of a linkedscript
* https://www.roblox.com/asset/?universeId=265920480&assetName=Scripts/Init


Place APIs
-------------
#### Get badges for a place
* https://www.roblox.com/badges/list-badges-for-place?placeId=606849621
    ```json
    {
        "PlaceId": 606849621,
        "GameBadges": [
            {
                "BadgeAssetId": 958186367,
                "IsOwned": false,
                "Rarity": 0.001,
                "RarityName": "Impossible",
                "TotalAwarded": 51447,
                "TotalAwardedYesterday": 406,
                "Created": "\/Date(1501819242473)\/",
                "Updated": "\/Date(1502000310663)\/",
                "AssetSeoUrl": "https://www.roblox.com/catalog/958186367/Most-Valuable-Player-MVP",
                "CreatorId": 210085248,
                "Thumbnail": {
                    "Final": false,
                    "Url": "https://t1.rbxcdn.com/2f0ab14d980657742dfbe8d54745672a",
                    "RetryUrl": null,
                    "UserId": 0,
                    "EndpointType": "Avatar"
                },
                "Name": "Most Valuable Player (MVP)",
                "FormatName": null,
                "Description": "The rarest badge of them all! Obtain all other badges for this MVP badge. You\u0027ll also get an exclusive wheel for any of your vehicles!",
                "AssetRestrictionIcon": null
            }
        ]
    }
    ```


Universe APIs
-------------
#### Get info about an universe
* https://api.roblox.com/universes/get-info?universeId=13058
    * Also accepts `placeId`
    * Requires `User-Agent: Roblox/WinInet` header

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
    * Requires `User-Agent: Roblox/WinInet` header
    * Requires studio access to the universe

    ```json
    {
        "FinalPage": true,
        "Aliases": [
            {
                "Name": "Scripts/Init",
                "Type": 1,
                "TargetId": 718028943,
                "Asset": {
                    "TypeId": 5,
                    "Name": "Script",
                    "Description": "Script",
                    "CreatorType": 1,
                    "CreatorTargetId": 4719353,
                    "Created": "2017-03-31T12:16:46.547",
                    "Updated": "2017-03-31T15:36:22.55",
                    "Id": 718028943,
                    "DomainFactories": {
                        "AssetTypeFactory": {},
                        "AssetFactory": {},
                        "AssetVersionFactory": {},
                        "RawContentFactory": {},
                        "AssetReviewAccessor": {},
                        "AliasFactory": {},
                        "BadgeTypeFactory": {},
                        "AnimationFactory": {},
                        "ArmsFactory": {},
                        "AudioFactory": {},
                        "BackAccessoryFactory": {},
                        "BadgeFactory": {},
                        "BadgeGiverFactory": {},
                        "DecalFactory": {},
                        "FaceAccessoryFactory": {},
                        "FaceFactory": {},
                        "FrontAccessoryFactory": {},
                        "GamePassFactory": {},
                        "GearFactory": {},
                        "HairAccessoryFactory": {},
                        "HatFactory": {},
                        "HeadFactory": {},
                        "HtmlFactory": {},
                        "ImageFactory": {},
                        "LeftArmFactory": {},
                        "LeftLegFactory": {},
                        "LegsFactory": {},
                        "LuaFactory": {},
                        "MeshFactory": {},
                        "MeshPartFactory": {},
                        "ModelFactory": {},
                        "NeckAccessoryFactory": {},
                        "PackageFactory": {},
                        "PantsFactory": {},
                        "PlaceFactory": {},
                        "PluginFactory": {},
                        "RightArmFactory": {},
                        "RightLegFactory": {},
                        "ShirtFactory": {},
                        "ShoulderAccessoryFactory": {},
                        "SolidModelFactory": {},
                        "TeeShirtFactory": {},
                        "TextFactory": {},
                        "TorsoFactory": {},
                        "WaistAccessoryFactory": {},
                        "YouTubeVideoFactory": {},
                        "ClimbAnimationFactory": {},
                        "DeathAnimationFactory": {},
                        "FallAnimationFactory": {},
                        "IdleAnimationFactory": {},
                        "JumpAnimationFactory": {},
                        "RunAnimationFactory": {},
                        "SwimAnimationFactory": {},
                        "WalkAnimationFactory": {},
                        "PoseAnimationFactory": {}
                    }
                },
                "Version": null
            }
        ],
        "PageSize": 50
    }
    ```

#### Get places in an universe
* https://api.roblox.com/universes/get-universe-places?universeId=13058&page=1
    * Also accepts `placeId`
    * Requires `User-Agent: Roblox/WinInet` header

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
    * Requires `User-Agent: Roblox/WinInet` header

    ```json
    {
        "UniverseId": 13058
    }
    ```


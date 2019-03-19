<a href="https://chrome.google.com/webstore/detail/btroblox/hbkpclpemjeibhioopcebchdmohaieln" title="Available in the Chrome Web Store"><img src="/img/ChromeWebStore_BadgeWBorder_v2_206x58.png" alt="Available in the Chrome Web Store"></a>&nbsp;&nbsp;&nbsp;<a href="https://addons.mozilla.org/en-US/firefox/addon/btroblox/" title="Get the add-on from the Firefox Add-ons store"><img src="/img/AMO-button_1.png" alt="Get the add-on from the Firefox Add-ons store"></a>


BTROBLOX
========

BTRoblox, or Better Roblox, is an extension that aims to enhance Roblox website's look and functionality by adding a plethora of new features and modifying the layout of some existing pages.


Links
-----

* [Roblox Mesh Format (wiki)](https://developer.roblox.com/articles/Roblox-Mesh-Format) <!--Backup: https://pastebin.com/yCknWRaj-->
* [Roblox Web Apis by Seranok](https://github.com/matthewdean/roblox-web-apis)
* [API Docs](#api-docs)
* [Undocumented APIs](#undocumented-apis)


API Docs
========

| Domain | Description |
| -: | :- |
| [abtesting.roblox.com](https://abtesting.roblox.com/docs) | Endpoints for the A/B Testing framework |
| [abuse.roblox.com](https://abuse.roblox.com/docs) | This Api is temporarily offline. |
| [accountsettings.roblox.com](https://accountsettings.roblox.com/docs) | All endpoints for account/user settings. |
| [ads.roblox.com](https://ads.roblox.com/docs) | Ads configuration endpoints. |
| [api.roblox.com](https://api.roblox.com/docs) | Miscellaneous endpoints |
| [assetdelivery.roblox.com](https://assetdelivery.roblox.com/docs) | Serves asset content. |
| [auth.roblox.com](https://auth.roblox.com/docs) | All endpoints that tamper with authentication sessions. |
| [avatar.roblox.com](https://avatar.roblox.com/docs) | Endpoints relating to the customization of player avatars. |
| [badges.roblox.com](https://badges.roblox.com/docs) | Endpoints for badges and badge awards management. |
| [billing.roblox.com](https://billing.roblox.com/docs) | Real money transactions and interaction. |
| [captcha.roblox.com](https://captcha.roblox.com/docs) | Captcha Api Site |
| [catalog.roblox.com](https://catalog.roblox.com/docs) | Catalog items browsing and searching. Content and user based catalog items recommendations. |
| [chat.roblox.com](https://chat.roblox.com/docs) | All chat and party related endpoints. |
| [clientsettings.roblox.com](https://clientsettings.roblox.com/docs) | Used by various Roblox clients to retrieve configuration information. |
| [clientsettingscdn.roblox.com](https://clientsettingscdn.roblox.com/docs) | Used by various Roblox clients to retrieve configuration information. |
| [develop.roblox.com](https://develop.roblox.com/docs) | Game development configuration endpoints. |
| [economy.roblox.com](https://economy.roblox.com/docs) | Endpoints related to transactions and currency. |
| [followings.roblox.com](https://followings.roblox.com/docs) | Establishes follow relationship between subscriber entities (users, groups, etc) and source entities (games, groups, assets, etc.) |
| [friends.roblox.com](https://friends.roblox.com/docs) | Friends, followers, and contacts management. |
| [gameinternationalization.roblox.com](https://gameinternationalization.roblox.com/docs) | Manages internationalization of games such as translating in game content. |
| [gamejoin.roblox.com](https://gamejoin.roblox.com/docs) | All endpoints around launching a game. |
| [gamepersistence.roblox.com](https://gamepersistence.roblox.com/docs) | Endpoints for the in-game datastore system for storing data for games. |
| [games.roblox.com](https://games.roblox.com/docs) | All endpoints for game discovery, and details. |
| [groups.roblox.com](https://groups.roblox.com/docs) | Groups management. |
| [inventory.roblox.com](https://inventory.roblox.com/docs) | All endpoints for viewing (but not granting) ownership of items. |
| [locale.roblox.com](https://locale.roblox.com/docs) | User locale management. |
| [metrics.roblox.com](https://metrics.roblox.com/docs) | Record metrics across Roblox. |
| [notifications.roblox.com](https://notifications.roblox.com/docs) | All notification stream endpoints. |
| [points.roblox.com](https://points.roblox.com/docs) | The web Api for the in-game PointsService. |
| [premiumfeatures.roblox.com](https://premiumfeatures.roblox.com/docs) | This API is for premium features and anything pertaining to account add ons |
| [presence.roblox.com](https://presence.roblox.com/docs) | All endpoints for managing presence. |
| [publish.roblox.com](https://publish.roblox.com/docs) | All endpoints handling file uploads. |
| [textfilter.roblox.com](https://textfilter.roblox.com/docs) | High volume text filtering. |
| [thumbnails.roblox.com](https://thumbnails.roblox.com/docs) | Endpoints for requesting thumbnails. |
| [translationroles.roblox.com](https://translationroles.roblox.com/docs) | Manages translation roles of developers in game localization. |
| [translations.roblox.com](https://translations.roblox.com/docs) | This Api is temporarily offline. |


Undocumented APIs
=================
* [User APIs](#user-apis)
* [Friend APIs](#friend-apis)
* [Group APIs](#group-apis)
* [Asset APIs](#asset-apis)
* [Place APIs](#place-apis)
* [Universe APIs](#universe-apis)
* [Home Page APIs](#home-page-apis)
* [Profile Page APIs](#profile-page-apis)


User APIs
---------
#### Get info about currently logged in user
* https://www.roblox.com/game/GetCurrentUser.ashx
    ```json
    261
    ```

* https://www.roblox.com/my/account/json
    ```json
    {
        "UserId": 261,
        "Name": "Shedletsky",
        "UserEmail": "d****@dummy.com",
        "IsEmailVerified": true,
        "AgeBracket": 0,
        "UserAbove13": true
    }
    ```

* https://api.roblox.com/users/account-info
    ```json
    {
        "UserId": 261,
        "Username": "Shedletsky",
        "HasPasswordSet": true,
        "Email": {
            "Value": "d****@dummy.com",
            "IsVerified": true
        },
        "AgeBracket": 0,
        "Roles": [],
        "MembershipType": 0,
        "RobuxBalance": 0,
        "NotificationCount": 0,
        "EmailNotificationEnabled": false,
        "PasswordNotificationEnabled": false,
        "CountryCode": "US"
    }
    ```

* https://www.roblox.com/my/settings/json
    ```json
    {
        "ChangeUsernameEnabled": true,
        "IsAdmin": false,
        "UserId": 261,
        "Name": "Shedletsky",
        "IsEmailOnFile": true,
        "IsEmailVerified": true,
        "IsPhoneFeatureEnabled": true,
        "RobuxRemainingForUsernameChange": 0,
        "PreviousUserNames": "",
        "UseSuperSafePrivacyMode": false,
        "IsSuperSafeModeEnabledForPrivacySetting": false,
        "UseSuperSafeChat": false,
        "IsAppChatSettingEnabled": true,
        "IsGameChatSettingEnabled": true,
        "IsAccountPrivacySettingsV2Enabled": true,
        "IsSetPasswordNotificationEnabled": false,
        "ChangePasswordRequiresTwoStepVerification": false,
        "ChangeEmailRequiresTwoStepVerification": false,
        "UserEmail": "d****@dummy.com",
        "UserEmailMasked": true,
        "UserEmailVerified": true,
        "CanHideInventory": true,
        "CanTrade": false,
        "MissingParentEmail": false,
        "IsUpdateEmailSectionShown": true,
        "IsUnder13UpdateEmailMessageSectionShown": false,
        "IsUserConnectedToFacebook": false,
        "IsTwoStepToggleEnabled": false,
        "AgeBracket": 0,
        "UserAbove13": true,
        "ClientIpAddress": "123.123.123.123",
        "AccountAgeInDays": 0,
        "IsOBC": false,
        "IsTBC": false,
        "IsAnyBC": false,
        "IsPremium": false,
        "IsBcRenewalMembership": false,
        "BcExpireDate": "\/Date(-0)\/",
        "BcRenewalPeriod": null,
        "BcLevel": null,
        "HasCurrencyOperationError": false,
        "CurrencyOperationErrorMessage": null,
        "BlockedUsersModel": {
            "BlockedUserIds": [156],
            "BlockedUsers": [{
                "uid": 156,
                "Name": "builderman"
            }],
            "MaxBlockedUsers": 50,
            "Total": 1,
            "Page": 1
        },
        "Tab": null,
        "ChangePassword": false,
        "IsAccountPinEnabled": true,
        "IsAccountRestrictionsFeatureEnabled": true,
        "IsAccountRestrictionsSettingEnabled": false,
        "IsAccountSettingsSocialNetworksV2Enabled": false,
        "IsUiBootstrapModalV2Enabled": true,
        "IsI18nBirthdayPickerInAccountSettingsEnabled": true,
        "InApp": false,
        "MyAccountSecurityModel": {
            "IsEmailSet": true,
            "IsEmailVerified": true,
            "IsTwoStepEnabled": true,
            "ShowSignOutFromAllSessions": true,
            "TwoStepVerificationViewModel": {
                "UserId": 261,
                "IsEnabled": true,
                "CodeLength": 0,
                "ValidCodeCharacters": null
            }
        },
        "ApiProxyDomain": "https://api.roblox.com",
        "AccountSettingsApiDomain": "https://accountsettings.roblox.com",
        "AuthDomain": "https://auth.roblox.com",
        "IsDisconnectFbSocialSignOnEnabled": true,
        "IsDisconnectXboxEnabled": true,
        "NotificationSettingsDomain": "https://notifications.roblox.com",
        "AllowedNotificationSourceTypes": ["Test", "FriendRequestReceived", "FriendRequestAccepted", "PartyInviteReceived", "PartyMemberJoined", "ChatNewMessage", "PrivateMessageReceived", "UserAddedToPrivateServerWhiteList", "ConversationUniverseChanged", "TeamCreateInvite", "GameUpdate", "DeveloperMetricsAvailable"],
        "AllowedReceiverDestinationTypes": ["DesktopPush", "NotificationStream"],
        "BlacklistedNotificationSourceTypesForMobilePush": [],
        "MinimumChromeVersionForPushNotifications": 50,
        "PushNotificationsEnabledOnFirefox": true,
        "LocaleApiDomain": "https://locale.roblox.com",
        "HasValidPasswordSet": true,
        "IsUpdateEmailApiEndpointEnabled": true,
        "FastTrackMember": null,
        "IsFastTrackAccessible": false,
        "HasFreeNameChange": false,
        "IsAgeDownEnabled": true,
        "IsSendVerifyEmailApiEndpointEnabled": true,
        "IsPromotionChannelsEndpointEnabled": true,
        "ReceiveNewsletter": false,
        "SocialNetworksVisibilityPrivacy": 6,
        "SocialNetworksVisibilityPrivacyValue": "AllUsers",
        "Facebook": null,
        "Twitter": "@Shedletsky",
        "YouTube": null,
        "Twitch": null
    }
    ```

#### Get online status of an user
* https://api.roblox.com/users/261/onlinestatus/
    ```json
    {
        "GameId": null,
        "IsOnline": false,
        "LastLocation": "Offline",
        "LastOnline": "2019-02-19T15:15:51.311703-06:00",
        "LocationType": 2,
        "PlaceId": null,
        "VisitorId": 261,
        "PresenceType": 0
    }
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
* https://www.roblox.com/presence/users?userIds=261&userIds=156
    ```json
    [
        {
            "UserPresenceType": 0,
            "LastLocation": "Website",
            "AbsolutePlaceUrl": null,
            "PlaceId": null,
            "GameId": null,
            "IsGamePlayableOnCurrentDevice": false,
            "UserId": 261,
            "EndpointType": "Presence"
        }, {
            "UserPresenceType": 0,
            "LastLocation": "Website",
            "AbsolutePlaceUrl": null,
            "PlaceId": null,
            "GameId": null,
            "IsGamePlayableOnCurrentDevice": false,
            "UserId": 156,
            "EndpointType": "Presence"
        }
    ]
    ```

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

Group APIs
-------------
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

#### Get place settings
* https://www.roblox.com/places/47324/settings
    ```json
    {
        "DefaultFormatNameString": "{0}\\u0027s Place Number: {1}",
        "IUser": {
            "Name": "Shedletsky",
            "Description": "*snip*",
            "AccountId": 261,
            "Created": "*snip*",
            "AccountStatus": 0,
            "UseSuperSafePrivacyMode": false,
            "UseSuperSafeConversationMode": false,
            "AgeBracket": 0,
            "Birthdate": "*snip*",
            "GenderType": 0,
            "Id": 261
        },
        "GameDetailsResources": {
            "IsValueCreated": false,
            "Value": {
                "ActionShareGameToChat": "Share to chat",
                "HeadingDescription": "Description",
                "HeadingRecommendedGames": "Recommended Games",
                "LabelAbout": "About",
                ...
            }
        },
        "ID": 47324,
        "DefaultUserName": "Shedletsky",
        "DefaultPlaceNumber": "82",
        "Name": "Sword Fights on the Heights IV",
        "Description": "Death before dishonor.",
        "DescriptionMaxCharacterCount": 1000,
        "Genre": "All",
        "Access": "Everyone",
        "IsPublic": false,
        "DeviceSectionHeader": null,
        "SellGameAccessSectionHeader": null,
        "ShouldShowStartPlaceNameOrDescriptionUpdateAlsoUpdatesGames": false,
        "NumberOfMaxPlayersList": [
            1,
            2,
            3,
            ...
        ],
        "NumberOfPlayersList": [
            1,
            2,
            3,
            ...
        ],
        "IsAllGenresAllowed": false,
        "AllowedGearTypes": [
            {
                "GearTypeDisplayName": "Melee",
                "IsSelected": false,
                "EncodedBitMask": "1"
            },
            {
                "GearTypeDisplayName": "Power ups",
                "IsSelected": false,
                "EncodedBitMask": "8"
            },
            {
                "GearTypeDisplayName": "Ranged",
                "IsSelected": false,
                "EncodedBitMask": "2"
            },
            {
                "GearTypeDisplayName": "Navigation",
                "IsSelected": false,
                "EncodedBitMask": "16"
            },
            {
                "GearTypeDisplayName": "Explosives",
                "IsSelected": false,
                "EncodedBitMask": "4"
            },
            {
                "GearTypeDisplayName": "Musical",
                "IsSelected": false,
                "EncodedBitMask": "32"
            },
            {
                "GearTypeDisplayName": "Social",
                "IsSelected": false,
                "EncodedBitMask": "64"
            },
            {
                "GearTypeDisplayName": "Transport",
                "IsSelected": false,
                "EncodedBitMask": "256"
            },
            {
                "GearTypeDisplayName": "Building",
                "IsSelected": false,
                "EncodedBitMask": "128"
            }
        ],
        "ChatType": "Classic",
        "IsCopyingAllowed": false,
        "IsCommentsAllowed": true,
        "NumberOfPlayersMax": 50,
        "NumberOfPlayersPreferred": 40,
        "NumberOfCustomSocialSlots": 10,
        "IsSocialSlotTypesEnabled": true,
        "SocialSlotType": 1,
        "SellGameAccess": false,
        "ShowAllowPrivateServers": false,
        "ArePrivateServersAllowed": false,
        "PrivateServersPrice": 0,
        "PrivateServerMinPrice": 0,
        "MarketplaceTaxRate": 0.9,
        "ActivePrivateServersCount": 0,
        "ActivePrivateServersSubscriptionsCount": 0,
        "PrivateServerConfigurationLink": "https://develop.roblox.com/v1/universes//configuration/vip-servers",
        "Price": 0,
        "PrivateServersHelpLink": null,
        "OverridesDefaultAvatar": false,
        "UsePortraitMode": false,
        "BCSellRequirement": null,
        "BCSellReqirementMet": true,
        "SellingVisible": true,
        "BCSellReqirementText": "Pay to Play places are a premium feature only available to users with None.",
        "Creator": {
            "Name": "Shedletsky",
            "CreatorTargetId": 261,
            "CreatorType": 0
        },
        "PublishStep": 0,
        "MaxPublishStepReached": 0,
        "PlayableDevices": [
            {
                "DeviceType": 1,
                "Selected": true
            },
            {
                "DeviceType": 2,
                "Selected": true
            },
            {
                "DeviceType": 3,
                "Selected": true
            },
            {
                "DeviceType": 4,
                "Selected": false
            }
        ],
        "FinalPublishStep": 4,
        "VersionHistoryOnConfigurePageEnabled": true,
        "DefaultDevelopTabName": "Game",
        "PortraitModeEnabled": false,
        "RedirectTermsToHelpFullUrl": "https://en.help.roblox.com/hc/articles/115004647846-Roblox-Terms-of-Use",
        "UserIsAnyBuildersClubMember": false,
        "IsPremium": false,
        "UserIsSellerBanned": false,
        "DeviceConfigurationEnabled": true,
        "ConsoleContentAgreementEnabled": true,
        "ShowDeveloperProducts": true,
        "CurrentUniverse": null,
        "AllowPlaceToBeCopiedInGame": false,
        "AllowPlaceToBeUpdatedInGame": false,
        "DeveloperProductUniverseId": 0,
        "TemplateID": null,
        "AccessTypesUsingPermissions": null,
        "AccessTypeSelectList": [
            {
                "Disabled": false,
                "Group": null,
                "Selected": false,
                "Text": "Everyone",
                "Value": null
            },
            {
                "Disabled": false,
                "Group": null,
                "Selected": false,
                "Text": "Friends",
                "Value": null
            }
        ],
        "UserAgreementModel": null,
        "MachineID": "WEB946",
        "BaseScripts": [
            "~/js/roblox.js",
            "~/js/jquery.tipsy.js",
            "~/js/GoogleAnalytics/GoogleAnalyticsEvents.js",
            "~/js/JSErrorTracker.js",
            "~/js/jquery.cookie.js",
            "~/js/common/forms.js",
            "~/js/jquery.simplemodal-1.3.5.js",
            "~/js/GenericConfirmation.js",
            "~/js/JavaScriptEndpoints.js",
            "~/js/XsrfToken.js"
        ],
        "Title": "Roblox Studio",
        "Groups": null,
        "PrimaryGroupId": null,
        "MetaTagListViewModel": {
            "FacebookMetaTags": null,
            "TwitterMetaTags": null,
            "StructuredDataTags": {
                "StructuredDataContext": "http://schema.org",
                "StructuredDataType": "Organization",
                "StructuredDataName": "Roblox",
                "RobloxUrl": "https://www.roblox.com/",
                "RobloxLogoUrl": "https://images.rbxcdn.com/c69b74f49e785df33b732273fad9dbe0.png",
                "RobloxFacebookUrl": "https://www.facebook.com/ROBLOX/",
                "RobloxTwitterUrl": "https://twitter.com/roblox",
                "RobloxLinkedInUrl": "https://www.linkedin.com/company/147977",
                "RobloxInstagramUrl": "https://www.instagram.com/roblox/",
                "RobloxYouTubeUrl": "https://www.youtube.com/user/roblox",
                "RobloxGooglePlusUrl": "https://plus.google.com/+roblox",
                "RobloxTwitchTvUrl": "https://www.twitch.tv/roblox",
                "Title": "Roblox",
                "Description": null,
                "Images": null,
                "ImageWidth": null,
                "ImageHeight": null
            },
            "Description": "Roblox is a global platform that brings people together through play.",
            "Keywords": "free games, online games, building games, virtual worlds, free mmo, gaming cloud, physics engine",
            "NoIndexNoFollow": false,
            "IncludeReferrerOriginTag": false
        },
        "XsrfToken": "*snip*",
        "XsrfTokensEnabled": true,
        "IsSiftScienceEnabled": false,
        "JavascriptErrorTrackerViewModel": {
            "InitializeParameter": "{ \\u0027suppressConsoleError\\u0027: true}"
        }
    }
    ```

#### Toggle game visibility in profile
```http
POST https://www.roblox.com/game/toggle-profile HTTP/1.1
Cookie: .ROBLOSECURITY=*
X-CSRF-TOKEN: *
Content-Type: application/json
Content-Length: 42

{"placeId":1076067099,"addToProfile":true}
```
```json
{"isValid":true,"data":{"inShowcase":true},"error":""}
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


Home Page APIs
---------
* https://www.roblox.com/home/recently-visited-places
* https://www.roblox.com/user/favorites/places

#### Friend Activity
* https://www.roblox.com/games?SortFilter=17&TimeFilter=0



Profile Page APIs
------------

#### Get groups of an user
* https://www.roblox.com/users/profile/playergroups-json?userId=261
    ```json
    {
        "NumberOfGroups": 27,
        "Groups": [
            {
                "Id": 2814397,
                "AgentId": 121238002,
                "Name": "Shedletsky Studios",
                "EmblemId": 454138426,
                "Description": "Join to get updates about my new games in your ROBLOX feed!",
                "GroupUrl": "https://www.roblox.com/groups/2814397/Shedletsky-Studios",
                "Rank": "Owner",
                "Members": 6841,
                "IsPrimary": true,
                "GroupThumbnailWidth": 150,
                "GroupThumbnailHeight": 150,
                "Emblem": {
                    "Final": true,
                    "Url": "https://t7.rbxcdn.com/c3f73a0973d07d4d15f5bbfdffdf6594",
                    "RetryUrl": "",
                    "IsApproved": false
                }
            },
            {
                "Id": 3428946,
                "AgentId": 372937350,
                "Name": "Eccentric Society",
                "EmblemId": 996523669,
                "Description": "https://www.roblox.com/catalog/26943368/Eccentric-Shop-Teacher\r\n\r\nAn \"elite\" group for owners of the rarest (4 exist, no limited is rarer), most unique (no direct re-textures), and unobtainable (none are for trade) limited on ROBLOX: Eccentric Shop Teacher. \r\n\r\nOnly owners can join this prestigious society, hehe.\r\n\r\nOwners: Linkmon99, Merely, Shedletsky (sonofsevenless), Runite\r\n\r\n\r\nNote:\r\nWhile the tablets have 1 stock each, as whole there are around 20 making them less rare than the eccentric shop teacher. Second place is Lady of the Federation which 5 exist.",
                "GroupUrl": "https://www.roblox.com/groups/3428946/Eccentric-Society",
                "Rank": "Proprietors",
                "Members": 4,
                "IsPrimary": false,
                "GroupThumbnailWidth": 150,
                "GroupThumbnailHeight": 150,
                "Emblem": {
                    "Final": true,
                    "Url": "https://t3.rbxcdn.com/4ab1ed89ec044a036c9d99005fd39281",
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

#### Get collections of an user
* https://www.roblox.com/users/profile/robloxcollections-json?userId=261
    ```json
    {
        "CollectionsItems": [
            {
                "AssetSeoUrl": "https://www.roblox.com/catalog/1114768/The-Kleos-Aphthiton",
                "Thumbnail": {
                    "Final": true,
                    "Url": "https://t3.rbxcdn.com/0af97318f7dfc4313441e87cfcdc059d",
                    "RetryUrl": null,
                    "UserId": 0,
                    "EndpointType": "Avatar"
                },
                "Name": "The Kleos Aphthiton",
                "FormatName": null,
                "Description": "Kleos Aphthiton: undying glory. This helm was won in the August 2007 Grand Melee competition. Other helms like it were awarded to the top four finishers in that contest. It is very rare.",
                "AssetRestrictionIcon": {
                    "TooltipText": "Discontinued item, resellable.",
                    "CssTag": "limited",
                    "LoadAssetRestrictionIconCss": false,
                    "HasTooltip": false
                }
            },
            {
                "AssetSeoUrl": "https://www.roblox.com/catalog/6128663/Crown-of-the-Dark-Lord-of-SQL",
                "Thumbnail": {
                    "Final": true,
                    "Url": "https://t0.rbxcdn.com/3098434922e315e109bc9799cac2b8b4",
                    "RetryUrl": null,
                    "UserId": 0,
                    "EndpointType": "Avatar"
                },
                "Name": "Crown of the Dark Lord of SQL",
                "FormatName": null,
                "Description": "SELECT * from users WHERE accountid = 111627",
                "AssetRestrictionIcon": {
                    "TooltipText": null,
                    "CssTag": null,
                    "LoadAssetRestrictionIconCss": false,
                    "HasTooltip": false
                }
            },
            ...
        ]
    }
    ```

#### Get player badges of an user
* https://www.roblox.com/users/profile/playerassets-json?assetTypeId=21&userId=261
    * Was made to be used in profiles, so only shows first 6 badges
    ```json
    {
        "Title": "Player Badges",
        "Label": "badges",
        "ModalAssetViewType": 1,
        "MaxNumberOfVisibleAssets": 6,
        "Assets": [
            {
                "AssetSeoUrl": "https://www.roblox.com/badges/1946785131/Risk",
                "Thumbnail": {
                    "Final": true,
                    "Url": "https://t6.rbxcdn.com/4c1865391b1b027532d2b332ac2dc62b",
                    "RetryUrl": null,
                    "UserId": 0,
                    "EndpointType": "Avatar"
                },
                "Name": "Risk",
                "FormatName": null,
                "Description": "Get a streak of 5 kills",
                "AssetRestrictionIcon": null
            },
            {
                "AssetSeoUrl": "https://www.roblox.com/badges/1916274658/By-the-Book",
                "Thumbnail": {
                    "Final": true,
                    "Url": "https://t6.rbxcdn.com/2176e6a0e08757e1354ebf6709c335aa",
                    "RetryUrl": null,
                    "UserId": 0,
                    "EndpointType": "Avatar"
                },
                "Name": "By the Book!",
                "FormatName": null,
                "Description": "You read the rules!",
                "AssetRestrictionIcon": null
            },
            ...
        ],
        "UserId": 261,
        "IsSeeAllHeaderButtonVisible": true,
        "AssetTypeInventoryUrl": "https://www.roblox.com/users/261/inventory/#!/badges",
        "ProfileLangResources": {
            "ActionAccept": "Accept",
            "ActionAddFriend": "Add Friend",
            "ActionBlockUser": "Block User",
            "ActionCancelBlockUser": "Cancel",
            ...
        }
    }
    ```

#### Get games on an user's profile
* https://www.roblox.com/users/profile/playergames-json?userId=261
    ```json
    {
        "Title": "Games",
        "Games": [
            {
                "CreatorID": 0,
                "CreatorName": "Shedletsky",
                "CreatorAbsoluteUrl": "https://www.roblox.com/users/261/profile",
                "Plays": 17022411,
                "Price": 0,
                "ProductID": 0,
                "IsOwned": false,
                "IsVotingEnabled": true,
                "TotalUpVotes": 28624,
                "TotalDownVotes": 6076,
                "TotalBought": 0,
                "UniverseID": 156639,
                "HasErrorOcurred": false,
                "Favorites": 244706,
                "Description": "Death before dishonor.",
                "GameDetailReferralUrl": "https://www.roblox.com/games/refer?PlaceId=47324\\u0026Position=1\\u0026PageType=Profile",
                "Thumbnail": {
                    "Final": true,
                    "Url": "https://t0.rbxcdn.com/47624390b8be1002eb244280d0cee967",
                    "RetryUrl": null,
                    "UserId": 0,
                    "EndpointType": "Avatar"
                },
                "UseDataSrc": false,
                "IsAsyncThumbnailEnabled": false,
                "GamePageResources": null,
                "Name": "Sword Fights on the Heights IV",
                "PlaceID": 47324,
                "PlayerCount": 26,
                "ImageId": 0,
                "IsSecure": false,
                "ShowExperimentalMode": false
            },
            {
                "CreatorID": 0,
                "CreatorName": "Shedletsky",
                "CreatorAbsoluteUrl": "https://www.roblox.com/users/261/profile",
                "Plays": 104271,
                "Price": 0,
                "ProductID": 0,
                "IsOwned": false,
                "IsVotingEnabled": true,
                "TotalUpVotes": 1227,
                "TotalDownVotes": 230,
                "TotalBought": 0,
                "UniverseID": 34927903,
                "HasErrorOcurred": false,
                "Favorites": 5049,
                "Description": "I can\\u0027t tell if I\\u0027m making fun of cart ride games or paying homage to them. Favorite if you like riding carts into my face.",
                "GameDetailReferralUrl": "https://www.roblox.com/games/refer?PlaceId=77814493\\u0026Position=2\\u0026PageType=Profile",
                "Thumbnail": {
                    "Final": true,
                    "Url": "https://t6.rbxcdn.com/bad82e1d58c247788cb501879e9f6dbe",
                    "RetryUrl": null,
                    "UserId": 0,
                    "EndpointType": "Avatar"
                },
                "UseDataSrc": false,
                "IsAsyncThumbnailEnabled": false,
                "GamePageResources": null,
                "Name": "Ride a Cart Into My Face",
                "PlaceID": 77814493,
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
<a href="https://chrome.google.com/webstore/detail/btroblox/hbkpclpemjeibhioopcebchdmohaieln" title="Available in the Chrome Web Store"><img src="/img/ChromeWebStore_BadgeWBorder_v2_206x58.png" alt="Available in the Chrome Web Store"></a>&nbsp;&nbsp;&nbsp;<a href="https://addons.mozilla.org/en-US/firefox/addon/btroblox/" title="Get the add-on from the Firefox Add-ons store"><img src="/img/AMO-button_1.png" alt="Get the add-on from the Firefox Add-ons store"></a>


BTRoblox
========

BTRoblox, or Better Roblox, is an extension that aims to enhance Roblox website's look and functionality by adding a plethora of new features and modifying the layout of some existing pages.


Links
-----

* [Roblox Web Apis by matthewdean](https://github.com/matthewdean/roblox-web-apis)
* [Roblox-Apis by NoTwistedHere](https://github.com/NoTwistedHere/Roblox-Apis/blob/main/Apis.md)
* [API Docs](#api-docs)
* [Undocumented APIs](#undocumented-apis)
  * [roblox://](#roblox)
    * [Join a roblox place](#join-a-roblox-place)
  * [roblox-studio://](#roblox-studio)
    * [Open place in studio](#open-place-in-studio)
  * [apis.roblox.com/player-hydration-service](#apisrobloxcomplayer-hydration-service)
  * [apis.roblox.com/content-aliases-api](#apisrobloxcomcontent-aliases-api)
    * [Configure aliases](#configure-aliases)
  * [apis.roblox.com/creator-marketplace-purchasing-service](#apisrobloxcomcreator-marketplace-purchasing-service)
    * [Purchase asset](#purchase-asset-note-url-uses-product-id-not-asset-id)
  * [apis.roblox.com/game-passes](#apisrobloxcomgame-passes)
    * [Get gamepass product info](#get-gamepass-product-info)
    * [Get gamepass details](#get-gamepass-details)
    * [Get universeId from place](#get-universeid-from-place)
  * [apis.roblox.com/asset-permissions-api](#apisrobloxcomasset-permissions-api)
    * [Check if user (or group) has edit access](#check-if-user-or-group-has-edit-access)
  * [apis.roblox.com/explore-api](#apisrobloxcomexplore-api)
    * [Game sorts](#game-sorts)
  * [apis.roblox.com/search-api](#apisrobloxcomsearch-api)
    * [Game search](#game-search)
  * [apis.roblox.com/platform-chat-api](#apisrobloxcomplatform-chat-api)
    * [Platform chat](#platform-chat)
  * [apis.roblox.com/showcases-api](#apisrobloxcomshowcases-api)
    * [Get player's showcased assets](#get-players-showcased-assets)
  * [develop.roblox.com](#developrobloxcom)
    * [Get saved versions of an asset](#get-saved-versions-of-an-asset)
    * [Get published versions of an asset](#get-published-versions-of-an-asset)
    * [Multi-get asset details](#multi-get-asset-details)
    * [Archive asset](#archive-asset)
  * [economy.roblox.com](#economyrobloxcom)
    * [Get asset details](#get-asset-details)
  * [gamepersistence.roblox.com](#gamepersistencerobloxcom)
    * [DataStore methods](#datastore-methods)
  * [www.roblox.com](#wwwrobloxcom)
    * [Get info about currently logged in user](#get-info-about-currently-logged-in-user)
    * [Get place details](#get-place-details)
    * [Get place settings](#get-place-settings-requires-edit-access)
    * [Get collections of an user](#get-collections-of-an-user)
    * [Get games on an user's profile](#get-games-on-an-users-profile)
    * [Get favorites of an user](#get-favorites-of-an-user)
    * [Delete asset from inventory](#delete-asset-from-inventory)


API Docs
========

| Domain | Description |
| -: | :- |
| [accountinformation.roblox.com](https://accountinformation.roblox.com/docs/index.html) | All endpoints for accessing/modifying account information |
| [accountsettings.roblox.com](https://accountsettings.roblox.com/docs/index.html) | All endpoints for account/user settings. |
| [adconfiguration.roblox.com](https://adconfiguration.roblox.com/docs/index.html) | Roblox Ad Configuration related endpoints. |
| [ads.roblox.com](https://ads.roblox.com/docs/index.html) | Ads configuration endpoints. |
| [assetdelivery.roblox.com](https://assetdelivery.roblox.com/docs/index.html) | Serves asset content. |
| [auth.roblox.com](https://auth.roblox.com/docs/index.html) | All endpoints that tamper with authentication sessions. |
| [avatar.roblox.com](https://avatar.roblox.com/docs/index.html) | Endpoints relating to the customization of player avatars. |
| [badges.roblox.com](https://badges.roblox.com/docs/index.html) | Endpoints for badges and badge awards management. |
| [billing.roblox.com](https://billing.roblox.com/docs/index.html) | Real money transactions and interaction. |
| [catalog.roblox.com](https://catalog.roblox.com/docs/index.html) | Catalog items browsing and searching. Content and user based catalog items recommendations. |
| [chat.roblox.com](https://chat.roblox.com/docs/index.html) | All chat and party related endpoints. |
| [chatmoderation.roblox.com](https://chatmoderation.roblox.com/docs/index.html) |  |
| [clientsettings.roblox.com](https://clientsettings.roblox.com/docs/index.html) | Used by various Roblox clients to retrieve configuration information. |
| [clientsettingscdn.roblox.com](https://clientsettingscdn.roblox.com/docs/index.html) | Used by various Roblox clients to retrieve configuration information. |
| [contacts.roblox.com](https://contacts.roblox.com/docs/index.html) | Contacts and userTag management. |
| [contentstore.roblox.com](https://contentstore.roblox.com/docs/index.html) | ApiSite to front the TemporaryStore for files before uploading to S3 |
| [develop.roblox.com](https://develop.roblox.com/docs/index.html) | Game development configuration endpoints. |
| [economy.roblox.com](https://economy.roblox.com/docs/index.html) | Endpoints related to transactions and currency. |
| [economycreatorstats.roblox.com](https://economycreatorstats.roblox.com/docs/index.html) | Roblox.EconomyCreatorStats.Api endpoints. |
| [engagementpayouts.roblox.com](https://engagementpayouts.roblox.com/docs/index.html) | For engagement-based payout information |
| [followings.roblox.com](https://followings.roblox.com/docs/index.html) | Establishes follow relationship between subscriber entities (users, groups, etc) and source entities (games, groups, assets, etc.) |
| [friends.roblox.com](https://friends.roblox.com/docs/index.html) | Friends and followers management. |
| [gameinternationalization.roblox.com](https://gameinternationalization.roblox.com/docs/index.html) | Manages internationalization of games such as translating in game content. |
| [gamejoin.roblox.com](https://gamejoin.roblox.com/docs/index.html) | All endpoints around launching a game. |
| [gamepersistence.roblox.com](https://gamepersistence.roblox.com/docs/index.html) | Endpoints for the in-game datastore system for storing data for games. |
| [games.roblox.com](https://games.roblox.com/docs/index.html) | All endpoints for game discovery, and details. |
| [groups.roblox.com](https://groups.roblox.com/docs/index.html) | Groups management. |
| [groupsmoderation.roblox.com](https://groupsmoderation.roblox.com/docs/index.html) | Group Moderation |
| [inventory.roblox.com](https://inventory.roblox.com/docs/index.html) | All endpoints for viewing (but not granting) ownership of items. |
| [itemconfiguration.roblox.com](https://itemconfiguration.roblox.com/docs/index.html) | Configure Items (bundles and avatar assets). |
| [locale.roblox.com](https://locale.roblox.com/docs/index.html) | User locale management. |
| [localizationtables.roblox.com](https://localizationtables.roblox.com/docs/index.html) | Handles managing of localization tables. |
| [metrics.roblox.com](https://metrics.roblox.com/docs/index.html) | Record metrics across Roblox. |
| [notifications.roblox.com](https://notifications.roblox.com/docs/index.html) | All notification stream endpoints. |
| [premiumfeatures.roblox.com](https://premiumfeatures.roblox.com/docs/index.html) | This API is for premium features and anything pertaining to account add ons |
| [presence.roblox.com](https://presence.roblox.com/docs/index.html) | All endpoints for managing presence. |
| [privatemessages.roblox.com](https://privatemessages.roblox.com/docs/index.html) | All messages page endpoints. |
| [publish.roblox.com](https://publish.roblox.com/docs/index.html) | All endpoints handling file uploads. |
| [thumbnails.roblox.com](https://thumbnails.roblox.com/docs/index.html) | Endpoints for requesting thumbnails. |
| [thumbnailsresizer.roblox.com](https://thumbnailsresizer.roblox.com/docs/index.html) | Validate and resize thumbnails to requested dimensions |
| [trades.roblox.com](https://trades.roblox.com/docs/index.html) | Endpoints for trading collectible items. |
| [translationroles.roblox.com](https://translationroles.roblox.com/docs/index.html) | Manages translation roles of developers in game localization. |
| [twostepverification.roblox.com](https://twostepverification.roblox.com/docs/index.html) | Platform interface for the two step verification system. |
| [users.roblox.com](https://users.roblox.com/docs/index.html) | For direct Roblox user information. |
| [voice.roblox.com](https://voice.roblox.com/docs/index.html) | APIs for Voice calls. |


Undocumented APIs
=================

roblox://
---------
#### Join a roblox place
* roblox://experiences/start?id=1818
* roblox://placeId=1818/
  * supported params: `placeId` (or just `id`), `gameInstanceId`, `accessCode`, `linkCode`, `launchData`, `reservedServerAccessCode`, `joinAttemptId`, `joinAttemptOrigin`, `callId` and `browserTrackerId`. (credit to [bloxstrap](https://github.com/pizzaboxer/bloxstrap/wiki/A-deep-dive-on-how-the-Roblox-bootstrapper-works) for this information)

roblox-studio://
---------
#### Open place in studio
* roblox-studio:1+launchmode:edit+task:EditPlace+placeId:1818+universeId:13058


apis.roblox.com/player-hydration-service
---------
* GET https://apis.roblox.com/player-hydration-service/v1/players/signed


apis.roblox.com/content-aliases-api
---------
#### Configure aliases
* POST https://apis.roblox.com/content-aliases-api/v1/universes/create-alias?universeId={universeId}&name={name}&type={aliasTypeId}&targetId{targetId}
* POST https://apis.roblox.com/content-aliases-api/v1/universes/delete-alias?universeId={universeId}&name={name}
* POST https://apis.roblox.com/content-aliases-api/v1/universes/update-alias?universeId={universeId}&oldName={oldName}&name={name}&type={aliasTypeId}&targetId={targetId}


apis.roblox.com/creator-marketplace-purchasing-service
---------
#### Purchase asset (note: url uses product id, not asset id)
* POST https://apis.roblox.com/creator-marketplace-purchasing-service/v1/products/1346487601/purchase
  ```
  {"assetId":11829118051,"assetType":10,"expectedPrice":0,"searchId":null}
  ```
  ```
  {"purchased":true,"productId":1346487601,"price":0,"reason":"Success"}
  ```


apis.roblox.com/game-passes
---------
#### Get gamepass product info
* GET https://apis.roblox.com/game-passes/v1/game-passes/18185363/product-info

#### Get gamepass details
* GET https://apis.roblox.com/game-passes/v1/game-passes/18185363/details

#### Get universeId from place
* GET https://apis.roblox.com/universes/v1/places/1818/universe


apis.roblox.com/asset-permissions-api
---------
#### Check if user (or group) has edit access
  ```
  POST https://apis.roblox.com/asset-permissions-api/v1/assets/check-permissions
  content-type: application/json

  {
      "requests": [
          {
              "subject": {
                  "subjectType": "User" | "Group",
                  "subjectId": "{userId}" | "{groupId}"
              },
              "action": "Edit",
              "assetId": {assetId}
          }
      ]
  }
  ```
  ```
  
  200 OK
  content-type: application/json

  {
      "results": [
          { "value": { "status": "NoPermission" | "HasPermission" } }
      ]
  }
  ```


apis.roblox.com/explore-api
---------
#### Game sorts
* GET https://apis.roblox.com/explore-api/v1/get-sorts?sessionId={sessionID}
* GET https://apis.roblox.com/explore-api/v1/get-sort-content?sessionId={sessionID}&sortId={sortID}


apis.roblox.com/search-api
---------
#### Game search
* GET https://apis.roblox.com/search-api/omni-search?SearchQuery={query}&SessionId={sessionID}


apis.roblox.com/platform-chat-api
---------
#### Platform chat
* GET https://apis.roblox.com/platform-chat-api/v1/metadata
* GET https://apis.roblox.com/platform-chat-api/v1/get-conversation-metadata
* GET https://apis.roblox.com/platform-chat-api/v1/get-user-conversations?include_user_data=true&pageSize=30
* GET https://apis.roblox.com/platform-chat-api/v1/get-conversation-messages?conversation_id={conversationId}&pageSize=30
* POST https://apis.roblox.com/platform-chat-api/v1/update-typing-status
  ```
  {"conversation_id":"{conversationId}"}
  ```
  ```
  {"status":"success"}
  ```
  
* POST https://apis.roblox.com/platform-chat-api/v1/send-messages
  ```
  {"conversation_id":"{conversationId}","messages":[{"content":"this is a test message"}]}
  ```
  ```
  {"messages":[{"id":"12345678-1234-1234-1234-123456789abc","content":"this is a test message","sender_user_id":4719353,"created_at":"2024-06-27T21:32:22.7534644Z","status":"success","type":"unknown_type"}]}
  ```
  
* POST https://apis.roblox.com/platform-chat-api/v1/create-conversations
  ```
  {"conversations":[{"type":"group","name":"","participant_user_ids":[1234,2345]}],"include_user_data":true}
  ```
  ```
  {"conversations":[{"source":"chat","id":"123456789","type":"group","name":null,"created_by":4719353,"participant_user_ids":[4719353,1234,2345],"user_data":*snip*,"messages":[],"unread_message_count":0,"updated_at":"2024-06-27T21:39:27.7080493Z","created_at":"0001-01-01T00:00:00Z","status":"success"}]}
  ```
  
* POST https://apis.roblox.com/platform-chat-api/v1/get-conversations
  ```
  {"ids":[123456789],"include_messages":true,"include_participants":true,"include_user_data":true}
  ```
  ```
  {"conversations":[{"source":"chat","id":"123456789","type":"group","name":null,"created_by":4719353,"participant_user_ids":[4719353,1234,2345],"user_data":*snip*,"messages":[],"unread_message_count":0,"updated_at":"2024-06-27T21:39:27.7080493Z","created_at":"2024-06-27T21:39:27.7080493Z"}]}
  ```
  

apis.roblox.com/showcases-api
---------
#### Get player's showcased assets
* GET https://apis.roblox.com/showcases-api/v1/users/profile/playerassets-json?assetTypeId=10&userId=4719353
  * Supported assetTypeIds: 10 (Models), 11 (Clothing)

develop.roblox.com
-------------
#### Get saved versions of an asset
* GET https://develop.roblox.com/v1/assets/{assetId}/saved-versions?limit=100

#### Get published versions of an asset
* GET https://develop.roblox.com/v1/assets/{assetId}/versions?page=1

#### Multi-get asset details
* GET https://develop.roblox.com/v1/assets?assetIds=16580499833,1818

#### Archive asset
* POST https://develop.roblox.com/v1/assets/1818/archive

economy.roblox.com
-------------
#### Get asset details
* GET https://economy.roblox.com/v2/assets/1818/details


gamepersistence.roblox.com
--------------
#### DataStore methods
* These examples use [this place](https://www.roblox.com/games/1076067099/) with placeId of 1076067099 and universeId of 446315170

#### ListDataStoresAsync("T", 1, "cursor")
* GET https://gamepersistence.roblox.com/v2/persistence/446315170/datastores?prefix=T&maxItemsToReturn=1&exclusiveStartKey=cursor
  ```
  Roblox-Place-Id: 1076067099
  ```
  ```
  200 OK
  
  {"datastores":[{"name":"Test","createdTime":"2024-08-22T16:49:57.8516146Z","updatedTime":"2024-08-22T16:49:57.8516146Z"}],"lastReturnedKey":""}
  ```
  
#### GetDataStore("Test"):GetAsync("hi")
* GET https://gamepersistence.roblox.com/v2/persistence/446315170/datastores/objects/object?datastore=Test&objectKey=global%2Fhi
  ```
  Roblox-Place-Id: 1076067099
  ```
  ```
  // If key exists
  200 OK
  content-type: application/octet-stream
  content-md5: VQNh2cu4sdBAMRrdwrY35w==
  etag: "08DCC2CA74D3E243.0000000007.08DCC2CBF140D0DC.01"
  roblox-object-version-id: 08DCC2CA74D3E243.0000000007.08DCC2CBF140D0DC.01
  roblox-object-created-time: 2024-08-22T16:49:57.8993219Z
  roblox-object-version-created-time: 2024-08-22T17:00:36.1474268Z
  roblox-object-attributes: {"key1":"value1","key2":"value2"}
  roblox-object-userids: [1,2,3]
  
  "ho"
  ```
  ```
  // If key doesn't exist
  404 Not Found
  content-type: application/json
  
  {"errors":[{"code":11,"message":"The requested key does not exist.","retryable":false}]}
  ```

#### GetDataStore("Test"):GetVersionAsync("hi", "08DCC2CA74D3E243.0000000007.08DCC2CBF140D0DC.01")
* GET https://gamepersistence.roblox.com/v2/persistence/446315170/datastores/objects/object?datastore=Test&objectKey=global%2Fhi&version=08DCC2CA74D3E243.0000000007.08DCC2CBF140D0DC.01
  ```
  Roblox-Place-Id: 1076067099
  ```
  ```
  // If version exists
  200 OK
  content-type: application/octet-stream
  content-md5: VQNh2cu4sdBAMRrdwrY35w==
  etag: "08DCC2CA74D3E243.0000000007.08DCC2CBF140D0DC.01"
  roblox-object-version-id: 08DCC2CA74D3E243.0000000007.08DCC2CBF140D0DC.01
  roblox-object-created-time: 2024-08-22T16:49:57.8993219Z
  roblox-object-version-created-time: 2024-08-22T17:00:36.1474268Z
  roblox-object-attributes: {"key1":"value1","key2":"value2"}
  roblox-object-userids: [1,2,3]
  
  "ho"
  ```
  ```
  // If version doesn't exist but key does
  204 No Content
  content-type: application/octet-stream
  content-md5: VQNh2cu4sdBAMRrdwrY35w==
  etag: "08DCC2CA74D3E243.0000000007.08DCC2CBF140D0DC.01"
  roblox-object-version-id: 08DCC2CA74D3E243.0000000007.08DCC2CBF140D0DC.01
  roblox-object-created-time: 2024-08-22T16:49:57.8993219Z
  roblox-object-version-created-time: 2024-08-22T17:00:36.1474268Z
  roblox-object-attributes: {"key1":"value1","key2":"value2"}
  roblox-object-userids: [1,2,3]
  
  <no data>
  ```
  ```
  // If key doesn't exist
  404 Not Found
  content-type: application/json
  
  {"errors":[{"code":11,"message":"The requested key does not exist.","retryable":false}]}
  ```

#### GetDataStore("Test"):SetAsync("hi", "ho", {1, 2, 3}, DataStoreSetOptions({ key1 = "value1", key2 = "value2" }))
* POST https://gamepersistence.roblox.com/v2/persistence/446315170/datastores/objects/object?datastore=Test&objectKey=global%2Fhi
  ```
  Content-Type: application/octet-stream
  Content-MD5: VQNh2cu4sdBAMRrdwrY35w==
  Roblox-Place-Id: 1076067099
  Roblox-Object-Userids: [1,2,3]
  Roblox-Object-Attributes: {"key1":"value1","key2":"value2"}
  
  "ho"
  ```
  ```
  200 OK
  content-type: application/json
  
  {"version":"08DCC2CA74D3E243.0000000007.08DCC2CBF140D0DC.01","deleted":false,"contentLength":4,"createdTime":"2024-08-22T17:00:36.1474268Z","objectCreatedTime":"2024-08-22T16:49:57.8993219Z"}
  ```

#### GetDataStore("Test"):UpdateAsync("hi", function() return "ho", {1, 2, 3}, DataStoreSetOptions({ key1 = "value1", key2 = "value2" }) end)
* Implemented using [GetAsync](#getdatastoretestgetasynchi) and [SetAsync](#getdatastoretestsetasynchi-ho-1-2-3-datastoresetoptions-key1--value1-key2--value2-) with If-Match header
  ```
  // First it gets current data
  GET https://gamepersistence.roblox.com/v2/persistence/446315170/datastores/objects/object?datastore=Test&objectKey=global%2Fhi
  Roblox-Place-Id: 1076067099
  ```
  ```
  200 OK
  content-type: application/octet-stream
  content-md5: VQNh2cu4sdBAMRrdwrY35w==
  etag: "08DCC2CA74D3E243.0000000007.08DCC2CBF140D0DC.01"
  roblox-object-version-id: 08DCC2CA74D3E243.0000000007.08DCC2CBF140D0DC.01
  roblox-object-created-time: 2024-08-22T16:49:57.8993219Z
  roblox-object-version-created-time: 2024-08-22T17:00:36.1474268Z
  roblox-object-attributes: {"key1":"value1","key2":"value2"}
  roblox-object-userids: [1,2,3]
  
  "ho"
  ```
  ```
  // Then it tries to set it to new value (note If-Match header which matches etag returned by GetAsync)
  POST https://gamepersistence.roblox.com/v2/persistence/446315170/datastores/objects/object?datastore=Test&objectKey=global%2Fhi
  Content-Type: application/octet-stream
  If-Match: "08DCC2CA74D3E243.0000000007.08DCC2CBF140D0DC.01"
  Content-MD5: uax0tCReVutN8x1hJ+LNDQ==
  Roblox-Place-Id: 1076067099
  Roblox-Object-Userids: [1,2,3]
  Roblox-Object-Attributes: {"key1":"value1","key2":"value2"}
  
  "hy"
  ```
  ```
  // If it succeeds
  200 OK
  content-type: application/json
  
  {"version":"08DCC2CE8B549D47.0000000003.08DCC2CEED7D4991.01","deleted":false,"contentLength":4,"createdTime":"2024-08-22T17:21:58.3230353Z","objectCreatedTime":"2024-08-22T17:19:13.6397639Z"}
  ```
  ```
  // If it fails (data does not match If-Match), return new data and repeat setasync
  412 Precondition Failed
  content-type: application/octet-stream
  content-md5: uax0tCReVutN8x1hJ+LNDQ==
  etag: "08DCC2CA74D3E243.0000000007.08DCC2CBF140D0DC.01"
  roblox-object-version-id: 08DCC2CA74D3E243.0000000007.08DCC2CBF140D0DC.01
  roblox-object-created-time: 2024-08-22T16:49:57.8993219Z
  roblox-object-version-created-time: 2024-08-22T17:00:36.1474268Z
  roblox-object-attributes: {"key1":"value1","key2":"value2"}
  roblox-object-userids: [1,2,3]
  
  "hy"
  ```

#### GetDataStore("Test"):RemoveAsync("hi")
* DELETE https://gamepersistence.roblox.com/v2/persistence/446315170/datastores/objects/object?datastore=Test&objectKey=global%2Fhi
  ```
  Content-Type: application/octet-stream
  Roblox-Place-Id: 1076067099
  
  <no body>
  ```
  ```
  // If key exists
  200 OK
  content-type: application/octet-stream
  content-md5: VQNh2cu4sdBAMRrdwrY35w==
  etag: "08DCC2CA74D3E243.0000000007.08DCC2CBF140D0DC.01"
  roblox-object-version-id: 08DCC2CA74D3E243.0000000007.08DCC2CBF140D0DC.01
  roblox-object-created-time: 2024-08-22T16:49:57.8993219Z
  roblox-object-version-created-time: 2024-08-22T17:00:36.1474268Z
  roblox-object-attributes: {"key1":"value1","key2":"value2"}
  roblox-object-userids: [1,2,3]
  
  "ho"
  ```
  ```
  // If key doesn't exist
  404 Not Found
  content-type: application/json
  
  {"errors":[{"code":11,"message":"The requested key does not exist.","retryable":false}]}
  ```

#### GetDataStore("Test"):RemoveVersionAsync("hi", "08DCC2CA74D3E243.0000000007.08DCC2CBF140D0DC.01")
* DELETE https://gamepersistence.roblox.com/v2/persistence/446315170/datastores/objects/object?datastore=Test&objectKey=global%2Fhi&version=08DCC2CA74D3E243.0000000007.08DCC2CBF140D0DC.01
  ```
  Content-Type: application/octet-stream
  Roblox-Place-Id: 1076067099
  
  <no body>
  ```
  ```
  // If version exists
  200 OK
  content-type: application/octet-stream
  content-md5: VQNh2cu4sdBAMRrdwrY35w==
  etag: "08DCC2CA74D3E243.0000000007.08DCC2CBF140D0DC.01"
  roblox-object-version-id: 08DCC2CA74D3E243.0000000007.08DCC2CBF140D0DC.01
  roblox-object-created-time: 2024-08-22T16:49:57.8993219Z
  roblox-object-version-created-time: 2024-08-22T17:00:36.1474268Z
  roblox-object-attributes: {"key1":"value1","key2":"value2"}
  roblox-object-userids: [1,2,3]
  
  "ho"
  ```
  ```
  // If version doesn't exist
  404 Not Found
  content-type: application/json
  
  {"errors":[{"code":12,"message":"The requested object version does not exist.","retryable":false}]}
  ```

#### GetDataStore("Test"):IncrementAsync("hi", 1, {1, 2, 3}, DataStoreSetOptions({ key1 = "value1", key2 = "value2" }))
* POST https://gamepersistence.roblox.com/v2/persistence/446315170/datastores/objects/object/increment?datastore=Test&objectKey=global%2Fhi&incrementBy=1
  ```
  Content-Type: application/octet-stream
  Roblox-Place-Id: 1076067099
  Roblox-Object-Userids: [1,2,3]
  Roblox-Object-Attributes: {"key1":"value1","key2":"value2"}
  
  <no body>
  ```
  ```
  // If it succeeds
  200 OK
  content-type: application/octet-stream
  content-md5: xMpCOKC5I4INzFCab3WEmw==
  etag: "08DCC2D1D7C3A452.0000000001.08DCC2D1D7C3A452.01"
  roblox-object-version-id: 08DCC2D1D7C3A452.0000000001.08DCC2D1D7C3A452.01
  roblox-object-created-time: 2024-08-22T17:42:50.3644242Z
  roblox-object-version-created-time: 2024-08-22T17:42:50.3644242Z
  roblox-object-attributes: {"key1":"value1","key2":"value2"}
  roblox-object-userids: [1,2,3]
  
  1
  ```
  ```
  // If existing data is not numeric
  400 Bad Request
  content-type: application/json
  
  {"errors":[{"code":24,"message":"Key value is not numeric.","retryable":false}]}
  ```

#### GetDataStore("Test"):ListKeysAsync("hi", 1, "cursor", true)
* GET https://gamepersistence.roblox.com/v2/persistence/446315170/datastores/objects?datastore=Test&prefix=global%2Fhi&maxItemsToReturn=1&exclusiveStartKey=cursor&excludeDeleted=true
  ```
  Roblox-Place-Id: 1076067099
  ```
  ```
  200 OK
  content-type: application/json
  
  {"keys":["global/hi"],"lastReturnedKey":"nzrxiER/+KVBNMl9B7mbqnzqkKsBZcr9liT+cwLGGf01Iw=="}
  ```

#### GetDataStore("Test"):ListVersionsAsync("hi", Enum.SortDirection.Ascending, 1, 1724340243000, 1)
* GET https://gamepersistence.roblox.com/v2/persistence/446315170/datastores/objects/object/versions?datastore=Test&objectKey=global%2Fhi&sortOrder=Ascending&startTime=1970-01-01T00:00:00Z&endTime=2024-08-22T18:24:03Z&maxItemsToReturn=1
  * Start and end times are in millis
  ```
  Roblox-Place-Id: 1076067099
  ```
  ```
  200 OK
  content-type: application/json
  
  {"versions":[{"version":"08DCC2CA74D3E243.0000000005.08DCC2CB5C770715.01","deleted":false,"contentLength":4,"createdTime":"2024-08-22T16:56:26.5221909Z","objectCreatedTime":"2024-08-22T16:49:57.8993219Z"}],"lastReturnedKey":"X3qpRUgyRrQhbDShI97MRuacpM6vR7jTjyNqyBDMiMdleUpwYm14cGJtVldaWEp6YVc5dUlqcG1ZV3h6WlN3aWJHRnpkRlpsY25OcGIyNGlPaUl3T0VSRFF6SkRRVGMwUkRORk1qUXpMakF3TURBd01EQXdNRFV1TURoRVEwTXlRMEkxUXpjM01EY3hOUzR3TVNJc0lrTjFjbk52Y2xabGNuTnBiMjRpT2pGOQ=="}
  ```
  ```
  // If key doesn't exist
  404 Not Found
  content-type: application/json
  
  {"errors":[{"code":11,"message":"The requested key does not exist.","retryable":false}]}
  ```

#### GetOrderedDataStore("Test"):GetAsync("hi")
* GET https://gamepersistence.roblox.com/v1/persistence/sorted?key=Test&scope=global&target=hi
  ```
  Roblox-Place-Id: 1076067099
  ```
  ```
  200 OK
  content-type: application/octet-stream
  roblox-usn: 123

  123
  ```

#### GetOrderedDataStore("Test"):SetAsync("hi", 123)
* POST https://gamepersistence.roblox.com/v1/persistence/sorted?key=Test&scope=global&target=hi
  ```
  Content-Type: application/octet-stream
  Roblox-Place-Id: 1076067099

  123
  ```
  ```
  200 OK
  content-type: application/json

  {"usn":"123"}
  ```

#### GetOrderedDataStore("Test"):RemoveAsync("hi")
* POST https://gamepersistence.roblox.com/v1/persistence/sorted/remove?key=Test&scope=global&target=hi
  ```
  Content-Type: application/octet-stream
  Roblox-Place-Id: 1076067099
  
  <no data>
  ```
  ```
  200 OK
  content-type: application/octet-stream
  roblox-usn: 123

  123
  ```

#### GetOrderedDataStore("Test"):IncrementAsync("hi", 1)
* POST https://gamepersistence.roblox.com/v1/persistence/sorted/increment?key=Test&scope=global&target=hi&by=1
  ```
  Content-Type: application/octet-stream
  Roblox-Place-Id: 1076067099
  
  <no data>
  ```
  ```
  200 OK
  content-type: application/json

  {"value":"124","usn":"124"}
  ```

#### GetOrderedDataStore("Test"):GetSortedAsync(true, 1, 1, 100)
* GET https://gamepersistence.roblox.com/v1/persistence/sorted/list?key=Test&scope=global&pageSize=1&direction=asc&minValue=1&maxValue=100&exclusiveStartKey=AQEBAQRLZXkx
  ```
  Roblox-Place-Id: 1076067099
  ```
  ```
  200 OK
  content-type: application/json

  {"entries":[{"target":"hi","value":123,"usn":"123"}],"lastEvaluatedKey":"AQEBAgRLZXky"}
  ```


ww<span>w.roblox.com
---------
#### Get info about currently logged in user
* GET https://www.roblox.com/my/account/json
* GET https://www.roblox.com/my/settings/json

#### Get collections of an user
* GET https://www.roblox.com/users/profile/robloxcollections-json?userId=4719353

#### Get favorites of an user
* GET https://www.roblox.com/users/favorites/list-json?userId=4719353&cursor=&assetTypeId=8&itemsPerPage=6

#### Delete asset from inventory
* POST https://www.roblox.com/asset/delete-from-inventory?assetId=1818
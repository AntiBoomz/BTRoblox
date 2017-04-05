BTROBLOX
===============
* [Undocumented APIs](#undocumented-apis)
  * [Group APIs](#group-apis)
  * [Friend APIs](#friend-apis)
  * [User APIs](#user-apis)
  * [Universe APIs](#universe-apis)


Undocumented APIs
--------------

### Group APIs
#### Get members of a group (as an admin)
* https://www.roblox.com/groups/1225129/groupmembers-html?pageNum=1&roleSetIdToSearch=0


### Friend APIs
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


### User APIs
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
* https://www.roblox.com/presence/users?userIds=261&userIds=4719353
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
      },
      {
          "UserPresenceType": 2,
          "LastLocation": "Crossroads",
          "AbsolutePlaceUrl": null,
          "PlaceId": 1818,
          "GameId": "f35b6d10-1864-4b3a-a77c-fa7f0661c9ce",
          "IsGamePlayableOnCurrentDevice": true,
          "UserId": 4719353,
          "EndpointType": "Presence"
      }
  ]
  ```


### Universe APIs
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

#### Get places in an universe
* https://api.roblox.com/universes/get-universe-places?universeId=13058&page=1
  * Also accepts `placeId`
  * Requires `User-Agent: Roblox/WinInet` header

  ```json
  {
      "FinalPage": true,
      "RootPlace": 1818,
      "Places": [{
          "PlaceId": 1818,
          "Name": "Classic: Crossroads"
      }],
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


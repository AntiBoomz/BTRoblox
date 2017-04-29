BTROBLOX
===============
* [Roblox Mesh Format](#roblox-mesh-format)
* [Undocumented APIs](#undocumented-apis)
  * [Group APIs](#group-apis)
  * [Friend APIs](#friend-apis)
  * [User APIs](#user-apis)
  * [Universe APIs](#universe-apis)


Roblox Mesh Format
--------------

Roblox .mesh files can be in one of two formats, [text-based](#text-based-format) or [binary](#binary-format).
The first line of the .mesh file indicates what format and version the mesh is.

### Text-Based Format (version 1)
* version 1.00
* version 1.01

First line is the version header
  * `version 1.XX`

Second line is the number of triangles in the mesh
  * `204`

Third line consists of triangle data
  * Each triangle consists of three vertices
  * Each vertex consists of three Vector3's
  * First Vector3 defines the vertex position
    * `[-6.64469,-1.06332,0.285237]`
  * Second Vector3 defines the vertex normal
    * `[0.709295,-0.617098,0.340721]`
  * Third Vector3 defines the uv coordinates
    * `[0.694823,0.788573,0]`

### Binary Format (version 2)
* version 2.00
* Format uses two number types
  * UInt32 - unsigned little-endian 32-bit integer
  * float - little-endian single-precision IEEE 754 number

The first 13 bytes contain the version header
  * bytes 0-11: `version 2.00`
  * byte 12: `0A` - newline

followed by 12 bytes containing the mesh header
  * byte 13: `0C` - Unknown, possibly length of the mesh header in bytes
  * byte 14: `00` - Unknown
  * byte 15: `24` - **vertexByteLength**, length of a vertex block in bytes
  * byte 16: `0C` - Unknown, possibly length of a triangle block in bytes
  * bytes 17-20: UInt32 **vertexCount**
  * bytes 21-24: UInt32 **triCount**

followed by **vertexCount** blocks of **vertexByteLength** bytes
| Bytes | Type  | Description                                     |
| :---- | :---- | :---------------------------------------------- |
| 4     | float | vertex.X                                        |
| 4     | float | vertex.Y                                        |
| 4     | float | vertex.Z                                        |
| 4     | float | normal.X                                        |
| 4     | float | normal.Y                                        |
| 4     | float | normal.Z                                        |
| 4     | float | uv.X                                            |
| 4     | float | 1-uv.Y                                          |
| ?     | ?     | (**vertexByteLength**-32) bytes of unknown data |

followed by **triCount** blocks of 12 bytes
| Bytes | Type   | Description             |
| :---- | :----- | :---------------------- |
| 4     | UInt32 | Index of first vertex   |
| 4     | UInt32 | Index of second vertex  |
| 4     | UInt32 | Index of third vertex   |


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


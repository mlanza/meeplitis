import _ from "../src/libs/atomic_/core.js";
import * as g from "../src/libs/game.js";
import {make} from "../src/games/backgammon/table/uJl/core.js";

_.chain({
  "req": "6g3p3",
  "seen": [0],
  "slug": "backgammon",
  "event": {
    "id": "helK3",
    "seat": 0,
    "type": "moved",
    "details": { "to": 21, "die": 3, "from": 18, "capture": false }
  },
  "seats": [
    {
      "seat_id": "NjF",
      "username": "capnemo",
      "player_id": "5e6b12f5-f24c-4fd3-8812-f537778dc5c2",
      "avatar_url": "https://www.gravatar.com/avatar/67bd5fdcc4c5ce1dc3cd2bcd4b94d253?s=300",
      "delegate_id": null
    },
    {
      "seat_id": "xyp",
      "username": "frodobaggins",
      "player_id": "c9fd78c4-6bdd-4223-8d0d-56a7b8d09c18",
      "avatar_url": "https://www.gravatar.com/avatar/ba68932bad177eb9b4e1099a2184d4a2?s=300",
      "delegate_id": "bcc3699f-9fbd-45b0-9235-de8ad578d084"
    }
  ],
  "config": { "raiseStakes": false },
  "events": [
    {
      "id": "helK3",
      "seat": 0,
      "type": "moved",
      "details": { "to": 21, "die": 3, "from": 18, "capture": false }
    }
  ],
  "release": "uJl",
  "commands": [
    { "type": "move", "details": { "to": 21, "die": 3, "from": 18 } }
  ],
  "snapshot": {
    "up": [0],
    "may": [0],
    "event": {
      "seat": 0,
      "type": "rolled",
      "details": { "dice": [3, 3] },
      "undoable": false
    },
    "state": {
      "up": 0,
      "bar": [0, 0],
      "off": [0, 0],
      "dice": [3, 3, 3, 3],
      "points": [
        [2, 0],
        [0, 1],
        [0, 2],
        [0, 0],
        [0, 2],
        [0, 6],
        [0, 0],
        [0, 1],
        [0, 0],
        [0, 0],
        [0, 0],
        [5, 0],
        [0, 1],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [4, 0],
        [0, 0],
        [0, 0],
        [1, 0],
        [3, 0],
        [0, 2]
      ],
      "rolled": true,
      "stakes": 1,
      "status": "started"
    },
    "metrics": [
      { "off": 0, "points": 1, "conceded": false },
      { "off": 0, "points": 0, "conceded": false }
    ]
  },
  "snapshot_id": "NKxX9"
}, g.ingests(make), console.log);

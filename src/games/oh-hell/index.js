import _ from "/lib/@atomic/core.js";
import * as g from "/lib/game.js";
import * as oh from "./lib/index.js";

fetch("./data/events.json").
  then(function(resp){
    return resp.json();
  }).
  then(g.aggregate(oh.ohHell([{
    username: "brielle",
    id: "8cb76dc4-4338-42d4-a324-b61fcb889bd1"
  }, {
    username: "jazz",
    id: "4c2e10da-a868-4098-aa0d-030644b4e4d7"
  }, {
    username: "todd",
    id: "c8619345-0c1a-44c4-bdfe-e6e1de11c6bd"
  }, {
    username: "mario",
    id: "5e6b12f5-f24c-4fd3-8812-f537778dc5c2"
  }], {}), _, g.inspect)).
  then(_.invoke(_, [], null)). //no new commands
  then(_.see("aggregate"));

Object.assign(window, {_, oh, g});

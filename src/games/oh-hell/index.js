import _ from "/lib/@atomic/core.js";
import * as g from "/lib/game.js";
import * as oh from "./lib/index.js";

fetch("./data/events.json").
  then(function(resp){
    return resp.json();
  }).
  then(g.aggregate(oh.ohHell(["Ava", "Zoe", "Jennabel", "Mario"], {}), _, g.inspect)).
  then(_.invoke(_, [], null)). //no new commands
  then(_.see("aggregate"));

Object.assign(window, {_, oh, g});

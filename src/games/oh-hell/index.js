import _ from "/lib/@atomic/core.js";
import $ from "/lib/@atomic/reactives.js";
import t from "/lib/@atomic/transducers.js";
import * as g from "/lib/game.js";
import * as oh from "./lib/index.js";

const game = oh.ohHell([{
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
}], {});

const $game = $.cell(game);
const exec = g.executing($game);
$.sub($.hist($game), t.map(g.summarize), _.log);

function create(){
  exec("start");
  exec("bid", {bid: 1}, 0);
  exec("bid", {bid: 1}, 1);
  exec("bid", {bid: 1}, 2);
  exec("bid", {bid: 1}, 3);
  _.dotimes(8, _.nullary(exec));
  exec("bid", {bid: 1}, 0);
  exec("bid", {bid: 1}, 1);
  exec("bid", {bid: 1}, 2);
  exec("bid", {bid: 1}, 3);
  _.dotimes(16, _.nullary(exec));
  exec("bid", {bid: 1}, 0);
  exec("bid", {bid: 1}, 1);
  exec("bid", {bid: 1}, 2);
  exec("bid", {bid: 1}, 3);
  _.dotimes(8, _.nullary(exec));
}
fetch("./data/events.json").
  then(function(resp){
    return resp.json();
  }).
  then(_.butlast).
  then(g.simulate(game, _, _.pipe(g.summarize, _.log))).
  then(_.invoke(_, [{type: "finish"}], null)). //no new commands
  then(_.see("simulate"));

Object.assign(window, {$game, exec, _, oh, g});

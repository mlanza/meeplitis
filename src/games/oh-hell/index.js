import _ from "/lib/@atomic/core.js";
import $ from "/lib/@atomic/reactives.js";
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
$.sub($game, _.see("game"));

function go(type, details, seat){
  if (arguments.length === 0) {
    const move = _.chain($game, _.deref, g.moves, _.last);
    _.swap($game, g.execute(_, move, move.seat));
  } else {
    _.swap($game, g.execute(_, {type, details: details || {}}, seat));
  }
}

function create(){
  go("start");
  go("bid", {bid: 1}, 0);
  go("bid", {bid: 1}, 1);
  go("bid", {bid: 1}, 2);
  go("bid", {bid: 1}, 3);
  go(); go();
  go(); go();
  go(); go();
  go(); go();
  go("bid", {bid: 1}, 0);
  go("bid", {bid: 1}, 1);
  go("bid", {bid: 1}, 2);
  go("bid", {bid: 1}, 3);
  go(); go();
  go(); go();
  go(); go();
  go(); go();
  go(); go();
  go(); go();
  go(); go();
  go(); go();
  go("bid", {bid: 1}, 0);
  go("bid", {bid: 1}, 1);
  go("bid", {bid: 1}, 2);
  go("bid", {bid: 1}, 3);
  go(); go();
  go(); go();
  go(); go();
  go(); go();

}

fetch("./data/events.json").
  then(function(resp){
    return resp.json();
  }).
  then(_.butlast).
  then(g.simulate(game, _, g.inspect)).
  then(_.invoke(_, [{type: "finish"}], null)). //no new commands
  then(_.see("simulate"));

Object.assign(window, {$game, go, _, oh, g});

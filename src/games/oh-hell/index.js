import _ from "/lib/@atomic/core.js";
import $ from "/lib/@atomic/reactives.js";
import t from "/lib/@atomic/transducers.js";
import * as g from "/lib/game.js";
import ohHell from "./lib/index.js";

const game = ohHell([{
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
const simulate = g.simulate(game, [], _.pipe(g.summarize, _.log));

$.sub($.hist($game), t.map(g.summarize), _.log);
//simulate(_.concat([{type: "start"}], _.repeat(44, {type: "~"})));

fetch("./data/events.json").
  then(function(resp){
    return resp.json();
  }).
  then(_.butlast).
  then(g.simulate(game, _, _.pipe(g.summarize, _.log))).
  then(_.pipe(_, _.log)).
  then(function(simulate){
    simulate([{type: "finish"}]);
    Object.assign(window, {simulate});
  });

Object.assign(window, {$game, _, $, t, g, simulate});

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
//const commands = _.take(50, _.concat([{type: "start"}], _.repeat({type: "~"})));
//$.sub($.hist($game), t.map(g.summarize), _.log);
//g.batch($game, g.run, commands);
//_.swap($game, g.run(_, [{type: "~"}]))
//_.chain($game, _.deref, g.whatif(_, [{type: "bid", details: {bid: 1}}], 0));

fetch("./data/events.json").
  then(function(resp){
    return resp.json();
  }).
  then(g.batch($game, g.load, _));

Object.assign(window, {$game, _, $, t, g});

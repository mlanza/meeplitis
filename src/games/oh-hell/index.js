import _ from "/lib/@atomic/core.js";
import $ from "/lib/@atomic/reactives.js";
import t from "/lib/@atomic/transducers.js";
import * as g from "/lib/game.js";
import ohHell from "./lib/index.js";

const $game = $.cell(ohHell(["Atticus Finch", "Scout Finch", "Boo Radley", "Bob Ewell"], {}));
const commands = _.take(1, _.concat([{type: "start"}], _.repeat({type: "~"})));
$.sub($.hist($game), t.map(g.summarize), _.log);
g.batch($game, g.run, commands);
//_.swap($game, g.run(_, [{type: "~"}]))
//_.chain($game, _.deref, g.whatif(_, [{type: "bid", details: {bid: 1}}], 0));

false && fetch("./data/events.json").
  then(function(resp){
    return resp.json();
  }).
  then(g.batch($game, g.load, _));

Object.assign(window, {$game, _, $, t, g});

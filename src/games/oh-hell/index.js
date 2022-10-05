import _ from "/lib/atomic_/core.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import g from "/lib/game_.js";
import ohHell from "./lib/index.js";

const $game = $.cell(ohHell(4, {}));
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

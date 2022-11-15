import _ from "/lib/atomic_/core.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import g from "/lib/game_.js";
import ohHell from "./lib/index.js";

const params = new URLSearchParams(document.location.search),
      split  = params.get('split') || null;


      const $game = $.cell(ohHell(_.repeat(4, {}), {}));
$.sub($.hist($game), t.map(g.summarize), _.log);
//const commands = _.take(50, _.concat([{type: "start"}], _.repeat({type: "~"})));
//g.batch($game, g.run, commands);
//_.swap($game, g.run(_, [{type: "~"}]))
//_.chain($game, _.deref, g.whatif(_, [{type: "bid", details: {bid: 1}}], 0));

function all($game){
  return [
    g.batch($game, g.load, _),
    _.constantly([])
  ];
}

function splits($game, id){
  function noHit(event){
    return event.id !== id;
  }
  return [
    _.pipe(
      _.takeWhile(noHit, _),
      g.batch($game, g.load, _)),
    _.pipe(
      _.dropWhile(noHit, _),
      _.map(_.pipe(_.dissoc(_, "id")), _),
      _.take(1, _),
      _.toArray,
      _.see("executing"),
      function(commands){
        _.swap($game, g.run(_, commands));
      })
    ];
}

const [loads, execs] = split ? splits($game, split) : all($game);
const events = fetch("./data/events.json").
  then(function(resp){
    return resp.json();
  });

events.then(loads).then(function(){
  events.then(execs);
});

Object.assign(window, {$game, _, $, t, g});

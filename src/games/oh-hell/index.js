import _ from "/lib/@atomic/core.js";
import $ from "/lib/@atomic/reactives.js";
import * as g from "/lib/game.js";
import aggregate, * as oh from "./lib/index.js";

fetch("./data/events.json").
  then(function(resp){
    return resp.json();
  }).
  then(aggregate(["Ava", "Zoe", "Jennabel", "Mario"], {}, _, function(self){
    const game = _.chain(self, _.deref);
    return _.chain(
      _.range(0, _.chain(game, _.deref, _.get(_, "seated"), _.count)),
      _.mapa(g.perspective(game, _), _),
      _.log(game, _));
  })).
  then(_.invoke(_, [], null)). //no new commands
  then(_.see("aggregate"));

Object.assign(window, {_, oh, g});

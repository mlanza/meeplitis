import core from "./@atomic/core.js";
import reactives from "./@atomic/reactives.js";
import * as g from "./game.js";
import * as oh from "./ohhell.js";
export * as oh from "./ohhell.js";
export const _ = core;
export const $ = reactives;

function play(self){
  const card = _.first(self.state.seated[self.state.up].hand);
  return commit(oh.play(card)(self));
}

function commit(self){
  return g.commit(self.state.up)(self);
}

const $state = $.cell(oh.ohHell(["Ava", "Zoe", "Jennabel", "Mario"]));
$.sub($.hist($state), function([curr, prior]){
  const added = prior ? _.last(_.count(curr.events) - _.count(prior.events), curr.events) : null;
  const moves = prior ? _.chain(curr, g.moves, _.toArray) : [];
  _.log(added, "→", curr, "moves", moves);
});
_.swap($state, g.start({}));
_.swap($state, oh.bid(0, 1));
_.swap($state, oh.bid(1, 0));
_.swap($state, oh.bid(2, 0));
_.swap($state, oh.bid(3, 1));
_.dotimes(4, function(){
  _.swap($state, play);
});
_.swap($state, oh.bid(0, 1));
_.swap($state, oh.bid(1, 0));
_.swap($state, oh.bid(2, 0));
_.swap($state, oh.bid(3, 1));
_.dotimes(8, function(){
  _.swap($state, play);
});

Object.assign(window, {_, oh, g, $state});

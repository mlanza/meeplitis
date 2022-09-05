import core from "./@atomic/core.js";
import reactives from "./@atomic/reactives.js";
import * as g from "./game.js";
import * as oh from "./ohhell.js";
export * as oh from "./ohhell.js";
export const _ = core;
export const $ = reactives;

function play(self){
  const card = _.first(g.moves(self, _.chain(self, _.deref, _.get(_, "up")))).details.card;
  return _.chain(self, oh.play(card), commit);
}

function commit(self){
  return g.commit(_.chain(self, _.deref, _.get(_, "up")))(self);
}

const $state = _.chain(["Ava", "Zoe", "Jennabel", "Mario"], oh.ohHell, _.journal, $.cell);
function dispatch(...commands){
  _.each(function(command){
    _.swap($state, _.fmap(_, command));
  }, _.flatten(commands));
}
$.sub($state, function(j){
  const [curr, prior] = _.revision(j);
  const added = prior ? _.last(_.count(curr.events) - _.count(prior.events), curr.events) : null;
  const moves = prior ? _.chain(curr, g.moves, _.toArray) : [];
  const up = prior ? g.up(curr) : [];
  const score = prior ? g.score(curr) : [];
  _.log(added, "→", curr, "up", up, "moves", moves, "score", score);
});

dispatch(
  g.start({}),
  oh.bid(0, 1), oh.bid(1, 0), oh.bid(2, 0), oh.bid(3, 1),
  _.repeat(4, play),
  oh.bid(0, 1), oh.bid(1, 0), oh.bid(2, 0), oh.bid(3, 1),
  _.repeat(8, play));

Object.assign(window, {_, oh, g, $state});

import core from "./@atomic/core.js";
import reactives from "./@atomic/reactives.js";
import * as g from "./game.js";
import * as oh from "./ohhell.js";
export * as oh from "./ohhell.js";
export const _ = core;
export const $ = reactives;

function play(self){
  const card = _.first(self.state.seated[self.state.up].hand);
  return oh.play(card)(self);
}
const $state = $.cell(oh.ohHell(["Ava", "Zoe", "Jennabel", "Mario"], {}));
$.sub($.hist($state), function([curr, prior]){
  const added = prior ? _.last(_.count(curr.events) - _.count(prior.events), curr.events) : null;
  _.log(added, "→", curr);
});
_.swap($state, g.start);
_.swap($state, oh.bid(0, 1));
_.swap($state, oh.bid(1, 0));
_.swap($state, oh.bid(2, 0));
_.swap($state, oh.bid(3, 1));
_.swap($state, play);
_.swap($state, oh.commit(0));
_.swap($state, play);
_.swap($state, oh.commit(1));
_.swap($state, play);
_.swap($state, oh.commit(2));
_.swap($state, play);
_.swap($state, oh.commit(3));

//oh.bid(1, null),
//oh.play({rank: 10, suit: "♥️"}), //TODO for this to work we have to verify we hold this card
//oh.commit(0),

Object.assign(window, {_, oh, g, $state});

//game statues: dealing, bidding, playing, finished

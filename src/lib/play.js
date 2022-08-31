import core from "./@atomic/core.js";
import * as g from "./game.js";
import * as oh from "./ohhell.js";
export * as oh from "./ohhell.js";
export const _ = core;
export const state = _.chain(
  oh.ohHell(["Ava", "Zoe", "Jennabel", "Mario"], {}),
  g.start,
  oh.bid(0, 1),
  oh.bid(1, 0),
  oh.bid(2, 0),
  oh.bid(3, 1),
  oh.bid(1, null),
  oh.play({rank: 10, suit: "♥️"}), //TODO for this to work we have to verify we hold this card
  oh.commit(0),
  _.see("state"));

Object.assign(window, {_, oh, g});

//game statues: dealing, bidding, playing, finished

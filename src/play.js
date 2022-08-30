import core from "./lib/@atomic/core.js";
import * as g from "./game.js";
import * as oh from "./ohhell.js";
export * as oh from "./ohhell.js";
export const _ = core;
export const state = _.chain(
  oh.ohHell(["Ava", "Zoe", "Jennabel", "Mario"], {}),
  g.start,
  oh.deal,
  oh.bid(0, 1),
  oh.bid(1, 0),
  oh.bid(2, 0),
  oh.bid(3, 1),
  _.see("state"));

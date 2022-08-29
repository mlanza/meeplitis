import _ from "./lib/@atomic/core.js";

export const IGame = _.protocol({
  start: null,
  log: null,
  finish: null
});

export const start = IGame.start;
export const log = IGame.log;
export const finish = IGame.finish;

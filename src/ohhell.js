import _ from "./lib/@atomic/core.js";
import * as g from "./game.js";

function OhHell(seated, config, events){
  this.seated = seated;
  this.config = config;
  this.events = events;
}

export function ohHell(seated, config, events = []){
  return new OhHell(seated, config, events);
}

function start(self, state){
  return ohHell(self.seated, self.config, _.prepend(self.events, {type: start, details: {}}));
}

function finish(self){

}

function log(self, details){

}

_.doto(OhHell,
  _.implement(g.IGame, {start, log, finish}));






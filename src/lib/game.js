import _ from "./@atomic/core.js";
import $ from "./@atomic/reactives.js";

export const IGame = _.protocol({
  perspective: null,
  up: null, //returns the seat(s) which are required to move
  seated: null,
  moves: null, //what commands can seats/players do?
  conclude: null,
  irreversible: null, //can the command be reversed by a player?
  execute: null, //validates a command and transforms it into one or more events, potentially executing other commands
  fold: null, //folds an event into the aggregate state
  score: null //maintains current interim and/or final scoring and rankings as possible
});

export const irreversible = IGame.irreversible;
export const up = IGame.up;
export const fold = _.partly(IGame.fold);
export const seated = IGame.seated;
export const score = IGame.score;
export const perspective = _.chain(IGame.perspective,
  _.post(_,
    _.and(
      _.contains(_, "seat"),
      _.contains(_, "seated"),
      _.contains(_, "state"),
      _.contains(_, "events"),
      _.contains(_, "moves"),
      _.contains(_, "score"),
      _.contains(_, "up"))),
  _.partly);

function over(self){
  return _.chain(self.events, _.last, _.get(_, "type"), _.eq(_, "finish"));
}

export function conclude(self){
  return _.seq(moves(self)) || over(self) ? self : IGame.conclude(self);
}

function execute3(self, command, seat){
  const {type} = command;
  const event = Object.assign({seat}, command);
  switch(type){
    case "undo":
      return (function(){
        if (!_.undoable(self.journal)){
          throw new Error("Undo is not possible or allowed.");
        }
        return conclude(IGame.fold(self, event));
      })();

    case "redo":
      return (function(){
        if (!_.redoable(self.journal)){
          throw new Error("Redo is not possible or allowed.");
        }
        return conclude(IGame.fold(self, event));
      })();

    case "commit":
      return (function(){
        if (!_.flushable(self.journal)){
          throw new Error("Commit is not possible or allowed.");
        }
        return conclude(IGame.fold(self, event));
      })();

    default:
      return conclude(IGame.execute(self, event, seat));

  }
}

export const execute = _.partly(_.overload(null, null, execute3, execute3));

export function invalid(self, command, seat){
  try {
    execute(self, command, seat); //potentially throw error
    return null;
  } catch (ex) {
    return _.str(ex);
  }
}

export function load(self, events){
  return _.reduce(fold, self, events);
}

export function added(curr, prior){
  return prior ? _.chain(curr.events, _.last(_.count(curr.events) - _.count(prior.events), _), _.toArray) : [];
}

function moves2(self, seat){
  return _.filter(_.pipe(_.get(_, "seat"), _.eq(_, seat)), IGame.moves(self));
}

export const moves = _.partly(_.overload(null, IGame.moves, moves2));

export function start(self){
  const config = self.config;
  return execute(self, {type: "start", details: {config}});
}

export function finish(self){
  return execute(self, {type: "finish"});
}

export function undo(seat){
  return function(self){
    return execute(self, {type: "undo", seat});
  }
}

export function redo(seat){
  return function(self){
    return execute(self, {type: "redo", seat});
  }
}

export function commit(seat){ //confirms otherwise tentative moves
  return function(self){
    return execute(self, {type: "commit"}, seat);
  }
}

export function inspect(self){
  return _.chain(
    _.cons(null, _.range(0, _.chain(self, seated, _.count))),
    _.mapa(perspective(self, _), _),
    _.log(self, _));
}

function simulate2(self, events){
  return simulate3(self, events, null);
}

function simulate3(self, events, f){ //observability
  const $state = $.cell(self);
  const seated = IGame.seated(self);
  if (f) {
    $.sub($state, f);
    _.each(function(event){
      _.swap($state, fold(_, event));
    }, events);
  } else {
    _.swap($state, load(_, events));
  }
  return function(commands, seat){
    const prior = _.chain($state, _.deref);
    _.each(function(command){
      _.swap($state, execute(_, command, seat));
    }, commands);
    const curr = _.chain($state, _.deref);
    return [perspective(curr, seat), added(curr, prior)];
  }
}

function simulate4(self, events, commands, seat){
  return simulate2(self, events)(commands, seat);
}

export const simulate = _.partly(_.overload(null, null, simulate2, simulate3, simulate4));

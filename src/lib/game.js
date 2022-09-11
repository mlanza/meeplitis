import _ from "./@atomic/core.js";

export const IGame = _.protocol({
  perspective: null,
  up: null, //returns the seat(s) which are required to move
  seated: null,
  moves: null, //what commands can seats/players do?
  irreversible: null, //can the command be reversed by a player?
  execute: null, //validates a command and transforms it into one or more events, potentially executing other commands
  fold: null, //folds an event into the aggregate state
  score: null //maintains current interim and/or final scoring and rankings as possible
});

function irreversible3(self, event, f){
  return _.pipe(confirmational(event) ? f : _.fmap(_, f),
    IGame.irreversible(self, event) ? _.flush : _.identity);
}

export const irreversible = _.partly(_.overload(null, null, IGame.irreversible, irreversible3));
export const up = IGame.up;
export const seated = IGame.seated;
export const score = IGame.score;
export const perspective = _.chain(IGame.perspective,
  _.post(_,
    _.and(
      _.contains(_, "seat"),
      _.contains(_, "state"),
      _.contains(_, "events"),
      _.contains(_, "moves"),
      _.contains(_, "score"),
      _.contains(_, "up"))),
  _.partly);

function fold2(self, event){
  const {type, details, seat} = event;
  switch (type) {
    case "undo":
      return IGame.fold(self, event, _.undo);

    case "redo":
      return IGame.fold(self, event, _.redo);

    case "clear":
      return IGame.fold(self, event, _.flush);

    default:
      return IGame.fold(self, event);
  }
}

export const fold = _.partly(_.overload(null, null, fold2, IGame.fold));

function execute3(self, command, seat){
  const {type} = command;
  const id = _.uident(5);
  const event = Object.assign({id, seat}, command);
  switch(type){
    case "undo":
      return (function(){
        if (!_.undoable(self.journal)){
          throw new Error("Undo is not possible or allowed.");
        }
        return fold2(self, event);
      })();

    case "redo":
      return (function(){
        if (!_.redoable(self.journal)){
          throw new Error("Redo is not possible or allowed.");
        }
        return fold2(self, event);
      })();

    case "clear":
      return (function(){
        if (!_.flushable(self.journal)){
          throw new Error("Clear is not possible or allowed.");
        }
        return fold2(self, event);
      })();

    default:
      return IGame.execute(self, event, seat);

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

export function commit(seat){ //treats moves as tentative
  return function(self){
    return execute(self, {type: "commit"}, seat);
  }
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

export function clear(seat){
  return function(self){
    return execute(self, {type: "clear", seat});
  }
}

export function confirmational(command){
  return _.includes(["undo", "redo", "clear"], command.type);
}

export function inspect(self){
  const game = _.chain(self, _.deref);
  return _.chain(
    _.cons(null, _.range(0, _.chain(game, seated, _.count))),
    _.mapa(perspective(game, _), _),
    _.log(game, _));
}

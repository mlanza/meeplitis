import _ from "./@atomic/core.js";

export const IGame = _.protocol({
  up: null, //returns the seat(s) which are required to move
  moves: null, //what can be done now and by which seats/players?
  irreversible: null, //what commands/events cannot be undone?
  execute: null, //validates a command, confirms it as an event
  raise: null,
  score: null //maintains current interim and/or final scoring and rankings as possible
});

export const up = IGame.up;
export const score = IGame.score;
export const raise = _.partly(IGame.raise);
export const irreversible = IGame.irreversible;


const execute3 = _.partly(function execute3(self, command, seat){
  const {type} = command;
  const event = Object.assign({seat: seat}, command);
  switch(type){
    case "undo":
      return (function(){
        if (!_.undoable(self.journal)){
          throw new Error("Undo is not possible or allowed.");
        }
        return IGame.raise(self, event, _.undo);
      })();

    case "redo":
      return (function(){
        if (!_.redoable(self.journal)){
          throw new Error("Redo is not possible or allowed.");
        }
        return IGame.raise(self, event, _.redo);
      })();

    case "clear":
      return (function(){
        if (!_.flushable(self.journal)){
          throw new Error("Clear is not possible or allowed.");
        }
        return IGame.raise(self, event, _.flush);
      })();

    default:
      return IGame.execute(self, command, seat);

  }
});

export const execute = _.partly(_.overload(null, null, execute3(_, _, null), execute3));

function moves2(self, seat){
  return _.filtera(_.pipe(_.get(_, "seat"), _.eq(_, seat)), IGame.moves(self))
}

export const moves = _.partly(_.overload(null, IGame.moves, moves2));

export function start(config){
  return function(self){
    return execute(self, {type: "start", details: {config}});
  }
}

//commit a tentative move
export function commit(seat){
  return function(self){
    return execute(self, {type: "commit"}, seat);
  }
}

export function confirming(command){
  return _.includes(["undo", "redo", "clear"], command.type);
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

export function clear(seat){
  return function(self){
    return execute(self, {type: "clear", seat});
  }
}

export function deal(deck, hands, cards){
  const n = cards * hands;
  return [
    _.chain(deck,
      _.drop(n, _),
      _.toArray),
    _.chain(deck,
      _.take(n, _),
      _.mapa(function(card, hand){
        return [card, hand];
      }, _, _.cycle(_.range(hands))),
      _.reduce(function(memo, [card, hand]){
        return _.update(memo, hand, _.conj(_, card));
      }, Array.from(_.repeat(hands, [])), _))
  ];
}

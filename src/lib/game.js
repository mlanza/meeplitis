import _ from "./@atomic/core.js";

export const IGame = _.protocol({
  up: null, //returns the seat(s) which are required to move
  moves: null, //what can be done now and by which seats/players?
  execute: null, //validates a command, confirms it as an event
  score: null //maintains current interim and/or final scoring and rankings as possible
});

export const up = IGame.up;

export const execute = _.partly(_.overload(null, null, function(self, command){
  return IGame.execute(self, command, null);
}, IGame.execute));

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

export function finish(self){
  return execute(self, {type: "finish"});
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

import _ from "./@atomic/core.js";

export const IGame = _.protocol({
  execute: null, //validates a command, confirms it as an event
  moves: null, //what can be done now and by which seats/players?
  ranking: null //final and/or current standings if interim scoring is possible
});

export const execute = _.partly(_.overload(null, null, function(self, command){
  return IGame.execute(self, command, null);
}, IGame.execute));

export function start(config){
  return function(self){
    return execute(self, {type: "start", details: {config}});
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

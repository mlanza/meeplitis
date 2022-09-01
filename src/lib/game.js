import _ from "./@atomic/core.js";

export const IGame = _.protocol({
  start: null,
  execute: null,
  commit: null,
  finish: null
});

export const start = IGame.start;
export const execute = _.overload(null, null, function(self, command){
  return IGame.execute(self, command, null);
}, IGame.execute);
export const commit = IGame.commit;
export const finish = IGame.finish;

export function status(self, status){
  const obj = _.clone(self);
  obj.status = status;
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

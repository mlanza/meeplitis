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

export function generateUID(len){
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const max = _.count(chars) - 1;
  const id = [];
  while (id.length < len) {
    id.push(chars[_.randInt(max)]);
  }
  return _.join("", id);
}

import _ from "./lib/@atomic/core.js";

export const IGame = _.protocol({
  start: null,
  step: null,
  confirm: null,
  finish: null
});

export const start = IGame.start;
export const step = IGame.step;
export const confirm = IGame.confirm;
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
        _.log("memo", memo, "card", card, "hand", hand);
        return _.update(memo, hand, _.conj(_, card));
      }, Array.from(_.repeat(hands, [])), _))
  ];
}

import _ from "./lib/@atomic/core.js";
import {IGame} from "./game.js";
import * as g from "./game.js";

function Card(suit, rank){
  this.suit = suit;
  this.rank = rank;
}

function name(self){
  const face = {11: "Jack", 12: "King", 13: "Queen", 14: "Ace"}[self.rank] || self.rank;
  return `${face} ${self.suit}`;
}

_.doto(Card,
  _.implement(_.INamable, {name}));

function card(suit, rank){
  return new Card(suit, rank);
}

export function ranked(cards, trump){ //begin with lead card then follow in play order
  const lead = cards[0].suit;
  function rank(card){
    return (card.suit === trump ? 100 : 0) + (card.suit === lead ? 0 : -50) + card.rank;
  }
  function compare(a, b){
    return rank(b) - rank(a);
  }
  return Array.from(cards).filter(function(card){
    return card.suit === lead || card.suit === trump;
  }).sort(compare);
}

function deck(){
  return _.braid(card, ["♥️", "♠️", "♦️", "♣️"], _.range(2, 15));
}

function OhHell(seated, config, events, state){
  this.seated = seated;
  this.config = config;
  this.events = events;
  this.state = state;
}

export function ohHell(seated, config, events = [], state = null){
  return new OhHell(seated, config, events, state);
}

function start(self){
  const cards = _.shuffle(deck());
  const details = {deck: cards, round: 0, deal: [1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1], readies: 0};
  return ohHell(self.seated, self.config, _.append(self.events, {type: "start", details, status: "confirmed"}), details);
}

function finish(self){
}

export function deal(self){
  const {deck, round, deal} = self.state, cards = deal[round];
  const [_deck, hands] = g.deal(deck, _.count(self.seated), cards);
  const trump = _.first(_deck);
  return step(self, {type: "deal", details: {hands, trump}})
}

export function bid(seat, tricks){
  return function(self){
    return step(self, {type: "bid", details: {tricks}, seat});
  }
}

function step(self, event){
  //TODO implement all state reductions
  const {type, details} = event;
  const status = {"bid": "readied", "deal": "confirmed", "start": "confirmed"}[event.type] || "tentative";
  let events = _.append(self.events, Object.assign(event, {status}));
  let state = null;
  switch(event.type) {
    case "start":
      state = event[details];
      break;

    case "bid":
      state = self.state;
      const tail = _.chain(
        events,
        _.last(_.count(self.seated), _));
      const ready = _.every(
        _.and(
          _.pipe(_.get(_, "type"), _.eq(_, "bid")),
          _.pipe(_.get(_, "status"), _.eq(_, "readied"))), tail) && _.count(tail) === _.count(self.seated);
      if (ready) {
        events = _.toArray(_.concat(_.take(_.count(events) - _.count(tail)), _.map(_.assoc(_, "status", "confirmed"), tail)));
      }
      break;
  }
  return _.chain(ohHell(self.seated, self.config, events, state), _.see("step"));

}

function confirm(self){

}

_.doto(OhHell,
  _.implement(IGame, {start, step, confirm, finish}));

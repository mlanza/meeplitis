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
  const details = {deck: cards, round: 0, deal: [1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1]};
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

//commit everything prior to the last confirmed event
function commit(self){
  const _events = _.chain(self.events,
    _.reverse,
    _.reduce(function({events, confirmed}, event){
      const _confirmed = confirmed || event.status === "confirmed",
            _events = _.append(events, _confirmed && event.status !== "confirmed" ? _.assoc(event, "status", "confirmed") : event);
      return {events: _events, confirmed: _confirmed};
    }, {events: [], confirmed: false}, _),
    _.get(_, "events"),
    _.reverse,
    _.toArray);
  return ohHell(self.seated, self.config, _events, self.state);
}

function step(self, event){
  //TODO implement all state reductions
  const {type, details} = event;
  switch(event.type) {
    case "start":
      return _.chain(ohHell(self.seated, self.config, _.append(self.events, Object.assign(event, {status: "confirmed"})), event[details]));

    case "deal":
      return _.chain(ohHell(self.seated, self.config, _.append(self.events, Object.assign(event, {status: "confirmed"})), self.state));

    case "bid":
      const s = _.count(self.seated) - 1;
      const tail = _.chain(
        self.events,
        _.last(s, _));
      return _.chain(
        ohHell(self.seated, self.config,
          _.append(self.events,
            _.assoc(event, "status",
              _.every(
                _.and(
                  _.pipe(_.get(_, "type"), _.eq(_, "bid")),
                  _.pipe(_.get(_, "status"), _.eq(_, "readied"))), tail) && _.count(tail) === s ? "confirmed" : "readied")), self.state),
        commit);
  }

}

function confirm(self){

}

_.doto(OhHell,
  _.implement(IGame, {start, step, confirm, finish}));

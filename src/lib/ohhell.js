import _ from "./@atomic/core.js";
import {IGame} from "./game.js";
import * as g from "./game.js";

const suits = ["♥️", "♠️", "♦️", "♣️"];
const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "K", "Q", "A"];

function name(self){
  const face = {"J": "Jack", "K": "King", "Q": "Queen", "A": "Ace"}[self.rank] || self.rank;
  return `${face} ${self.suit}`;
}

function card(suit, rank){
  return {suit, rank};
}

function rank(card){
  const n = _.indexOf(ranks, card.rank);
  return (card.suit === trump ? 100 : 0) + (card.suit === lead ? 0 : -50) + n;
}

export function ranked(cards, trump){ //begin with lead card then follow in play order
  const lead = cards[0].suit;
  function compare(a, b){
    return rank(b) - rank(a);
  }
  return Array.from(cards).filter(function(card){
    return card.suit === lead || card.suit === trump;
  }).sort(compare);
}

function deck(){
  return _.braid(card, suits, ranks);
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
  return _.chain(self, function(self){
    return g.execute(self, {type: "start", details});
  }, deal);
}

function finish(self){
  const summary = {seatsRanked: [0, 2, 1, 3]}; //TODO compute
  return g.execute(self, {type: "finish", details: summary});
}

function deal(self){
  const {deck, round, deal} = self.state, cards = deal[round];
  const [_deck, hands] = g.deal(deck, _.count(self.seated), cards);
  const trump = _.first(_deck);
  return g.execute(self, {type: "deal", details: {hands, trump}})
}

//bids are simultaneous and blind
export function bid(seat, tricks){ //command
  return function(self){
    return g.execute(self, {type: "bid", details: {tricks}}, seat);
  }
}

export function play(card){ //command
  return function(self){
    const seat = 0; //TODO
    return g.execute(self, {type: "play", details: {card}}, seat);
  }
}

//the command will be fully computed by the request and the game state when passed in
function execute(self, command, seat){
  //TODO implement all state reductions
  const {type, details} = command;
  const cmd = Object.assign({seat}, command);
  switch (type) {
    case "start":
      return ohHell(self.seated, self.config, _.append(self.events, cmd), details);

    default:
      return ohHell(self.seated, self.config, _.append(self.events, cmd), self.state);
    }
}

//commit a tentative move
export function commit(seat){
  return function(self){
    return g.execute(self, {type: "commit"}, seat);
  }
}

_.doto(OhHell,
  _.implement(IGame, {start, execute, commit, finish}));

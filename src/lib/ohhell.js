import _ from "./@atomic/core.js";
import {IGame} from "./game.js";
import * as g from "./game.js";

const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "K", "Q", "A"];
const suits = ["♥️", "♠️", "♦️", "♣️"];
const handSizes = [1, 2 /*, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1*/];

function name(self){
  const face = {"J": "Jack", "K": "King", "Q": "Queen", "A": "Ace"}[self.rank] || self.rank;
  return `${face} ${self.suit}`;
}

function card(rank, suit){
  return {rank, suit};
}

function rank(card, trump, lead){
  const n = _.indexOf(ranks, card.rank);
  return (card.suit === trump ? 100 : 0) + (card.suit === lead ? 0 : -50) + n;
}

export function ranked(cards, trump){ //begin with lead card then follow in play order
  const lead = _.first(cards).suit;
  function compare(a, b){
    return rank(b, trump, lead) - rank(a, trump, lead);
  }
  return Array.from(cards).filter(function(card){
    return card.suit === lead || card.suit === trump;
  }).sort(compare);
}

function deck(){
  return _.braid(card, ranks, suits);
}

function OhHell(seated, config, status, events, state){
  this.seated = seated;
  this.config = config;
  this.status = status;
  this.events = events;
  this.state = state;
}

export function ohHell(seated, config, status, events = [], state = null){
  return new OhHell(seated, config, status, events, state);
}

export function swap(self, f){
  return ohHell(self.seated, self.config, self.status, self.events, f(state));
}

function start(self){
  const cards = _.shuffle(deck());
  const details = {
    deck: cards,
    round: 0,
    seated: _.chain(self.seated, _.count, _.repeat(_, {scored: []}), _.toArray)
  };
  return _.chain(self, function(self){
    return g.execute(self, {type: "start", details});
  }, deal);
}

function finish(self){
  return g.execute(self, {type: "finish"});
}

function deal(self){
  const {deck, round, deal} = self.state, cards = handSizes[round];
  const [_deck, hands] = g.deal(deck, _.count(self.seated), cards);
  const trump = _.first(_deck);
  return g.execute(self, {type: "deal", details: {hands, trump, round}})
}

//bids are simultaneous and blind
export function bid(seat, bid){ //command
  return function(self){
    return g.execute(self, {type: "bid", details: {bid}}, seat);
  }
}

export function play(card){ //command
  return function(self){
    const has = _.detect(function(c){
      return card.suit == c.suit && card.rank == c.rank;
    }, self.state.seated[self.state.up].hand);
    return g.execute(self, {type: "play", details: {card}}, self.state.up);
  }
}

const after = _.partly(function after(seat, seats){
  const max = seats - 1;
  const n = seat + 1;
  return n > max ? 0 : n;
});

function ordered(seats, lead){
  return _.chain(seats, _.range, _.cycle, _.dropWhile(_.notEq(_, lead), _), _.take(seats, _), _.toArray);
}

const scoreRound = _.update(_, "seated", _.foldkv(function(memo, idx, seat){
  const tricks = _.count(seat.tricks),
        bid = seat.bid,
        points = tricks === bid ? 10 + tricks : 0;
  return _.assoc(memo, idx, _.update(seat, "scored", _.conj(_, {bid, tricks, points})));
}, [], _));

function execute(self, command, seat){
  //TODO validate all commands before executing
  const {type, details} = command;
  const cmd = Object.assign({seat}, command);
  switch (type) {
    case "start":
      return ohHell(self.seated, self.config, "ready", _.append(self.events, cmd), details);

    case "commit":
      const endRound = _.chain(self.state.seated, _.mapa(_.get(_, "hand"), _), _.flatten, _.compact, _.seq, _.not);
      const endGame = endRound && !handSizes[self.state.round];
      const up = _.second(ordered(_.count(self.seated), self.state.up));
      return _.chain(
        ohHell(self.seated, self.config, self.status, _.append(self.events, cmd),
          _.chain(self.state, endRound ? scoreRound : _.identity, _.assoc(_, "up", up))),
          endRound ? (endGame ? finish : deal) : _.identity);

    case "deal":
      const lead = self.state.round % _.count(self.seated);
      const cards = _.chain(details.hands, _.flatten, _.toArray);
      const deck = _.chain(self.state.deck, _.remove(_.includes(cards, _), _), _.toArray);
      return ohHell(self.seated, self.config, "bidding", _.append(self.events, cmd),
        _.chain(self.state,
          _.assoc(_, "trump", details.trump),
          _.assoc(_, "lead", lead),
          _.assoc(_, "up", lead),
          _.assoc(_, "deck", deck),
          _.update(_, "round", _.inc),
          _.foldkv(function(memo, seat, hand){
            return _.updateIn(memo, ["seated", seat], function(seated){
              return Object.assign({}, seated, {hand, tricks: [], bid: null, played: null});
            });
          }, _, details.hands)));

    case "bid":
      return _.chain(self.state, _.assocIn(_, ["seated", seat, "bid"], details.bid), function(state){
        const bids = _.chain(_.range(_.count(self.seated)), _.mapa(function(seat){
          return _.getIn(state, ["seated", seat, "bid"]);
        }, _));
        return ohHell(self.seated, self.config, _.count(_.filter(_.isSome, bids)) == _.count(self.seated) ? "playing" : self.status, _.append(self.events, cmd), state);
      });

    case "award":
      return ohHell(self.seated, self.config, "awarded", _.append(self.events, cmd),
        _.chain(self.state,
          _.update(_, "seated", _.mapa(function(seat){
            return _.assoc(seat, "played", null);
          }, _)),
          _.updateIn(_, ["seated", details.winner, "tricks"], _.conj(_, details.trick)),
          _.assoc(_, "lead", details.winner)));

    case "play":
      if (!details.card) {
        throw new Error("Must specify a card");
      }
      return _.chain(self.state,
        _.assocIn(_, ["seated", seat, "played"], details.card),
        _.updateIn(_, ["seated", seat, "hand"], _.pipe(_.remove(_.eq(_, details.card), _), _.toArray)),
        function(state){
          _.count(_.getIn(self.state, ["seated", seat, "hand"])) - _.count(_.getIn(state, ["seated", seat, "hand"]))
          const ord = ordered(_.count(self.seated), state.lead);
          const trick = _.mapa(_.pipe(_.array(_, "played"), _.getIn(state.seated, _)), ord);
          const award = _.count(_.filter(_.isSome, trick)) == _.count(self.seated);
          if (award){
            const ranking = ranked(trick, state.trump.suit);
            const best = _.first(ranking);
            const winner = _.indexOf(trick, best);
            return _.chain(
              ohHell(self.seated, self.config, "awarding", _.append(self.events, cmd), state),
               g.execute(_, {type: "award", details: {winner, trick}}));
          }
          return ohHell(self.seated, self.config, "playing", _.append(self.events, cmd), state);
        });

    case "finish":
      return ohHell(self.seated, self.config, "finished", _.chain(cmd, function(cmd){
        const scores = _.mapa(function(seat){
          return _.sum(_.map(_.get(_, "points"), seat.scored));
        }, self.state.seated);
        const places = _.chain(scores, _.unique, _.sort, _.reverse, _.toArray);
        const ranked = _.chain(self.state.seated, _.mapIndexed(function(seat){
          const points = _.nth(scores, seat);
          const place = _.indexOf(places, points);
          const tie = _.count(_.filter(_.eq(_, points), scores)) > 1;
          return {seat, points, place, tie};
        }, _), _.sort(_.asc(_.get(_, "place")), _));
        return _.assoc(cmd, "details", {ranked})
      }, _.append(self.events, _)), self.state);

    default:
      throw new Error("Unknown command");
    }
}

//commit a tentative move
export function commit(seat){
  return function(self){
    return g.execute(self, {type: "commit"}, seat);
  }
}

_.doto(OhHell,
  _.implement(_.ISwappable, {swap}),
  _.implement(IGame, {start, execute, commit, finish}));

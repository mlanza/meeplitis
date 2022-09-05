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

function OhHell(seated, events, state){
  this.seated = seated;
  this.events = events;
  this.state = state;
}

export function ohHell(seated, events = [], state = null){
  return new OhHell(seated, events, state);
}

export function swap(self, f){
  return ohHell(self.seated, self.events, f(state));
}

function deal(self){
  return g.execute(self, {type: "deal"});
}

//bids are simultaneous and blind
export function bid(seat, bid){
  return function(self){
    return g.execute(self, {type: "bid", details: {bid}}, seat);
  }
}

export function play(card){
  return function(self){
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

function follow(self){
  return self.state.seated[self.state.lead].played || null;
}

function broken(self, trump){
  return !!_.chain(self.state.seated, _.mapcat(_.get(_, "tricks"), _), _.detect(_.eq(_, trump.suit), _));
}

function tight(hand){
  return _.chain(hand, _.map(_.get(_, "suit"), _), _.unique, _.count, _.eq(_, 1));
}

function bidding(self){
  return _.count(_.filter(_.isSome, _.map(_.get(_, "bid"), self.state.seated))) !== _.count(self.seated);
}

function up(self){
  return _.chain(self.state.seated, _.mapIndexed(function(seat, data){
    return {seat, bid: data.bid};
  }, _), _.filter(function(seat){
    return seat.bid == null;
  }, _), _.mapa(_.get(_, "seat"), _), _.seq) || [self.state.up];
}

//TODO factor in trumps being broken
//TODO list only valid plays
function moves(self){
  const allBidsIn = !bidding(self);
  const maxBid = handSizes[self.state.round - 1];
  const bids = _.cons(null, _.range(0, maxBid + 1));
  if (allBidsIn) {
    const seat = self.state.up;
    const seated = self.state.seated[seat];
    const lead = follow(self);
    const trump = self.state.trump;
    const hand = seated.hand;
    const follows = lead ? _.pipe(_.get(_, "suit"), _.eq(_, lead.suit)) : _.identity;
    const canFollow = _.detect(follows, hand);
    const playable = lead ? (canFollow ? _.filter(follows, hand) : hand) : broken(self, trump) || tight(hand) ? hand : _.filter(_.pipe(_.get(_, "suit"), _.notEq(_, trump.suit)), hand);
    const type = seated.played ? "commit" : "play";
    return _.mapa(function(card){
      return {type, seat, details: {card}};
    }, playable);
  } else {
    return _.chain(self.state.seated, _.mapIndexed(function(idx, seat){
      return [allBidsIn ? [] : _.chain(bids, _.map(function(bid){
        return {type: "bid", details: {bid}, seat: idx};
      }, _), _.remove(_.pipe(_.getIn(_, ["details", "bid"]), _.eq(_, seat.bid)), _))];
    }, _), _.flatten, _.compact, _.toArray);
  }
}

function execute(self, command, seat){
  //TODO validate all commands before executing
  const {type, details} = command;
  const cmd = Object.assign({seat}, command);
  switch (type) {
    case "start":
      return (function(){
        const _details = Object.assign({
          deck: _.shuffle(deck()),
          round: 0,
          seated: _.chain(self.seated, _.count, _.repeat(_, {scored: []}), _.toArray)
        }, details);
        return _.chain(ohHell(self.seated, _.append(self.events, _.assoc(cmd, "details", _details)), _details), deal);
      })();

    case "deal":
      return (function(){
        const {deck, round, deal} = self.state, num = handSizes[round];
        const [_deck, hands] = g.deal(deck, _.count(self.seated), num);
        const trump = _.first(_deck);
        const lead = self.state.round % _.count(self.seated);
        const cards = _.chain(hands, _.flatten, _.toArray);
        const undealt = _.chain(self.state.deck, _.remove(_.includes(cards, _), _), _.toArray);
        return ohHell(self.seated, _.append(self.events, _.merge(cmd, {hands, trump, round})),
          _.chain(self.state,
            _.assoc(_, "trump", trump),
            _.assoc(_, "lead", lead),
            _.assoc(_, "up", lead),
            _.assoc(_, "deck", undealt),
            _.update(_, "round", _.inc),
            _.foldkv(function(memo, seat, hand){
              return _.updateIn(memo, ["seated", seat], function(seated){
                return Object.assign({}, seated, {hand, tricks: [], bid: null, played: null});
              });
            }, _, hands)));
      })();

    case "bid":
      return (function(){
        const valid = _.detect(_.eq(_, cmd), g.moves(self, seat));
        if (!valid) {
          throw new Error("Invalid bid");
        }
        return _.chain(self.state, _.assocIn(_, ["seated", seat, "bid"], details.bid), function(state){
          const bids = _.chain(_.range(_.count(self.seated)), _.mapa(function(seat){
            return _.getIn(state, ["seated", seat, "bid"]);
          }, _));
          return ohHell(self.seated, _.append(self.events, cmd), state);
        });
      })();

    case "play":
      return (function(){
        const card = details.card;
        if (!card) {
          throw new Error("Must provide a card");
        }
        const valid = _.detect(_.eq(_, cmd), g.moves(self, seat));
        if (!valid) {
          throw new Error("Invalid play");
        }
        return _.chain(self.state,
          _.assocIn(_, ["seated", seat, "played"], details.card),
          _.updateIn(_, ["seated", seat, "hand"], _.pipe(_.remove(_.eq(_, details.card), _), _.toArray)),
          function(state){
            const ord = ordered(_.count(self.seated), state.lead);
            const trick = _.mapa(_.pipe(_.array(_, "played"), _.getIn(state.seated, _)), ord);
            const award = _.count(_.filter(_.isSome, trick)) == _.count(self.seated);
            const oh = ohHell(self.seated, _.append(self.events, cmd), state);
            if (award){
              const ranking = ranked(trick, state.trump.suit);
              const best = _.first(ranking);
              const winner = _.indexOf(trick, best);
              return _.chain(oh,
                 g.execute(_, {type: "award", details: {winner, trick}}));
            }
            return oh;
          });
      })();

      case "award":
        return (function(){
          return ohHell(self.seated, _.append(self.events, cmd),
          _.chain(self.state,
            _.update(_, "seated", _.mapa(function(seat){
              return _.assoc(seat, "played", null);
            }, _)),
            _.updateIn(_, ["seated", details.winner, "tricks"], _.conj(_, details.trick)),
            _.assoc(_, "lead", details.winner)));
        })();

      case "commit":
        return (function(){
          const endRound = _.chain(self.state.seated, _.mapa(_.get(_, "hand"), _), _.flatten, _.compact, _.seq, _.not);
          const endGame = endRound && !handSizes[self.state.round];
          const up = _.second(ordered(_.count(self.seated), self.state.up));
          return _.chain(
            ohHell(self.seated, _.append(self.events, cmd),
              _.chain(self.state, endRound ? scoreRound : _.identity, _.assoc(_, "up", up))),
              endRound ? (endGame ? g.finish : deal) : _.identity);
        })();

    case "finish":
      return (function(){
        return ohHell(self.seated, _.chain(cmd, function(cmd){
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
      })();

    default:
      throw new Error("Unknown command");

    }
}

_.doto(OhHell,
  _.implement(_.ISwappable, {swap}),
  _.implement(IGame, {up, moves, execute}));

import _ from "/lib/atomic_/core.js";
import g from "/lib/game_.js";

const IGame = g.IGame;
const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "K", "Q", "A"];
const suits = ["♥️", "♠️", "♦️", "♣️"];

function upAndDown(min, max){
  return _.toArray(_.dedupe(_.concat(_.range(min, max + 1), _.range(max, min - 1, -1))));
}

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

function ranked(cards, trump){ //begin with lead card then follow in play order
  const lead = _.first(cards).suit;
  function compare(a, b){
    return rank(b, trump, lead) - rank(a, trump, lead);
  }
  return _.chain(cards, _.filter(function(card){
    return card.suit === lead || card.suit === trump;
  }, _), _.sort(compare, _));
}

function deck(){
  return _.braid(card, ranks, suits);
}

function OhHell(seats, config, events, journal){
  this.seats = seats;
  this.config = config;
  this.events = events;
  this.journal = journal;
}

export default function ohHell(seats, config, events, journal){
  if (!_.count(seats)) {
    throw new Error("Cannot play a game with no one seated at the table");
  }
  return new OhHell(_.toArray(seats), config, events || [], journal || _.journal({deals: upAndDown(config.min || 1, config.max || 7)}));
}

function deal(self){
  return g.execute(self, {type: "deal"});
}

function award(lead, best, winner, trick){
  return function(self)  {
    return g.execute(self, {type: "award", details: {lead, best, winner, trick}});
  }
}

function ordered(seats, lead){
  return _.chain(seats, _.range, _.cycle, _.dropWhile(_.notEq(_, lead), _), _.take(seats, _), _.toArray);
}

function follow(state){
  return state.seated[state.lead].played || null;
}

function tight(hand){
  return _.chain(hand, _.map(_.get(_, "suit"), _), _.unique, _.count, _.eq(_, 1));
}

function bidding(state){
  return _.count(_.filter(_.isSome, _.map(_.get(_, "bid"), state.seated))) !== _.count(state.seated)
}

function handsEmpty(state){
  return _.chain(state, _.get(_, "seated"), _.mapa(_.get(_, "hand"), _), _.flatten, _.compact, _.seq, _.not);
}

function up(self){
  const state = _.deref(self);
  return _.chain(state.seated, _.mapIndexed(function(seat, {bid}){
    return {seat, bid};
  }, _), _.filter(function(seat){
    return seat.bid == null;
  }, _), _.mapa(_.get(_, "seat"), _), _.seq) || (state.up == null ? [] : [state.up]);
}

function may(self){
  return _.unique(_.map(function({seat}){
    return seat;
  }, g.moves(self, g.seated(self))));
}

function score(self){
  const state = _.deref(self);
  return _.chain(state.seated, _.mapa(function(seat){
    return _.sum(_.map(_.get(_, "points"), seat.scored));
  }, _));
}

function bids(state){
  const size = state.deals[state.round] || 0;
  const bids = _.cons(null, _.range(0, size + 1));
  return _.chain(state.seated, _.mapIndexed(function(idx, seat){
    return _.chain(bids, _.mapa(function(bid){
      return {type: "bid", details: {bid}, seat: idx};
    }, _), _.remove(_.pipe(_.getIn(_, ["details", "bid"]), _.eq(_, seat.bid)), _));
  }, _), _.flatten, _.compact)
}

function playable(state, seat){
  const seated = state.seated[seat];
  const lead = follow(state);
  const trump = state.trump;
  const hand = seated.hand;
  const follows = lead ? _.pipe(_.get(_, "suit"), _.eq(_, lead.suit)) : _.identity;
  const cards = lead ? (_.seq(_.filter(follows, hand)) || hand) : state.broken || tight(hand) ? hand : _.filter(_.pipe(_.get(_, "suit"), _.notEq(_, trump.suit)), hand);
  return seated.played ? [] : _.map(function(card){
    return {type: "play", seat, details: {card}};
  }, cards);
}

function moves(self){
  const state = _.deref(self),
        reversibility = g.reversibility(self);
  if (state.up != null) {
    switch(state.status){
      case "confirming":
        return reversibility;

      case "bidding":
        return _.concat(reversibility, bids(state));

      case "playing":
        return _.concat(reversibility, state.trick ? [] : playable(state, state.up));

    }
  }
  return [];
}

function irreversible(self, command){
  return _.includes(["start", "deal", "bid", "commit", "finish"], command.type);
}

function execute(self, command, seat){
  const state = _.deref(self);
  const valid = _.detect(_.eq(_, _.chain(command, _.compact, _.dissoc(_, "id"))), g.moves(self, [seat]));
  const {type, details} = command;
  const automatic = _.includes(["start", "award", "scoring", "finish", "deal"], type);

  if (!automatic && !valid){
    throw new Error(`Invalid ${type}`);
  }

  if (automatic && seat != null) {
    throw new Error(`Cannot invoke automatic command ${type}`);
  }

  if (!_.seq(g.events(self)) && type != "start") {
    throw new Error(`Cannot ${type} unless the game is first started.`);
  }

  switch (type) {
    case "start":
      return _.chain(self, g.fold(_, command), deal);

    case "deal":
      if (!handsEmpty(state)) {
        throw new Error("Hands are not yet empty!");
      }
      return (function(){
        const round = state.round + 1;
        const numHands = g.numSeats(self);
        const numCards = state.deals[round];
        const dealt = numCards * numHands;
        const cards = _.chain(deck(), _.shuffle);
        const hands = _.chain(cards,
          _.take(dealt, _),
          _.mapa(function(card, hand){
            return [card, hand];
          }, _, _.cycle(_.range(numHands))),
          _.reduce(function(memo, [card, hand]){
            return _.update(memo, hand, _.conj(_, card));
          }, Array.from(_.repeat(numHands, [])), _));
        const undealt = _.chain(cards, _.drop(dealt, _));
        const trump = _.chain(undealt, _.first);
        return g.fold(self, _.assoc(command, "details", {deck: _.chain(undealt, _.rest, _.toArray), hands, trump, round}));
      })();

    case "play":
      const breaks = details.card.suit == state.trump.suit && !state.broken;
      return _.chain(self, g.fold(_, command),
        breaks ? g.fold(_, {type: "broken"}) : _.identity,
        function(self){
          const state = _.deref(self);
          const ord = ordered(g.numSeats(self), state.lead);
          const trick = _.mapa(_.pipe(_.array(_, "played"), _.getIn(state.seated, _)), ord);
          const complete = _.count(_.filter(_.isSome, trick)) == g.numSeats(self);
          if (complete) {
            const ranking = ranked(trick, state.trump.suit);
            const best = _.first(ranking);
            const winner = _.chain(trick, _.indexOf(_, best), _.nth(ord, _));
            return _.chain(self, award(state.lead, best, winner, trick));
          }
          return self;
        },
        _.branch(_.pipe(_.deref, handsEmpty), scoring, _.identity));

    case "finish":
      return (function(){
        const scores = g.score(self);
        const places = _.chain(scores, _.unique, _.sort, _.reverse, _.toArray);
        const ranked = _.chain(state.seated, _.mapIndexed(function(seat){
          const points = _.nth(scores, seat);
          const place = _.indexOf(places, points);
          const tie = _.count(_.filter(_.eq(_, points), scores)) > 1;
          return {seat, points, place, tie};
        }, _), _.sort(_.asc(_.get(_, "place")), _));
        return g.fold(self, _.assoc(command, "details", {ranked}));
      })();

    case "commit":
      return _.chain(self, g.fold(_, command), function(self){
        const empty = _.chain(self, _.deref, handsEmpty);
        const over = !state.deals[state.round + 1];
        return empty ? (over ? g.finish : deal)(self) : self;
      });

    case "bid":
    case "award":
    case "scoring":
    case "undo":
    case "redo":
    case "reset":
      return g.fold(self, command); //vanilla commands

    default:
      throw new Error(`Unknown command ${type}`);

    }
}

function compel1(self){ //compels play of final card in hand
  const seat = _.chain(self, up, _.first);
  const options = seat == null ? [] : g.moves(self, [seat]);
  const compelled = _.count(options) === 1;
  const command = _.first(options);
  return compelled ? compel3(self, command, seat) : self;
}

function compel3(self, command, seat){
  return _.chain(self,
    g.execute(_, command, seat),
    g.execute(_, {type: "commit"}, seat));
}

const compel = _.overload(null, compel1, null, compel3);

function events(self){
  return self.events;
}

function scoring(self){
  const state = _.deref(self);
  const scoring = _.chain(state, _.get(_, "seated"), _.mapa(function(seat){
    const tricks = _.count(seat.tricks),
          bid = seat.bid,
          points = tricks === bid ? 10 + tricks : 0;
    return {bid, tricks, points};
  }, _));
  return g.execute(self, {type: "scoring", details: {scoring}}, null);
}

function fold2(self, event){
  const state = _.deref(self);
  const {type, details, seat} = event;
  switch (type) {
    case "start":
      return (function(){
        const details = {
          status: "wait",
          round: -1, //pending deal
          seated: _.chain(self, g.numSeats, _.repeat(_, {scored: []}), _.toArray)
        };
        return g.fold(self, event, _.fmap(_, _.merge(_, details)));
      })();

    case "deal":
      return (function(){
        const lead = details.round % g.numSeats(self);
        return g.fold(self, event,
          _.fmap(_,
            _.pipe(
              _.assoc(_, "status", "bidding"),
              _.assoc(_, "lead", lead),
              _.assoc(_, "up", lead),
              _.assoc(_, "broken", false),
              _.assoc(_, "trump", details.trump),
              _.assoc(_, "deck", details.deck),
              _.assoc(_, "round", details.round),
              _.foldkv(function(memo, seat, hand){
                return _.updateIn(memo, ["seated", seat], function(seated){
                  return Object.assign({}, seated, {hand, tricks: [], bid: null, played: null});
                });
              }, _, details.hands))));
      })();

    case "broken":
      return g.fold(self, event, _.fmap(_, _.assoc(_, "broken", true)));

    case "bid":
      return g.fold(self, event,
        _.fmap(_, _.pipe(_.assocIn(_, ["seated", seat, "bid"], details.bid), function(state){
          return bidding(state) ? state : _.assoc(state, "status", "playing");
        })));

    case "play":
      return g.fold(self, event,
        _.fmap(_,
          _.pipe(
            _.assocIn(_, ["seated", seat, "trick"], null),
            _.assocIn(_, ["seated", seat, "played"], details.card),
            _.updateIn(_, ["seated", seat, "hand"], _.pipe(_.remove(_.eq(_, details.card), _), _.toArray)))));

    case "award":
      return g.fold(self, event,
        _.fmap(_,
          _.pipe(
            _.assoc(_, "status", "confirming"),
            _.update(_, "seated", _.mapa(function(seat){
              return _.assoc(seat, "played", null);
            }, _)),
            _.updateIn(_, ["seated", details.winner, "tricks"], _.conj(_, details.trick)),
            _.assoc(_, "lead", details.winner))));

    case "undo":
      return g.fold(self, event, _.undo);

    case "redo":
      return g.fold(self, event, _.redo);

    case "reset":
      return g.fold(self, event, _.reset);

    case "commit":
      const empty = handsEmpty(state);
      const played = _.chain(state.seated, _.map(_.get(_, "played"), _), _.compact, _.first);
      const up = empty ? null : (played ? _.second(ordered(_.count(state.seated), state.up)) : state.lead);
      return g.fold(self, event, _.pipe(
        _.fmap(_, _.pipe(
          _.assoc(_, "status", "playing"),
          _.assoc(_, "up", up))),
        _.flush));

    case "scoring":
      return g.fold(self, event, _.fmap(_, _.update(_, "seated", _.foldkv(function(memo, idx, seat){
        return _.assoc(memo, idx, _.update(seat, "scored", _.conj(_, event.details.scoring[idx])));
      }, [], _))));

    case "finish":
      return g.fold(self, event, _.fmap(_, _.pipe(_.dissoc(_, "up"), _.assoc(_, "status", "finished"))));

    default:
      throw new Error("Unknown event");
  }
}

function fold3(self, event, f){
  return ohHell(self.seats,
    self.config,
    event ? _.append(self.events, event) : self.events,
    _.chain(self.journal,
      f,
      g.incidental(event) ? g.crunch : _.identity, //improve undo/redo from user perspective
      g.irreversible(self, event) ? _.flush : _.identity));
}

const fold = _.overload(null, null, fold2, fold3);

function seats(self){
  return self.seats;
}

const obscureCards = _.mapa(_.constantly({}), _);

function obscure(seen){
  return function(event){
    const {type} = event;
    switch (type) {
      case "bid":
        return _.includes(seen, event.seat) ? event : _.updateIn(event, ["details", "bid"], function(bid){
          return bid == null ? null : "";
        });

      case "deal":
        return _.chain(event,
          _.updateIn(_, ["details", "hands"], _.pipe(_.mapIndexed(function(idx, cards){
            return _.includes(seen, idx) ? cards : obscureCards(cards);
          }, _), _.toArray)),
          _.updateIn(_, ["details", "deck"], obscureCards));

      default:
        return event;
    }
  }
}

function perspective(self, _seen){
  const seen = _.chain(_seen, _.filtera(_.isSome, _));
  const up = g.up(self);
  const may = g.may(self);
  const seated = g.seated(self);
  const score = g.score(self);
  const all = _.eq(seen, g.everyone(self));
  const bidding = _.chain(self, _.deref, _.get(_, "status"), _.eq(_, "bidding"));
  const state = _.chain(self, _.deref,
    all ? _.identity :
    _.pipe(
      _.update(_, "deck", obscureCards),
      _.update(_, "seated", _.pipe(_.mapIndexed(function(idx, seated){ //can only see your own hand
        return _.includes(seen, idx) ? seated : _.chain(seated,
          _.update(_, "hand", obscureCards),
          bidding ? _.update(_, "bid", function(bid){
            return bid == null ? null : "";
          }) : _.identity);
        }, _), _.toArray))));
  const moves = _.chain(self, g.moves(_, seen), _.toArray);
  const events = all ? self.events : _.mapa(obscure(seen), self.events);
  return {seen, seated, up, may, state, moves, events, score};
}

function deref(self){
  return _.deref(self.journal);
}

function undoable(self){
  return _.undoable(self.journal);
}

function redoable(self){
  return _.redoable(self.journal);
}

function flushable(self){
  return _.flushable(self.journal);
}

function resettable(self){
  return _.resettable(self.journal);
}

_.doto(OhHell,
  _.implement(_.IDeref, {deref}),
  _.implement(_.IResettable, {resettable}),
  _.implement(_.IRevertible, {undoable, redoable, flushable}),
  _.implement(IGame, {perspective, up, may, seats, moves, events, irreversible, execute: _.comp(compel, execute), fold, score}));

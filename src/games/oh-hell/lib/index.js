import _ from "/lib/@atomic/core.js";
import {IGame} from "/lib/game.js";
import * as g from "/lib/game.js";

const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "K", "Q", "A"];
const suits = ["♥️", "♠️", "♦️", "♣️"];
const handSizes = upAndDown(1, 2);

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

export function ranked(cards, trump){ //begin with lead card then follow in play order
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

function OhHell(seated, config, events, journal){
  this.seated = seated;
  this.config = config;
  this.events = events;
  this.journal = journal;
}

export function ohHell(seated, config, events, journal){
  if (!_.count(seated)) {
    throw new Error("Cannot play a game with no one seated at the table");
  }
  return new OhHell(seated, config, events || [], journal || _.journal({}));
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
    const state = _.deref(self);
    return g.execute(self, {type: "play", details: {card}}, state.up);
  }
}

function award(winner, trick){
  return function(self)  {
    return g.execute(self, {type: "award", details: {winner, trick}});
  }
}

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
  const state = _.deref(self);
  return state.seated[state.lead].played || null;
}

function broken(self, trump){
  const state = _.deref(self);
  return !!_.chain(state.seated, _.mapcat(_.get(_, "tricks"), _), _.detect(_.eq(_, trump.suit), _));
}

function tight(hand){
  return _.chain(hand, _.map(_.get(_, "suit"), _), _.unique, _.count, _.eq(_, 1));
}

function bidding(self){
  const state = _.deref(self);
  return _.count(_.filter(_.isSome, _.map(_.get(_, "bid"), state.seated))) !== _.count(self.seated);
}

function up(self){
  const state = _.deref(self);
  return _.chain(state.seated, _.mapIndexed(function(seat, data){
    return {seat, bid: data.bid};
  }, _), _.filter(function(seat){
    return seat.bid == null;
  }, _), _.mapa(_.get(_, "seat"), _), _.seq) || (state.up == null ? [] : [state.up]);
}

function score(self){
  const state = _.deref(self);
  return _.chain(state.seated, _.mapa(function(seat){
    return _.sum(_.map(_.get(_, "points"), seat.scored));
  }, _));
}

//TODO factor in trumps being broken
function moves(self){
  const allBidsIn = !bidding(self);
  const state = _.deref(self);
  const seat = state.up;
  const size = handSizes[state.round] || 0;
  const bids = _.cons(null, _.range(0, size + 1));
  const reversibility = _.compact([
    _.undoable(self.journal) ? {type: "undo", seat} : null,
    _.redoable(self.journal) ? {type: "redo", seat} : null,
    _.flushable(self.journal) ? {type: "clear", seat} : null
  ]);
  if (allBidsIn) {
    if (seat == null) {
      return [];
    } else {
      const seated = state.seated[seat];
      const committable = state.up && (seated.played || state.trick) ? [{type: "commit", seat}] : [];
      const lead = follow(self);
      const trump = state.trump;
      const hand = seated.hand;
      const follows = lead ? _.pipe(_.get(_, "suit"), _.eq(_, lead.suit)) : _.identity;
      const canFollow = _.detect(follows, hand);
      const playable = lead ? (canFollow ? _.filter(follows, hand) : hand) : broken(self, trump) || tight(hand) ? hand : _.filter(_.pipe(_.get(_, "suit"), _.notEq(_, trump.suit)), hand);
      const type = seated.played || state.trick ? "commit" : "play";
      return _.concat(reversibility, committable, _.map(function(card){
        return {type, seat, details: {card}};
      }, playable));
    }
  } else {
    return _.concat(reversibility, _.chain(state.seated, _.mapIndexed(function(idx, seat){
      return [allBidsIn ? [] : _.chain(bids, _.map(function(bid){
        return {type: "bid", details: {bid}, seat: idx};
      }, _), _.remove(_.pipe(_.getIn(_, ["details", "bid"]), _.eq(_, seat.bid)), _))];
    }, _), _.flatten, _.compact));
  }
}

function irreversible(self, command){
  return _.includes(["start", "deal", "bid", "commit", "finish"], command.type);
}

function execute(self, command, seat){
  const state = _.deref(self);
  const valid = _.detect(_.eq(_, _.dissoc(command, "id")), g.moves(self, seat));
  const {type, details} = command;
  switch (type) {
    case "start":
      return (function(){
        const _details = Object.assign({
          round: -1, //pending deal
          seated: _.chain(self.seated, _.count, _.repeat(_, {scored: []}), _.toArray)
        }, details);
        return _.chain(self, g.fold(_, _.assoc(command, "details", _details)), deal);
      })();

    case "deal":
      return (function(){
        const round = state.round + 1;
        const numHands = _.count(self.seated);
        const numCards = handSizes[round];
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

    case "bid":
      if (!valid) {
        throw new Error("Invalid bid");
      }
      return g.fold(self, command);

    case "play":
      if (!details.card) {
        throw new Error("Must provide a card");
      }
      if (!valid) {
        throw new Error("Invalid play");
      }
      return _.chain(self, g.fold(_, command),
        function(self){
          const state = _.deref(self);
          const ord = ordered(_.count(self.seated), state.lead);
          const trick = _.mapa(_.pipe(_.array(_, "played"), _.getIn(state.seated, _)), ord);
          const complete = _.count(_.filter(_.isSome, trick)) == _.count(self.seated);
          if (complete) {
            const ranking = ranked(trick, state.trump.suit);
            const best = _.first(ranking);
            const winner = _.indexOf(trick, best);
            return _.chain(self, award(winner, trick));
          }
          return self;
        });

    case "award":
      return g.fold(self, command);

    case "commit":
      return (function(){
        const endRound = _.chain(state.seated, _.mapa(_.get(_, "hand"), _), _.flatten, _.compact, _.seq, _.not);
        const endGame = endRound && !handSizes[state.round + 1];
        const up = _.second(ordered(_.count(self.seated), state.up));
        return _.chain(self,
          g.fold(_, _.assoc(command, "details", {up, endRound, endGame})),
          endRound ? (endGame ? g.finish : deal) : _.identity);
      })();

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

    default:
      throw new Error("Unknown command");

    }
}

function fold2(self, event){
  const state = _.deref(self);
  const {type, details, seat} = event;
  switch (type) {
    case "start":
      return g.fold(self, event, _.constantly(details));

    case "deal":
      return (function(){
        const lead = details.round % _.count(self.seated);
        return g.fold(self, event,
          _.pipe(
            _.assoc(_, "lead", lead),
            _.assoc(_, "up", lead),
            _.assoc(_, "trump", details.trump),
            _.assoc(_, "deck", details.deck),
            _.assoc(_, "round", details.round),
            _.foldkv(function(memo, seat, hand){
              return _.updateIn(memo, ["seated", seat], function(seated){
                return Object.assign({}, seated, {hand, tricks: [], bid: null, played: null});
              });
            }, _, details.hands)));
      })();

    case "bid":
      return g.fold(self, event,
        _.assocIn(_, ["seated", seat, "bid"], details.bid));

    case "play":
      return g.fold(self, event,
        _.pipe(
          _.assocIn(_, ["seated", seat, "trick"], null),
          _.assocIn(_, ["seated", seat, "played"], details.card),
          _.updateIn(_, ["seated", seat, "hand"], _.pipe(_.remove(_.eq(_, details.card), _), _.toArray))));

    case "award":
      return g.fold(self, event,
        _.pipe(
          _.update(_, "seated", _.mapa(function(seat){
            return _.assoc(seat, "played", null);
          }, _)),
          _.updateIn(_, ["seated", details.winner, "tricks"], _.conj(_, details.trick)),
          _.assoc(_, "trick", details.trick),
          _.assoc(_, "lead", details.winner)));

    case "commit":
      return g.fold(self, event, _.pipe(details.endRound ? scoreRound : _.identity, _.assoc(_, "up", details.up), _.assoc(_, "trick", null)));

    case "finish":
      return g.fold(self, event, _.assoc(_, "up", null));

    default:
      throw new Error("Unknown event");
  }
}

function fold3(self, event, f){
  return ohHell(self.seated,
    self.config,
    _.append(self.events, event),
    _.chain(self.journal, g.irreversible(self, event, f)));
}

const fold = _.overload(null, null, fold2, fold3);

function seated(self){
  return self.seated;
}

function perspective(self, seat){
  const up = seat == null ? null : _.chain(self, g.up, _.includes(_, seat));
  const seated = g.seated(self);
  const state = _.chain(self, _.deref,
    _.update(_, "deck", _.mapa(_.constantly({}), _)), //no one can see the deck
    _.update(_, "seated", _.pipe(_.mapIndexed(function(i, seated){ //can only see your own hand
        return i === seat ? seated : _.update(seated, "hand", _.mapa(_.constantly({}), _));
      }, _), _.toArray)));
  const moves = _.chain(self, g.moves(_, seat), _.toArray);
  const events = self.events; //TODO hide details
  const score = g.score(self)[seat];
  return {seat, seated, up, state, moves, events, score};
}

function deref(self){
  return _.deref(self.journal);
}

_.doto(OhHell,
  _.implement(_.IDeref, {deref}),
  _.implement(IGame, {perspective, up, seated, moves, irreversible, execute, fold, score}));

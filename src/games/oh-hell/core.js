import _ from "/lib/atomic_/core.js";
import g from "/lib/game_.js";

const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "K", "Q", "A"];
const suits = ["♥️", "♠️", "♦️", "♣️"];

function deals(start, end){
  function series(start, end){
    const step = end > start ? 1 : -1;
    return _.range(start, end + step, step);
  }
  return _.toArray(_.dedupe(_.concat(series(start, end), series(end, start))));
}

function sortCards(cards){
  return _.sort(_.asc(function({suit}){
    return _.indexOf(suits, suit);
  }), _.asc(function({rank}){
    return _.indexOf(ranks, rank);
  }), cards);
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
  return new OhHell(_.toArray(seats), config, events || [], journal || _.journal({deals: deals(config.start || 1, config.end || 7)}));
}

function deal(self){
  return g.execute(self, {type: "deal"});
}

function award(lead, best, winner, trick){
  return function(self)  {
    return g.self, {type: "award", details: {lead, best, winner, trick}}, null);
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
  return _.includes(["started", "dealt", "bid", "committed", "finished"], command.type);
}

function execute(self, command){
  const state = _.deref(self);
  const {type, details, seat} = command;
  const valid = _.detect(_.eq(_, _.chain(command, _.compact, _.dissoc(_, "id"))), g.moves(self, [seat]));
  const automatic = _.includes(["start", "award", "score", "finish", "deal"], type);

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
      return _.chain(self, g.fold(_, _.assoc(command, "type", "started")), deal);

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
        const undealt = _.chain(cards, _.drop(dealt, _));
        const trump = _.chain(undealt, _.first);
        const hands = _.chain(cards,
          _.take(dealt, _),
          _.mapa(function(card, hand){
            return [card, hand];
          }, _, _.cycle(_.range(numHands))),
          _.reduce(function(memo, [card, hand]){
            return _.update(memo, hand, _.conj(_, card));
          }, Array.from(_.repeat(numHands, [])), _),
          _.mapa(sortCards, _));
        return g.fold(self, _.assoc(command, "type", "dealt", "details", {deck: _.chain(undealt, _.rest, _.toArray), hands, trump, round}));
      })();

    case "play":
      const breaks = details.card.suit == state.trump.suit && !state.broken;
      return _.chain(self, g.fold(_, _.assoc(command, "type", "played")),
        breaks ? g.fold(_, {type: "broke"}) : _.identity,
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

    case "commit":
      return _.chain(self, g.fold(_, _.assoc(command, "type", "committed")), function(self){
        const empty = _.chain(self, _.deref, handsEmpty);
        const over = !state.deals[state.round + 1];
        return empty ? (over ? g.finish : deal)(self) : self;
      });

    case "bid":
      return g.fold(self, command);

    case "award":
      return g.fold(self, _.assoc(command, "type", "awarded"));

    case "score":
      return g.fold(self, _.assoc(command, "type", "scored"));

    case "finish":
      return g.fold(self, _.assoc(command, "type", "finished"));

    case "undo":
      return g.fold(self, _.assoc(command, "type", "undid"));

    case "redo":
      return g.fold(self, _.assoc(command, "type", "redid"));

    case "reset":
      return g.fold(self, command);

    default:
      throw new Error(`Unknown command ${type}`);

    }
}

function compel1(self){ //compel play of final card in hand
  const seat = _.chain(self, up, _.first);
  const state = _.deref(self);
  const seated = state.seated[state.up] || {hand: null};
  const {hand} = seated;
  const options = seat == null ? [] : g.moves(self, [seat]);
  const compelled = _.count(hand) === 1 && _.count(options) === 1;
  return compelled ? compel3(self, _.first(options), seat) : self;
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
  return g.execute(self, {type: "score", details: {scoring}});
}

function metrics(self){
  const state = _.deref(self);
  return _.mapa(function({scored}){
    const points = _.sum(_.map(_.get(_, "points"), scored));
    return {points};
  }, state.seated);
}

function comparator(self){
  return function(a, b){
    return b.points - a.points;
  };
}

function textualizer(self){
  return function({points}){
    return `${points} pts.`;
  }
}

function fold(self, event){
  const state = _.deref(self);
  const {type, details, seat} = event;
  switch (type) {
    case "started":
      return (function(){
        const details = {
          status: "wait",
          round: -1, //pending deal
          seated: _.chain(self, g.numSeats, _.repeat(_, {scored: []}), _.toArray)
        };
        return g.fold(self, event, _.fmap(_, _.merge(_, details)));
      })();

    case "dealt":
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

    case "broke":
      return g.fold(self, event, _.fmap(_, _.assoc(_, "broke", true)));

    case "bid":
      return g.fold(self, event,
        _.fmap(_, _.pipe(_.assocIn(_, ["seated", seat, "bid"], details.bid), function(state){
          return bidding(state) ? state : _.assoc(state, "status", "playing");
        })));

    case "played":
      return g.fold(self, event,
        _.fmap(_,
          _.pipe(
            _.assocIn(_, ["seated", seat, "trick"], null),
            _.assocIn(_, ["seated", seat, "played"], details.card),
            _.updateIn(_, ["seated", seat, "hand"], _.pipe(_.remove(_.eq(_, details.card), _), _.toArray)))));

    case "awarded":
      return g.fold(self, event,
        _.fmap(_,
          _.pipe(
            _.assoc(_, "status", "confirming"),
            _.update(_, "seated", _.mapa(function(seat){
              return _.assoc(seat, "played", null);
            }, _)),
            _.updateIn(_, ["seated", details.winner, "tricks"], _.conj(_, details.trick)),
            _.assoc(_, "lead", details.winner))));

    case "undid":
      return g.fold(self, event, _.undo);

    case "redid":
      return g.fold(self, event, _.redo);

    case "reset":
      return g.fold(self, event, _.reset);

    case "committed":
      const empty = handsEmpty(state);
      const played = _.chain(state.seated, _.map(_.get(_, "played"), _), _.compact, _.first);
      const up = empty ? null : (played ? _.second(ordered(_.count(state.seated), state.up)) : state.lead);
      return g.fold(self, event, _.pipe(
        _.fmap(_, _.pipe(
          _.assoc(_, "status", "playing"),
          _.assoc(_, "up", up))),
        _.flush));

    case "scored":
      return g.fold(self, event, _.fmap(_, _.update(_, "seated", _.foldkv(function(memo, idx, seat){
        return _.assoc(memo, idx, _.update(seat, "scored", _.conj(_, event.details.scoring[idx])));
      }, [], _))));

    case "finished":
      return g.fold(self, event, _.fmap(_, _.pipe(_.dissoc(_, "up"), _.assoc(_, "status", "finished"))));

    default:
      throw new Error(`Unknown event ${type}`);
  }
}

function append(self, event){
  return new OhHell(self.seats,
    self.config,
    _.append(self.events, event),
    self.journal);
}

function fmap(self, f){
  return new OhHell(self.seats,
    self.config,
    self.events,
    f(self.journal));
}

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

      case "dealt":
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

function obscureState(seen){
  return function(state){
    const {status} = state;
    const bidding = status === "bidding";
    return _.chain(state,
      _.pipe(
        _.update(_, "deck", obscureCards),
        _.update(_, "seated", _.pipe(_.mapIndexed(function(idx, seated){ //can only see your own hand
          return _.includes(seen, idx) ? seated : _.chain(seated,
            _.update(_, "hand", obscureCards),
            bidding ? _.update(_, "bid", function(bid){
              return bid == null ? null : "";
            }) : _.identity);
          }, _), _.toArray))));
  }
}

function obscureEvents(seen){
  return _.mapa(obscure(seen), _);
}

function perspective(self, seen, reality){
  return _.chain(reality,
    _.update(_, "state", obscureState(seen)),
    _.update(_, "events", obscureEvents(seen)));
}

_.doto(OhHell,
  g.behave,
  _.implement(_.IAppendable, {append}),
  _.implement(_.IFunctor, {fmap}),
  _.implement(g.IGame, {perspective, up, may, moves, irreversible, metrics, comparator, textualizer, execute: _.comp(compel, execute), fold}));

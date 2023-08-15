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

function OhHell(seats, config, events, state){
  this.seats = seats;
  this.config = config;
  this.events = events;
  this.state = state;
}

export function ohHell(seats, config, events, state){
  return new OhHell(seats, config, events, state || {deals: deals(config.start || 1, config.end || 7)});
}

export default ohHell;
export const make = ohHell;

function deal(self){
  return g.execute(self, {type: "deal"});
}

function award(lead, best, winner, trick){
  return function(self)  {
    return g.execute(self, {type: "award", details: {lead, best, winner, trick}}, null);
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
  const {status} = _.deref(self);
  return status === "bidding" ? g.everyone(self) : g.up(self);
}

function bids(state, idx){
  const size = state.deals[state.round] || 0;
  const bids = _.cons(null, _.range(0, size + 1));
  const seat = _.nth(state.seated, idx);
  return _.chain(bids,
    _.mapa(function(bid){
      return {type: "bid", details: {bid}, seat: idx};
    }, _),
    _.remove(_.pipe(_.getIn(_, ["details", "bid"]), _.eq(_, seat.bid)), _));
}

function playable(state, seat){
  const seated = state.seated[seat];
  const lead = follow(state);
  const trump = state.trump;
  const hand = seated.hand;
  const follows = lead ? _.pipe(_.get(_, "suit"), _.eq(_, lead.suit)) : _.identity;
  const cards = lead ? (_.seq(_.filter(follows, hand)) || hand) : state.broke || tight(hand) ? hand : _.filter(_.pipe(_.get(_, "suit"), _.notEq(_, trump.suit)), hand);
  return seated.played ? [] : _.map(function(card){
    return {type: "play", seat, details: {card}};
  }, cards);
}


function moves1(self){
  return ["bid", "play", "commit"];
}

function moves3(self, type, seat){
  const state = _.deref(self);
  const seated = _.nth(state.seated, seat);
  switch(type){
    case "bid":
      return state.status === "bidding" ? bids(state, seat) : [];
    case "play":
      return state.up === seat && state.status === "playing" ? playable(state, state.up) : [];
    case "commit":
      return state.up === seat && state.status === "playing" && (state.awarded || seated.played) ? [{type: "commit", seat}] : [];
  }
}

const moves = _.overload(null, moves1, moves1, moves3);

function undoable(self, {type}){
  return !_.includes(["started", "dealt", "bid", "committed", "finished"], type);
}

function execute(self, command){
  const state = _.deref(self);
  const {type, details, seat} = command;
  const moves = g.moves(self, {type, seat});
  const valid = _.detect(_.eq(_, _.chain(command, _.compact, _.dissoc(_, "id"))), moves);
  const automatic = _.includes(["start", "award", "score", "finish", "deal"], type);

  if (!automatic && !valid){
    throw new Error(`Invalid ${type}`);
  }

  if (automatic && seat != null) {
    throw new Error(`Cannot invoke automatic command ${type}`);
  }

  switch (type) {
    case "start": {
      return _.chain(self, g.fold(_, _.assoc(command, "type", "started")), deal);
    }

    case "deal": {
      if (!handsEmpty(state)) {
        throw new Error("Hands are not yet empty!");
      }
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
    }

    case "play": {
      const breaks = details.card.suit == state.trump.suit && !state.broke;
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
      }

    case "commit": {
      return _.chain(self, g.fold(_, _.assoc(command, "type", "committed")), function(self){
        const empty = _.chain(self, _.deref, handsEmpty);
        const over = !state.deals[state.round + 1];
        return empty ? (over ? g.finish : deal)(self) : self;
      });
    }

    case "bid": {
      return g.fold(self, command);
    }

    case "award": {
      return g.fold(self, _.assoc(command, "type", "awarded"));
    }

    case "score": {
      return g.fold(self, _.assoc(command, "type", "scored"));
    }

    case "finish": {
      return g.fold(self, _.assoc(command, "type", "finished"));
    }

    default:
      throw new Error(`Unknown command ${type}`);

    }
}

function compel1(self){ //compel play of final card in hand
  const seat = _.chain(self, up, _.first),
        type = "play",
        state = _.deref(self),
        cards = g.moves(self, {type, seat});
  const {hand} = state.seated[state.up] || {hand: null};
  return _.count(hand) === 1 && _.count(cards) === 1 && !state.awarded ? compel3(self, _.first(cards), seat) : self;
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
    case "started": {
      const details = {
        status: "wait",
        round: -1, //pending deal
        seated: _.chain(self, g.numSeats, _.repeat(_, {scored: []}), _.toArray)
      };
      return g.fold(self, event, _.merge(_, details));
    }

    case "dealt": {
      const lead = details.round % g.numSeats(self);
      return g.fold(self, event,
        _.pipe(
          _.assoc(_, "status", "bidding"),
          _.assoc(_, "lead", lead),
          _.assoc(_, "up", lead),
          _.assoc(_, "awarded", null),
          _.assoc(_, "broke", false),
          _.assoc(_, "trump", details.trump),
          _.assoc(_, "deck", details.deck),
          _.assoc(_, "round", details.round),
          _.foldkv(function(memo, seat, hand){
            return _.updateIn(memo, ["seated", seat], function(seated){
              return Object.assign({}, seated, {hand, tricks: [], bid: null, played: null});
            });
          }, _, details.hands)));
    }

    case "broke": {
      return g.fold(self, event, _.assoc(_, "broke", true));
    }

    case "bid": {
      return g.fold(self, event,
        _.pipe(_.assocIn(_, ["seated", seat, "bid"], details.bid), function(state){
          return bidding(state) ? state : _.assoc(state, "status", "playing");
        }));
    }

    case "played": {
      return g.fold(self, event,
        _.pipe(
          _.assocIn(_, ["seated", seat, "trick"], null),
          _.assocIn(_, ["seated", seat, "played"], details.card),
          _.updateIn(_, ["seated", seat, "hand"], _.pipe(_.remove(_.eq(_, details.card), _), _.toArray))));
    }

    case "awarded": {
      return g.fold(self, event,
        _.pipe(
          _.update(_, "seated", _.mapa(function(seat){
            return _.assoc(seat, "played", null);
          }, _)),
          _.updateIn(_, ["seated", details.winner, "tricks"], _.conj(_, details.trick)),
          _.assoc(_, "awarded", details.trick),
          _.assoc(_, "lead", details.winner)));
    }

    case "committed": {
      const empty = handsEmpty(state);
      const played = _.chain(state.seated, _.map(_.get(_, "played"), _), _.compact, _.first);
      const up = empty ? null : (played ? _.second(ordered(_.count(state.seated), state.up)) : state.lead);
      return g.fold(self, event,
        _.pipe(
          _.assoc(_, "awarded", null),
          _.assoc(_, "status", "playing"),
          _.assoc(_, "up", up)));
    }

    case "scored": {
      return g.fold(self, event, _.update(_, "seated", _.foldkv(function(memo, idx, seat){
        return _.assoc(memo, idx, _.update(seat, "scored", _.conj(_, event.details.scoring[idx])));
      }, [], _)));
    }

    case "finished": {
      return g.fold(self, event, _.pipe(_.dissoc(_, "up"), _.assoc(_, "status", "finished")));
    }

    default:
      throw new Error(`Unknown event ${type}`);
  }
}

function compact(self){
  return new OhHell(self.seats,
    self.config,
    [],
    self.state);
}

function append(self, event){
  return new OhHell(self.seats,
    self.config,
    _.append(self.events, event),
    self.state);
}

function fmap(self, f){
  return new OhHell(self.seats,
    self.config,
    self.events,
    f(self.state));
}

function seats(self){
  return self.seats;
}

const obscureCards = _.mapa(_.constantly({}), _);

function obscure(seen){
  return function(event){
    const {type} = event || {type: null};
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

function perspective(self, seen, reality){
  return _.chain(reality,
    _.update(_, "state", obscureState(seen)),
    _.update(_, "event", obscure(seen)));
}

function status(self){
  const {status, round} = _.deref(self);
  if (round != null) {
    return status === "finished" ? [status] : _.chain(["started", status], _.compact, _.toArray);
  } else {
    return ["pending"];
  }
}

_.doto(OhHell,
  g.behave,
  _.implement(_.ICompactible, {compact}),
  _.implement(_.IAppendable, {append}),
  _.implement(_.IFunctor, {fmap}),
  _.implement(g.IGame, {perspective, status, up, may, moves, undoable, metrics, comparator, textualizer, execute: _.comp(compel, execute), fold}));

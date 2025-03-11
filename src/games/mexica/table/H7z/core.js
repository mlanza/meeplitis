import _ from "../../../../libs/atomic_/core.js";
import g from "../../../../libs/game_.js";

const slots = _.pipe(_.repeat(_, null), _.toArray);

const COL = 64, ROW = 0;
const CENTER = 'H7';

const w = "w", //water
      l = "l", //land
      e = "e", //emperor's palace
      b = "b", //bridge
      c = "c", //calpulli
      t = "t", //temple
      p = "p", //pilli
      n = "-"; //nothing

export const board = [
       /*@,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V*/
  /*0*/ [n,w,w,w,w,w,w,w,w,w,w,w,n,n,n,n,n,n,n,n,n,n,n],
  /*1*/ [n,w,l,w,w,w,l,l,l,l,l,w,w,w,n,n,n,n,n,n,n,n,n],
  /*2*/ [w,w,l,l,l,l,l,l,l,l,l,l,l,w,n,n,n,n,n,n,n,n,n],
  /*3*/ [w,l,l,l,l,l,l,l,l,l,l,l,l,w,w,w,n,n,n,n,n,n,n],
  /*4*/ [w,l,l,l,l,l,l,l,l,l,l,l,l,l,l,w,w,w,n,n,n,n,n],
  /*5*/ [w,w,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,w,w,w,w,w,w],
  /*6*/ [n,w,l,l,l,l,l,l,e,l,l,l,l,l,l,l,l,l,l,w,l,l,w],
  /*7*/ [n,w,l,l,l,l,l,e,e,e,l,l,l,l,l,l,l,l,l,l,l,l,w],
  /*8*/ [n,w,l,l,l,l,l,l,e,l,l,l,l,l,l,l,l,l,l,l,l,l,w],
  /*9*/ [n,w,w,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,w,w],
 /*10*/ [w,w,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,w,w,w,w,n],
 /*11*/ [w,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,w,w,w,n,n,n,n],
 /*12*/ [w,l,l,l,l,l,l,l,l,l,l,l,l,l,w,w,w,n,n,n,n,n,n],
 /*13*/ [w,l,l,l,l,l,l,l,l,l,l,l,w,w,w,n,n,n,n,n,n,n,n],
 /*14*/ [w,w,w,l,l,l,l,w,w,l,l,w,w,n,n,n,n,n,n,n,n,n,n],
 /*15*/ [n,n,w,w,w,w,w,w,w,w,w,w,n,n,n,n,n,n,n,n,n,n,n]
]

const calpullis = [
  {size: 13, at: null},
  {size: 12, at: null},
  {size: 11, at: null},
  {size: 10, at: null},
  {size: 9, at: null},
  {size: 8, at: null},
  {size: 7, at: null},
  {size: 6, at: null},
  {size: 6, at: null},
  {size: 5, at: null},
  {size: 5, at: null},
  {size: 4, at: null},
  {size: 4, at: null},
  {size: 3, at: null},
  {size: 3, at: null}
];

const temples = [
  {1: slots(3), 2: slots(3), 3: slots(2), 4: slots(1)},
  {1: slots(3), 2: slots(2), 3: slots(2), 4: slots(2)}
];

export function consolidateTemples(temples){
  return _.reduce(function(memo, temples){
    return _.reducekv(function(temples, level, added){
      return _.update(temples, level, function(spots){
        return _.toArray(_.concat(spots, added));
      });
    }, memo, temples);
  }, _.first(temples), _.rest(temples));
}

function bridgesDepleted(bridges){
  return !_.chain(bridges, _.remove(_.isSome, _), _.seq);
}

function canalsDepleted(canal1, canal2){
  return !_.chain(_.concat(canal1, canal2), _.remove(_.isSome, _), _.seq);
}

function templesDepleted(temples){
  return !_.chain(temples, _.vals, cat, _.remove(_.isSome, _), _.seq);
}

function calpulliDepleted(calpulli, period){
  return !_.chain(calpulli, _.nth(_, period), _.compact, _.map(_.get(_, "at"), _), _.remove(_.isSome, _), _.seq);
}

function markScoringRound(state){
  const {calpulli, period, seated} = state;
  return calpulliDepleted(calpulli, period) &&
    _.chain(seated,
      _.mapa(
        _.pipe(
          _.get(_, "temples"),
          _.take(period + 1, _),
          consolidateTemples,
          templesDepleted),
      _),
      _.some(_.identity, _)) ? _.assoc(state, "scoring-round", true) : state;
}

const coords = _.braid(function(y, x){
  return [x, y];
}, _.range(0, 16), _.range(0, 23));

export const spots = _.map(function([x, y]){
  const letter = String.fromCharCode(x + COL),
        row = y + ROW;
  return `${letter}${row}`;
}, coords);

export const boardSpots = _.map(function([x, y]){
  const letter = String.fromCharCode(x + COL),
        row = y + ROW;
  return [`${letter}${row}`, _.getIn(board, [y, x])];
}, coords);

export const viableSpots = _.chain(boardSpots, _.filter(function([spot, what]){
  return spot !== CENTER && _.includes(["l", "e"], what);
}, _), _.map(_.first, _));

function init(seats){
  return {
    status: null,
    contents: {},
    period: 0,
    round: 0,
    "scoring-round": false,
    spent: 0,
    redeemed: 0,
    banked: 0,
    tokens: 12,
    canal1: slots(6),
    canal2: slots(35),
    bridges: slots(11),
    calpulli: null,
    seated: _.toArray(_.repeat(seats, {
      pilli: null,
      temples,
      bank: 0,
      points: 0
    }))
  };
}

function Mexica(seats, config, events, state){
  this.seats = seats;
  this.config = config;
  this.events = events;
  this.state = state;
}

export function mexica(seats, config, events, state){
  return new Mexica(seats, _.merge({dealCalpulli}, config), events, state || _.chain(seats, _.count, init));
}

export const make = mexica;

export default mexica;

const cat = _.mapcat(_.identity, _);

function coord(at){
  const row = _.chain(at, _.split(_, ''), _.rest, _.join('', _), parseInt, _.subtract(_, ROW)),
        column = at.charCodeAt(0) - COL;
  return [row, column];
}

function spot([row, column]){
  const c = String.fromCharCode(column + COL),
        r = row + ROW;
  return c + r;
}

export function left(at){
  const [row, column] = coord(at);
  return spot([row, column - 1]);
}

export function right(at){
  const [row, column] = coord(at);
  return spot([row, column + 1]);
}

export function above(at){
  const [row, column] = coord(at);
  return spot([row - 1, column]);
}

export function below(at){
  const [row, column] = coord(at);
  return spot([row + 1, column]);
}

const around = _.juxt(above, right, below, left);
const vertically = _.juxt(above, below);
const horizontally = _.juxt(left, right);
const stop = _.constantly([]);
const palaceSpots = around(CENTER);
const startCanalSpots = ["O6", "O7", "O8", "O9"];

export const inlandSpots = _.remove(
  _.pipe(
    around,
    _.map(_.pipe(coord, _.getIn(board, _)), _),
    _.detect(_.eq(w, _), _)),
  viableSpots);

export const distance = _.juxt(
  above,
  _.pipe(above, left),
  _.pipe(above, right),
  _.pipe(above, above),
  _.pipe(above, above, left),
  _.pipe(above, above, right),
  _.pipe(above, above, above),
  below,
  _.pipe(below, left),
  _.pipe(below, right),
  _.pipe(below, below),
  _.pipe(below, below, left),
  _.pipe(below, below, right),
  _.pipe(below, below, below),
  left,
  _.pipe(left, left),
  _.pipe(left, left, above),
  _.pipe(left, left, below),
  _.pipe(left, left, left),
  right,
  _.pipe(right, right),
  _.pipe(right, right, above),
  _.pipe(right, right, below),
  _.pipe(right, right, right));

function sites(n){
  return _.chain(inlandSpots,
    _.remove(_.includes(_.set(_.concat(startCanalSpots, palaceSpots)), _), _),
    _.shuffle,
    _.reduce(function({kept, dropped}, spot){
      const wants = !_.includes(dropped, spot),
            _kept = wants ? _.conj(kept, spot) : kept,
            _dropped = _.chain(wants ? _.concat(dropped, distance(spot)) : _.conj(dropped, spot), _.toArray, _.set);
    return _.chain({kept: _kept, dropped: _dropped}, _.count(kept) >= n ? _.reduced : _.identity);
    }, {kept: [], dropped: []}, _),
    _.get(_, "kept"));
}

function scatterTemples(levels = [1, 1, 1, 1, 2, 2, 2, 3, 3, 4]){
  return _.chain(levels,
    _.count,
    sites,
    _.mapa(function(level, spot){
      return {level, spot};
    }, _.shuffle(levels), _),
    _.groupBy(_.get(_, "level"), _),
    _.mapVals(_, _.mapa(_.get(_, "spot"), _)));
}

const extractTemples =
  _.pipe(
    _.entries,
    _.mapcat(function([level, spots]){
      return _.mapa(function(spot){
        return {level: parseInt(level), spot};
      }, spots);
    }, _));

function committed(state){
  const {status, seated, calpulli, period, up} = state;
  const seats = _.count(seated);
  const endRound = seats - 1 === up;
  const over = state["scoring-round"] && period === 1;
  const absent = !!_.seq(_.remove(_.get(_, "pilli"), seated));
  return _.chain(state,
    _.update(_, "round", endRound && !over ? _.inc : _.identity),
    _.update(_, "up", function(up){
      return _.chain(seats, _.range, _.cycle, _.dropWhile(_.notEq(_, up), _), _.second);
    }),
    status === "placing-pilli" && !absent ? _.assoc(_, "status", "actions") : _.identity,
    _.assoc(_, "spent", 0),
    _.assoc(_, "redeemed", 0),
    _.assoc(_, "banked", 0));
}

function reflectContents(state){
  return _.assoc(state, "contents", _.chain(state, contents));
}

function dealCalpulli(calpullis){
  const xs = _.chain(_.range(15), _.shuffle, _.take(8, _), _.sort);
  return _.chain(calpullis,
    _.mapkv(function(k, v){
      return [k, v];
    }, _),
    _.groupBy(function([k, v]){
      return _.includes(xs, k);
    }, _),
    _.reducekv(function(memo, k, v){
      return _.assoc(memo, k === "true" ? 0 : 1, _.mapa(_.second, v));
    }, slots(2), _),
    _.toArray);
}

export const dry = _.partly(function dry(board, contents, at){
  const cts = _.get(contents, at);
  const what = _.getIn(board, coord(at));
  return _.includes([l,e], what) && !_.includes(cts, w);
});

export const wet = _.partly(function wet(board, contents, at){
  const cts = _.get(contents, at);
  const what = _.getIn(board, coord(at));
  return what === w || _.includes(cts, w);
});

function consume(spot){
  return function(pieces){
    const idx = _.indexOf(pieces, null);
    return idx > -1 ? _.assoc(pieces, idx, spot) : pieces;
  }
}

function remit(spot){
  return function(pieces){
    return _.maybe(pieces,
      _.detectIndex(_.eq(_, spot), _),
      _.assoc(pieces, _, null)) || pieces;
  }
}

function place1(what){
  return function(contents, at){
    return place3(what, contents, at);
  }
}

function place2(what, at){
  return function(contents){
    return place3(what, contents, at);
  }
}

function place3(what, contents, at){
  return _.update(contents, at, _.pipe(_.either(_, []), _.conj(_, what)));
}

const place = _.overload(null, place1, place2, place3);

function displace(what, at){
  return _.update(_, at, _.pipe(_.either(_, []), _.filtera(_.notEq(what, _), _)));
}

export function orientBridge(board, contents, at){
  return dry(board, contents, above(at)) && dry(board, contents, below(at)) ? "vertical" :
         dry(board, contents, left(at))  && dry(board, contents, right(at)) ? "horizontal" : null;
}

export const isVacant = _.partly(function isVacant(board, contents, at){
  const what = _.getIn(board, coord(at)),
        cts  = _.seq(_.get(contents, at));
  return what === l && !cts;
});

export const contains = _.partly(function contains(obstructions, contents, at){
  return _.seq(_.intersection(_.get(contents, at), obstructions));
});

export const lacks = _.partly(_.pipe(contains, _.not));

export function destinations(contents) {
  return _.filter(
    _.and(
      _.or(
        _.and(
          contains([w], contents, _),
          contains([b], contents, _)),
        lacks([w], contents, _)),
      lacks([p, t, c], contents, _)),
         viableSpots);
}

export function isBridgable(board, contents, at){
  const what = _.getIn(board, coord(at)),
        cts  = _.get(contents, at);
  return what === w || _.eq([w], cts) ? orientBridge(board, contents, at) : null;
}

const sortSpots = _.sort(
  _.asc(_.pipe(coord, _.second)),
  _.asc(_.pipe(coord, _.first)),
  _);

function gather(coll, f, g, i){
  const idx = i || 0;
  const at = _.nth(coll, idx);
  const look = g(at, coll) ? around : stop;
  const spots = _.chain(at, look, _.filter(f, _), _.reduce(function(coll, at){
    return _.includes(coll, at) ? coll : _.conj(coll, at);
  }, coll, _));
  return _.nth(spots, idx + 1) ? gather(spots, f, g, idx + 1) : sortSpots(spots);
}

export function district(board, contents, spot){
  return gather([spot], dry(board, contents, _), _.constantly(true));
}

export function districts(board, contents){
  const f = dry(board, contents, _);
  return _.chain(spots,
    _.filter(f, _),
    _.reduce(function(memo, spot){
      return _.detect(_.eq(spot, _), cat(memo)) ? memo : _.conj(memo, gather([spot], f, _.constantly(true)));
    }, [], _));
}

const nodupes = _.pipe(
  _.mapa(sortSpots, _),
  _.sort(_.asc(_.hash), _),
  _.dedupe);

export function footways(pilli, board, contents){
  return _.chain(pilli,
    around,
    _.filter(
      _.and(
        _.notEq(_, CENTER),
        _.or(
          _.and(
            dry(board, contents, _),
            accessibleLand(contents, pilli, _)),
          accessibleBridge(contents, pilli, _)),
        lacks([p, t, c], contents, _)), _));
}

export function waterways(board, contents, bridges){
  return _.chain(bridges,
    _.mapcat(function(spot){
      return _.mapa(_.array(spot, _), _.filter(wet(board, contents, _), around(spot)));
    }, _),
    _.map(function(pair){
      const connected = _.count(_.filter(contains([b], contents, _), pair)) === 2;
      return _.chain(
        connected ? pair :
        gather(pair, wet(board, contents, _), function(at, coll){
          return _.count(coll) <3 || lacks([b], contents, at);
        }, 1),
        _.pipe(
            _.filter(contains([b], contents, _), _),
            _.branch(_.pipe(_.count, _.gt(_, 1)), _.identity, _.constantly([]))),
        _.unique);
    }, _),
    _.filter(_.seq, _),
    nodupes,
    //$.see("pools"),
    _.mapcat(function(pool){
      return _.mapcat(function(x){
        return _.filtera(_.pipe(_.count, _.dec), _.mapa(function(y){
          return _.unique([x, y]);
        }, pool));
      }, pool);
    }, _),
    nodupes,
    _.toArray);
}

function expand(waterways, connection, arrivals){
  const {from, to, cost, seen, heads, arrived} = connection;
  if (arrived){
    throw new Error("Cannot expand on an arrival.");
  }
  const _heads = _.chain(waterways,
    _.filter(function(ww){
      return _.seq(_.intersection(ww, heads));
    }, _),
    _.concatenated,
    _.unique,
    _.remove(_.includes(seen, _), _),
    _.toArray);
  const _seen = _.unique(_.concat(seen, _heads));
  return {
    from,
    to,
    cost: cost + 1,
    seen: _seen,
    heads: _heads,
    arrived: _.includes(_seen, to)
  }
}

function expanding(connections, waterways, actions){
  const [arrivals, nonarrivals] = _.sift(_.get(_, "arrived"), connections);
  return actions > 0 && _.seq(nonarrivals) ? expanding(_.concat(arrivals, _.map(function(connection){
    return expand(waterways, connection, arrivals);
  }, nonarrivals)), waterways, actions - 1) : connections;
}

export function boats(from, bridges, waterways, actions = 4){
  return _.chain(bridges,
    _.remove(_.eq(from, _), _),
    _.map(function(to){
      const cost = 0, seen = [from], heads = [from], arrived = false;
      return {from, to, cost, seen, heads, arrived};
    }, _),
    connections => expanding(connections, waterways, actions),
    _.filter(_.get(_, "arrived"), _));
}

function remaining(spent, bank, redeemed){
  return (6 + bank + redeemed) - spent;
}

function spend(spent, bank, cost){
  const unspent = 6 - spent;
  const overage = unspent < 0;
  const remaining = _.max(unspent, 0);
  const deficit = cost > 0 && remaining + bank < cost;
  const redeemed = deficit ? 0 : (overage ? cost : (unspent > cost ? 0 : Math.abs(unspent - cost)));
  return {deficit, redeemed};
}

function breaksBridge(board, contents, canal){
  const footers = _.chain(canal,
    _.mapcat(around, _),
    _.filter(contains([b], contents, _), _),
    _.mapcat(function(at){
      return orientBridge(board, contents, at) === "horizontal" ? [left(at), right(at)] : [above(at), below(at)];
    }, _),
    _.toArray);
  return !!_.detect(_.includes(footers, _), canal);
}

function levels(temples, dist){
  return _.mapa(function(temples){
    return _.sum(_.mapkv(function(level, spots){
      return _.count(_.filter(_.includes(dist, _), spots)) * level;
    }, temples));
  }, temples);
}

function places(temples, dist){
  const size = _.count(dist);
  const lvls = levels(temples, dist);
  const ranks = _.chain(lvls, _.vals, _.compact, _.sort(_.desc(_.identity), _), _.take(3, _), _.toArray);
  return _.chain(lvls, _.mapkv(function(seat, levels){
    const idx = _.indexOf(ranks, levels);
    return idx >= 0 ? idx + 1 : null;
  }, _), _.toArray);
}

function tieBumps(places){
  const firsts = _.count(_.filter(_.eq(1, _), places));
  const seconds = _.count(_.filter(_.eq(2, _), places));
  return firsts > 2 ? _.mapa(function(place){
    return place === 1 ? 1 : 0;
  }, places) : firsts ===  2 ? _.mapa(function(place){
    return place === 1 ? 1 : place === 2 ? 3 : 0;
  }, places) : seconds > 1 ? _.mapa(function(place){
    return place === 1 || place === 2 ? place : 0;
  }, places) : places;
}

const full = _.identity;

function half(size){
  return Math.round(size / 2);
}

const quarter = _.comp(half, half);

function founds(pillis, founder, dist){
  const size = _.count(dist);
  return _.toArray(_.mapkv(function(seat, spot){
    return seat === founder ? half(size) : _.includes(dist, spot) ? quarter(size) : 0;
  }, pillis));
}

export function founded(contents, dist){
  return _.detect(contains([c], contents, _), dist);
}

function bonus(spots, pillis){
  return _.mapa(function(pilli){
    return _.includes(spots, pilli) ? 5 : 0;
  }, pillis);
}

function score(size, place){
  const f = _.get([full, half, quarter], place - 1, _.constantly(0));
  return f(size);
}

function scored(period, temples, contents, dists, pillis){
  return _.chain(dists, _.mapa(function(dist){
    const marker = _.detect(contains([c], contents, _), dist);
    const size = _.count(dist);
    const at = marker || _.first(dist);
    const plcs = tieBumps(places(temples, dist));
    const points = marker || period ? _.mapa(function(seat){
      return score(size, _.nth(plcs, seat));
    }, _.range(_.count(temples))) : null;
    return {at, size, points};
  }, _), period ? _.identity : _.filtera(_.get(_, "points"), _));
}

export function scores(self){
  const {seated, nonplayer, contents, period} = _.deref(self);
  const pillis = _.map(_.get(_, "pilli"), seated);
  const temples = _.chain(seated,
    _.map(_.pipe(_.get(_, "temples"), consolidateTemples), _),
    _.get(nonplayer, "temples") ? _.concat(_, [_.get(nonplayer, "temples")]) : _.identity);
  return scored(period, temples, contents, districts(board, contents), pillis);
}

const hasUnconstructedBridge = _.comp(_.seq, _.filter(_.isNil, _));

function redeem(seat, amount){
  return _.pipe(
    _.update(_, "redeemed", _.add(_, amount)),
    _.update(_, "tokens", _.add(_, amount)),
    _.updateIn(_, ["seated", seat, "bank"], _.subtract(_, amount)))
}

function price(command){
  const {details, type} = command;
  switch (type) {
    case "bank":
    case "banked":
    case "pass":
    case "passed":
    case "construct-canal":
    case "constructed-canal":
    case "construct-bridge":
    case "relocate-bridge":
    case "relocated-bridge":
      return 1;
    case "build-temple":
    case "built-temple":
      return details.level;
    case "move":
    case "moved":
      return details.cost || 1;
    default:
      return 0;
  }
}

export function bridgePlacements(contents){
  return _.chain(spots,
    _.filter(
      _.and(
        contains([w], contents, _),
        lacks([b, p], contents, _)), _),
    _.groupBy(spot => orientBridge(board, contents, spot), _),
    _.merge({horizontal: [], vertical: []}, _));
}

function contiguous(at){
  return _.count(at) < 2 || _.reduce(function(memo, [a, b]){
    return memo && _.includes(around(a), b);
  }, true, _.scan(2, at));
}

export function execute(self, command){
  const state = _.deref(self);
  const {type, details, seat} = command;
  const endOfRound = seat === _.count(state.seated) - 1;
  const cost = price(command);
  const moves = g.moves(self, {type, seat});
  const automatic = _.includes(["start", "deal-calpulli"], type);
  const matched = _.detect(_.eq(_, _.chain(command, _.compact, _.dissoc(_, "id"))), moves);
  const seated = seat == null ? {pilli: null, bank: 0} : state.seated[seat];
  const {spent, contents, period, canal1, canal2, calpulli, bridges, banked, tokens} = state;
  const {bank, pilli} = seated;
  const {deficit} = spend(spent, bank, cost);
  const pillis = _.map(_.get(_, "pilli"), state.seated);

  if (deficit) {
    throw new Error("Not enough action points to do that.");
  }

  if (automatic && seat != null) {
    throw new Error(`Cannot invoke automatic command ${type}.`);
  }

  switch (type) {
    //TODO provide UI cue when scoring will happen on commit
    case "commit": {
      if (!matched) {
        throw new Error("Cannot end turn while actions remain.");
      }
      return _.chain(self,
        g.fold(_, _.assoc(command, "type", "committed")),
        _.get(state, "scoring-round") && endOfRound
          ? _.pipe(
              g.fold(_, {
                type: "scored-grandeur",
                details: {
                  period,
                  palace: bonus(palaceSpots, pillis),
                  districts: scores(self)
                }
              }),
              period === 0 ? g.fold(_, {type: "concluded-period"}) : g.finish)
          : _.identity);
    }
    case "bank": {
      if (tokens < 1) {
        throw new Error("Cannot bank actions while tokens are exhausted.");
      }
      if (banked === 2) {
        throw new Error("Cannot bank more than 2 action points a turn.");
      }
      if (!matched) {
        throw new Error("Cannot bank actions at this time.");
      }
      return _.chain(self, g.fold(_, {type: "banked", seat}));
    }
    case "move": {
      const {by, from, to} = details;
      if (from === to) {
        throw new Error("Cannot move to the same space.");
      }
      if (contains([p, t, c], contents, to)) {
        throw new Error("Cannot move to obstructed spaces.");
      }
      if (!matched && by !== "teleport"){
        throw new Error("Cannot reach that space directly.");
      }
      if (wet(board, contents, to) && !contains([b], contents, to)) {
        throw new Error("Cannot move to water.");
      }
      return _.chain(self, g.fold(_, _.assoc(command, "type", "moved")));
    }
    case "construct-canal": {
      if (!contiguous(details.at)){
        throw new Error("Cannot place canals on nonadjacent spaces.");
      }
      for(const canalAt of details.at){
        if (founded(contents, district(board, contents, canalAt))){
          throw new Error("Cannot place canals in a founded district.");
        }
        if (!isVacant(board, contents, canalAt)) {
          throw new Error("Cannot place canals except on empty land spaces.");
        }
      }
      if (breaksBridge(board, contents, details.at)) {
        throw new Error("Cannot place canals at the foot of a bridge.");
      }
      return _.chain(self,
        g.fold(_, {type: "constructed-canal", seat, details: {at: sortSpots(details.at)}}),
        function(self){
          const state = _.deref(self);
          const {canal1, canal2, contents, calpulli} = state;
          const removed = canalsDepleted(canal1, canal2) ?
            _.chain(districts(board, contents),
              _.remove(dist => founded(contents, dist) || jammed(contents, dist), _),
              _.mapa(_.count, _),
              _.partial(unfoundables, _.chain(calpulli, _.concatenated, _.toArray))) : null;
          return _.seq(removed) ? g.fold(self, {type: "removed-unfoundables", details: {removed}}) : self;
        });
    }
    case "build-temple": {
      const present = _.detect(_.eq(details.at, _), district(board, contents, pilli));
      if (!present){
        throw new Error("Cannot place temples in districts where you're not present.");
      }
      if (!isVacant(board, contents, details.at)) {
        throw new Error("Cannot place temples except on empty land spaces.");
      }
      if (!_.chain(state, _.getIn(_, ["seated", seat, "temples"]), _.take(period + 1, _), consolidateTemples, _.get(_, details.level), _.filter(_.isNil, _), _.count)){
        throw new Error(`Cannot build level-${details.level} temples.  Supply depleted.`);
      }
      return _.chain(self, g.fold(_, _.assoc(command, "type", "built-temple")));
    }
    case "construct-bridge": {
      if (!isBridgable(board, contents, details.at)) {
        throw new Error("Cannot construct bridge there.");
      }
      return _.chain(self, g.fold(_, _.assoc(command, "type", "constructed-bridge")));
    }
    case "relocate-bridge": {
      if (hasUnconstructedBridge(bridges)) {
        throw new Error("Cannot relocate bridges while the supply has bridges.");
      }
      if (!isBridgable(board, contents, details.to)) {
        throw new Error("Cannot relocate bridge there.");
      }
      if (!contains([b], contents, details.from)){
        throw new Error("Cannot relocate bridge from that location.");
      }
      if (contains([p], contents, details.from)){
        throw new Error("Cannot relocate occupied bridges.");
      }
      return _.chain(self, g.fold(_, _.assoc(command, "type", "relocated-bridge")));
    }
    case "found-district": {
      if (!matched){
        throw new Error("Cannot found a district where your Mexica Pilli is not present.");
      }
      const dist = district(board, contents, pilli);
      if (founded(contents, dist)){
        throw new Error("Cannot found a founded district.");
      }
      if (!isVacant(board, contents, details.at)) {
        throw new Error("Cannot place calpulli except on empty land spaces.");
      }
      const points = founds(_.toArray(pillis), seat, dist);
      return _.chain(self, g.fold(_, {type: "founded-district", seat, details: {at: details.at, size: _.count(dist), points}}));
    }
    case "pass": {
      if (!matched){
        throw new Error("Cannot pass once initial actions are spent.");
      }
      return _.chain(self, g.fold(_, _.assoc(command, "type", "passed")));
    }
    case "place-pilli": {
      if (!matched) {
        throw new Error("Cannot place Mexica Pilli there.");
      }
      return _.chain(self, g.fold(_, _.assoc(command, "type", "placed-pilli")));
    }
    /*
    case "propose-unfoundables": {
      const sizes = _.chain(command, _.getIn(_, ["details", "calpulli"]), _.mapa(function(idx){
        const [period, pos] = idx > 8 ? [1, idx - 8] : [0, idx];
        return _.getIn(state, ["calpulli", period, pos, "size"]);
      }, _));
      //TODO ensure no `at`
      if (!_.seq(sizes)) {
        throw new Error("No removals proposed.");
      }
      return _.chain(self,
        g.fold(_, _.chain(command,
          _.assocIn(_, ["type"], "proposed-unfoundables"),
          _.assocIn(_, ["details", "sizes"], sizes))));
    }
    case "answer-proposal": {
      const answer = _.getIn(command, ["details", "answer"]);
      if (_.includes([null, "accept", "reject"], answer)) {
        throw new Error("Invalid answer.");
      }
      return g.fold(self, _.assoc(command, "type", "answered-proposal"));
    }
*/
    case "finish": {
      return g.fold(self, _.assoc(command, "type", "finished"));
    }
    case "deal-calpulli": {
      const {dealCalpulli} = self.config;
      return _.chain(self,
        g.fold(_, {type: "dealt-calpulli", details: {calpulli: dealCalpulli(calpullis)}, seat: null}));
    }
    case "start": {
      return _.chain(self,
        g.fold(_, {type: "started", seat: null}),
        _.count(state.seated) === 2 ? g.fold(_, {type: "scattered-temples", details: scatterTemples(), seat: null}) : _.identity,
        g.execute(_, {type: "deal-calpulli", seat: null}));
    }
  }
}

function jammed(contents, dist){ //district has no room to build temples
  return _.chain(dist,
    _.map(_.get(contents, _), _),
    _.remove(_.includes(_, t), _), _.count) < 2; //fewer than 2 non-temple spots
}

function unfoundables(calpulli, keeping){
  return _.chain(calpulli,
    _.reduce(function(calpulli, size){
      const which = _.detectIndex(_.eq({at: null, size}, _), calpulli);
      return which == null ? calpulli : _.update(calpulli, which, _.assoc(_, "feasible", true));
    }, _, keeping),
    _.mapIndexed(function(idx, c){
      return c.at == null && !c.feasible ? idx : null;
    }, _),
    _.filtera(_.isSome, _));
}

function removeCalpulli(removed){
  return _.update(_, "calpulli", function(calpulli){
    return _.reduce(function(calpulli, idx){
      const [period, i] = idx < 8 ? [0, idx] : [1, idx - 8];
      return _.assocIn(calpulli, [period, i], null);
    }, calpulli, removed);
  });
}

const clearProposal = _.dissoc(_, "proposed-unfoundables");

function fold(self, event){
  const state = _.deref(self);
  const {period, spent, status} = state;
  const {type, details, seat} = event;
  const {pilli, bank} = _.nth(state.seated, seat) || {pilli: null, bank: null};
  const cost = price(event);
  const {redeemed} = spend(spent, bank, cost);

  switch (type) {
    case "started":
      return g.fold(self, event,
        _.pipe(
          _.update(_, "contents", _.pipe(
            place(w, "O6"),
            place(w, "O7"),
            place(w, "O8"),
            place(w, "O9"))),
          _.update(_, "canal2", _.assoc(_, 0, ["O6", "O7"], 1, ["O8", "O9"]))));

    case "scattered-temples":
      const temples = details;
      return g.fold(self, event,
        _.pipe(
          _.assoc(_, "nonplayer", {temples}),
          _.update(_, "contents", function(contents){
            return _.chain(details,
              extractTemples,
              _.map(_.get(_, "spot"), _),
              _.reduce(place(t), contents, _));
          })));

    case "dealt-calpulli":
      return g.fold(self, event,
        _.pipe(
          _.merge(_, details),
          _.assoc(_, "status", "placing-pilli"),
          _.assoc(_, "up", 0)));

    case "placed-pilli":
      return g.fold(self, event,
        _.pipe(
          _.assocIn(_, ["seated", seat, "pilli"], details.at),
          _.update(_, "contents", place(p, details.at))));

    case "committed":
      return g.fold(self, event, committed);

    case "passed":
      return g.fold(self, event,
        _.pipe(
          _.update(_, "spent", _.inc)));

    case "banked":
      return g.fold(self, event,
        _.pipe(
          redeem(seat, redeemed),
          _.update(_, "spent", _.inc),
          _.update(_, "banked", _.inc),
          _.update(_, "tokens", _.dec),
          _.updateIn(_, ["seated", seat, "bank"], _.inc)));

    case "constructed-canal":
      const size = _.count(details.at);
      return g.fold(self, event,
        _.pipe(
          redeem(seat, redeemed),
          _.update(_, "spent", _.inc),
          _.update(_, `canal${size}`, consume(details.at)),
          _.update(_, "contents", function(contents){
            return _.reduce(place(w), contents, details.at);
          })));
/*
    case "proposed-unfoundables":
      return g.fold(self, event, _.pipe(
        _.assoc(_, "proposed-unfoundables", {calpulli: details.calpulli, accepted: [event.seat]})));

    case "answered-proposal": {
      const {answer} = details;
      const seats = _.count(state.seated);
      const removed = _.getIn(state, ["proposed-unfoundables", "calpulli"]);
      return g.fold(self, event,
        _.pipe(
        _.updateIn(_, ["proposed-unfoundables", "accepted"], answer == "accept" ? _.chain(_, _.conj(_, event.seat), _.unique) : answer == null ? _.filtera(_.notEq(_, event.seat), _) : _.identity),
        function(state){
          const accepted = _.count(_.getIn(state, ["proposed-unfoundables", "accepted"]));
          const fullyAccepted = seats == accepted;
          const noneAccepted = accepted == 0;
          if (fullyAccepted) {
            return g.fold(self, {type: "removed-unfoundables", details: {removed}}, clearProposal);
          } else if (answer == "reject" || noneAccepted) {
            return _.chain(state, clearProposal);
          } else {
            return state;
          }
        }));
    }
*/
    case "removed-unfoundables":
      return g.fold(self, event,
        _.pipe(
          removeCalpulli(details.removed),
          markScoringRound));

    case "constructed-bridge":
      return g.fold(self, event,
        _.pipe(
          redeem(seat, redeemed),
          _.update(_, "spent", _.inc),
          _.update(_, "bridges", consume(details.at)),
          _.update(_, "contents", place(b, details.at))));

    case "relocated-bridge":
      return g.fold(self, event,
        _.pipe(
          redeem(seat, redeemed),
          _.update(_, "spent", _.inc),
          _.update(_, "bridges", _.pipe(remit(details.from), consume(details.to))),
          _.update(_, "contents", _.pipe(displace(b, details.from), place(b, details.to)))));

    case "built-temple":
      return g.fold(self, event,
        _.pipe(
          redeem(seat, redeemed),
          _.update(_, "spent", _.add(_, details.level)),
          _.updateIn(_, ["seated", seat, "temples"], _.post(function(temples){
            const idx = _.includes(_.getIn(temples, [0, details.level]), null) ? 0 : 1;
            return _.updateIn(temples, [idx, details.level], consume(details.at));
          }, function(temples){
            return _.isArray(temples) && _.count(temples) === 2;
          })),
          _.update(_, "contents", place(t, details.at)),
          markScoringRound));

    case "moved":
      return g.fold(self, event,
        _.pipe(
          redeem(seat, redeemed),
          _.update(_, "spent", _.add(_, cost)),
          _.assocIn(_, ["seated", seat, "pilli"], details.to),
          _.update(_, "contents", _.pipe(displace(p, pilli), place(p, details.to)))));

    case "scored-grandeur":
      return g.fold(self, event,
        _.update(_, ["seated"], _.pipe(_.mapIndexed(function(seat, seated){
          const {districts, palace} = event.details;
          const points = _.sum(_.cons(_.nth(palace, seat), _.map(function({at, points}){
            return _.nth(points, seat);
          }, districts)));
          return _.update(seated, "points", _.add(_, points));
        }, _), _.toArray)));

    case "concluded-period":
      return g.fold(self, event,
        _.pipe(
          _.update(_, "period", _.inc),
          _.assoc(_, "scoring-round", false)));

    case "founded-district":
      return g.fold(self, event,
        _.pipe(
          _.updateIn(_, ["calpulli", period], function(calpulli){
            const idx = _.first(_.keepIndexed(function(idx, marker){
              const {at, size} = marker || {at: null, size: null};
              return at == null && size === details.size ? idx : null;
            }, calpulli));
            return _.update(calpulli, idx, _.assoc(_, "at", details.at));
          }),
          _.update(_, ["seated"], _.pipe(_.mapIndexed(function(seat, seated){
            const points = _.nth(details.points, seat);
            return _.update(seated, "points", _.add(_, points));
          }, _), _.toArray)),
          _.update(_, "contents", place(c, details.at)),
          markScoringRound));

    case "finished":
      return g.fold(self, event, _.pipe(_.dissoc(_, "up"), _.assoc(_, "status", "finished")));

    default:
      return g.fold(self, event, _.merge(_, details)); //plain events

  }
}

function compact(self){
  return new Mexica(self.seats,
    self.config,
    [],
    self.state);
}

function append(self, event){
  return new Mexica(self.seats,
    self.config,
    _.append(self.events, event),
    self.state);
}

function fmap(self, f){
  return new Mexica(self.seats,
    self.config,
    self.events,
    f(self.state));
}

function up(self){
  const {up} = _.deref(self);
  return _.filtera(_.isSome, [up]);
}

const may = up;

export function foundable(board, contents, markers, pilli){
  const dist = district(board, contents, pilli);
  if (founded(contents, dist)){
    return null;
  }
  const size = _.count(dist);
  const [marked, unmarked] = _.sift(function(tile){
    return !!_.get(tile, "at");
  }, markers);
  const fixed = _.detect(function(at){
    return _.detect(function(c){
      return c.at === at;
    }, marked);
  }, dist);
  const avail = size < 14 && _.detect(function(marker){
    return _.get(marker, "size") === size;
  }, unmarked);
  return _.seq(_.map(function(at){
    return {size, at};
  }, avail && !fixed ? _.filter(isVacant(board, contents, _), dist) : null));
}

function canalable(board, contents){
  return _.filter(isVacant(board, contents, _), cat(_.remove(function(dist){
    return _.detect(function(at){
      return _.includes(_.get(contents, at), c); //calpulli?
    }, dist)
  }, districts(board, contents))));
}

export const accessibleBridge = _.partly(function accessibleBridge(contents, pilli, at){
  if (contains([b], contents, at)) {
    const orient = orientBridge(board, contents, at);
    const f = orient === "horizontal" ? horizontally : orient === "vertical" ? vertically : _.constantly([]);
    return _.includes(f(pilli), at);
  } else {
    return false;
  }
});

export const accessibleLand = _.partly(function accessibleLand(contents, pilli, at){
  if (contains([b], contents, pilli)) {
    const orient = orientBridge(board, contents, pilli);
    const f = orient === "horizontal" ? horizontally : orient === "vertical" ? vertically : _.constantly([]);
    return _.includes(f(pilli), at);
  } else {
    return true;
  }
});

function moves1(self){
  return ["construct-canal", "construct-bridge", "relocate-bridge", "found-district", "bank", "move", "pass", "propose-unfoundables", "answer-proposal", "commit", "place-pilli"];
}

function moves3(self, type, seat){
  const up = g.up(self);

  if (!_.includes(up, seat)) {
    return [];
  }

  const {contents, calpulli, canal1, canal2, bridges, period, status, spent, redeemed, banked, seated} = _.deref(self);
  const {pilli, bank} = _.nth(seated, seat);
  const from = pilli;
  const unspent = remaining(spent, bank, redeemed);
  const permit = [{type, seat}];

  if (status == "placing-pilli") {
    switch(type){
      case "place-pilli": {
        const taken = _.chain(seated, _.map(_.get(_, "pilli"), _), _.compact);
        return pilli ? [] : _.chain(palaceSpots, _.remove(_.includes(taken, _), _), _.map(function(at){
          return {type, details: {at}, seat}; //TODO compel 4th player to last position
        }, _));
      }

      case "commit": {
        return pilli ? [{type, seat}] : [];
      }

      default: {
        return [];
      }
    }
  } else {
    switch(type){
      case "construct-canal": {
        return canalsDepleted(canal1, canal2) ? [] : permit;
      }

      case "found-district": {
        const markers = _.nth(calpulli, period);
        return _.map(function(details){
          return {type, seat, details};
        }, foundable(board, contents, markers, pilli));
      }

      case "construct-bridge": {
        return bridgesDepleted(bridges) ? [] : permit;
      }

      case "relocate-bridge": {
        return bridgesDepleted(bridges) ? permit : [];
      }

      case "bank": {
        return banked < 2 ? permit : [];
      }

      case "move": {
        const foot = unspent > 0 ?
          _.map(function(to){
            return {type, details: {by: "foot", from, to}, seat};
          }, footways(pilli, board, contents)) : [];
        const water = waterways(board, contents, _.compact(bridges));
        const boat = contains([b], contents, pilli) ? _.map(function({from, to, cost}){
          return {type: "move", details: {by: "boat", from, to, cost}, seat};
        }, boats(pilli, _.compact(bridges), water, _.min(unspent, 4))) : [];
        const teleport = unspent > 4 ? [{type: "move", details: {by: "teleport", from, cost: 5}, seat}] : [];
        return _.concat(foot, boat, teleport);
      }

      case "pass": {
        return spent < 6 ? permit : [];
      }

      case "commit": {
        return spent > 5 ? permit : [];
      }

      case "propose-unfoundables": {
        return permit;
      }

      default: {
        return [];
      }
    }
  }
}

const moves = _.overload(null, moves1, moves1, moves3);

function metrics(self){
  const {seated} = _.deref(self);
  return _.mapa(function({points, bank}){
    return {points, bank};
  }, seated);
}

function comparator(self){
  return function(a, b){
    const points = (b.points - a.points) * 100;
    const bank = b.bank - a.bank;
    return points + bank;
  };
}

function textualizer(self){
  return function({points, bank}){
    return `${points} pts., ${bank} banked actions`;
  }
}

function perspective(self, seen, reality){
  return reality; //no hidden info.
}

function undoable(self, {type}){
  return !_.includes(["started", "committed", "finished", "dealt-calpulli", "scattered-temples", "concluded-period", "scored-grandeur", "proposed-unfoundables"], type);
}

function status(self){
  const {canal2, status, round, period} = _.deref(self);
  if (_.chain(canal2, _.first, _.isSome)) {
    return status === "finished" ? [status] : ["started", period + 1, round, status];
  } else {
    return ["pending"];
  }
}

_.doto(Mexica,
  g.behave,
  _.implement(_.ICompactible, {compact}),
  _.implement(_.IAppendable, {append}),
  _.implement(_.IFunctor, {fmap}),
  _.implement(g.IGame, {perspective, status, up, may, moves, undoable, metrics, comparator, textualizer, execute, fold}));

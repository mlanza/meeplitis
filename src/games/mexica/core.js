import _ from "/lib/atomic_/core.js";
import g from "/lib/game_.js";

const slots = _.pipe(_.repeat(_, null), _.toArray);

const COL = 64, ROW = 0;

const w = "w", //water
      l = "l", //land
      e = "e", //emperor's palace
      b = "b", //bridge
      c = "c", //capulli
      t = "t", //temple
      p = "p", //pilli
      n = "-"; //nothing

const board = [
       /*@,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V*/
  /*0*/ [n,w,w,w,w,w,w,w,w,w,w,w,n,n,n,n,n,n,n,n,n,n,n],
  /*1*/ [n,w,l,w,w,w,l,l,l,l,l,w,w,w,n,n,n,n,n,n,n,n,n],
  /*2*/ [w,w,l,l,l,l,l,l,l,l,l,l,l,w,n,n,n,n,n,n,n,n,n],
  /*3*/ [w,l,l,l,l,l,l,l,l,l,l,l,l,w,w,w,n,n,n,n,n,n,n],
  /*4*/ [w,l,l,l,l,l,l,l,l,l,l,l,l,l,l,w,w,w,n,n,n,n,n],
  /*5*/ [w,w,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,w,w,w,w,w,w],
  /*6*/ [n,w,l,l,l,l,l,l,e,l,l,l,l,l,l,w,l,l,l,w,l,l,w],
  /*7*/ [n,w,l,l,l,l,l,e,e,e,l,l,l,l,l,w,l,l,l,l,l,l,w],
  /*8*/ [n,w,l,l,l,l,l,l,e,l,l,l,l,l,l,w,l,l,l,l,l,l,w],
  /*9*/ [n,w,w,l,l,l,l,l,l,l,l,l,l,l,l,w,l,l,l,l,l,w,w],
 /*10*/ [w,w,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,w,w,w,w,n],
 /*11*/ [w,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,w,w,w,n,n,n,n],
 /*12*/ [w,l,l,l,l,l,l,l,l,l,l,l,l,l,w,w,w,n,n,n,n,n,n],
 /*13*/ [w,l,l,l,l,l,l,l,l,l,l,l,w,w,w,n,n,n,n,n,n,n,n],
 /*14*/ [w,w,w,l,l,l,l,w,w,l,l,w,w,n,n,n,n,n,n,n,n,n,n],
 /*15*/ [n,n,w,w,w,w,w,w,w,w,w,w,n,n,n,n,n,n,n,n,n,n,n]
]

const capullis = [
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
  }, _.first(temples), _.rest(temples))
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

function capulliDepleted(capulli, period){
  return !_.chain(capulli, _.nth(_, period), _.map(_.get(_, "at"), _), _.remove(_.isSome, _), _.seq);
}

function markScoringRound(state){
  const {capulli, period, seated} = state;
  return capulliDepleted(capulli, period) &&
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

function init(seats){
  return {
    up: 0,
    status: null,
    board,
    contents: {},
    period: 0,
    round: 0,
    "scoring-round": false,
    spent: 0,
    redeemed: 0,
    banked: 0,
    tokens: 12,
    canal1: slots(6),
    canal2: _.assoc(slots(35), 0, ["O6", "O7"], 1, ["O8", "O9"]),
    bridges: slots(11),
    capulli: null,
    seated: _.toArray(_.repeat(seats, {
      pilli: null,
      temples,
      bank: 0,
      points: 0
    }))
  };
}

function Mexica(seats, config, events, journal){
  this.seats = seats;
  this.config = config;
  this.events = events;
  this.journal = journal;
}

export default function mexica(seats, _config, events, journal){
  if (!_.count(seats)) {
    throw new Error("Cannot play a game with no one seated at the table");
  }
  const config = _.merge({dealCapulli}, _config);
  return new Mexica(_.toArray(seats), config, events || [], journal || _.chain(seats, _.count, init, _.journal));
}

export const make = mexica;

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

const CENTER = 'H7';
const around = _.juxt(above, right, below, left);
const stop = _.constantly([]);
const palaceSpots = around(CENTER);

function committed(state){
  const {status, seated, capulli, period, up} = state;
  const seats = _.count(seated);
  const endRound = seats - 1 === up;
  const absent = !!_.seq(_.remove(_.get(_, "pilli"), seated));
  return _.chain(state,
    _.update(_, "round", endRound ? _.inc : _.identity),
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

function dealCapulli(capullis){
  const xs = _.chain(_.range(15), _.shuffle, _.take(8, _), _.sort);
  return _.chain(capullis,
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

const isVacant = _.partly(function isVacant(board, contents, at){
  const what = _.getIn(board, coord(at)),
        cts  = _.seq(_.get(contents, at));
  return what === l && !cts;
});

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
    const idx = indexDetect(_.eq(_, spot), pieces);
    return idx > -1 ? _.assoc(pieces, idx, null) : pieces;
  }
}

function indexDetect(pred, xs){
  const [idx, item] = _.detect(function([_, x]){
    return pred(x);
  }, _.mapIndexed(_.array, xs)) || [-1, null];
  return idx;
}

function place(what, at){
  return _.update(_, at, _.pipe(_.either(_, []), _.conj(_, what)));
}

function displace(what, at){
  return _.update(_, at, _.pipe(_.either(_, []), _.filtera(_.notEq(what, _), _)));
}

function orientBridge(board, contents, at){
  return dry(board, contents, above(at)) && dry(board, contents, below(at)) ? "vertical" :
         dry(board, contents, left(at))  && dry(board, contents, right(at)) ? "horizontal" : null;
}

function hasPilli(contents, at){
  const cts = _.get(contents, at);
  return _.includes(cts, p);
}

const occupied = _.partly(function occupied(contents, at){
  const cts = _.get(contents, at);
  return _.includes(cts, p) || _.includes(cts, t) || _.includes(cts, c);
});

const unoccupied = _.partly(_.pipe(occupied, _.not));

const has = _.partly(function has(what, contents, at){
  const cts = _.get(contents, at);
  return _.includes(cts, what);
});

const lacks = _.partly(_.pipe(has, _.not));
const lacksBridge = lacks(b, _, _);
const hasBridge = has(b, _, _);

function isBridgable(board, contents, at){
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

function district(board, contents, spot){
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

export function waterways(board, contents, bridges){
  return _.chain(bridges,
    _.mapcat(function(spot){
      return _.mapa(_.array(spot, _), _.filter(wet(board, contents, _), around(spot)));
    }, _),
    _.map(function(pair){
      const connected = _.count(_.filter(hasBridge(contents, _), pair)) === 2;
      return _.chain(
        connected ? pair :
        gather(pair, wet(board, contents, _), function(at, coll){
          return _.count(coll) <3 || lacksBridge(contents, at);
        }, 1),
        _.pipe(
            _.filter(hasBridge(contents, _), _),
            _.branch(_.pipe(_.count, _.gt(_, 1)), _.identity, _.constantly([]))),
        _.unique);
    }, _),
    _.filter(_.seq, _),
    nodupes,
    //_.see("pools"),
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

function travel(waterways, canals, min, max){
  return _.chain(canals,
    _.filter(_.pipe(_.count, _.eq(_, min - 1)), _),
    _.mapcat(function(canal){
      const excludes = _.scan(2, canal);
      const wws = _.remove(function(waterway){
        return _.detect(function([x, y]){
          return _.eq(waterway, [x, y]) || _.eq(waterway, [y, x]);
        }, excludes);
      }, waterways);
      const from = _.last(canal);
      const nexts = _.chain(wws,
        _.filter(function(waterway){
          return _.includes(waterway, from);
        }, _),
        cat,
        _.remove(_.eq(_, from), _),
        _.map(function(spot){
          return _.includes(canal, spot) ? canal : _.toArray(_.concat(canal, [spot]));
        }, _));
      return min <= max ? travel(wws, nexts, min + 1, max) : nexts;
    }, _),
    _.concat(canals, _));
}

export function boats(waterways, from, max, seat){
  return _.chain(
    travel(waterways, [[from]], 2, max),
    _.filtera(_.pipe(_.count, _.gt(_, 1)), _),
    //_.see("travel"),
    _.groupBy(_.last, _),
    _.mapVals(_, _.pipe(_.sort(_.asc(_.count), _), _.first)),
    _.vals,
    _.mapa(function(waterway){
      const to = _.last(waterway),
            cost = _.count(waterway) - 1;
      return {type: "move", details: {by: "boat", from, to, cost}, seat};
    }, _));
}

function remaining(spent, bank){
  return (6 + bank) - spent;
}

function spend(spent, bank, cost){
  const unspent = 6 - spent;
  const overage = unspent < 0;
  const remaining = _.max(unspent, 0);
  const deficit = cost > 0 && remaining + bank < cost;
  const redeemed = deficit ? 0 : (overage ? cost : (unspent > cost ? 0 : Math.abs(unspent - cost)));
  return {deficit, redeemed};
}

function hasCapulli(contents, spots){
  return _.some(function(spot){
    return _.includes(_.get(contents, spot), c) ? spot : null;
  }, spots);
}

function breaksBridge(board, contents, canal){
  const footers = _.chain(canal,
    _.mapcat(around, _),
    _.filter(_.partial(hasBridge, contents), _),
    _.mapcat(function(at){
      return orientBridge(board, contents, at) === "horizontal" ? [left(at), right(at)] : [above(at), below(at)];
    }, _),
    _.toArray);
  return !!_.detect(_.includes(footers, _), canal);
}

function levels(temples, dist){
  return _.chain(temples, consolidateTemples, _.mapa(function(temples){
    return _.sum(_.mapkv(function(level, spots){
      return _.count(_.filter(_.includes(dist, _), spots)) * level;
    }, temples));
  }, _));
}

function places(temples, dist){
  const size = _.count(dist);
  const lvls = levels(temples, dist);
  const ranks = _.unique(_.sort(_.desc(_.identity), lvls));
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

function founded(pillis, founder, dist){
  const size = _.count(dist);
  return _.toArray(_.mapkv(function(seat, spot){
    return seat === founder ? half(size) : _.includes(dist, spot) ? quarter(size) : 0;
  }, pillis));
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

function scoreGrandeur(temples, contents, period, dists, pillis){
  const scored = _.mapa(function(dist){
    const marker = hasCapulli(contents, dist);
    const size = _.count(dist);
    const at = marker || _.first(dist);
    const plcs = tieBumps(places(temples, dist));
    const points = marker || period ? _.mapa(function(seat){
      return score(size, _.nth(plcs, seat));
    }, _.range(_.count(temples))) : null;
    return  {at, size, points};
  }, dists)
  const palace = bonus(palaceSpots, pillis);
  return {type: "scored-grandeur", details: {period, palace, districts: scored}}
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
  const _moves = g.moves(self, [seat]);
  const moves = _.filtera(_.comp(_.eq(_, command.type), _.get(_, "type")), _moves);
  const automatic = _.includes(["start", "deal-capulli"], type);
  const matched = _.detect(_.eq(_, _.chain(command, _.compact, _.dissoc(_, "id"))), moves);
  const seated = seat == null ? {pilli: null, bank: 0} : state.seated[seat];
  const {spent, board, contents, period, canal1, canal2, capulli, bridges, banked, tokens} = state;
  const {bank, pilli} = seated;
  const {deficit} = spend(spent, bank, cost);
  const temples = _.map(_.get(_, "temples"), state.seated);
  const pillis = _.map(_.get(_, "pilli"), state.seated);

  if (deficit) {
    throw new Error("Not enough action points.");
  }

  if (automatic && seat != null) {
    throw new Error(`Cannot invoke automatic command ${type}`);
  }

  if (!_.seq(g.events(self)) && type != "start") {
    throw new Error(`Cannot ${type} unless the game is first started.`);
  }

  switch (type) {
    case "start":
      return _.chain(self,
        g.fold(_, {type: "started"}),
        g.execute(_, {type: "deal-capulli", seat: null}));

    case "deal-capulli":
      const {dealCapulli} = self.config;
      return _.chain(self,
        g.fold(_, {type: "dealt-capulli", details: {capulli: dealCapulli(capullis)}, seat: null}));

    case "pass":
      if (!matched){
        throw new Error("Cannot pass once initial actions are spent");
      }
      return _.chain(self, g.fold(_, _.assoc(command, "type", "passed")));

    case "place-pilli":
      if (!matched) {
        throw new Error("Invalid pilli placement");
      }
      return _.chain(self, g.fold(_, _.assoc(command, "type", "placed-pilli")));

    //TODO provide UI cue when scoring will happen on commit
    case "commit":
      if (!matched) {
        throw new Error("Cannot commit while actions remain");
      }
      return _.chain(self,
        g.fold(_, _.assoc(command, "type", "committed")),
        _.get(state, "scoring-round") && endOfRound
          ? _.pipe(
              g.fold(_, scoreGrandeur(consolidateTemples(temples), contents, period, districts(board, contents), pillis)),
              g.fold(_, period === 0 ? {type: "concluded-period"} : {type: "finished"}))
          : _.identity);

    case "bank":
      if (tokens < 1) {
        throw new Error("No action point tokens are available.");
      }
      if (banked === 2) {
        throw new Error("Cannot bank more than 2 action points.");
      }
      if (!matched) {
        throw new Error("Cannot bank");
      }
      return _.chain(self, g.fold(_, {type: "banked", seat}));

    case "move":
      const {by} = details;
      if (!matched && by !== "teleport"){
        throw new Error("Invalid move");
      }
      return _.chain(self, g.fold(_, _.assoc(command, "type", "moved")));

    case "construct-canal":
      if (!contiguous(details.at)){
        throw new Error("Invalid canal tile");
      }
      for(const canalAt of details.at){
        if (hasCapulli(contents, district(board, contents, canalAt))){
          throw new Error("Cannot carve a founded district");
        }
        if (!isVacant(board, contents, canalAt)) {
          throw new Error("Invalid canal placement");
        }
      }
      if (breaksBridge(board, contents, details.at)) {
        throw new Error("Cannot construct canal at the foot of a bridge");
      }
      return _.chain(self, g.fold(_, {type: "constructed-canal", seat, details: {at: sortSpots(details.at)}}));

    case "build-temple":
      const present = _.detect(_.eq(details.at, _), district(board, contents, pilli));
      if (!present){
        throw new Error("Cannot place temples where your Mexica Pilli is not present");
      }
      if (!isVacant(board, contents, details.at)) {
        throw new Error("Invalid temple placement");
      }
      if (!_.chain(state, _.getIn(_, ["seated", seat, "temples"]), _.take(period + 1, _), consolidateTemples, _.get(_, details.level), _.filter(_.isNil, _), _.count)){
        throw new Error(`No level ${details.level} temples available`);
      }
      return _.chain(self, g.fold(_, _.assoc(command, "type", "built-temple")));

    case "construct-bridge":
      if (!isBridgable(board, contents, details.at)) {
        throw new Error("Invalid bridge placement");
      }
      return _.chain(self, g.fold(_, _.assoc(command, "type", "constructed-bridge")));

    case "relocate-bridge":
      if (hasUnconstructedBridge(bridges)) {
        throw new Error("Cannot relocate bridges while unconstructed bridges remain");
      }
      if (!isBridgable(board, contents, details.to)) {
        throw new Error("Invalid bridge placement");
      }
      if (!hasBridge(contents, details.from)){
        throw new Error("No bridge at from location");
      }
      if (hasPilli(contents, details.from)){
        throw new Error("Can only relocate free bridges");
      }
      return _.chain(self, g.fold(_, _.assoc(command, "type", "relocated-bridge")));

    case "found-district":
      const dist = district(board, contents, pilli);
      if (hasCapulli(contents, dist)){
        throw new Error("This district was already founded");
      }
      if (!isVacant(board, contents, details.at)) {
        throw new Error("Invalid capulli placement");
      }
      const points = founded(_.toArray(pillis), seat, dist);
      return _.chain(self, g.fold(_, {type: "founded-district", seat, details: {at: details.at, size: _.count(dist), points}}));

  }
}

function fold(self, event){
  const state = _.deref(self);
  const {period, spent, status} = state;
  const {type, details, seat} = event;
  const {pilli, bank} = _.nth(state.seated, seat) || {pilli: null, bank: null};
  const cost = price(event);
  const {redeemed} = spend(spent, bank, cost);

  switch (type) {
    case "started":
      return g.fold(self, event, _.identity);

    case "dealt-capulli":
      return g.fold(self, event,
        _.fmap(_,
          _.pipe(
            _.merge(_, details),
            _.assoc(_, "status", "placing-pilli"))));

    case "placed-pilli":
      return g.fold(self, event,
        _.fmap(_,
          _.pipe(
            _.assocIn(_, ["seated", seat, "pilli"], details.at),
            _.update(_, "contents", place(p, details.at)))));

    case "committed":
      return g.fold(self, event,
        _.pipe(
          _.fmap(_, committed),
          _.flush));

    case "passed":
      return g.fold(self, event,
        _.fmap(_,
          _.pipe(
            _.update(_, "spent", _.inc))));

    case "banked":
      return g.fold(self, event,
        _.fmap(_,
          _.pipe(
            redeem(seat, redeemed),
            _.update(_, "spent", _.inc),
            _.update(_, "banked", _.inc),
            _.update(_, "tokens", _.dec),
            _.updateIn(_, ["seated", seat, "bank"], _.inc))));

    case "constructed-canal":
      const size = _.count(details.at);
      return g.fold(self, event,
        _.fmap(_,
          _.pipe(
            redeem(seat, redeemed),
            _.update(_, "spent", _.inc),
            _.update(_, `canal${size}`, consume(details.at)),
            _.update(_, "contents", function(contents){
              return _.reduce(function(memo, at){
                return place(w, at)(memo);
              }, contents, details.at);
            }))));

    case "constructed-bridge":
      return g.fold(self, event,
        _.fmap(_,
          _.pipe(
            redeem(seat, redeemed),
            _.update(_, "spent", _.inc),
            _.update(_, "bridges", consume(details.at)),
            _.update(_, "contents", place(b, details.at)))));

    case "relocated-bridge":
      return g.fold(self, event,
        _.fmap(_,
          _.pipe(
            redeem(seat, redeemed),
            _.update(_, "spent", _.inc),
            _.update(_, "bridges", _.pipe(remit(details.from), consume(details.to))),
            _.update(_, "contents", _.pipe(displace(b, details.from), place(b, details.to))))));

    case "built-temple":
      return g.fold(self, event,
        _.fmap(_,
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
            markScoringRound)));

    case "moved":
      return g.fold(self, event,
        _.fmap(_,
          _.pipe(
            redeem(seat, redeemed),
            _.update(_, "spent", _.add(_, cost)),
            _.assocIn(_, ["seated", seat, "pilli"], details.to),
            _.update(_, "contents", _.pipe(displace(p, pilli), place(p, details.to))))));

    case "scored-grandeur":
      return g.fold(self, event,
        _.fmap(_,
          _.update(_, ["seated"], _.pipe(_.mapIndexed(function(seat, seated){
            const {districts, palace} = event.details;
            const points = _.sum(_.cons(_.nth(palace, seat), _.map(function({at, points}){
              return _.nth(points, seat);
            }, districts)));
            return _.update(seated, "points", _.add(_, points));
          }, _), _.toArray))));

    case "concluded-period":
      return g.fold(self, event,
        _.fmap(_,
          _.pipe(
            _.update(_, "period", _.inc),
            _.assoc(_, "scoring-round", false))));

    case "founded-district":
      return g.fold(self, event,
        _.fmap(_,
          _.updateIn(_, ["capulli", period], function(capulli){
            const idx = _.first(_.keepIndexed(function(idx, {at, size}){
              return at == null && size === details.size ? idx : null;
            }, capulli));
            return _.update(capulli, idx, _.assoc(_, "at", details.at));
          }),
          _.update(_, ["seated"], _.pipe(_.mapIndexed(function(seat, seated){
            const points = _.nth(details.points, seat);
            return _.update(seated, "points", _.add(_, points));
          }, _), _.toArray)),
          _.update(_, "contents", place(c, details.at)),
          markScoringRound));

    case "finished":
      return g.fold(self, event, _.fmap(_, _.pipe(_.dissoc(_, "up"), _.assoc(_, "status", "finished"))));

    default:
      return g.fold(self, event, _.fmap(_, _.merge(_, details))); //plain events

  }
}

function append(self, event){
  return new Mexica(self.seats,
    self.config,
    _.append(self.events, event),
    self.journal);
}

function fmap(self, f){
  return new Mexica(self.seats,
    self.config,
    self.events,
    f(self.journal));
}

function up(self){
  const {up} = _.deref(self);
  return [up];
}

const may = up;

function sift(pred, xs){ //TODO promote
  const sifted = _.groupBy(pred, xs);
  return [sifted["true"] || null, sifted["false"] || null];
}

export function foundable(board, contents, markers, pilli){
  const dist = district(board, contents, pilli);
  const size = _.count(dist);
  const [founded, unfounded] = sift(function({at}){
    return !!at;
  }, markers);
  const fixed = _.detect(function(at){
    return _.detect(function(c){
      return c.at === at;
    }, founded);
  }, dist);
  const avail = size < 14 && _.detect(function(marker){
    return marker.size === size;
  }, unfounded);
  return _.seq(_.map(function(at){
    return {size, at};
  }, avail && !fixed ? _.filter(isVacant(board, contents, _), dist) : null));
}

function canalable(board, contents){
  return _.filter(isVacant(board, contents, _), cat(_.remove(function(dist){
    return _.detect(function(at){
      return _.includes(_.get(contents, at), c); //capulli?
    }, dist)
  }, districts(board, contents))));
}

function moves(self){
  const [seat] = g.up(self);
  const {board, contents, capulli, canal1, canal2, bridges, period, status, spent, banked, seated} = _.deref(self);
  const {pilli, bank} = _.nth(seated, seat);
  const unspent = remaining(spent, bank);

  if (pilli) {
    const from = pilli;
    const markers = _.nth(capulli, period);
    const found = _.mapa(function(details){
      return {type: "found-district", seat, details};
    }, foundable(board, contents, markers, pilli));
    const banking = banked < 2 && spent < 6 ? [{type: "bank", seat}] : [];
    const water = waterways(board, contents, _.compact(bridges));
    const foot = unspent > 0 ? _.chain(around(pilli), _.filter(_.and(_.notEq(_, CENTER), _.or(dry(board, contents, _), hasBridge(contents, _)), unoccupied(contents, _)), _), _.mapa(function(to){
      return {type: "move", details: {by: "foot", from, to}, seat};
    }, _)) : [];
    const teleport = unspent > 4 ? [{type: "move", details: {by: "teleport", from, cost: 5}, seat}] : [];
    const boat = hasBridge(contents, pilli) ? boats(water, pilli, _.min(unspent, 5), seat) : [];
    const constructBridge = [{type: bridgesDepleted(bridges) ? "relocate-bridge": "construct-bridge", seat}];
    const constructCanal = canalsDepleted(canal1, canal2) ? [] : [{type: "construct-canal", seat}];
    const pass = spent < 6 ? [{type: "pass", seat}] : [];
    const commit = spent > 5 ? [{type: "commit", seat}] : [];
    return _.concat(commit, pass, banking, constructCanal, constructBridge, foot, boat, teleport, found);
  } else {
    const taken = _.chain(seated, _.map(_.get(_, "pilli"), _), _.compact, _.toArray);
    return _.chain(palaceSpots, _.remove(_.includes(taken, _), _), _.map(function(at){
      return {type: "place-pilli", details: {at}, seat}; //TODO compel 4th player to last position
    }, _));
  }
}

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

function irreversible(self, command){
  return _.includes(["committed", "finished"], command.type);
}

_.doto(Mexica,
  g.behave,
  _.implement(_.IAppendable, {append}),
  _.implement(_.IFunctor, {fmap}),
  _.implement(g.IGame, {perspective, up, may, moves, irreversible, metrics, comparator, textualizer, execute, fold}));

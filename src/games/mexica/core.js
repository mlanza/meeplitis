import _ from "/lib/atomic_/core.js";
import g from "/lib/game_.js";

const IGame = g.IGame;

const w = 0, //water
      l = 1, //land
      e = 2, //emperor's palace
      b = 3, //bridge
      c = 4, //capulli
      t = 5, //temple
      p = 9; //pilli

const board = [
       /*A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W*/
  /*1*/ [w,w,w,w,w,w,w,w,w,w,w,w,w,w,w,w,w,w,w,w,w,w,w],
  /*2*/ [w,w,l,w,w,w,l,l,l,l,l,w,w,w,w,w,w,w,w,w,w,w,w],
  /*3*/ [w,w,l,l,l,l,l,l,l,l,l,l,l,w,w,w,w,w,w,w,w,w,w],
  /*4*/ [w,l,l,l,l,l,l,l,l,l,l,l,l,w,w,w,w,w,w,w,w,w,w],
  /*5*/ [w,l,l,l,l,l,l,l,l,l,l,l,l,l,l,w,w,w,w,w,w,w,w],
  /*6*/ [w,w,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,w,w,w,w,w,w],
  /*7*/ [w,w,l,l,l,l,l,l,e,l,l,l,l,l,l,w,l,l,l,w,l,l,w],
  /*8*/ [w,w,l,l,l,l,l,e,e,e,l,l,l,l,l,w,l,l,l,l,l,l,w],
  /*9*/ [w,w,l,l,l,l,l,l,e,l,l,l,l,l,l,w,l,l,l,l,l,l,w],
 /*10*/ [w,w,w,l,l,l,l,l,l,l,l,l,l,l,l,w,l,l,l,l,l,w,w],
 /*11*/ [w,w,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,w,w,w,w,w],
 /*12*/ [w,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,w,w,w,w,w,w,w],
 /*13*/ [w,l,l,l,l,l,l,l,l,l,l,l,l,l,w,w,w,w,w,w,w,w,w],
 /*14*/ [w,l,l,l,l,l,l,l,l,l,l,l,w,w,w,w,w,w,w,w,w,w,w],
 /*15*/ [w,w,w,l,l,l,l,w,w,l,l,w,w,w,w,w,w,w,w,w,w,w,w],
 /*16*/ [w,w,w,w,w,w,w,w,w,w,w,w,w,w,w,w,w,w,w,w,w,w,w]
]

const capulli = [
  {rank: 13, at: null},
  {rank: 12, at: null},
  {rank: 11, at: null},
  {rank: 10, at: null},
  {rank: 9, at: null},
  {rank: 8, at: null},
  {rank: 7, at: null},
  {rank: 6, at: null},
  {rank: 6, at: null},
  {rank: 5, at: null},
  {rank: 5, at: null},
  {rank: 4, at: null},
  {rank: 4, at: null},
  {rank: 3, at: null},
  {rank: 3, at: null}
];

const bits = {
  canal1: Array(6),
  canal2: Array(37),
  bridges: Array(11),
  tokens: 12
}

const temples = [
  {1: Array(3), 2: Array(3), 3: Array(2), 4: Array(1)},
  {1: Array(3), 2: Array(2), 3: Array(2), 4: Array(2)}
];

const coords = _.braid(function(y, x){
  return [x, y];
}, _.range(1, 16), _.map(function(i){
  return String.fromCharCode(i);
}, _.range(65, 65 + 23)));

export const spots = _.map(_.spread(_.str), coords);

function init(seats){
  return Object.assign({
    phase: null,
    board,
    period: 0,
    up: 0,
    spent: 0,
    banked: 0
  }, {
    capulli: null,
    contents: {},
    seated: _.toArray(_.repeat(seats, {
      pilli: null,
      temples,
      bank: 0,
      points: 0
    }))
  }, bits);
}

function Mexica(seats, config, events, journal){
  this.seats = seats;
  this.config = config;
  this.events = events;
  this.journal = journal;
}

export default function mexica(seats, config, events, journal){
  if (!_.count(seats)) {
    throw new Error("Cannot play a game with no one seated at the table");
  }
  return new Mexica(_.toArray(seats), config, events || [], journal || _.chain(seats, _.count, init, _.journal));
}

const cat = _.mapcat(_.identity, _);

function placements({canal1, canal2, bridges, capulli, seated}){
  return _.concat(
    _.chain(canal1, _.compact, _.map(_.array(_, w), _)),
    _.chain(canal2, cat, _.compact, _.map(_.array(_, w), _)),
    _.chain(bridges, _.compact, _.map(_.array(_, b), _)),
    _.chain(capulli, cat, _.map(_.get(_, "at"), _), _.compact, _.map(_.array(_, c), _)),
    _.chain(seated, _.map(_.get(_, "pilli"), _), _.compact, _.map(_.array(_, p), _)),
    _.chain(seated, _.map(_.get(_, "temples"), _), cat, _.mapa(_.vals, _), cat, cat, _.compact, _.map(_.array(_, t), _)));
}

function contents(state){
  return _.chain(state, placements, _.toArray, _.fold(function(memo, [at, what]){
    memo[at] = _.conj(memo[at] || [], what);
    return memo;
  }, {}, _));
}

function coord(at){
  const column = at.charCodeAt(0) - 65,
        row = _.chain(at, _.split(_, ''), _.rest, _.join('', _), parseInt, _.dec);
  return [row, column];
}

function spot([row, column]){
  const c = String.fromCharCode(column + 65),
        r = row + 1;
  return c + r;
}

function left(at){
  const [row, column] = coord(at);
  return spot([row, column - 1]);
}

function right(at){
  const [row, column] = coord(at);
  return spot([row, column + 1]);
}

function above(at){
  const [row, column] = coord(at);
  return spot([row - 1, column]);
}

function below(at){
  const [row, column] = coord(at);
  return spot([row + 1, column]);
}

const drawn = _.pipe(coord, _.getIn(board, _));

const palaceSpots = ['I7', 'H8', 'J8', 'I9']; /* _.chain(spots, _.filter(function(at){
  return _.getIn(board, coord(at)) === e;
}, _), _.splice(_, 2, 1, []), _.toArray); */

function pass(state){
  const seats = _.count(state.seated);
  return _.chain(state,
    _.update(_, "up", function(up){
      return _.chain(seats, _.range, _.cycle, _.dropWhile(_.notEq(_, up), _), _.second);
    }),
    _.assoc(_, "spent", 0),
    _.assoc(_, "banked", 0));
}

function reflectContents(state){
  return _.assoc(state, "contents", _.chain(state, contents));
}

const place = _.partly(function place(state, at, what){
  return _.updateIn(state, ["contents", at], _.pipe(_.either(_, []), _.conj(_, what)));
});

const relocate = _.partly(function relocate(state, at, what){
  return _.updateIn(state, ["contents", at], _.pipe(_.either(_, []), _.filtera(_.notEq(what, _), _)));
});

function dealCapulli(){
  const xs = _.chain(_.range(15), _.shuffle, _.take(8, _), _.sort);
  const _capulli = _.chain(capulli,
    _.mapkv(function(k, v){
      return [k, v];
    }, _),
    _.groupBy(function([k, v]){
      return _.includes(xs, k);
    }, _),
    _.reducekv(function(memo, k, v){
      return _.assoc(memo, k === "true" ? 0 : 1, _.mapa(_.second, v));
    }, Array(2), _),
    _.toArray);
  return {type: "dealt-capulli", details: {capulli: _capulli}, seat: null};
}

function isVacant(board, contents, at){
  const what = _.getIn(board, coord(at)),
        cts  = _.get(contents, at);
  return what === l && !cts;
}

function dry(board, contents, at){
  const cts = _.get(contents, at);
  const what = _.getIn(board, coord(at));
  return what === l && !_.includes(cts, w);
}

function wet(board, contents, at){
  const cts = _.get(contents, at);
  const what = _.getIn(board, coord(at));
  return what === w || _.includes(cts, w);
}

function orientBridge(board, contents, at){
  return dry(board, contents, above(at)) && dry(board, contents, below(at)) ? "vertical" :
         dry(board, contents, left(at))  && dry(board, contents, right(at)) ? "horizontal" : null;
}

function hasFreeBridge(contents, at){
  const cts = _.get(contents, at);
  return _.includes(cts, b) && !_.includes(cts, p);
}

function isBridgable(board, contents, at){
  const what = _.getIn(board, coord(at)),
        cts  = _.get(contents, at);
  return _.eq([w], cts) ? orientBridge(board, at) : null;
}

export function execute(self, command, s){
  const state = _.deref(self);
  const seat = s == null ? command.seat : s;
  const valid = true;//_.detect(_.eq(_, _.chain(command, _.compact, _.dissoc(_, "id"))), g.moves(self, [seat]));
  const {type, details} = command;
  const automatic = _.includes(["start", "deal-capulli"], type);
  const seated = seat == null ? {pilli: null, bank: 0} : state.seated[seat];
  const {spent, board, contents, period, banked, tokens} = state;
  const {bank} = seated;
  const unspent = (6 + bank) - spent;

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
      return _.chain(self,
        g.fold(_, command),
        g.fold(_, {type: "constructed-canal", details: {size: 2, at: ["P7", "P8"]}}),
        g.fold(_, {type: "constructed-canal", details: {size: 2, at: ["P9", "P10"]}}),
        g.execute(_, {type: "deal-capulli"}));

    case "deal-capulli":
      return _.chain(self, g.fold(_, dealCapulli()));

    case "place-pilli":
      const validPlacement = _.detect(_.eq(_, _.chain(command, _.compact, _.dissoc(_, "id"))), g.moves(self, [seat]));
      if (!validPlacement) {
        throw new Error("Invalid placement of Pilli Mexica");
      }
      return _.chain(self, g.fold(_, _.assoc(command, "type", "placed-pilli")));

    case "bank":
      if (banked > 1) {
        throw new Error("Cannot take any further action point tokens");
      }
      if (tokens < 1) {
        throw new Error("No action point tokens are available.");
      }
      return _.chain(self, g.fold(_, {type: "banked", seat}));

    case "move":
      return self; //TODO `{type: "move", by: "foot"/"boat"/"teleportation", to: "A4", cost: 1}`

    case "construct-canal":
      for(const canalAt of details.at){
        if (!isVacant(board, contents, canalAt)) {
          throw new Error("Invalid canal placement");
        }
      }
      if (unspent < 1) {
        throw new Error("Not enough action points to construct a canal");
      }
      return _.chain(self, g.fold(_, _.assoc(command, "type", "constructed-canal")));

    case "build-temple":
      if (!isVacant(board, contents, details.at)) {
        throw new Error("Invalid temple placement");
      }
      if (!_.chain(state, _.getIn(_, ["seated", seat, "temples", period, details.level]), _.filter(_.isNil, _), _.count)){
        throw new Error(`No level ${details.level} temples available`);
      }
      if (unspent < details.level) {
        throw new Error(`Not enough action points to construct level ${details.level} temples`);
      }
      return _.chain(self, g.fold(_, _.assoc(command, "type", "built-temple")));

    case "construct-bridge":
      if (!isBridgable(board, contents, details.at)) {
        throw new Error("Invalid bridge placement");
      }
      if (unspent < 1) {
        throw new Error("Not enough action points to construct bridges");
      }
      return _.chain(self, g.fold(_, _.assoc(command, "type", "constructed-bridge")));

    case "relocate-bridge":
      if (!isBridgable(board, contents, details.to)) {
        throw new Error("Invalid bridge placement");
      }
      if (!hasFreeBridge(contents, details.from)){
        throw new Error("Can only relocate free bridges");
      }
      if (unspent < 1) {
        throw new Error("Not enough action points to relocate bridges");
      }
      return _.chain(self, g.fold(_, _.assoc(command, "type", "relocated-bridge")));

    case "found-district":
      return self; //TODO `{type: "found-district", size: 12, at: "A2", points: [6, 0, 0, 3]}`

    case "score-period":
      return self; //TODO `{type: "score-period", period: 1, districts: [{at: "A2", size: 12, points: [12, 0, 0, 3]}]}`

    case "commit":
      return self; //TODO

    case "finish":
      return self; //TODO
  }
}

function fold2(self, event){
  const state = _.deref(self);
  const {period} = state;
  const {type, details, seat} = event;
  switch (type) {
    case "dealt-capulli":
      return g.fold(self, event,
        _.fmap(_,
          _.pipe(
            _.merge(_, details),
            _.assoc(_, "phase", "placing-pilli"))));

    case "placed-pilli":
      return g.fold(self, event, _.fmap(_, function(state){
        return _.chain(state, _.assocIn(_, ["seated", seat, "pilli"], details.at), pass, place(_, details.at, p));
      }));

    case "banked":
      return g.fold(self, event, _.fmap(_, function(state){
        return _.chain(state,
          _.update(_, "spent", _.inc),
          _.update(_, "banked", _.inc),
          _.update(_, "tokens", _.dec),
          _.updateIn(_, ["seated", seat, "bank"], _.inc));
      }));

    case "constructed-canal":
      return g.fold(self, event, _.fmap(_,
        _.pipe(
          _.update(_, "spent", _.inc),
          _.update(_, `canal${details.size}`, function(ats){
            const len = _.count(ats);
            return _.chain(ats, _.concat(details.at, _), _.take(len, _), _.toArray);
          }),
          _.reduce(place(_, _, w), _, details.at))));

    case "constructed-bridge":
      return g.fold(self, event, _.fmap(_,
        _.pipe(
          _.update(_, "spent", _.inc),
          _.update(_, "bridges", function(ats){
            const len = _.count(ats);
            return _.chain(ats, _.cons(details.at, _), _.take(len, _), _.toArray);
          }),
          place(_, details.at, b))));

    case "relocated-bridge":
      return g.fold(self, event, _.fmap(_,
        _.pipe(
          _.update(_, "spent", _.inc),
          remove(_, details.from, b),
          place(_, details.to, b))));

    case "built-temple":
      return g.fold(self, event, _.fmap(_,
        _.pipe(
          _.update(_, "spent", _.add(_, details.level)),
          _.updateIn(_, ["seated", seat, "temples", period, details.level], function(ats){
            const len = _.count(ats);
            return _.chain(ats, _.cons(details.at, _), _.take(len, _), _.toArray);
          }),
          place(_, details.at, t))));

    default:
      return g.fold(self, event, _.fmap(_, _.merge(_, details))); //vanilla commands

  }
}

function fold3(self, event, f){
  return mexica(self.seats,
    self.config,
    event ? _.append(self.events, event) : self.events,
    _.chain(self.journal,
      f,
      g.incidental(event) ? g.crunch : _.identity, //improve undo/redo from user perspective
      g.irreversible(self, event) ? _.flush : _.identity));
}

const fold = _.overload(null, null, fold2, fold3);

function up(self){  //TODO
  const {up} = _.deref(self);
  return [up];
}

function moves(self){ //TODO
  const [seat] = g.up(self);
  const {contents, phase, seated} = _.deref(self);
  if (phase === "placing-pilli") {
    const occupied = _.chain(seated, _.map(_.get(_, "pilli"), _), _.compact, _.toArray);
    return _.chain(palaceSpots, _.remove(_.includes(occupied, _), _), _.map(function(at){
      return {type: "place-pilli", details: {at}, seat};
    }, _));
  }
  return [];
}

function metrics(self){
  const state = _.deref(self);
  return _.mapa(function({scored}){
    const points = _.sum(_.map(_.get(_, "points"), scored));
    return {points};
  }, state.seated);
}

function perspective(self, _seen){ //TODO
  const seen = _.chain(_seen, _.filtera(_.isSome, _));
  const up = g.up(self);
  const may = g.may(self);
  const seated = g.seated(self);
  const metrics = g.metrics(self);
  const all = _.eq(seen, g.everyone(self)); //TODO unused
  const state = _.chain(self, _.deref);
  const moves = _.chain(self, g.moves(_, seen), _.toArray);
  const events = g.events(self);
  return {seen, seated, up, may, state, moves, events, metrics};
}

function irreversible(self, command){
  return _.includes(["commit", "finish"], command.type);
}

_.doto(Mexica,
  g.behave,
  _.implement(IGame, {perspective, up, may: up, moves, irreversible, metrics, /*comparator, textualizer,*/ execute, fold}));


Object.assign(window, {spots, coords})

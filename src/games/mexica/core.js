import _ from "/lib/atomic_/core.js";
import g from "/lib/game_.js";

const IGame = g.IGame;

const w = 0, //water
      l = 1, //land
      p = 2; //palace

const board = [
  /*1*/ [w,w,w,w,w,w,w,w,w,w,w,w,w,w,w,w,w,w,w,w,w,w,w],
  /*2*/ [w,w,l,w,w,w,l,l,l,l,l,w,w,w,w,w,w,w,w,w,w,w,w],
  /*3*/ [w,w,l,l,l,l,l,l,l,l,l,l,l,w,w,w,w,w,w,w,w,w,w],
  /*4*/ [w,l,l,l,l,l,l,l,l,l,l,l,l,w,w,w,w,w,w,w,w,w,w],
  /*5*/ [w,l,l,l,l,l,l,l,l,l,l,l,l,l,l,w,w,w,w,w,w,w,w],
  /*6*/ [w,w,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,w,w,w,w,w,w],
  /*7*/ [w,w,l,l,l,l,l,l,p,l,l,l,l,l,l,w,l,l,l,w,l,l,w],
  /*8*/ [w,w,l,l,l,l,l,p,p,p,l,l,l,l,l,w,l,l,l,l,l,l,w],
  /*9*/ [w,w,l,l,l,l,l,l,p,l,l,l,l,l,l,w,l,l,l,l,l,l,w],
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
  bridges: Array(11)
}

const temples = [
  {1: Array(3), 2: Array(3), 3: Array(2), 4: Array(1)},
  {1: Array(3), 2: Array(2), 3: Array(2), 4: Array(2)}
];

function init(seats){
  return Object.assign({
    board,
    period: 0,
    up: 0
  }, {
    capulli: null,
    seated: _.toArray(_.repeat(seats, {
      pilli: null,
      temples,
      bank: 0,
      score: 0
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

function setup(self){
  const partitioned = _.chain(capulli, _.mapkv(function(k, v){
    return [k, v];
  }, _), _.groupBy(function([k, v]){
    return _.includes(xs, k);
  }, _), _.reducekv(function(memo, k, v){
    return _.assoc(memo, k === "true" ? 0 : 1, _.mapa(_.second, v));
  }, [], _), _.toArray);



}

export function execute(self, command, s){
  const state = _.deref(self);
  const seat = s == null ? command.seat : s;
  //const valid = _.detect(_.eq(_, _.chain(command, _.compact, _.dissoc(_, "id"))), g.moves(self, [seat]));
  const {type, details} = command;
  const automatic = _.includes(["start"], type);

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
      return _.chain(self, g.fold(_, _.assoc(command, "details", {capulli: _capulli})));
  }
}

function fold2(self, event){
  const state = _.deref(self);
  const {type, details, seat} = event;
  switch (type) {
    case "start":
      return (function(){
        return g.fold(self, event, _.fmap(_, _.merge(_, details)));
      })();
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
  const state = _.deref(self);
  return [0];
}

function may(self){ //TODO
  return _.unique(_.map(function({seat}){
    return seat;
  }, g.moves(self, g.seated(self))));
}

function moves(self){ //TODO
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
  const all = _.eq(seen, g.everyone(self));
  const state = _.chain(self, _.deref);
  const moves = _.chain(self, g.moves(_, seen), _.toArray);
  const events = self.events;
  return {seen, seated, up, may, state, moves, events, metrics};
}

function irreversible(self, command){
  return _.includes(["commit", "finish"], command.type);
}

function events(self){
  return self.events;
}

function seats(self){
  return self.seats;
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

_.doto(Mexica,
  _.implement(_.IDeref, {deref}),
  _.implement(_.IResettable, {resettable}),
  _.implement(_.IRevertible, {undoable, redoable, flushable}),
  _.implement(IGame, {perspective, up, may, seats, moves, events, irreversible, metrics, /*comparator, textualizer,*/ execute, fold}));


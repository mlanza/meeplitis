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
  const xs = _.chain(_.range(15), _.shuffle, _.take(8, _), _.sort);
  const partitioned = _.chain(capulli, _.mapkv(function(k, v){
    return [k, v];
  }, _), _.groupBy(function([k, v]){
    return _.includes(xs, k);
  }, _), _.reducekv(function(memo, k, v){
    return _.assoc(memo, k === "true" ? 0 : 1, _.mapa(_.second, v));
  }, [], _), _.toArray);
  return Object.assign({
    board,
    period: 0,
    up: 0
  }, {
    capulli: partitioned,
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

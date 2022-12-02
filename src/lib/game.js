import _ from "./atomic_/core.js";
import $ from "./atomic_/reactives.js";

export const IGame = _.protocol({
  perspective: null,
  up: null, //returns the seat(s) which are required to move
  may: null, //returns the seat(s) which have the option to move
  seats: null,
  events: null,
  moves: null, //what commands can seats/players do?
  irreversible: null, //can the command be reversed by a player?
  execute: null, //validates a command and transforms it into one or more events, potentially executing other commands
  fold: null, //folds an event into the aggregate state
  metric: null, //provides facts for assessing performance/score
  comparator: null,
  score: null //maintains current interim and/or final scoring and rankings as possible
});

export const irreversible = IGame.irreversible;
export const up = IGame.up;
export const may = IGame.may;
export const seats = IGame.seats;
export const fold = IGame.fold;
export const events = IGame.events;
export const metric = IGame.metric;
export const comparator = IGame.comparator;
export const score = IGame.score; //permissible to return null when calculating makes no sense
export const perspective = _.chain(IGame.perspective,
  _.post(_,
    _.and(
      _.contains(_, "seen"),
      _.contains(_, "seated"),
      _.contains(_, "state"),
      _.contains(_, "events"),
      _.contains(_, "moves"),
      _.contains(_, "score"),
      _.contains(_, "up"))));

export function seated(self){
  return _.chain(self, numSeats, _.range, _.toArray);
}

export function numSeats(self){
  return _.chain(self, seats, _.count);
}

export function incidental({seat}){
  return seat == null;
}

export function crunch(self){
  const history = _.clone(self.history); //TODO fix `splice`
  history.splice(_.count(history) - 1, 1);
  return new _.Journal(self.pos, self.max, history, self.state);
}

export function reversibility(self){
  const state = _.deref(self);
  const seat = state.up;
  const undoable = _.undoable(self),
        redoable = _.redoable(self),
        flushable = _.flushable(self),
        resettable = _.resettable(self);
  return _.compact([
    resettable ? {type: "reset", seat} : null,
    undoable ? {type: "undo", seat} : null,
    redoable ? {type: "redo", seat} : null,
    flushable && !redoable ? {type: "commit", seat} : null
  ]);
}

export function places(self){
  const xs = metric(self);
  const ys = _.sort(comparator(self), xs);
  const outcomes = _.reduce(function(memo, y){
    const z = _.last(memo);
    return _.eq(y, z) ? memo : _.conj(memo, y);
  }, [_.first(ys)], _.rest(ys));
  return _.mapa(function(x){
    const y = _.detect(_.eq(x, _), outcomes);
    return _.indexOf(outcomes, y) + 1;
  }, xs);
}

function execute3(self, command, s){
  const {type} = command;
  const event = Object.assign({seat: s ?? null}, command);
  const {seat} = event;
  if (seat == null) {
  } else if (!_.isInt(seat)) {
    throw new Error("Seat must be an integer");
  } else if (!_.includes(everyone(self), seat)) {
    throw new Error("Invalid seat");
  }
  switch(type){
    case "start":
    case "finish":
      if (_.detect(_.pipe(_.get(_, "type"), _.eq(_, type)), events(self))) {
        throw new Error(`Cannot ${type} more than once!`);
      }
      break;

    case "undo":
      if (!_.undoable(self)){
        throw new Error("Undo not possible.");
      }
      break;

    case "redo":
      if (!_.redoable(self)){
        throw new Error("Redo not possible.");
      }
      break;

    case "commit":
      if (!_.flushable(self)){
        throw new Error("Commit not possible.");
      }
      break;

    case "~": //pluck next command, for development purposes
      return _.maybe(self,
        up,
        _.first,
        _.array,
        x => moves(self, x),
        _.last,
        x => execute(self, x, seat)) || self;
  }
  return IGame.execute(self, event, seat);
}

export const execute = _.overload(null, null, execute3, execute3);

export function finish(self){
  return execute(self, {type: "finish"});
}

export function load(self, events){
  return _.reduce(fold, self, events);
}

export function run(self, commands, seat){
  return _.reduce((x, y) => execute(x, y, seat), self, commands);
}

export function whatif(self, commands, seat){
  const prior = self;
  const curr = _.reduce((x, y) => execute(x, y, seat), prior, commands);
  return {
    added: added(curr, prior),
    up: up(curr),
    notify: notify(curr, prior)
  };
}

export function batch($state, f, xs){
  _.each(function(x){
    _.swap($state, f(_, [x]));
  }, xs);
}

export function transact($state, f, xs){
  _.swap($state, f(_, xs));
}

export function added(curr, prior){
  return prior ? _.chain(events(curr), _.last(_.count(events(curr)) - _.count(events(prior)), _), _.toArray) : [];
}

function moves2(self, seats){
  return _.chain(self, IGame.moves, _.filter(_.pipe(_.get(_, "seat"), _.includes(seats, _)), _));
}

export const moves = _.overload(null, IGame.moves, moves2);

export function perspectives(self){
  return _.chain(self,
    seated,
    _.mapa(_.pipe(_.array, _.partial(perspective, self)), _));
}

export function notify(curr, prior){
  return _.difference(_.chain(curr, up), _.maybe(prior, up) || []);
}

export function everyone(self){
  return _.toArray(_.mapIndexed(_.identity, seated(self)));
}

export function summarize([curr, prior]){ //use $.hist
  return {
    up: up(curr),
    may: may(curr),
    notify: notify(curr, prior),
    added: added(curr, prior),
    perspectives: perspectives(curr),
    reality: _.compact(perspective(curr, everyone(curr))),
    game: curr
  };
}

function singular(xs){
  const n = _.count(xs);
  if (n !== 1) {
    throw new Error("Singular value expected");
  }
  return _.first(xs);
}

export function simulate(self, events, commands, seen){
  return _.chain(self, x => load(x, events), _.seq(commands) ? x => whatif(x, commands, singular(seen)) : x => perspective(x, seen));
}

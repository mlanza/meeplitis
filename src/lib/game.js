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
  metrics: null, //provides facts for assessing performance/score
  comparator: null,
  textualizer: null
});

export const irreversible = IGame.irreversible;
export const up = IGame.up;
export const may = IGame.may;
export const seats = IGame.seats;
export const events = IGame.events;
export const metrics = IGame.metrics;
export const comparator = IGame.comparator;
export const textualizer = IGame.textualizer;

function perspective2(self, seen){
  return perspective3(self, seen, reality(self));
}

function perspective3(self, seen, reality){
  return _.chain(IGame.perspective(self, seen, reality),
    _.assoc(_, "seen", seen),
    _.update(_, "moves", movesAt(seen)));
}

export const perspective = _.overload(null, null, perspective2, perspective3);

function fold3(self, event, f){
  return _.chain(self,
    _.append(_, event),
    _.fmap(_,
      _.pipe(f,
        incidental(event) ? _.crunch : _.identity, //improve undo/redo from user perspective
        irreversible(self, event) ? _.flush : _.identity)));
}

export const fold = _.overload(null, IGame.fold, IGame.fold, fold3);

export function seated(self){
  return _.chain(self, numSeats, _.range, _.toArray);
}

export function numSeats(self){
  return _.chain(self, seats, _.count);
}

export function incidental({seat}){
  return seat == null;
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

function places(self){
  const xs = metrics(self);
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

function briefs(self){
  return _.mapa(textualizer(self), metrics(self));
}

function execute3(self, command, s){
  const {type} = command;
  const seat = s == null ? null : s;
  const event = Object.assign({seat}, command);
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
  return execute(self, {type: "finish", details: {
      metrics: metrics(self),
      briefs: briefs(self),
      places: places(self)
    }
  });
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

function movesAt(seats){
  return _.filtera(_.pipe(_.get(_, "seat"), _.includes(seats, _)), _); //TODO `filter` for `filtera`
}

function moves2(self, seats){
  return _.chain(self, IGame.moves, movesAt(seats));
}

export const moves = _.overload(null, IGame.moves, moves2);

export function perspectives(self, reality){
  return _.chain(self,
    seated,
    _.mapa(_.pipe(_.array, function(seen){
      return perspective(self, seen, reality);
    }), _));
}

export function notify(curr, prior){
  return _.difference(_.chain(curr, up), _.maybe(prior, up) || []);
}

export function everyone(self){
  return _.toArray(_.mapIndexed(_.identity, seated(self)));
}

export function reality(self){
  const seen = seated(self);
  return {
    seen,
    seated: seen,
    state: _.deref(self),
    up: up(self),
    may: may(self),
    moves: moves(self),
    events: events(self),
    metrics: metrics(self)};
}

export function summarize([curr, prior]){ //uses $.hist
  const _reality = _.chain(curr, reality, _.update(_, "moves", _.toArray));
  return {
    notify: notify(curr, prior),
    added: added(curr, prior),
    perspectives: perspectives(curr, _reality),
    reality: _reality,
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

function _events(self){
  return self.events;
}

function _seats(self){
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

export const behave = _.does(
  _.implement(_.IDeref, {deref}),
  _.implement(_.IResettable, {resettable}),
  _.implement(_.IRevertible, {undoable, redoable, flushable}),
  _.implement(IGame, {seats: _seats, events: _events}));

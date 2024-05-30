import _ from "./atomic_/core.js";

export const IGame = _.protocol({
  perspective: null,
  status: null,
  up: null, //returns the seat(s) which are required to move
  may: null, //returns the seat(s) which have the option to move
  seats: null,
  events: null,
  moves: null, //what commands can seats/players do?
  undoable: null, //can event be rewound?
  execute: null, //validates a command and transforms it into one or more events, potentially executing other commands
  fold: null, //folds an event into the aggregate state
  metrics: null, //provides facts for assessing performance/score
  comparator: null,
  textualizer: null
});

export const undoable = IGame.undoable;
export const status = IGame.status;
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

function perspective3(self, _seen, reality){
  const seen = _.filtera(_.isSome, _seen); //remove the null of anonymous
  return {...(_.eq(seen, everyone(self)) ? reality : IGame.perspective(self, seen, reality)), seen};
}

export const perspective = _.overload(null, null, perspective2, perspective3);

function fold3(self, event, f){
  return _.chain(self,
    _.append(_, {...event, undoable: undoable(self, event)}),
    _.fmap(_, f));
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

function execute3(self, command, seat){
  return execute2(self, seat == null ? command : _.merge(command, {seat}));
}

function execute2(self, command){
  const {type, seat} = command;
  if (seat == null) {
  } else if (!_.isInt(seat)) {
    throw new Error("Seat must be an integer");
  } else if (!_.includes(everyone(self), seat)) {
    throw new Error("Invalid seat");
  }
  switch (_.first(status(self))) {
    case "pending":
      if (type != "start") {
        throw new Error(`Cannot issue '${type}' unless the game has started.`);
      }
      break;
    case "started":
      if (type == "start") {
        throw new Error(`Cannot restart the game.`);
      }
      break;
    case "finished":
      throw new Error(`Cannot issue commands once the game is finished.`);
      break;
  }
  return IGame.execute(self, command);
}

export const execute = _.overload(null, null, execute2, execute3);

export function finish(self){
  return execute(self, {type: "finish", details: {
      metrics: metrics(self),
      briefs: briefs(self),
      places: places(self)
    }
  });
}

export function added(curr, prior){
  return prior ? _.chain(events(curr), _.last(_.count(events(curr)) - _.count(events(prior)), _), _.toArray) : [];
}

export function moves(self, options = {}){
  const types = typeof options.type === 'string' ? [options.type] : options.type || IGame.moves(self),
        seats = typeof options.seat === 'number' ? [options.seat] : options.seat || everyone(self);
  return _.flatten(_.braid(_.partial(IGame.moves, self), types, seats));
}

export function notify(curr, prior){
  return _.difference(_.chain(curr, up), _.maybe(prior, up) || []);
}

export function everyone(self){
  return _.toArray(_.mapIndexed(_.identity, seated(self)));
}

export function reality(self){
  return {
    event: _.maybe(self, events, _.last),
    state: _.deref(self),
    up: up(self),
    may: may(self),
    metrics: metrics(self)};
}

function singular(xs){
  const n = _.count(xs);
  if (n !== 1) {
    throw new Error("Singular value expected");
  }
  return _.first(xs);
}

function splitAt(idx, xs){
  return [xs.slice(0, idx), xs.slice(idx)];
}

export function simulate(make){
  return function({seats, config = {}, loaded = [], events = [], commands = [], seen = [], snapshot = null}){
    if (!_.seq(seats)) {
      throw new Error("Cannot play a game with no one seated at the table");
    }
    const prior =
      _.chain(make(_.toArray(seats), config, loaded, snapshot),
        _.reduce(fold, _, events),
        _.seq(commands) ? _.compact : _.identity),
          curr  =
      _.reduce((self, command) => execute(self, command, singular(seen)), prior, commands);
    return [curr, prior, seen, commands];
  }
}

function andSnapshot(events, snapshot){
  const last = _.last(events),
        committed = _.detect(function({type}){
          return type === "committed";
        }, events) && _.every(function({undoable}){
          return undoable === false;
        }, events);
  return _.mapa(function(event){
    return Object.assign({}, event, {snapshot: committed && event === last ? snapshot() : null});
  }, events);
}

export function effects([curr, prior, seen, commands]){
  if (_.seq(commands)) {
    const added = andSnapshot(events(curr), _.partial(reality, curr));
    return {
      added,
      up: up(curr),
      notify: notify(curr, prior)
    }
  } else {
    return perspective(curr, seen);
  }
}

function _events(self){
  return self.events;
}

function _seats(self){
  return self.seats;
}

function deref(self){
  return self.state;
}

export const behave = _.does(
  _.implement(_.IDeref, {deref}),
  _.implement(IGame, {seats: _seats, events: _events}));

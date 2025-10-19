import _ from "./atomic_/core.js";

export const IGame = _.protocol({
  perspective: null,
  status: null,
  prompt: null, //returns the game state as a text-based scenario an agent can react to
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

export function prompt(self, seat, meta = {}){
  return IGame.prompt(self,
    _.chain(meta,
      _.assoc(_, "up", up(self)),
      _.assoc(_, "may", may(self)),
      _.assoc(_, "metrics", metrics(self)),
      _.assoc(_, "event", _.chain(self, events, _.last)),
      _.assoc(_, "state", _.deref(self)),
      _.assoc(_, "moves", _.chain(self, s => moves(s, {seat}), _.toArray))));
}

function delegates(self){
  return _.chain(self, seats, _.mapIndexed(function(idx, seated){
    return _.get(seated, "delegate_id") ? idx : null;
  }, _), _.filtera(_.isSome, _));
}

export function prompts(self, meta = {}){
  return _.maybe(
    _.intersection(delegates(self), up(self)),
    _.seq,
    _.mapa(function(seat){
      return {seat, prompt: prompt(self, seat, meta)}; //because `prompt` (moves) is expensive, call only when necessary
    }, _));
}

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

function state(snapshot){ //in case `perspective` (and not `state`) is received
  const {up, may, state} = snapshot;
  return up && may && state ? state : snapshot;
}

//TODO implement as protocol?
function precipitatedBy2(self, event){
  const fn = _.constructs(self.constructor);
  return fn(self.seats, self.config, [event], self.state);
}

const precipitatedBy1 = _.comp(_.last, IGame.events)

const precipitatedBy = _.overload(null, precipitatedBy1, precipitatedBy2);

//event - the event which precipitated the current moment
//loaded - events already factored into the snapshot
//snapshot - seed state
//events - events which must yet be replayed
//seen - seat(s) with pov
//seats - players and their config options
//config - game config options
//commands - issued to update game state
export function simulate(make){
  return function({event, seats, config = {}, loaded = [], events = [], commands = [], seen = [], snapshot = null}){
    if (!_.seq(seats)) {
      throw new Error("No one is seated at the table!");
    }
    const prior =
      _.chain(make(_.toArray(seats), config, loaded, _.maybe(snapshot, state)),
        _.reduce(fold, _, events),
        _.seq(commands) ? _.compact : _.plug(precipitatedBy, _, event)),
          curr  =
      _.reduce((self, command) => execute(self, command, singular(seen)), prior, commands);
    return [curr, prior, seen];
  }
}

export function effects([curr, prior, seen]){
  if (curr === prior) {
    return perspective(curr, seen);
  } else {
    return {
      added: added(curr),
      up: up(curr),
      notify: notify(curr, prior),
      prompts: prompts(curr)
    }
  }
}

export function handle(make, log = _.noop){
  function see(label){
    return function(value) {
      log(label, value);
      return value;
    };
  }

  const f = _.pipe(
    see("got"),
    simulate(make),
    see("simulate"),
    effects,
    see("effects"));

  return async function (req){
    const payload = await req.json(),
          result = f(payload);
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  };
}

function added(self){
  const events = IGame.events(self);
  const last = _.last(events),
        committed = _.detect(function({type}){
          return type === "committed";
        }, events) && _.every(function({undoable}){
          return undoable === false;
        }, events);
  return _.mapa(function(event){
    return Object.assign({}, event, {snapshot: committed && event === last ? reality(self) : null});
  }, events);
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

import _ from "./atomic_/core.js";

export const IGame = _.protocol({
  perspective: null,
  status: null,
  up: null, //returns the seat(s) which are required to move
  may: null, //returns the seat(s) which have the option to move
  seats: null,
  moves: null, //what commands can seats/players do?
  metrics: null, //provides facts for assessing performance/score
  comparator: null,
  textualizer: null
});

export const status = IGame.status;
export const up = IGame.up;
export const may = IGame.may;
export const seats = IGame.seats;
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

function act3(self, command, seat){
  return act2(self, seat == null ? command : _.merge(command, {seat}));
}

function act2(self, command){
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
  return _.act(self, command);
}

export const act = _.overload(null, null, act2, act3);

export function finish(self){
  return _.act(self, {type: "finish", details: {
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

export function everyone(self){
  return _.toArray(_.mapIndexed(_.identity, seated(self)));
}

export function reality(self){
  return {
    event: _.maybe(self, _.events, _.last),
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

const precipitatedBy1 = _.comp(_.last, _.events)

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
  return function({event, seats, config = {}, loaded = [], events = [], commands = [], seen = [], snapshot = null, included = null}){
    if (!_.seq(seats)) {
      throw new Error("No one is seated at the table!");
    }
    const prior =
      _.chain(make(_.toArray(seats), config, loaded, _.maybe(snapshot, state)),
        _.reduce(_.actuate, _, events),
        _.seq(commands) ? _.compact : _.plug(precipitatedBy, _, event)),
          curr  =
      _.reduce((self, command) => _.act(self, command, singular(seen)), prior, commands);
    return { reel: [curr, prior], seen, included };
  }
}

export function effects({ reel: [curr, prior], seen, included }){
  if (curr === prior) {
    return _.chain(perspective(curr, seen), including(included, curr, seen));
  } else {
    return _.chain(curr, _.juxto({added, up}));
  }
}

function including(included, curr, seen){
  const seat = _.first(seen);
  return function(memo){
    return _.reduce(function(memo, key){
      switch (key) {
        case "moves":
          return _.assoc(memo, key, _.toArray(moves(curr, {seat})));
        default:
          return memo;
      }
    }, memo, included);
  }
}

export function ingests(make, log = _.noop){
  function see(label){
    return function(value) {
      log(label, value);
      return value;
    };
  }

  return _.pipe(
    see("got"),
    simulate(make),
    see("simulate"),
    effects,
    see("effects"));
}

export function handle(make, log = _.noop){
  const f = ingests(make, log);
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
  const events = _.events(self);
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
  _.implement(_.IActor, {events: _events}),
  _.implement(IGame, {seats: _seats}));

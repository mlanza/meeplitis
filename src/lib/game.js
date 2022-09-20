import _ from "./@atomic/core.js";
import $ from "./@atomic/reactives.js";

export const IGame = _.protocol({
  perspective: null,
  up: null, //returns the seat(s) which are required to move
  seated: null,
  moves: null, //what commands can seats/players do?
  irreversible: null, //can the command be reversed by a player?
  execute: null, //validates a command and transforms it into one or more events, potentially executing other commands
  fold: null, //folds an event into the aggregate state
  score: null //maintains current interim and/or final scoring and rankings as possible
});

export const irreversible = IGame.irreversible;
export const up = IGame.up;
export const fold = _.partly(IGame.fold);
export const seated = IGame.seated;
export const score = IGame.score; //permissible to return null when calculating makes no sense
export const perspective = _.chain(IGame.perspective,
  _.post(_,
    _.and(
      _.contains(_, "seat"),
      _.contains(_, "seated"),
      _.contains(_, "state"),
      _.contains(_, "events"),
      _.contains(_, "moves"),
      _.contains(_, "score"),
      _.contains(_, "up"),
      _.contains(_, "you"))),
  _.partly);

export function incidental({seat}){
  return seat == null;
}

export function crunch(self){
  const history = _.clone(self.history); //TODO fix `splice`
  history.splice(_.count(history) - 1, 1);
  return new _.Journal(self.pos, self.max, history, self.state);
}

function execute3(self, command, seat){
  const {type} = command;
  const event = Object.assign({seat}, command);
  switch(type){
    case "~": //pluck next command, for development purposes
      return _.maybe(self,
        up,
        _.first,
        moves(self, _),
        _.last,
        execute(self, _, seat)) || self;

    case "undo":
      if (!_.undoable(self.journal)){
        throw new Error("Undo is not possible or allowed.");
      }
      break;

    case "redo":
      if (!_.redoable(self.journal)){
        throw new Error("Redo is not possible or allowed.");
      }
      break;

    case "commit":
      if (!_.flushable(self.journal)){
        throw new Error("Commit is not possible or allowed.");
      }
      break;

  }
  return IGame.execute(self, event, seat);
}

export const execute = _.partly(_.overload(null, null, execute3, execute3));

export function finish(self){
  return execute(self, {type: "finish"});
}

export function load(self, events){
  return _.reduce(fold, self, events);
}

export function run(self, commands, seat){
  return _.reduce(execute(_, _, seat), self, commands);
}

export const whatif = _.partly(function whatif(self, commands, seat){
  const prior = self;
  const curr = _.reduce(execute(_, _, seat), prior, commands);
  return {
    added: added(curr, prior),
    up: up(curr),
    perspective: perspective(curr, seat),
    notify: notify(curr, prior)
  };
});

export const intermittently = _.partly(function intermittently($state, f, xs){
  _.each(function(x){
    _.swap($state, f(_, [x]));
  }, xs);
})

export const consecutively = _.partly(function consecutively($state, f, xs){
  _.swap($state, f(_, xs));
});

export function added(curr, prior){
  return prior ? _.chain(curr.events, _.last(_.count(curr.events) - _.count(prior.events), _), _.toArray) : [];
}

function moves2(self, seat){
  return _.chain(self, IGame.moves, seat == null ? _.identity : _.filter(_.pipe(_.get(_, "seat"), _.eq(_, seat)), _));
}

export const moves = _.partly(_.overload(null, IGame.moves, moves2));

export function perspectives(self){
  return _.chain(self,
    seated,
    _.count,
    _.range(0, _),
    _.mapa(perspective(self, _), _));
}

export function notify(curr, prior){
  return _.difference(up(curr), prior ? up(prior) : []);
}

export function summarize([curr, prior]){ //use $.hist
  return {
    up: up(curr),
    notify: notify(curr, prior),
    added: added(curr, prior),
    perspectives: perspectives(curr),
    reality: perspective(curr),
    game: curr
  };
}

export function simulate(self, events, commands, seat){
  return _.chain(self, load(_, events), whatif(_, commands, seat));
}

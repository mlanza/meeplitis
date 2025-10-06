import _ from "../../../../libs/atomic_/core.js";
import g from "../../../../libs/game_.js";

export const WHITE = 0;
export const BLACK = 1;

export function suggestibleRoll(suggested) { //for development/testing purposes
  const validDie = _.includes(_.toArray(_.range(1, 7)), _);
  const [a, b] = suggested || roll();
  if (!validDie(a) || !validDie(b)) {
    throw new Error("Invalid dice");
  }
  return [a, b];
}

function roll() {
  return [_.randInt(6) + 1, _.randInt(6) + 1];
}

const effects = {dice: {roll}};

export function Backgammon(seats, config, events, state){
  this.seats = seats;
  this.config = config;
  this.events = events;
  this.state = state;
}

export function backgammon(seats, config = {}, events = [], state = null){
  return new Backgammon(
    _.toArray(seats),
    _.merge({effects}, config),
    events,
    state || init(!!config.raiseStakes));
}

export const make = backgammon;

export default backgammon;

export function init(raiseStakes) {
	return _.merge({
    stakes: 1,
    status: "pending",
		dice: [],
    rolled: false,
    bar: [0, 0],
		off: [0, 0],
		points: _.toArray(_.repeat(24, [0,0]))
	}, raiseStakes ? {holdsCube: -1} : {});
}

function started(state) {
	return {
		...state,
		up: 0,
		status: "started",
		points: [
			[2, 0], [0, 0], [0, 0],	[0, 0],	[0, 0],	[0, 5],
			[0, 0],	[0, 3],	[0, 0],	[0, 0],	[0, 0],	[5, 0],
			[0, 5],	[0, 0],	[0, 0],	[0, 0],	[3, 0],	[0, 0],
			[5, 0],	[0, 0],	[0, 0],	[0, 0],	[0, 0],	[0, 2]
		]
	};
}

function rolled(details) {
  return function(state) {
    let { dice } = details;
    if (dice[0] === dice[1]) {
      dice = [dice[0], dice[0], dice[0], dice[0]];
    }
    return {
      ...state,
      status: "started",
      rolled: true,
      dice
    };
  }
}

function moved(details) {
  return function(state) {
    const { from, die } = details;
    let { to } = details;
    const { bar, dice, off, points, up } = state;
    const seat = up;
    const opponent = opposition(seat);
    const direction = directed(seat);

    if (to == null) {
      to = from + die * direction;
    }

    const newPoints = [...points];
    const newBar = [...bar];
    const newOff = [...off];

    const isBarMove = !bounds(from);
    const isBearOff = !bounds(to);

    if (isBarMove) {
      newBar[seat]--;
    } else {
      const sourcePoint = [...newPoints[from]];
      sourcePoint[seat]--;
      newPoints[from] = sourcePoint;
    }

    if (isBearOff) {
      newOff[seat]++;
    } else {
      const newTargetPoint = [...newPoints[to]];
      if (newTargetPoint[opponent] === 1) {
        newTargetPoint[opponent] = 0;
        newBar[opponent]++;
      }
      newTargetPoint[seat]++;
      newPoints[to] = newTargetPoint;
    }

    const newDice = [...dice];
    newDice.splice(dice.indexOf(die), 1);

    return {
      ...state,
      bar: newBar,
      off: newOff,
      points: newPoints,
      dice: newDice
    };
  }
}

function committed(state) {
  const { up } = state;
  const finished = won(state, WHITE) || won(state, BLACK);
  return {
    ...state,
    up: _.maybe(up, opposition),
    rolled: false,
    dice: [],
    status: finished ? "finished" : "started"
  };
}

function doubleProposed(state) {
  const { up } = state;
  return {
    ...state,
    status: "double-proposed",
    up: opposition(up)
  };
}

function accepted(seat) {
  return function(state) {
    return {
      ...state,
      stakes: state.stakes * 2,
      up: opposition(seat),
      holdsCube: seat,
      status: "started"
    };
  }
}

function conceded(seat) {
  return function(state){
    return {
      ...state,
      conceded: seat,
      status: "finished"
    };
  }
}

export function won(state, seat) {
  const {off, conceded} = state;
  return off[seat] === 15 || (conceded && conceded !== seat);
}

export function validate({state}) {
  const { bar, off, points } = state;
  const whiteCheckers =
    bar[WHITE] +
    off[WHITE] +
    _.reduce((sum, point) => sum + point[WHITE], 0, points);
  const blackCheckers =
    bar[BLACK] +
    off[BLACK] +
    _.reduce((sum, point) => sum + point[BLACK], 0, points);
  return whiteCheckers === 15 && blackCheckers === 15;
}

export function barPosition(seat){
  return seat === WHITE ? -1 : 24;
}

export function directed(seat) {
  return seat === WHITE ? 1 : -1;
}

export function opposition(seat){
  return seat === WHITE ? BLACK : WHITE;
}

export function bounds(point){
  return point >= 0 && point < 24;
}

export function innerBoard(seat){
  return seat === WHITE ? _.range(18, 24) : _.range(0, 6);
}
export function outerBoard(seat){
  return seat === WHITE ? _.range(0, 18) : _.range(6, 24);
}

function available(to, opponent, points){
  return bounds(to) && points[to][opponent] <= 1;
}

function attack(to, opponent, points){
  return bounds(to) && points[to][opponent] === 1;
}

//TODO use as optimzation
export function canEnter(seat, state){
  const { bar, points } = state;
  if (bar[seat] < 1) {
    return false;
  }
  const opponent = opposition(seat);
  return _.some(point => points[point][opponent] <= 1, innerBoard(opponent));
}

export function canBearOff(seat, state) {
  const { points, bar } = state;
  if (bar[seat] > 0) {
    return false;
  }
  return !_.detect(function(i){
    return points[i][seat] > 0;
  }, outerBoard(seat));
}

function moves3(self, type, seat) {
  const state = _.deref(self);
  const up = g.up(self),
        may = g.may(self);

  const { bar, rolled, points, dice, stakes, holdsCube, status } = state;

  if (!_.includes(up, seat) && !_.includes(may, seat)) {
    return [];
  }

  const allMoves = _.mapcat(function(seat) {
    const opponent = opposition(seat);
    const direction = directed(seat);
    const onBar = bar[seat] > 0;
    const pending = rolled && _.count(dice) > 0;

    if (status === "double-proposed") {
      return _.includes(up, seat) ? [{type: "accept", seat}, {type: "concede", seat}] : [];
    }

    if (!rolled && status !== "finished") {
      const canDouble = stakes < 64 && (holdsCube === -1 || holdsCube === seat);
      const doubleMove = canDouble ? [{type: "propose-double", seat}] : [];
      return _.concat([{type: "roll", seat}], doubleMove);
    }

    const barMoves = onBar ? _.mapcat(function(die) {
      return _.compact(_.map(function(from) {
        const to = from + die * direction;
        const open = available(to, opponent, points);
        if (open) {
          return {type: "enter", details: {from, to, die}, seat};
        }
      }, [barPosition(seat)]));
    }, _.unique(dice)) : [];

    const bearOffMoves = canBearOff(seat, state) ? _.mapcat(function(die) {
      const inner = _.toArray(innerBoard(seat));
      return _.compact(_.map(function(from) {
        if (points[from][seat] > 0) {
          const to = from + die * direction;
          if (!bounds(to)) { // bearing off
            const exactFrom = seat === WHITE ? 24 - die : die - 1;
            if (from === exactFrom) {
              return {type: "bear-off", details: {from, die}, seat};
            }
            // With a die roll too large to be an exact roll, a player may bear-off a checker from a point if all higher-numbered points are vacant.
            const pointsToCheck = seat === WHITE ? _.range(exactFrom, from) : _.range(from + 1, exactFrom + 1);
            const hasCheckersOnHigherPoints = _.some(p => points[p][seat] > 0, pointsToCheck);
            if (!hasCheckersOnHigherPoints) {
              return {type: "bear-off", details: {from, die}, seat};
            }
          } else if (available(to, opponent, points)) { // Regular move in inner board
            return {type: "move", details: {from, to, die}, seat};
          }
        }
      }, inner));
    }, _.unique(dice)) : [];

    const regularMoves = _.mapcat(function(die) {
      return _.compact(_.map(function(from) {
        const to = from + die * direction;
        const present = points[from][seat] > 0; // Simplified: no 'onBar' check here
        const open = available(to, opponent, points);
        if (present && open) {
          return {type: "move", details: {from, to, die}, seat};
        }
      }, _.range(24)));
    }, _.unique(dice));

    const moves = onBar ? barMoves : _.concat(bearOffMoves, regularMoves);
    if (pending ? _.count(moves) === 0 : rolled) {
      return [{type: "commit", seat}];
    }

    return moves;
  }, up);

  return _.filter(function (cmd) {
    return (type == null || cmd.type == type) && (seat == null || cmd.seat == seat);
  }, allMoves);
}

function moves1(self){
  return ["roll", "propose-double", "accept", "concede", "move", "enter", "bear-off","commit"];
}

const moves = _.overload(null, moves1, moves1, moves3);

function compact(self){
  return new Backgammon(self.seats,
    self.config,
    [],
    self.state);
}

function append(self, event){
  return new Backgammon(self.seats,
    self.config,
    _.append(self.events, event),
    self.state);
}

function fmap(self, f){
  return new Backgammon(self.seats,
    self.config,
    self.events,
    f(self.state));
}

function noDetails(command){
  const {details} = command;
  return _.eq(details, {}) ? _.dissoc(command, "details") : command;
}

const asEvent = _.get({
  'move': 'moved',
  'enter': 'entered',
  'bear-off': 'borne-off'
}, _);

export function destined(self){
  const moves = g.moves(self);
  return _.count(moves) === 1 ? _.first(moves) : null;
}

function blocked2(cmd, self){
  return cmd.type === "commit" && blocked1(self);
}

function blocked1(self){
  const {dice, rolled} = _.deref(self);
  return rolled && _.includes([2, 4], _.count(dice));
}

export const blocked = _.overload(null, blocked1, blocked2);

function compel(self){
  const cmd = destined(self);
  if (cmd) {
    if (cmd.type === "roll" || blocked(cmd, self)) {
      return g.execute(self, cmd);
    }
  }
  return self;
}

export function execute(self, command) {
  const { state, config } = self;
  const { status, stakes } = state;
  const { type, seat } = command;

  switch (status) {
    case "pending":
      if (type != "roll" && type !== "start") { // Assuming 'roll' is the start command
        throw new Error(`Cannot issue '${type}' unless the game has started.`);
      }
      break;
    case "started":
      if (type == "roll" && state.rolled) { // Cannot roll dice again if already rolled
        throw new Error(`Cannot roll dice again.`);
      }
      break;
    case "finished":
      if (type !== "finish") {
        throw new Error(`Cannot issue commands once the game is finished.`);
      }
      return g.fold(self, _.assoc(command, "type", "finished"));
  }

  const moves = g.moves(self, {seat, type});
  const cmd = _.chain(command, _.compact, _.dissoc(_, "id"), _.dissocIn(_, ["details", "dice"]), noDetails);

  if (command.type !== "start" && !_.detect(_.eq(_, cmd), moves)) {
    throw new Error(`Invalid command: ${JSON.stringify(command)}`);
  }

  switch (command.type) {
    case 'start':
      return g.fold(self,
        _.chain(command,
          _.assoc(_, "type", "started")));

    case 'roll': {
      const dice = config.effects.dice.roll(_.getIn(command, ['details', 'dice']));
      return g.fold(self,
        _.chain(command,
          _.assoc(_, "type", "rolled"),
          _.assocIn(_, ["details", "dice"], dice)));
    }

    case 'bear-off':
    case 'enter':
    case 'move': {
      const { from, to, die } = command.details;
      const { bar, dice, points, up } = state;
      const seat = up;
      const opponent = opposition(seat);

      if (!_.includes(dice, die)) {
        throw new Error(`That die is not available.`);
      }

      const isBarMove = !bounds(from);
      if (isBarMove) {
        if (bar[seat] < 1) {
          throw new Error("No checker is on the bar.");
        }
      } else {
        if (points[from][seat] < 1) {
          throw new Error(`No checker exists at point ${from}.`);
        }
      }

      if (bounds(to)) {
        const targetPoint = points[to];
        if (targetPoint[opponent] > 1) {
          throw new Error(`That point — ${to} — is blocked.`);
        }
      }

      const eventType = asEvent(type);
      const capture = attack(to, opponent, points);
      return g.fold(self,
        _.chain(command,
          _.assoc(_, "type", eventType),
          _.assocIn(_, ["details", "capture"], capture)));
    }

    case 'commit': {
      return _.chain(self,
        g.fold(_,
          _.chain(command,
            blocked(command, self) ? _.assoc(_, "details", {blocked: true}) : _.identity,
            _.assoc(_, "type", "committed"))),
          function(self){
            return g.status(self) == "finished" ? g.finish(self) : self;
          });
    }

    case 'propose-double': {
      if (status !== "started") {
        throw new Error(`Command not allowed in current status`);
      }
      if (stakes >= 64) {
        throw new Error("Cannot double at stakes of 64 or higher");
      }
      if (seat !== state.up || (state.holdsCube !== -1 && state.holdsCube !== seat)) {
        throw new Error("You do not control the cube or it's not your turn");
      }
      return g.fold(self, _.assoc(command, "type", "double-proposed"));
    }

    case 'accept': {
      if (status !== "double-proposed") {
        throw new Error(`Command not allowed in current status`);
      }
      if (seat !== state.up) {
        throw new Error("Not your turn");
      }
      return g.fold(self, _.assoc(command, "type", "accepted"));
    }

    case 'concede': {
      if (status !== "double-proposed") {
        throw new Error(`Command not allowed in current status`);
      }
      if (seat !== state.up) {
        throw new Error("Not your turn");
      }
      return _.chain(self,
        g.fold(_, _.assoc(command, "type", "conceded")),
        g.finish);
    }

    case 'finish': {
      return g.fold(self, _.assoc(command, "type", "finished"));
    }

    default: {
      throw new Error("Unknown command: " + command.type);
    }
  }
}

function fold(self, event) {
  switch (event.type) {
    case "started":
      return g.fold(self, event, started);
    case "rolled":
      return g.fold(self, event, rolled(event.details));
    case "borne-off":
    case "entered":
    case "moved":
      return g.fold(self, event, moved(event.details));
    case "committed":
      return g.fold(self, event, committed);
    case "double-proposed":
      return g.fold(self, event, doubleProposed);
    case "accepted":
      return g.fold(self, event, accepted(event.seat));
    case "conceded":
      return g.fold(self, event, conceded(event.seat));
    case "finished":
      return g.fold(self, event, _.pipe(_.dissoc(_, "up"), _.assoc(_, "status", "finished")));
    default:
      return self;
  }
}

function perspective(self, seen, reality){
  return reality; //no hidden info.
}

function up(self) {
  const state = _.deref(self),
        {up} = state;
  return [up];
}

const may = up;

function metrics(self) {
  const {config} = self;
  const {raiseStakes} = config;
  const state = _.deref(self);
  const stats = _.mapa(function(seat) {
    const conceded = state.conceded === seat;
    const off = state.off[seat];
    return {off, conceded};
  }, _.range(0, 2));
  const winner = _.chain(stats, _.sort(comparator(self), _), _.first);
  return _.mapa(function(stat){
    return {points: winner === stat ? state.stakes : 0, ...stat};
  }, stats);
}

function comparator(self) {
  return function(a, b) {
    // conceded: false beats true
    if (a.conceded !== b.conceded) {
      return a.conceded ? 1 : -1;
    }

    // higher 'off' wins
    if (a.off !== b.off) {
      return b.off - a.off;
    }

    // tie
    return 0;
  };
}

function pts(points){
  return points == null ? null : points === 1 ? "1 point" : `${points} points`;
}

function textualizer(self){
  const {stakes} = _.deref(self);
  return function({points, off, conceded}){
    return _.chain([pts(points), `${off} off`, conceded ? `conceded` : null], _.compact, _.join(", ", _));
  }
}

function undoable(self, {type}){
  return !_.includes(["finished", "rolled", "committed", "double-proposed", "accepted", "conceded"], type);
}

function status(self) {
  return _.chain(self, _.deref, _.get(_, "status"));
}

_.doto(Backgammon,
  g.behave,
  _.implement(_.ICompactible, {compact}),
  _.implement(_.IAppendable, {append}),
  _.implement(_.IFunctor, {fmap}),
  _.implement(g.IGame, {perspective, up, may, moves, undoable, metrics, comparator, textualizer, execute: _.comp(compel, execute), fold, status}));

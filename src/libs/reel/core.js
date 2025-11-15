import _ from "../atomic_/core.js";

export const FORWARD = 1;
export const BACKWARD = -1;

export function init(id, seat) {
  return {
    id,
    seat,
    make: null,
    touches: null,
    seated: [],
    seats: null,
    cursor: {
      pos: null,
      at: null,
      max: null,
      direction: FORWARD
    },
    perspectives: {}, // cache
    error: null, //TODO let's make errors bounce off
    ready: false
  };
}

export function table(table){
  return function(state){
    return _.chain(state, _.assoc(_, "table", table));
  }
}

export function position(n) {
  return function(state){
    const max = _.count(state.touches) - 1;
    const pos = _.clamp(n, 0, max);
    const direction = pos === 0 || pos > state.cursor.pos ? FORWARD : BACKWARD;
    const at = _.nth(state.touches, pos);
    const cursor = _.assoc(state.cursor, "pos", pos, "max", max, "at", at, "direction", direction);
    return _.assoc(state, "cursor", cursor);
  }
}

export function resize(max){
  return function(state){
    const {cursor, touches} = state;
    const direction = cursor.max == null || cursor.max < max ? BACKWARD : FORWARD;
    const pos = _.clamp(cursor.pos == null ? max : cursor.pos, 0, max);
    const at = _.get(touches, pos);
    return _.chain(state,
      _.assocIn(_, ["cursor", "direction"], direction),
      _.assocIn(_, ["cursor", "at"], at),
      _.assocIn(_, ["cursor", "max"], max),
      _.assocIn(_, ["cursor", "pos"], pos));
  }
}

export function addTouches({touches, undoables, last_acting_seat}){
  const max = _.count(touches) - 1;
  return function(state){
    const {cursor} = state;
    return _.chain(state,
      _.assoc(_, "touches", touches, "undoables", undoables, "last_acting_seat", last_acting_seat),
      resize(max),
      cursor.pos != null ? _.identity : position(max));
  }
}

export function addPerspective(at, perspective){
  return _.assocIn(_, ["perspectives", at], perspective);
}

//seated is everyone's info; seat which are yours (1 seat per player, except at dummy tables)
export function addSeating(seated, seats){
  return function(state){
    return _.chain(state, _.assoc(_, "seated", seated, "seats", seats));
  }
}

export function forward(state) {
  return _.chain(state, position(state.cursor.pos + 1));
}

export function backward(state) {
  return _.chain(state, position(state.cursor.pos - 1));
}

export function inception(state) {
  return _.chain(state, position(0));
}

export function present(state) {
  return _.chain(state, position(state.cursor.max));
}

export function at(at) {
  return function(state){
    const {cursor, touches} = state;
    const pos = _.indexOf(touches, at);
    if (pos === -1) {
      throw new Error("Unknown moment.");
    }
    return _.chain(state, position(pos));
  }
}

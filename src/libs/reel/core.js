import _ from "../atomic_/core.js";

export const FORWARD = 1;
export const BACKWARD = -1;

export function init(id, seat) {
  return {
    id,
    seat,
    timeline: null,
    seated: [],
    seats: null,
    cursor: {
      pos: null,
      at: null,
      max: null,
      direction: BACKWARD
    },
    perspectives: {}, // Cache for loaded perspectives
    error: null,
    ready: false
  };
}

export function isPosValid(state, pos) {
  if (pos < 0 || pos > state.cursor.max) {
    return false;
  }
  const at = _.nth(state.touches, pos);
  return !!_.get(state.perspectives, at);
}

export function position(pos) {
  return function(state){
    if (!isPosValid(state, pos)) {
      return state; // Do not move if target is not valid
    }
    const direction = pos > state.cursor.pos ? FORWARD : BACKWARD;
    const at = _.nth(state.touches, pos);
    const cursor = _.assoc(state.cursor, "pos", pos, "at", at, "direction", direction);
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

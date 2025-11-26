import _ from "../atomic_/core.js";

export const FORWARD = 1;
export const BACKWARD = -1;

export function init(id, seat, eventId = null) {
  const at = _.maybe(eventId, _.blot);
  return {
    id,
    seat,
    touches: null,
    cursor: {
      pos: null,
      at,
      max: null,
      direction: FORWARD
    },
    perspectives: {}, // cache
    perspective: null
  };
}

export function position(n) {
  return function(state){
    if (state?.cursor?.pos === n) {
      return state;
    }
    const max = _.count(state.touches) - 1;
    const pos = _.clamp(n, 0, max);
    const direction = pos === 0 || pos > state.cursor.pos ? FORWARD : BACKWARD;
    const at = _.nth(state.touches, pos);
    const cursor = _.assoc(state.cursor, "pos", pos, "max", max, "at", at, "direction", direction);
    const perspective = _.get(state.perspectives, at);
    return _.assoc(state, "cursor", cursor, "perspective", perspective);
  }
}

//(cursor.at == null ? max : _.indexOf(touches, cursor.at))
export function resize(max){
  return function(state){
    const {cursor, touches} = state;
    const direction = cursor.max == null || cursor.max < max ? BACKWARD : FORWARD;
    const pos = _.clamp(cursor.pos == null ? (cursor.at == null ? max : _.indexOf(touches, cursor.at)) : cursor.pos, 0, max);
    const at = _.get(touches, pos);
    const perspective = _.get(state.perspectives, at);
    return _.chain(state,
      _.assocIn(_, ["cursor", "direction"], direction),
      _.assocIn(_, ["cursor", "at"], at),
      _.assocIn(_, ["cursor", "max"], max),
      _.assocIn(_, ["cursor", "pos"], pos),
      _.assoc(_, "perspective", perspective));
  }
}

export function addTouches({touches, undoables, last_acting_seat}){
  const max = _.count(touches) - 1;
  return function(state){
    const {cursor} = state;
    return _.chain(state,
      _.assoc(_, "touches", touches, "undoables", undoables, "last_acting_seat", last_acting_seat),
      resize(max),
      cursor.pos == null && cursor.at == null ? position(max) : _.identity);
  }
}

export function addPerspective(at, perspective){
  return function(state) {
    const s = _.assocIn(state, ["perspectives", at], perspective);
    return s.cursor.at === at ? _.assoc(s, "perspective", perspective) : s;
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

export function at(eventId) {
  const at = _.maybe(eventId, _.blot);
  return function(state){
    const {cursor, touches} = state;
    const pos = _.maybe(touches, _.indexOf(_, at));
    if (pos === -1) {
      throw new Error("Unknown moment.");
    }
    return pos == null ? state : _.chain(state, position(pos));
  }
}

export function toLastMove(state){
  const {perspectives, cursor, touches} = state;
  const {at} = cursor;
  const perspective = _.get(perspectives, at);
  const lastMove = _.get(perspective, "last_move");
  const pos = _.indexOf(touches, lastMove);
  return _.chain(state, pos === -1 ? _.identity : position(pos));
}

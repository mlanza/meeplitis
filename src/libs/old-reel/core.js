import _ from "../atomic_/core.js";

export const FORWARD = 1;
export const BACKWARD = -1;

export function init(id, seat) {
  return {
    id,
    seat,
    timeline: null,
    seated: [],
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

export function loadSeated(state, seated) {
  return _.assoc(state, "seated", seated);
}

export function loadTimeline(state, timeline) {
  const max = _.count(timeline.touches) - 1;
  const pos = state.cursor.pos == null ? max : state.cursor.pos;
  const direction = max > pos ? FORWARD : BACKWARD;
  const cursor = {
    max,
    pos,
    direction,
    at: _.nth(timeline.touches, pos)
  };
  return _.assoc(state, "timeline", timeline, "cursor", cursor);
}

export function loadPerspective(state, at, perspective) {
  return _.assocIn(state, ["perspectives", at], perspective);
}

export function isPosValid(state, pos) {
  if (pos < 0 || pos > state.cursor.max) {
    return false;
  }
  const at = _.nth(state.timeline.touches, pos);
  return state.perspectives[at] != null;
}

function reposition(state, pos) {
  if (!isPosValid(state, pos)) {
    return state; // Do not move if target is not valid
  }
  const direction = pos > state.cursor.pos ? FORWARD : BACKWARD;
  const at = _.nth(state.timeline.touches, pos);
  const cursor = _.assoc(state.cursor, "pos", pos, "at", at, "direction", direction);
  return _.assoc(state, "cursor", cursor);
}

export function to_pos(state, pos) {
  return reposition(state, pos);
}

export function forward(state) {
  const newPos = state.cursor.pos + 1;
  if (!isPosValid(state, newPos)) {
    return state;
  }
  const newAt = _.nth(state.timeline.touches, newPos);
  const newCursor = { ...state.cursor, pos: newPos, at: newAt, direction: FORWARD };
  return _.assoc(state, "cursor", newCursor);
}

export function backward(state) {
  const newPos = state.cursor.pos - 1;
  if (!isPosValid(state, newPos)) {
    return state;
  }
  const newAt = _.nth(state.timeline.touches, newPos);
  const newCursor = { ...state.cursor, pos: newPos, at: newAt, direction: BACKWARD };
  return _.assoc(state, "cursor", newCursor);
}

export function inception(state) {
  return reposition(state, 0);
}

export function present(state) {
  return reposition(state, state.cursor.max);
}

export function at(state, pos) {
  return _.chain(reposition(state, pos),
    _.assocIn(_, ["cursor", "direction"], FORWARD));
}

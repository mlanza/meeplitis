import _ from "../atomic_/core.js";

export function init(id, seat) {
  return {
    id,
    seat,
    timeline: null,
    pos: null,
    max: null,
    at: null,
    perspective: null,
    perspectives: {}, // Cache for loaded perspectives
    error: null,
    ready: true
  };
}

export function loadTimeline(state, timeline) {
  const max = _.count(timeline.touches) - 1;
  return _.assoc(state,
    "timeline", timeline,
    "max", max,
    "pos", max,
    "at", _.nth(timeline.touches, max));
}

export function loadPerspective(state, perspective) {
  return _.assoc(state,
    "perspective", perspective,
    "perspectives", _.assoc(state.perspectives, state.at, perspective));
}

function reposition(state, pos) {
  const newPos = _.clamp(pos, 0, state.max);
  const at = _.nth(state.timeline.touches, newPos);
  return _.assoc(state,
    "pos", newPos,
    "at", at,
    "perspective", _.get(state.perspectives, at, null)); // Immediately load from cache if available
}

export function to_pos(state, pos) {
  return reposition(state, pos);
}

export function forward(state) {
  return reposition(state, state.pos + 1);
}

export function backward(state) {
  return reposition(state, state.pos - 1);
}

export function to_start(state) {
  return reposition(state, 0);
}

export function to_end(state) {
  return reposition(state, state.max);
}

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

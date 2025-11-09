// reel/core.js - Pure functional core for the reel component

import _ from "../atomic_/core.js"; // Adjusted path

// Initial state structure for the reel core
export const initialState = {
  tableId: null,
  accessToken: null,
  seat: null,
  seated: null,
  config: null,
  touches: [],
  perspectives: {}, // Cache of fetched perspectives, keyed by eventId
  cursor: {
    pos: 0, // Current position in the touches array
    at: 0,  // Clamped position (0 to max)
    max: -1 // Max index of touches array (touches.length - 1)
  },
  gameMake: null, // Function to construct a game instance
  error: null,
  ready: true,
  timerActive: false // New state to track if timer is active
};

// Messages that can be dispatched to the core
export const MSG = {
  INIT: "INIT",
  SET_TABLE_ID: "SET_TABLE_ID",
  SET_ACCESS_TOKEN: "SET_ACCESS_TOKEN",
  SET_SEAT: "SET_SEAT",
  SET_SEATED: "SET_SEATED",
  SET_CONFIG: "SET_CONFIG",
  SET_TOUCHES: "SET_TOUCHES",
  ADD_PERSPECTIVE: "ADD_PERSPECTIVE",
  SET_GAME_MAKE: "SET_GAME_MAKE",
  SET_ERROR: "SET_ERROR",
  SET_READY: "SET_READY",
  NAVIGATE: "NAVIGATE", // For cursor movement
  ISSUE_MOVE: "ISSUE_MOVE", // For issuing a game move
  CLEAR_CACHE: "CLEAR_CACHE",
  FFWD: "FFWD", // Fast forward command
  STOP_FFWD: "STOP_FFWD" // Stop fast forward
};

// Helper to clamp cursor position
function clampCursor(pos, max) {
  return _.clamp(pos, 0, Math.max(0, max));
}

// Reducer function: (state, msg) -> newState | {state, effects}
export function reduce(state, msg) {
  switch (msg.type) {
    case MSG.INIT:
      return { ...initialState, ...msg.payload };

    case MSG.SET_TABLE_ID:
      return { ...state, tableId: msg.payload };

    case MSG.SET_ACCESS_TOKEN:
      return { ...state, accessToken: msg.payload };

    case MSG.SET_SEAT:
      return { ...state, seat: msg.payload };

    case MSG.SET_SEATED:
      return { ...state, seated: msg.payload };

    case MSG.SET_CONFIG:
      return { ...state, config: msg.payload };

    case MSG.SET_TOUCHES: {
      const newTouches = msg.payload;
      const newMax = _.count(newTouches) - 1;
      const newPos = clampCursor(state.cursor.pos, newMax);
      return {
        ...state,
        touches: newTouches,
        cursor: {
          pos: newPos,
          at: newPos, // 'at' always reflects the clamped 'pos'
          max: newMax
        }
      };
    }

    case MSG.ADD_PERSPECTIVE:
      return {
        ...state,
        perspectives: _.assoc(state.perspectives, msg.payload.eventId, msg.payload.perspective)
      };

    case MSG.SET_GAME_MAKE:
      return { ...state, gameMake: msg.payload };

    case MSG.SET_ERROR:
      return { ...state, error: msg.payload };

    case MSG.SET_READY:
      return { ...state, ready: msg.payload };

    case MSG.NAVIGATE: {
      const { command, value } = msg.payload; // value can be a number (pos) or eventId
      let newPos = state.cursor.pos;
      const max = state.cursor.max;

      switch (command) {
        case "inception":
          newPos = 0;
          break;
        case "back":
          newPos = _.dec(state.cursor.pos);
          break;
        case "forward":
          newPos = _.inc(state.cursor.pos);
          break;
        case "present":
          newPos = max;
          break;
        case "goto":
          if (_.isNumber(value)) {
            newPos = value;
          } else if (_.isString(value)) { // Assume value is an eventId
            const index = _.indexOf(state.touches, value);
            if (index !== -1) {
              newPos = index;
            }
          }
          break;
        case "last-move":
          // This will require an effect to get the last move from the perspective
          // For now, we'll just keep the current position or move to present
          newPos = max; // Placeholder for now, will be handled by effect later
          break;
        default:
          break;
      }

      newPos = clampCursor(newPos, max);

      // If navigating, stop any active timer
      const effects = [];
      if (state.timerActive) {
        effects.push({ type: EFFECT.STOP_TIMER });
      }

      return {
        state: {
          ...state,
          cursor: {
            pos: newPos,
            at: newPos, // 'at' always reflects the clamped 'pos'
            max: max
          },
          timerActive: false,
        },
        effects: effects.length > 0 ? effects : undefined
      };
    }

    case MSG.ISSUE_MOVE:
      // Core doesn't directly handle the move, it emits an effect
      const effects = [];
      if (state.timerActive) {
        effects.push({ type: EFFECT.STOP_TIMER });
      }
      effects.push({
        type: EFFECT.ISSUE_MOVE,
        payload: {
          moveTableId: state.tableId,
          moveSeat: state.seat,
          commands: msg.payload.commands,
          moveAccessToken: state.accessToken
        }
      });

      return {
        state: {
          ...state,
          ready: false, // Set ready to false while move is being processed
          timerActive: false,
        },
        effects: effects
      };

    case MSG.FFWD:
      // Start fast forward if not already at present
      if (state.cursor.at < state.cursor.max && !state.timerActive) {
        return {
          state: {
            ...state,
            timerActive: true,
          },
          effects: [{ type: EFFECT.START_TIMER, payload: { interval: 1000 } }]
        };
      }
      return state; // No change if already at present or timer active

    case MSG.STOP_FFWD:
      if (state.timerActive) {
        return {
          state: {
            ...state,
            timerActive: false,
          },
          effects: [{ type: EFFECT.STOP_TIMER }]
        };
      }
      return state;

    case MSG.CLEAR_CACHE:
      return { ...state, perspectives: {} };

    default:
      return state;
  }
}

// Effects that the core can emit
export const EFFECT = {
  FETCH_TABLE: "FETCH_TABLE",
  FETCH_TOUCHES: "FETCH_TOUCHES",
  FETCH_PERSPECTIVE: "FETCH_PERSPECTIVE",
  FETCH_GAME_MAKE: "FETCH_GAME_MAKE",
  ISSUE_MOVE: "ISSUE_MOVE",
  START_TIMER: "START_TIMER",
  STOP_TIMER: "STOP_TIMER",
  LOG: "LOG",
  ERROR: "ERROR"
};

// Example of a function that might return state and effects
export function initReel(initialProps) {
  const effects = [];
  if (initialProps.tableId) {
    effects.push({ type: EFFECT.FETCH_TABLE, payload: initialProps.tableId });
    effects.push({ type: EFFECT.FETCH_TOUCHES, payload: initialProps.tableId });
  }
  if (initialProps.gameId) { // Assuming gameId is passed in initialProps
    effects.push({ type: EFFECT.FETCH_GAME_MAKE, payload: initialProps.gameId });
  }
  return {
    state: { ...initialState, ...initialProps },
    effects: effects.length > 0 ? effects : undefined
  };
}

// Selector to get the current eventId based on cursor.at
export function getCurrentEventId(state) {
  return _.get(state.touches, state.cursor.at);
}

// Selector to get the current perspective
export function getCurrentPerspective(state) {
  const eventId = getCurrentEventId(state);
  return _.get(state.perspectives, eventId);
}

// Selector to get the game instance for the current perspective
export function getCurrentGameInstance(state) {
  const perspective = getCurrentPerspective(state);
  if (perspective && state.gameMake && state.seated && state.config) {
    // Assuming perspective.state and perspective.event are available
    return state.gameMake(state.seated, state.config, [perspective.event], perspective.state);
  }
  return null;
}

// Selector to check if at present
export let atPresent = (state) => {
  return state.cursor.at === state.cursor.max;
};

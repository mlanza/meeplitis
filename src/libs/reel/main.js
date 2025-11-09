// reel/main.js - Imperative shell for the reel component

import _ from "../atomic_/core.js"; // Adjusted path
import $ from "../atomic_/shell.js"; // Adjusted path
import * as Core from "./core.js";
import supabase from "../supabase.js"; // Adjusted path
import { session, getfn } from "../session.js"; // Adjusted path

// Helper to digest Supabase function results
function digest(result) {
  const code = result?.code,
    error = code == null ? null : result,
    data = code == null ? result : null;
  return { error, data };
}

// Supabase function wrappers (mimicking existing reel.js)
async function getTouches(_table_id) {
  try {
    console.log(`Shell: Fetching touches for table: ${_table_id}`);
    const result = await getfn('touches', { _table_id });
    console.log(`Shell: Touches fetched for ${_table_id}:`, result);
    return result;
  } catch (e) {
    console.error(`Shell: Error fetching touches for ${_table_id}:`, e);
    throw e;
  }
}

async function getPerspective(table_id, event_id, seat, seat_id) {
  try {
    console.log(`Shell: Fetching perspective for event: ${event_id}, table: ${table_id}`); // Corrected variable names
    const perspectivePromise = getfn("perspective", _.compact({ table_id, event_id, seat })).then(digest);
    const last_movePromise = getLastMove(table_id, event_id, seat_id);
    const [perspectiveResult, last_move_data] = await Promise.all([perspectivePromise, last_movePromise]); // Corrected variable name
    const result = Object.assign({}, perspectiveResult.error || perspectiveResult.data, last_move_data);
    console.log(`Shell: Perspective fetched for event ${event_id}:`, result); // Corrected variable name
    return result;
  } catch (e) {
    console.error(`Shell: Error fetching perspective for event ${event_id}:`, e); // Corrected variable name
    throw e;
  }
}

async function getLastMove(_table_id, _event_id, _seat_id) {
  try {
    console.log(`Shell: Fetching last move for event: ${_event_id}, table: ${_table_id}`);
    const { data } = await supabase.rpc('last_move', {
      _table_id,
      _event_id,
      _seat_id
    });
    console.log(`Shell: Last move fetched for event ${_event_id}:`, data);
    return { last_move: data };
  } catch (e) {
    console.error(`Shell: Error fetching last move for event ${_event_id}:`, e);
    throw e;
  }
}

async function getGameMetadata(gameId) {
  try {
    console.log(`Shell: Fetching game metadata for gameId: ${gameId}`);
    // In a real scenario, this would fetch game details from Supabase
    // For now, mock data for backgammon
    if (gameId === "backgammon-game-id") { // Placeholder gameId
      console.log(`Shell: Using mocked game metadata for ${gameId}`);
      return { slug: "backgammon", release: "uJl" };
    }
    console.warn(`Shell: No mocked game metadata for ${gameId}. Returning null.`);
    return null;
  } catch (e) {
    console.error(`Shell: Error fetching game metadata for ${gameId}:`, e);
    throw e;
  }
}

async function fetchGameMake(gameId) {
  try {
    console.log(`Shell: Fetching game make function for gameId: ${gameId}`);
    const metadata = await getGameMetadata(gameId);
    if (!metadata) {
      throw new Error(`Game metadata not found for gameId: ${gameId}`);
    }
    const { slug, release } = metadata;
    const gameModulePath = `../../games/${slug}/table/${release}/core.js`; // Adjusted path
    console.log(`Shell: Dynamically importing game module from: ${gameModulePath}`);
    const { make } = await import(gameModulePath);
    console.log(`Shell: Game module imported successfully for ${gameId}.`);
    return make;
  } catch (e) {
    console.error(`Shell: Error in fetchGameMake for ${gameId}:`, e);
    throw e;
  }
}

async function issueMove(table_id, seat, commands, accessToken) {
  try {
    console.log(`Shell: Issuing move for table: ${table_id}, seat: ${seat}, commands:`, commands);
    const body = { table_id, seat, commands };
    const result = await supabase.functions.invoke("move", { body }).then(_.get(_, "data"));
    console.log(`Shell: Move issued successfully for table ${table_id}:`, result);
    return result;
  } catch (e) {
    console.error(`Shell: Error issuing move for table ${table_id}:`, e);
    throw e;
  }
}

/**
 * Creates a new signal that "ticks" at a specified interval.
 * This signal is a high-resolution timer that attempts to correct for drift,
 * making it more accurate than `setInterval` for long-running processes.
 *
 * The signal is an observable that starts ticking upon subscription and stops
 * when unsubscribed.
 *
 * @param {number} interval - The ticking interval in milliseconds.
 * @param {function} [f=Date.now] - A function to generate the value for each tick. It receives an object with details about the tick (frame, offage, target).
 * @returns {Observable} An observable that emits values at the specified interval.
 */
function pacemaker(interval, f = Date.now) {
  return $.observable(function(observer) {
    const self = {
      seed: performance.now(),
      target: 0,
      frame: 0,
      stopped: false,
      offage: 0
    };
    self.target = self.seed;

    function callback() {
      if (self.stopped) {
        return;
      }
      self.offage = performance.now() - self.target;
      if (self.offage >= 0) {
        $.pub(observer, f(self));
        self.frame += 1;
        self.target = self.seed + self.frame * interval;
      }
      const delay = Math.abs(Math.round(Math.min(0, self.offage)));
      if (!self.stopped) {
        setTimeout(callback, delay);
      }
    }

    setTimeout(callback, 0);

    return function() {
      self.stopped = true;
      $.complete(observer);
    };
  });
}

function Timer(interval, f) {
  this.interval = interval;
  this.f = f;
  this.$emitter = $.subject(); // Persistent subject for subscribers
  this.unsub = null; // To hold the pacemaker's unsub function
}

Timer.prototype.start = function() {
  if (this.unsub === null) { // Only start if stopped
    const $p = pacemaker(this.interval, this.f);
    this.unsub = $.sub($p, (tick) => $.pub(this.$emitter, tick));
  }
};

Timer.prototype.stop = function() {
  if (this.unsub !== null) { // Only stop if running
    this.unsub();
    this.unsub = null;
  }
};

(function(){
  function sub(self, observer) {
    return $.sub(self.$emitter, observer);
  }
  $.doto(Timer,
    _.implement($.ISubscribe, { sub })
  );
})();


// Effect interpreter
export function createReelShell(initialState, dispatch, options = {}) {
  const { noCache = false, noStore = false } = options;
  const shellState = $.atom(initialState); // Reactive state for the shell
  let timer = null; // Instance of the Timer

  console.log("Shell: createReelShell called.");

  // Subscribe to core state changes to update shell's internal state
  $.sub(shellState, (newState) => {
    console.log("Shell: shellState updated. timerActive:", newState.timerActive, "current timer:", !!timer);
    // If timer was active and now core state says it's not, stop it
    if (!newState.timerActive && timer) {
      console.log("Shell: Stopping timer due to core state change.");
      timer.stop();
      timer = null;
    }
  });

  // Function to interpret effects from the core
  async function interpretEffect(effect) {
    try {
      console.log("Shell: Interpreting effect:", effect.type, effect.payload);
      switch (effect.type) {
        case Core.EFFECT.FETCH_TABLE:
          console.log("Shell: Handling FETCH_TABLE effect.");
          // In a real scenario, you'd fetch table details from Supabase here
          // and extract game_id, config, etc.
          dispatch({ type: Core.MSG.SET_TABLE_ID, payload: effect.payload });
          // Mocking some data for now
          const tableData = {
            id: effect.payload,
            game_id: "backgammon-game-id", // Placeholder
            config: { game: "backgammon" },
            seated: [{ seat: 0, username: "Player1" }, { seat: 1, username: "Player2" }]
          };
          dispatch({ type: Core.MSG.SET_CONFIG, payload: tableData.config });
          dispatch({ type: Core.MSG.SET_SEATED, payload: tableData.seated });
          // Also trigger fetching game make function
          dispatch({ type: Core.MSG.SET_READY, payload: false }); // Indicate loading
          // interpretEffect({ type: Core.EFFECT.FETCH_GAME_MAKE, payload: tableData.game_id }); // REMOVED
          break;

        case Core.EFFECT.FETCH_TOUCHES:
          console.log("Shell: Handling FETCH_TOUCHES effect.");
          try {
            const touches = await getTouches(effect.payload);
            dispatch({ type: Core.MSG.SET_TOUCHES, payload: touches?.touches || [] });
          } catch (e) {
            console.error("Shell: Failed to fetch touches:", e);
            dispatch({ type: Core.MSG.SET_ERROR, payload: e.message });
          }
          break;

        case Core.EFFECT.FETCH_PERSPECTIVE:
          console.log("Shell: Handling FETCH_PERSPECTIVE effect.");
          const { tableId, eventId, seat, seatId } = effect.payload;

          // Check if perspective is already in core state (cache)
          const currentCoreState = _.deref(shellState); // Corrected deref
          const cachedPerspective = _.get(currentCoreState.perspectives, eventId);

          if (!noCache && cachedPerspective) {
            console.log(`Shell: Using cached perspective for eventId: ${eventId}`);
            dispatch({ type: Core.MSG.ADD_PERSPECTIVE, payload: { eventId, perspective: cachedPerspective } });
            return;
          }

          try {
            const perspective = await getPerspective(tableId, eventId, seat, seatId);
            if (!noStore) {
              dispatch({ type: Core.MSG.ADD_PERSPECTIVE, payload: { eventId, perspective } });
            } else {
              console.log(`Shell: Fetched perspective for eventId: ${eventId}, but not storing due to --no-store.`);
            }
          } catch (e) {
            console.error("Shell: Failed to fetch perspective:", e);
            dispatch({ type: Core.MSG.SET_ERROR, payload: e.message });
          }
          break;

        case Core.EFFECT.FETCH_GAME_MAKE:
          console.log("Shell: Handling FETCH_GAME_MAKE effect.");
          try {
            const gameMake = await fetchGameMake(effect.payload);
            dispatch({ type: Core.MSG.SET_GAME_MAKE, payload: gameMake });
            dispatch({ type: Core.MSG.SET_READY, payload: true }); // Ready after game make is loaded
          } catch (e) {
            console.error("Shell: Failed to fetch game make function:", e);
            dispatch({ type: Core.MSG.SET_ERROR, payload: e.message });
            dispatch({ type: Core.MSG.SET_READY, payload: true });
          }
          break;

        case Core.EFFECT.ISSUE_MOVE:
          console.log("Shell: Handling ISSUE_MOVE effect.");
          const { moveTableId, moveSeat, commands, moveAccessToken } = effect.payload;
          try {
            dispatch({ type: Core.MSG.SET_READY, payload: false }); // Indicate loading
            await issueMove(moveTableId, moveSeat, commands, moveAccessToken);
            // After a move, we typically need to refresh touches and potentially the table
            interpretEffect({ type: Core.EFFECT.FETCH_TOUCHES, payload: moveTableId });
          } catch (e) {
            console.error("Shell: Failed to issue move:", e);
            dispatch({ type: Core.MSG.SET_ERROR, payload: e.message });
          } finally {
            dispatch({ type: Core.MSG.SET_READY, payload: true });
          }
          break;

        case Core.EFFECT.START_TIMER:
          console.log("Shell: Handling START_TIMER effect.");
          if (!timer) {
            timer = new Timer(effect.payload.interval, Date.now);
            $.sub(timer, () => {
              console.log("Shell: Timer tick. Current core state timerActive:", _.deref(shellState).timerActive); // Corrected deref
              // Check if at present, if so, stop timer
              // Pass the current shellState.deref() to Core.atPresent
              if (Core.atPresent(_.deref(shellState))) { // Corrected deref
                console.log("Shell: Timer reached present, dispatching STOP_FFWD.");
                dispatch({ type: Core.MSG.STOP_FFWD });
              } else {
                console.log("Shell: Timer dispatching NAVIGATE forward.");
                dispatch({ type: Core.MSG.NAVIGATE, payload: { command: "forward" } });
              }
            });
            timer.start();
            console.log("Shell: Timer started.");
          }
          break;

        case Core.EFFECT.STOP_TIMER:
          console.log("Shell: Handling STOP_TIMER effect.");
          if (timer) {
            timer.stop();
            timer = null;
            console.log("Shell: Timer stopped.");
          }
          break;

        case Core.EFFECT.LOG:
          console.log("Shell Log:", effect.payload);
          break;

        case Core.EFFECT.ERROR:
          console.error("Shell Error:", effect.payload);
          break;

        default:
          console.warn("Shell: Unknown effect:", effect);
      }
    } catch (e) {
      console.error("Shell: Error interpreting effect:", e);
      dispatch({ type: Core.MSG.SET_ERROR, payload: e.message });
    }
  }

  return {
    interpretEffect,
    state: shellState // Expose the shell's internal state if needed
  };
}

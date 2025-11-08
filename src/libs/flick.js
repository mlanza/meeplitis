import _ from "./atomic_/core.js";

const initialState = {
  tableId: null,
  seat: null,
  session: null,
  initialAt: null,
  table: null,
  seated: null,
  game: null,
  module: null,
  touches: null,
  perspectives: {},
  cursor: {
    pos: 0,
    at: null,
    max: 0
  },
  noCache: false,
  noStore: false,
  effects: [] // Effects are now part of the state
};

function checkCacheAndFetch(state, at) {
  const effects = [];
  if (!at) return effects;
  const perspective = state.perspectives[at];
  if (perspective && !state.noCache) {
    effects.push({ type: "Log", payload: { topic: "Cache", data: { status: "HIT", at } } });
  } else {
    const reason = perspective ? "FLAG_NO_CACHE" : "MISS";
    effects.push({ type: "Log", payload: { topic: "Cache", data: { status: "MISS", reason, at } } });
    effects.push({ type: "FetchPerspective", payload: { tableId: state.tableId, eventId: at } });
  }
  return effects;
}

function reducer(state = initialState, msg) {
  switch (msg.type) {
    case "Init": {
      const { tableId, seat, session, at, noCache, noStore } = msg.payload;
      return {
        ...state,
        tableId,
        seat,
        session,
        initialAt: at,
        noCache: !!noCache,
        noStore: !!noStore,
        effects: [
          { type: "FetchTable", payload: { tableId } },
          { type: "FetchSeated", payload: { tableId } },
          { type: "Log", payload: { topic: "Init", data: { tableId, seat, at, noCache, noStore } } }
        ]
      };
    }

    case "TableLoaded": {
      const { table } = msg.payload;
      return {
        ...state,
        table,
        effects: [
          { type: "SubscribeToTableChannel", payload: { tableId: table.id } },
          { type: "FetchTouches", payload: { tableId: table.id } },
          { type: "FetchGame", payload: { gameId: table.game_id } }
        ]
      };
    }

    case "TouchesLoaded": {
      const { touches } = msg.payload;
      const max = _.count(touches.touches) - 1;
      let newPos;

      if (state.initialAt) {
        const foundPos = _.indexOf(touches.touches, state.initialAt);
        newPos = foundPos !== -1 ? foundPos : max;
      } else if (state.touches === null) {
        newPos = max;
      } else {
        const wasAtPresent = state.cursor.pos === state.cursor.max;
        newPos = wasAtPresent ? max : state.cursor.pos;
      }
      
      const newAt = touches.touches[newPos];
      const newCursor = { pos: newPos, at: newAt, max };
      const effects = [
        { type: "Log", payload: { topic: "Touches", data: { status: "LOADED", count: max + 1 } } },
        ...checkCacheAndFetch(state, newAt)
      ];

      if (!state.module && state.game) {
        effects.push({ type: "FetchGameModule", payload: { gameId: state.game.id } });
      }
      
      return { ...state, touches, cursor: newCursor, initialAt: null, effects };
    }

    case "NavigateTo":
    case "Step": {
      if (!state.touches) return state;
      const { max } = state.cursor;
      let newPos;

      if (msg.type === "Step") {
        newPos = _.clamp(state.cursor.pos + msg.payload.delta, 0, max);
      } else {
        const { pos, at } = msg.payload;
        if (at) {
          const foundPos = (at === "present") ? max : _.indexOf(state.touches.touches, at);
          newPos = foundPos !== -1 ? foundPos : state.cursor.pos;
        } else {
          newPos = _.clamp(pos, 0, max);
        }
      }

      const newAt = state.touches.touches[newPos];
      const newCursor = { ...state.cursor, pos: newPos, at: newAt };
      return {
        ...state,
        cursor: newCursor,
        effects: [
          { type: "Log", payload: { topic: "Navigation", data: { pos: newPos, at: newAt } } },
          ...checkCacheAndFetch(state, newAt)
        ]
      };
    }

    case "PerspectiveLoaded": {
      const { eventId, perspective } = msg.payload;
      if (state.noStore) {
        return { ...state, effects: [{ type: "Log", payload: { topic: "Cache", data: { status: "NOT_STORED" } } }] };
      }
      let perspectiveToCache = perspective;
      if (state.module?.make && perspective.event && perspective.state) {
        const game = state.module.make(state.seated, state.table.config, [perspective.event], perspective.state);
        const actor = _.maybe(perspective.event.seat, _.nth(state.seated, _));
        perspectiveToCache = { ...perspective, game, actor };
      }
      const newPerspectives = { ...state.perspectives, [eventId]: perspectiveToCache };
      return { ...state, perspectives: newPerspectives, effects: [{ type: "Log", payload: { topic: "Cache", data: { status: "LOADED", at: eventId } } }] };
    }

    case "ClearEffects":
      return { ...state, effects: [] };

    case "SeatedLoaded":
      return { ...state, seated: msg.payload.seated, effects: [] };
    case "GameLoaded":
      return { ...state, game: msg.payload.game, effects: [] };
    case "GameModuleLoaded":
      return { ...state, module: { make: msg.payload.make }, effects: [] };
    case "ClearCache":
      return { ...state, perspectives: {}, effects: [] };
    case "TableUpdated":
      return { ...state, table: msg.payload.table, effects: [{ type: "FetchTouches", payload: { tableId: msg.payload.table.id } }] };

    default:
      return state;
  }
}

export default {
  reducer,
  initialState
};
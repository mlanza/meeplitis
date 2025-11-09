// meeplitis/src/libs/reel/test.js

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { describe, it, beforeEach, afterEach } from "https://deno.land/std@0.208.0/testing/bdd.ts";

import * as Core from "./core.js";
import { createReelShell } from "./main.js";
import $ from "../atomic_/shell.js"; // Import $ for atom

// Mock dependencies
const mockSupabase = {
  from: () => mockSupabase,
  select: () => mockSupabase,
  eq: () => mockSupabase,
  then: (cb) => Promise.resolve(cb({ data: [{ id: "mock-table-id", game_id: "backgammon-game-id", config: { game: "backgammon" } }] })),
  channel: () => mockSupabase,
  on: () => mockSupabase,
  filter: () => mockSupabase,
  subscribe: () => {},
  rpc: () => Promise.resolve({ data: { last_move: "mock-last-move-id" } }),
  functions: {
    invoke: () => Promise.resolve({ data: "mock-move-result" })
  }
};

const mockSession = {
  accessToken: "mock-access-token"
};

const mockGetFn = (name, params) => {
  if (name === 'touches') {
    return Promise.resolve({ touches: ["event1", "event2", "event3"] });
  }
  if (name === 'perspective') {
    return Promise.resolve({ event: { id: params.event_id }, state: { board: "mock-board-state" } });
  }
  return Promise.resolve({});
};

// Mock dynamic import for game modules
const mockGameMake = (seated, config, events, state) => ({
  seated, config, events, state,
  type: "MockGameInstance"
});

// Override global Deno functions for testing
const originalDenoEnvGet = Deno.env.get;
Deno.env.get = (key) => {
  if (key === "SUPABASE_SESSION_ACCESS_TOKEN") {
    return mockSession.accessToken;
  }
  return originalDenoEnvGet(key);
};

// Mock the import function for game modules
const originalImport = globalThis.import;
globalThis.import = async (modulePath) => {
  if (modulePath.includes("games/backgammon/table/uJl/core.js")) {
    return { make: mockGameMake };
  }
  return originalImport(modulePath);
};


describe("Reel Core", () => {
  let state;

  beforeEach(() => {
    state = { ...Core.initialState }; // Ensure a fresh copy for each test
  });

  // Helper to extract state and effects from Core.reduce
  const reduceAndExtract = (currentState, msg) => {
    const result = Core.reduce(currentState, msg);
    // If result is just a state object (no effects returned)
    if (result && typeof result === 'object' && !('state' in result && 'effects' in result)) {
      return { state: result, effects: undefined };
    }
    // If result is { state, effects }
    return result;
  };

  it("should initialize with default state", () => {
    assertEquals(state, Core.initialState);
  });

  it("should handle SET_TABLE_ID message", () => {
    const { state: newState } = reduceAndExtract(state, { type: Core.MSG.SET_TABLE_ID, payload: "test-table-123" });
    assertEquals(newState.tableId, "test-table-123");
  });

  it("should handle SET_TOUCHES message and update cursor", () => {
    const touches = ["a", "b", "c"];
    const { state: newState } = reduceAndExtract(state, { type: Core.MSG.SET_TOUCHES, payload: touches });
    assertEquals(newState.touches, touches);
    assertEquals(newState.cursor.max, 2);
    assertEquals(newState.cursor.pos, 0);
    assertEquals(newState.cursor.at, 0);

    // Test with existing pos
    state.cursor.pos = 1;
    const { state: newState2 } = reduceAndExtract(state, { type: Core.MSG.SET_TOUCHES, payload: touches });
    assertEquals(newState2.cursor.pos, 1);
    assertEquals(newState2.cursor.at, 1);
  });

  it("should clamp cursor.pos when SET_TOUCHES reduces max", () => {
    state.touches = ["a", "b", "c", "d"];
    state.cursor = { pos: 3, at: 3, max: 3 };
    const newTouches = ["x", "y"]; // max becomes 1
    const { state: newState } = reduceAndExtract(state, { type: Core.MSG.SET_TOUCHES, payload: newTouches });
    assertEquals(newState.touches, newTouches);
    assertEquals(newState.cursor.max, 1);
    assertEquals(newState.cursor.pos, 1); // clamped from 3 to 1
    assertEquals(newState.cursor.at, 1);
  });

  it("should handle NAVIGATE messages (forward, back, inception, present)", () => {
    state.touches = ["a", "b", "c", "d"];
    state.cursor = { pos: 1, at: 1, max: 3 };

    let { state: newState } = reduceAndExtract(state, { type: Core.MSG.NAVIGATE, payload: { command: "forward" } });
    assertEquals(newState.cursor.pos, 2);
    assertEquals(newState.cursor.at, 2);

    ({ state: newState } = reduceAndExtract(newState, { type: Core.MSG.NAVIGATE, payload: { command: "back" } }));
    assertEquals(newState.cursor.pos, 1);
    assertEquals(newState.cursor.at, 1);

    ({ state: newState } = reduceAndExtract(newState, { type: Core.MSG.NAVIGATE, payload: { command: "inception" } }));
    assertEquals(newState.cursor.pos, 0);
    assertEquals(newState.cursor.at, 0);

    ({ state: newState } = reduceAndExtract(newState, { type: Core.MSG.NAVIGATE, payload: { command: "present" } }));
    assertEquals(newState.cursor.pos, 3);
    assertEquals(newState.cursor.at, 3);
  });

  it("should handle NAVIGATE goto (index and eventId)", () => {
    state.touches = ["eventA", "eventB", "eventC"];
    state.cursor = { pos: 0, at: 0, max: 2 };

    let { state: newState } = reduceAndExtract(state, { type: Core.MSG.NAVIGATE, payload: { command: "goto", value: 2 } });
    assertEquals(newState.cursor.pos, 2);
    assertEquals(newState.cursor.at, 2);

    ({ state: newState } = reduceAndExtract(state, { type: Core.MSG.NAVIGATE, payload: { command: "goto", value: "eventB" } }));
    assertEquals(newState.cursor.pos, 1);
    assertEquals(newState.cursor.at, 1);
  });

  it("should emit STOP_TIMER effect when navigating while timer is active", () => {
    state.timerActive = true;
    const { effects } = reduceAndExtract(state, { type: Core.MSG.NAVIGATE, payload: { command: "forward" } });
    assertExists(effects);
    assertEquals(effects.length, 1);
    assertEquals(effects[0].type, Core.EFFECT.STOP_TIMER);
  });

  it("should handle FFWD message and emit START_TIMER effect", () => {
    state.touches = ["a", "b", "c"];
    state.cursor = { pos: 0, at: 0, max: 2 };
    const { state: newState, effects } = reduceAndExtract(state, { type: Core.MSG.FFWD });
    assertEquals(newState.timerActive, true);
    assertExists(effects);
    assertEquals(effects.length, 1);
    assertEquals(effects[0].type, Core.EFFECT.START_TIMER);
    assertEquals(effects[0].payload.interval, 1000);
  });

  it("should not start timer if already at present or timer is active", () => {
    state.touches = ["a", "b", "c"];
    state.cursor = { pos: 2, at: 2, max: 2 }; // At present
    let { state: newState, effects } = reduceAndExtract(state, { type: Core.MSG.FFWD });
    assertEquals(newState.timerActive, false);
    assertEquals(effects, undefined); // No effects should be emitted

    state.cursor = { pos: 0, at: 0, max: 2 };
    state.timerActive = true; // Timer already active
    ({ state: newState, effects } = reduceAndExtract(state, { type: Core.MSG.FFWD }));
    assertEquals(newState.timerActive, true);
    assertEquals(effects, undefined); // No effects should be emitted
  });

  it("should handle STOP_FFWD message and emit STOP_TIMER effect", () => {
    state.timerActive = true;
    const { state: newState, effects } = reduceAndExtract(state, { type: Core.MSG.STOP_FFWD });
    assertEquals(newState.timerActive, false);
    assertExists(effects);
    assertEquals(effects.length, 1);
    assertEquals(effects[0].type, Core.EFFECT.STOP_TIMER);
  });

  it("should handle ISSUE_MOVE message and emit ISSUE_MOVE effect", () => {
    state.tableId = "test-table";
    state.seat = 0;
    state.accessToken = "test-token";
    const commands = [{ type: "move", details: {} }];
    const { state: newState, effects } = reduceAndExtract(state, { type: Core.MSG.ISSUE_MOVE, payload: { commands } });
    assertEquals(newState.ready, false);
    assertExists(effects);
    assertEquals(effects.length, 1); // Expect only ISSUE_MOVE if timer is not active
    assertEquals(effects[0].type, Core.EFFECT.ISSUE_MOVE);
    assertEquals(effects[0].payload.moveTableId, "test-table");
    assertEquals(effects[0].payload.moveSeat, 0);
    assertEquals(effects[0].payload.commands, commands);
    assertEquals(effects[0].payload.moveAccessToken, "test-token");
  });

  it("should stop timer when ISSUE_MOVE is dispatched", () => {
    state.timerActive = true;
    const commands = [{ type: "move", details: {} }];
    const { state: newState, effects } = reduceAndExtract(state, { type: Core.MSG.ISSUE_MOVE, payload: { commands } });
    assertEquals(newState.timerActive, false);
    assertExists(effects);
    assertEquals(effects.length, 2); // Expect STOP_TIMER and ISSUE_MOVE
    assertEquals(effects[0].type, Core.EFFECT.STOP_TIMER);
    assertEquals(effects[1].type, Core.EFFECT.ISSUE_MOVE);
  });

  it("should handle ADD_PERSPECTIVE message", () => {
    const perspective = { event: { id: "e1" }, state: {} };
    const { state: newState } = reduceAndExtract(state, { type: Core.MSG.ADD_PERSPECTIVE, payload: { eventId: "e1", perspective } });
    assertEquals(newState.perspectives["e1"], perspective);
  });

  it("should handle CLEAR_CACHE message", () => {
    state.perspectives = { "e1": {}, "e2": {} };
    const { state: newState } = reduceAndExtract(state, { type: Core.MSG.CLEAR_CACHE });
    assertEquals(newState.perspectives, {});
  });

  it("getCurrentEventId should return correct event ID", () => {
    state.touches = ["a", "b", "c"];
    state.cursor = { pos: 1, at: 1, max: 2 };
    assertEquals(Core.getCurrentEventId(state), "b");
  });

  it("getCurrentPerspective should return correct perspective", () => {
    state.touches = ["a", "b"];
    state.cursor = { pos: 1, at: 1, max: 1 };
    state.perspectives = { "a": { data: "p1" }, "b": { data: "p2" } };
    assertEquals(Core.getCurrentPerspective(state), { data: "p2" });
  });

  it("getCurrentGameInstance should return a game instance if all data is present", () => {
    state.touches = ["e1"];
    state.cursor = { pos: 0, at: 0, max: 0 };
    state.perspectives = { "e1": { event: { id: "e1" }, state: { board: "initial" } } };
    state.gameMake = mockGameMake;
    state.seated = [{ id: 1 }];
    state.config = { game: "test" };

    const gameInstance = Core.getCurrentGameInstance(state);
    assertExists(gameInstance);
    assertEquals(gameInstance.type, "MockGameInstance");
    assertEquals(gameInstance.state, { board: "initial" });
  });

  it("atPresent should return true if cursor is at max", () => {
    state.cursor = { pos: 2, at: 2, max: 2 };
    assertEquals(Core.atPresent(state), true);
  });

  it("atPresent should return false if cursor is not at max", () => {
    state.cursor = { pos: 1, at: 1, max: 2 };
    assertEquals(Core.atPresent(state), false);
  });
});

describe("Reel Shell", () => {
  let dispatchCalls;
  let shell;

  beforeEach(() => {
    dispatchCalls = [];
    const mockDispatch = (msg) => dispatchCalls.push(msg);
    shell = createReelShell(Core.initialState, mockDispatch);
  });

  it("should create shell and expose interpretEffect", () => {
    assertExists(shell.interpretEffect);
    assertExists(shell.state);
  });

  it("should handle FETCH_TABLE effect and dispatch relevant messages", async () => {
    dispatchCalls = []; // Clear dispatches before this test
    await shell.interpretEffect({ type: Core.EFFECT.FETCH_TABLE, payload: "test-table-id" });

    // Expected: SET_TABLE_ID, SET_CONFIG, SET_SEATED, SET_READY(false), FETCH_GAME_MAKE
    assertEquals(dispatchCalls.length, 4); // Only direct dispatches from FETCH_TABLE
    assertEquals(dispatchCalls[0].type, Core.MSG.SET_TABLE_ID);
    assertEquals(dispatchCalls[0].payload, "test-table-id");
    assertEquals(dispatchCalls[1].type, Core.MSG.SET_CONFIG);
    assertEquals(dispatchCalls[1].payload.game, "backgammon");
    assertEquals(dispatchCalls[2].type, Core.MSG.SET_SEATED);
    assertEquals(dispatchCalls[3].type, Core.MSG.SET_READY);
    assertEquals(dispatchCalls[3].payload, false);
    // FETCH_GAME_MAKE is an interpretEffect call, not a direct dispatch to mockDispatch
  });

  it("should handle FETCH_TOUCHES effect and dispatch SET_TOUCHES", async () => {
    dispatchCalls = []; // Clear dispatches before this test
    await shell.interpretEffect({ type: Core.EFFECT.FETCH_TOUCHES, payload: "test-table-id" });
    assertEquals(dispatchCalls.length, 1);
    assertEquals(dispatchCalls[0].type, Core.MSG.SET_TOUCHES);
    assertEquals(dispatchCalls[0].payload, ["event1", "event2", "event3"]);
  });

  it("should handle FETCH_PERSPECTIVE effect and dispatch ADD_PERSPECTIVE", async () => {
    dispatchCalls = []; // Clear dispatches before this test
    const payload = { tableId: "t1", eventId: "e1", seat: 0, seatId: "s1" };
    await shell.interpretEffect({ type: Core.EFFECT.FETCH_PERSPECTIVE, payload });
    assertEquals(dispatchCalls.length, 1);
    assertEquals(dispatchCalls[0].type, Core.MSG.ADD_PERSPECTIVE);
    assertEquals(dispatchCalls[0].payload.eventId, "e1");
    assertExists(dispatchCalls[0].payload.perspective);
  });

  it("should use cached perspective if available and noCache is false", async () => {
    dispatchCalls = []; // Clear dispatches before this test
    const payload = { tableId: "t1", eventId: "e1", seat: 0, seatId: "s1" };
    // Manually add a perspective to the shell's internal state for caching
    $.reset(shell.state, {
      ...Core.initialState,
      perspectives: { "e1": { event: { id: "e1" }, state: { board: "cached" } } }
    });

    await shell.interpretEffect({ type: Core.EFFECT.FETCH_PERSPECTIVE, payload });
    assertEquals(dispatchCalls.length, 1);
    assertEquals(dispatchCalls[0].type, Core.MSG.ADD_PERSPECTIVE);
    assertEquals(dispatchCalls[0].payload.perspective.state, { board: "cached" });
  });

  it("should fetch perspective even if cached when noCache is true", async () => {
    dispatchCalls = []; // Clear dispatches before this test
    const payload = { tableId: "t1", eventId: "e1", seat: 0, seatId: "s1" };
    // Manually add a perspective to the shell's internal state for caching
    $.reset(shell.state, {
      ...Core.initialState,
      perspectives: { "e1": { event: { id: "e1" }, state: { board: "cached" } } }
    });

    const noCacheShell = createReelShell(Core.initialState, (msg) => dispatchCalls.push(msg), { noCache: true });
    await noCacheShell.interpretEffect({ type: Core.EFFECT.FETCH_PERSPECTIVE, payload });
    assertEquals(dispatchCalls.length, 1);
    assertEquals(dispatchCalls[0].type, Core.MSG.ADD_PERSPECTIVE);
    assertEquals(dispatchCalls[0].payload.perspective.state, { board: "mock-board-state" }); // Should be fetched, not cached
  });

  it("should not store perspective if noStore is true", async () => {
    dispatchCalls = []; // Clear dispatches before this test
    const payload = { tableId: "t1", eventId: "e1", seat: 0, seatId: "s1" };
    const noStoreShell = createReelShell(Core.initialState, (msg) => dispatchCalls.push(msg), { noStore: true });
    await noStoreShell.interpretEffect({ type: Core.EFFECT.FETCH_PERSPECTIVE, payload });
    assertEquals(dispatchCalls.length, 0); // ADD_PERSPECTIVE should not be dispatched
  });

  it("should handle FETCH_GAME_MAKE effect and dispatch SET_GAME_MAKE", async () => {
    dispatchCalls = []; // Clear dispatches before this test
    await shell.interpretEffect({ type: Core.EFFECT.FETCH_GAME_MAKE, payload: "backgammon-game-id" });
    assertEquals(dispatchCalls.length, 2); // SET_GAME_MAKE, SET_READY(true)
    assertEquals(dispatchCalls[0].type, Core.MSG.SET_GAME_MAKE);
    assertExists(dispatchCalls[0].payload); // Should be mockGameMake
    assertEquals(dispatchCalls[1].type, Core.MSG.SET_READY);
    assertEquals(dispatchCalls[1].payload, true);
  });

  it("should handle ISSUE_MOVE effect and dispatch SET_READY and FETCH_TOUCHES", async () => {
    dispatchCalls = []; // Clear dispatches before this test
    const payload = { moveTableId: "t1", moveSeat: 0, commands: [{ type: "move" }], moveAccessToken: "token" };
    await shell.interpretEffect({ type: Core.EFFECT.ISSUE_MOVE, payload });
    assertEquals(dispatchCalls.length, 3); // SET_READY(false), FETCH_TOUCHES, SET_READY(true)
    assertEquals(dispatchCalls[0].type, Core.MSG.SET_READY);
    assertEquals(dispatchCalls[0].payload, false);
    assertEquals(dispatchCalls[1].type, Core.EFFECT.FETCH_TOUCHES);
    assertEquals(dispatchCalls[1].payload, "t1");
    assertEquals(dispatchCalls[2].type, Core.MSG.SET_READY);
    assertEquals(dispatchCalls[2].payload, true);
  });

  it("should handle START_TIMER effect and start the timer", async () => {
    dispatchCalls = []; // Clear dispatches before this test
    // Mock shellState.deref() to return a state where timer is not active and not at present
    $.reset(shell.state, {
      ...Core.initialState,
      timerActive: false,
      cursor: { pos: 0, at: 0, max: 2 } // Not at present
    });

    await shell.interpretEffect({ type: Core.EFFECT.START_TIMER, payload: { interval: 10 } });
    // Timer starts, and on first tick, it dispatches NAVIGATE forward
    // We need to wait for a tick
    await new Promise(resolve => setTimeout(resolve, 15)); // Wait for a tick

    assertEquals(dispatchCalls.length, 1);
    assertEquals(dispatchCalls[0].type, Core.MSG.NAVIGATE);
    assertEquals(dispatchCalls[0].payload.command, "forward");
  });

  it("should handle STOP_TIMER effect and stop the timer", async () => {
    dispatchCalls = []; // Clear dispatches before this test
    // Start a timer first
    await shell.interpretEffect({ type: Core.EFFECT.START_TIMER, payload: { interval: 10 } });
    dispatchCalls = []; // Clear calls from START_TIMER

    await shell.interpretEffect({ type: Core.EFFECT.STOP_TIMER });
    // No dispatch calls expected from stopping the timer itself
    assertEquals(dispatchCalls.length, 0);
  });
});
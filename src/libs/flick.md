# Flick Application - Product Requirements Document (PRD) - Revised

## 1. Introduction

This document outlines the requirements for the `flick` application. `Flick` is a system designed to manage the *story* or *history* of a board game, providing a persistent, auditable, and navigable view of game state transitions. It is built strictly according to the "Atomic Way" principles, emphasizing pure functional state management and a clear separation of concerns between the functional core and the imperative shell.

`Flick` is *not* a game itself, nor does it implement the `g.IGame` interface. Instead, it provides the foundational state management for observing and interacting with game history, much like a "storyteller" for a game. The `core.js` examples (Backgammon, Mexica, Up-Down) were provided to illustrate the *pure functional approach to managing state swaps in an atom*, specifically how **commands are vetted and realized as events** which are then applied functionally to the model.

## 2. The Atomic Way - Core Principles (Re-emphasized for `Flick`)

The "Atomic Way" as applied here emphasizes immutability, pure functions, and a clear separation of concerns between the functional core logic and imperative side effects.

### 2.1. Functional Core (`flick.js`)

*   **Purpose:** To manage the application's state (the "story" of the game) and define how this state evolves in response to messages. It is purely functional and has no side effects.
*   **State:** The application state is represented as structured data (objects and arrays). All state updates must treat these data structures as persistent, meaning new objects/arrays are created with edits, reusing prior data safely.
*   **Reducer (Command-Event Processor):** The core logic is encapsulated in a single, pure `reducer` function with the signature: `(state, command) => ({ state: newState, events: newEvents })`.
    *   `state`: The current application state.
    *   `command`: A "command" object (e.g., `{ type: "roll", seat: 0 }`) dispatched by the shell, describing an intent. The `type` property of commands and events should always be lowercase.
    *   **Command Vetting and Event Realization:** The `reducer` is responsible for *validating* incoming `commands` against the current `state`. If a command is valid, it is "realized" as an "event" (e.g., `{ type: "rolled", details: { dice: [1, 2] } }`). This event is then used to compute the `newState`. Invalid commands will prevent state transitions, upholding the "Making Illegal States Unrepresentable" principle.
    *   `newState`: The new, immutable state derived from the current state and the *realized event*.
    *   `newEvents`: An array of "events" (declarative descriptions of side effects) that the shell should execute. These events are often a direct result of the realized event.
*   **Immutability:** All state transformations must be immutable. No direct modification of the `state` object or its nested properties.
*   **No Side Effects:** The `reducer` function must not perform any I/O operations, network requests, or modify external systems. Its sole responsibility is to vet commands, compute the next state based on realized events, and declare necessary effects.
*   **Making Illegal States Unrepresentable:** Design the state and reducer such that invalid or inconsistent states cannot be created through valid messages (commands). This often involves careful data modeling and validation within the reducer.

### 2.2. Imperative Shell (`flicker-shell.js`)

*   **Purpose:** To manage the application's `$flick` (the mutable container for the immutable state) and execute side effects declared by the functional core.
*   **Atom Management:**
    *   Uses `$.atom` (from `atomic_`) to create a mutable reference to the application's immutable state, initialized with `flick.initialState`. This atom will be named `$flick`.
    *   Uses `$.swap($flick, flick.reducer, command)` for all state updates. This ensures the `reducer` is always called with the current state and the new command, and the atom is updated with the `newState` returned by the reducer.
*   **Event Execution:**
    *   Subscribes to changes in the `$flick`'s state using `$.sub`.
    *   When the state changes, it inspects the `events` array returned by the `reducer`.
    *   For each event, it calls an appropriate asynchronous "event handler" function.
    *   Crucially, event handlers *return new commands* (if any) based on the outcome of the side effect (e.g., `table_loaded` after a fetch).
    *   These returned commands are then `$.swap`'d back into the `$flick`, triggering further state updates and potentially new events.
    *   After processing all events from a given state update and dispatching any resulting messages, the shell *must* dispatch an `events_executed` command to the `$flick`. This command's purpose is for the `flick.reducer` to clear the `events` array in the state, preventing redundant processing.

## 3. Application Components

### 3.1. `flick.js` (Functional Core)

This module defines the `initialState` and the `reducer` function for the `Flick` application.

*   **`initialState`:**
    ```javascript
    {
      tableId: null,
      seat: null,
      session: null, // User session/auth token
      initialAt: null, // Optional eventId to jump to on load
      table: null, // Table data
      seated: null, // Seated players data
      game: null, // Game metadata
      module: null, // Dynamically loaded game module (contains 'make' function)
      touches: null, // List of event IDs (history)
      perspectives: {}, // Cache: eventId -> perspective object
      cursor: { pos: 0, at: null, max: 0 }, // Current position in history
      noCache: false, // Flag to bypass perspective cache
      noStore: false, // Flag to prevent storing perspectives in cache
      events: [] // Declarative list of side effects for the shell to execute
    }
    ```
*   **`reducer` Commands & State Transitions:**
    *   **`init`**:
        *   Payload: `{ tableId, seat, session, at, noCache, noStore }`
        *   Updates `tableId`, `seat`, `session`, `initialAt`, `noCache`, `noStore` in state.
        *   Events: `fetch_table`, `fetch_seated`, `log` (for initialization).
    *   **`table_loaded`**:
        *   Payload: `{ table }`
        *   Updates `state.table`.
        *   Events: `log`, `subscribe_to_table_channel`, `fetch_touches`, `fetch_game`.
    *   **`seated_loaded`**:
        *   Payload: `{ seated }`
        *   Updates `state.seated`.
        *   Events: `log`.
    *   **`game_loaded`**:
        *   Payload: `{ game }`
        *   Updates `state.game`.
        *   Events: `log`.
    *   **`game_module_loaded`**:
        *   Payload: `{ make }` (the `make` function from the game module)
        *   Updates `state.module`.
        *   Events: `log`.
    *   **`touches_loaded`**:
        *   Payload: `{ touches }` (e.g., `{ touches: ["id1", "id2", ...], undoables: null, last_acting_seat: "seatId" }`)
        *   Updates `state.touches`.
        *   Calculates `cursor.max` and `cursor.pos` (based on `initialAt` if present, otherwise to the latest touch).
        *   Updates `state.cursor` (`pos`, `at`, `max`).
        *   Events: `log`, `check_cache_and_fetch` (for the new `cursor.at`).
        *   If `state.module` is null and `state.game` is available, also generates `fetch_game_module`.
    *   **`navigate_to`**:
        *   Payload: `{ pos, at }` (either `pos` or `at` is provided)
        *   Updates `state.cursor` (`pos`, `at`) based on the payload. `at: Infinity` should navigate to `cursor.max`.
        *   Events: `log`, `check_cache_and_fetch` (for the new `cursor.at`).
    *   **`step`**:
        *   Payload: `{ delta }` (`+1` or `-1`)
        *   Updates `state.cursor` (`pos`, `at`) by clamping `pos + delta` within `0` and `max`.
        *   Events: `log`, `check_cache_and_fetch` (for the new `cursor.at`).
    *   **`perspective_loaded`**:
        *   Payload: `{ eventId, perspective }`
        *   If `!state.noStore`, stores `perspective` in `state.perspectives[eventId]`.
        *   If `state.module.make` is available and `perspective.event` and `perspective.state` exist, uses `state.module.make` to enhance the `perspective` object with `game` and `actor` properties before storing.
        *   Events: `log`.
    *   **`clear_cache`**:
        *   Clears `state.perspectives` (sets to `{}`).
        *   Events: None.
    *   **`table_updated`**:
        *   Payload: `{ table }`
        *   Updates `state.table`.
        *   Events: `fetch_touches` (to refresh history).
    *   **`events_executed`**:
        *   Clears `state.events` (sets to `[]`).
        *   Events: None.

### 3.2. `flicker-shell.js` (Imperative Shell)

*   **Dependencies:** `atomic_/core.js`, `atomic_/shell.js`, `flick.js`.
*   **`$flick`:** `const $flick = $.atom(flick.initialState);`
*   **`$.sub` Callback:**
    *   Monitors `$flick` for state changes.
    *   Extracts `newState.events`.
    *   Asynchronously processes each event using dedicated `handleEvent` functions.
    *   Collects messages returned by `handleEvent` functions.
    *   Dispatches collected messages back to `$flick` using `$.swap($flick, flick.reducer, command)`.
    *   Finally, dispatches `{ type: "events_executed" }` to clear the `events` array in the state, preventing redundant processing.
*   **Event Handlers (Asynchronous):**
    *   **`handleLogEvent(payload)`:** Logs `payload.topic` and `payload.data` using `Deno.inspect` for pretty printing. Returns `null`.
    *   **`handleFetchTouchesEvent(payload)`:** Mocks API call. Returns `{ type: "touches_loaded", payload: { touches: mockedTouches } }`.
    *   **`handleFetchPerspectiveEvent(payload)`:** Mocks API call. Returns `{ type: "perspective_loaded", payload: { eventId, perspective: mockedPerspective } }`.
    *   **`handleFetchGameModuleEvent(payload)`:** Dynamically imports `../games/${payload.gameId}/module.js`. Returns `{ type: "game_module_loaded", payload: { make: module.make } }`.
    *   **`handleFetchTableEvent(payload)`:** Mocks API call. Returns `{ type: "table_loaded", payload: { table: mockedTable } }`.
    *   **`handleFetchSeatedEvent(payload)`:** Mocks API call. Returns `{ type: "seated_loaded`, payload: { seated: mockedSeated } }`.
    *   **`handleFetchGameEvent(payload)`:** Mocks API call. Returns `{ type: "game_loaded", payload: { game: mockedGame } }`.
    *   **`handleSubscribeToTableChannelEvent(payload)`:** Placeholder, logs a warning. Returns `null`.
*   **Public API (`shellApi`):**
    *   `$flick`: Exposes `$flick` directly.
    *   `run(options)`: Dispatches `{ type: "init", payload: options }` to `$flick`.

### 3.3. `flicker-cli.js` (Interactive CLI)

*   **Dependencies:** `cliffy` (`Command`, `keypress`), `atomic_/core.js`, `atomic_/shell.js`, `flick.js`, `flicker-shell.js`.
*   **`prettyLog(obj)`:** Custom function for pretty printing objects, especially large collections like `perspectives`, `touches`, `seated`, `events` with compact output.
*   **`displayHelpMenu()`:** Prints the interactive controls menu.
*   **`interactiveMode()`:**
    *   Enters an asynchronous loop to listen for keypress events.
    *   Handles `q` or `escape` to exit the application (`Deno.exit(0)`).
    *   Retrieves current state: `const state = _.deref(shell.$flick).state;`
    *   **Key Bindings:**
        *   `s`: Prints full `state` object using `prettyLog`.
        *   `p`: Prints current `perspective` (from `state.perspectives[state.cursor.at]`) using `prettyLog`.
        *   `c`: Prints `state.cursor` using `prettyLog`.
        *   `t`: Prints `state.touches` using `prettyLog`.
        *   `h` or `?`: Displays the help menu.
        *   `left` arrow: Dispatches `{ type: "step", payload: { delta: -1 } }`.
        *   `right` arrow: Dispatches `{ type: "step", payload: { delta: 1 } }`.
        *   `home`: Dispatches `{ type: "navigate_to", payload: { pos: 0 } }`.
        *   `end`: Dispatches `{ type: "navigate_to", payload: { at: Infinity } }`.
*   **`when(predicate)`:**
    *   Returns a `Promise` that resolves when the `predicate` function returns `true` for the `shell.$flick`'s nested state.
    *   Uses `$.sub` internally to listen for state changes and unsubscribes once the predicate is met.
*   **`Command` Setup (using `cliffy`):**
    *   Defines `flicker` command with description.
    *   **Options:**
        *   `-t, --table-id <id:string>` (required)
        *   `-s, --seat <seat:number>` (required)
        *   `-a, --at <at:string>` (optional, event ID or "present")
        *   `-i, --interactive` (optional, boolean flag)
    *   **`action` Callback:**
        *   Retrieves `SUPABASE_SESSION_ACCESS_TOKEN` from environment for `session`.
        *   Logs "Initializing flick...".
        *   Sets up a `$.sub` listener to log `[pos/max] at: eventId` whenever `state.cursor.at` changes.
        *   Calls `shell.run({ ...options, session })` to kick off initialization.
        *   If `options.interactive` is true:
            *   Uses `when(state => state && state.touches && state.cursor && state.cursor.at !== null && state.perspectives[state.cursor.at])` to wait for a fully loaded and initialized state (including current perspective).
            *   Then calls `interactiveMode()`.
        *   If not interactive:
            *   Uses the same `when` predicate.
            *   Then prints "--- INITIAL STATE ---" and `prettyLog(state)`, then `Deno.exit(0)`.

## 4. Mock Data (for `flicker-shell.js` event handlers)

*   **`mockedTouches`:**
    ```javascript
    {
      touches: ["rm46O", "NqHg9", ..., "VzL1h"], // ~100 event IDs
      undoables: null,
      last_acting_seat: "3PD"
    }
    ```
*   **`mockedPerspective`:** (for a given `eventId`)
    ```javascript
    {
      up: [0], may: [0], seen: [0],
      event: { id: eventId, seat: null, type: "started", details: null },
      state: { /* simplified backgammon state */ },
      metrics: [/* simplified metrics */],
      last_move: null,
      game: { seats: [], config: {}, events: [], state: {} }, // Simplified for mock
      actor: { seat_id: "3PD", username: "capnemo", player_id: "...", avatar_url: "...", delegate_id: null }
    }
    ```
*   **`mockedTable`:**
    ```javascript
    {
      id: tableId, game_id: "backgammon", seating: "random", up: 0,
      started_at: "...", last_touch_id: "VzL1h", finished_at: null,
      config: { raiseStakes: false }, status: "started", created_by: "...",
      created_at: "...", touched_at: "...", release: "uJl",
    }
    ```
*   **`mockedSeated`:**
    ```javascript
    [
      { seat_id: "3PD", username: "capnemo", player_id: "...", avatar_url: "...", delegate_id: null },
      { seat_id: "kmK", username: "frodobaggins", player_id: "...", avatar_url: "...", delegate: null },
    ]
    ```
*   **`mockedGame`:**
    ```javascript
    {
      id: gameId, title: "Backgammon", slug: "backgammon", seats: [2],
      thumbnail_url: "/images/games/backgammon.png", created_at: "...",
      status: "up", release: "uJl", move_prompt: "..."
    }
    ```

## 5. Key Learnings & Corrections (Harmonized)

*   **`Flick` is a Functional Core:** `Flick` manages the application state (the game's story) through a pure `reducer` function, returning `newState` and `events`. It is *not* a `g.IGame` object.
*   **`reducer(state, msg) => ({ state: newState, events: newEvents })` is Central:** This is the fundamental pattern for state transitions in `flick.js`.
*   **Shell's Role in Events:** The shell's `$.sub` callback monitors the atom for `events` returned by the `flick.reducer`. It executes the actual impure side effects (network calls, dynamic imports) and then translates their results back into `messages` for `flick.reducer`.
*   **`EventsExecuted` Message:** Essential for the shell to signal to the core that events have been processed, allowing the core to clear the `events` array in the state.
*   **`when` Function Robustness:** The `when` function needs to be robust against intermediate state updates and ensure the predicate is evaluated against a stable, fully populated state. The predicate should check for all necessary state properties to be present and non-null.
*   **`atomic` Signal Arguments:** Subscription callbacks to `atomic` signals (`$.sub`) receive arguments as `(newState, oldState)` directly, not via array destructuring.
*   **Deno `Deno.inspect`:** Use `Deno.inspect` for pretty printing objects in logs, especially with `colors: true` and `compact: true` for brevity.
*   **`cliffy` `action` Context:** Be mindful of how `cliffy`'s `action` callback executes. Module-level imports like `shell` might not be directly accessible without explicit capture (e.g., via an IIAFE or passing as an argument).

---
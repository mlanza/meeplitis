# Product Requirements Document: Reel Timeline Navigation

## 1. Introduction and Purpose

This document specifies the design and functionality of the "Reel" timeline navigation component, a core module for a board game site. The primary goal is to replace an existing `reel.js` tool with a new implementation that adheres to the principles outlined in the Atomic [AGENTS file](https://github.com/mlanza/atomic/AGENTS.md). This component provides robust, observable, and verifiable timeline navigation for game states, serving as a crucial artifact for future frontend integration. It emphasizes a functional core and imperative shell (FCIS) architecture, with the core designed for purity and the shell handling side effects.

## 2. Core Concepts

### 2.1 The Reel Component
The Reel component models the timeline of a board game. It simulates loading snapshots of game states, allowing users to navigate through the history of a game. The core is built around a single `atom` as its state container, with side effects managed by `main.js` and `cli.js`.

### 2.2 Timeline and Perspectives
*   **Timeline:** A sequence of game events (`touches`), each identified by a unique event ID (short hash).
*   **Perspective:** For each event on the timeline, there is a corresponding "perspective" – a point-in-time snapshot of game data visible to a specific player at a specific seat. This data is sourced from the backend.
*   **`state.perspectives`:** A cache within the core state that stores loaded perspectives, keyed by their event ID (`at`). This cache is the source of truth for perspectives. A separate `state.currentPerspective` is explicitly avoided as the current perspective is always derivable from `state.perspectives` and `cursor.at`.

## 3. State Model

The core state of the Reel component is managed by an `atom` and includes the following key attributes:

*   **`id` (string):** The identifier of the game table.
*   **`seat` (number | null):** The seat number of the player, if applicable.
*   **`timeline` (object | null):** Contains the game's event history (`touches` array) and other timeline-related data.
*   **`seated` (array):** Information about seated players.
*   **`cursor` (object):** Manages the user's position within the timeline.
    *   **`pos` (number | null):** The integer index of the current event within the `timeline.touches` array. This is a 0-based index.
    *   **`at` (string | null):** The event ID (a hashcode from the database) corresponding to the current `pos`. This value is always one of the entries in the `timeline.touches` array.
    *   **`max` (number | null):** The maximum valid `pos` (i.e., `timeline.touches.length - 1`).
    *   **`direction` (number):** Indicates the current navigation orientation, anticipating the user's next likely action.
        *   `FORWARD` (1): Moving towards the present.
        *   `BACKWARD` (-1): Moving towards the past.
        *   Initially `BACKWARD` (when at `present`). If `pos` is at `inception` (0), `direction` becomes `FORWARD`. When stepping backward, `direction` is `BACKWARD`. When stepping forward, `direction` is `FORWARD`.
*   **`perspectives` (object):** A cache for loaded game perspectives, keyed by event ID.
*   **`error` (any | null):** Stores any error information.
*   **`ready` (boolean):** Indicates if the initial timeline and perspective loading is complete. Initialized to `false`, set to `true` upon completion of initial data fetching.

## 4. Core Functions

The functional core (`core.js`) provides pure functions for state manipulation:

*   **`init(id, seat)`:** Initializes the Reel component's state.
*   **`loadSeated(state, seated)`:** Updates the `seated` players in the state.
*   **`loadTimeline(state, timeline)`:** Loads the game timeline, calculates `max`, and initializes/updates the `cursor`'s `pos`, `at`, and `direction` transactionally.
*   **`loadPerspective(state, at, perspective)`:** Stores a given `perspective` into the `state.perspectives` cache at the specified `at` (event ID). The `at` argument is explicitly accepted.
*   **`isPosValid(state, pos)`:** A pure helper function that checks if a given `pos` is within `[0, state.cursor.max]` bounds and if the perspective for the corresponding `at` is already present in `state.perspectives`.
*   **`reposition(state, pos)`:** The central navigation function. It takes a target `pos`. If `isPosValid` returns `false`, it returns the original state, preventing invalid moves. Otherwise, it updates `cursor.pos` and `cursor.at`.
*   **`inception(state)`:** Navigates to the beginning of the timeline (`pos: 0`). Internally calls `reposition`. (Renamed from `to_start`).
*   **`present(state)`:** Navigates to the current moment (`pos: state.cursor.max`). Internally calls `reposition`. (Renamed from `to_end`).
*   **`forward(state)`:** Moves the cursor one step forward (`pos + 1`). Internally calls `reposition`.
*   **`backward(state)`:** Moves the cursor one step backward (`pos - 1`). Internally calls `reposition`.
*   **`at(state, pos)`:** Navigates directly to a specified `pos` (event ID index). It calls `reposition` and then transactionally sets `cursor.direction` to `FORWARD`.

## 5. Imperative Shell (CLI Interface)

The CLI (`cli.js`) acts as the imperative shell, wrapping the core and providing interaction mechanisms. Its design and principles adhere to the guidelines in the Atomic [CLI Implementation Roadmap](https://github.com/mlanza/atomic/agents/cli.md).

### 5.1 Initialization and Readiness
*   The `bootstrap` function (in `main.js`) initializes the core state and asynchronously fetches the initial timeline and perspective data.
*   The CLI waits for the `bootstrap` process to complete and `state.ready` to become `true` before executing any commands.

### 5.2 Commands and Options
The `reel` CLI supports the following:

*   **`reel <table:string>`:** The primary command, requiring a table ID.
*   **`--seat <seat:number>`:** Optional. Specifies the seat number.
*   **`-i, --interactive`:** Runs the CLI in interactive mode, allowing keypress navigation.
*   **`-c, --command <command:string>`:** Executes one or more commands in order. This option can be specified multiple times to execute a sequence of commands.
*   **`--inception`:** Jumps to the initial game state (`pos: 0`).
*   **`--present`:** Jumps to the current moment (`pos: state.cursor.max`).
*   **`--at <event_id:string>`:** Jumps directly to a specific event ID.
*   **`--timeout <seconds:number>`:** Forces the CLI to exit after the specified number of seconds.

### 5.3 Navigation and Pre-caching
*   **Shell-side Navigation Logic:** The `navigateTo` helper in `main.js` handles navigation requests. Before calling `reposition` in the core, it checks if the target perspective is cached. If not, it fetches the perspective (`getPerspective`) and loads it into the `state.perspectives` cache.
*   **Pre-caching:** A subscription actively monitors `cursor.direction` to anticipate the next step and pre-load the corresponding perspective into the cache, improving navigation responsiveness.

## 6. Ambiguities and Resolutions

### 6.1 `perspective` vs `perspectives` in State
*   **Ambiguity:** Initial PRD statements suggested not wanting a "perspective address" in the state, while later sections referred to "cached perspective" and "loading into cache."
*   **Resolution:** `state.perspectives` (the cache of all loaded perspectives, keyed by event ID) is intended to remain as the source of truth. The "unneeded" `perspective` refers to a *separate* attribute in the state that would hold only the *current* perspective. Such an attribute is redundant because the current perspective can always be derived from `state.perspectives` using `cursor.at`. The `loadPerspective` function signature is correct, with `perspective` being the data to be cached.

### 6.2 `cursor.at` Validity and "Make Illegal States Unrepresentable"
*   **Ambiguity:** Previous testing with mocked data led to `cursor.at` values like "event_0", which are not actual database hashcodes.
*   **Resolution:** Adhering to the "Make Illegal States Unrepresentable" principle, `cursor.at` must *always* contain a valid event ID (hashcode) that exists within the `timeline.touches` array. Furthermore, it must not be possible for the cursor to point to a perspective that is not yet present in the `state.perspectives` cache. The `isPosValid` function and the `reposition` logic (which prevents moves to invalid positions or uncached perspectives) are critical in enforcing this invariant.

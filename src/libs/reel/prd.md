# reel/prd.md - Product notes and scratchpad for the reel component

## Objective

Replace the existing `reel` component with a new one built the Atomic way, strictly separating core (pure logic) from shell (effects) while maintaining feature parity. The console interface remains a Cliffy CLI, mirroring `reel`’s commands and arguments.

## Research Inputs

To understand the existing behavior and identify data dependencies and signal paths, the following files need to be studied:
- The existing `reel.js`
- `table.js`
- `story.js`
- `main.js` for Backgammon, including all its imports

### Existing `reel.js` Analysis

The existing `reel.js` is a Deno-based CLI tool that allows users to navigate and interact with the history of a game table. It leverages reactive programming primitives from `atomic_/core.js` (aliased as `_`) and `atomic_/shell.js` (aliased as `$`) for state management and side effects. It heavily relies on Supabase for data persistence, real-time updates, and serverless functions.

**Key Functionality:**

1.  **State Management:** Utilizes `$.atom` and `$.map` to create reactive streams for various pieces of state, including:
    *   `$table`: Current state of the game table, fetched from Supabase and updated via real-time subscriptions.
    *   `$seated`, `$seats`: Information about seated players, fetched via Supabase functions.
    *   `$touches`: A timeline of game events/snapshots, fetched from Supabase functions.
    *   `$pos`, `$at`, `$max`: Cursor position within the `$touches` timeline. `$pos` is the raw position, `$max` is the last valid index, and `$at` is `$pos` clamped between `0` and `$max`.
    *   `$perspectives`: An in-memory cache (using `$.atom({})`) for fetched game perspectives.
    *   `$perspective`: The currently active perspective, derived from `$perspectives` and `$touch`.
    *   `$game`: Details about the game being played on the table.
    *   `$maker`: A reactive URL for dynamically importing the game-specific core module.
    *   `$makes`: The game constructor function obtained from the dynamically imported module.
    *   `$ready`, `$error`: Status indicators for UI feedback.
    *   `$timer`: A `pacemaker`-based timer for auto-advancing the timeline.
    *   `$state`: An aggregated observable representing the entire state of the reel, combining many of the above.

2.  **Data Interaction (Supabase):**
    *   Fetches `tables`, `games`, `seated`, `seats`, `touches`, and `perspective` data using Supabase client and serverless functions (`getfn`).
    *   Subscribes to `postgres_changes` on the `tables` table for real-time updates.
    *   Issues game moves via a Supabase function (`move`).

3.  **Cursor Navigation:**
    *   Allows navigation through the `$touches` timeline using `inception` (start), `back`, `forward`, `present` (end), and `last-move` commands.
    *   The `$timer` can automatically advance the timeline (`ffwd`) until the "present" moment is reached or user interaction occurs.

4.  **Perspective Handling:**
    *   Fetches game perspectives on demand when the `$at` cursor position changes and the perspective is not in `$perspectives` cache.
    *   Dynamically imports game-specific `core.js` modules (e.g., `../games/${slug}/table/${release}/core.js`) to create game instances based on the fetched perspective data.

5.  **CLI Interface (Cliffy):**
    *   Defines a `reel` command that takes `table` (ID), optional `event` (ID), `seat` (number), and `interactive` (boolean) as arguments.
    *   In `interactive` mode, it captures keyboard input (`keypress`) to trigger actions:
        *   `left`/`right`: Navigate backward/forward in the timeline. `shift + left` goes to `inception`, `shift + right` goes to `present`.
        *   `l`: Go to `last-move`.
        *   `m`: Prompt for a JSON move and issue it.
        *   `f`: Fast forward (`ffwd`) using the timer.
        *   `q`/`escape`: Exit the program.
    *   All CLI actions dispatch commands to the `Reel` instance, which then updates the internal state.

6.  **Dependencies:**
    *   `atomic_/core.js` (`_`): Functional utilities (e.g., `deref`, `implement`, `chain`, `maybe`, `getIn`, `compact`, `fmap`, `pipe`, `assoc`, `array`, `all`, `eq`, `inc`, `dec`, `clamp`, `count`, `indexOf`, `includes`, `some`, `nth`).
    *   `atomic_/shell.js` (`$`): Reactive programming primitives (e.g., `observable`, `subject`, `atom`, `fixed`, `map`, `pipe`, `sub`, `pub`, `reset`, `doto`, `ISubscribe`, `IEvented`, `IDispatch`, `IDeref`, `see`, `log`, `error`, `tee`, `hist`).
    *   `supabase.js`: Supabase client for database and function interactions.
    *   `session.js`: User session management.
    *   `deno.land/x/cliffy`: CLI framework for command parsing and keypress handling.

**Behavior to Maintain:**

*   All CLI commands and their effects on the timeline and game state.
*   Real-time updates for table status.
*   Dynamic loading of game modules.
*   Perspective fetching and caching.
*   Cursor logic invariants.
*   Move issuance mechanism.
*   Timer-based auto-advancement.

### `table.js` Analysis

The `table.js` module is responsible for the client-side rendering and interactive management of a game table. It acts as the primary view layer, integrating various reactive data streams and handling user input to drive the game's state and display.

**Key Functionality:**

1.  **Initialization & Data Fetching:**
    *   Extracts `tableId` and optional `seat` from URL parameters.
    *   Asynchronously fetches initial `config`, `seated` players, and `seats` data from Supabase using `getConfig`, `getSeated`, and `getSeats` functions.
    *   Handles invalid `seat` parameters by redirecting the user.
    *   Updates the browser tab's title to include the `tableId`.

2.  **Reactive State Management:**
    *   Leverages `atomic_/shell.js` (`$`) extensively to create and manage reactive state variables (observables).
    *   `$table`: An `$.atom` that holds the current table data, initialized from Supabase and updated in real-time via a Supabase channel subscription for `postgres_changes` on the `tables` table.
    *   `$ready`, `$error`: Observables for tracking the readiness of the UI and any encountered errors.
    *   `$up`: Indicates if the current `seat` is one of the players whose turn it is.
    *   `$hash`: An observable tracking changes in the URL hash.
    *   `$story`: **Crucially, this is the central observable for game history and state.** It's initialized by calling the `story()` function (from `story.js`) and is fed with `make` (game constructor), `session.accessToken`, `tableId`, `seat`, `seated`, `config`, `$hash`, `$up`, `$ready`, and `$error`.
    *   `$hist`, `$snapshot`, `$wip`: Observables derived from `$story`, providing access to the game's history, current snapshot, and work-in-progress state (e.g., for moves being formulated).
    *   `$touch`: Represents the `last_touch_id` from the `$table`.
    *   `$started`, `$status`, `$scored`, `$remarks`, `$described`: Observables reflecting various properties of the game table.
    *   `$presence`: An observable tracking the online status of players, using `online.js`.
    *   `$present`: A boolean observable indicating if the game story is currently at the latest (present) moment.
    *   `$actionable`: A boolean observable indicating if the current player (`seat`) has any valid moves available in the current game state.
    *   `$act`: A combined boolean observable indicating if the game is `present`, `actionable`, `ready`, and `started`.

3.  **DOM Manipulation and UI Rendering:**
    *   Selects the main `#table` element and dynamically applies CSS classes based on the game state (e.g., `multi-seated`, `present`, `act`, `up`, `wait`, `error`).
    *   Renders player zones, including avatars, usernames, and seat numbers, and highlights the current user's seat.
    *   Displays game remarks, options, and error messages.
    *   Updates a progress bar and displays the current "touch" count based on the `$story`'s state.
    *   Renders detailed information about the current game event (`els.event`), including its type, the acting player, and a description.
    *   Manages `data-action` attributes on player zones to visually indicate whose turn it is.

4.  **User Interaction and Event Handling:**
    *   Attaches event listeners for `click` events on UI elements (e.g., remarks/options buttons, replay navigation).
    *   Attaches a global `keydown` listener to `document` to handle keyboard shortcuts for game navigation and actions:
        *   `ArrowUp`/`ArrowLeft`: Navigate backward in history (`replay($story, "back")` or `inception`).
        *   `ArrowDown`/`ArrowRight`: Navigate forward in history (`replay($story, "forward")` or `present`).
        *   `Backspace` (with Shift): "Do over" (`replay($story, "do-over")`).
        *   `Escape`: Clear work in progress (`clear($wip)`) or dismiss errors.
        *   `.`: Pass turn (`$.dispatch($story, {type: "pass"})`).
        *   `Enter`: Commit move (`$.dispatch($story, {type: "commit"})`).
        *   `Meta+s`: Redirect to shell.
    *   These interactions primarily trigger `replay($story, ...)` or `$.dispatch($story, {type: ...})` calls, indicating that `table.js` sends commands to the `$story` observable to modify the game state.

5.  **Dependencies:**
    *   `atomic_/core.js` (`_`): Core functional utilities.
    *   `atomic_/dom.js` (`dom`): DOM manipulation.
    *   `atomic_/shell.js` (`$`): Reactive programming.
    *   `supabase.js`: Supabase client.
    *   `online.js`: Online presence.
    *   `session.js`: Session and Supabase function calls.
    *   `links.js`: URL utilities.
    *   `story.js`: **Crucial dependency for game history and state management.**
    *   `wip.js`: Work-in-progress state.
    *   `cmd.js`: Global observable registration.
    *   `components/table/ui.js`: UI components.

**Relationship to `reel.js`:**
`table.js` is a client-side UI component that displays and interacts with a live game table. It uses `story.js` to manage the game's history and state. `reel.js` is a CLI tool that provides a similar "reeling" functionality but for a command-line interface, also likely interacting with the game's history/story. Both seem to be different interfaces to a common underlying game state and history mechanism.

**Data Dependencies and Signal Paths (from `table.js` perspective):**
*   `tableId` (URL param) -> `getConfig`, `getSeated`, `getSeats`, `table()`
*   `session.accessToken` -> `getSeats`
*   `$table` (Supabase real-time updates) -> `$up`, `$started`, `$status`, `$scored`, `$remarks`, `$described`, `$touch`, `$story` (via `config`, `seated`)
*   `$online` (from `session.js`) -> `$presence`
*   `$story` (from `story.js`) -> `$hist`, `$snapshot`, `$wip`, `$present`, UI updates (progress, touch count), event handling (`replay`, `dispatch`)
*   User input (keyboard, clicks) -> `replay($story, ...)` or `$.dispatch($story, {type: ...})`
*   `$error` -> UI error display, `clear($wip)`
*   `$ready` -> UI wait state, `clear($wip)`

### `story.js` Analysis

The `story.js` module is a critical component for managing the historical state of a game and enabling navigation through its timeline. It acts as the central hub for fetching game events ("touches"), game states ("perspectives"), and processing game moves. It is designed to work reactively, integrating deeply with `atomic_/shell.js` observables.

**Key Concepts & Functionality:**

1.  **`Story` Class and Factory Function `story()`:**
    *   The `Story` constructor holds various parameters like `accessToken`, `tableId`, `seat`, `seated`, `config`, and reactive state channels (`$hash`, `$up`, `$ready`, `$error`, `$state`, `$story`).
    *   The `story()` factory function initializes the core reactive state for the game's history:
        *   `$state`: An `$.atom` holding the current story state: `{touches: null, history: null, at: null}`.
            *   `touches`: An ordered array of event IDs, representing the chronological sequence of game events.
            *   `history`: An array where each element corresponds to a `touch` and stores the fetched game `perspective` (the full game state at that event).
            *   `at`: The current index within the `touches` and `history` arrays, indicating the currently viewed moment in the game's past.
        *   It creates a `Story` instance (`self`) and sets up subscriptions:
            *   To `$hash` changes (from `table.js`), triggering `nav()` to update the current `at` position based on the URL hash.
            *   To `$state` changes, to initialize navigation to the `last` touch if no specific hash is provided.

2.  **Data Fetching from Supabase:**
    *   `getTouches(_table_id)`: Fetches the complete list of event IDs (the game's timeline) for a given `tableId` using a Supabase function.
    *   `getPerspective(table_id, event_id, seat, seat_id)`: Retrieves a detailed game state (perspective) for a specific `event_id`. This involves calling a Supabase function and an RPC call to `last_move` to get additional context.
    *   `getLastMove(_table_id, _event_id, _seat_id)`: Fetches information about the last move at a given event via a Supabase RPC.
    *   `move(table_id, seat, commands, accessToken)`: Submits game commands (moves) to the backend via a Supabase function.

3.  **Timeline Navigation (`nav` function):**
    *   This is the core mechanism for moving through the game's history.
    *   It takes a target `_at` (either a numerical index or an event ID).
    *   If the `perspective` for the target `_at` is not already present in the `$state.history` cache, it fetches it using `getPerspective`.
    *   Once fetched (or if already cached), it updates the `$state.at` to the new position and stores the fetched `perspective` in the `$state.history` array, ensuring the `history` array is dynamically expanded as needed.

4.  **Waypoint Calculation (`waypoint` function):**
    *   Translates high-level navigation commands (e.g., "do-over", "last-move", "back", "forward", "inception", "present") into a target event ID or index for `nav()`.
    *   The "do-over" command specifically triggers a Supabase RPC `undo`.

5.  **Replay Mechanism (`replay` function):**
    *   Updates the browser's `location.hash` with the target event ID determined by `waypoint()`. This change in `location.hash` then triggers the `$hash` observable, which in turn calls `nav()`.

6.  **State Queries:**
    *   `atPresent(self)`: Checks if the current `at` position is at the very end of the `touches` timeline.
    *   `inPast(self, touch)`: Checks if a given `touch` exists within the `touches` timeline.
    *   `toPresent(self, was)`: A recursive function that attempts to auto-advance the story to the present moment, often used with a timer.

7.  **Command Dispatch (`dispatch` function):**
    *   Implements `$.IDispatch` to handle incoming game commands (e.g., user moves).
    *   Sets `$ready` to `false` to indicate a pending operation.
    *   Calls the `move` Supabase function to send the command to the backend.
    *   Handles and publishes any errors to the `$error` observable.

8.  **History and Snapshot Observables:**
    *   `hist(self)`: Creates a derived observable that emits `[current_state, prior_state, metadata, game_instance]` tuples, providing rich context for each step in the story. The `stepping` helper function calculates metadata like `bwd` (backward movement), `present` status, `touch` ID, `undoable` status, and `last_acting_seat`.
    *   `snapshot(self)`: Returns an observable that emits the current game state (moment) from the story.
    *   `moment(self, {state, event})`: A utility to create a game instance using the `make` function (provided during `story` initialization) and the current game `state` and `event`.

9.  **`refresh` Function:**
    *   Fetches updated `touches` from Supabase and updates the `$state` atom, effectively refreshing the timeline.

10. **Dependencies:**
    *   `atomic_/core.js` (`_`): Core functional utilities.
    *   `atomic_/shell.js` (`$`): Reactive programming primitives.
    *   `supabase.js`: Supabase client for database and RPC interactions.
    *   `session.js` (`getfn`): Supabase function calls.

**Relationship to `reel.js` and `table.js`:**
`story.js` provides the core logic for managing game history that both `reel.js` (CLI) and `table.js` (UI) consume. It abstracts away the details of fetching historical data and game states from Supabase, offering a reactive interface (`$story` observable) for navigation and command dispatch. Both `reel.js` and `table.js` would interact with `story.js` to move through the game's past, view different perspectives, and issue moves.

**Data Dependencies and Signal Paths (from `story.js` perspective):**
*   `tableId`, `seat`, `accessToken`, `seated`, `config` (passed to `story()` factory) -> used in `getPerspective`, `move`, `moment`, `Story` instance.
*   `$hash` (from `table.js`) -> triggers `nav()`.
*   `$state` (internal `$.atom`) -> updated by `nav()`, `refresh()`, `dispatch()`; consumed by `hist()`, `snapshot()`, `atPresent()`, `inPast()`, `waypoint()`.
*   `make` (game constructor, passed to `story()` factory) -> used by `moment()` to create game instances.
*   `$ready`, `$error` (passed to `story()` factory) -> updated by `dispatch()`.
*   User commands (via `$.dispatch(self, command)`) -> processed by `dispatch()`, potentially leading to `move()` or `undo()` calls.
*   `getTouches`, `getPerspective`, `getLastMove`, `move`, `supabase.rpc('undo')` (Supabase interactions) -> provide data for `$state` updates and execute game actions.

### `main.js` (Backgammon) Analysis

The `main.js` module for Backgammon serves as the specific client-side UI implementation for the Backgammon game. It integrates the generic `table.js` and `story.js` components with the unique rules, rendering, and interaction patterns of Backgammon. It is the entry point that wires the game's core logic to the reactive UI framework.

**Key Functionality:**

1.  **UI Initialization and Board Rendering:**
    *   Fetches the `backgammon-board.svg` file and injects it into the `#board` element within the main `el` (from `table.js`).
    *   Defines constants for checker colors (`WHITE`, `BLACK`), and special board positions (`WHITE_BAR`, `BLACK_BAR`, `WHITE_OFF`, `BLACK_OFF`).

2.  **Game-Specific UI Elements and Helpers:**
    *   `checker(seat)`: A utility function to create an `<img>` element representing a checker, with the correct image source based on the player's `seat`.
    *   `die(pips)`: A utility function to create an `<img>` element for a die, displaying the correct pips.
    *   `adjustWhite`, `adjustBlack`, `relativeRank`: Functions to translate absolute board positions into player-relative ranks, crucial for displaying moves from a player's perspective.
    *   `desc({type, details, seat})`: This function provides human-readable and visually rich descriptions for various Backgammon game events (e.g., "rolled", "moved", "borne-off", "committed", "started", "double-proposed", "accepted", "conceded", "finished"). It uses the `checker()` and `die()` helpers to embed visual cues directly into the event descriptions.
    *   `template(seat)`: Defines the structure for player-specific UI zones, including stats (e.g., pieces off board) and resources.

3.  **Work-In-Progress (WIP) Command Handling:**
    *   `workingCommand([curr, prior], seat, state, game, el, moves)`: This function is invoked when the `$wip` observable (from `table.js`) changes. It updates `data-command-type`, `data-from`, and `data-tos` attributes on the main `el` to visually indicate a partial move being formulated by the user (e.g., selecting a "from" point).

4.  **Checker Rendering and Animation:**
    *   `getCheckers(state)`: Parses the game `state` object to extract the positions of all checkers on the board, including points, bar, and off-board areas.
    *   `diffCheckers(curr, prior)`: Compares the checker positions between the current and prior game states to identify which checkers have moved, been added, or removed. This is essential for animating checker movements.
    *   `positioning(seat)`: Sets the initial `data-point` and `data-pos` attributes for checkers of a specific `seat` on the SVG board.
    *   `updatePositioning(diffs)`: Applies the calculated `diffs` to the DOM, updating the `data-point` and `data-pos` attributes of checker elements. This triggers CSS transitions for smooth animation.
    *   `manageStacks(state)`: Calculates and displays counts for points where more than 5 checkers are stacked, updating `data-overstacked` attributes and text elements.

5.  **Integration with Generic Table/Story System:**
    *   The module's core integration point is the call to `ui(c.make, describe, desc, template)` from `table.js`. This passes the Backgammon-specific `c.make` function (the game's pure functional core), the `describe` function (for event descriptions), the `desc` function (for event details), and the `template` function (for player UI) to the generic table UI. This is how the Backgammon game logic is "plugged into" the broader framework.
    *   It subscribes to `$both` (an observable combining `$hist` and `$wip` from `table.js`) to react to changes in the game's history and any work-in-progress actions.
    *   Upon `$both` updates, it:
        *   Updates checker positions and animations.
        *   Sets various `data-` attributes on the main `el` to reflect game state (e.g., `data-stakes`, `data-up`, `data-holds-cube`, `data-dice`, `data-allow-commands`, `data-froms`, `data-status`).
        *   Calls `manageStacks` to update checker stack displays.
        *   If a WIP change is detected (`which === 1`), it calls `workingCommand` to update the UI for partial moves.

6.  **User Interaction and Command Dispatch:**
    *   Attaches `click` event listeners to various parts of the Backgammon board and control elements.
    *   These listeners translate user clicks into game commands (e.g., "roll", "commit", "propose-double", "accept", "concede", "move", "enter", "bear-off").
    *   Commands are then dispatched to the `$story` observable using `$.dispatch($story, command_object)`, which sends them to the game's core logic via `story.js`.
    *   Manages the `$wip` observable to track and display partial moves (e.g., selecting a "from" point before a "to" point).

**Dependencies:**
*   `atomic_/core.js` (`_`): Core functional utilities.
*   `atomic_/shell.js` (`$`): Reactive programming.
*   `atomic_/dom.js` (`dom`): DOM manipulation.
*   `./core.js` (`c`): **The Backgammon game's pure functional core, providing `make` and other game logic.**
*   `/libs/game.js` (`g`): Generic game utilities (e.g., `g.moves`, `g.up`).
*   `/libs/story.js` (`moment`): Access to the current game instance from the story.
*   `./ancillary.js` (`describe`): Backgammon-specific event descriptions.
*   `/libs/wip.js` (`retainAttr`): Work-in-progress attribute management.
*   `/libs/table.js`: Generic table UI components and functions (e.g., `el`, `ui`, `seated`, `$story`).
*   `/libs/cmd.js` (`reg`): Global observable registration.

**Data Dependencies and Signal Paths (from `main.js` Backgammon perspective):**
*   `c.make` (from `./core.js`) -> passed to `table.js`'s `ui()` function, which then passes it to `story.js` to construct game instances.
*   `describe` (from `./ancillary.js`) -> passed to `table.js`'s `ui()` function for event descriptions.
*   `template` (defined in `main.js`) -> passed to `table.js`'s `ui()` function for player UI rendering.
*   `$story` (from `table.js` via `ui()`) -> commands dispatched to it, `moment($story)` used to get current game instance.
*   `$hist`, `$wip` (from `table.js` via `ui()`) -> combined into `$both` and subscribed to for UI updates.
*   Game `state` (from `$both` updates) -> used by `getCheckers`, `manageStacks`, and to update various `data-` attributes.
*   User clicks on board/controls -> translated into game commands and dispatched to `$story`.
*   `g.moves(game, ...)` -> used to determine available commands and highlight possible moves.
*   `$wip` (from `table.js`) -> updated with partial move details, consumed by `workingCommand`.
# flick.md - Study Notes

This document captures the analysis of the existing `reel.js` implementation and its dependencies, as required by the project brief.

## 1. Behavior and CLI Surface (`reel.js`)

- **Core Object:** `Reel` is a large object that holds many atoms (`$`) representing the state of the UI.
- **Initialization:** `reel(tableId, session, {event, seat})` is the entry point. It sets up a complex web of interconnected atoms.
- **State:** A main `$state` atom aggregates many other atoms to provide a single source of truth for subscribers.
- **CLI:**
    - Uses `cliffy` for command-line parsing.
    - Main command takes a `<table>` argument.
    - Options: `--event <id>`, `--seat <num>`, `-i, --interactive`.
    - **Interactive Mode:** Listens for keypresses (`left`, `right`, `l`, `m`, `f`, `q`) to dispatch navigation and move commands.
    - `dispatch(self, cmd)` handles commands like `at`, `ffwd`, `inception`, `back`, `forward`, `present`, `last-move`, and `move`.

## 2. Signal Topology and Payloads

The system is built on `atomic.js` signals (atoms and pipes).

- **`table(tableId)`:**
    - Creates an atom `$t` for the table object.
    - Fetches the initial table state from Supabase `tables` table.
    - Subscribes to `postgres_changes` on the `tables` table for real-time updates. Any change to the table row triggers a `$.reset` on the atom.
- **`reel(...)` function:**
    - **`$table`**: The core table object signal.
    - **`$status`, `$remarks`, `$scored`, `$started`**: Signals derived from `$table`.
    - **`$seated`, `$seats`**: Fetched via Supabase functions `seated` and `seats`.
    - **`$touches`**: An atom holding the list of event IDs (`touches`) for the table. It's initially fetched and then updated whenever the `$table`'s `last_touch_id` changes.
    - **`$pos`, `$at`, `$max`**: These atoms manage the cursor/position within the timeline of touches. `$pos` can be set directly, and `$at` is a clamped version of `$pos`. `$max` is the total number of touches.
    - **`$perspectives`**: An atom acting as a **cache**. It's a dictionary mapping `eventId` -> `perspective` object.
    - **`$perspective`**: The perspective for the *current* `$touch` (event ID). It's derived by looking up the current `$touch` in the `$perspectives` cache.
    - **`$view`**: A signal that triggers when all necessary data for rendering a perspective is available (`$args`, `$perspective`, `$make`, `$seated`, `$config`).
    - **`$.sub($view, ...)`**: This is the key subscription. When `$view` emits, if the perspective for the current `eventId` is missing (`!p`), it triggers `getPerspective(...)` to fetch it and then stores it in the `$perspectives` atom.
    - **`$game`, `$make`, `$maker`**: These signals dynamically import the game-specific logic (`core.js`) based on the game's slug and release version from the table object.

## 3. Data Required by UI (`backgammon/main.js`, `table.js`)

- **`ui(...)` in `table.js`**: This is the main UI setup function. It consumes a `story` object.
- **`$hist`**: A signal providing `[curr, prior, motion, game]` where:
    - `curr`: The current perspective object.
    - `prior`: The previous perspective object.
    - `motion`: Details about the navigation (`{step, at, bwd, head, present, offset, touch, undoable}`).
    - `game`: The instantiated game engine object from the dynamically imported module.
- **Perspective Object Shape**: The UI needs a perspective object that contains at least:
    - `state`: The full game state at that event.
    - `up`: An array of seats whose turn it is.
    - `may`: An array of seats that have optional actions.
    - `event`: The event that generated this state.
    - `last_move`: The `eventId` of the last move.
- **Game Object (`game`)**: The UI calls `g.moves(game, ...)` to get a list of valid moves for the current player. This is used to render buttons and determine active UI elements.
- **`workingCommand(...)` in `main.js`**: Shows how multi-step commands are handled by inspecting a `$wip` (work-in-progress) atom.

## 4. Backend Endpoints and Response Shapes

All backend interaction is mediated through Supabase.

- **`supabase.from('tables').select('*').eq('id', ...)`**: Fetches the main table object.
- **`supabase.channel('db-messages').on('postgres_changes', ...)`**: Listens for real-time updates to a specific table.
- **`getfn(name, params, accessToken)`**: A generic helper in `reel.js` for calling Supabase edge functions via GET.
    - `getfn("seated", {_table_id})`: Fetches the seated players. Returns an array of player objects.
    - `getfn("seats", {_table_id}, accessToken)`: Fetches the seats the current user can occupy.
    - `getfn("touches", {_table_id}, accessToken)`: Fetches the timeline of event IDs. Returns `{touches: [...], undoables: {...}}`.
    - `getfn("perspective", {table_id, event_id, seat}, accessToken)`: Fetches the detailed state for a single event. This is the most expensive call.
- **`supabase.rpc('last_move', ...)`**: A remote procedure call to get the event ID of the last move relative to a given event.
- **`supabase.functions.invoke("move", {body})`**: POSTs a command object to the `move` function to execute a player's action.

## 5. Caching in `reel.js`

- **Mechanism:** Caching is implemented via the `$perspectives` atom.
- **Key:** The `eventId` (called `touch` in the code) is the key.
- **Storage:** The value is the entire fetched perspective object, augmented with the instantiated `game` object.
- **Logic:**
    1. Navigation changes `$at` (the position/index).
    2. This changes `$touch` (the `eventId` at that position).
    3. This causes `$perspective` to look up the new `eventId` in the `$perspectives` cache.
    4. If the lookup result is `null` (cache miss), the `$view` subscription triggers.
    5. Inside the `$view` subscription, it checks if the perspective is missing (`!p`). If so, it calls `getPerspective()`.
    6. The result of `getPerspective()` is then associated with the `eventId` and stored back into the `$perspectives` atom using `$.swap`.
- **Cache Invalidation:** There is no explicit cache invalidation. The cache is in-memory and lives only for the duration of the `reel` process. It's a fill-once cache.
- **CLI Controls:** `reel.js` does **not** have any command-line flags like `--no-cache` to control this behavior. This will be a new feature in `flick`.

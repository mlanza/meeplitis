# flick-plan.md - Incremental Development Plan

This plan follows the incremental steps outlined in the project brief for rebuilding `reel.js` into `flick`.

### 1. Init + Subscribe
- [x] **Core (`flick.js`):**
    - [x] Define initial state structure.
    - [x] Create a `reducer(state, msg)` function.
    - [x] Handle `Init({ tableId, seat, session })` message.
    - [x] On `Init`, the reducer should return a new state and an `effects` array containing `FetchTable(tableId)` and `FetchSeated(tableId)`.
- [x] **Shell (`flick-shell.js`):**
    - [x] Create a `run(tableId, seat, session)` function to start the process.
    - [x] Implement an effect interpreter that handles `FetchTable` and `FetchSeated`.
    - [x] `FetchTable` fetches table data and dispatches `TableLoaded({ table })`.
    - [x] `FetchSeated` fetches seated data and dispatches `SeatedLoaded({ seated })`.
    - [x] Implement `SubscribeToTableChannel` effect to set up real-time updates.
- [x] **CLI (`flick-cli.js`):**
    - [x] Implement the `run --table-id ... --seat ...` command.
    - [x] This command will call the `run` function in the shell.

### 2. Priming + Tail Perspective
- [x] **Core:**
    - [x] Handle `TableLoaded` message: stores `table`, emits `SubscribeToTableChannel`, `FetchTouches`, `FetchGame`.
    - [x] Handle `SeatedLoaded` message: stores `seated` data.
    - [x] Handle `TouchesLoaded({ touches })` message.
    - [x] On `TouchesLoaded`, set the cursor to the end of the timeline: `cursor: { pos: max, at: "present", max }`.
    - [x] Check the perspective cache for the tail `eventId`.
    - [x] If it's a cache miss, emit a `FetchPerspective({ tableId, eventId })` effect for the tail event.
    - [x] Emit `Log` effects to report touches count, tail ID, and cache status.
- [x] **Shell:**
    - [x] Implement handlers for `FetchTouches` and `FetchPerspective` effects.
    - [x] These handlers will call the respective Supabase functions (`getTouches`, `getPerspective`).
    - [x] On success, they dispatch `TouchesLoaded` or `PerspectiveLoaded` back to the core.

### 3. Navigation + Cache
- [x] **Core:**
    - [x] Implement `NavigateTo({ pos, at })` and `Step({ delta })` message handlers.
    - [x] These handlers will update the `cursor` state, applying clamping rules.
    - [x] After updating the cursor, check the cache for the target `eventId`.
    - [x] If it's a miss, emit `FetchPerspective`.
    - [x] If it's a hit, emit a `Log` effect.
- [x] **CLI (`flick-cli.js`):**
    - [x] Refactored to a single command with automated test sequence for verification.
    - [x] Dispatches `NavigateTo` and `Step` messages to the shell.

### 4. Game Module Import
- [x] **Core:**
    - [x] On `TableLoaded`, emit `FetchGame({ gameId: table.game_id })`.
    - [x] Handle `GameLoaded`: stores `game` object.
    - [x] On `TouchesLoaded`, if `game` is loaded and `module` is not, emit `FetchGameModule`.
    - [x] Handle `GameModuleLoaded({ make })`: stores the `make` function in `state.module`.
- [x] **Shell:**
    - [x] Implement handler for `FetchGame`: fetches game data from Supabase, dispatches `GameLoaded`.
    - [x] Implement handler for `FetchGameModule`: dynamically imports the game's `make` function, dispatches `GameModuleLoaded`.

### 5. Updated Touches
- [x] **Core:**
    - [x] Handle `TableUpdated` message (from channel subscription): emits `FetchTouches`.
    - [x] In `TouchesLoaded` handler:
        - [x] If the cursor was at `"present"` or it's the initial load, update `pos` to the new `max`.
        - [x] If the cursor was in the past, keep it at the same index unless out of range (clamped).
        - [x] After updating the cursor, check the cache and emit `FetchPerspective` if needed.
- [x] **Shell:**
    - [x] `subscribeToTableChannel` dispatches `TableUpdated` on real-time changes.

### 6. Polish & Parity
- [x] **CLI (`flick-cli.js`):**
    - [x] Implemented automated test sequence to verify functionality.
    - [x] Added `--no-cache` and `--no-store` flags.
    - [x] Initialized `noCache` and `noStore` in `flick.js` to `false` by default.
- [x] **Shell & Core:**
    - [x] `flick.js` respects `noCache` flag for fetching.
    - [x] `flick.js` respects `noStore` flag for caching.
    - [x] `flick.js` handles `ClearCache` message.
- [x] **Logging:**
    - [x] `Log` effects are emitted at key stages for observability.
- [x] **Final Review:**
    - [x] Core is pure, shell owns side effects.
    - [x] Feature parity with `reel.js`'s navigation and observation capabilities (verified via automated test).
    - [x] Perspective caching with controls implemented.
    - [x] CLI is detachable (conceptually, as it's now an automated test script).
# Flick Application - Implementation Plan (Baby Steps) - Revised

This plan outlines the step-by-step implementation of the `flick` application, strictly adhering to the "Atomic Way" principles, with `flick.js` serving as the functional core managing game history.

## Phase 0: Environment Setup & Dependencies

1.  **Verify `atomic_` directory:**
    *   **Action:** Ensure `src/libs/atomic_` exists and contains `core.js` and `shell.js`.
    *   **Verification:** `ls src/libs/atomic_/core.js src/libs/atomic_/shell.js`
2.  **Verify `games/backgammon/module.js`:**
    *   **Action:** Ensure `src/games/backgammon/module.js` exists. If not, create a minimal placeholder file (e.g., `export function make() { return {}; }`).
    *   **Verification:** `ls src/games/backgammon/module.js`

## Phase 1: `flick.js` (Functional Core) - Basic Structure

1.  **Create `src/libs/flick.js` with `initialState`:**
    *   **Action:** Create the file and add only the `initialState` object and the `export default` structure as defined in the PRD.
    *   **Verification:** `cat src/libs/flick.js` (confirm content matches PRD's `initialState` and export).
2.  **Add `checkCacheAndFetch` helper:**
    *   **Action:** Add the `checkCacheAndFetch` function signature (empty body for now) to `flick.js`.
    *   **Verification:** `cat src/libs/flick.js` (confirm function signature is present).
3.  **Add `reducer` function with `default` case:**
    *   **Action:** Add the `reducer` function with only the `default` case returning `{ state, events: [] }` to `flick.js`.
    *   **Verification:** `cat src/libs/flick.js` (confirm `reducer` structure with `default` case).

## Phase 2: `flicker-shell.js` (Imperative Shell) - Basic Structure & Atom Initialization

1.  **Create `src/libs/flicker-shell.js` with imports:**
    *   **Action:** Create the file and add only the `import` statements for `_`, `$`, and `flick`.
    *   **Verification:** `cat src/libs/flicker-shell.js` (confirm imports).
2.  **Add empty `handleEffect` stubs:**
    *   **Action:** Create empty async function stubs for all `handleEffect` functions (e.g., `handleLogEffect`, `handleFetchTouchesEffect`, etc.) that return `null` or a mocked message, as defined in the PRD.
    *   **Verification:** `cat src/libs/flicker-shell.js` (confirm all stubs are present).
3.  **Initialize `$flick`:**
    *   **Action:** Add `const $flick = $.atom(flick.initialState);` to `flicker-shell.js`.
    *   **Verification:** `cat src/libs/flicker-shell.js` (confirm `$flick` initialization).
4.  **Add `shellApi` export:**
    *   **Action:** Add the `shellApi` object with `$flick` and `run` properties, where `run` dispatches the `init` command to `$flick` via `flick.reducer`.
    *   **Verification:** `cat src/libs/flicker-shell.js` (confirm `shellApi` structure).

## Phase 3: `flicker-cli.js` (Interactive CLI) - Basic Structure & Command Parsing

1.  **Create `src/libs/flicker-cli.js` with imports:**
    *   **Action:** Create the file and add only the `import` statements for `Command`, `keypress`, `_`, `$`, and `flick`, and `shell`.
    *   **Verification:** `cat src/libs/flicker-cli.js` (confirm imports).
2.  **Add empty `prettyLog` and `displayHelpMenu` stubs:**
    *   **Action:** Create empty function stubs for `prettyLog` and `displayHelpMenu`.
    *   **Verification:** `cat src/libs/flicker-cli.js` (confirm stubs are present).
3.  **Add empty `interactiveMode` stub:**
    *   **Action:** Create an empty async function stub for `interactiveMode`.
    *   **Verification:** `cat src/libs/flicker-cli.js` (confirm stub is present).
4.  **Add empty `when` function stub:**
    *   **Action:** Create an empty `when` function stub.
    *   **Verification:** `cat src/libs/flicker-cli.js` (confirm stub is present).
5.  **Implement `Command` parsing:**
    *   **Action:** Add the `await new Command()...parse(Deno.args);` structure with all options and an empty `action` callback, as defined in the PRD.
    *   **Verification:** `cat src/libs/flicker-cli.js` (confirm `Command` structure).
6.  **Run CLI (minimal):**
    *   **Action:** Execute `deno run --allow-net --allow-read --allow-env src/libs/flicker-cli.js --table-id test --seat 0`.
    *   **Verification:** Expect no errors, and the program should exit immediately (as the action is empty). This verifies basic Deno execution and `cliffy` parsing.

## Phase 4: `flick.js` - Implementing `init` Command

1.  **Implement `init` case in `flick.reducer`:**
    *   **Action:** Add the logic for the `init` command to `flick.js`, updating state and returning `fetch_table`, `fetch_seated`, and `log` effects as per PRD.
    *   **Verification:** `cat src/libs/flick.js`.

## Phase 5: `flicker-shell.js` - Implementing `$.sub` and `log` Effect

1.  **Implement `handleLogEffect`:**
    *   **Action:** Add the `console.log` logic to `handleLogEffect` in `flicker-shell.js` using `Deno.inspect`.
    *   **Verification:** `cat src/libs/flicker-shell.js` (confirm `handleLogEffect` implementation).
2.  **Implement `$.sub` callback logic:**
    *   **Action:** Add the full `$.sub` callback logic to `flicker-shell.js` as defined in the PRD: monitor `$flick`, extract `effects`, process them asynchronously, collect resulting commands, `$.swap` them back, and finally dispatch `effects_executed` command.
    *   **Verification:** `cat src/libs/flicker-shell.js` (confirm `$.sub` implementation).
3.  **Run CLI (minimal):**
    *   **Action:** Execute `deno run --allow-net --allow-read --allow-env src/libs/flicker-cli.js --table-id test --seat 0`.
    *   **Verification:** Expect to see the `log` effect for `init` printed to the console, indicating `init` command was processed, `log` effect generated, and executed by the shell.

## Phase 6: `flicker-shell.js` - Implementing Mocked Fetch Effect Handlers

1.  **Implement `handleFetchTableEffect`:**
    *   **Action:** Add the mocked response and return `table_loaded` command to `flicker-shell.js` as per PRD.
    *   **Verification:** `cat src/libs/flicker-shell.js`.
2.  **Implement `handleFetchSeatedEffect`:**
    *   **Action:** Add the mocked response and return `seated_loaded` command to `flicker-shell.js` as per PRD.
    *   **Verification:** `cat src/libs/flicker-shell.js`.
3.  **Implement `handleFetchGameEffect`:**
    *   **Action:** Add the mocked response and return `game_loaded` command to `flicker-shell.js` as per PRD.
    *   **Verification:** `cat src/libs/flicker-shell.js`.
4.  **Implement `handleFetchGameModuleEffect`:**
    *   **Action:** Add the dynamic import logic and return `game_module_loaded` command to `flicker-shell.js` as per PRD. (Requires `src/games/backgammon/module.js` to exist).
    *   **Verification:** `cat src/libs/flicker-shell.js`.
5.  **Implement `handleFetchTouchesEffect`:**
    *   **Action:** Add the mocked response and return `touches_loaded` command to `flicker-shell.js` as per PRD.
    *   **Verification:** `cat src/libs/flicker-shell.js`.
6.  **Implement `handleFetchPerspectiveEffect`:**
    *   **Action:** Add the mocked response and return `perspective_loaded` command to `flicker-shell.js` as per PRD.
    *   **Verification:** `cat src/libs/flicker-shell.js`.
7.  **Implement `handleSubscribeToTableChannelEffect`:**
    *   **Action:** Add the `console.warn` placeholder to `flicker-shell.js`.
    *   **Verification:** `cat src/libs/flicker-shell.js`.

## Phase 7: `flick.js` - Implementing Remaining Reducer Cases

1.  **Implement `table_loaded` case:**
    *   **Action:** Add logic to `flick.reducer` to update state and generate effects as per PRD.
    *   **Verification:** `cat src/libs/flick.js`.
2.  **Implement `seated_loaded` case:**
    *   **Action:** Add logic to `flick.reducer` to update state and generate effects as per PRD.
    *   **Verification:** `cat src/libs/flick.js`.
3.  **Implement `game_loaded` case:**
    *   **Action:** Add logic to `flick.reducer` to update state and generate effects as per PRD.
    *   **Verification:** `cat src/libs/flick.js`.
4.  **Implement `game_module_loaded` case:**
    *   **Action:** Add logic to `flick.reducer` to update state and generate effects as per PRD.
    *   **Verification:** `cat src/libs/flick.js`.
5.  **Implement `touches_loaded` case:**
    *   **Action:** Add logic to `flick.reducer` to update state, cursor, generate effects, and handle `initialAt` as per PRD.
    *   **Verification:** `cat src/libs/flick.js`.
6.  **Implement `navigate_to` case:**
    *   **Action:** Add logic to `flick.reducer` to update state, cursor, and generate effects as per PRD.
    *   **Verification:** `cat src/libs/flick.js`.
7.  **Implement `step` case:**
    *   **Action:** Add logic to `flick.reducer` to update state, cursor, and generate effects as per PRD.
    *   **Verification:** `cat src/libs/flick.js`.
8.  **Implement `perspective_loaded` case:**
    *   **Action:** Add logic to `flick.reducer` to update state, handle `noStore`, and enhance perspective as per PRD.
    *   **Verification:** `cat src/libs/flick.js`.
9.  **Implement `clear_cache` case:**
    *   **Action:** Add logic to `flick.reducer` to clear `state.perspectives`.
    *   **Verification:** `cat src/libs/flick.js`.
10. **Implement `table_updated` case:**
    *   **Action:** Add logic to `flick.reducer` to update state and generate effects as per PRD.
    *   **Verification:** `cat src/libs/flick.js`.
11. **Implement `effects_executed` case:**
    *   **Action:** Add logic to `flick.reducer` to clear `state.effects`.
    *   **Verification:** `cat src/libs/flick.js`.

## Phase 8: `flicker-cli.js` - Initializing and `when` Function

1.  **Implement `prettyLog`:**
    *   **Action:** Add the full `prettyLog` implementation to `flicker-cli.js` as per PRD.
    *   **Verification:** `cat src/libs/flicker-cli.js`.
2.  **Implement `displayHelpMenu`:**
    *   **Action:** Add the full `displayHelpMenu` implementation to `flicker-cli.js` as per PRD.
    *   **Verification:** `cat src/libs/flicker-cli.js`.
3.  **Implement `when` function:**
    *   **Action:** Add the full `when` function implementation to `flicker-cli.js` as per PRD.
    *   **Verification:** `cat src/libs/flicker-cli.js`.
4.  **Implement `action` callback logic:**
    *   **Action:** Add the `session` setup, `$.sub` for cursor updates, `shell.run`, and the `when` calls for interactive/non-interactive modes to `flicker-cli.js`'s `action` callback as per PRD.
    *   **Verification:** `cat src/libs/flicker-cli.js`.
5.  **Run CLI (non-interactive):**
    *   **Action:** Execute `deno run --allow-net --allow-read --allow-env src/libs/flicker-cli.js --table-id LvkvVqk7c34 --seat 0`.
    *   **Verification:** Expect to see all initialization logs, cursor updates, and the final state printed using `prettyLog`, then a clean exit. This verifies the entire initialization flow.

## Phase 9: `flicker-cli.js` - Interactive Mode

1.  **Implement `interactiveMode`:**
    *   **Action:** Add the `keypress` loop and the `switch` statement for all interactive commands (`s`, `p`, `c`, `t`, `h`, `?`, `left`, `right`, `home`, `end`, `q`, `escape`) to `flicker-cli.js` as per PRD.
    *   **Verification:** `cat src/libs/flicker-cli.js`.
2.  **Run CLI (interactive):**
    *   **Action:** Execute `deno run --allow-net --allow-read --allow-env src/libs/flicker-cli.js --table-id LvkvVqk7c34 --seat 0 -i`.
    *   **Verification:** Expect interactive mode to start, help menu displayed. Test 'q' to exit.

## Phase 10: Interactive Command Verification

1.  **Verify 's' (State):**
    *   **Action:** Run interactive CLI, press 's'.
    *   **Verification:** Confirm the full state object is outputted using `prettyLog`.
2.  **Verify 'p' (Perspective):**
    *   **Action:** Run interactive CLI, press 'p'.
    *   **Verification:** Confirm the current perspective object is outputted using `prettyLog`.
3.  **Verify 'c' (Cursor):**
    *   **Action:** Run interactive CLI, press 'c'.
    *   **Verification:** Confirm the cursor object is outputted using `prettyLog`.
4.  **Verify 't' (Touches):**
    *   **Action:** Run interactive CLI, press 't'.
    *   **Verification:** Confirm the touches list is outputted using `prettyLog`.
5.  **Verify 'h' / '?' (Help):
    *   **Action:** Run interactive CLI, press 'h' or '?'.
    *   **Verification:** Confirm the help menu is displayed.
6.  **Verify '←' / '→' (Step):**
    *   **Action:** Run interactive CLI, use left/right arrow keys.
    *   **Verification:** Confirm the cursor position and `at` value change correctly in the console output.
7.  **Verify 'home' / 'end' (NavigateTo):**
    *   **Action:** Run interactive CLI, use home/end keys.
    *   **Verification:** Confirm the cursor navigates to the first/last event respectively.

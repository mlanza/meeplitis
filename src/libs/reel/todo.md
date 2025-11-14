---
agent:
  active_drive: E
  active_task: E1
  drives: [E, F, G]
  confirm_on_switch: true
  archive_completed: true
---

# TODO

This plan outlines the refactoring work based on the new requirements in `prd2.md`.

## Drive E: State and Core Logic Refactoring

This drive focuses on refactoring the state shape and pure functions in `core.js`.

*   **E1: Refactor State Structure.** Modify `core.js` to introduce a `cursor` object containing `pos`, `at`, `max`, and a new `direction` field. Add `FORWARD` and `BACKWARD` constants. Remove the redundant top-level state fields.
*   **E2: Update `loadTimeline`.** In `core.js`, modify `loadTimeline` to update the new `cursor` object and correctly set the `direction` based on whether the current position is in the past.
*   **E3: Update `loadPerspective` API.** In `core.js`, change the `loadPerspective` function signature to `(state, at, perspective)` to explicitly require the event ID.
*   **E4: Rename Navigation Functions.** In `core.js`, rename `to_start` to `inception` and `to_end` to `present`.
*   **E5: Implement Validity Check.** Create a pure helper function `isPosValid(state, pos)` in `core.js` that checks if a position's perspective is cached. Modify `reposition` to only move the cursor if the target position is valid.

## Drive F: Shell and CLI Refactoring

This drive updates the imperative shell and CLI to accommodate the new core logic.

*   **F1: Update Shell Navigation Logic.** In `main.js`, refactor the navigation logic. The shell will now intercept user commands (e.g., `forward`), check if the target position is valid using `isPosValid`, fetch the perspective if needed, and only then call the core `reposition` function via `$.swap`.
*   **F2: Implement Pre-caching.** In `main.js`, add a subscription that watches for cursor changes. When the cursor moves, it will determine the next logical position based on `cursor.direction` and pre-fetch its perspective to improve performance.
*   **F3: Update CLI Commands.** In `cli.js`, update the interactive and scripted modes to use the new command names (`inception`, `present`). Implement the `at` command, which will set the direction to `FORWARD`.
*   **F4: Update CLI Help Text.** Review and update all command and option descriptions in `cli.js` to ensure the `--help` output is accurate.

## Drive G: Final Verification

This drive is for final testing and documentation.

*   **G1: Test Scripted Mode.** Create and run a new set of scripted tests to verify all the new logic: `inception`, `present`, `at`, direction changes, and the validity checks for navigation.
*   **G2: Final `AGENTS.md` Review.** Perform a final review of the codebase to ensure it conforms to all specified principles.
*   **G3: Update `VERIFICATION.md`.** Update the verification document with the new commands, options, and instructions.
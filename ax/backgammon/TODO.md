# To-do: Backgammon

This document outlines a step-by-step plan for building the [user interface](../../src/games/backgammon/table/uJl/main.js) to a [Backgammon](../backgammon.md) game.  Which is in the context of a play-by-web site called [Meeplitis](../meeplitis.md). The development approach is slow an incremental, always trying to implement just enough to evaluate that the increment is a good, working direction.

Ensure you [understand the model](../backgammon/prds/model.md) when working.

- [x] 1. Implement UI Reconciliation
  - Create `getCheckers(state)` to flatten checker locations from the game state.
  - The function should account for checkers on all 24 points, the bar, and borne-off checkers.
  - It should return an array of objects like `{seat, point, pos}`.
  - Create `diffCheckers(curr, prior)` to find the minimal set of checker movements.
  - Create `applyCheckerDiff(diffs)` to update the `data-point` and `data-pos` attributes of checker elements in the DOM.
  - Integrate the reconciliation logic into the `$.sub($both, ...)` subscription.
  - Handle the initial render case where `prior` state is `null`.
  - **Note on prior failure:** The initial implementation of `getCheckers` failed because it was based on an incorrect assumption about the game state model. The issue was resolved by reading the `model.md` and correcting the function. This highlights the importance of working from specs.

- [x] 2. Implement Bearing Off Logic
  - This task was executed entirely within `src/games/backgammon/table/uJl/core.js` as per the [Bearing Off PRD](./prds/bearing-off.md).
  - **2.1. Update `execute` to handle `bear-off` command:** Completed. The `execute` function now recognizes the `bear-off` command and groups its logic with `move` and `enter`.
  - **2.2. Update `fold` to handle `borne-off` event:** Completed. The `fold` function now processes the `borne-off` event by leveraging the shared `moved()` state transition function.
  - **2.3. Add a test case:** Skipped per user instruction, as no testing infrastructure is currently in place.

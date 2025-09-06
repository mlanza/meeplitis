# TODO: Backgammon UI Incremental Plan

This document outlines a step-by-step plan for building the [Backgammon UI](../../src/games/backgammon/table/uJl/ui.js). The approach is to [build it up incrementally](../todo-management.md). There are multiple `ui.js` files as that is a standard. Don't get confused and target the wrong one.

Ensure you [understand the model](../backgammon/prds/model.md) when working.

## Phase 1-4 (Completed)

(Previous phases for basic rendering and game logic are considered complete for the purpose of this plan.)

## Phase 5: Robust UI Reconciliation (Point-to-Point)

This phase focuses on a more robust approach to synchronize the UI with the game state, ensuring board stability even with non-linear navigation (e.g., rewinding or jumping to arbitrary states). The core idea is to directly reconcile all checkers to their target positions based on the `current` game state, rather than relying on a diff of individual moves. The entire phase will be implemented as a single unit of work. The result will be functional code that, when executed, visually repositions checkers for point-to-point moves by updating their `data-point` SVG attribute.

- [a] 50. Implement Checker Target Location Mapping
  - Create `getCheckerTargetLocations(state, seat)`:
    - This function will take a game `state` and a `seat` (0 for WHITE, 1 for BLACK).
    - It will return a list of 15 target `data-point` values (0-23) for that `seat`, representing where each of their checkers *should* be according to the `state.points` array.
    - The order of checkers in this list should correspond to the order of checkers in the DOM (e.g., `white-1`, `white-2`, ..., `white-15`).

- [a] 51. Implement Robust `data-point` Reconciliation
  - Modify `diffAndUpdatePoints(el, curr, prior)`:
    - **Remove `diffPoints` function.** Its logic is no longer needed.
    - **Remove `reconcileMovedCheckers` function.** Its logic will be integrated directly.
    - For each `seat` (WHITE and BLACK):
      - Get `domCheckers = dom.sel(`use[id^="${color}-"]`, el)` (all 15 checker elements for this seat).
      - Get `targetLocations = getCheckerTargetLocations(curr.state, seat)`.
      - Iterate from `i = 0` to `14` (for each of the 15 checkers):
        - Set `dom.attr(domCheckers[i], "data-point", targetLocations[i].toString())`.
  - **Note:** This approach directly sets the `data-point` of each checker based on the `current` state, ensuring the board always reflects the model accurately, regardless of the `prior` state. This implicitly handles initial renders (`prior === null`) and large state jumps.

## Phase 6: Advanced UI Reconciliation (Deferred)

This phase will build upon the robust reconciliation to handle all other game scenarios.

- [ ] 60. Integrate Bar and Off-board Logic
  - Extend `getCheckerTargetLocations` to include "bar" and "off" locations.
  - Update the `data-point` setting logic in `diffAndUpdatePoints` to handle these new location types.

- [ ] 61. Implement `data-pos` Stacking Reconciliation
  - Create a `reconcileCheckerPositions(el)` function.
  - This function will execute after the `data-point` updates.
  - It will scan all locations (points, bar, off) and update the `data-pos` attribute of all checkers to ensure they stack correctly.
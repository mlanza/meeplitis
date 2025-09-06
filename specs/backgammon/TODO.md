# TODO: Backgammon UI Incremental Plan

This document outlines a step-by-step plan for building the [Backgammon UI](../../src/games/backgammon/table/uJl/ui.js). The approach is to [build it up incrementally](../todo-management.md).

Ensure you [understand the model](../backgammon/prds/model.md) when working.

## Phase 1-4 (Completed)

(Previous phases for basic rendering and game logic are considered complete for the purpose of this plan.)

## Phase 5: Minimal UI Reconciliation (Point-to-Point)

This phase focuses on the essential logic to move a checker from one point to another by updating its `data-point` attribute. The goal is to create a minimal, working reconciliation for the most common move type, deferring more complex scenarios. The entire phase will be implemented as a single unit of work. The result will be functional code that, when executed, visually repositions checkers for point-to-point moves by updating their `data-point` SVG attribute.

- [ ] 1. **Append Reconciliation Logic to Game's `ui.js`**
    - [ ] Add new helper functions to the `ui.js` file responsible for rendering the game board.

- [ ] 2. **Implement Minimal State Diffing**
    - [ ] Create a `diffPoints(currPoints, priorPoints, seat)` function.
        - This function will *only* compare the `points` array for a given `seat` from the `prior` and `current` states.
        - It will ignore the `bar` and `off` properties for now.
        - It will return a list of changes, where each change is an object `{from: number, to: number}`.
        - `from` represents the prior point index (0-23) of a checker.
        - `to` represents the current point index (0-23) of that checker.
        - Example: `[{from: 0, to: 5}]` for a single checker move.

- [ ] 3. **Implement Minimal `data-point` Update**
    - [ ] Create a `reconcileMovedCheckers(el, seat, changes)` function.
        - This function will take the list of `{from, to}` changes.
        - For each change `{from, to}`:
            - It will find *one* checker element of the specified `seat` at the `data-point` corresponding to `from`.
            - It will then update that checker's `data-point` attribute to the `point` corresponding to `to`.
            - This function will not handle `data-pos` or locations other than points 0-23.
            - **Note:** The reconciliation will search for *any* checker at the `from` location and update its `data-point` to `to`. This is a minimal update, as the specific identity of the checker is not tracked.

- [ ] 4. **Create Minimal Orchestration Function**
    - [ ] Create and export `diffAndUpdatePoints(el, curr, prior)`.
        - This function will be the entry point for the minimal reconciliation.
        - It will iterate through each `seat`.
        - For each `seat`, it will call `diffPoints` to get the changes.
        - It will then call `reconcileMovedCheckers` to generate the DOM update effects.
        - It will pass the effects to `$.doseq` to execute them.

## Phase 6: Advanced UI Reconciliation (Deferred)

This phase will build upon the minimal reconciliation to handle all other game scenarios.

- [ ] 1. **Integrate Bar and Off-board Logic**
    - [ ] Extend the diffing logic to include changes in the `bar` and `off` properties of the game state.
    - [ ] Update `diffPoints` to return `{from, to}` changes where `from` or `to` can be "bar" or "off".
    - [ ] Update `reconcileMovedCheckers` to handle these new `from` and `to` values.

- [ ] 2. **Implement `data-pos` Stacking Reconciliation**
    - [ ] Create a `reconcileCheckerPositions(el)` function.
    - [ ] This function will execute after the `data-point` updates.
    - [ ] It will scan all locations (points, bar) and update the `data-pos` attribute of all checkers to ensure they stack correctly.

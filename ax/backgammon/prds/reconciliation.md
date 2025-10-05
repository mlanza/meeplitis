# Backgammon: UI Reconciliation — PRD

To ensure the visual representation of the game is always synchronized with the game state, the [UI](../../../src/games/backgammon/table/uJl/main.js) must intelligently update itself based on changes to the [model](./model.md). This process is not just for advancing the game state one step at a time. The user can navigate between any two "frames" in the game's history, such as jumping from the opening setup to the final move. This means the reconciliation logic must be robust enough to handle both small, single-move changes and large-scale changes between distant game states.  This gets handled in `$.sub($both, ...)`.

**Handling Initial Render (No Prior State)**: When the game is first loaded or initialized, the `prior` state will be `null`. In such cases, the reconciliation logic will not perform a diff. Instead, it will assume all checkers need to be placed according to the `curr` (current) game state, effectively performing a full render of the board.

The core principle is that all 30 checkers (15 per player) are always present in the SVG DOM. Reconciliation is simply a matter of updating attributes on these existing checker elements to reflect the new state. The primary attributes to update are `data-point` (which point, bar, or off-board area a checker is on) and `data-pos` (the stacking position on that point).

The reconciliation strategy is as follows:

**Flatten Locations**: For any two game states (`prior` and `curr`), the locations of each player's 15 checkers are "flattened" into a single, comprehensive list. This list accounts for checkers on the 24 points, on the bar, and those that have been borne off.

Build a `getCheckers(state)` function such that it takes the game state and returns an array of checker objects.  Each object notes `seat`, `point` and `pos` per the [rules of positioning](./locations.md).  That means, that if more than 5 checkers are in a location, several will be `pos` 5.  That is okay.

Example:

```js
[{seat: 0, point: 0, pos: 1}, {seat: 0, point: 0, pos: 2}, ...]
```

This function will be run once against `curr` and once against `prior`.  The results of each will be passed to `diffCheckers(curr, prior)`.  This function will return a minimal diff:

```js
[{target: {seat: 0, point: 16, pos: 3}, revised: {seat: 0, point: 18, pos: 1}}]
```

The next function `applyCheckerDiff(diffs)` takes that array and uses `$.each` to apply the update to the dom.  Understand that `point` and `pos` in the object maps to `data-point` and `data-pos` in the DOM.

## DOM Implementation Details

To apply changes to the DOM, checker elements need to be selected. The checkers can be selected based on their color, which is represented by an `href` attribute on the checker element.

* **White checkers (seat 0):** `[href="#cross-checker"]`
* **Black checkers (seat 1):** `[href="#crown-checker"]`

The `applyCheckerDiff` function must use these selectors to identify the checker elements for each player.

# Implementation Plan: Migrate from table.js/story.js to reel

## Goal

Migrate the Backgammon table UI from the legacy `table.js`/`story.js` approach
to the new `reel` shell architecture. The migration will be done incrementally
in small, verifiable drives, allowing side-by-side comparison with the working
`uJl` implementation.

## Background

The reel shell is a headless component that manages game timeline state and
provides a reactive event system. Based on CLI observation of table
`QDaitfgARpk`, the reel state structure is:

```javascript
{
  id: "QDaitfgARpk",
  seat: 0,
  touches: <array of event IDs>,
  cursor: { pos: 32, at: "ykEi3", max: 32, direction: -1 },
  perspectives: <cache of loaded perspectives>,
  perspective: {
    up: [0],           // whose turn
    may: [0],          // who may act
    seen: [0],         // who has seen
    event: {...},      // current event
    state: {...},      // game state (points, bar, off, dice, etc.)
    game: {...},       // game object with moves
    actor: {...},      // player who acted
    actionable: true   // can current player act
  },
  table: {...},
  wip: [{}, undefined],
  seated: [...],
  seats: [],
  up: true,
  undoable: "ykEi3",
  make: [Function],
  ready: true,
  act: true
}
```

The changed event system reports paths like:

- `["perspective"]` - entire perspective changed
- `["perspective", "state"]` - game state changed
- `["cursor", "pos"]` - cursor position changed
- `["up"]` - turn changed

## User Review Required

> [!IMPORTANT]
> **Breaking Point Strategy**: Each drive ends with a working, verifiable UI.
> The user can test at any checkpoint by comparing the `alt` folder
> implementation with the `uJl` reference implementation.

> [!WARNING]
> **No Heroic Leaps**: This plan deliberately takes small steps. Each drive
> changes only a focused subset of functionality to enable incremental testing.

## Proposed Changes

### Drive A: Setup for parallel migration

**Goal:** Remove dependency on `ui()` from table.js and prepare for parallel
migration.

#### [MODIFY] [main.js](file:///Users/mlanza/Documents/meeplitis/src/games/backgammon/table/alt/main.js)

- Remove lines 320-322 (the `ui` call)
- Remove imports from `/libs/table.js`: `ui`, `diff`, `which`
- Remove import from `/libs/story.js`: `moment`
- Extract `$wip` channel from `$reel`: `const $wip = $.chan($reel, "wip")`
- **Keep both subscriptions active**: The old `$.sub($both, ...)` (lines
  333-385) and the new `$.on($reel, "changed", ...)` (line 328)
- Both handlers will run in parallel during the migration
- The `changed` handler is currently just logging; we'll gradually move logic
  into it
- All `$wip` interactions (including `clear($wip)`) work exactly as before

**Verification:** Page loads, board renders, both handlers fire, no console
errors.

---

### Drive B: Migrate basic game state to reel

**Goal:** Move status, dice, stakes, and off count logic from old handler to new
handler.

#### [MODIFY] [main.js](file:///Users/mlanza/Documents/meeplitis/src/games/backgammon/table/alt/main.js)

**In the `changed` handler**, add logic to check paths and update UI:

```javascript
$.on(
  $reel,
  "changed",
  function ({ details: { changed, hist: [curr, prior] = [] } = {} }) {
    const ctx = "main";
    console.log({ ctx, changed, curr, prior });

    // Check if perspective changed
    if (_.some(_.eq(_, ["perspective"]), changed)) {
      const { perspective } = curr;
      const { state } = perspective || {};

      // Update status, dice, stakes, holdsCube, off
      if (state) {
        dom.attr(el, "data-status", state.status);
        // ... etc
      }
    }
  },
);
```

**In the old `$.sub($both, ...)` handler**, comment out or remove the
corresponding logic for these properties.

**Verification:** Navigate timeline, verify status/dice/stakes/off update
correctly from BOTH handlers initially, then only from new handler after
migration.

---

### Drive C: Migrate cursor and checker positioning to reel

**Goal:** Move checker positioning and navigation logic from old handler to new
handler.

#### [MODIFY] [main.js](file:///Users/mlanza/Documents/meeplitis/src/games/backgammon/table/alt/main.js)

**In the `changed` handler**, add cursor/checker logic:

- Check if `["cursor"]` or `["perspective"]` changed
- Derive `bwd` from `curr.cursor.direction === -1`
- Derive `present` from `curr.cursor.pos === curr.cursor.max`
- Update `data-bwd` attribute
- Handle checker positioning (initial vs. update) using `getCheckers()` and
  `diffCheckers()`

**In the old handler**, comment out the checker positioning logic (lines
~333-349).

**Verification:** Navigate timeline, verify `data-bwd` toggles correctly,
checkers animate properly from new handler.

---

### Drive D: Migrate game and moves logic to reel

**Goal:** Move game object access and move calculation from old handler to new
handler.

#### [MODIFY] [main.js](file:///Users/mlanza/Documents/meeplitis/src/games/backgammon/table/alt/main.js)

**In the `changed` handler**, add game/moves logic:

- Access `game` from `curr.perspective.game`
- Calculate moves using `g.moves(game, ...)`
- Update `data-allow-commands` with available command types
- Update `data-froms` with valid source positions
- Call `manageStacks(state)` for overstack counts

**In the old handler**, comment out the moves/commands logic (lines ~350-377).

**Verification:** Valid moves are highlighted, clicking shows destination
options from new handler.

---

### Drive E: Migrate event handlers to reel dispatch

**Goal:** Update all click and keyboard handlers to dispatch through reel.

#### [MODIFY] [main.js](file:///Users/mlanza/Documents/meeplitis/src/games/backgammon/table/alt/main.js)

**Update event handlers** (lines ~387-435):

- Change `$.dispatch($story, ...)` to
  `$.dispatch($reel, {type: "move", details: {move: ...}})`
- Navigation commands already work with reel (forward, backward, etc.)
- `$wip` was extracted in Drive A via `$.chan($reel, "wip")` and works exactly
  as before
- All `clear($wip)` calls work unchanged (on error, on move issued, on Escape)
- Verify `getMove()` function works with `curr.perspective.game`

**Note:** Event handlers are separate from subscriptions, so this doesn't affect
the parallel migration strategy.

**Verification:** All interactions work: clicking moves, buttons, keyboard
navigation.

---

### Drive F: Remove old highway

**Goal:** Remove the old subscription handler once all logic has been migrated.

#### [MODIFY] [main.js](file:///Users/mlanza/Documents/meeplitis/src/games/backgammon/table/alt/main.js)

**Only after Drives B-E are complete:**

- Verify the old `$.sub($both, ...)` handler is now empty or fully commented out
- Remove the entire old subscription (lines 333-385)
- Remove `$both` signal (line 324)
- Remove `reg({ $both, g })` call (line 326)
- Clean up any unused imports from table.js/story.js
- Remove console.log from `changed` handler

**Verification:** Complete side-by-side testing with `uJl` implementation. All
functionality should work identically using only the reel `changed` handler.

## Verification Plan

### Automated Tests

None exist currently. This is a UI migration with no unit tests.

### Manual Verification

Each drive will be verified manually by:

1. **Loading the page**: Navigate to the alt folder's index page
2. **Visual inspection**: Compare with uJl implementation side-by-side
3. **Timeline navigation**: Use arrow keys to navigate forward/backward through
   game history
4. **Move interaction**: Click on pieces and destinations to make moves
5. **Button interaction**: Click roll, commit, and other command buttons
6. **Keyboard shortcuts**: Test all keyboard shortcuts (arrows, Enter, Escape,
   etc.)

**Specific test sequence for final verification:**

```bash
# Start a local server (assuming one exists)
# Navigate to: http://localhost:XXXX/src/games/backgammon/table/alt/index.njk?id=QDaitfgARpk&seat=0

# Test timeline navigation:
- Press Left Arrow → should go backward
- Press Right Arrow → should go forward
- Press Shift+Left → should go to inception
- Press Shift+Right → should go to present

# Test move interaction (when it's your turn):
- Click a piece with valid moves → should highlight destinations
- Click a destination → should make the move
- Press Escape → should cancel selection

# Test buttons:
- Click "Roll" (if available) → should roll dice
- Click "Commit" (if available) → should commit turn

# Compare with uJl implementation:
# Open: http://localhost:XXXX/src/games/backgammon/table/uJl/index.njk?id=QDaitfgARpk&seat=0
# Verify identical behavior
```

> [!NOTE]
> The user will need to provide the actual local server command and port number
> for testing.

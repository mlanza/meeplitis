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

**Goal:** Extract $work channel and prepare for parallel migration with both
handlers running.

#### Recon: Focused Context for Drive A

**Core Principles:**

- **Parallel Migration Strategy** (PRD §127-147): Both highways operational—old
  `$.sub($both, ...)` and new `$.on($reel, "changed", ...)` run concurrently
- **Functional Core, Imperative Shell** (AGENTS §2.1): The `$work` channel is
  part of the shell; extract it properly using `$.chan($reel, "wip")`
- **One-Way Dataflow** (AGENTS §2.1): Simulation → render; verify both handlers
  receive state updates
- **UI Signals Remain** (PRD §105-111): The ui signals (including those created
  by the `ui()` call) must remain until the very end; cannot be removed early
  due to dependencies

**Key Mappings (PRD §54-98):**

- Extract `$work` channel via `$.chan($reel, "wip")` (PRD §80-89)
- `$work` is the replacement for the old `$wip` signal
- All `clear($work)` calls work unchanged (on error, move issued, Escape)
- `$snapshot` → `perspective.game` (PRD §66-69)

**Dependencies:**

- ✓ Reel shell already running (verified via CLI)
- ✓ `$reel` signal exists in main.js
- → No forward dependencies

**Verification Strategy:**

1. Run CLI: `cli.js QDaitfgARpk --seat 0 --changed "*"` to confirm reel state
2. Load page in browser
3. Check console: both handlers should log on state changes
4. Navigate timeline with arrow keys → both handlers fire
5. No errors in console

#### [MODIFY] [main.js](file:///Users/mlanza/Documents/meeplitis/src/games/backgammon/table/alt/main.js)

- Extract `$work` channel from `$reel`: `const $work = $.chan($reel, "wip")`
- **Keep the `ui` call** (lines 320-322) - it will be removed in Drive F
- **Keep both subscriptions active**: The old `$.sub($both, ...)` (lines
  333-385) and the new `$.on($reel, "changed", ...)` (line 328)
- Both handlers will run in parallel during the migration
- The `changed` handler is currently just logging; we'll gradually move logic
  into it
- All `$work` interactions (including `clear($work)`) will work exactly as
  before

---

### Drive B: Migrate basic game state to reel

**Goal:** Move status, dice, stakes, and off count logic from old handler to new
handler.

#### Recon: Focused Context for Drive B

**Core Principles:**

- **Simplification Imperative** (PRD §113-126): Use reel's single `changed`
  event handler; don't create new local signals
- **Check paths, not signals** (PRD §145-147): Use
  `_.some(_.eq(_, path), changed)` to detect what changed
- **Parallel Migration** (PRD §127-147): Move logic incrementally; both handlers
  run until old is empty

**Key Mappings (PRD §54-98):**

- `moment($story)` (old) → `perspective.game` (new) — fully-formed game snapshot
- Access via `curr.perspective.state` for game state properties
- `perspective` contains: `up`, `may`, `seen`, `event`, `state`, `game`,
  `actor`, `actionable`

**Dependencies:**

- ✓ Drive A complete: `$wip` extracted, both handlers active
- → No forward dependencies

**Verification Strategy:**

1. Navigate timeline forward/backward
2. Verify `data-status`, `data-dice`, `data-stakes` update from new handler
3. Comment out old handler logic → verify still works
4. Check console: no errors, clean state transitions

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

**Note:** `$work` channel was extracted in Drive A and is available for use.

**Verification:** Navigate timeline, verify status/dice/stakes/off update
correctly from BOTH handlers initially, then only from new handler after
migration.

---

### Drive C: Migrate cursor and checker positioning to reel

**Goal:** Move checker positioning and navigation logic from old handler to new
handler.

#### Recon: Focused Context for Drive C

**Core Principles:**

- **Cursor Navigation** (PRD §86-93): Handle arbitrary timeline jumps, not just
  sequential steps
- **Data First** (AGENTS §2.1): Derive `bwd`, `present` from cursor state; don't
  store separately
- **One-Way Dataflow** (AGENTS §2.1): Cursor changes → derive direction → update
  DOM

**Key Mappings (PRD §54-98):**

- Derive `bwd` from `curr.cursor.direction === -1`
- Derive `present` from `curr.cursor.pos === curr.cursor.max`
- Cursor structure: `{ pos: 32, at: "ykEi3", max: 32, direction: -1 }`
- Check `["cursor"]` or `["perspective"]` in changed array

**Dependencies:**

- ✓ Drive B complete: basic state migration working
- → Requires `getCheckers()` and `diffCheckers()` functions (already exist)
- → No forward dependencies

**Verification Strategy:**

1. Press Left Arrow → `data-bwd` should be "true", checkers move backward
2. Press Right Arrow → `data-bwd` should be "false", checkers move forward
3. Press Shift+Left → jump to inception, checkers reset
4. Press Shift+Right → jump to present, checkers at final positions
5. Verify smooth animations from new handler

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

#### Recon: Focused Context for Drive D

**Core Principles:**

- **Functional Core** (AGENTS §2.1): Game logic is pure; `g.moves()` calculates
  valid moves
- **Make Illegal States Unrepresentable** (AGENTS §2.6): Only show valid moves;
  UI reflects game rules
- **Data First** (AGENTS §2.1): Game object contains all move logic; query it,
  don't duplicate

**Key Mappings (PRD §54-98):**

- `moment($story)` (old) → `curr.perspective.game` (new)
- Game object has `moves` method: `g.moves(game, ...)`
- Update `data-allow-commands` with command types (roll, move, commit, etc.)
- Update `data-froms` with valid source positions for moves

**Dependencies:**

- ✓ Drive C complete: cursor and checker positioning working
- → Requires `manageStacks(state)` function (already exists)
- → No forward dependencies

**Verification Strategy:**

1. Navigate to a position where it's your turn
2. Verify valid pieces are highlighted (data-froms)
3. Click a piece → destinations should highlight
4. Verify only legal moves are shown
5. Check `data-allow-commands` reflects available actions

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

#### Recon: Focused Context for Drive E

**Core Principles:**

- **One-Way Dataflow** (AGENTS §2.1): DOM events → dispatch → simulation →
  render
- **Swap, Don't Mutate** (AGENTS §2.1): All state changes via dispatch, not
  direct mutation
- **Functional Core, Imperative Shell** (AGENTS §2.1): Event handlers are shell;
  they dispatch to core

**Key Mappings (PRD §54-98):**

- `$.dispatch($story, ...)` (old) →
  `$.dispatch($reel, {type: "move", details: {move: ...}})` (new)
- `$work` already extracted in Drive A; all `clear($work)` calls work unchanged
- Navigation commands (forward, backward, etc.) already work with reel

**Dependencies:**

- ✓ Drive D complete: game/moves logic working
- → Requires `getMove()` function (already exists)
- → No forward dependencies

**Verification Strategy:**

1. Click a piece → should select it (via reel dispatch)
2. Click destination → should make move (via reel dispatch)
3. Press Escape → should clear selection (clear($wip))
4. Click "Roll" button → should roll dice
5. Test all keyboard shortcuts (arrows, Enter, Escape)
6. Verify error handling: invalid moves should clear $wip

#### [MODIFY] [main.js](file:///Users/mlanza/Documents/meeplitis/src/games/backgammon/table/alt/main.js)

**Update event handlers** (lines ~387-435):

- Change `$.dispatch($story, ...)` to
  `$.dispatch($reel, {type: "move", details: {move: ...}})`
- Navigation commands already work with reel (forward, backward, etc.)
- `$work` was extracted in Drive A via `$.chan($reel, "wip")` and works exactly
  as before
- All `clear($work)` calls work unchanged (on error, on move issued, on Escape)
- Verify `getMove()` function works with `curr.perspective.game`

**Note:** Event handlers are separate from subscriptions, so this doesn't affect
the parallel migration strategy.

**Verification:** All interactions work: clicking moves, buttons, keyboard
navigation.

---

### Drive F: Remove old highway

**Goal:** Remove the old subscription handler once all logic has been migrated.

#### Recon: Focused Context for Drive F

**Core Principles:**

- **Simplification Imperative** (PRD §113-126): Remove complexity; one event
  handler, not many signals
- **Definition of Done** (AGENTS §4.3): CLI-verified, side-by-side tested, fully
  working
- **Parallel Migration Complete** (PRD §127-147): Old highway empty; safe to
  remove

**Key Cleanup:**

- Remove `$.sub($both, ...)` subscription (should be empty/commented by now)
- Remove `$both` signal creation
- Remove `reg({ $both, g })` call
- Remove unused imports: `ui`, `diff`, `which`, `moment` from table.js/story.js
- Remove debug console.log from `changed` handler

**Dependencies:**

- ✓ Drives A-E complete: ALL logic migrated to new handler
- → No forward dependencies
- → This is the final drive

**Verification Strategy:**

1. Complete side-by-side testing with uJl implementation
2. Run through entire game: roll, move, commit, navigate timeline
3. Verify identical behavior to uJl version
4. Check console: no errors, clean output
5. Verify table.js and story.js are no longer needed
6. Run CLI: `cli.js QDaitfgARpk --seat 0 --changed "*"` → confirm clean state

#### [MODIFY] [main.js](file:///Users/mlanza/Documents/meeplitis/src/games/backgammon/table/alt/main.js)

**Only after Drives B-E are complete:**

- Verify the old `$.sub($both, ...)` handler is now empty or fully commented out
- Remove the entire old subscription (lines 333-385)
- Remove `$both` signal (line 324)
- Remove `reg({ $both, g })` call (line 326)
- **Remove the `ui` call** (lines 320-322) - this is when ui signals are removed
- Remove imports from `/libs/table.js`: `ui`, `diff`, `which`
- Remove import from `/libs/story.js`: `moment`
- Clean up any other unused imports from table.js/story.js
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

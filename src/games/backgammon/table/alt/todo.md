---
agent:
  active_drive: null
  active_task: null
  drives: [A, B, C, D, E, F]
  confirm_on_switch: true
  archive_completed: false
---

# TODO: Migrate Backgammon Table from table.js/story.js to reel

## Drive A: Setup for parallel migration

**Goal:** Remove `ui()` dependency and prepare both subscription handlers to run
in parallel.

**Verification:** Both old and new handlers fire, page loads correctly.

**Recon:** Parallel migration (PRD §127-147); extract `$wip` via
`$.chan($reel, "wip")` (PRD §80-84); both highways operational.

A1. Remove the `ui` call from main.js lines 320-322
A2. Remove imports: `ui`,
`diff`, `which`, `moment`
A3. Extract `$wip` channel:
`const $wip = $.chan($reel, "wip")`
A4. Keep both subscriptions active: old
`$.sub($both, ...)` and new `$.on($reel, "changed", ...)`
A5. Verify page loads
and both handlers fire

**Checkpoint:** Both highways operational, ready to start moving traffic.

---

## Drive B: Migrate basic state to new handler

**Goal:** Move status, dice, stakes, off count logic from old handler to new
handler.

**Verification:** UI updates correctly from new handler.

**Recon:** Simplification (PRD §113-126); check paths with
`_.some(_.eq(_, path), changed)` (PRD §145-147); `moment($story)` →
`perspective.game` (PRD §62-64).

B1. Add logic to `changed` handler to check `["perspective"]` path
B2. Update
`data-status`, `data-dice`, `data-stakes`, `data-holds-cube` from
`perspective.state`
B3. Update off counts in player zones
B4. Comment out
corresponding logic in old `$.sub($both, ...)` handler
B5. Verify UI updates
correctly from new handler

**Checkpoint:** Basic state migrated, old handler has less logic.

---

## Drive C: Migrate checker positioning to new handler

**Goal:** Move checker positioning and motion logic from old handler to new
handler.

**Verification:** Checkers animate correctly from new handler.

**Recon:** Cursor navigation handles arbitrary jumps (PRD §86-93); derive `bwd`
from `cursor.direction` (don't store); Data First (AGENTS §2.1).

C1. Add cursor change detection to `changed` handler
C2. Derive `bwd` from
`cursor.direction`, `present` from `cursor.pos === cursor.max`
C3. Move checker
positioning logic (getCheckers, diffCheckers, updatePositioning)
C4. Comment out
checker logic in old handler (lines ~333-349)
C5. Verify checkers animate
correctly

**Checkpoint:** Checker positioning migrated, timeline navigation works.

---

## Drive D: Migrate game/moves logic to new handler

**Goal:** Move game object access and move calculation from old handler to new
handler.

**Verification:** Move highlighting works from new handler.

**Recon:** Functional Core (AGENTS §2.1); `g.moves()` is pure; Make Illegal
States Unrepresentable (AGENTS §2.6); `perspective.game` contains all move
logic.

D1. Access `game` from `curr.perspective.game` in `changed` handler
D2.
Calculate moves using `g.moves(game, ...)`
D3. Update `data-allow-commands` and
`data-froms` attributes
D4. Call `manageStacks(state)` for overstack counts
D5.
Comment out moves logic in old handler (lines ~350-377)
D6. Verify move
highlighting works

**Checkpoint:** Game/moves logic migrated, move selection works.

---

## Drive E: Update event handlers to dispatch through reel

**Goal:** Change all event handlers to dispatch through reel instead of story.

**Verification:** All interactions work with reel dispatch.

**Recon:** One-Way Dataflow (AGENTS §2.1): DOM events → dispatch → simulation →
render; Swap, Don't Mutate (AGENTS §2.1).

E1. Update button handlers: change `$.dispatch($story, ...)` to
`$.dispatch($reel, {type: "move", details: {move: ...}})`
E2. Update board click
handlers to use reel dispatch
E3. Verify keyboard handlers work (they should
already use correct commands)
E4. Verify `$wip` channel (extracted in Drive A)
works with all handlers and `clear($wip)` calls
E5. Test all interactions
end-to-end

**Checkpoint:** All interactions work through reel.

---

## Drive F: Remove old highway

**Goal:** Remove the old subscription handler and all legacy code.

**Verification:** Application works identically using only reel.

**Recon:** Simplification complete (PRD §113-126); Definition of Done (AGENTS
§4.3): CLI-verified, side-by-side tested; old highway empty.

F1. Verify old `$.sub($both, ...)` handler is empty/commented
F2. Remove old
subscription (lines 333-385)
F3. Remove `$both` signal and `reg({ $both, g })`
F4. Remove unused imports from table.js/story.js
F5. Remove console.log from
`changed` handler
F6. Side-by-side testing with `uJl` implementation

**Checkpoint:** Migration complete, only reel highway remains.

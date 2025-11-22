---
agent:
  active_drive: B
  active_task: null
  drives: [A, B, C, D, E, F]
  confirm_on_switch: true
  archive_completed: false
---

# TODO: Migrate Backgammon Table from table.js/story.js to reel

## Drive A: Setup for parallel migration

**Goal:** Extract $work channel and prepare both subscription handlers to run in
parallel.

**Verification:** Both old and new handlers fire, page loads correctly.

**Recon:** Parallel migration (PRD §127-147); extract `$work` via
`$.chan($reel, "wip")` (PRD §80-89); both highways operational; ui signals
remain until end (PRD §105-111).

A1. [x] Extract `$work` channel: `const $work = $.chan($reel, "wip")` A2. [x]
Keep the `ui` call (lines 320-322) - will be removed in Drive F A3. [x] Keep
both subscriptions active: old `$.sub($both, ...)` and new
`$.on($reel, "changed", ...)` A4. [x] Verify page loads and both handlers fire
A5. [x] Verify `$work` channel is accessible

**Checkpoint:** Both highways operational, ready to start moving traffic.

---

## Drive B: Migrate basic state to new handler

**Goal:** Move status, dice, stakes, off count logic from old handler to new
handler.

**Verification:** UI updates correctly from new handler.

**Recon:** Simplification (PRD §113-126); check paths with
`_.some(_.eq(_, path), changed)` (PRD §145-147); `moment($story)` →
`perspective.game` (PRD §62-64); `$snapshot` → `perspective.game` (PRD §66-69).

B1. [x] Add logic to `changed` handler to check `["perspective"]` path B2. [x]
Update `data-status`, `data-dice`, `data-stakes`, `data-holds-cube` from
`perspective.state` B3. [x] Update off counts in player zones B4. [x] Comment
out corresponding logic in old `$.sub($both, ...)` handler B5. [x] Verify UI
updates correctly from new handler B6. [x] Verify `$work` channel (from Drive A)
is available for use

**Checkpoint:** Basic state migrated, old handler has less logic.

---

## Drive C: Migrate checker positioning to new handler

**Goal:** Move checker positioning and motion logic from old handler to new
handler.

**Verification:** Checkers animate correctly from new handler.

**Recon:** Cursor navigation handles arbitrary jumps (PRD §86-93); derive `bwd`
from `cursor.direction` (don't store); Data First (AGENTS §2.1).

C1. Add cursor change detection to `changed` handler C2. Derive `bwd` from
`cursor.direction`, `present` from `cursor.pos === cursor.max` C3. Move checker
positioning logic (getCheckers, diffCheckers, updatePositioning) C4. Comment out
checker logic in old handler (lines ~333-349) C5. Verify checkers animate
correctly C6. Verify `$work` channel still works properly

**Checkpoint:** Checker positioning migrated, timeline navigation works.

---

## Drive D: Migrate game/moves logic to new handler

**Goal:** Move game object access and move calculation from old handler to new
handler.

**Verification:** Move highlighting works from new handler.

**Recon:** Functional Core (AGENTS §2.1); `g.moves()` is pure; Make Illegal
States Unrepresentable (AGENTS §2.6); `perspective.game` contains all move
logic.

D1. Access `game` from `curr.perspective.game` in `changed` handler D2.
Calculate moves using `g.moves(game, ...)` D3. Update `data-allow-commands` and
`data-froms` attributes D4. Call `manageStacks(state)` for overstack counts D5.
Comment out moves logic in old handler (lines ~350-377) D6. Verify move
highlighting works D7. Verify `$work` channel integration with game logic

**Checkpoint:** Game/moves logic migrated, move selection works.

---

## Drive E: Update event handlers to dispatch through reel

**Goal:** Change all event handlers to dispatch through reel instead of story.

**Verification:** All interactions work with reel dispatch.

**Recon:** One-Way Dataflow (AGENTS §2.1): DOM events → dispatch → simulation →
render; Swap, Don't Mutate (AGENTS §2.1).

E1. Update button handlers: change `$.dispatch($story, ...)` to
`$.dispatch($reel, {type: "move", details: {move: ...}})` E2. Update board click
handlers to use reel dispatch E3. Verify keyboard handlers work (they should
already use correct commands) E4. Verify `$work` channel (extracted in Drive A)
works with all handlers E5. Verify all `clear($work)` calls work properly (on
error, move issued, Escape) E6. Test all interactions end-to-end

**Checkpoint:** All interactions work through reel.

---

## Drive F: Remove old highway

**Goal:** Remove the old subscription handler and all legacy code.

**Verification:** Application works identically using only reel.

**Recon:** Simplification complete (PRD §113-126); Definition of Done (AGENTS
§4.3): CLI-verified, side-by-side tested; old highway empty.

F1. Verify old `$.sub($both, ...)` handler is empty/commented F2. Remove old
subscription (lines 333-385) F3. Remove `$both` signal and `reg({ $both, g })`
F4. Remove the `ui` call (lines 320-322) - this is when ui signals are removed
F5. Remove imports from `/libs/table.js`: `ui`, `diff`, `which` F6. Remove
import from `/libs/story.js`: `moment` F7. Remove any other unused imports from
table.js/story.js F8. Remove console.log from `changed` handler F9. Side-by-side
testing with `uJl` implementation

**Checkpoint:** Migration complete, only reel highway remains.

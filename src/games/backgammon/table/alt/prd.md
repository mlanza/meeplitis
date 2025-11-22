# Product Requirements Document: Backgammon Table Migration to Reel

## Overview

Migrate the Backgammon table UI from the legacy `table.js`/`story.js`
architecture to the new `reel` shell. The reel shell is a headless component
(see [AGENTS](../../../../../../atomic/AGENTS.md)) designed to replace the old
signal-based approach with a simpler, event-driven model.

**Key Constraints:**

- All work confined to the [alt folder](../alt)
- The [uJl folder](../uJl) remains untouched as a working reference
- No modifications to [reel.js](../../../../libs/reel) itself
- Incremental migration with frequent testing checkpoints

**Success Criteria:**

The migration is complete when the alt folder provides identical functionality
to uJl, but using only the reel shell's `changed` event handler. At that point,
`table.js` and `story.js` will be deprecated and no longer needed.

## Understanding Reel

### Exploring Reel State

You can inspect reel's internal state using the CLI:

```bash
cli.js QDaitfgARpk --seat 0 --changed "*"
```

This shows:

- All properties tracked for changes
- The shape of the internal state
- JSON snapshots of progressive state loading
- Changed events emitted during timeline navigation

### The Changed Event Handler

The main integration point is the `changed` event handler in
[main.js](./main.js):

```javascript
$.on(
  $reel,
  "changed",
  function ({ details: { changed, hist: [curr, prior] = [] } = {} }) {
    // Reconcile UI based on what changed
  },
);
```

- `changed` - array of paths that changed (e.g., `["perspective"]`,
  `["cursor", "pos"]`)
- `curr` - current reel state snapshot
- `prior` - previous reel state snapshot

## Reconnaissance with CLI

**Before starting any drive, use the CLI to understand the data.** The
[reel CLI](../../../../libs/reel/cli.js) is your primary reconnaissance tool. It
lets you observe reel's internal state and see exactly what changes are emitted.

### Basic Usage

```bash
./src/libs/reel/cli.js QDaitfgARpk --seat 0 --changed "*"
```

This command:

- Connects to table `QDaitfgARpk` as seat `0`
- Observes all changed events (`--changed "*"`)
- Shows progressive state loading
- Exits after initial load (non-interactive)

### What You'll See

The CLI output shows the **progressive loading** of reel state. Each snapshot
shows the state after a change, and each `changed` event shows what paths were
modified.

**Initial state (before perspective loads):**

```javascript
{ id: "QDaitfgARpk",
  seat: 0,
  cursor: { pos: null, at: null, max: null, direction: 1 },
  perspectives: "<0 entries>",
  table: "<21 entries>",
  wip: [ undefined ],
  seats: [],
  ready: true }
```

**Progressive changes as state loads:**

```javascript
changed { type: "changed", details: { hist: "<hidden>", changed: [ [], ["up"] ] } }
// State now includes: up: true

changed { type: "changed", details: { hist: "<hidden>", changed: [ [], ["act"] ] } }
// State now includes: act: false

changed { type: "changed", details: { hist: "<hidden>", changed: [ [], ["seated"] ] } }
// State now includes: seated: "<2 entries>"

changed { type: "changed", details: { hist: "<hidden>", changed: [ [], ["wip"], ["wip", 0] ] } }
// wip initialized: wip: [ {}, undefined ]
```

**Final state (after perspective loads):**

```javascript
{ id: "QDaitfgARpk",
  seat: 0,
  touches: "<33 entries>",
  cursor: { pos: 32, at: "ykEi3", max: 32, direction: -1 },
  perspectives: "<1 entries>",
  perspective: {
    up: [ 0 ],
    may: [ 0 ],
    seen: [ 0 ],
    event: {
      id: "ykEi3",
      seat: 0,
      type: "moved",
      details: { to: 21, die: 3, from: 18, capture: false }
    },
    state: "<8 entries>",
    metrics: [
      { off: 0, points: 1, conceded: false },
      { off: 0, points: 0, conceded: false }
    ],
    last_move: "HjCqu",
    actionable: true,
    game: "<hidden>",
    actor: { seat_id: "NjF", username: "capnemo", ... }
  },
  undoables: { Lnm0M: ["Lnm0M"], helK3: ["helK3"], ykEi3: ["ykEi3"] },
  last_acting_seat: "NjF",
  table: "<21 entries>",
  wip: [ {}, undefined ],
  seated: "<2 entries>",
  seats: [],
  up: true,
  undoable: "ykEi3",
  make: [Function: backgammon],
  ready: true,
  act: true
}
```

**The big changed event when perspective loads:**

```javascript
changed {
  type: "changed",
  details: {
    hist: "<hidden>",
    changed: [
      [],
      ["touches"],
      ["cursor"],
      ["cursor", "pos"],
      ["cursor", "at"],
      ["cursor", "max"],
      ["cursor", "direction"],
      ["perspectives"],
      ["perspectives", "ykEi3"],
      ["perspective"],
      ["undoables"],
      ["last_acting_seat"],
      ["act"]
    ]
  }
}
```

### Key Observations

1. **Progressive Loading:** State builds up incrementally. Your `changed`
   handler must handle partial state gracefully.

2. **Changed Paths:** The `changed` array contains all paths that were modified.
   Use this to optimize reconciliation - only update UI for what actually
   changed.

3. **Nested Paths:** Changes can be at any depth:
   - `["cursor"]` - entire cursor object changed
   - `["cursor", "pos"]` - just the position changed
   - `["perspectives", "ykEi3"]` - a specific perspective was added/updated

4. **Perspective Structure:** The `perspective` object contains everything you
   need:
   - `perspective.state` - game state (points, bar, off, dice, status)
   - `perspective.game` - game object with moves (hidden in CLI output)
   - `perspective.event` - the current event
   - `perspective.up`, `perspective.may` - turn and action indicators

5. **Work in Progress:** The `wip` array is initialized as `[{}, undefined]`.
   Extract it as a channel: `$.chan($reel, "wip")`.

### Interactive Mode

For deeper exploration, use interactive mode:

```bash
./src/libs/reel/cli.js QDaitfgARpk --seat 0 --changed "*" -i
```

Then use keyboard shortcuts:

- **Left Arrow** - backward one event
- **Right Arrow** - forward one event
- **Shift+Left** - jump to inception (beginning)
- **Shift+Right** - jump to present (end)
- **q** or **Escape** - quit

Watch how the `changed` events report cursor movements and perspective updates
as you navigate.

### Using CLI for Each Drive

**Before starting a drive:**

1. Run the CLI to see current state structure
2. Identify which paths you'll need to check in `changed`
3. Understand what data is available at each path
4. Note the shape of nested objects (cursor, perspective, etc.)

**Example for Drive B (basic state migration):**

```bash
./src/libs/reel/cli.js QDaitfgARpk --seat 0 --changed "perspective.state"
```

This shows only when `perspective.state` changes, helping you understand when to
update status, dice, stakes, etc.

## Migration Strategy

### Parallel Migration (The Two Highways)

**Both highways must remain operational during migration.** Think of this like
building a new highway while the old one stays open to traffic.

**Old Highway:** `$.sub($both, ...)` - the existing subscription handler **New
Highway:** `$.on($reel, "changed", ...)` - the new reel-based handler

**Process:**

1. Both handlers run in parallel
2. Gradually move UI update logic from old handler to new handler
3. Test after each piece is moved
4. Only remove old handler when it's completely empty

**Why?** This allows incremental testing. After each change, both
implementations should produce identical UI updates, giving you confidence the
migration is correct.

### Incremental Drives with Breaking Points

Don't plan heroic leaps. The migration is broken into small "drives" (see
[quarterbacking](../../../../../../atomic/agents/quarterbacking.md)), each with
clear stopping points for review.

Each drive should:

- Change only a focused subset of functionality
- End with a working, verifiable UI
- Allow side-by-side comparison with the uJl reference

You must be able to bring up the DOM-based UI, navigate the timeline, and see
the same behavior whether using the old or new implementation.

## Mapping Old Concepts to New

This migration is primarily a mapping exercise: determining how to source the
same conceptual signals using reel's state instead of the old signal-based
approach.

### State Access

| Old Approach                | New Approach                    | Description                                |
| --------------------------- | ------------------------------- | ------------------------------------------ |
| `moment($story)`            | `perspective.game`              | Fully-formed game snapshot in native model |
| `$snapshot` signal          | `perspective.game`              | Game state glimpse; phased out at end      |
| Access via separate signals | Access via `curr.perspective.*` | All perspective data in one place          |

The `perspective` object contains:

- `up` - whose turn
- `may` - (not used in this migration)
- `seen` - (not used in this migration)
- `event` - current event
- `state` - game state (points, bar, off, dice, etc.)
- `game` - game object with moves
- `actor` - player who acted
- `actionable` - can current player act

### Change Detection

| Old Approach                  | New Approach                   | Description                                       |
| ----------------------------- | ------------------------------ | ------------------------------------------------- |
| `which` signal                | Check `["wip"]` in `changed`   | Optimization to detect wip vs. main state updates |
| Separate signal subscriptions | Check paths in `changed` array | Use `_.some(_.eq(_, path), changed)`              |
| Multiple `$.sub()` calls      | Single `changed` handler       | One reconciliation point for all updates          |

### Work in Progress Channel

| Old Approach  | New Approach           | Description                                  |
| ------------- | ---------------------- | -------------------------------------------- |
| `$wip` signal | `$work` channel        | Scratchpad for building multi-click commands |
| `$.atom()`    | `$.chan($reel, "wip")` | Extract channel from reel                    |
| `clear($wip)` | `clear($work)`         | Clear on error, move issued, or Escape       |

**Important:** The `$work` channel is extracted from `$reel` using
`$.chan($reel, "wip")`. This is your replacement for the old `$wip` signal. All
interactions work the same: building up partial commands, clearing on errors,
etc.

### Timeline Navigation (Cursor)

The cursor enables free navigation through the game timeline. The UI must handle
arbitrary jumps, not just sequential steps.

**Cursor structure:**

```javascript
{
  pos: 32,        // current position
  at: "ykEi3",    // event ID at current position
  max: 32,        // maximum position (present)
  direction: -1   // -1 for backward, 1 for forward
}
```

**Derived values:**

- `bwd = cursor.direction === -1` - moving backward in time
- `present = cursor.pos === cursor.max` - at the latest event

**Navigation types:**

- Sequential: one step forward/backward
- Jumps: to inception (beginning), present (end), or specific event
- The reconciliation logic must handle all cases

### UI Signals Remain Until End

**Critical:** The ui signals created by the `ui()` call in `table.js` cannot be
removed early due to dependencies. These signals must remain in place until the
very end of the migration, after all logic has been ported from the old handler
to the new reel-based handler.

The `ui()` call will be removed in the final drive (Drive F), not at the
beginning.

## Simplification Imperative

The entire point of reel is to **simplify the signal model**. The old approach
created many separate signals (`$ready`, `$error`, `$story`, `$hist`,
`$snapshot`, `$wip`, `$both`, etc.).

**Do not recreate this complexity.**

Instead:

- Use reel's single `changed` event handler as the main reconciliation point
- All UI updates happen in response to the `changed` event
- Check the `changed` paths to determine what needs updating
- Don't create local `$.atom()` signals to mirror reel state

If you find yourself creating new local signals, you're doing it wrong. Just use
the `changed` event.

## Technical Details

### Reel State Structure

Based on CLI observation of table `QDaitfgARpk`:

```javascript
{
  id: "QDaitfgARpk",
  seat: 0,
  touches: <array of event IDs>,
  cursor: { pos: 32, at: "ykEi3", max: 32, direction: -1 },
  perspectives: <cache of loaded perspectives>,
  perspective: {
    up: [0],
    may: [0],
    seen: [0],
    event: {...},
    state: {...},
    game: {...},
    actor: {...},
    actionable: true
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

### Changed Event Paths

Examples of paths reported in the `changed` array:

- `["perspective"]` - entire perspective changed
- `["perspective", "state"]` - game state changed
- `["cursor", "pos"]` - cursor position changed
- `["cursor", "direction"]` - direction changed
- `["wip"]` - work in progress updated
- `["up"]` - turn changed

### Checking for Changes

Use this pattern to check if a specific path changed:

```javascript
if (_.some(_.eq(_, ["perspective"]), changed)) {
  // perspective changed, update UI
}

if (_.some(_.eq(_, ["cursor"]), changed)) {
  // cursor changed, update navigation UI
}

if (_.some(_.eq(_, ["wip"]), changed)) {
  // work in progress changed, update selection UI
}
```

## Migration Drives

The migration is broken into six drives (A-F), each building on the previous:

**Drive A:** Extract `$work` channel, verify both handlers run in parallel
**Drive B:** Migrate basic game state (status, dice, stakes, off counts) **Drive
C:** Migrate cursor and checker positioning **Drive D:** Migrate game object
access and move calculation **Drive E:** Update event handlers to dispatch
through reel **Drive F:** Remove old handler and ui signals

See [implementation-plan.md](./implementation-plan.md) for detailed breakdown.

## Verification Approach

After each drive, verify the UI works correctly:

1. Load the page in browser
2. Navigate timeline (arrow keys, jumps to inception/present)
3. Verify UI updates match the uJl reference implementation
4. Test interactions (clicking pieces, making moves, rolling dice)
5. Check console for errors

**Side-by-side testing:** Keep both alt and uJl implementations running. They
should behave identically at every checkpoint.

## References

- [Reel Shell](../../../../libs/reel/shell.js) - the headless component
- [Reel CLI](../../../../libs/reel/cli.js) - for inspecting state
- [AGENTS](../../../../../../atomic/AGENTS.md) - architectural principles
- [Quarterbacking](../../../../../../atomic/agents/quarterbacking.md) -
  incremental planning methodology
- [uJl Reference](../uJl) - working implementation to compare against

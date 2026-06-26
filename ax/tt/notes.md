# Tabletop request coordination notes

## Mental model & goals
- The CLI (and eventual TUI) observes `$tt`, which jumps every time the Supabase table is touched, the cursor crawls, and the perspective cache resolves. Those jumps are fine so long as we know when the underlying work has completed.
- Previously we chased a “settled predicate” to reduce the noisy stream, and that work largely succeeded. The remaining problem is that upstream wake-up events still trigger cascades of downstream requests, and external subscribers have no reliable way to tell when those requests have all finished.- What we want instead is an internal register of outstanding asynchronous work so the CLI can detect the moment the register reads zero and safely exit (or proceed confidently) even though atoms continue to recompute behind the scenes.
- The existing `can` helper shows the right pattern—wrap human commands so they only run when we are `ready`—but the Workboard should be the source of that readiness, not manual toggling, because dominoes can add tickets even when the direct guard is false.

## Work so far
- Observed that the command queue floods the console with timer and perspective logs, and realized that gating emissions only hides the symptom without giving us a hard signal about remaining work.
- Drafted this spec (`ax/tt/spec.md`) and TODO list (`ax/tt/TODO.md`) to reflect the new focus on tracking outstanding requests rather than filtering emissions.

## Current pain points
- The CLI still does not know whether Supabase fetches, perspective loads, or move/undo calls are still running; it can neither exit nor confidently declare the board settled.
- Without instrumentation in `src/libs/tt/cli.js` that watches the register, we cannot prove that the counter reaches zero before the next command or before exiting.

## Next steps reference
1. Build the outstanding request tracker described in the TODO, hook it into `src/libs/tt/shell.js`/`core.js`, and expose it to `src/libs/tt/cli.js` so the CLI can log the register with every snapshot.
2. Ensure every async touch point (touches, perspective, timer, move/undo) participates in the tracker with safe increments/decrements.
3. Use the CLI instrumentation as the proof-of-life: it should log only once the register is zero and the rest of the story is visible in the `$tt` snapshot.

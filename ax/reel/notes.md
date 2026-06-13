# Reel request coordination notes

## Mental model & goals
- The CLI (and eventual TUI) observes `$reel`, which zig-zags every time the Supabase table is touched, the cursor moves through the touches, and the perspective cache resolves. This is exactly the "ball hit → ball returns" rhythm: a touch arrives, timeline moves, perspective loads, and only then can an external consumer consider the state settled.
- Too many intermediate emissions are leaking to the CLI: every fetch and timer tick currently results in console output, making it difficult to tell when work has finished. The objective is to lower that noise so each meaningful navigation produces one settled snapshot while internal signals continue to fire behind the scenes.
- The short-term goal is to define and gate on a settled predicate that indicates the timeline reconciled the latest command and perspective, and to prove the CLI can navigate via queued commands while still logging the `$reel` snapshot for each move.
- Long-term we still intend to add queue tracking (a counter or registry) so the settled predicate has a definitive source of truth about outstanding requests, but for now the predicate is primarily heuristic-based and the CLI command queue provides the practical verification loop.

## Work so far
- Added `isSettledState` to `src/libs/reel/shell.js`, marking each derived `$state` with a `settled` flag and exposing `$settledState` so external subscribers (CLI) only see quiet snapshots.
- `Reel.sub` now listens to the filtered `$settledState` stream, preventing consumers from being overwhelmed by mid-flight signals.
- Introduced instrumentation in `reel/cli.js`: a `settled` counter log, `--command/-c` queue with programmable delays (5s pause, 2s between commands, 5s drain), and forced timeouts so we can safely run chains of navigation commands without manual interaction.
- Added logging after each queued command so the CLI explicitly outputs the full `$reel` snapshot (`logs` via `reg`) once the newly triggered perspective settles. This mirrors the output you expect to see in the terminal and proves we can observe the ping-pong sequence.
- Added `ax/reel/spec.md` to capture the mental model, concerns, and goals for the settled-state filtering, and `ax/reel/TODO.md` to align future work around defining the predicate first, then the queue tracker.

## Current pain points
- Despite the instrumentation, multiple backward commands still leave `cursor.at` pegged at the same touch and the perspective reappears unchanged, so the navigation isn’t yet reflected in the CLI output. That suggests either `exec({type: "backward"})` isn’t driving the timeline or the settled guard is blocking the new state.
- When command queue runs, the console is filled with timer-related logs (`{ timer: "stopped" }`) and eventually aborts before capturing a new settled emitter for each command. We need to ensure the settled predicate/queue timing aligns so each command produces a visible `$reel` JSON block showing the cursor/perspective change.
- I still need to confirm the queue and filtered stream both emit the `logs` output for every navigation step; right now only the initial settled state is printed, not the subsequent ones triggered by queued commands.

## Next steps reference
1. Tune the settled predicate so it yields true as soon as a new perspective is cached for the commanded `cursor.at` (without gating out the necessary emissions), and verify the CLI logs the JSON for each queued command.
2. If needed, add lightweight queue tracking (counter) that increments before each async request (touches/perspectives) and decrements afterward so the predicate can rely on an explicit signal rather than heuristics.
3. Make sure the CLI command queue run prints the `$reel` snapshot plus `c` counter for every navigation command, giving the full story (touch list, cursor position, perspective, undoables, etc.).
4. Keep the `ax/reel/spec.md` and `TODO.md` aligned with those steps so a fresh agent can pick it up.

These notes now serve as the fresh context you asked for. Point someone here and they’ll know exactly where we are: why we filter emits, how the CLI is instrumented, what’s still glitching (navigation commands not moving the cursor in the log), and what the next experiments should be. Let me know when you want me to restart collecting logs or refine the settled predicate. 
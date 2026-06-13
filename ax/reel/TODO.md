# TODO: Reel request coordination

- [ ] 1. Define a settled-state predicate and gate top-level emissions
  - Map the sequence of signals: when the table emit (touches updated), when the timer-driven catch-up loop fires, when perspectives resolve, and how `$state` currently reacts to each.
  - Identify the intermediate states that always occur before a new touch is processed—e.g., `touches` change, cursor steps, perspective cache entries appear, and a move command resolves—and characterize what “not settled yet” looks like (pending perspective, cursor not at final touch, queue of `getPerspective` calls still running, etc.).
  - Implement a pure validator function (settled check) that inspects the full derived state and short-circuits when any known unsettled pattern is present.
  - Wrap the `$state` stream (or its consumer) with a filter/transducer that only emits when the validator reports a settled state while still preserving access to the raw stream for debugging if needed.
  - Optionally tag the filtered state with a boolean flag so downstream consumers understand whether the emission is the quiet snapshot they can act on.
  - Use logging or the CLI counter to prove that the emitted states now skip the convulsions yet still allow the internal subscriptions to work.
See supporting details:
- [ax/reel/spec.md](ax/reel/spec.md)
- [src/libs/reel/shell.js](src/libs/reel/shell.js)
- [src/libs/reel/core.js](src/libs/reel/core.js)
- [src/libs/reel/cli.js](src/libs/reel/cli.js)

- [ ] 2. Track outstanding asynchronous work for long-term proofs
  - Enumerate every async touch point (`getTouches`, `getPerspective`, `move`, `undo`, timer updates, etc.) and document how they affect the state transitions identified earlier.
  - Introduce a shared counter/registry that increments before launching each request and decrements in a `finally`-style handler regardless of success or failure.
  - Surface that counter (or derived settled flag) inside the state so both the validator and external callers can see whether there is outstanding work.
  - Ensure the tracker is guarded against rapid repeats (e.g., timer tick while previous catch-up still running) so the count does not become inaccurate.
  - Validate via CLI instrumentation that the count goes to zero before the settled predicate returns true, confirming the heuristics match the hard truth.
See supporting details:
- [ax/reel/spec.md](ax/reel/spec.md)
- [src/libs/reel/shell.js](src/libs/reel/shell.js)

# TODO: Reel request coordination

- [ ] 1. Track outstanding asynchronous work for long-term proofs
  - Enumerate every async touch point (`getTouches`, `getPerspective`, `move`, `undo`, timer updates, etc.) and describe how each wakes the table/timeline/perspective resolution cycle.
  - Introduce a shared counter or registry that increments before sending each request, decrements in a `finally`-style handler no matter the outcome, and guards against double-counting when rapid repeats fire (timer ticks, duplicate table touches, etc.).
  - Surface the counter (or a derived "no outstanding work" flag) inside the derived state so both internal validators and external callers can read whether the system is still busy.
  - Expose the tracker to the CLI (`src/libs/reel/cli.js`) so it can pause or exit only when the register reports zero in-flight work; log the register alongside the usual `$reel` snapshot for proof.
  - Document how consumers should interact with the tracker so future async touch points (perspective refreshes, undo chains, move batches) can participate safely.

- [ ] 2. Build the Workboard class and wiring
  - Construct a Workboard helper/class that takes the `$queue` atom, `$error` atom, and derived `$ready` signal and keeps an internal counter of in-flight requests keyed by incremental ids.
  - Create the `$queue` atom and its derived `$altReady` signal so we can observe readiness while the rest of the platform remains unchanged.
  - Provide `register(key, op, blocking?)` so each async operation (touches, timer ticks, perspective fetches, moves/do-overs) can describe itself in terms of a promise-producing function and whether it must wait for `$ready` before starting.
  - Replace the `can` helper with `request(key, ...args)` so every request passes through the Workboard, adds a ticket to the registry, executes the registered op, and drops the ticket in a `finally` handler regardless of resolve or reject.
  - Keep `$workboard` as the pure state object that holds only in-flight items; derive `$ready` from whether this object is empty (ready when empty). `request` should reject/block blocking operations while the board is non-empty but should allow domino-triggered work to add tickets immediately.
  - Maintain `$error` as the sink for the most recent failure so rejected promises still settle the board without automatic retries.
  - Update documentation/specs to describe the Workboard-class contract and how new async actors register themselves.

See supporting details:
- [ax/reel/spec.md](ax/reel/spec.md)
- [src/libs/reel/shell.js](src/libs/reel/shell.js)
- [src/libs/reel/core.js](src/libs/reel/core.js)
- [src/libs/reel/cli.js](src/libs/reel/cli.js)

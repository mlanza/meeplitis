# Spec: Managing Reel Settled State

## Context
The `reel` CLI and the browser UI both observe an ever-shifting signal that reflects the backgammon timeline. As the CLI run showed, the signal convulses through multiple intermediate states whenever the table is touched (new moves arrive), the cursor updates, and the perspective cache fills in. Right now every little internal trigger emits to the top level, which makes it impossible for calling code—agents or the TUI—to know when work has actually “settled.”

## Mental model
1. **Table subscription & touches:** The shell seeds `$table` from Supabase and subscribes to table updates over `supabase.channel('db-messages')`. When Supabase publishes a change, the table atom changes (e.g., `touched_at`, `last_touch_id`, `status`). A `$.sub($table, ...)` hook calls `getTouches`, which fetches `touches` via the `touches` function and feeds them into the `$timeline` atom via `r.addTouches`. That update recomputes the core cursor (pos, max, at, direction) and can immediately change the derived state.
2. **Timer catch-up:** A 1 s timer (`timer(1000, Date.now)`) observes the timeline and, if the cursor is not present (cursor pos < max), repeatedly invokes `r.forward` until the timeline reaches `cursor.max`. This keeps the CLI in sync with recent touches when new events arrive while the client is not yet there. Each timer tick causes another timeline update, which again cascades through the derived `$state` stream.
3. **Perspective loading:** The `$state` atom merges timeline, table, seating info, and other gates. A subscription on `$state` (`$.sub($state, ...)`) inspects the timeline to build a list of `ats` (current `cursor.at` plus `nextAt` when browsing). For each `at`, it fetches `getPerspective`, and when the promise resolves, it swaps the timeline again to cache the perspective under `perspectives[at]`. This is asynchronous, so the state emits first without the perspective and later again once the response arrives.
4. **Application actions:** Dispatching commands (`$.dispatch`) interacts with Supabase functions (`move`, `undo`). Each actionable command stops the timer and either manipulates the core timeline (navigate commands) or calls a backend function to mutate the table. Those mutations propagate back through Supabase, replaying the previous steps (table updates → touches → timeline → perspective).
5. **Settled vs. unsettled:** Observing the above path reveals a consistent pattern: a table change (touch) arrives, the timeline cursor shifts, the perspective cache begins to resolve, and only after that response completes is the state truly consistent. While any of those steps are still in flight—touches still streaming, cursor behind `max`, perspective missing, timer still firing—the top-level state is unsettled and should be gated from external subscribers.

## Concerns discussed
* The system tracks table touches to know when a move occurs, but it immediately tries to resolve the perspective for those touches, and each response resets the signal. Without any understanding of the intermediate state, an external caller cannot tell whether it’s safe to act or should keep waiting for other async work.
* A settled point in the lifecycle is not just “table is up to date.” We must observe the pattern: a touch arrives, the cursor steps, the perspective cache resolves, and then the state can be considered stable. Until that path completes, the emission carries incomplete information.
* The internal signals (table updates, timer, perspective loading) are still necessary—some unpredictability arises from concurrent promise resolutions—but their churn should be invisible to the outside world except when the result is truly settled.
* The eventual goal is to build a validator (or transducer) that inspects the full derived state and stops emissions when the known unsettled patterns are active. We still want those internal signals to run so the machine keeps working; the filter simply prevents top-level subscribers from seeing the noise.
* Later we may layer on explicit bookkeeping (outstanding request counters) to prove the heuristics, but today’s focus is understanding and codifying the path that defines “not yet settled.”

## Goals for this work
1. **Observe and catalog the internal signal flow** so we can identify the clear pattern that defines a settled snapshot versus the convulsions that happen mid-work. Table touches, cursor positions, perspective caching, and timer behavior all contribute to this sequence.
2. **Encapsulate the settled logic in a single validator** that receives the derived state and returns false as soon as any known unsettled condition exists (pending perspective, cursor not at the final touch, in-progress perspective loads, etc.).
3. **Filter the exported `$state` stream** using that validator (or a transducer) so the CLI/agent only receives emissions when it is justified to do work or exit.
4. **Tag or expose the settled flag** for downstream consumers so they know whether an emission is weak (midstream) or quiet (settled). That makes it easier to slowly widen coverage if we need debug data in the future.
5. **Record the concrete discussion** that led to this spec so the reasoning is not lost and can be referenced later when revisiting settled behavior or when layering on tracking counters.

## Next steps
See `ax/reel/TODO.md` for the concrete task list derived from this spec and our conversation.

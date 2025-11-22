# Produce Requirements Document

I recently built [reel](../../../../libs/reel) and in particular its
[shell](../../../../libs/reel/shell.js). It is a headless component of the
variety discussed in [AGENTS](../../../../../../atomic/AGENTS.md) and its
surrounding docs. I mean for it to be the successor to
[tables.js](../../../../libs/tables.js) and
[story.js](../../../../libs/story.js), both of which in the long run go away.

You are not to touch them. You are not to touch reel.js. However, you may run
the [reel CLI](../../../../libs/reel/cli.js) to see what's going on under the
hood.

```bash
cli.js QDaitfgARpk --seat 0 --changed "*"
```

Issuing the above, will let you see all the properties for which changes are
tracked, as well as the general shape of its inner state. The JSON snapshots
lets you see how the state is progressively loaded. The changed events let you
see what changes are emitted which you can respond to.

I have already set up a "changed" handler [here](./main.js). That is your main
arena for work: inside the [alt folder](../alt). This folder was sourced from
[this one](../uJl). That one is NOT being touched. It serves as a safe reference
point of what works today. But it also permits you to study how messages were
handled and plan for how messages need to be handled using the new approach,
which is only just begun in the alt folder.

I want to migrate the code so that what works in the original will also work in
the new. However, I want to carefully migrate it in small increments which I can
test. Therefore, don't plan heroic leaps. Just port a bit at a time and halt
your efforts and permit me to check them. This is your top imperative. Because,
done correctly, I should be able to bring up a workable DOM-based user interface
on the web, and navigate the timeline and see in the UI all the same things I
expect, whether in the original or its replament. That's how I want to work. I
want side-by-side functioning implementations I can eyeball and evaluate.

Thus, your planning session had better have appropriate breaking points. I still
want a plan that I can review and follow. But it needs stopping points for my
review built in. Please study, the docs surrounding
[quarterbacking](../../../../../../atomic/agents/quarterbacking.md).

While I one day hope to segegate the subscriptions (e.g., `$.on`) into all the
different changes I care about, that effort is further on. Not now.

The reason is, if you study the orginal code, it is effectively one big
callback. In it, it does a lot of things top to bottom. That top-to-bottom flow
ensures a good sequence of updates and that's why I'm starting with a single
`changed` event handler in the new approach. Because, checking the `changed`
property in its details allows you to plan out and reconcile the state changes
with the UI, and have them happen in pretty much the same way.

## Mapping Old Concepts to New

This entire effort is largely just a mapping: from the old way to the new way.
You are checking what signals or data points existed before and what exist now
and determining how to best source the same conceptual signals.

**Key mappings:**

- **`moment`** (old) → **`perspective.game`** (new): The old code used
  `moment($story)` to get a fully-formed snapshot of the backgammon game in its
  native model. In reel, this is now found at `perspective.game`.

- **`which`** (old) → **check `["wip"]` in changed** (new): The old code used
  `which` to determine whether the primary state source updated or the wip (work
  in progress) updated. This was an optimization to prevent unnecessary
  reconciliation work. In the new approach, you can achieve the same
  optimization by checking if `["wip"]` is in the `changed` array.

- **`wip`** (work in progress): A separate atom/scratchpad for building the next
  command/move the player wishes to execute. Since the UI is primarily driven by
  clicking, it's impossible to issue some moves (the more complex ones) in a
  single click. You have to capture part of the command, see what the user is
  doing, understand what possible move they might be issuing, and progressively
  flesh out the move so that when it's fully formed it can be executed. In reel,
  `wip` is still available in the state.

  **Important**: `$wip` is its own channel and must be pulled out of `$reel`
  using `$.chan($reel, "wip")`. For the most part, all `$wip` interactions hold
  exactly as before in the old and new, including calling `clear($wip)` at the
  appropriate times (e.g., when an error occurs, when a move is issued, or when
  the user presses Escape).

- **`cursor`** (timeline navigation): The cursor concept means the app/user can
  freely navigate the timeline from one point to any other point. The entire
  reconciliation must understand this possibility. Navigation is **not always**
  one moment to the prior or the next—it may be a leap to the very beginning
  (inception), the very end (present), or to the middle somewhere (via clicking
  on a specific event). The reconciliation logic must handle arbitrary jumps,
  not just sequential steps.

Many signals are implemented unchanged. However, this new model was simplified
so there are a few (particularly the ones which are comparing the current and
prior snapshots) which were not directly ported (e.g., `bwd`, `step`) but which
can be easily derived.

The final result of this effort is my having a DOM-based UI which gets properly
reconciled after each changed event. This is the overarching goal. And by the
end of it, I will no longer need `table.js` or `story.js`. They will be
deprecated. I will handle that myself. Your job is to just get me there to the
point where they are no longer serving a purpose.

It is important to note that there are several pieces that are related to the
DOM and the game in question (Backgammon) which are provided the old way (see
`desc`, `describe` and `template`). That must still be handled. I don't care to
much about how you do it, but that will have to be one of teh first things in
your effort, so that the `ui` call which is immediately wired into `table.js`
can be omitted. That is probably a good starting point and the fruit of a single
coherent drive.

## Simplification Imperative

The entire point of reel is to simplify the signal model. The old approach
created many separate signals (`$ready`, `$error`, `$story`, `$hist`,
`$snapshot`, `$wip`, `$both`, etc.). **Do not recreate this complexity.**

Instead, use reel's single `changed` event handler as the main reconciliation
point. All UI updates should happen in response to the changed event, checking
the `changed` paths to determine what needs updating. This is the new model: one
event handler that reconciles everything.

If you find yourself creating local `$.atom()` signals to mirror reel state,
you're doing it wrong. Just use the changed event.

## Parallel Migration Strategy

**Both highways must remain operational.** The old subscription
(`$.sub($both, ...)`) and the new subscription (`$.on($reel, "changed", ...)`)
will coexist during the migration. Think of it like building a new highway while
the old one is still in use.

The strategy:

1. **Keep both subscriptions active** - Don't remove the old `$.sub($both, ...)`
   handler
2. **Gradually move logic** - Piece by piece, move UI update logic from the old
   handler to the new `changed` handler
3. **Verify incrementally** - After each piece is moved, verify both handlers
   still work
4. **Remove only when empty** - Only remove the old subscription when ALL logic
   has been successfully migrated

Use `_.some(_.eq(_, path), changed)` to check if a specific path changed in the
new handler. Both handlers will run in parallel until the old one is completely
empty.

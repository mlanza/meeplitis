# Produce Requirements Document

I recently built [reel](../../../../libs/reel) and in particular its [shell](../../../../libs/reel/shell.js).  It is a headless component of the variety discussed in [AGENTS](../../../../../../atomic/AGENTS.md) and its surrounding docs.  I mean for it to be the successor to [tables.js](../../../../libs/tables.js) and [story.js](../../../../libs/story.js), both of which in the long run go away.

You are not to touch them.  You are not to touch reel.js.  However, you may run the [reel CLI](../../../../libs/reel/cli.js) to see what's going on under the hood.


```bash
cli.js QDaitfgARpk --seat 0 --changed "*"
```

Issuing the above, will let you see all the properties for which changes are tracked, as well as the general shape of its inner state.  The JSON snapshots lets you see how the state is progressively loaded.  The changed events let you see what changes are emitted which you can respond to.

I have already set up a "changed" handler [here](./main.js).  That is your main arena for work: inside the [alt folder](../alt).  This folder was sourced from [this one](../uJl).  That one is NOT being touched. It serves as a safe reference point of what works today.  But it also permits you to study how messages were handled and plan for how messages need to be handled using the new approach, which is only just begun in the alt folder.

I want to migrate the code so that what works in the original will also work in the new.  However, I want to carefully migrate it in small increments which I can test.  Therefore, don't plan heroic leaps.  Just port a bit at a time and halt your efforts and permit me to check them.  This is your top imperative.  Because, done correctly, I should be able to bring up a workable DOM-based user interface on the web, and navigate the timeline and see in the UI all the same things I expect, whether in the original or its replament.  That's how I want to work. I want side-by-side functioning implementations I can eyeball and evaluate.

Thus, your planning session had better have appropriate breaking points.  I still want a plan that I can review and follow.  But it needs stopping points for my review built in.  Please study, the docs surrounding [quarterbacking](../../../../../../atomic/agents/quarterbacking.md).

While I one day hope to segegate the subscriptions (e.g., `$.on`) into all the different changes I care about, that effort is further on. Not now.

The reason is, if you study the orginal code, it is effectively one big callback.  In it, it does a lot of things top to bottom.  That top-to-bottom flow ensures a good sequence of updates and that's why I'm starting with a single `changed` event handler in the new approach.  Because, checking the `changed` property in its details allows you to plan out and reconcile the state changes with the UI, and have them happen in pretty much the same way.

Thus, this entire effort is largely just a mapping: from the old way to the new way.  You are just checking what signals or data points existed before and what exist now and determining how to best source the same conceptual signals.  Many are implemented unchanged.  However, this new model was simplified so there are a few (particularly the ones which are comparing the current and prior snapshots) which were not directly ported (e.g., `bwd`, `step`) but which can be easy derived.

The final result of this effort is my having a DOM-based UI which gets properly reconciled after each changed event.  This is the overarching goal.  And by the end of it, I will no longer need `table.js` or `story.js`.  They will be deprecated.  I will handle that myself.  Your job is to just get me there to the point where they are no longer serving a purpose.

It is important to note that there are several pieces that are related to the DOM and the game in question (Backgammon) which are provided the old way (see `desc`, `describe` and `template`).  That must still be handled.  I don't care to much about how you do it, but that will have to be one of teh first things in your effort, so that the `ui` call which is immediately wired into `table.js` can be omitted.  That is probably a good starting point and the fruit of a single coherent drive.


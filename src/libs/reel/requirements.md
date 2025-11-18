# Reel Requirements

## Introduction

This feature models a timeline of some game being played from the perpective of a seat at the table. Every discrete thing which happens is registered in that timeline.  It permits the user to review what happen and/or plan and issue a move.

As this is a headless component, the user in these requirements is the developer wrapping it with a user interface.  The component is instantiated from a table id and a seat index.

## Glossary
* **Timeline** - An indeterminate series of events each of which is identified by a 5-character id.
* **Moment** - A moment is identified by the event id precipitating the game state at that point in time.
* **Perspective** - The state and auxiliary data for the game at the select moment.  The data provided by the backend is filtered based on `seat` to exclude hidden information rather than reveal the full reality of the situation.  Since not all games have hidden information (e.g., Chess), the state may be unfiltered as well.  A perspective can be considered whollistically--just the intersection of `table_id` and `seat`--with or without thought to the moment (`event_id`) presently selected.  Perspective "data" is always in regard to a select moment.
* **Cursor** - A navigable timeline pointer enabling moment selection.  It is a positional index from 0 to some upper limit, which represents the present moment.
* **Present** - The last moment on record, the last event having occurred.  When the cursor points to the end of the timeline, a player is in the present.  The timeline updates in realtime since the backend is tracking and relaying moves made by other players.  Thus, the present can become the past at any time.

## Requirements

### Requirement 1

**User story:** When


# Backgammon Game State Model

This document describes the data structure, or "model," that represents the state of a Backgammon game. This model is the single source of truth for the game's logic. All game events produce a new, immutable version of this model.

## 1. Core Concepts

The game state is a JavaScript object. The following concepts are key to understanding the model.

### Players

There are two players, represented by numerical indices:

* `WHITE`: 0
* `BLACK`: 1

### Board Representation

The physical game board is represented by three properties in the state object: `points`, `bar`, and `off`.

* **`points`**: An array of 24 elements representing the triangles on the board. The index of the array corresponds to the point number minus one (e.g., `points[0]` is point 1, `points[23]` is point 24). Each element is a two-item array `[w, b]` where `w` is the number of `WHITE` checkers and `b` is the number of `BLACK` checkers on that point.

* **`bar`**: A two-item array `[w, b]` representing the number of checkers on the bar for each player. `bar[0]` is for `WHITE`, and `bar[1]` is for `BLACK`.

* **`off`**: A two-item array `[w, b]` representing the number of checkers that have been borne off the board for each player. `off[0]` is for `WHITE`, and `off[1]` is for `BLACK`.

## 2. Initial State

When a game is first created but not yet started, it is in its `init` state. This is the model before any moves have been made.

```javascript
{
  stakes: 1,
  status: "pending",
  dice: [],
  rolled: false,
  bar: [0, 0],
  off: [0, 0],
  points: [
    [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0],
    [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0],
    [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0],
    [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]
  ],
  holdsCube: -1 // Optional, present if doubling is enabled
}
```

### Initial State Properties

* `stakes`: The current value of the game (e.g., 1 point). This is multiplied when the doubling cube is used.
* `status`: The game's current status. It starts as `"pending"`.
* `dice`: An array holding the values of the dice for the current turn. It's empty initially.
* `rolled`: A boolean flag indicating if the current player has rolled the dice.
* `bar`: See Core Concepts. Initially, no checkers are on the bar.
* `off`: See Core Concepts. Initially, no checkers have been borne off.
* `points`: See Core Concepts. The board is empty.
* `holdsCube`: Indicates which player has control of the doubling cube. `-1` means the cube is in the middle and either player can make the first double. `0` for `WHITE`, `1` for `BLACK`. This property is only present if the game is configured to allow doubling.

## 3. Started State

Once the game begins, the model transitions to the `started` state. This involves setting up the checkers in their standard starting positions and designating the first player.

```javascript
{
  stakes: 1,
  status: "started",
  dice: [],
  rolled: false,
  bar: [0, 0],
  off: [0, 0],
  points: [
    [2, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 5],
    [0, 0], [0, 3], [0, 0], [0, 0], [0, 0], [5, 0],
    [0, 5], [0, 0], [0, 0], [0, 0], [3, 0], [0, 0],
    [5, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 2]
  ],
  holdsCube: -1, // Optional
  up: 0
}
```

### Started State Properties

The `started` state inherits most properties from the `init` state, with these key differences:

* `status`: Is now `"started"`.
* `points`: The array is now populated with the standard Backgammon starting position.
* `up`: This new property indicates whose turn it is. It is set to `0` for `WHITE` to start.

## 4. Model in Motion

The game progresses through a series of events (`roll`, `move`, `commit`, etc.), each of which takes the current state and produces a new one. The model is designed to be immutable.

### Key Dynamic Properties

* **`status`**: The `status` property tracks the high-level state of the game. It can be:
    * `"pending"`: Game created, not started.
    * `"started"`: Game in progress. This is the main state for gameplay.
    * `"double-proposed"`: One player has offered the doubling cube, and the other must accept or concede.
    * `"finished"`: The game has ended.

* **`up`**: The index of the player whose turn it is. This flips back and forth between `0` and `1`.

* **`dice`**: After a player rolls, this array is populated with two (or four, in the case of doubles) numbers. As the player uses dice for moves, the numbers are removed from this array.

* **`rolled`**: Set to `true` after the current player rolls the dice. It is reset to `false` when the turn is committed.

* **`bar`**, **`off`**, **`points`**: These are updated as checkers are moved, hit, entered from the bar, or borne off.

This model contains all the necessary information for the game engine to validate moves, determine game state, and for the UI to render a complete and accurate representation of the game.

## 5. Addendum: UI Representation

The game state model must accurately map to the visual representation of the game board. The primary UI component for the board is the SVG file located at `src/games/backgammon/table/uJl/images/backgammon-board.svg`.

It is critical to note that the points within this SVG are also identified using a zero-based index, from `point-0` to `point-23`. For example:

```xml
<g class="point" id="point-0">
  ...
</g>
<g class="point" id="point-1">
  ...
</g>
```

This 0-indexed `id` scheme in the SVG directly corresponds to the 0-indexed `points` array in the game state model. This alignment is fundamental for the UI code to render the board correctly based on the model's state and to translate user interactions with the SVG back into valid game moves.

## 6. UI Reconciliation

To ensure the visual representation of the game is always synchronized with the game state, the UI must intelligently update itself based on changes to the model. This process is not just for advancing the game state one step at a time. The user can navigate between any two "frames" in the game's history, such as jumping from the opening setup to the final move. This means the reconciliation logic must be robust enough to handle both small, single-move changes and large-scale changes between distant game states.

**Handling Initial Render (No Prior State)**: When the game is first loaded or initialized, the `prior` state will be `null`. In such cases, the reconciliation logic will not perform a diff. Instead, it will assume all checkers need to be placed according to the `current` game state, effectively performing a full render of the board.

The core principle is that all 30 checkers (15 per player) are always present in the SVG DOM. Reconciliation is simply a matter of updating attributes on these existing checker elements to reflect the new state. The primary attributes to update are `data-point` (which point, bar, or off-board area a checker is on) and `data-pos` (the stacking position on that point).

The reconciliation strategy is as follows:

1. **Flatten Locations**: For any two game states (`prior` and `current`), the locations of each player's 15 checkers are "flattened" into a single, comprehensive list. This list accounts for checkers on the 24 points, on the bar, and those that have been borne off.

2. **Calculate Diff**: The `current` and `prior` location lists are compared to produce a diff. This diff identifies exactly which locations have lost checkers (departures) and which have gained them (arrivals), regardless of how large the difference is between the two states.

3. **Minimal DOM Updates**: Instead of re-rendering the board, the diff is used to perform minimal and precise updates. For each checker that departed a location, its corresponding SVG element is identified and its `data-point` and `data-pos` attributes are updated to match a new location from the arrivals list. This ensures that only the checkers that need to move are affected, providing an efficient mechanism for both small and large state transitions.

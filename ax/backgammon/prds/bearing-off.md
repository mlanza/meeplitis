# Backgammon: Bearing Off — PRD

## 1. Scope

This document outlines the requirements to fully implement the "bearing off" phase of Backgammon. The game's `moves` function can already identify valid opportunities to bear off, but the engine does not yet process the corresponding command or update the game state.

This work involves:
1.  Introducing a new `bear-off` command.
2.  Handling this command in the `act` function.
3.  Creating a `borne-off` event to represent the action.
4.  Updating the `actuate` function to apply the state change, which results in a checker being moved to the "off" pile.

## 2. Core Logic and DRY Principles

The actions of moving (`move`), entering from the bar (`enter`), and bearing off (`bear-off`) are all variations of a single concept: moving a checker from one area to another. The implementation should reflect this to remain DRY (Don't Repeat Yourself).

The existing `moved(state, details)` function in `core.js` is already designed to handle these cases by interpreting the `from` and `to` properties of a move:

*   **Normal Move**: `from` and `to` are both valid points (0-23).
*   **Enter from Bar**: `from` is an invalid point (`-1` or `24`), and `to` is a valid point.
*   **Bear Off**: `from` is a valid point, and `to` is an invalid point (e.g., `24` for White, `-1` for Black).

This PRD proposes to unify the command and event handling for all three actions through this single, powerful `moved` function.

## 3. Command: `bear-off`

This command is issued by a player to remove one of their checkers from the board.

*   **JSON Format**:
    ```json
    {
      "type": "bear-off",
      "details": { "from": <point_index>, "die": <die_value> },
      "seat": <player_index>
    }
    ```

*   **Issuer**: The player whose turn it is (`up`).

*   **Preconditions**:
    1.  The game `status` must be `"started"`.
    2.  The player must have already rolled (`rolled: true`).
    3.  `canBearOff(state, seat)` must be `true`.
    4.  The move must be valid according to the rules of bearing off.
    *   *Note: All preconditions are already checked by the `moves` function, which serves as the single source of truth for valid commands.*

*   **Effects (in `act`)**:
    *   The command is validated against the list of possible moves.
    *   A `borne-off` event is generated and passed to the `actuate` function.

## 4. Event: `borne-off`

This event signifies that a checker was successfully removed from the board.

*   **JSON Format**:
    ```json
    {
      "type": "borne-off",
      "details": { "from": <point_index>, "die": <die_value> },
      "seat": <player_index>
    }
    ```

## 5. State Transitions in `core.js`

To implement this feature, the `act` and `actuate` functions in `src/games/backgammon/table/uJl/core.js` must be modified to unify the logic for all checker movements.

### 5.1. `act(self, command)` Modification

The `switch` statement should group `bear-off` with `move` and `enter`. A mapping should be used to transform the incoming command `type` into the appropriate event `type` (`moved`, `entered`, `borne-off`).

**Proposed Logic**:
```javascript
// In act(self, command)
// ...
  case 'bear-off': // Add this case
  case 'enter':
  case 'move': {
    const eventType = {
      'move': 'moved',
      'enter': 'entered',
      'bear-off': 'borne-off' // Add this mapping
    }[command.type];

    return _.actuate(self, _.assoc(command, "type", eventType));
  }
// ...
```

### 5.2. `actuate(self, event)` Modification

The `switch` statement should group the `borne-off` event with `moved` and `entered`. All three events will be handled by the single `moved(state, details)` transition function.

**Proposed Logic**:
```javascript
// In actuate(self, event)
// ...
  switch (event.type) {
    // ...
    case "entered":
    case "moved":
    case "borne-off": // Add this case
      return _.actuate(self, event, state => moved(state, event.details));
    // ...
  }
// ...
```

## 6. UI and Reconciliation Context

While the core logic is the primary focus, understanding the UI impact provides valuable context. The UI reconciliation process, defined in `ax/backgammon/prds/reconciliation.md`, works by updating `data-` attributes on checker elements.

*   **Board Representation**: The file `src/games/backgammon/table/uJl/images/backgammon-board.svg` defines the visual layout. It contains `<rect>` elements for the areas where checkers that are off the board are placed:
    *   `<rect id="off-board-white" ... />`
    *   `<rect id="off-board-black" ... />`

*   **Checker Placement**: When a checker is borne off, the model's `off` array is incremented. The UI reconciliation logic will detect this change and move a corresponding checker element to the off-board area. This is achieved by setting the checker's `data-point` attribute to a value representing the off-board area (e.g., `"off-board-white"` or `"off-board-black"`) and updating its `data-pos` for stacking.

No direct changes to the UI are needed for this task, as the existing reconciliation logic is designed to handle any valid state change. The work is confined to the `core.js` engine.

## 7. Winning the Game & Error Handling

*   **Winning**: The existing `won(state, seat)` function, which checks if `state.off[seat] === 15`, remains unchanged.
*   **Errors**: No new error types are required. The existing validation in `act` will reject invalid `bear-off` commands.

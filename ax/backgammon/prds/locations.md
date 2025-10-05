# PRD: Backgammon UI Locations

This document defines the product requirements for the Backgammon UI layout, focusing on the positioning of checkers on the board, bar, and off-board area.

## Board Layout

There are a total of 28 locations on the board where checkers can be placed:

* **24 Points:** The triangular spaces on the main board.
* **2 Bar Areas:** One for each player, located in the center of the board.
* **2 Off-Board/Exit/Starting Areas:** One for each player, located to the right of the board.

## Checker Positioning and Stacking

All 28 locations on the board (points, the bar, and the off-board area) share a common set of behaviors for checker placement and stacking.

* **5 Resting Spots:** Each location has 5 visual resting spots for checkers.
* **Stacking:** When a sixth or subsequent checker is placed on a location, it will stack on top of the 5th checker.
* **Counter:** A numerical counter will appear on the 5th checker to indicate the total number of checkers in that stack (e.g., a stack of 7 checkers will show a "7" on the 5th checker).
* **Positioning:** Position 1 is always closest to the edge of the board, while position 5 is always closest to the middle of the board.

Checkers will be positioned using absolute positioning relative to their containing elements (points, bar, and off-board area). The position of each checker will be determined by a `data-location` attribute.

### Points

* There are 24 points on the board, and they follow the general checker stacking rules described above.

### Bar

* The bar is located in the middle of the board and follows the general checker stacking rules.
* White moves from 1 to 24, and their bar is located in the upper half of the central bar area.
* Black moves from 24 to 1, and their bar is located in the lower half of the central bar area.

### Off-Board / Exit / Starting Area

* The off-board area is located to the right of the board and follows the general checker stacking rules.
* **White's Area:** Located to the right of the lower-right quadrant. This is where white's checkers start the game and where black's checkers are borne off.
* **Black's Area:** Located to the right of the upper-right quadrant. This is where black's checkers start the game and where white's checkers are borne off.

## Checker Lifecycle and Visibility

All 30 checkers (15 for each player) are always visible on the board. Their location changes throughout the game, but they are never hidden from view.

* **At the Ready:** Before the game begins, all checkers are in their respective starting areas (the opponent's off-board area). They are visible and "at the ready."
* **Game Start:** When the game starts, the checkers will animate from their starting areas to their initial positions on the points.
* **Game End:** The game ends when one of two conditions is met:
    * A player successfully bears off all 15 of their checkers.
    * A player concedes the game.

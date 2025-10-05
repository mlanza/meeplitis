# Backgammon

## Objective

Move all your checkers into your home board and bear them off before your opponent.

## Equipment

* Board with 24 points (triangles)
* 15 checkers per side (white/black)
* Two dice
* Doubling cube - used only if players agree before game starts

## Setup (Standard)

Each side places: 2 on the opponent’s 24-point; 5 on own 13-point; 3 on own 8-point; 5 on own 6-point. Players move in opposite directions: white 24→1, black 1→24.

Since these points are modeled using an array everything will be off by 1 since the first point in the array is 0.  Thus, the human numbers are 1 to 24.  The machine 0 to 23.

## Turn & Rolling

* Players are referred to as seats with seat 0 going first, then alternating to 1.
* On a normal turn, roll two dice; you may use each die for a separate move or both on one checker.
* Doubles grant four moves of that number.
* If you have no legal moves, the turn passes automatically.

## Movement & Occupancy

* A checker may move only to an open point: empty or occupied by your own checkers, or by a single opposing checker (a blot).
* You cannot move to a point with two or more opposing checkers.

## Hitting & Entering

* Landing on a blot hits it; the hit checker goes to the bar.
* If you have any checkers on the bar, you must enter them before moving other checkers.
* Entry is into the opponent’s home board using a die that corresponds to the destination point number.

## Bearing Off

* You may bear off only after all your checkers are in your home board.
* A die may bear off a checker from the matching point; if none, you must make a legal move using a higher point. If no higher checker exists, you may bear off from the highest occupied point lower than the die.

## Forced Play

* You must play both dice if possible; if only one die can be played, you must play the higher if only one can be played; for doubles, play as many pips as legally possible.

## Doubling Cube

* The cube starts at 1 (the initial stake value).
* On their turn, before rolling the dice, a player may offer to double the current stake.
* The opponent may:
  * **Accept** — the cube moves to their side, and the game continues at double the previous value.
  * **Decline** — they forfeit the game immediately at the current stake.
* Once a player accepts, only they have the right to redouble later.
* Redoubles may continue (2 → 4 → 8 → 16, etc.), but each must be offered before rolling and accepted or declined immediately.
* The maximum value is capped at 64.

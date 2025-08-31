# TODO: Backgammon UI Incremental Plan

This document outlines a step-by-step plan for building the Backgammon UI. The goal is to create the UI incrementally, using the Mexica and Up-down games as models.

## Phase 1: Basic Board and Checker Rendering

- [ ] 1.  **Render the board points:**
    - [ ] Create 24 points on the board.
    - [ ] Assign `id` markers to each point in the format `point-n`, where `n` is the point number (1-24).
    - [ ] The numbering should follow the standard Backgammon layout, so that white checkers move from 1 to 24 and black checkers move from 24 to 1.
    - [ ] Style the points to look like triangles, alternating colors.
    - [ ] Use CSS to position the points correctly on the board.

- [ ] 2.  **Render the checkers:**
    - [ ] The `ui.js` file already has basic logic for rendering checkers.
    - [ ] Style the checkers with the images in the `images` directory (`checker-black.svg`, `checker-white.svg`).
    - [ ] Position the checkers correctly on the points based on the initial game state.

## Phase 2: Dice and Player Info

- [ ] 1.  **Copy dice images:**
    - [ ] Copy the temple SVG files from `src/games/mexica/images/` to `src/images/` and rename them to represent dice faces (e.g., `die-1.svg`, `die-2.svg`, etc.).

- [ ] 2.  **Render the dice:**
    - [ ] Create a component to display the dice.
    - [ ] The dice values will come from the game state.
    - [ ] Display the correct dice images based on the dice values.

- [ ] 3.  **Display player information:**
    - [ ] Display the player avatars and usernames.
    - [ ] Indicate the current player's turn.

## Phase 3: Movement and Game Logic

- [ ] 1.  **Implement checker movement:**
    - [ ] When a player clicks on a point, highlight the possible moves.
    - [ ] When a player clicks on a valid destination point, move the checker.
    - [ ] Update the game state after each move.

- [ ] 2.  **Implement bearing off:**
    - [ ] Create a "bear off" area for each player.
    - [ ] Implement the logic for bearing off checkers.

- [ ] 3.  **Implement the doubling cube:**
    - [ ] Create a component for the doubling cube.
    - [ ] Implement the logic for doubling.

## Phase 4: Game End and Finishing Touches

- [ ] 1.  **Display the game outcome:**
    - [ ] When the game is over, display the winner.
    - [ ] Provide an option to play again.

- [ ] 2.  **Add animations and transitions:**
    - [ ] Add animations for checker movement and dice rolls.
    - [ ] Add transitions for other UI elements.

- [ ] 3.  **Refine the UI:**
    - [ ] Review the UI and make any necessary adjustments to improve the user experience.
# reel/todo.md - Incremental plan for the reel component

## Phase 1: Research and Documentation

- [x] Document existing `reel.js` behavior in `prd.md`.
- [x] Document `table.js` behavior in `prd.md`.
- [x] Document `story.js` behavior in `prd.md`.
- [x] Document `main.js` (Backgammon) behavior in `prd.md`.
- [x] Identify all data dependencies and signal paths (table → touches → perspective → game constructor) and record in `prd.md`.

## Phase 2: Functional Core (Simulation)

- [x] Define initial state structure for the `reel` core.
- [x] Implement pure functions for state transitions based on messages.
- [x] Define effect objects that the core can emit (e.g., `FetchPerspective`, `Log`).
- [x] Implement cursor logic functions, ensuring invariants are maintained.
- [x] Implement core functions for navigating through "touches" (e.g., `next`, `prev`, `goto`).
- [x] Implement core functions for managing perspective cache state (e.g., `addPerspective`, `clearCache`).

## Phase 3: Imperative Shell

- [x] Implement shell functions to interpret effect objects emitted by the core.
- [x] Implement network fetching for perspectives, including caching mechanism.
- [x] Implement dynamic import for game modules.
- [x] Implement logging.
- [x] Wire shell to dispatch results back to the core.

## Phase 4: CLI Layer

- [x] Set up Cliffy for command-line parsing.
- [x] Define CLI commands and arguments mirroring the original `reel`.
- [x] Implement CLI handlers to invoke shell APIs and display outputs.
- [x] Implement cache control flags (`--no-cache`, `--no-store`, `cache clear`).

## Phase 5: Validation

- [x] Perform CLI parity checks against the original `reel` component.
- [x] Ensure all features of the original `reel` are replicated.
- [x] Corrected import paths in `main.js`.

## Simulation-Complete Deliverable

- [x] Verify that the new `reel` component can simulate game states and navigate through them via the CLI, with core logic fully separated and shell handling effects and caching.

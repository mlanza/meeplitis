You are an AI assistant collaborating with an expert programmer on a backgammon project (and similar apps). Your role is to make **small, incremental changes** to the codebase that can be reviewed and committed step by step.

## Core Workflow
1. **Always start with `TODO.md`**
   * Outline a clear, ordered plan of the next steps.
   * Each item must be small, self-contained, and reviewable.
2. **Implement one item at a time**
   * After updating `TODO.md`, pick the first unchecked item.
   * Write code or docs only for that single item.
   * Stop once that item is complete, and wait for review.
   * As I guide you or you learn about the project feel free to record your thoughts in `THOUGHTS.md`.  Look here to improve your understanding of the project.
3. **Patch Mode**
   * Always produce unified diffs (git-apply compatible).
   * Never restate unchanged code.
   * Limit patches to ~100 lines. If more is needed, pause and propose a smaller plan.
   * You may only touch/create: `TODO.md`, `THOUGHTS.md`, `core.js`, `main.js`.

## Stage

We are implementing the functional core (FC).  That means we are not even beginning to look at the UI at this point.

## Meeplitis Games
We are implementing a board game, the architecture for which is found in `../meeplitis` and summarized in `../docs/meeplitis.md` . Your job is to understand and use its architecture.  For more difficult tasks, feel free to study source there instead of just the summary.

## Architecture & Style
* **Atomic**: Manage all state through a single atom created in `main.js`. Updates must go through swaps (Clojure-style). No ad-hoc mutation.
* **Functional Core, Imperative Shell (FC/IS)**:
  * **FC** → pure domain logic in `core.js`.
  * **IS** → side effects, orchestration, and story progression in `main.js`.
* **Code style**: Functional by default. Glue/architecture can be OOP where it makes sense. Use 2-space indentation, K\&R style.
* **Imports**:

  ```js
  import * as _ from "atomic_/core";
  import * as $ from "atomic_/shell";
  import * as dom from "atomic_/dom";
  import * as b from "./core.js";
  ```

## Functional Posture
* **Default to FP everywhere**: Even in the IS, functions should be data-in/data-out where possible.
* **Variable Declarations**: Prefer `const` almost exclusively. Avoid `let` or `var` for reassigning variables within the same function. A strong justification is required for their use (e.g., in 1% of cases).
* **Commands and Queries (CQS)**:
  * **Commands** (verbs) mutate state: `(…args) -> (state) -> newState`.
  * **Queries** (selectors) inspect state: `(…args) -> (state) -> value`.
* **Determinism**: Inject randomness or variability from IS, not FC.
* **Partial application**: The `_` binding from `atomic_/core` doubles as a placeholder for partial application. Never shadow it.
* **Higher-order commands**: Prefer `(…args) -> (state) -> newState`. State is always last.

## Command/Event Symmetry

If a command `type` is `roll`, `move`, `bear-off`, and `enter` then the corresponding event `type` will respectively be `rolled`, `moved`, `borne-off`, `entered`.

Likewise, if a separate function is needed to support the work, name the functions this way.

Ensure all commands and events have the structure `{ type, seat, details }`.

## Development Flow
* **Simulation-first**:
  * Begin by simulating stories via swaps in `main.js`.
  * Append swaps one at a time—never reorder earlier steps.
  * Each swap is a verb from the FC with explicit args.
  * Add inline comments to explain story intent.
* **Standing up the simulation**:
  * Start with `init` in FC to define the world’s “big bang.”
  * Add commands as needed to tell a full user story from start to completion.
  * Expand FC only minimally to support the current IS story step.
  * As coverage grows, most changes will involve only IS.
* **Correction without erasure**: If a prior step is wrong, create a new corrective command (`undoX`, `adjustY`) and append it—never rewrite history.

## Refactoring & Change Scope
* **Respect working code**: Don’t regenerate or rewrite functioning code unless strictly necessary.
* **Smallest viable change**: Touch the least surface area possible.
* **Containment**: Localize refactors behind functions/modules.
* **RFC-style plans**: If a broad refactor seems warranted, propose it in `TODO.md` with rationale, risks, migration steps, test strategy, and rollback plan—pause for review before acting.
* **Guardrails**: If a change would touch ~100 lines, stop and request confirmation.
* **Tests and invariants**: Add or update tests to lock in behavior before major changes.

## Files
* `backgammon.js`: Functional Core (pure logic, commands, queries).
* `main.js`: Imperative Shell (atom, swaps, orchestration).
* `index.html`: UI container (islands architecture). Leave untouched until UI stage.
* `TODO.md`: Always updated first with next steps.
* **Vendor files (do not touch)**:
  * `libs/atomic_/core.js`
  * `libs/atomic_/shell.js`
  * `libs/atomic_/dom.js`

## Expectations
* Always plan first, act second.
* Never implement more than one task before stopping.
* Preserve story progression as a readable, linear sequence of swaps.
* Code must be clean, maintainable, and aligned with Atomic principles.
* Your aim is slow, incremental growth toward a complete simulation.

## Commands
* Build: `npm run build`
* Test: `npm run test`


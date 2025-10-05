# Atomic Way

The key understanding and emphasis is on starting with simulation. This will happen inside the `main.js` for whatever game we are working on. In this site, there are many games and those `main.js` files are found under `table` subdirectories.

## Architecture & Style
* **Atomic**: Manage all state through a single atom created in `main.js`. Updates must go through swaps (Clojure-style). No ad-hoc mutation.
* **Functional Core, Imperative Shell (FC/IS)**:
  * **FC** → pure domain logic in `core.js`.
  * **IS** → side effects, orchestration, and story progression in `main.js`.
* **Code style**: Functional by default. Glue/architecture can be OOP where it makes sense. Use 2-space indentation, K&R style.
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
* **Containment**: Localize refactors behind functions/modules.
* **RFC-style plans**: If a broad refactor seems warranted, propose it in `TODO.md` with rationale, risks, migration steps, test strategy, and rollback plan—pause for review before acting.
* **Guardrails**: If a change would touch ~100 lines, stop and request confirmation.
* **Tests and invariants**: Add or update tests to lock in behavior before major changes.

## Files
* **Vendor files (do not touch)**:
  * `libs/atomic_/core.js`
  * `libs/atomic_/shell.js`
  * `libs/atomic_/dom.js`

## Expectations
* Code must be clean, maintainable, and aligned with Atomic principles.
* Your aim is slow, incremental growth toward a complete simulation.

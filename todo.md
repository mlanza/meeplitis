---
agent:
  active_drive: G
  active_task: G1
  drives: [A, B, C, D, E, F, G, H, I]
  confirm_on_switch: true
  archive_completed: true
---

**Drive A: Refactor `loadPerspective` and remove `perspective` from state.**

**Recon for Drive A:**
*   **Objective:** Refactor `loadPerspective` to explicitly take `at` (event ID) and remove `perspective` from core state, ensuring core purity and explicit contracts.
*   **Key Principles:**
    *   **FCIS & Purity (AGENTS 2.1, 2.5):** Ensure `loadPerspective`'s new signature and state changes align with pure function principles.
    *   **Make Illegal States Unrepresentable (AGENTS 2.6):** Removing unneeded state simplifies the model.
    *   **Vertical Slice & CLI Verification (Quarterbacking 3.1):** The changes must be verifiable via CLI after completion of the drive.
*   **Supports:**
    *   `prd2.md`: "I want the contract of `loadPerspective` to explicitly accept `at` (event id) as an argument. I don't want a `perspective` address at all in the state. It's unneeded."
    *   `AGENTS.md` (2.5 Purity & Data): Core functions are pure, explicit arguments.
*   **Dependencies/Constraints:**
    *   Need to identify the current implementation of `loadPerspective` and where `perspective` is stored/used in the core state.
    *   Need to find all call sites of `loadPerspective` to update them.
    *   The CLI verification step (A4) will require a way to trigger `loadPerspective` and observe its effect without relying on the removed `perspective` state.

*   A1: Modify `loadPerspective` signature to explicitly accept `at` (event ID).
*   A2: Remove `perspective` related state from the core's internal representation.
*   A3: Update all internal calls to `loadPerspective` to pass the new `at` argument.
*   A4: Verify via CLI that core functions dependent on `loadPerspective` operate correctly.

**Drive B: Introduce `cursor` to state and integrate `touches` updates.**
*   B1: Add a `cursor` object to the core state, containing `pos`, `at`, and `max`.
*   B2: Implement transactional updates for `cursor` bounds (`pos`, `at`, `max`) whenever `touches` (event history) is refreshed.
*   B3: Verify via CLI that the `cursor` state accurately reflects `touches` updates.

**Drive C: Implement `direction` in `cursor` for timeline navigation.**
*   C1: Define `FORWARD` (1) and `BACKWARD` ( -1) constants in the core.
*   C2: Add `direction` to the `cursor` object in the core state, initialized to `BACKWARD`.
*   C3: Implement logic to automatically set `cursor.direction` to `FORWARD` if `cursor.pos` is in the past relative to the current `touches` maximum.
*   C4: Verify via CLI that `cursor.direction` correctly reflects the timeline position.

**Drive D: Rename navigation commands and update CLI help.**
*   D1: Rename the internal core function `to_start` to `inception`.
*   D2: Rename the internal core function `to_end` to `present`.
*   D3: Update all internal and CLI-facing references to these renamed functions.
*   D4: Update the CLI's `--help` output to reflect the new `inception` and `present` command names.
*   D5: Implement `--timeout <seconds>` option for the CLI to force closure.
*   D6: Verify via CLI that `inception` and `present` commands work and `--help` is accurate.

**Drive E: Enforce navigation validity with `reposition` and caching.**
*   E1: Implement a core `reposition` function that takes a target position and ensures it's within valid `touches` bounds and has a cached perspective.
*   E2: Modify existing navigation convenience functions (e.g., `forward`, `backward`) to utilize the `reposition` function.
*   E3: Implement shell-side logic to determine the target `at` (event ID) for a requested navigation and pre-load the perspective into the cache before calling `reposition`.
*   E4: Verify via CLI that navigation commands prevent movement to invalid states and correctly trigger perspective pre-loading.

**Drive F: Implement `at` command and pre-caching based on `direction`.**
*   F1: Implement the core `at` command to allow direct navigation to a specified event ID, transactionally setting `cursor.direction` to `FORWARD`.
*   F2: Integrate pre-caching logic that uses `cursor.direction` to anticipate and preload the next perspective in the timeline.
*   F3: Update the CLI to expose the new `at` command.
*   F4: Verify via CLI that the `at` command functions correctly and pre-caching is active.

**Drive G: Address `cursor.at` validity and data access.**
*   G1: Revert mock `getTouches` in `src/libs/reel/main.js` to use real data access.
*   G2: Implement/verify logic to ensure `cursor.at` always points to a valid event ID from `touches` and that the corresponding perspective exists in the cache.
*   G3: Test `cursor.at` behavior with real data (or at least without the mock) to ensure it's always a valid event ID.

**Drive H: Correct CLI API for command passing.**
*   H1: Remove `--script` option from `src/libs/reel/cli.js`.
*   H2: Modify `src/libs/reel/cli.js` to accept multiple `-c <command>` arguments and execute them sequentially.
*   H3: Update the PRD (`src/libs/reel/prd.md`) to reflect the correct CLI command passing mechanism.
*   H4: Verify CLI command passing with multiple `-c` arguments.

**Drive I: PRD Clarification for `at` vs `pos`.**
*   I1: Update `src/libs/reel/prd.md` to clearly differentiate `at` (event ID/hash) from `pos` (integer index).

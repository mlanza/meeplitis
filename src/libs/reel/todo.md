---
agent:
  active_drive: null
  active_task: null
  drives: []
  confirm_on_switch: false
  archive_completed: true
---

# TODO

This plan outlines the work to refactor the `reel` component, following the principles in `AGENTS.md`.

## Drive A: Project Setup & Initial Simulation Core

This drive focuses on establishing the sandbox environment and creating the basic, non-interactive core of the simulation.

*   **A1: Create Sandbox Structure.** Establish the directory structure and initial files for the new `reel` component within the `meeplitis/src/libs/reel` sandbox. This includes `core.js`, `main.js`, `cli.js`, and `prd.md`.
*   **A2: Define Initial State.** In `core.js`, define the `init` function that creates the initial state structure for the Reel atom. This state will include `id` (tableId), `seat` (seatIndex), `pos`, `max`, `at`, and a place for the `timeline` (event touches) and the current `perspective`.
*   **A3: Implement Data Fetching.** Analyze the existing `reel.js` to understand how it fetches the game timeline data. Replicate this logic as a pure function in `core.js` that accepts the raw data and transforms it into the initial state. The side-effect of fetching will be handled in `main.js`.
*   **A4: Create Atom & Registry.** In `main.js`, create the central `$.atom` and command registry. The atom will be initialized with the state from `core.js`.
*   **A5: Implement Basic CLI.** In `cli.js`, create the basic command-line interface using Cliffy. It will accept `tableId` and `seat` as arguments, mimicking the original `reel.js`.
*   **A6: Verify Initial State.** Add a simple `show` command to the CLI that prints the current state from the atom. This will verify that the initial data loading and state setup are working correctly.

## Drive B: Timeline Navigation Logic (Pure Core)

This drive implements the pure functions for navigating the game timeline.

*   **B1: Implement Navigation Commands.** In `core.js`, create the pure functions for timeline navigation: `forward`, `backward`, `to_start`, `to_end`, and `to_pos`.
*   **B2: Ensure State Purity.** These functions will take the current state and arguments, returning a completely new state object with an updated `pos` and `at` value. They must not mutate the input state.
*   **B3: Implement Clamping.** Create and use a `clamp` helper function in `core.js` to ensure the `pos` value always remains within the valid bounds of `0` and `max`.
*   **B4: Update Perspective.** The navigation commands will trigger a fetch for the new perspective corresponding to the new `pos`. This will be handled by swapping in a command that performs the fetch effect in `main.js` and then updates the state with the new perspective.

## Drive C: Integrating Navigation into the CLI

This drive wires the pure navigation logic into the CLI, making the tool interactive.

*   **C1: Add Navigation to CLI.** Add the navigation commands (`forward`, `backward`, etc.) to `cli.js`. These CLI commands will invoke `$.swap` with the corresponding pure functions from `core.js`.
*   **C2: Implement Interactive Mode.** Enhance the CLI to support an interactive mode that listens for keystrokes (e.g., left/right arrow keys) to trigger timeline navigation, similar to the original tool.
*   **C3: Implement Scripted (Non-Interactive) Mode.** Allow a sequence of navigation commands to be passed as an argument to the CLI, enabling scripted testing and verification.
*   **C4: Compare with Reference.** Run the new CLI and compare its behavior and output against the original `reel.js` to ensure functional parity.

## Drive D: Finalization & Verification

This drive is for final review, refactoring, and preparing the deliverable.

*   **D1: Adherence Review.** Thoroughly review the entire implementation against the `AGENTS.md` principles. Refactor any code that deviates from the specified patterns (pure core, imperative shell).
*   **D2: Verify Purity.** Double-check that all functions within `core.js` are pure and free of side effects.
*   **D3: Isolate Effects.** Confirm that all side effects (DOM manipulation, network requests, logging) are properly contained within `main.js` and `cli.js`.
*   **D4: Prepare Verification Steps.** As per the "Definition of Done," prepare and document a clear list of CLI commands that the director can use to run and verify the completed `reel` tool.

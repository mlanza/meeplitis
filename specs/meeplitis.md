# Meeplitis Architecture Analysis

This document outlines the key architectural patterns observed in the `core.js` files for the Mexica and Up & Down the River games within the Meeplitis project. The architecture follows a clear Functional Core, Imperative Shell (FC/IS) model.

## 1. The Functional Core (FC)

The entire game logic is encapsulated within a "Functional Core" module, `core.js`. This file exports a single object that represents the game's contract.

### Key Exported Properties:

- **`name`**: A string identifier for the game (e.g., `"Mexica"`).
- **`init(config)`**: A pure function that creates the initial game state. It takes a configuration object (e.g., containing player information) and returns the starting `world`.
- **`act(world, cmd, ctx)`**: The command handler. This is the primary entry point for actions.
  - It validates if a given command (`cmd`) is legal in the current game state (`world`).
  - It is the **only place where side-effects are managed**. For example, if a die roll is needed, it would be handled here, often using a context object (`ctx`) to inject randomness.
  - If a command is valid, `act` creates an `event` and immediately calls `actuate` to produce a new `world` state, which it returns.
  - If a command is invalid, `act` returns the original, unmodified `world`.
- **`actuate(world, event)`**: The state transition function.
  - It is a **pure function** that takes the current state (`world`) and an `event` object and returns the new, updated `world` state.
  - It contains the core logic for how events deterministically modify the game state. It should not be called directly from the outside.
- **`queries`**: An object containing various **pure functions**.
  - These functions inspect the game state (`world`) and return derived information (e.g., `queries.isGameOver(world)`).
  - They never modify the state.

## 2. State Management

- **Immutable State (`world`)**: The entire state of the game is held in a single, immutable object, referred to as `world`.
- **State Transitions**: The state is never mutated directly. Instead, the `actuate` function always produces a new `world` object, representing the state after an event has occurred.

## 3. Command and State Flow

The interaction between the FC and the Imperative Shell (the orchestrator, e.g., `main.js`) is very simple:

1. **Command**: The shell issues a command object to the FC by calling `act(world, cmd)`.
2. **New State**: The `act` function synchronously returns a `world` object.
    - If the command was valid, this is a **new instance** of the world.
    - If the command was invalid, this is the **original, unmodified instance** of the world.
3. **Internal Event Handling**: Inside the FC, the `act` function is responsible for creating an `event` and passing it to `actuate`. The event object is an internal implementation detail and is not exposed to the shell.

This model ensures that the shell is only concerned with dispatching commands and receiving new states, while the FC fully encapsulates the event creation and state transition logic.

## 4. Key Architectural Principles

- **Purity**: A strong separation is maintained between pure functions (`actuate`, `queries`, `init`) and the handling of side-effects (isolated within `act`).
- **Immutability**: The game state (`world`) is never changed in place, which simplifies state management and debugging.
- **Command/Query Separation (CQS)**: `act` is the command part that initiates state changes, while `queries` are for reading state without side-effects.
- **Data-Oriented**: Commands and events are simple, descriptive data objects, making the system easy to reason about and log.

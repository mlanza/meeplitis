# Verification Steps

This document provides instructions on how to run and verify the functionality of the new `reel` CLI tool.

All commands should be run from the `/Users/mlanza/Documents/meeplitis` directory.

## 1. Default Mode (Initial Load)

This command runs the tool, loads the initial timeline and the perspective for the most recent event, and then exits. You will see the state logged to the console multiple times as it loads.

```zsh
deno run -A ./src/libs/reel/cli.js QDaitfgARpk --seat 0
```

## 2. Interactive Mode

This command starts the tool in interactive mode, allowing you to navigate the timeline using your keyboard.

```zsh
deno run -A ./src/libs/reel/cli.js QDaitfgARpk --seat 0 -i
```

**Controls:**

*   **Right Arrow:** Move forward one step in the timeline.
*   **Left Arrow:** Move backward one step in the timeline.
*   **Home Key:** Go to the very beginning of the timeline (`inception`).
*   **End Key:** Go to the very end of the timeline (`present`).
*   **'l' Key:** Go to the position of the last move in the current perspective.
*   **'a' Key:** You will be prompted to enter a specific event ID to jump to.
*   **'p' Key:** You will be prompted to enter a specific position number to jump to.
*   **Tab Key:** Toggle between elided (default) and full view of the state, particularly for the `perspectives` cache.
*   **'q' or 'escape':** Exit the application.

## 3. Scripted Mode

This command runs the tool and executes a pre-defined sequence of navigation commands. This is useful for testing and verification. The state will be logged after each command.

The following example script will:
1.  Load the timeline.
2.  Go to the beginning.
3.  Go to the event with id `73mqk`.
4.  Go to the position of the last move.
5.  Go to the end.

```zsh
deno run -A ./src/libs/reel/cli.js QDaitfgARpk --seat 0 --script "inception,at 73mqk,last-move,present"
```

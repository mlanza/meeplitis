// reel/cli.js - Cliffy-based command interface for the reel component

import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";
import { Input } from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/mod.ts";
import { keypress } from "https://deno.land/x/cliffy@v0.25.4/keypress/mod.ts";

import _ from "../atomic_/core.js"; // Adjusted path
import $ from "../atomic_/shell.js"; // Adjusted path
import * as Core from "./core.js";
import { createReelShell } from "./main.js";

// Main application state and dispatch
let currentCoreState = Core.initialState;
let interpretEffect; // Function to interpret effects from the shell

function dispatch(msg) {
  const { state: newState, effects } = Core.reduce(currentCoreState, msg);
  currentCoreState = newState;

  // Interpret effects
  if (effects && interpretEffect) {
    effects.forEach(interpretEffect);
  }

  // Log state changes for debugging (optional)
  // console.log("Core State:", currentCoreState);
}

// Function to handle interactive commands
async function handleInteractiveCommands() {
  for await (const event of keypress()) {
    try {
      switch (event.key) {
        case "left":
          dispatch({ type: Core.MSG.NAVIGATE, payload: { command: event.shiftKey ? "inception" : "back" } });
          break;

        case "right":
          dispatch({ type: Core.MSG.NAVIGATE, payload: { command: event.shiftKey ? "present" : "forward" } });
          break;

        case "l":
          dispatch({ type: Core.MSG.NAVIGATE, payload: { command: "last-move" } });
          break;

        case "m":
          const json = await Input.prompt("What move?");
          try {
            const moveCommands = JSON.parse(json);
            dispatch({ type: Core.MSG.ISSUE_MOVE, payload: { commands: moveCommands } });
          } catch (parseError) {
            console.error("Invalid JSON for move:", parseError);
          }
          break;

        case "f":
          dispatch({ type: Core.MSG.FFWD });
          break;

        case "q":
        case "escape":
          Deno.exit();

        default:
          break;
      }
    } catch (ex) {
      console.error("Interactive command error:", ex);
    }
  }
}

const reelCommand = new Command()
  .name("reel")
  .description("Reel through game history")
  .arguments("<table:string>")
  .option("--event <event:string>", "Event ID to start at")
  .option("--seat <seat:number>", "Seat number (integer) for perspective")
  .option("-i, --interactive", "Keep the program open for further input")
  .option("--no-cache", "Do not use cached perspectives (always fetch)")
  .option("--no-store", "Do not store fetched perspectives in cache")
  .action(async (options, tableId) => {
    try {
      console.log("CLI Action: Starting...");
      const accessToken = Deno.env.get("SUPABASE_SESSION_ACCESS_TOKEN") || null;
      const seat = _.maybe(options.seat, parseInt);
      const initialEvent = options.event || null;

      // Initialize core state
      currentCoreState = {
        ...Core.initialState,
        tableId: tableId,
        accessToken: accessToken,
        seat: seat
      };
      console.log("CLI Action: Core state initialized.");

      // Initialize the shell and get the effect interpreter
      const shell = createReelShell(currentCoreState, dispatch, {
        noCache: options.noCache,
        noStore: options.noStore
      });
      interpretEffect = shell.interpretEffect;
      console.log("CLI Action: Shell created and interpretEffect set.");

      // Initial effects from core initialization
      const { effects: initialEffects } = Core.initReel({
        tableId: tableId,
        accessToken: accessToken,
        seat: seat
      });
      if (initialEffects) {
        console.log("CLI Action: Dispatching initial effects...");
        for (const effect of initialEffects) {
          try {
            await interpretEffect(effect); // Await each effect to ensure order and catch errors
          } catch (effectError) {
            console.error("CLI Action: Error dispatching initial effect:", effectError);
            dispatch({ type: Core.MSG.SET_ERROR, payload: effectError.message });
            Deno.exit(1);
          }
        }
        console.log("CLI Action: Initial effects dispatched.");
      }

      // If an initial event was provided, navigate to it
      if (initialEvent) {
        console.log(`CLI Action: Navigating to initial event: ${initialEvent}`);
        dispatch({ type: Core.MSG.NAVIGATE, payload: { command: "goto", value: initialEvent } });
      }

      // Subscribe to core state changes for CLI output
      $.sub(shell.state, (state) => {
        // console.clear(); // Clear console for fresh output - might be too aggressive for debugging
        console.log("\n--- Current Reel State ---");
        console.log("Table ID:", state.tableId);
        console.log(`Position: ${state.cursor.at + 1} / ${state.cursor.max + 1}`);
        console.log("Current Event ID:", Core.getCurrentEventId(state));
        console.log("Ready for input:", state.ready);
        console.log("Timer Active:", state.timerActive);
        if (state.error) {
          console.error("Error:", state.error);
        }
        // Optional: Render game state
        // const gameInstance = Core.getCurrentGameInstance(state);
        // if (gameInstance) {
        //   console.log("Game State:", gameInstance.state); // Assuming gameInstance has a 'state' property
        // }
        console.log("--------------------------");
      });
      console.log("CLI Action: Subscribed to shell state for output.");


      if (options.interactive) {
        console.log("CLI Action: Entering interactive mode. Press 'q' or 'escape' to exit.");
        await handleInteractiveCommands();
      } else {
        console.log("CLI Action: Non-interactive mode. Waiting for initial effects to settle, then exiting.");
        // In non-interactive mode, we should wait for all initial effects to complete
        // before exiting, otherwise, the script might terminate before data is fetched.
        // A simple way is to wait for 'ready' state or a specific effect completion.
        // For now, we'll just let it run for a bit or rely on the async nature of effects.
        // If the script exits too quickly, consider adding a mechanism to wait for 'ready'.
        // For now, we'll just let the process run until all async tasks are done or it's manually terminated.
      }
      console.log("CLI Action: Finished.");
    } catch (e) {
      console.error("CLI Action: An unexpected error occurred:", e);
      Deno.exit(1);
    }
  });

reelCommand.command("clear-cache")
  .description("Clears the in-memory perspective cache.")
  .action(() => {
    dispatch({ type: Core.MSG.CLEAR_CACHE });
    console.log("Perspective cache cleared.");
  });

await reelCommand.parse(Deno.args);

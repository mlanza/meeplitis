import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";
import { keypress } from "https://deno.land/x/cliffy@v0.25.4/keypress/mod.ts";
import _ from "./atomic_/core.js";
import $ from "./atomic_/shell.js";
import shell from "./flick-shell.js";

// Custom log function for pretty printing top-level keys
function prettyLog(obj) {
  if (typeof obj !== 'object' || obj === null) {
    console.log(obj);
    return;
  }
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (typeof value === 'object' && value !== null) {
        console.log(`${key}: ` + Deno.inspect(value, { colors: true, compact: true, depth: 7, iterableLimit: 100 }));
      } else {
        console.log(`${key}:`, value);
      }
    }
  }
}

function displayHelpMenu() {
  console.log("\n--- Interactive Controls ---");
  console.log("  ←/→ (Left/Right Arrow) : Step backward/forward one event");
  console.log("  Shift + ←/→            : Go to the first/last event");
  console.log("  p                        : Print current Perspective object (at current 'at')");
  console.log("  c                        : Print current Cursor object");
  console.log("  t                        : Print full Touches list");
  console.log("  h or ?                   : Show this help menu");
  console.log("  q or escape              : Quit the application");
  console.log("--------------------------");
}

async function interactiveMode() {
  displayHelpMenu();
  
  for await (const event of keypress()) {
    if (event.key === "q" || event.key === "escape") {
      console.log("Exiting...");
      Deno.exit(0);
    }

    const state = _.deref(shell.store);

    switch (event.key) {
      case "p":
        console.log("\n--- PERSPECTIVE ---");
        prettyLog(state.perspectives[state.cursor.at] || { status: "Not loaded" });
        break;
      
      case "c":
        console.log("\n--- CURSOR ---");
        prettyLog(state.cursor);
        break;

      case "t":
        console.log("\n--- TOUCHES ---");
        prettyLog(state.touches);
        break;

      case "h":
      case "?":
        displayHelpMenu();
        break;

      case "left":
        shell.dispatch({ type: "Step", payload: { delta: -1 } });
        break;

      case "right":
        shell.dispatch({ type: "Step", payload: { delta: 1 } });
        break;
      
      // Cliffy keypress doesn't easily distinguish shift on its own
      // Re-mapping to home/end for first/last event
      case "home":
        shell.dispatch({ type: "NavigateTo", payload: { pos: 0 } });
        break;

      case "end":
        shell.dispatch({ type: "NavigateTo", payload: { at: "present" } });
        break;
    }
  }
}

await new Command()
  .name("flick")
  .description(`A functional replacement for reel.js with an interactive timeline.`)
  .option("-t, --table-id <id:string>", "The table ID to connect to.", { required: true })
  .option("-s, --seat <seat:number>", "The seat number to occupy.", { required: true })
  .option("-a, --at <eventId:string>", "Go to a specific event ID on startup.")
  .option("-i, --interactive", "Enable interactive mode with keypress controls.")
  .action((options) => {
    const session = { accessToken: Deno.env.get("SUPABASE_SESSION_ACCESS_TOKEN") || null };
    
    console.log("Initializing shell...");

    let lastAt = null;
    $.sub(shell.store, (state) => {
      const { cursor, touches } = state;
      if (touches && cursor.at !== lastAt) {
        lastAt = cursor.at;
        console.log(`\n[${cursor.pos}/${cursor.max}] Event: ${cursor.at}`);
      }
    });

    shell.run({ ...options, session });

    if (options.interactive) {
      const unsub = $.sub(shell.store, (state) => {
        if (state.touches) {
          unsub();
          interactiveMode();
        }
      });
    } else {
      console.log("Non-interactive mode. Exiting.");
      Deno.exit(0);
    }
  })
  .parse(Deno.args);

#!/usr/bin/env -S deno run --allow-env --allow-read --allow-write --allow-net

import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";
import { keypress } from "https://deno.land/x/cliffy@v0.25.4/keypress/mod.ts";
import { Input } from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/mod.ts";
import { bootstrap, dispatch } from "./main.js";
import { registry } from "../cmd.js";

let fullView = false; // State to control logging verbosity

function logCurrentState(){
  const state = _.deref(registry.$state);
  const stateToLog = { ...state }; // Create a shallow copy
  if (!fullView && stateToLog.perspectives) {
    stateToLog.perspectives = `<elided: ${Object.keys(stateToLog.perspectives).length} entries>`;
  }
  $.log(Deno.inspect(stateToLog, { colors: true, compact: true, depth: Infinity, iterableLimit: Infinity }));
}

async function interactiveMode() {
  for await (const event of keypress()) {
    if (event.key === "q" || event.key === "escape") {
      Deno.exit();
    } else if (event.key === "right") {
      dispatch("forward");
    } else if (event.key === "left") {
      dispatch("backward");
    } else if (event.key === "home") {
      dispatch("inception");
    } else if (event.key === "end") {
      dispatch("present");
    } else if (event.key === "l") {
      dispatch("last-move");
    } else if (event.key === "a") {
      const at = await Input.prompt("Go to event id:");
      dispatch("at", at);
    } else if (event.key === "p") {
      const pos = await Input.prompt("Go to position:");
      // Note: to_pos is not fully supported by the new proactive navigation
      // This is a simplification for now.
      const $state = registry.$state;
      const { w } = registry;
      $.swap($state, w.to_pos, parseInt(pos));
    } else if (event.key === "tab") {
      fullView = !fullView;
      logCurrentState(); // Re-log with new view setting
    }
  }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scriptedMode(commands) {
  const cmds = _.split(commands, ",");
  for (const cmd of cmds) {
    const [command, arg] = _.split(cmd.trim(), " ");
    dispatch(command, arg);
    await sleep(1000); // Wait for potential async operations to settle
  }
  setTimeout(() => Deno.exit(), 2000); // Final wait for last operation
}

await new Command()
  .name("reel")
  .description("A tool for replaying game timelines.")
  .arguments("<table:string>")
  .option("--seat <seat:number>", "Seat number (integer)")
  .option("-i, --interactive", "Run in interactive mode.")
  .option("-s, --script <commands:string>", "Run a script of comma-separated commands.")
  .option("--inception", "Jump to the initial game state.")
  .option("--present", "Jump to the current moment; only from here may moves be issued.")
  .option("--timeout <seconds:number>", "Force the CLI to exit after a specified number of seconds.")
  .option("--at <event_id:string>", "Jump directly to a specific event ID.")
  .action(async function (opts, table){
    const seat = _.maybe(opts.seat, parseInt);
    const accessToken =  Deno.env.get("SUPABASE_SESSION_ACCESS_TOKEN") || null;

    if (opts.timeout) {
      setTimeout(() => {
        console.error(`CLI timed out after ${opts.timeout} seconds.`);
        Deno.exit(1);
      }, opts.timeout * 1000);
    }

    await bootstrap(table, seat, accessToken);

    $.sub(registry.$state, logCurrentState);

    const commandsToExecute = [];
    if (opts.inception) {
      commandsToExecute.push("inception");
    }
    if (opts.present) {
      commandsToExecute.push("present");
    }
    if (opts.at) {
      commandsToExecute.push(`at ${opts.at}`);
    }

    for (const cmd of commandsToExecute) {
      const [commandName, arg] = _.split(cmd, " ");
      dispatch(commandName, arg);
      await sleep(500); // Small delay between commands
    }

    if (opts.interactive) {
      interactiveMode();
    } else if (opts.script) {
      scriptedMode(opts.script);
    } else if (commandsToExecute.length > 0) {
      // If only flags were used, exit after execution
      setTimeout(() => Deno.exit(), 2000);
    } else {
      // If not interactive, scripted, or flags, exit after initial load.
      setTimeout(() => Deno.exit(), 2000);
    }
  })
  .parse(Deno.args);

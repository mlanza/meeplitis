#!/usr/bin/env -S deno run --inspect-brk --allow-read --allow-write --allow-net

import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";
import { keypress } from "https://deno.land/x/cliffy@v0.25.4/keypress/mod.ts";
import { Input } from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/mod.ts";
import { bootstrap } from "./main.js";
import { registry } from "../cmd.js";

function log(obj){
  $.log(Deno.inspect(obj, { colors: true, compact: true, depth: Infinity, iterableLimit: Infinity }));
}

function dispatch(command) {
  const { $state, w } = registry;
  switch (command) {
    case "forward":
      $.swap($state, w.forward);
      break;
    case "backward":
      $.swap($state, w.backward);
      break;
    case "to-start":
      $.swap($state, w.to_start);
      break;
    case "to-end":
      $.swap($state, w.to_end);
      break;
  }
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
      dispatch("to-start");
    } else if (event.key === "end") {
      dispatch("to-end");
    } else if (event.key === "p") {
      const pos = await Input.prompt("Go to position:");
      $.swap(registry.$state, registry.w.to_pos, parseInt(pos));
    }
  }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scriptedMode(commands) {
  const cmds = _.split(commands, ",");
  for (const cmd of cmds) {
    dispatch(cmd.trim());
    await sleep(500); // Wait for potential async operations to settle
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
  .action(async function (opts, table){
    const seat = _.maybe(opts.seat, parseInt);
    const accessToken =  Deno.env.get("SUPABASE_SESSION_ACCESS_TOKEN") || null;
    const $state = bootstrap(table, seat, accessToken);

    $.sub($state, log);

    if (opts.interactive) {
      interactiveMode();
    } else if (opts.script) {
      // Wait a moment for initial load before starting script
      await sleep(1000);

      scriptedMode(opts.script);
    } else {
      // If not interactive or scripted, exit after the initial load.
      setTimeout(() => Deno.exit(), 2000);
    }
  })
  .parse(Deno.args);

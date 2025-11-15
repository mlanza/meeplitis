#!/usr/bin/env -S deno run --allow-env --allow-read --allow-write --allow-net

import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import { reel } from "./shell.js";
import { reg } from "../cmd.js";
import supabase from "../supabase.js";
import { session } from "../session.js";
import { keypress } from "https://deno.land/x/cliffy@v0.25.4/keypress/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";

function elideWith(keys, f){
  const elide = _.includes(keys, _);
  return function(state){
    return _.reducekv(function(memo, key, value){
      return _.assoc(memo, key, elide(key) ? f(value, key) : value);
    }, {}, state);
  }
}

async function tuiMode($reel) {
  for await (const event of keypress()) {
    if (event.key === "q" || event.key === "escape") {
      Deno.exit();
    } else if (event.key === "right") {
      $.dispatch($reel, {type: event.shiftKey ? "present" : "forward"});
    } else if (event.key === "left") {
      $.dispatch($reel, {type: event.shiftKey ? "inception" : "backward"});
    } else if (event.key === "f") {
      $.dispatch($reel, {type: "ffwd"});
    } else if (event.key === "l") {
      $.dispatch($reel, {type: "last-move"});
    }
  }
}

await new Command()
  .name("reel")
  .description("Navigate and append to board game timeline")
  .arguments("<table:string>")
  .option("--commands <commands:string>", "Commands string")
  .option("--seat <seat:number>", "Seat number (integer)")
  .action(async function (opts, tableId){
    const seat = opts.seat;

    const $reel = reel(tableId, seat);

    reg({$reel});

    const abbr = _.pipe(
      elideWith(["touches","perspectives","seated"], (value) => `<${_.count(value)} entries>`));

    const log = _.comp(console.log, abbr);

    $.sub($reel, log);

    await tuiMode($reel);

  })
  .parse(Deno.args);

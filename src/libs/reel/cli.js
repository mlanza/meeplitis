#!/usr/bin/env -S deno run --allow-env --allow-read --allow-write --allow-net

import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import * as sh from "./shell.js";
import { reel } from "./shell.js";
import { reg } from "../cmd.js";
//import supabase from "../supabase.js";
//import { session } from "../session.js";
import { Command } from "@cliffy/command";
import { keypress } from "@cliffy/keypress";

function logs(key, obj){
  $.log(key, Deno.inspect(obj, { colors: true, compact: true, depth: Infinity, iterableLimit: Infinity }));
}

function elideWith(keys, f){
  const elide = _.includes(keys, _);
  return function(state){
    return _.reducekv(function(memo, key, value){
      return _.assoc(memo, key, elide(key) ? f(value, key) : value);
    }, {}, state);
  }
}

async function tuiMode(exec) {
  for await (const event of keypress()) {
    if (event.key === "q" || event.key === "escape") {
      Deno.exit(0);
    } else if (event.key === "right") {
      exec({type: event.shiftKey ? "present" : "forward"});
    } else if (event.key === "left") {
      exec({type: event.shiftKey ? "inception" : "backward"});
    } else if (event.key === "f") {
      exec({type: "ffwd"});
    } else if (event.key === "l") {
      exec({type: "last-move"});
    } else if (event.key === "backspace") {
      exec({type: "do-over"});
    }
  }
}

await new Command()
  .name("reel")
  .description("Navigate and append to board game timeline")
  .arguments("<table:string>")
  .option("--commands <commands:string>", "Commands string")
  .option("--seat <seat:number>", "Seat number (integer)")
  .option("--elide <key:string>", "Key to elide in logs", { collect: true })
  .action(async function (opts, tableId){
    const seat = opts.seat;

    const abbr = _.pipe(
      elideWith(opts.elide, (value) => `<${_.count(value)} entries>`));

    const $reel = reel(tableId, seat);
    const $perspective = $.map(sh.perspective, $reel);
    const $scratch = sh.scratch($reel);

    reg({$reel, $scratch, $perspective}, function(key, _value){
      logs(key, abbr(_value));
    });

    await tuiMode($.dispatch($reel, _));

  })
  .parse(Deno.args);

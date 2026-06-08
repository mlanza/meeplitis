#!/usr/bin/env -S deno run --allow-env --allow-read --allow-write --allow-net

import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import * as sh from "./shell.js";
import { reel } from "./shell.js";
import { reg } from "../cmd.js";
import { Command } from "@cliffy/command";
import { keypress } from "@cliffy/keypress";
import { Input } from "@cliffy/prompt";

function logs(key, obj){
  $.log(key, Deno.inspect(obj, { colors: true, compact: true, depth: Infinity, iterableLimit: Infinity }));
}

function elides2(keys, f){
  return function(state){
    return _.reduce(function(memo, key){
      const path = _.split(key, ".");
      return _.updateIn(memo, path, f);
    }, state, keys);
  }
}

function elides1(elide){
  return elides2(elide, value => _.isObject(value) || _.isArray(value) ?
    `<${_.count(value)} entries>` :
    `<object>`);
}

const elides = _.overload(null, elides1, elides2);

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
    } else if (event.key === "tab") {
      const eventId = await Input.prompt({
        message: "What is the event id?",
        minLength: 5,
        maxLength: 5
      });
      if (eventId) {
        exec({type: "at", details: {touch: eventId}});
      }
    }
  }
}

await new Command()
  .name("reel")
  .description("Navigate and append to board game timeline")
  .arguments("<table:string>")
  //TODO .option("--commands <commands:string>", "Commands string")
  .option("--seat <seat:number>", "Seat number (integer)")
  .option("--elide <key:string>", "Key to elide in logs", { collect: true })
  .action(async function (opts, tableId){
    const abbr = elides(opts.elide);
    const $reel = reel(tableId, opts.seat);
    const $scratch = sh.scratch($reel);

    reg({$reel, $scratch}, function(key, _value){
      logs(key, abbr(_value));
    });

    await tuiMode($.dispatch($reel, _));

  })
  .parse(Deno.args);

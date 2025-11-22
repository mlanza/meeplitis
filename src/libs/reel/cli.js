#!/usr/bin/env -S deno run --no-prompt --allow-env --allow-read --allow-write --allow-net
import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import { reel } from "./shell.js";
import { reg } from "../cmd.js";
import supabase from "../supabase.js";
import { session } from "../session.js";
import { keypress } from "https://deno.land/x/cliffy@v0.25.4/keypress/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";
import { Input } from "https://deno.land/x/cliffy@v1.0.0-rc.4/prompt/mod.ts";
import { readLines } from "https://deno.land/std@0.224.0/io/mod.ts";

function logs(obj){
  $.log(Deno.inspect(obj, { colors: true, compact: true, depth: Infinity, iterableLimit: Infinity }));
}

function elideWith(keys, f){
  const elide = _.includes(keys, _);
  return function(state){
    return _.reducekv(function(memo, key, value){
      return _.assoc(memo, key, elide(key) ? f(value, key) : value);
    }, null, state);
  }
}

const hidden = _.constantly(`<hidden>`);
const entries = (value) => `<${_.count(value)} entries>`;

const abbr = _.pipe(
  elideWith(["perspective"], elideWith(["game"], hidden)),
  elideWith(["perspective"], elideWith(["state"], entries)),
  elideWith(["touches","perspectives","seated","table"], entries));

const abbrEvent = _.pipe(
  elideWith(["details"], elideWith(["root"], (value) => `<hidden>`)));

const abbrChanged = _.pipe(
  elideWith(["details"], elideWith(["hist"], (value) => `<hidden>`)));

const log = _.comp(logs, abbr);

async function interactive(run) {
  for await (const event of keypress()) {
    try {
      if (event.key === "q" || event.key === "escape") {
        Deno.exit();
      } else if (event.key === "c") {
        const text = await Input.prompt("Command:");
        command(run, text);
      } else if (event.key === "m") {
        const text = await Input.prompt("Move:");
        const move = JSON.parse(text);
        command(run, {cmd: "move", details: {move}});
      } else if (event.key === "right") {
        run({type: event.shiftKey ? "present" : "forward"});
      } else if (event.key === "left") {
        run({type: event.shiftKey ? "inception" : "backward"});
      } else if (event.key === "f") {
        run({type: "ffwd"});
      } else if (event.key === "l") {
        run({type: "last-move"});
      }
    } finally {
    }
  }
}

async function requestCommand(){
  const encoder = new TextEncoder();
  await Deno.stdout.write(encoder.encode("> "));
}

const command = _.partly(async function(run, text){
  try {
    const [, type, dtls] = text.match(/^(\S+)(?:\s+(.*))?$/) || [];
    const details = JSON.parse(dtls || "null");
    console.log("dispatching", {type, details});
    switch (type) {
      case "exit":
        Deno.exit();
        break;

      default:
        run({type, details});
        break;
    }
  } catch (ex) {
    $.error(ex.message);
  }
});

new Command()
  .name("reel")
  .description("Navigate and append to board game timeline")
  .arguments("<table:string>")
  .option("--seat <seat:integer>", "Seat index.")
  .option("--blind", "Don't observe updates.")
  .option("--chan <name:string>", "Observe a channel.", { collect: true })
  .option("--changed <path:string>", "Observe a changed event.", { collect: true })
  .option("-c, --command <command:string>", "Issue a command.", { collect: true })
  .option("-i, --interactive", "Navigate via keypress.")
  .example(
    "Observe multiple channels",
    "reel <table> --seat <seat> --chan table --chan perspective"
  )
  .example(
    "Observe several change events",
    "reel <table> --seat <seat> --changed perspective.state --changed perspective --changed cursor.pos --changed up"
  )
  .example(
    "Observe all changes interactively",
    `reel <table> --seat <seat> --changed "*" -i`
  )
  .action(async function (opts, tableId) {
    const seat = opts.seat;
    const $reel = reel(tableId, seat);
    const $perspective = $.pipe($.chan($reel, "perspective"), _.compact());
    const run = $.dispatch($reel, _);

    opts.blind || $.sub($reel, log);

    $.each(function(name){
      $.on($reel, name, $.see(name));
    }, opts.chan);

    $.each(function(path){
      if (path === "*") {
        $.on($reel, "changed", _.pipe(abbrChanged, $.see("changed")));
      } else {
        $.on($reel, `changed:${path}`, _.pipe(abbrEvent, $.see(`changed:${path}`)));
      }
    }, opts.changed);

    $.sub($perspective, _.once(function(){
      $.each(command(run, _), opts.command);
      opts.interactive || Deno.exit();
    }));

    if (opts.interactive) {
      await interactive(run);
    }
  })
  .parse(Deno.args);

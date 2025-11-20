#!/usr/bin/env -S deno run --no-prompt --allow-env --allow-read --allow-write --allow-net
import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import { reel } from "./shell.js";
import { reg } from "../cmd.js";
import supabase from "../supabase.js";
import { session } from "../session.js";
import { keypress } from "https://deno.land/x/cliffy@v0.25.4/keypress/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";
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

const abbr = _.pipe(
  elideWith(["perspective"], elideWith(["game"], (value) => `<hidden>`)),
  elideWith(["perspective"], elideWith(["state"], (value) => `<${_.count(value)} entries>`)),
  elideWith(["touches","perspectives","seated","table"], (value) => `<${_.count(value)} entries>`));

const abbrEvent = _.pipe(
  elideWith(["details"], elideWith(["root"], (value) => `<hidden>`)));

const abbrChanged = _.pipe(
  elideWith(["details"], elideWith(["hist"], (value) => `<hidden>`)));

const log = _.comp(logs, abbr);

async function tui(run) {
  for await (const event of keypress()) {
    if (event.key === "q" || event.key === "escape") {
      return;
    } else if (event.key === "right") {
      run({type: event.shiftKey ? "present" : "forward"});
    } else if (event.key === "left") {
      run({type: event.shiftKey ? "inception" : "backward"});
    } else if (event.key === "f") {
      run({type: "ffwd"});
    } else if (event.key === "l") {
      run({type: "last-move"});
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

      case "tui":
        await tui(run);
        break;

      default:
        run({type, details});
        break;
    }
  } catch (ex) {
    $.error(ex.message);
  }
});

async function repl(run){
  await requestCommand();

  for await (const line of readLines(Deno.stdin)) {
    command(run, line);
    await requestCommand();
  }
}

await new Command()
  .name("reel")
  .description("Navigate and append to board game timeline")
  .arguments("<table:string>")
  .option("-c, --command <command:string>", "Command", {collect: true})
  .option("--seat <seat:number>", "Seat number (integer)")
  .option("--watch", "Enable watch mode")
  .option("--repl", "Enter REPL")
  .option("--tui", "Enter TUI")
  .option("--chan <name:string>", "Monitor channel", {collect: true})
  .option("--changed <path:string>", "Monitor changed event", {collect: true})
  .example(
    "Monitor multiple channels",
    "reel <table> --seat <seat> --chan make --chan perspective"
  )
  .example(
    "Watch specific change events",
    "reel <table> --seat <seat> --changed perspective.state --changed perspective --changed cursor.pos --changed up"
  )
  .example(
    "Watch unqualified changes and use TUI",
    `reel <table> --seat <seat> --changed "*" --tui`
  )
  .action(async function (opts, tableId) {
    const seat = opts.seat;
    const $reel = reel(tableId, seat);
    const run = $.dispatch($reel, _);

    let stop = _.noop();

    if (opts.watch) {
      stop = $.sub($reel, log);
    }

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

    setTimeout(function(){
      $.each(command(run, _), opts.command);
    }, 5000);

    if (opts.tui) {
      await tui(run);
    }

    if (opts.repl) {
      await repl(run);
    }

    setTimeout(function(){
      stop();
      Deno.exit();
    }, 5000);
  })
  .parse(Deno.args);

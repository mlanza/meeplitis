#!/usr/bin/env -S deno run --allow-env --allow-read --allow-write --allow-net

import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import { tabletop } from "./shell.js";
import { reg } from "../cmd.js";
import { Command } from "@cliffy/command";
import { keypress } from "@cliffy/keypress";
import { Input } from "@cliffy/prompt";

function logs(key, obj){
  $.log(key, Deno.inspect(obj, { colors: true, compact: true, depth: Infinity, iterableLimit: Infinity }));
}

const hr = _.chain(_.repeat(100, "-"), _.toArray, _.join("", _)); //horizontal rule

async function tuiMode(exec) {
  let counter = 0;
  for await (const event of keypress()) {
    if (event.key === "c") {
      console.clear();
    } else if (event.key === "h") {
      console.log(hr, ++counter);
    } else if (event.key === "q" || event.key === "escape") {
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

function enqueues(exec){
  return function queue(command){
    return function(){
      return exec(command);
    }
  }
}

const elide = _.pipe(
  _.assocIn(_, ["perspective", "game"], "<hidden>"),
  _.assocIn(_, ["seated"], "<hidden>"),
  _.assocIn(_, ["perspective", "actor"], "<hidden>"));

await new Command()
  .name("tt")
  .description("Navigate and append to board game timeline")
  .arguments("<table:string>")
  .option("--seat <seat:number>", "Seat number (integer)")
  .option("--token <accessToken:string>", "Access token")
  .option("--json", "Format as JSON")
  .option("-i, --interactive", "Interact via the keyboard")
  .option("-c, --command <command:string>", "Keypress to invoke", { collect: true })
  .option("--at <eventId:string>", "Navigate to moment in timeline")
  .option("--elide", "Hide extraneous data")
  .action(function (opts, tableId){
    const $source = tabletop(tableId, _.maybe(opts.seat, parseInt), opts.at ?? null, opts.token ?? null);
    const $tt = opts.elide ? $.map(elide, $source) : $source;
    const $state = $.chan($source, "state");
    const $wip = $.chan($source, "wip");
    const $ready = $.chan($source, "ready");
    const $act = $.chan($source, "act");
    const $working = $.chan($source, "working");
    const $diff = $.chan($source, "diff");
    const $updated = $.chan($source, "updated");
    const $queue = $.chan($source, "queue");
    const $timer = $.chan($source, "timer");
    const exec = $.dispatch($source, _);
    const queue = enqueues(exec);
    const commands = _.mapa(type => queue({type}), opts?.command ?? []);

    commands.push(async function(){
      if (opts.interactive) {
        commands.unshift(() => clearInterval(iv));
        await tuiMode(exec);
      }
      Deno.exit(0);
    });

    reg({$tt, $state, $wip, $diff, $updated, $queue, $act, $ready, $working, $timer}, logs);

    const iv = setInterval(function(){
      if (!_.deref($working) && _.seq(commands)) {
        const run = commands.shift();
        run();
      }
    }, 1000);
  })
  .parse(Deno.args);

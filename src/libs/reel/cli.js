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

function elides3(omit, paths, f){
  return function(key, value){
    try {
      if (omit(key, value)) {
        return value;
      } else {
        return _.reduce(function(memo, path){
          return _.updateIn(memo, path, f);
        }, value, paths);
      }
    } catch {
      return value;
    }
  }
}

function elides2(omit, props){
  return elides3(omit, props, value => _.isObject(value) ?
    `<${_.count(value)} entries>` :
    `<object>`);
}

const elides = _.overload(null, null, elides2, elides3);

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

await new Command()
  .name("reel")
  .description("Navigate and append to board game timeline")
  .arguments("<table:string>")
  //TODO .option("--command <command:string>", "Command string")
  .option("--seat <seat:number>", "Seat number (integer)")
  .option("--token <accessToken:string>", "Access token")
  .option("-i, --interactive", "Interact via the keyboard")
  .option("--at <eventId:string>", "Navigate to moment in timeline")
  .option("--elide <prop:string>", "Property to elide in logged object", { collect: true })
  .option("--not <chan:string>", "Channel not elided", { collect: true })
  .action(async function (opts, tableId){
    const elide = elides(function(key, value){
      return _.includes(opts?.not, key) || _.isArray(value);
    },  _.mapa(_.split(_, "."), opts.elide));
    const $reel = reel(tableId, opts.seat ?? null, opts.token ?? null);
    const $wip = $.chan($reel, "wip");
    const $ready = $.chan($reel, "ready");
    const $updated = $.chan($reel, "updated");
    const $queue = $.chan($reel, "queue");
    const $timer = $.chan($reel, "timer");
    const exec = $.dispatch($reel, _);

    reg({$reel, $wip, $updated, $queue, $ready, $timer}, function(key, value){
      logs(key, elide(key, value));
    });

    opts.at && $.sub($reel, _.filter(_.get(_, "touches")), _.once(function(){
      const touch = opts.at;
      exec({type: "at", details: {touch}});
    }));

    if (opts.interactive) {
      await tuiMode(exec);
    }
  })
  .parse(Deno.args);

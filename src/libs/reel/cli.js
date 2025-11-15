import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import { reel } from "./shell.js";
import { reg } from "../cmd.js";
import supabase from "../supabase.js";
import { session } from "../session.js";
import { keypress } from "https://deno.land/x/cliffy@v0.25.4/keypress/mod.ts";

function elideWith(keys, f){
  const elide = _.includes(keys, _);
  return function(state){
    return _.reducekv(function(memo, key, value){
      return _.assoc(memo, key, elide(key) ? f(value, key) : value);
    }, {}, state);
  }
}

const [tableId, seat] = Deno.args.length ? [Deno.args[0], parseInt(Deno.args[1])] : ["QDaitfgARpk", 0];

const $reel = reel(tableId, seat);

reg({$reel});

const abbr = _.pipe(
  elideWith(["touches","perspectives","seated"], (value) => `<${_.count(value)} entries>`));

const log = _.comp(console.log, abbr);

$.sub($reel, console.log);

async function tuiMode() {
  for await (const event of keypress()) {
    if (event.key === "q" || event.key === "escape") {
      Deno.exit();
    } else if (event.key === "right") {
      $.dispatch($reel, {type: "forward"});
    } else if (event.key === "left") {
      $.dispatch($reel, {type: "backward"});
    } else if (event.key === "i") {
      $.dispatch($reel, {type: "inception"});
    } else if (event.key === "p") {
      $.dispatch($reel, {type: "present"});
    } else if (event.key === "f") {
      $.dispatch($reel, {type: "ffwd"});
    } else if (event.key === "l") {
      $.dispatch($reel, {type: "last-move"});
    }
  }
}

await tuiMode();

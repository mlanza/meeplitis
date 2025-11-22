import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import dom from "../atomic_/dom.js";
import { reel } from "./shell.js";
import { reg } from "../cmd.js";
import supabase from "../supabase.js";
import { session } from "../session.js";

const params = new URLSearchParams(location.search);
const tableId = params.get('id');
const seat = _.maybe(params.get("seat"), parseInt);

export const el = document.body;
export const els = {
  remarks: dom.sel1("#remarks-button", el),
  options: dom.sel1("#options-button", el),
  progress: dom.sel1("progress", el),
  touch: dom.sel1("#replay .touch", el),
  touches: dom.sel1("#replay .touches", el),
  game: dom.sel1("#game", el),
  players: dom.sel1(".players", el),
  error: dom.sel1("#error", el),
  event: dom.sel1("#event", el)
}

export const $reel = reel(tableId, seat);
export const $work = $.chan($reel, "wip");
const $error = $.chan($reel, "error");
const run = $.dispatch($reel, _);

reg({ $reel, $work });

$.on($reel, "changed", function({ details: { changed, hist: [curr, prior] = [] } = {} }){
  const ctx = "gui";
  console.log({ ctx, changed, curr, prior });
});

$.on(el, "click", "#replay [data-nav]", function(e){
  const nav = dom.attr(e.target, "data-nav");
  run({type: nav});
});

$.on(el, "click", ".message", function(e){
  dom.addClass(el, "ack");
});

$.on(document, "keydown", function(e){
  switch(e.key){
    case "ArrowUp":
    case "ArrowLeft":
      e.preventDefault();
      run({type: e.shiftKey ? "inception" : "backward"});
      break;

    case "ArrowDown":
    case "ArrowRight":
      e.preventDefault();
      run({type: e.shiftKey ? "present" : "forward"});
      break;

    case "Backspace":
      //if (e.shiftKey) {
      //e.preventDefault();
      //replay($story, "do-over");
      //}
      break;

    case "Escape": //cancel work in progress and/or clear error
      e.preventDefault();
      clear($wip);
      $.reset($error, null);
      break;

    case ".": //not always an option
      e.preventDefault();
      //TODO $.dispatch($story, {type: "pass"});
      break;

    case "Enter":
      e.preventDefault();
      run({type: "commit"});
      break;

    case "s":
      //if (e.metaKey) {
      //  e.preventDefault();
      //  location.href = `${location.origin}/shell/${location.search}${location.hash}`;
      //}
      break;

    case ",":
      e.preventDefault();
      run({type: "last-move"});
      break;
  }
});


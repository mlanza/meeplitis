import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import dom from "../atomic_/dom.js";
import {reel, scratch} from "./shell.js";
import {reg} from "../cmd.js";

export const seat = 0; //TODO

export const el = dom.sel1("#table");
const params = new URLSearchParams(location.search);
export const tableId = params.get('id');

export function ui(describe, desc, template) {
  console.log({tableId, seat})
  const $reel = reel(tableId, seat);
  const $scratch = scratch($reel);
  const $hist = $.hist($reel);

  reg({$hist, $scratch});

  return {$hist, $wip: $scratch};
}


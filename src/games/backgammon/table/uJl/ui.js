import _ from "/libs/atomic_/core.js";
import $ from "/libs/atomic_/shell.js";
import dom from "/libs/atomic_/dom.js";
import * as c from "./core.js";
import * as g from "/libs/game.js";
import {moment} from "/libs/story.js";
import {describe} from "./ancillary.js";
import {clear, closestAttr, retainAttr} from "/libs/wip.js";
import {el, seated, seats, seat, ui, scored, outcome, diff, which} from "/libs/table.js";
import {reg} from "/libs/cmd.js";

const {img, ol, li, div, kbd, span} = dom.tags(['img', 'ol', 'li', 'div', 'kbd', 'span']);

dom.addClass(el, "init");

function desc({ type, details }) {
  return "Description";
}

const template = _.identity;

const {$ready, $error, $story, $hist, $snapshot, $wip} =
  ui(c.make, describe, desc, template);

const $both = which($.latest([$hist, $wip]));

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

const txt = await (await fetch('./images/backgammon-board.svg')).text();
const doc = new DOMParser().parseFromString(txt, 'image/svg+xml');
const svg = document.importNode(doc.documentElement, true);
const board = document.getElementById('board');
board.textContent = '';
board.appendChild(svg);

function desc({type, details}){
  switch(type) {
    case "started":
      return "Starts game.";
    case "rolled":
      const {dice} = details;
      return _.count(dice) === 2 ? `Rolled ${dice[0]} and ${dice[1]}.` : `Rolled double ${dice[0]}s.`;
    default:
      return type;
  }
}

function template(seat){
  return {
    stats: div(span({class: "off"}, "0"), " pieces borne off"),
    resources: null
  };
}

function workingCommand([curr, prior], seat, {contents}, game, el){
  const type = curr?.type;
  const attrs = {
    "data-command-type": type,
  };
  switch (type) { //only multi-step commands appear here
    case "move": {
      attrs["data-froms"] = "";
      attrs["data-from"] = curr.details.from;
      break;
    }
  }
}

const {$ready, $error, $story, $hist, $snapshot, $wip} =
  ui(c.make, describe, desc, template);

const $both = which($.latest([$hist, $wip]));

reg({ $both, g });

$.sub($both, function ([[curr, prior, motion, game], wip, which]) {
  const { state, up } = curr;
  const { status, dice } = state;
  const { step, present } = motion;
  const allowed = _.toArray(g.moves(game, { type: ["roll", "commit"], seat }));

  _.chain(dice, _.map(_.str, _), _.join(" ", _), dom.attr(el, "data-dice", _));
  _.chain(allowed, _.map(_.get(_, "type"), _), _.distinct, _.join(" ", _), _.trim, dom.attr(el, "data-allow-commands", _));

  const froms = _.chain(
    g.moves(game, { type: ["move"], seat }),
    _.groupBy(_.pipe(_.getIn(_, ["details", "from"]), _.inc), _),
    _.keys);
  dom.attr(el, "data-froms", _.join(" ", froms));
  dom.attr(el, "data-status", status);
  dom.removeClass(el, "error");

  if (which === 1) {
    return present ? workingCommand(wip, seat, state, game, el) : null;
  }
});

$.on(el, "click", `#table.act button[data-type="roll"]`, function(e){
  const type = "roll";
  $.dispatch($story, {type});
});

$.on(el, "click", `#table[data-froms] .point path:nth-child(2)`, function(e){
  const type = "move";
  const g = _.closest(this, "g");
  const from = _.chain(dom.attr(g, "id"), _.split(_, "-"), _.last, parseInt);
  $.reset($wip, {type, details: {from}});
});


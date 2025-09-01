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

dom.addClass(el, "init");

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
    resources: [
    ]
  };
}

const {$ready, $error, $story, $hist, $snapshot, $wip} =
  ui(c.make, describe, desc, template);

const $both = which($.latest([$hist, $wip]));

reg({ $both, g });

$.sub($both, function ([[curr, prior, motion, game], wip, which]) {
  const { state, up } = curr;
  const { seated, tokens, canal1, canal2, bridges, period, contents, status, round, spent } = state;
  const { step, present } = motion;
  const moves = _.toArray(g.moves(game, { type: ["roll", "commit"], seat }));

  _.chain(moves, _.map(_.get(_, "type"), _), _.distinct, _.join(" ", _), _.trim, dom.attr(el, "data-allow-commands", _));

});

$.on(el, "click", `#table.act button[data-type="roll"]`, function(e){
  const type = "roll";
  $.dispatch($story, {type});
});

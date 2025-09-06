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

function desc({type, details, seat}){
  switch(type) {
    case "started":
      return "Starts game.";
    case "rolled":
      const {dice} = details;
      return _.count(dice) === 2 ? `Rolled ${dice[0]} and ${dice[1]}.` : `Rolled double ${dice[0]}s.`;
    case "moved":
      const {from, to} = details;
      return [`Moved `, img({class: "checker", src: seat === 0 ? "./images/cross-checker.svg" : "./images/crown-checker.svg"}), ` from ${from} to ${to}.`];
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

function workingCommand([curr, prior], seat, state, game, el){
  const type = curr?.type;
  const attrs = {
    "data-command-type": type
  };
  switch (type) { //only multi-step commands appear here
    case "move": {
      const from = curr.details.from;
      const tos = _.chain(
        g.moves(game, { type: ["move"], seat }),
        _.filter(function(cmd){
          return cmd.details.from == from;
        }, _),
        _.mapa(_.getIn(_, ["details", "to"]), _),
        $.see("X"),
        _.join(" ", _));

      attrs["data-from"] = from;
      attrs["data-tos"] = tos;
      break;
    }
  }
  $.eachkv(retainAttr(el, _, _), attrs);
}

const {$ready, $error, $story, $hist, $snapshot, $wip} =
  ui(c.make, describe, desc, template);

const $both = which($.latest([$hist, $wip]));

reg({ $both, g });

// --- Start of new reconciliation logic ---

const WHITE = 0;
const BLACK = 1;

// Helper to identify individual checker moves (point-to-point only)
function diffPoints(currPoints, priorPoints, seat) {
  const changes = [];
  const sources = []; // {point: N, count: X}
  const destinations = []; // {point: N, count: Y}

  for (let i = 0; i < 24; i++) { // Iterate through points 0-23
    const priorCount = priorPoints[i][seat];
    const currCount = currPoints[i][seat];

    if (currCount > priorCount) {
      // Checkers arrived at this point
      destinations.push({ point: i, count: currCount - priorCount });
    } else if (currCount < priorCount) {
      // Checkers departed from this point
      sources.push({ point: i, count: priorCount - currCount });
    }
  }

  // Match sources to destinations to create {from, to} pairs
  for (const source of sources) {
    for (let i = 0; i < source.count; i++) {
      // Find an available destination
      const destination = destinations.find(d => d.count > 0);
      if (destination) {
        changes.push({ from: source.point, to: destination.point });
        destination.count--;
      }
    }
  }
  return changes;
}

// Main orchestration function for minimal UI reconciliation
function diffAndUpdatePoints(el, curr, prior) {
  // If there's no prior state, assume all checkers need to be placed according to curr.
  // This is effectively a full render based on the current state.
  if (!prior?.state) {
    for (const seat of [WHITE, BLACK]) {
      const color = seat === WHITE ? "white" : "black";
      // Get all 15 checkers for this seat
      const allCheckers = dom.sel(`use[id^="${color}-"]`, el);
      let checkerIdx = 0; // To assign checkers sequentially

      for (let i = 0; i < 24; i++) { // Iterate through points 0-23
        const count = curr.state.points[i][seat];
        for (let j = 0; j < count; j++) {
          if (allCheckers[checkerIdx]) {
            dom.attr(allCheckers[checkerIdx], "data-point", i.toString());
            checkerIdx++;
          }
        }
      }
    }
  } else {
    // Normal diffing when a prior state exists
    for (const seat of [WHITE, BLACK]) {
      const changes = diffPoints(curr.state.points, prior.state.points, seat);
      const color = seat === WHITE ? "white" : "black";
      const movedCheckers = new Set(); // Keep track of checkers already processed

      for (const change of changes) {
        const from = change.from.toString();
        const to = change.to.toString();

        const allCheckersOfColor = dom.sel(`use[id^="${color}-"]`, el);
        let checkerToMove = null;
        for (const checker of allCheckersOfColor) {
          if (dom.attr(checker, "data-point") === from && !movedCheckers.has(checker)) {
            checkerToMove = checker;
            break;
          }
        }

        if (checkerToMove) {
          dom.attr(checkerToMove, "data-point", to);
          movedCheckers.add(checkerToMove);
        }
      }
    }
  }
}

// --- End of new reconciliation logic ---

$.sub($both, function ([[curr, prior, motion, game], wip, which]) {
  // Call the new reconciliation logic here
  diffAndUpdatePoints(el, curr, prior); // <--- ADDED THIS LINE

  const { state, up } = curr;
  const { status, dice } = state;
  const { step, present } = motion;
  const allowed = _.toArray(g.moves(game, { type: ["roll", "commit"], seat }));

  _.chain(dice, _.map(_.str, _), _.join(" ", _), dom.attr(el, "data-dice", _));
  _.chain(allowed, _.map(_.get(_, "type"), _), _.distinct, _.join(" ", _), _.trim, dom.attr(el, "data-allow-commands", _));

  const froms = _.chain(
    g.moves(game, { type: ["move"], seat }),
    _.groupBy(_.pipe(_.getIn(_, ["details", "from"])), _),
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

$.on(el, "click", `#table[data-from] .point path:nth-child(2)`, function(e){
  const type = "move";
  const to = _.chain(dom.attr(_.closest(this, "g"), "id"), _.split(_, "-"), _.last, parseInt);
  const from = _.chain($wip, _.deref, _.getIn(_, ["details", "from"]));
  const game = moment($story)
  if (from != null) {
    const move = _.chain(g.moves(game, { type: ["move"], seat }), _.detect(function(cmd){
      return cmd?.details?.from === from && cmd?.details?.to === to;
    }, _), $.dispatch($story, _));
  }
});

$.on(el, "click", `#table[data-froms] .point path:nth-child(2)`, function(e){
  const type = "move";
  const g = _.closest(this, "g");
  const from = _.chain(dom.attr(g, "id"), _.split(_, "-"), _.last, parseInt);
  $.reset($wip, {type, details: {from}});
});

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

function die(pips){
  return img({class: 'die', src: `./images/${pips}.svg`});
}

function checker(seat){
  return img({class: "checker", src: seat === 0 ? "./images/cross-checker.svg" : "./images/crown-checker.svg"});
}
function desc({type, details, seat}){
  switch(type) {
    case "started":
      return "Starts game.";
    case "rolled":
      const {dice} = details;
      return dice[0] == dice[1] ? [`Rolls double `, die(dice[0]), `s!`] : [`Rolls `, die(dice[0]), ` and `, die(dice[1]), `.`];
    case "moved": {
      const {from, to} = details;
      return [`Moved `, checker(seat), ` with `, die(Math.abs(from - to)) ,` from ${from + 1} to ${to + 1}.`];
    }
    case "borne-off": {
      const {from} = details;
      return [`Bears off `, checker(seat), ` with`, die(details.die), ` from ${from + 1}.`];
    }
    case "entered": {
      const {from, to} = details;
      return [`Enters `, checker(seat), ` with `, die(details.die), ` to ${to + 1}.`];
    }
    case "committed":
      return "I'm done.";
    case "finished":
      return outcome(seated, details);
    default:
      return type;
  }
}

function template(seat){
  return {
    stats: [div(span({class: "off"}, "0"), " pieces off"), checker(seat)],
    resources: null
  };
}

function workingCommand([curr, prior], seat, state, game, el, movableCmds){
  const type = curr?.type;
  const attrs = {
    "data-command-type": type,
    "data-from": null,
    "data-tos": null
  };
  switch (type) { //only multi-step commands appear here
    case "enter":
    case "move":
    case "bear-off":{
      const from = curr.details.from;
      const tos = _.chain(
        movableCmds,
        _.filter(function(cmd){
          return cmd.details.from == from;
        }, _),
        _.mapa(function(cmd){
          if (cmd.type === 'bear-off') {
            return cmd.seat === WHITE ? WHITE_OFF : BLACK_OFF;
          }
          return _.getIn(cmd, ["details", "to"]);
        }, _),
        _.compact,
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

const WHITE = 0;
const BLACK = 1;

// per reconciliation.md
const WHITE_BAR = "bar-white";
const BLACK_BAR = "bar-black";
const WHITE_OFF = "off-board-white";
const BLACK_OFF = "off-board-black";

function getCheckers(state) {
  if (!state) {
    return [];
  }
  const checkers = [];
  const { points, bar, off } = state;

  // checkers on points
  if (points) {
    for (let i = 0; i < points.length; i++) {
      const [whiteCheckers, blackCheckers] = points[i];
      const point = i; // 0-indexed point

      if (whiteCheckers > 0) {
        for (let pos = 0; pos < whiteCheckers; pos++) {
          checkers.push({ seat: WHITE, point, pos: Math.min(pos, 4) + 1 });
        }
      }
      if (blackCheckers > 0) {
        for (let pos = 0; pos < blackCheckers; pos++) {
          checkers.push({ seat: BLACK, point, pos: Math.min(pos, 4) + 1 });
        }
      }
    }
  }

  // checkers on bar
  if (bar) {
    if (bar[WHITE] > 0) {
      for (let pos = 0; pos < bar[WHITE]; pos++) {
        checkers.push({ seat: WHITE, point: WHITE_BAR, pos: Math.min(pos, 4) + 1 });
      }
    }
    if (bar[BLACK] > 0) {
      for (let pos = 0; pos < bar[BLACK]; pos++) {
        checkers.push({ seat: BLACK, point: BLACK_BAR, pos: Math.min(pos, 4) + 1 });
      }
    }
  }

  // checkers borne off
  if (off) {
    if (off[WHITE] > 0) {
      for (let pos = 0; pos < off[WHITE]; pos++) {
        checkers.push({ seat: WHITE, point: WHITE_OFF, pos: Math.min(pos, 4) + 1 });
      }
    }
    if (off[BLACK] > 0) {
      for (let pos = 0; pos < off[BLACK]; pos++) {
        checkers.push({ seat: BLACK, point: BLACK_OFF, pos: Math.min(pos, 4) + 1 });
      }
    }
  }

  return checkers;
}

function diffCheckers(curr, prior) {
  if (!prior || prior.length === 0) { // initial render
    return curr.map(c => ({ target: null, revised: c }));
  }

  const priorMap = new Map();
  $.each(function(checker){
    const key = `${checker.seat}:${checker.point}:${checker.pos}`;
    priorMap.set(key, (priorMap.get(key) || 0) + 1);
  }, prior);

  const addedBySeat = { 0: [], 1: [] };
  $.each(function(checker){
    const key = `${checker.seat}:${checker.point}:${checker.pos}`;
    if (priorMap.has(key) && priorMap.get(key) > 0) {
      priorMap.set(key, priorMap.get(key) - 1);
    } else {
      addedBySeat[checker.seat].push(checker);
    }
  }, curr);

  const removedBySeat = { 0: [], 1: [] };
  priorMap.forEach((count, key) => {
    if (count > 0) {
      const parts = key.split(':');
      const seat = parseInt(parts[0]);
      const pointStr = parts[1];
      const point = isNaN(parseInt(pointStr)) ? pointStr : parseInt(pointStr);
      const pos = parseInt(parts[2]);
      for(let i=0; i<count; i++) {
        removedBySeat[seat].push({ seat, point, pos });
      }
    }
  });

  const diffs = [];
  for (const seat in addedBySeat) {
    const added = addedBySeat[seat];
    const removed = removedBySeat[seat];
    for (let i = 0; i < added.length; i++) {
      diffs.push({ target: removed[i], revised: added[i] });
    }
  }

  return diffs;
}

function applyInitialRender(checkers) {
    const whiteCheckers = checkers.filter(c => c.seat === 0);
    const blackCheckers = checkers.filter(c => c.seat === 1);

    const whiteElements = Array.from(el.querySelectorAll('use[href="#cross-checker"]'));
    const blackElements = Array.from(el.querySelectorAll('use[href="#crown-checker"]'));

    whiteElements.forEach((checkerEl, i) => {
        const checkerData = whiteCheckers[i];
        if (checkerData) {
            dom.attr(checkerEl, "data-point", checkerData.point);
            dom.attr(checkerEl, "data-pos", checkerData.pos);
        }
    });
    blackElements.forEach((checkerEl, i) => {
        const checkerData = blackCheckers[i];
        if (checkerData) {
            dom.attr(checkerEl, "data-point", checkerData.point);
            dom.attr(checkerEl, "data-pos", checkerData.pos);
        }
    });
}

function applyMoveDiff(diffs) {
  const checkers = dom.sel1("#checkers");
  $.each(function(diff) {
    const { target, revised } = diff;
    if (target && revised) {
      const selector = target.seat === 0 ? 'use[href="#cross-checker"]' : 'use[href="#crown-checker"]';
      const checkerEl = _.last(el.querySelectorAll(`${selector}[data-point="${target.point}"][data-pos="${target.pos}"]`));
      if (checkerEl) {
        checkers.appendChild(checkerEl); // move to end to render on top
        void checkerEl.getBoundingClientRect(); // force reflow: lock in the "before" state
        dom.attr(checkerEl, "data-point", revised.point);
        dom.attr(checkerEl, "data-pos", revised.pos);
      }
    }
  }, diffs);
}

function stackedPoints(checkers) {
  return _.countBy(_.get(_, "point"), checkers);
}

function overstackedPoints(counts) {
  return _.chain(
    counts,
    _.filter(function([point, count]) {
      return count > 5;
    }, _),
    _.mapa(_.first, _)
  );
}

function applyCountToDOM(counts) {
  const allPointIds = [...Array(24).keys(), 'bar-white', 'bar-black', 'off-board-white', 'off-board-black'];
  $.each(function(point) {
    const textEl = el.querySelector(`#overstack-counts text[data-point="${point}"]`);
    if (textEl) {
      const count = counts[point] || 0;
      dom.text(textEl, count > 5 ? count - 4 : '');
    }
  }, allPointIds);
}

$.sub($both, function ([[curr, prior, motion, game], wip, which]) {
  const { state, up } = curr;
  if (!state) return;
  const { status, dice } = state;
  const { step, present } = motion;
  const allowed = g.moves(game, { type: ["roll", "commit"], seat });

  if (which !== 1) {
    if (prior) {
      const {off} = state;
      $.eachIndexed(function(seat, off){
        dom.text(dom.sel1(`[data-seat="${seat}"] span.off`), off);
      }, off);

      const currCheckers = getCheckers(curr.state);
      const priorCheckers = getCheckers(prior.state);
      const checkerDiff = diffCheckers(currCheckers, priorCheckers);
      applyMoveDiff(checkerDiff);
    } else {
      const currCheckers = getCheckers(curr.state);
      applyInitialRender(currCheckers);
    }
  }

  const movableCmds = g.moves(game, { type: ["move", "enter", "bear-off"], seat });

  _.chain(dice, _.map(_.str, _), _.join(" ", _), dom.attr(el, "data-dice", _));
  _.chain(allowed, _.map(_.get(_, "type"), _), _.distinct, _.join(" ", _), _.trim, dom.attr(el, "data-allow-commands", _));

  const froms = _.chain(
    movableCmds,
    _.groupBy(_.getIn(_, ["details", "from"]), _),
    _.keys);
  const counts = stackedPoints(getCheckers(curr.state));
  const overstacked = overstackedPoints(counts);
  setTimeout(function(){
    applyCountToDOM(counts);
    dom.attr(el, "data-overstacked", _.join(" ", overstacked));
  }, 200);

  dom.attr(el, "data-froms", _.join(" ", froms));
  dom.attr(el, "data-status", status);
  dom.removeClass(el, "error");

  if (which === 1) {
    return present ? workingCommand(wip, seat, state, game, el, movableCmds) : null;
  }
});

$.on(el, "click", `#table.act button[data-type="roll"]`, function(e){
  const type = "roll";
  $.dispatch($story, {type});
});

$.on(el, "click", `#table.act button[data-type="commit"]`, function(e){
  const type = "commit";
  $.dispatch($story, {type});
});

function asPoint(id){
  if (id === "bar-white") return -1;
  if (id === "bar-black") return 24;
  if (id === "off-board-white") return 25;
  if (id === "off-board-black") return 26;
  return id;
}

$.on(el, "click", `#table[data-from] .off-board`, function(e){
  const from = _.chain($wip, _.deref, _.getIn(_, ["details", "from"]), asPoint);
  const game = moment($story);
  const seat = g.up(game)[0];

  const bearOffCmd = _.detect(function(cmd){
    return cmd.type === 'bear-off' && cmd?.details?.from === from;
  }, g.moves(game, { type: ["bear-off"], seat }));

  if (bearOffCmd) {
    $.dispatch($story, bearOffCmd);
  }
  $.reset($wip, null);
});

function getMove({from, to}, seat) {
  const game = moment($story);
  return _.detect(function(cmd){
    return cmd.seat == seat && cmd?.details?.from == from && (to == null || cmd?.details?.to == to);
  }, g.moves(game, { type: ["move", "enter", "bear-off"], seat }));
}

$.on(el, "click", `#table[data-from] .point path:nth-child(2)`, function(e){
  const to = _.chain(dom.attr(_.closest(this, "g"), "id"), _.split(_, "-"), _.last, parseInt);
  const from = _.chain($wip, _.deref, _.getIn(_, ["details", "from"]), asPoint);
  const move = getMove({from, to}, seat);
  if (move) {
    $.dispatch($story, move)
    $.reset($wip, null);
  }
});

$.on(el, "click", `#table[data-froms] .point path:nth-child(2)`, function(e){
  const type = "move";
  const g = _.closest(this, "g");
  const from = _.chain(dom.attr(g, "id"), _.split(_, "-"), _.last, parseInt);
  if (getMove({from}, seat)) {
    $.reset($wip, {type, details: {from}});
  }
});

$.on(el, "click", `#table[data-froms] .bar`, function(e){
  const from = this.id;
  const type = "enter";
  $.reset($wip, {type, details: {from}});
});

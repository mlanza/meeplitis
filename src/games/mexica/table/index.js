import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import sh from "/lib/atomic_/shell.js";
import supabase from "/lib/supabase.js";
import {session, $online} from "/lib/session.js";
import {table, ui, scored, outcome, subject} from "/lib/table.js";
import {getSeated, getSeat, story, nav, waypoint, hist} from "/lib/story.js";
import {describe} from "/components/table/index.js";
import {boardSpots} from "../core.js";

async function svg(what){
  return await fetch(`../table/images/${what}.svg`).then(function(resp){
    return resp.text();
  });
}

const _temple = [await svg(1), await svg(2), await svg(3), await svg(4)],
      _pilli = await svg("pilli");

function temple({size, seat}){
  const parser = new DOMParser();
  const el = parser.parseFromString(_temple[size - 1], "image/svg+xml").childNodes[1];
  dom.attr(el, "data-seat", seat);
  dom.attr(el, "data-piece", "temple");
  return el;
}

function pilli({seat}){
  const parser = new DOMParser();
  const el = parser.parseFromString(_pilli, "image/svg+xml").childNodes[0];
  dom.attr(el, "data-seat", seat);
  dom.attr(el, "data-piece", "pilli");
  return el;
}

function canal({size, orientation}){
  return img({src: `./images/canal${size}.png`, "data-piece": "canal", "data-size": size, "data-orientation": orientation});
}

function bridge({orientation}){
  return img({src: "./images/bridge.svg", "data-piece": "bridge", "data-orientation": orientation});
}

function token(){
  return img({src: "./images/token.png", "data-piece": "token"});
}

function capulli({size}){
  return img({src: `./images/c${size}.png`, "data-piece": "capulli", "data-size": size});
}

function demand(idx){
  return li({"data-demand": idx});
}

function at(spot){
  return dom.sel1(`[data-spot='${spot}']`);
}

function spot([spot, terrain]){
  return div({"title": spot, "data-spot": spot, "data-terrain": terrain});
}

const img = dom.tag('img'),
      ol = dom.tag('ol'),
      li = dom.tag('li'),
      div = dom.tag('div'),
      span = dom.tag('span');

const params = new URLSearchParams(document.location.search),
      tableId = params.get('id');

dom.addClass(document.body, "initialized");

if (!tableId) {
  document.location.href = "../";
}

const el = document.body;
const [roundNum, roundMax] = dom.sel(".round b", el);
const els = {
  roundNum,
  roundMax,
  board: dom.sel1("#board", el),
  supplies: dom.sel1("#supplies"),
  demands: dom.sel1("#demands", el),
  moves: dom.sel1(".moves", el),
  trump: dom.sel1(".trump img", el),
  cards: dom.sel1(".cards b", el),
  deck: dom.sel1(".deck", el),
  hand: dom.sel1(".hand", el)
}

dom.append(els.board,
  _.map(spot, boardSpots));

dom.append(els.demands,
  _.map(demand, _.range(8)));

dom.append(at("Q7"),
  canal({size: 1, orientation: "vertical"}),
  bridge({orientation: "vertical"}),
  pilli({seat: 0}));

dom.append(at("Q8"),
  temple({size: 3, seat: 0}));

dom.append(at("Q9"),
  temple({size: 1, seat: 1}));

dom.append(at("R9"),
  temple({size: 2, seat: 3}));

dom.append(at("P7"),
  canal({size: 2, orientation: "vertical"}));

dom.append(at("P9"),
  canal({size: 2, orientation: "vertical"}));

_.each(function(pos){
  dom.append(dom.sel1(`[data-demand='${pos}']`),
    capulli({size: 3}));
}, _.range(0, 8));

const [seated, seat] = await Promise.all([
  getSeated(tableId),
  getSeat(tableId, session)
]);

function desc(event){
  switch(event.type) {
    case "start":
      return "Starts game.";

    case "deal":
      return "Deals cards.";

    case "commit":
      return "I'm done.";

    case "undo":
      return "Undoes.";

    case "redo":
      return "Redoes.";

    case "reset":
      return "Resets.";

    case "broken":
      return "Breaks trump!";

    case "bid":
      return `Bids.`;

    case "play":
      return `Plays ${event.details.card.rank} of ${event.details.card.suit}.`;

    case "scoring":
      return scored(seated, event.details);

    case "finish":
      return outcome(seated, event.details);

    case "award":
      return ["Awards trick to ", subject(_.nth(seated, event.details.winner)), "."];

    default:
      return event.type;
  }
}

function moveSel(move){
  const {details} = move;
  switch(move.type){
    case "bid":
      return `[data-bid="${details.bid == null ? '' : details.bid}"]`;
    default:
      return "";
  }
}

function cardSrc({suit, rank}){
  const suits = {"♥️": "H", "♦️": "D", "♣️": "C", "♠️": "S"};
  return `/images/deck/${rank}${suits[suit]}.svg`;
}

const $table = table(tableId),
      $story = story(session, tableId, seat, seated, dom.attr(el, "data-ready", _)),
      $hist = hist($story);

function zoned(){
  return [
    div(span({class: "points"}, "0"), " pts."),
    div(span({class: "actions"}, "-"), "/", span({class: "bid"}, "-")),
  ];
}

//universal ui
ui($table, $story, $hist, $online, seated, seat, desc, zoned, el);

function temples(attrs, count, max){
  return div({class: "temples", "data-remaining": count}, ol(_.repeatedly(max, function(){
    return li(temple(attrs));
  })), div(span(0), span(1), span(2), span(3), span(4), span(5), span(6)));
}

function resources(title, resource, attrs, count, max){
  const {size, orientation} = Object.assign({orientation: "vertical", size: 1}, attrs);
  return div({class: title, "data-size": size, "data-remaining": count},
    div(_.map(span, _.range(0, max + 1))),
    ol({title}, _.repeatedly(max, function(){
      return li(resource({size, orientation}));
    })));
}

dom.append(supplies, resources("canals", canal, {size: 2}, 35, 35));
dom.append(supplies, resources("canals", canal, {size: 1}, 6, 6));
dom.append(supplies, resources("bridges", bridge, {size: 1}, 11, 11));
dom.append(supplies, resources("tokens", token, {}, 12, 12));

_.chain(seated, _.count, _.range, _.each(function(seat){
  const area = dom.sel1(`[data-seat='${seat}'] .area`);
  dom.append(area,
    temples({size: 1, seat}, 3, 6),
    temples({size: 2, seat}, 3, 5),
    temples({size: 3, seat}, 2, 4),
    temples({size: 4, seat}, 1, 3));
}, _));

$.sub($table, _.comp(t.compact(), t.map(describe), t.map(_.join("\n", _))), function(descriptors){
  dom.attr(dom.sel1("#title"), "title", descriptors || "Normal game");
});

$.sub($hist, function([curr, prior]){
  const {up, may, seen, events, moves, metrics, state, state: {trump, round, status, seated, deck, lead, broken, deals}} = curr;
  const {hand, bid} = _.nth(seated, seat) || {hand: null, bid: -1};
  const event = _.last(events);
  const cnt = _.count(seated);
  const leadSuit = _.maybe(seated, _.nth(_, lead), _.getIn(_, ["played", "suit"])) || "";
  const awarded = event.type == "award" ? _.toArray(_.take(cnt, _.drop(cnt - event.details.lead, _.cycle(event.details.trick)))) : null;

  _.each(_.doto(_,
    dom.removeClass(_, "active"),
    dom.removeClass(_, "selected"),
    dom.prop(_, "disabled", false)),
      dom.sel("button", els.moves));

  _.chain(moves, _.map(function(move){
    return dom.sel1(`button[data-type="${move.type}"]${moveSel(move)}`, els.moves);
  }, _), _.compact, _.each(dom.addClass(_, "active"), _));

  if (status === "bidding") {
    _.maybe(dom.sel1(`button[data-type="bid"][data-bid="${bid == null ? '' : bid}"]`),
      _.doto(_,
        dom.addClass(_, "selected"),
        dom.prop(_, "disabled", true)));
  }

  dom.attr(el, "data-lead", lead);
  dom.attr(el, "data-played", event.type == "play" ? event.seat : "");

  _.eachIndexed(function(idx, {bid, tricks, hand, played, scored}){
    const plyd = _.nth(awarded, idx) || played;
    const seat = dom.sel1(`[data-seat="${idx}"]`);
    _.includes(seen, idx) && _.doto(seat,
      dom.addClass(_, "yours"));
    dom.text(dom.sel1(".points", seat), _.chain(metrics, _.nth(_, idx), _.get(_, "points")));
    dom.attr(dom.sel1("[data-action]", seat), "data-action", _.includes(up, idx) ? "must" : (_.includes(may, idx) ? "may" : ""));
    dom.text(dom.sel1(".tricks", seat), _.count(tricks));
    dom.text(dom.sel1(".bid", seat), bid === null ? "?" : (bid === "" ? "X" : bid));
    dom.html(dom.sel1(".area", seat), _.maybe(plyd, cardSrc, function(src){
      return img({src});
    }));
  }, seated);

  dom.text(dom.sel1("#phase", game), {"bidding": "Bidding", "playing": `Playing ${leadSuit}`, "confirming": "Playing", "finished": "Finished"}[status]);
  dom.attr(el, "data-status", status);
  dom.attr(el, "data-broken", broken);
  dom.text(els.cards, _.count(deck) || 52);
  dom.attr(els.trump, "src", _.maybe(trump, cardSrc) || "");
  dom.text(els.roundNum, round + 1);
  dom.text(els.roundMax, _.count(deals));
  dom.html(els.hand, _.map(function(card){
    return li(img({src: cardSrc(card), "data-suit": card.suit, "data-rank": card.rank}));
  }, hand));
});

$.on(el, "click", '[data-tense="present"][data-ready="true"] .moves button[data-type="bid"]', function(e){
  const bid = _.maybe(e.target, dom.attr(_, "data-bid"), _.blot, parseInt);
  sh.dispatch($story, {type: "bid", "details": {bid}});
});

$.on(el, "click", '[data-tense="present"][data-ready="true"] .moves button[data-type="reset"], [data-tense="present"][data-ready="true"] .moves button[data-type="undo"], [data-tense="present"][data-ready="true"] .moves button[data-type="redo"], [data-tense="present"][data-ready="true"] .moves button[data-type="commit"]', function(e){
  const type = dom.attr(e.target, "data-type");
  sh.dispatch($story, {type});
});

$.on(el, "click", '[data-tense="present"][data-ready="true"] .hand img', function(e){
  const suit = dom.attr(this, "data-suit"),
        rank = dom.attr(this, "data-rank");
  sh.dispatch($story, {type: "play", details: {card: {suit, rank}}});
});

Object.assign(window, {$, _, sh, session, $story, $table, $online, supabase});

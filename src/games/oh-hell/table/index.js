import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import $ from "/lib/atomic_/reactives.js";
import sh from "/lib/atomic_/shell.js";
import supabase from "/lib/supabase.js";
import * as c from "../core.js";
import * as g from "/lib/game.js";
import {session, $online} from "/lib/session.js";
import {table, ui, scored, outcome, subject} from "/lib/table.js";
import {getSeated, getSeat, story, hist} from "/lib/story.js";
import {describe} from "/components/table/index.js";

const {img, li, div, span} = dom.tags(['img', 'li', 'div', 'span']);

const params = new URLSearchParams(document.location.search),
      tableId = params.get('id');

if (!tableId) {
  document.location.href = "../";
}

const el = document.body;
const [roundNum, roundMax] = dom.sel(".round b", el);
const els = {
  roundNum,
  roundMax,
  moves: dom.sel1(".moves", el),
  trump: dom.sel1(".trump img", el),
  cards: dom.sel1(".cards b", el),
  deck: dom.sel1(".deck", el),
  hand: dom.sel1(".hand", el)
}

function template(){
  return {
    stats: [
      div(span({class: "points"}, "0"), " pts."),
      div(span({class: "tricks"}, "-"), "/", span({class: "bid"}, "-"), span({class: "tip"}, " (taken/bid)")),
      div({class: "leads"}, "leads")
    ],
    resources: null
  };
}

const [seated, seat] = await Promise.all([
  getSeated(tableId),
  getSeat(tableId, session)
]);

function desc(event){
  switch(event.type) {
    case "started":
      return "Starts game.";

    case "dealt":
      return "Deals cards.";

    case "committed":
      return "I'm done.";

    case "broke":
      return "Breaks trump!";

    case "bid":
      return `Bids.`;

    case "played":
      return `Plays ${event.details.card.rank} of ${event.details.card.suit}.`;

    case "scored":
      return scored(seated, event.details);

    case "finished":
      return outcome(seated, event.details);

    case "awarded":
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
      $story = story(session, tableId, seat, seated, dom.attr(el, "data-ready", _), c.ohHell),
      $hist  = hist($story);

//universal ui
ui($table, $story, $hist, $online, seated, seat, desc, template, el);

$.sub($table, _.comp(_.compact(), _.map(describe), _.map(_.join("\n", _))), function(descriptors){
  dom.attr(dom.sel1("#title"), "title", descriptors || "Up and Down");
});

$.sub($hist, function([curr, prior, {step, offset}, game]){
  const {seen, event, metrics, state, state: {trump, round, status, seated, deck, lead, broken, deals}} = curr;
  const {hand, bid} = _.nth(seated, seat) || {hand: null, bid: -1};
  const moves = g.moves(game);
  const gg =
  const cnt = _.count(seated);
  const leadSuit = _.maybe(seated, _.nth(_, lead), _.getIn(_, ["played", "suit"])) || "";
  const awarded = event.type == "awarded" ? _.toArray(_.take(cnt, _.drop(cnt - event.details.lead, _.cycle(event.details.trick)))) : null;

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
    dom.text(dom.sel1(".points", seat), _.chain(metrics, _.nth(_, idx), _.get(_, "points")));
    dom.text(dom.sel1(".tricks", seat), _.count(tricks));
    dom.text(dom.sel1(".bid", seat), bid === null ? "?" : (bid === "" ? "X" : bid));
    dom.html(dom.sel1(".area", seat), _.maybe(plyd, cardSrc, function(src){
      return img({src});
    }));
  }, seated);

  dom.text(dom.sel1("#phase", el), {"bidding": "Bidding", "playing": `Playing ${leadSuit}`, "confirming": "Playing", "finished": "Finished"}[status]);
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

$.on(el, "click", '[data-tense="present"][data-ready="true"] .moves button[data-type="commit"]', function(e){
  const type = dom.attr(e.target, "data-type");
  sh.dispatch($story, {type});
});

$.on(el, "click", '[data-tense="present"][data-ready="true"] .hand img', function(e){
  const suit = dom.attr(this, "data-suit"),
        rank = dom.attr(this, "data-rank");
  sh.dispatch($story, {type: "play", details: {card: {suit, rank}}});
});

Object.assign(window, {$, _, sh, session, $story, $table, $online, supabase});

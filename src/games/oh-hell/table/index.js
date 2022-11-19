import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import sh from "/lib/atomic_/shell.js";
import supabase from "/lib/supabase.js";
import * as o from "/lib/online.js";
import {session, $online} from "/lib/session.js";
import {table} from "/lib/table.js";
import {getSeated, getSeat, story, setAt, hist, nav, refresh} from "/lib/story.js";

const div = dom.tag('div'),
      a = dom.tag('a'),
      span = dom.tag('span'),
      img = dom.tag('img'),
      ol = dom.tag('ol'),
      ul = dom.tag('ul'),
      li = dom.tag('li'),
      button = dom.tag('button');

const params = new URLSearchParams(document.location.search),
      tableId = params.get('id');

if (!tableId) {
  document.location.href = "../";
}

function eventFor(event){
  return _.maybe(event.seat, _.nth(seated, _));
}

function victor(player){
  return div({class: "victor"},
    img({alt: player.username, src: `${player.avatar}?s=150`}),
    `${player.username} wins!`);
}

function subject(player){
  return img({class: "subject", alt: player.username, src: `${player.avatar}?s=50`});
}

function scored(player, points){
  return li(
    subject(player),
    span(points));
}

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
      const {scoring} = event.details;
      return ul({class: "scored"}, _.flatten(_.mapIndexed(function(idx, {points}){
        return scored(seated[idx], points);
      }, scoring)));

    case "finish":
      const {ranked} = event.details;
      const first = ranked[0].tied ? null : ranked[0];
      const winner = _.maybe(first?.seat, _.nth(seated, _));
      return ol({class: "scored"}, _.cons(victor(winner), _.flatten(_.mapIndexed(function(idx, {tie, seat, place, points}){
        return scored(seated[seat], points);
      }, ranked))));

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

function cardPic({suit, rank}){
  const suits = {"♥️": "H", "♦️": "D", "♣️": "C", "♠️": "S"};
  return `../../../images/deck/${rank}${suits[suit]}.svg`;
}

function replay(how){
  location.hash = nav($story, how);
}

const [seated, seat] = await Promise.all([
  getSeated(tableId),
  getSeat(tableId, session)
]);

const el = document.body;

const $presence = o.seats($online, _.mapa(_.get(_, "username"), seated)),
      $table = table(tableId),
      $touch = $.pipe($.map(_.get(_, "last_touch_id"), $table), t.compact()),
      $up = $.map(_.pipe(_.get(_, "up"), _.includes(_, seat)), $table),
      $status = $.map(_.get(_, "status"), $table),
      $story = story(session, tableId, seat, seated, dom.attr(el, "data-ready", _)),
      $hist = hist($story);

$.sub($table, _.see("$table"));
$.sub($story, _.see("$story"));
$.sub($hist, _.see("$hist"));
$.sub($status, _.see("$status"));
$.sub($touch, _.see("$touch"));

const [roundNum, roundMax] = dom.sel(".round b", el);
const els = {
  roundNum,
  roundMax,
  progress: dom.sel1("progress", el),
  touch: dom.sel1("#replay .touch", el),
  touches: dom.sel1("#replay .touches", el),
  game: dom.sel1("#game", el),
  event: dom.sel1("#event", el),
  moves: dom.sel1(".moves", el),
  players: dom.sel1(".players", el),
  trump: dom.sel1(".trump img", el),
  cards: dom.sel1(".cards b", el),
  deck: dom.sel1(".deck", el),
  hand: dom.sel1(".hand", el)
}

$.sub($touch, function(){
  refresh($story);
});

const init = _.once(function(startTouch){
  $.sub(dom.hash(window), t.map(_.replace(_, "#", "")), function(touch){
    setAt($story, touch || startTouch);
  });
});

$.sub($story.$state, _.comp(t.map(function({touches}){ //TODO law of demeter
  return touches;
}), t.compact(), t.map(_.last)), init);

$.sub($story, t.compact(), function({touches, at}){
  if (touches && at != null) {
    dom.attr(el, "data-tense", _.count(touches) - 1 == at ? "present" : "past");
    dom.value(els.progress, at + 1);
    dom.attr(els.progress, "max", _.count(touches));
    dom.text(els.touch, at + 1);
    dom.text(els.touches, _.count(touches));
  }
});

$.sub($status, dom.attr(el, "data-table-status", _));
$.sub($up, dom.attr(el, "data-up", _));

dom.attr(el, "data-seats", _.count(seated));

_.eachIndexed(function(idx, {username, avatar}){
  dom.append(els.players,
    div({class: "zone", "data-seat": idx, "data-username": username, "data-presence": ""},
      div({class: "player"},
        div({class: "avatar"}, img({src: `${avatar}?s=104`})),
        div(
          a({class: "username", "href": `/profiles?username=${username}`}, username),
          div(span({class: "points"}, "0"), " pts."),
          div(span({class: "tricks"}, "-"), "/", span({class: "bid"}, "-"), span({class: "tip"}, " (taken/bid)"))),
        img({"data-action": "", src: "../../../images/pawn.svg"})),
      div({class: "played"})));
}, seated);

$.sub($presence, t.tee(_.see("presence")), function(presence){
  _.eachkv(function(username, presence){
    const zone = dom.sel1(`.zone[data-username="${username}"]`);
    dom.attr(zone, "data-presence", presence ? "online" : "offline");
  }, presence);
});

$.sub($hist, function([curr, prior]){
  const {up, may, seen, events, moves, score, state, state: {trump, round, status, seated, deck, lead, broken, deals}} = curr;
  const {hand, bid} = _.nth(seated, seat) || {hand: null, bid: -1};
  const event = _.last(events);
  const player = eventFor(event);
  const cnt = _.count(state.seated);
  const leadSuit = _.maybe(seated, _.nth(_, lead), _.getIn(_, ["played", "suit"])) || "";
  const awarded = event.type == "award" ? _.toArray(_.take(cnt, _.drop(cnt - event.details.lead, _.cycle(event.details.trick)))) : null;

  _.doto(els.event,
    dom.attr(_, "data-type", event.type),
    dom.addClass(_, "bounce"),
    dom.removeClass(_, "hidden"),
    dom.removeClass(_, "acknowledged"));

  _.each(_.doto(_,
    dom.removeClass(_, "active"),
    dom.removeClass(_, "selected"),
    dom.prop(_, "disabled", false)),
      dom.sel("button", els.moves));

  _.chain(moves, _.map(function(move){
    return dom.sel1(`button[data-type="${move.type}"]${moveSel(move)}`, els.moves);
  }, _), _.compact, _.each(dom.addClass(_, "active"), _));

  status == "bidding" && _.maybe(dom.sel1(`button[data-type="bid"][data-bid="${bid == null ? '' : bid}"]`),
    _.doto(_,
      dom.addClass(_, "selected"),
      dom.prop(_, "disabled", true)));

  dom.addClass(el, "initialized");
  dom.attr(el, "data-event-type", event.type);
  dom.attr(el, "data-perspective", seat);
  dom.attr(els.players, "data-lead", lead);
  dom.attr(els.players, "data-played", event.type == "play" ? event.seat : "");
  dom.toggleClass(els.event, "automatic", !player);
  if (player) {
    dom.attr(dom.sel1("img.who", els.event), "src", `${player.avatar}?=80`);
    dom.text(dom.sel1("p.who", els.event), player.username);
  }
  dom.html(dom.sel1("p", els.event), desc(event));

  _.eachIndexed(function(idx, {bid, tricks, hand, played, scored}){
    const plyd = _.nth(awarded, idx) || played;
    const seat = dom.sel1(`[data-seat="${idx}"]`);
    _.includes(seen, idx) && _.doto(seat,
      dom.addClass(_, "yours"));
    dom.text(dom.sel1(".points", seat), _.nth(score, idx));
    dom.attr(dom.sel1("[data-action]", seat), "data-action", _.includes(up, idx) ? "must" : (_.includes(may, idx) ? "may" : ""));
    dom.text(dom.sel1(".tricks", seat), _.count(tricks));
    dom.text(dom.sel1(".bid", seat), bid === null ? "?" : (bid === "" ? "X" : bid));
    dom.html(dom.sel1(".played", seat), _.maybe(plyd, cardPic, function(src){
      return img({src});
    }));
  }, seated);

  dom.text(dom.sel1("#phase", game), {"bidding": "Bidding", "playing": `Playing ${leadSuit}`, "confirming": "Playing", "finished": "Finished"}[status]);
  dom.attr(el, "data-status", status);
  dom.attr(el, "data-broken", broken);
  dom.text(els.cards, _.count(deck) || 52);
  dom.attr(els.trump, "src", _.maybe(trump, cardPic) || "");
  dom.text(els.roundNum, round + 1);
  dom.text(els.roundMax, _.count(deals));
  dom.html(els.hand, _.map(function(card){
    return li(img({src: cardPic(card), "data-suit": card.suit, "data-rank": card.rank}));
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

$.on(el, "click", "#event", function(e){
  const self = this;
  dom.addClass(self, "acknowledged");
  setTimeout(function(){
    dom.addClass(self, "hidden");
  }, 500);
});

$.on(el, "click", '[data-tense="present"][data-ready="true"] .hand img', function(e){
  const suit = dom.attr(this, "data-suit"),
        rank = dom.attr(this, "data-rank");
  sh.dispatch($story, {type: "play", details: {card: {suit, rank}}});
});

$.on(el, "keydown", function(e){
  if (e.key == "ArrowLeft") {
    e.preventDefault();
    replay(e.shiftKey ? "inception" : "back");
  } else if (e.key == "ArrowRight") {
    e.preventDefault();
    replay(e.shiftKey ? "present": "forward");
  }
});

$.on(el, "click", "#replay [data-nav]", function(e){
  replay(dom.attr(e.target, "data-nav"));
});

Object.assign(window, {$, _, sh, session, $story, $table, $touch, $status, $up, $online, supabase});

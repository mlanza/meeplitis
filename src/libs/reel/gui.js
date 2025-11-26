import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import dom from "../atomic_/dom.js";
import supabase from "../supabase.js";
import { presence } from "../online.js";
import { $online, session } from "../session.js";
import { reg } from "../cmd.js";
import { reel, addLog, getSeats } from "./shell.js";
import { relink } from "../links.js";
import { clear } from "../wip.js";

const params = new URLSearchParams(location.search);
const tableId = params.get('id');
const seats = await getSeats(tableId, session?.accessToken);
export const seat = _.count(seats) > 1 ? _.maybe(params.get("seat"), parseInt) : _.first(seats);

const rejected = seat != null && !_.includes(seats, seat);
params.delete("seat");
const redirect = !tableId ? "../" : rejected ? `${location.origin}${location.pathname}?${params.toString()}${location.hash}` : null;

if (redirect) {
  location.href = redirect;
}

const ttl = dom.sel1("head title");
const title = _.chain(ttl, dom.text, _.split(_, "|"), _.first, _.trim);
dom.text(ttl, `${title} #${tableId}`);

const {div, h1, a, span, img, ol, ul, li, sup} = dom.tags(['div', 'h1', 'a', 'span', 'img', 'ol', 'ul', 'li', 'sup']);

_.maybe(session?.username, username => relink("/profiles/", {username}), dom.attr(dom.sel1("a.user"), "href", _));

export function diff(curr, prior, path, f){
  const c = _.getIn(curr, path),
        p = _.getIn(prior, path);
  if (_.notEq(c, p)) {
    f(c, p);
  }
}

export function closestAttr(el, attr){
  return _.maybe(el, _.closest(_, `[${attr}]`), dom.attr(_, attr));
}

export const retainAttr = _.partly(function(el, key, value){
  value == null ? dom.removeAttr(el, key) : dom.attr(el, key, value);
});

export function player(username, avatar_url, seat, ...contents){
  return div({class: "player"},
    div({class: "avatar"}, img({src: avatar_url}), a({class: "seat", href: relink("./", {seat}, null)}, seat)),
    div(a({class: "username", "href": relink("/profiles/", {username})}, h1(username)), contents),
    img({"data-action": "", src: "/images/pawn.svg"}));
}

export function zone(seat, username, avatar_url, delegate, {stats, resources}){
  return div({class: "zone", "data-delegate": !!delegate, "data-seat": seat, "data-username": username, "data-presence": ""},
    player(username, avatar_url, seat, stats),
    div({class: "area"}, resources));
}

function score(player, {points, place, brief}){
  const title = brief;
  return li({"data-place": place, title},
    subject(player),
    span(points));
}

export function scored(seated, {scoring}){
  return ul({class: "scored"}, _.mapIndexed(function(idx, metrics){
    return score(seated[idx], metrics);
  }, scoring));
}

export function outcome(seated, {places, metrics, briefs}){
  const seats = _.mapa(function(place, metric, brief, player){
    return {place, metric, brief, player};
  }, places, metrics, briefs, seated);
  const standings = _.chain(seated, _.mapIndexed(function(idx, seat){
    const place = _.nth(places, idx),
          brief = _.nth(briefs, idx);
    return Object.assign({place, brief}, _.nth(metrics, idx), seat);
  }, _), _.sort(_.asc(_.get(_, "place")), _));
  const winners = _.filtera(_.pipe(_.get(_, "place"), _.eq(_, 1)), standings);
  const highlight = _.count(winners) === 1 ? victor : victors;
  return [highlight(winners, seated),
      ol({class: "scored"}, _.mapa(score, standings, standings)),
      rankings({seated, seats})];
}

function victors(players) {
  return div({class: "victors"},
    img({src: "/images/trophy.png"}),
    `The victory is shared!`);
}

function victor([player], seated){
  const seat = _.detectIndex(_.comp(_.eq(_, player.seat_id), _.get(_, "seat_id")), seated);
  return div({class: "victor"},
    img({alt: player.username, src: player.avatar_url}),
    `${player.username}`, sup(seat), ` wins!`);
}

export function subject({username, avatar_url}){
  return span({class: "subject avatar"}, img({alt: username, src: avatar_url}));
}

export const el = dom.sel1("#table");
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

const eventId = _.maybe(location.hash, _.replace(_, "#", ""));
export const $reel = reel(tableId, seat, eventId);
export const $wip = $.chan($reel, "wip");
export const $table = $.pipe($.chan($reel, "table"), _.compact());
export const $changed = $.chan($reel, "changed");
export const $error = $.chan($reel, "error");

const run = $.dispatch($reel, _);

reg({ $reel, $wip, $changed, $table, $error });

_.maybe(dom.sel1(`[data-seat='${seat}']`, el), dom.addClass(_, "yours"));
dom.attr(el, "data-perspective", seat);
dom.toggleClass(el, "dev", params.get("dev") == 1);

export function gui(describe, desc, template){
  const $seated = $.pipe($.chan($reel, "seated"), _.compact());
  const $seats = $.pipe($.chan($reel, "seats"), _.compact());
  const $described = $.map(_.pipe(_.get(_, "config"), describe), $table);
  const $hash  = dom.hash(window);

  $.sub($hash, _.comp(_.map(_.replace(_, "#", "")), _.compact()), function(at){
    $.dispatch($reel, {type: "at", details: {at}});
  });

  $.sub($reel, _.comp(_.map(_.getIn(_, ["cursor", "at"])), _.compact()), function(at){
    location.hash = at;
  });

  $.sub($seats, _.once(function(seats){
    dom.toggleClass(el, "switch-seats", _.count(seats) > 1);
  }));

  $.sub($seated, _.once(function(seated){
    dom.attr(el, "data-seats", _.count(seated));

    $.on($reel, "changed", function({ details: { changed, hist: [curr, prior] = [] } = {} }){
      if (_.some(_.eq(_, ["perspective"]), changed)) {
        const {up, may, event} = curr?.perspective || {};
        $.eachIndexed(function(seat){
          dom.attr(dom.sel1(`[data-seat="${seat}"] [data-action]`, els.players), "data-action", _.includes(up, seat) ? "must" : (_.includes(may, seat) ? "may" : ""));
        }, seated);
        dom.html(dom.sel1("p", els.event), desc(seated, event));
        dom.text(dom.sel1("span.seat", els.event), event?.seat);
      }
    });

    const $presence = presence($online,
      _.chain(seated,
        _.mapa(_.get(_, "username"), _),
        _.unique,
        _.toArray));

    $.sub($presence, $.eachkv(function(username, presence){
      _.chain(
        dom.sel(`.zone[data-username="${username}"]`),
        $.each(function(zone){
          dom.attr(zone, "data-presence", presence ? "online" : "offline");
        }, _));
    }, _));

    $.eachIndexed(function(seat, {username, avatar_url}){
      const delegate = _.getIn(seated, [seat, "delegate_id"]);
      dom.append(els.players, zone(seat, username, avatar_url, delegate, template(seat)));
    }, seated);

    const multiSeated = _.count(_.unique(_.map(_.get(_, "player_id"), seated))) != _.count(seated);
    dom.toggleClass(el, "multi-seated", multiSeated);

    params.get("listed") && dom.attr(dom.sel1("#title", el), "href", href => relink(href, {id: null}, null));
  }));

  $.sub($described, function(described){
    dom.toggleClass(els.options, "none", !_.seq(described));
    dom.text(dom.sel1("#options p", el), _.join(", ", described));
  });
}

$.sub($error, _.filter(_.isSome), function(error){
  const {message} = error;
  dom.text(dom.sel1("#error p", el), message);
  dom.addClass(el, "error");
  dom.removeClass(el, "ack");
  addLog(message, {tableId});
});

$.on($reel, "changed", function({ details: { bwd, step, offset, present, changed, hist: [curr, prior] = [] } = {} }){
  const ctx = "gui";
  const { seat, wip, table, act, up, cursor, undoable, ready, error } = curr || {};
  const { state, game, event, actor, actionable } = curr?.perspective || {};
  const { status, dice, off, stakes, holdsCube } = state || {};
  const undoer = _.detectIndex(_.comp(_.eq(curr?.last_acting_seat, _), _.get(_, "seat_id")), curr?.seated);

  dom.value(els.progress, cursor?.pos + 1);
  dom.attr(els.progress, "max", cursor?.max + 1);
  dom.text(els.touch, cursor?.pos + 1);
  dom.text(els.touches, cursor?.max + 1);

  dom.removeClass(el, "ack");
  dom.removeClass(el, "error");
  dom.toggleClass(el, "wait", !ready)
  dom.toggleClass(el, "act", act);
  dom.toggleClass(el, "up", up);
  dom.toggleClass(el, "present", present);
  dom.attr(el, "data-table-status", table?.status);

  dom.toggleClass(els.remarks, "none", !table?.remark);
  dom.text(dom.sel1("#remarks p", el), table?.remark);

  event && $.doto(els.event,
    dom.attr(_, "data-type", event?.type),
    dom.addClass(_, "posted"),
    dom.removeClass(_, "hidden"));

  setTimeout(function(){
    dom.removeClass(els.event, "posted");
  }, 300);

  dom.attr(el, "data-event-type", event?.type);
  dom.attr(el, "data-undoable", undoable == event?.id ? "1" : undoable ? "0" : null);
  dom.attr(el, "data-undoer", seat == undoer);
  dom.toggleClass(els.event, "automatic", !actor);
  dom.toggleClass(el, "bwd", bwd);

  if (!ready) {
    clear($wip);
  }

  if (!!error) {
    clear($wip);
  }

  if (actor) {
    dom.attr(dom.sel1("img.who", els.event), "src", actor.avatar_url);
    dom.text(dom.sel1("p.who", els.event), actor.username);
  }

  dom.addClass(el, "init");
});

const $depressed = $.map(_.pipe(_.join(" ", _), _.lowerCase), dom.depressed(document.body));
$.sub($depressed, dom.attr(el, "data-depressed", _));

$.on(els.options, "click", function(e){
  dom.sel1("#options", el).scrollIntoView();
});

$.on(els.remarks, "click", function(e){
  dom.sel1("#remarks", el).scrollIntoView();
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
      run({type: "pass"});
      break;

    case "Enter":
      e.preventDefault();
      run({type: "commit"});
      break;

    case "s":
      if (e.metaKey) {
        e.preventDefault();
        location.href = `${location.origin}/shell/${location.search}${location.hash}`;
      }
      break;

    case ",":
      e.preventDefault();
      run({type: "last-move"});
      break;
  }
});

$.on(el, "click", "#replay [data-nav]", function(e){
  const type = dom.attr(e.target, "data-nav");
  run({type});
});

$.on(el, "click", ".message", function(e){
  dom.addClass(el, "ack");
});

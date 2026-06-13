import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import dom from "../atomic_/dom.js";
import { reg } from "../cmd.js";
import supabase from "/libs/supabase.js";
import {reel, getSeats, isPresent} from "./shell.js";
import { presence } from "/libs/online.js";
import { $online, session, getfn } from "/libs/session.js";
import { relink } from "/libs/links.js";
import { rankings } from "/components/table/ui.js";
import "/libs/dummy.js";

const params = new URLSearchParams(location.search);
const tableId = params.get('id');

if (!tableId) {
  location.href = "../../";
}

const selectedSeat = _.maybe(params.get("seat"), parseInt) ?? null;
const ttl = dom.sel1("head title");

const {div, h1, a, span, img, ol, ul, li, sup} = dom.tags(['div', 'h1', 'a', 'span', 'img', 'ol', 'ul', 'li', 'sup']);

export const el = dom.sel1("#table");

_.maybe(session?.username, username => relink("/profiles/", {username}), dom.attr(dom.sel1("a.user"), "href", _));

const els = {
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

function later($what){
  return new Promise(function(resolve){
    $.sub($what, _.filter(_.isSome), resolve);
  });
}

export async function gui(describe, desc, template) {
  const seats = await getSeats(tableId, session?.accessToken);
  const seat = selectedSeat === null ? _.first(seats) : _.detect(s => s === selectedSeat, seats) || _.first(seats);
  const misselected = seat !== selectedSeat;
  if (misselected) {
    params.delete("seat");
    //location.href = `${location.origin}${location.pathname}?${params.toString()}${location.hash}`;
  }

  const $reel = reel(tableId, seat, session?.accessToken);
  const exec = $.dispatch($reel, _);
  const $wip = $.chan($reel, "wip");
  const $error = $.chan($reel, "error");
  const $hist = $.hist($reel);
  const $cursor = $.map(_.get(_, "cursor"), $reel);
  const $act = $.map(_.get(_, "act"), $reel);
  const $up = $.map(_.get(_, "up"), $reel);
  const $ready = $.map(_.get(_, "ready"), $reel);
  const $table = $.map(_.get(_, "table"), $reel);
  const $status = $.map(_.get(_, "status"), $table);
  const $present = $.pipe($.map(function(cursor){
    const {pos, max} = cursor ?? {};
    return isPresent(pos, max);
  }, $cursor), _.filter(_.isSome));
  //const $scored = $.map(_.get(_, "scored"), $table);
  const $remarks = $.map(_.get(_, "remark"), $table);
  const $described = $.map(_.pipe(_.get(_, "config"), describe), $table);
  const seated = await later($.map(_.get(_, "seated"), $reel));
  //const seats = await later($.map(_.get(_, "seats"), $reel));
  const $presence = presence($online,
    _.chain(seated,
      _.mapa(_.get(_, "username"), _),
      _.unique,
      _.toArray));

  const $gui = $.pipe($.map(function([now, past], wip){
    const curr = now?.perspective ?? null;
    const prior = past?.perspective ?? null;
    const hist = [curr, prior];
    const motion = curr && prior && now?.cursor?.pos !== past?.cursor?.pos;
    const step = motion ? now?.cursor?.pos - past?.cursor?.pos : 0;
    const offset = now?.cursor ? now?.cursor?.pos - now?.cursor?.max : null;
    const touch = now?.cursor?.at;
    const last_acting_seat = now?.last_acting_seat;
    const seated = now?.seated;
    const seat = now?.seat; //TODO
    const undoable = now?.undoable;
    const undoer = seat === _.detectIndex(_.comp(_.eq(last_acting_seat, _), _.get(_, "seat_id")), seated);
    const player = _.maybe(curr?.event, eventFor);
    const game = curr?.game;
    const { cursor } = now ?? {};
    const { max, pos } = cursor ?? {};
    const present = isPresent(pos, max);
    const which = now?.scratch === past?.scratch ? 0 : 1;
    const bwd =  now?.cursor?.direction <= 0;
    const time = {
      bwd,
      touch,
      step,
      offset,
      motion,
      present
    }
    return {hist, wip, which, game, seat, undoable, undoer, player, time};
  }, $hist, $wip), _.filter(function({hist}){ return _.getIn(_.first(hist), ["state"]); }));

  const title = _.chain(ttl, dom.text, _.split(_, "|"), _.first, _.trim);
  dom.text(ttl, `${title} #${tableId}`);

  function eventFor(event){
    return _.maybe(event.seat, _.nth(seated, _));
  }

  const multiSeated = _.count(_.unique(_.map(_.get(_, "player_id"), seated))) != _.count(seated);
  dom.toggleClass(el, "multi-seated", multiSeated);
  dom.toggleClass(el, "switch-seats", _.count(seats) > 1);
  dom.toggleClass(el, "dev", params.get("dev") == 1);

  params.get("listed") && dom.attr(dom.sel1("#title", el), "href", href => relink(href, {id: null}, null));

  $.eachIndexed(function(seat, {username, avatar_url}){
    const delegate = _.getIn(seated, [seat, "delegate_id"]);
    dom.append(els.players, zone(seat, username, avatar_url, delegate, template(seat)));
  }, seated);

  _.maybe(dom.sel1(`[data-seat='${seat}']`, el), dom.addClass(_, "yours"));
  dom.attr(el, "data-perspective", seat);
  dom.attr(el, "data-seats", _.count(seated));

  $.sub($error, _.filter(_.isSome), function(error){
    const {message} = error;
    dom.text(dom.sel1("#error p", el), message);
    dom.addClass(el, "error");
    dom.removeClass(el, "ack");
    addLog(message, {tableId});
  });

  $.sub($error, _.filter(_.isSome), function(){ //when an error occurs...
    $.reset($wip, null);
  });

  $.sub($ready, _.filter(_.not), function(){ //upon issuing a move...
    $.reset($wip, null);
  });

  $.sub($status, dom.attr(el, "data-table-status", _));
  $.sub($present, dom.toggleClass(el, "present", _));
  $.sub($act, dom.toggleClass(el, "act", _));
  $.sub($up, dom.toggleClass(el, "up", _));
  $.sub($ready, _.map(_.not), dom.toggleClass(el, "wait", _));
  $.sub($remarks, function(remarks){
    dom.toggleClass(els.remarks, "none", !remarks);
    dom.text(dom.sel1("#remarks p", el), remarks);
  });

  $.sub($described, function(described){
    dom.toggleClass(els.options, "none", !_.seq(described));
    dom.text(dom.sel1("#options p", el), _.join(", ", described));
  });

  $.sub($gui, function({time: {touch}}){
    location.hash = touch;
  });

  $.sub($gui, function({hist: [{up, may}]}){
    $.eachIndexed(function(seat){
      dom.attr(dom.sel1(`[data-seat="${seat}"] [data-action]`, els.players), "data-action", _.includes(up, seat) ? "must" : (_.includes(may, seat) ? "may" : ""));
    }, seated);
  });

  $.sub($presence, function(presence){
    $.eachkv(function(username, presence){
      _.chain(dom.sel(`.zone[data-username="${username}"]`), $.each(function(zone){
        dom.attr(zone, "data-presence", presence ? "online" : "offline");
      }, _));
    }, presence);
  });

  $.sub($cursor, function({pos, max}){
    dom.value(els.progress, pos + 1);
    dom.attr(els.progress, "max", max + 1);
    dom.text(els.touch, pos + 1);
    dom.text(els.touches, max + 1);
  });

  const $depressed = $.map(_.pipe(_.join(" ", _), _.lowerCase), dom.depressed(document.body));
  $.sub($depressed, dom.attr(el, "data-depressed", _));

  $.sub($gui, function({hist: [{event}], undoer, undoable, player, time: {bwd, touch}}){
    dom.removeClass(el, "ack");
    dom.removeClass(el, "error");

    $.doto(els.event,
      dom.attr(_, "data-type", event.type),
      dom.addClass(_, "posted"),
      dom.removeClass(_, "hidden"));

    setTimeout(function(){
      dom.removeClass(els.event, "posted");
    }, 300);

    dom.attr(el, "data-event-type", event.type);
    dom.attr(el, "data-undoable", undoable == touch ? "1" : undoable ? "0" : null);
    dom.attr(el, "data-undoer", undoer);
    dom.html(dom.sel1("p", els.event), desc(event));
    dom.text(dom.sel1("span.seat", els.event), event.seat);
    dom.toggleClass(els.event, "automatic", !player);
    dom.toggleClass(el, "bwd", bwd);

    if (player) {
      dom.attr(dom.sel1("img.who", els.event), "src", player.avatar_url);
      dom.text(dom.sel1("p.who", els.event), player.username);
    }

    dom.addClass(el, "init");
  });

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
        exec({type: e.shiftKey ? "inception" : "back"});
        break;

      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault();
        exec({type: e.shiftKey ? "present": "forward"});
        break;

      case "Backspace":
        if (e.shiftKey) {
          e.preventDefault();
          exec({type: "do-over"});
        }
        break;

      case "Escape": //cancel work in progress and/or clear error
        e.preventDefault();
        $.reset($wip, null);
        $.reset($error, null);
        break;

      case ".": //not always an option
        e.preventDefault();
        exec({type: "pass"});
        break;

      case "Enter":
        e.preventDefault();
        exec({type: "commit"});
        break;

      case "s":
        if (e.metaKey) {
          e.preventDefault();
          location.href = `${location.origin}/shell/${location.search}${location.hash}`;
        }
        break;

      case ",":
        e.preventDefault();
        exec({type: "last-move"});
        break;
    }
  });

  $.on(el, "click", "#replay [data-nav]", function(e){
    const type = dom.attr(e.target, "data-nav");
    exec({type});
  });

  $.on(el, "click", ".message", function(e){
    dom.addClass(el, "ack");
  });

  //reposition the game according to the hash
  location.hash && $.sub($reel, _.filter(_.get(_, "touches")), _.once(function(){
    const touch = location.hash.substring(1);
    exec({type: "at", details: {touch}});
  }));

  return $.doto({seat, seats, seated, exec, $reel, $wip, $gui, $table}, reg);
}

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

export const retainAttr = _.partly(function retainAttr(el, key, value){
  value == null ? dom.removeAttr(el, key) : dom.attr(el, key, value);
});

export function subject({username, avatar_url}){
  return span({class: "subject avatar"}, img({alt: username, src: avatar_url}));
}

export function addLog(message, details = null){
  return supabase
    .from('logs')
    .insert({ message, details });
}

export function diff(curr, prior, path, f){
  const c = _.getIn(curr, path),
        p = _.getIn(prior, path);
  if (_.notEq(c, p)) {
    f(c, p);
  }
}


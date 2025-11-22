import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import dom from "../atomic_/dom.js";
import { reel } from "./shell.js";
import { reg } from "../cmd.js";
import supabase from "../supabase.js";
import { session } from "../session.js";
import {relink} from "../links.js";

const params = new URLSearchParams(location.search);
const tableId = params.get('id');
export const seat = _.count(seats) > 1 ? _.maybe(params.get("seat"), parseInt) : _.first(seats);

const {div, h1, a, span, img, ol, ul, li, sup} = dom.tags(['div', 'h1', 'a', 'span', 'img', 'ol', 'ul', 'li', 'sup']);

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

export const $reel = reel(tableId, seat);
export const $work = $.chan($reel, "wip");
const $error = $.chan($reel, "error");
const run = $.dispatch($reel, _);

reg({ $reel, $work });

$.on($reel, "changed", function({ details: { changed, hist: [curr, prior] = [] } = {} }){
  const ctx = "gui";
  console.log({ ctx, changed, curr, prior });
});

$.on(el, "click", "#replay [data-nav]", function(e){
  const nav = dom.attr(e.target, "data-nav");
  run({type: nav});
});

$.on(el, "click", ".message", function(e){
  dom.addClass(el, "ack");
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
      //TODO $.dispatch($story, {type: "pass"});
      break;

    case "Enter":
      e.preventDefault();
      run({type: "commit"});
      break;

    case "s":
      //if (e.metaKey) {
      //  e.preventDefault();
      //  location.href = `${location.origin}/shell/${location.search}${location.hash}`;
      //}
      break;

    case ",":
      e.preventDefault();
      run({type: "last-move"});
      break;
  }
});


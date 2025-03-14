import _ from "/libs/atomic_/core.js";
import dom from "/libs/atomic_/dom.js";
import $ from "/libs/atomic_/shell.js";
import supabase from "/libs/supabase.js";
import {presence} from "/libs/online.js";
import {$online, session} from "/libs/session.js";
import {relink} from "/libs/links.js";
import {story, nav, hist, snapshot, waypoint, refresh, replay, toPresent, atPresent, inPast} from "/libs/story.js";
import {wip, clear} from "/libs/wip.js";
import {rankings} from "/components/table/ui.js";
import {reg} from "/libs/cmd.js";
import "/libs/dummy.js";

export const el = dom.sel1("#table");
const params = new URLSearchParams(location.search);
export const tableId = params.get('id');

const accessToken = session?.accessToken;

export const [config, seated, seats] = await Promise.all([
  getConfig(tableId),
  getSeated(tableId),
  getSeats(tableId, accessToken)
]);

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

const {div, h1, a, span, img, ol, ul, li} = dom.tags(['div', 'h1', 'a', 'span', 'img', 'ol', 'ul', 'li']);

_.maybe(session?.username, username => relink("/profiles/", {username}), dom.attr(dom.sel1("a.user"), "href", _));

function table(tableId){
  const $t = $.atom(null);

  supabase
    .from('tables')
    .select('*')
    .eq('id', tableId)
    .then(_.getIn(_, ["data", 0]))
    .then($.reset($t, _));

  const channel = supabase.channel('db-messages').
    on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'tables',
      filter: `id=eq.${tableId}`,
    }, function(payload){
      $.reset($t, payload.new);
    }).
    subscribe();

  return $.pipe($t, _.compact());
}

export function diff(curr, prior, path, f){
  const c = _.getIn(curr, path),
        p = _.getIn(prior, path);
  if (_.notEq(c, p)) {
    f(c, p);
  }
}

export function ui(make, describe, desc, template){
  const $table = table(tableId),
        $ready = $.atom(false),
        $error = $.atom(null),
        $up    = $.map(_.pipe(_.get(_, "up"), _.includes(_, seat)), $table),
        $hash  = dom.hash(window);

  const $story = story(make, session?.accessToken, tableId, seat, seated, config, $hash, $up, $ready, $error),
        $hist  = hist($story),
        $snapshot = snapshot($story),
        $wip   = wip($story);

  reg({$table, $ready, $error, $up, $story, $hist, $snapshot, $wip});

  const $touch = $.pipe($.map(_.get(_, "last_touch_id"), $table), _.compact()),
        $started = $.map(_.pipe(_.get(_, "status"), _.eq(_, "started")), $table), //games can be abandoned
        $status = $.map(_.get(_, "status"), $table),
        $scored = $.map(_.get(_, "scored"), $table),
        $remarks = $.map(_.get(_, "remark"), $table),
        $described = $.map(_.pipe(_.get(_, "config"), describe), $table),
        $presence = presence($online, _.mapa(_.get(_, "username"), seated)),
        $present = $.map(_.all, $ready, $.pipe($story, _.map(function({touches, at}){
          return _.count(touches) - 1 == at;
        }), _.dedupe())),
        $act = $.map(_.all, $present, $up, $ready, $started);

  reg({$touch, $started, $status, $scored, $remarks, $described, $presence, $present, $act});

  const multiSeated = _.count(_.unique(_.map(_.get(_, "player_id"), seated))) != _.count(seated);
  dom.toggleClass(el, "multi-seated", multiSeated);
  dom.toggleClass(el, "switch-seats", _.count(seats) > 1);

  params.get("listed") && dom.attr(dom.sel1("#title", el), "href", href => relink(href, {id: null}, null));

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

  function eventFor(event){
    return _.maybe(event.seat, _.nth(seated, _));
  }

  //render fixed player zones
  $.eachIndexed(function(seat, {username, avatar_url}){
    dom.append(els.players, zone(seat, username, avatar_url, template(seat)));
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

  $.sub($error, _.filter(_.isSome), function(error){ //when an error occurs...
    clear($wip);
  });

  $.sub($ready, _.filter(_.not), function(){ //upon issuing a move...
    clear($wip);
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

  //manage data-action
  $.sub($hist, function([{up, may}]){
    $.eachIndexed(function(seat){
      dom.attr(dom.sel1(`[data-seat="${seat}"] [data-action]`, els.players), "data-action", _.includes(up, seat) ? "must" : (_.includes(may, seat) ? "may" : ""));
    }, seated);
  });

  $.sub($presence, function(presence){
    $.eachkv(function(username, presence){
      const zone = dom.sel1(`.zone[data-username="${username}"]`);
      dom.attr(zone, "data-presence", presence ? "online" : "offline");
    }, presence);
  });

  $.sub($touch, function(touch){
    refresh($story, inPast($story, touch) ? _.partial(replay, $story, "present") : atPresent($story) ? _.partial(toPresent, $story) : _.noop);
  });

  $.sub($story, function({touches, at}){
    dom.value(els.progress, at + 1);
    dom.attr(els.progress, "max", _.count(touches));
    dom.text(els.touch, at + 1);
    dom.text(els.touches, _.count(touches));
  });

  const $depressed = $.map(_.pipe(_.join(" ", _), _.lowerCase), dom.depressed(document.body));
  $.sub($depressed, dom.attr(el, "data-depressed", _));

  //configure event
  $.sub($hist, function([curr, prior, {undoable}]){
    const {event, seen} = curr;
    const player = eventFor(event);

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
    dom.html(dom.sel1("p", els.event), desc(event));
    dom.text(dom.sel1("span.seat", els.event), event.seat);
    dom.toggleClass(el, "undoable", undoable);
    dom.toggleClass(els.event, "automatic", !player);

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
        replay($story, e.shiftKey ? "inception" : "back");
        break;

      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault();
        replay($story, e.shiftKey ? "present": "forward");
        break;

      case "Backspace":
        if (e.shiftKey) {
          e.preventDefault();
          replay($story, "do-over");
        }
        break;

      case "Escape": //cancel work in progress and/or clear error
        e.preventDefault();
        clear($wip);
        $.reset($error, null);
        break;

      case ".": //not always an option
        e.preventDefault();
        $.dispatch($story, {type: "pass"});
        break;

      case "Enter":
        e.preventDefault();
        $.dispatch($story, {type: "commit"});
        break;

      case "s":
        if (e.metaKey) {
          e.preventDefault();
          location.href = `${location.origin}/shell/${location.search}${location.hash}`;
        }
        break;

      case ",":
        e.preventDefault();
        replay($story, "last-move");
        break;
    }
  });

  $.on(el, "click", "#replay [data-nav]", function(e){
    replay($story, dom.attr(e.target, "data-nav"));
  });

  $.on(el, "click", ".message", function(e){
    dom.addClass(el, "ack");
  });

  return {$table, $ready, $error, $story, $hist, $snapshot, $wip};
}

export function player(username, avatar_url, seat, ...contents){
  return div({class: "player"},
    div({class: "avatar"}, img({src: avatar_url}), a({class: "seat", href: relink("./", {seat}, null)}, seat)),
    div(a({class: "username", "href": relink("/profiles/", {username})}, h1(username)), contents),
    img({"data-action": "", src: "/images/pawn.svg"}));
}

export function zone(seat, username, avatar_url, {stats, resources}){
  return div({class: "zone", "data-seat": seat, "data-username": username, "data-presence": ""},
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
  return [highlight(winners),
      ol({class: "scored"}, _.mapa(score, standings, standings)),
      rankings({seated, seats})];
}

function victors(players) {
  return div({class: "victors"},
    img({src: "/images/trophy.png"}),
    `The victory is shared!`);
}

function victor([player]){
  return div({class: "victor"},
    img({alt: player.username, src: player.avatar_url}),
    `${player.username} wins!`);
}

export function subject({username, avatar_url}){
  return span({class: "subject avatar"}, img({alt: username, src: avatar_url}));
}

function getSeated(tableId){
  return tableId ? _.fmap(fetch(`https://seated.workers.meeplitis.com?table_id=${tableId}`), resp => resp.json()) : Promise.resolve([]);
}

function getSeats(tableId, accessToken){
  return tableId && accessToken ? _.fmap(fetch(`https://seats.workers.meeplitis.com?table_id=${tableId}`, {
    headers: {
      accessToken
    }
  }), resp => resp.json()) : Promise.resolve([]);
}

export function addLog(message, details = null){
  return supabase
    .from('logs')
    .insert({ message, details });
}

function getConfig(tableId){
  return tableId ? supabase
    .from('tables')
    .select('config')
    .eq('id', tableId)
    .then(function({data}){
      return data[0].config;
    }) : Promise.resolve({});
}

export function which($latest){ //which entry index changed?
  return $.share($.pipe($.hist($latest),
    _.filter(_.isArray),
    _.filter(function([curr, prior]){
      return _.isArray(curr);
    }),
    _.map(function([curr, prior]){
      return _.conj(curr, _.detectIndex(_.not, _.map(_.isIdentical, curr, prior)));
    })));
}

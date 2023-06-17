import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import $ from "/lib/atomic_/reactives.js";
import supabase from "/lib/supabase.js";
import {presence} from "/lib/online.js";
import {story, nav, hist, waypoint, refresh, atPresent} from "/lib/story.js";

const {div, h1, a, span, img, ol, ul, li} = dom.tags(['div', 'h1', 'a', 'span', 'img', 'ol', 'ul', 'li']);

export function table(tableId){
  const $t = $.cell(null);

  supabase
    .from('tables')
    .select('*')
    .eq('id', tableId)
    .then(_.getIn(_, ["data", 0]))
    .then(_.reset($t, _));

  const channel = supabase.channel('db-messages').
    on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'tables',
      filter: `id=eq.${tableId}`,
    }, function(payload){
      _.reset($t, payload.new);
    }).
    subscribe();

  return $.pipe($t, _.compact());
}

export function ui($table, $story, $hist, $online, seated, seat, desc, template, el){
  const $touch = $.pipe($.map(_.get(_, "last_touch_id"), $table), _.compact()),
        $up = $.map(_.pipe(_.get(_, "up"), _.includes(_, seat)), $table),
        $status = $.map(_.get(_, "status"), $table),
        $scored = $.map(_.get(_, "scored"), $table),
        $presence = presence($online, _.mapa(_.get(_, "username"), seated));

  const els = {
    progress: dom.sel1("progress", el),
    touch: dom.sel1("#replay .touch", el),
    touches: dom.sel1("#replay .touches", el),
    game: dom.sel1("#game", el),
    players: dom.sel1(".players", el),
    event: dom.sel1("#event", el)
  }

  function replay(how){
    location.hash = waypoint($story, how) || location.hash;
  }

  function toPresent(){
    replay("forward");
    if (!atPresent($story)) {
      setTimeout(toPresent, 3000);
    }
  }

  function eventFor(event){
    return _.maybe(event.seat, _.nth(seated, _));
  }

  //render fixed player zones
  _.eachIndexed(function(seat, {username, avatar_url}){
    dom.append(els.players, zone(seat, username, avatar_url, template(seat)));
  }, seated);

  _.maybe(dom.sel1(`[data-seat='${seat}']`, el), dom.addClass(_, "yours"));
  dom.attr(el, "data-perspective", seat);
  dom.attr(el, "data-seats", _.count(seated));

  $.sub($table, _.see("$table"));
  $.sub($status, _.see("$status"));
  $.sub($touch, _.see("$touch"));
  $.sub($story, _.see("$story"));
  $.sub($hist, _.see("$hist"));

  $.sub($status, dom.attr(el, "data-table-status", _));
  $.sub($up, dom.attr(el, "data-up", _));

  //manage data-action
  $.sub($hist, function([{up, may}]){
    _.eachIndexed(function(seat){
      dom.attr(dom.sel1(`[data-seat="${seat}"] [data-action]`, els.players), "data-action", _.includes(up, seat) ? "must" : (_.includes(may, seat) ? "may" : ""));
    }, seated);
  });

  $.sub($presence, _.map(_.tee(_.see("presence"))), function(presence){
    _.eachkv(function(username, presence){
      const zone = dom.sel1(`.zone[data-username="${username}"]`);
      dom.attr(zone, "data-presence", presence ? "online" : "offline");
    }, presence);
  });

  $.sub($touch, function(){
    refresh($story, atPresent($story) ? toPresent : _.noop);
  });

  const init = _.once(function(startTouch){
    $.sub(dom.hash(window), _.map(_.replace(_, "#", "")), function(touch){
      nav($story, touch || startTouch);
    });
  });

  $.sub($story.$state, _.comp(_.map(function({touches}){ //TODO law of demeter
    return touches;
  }), _.compact(), _.map(_.last)), init);

  $.sub($story, _.compact(), function({touches, at}){
    if (touches && at != null) {
      dom.attr(el, "data-tense", _.count(touches) - 1 == at ? "present" : "past");
      dom.value(els.progress, at + 1);
      dom.attr(els.progress, "max", _.count(touches));
      dom.text(els.touch, at + 1);
      dom.text(els.touches, _.count(touches));
    }
  });

  //configure event
  $.sub($hist, function([curr, prior]){
    const {event, seen} = curr;
    const player = eventFor(event);

    _.doto(els.event,
      dom.attr(_, "data-type", event.type),
      dom.addClass(_, "bounce"),
      dom.removeClass(_, "hidden"),
      dom.removeClass(_, "acknowledged"));

    dom.attr(el, "data-event-type", event.type);
    dom.html(dom.sel1("p", els.event), desc(event));
    dom.toggleClass(els.event, "automatic", !player);

    if (player) {
      dom.attr(dom.sel1("img.who", els.event), "src", _.maybe(player.avatar_url, _.str(_, "?s=80")));
      dom.text(dom.sel1("p.who", els.event), player.username);
    }

    dom.addClass(el, "initialized");
  });

  $.on(el, "keydown", function(e){
    if (e.which === 32) { //space
      e.preventDefault();
      replay("last-move");
    } else if (e.key == "ArrowLeft") {
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

  $.on(el, "click", "#event", function(e){
    const self = this;
    dom.addClass(self, "acknowledged");
    setTimeout(function(){
      dom.addClass(self, "hidden");
    }, 500);
  });
}

export function player(username, avatar_url, ...contents){
  return div({class: "player"},
    div({class: "avatar"}, img({src: `${avatar_url}?s=104`})),
    div(a({class: "username", "href": `/profiles/?username=${username}`}, h1(username)), contents),
    img({"data-action": "", src: "/images/pawn.svg"}));
}

export function zone(seat, username, avatar_url, {stats, resources}){
  return div({class: "zone", "data-seat": seat, "data-username": username, "data-presence": ""},
    player(username, avatar_url, stats),
    div({class: "area"}, resources));
}

function score(player, points){
  return li(
    subject(player),
    span(points));
}

export function scored(seated, {scoring}){
  return ul({class: "scored"}, _.mapIndexed(function(idx, {points}){
    return score(seated[idx], points);
  }, scoring));
}

export function outcome(seated, {places, metrics}){
  const first = _.count(_.filter(_.eq(_, 1), places)) === 1 ? _.indexOf(places, 1) : null;
  const winner = _.maybe(first, _.nth(seated, _));
  const ranked = _.chain(places, _.mapkv(function(k, v){
    return [k, v];
  }, _), _.toArray, _.sort(_.asc(_.second), _), _.mapa(_.first, _));
  return [victor(winner), ol({class: "scored"}, _.mapa(function(seat){
    const {points} = _.nth(metrics, seat);
    return score(seated[seat], points);
  }, ranked))];
}

export function victor(player){
  return div({class: "victor"},
    img({alt: player.username, src: `${player.avatar_url}?s=150`}),
    `${player.username} wins!`);
}

export function subject(player){
  return img({class: "subject", alt: player.username, src: `${player.avatar_url}?s=50`});
}

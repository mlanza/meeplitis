import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import supabase from "/lib/supabase.js";
import {presence} from "/lib/online.js";
import {story, nav, hist, waypoint, refresh} from "/lib/story.js";

const div = dom.tag('div'),
      a = dom.tag('a'),
      span = dom.tag('span'),
      img = dom.tag('img'),
      ol = dom.tag('ol'),
      ul = dom.tag('ul'),
      li = dom.tag('li');

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

  return $.pipe($t, t.compact());
}

export function ui($table, $story, $hist, $online, seated, seat, desc, el){
  const $touch = $.pipe($.map(_.get(_, "last_touch_id"), $table), t.compact()),
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
    location.hash = waypoint($story, how);
  }

  function eventFor(event){
    return _.maybe(event.seat, _.nth(seated, _));
  }

  //render fixed player zones
  _.eachIndexed(function(idx, {username, avatar}){
    dom.append(els.players, zone(idx, username, avatar, [
      div(span({class: "points"}, "0"), " pts."),
      div(span({class: "tricks"}, "-"), "/", span({class: "bid"}, "-"), span({class: "tip"}, " (taken/bid)"))
    ]));
  }, seated);

  dom.attr(el, "data-perspective", seat);
  dom.attr(el, "data-seats", _.count(seated));

  $.sub($table, _.see("$table"));
  $.sub($status, _.see("$status"));
  $.sub($touch, _.see("$touch"));
  $.sub($story, _.see("$story"));
  $.sub($hist, _.see("$hist"));

  $.sub($scored, dom.attr(el, "data-scored", _));
  $.sub($status, dom.attr(el, "data-table-status", _));
  $.sub($up, dom.attr(el, "data-up", _));

  $.sub($presence, t.tee(_.see("presence")), function(presence){
    _.eachkv(function(username, presence){
      const zone = dom.sel1(`.zone[data-username="${username}"]`);
      dom.attr(zone, "data-presence", presence ? "online" : "offline");
    }, presence);
  });

  $.sub($touch, function(){
    refresh($story);
  });

  const init = _.once(function(startTouch){
    $.sub(dom.hash(window), t.map(_.replace(_, "#", "")), function(touch){
      nav($story, touch || startTouch);
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

  //configure event
  $.sub($hist, function([curr, prior]){
    const {events} = curr;
    const event = _.last(events),
          player = eventFor(event);

    _.doto(els.event,
      dom.attr(_, "data-type", event.type),
      dom.addClass(_, "bounce"),
      dom.removeClass(_, "hidden"),
      dom.removeClass(_, "acknowledged"));

    dom.attr(el, "data-event-type", event.type);
    dom.html(dom.sel1("p", els.event), desc(event));
    dom.toggleClass(els.event, "automatic", !player);

    if (player) {
      dom.attr(dom.sel1("img.who", els.event), "src", `${player.avatar}?=80`);
      dom.text(dom.sel1("p.who", els.event), player.username);
    }

    dom.addClass(el, "initialized");
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

  $.on(el, "click", "#event", function(e){
    const self = this;
    dom.addClass(self, "acknowledged");
    setTimeout(function(){
      dom.addClass(self, "hidden");
    }, 500);
  });
}

export function player(username, avatar, ...contents){
  return div({class: "player"},
    div({class: "avatar"}, img({src: `${avatar}?s=104`})),
    div(a({class: "username", "href": `/profiles?username=${username}`}, username), contents),
    img({"data-action": "", src: "/images/pawn.svg"}));
}

export function zone(seat, username, avatar, contents){
  return div({class: "zone", "data-seat": seat, "data-username": username, "data-presence": ""},
    player(username, avatar, contents),
    div({class: "area"}));
}

function score(player, points){
  return li(
    subject(player),
    span(points));
}

export function scored(seated, scoring){
  return ul({class: "scored"}, _.flatten(_.mapIndexed(function(idx, {points}){
    return score(seated[idx], points);
  }, scoring)));
}

export function outcome(seated, ranked){
  const first = ranked[0].tied ? null : ranked[0];
  const winner = _.maybe(first?.seat, _.nth(seated, _));
  return ol({class: "scored"}, _.cons(victor(winner), _.flatten(_.mapIndexed(function(idx, {tie, seat, place, points}){
    return score(seated[seat], points);
  }, ranked))));
}

export function victor(player){
  return div({class: "victor"},
    img({alt: player.username, src: `${player.avatar}?s=150`}),
    `${player.username} wins!`);
}

export function subject(player){
  return img({class: "subject", alt: player.username, src: `${player.avatar}?s=50`});
}

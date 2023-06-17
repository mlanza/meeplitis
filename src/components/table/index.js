import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import $ from "/lib/atomic_/reactives.js";
import supabase from "/lib/supabase.js";
import {session} from "/lib/session.js";

const div = dom.tag('div'),
      span = dom.tag('span'),
      img = dom.tag('img'),
      a = dom.tag('a'),
      p = dom.tag('p'),
      button = dom.tag('button');

function ohhell(config){
  const descriptors = [];
  if (config.start === 7 && config.end === 1) {
    descriptors.push("Down and Up Variant");
  }
  return descriptors;
}

function mexica(config){
  return [];
}

const games = {
  "8Mj1": ohhell,
  "SopC": mexica
};

export function seated(seats){
  return _.detect(function(seat){
    return session && seat.player && seat.player.username === session.username;
  }, seats);
}

export function ready(item, seat) {
  return _.includes(item.up, seat?.seat);
}

export function describe(table){
  return _.seq(_.compact(_.cons(table.remark, games[table.game_id](table.config))));
}

function aged(dt, asof){
  function lessThan(units){
    return _.subtract(asof, units) < dt;
  }
  if (lessThan(_.hours(1))) {
    return [_.detect(function(n){
      return lessThan(_.minutes(n + 1));
    }, _.range(60)), "m"];
  } else if (lessThan(_.days(1))) {
    return [_.detect(function(n){
      return lessThan(_.hours(n + 1));
    }, _.range(24)), "h"];
  } else {
    return [_.detect(function(n){
      return lessThan(_.days(n + 1));
    }, _.range(50)), "d"]; //abandoned tables closed after 30 days
  }
}

export function character(seat){
  return `/images/standins/${_.nth(["pinkie.svg", "yellowen.svg", "greenfu.svg", "bleugene.svg", "redmund.svg", "purpleon.svg"], seat)}`;
}

function avatar(fallback, player){
  const src = session?.userId === player?.id && !session?.avatar_url ? "/images/standins/you.jpg" : _.collapse(player?.avatar_url, "?s=80") || fallback;
  return player ? a({href: `/profiles/?username=${player.username}`}, img({src, title: player.username})) : img({src: "/images/standins/chair.jpg", title: "Vacant Seat"});
}

//TODO extract user timezone adjustment
export function table(item, fallback){
  const seat = seated(item.seats);
  const winners = _.maybe(item.seats, _.sort(_.asc(_.get(_, "seat")), _), _.map(_.get(_, "place"), _), _.reducekv(function(memo, seat, place){
    return seat === 1 ? _.conj(memo, seat) : memo;
  }, [], _));
  const link = item.status === "open" ? span : a;
  const age = _.maybe(item.last_touch_at, _.date, _.add(_, _.hours(-5)), dt => aged(dt, new Date()));
  return div({
      "class": "table",
      "data-table": item.id,
      "data-table-status": item.status,
      "data-seated": seat?.seat,
      "data-up": `${ _.join(" ", item.up) }`
    },
      span({class: "id"},
        link({href: `/games/${item.game.slug}/table/?id=${item.id}`}, item.game.title, " - ", item.id), " ",
        span({class: "touched"}, _.maybe(age, _.join("", _), _.str("touched ", _, " ago")))),
      div({class: "game"},
        a({href: `/games/${item.game.slug}`}, img({src: item.game.thumbnail_url, alt: item.game.title})),
        seat || !session ? null : button({value: "join"}, "Join"),
        seat && item.status === "open" ? button({value: "leave"}, "Leave") : null),
      div({class: "seats"}, _.map(function(seat){
        const won = _.includes(winners, seat.seat);
        return span({"class": "seat", "data-username": seat?.player?.username || "", "data-seat": seat.seat},
          img({class: "pawn", src: "/images/pawn.svg"}),
          won ? img({class: "won", title: "Winner", alt: "Winner", src: "/images/star.svg"}) : null,
          avatar(fallback || character(seat.seat), seat.player));
      }, _.sort(_.asc(_.get(_, "seat")), item.seats)),
      _.map(p, describe(item))));
}

export function onUpdate(callback){
  $.on(document.body, "click", "button", async function(e){
    const action = `${this.value}_table`,
          table = _.closest(this, "[data-table]"),
          id = dom.attr(table, "data-table");
    const {data, error} = await supabase.rpc(action, {
      _table_id: id
    });
    callback();
  });
}

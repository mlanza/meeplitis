import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import $ from "/lib/atomic_/reactives.js";
import supabase from "/lib/supabase.js";
import {session} from "/lib/session.js";

const {div, span, img, a, p, button} = dom.tags(['div', 'span', 'img', 'a', 'p', 'button']);

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

function daylightSavings(dt) {
  return dt.getTimezoneOffset() < stdTimezoneOffset(dt);
}

function stdTimezoneOffset(dt){
  const jan = new Date(dt.getFullYear(), 0, 1),
        jul = new Date(dt.getFullYear(), 6, 1);
  return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}

function fromUTCDate(now, utcDt){
  const offset = stdTimezoneOffset(now) + (daylightSavings(now) ? -60 : 0);
  return _.add(utcDt, _.minutes(-offset));
}

function aged(dt, asof){
  function diff(dt1, dt2, units){
    return Math.ceil(Math.abs(dt2 - dt1) / units);
  }
  function lessThan(units){
    return _.subtract(asof, units) < dt;
  }
  if (lessThan(_.minutes(1))) {
    return [diff(dt, asof, 1000), "s"];
  } else if (lessThan(_.hours(1))) {
    return [diff(dt, asof, 1000 * 60), "m"];
  } else if (lessThan(_.days(1))) {
    return [diff(dt, asof, 1000 * 60 * 60), "h"];
  } else {
    return [diff(dt, asof, 1000 * 60 * 60 * 24), "d"];
  }
}

function avatar(player){
  const src = _.str(player?.avatar_url, "?s=80");
  return player ? a({href: `/profiles/?username=${player.username}`}, img({src, title: player.username})) : img({src: "/images/chair.jpg", title: "Vacant Seat"});
}

//TODO extract user timezone adjustment
export function table(item, now = new Date()){
  const seat = seated(item.seats);
  const link = item.status === "open" ? span : a;
  const age = _.maybe(item.touched_at, _.date, _.partial(fromUTCDate, now), dt => aged(dt, now));
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
        const won = seat.place === 1;
        return span({"class": "seat avatar", "data-username": seat?.player?.username || "", "data-seat": seat.seat},
          img({class: "pawn", src: "/images/pawn.svg"}),
          won ? img({class: "won", title: "Winner", alt: "Winner", src: "/images/star.svg"}) : null,
          avatar(seat.player));
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

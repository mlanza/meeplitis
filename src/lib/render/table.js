import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
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
  if (config.start === 1 && config.end === 7) {
    //descriptors.push("Up and Down Variant");
  } else if (config.start === 7 && config.end === 1) {
    descriptors.push("Down and Up Variant");
  }
  return descriptors;
}

const games = {
  "8Mj1": ohhell
};

export function table(item){
  const seat = _.detect(function(seat){
    return session && seat.player && seat.player.username === session.username;
  }, item.seats);
  const descriptors = games[item.game.id](item.config);
  return div({class: "table", "data-table": item.id, "data-table-status": item.status, "data-scored": item.scored, "data-up": `${ _.join(" ", item.up) }`}, (item.status === "open" ? span : a)({class: "id", href: `/games/oh-hell/table/?id=${item.id}`}, item.game.title, " - ", item.id),
      div({class: "game"},
        a({href: `/games/${item.game.slug}`}, img({src: item.game.thumbnail_url, alt: item.game.title})),
        seat || !session ? null : button({value: "join"}, "Join"),
        seat ? button({value: "leave"}, "Leave") : null),
      div({class: "seats"}, _.map(function(seat){
        return span({"class": "seat", "data-username": seat?.player?.username || "", "data-seat": seat.seat},
          img({class: "pawn", src: "/images/pawn.svg"}),
          seat.player ?
            a({href: `/profiles/?username=${seat.player.username}`},
              img({title: seat.player.username, src: `${seat.player.avatar_url}?s=80`})) :
            img({src: "/images/anon.svg"}));
      }, _.sort(_.asc(_.get(_, "seat")), item.seats)),
      _.map(p, _.compact(_.cons(item.remark, _.cons(item.scored ? null : "Unscored", descriptors))))));
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

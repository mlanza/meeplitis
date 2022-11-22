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
      button = dom.tag('button'),
      submit = dom.tag('submit'),
      form = dom.tag('form'),
      label = dom.tag('label'),
      input = dom.tag('input'),
      radio = dom.tag('input', {type: "radio"});

function creates(open, game){
  const el = form({id: "creates"},
    label(span("Players"), _.map(function(value){
      return label(value, radio({name: "players", value}, value === 2 ? {checked: "checked"} : null));
    }, _.range(2, 8))),
    label(span("Variant"),
      label("Up and Down", radio({name: "variant", value: "up-down", checked: "checked"})),
      label("Down and Up", radio({name: "variant", value: "down-up"}))),
    label(span("Scored"), input({type: "checkbox", name: "scored", checked: "checked"})),
    label(span("Remark"), input({type: "text", name: "remark", maxlength: 100, placeholder: "x moves/day, learning game"})),
    input({type: "submit", value: "Open Table"}));
  el.addEventListener('submit', function(e){
    e.preventDefault();
    const seats = _.maybe(el.elements["players"], _.detect(function(el){
      return el.checked;
    }, _), dom.attr(_, "value"), parseInt);
    const variant = _.chain(el.elements["variant"], _.detect(function(el){
      return el.checked;
    }, _), dom.attr(_, "value"));
    const scored = el.elements["scored"].checked;
    const remark = el.elements["remark"].value;
    const config = _.get({"up-down": {start: 1, end: 7}, "down-up": {start: 7, end: 1}}, variant);
    open({seats, config, scored, remark});
  });
  return el;
}

function table(item){
  const seat = _.detect(function(seat){
    return session && seat.player && seat.player.username === session.username;
  }, item.seats);
  return div({class: "table", "data-table": item.id, "data-table-status": item.status, "data-scored": item.scored, "data-up": `${ _.join(" ", item.up) }`}, (item.status === "open" ? span : a)({class: "id", href: `/games/oh-hell/table/?id=${item.id}`}, item.game.title, " - ", item.id),
      div({class: "game"},
        img({src: item.game.thumbnail_url}), item.scored ? null : span({class: "unscored", title: "Learning game (not scored)"}, "*"),
        seat || !session ? null : button({value: "join"}, "Join"),
        seat ? button({value: "leave"}, "Leave") : null),
      div({class: "seats"}, _.map(function(seat){
        return span({"class": "seat", "data-username": seat?.player?.username || "", "data-seat": seat.seat},
          img({class: "pawn", src: "/images/pawn.svg"}),
          seat.player ?
            a({href: `/profiles/?username=${seat.player.username}`},
              img({title: seat.player.username, src: `${seat.player.avatar_url}?s=80`})) :
            img({src: "/images/anon.svg"}));
      }, _.sort(_.asc(_.get(_, "seat")), item.seats))));
}

const game_id = '8Mj1';

const {data: [game]} = await supabase
  .from('games')
  .select(`
    id,
    title,
    seats,
    thumbnail_url`)
  .eq('id', game_id);

async function refreshTables(){
  const {data: tables, error, status} = await supabase
    .from('tables')
    .select(`
      *,
      seats (
        id,
        seat,
        joined_at,
        player:player_id(
          id,
          username,
          avatar_url
        )
      ),
      game:game_id (
        id,
        title,
        seats,
        thumbnail_url
      )`)
    .eq('game_id', game_id)
    .neq('status', "finished")
    .neq('status', "vacant")
    .order('created_at', {ascending: false});

  _.chain(tables, _.see("tables"), _.map(table, _), dom.html(dom.sel1(".open"), _));
}


async function open({config, seats, scored, notes}){
  const {data, error} = await supabase.rpc('open_table', {
    _game_id: game_id,
    _config: config,
    _scored: scored,
    _seats: seats
  });

  refreshTables();
}

_.chain(game, _.see("game"), _.partial(creates, open), dom.html(dom.sel1(".create"), _));
refreshTables();

$.on(document.body, "click", "button", async function(e){
  const action = `${this.value}_table`,
        table = _.closest(this, "[data-table]"),
        id = dom.attr(table, "data-table");
  const {data, error} = await supabase.rpc(action, {
    _table_id: id
  });
  refreshTables();
});

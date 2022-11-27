import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import supabase from "/lib/supabase.js";
import {session} from "/lib/session.js";
import {table, seated, ready, onUpdate} from "/components/table/index.js";

const div = dom.tag('div'),
      span = dom.tag('span'),
      img = dom.tag('img'),
      a = dom.tag('a'),
      p = dom.tag('p'),
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

const game_id = '8Mj1';

const {data: [game]} = await supabase
  .from('games')
  .select(`
    id,
    title,
    seats,
    thumbnail_url`)
  .eq('id', game_id);

function getTables(game_id, statuses, el, none){
  return supabase
    .from('tables')
    .select(`
      *,
      status,
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
        slug,
        thumbnail_url
      )`)
    .eq('game_id', game_id)
    .in('status', statuses)
    .order('created_at', {ascending: false})
    .then(function({data, error}){
      return data;
    })
    .then(_.see("tables"))
    .then(_.map(table, _))
    .then(_.seq)
    .then(_.either(_, none))
    .then(dom.html(el, _));
}

async function refreshTables(){
  getTables(game_id, ["open", "started"], dom.sel1(".tables > p"), "None open or started.");
}

async function open({config, seats, scored, remark}){
  const {data, error} = await supabase.rpc('open_table', {
    _game_id: game_id,
    _config: config,
    _scored: scored,
    _remark: remark,
    _seats: seats
  });

  refreshTables();
}

session && _.chain(game, _.see("game"), _.partial(creates, open), dom.html(dom.sel1(".create > p"), _));
refreshTables();
onUpdate(refreshTables);

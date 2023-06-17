import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import $ from "/lib/atomic_/reactives.js";
import supabase from "/lib/supabase.js";
import {session} from "/lib/session.js";

const img = dom.tag('img'),
      a = dom.tag('a'),
      h2 = dom.tag('h2'),
      div = dom.tag('div'),
      span = dom.tag('span');

const params = new URLSearchParams(document.location.search),
      username = params.get('username');

function game(item){
  return a({href: `/games/${item.slug}`},
    div({class: "game"},
      h2(item.title),
      img({src: item.thumbnail_url}),
      div({class: "stats"},
        div({class: "count"}, span(item.open_tables), " Open"), div({class: "slash"}, "/"), div({class: "count"}, span(item.started_tables), " Started"))));
}

const {data: games, error} =
  await supabase
    .from("games_with_activity")
    .select("*");

_.chain(games, _.see("games"), _.map(game, _), dom.html(dom.sel1(".open > p"), _));

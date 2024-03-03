import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import supabase from "/lib/supabase.js";

const {img, a, h2, div, span} = dom.tags(['img', 'a', 'h2', 'div', 'span']);

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

export function describe(table){
  const f = _.get({
    "8Mj1": ohhell,
    "SopC": mexica
  }, table.game_id)
  return f(table.config);
}

export function render(item){
  return a({href: `/games/${item.slug}`},
    div({class: "game activity", "data-open": item.open_tables, "data-started": item.data_started},
      h2(item.title),
      img({src: item.thumbnail_url}),
      div({class: "stats"},
        div({class: "count"}, span(item.open_tables), " Open"),
        div({class: "slash"}, "/"),
        div({class: "count"}, span(item.started_tables), " Started"))));
}

export function games(){
  return supabase
    .from("games_with_activity")
    .select("*")
    .order('title')
    .then(({data}) => data);
}

export function open_games(){
  return supabase
    .from("games_with_activity")
    .select("*")
    .gt("open_tables", 0)
    .order('title')
    .then(({data}) => data);
}

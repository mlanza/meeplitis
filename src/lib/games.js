import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import supabase from "/lib/supabase.js";

const {img, a, h2, div, span} = dom.tags(['img', 'a', 'h2', 'div', 'span']);

export function render(item){
  return a({href: `/games/${item.slug}`},
    div({class: "game"},
      h2(item.title),
      img({src: item.thumbnail_url}),
      div({class: "stats"},
        div({class: "count"}, span(item.open_tables), " Open"), div({class: "slash"}, "/"), div({class: "count"}, span(item.started_tables), " Started"))));
}

export async function games(){
  const {data, error} =
    await supabase
      .from("games_with_activity")
      .select("*")
      .order('title');
  return data;
}

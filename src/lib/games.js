import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import supabase from "/lib/supabase.js";

const {img, a, h2, div, span} = dom.tags(['img', 'a', 'h2', 'div', 'span']);

export function render(item){
  return a({href: `/games/${item.slug}`},
    div({class: "game"},
      h2(item.title),
      img({src: item.thumbnail_url})));
}

export async function games(column = "all_tables"){
  const {data, error} =
    await supabase
      .from("games_with_activity")
      .select("*")
      .gt(column, 0)
      .order('title');
  return data;
}

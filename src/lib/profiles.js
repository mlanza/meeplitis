import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import supabase from "/lib/supabase.js";

const {img, a, h2, div, span, figure} = dom.tags(['img', 'a', 'h2', 'div', 'span', 'figure', 'figcaption']);

export function render(item){
  return a({href: `/profiles/?username=${item.username}`},
    div({class: "profile"},
    h2(item.username),
    figure({class: "avatar"},
      img({src: item.avatar_url})),
    div({class: "stats"},
      div({class: "count"}, span(item.open_tables), " Open"),
      div({class: "slash"}, "/"),
      div({class: "count"}, span(item.started_tables), " Started"))));
}

export function profiles(column = "all_tables") {
  return supabase
    .from('profiles_with_activity')
    .select('username,avatar_url,open_tables,started_tables')
    .neq('username', null)
    .gt(column, 0)
    .order('username', {ascending: true})
    .then(({data}) => data)
    .then(_.sort(_.asc(function(profile){
      return profile.username.toLowerCase();
    }), _));
}

import _ from "/libs/atomic_/core.js";
import dom from "/libs/atomic_/dom.js";
import supabase from "/libs/supabase.js";

const {img, a, h2, div, span, figure} = dom.tags(['img', 'a', 'h2', 'div', 'span', 'figure', 'figcaption']);

const params = new URLSearchParams(document.location.search),
      listed = params.get('listed');

export function playerLink(username){
  return `/profiles/?username=${username}${listed ? "&listed=" + listed : ""}`;
}

export function render(item){
  return a({href: playerLink(item.username)},
    div({class: "profile activity", "data-open": item.open_tables, "data-started": item.started_tables},
    h2(item.username),
    figure({class: "avatar"},
      img({src: item.avatar_url})),
    div({class: "stats"},
      div({class: "count"}, span(item.open_tables), " Open"),
      div({class: "slash"}, "/"),
      div({class: "count"}, span(item.started_tables), " Started"))));
}

export function profiles() {
  return supabase
    .from('profiles_with_activity')
    .select('username,avatar_url,open_tables,started_tables')
    .neq('username', null)
    .order('username', {ascending: true})
    .then(({data}) => data)
    .then(_.sort(_.asc(function(profile){
      return profile.username.toLowerCase();
    }), _));
}

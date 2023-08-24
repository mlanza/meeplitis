import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import $ from "/lib/atomic_/reactives.js";
import supabase from "/lib/supabase.js";
import {session} from "/lib/session.js";
import {managing, getProfile, onUpdate} from "/components/table/index.js";

const {figure, img, figcaption, li, a} = dom.tags(["figure", "figcaption", "img", "li", "a"]);

const params = new URLSearchParams(document.location.search),
      username = params.get('username'),
      you = session?.username === username;

function avatar(profile){
  return figure({class: "avatar"}, img({src: profile.avatar_url}), figcaption(profile.username));
}

function entitle(view){
  switch(view) {
    case "active_players":
      return "Active";
    case "waiting_players":
      return "Waiting";
    default:
      return "Everyone";
  }
}

if (username) {
  dom.attr(document.body, "data-view", "profile");
  dom.removeClass(document.body, "borderless-img");

  const profile = await getProfile(username);
  const {refreshTables} = managing('seated.player_id', profile.id, _.sort(_.desc(yourTurn), _.asc(_.get(_, "touched_at")), _));

  _.chain(you, dom.attr(document.body, "data-you", _));
  _.chain(profile.username, _.str(_, " | ", "Your Move"), dom.text(dom.sel1("head title"), _));
  _.chain(profile.username, dom.text(dom.sel1(".banner h1"), _));
  _.chain(profile.headline || "Mysteriously quiet", dom.text(dom.sel1(".banner .headline"), _));
  _.chain(profile.description || "Has not shared any details.", dom.html(dom.sel1(".about > p"), _));
  _.chain(profile.avatar_url, dom.attr(dom.sel1(".banner img"), "src", _));

  function yourTurn(table){
    const seated = _.first(table.seated)?.seat;
    return _.includes(table.up, seated);
  }

  refreshTables();
  onUpdate(refreshTables);

} else {
  dom.attr(document.body, "data-view", "profiles");

  const view = params.get('v') || "profiles",
        title = entitle(view);

  const ul = dom.sel1("section.profiles ul"),
        h1 = dom.sel1("section.profiles h1"),
        p  = dom.sel1("section.profiles p");

  const profiles = await supabase
    .from(view)
    .select('username,avatar_url')
    .neq('username', null)
    .order('username', {ascending: true})
    .then(({data}) => data)
    .then(_.sort(_.asc(function(profile){
      return profile.username.toLowerCase();
    }), _));
  dom.html(h1, title);
  dom.html(ul, null);
  for(const profile of profiles){
    dom.append(ul, li(a({href: `/profiles/?username=${profile.username}`}, avatar(profile))));
  }
  if (!_.seq(profiles)) {
    dom.text(p, "No results.");
  }
}


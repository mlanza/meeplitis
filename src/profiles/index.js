import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import $ from "/lib/atomic_/reactives.js";
import supabase from "/lib/supabase.js";
import {session} from "/lib/session.js";
import {managing, getProfile, onUpdate} from "/components/table/index.js";

const {figure, img, figcaption, li, a} = dom.tags(["figure", "figcaption", "img", "li", "a"]);

const params = new URLSearchParams(document.location.search),
      column = params.get('c') || "all_tables",
      username = params.get('username'),
      you = session?.username === username;

function avatar(profile){
  return figure({class: "avatar"}, img({src: profile.avatar_url}), figcaption(profile.username));
}

function entitle(column){
  switch(column) {
    case "open_tables":
      return "seated at open tables";
    case "started_tables":
      return "seated at started tables";
    default:
      return "one might face";
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
  const ul = dom.sel1("section.profiles ul"),
        h  = dom.sel1(".headline"),
        p  = dom.sel1("section.profiles p");

  dom.attr(document.body, "data-view", "profiles");
  _.chain(column, entitle, dom.append(h, " ", _));

  const profiles = await supabase
    .from('profiles_with_activity')
    .select('username,avatar_url')
    .neq('username', null)
    .gt(column, 0)
    .order('username', {ascending: true})
    .then(({data}) => data)
    .then(_.sort(_.asc(function(profile){
      return profile.username.toLowerCase();
    }), _));
  dom.html(ul, null);
  for(const profile of profiles){
    dom.append(ul, li(a({href: `/profiles/?username=${profile.username}`}, avatar(profile))));
  }
  if (!_.seq(profiles)) {
    dom.text(p, "No results.");
  }
}

